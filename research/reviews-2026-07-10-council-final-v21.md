# Synthesis: Ship/No-Ship Review of inference-margins.pages.dev (methodology v2.1)

All four agents fetched the live page, `engine.js`, `app.js`, and the annex; three explicitly confirmed the deployed assets byte-match the local release artifacts [architect, risk-analyst, empiricist]. This is a well-corroborated review — the big findings appear independently in all four outputs with matching exact quotes and matching numeric endpoints, which raises my confidence substantially.

## 1. Consensus

- **The core arithmetic engine is sound — this is a trust-layer problem, not an arithmetic rollback.** 452 release assertions pass; five of six §10 blended headlines reproduce within one point (OpenAI ~94.7%, Google ~95.9%, xAI ~66.9%, DeepSeek ~68.1%, Zhipu ~60.0%). `[unanimous]`
- **Cache-write accounting is conservation-safe and default-off** — total write tariff, partitioned fresh input, prefill charged once, v2 baselines preserved. The prior cache-contamination bug is genuinely fixed. `[unanimous]` (Cache double-count is the one attack-list item all four score **PASS**.)
- **The anti-shopping lens range is broken and does the opposite of what it advertises.** `lensRangeForCurrentModel()` unions every non-replay perspective — including `[analyst]` positions and pairing-warned, scope-incompatible lenses — ignoring the compatibility warnings generated elsewhere. All four independently reproduced the same absurd endpoints: **Opus −79.3% to 97.1%, Grok −337.4% to 92.8%, DeepSeek V4 −867.5% to 85.8%.** `[unanimous]`
- **The `quoted-position` attribution line contradicts its own tables.** The rendered sentence "the parameters below come from the source's own disclosure" is shown for `xaiopp`, `chinacloud`, and `anth20`, whose tables label utilization, stack, batch share, discounts, etc. as SPECULATION. This is textbook attribution laundering in the mechanism built to prevent it. `[unanimous]`
- **Both v2 §10 language commitments regressed.** Ranking language survives ("The highest central margin on the page", "highest raw headline among the three Chinese-provider cards") and confidence-interval language survives ("margin confidence intervals", "the widest confidence interval on the page") — directly contradicting the page's own "not statistically calibrated confidence intervals." Card badges are correctly labeled "judgmental range," but "everywhere" is not met. `[unanimous]`
- **The advertised "runnable diagnostic" is not deployed.** `/tests/roofline-diagnostic.mjs` (and `/tests/snapshots.test.mjs`) return the HTML homepage with `content-type: text/html`. The local diagnostic's numbers are accurate (H20 −11.4/−16.2%, GB200 −1.9%, Ascend@50ms −9.8%, Ascend@15ms −39.8%), but external readers cannot run the artifact the methods note names. `[unanimous]`
- **Permalinks are schema-tagged, not reproducible.** They encode only diffs from mutable `DEFAULTS`, carry no engine/data hash, and discard `_meta`. The versionless-URL attack is not actually pre-empted. `[unanimous]` (framing disagreement below).
- **The typed ontology is cosmetic.** `ioRatio`/`cacheHit`/`blend` remain `MODEL_OWNED_KEYS`; `[lens]`/`[analyst]`/`[replay]` are labels on the old perspective axis, not a refactored model/workload/SLA/lens separation. Changing "model" still silently changes workload and procurement. `[skeptic, risk-analyst, empiricist; architect treats it as the structural root of P1.1]`
- **The China 6.15× scalar is arithmetically exact but is a scenario scalar, not a coherent observed cross-SKU on-demand multiplier** (H800 matches ~$10.6; H20 → $6.15 vs clean ~$4.48 observation; 910C has no reproducible public retail). P2 — caveats prevent it from being an undisclosed error. `[unanimous]`
- **The explanatory surfaces compete, and the problem is not verbosity — it's that the layers disagree.** The 29% vs 36.5% mismatch, stale CI language, and ranking regressions are *symptoms of duplicated truth* across methods box / preset note / dossier / §10 cards. `[architect, risk-analyst, empiricist; skeptic frames it as "over-explained and under-specified where it matters"]`

**Attack-list scorecard — the four converge:** attribution laundering **FAIL**, model/workload conflation **FAIL**, cache double-count **PASS**, versionless URLs **PARTIAL/FAIL**, dossier decoration **FAIL**, coverage theater **FAIL/PARTIAL**.

## 2. Disagreements

### A. Is anything a P0? (Severity taxonomy)
**The disagreement:** Skeptic calls the xAI lens comparison and the anti-shopping range **two P0s**; Architect, Risk Analyst, and Empiricist find **no P0s** and classify both as P1.

- **Skeptic's strongest argument:** The anti-shopping range "converts invalid pairings into the most prominent uncertainty display… worse than omitting the range because it gives nonsense a methodological imprimatur." A flagship trust feature that actively misleads about the product's headline guarantee is not a P1 wording fix — it requires re-architecting what enters the statistic.
- **The other three's strongest argument:** P0 should mean arithmetic corruption. The engine math is correct in every case; these are presentation/provenance defects layered on a sound core. Empiricist: "no P0 arithmetic corruption."

**Adjudication:** Largely definitional and **operationally moot** — all four block ship on both findings regardless of label. But Skeptic's severity *instinct* is directionally right on one point the taxonomy obscures: the anti-shopping-range fix is not a lint, it's a re-architecture of range membership. I'd record both as ship-blockers and not litigate the number. Where the label genuinely matters is the xAI case below.

### B. What is the correct xAI opportunity-cost number — ~27% or 36.5%? (The sharpest genuine disagreement)
**The disagreement:** Skeptic says 36.52% is a *bug artifact* and the true controlled value is ~27%; the other three say 36.52% is the *legitimate calculator output* and 29% is merely stale prose to be relabeled.

- **Skeptic's strongest argument:** The page advertises "Same operating point as the dive; only the valuation changes." But the cash/opportunity lens presets omit `ioRatio` and `cacheHit`, so the preset merge falls back to the global 15:1 / 60% cache defaults — a *different* operating point than the dive's 3:1 / 0% cache. Holding the dive workload genuinely fixed, Skeptic recomputes the opportunity lens at **26.95%**, near the dive's ~29% — with no "model-shape divergence" needed. So neither 36.5% nor the "model shape" explanation is a controlled result; the ~10-point gap is a workload-merge bug.
- **The other three's strongest argument (Architect's is cleanest):** The deployed calculator genuinely emits 92.77% → 66.94% → 36.52%; the 29% belongs to the external dive's coarser replica model. The defect is a 7.5-point *inconsistency* — the methods box and Grok dossier still print 29% as if it were the calculator's third lens. Fix = harmonize the prose to "~93% → 67% → 36.5% calculator; ~29% annex replica."

**Adjudication: Skeptic has the stronger case, and it modifies the Architect's fix.** Skeptic did the controlled recomputation the other three did not — they verified the engine *emits* 36.52% (true) but not whether 36.52% is computed at the *same operating point the page claims*. It isn't. Architect's P1.3 fix (relabel 29% → 36.5%) does **not survive** Skeptic's critique: it would harmonize the prose onto a number that itself violates the page's "same operating point, only valuation changes" claim. The correct sequence is Skeptic's: **fix the workload merge so all three lenses inherit the dive's 3:1/0% operating point, recompute (expect opportunity ≈ 27%), *then* harmonize the prose.** Residual uncertainty: this assumes "same operating point" is the *intended* semantic. If the author intended the lenses to carry their own default workloads, 36.5% is legitimate and only the prose needs fixing — but then the "only the valuation changes" claim must be struck. Either way there is an inconsistency to fix; the *magnitude* of the required fix depends on author intent (Open Question C).

### C. Permalinks: version-drift (future) vs identity-corruption (now)
**The disagreement:** Skeptic/Architect frame the permalink defect primarily as *future* drift (a later `DEFAULTS` change silently reinterprets old links); Empiricist and Risk Analyst find a *same-deployment, right-now* corruption.

- **Version-drift framing (Skeptic, Architect):** No `engineRevision`/snapshot hash; diffs merge into whatever defaults exist later. Architect explicitly offers a downgrade: "if shared links are explicitly guaranteed same-deployment-only… these findings could drop to P2."
- **Identity-corruption framing (Empiricist, Risk Analyst):** The URL serializes only numeric state — not `modelId`/`perspectiveId`/scope/provenance. On load, selectors stay Opus/median, the dossier doesn't render, and the lens range is computed for the *selector's* model. So a Grok+xAI-opportunity permalink displays Grok arithmetic while its selectors and anti-shopping range refer to Opus — misattribution *within the same deployment*.

**Adjudication:** Empiricist/Risk have the stronger, more specific finding, and it **invalidates Architect's downgrade condition.** "Same-deployment-only" does not rescue the permalink, because the identity corruption manifests on the current deployment. The fix must serialize full state (model/perspective IDs + scope + engine/data hash) and restore selectors/dossier/warning/range together — not merely add a version hash. This is a cross-check where the Risk/Empiricist failure mode is *not* addressed by the Architect's proposed fix — flagged.

### D. Are tariff point-estimates and the ontology refactor ship-blockers?
**The disagreement:** Skeptic lists tariff-as-point-estimate as P1 ("not genuinely range-first"); Empiricist calls tariff labeling "mostly good" (P2-ish); Architect scopes the full workload/model ontology split to a *v2.2* refactor, explicitly inappropriate as an emergency gate.

**Adjudication:** Architect's staging is right and I weight it. The *labeling* (names, speculative marks, table exclusion) passes for all four; the *residual* concern (point margins from arbitrary architecture midpoints) is real but is a symptom of the same MODEL_OWNED ontology. Correct call: a cheap mitigation now (suppress/qualify the tariff point-margin headline, e.g. "illustrative architecture scenario" in the result tile) + defer the true workload/SLA/model separation to v2.2. Do not gate v2.1.1 on the full refactor.

## 3. Open questions

- **Are permalinks intended to be same-deployment-only?** [architect raised as a downgrade condition] — but Empiricist's identity-corruption finding suggests even that wouldn't save them. Needs the author's design intent.
- **Is the roofline diagnostic intentionally private?** [architect] If yes, the fix collapses to deleting the word "runnable"; if no, deploy it. Cheap either way.
- **Is "same operating point, only the valuation changes" the intended semantic for the xAI lenses?** [synthesis-emergent, from Disagreement B] This single answer determines whether the correct opportunity value is ~27% (fix the merge) or 36.5% (fix only the prose *and* strike the "same operating point" claim). Only the author can settle it.
- **Does any genuinely untouched roofline holdout exist?** [risk-analyst, empiricist] Both conclude no — zero residual DoF, post-hoc operating-point choices, no untouched platform. This bounds how strong the roofline "validation" claim can ever be.
- **Tencent H20/H800 and the 910C-proxy rates are unverifiable from the annex** (no primary URLs) [empiricist]. Downgrades confidence in the China multiplier evidence specifically.

## 4. Final recommendation

**NO-SHIP / hold v2.1 as deployed. Ship after a surgical v2.1.1 gate repair — no engine rollback.** (Risk Analyst's "PAUSE, fix the P1s first" is operationally the same verdict; the four are effectively unanimous.)

**Confidence:**
- **Very high (~95%)** that it should not ship as-is. This is not a judgment call — four independent reviews on a byte-matched deployment corroborate the three load-bearing failures (anti-shopping range, attribution laundering, §10 regressions) with matching exact quotes and matching numeric endpoints.
- **High** that the surgical fix set below is complete and correct, and that the core numeric engine needs no changes.
- **Medium** on the exact xAI opportunity number (~27% vs 36.5%) — it hinges on an author-only design intent (Open Question C), and I weight Skeptic's controlled recomputation but cannot close the intent question from the outside.
- **Lower** on whether tariff point-estimates / the ontology refactor are gate items — a genuine judgment split; I side with Architect's v2.2 staging.

**Ship gate (deduped across all four):**
1. **Anti-shopping range** — compute only over compatible `kind === "lens"` entries passing `pairingWarning() === ""`; exclude analyst positions and replays; move exploratory/incompatible pairings to a separately labeled range. Assert contributor names. `[unanimous]`
2. **xAI lenses** — make all three inherit the dive operating point (3:1, 0% cache); recompute (expect opportunity ≈ 27%); *then* harmonize the methods box and Grok dossier. Do **not** merely relabel 29% → 36.5% (Skeptic's correction to Architect's fix). `[skeptic-weighted]`
3. **Dossiers** — reclassify `xaiopp`/`chinacloud`/`anth20` from `quoted-position` to `reconstruction` (or split "quoted anchor" from "reconstructed vector"); annotate every dynamic `dive`/`set` override; make displayed values derive from final applied state. `[unanimous]`
4. **§10 language** — remove ranking phrases and remaining "confidence interval" language; add a static lint (`highest|lowest|best|worst|confidence interval|\bCI\b`). `[unanimous]`
5. **Roofline diagnostic** — deploy the script + frozen inputs + snapshot test as real artifacts; assert content-type/hash in release. `[unanimous]`
6. **Permalinks** — serialize full state incl. model/perspective IDs + scope + engine/data hash; validate on load; fix the same-deployment identity corruption first, then version-safety; add round-trip + migration fixtures. `[unanimous, empiricist/risk-sharpened]`
7. **Moonshot/Kimi** — expose an output-token-margin tile so the headline literally regenerates, or drop the "every headline reproducible" claim. `[architect, risk-analyst, empiricist]`

**Include in the same release (P2s that *prove the P1 fixes held*):** the dossier DOM test (assert *rendered* values, not key membership) and engine-generated bridge/test-count numbers (fixes the "29 assertions" → 452 and the "$3.10/Mtok" → $3.72-list staleness Risk Analyst uniquely caught). **Defer:** China per-SKU multiplier rename, roofline "preregistered holdout could not be executed as designed" phrasing, and the full workload/SLA/model ontology split (v2.2).

**Conditions that would change the recommendation:**
- If the diagnostic is intentionally private → item 5 collapses to deleting "runnable."
- If "same operating point" is *not* the intended xAI-lens semantic → item 2 shrinks to a prose fix (relabel 29% → 36.5%) *plus* striking the "only the valuation changes" claim.
- **Note the one downgrade that does *not* hold:** Architect's "if permalinks are same-deployment-only, drop to P2" is defeated by Empiricist's identity-corruption finding — do not rely on it.

**Cheapest next action that moves the decision forward (Empiricist's, and I weight it heavily):** write the **~1-hour semantic release test** — four fixtures + §10 lint that catch *every* ship-blocker above:
1. Serialize+reload Grok+xAI-opportunity; assert model/perspective IDs, dossier, warning, margin, and range all survive.
2. Assert no `pairingWarning()`-triggering pairing contributes to any lens range.
3. Assert every `quoted-position` parameter is genuinely source-selected, else fail classification.
4. Fetch the public roofline URL; require JS content + expected output.
5. Static §10 lint for ranking/CI terms.

This test file *is* the regression gate that would have caught all of these pre-deploy — build it first; it converts the fix list from "trust the patch" into "trust the assertion."

## 5. Attribution map

| Claim | Contributing agent(s) |
|---|---|
| Core engine sound; 452 assertions pass; 5/6 §10 headlines reproduce ≤1pt | unanimous |
| Cache-write accounting conservation-safe, default-off (attack PASS) | unanimous |
| Anti-shopping range unions incompatible lenses; endpoints −79.3%/97.1%, −337.4%/92.8%, −867.5%/85.8% | unanimous (all four reproduced the endpoints) |
| `quoted-position` attribution line contradicts SPECULATION tables (xaiopp/chinacloud/anth20) | unanimous |
| §10 ranking + confidence-interval regressions (exact quotes) | unanimous |
| `/tests/*.mjs` return HTML — diagnostic not deployed | unanimous |
| Permalinks not reproducible (no engine/data hash, diff-only) | unanimous |
| **xAI lenses don't hold operating point constant; controlled opportunity ≈ 27%, not 36.5%** | **skeptic** (sole controlled recompute) |
| xAI methods box shows 29% while calculator emits 36.5% (7.5-pt inconsistency) | architect, risk-analyst, empiricist |
| **Permalink identity corruption *within* current deployment (selectors show Opus, math is Grok)** | **empiricist, risk-analyst** |
| Typed ontology cosmetic — ioRatio/cacheHit/blend still MODEL_OWNED | skeptic, risk-analyst, empiricist |
| Moonshot/Kimi headline (81% output) not regenerated by hero tile (79.9% blended) | architect, risk-analyst, empiricist |
| **Stale prose: 29 assertions (→452), $3.10/Mtok bridge (→$3.72 list)** | **risk-analyst** (sole catch) |
| China 6.15× arithmetically exact but scenario scalar, not observed multiplier (P2) | unanimous |
| **Roofline "formally unrunnable" overstates — exactly-fitted, not non-identifiable** | **empiricist** (sole methodological nuance) |
| Tencent H20/H800 + 910C-proxy rates unverifiable from annex | empiricist |
| Filtering invalid lenses could hide useful stress tests → preserve as labeled "exploratory" | risk-analyst, empiricist |
| Surgical v2.1.1 vs v2.2 ontology-refactor staging | architect |
| ~1-hour four-fixture semantic release test as decisive next action | empiricist |
