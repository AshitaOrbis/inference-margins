# v2.2 plan review — GPT-5.6 Pro, 2026-07-11

> Pre-implementation adversarial review of PLAN-v22.md (run 12m39s, `gpt-5-6-pro`, Pro-verified, `completion_path: api`, Ashitaorbis project; [conversation](https://chatgpt.com/g/g-p-6a42f0b0f46081919a65018455ee56dd/c/6a51a635-877c-83e8-bce0-8199f4d015cc)). Verbatim except ChatGPT-internal citation tokens, which are stripped. Verdict: **proceed only after three P0 plan corrections** — B state/precedence contract before code; no regenerated pack presented as original; no named-person role-play/approval in E.

I’m verifying the live v2.1.1 calculator, research materials, state/permalink semantics, and test claims before adjudicating each proposal and distinguishing implementation-blocking P0s.

The central risk is precedence ambiguity when workload ownership collides with replay, permalink, or custom values; I’m testing whether B preserves v2.1.1’s repaired invariants.

## 1. Item-by-item adjudication

**Overall verdict: proceed only after three P0 plan corrections:** define B’s state/precedence contract before coding; do not present a regenerated grounding pack as the original artifact; replace named-person role-play/“approval” in E with corpus-bounded representation audits.

**§0 owner edit — APPROVE.** Remove the attribution-dispute narrative. Keep the two citations attached to the specific claims they support, rather than as contextless “bare links.” The current three-way repetition in §1, §6 and the method note is research-process debris, not useful evidence.

### A. Coherence cuts — **MODIFY**

The cuts are directionally right and should ship, with three requirements:

- **§6:** The divergence table needs rows for **estimand/metric, workload, procurement basis, utilization, architecture, fleet and overhead**. Otherwise it will compare §5’s blended result with §6’s input/output or fleet result as though only procurement differs. Put the xAI contract evidence in a short paragraph after the table as an empirical invoice bracket, not as another analyst-assumption row.
- **§8:** Keep ksred plus **one independent longitudinal tracker**, not the pathological one-session example. State the selection rule and retain “tail, not distribution” in the main text.
- **§10:** Add **workload/traffic mix** to the proposed metric/lens line, plus one sentence naming the dominant driver and observable update trigger. Every card must remain screenshot-safe: “provider-native case; not cross-provider comparable” should be visible on the card, not only in the §10 introduction.

The deployed sections are currently long enough to justify the cuts, but their essential caveats are metric non-comparability, tail-selection bias and range causation—not the full parameter inventories.

### B. Workload axis — **MODIFY — P0**

The incremental split is worthwhile, but **do not call this a complete WORKLOAD axis** while SLA/interactivity, service class and cache lifecycle remain elsewhere. Call it **TRAFFIC MIX — I/O + cache**.

Before implementation, specify:

1. The ownership and precedence state machine.
2. Replay/analyst behavior.
3. URL and saved-preset migration.
4. The exact meaning and provenance of `cacheHit`.
5. How the anti-lens range behaves under each traffic profile.

Without those, this risks repeating v2.1’s “typed labels on the old merge model” problem. The final v2.1 review explicitly called the present ontology cosmetic, while v2.1.1’s xAI repair depended on keeping its 3:1/0% traffic fixed across all three lenses.

Detailed contract in §2 below.

### C. Durable exports — **MODIFY**

- **Roofline derivation — APPROVE**, but do not replace the useful adopted-summary wrapper. Publish:
  1. the concise adopted verdict;
  2. the full raw derivation on the same page or a child page;
  3. run metadata and a content hash;
  4. a prominent distinction between raw consultation output and adopted methodology.

  The current public wrapper explicitly says the full derivation exists only in the linked conversation, so making it durable is warranted.

- **Grounding-pack re-emission as archival recovery — REJECT AS WRITTEN — P0.** A new generation is not a durable export of the original 192-row artifact, even if it happens to match. Do this instead:
  - Retrieve and publish the original bytes if they still exist.
  - Otherwise publish a **reconstructed adopted grounding ledger**, generated from the current canonical preset/source registry, labeled as reconstruction—not “the full original pack” or “verbatim re-emission.”
  - A fresh GPT run may be published separately as a dated re-audit, with a machine-generated row-by-row delta against the adopted ledger.

The current wrapper itself records that the full pack lived in transient sandbox files and that the displayed page is only a decision summary.

### D. Tornado chart — **MODIFY; conditional ship**

The proposed gate is still underspecified. “Top three inputs with sourced ranges” can be gamed by defining the top three only among inputs that happen to have ranges, and “sourced” may merely mean a judgmental bracket in a model-generated dive.

It becomes sufficient under the exact rule in §3. Otherwise, drop it from v2.2. This remains the lowest-priority feature and should never delay A–C. The earlier council’s conditions—actual parameter ranges, correlated-variable grouping, cost alongside margin and explicit non-probabilistic labeling—remain correct.

### E. Persona reception phase — **MODIFY — P0**

The purpose is valuable; the named-person framing is not.

Replace:

> “Do the four people … consider their representation fair?”

with:

> “Does a corpus-bounded adversarial audit identify unsupported, contradicted or over-broad representations of the cited person’s public position?”

Do not prompt a model to speak in the first person as TeorTaxes, Zephyr, Dylan Patel or fleetingbits. Do not publish simulated “approval,” even with caveats. A named simulation saying “yes, fair” is synthetic endorsement-shaped content and will be screenshotted as such.

Use named **position-corpus audits**, blind claim extraction and claim-to-page matrices. Full design in §4.

### OUT exclusions

- **Numeric ISL/OSL/TTFT/TPOT controls — APPROVE OUT.** The deployed model expressly excludes these variables, and the roofline attempt missed the strict Ascend point by about 40% and transferred worse on prefill. Numeric controls would imply a validated latency surface that does not exist. Keep measured SLO replays and read-only caveats.
- **Epoch preset — APPROVE OUT.** Continue using Epoch as a methods/prior source, not as a calculator preset until the engine represents its latency and bandwidth constraints. This matches the prior unanimous adjudication.
- **Roofline re-test — APPROVE OUT.** “New data” must mean a genuinely untouched platform/operating-point family with frozen batch, precision, MTP and SLA metadata—not another interpretation of already-used observations.
- **September 1 tariff touch — MODIFY OUT.** Do not change the price early, but add `effectiveFrom`/`validUntil` metadata and an expiry assertion now. The report currently distinguishes the introductory tariff through August 31, 2026 from the standard tariff beginning September 1, 2026; the site should automatically become stale-loud rather than depend on a remembered manual edit.
- **Five-human-reader test — APPROVE OUT of the automated phase, with a hard limitation.** The casual-lurker simulation is an information-architecture heuristic, not the previously specified 4-of-5 human comprehension test. Keep that test visibly open; do not mark dossier reception “tested” or “passed.”

---

## 2. Workload-axis scoping

**Verdict: MODIFY. The right moderate cut is a `TRAFFIC MIX` axis, not a purportedly complete `WORKLOAD` axis.**

Leaving accelerator **fleet blend** outside traffic mix is correct; it is a deployment/fleet property. Leaving **SLA/interactivity** outside means the new selector is incomplete by definition. That is tolerable only if the UI and state names are narrow and honest.

### Required state behavior

- **Provider-native selected:** changing model resolves that model’s `nativeTrafficProfile`; the UI must show the resolved profile name and numeric values. The selector cannot remain visually static while silently changing the effective workload.
- **Explicit profile selected:** changing model leaves the selected profile fixed.
- **Custom selected:** changing model preserves the custom values.
- **Pure lens selected:** it must never write `ioRatio` or `cacheHit`.
- **Analyst reconstruction selected:** it may load a recommended profile, but any subsequent traffic edit must relabel the scenario “modified reconstruction.”
- **Dive replay or SLO replay selected:** traffic is locked. Changing traffic must exit replay mode or produce an unmistakable “modified replay—not the published result” state. A replay cannot remain named “§10 dive replay” after its workload has changed.

The clean compilation model is:

`model/deployment profile + traffic profile + pure cost lens + custom overrides`

A replay is a frozen snapshot of those layers, not another ordinary lens.

### P0: workload-profile grounding

The proposed names currently overstate what their numbers establish:

- The 15:1/60% profile is the calculator’s held-fixed normalized scenario, explicitly not each provider’s operating point.
- DeepSeek’s 56.3% figure is its own production **disk-cache-hit** share.
- The 41% figure is from the ncode/GLM coding deployment with 81k average inputs and 1M-context behavior.

Those do not automatically justify generic “Chat” and “Coding-assistant” archetypes across every provider.

Either:

1. label these as **illustrative traffic scenarios**, with provenance and no claim of population representativeness; or
2. use source-specific names such as “DeepSeek disclosure replay” and “ncode coding deployment proxy.”

Also define whether `cacheHit` means **serving-side prefix reuse** or **billable cached-input share**. The engine currently uses the traffic mix to blend both serving cost and realized billing; treating a server cache observation as portable billable-cache share is an additional modeling assumption and must be labeled as such.

### Permalinks and migration

The URL schema must be bumped; do not silently extend the existing v2 interpretation. A v2.2 URL needs:

- `workloadId` or `trafficProfileId`;
- mode: `native | explicit | custom | replay-locked`;
- resolved `ioRatio` and `cacheHit`, so the link preserves its numerical identity;
- custom values where applicable;
- existing model, perspective, engine revision and privacy behavior.

Migration cannot be “missing workload ⇒ Provider-native.” It must be pair-specific or numeric-state-preserving. In particular:

- old Grok+xAI lens links must remain 3:1/0%;
- old dive links must become replay-locked;
- old analyst positions with traffic assumptions must retain them;
- old custom links must become `Custom`, not be remapped to the nearest named profile.

Also migrate browser-saved custom presets; the live UI supports them, and silently changing their interpretation would be the same identity-corruption class v2.1.1 just repaired.

### Anti-lens-shopping range

Compute the range by:

1. resolving the selected traffic profile once;
2. running every compatible pure lens with exactly those resolved traffic values;
3. excluding analysts and replays as today;
4. labeling the result **“cost-lens span at [traffic profile]”**.

The selected traffic profile must be visible inside the hero tile. Adding this selector creates a new conclusion-shopping dimension, so the page must explicitly say that the lens span **does not include traffic-mix uncertainty**. The normalized provider table must continue to use its fixed 15:1/60% scenario regardless of the interactive selector.

### Release-suite invariants

Do not use the 514 count as the quality claim. Add named invariants:

1. Default parity for every existing model.
2. No model or pure lens owns `ioRatio/cacheHit`; models own only `nativeTrafficProfileId`.
3. Every old permalink and saved-preset fixture reproduces its old effective numbers.
4. Replay traffic is locked; editing it exits replay identity.
5. Every lens-range contributor receives byte-identical traffic values.
6. Explicit/custom traffic survives model changes; provider-native resolves on model changes.
7. The §10 normalized table and every dive headline retain their old targets.
8. Dossiers render the effective value and its origin—native profile, explicit profile, replay or custom—with no ignored override hidden from the ledger.

---

## 3. Tornado gate

**Verdict: insufficient as written; sufficient only with the following auto-hide rule.**

Render a tornado only when **all** conditions hold:

1. **Canonical state only.** The active state exactly matches a canonical preset/replay. Hide it for Custom, user-modified, forced-exploratory and tariff-only scenarios.
2. **Top three are predeclared.** Each dossier has a frozen `dominantDrivers[3]` selected from the dive’s causal analysis before range availability is considered. Never choose “top three among the ranged parameters.”
3. **Every driver has complete range metadata:** `lo`, `hi`, units, range basis, source class, locator, date, applicable model/hardware/lens/workload scope and correlation group. The baseline must lie inside the bracket.
4. **No reverse engineering.** Parameter brackets may not be inferred from the provider card’s judgmental output-margin range.
5. **Correlated factors are grouped.** For example, rent/utilization/stack overhead may appear as one coherent “capacity economics” endpoint pair if their source describes a joint scenario; they must not appear as three falsely independent bars. The same applies to MFU/interactivity/SLA.
6. **One group at a time.** Hold model, traffic, lens, prices and every other group fixed. Do not refit MFU or silently switch hardware when active parameters move.
7. **Sort by cost impact, not margin impact.** Rank by the maximum absolute change in `$ / Mtok`; display both `$ / Mtok` and margin at low, baseline and high. Margin alone compresses large cost errors near 100%.
8. **Exact caption:**
   **“One-at-a-time sensitivity over stated assumption brackets. Other inputs are held fixed. Bars are not probabilities, a joint uncertainty interval, or independently realizable scenarios.”**
9. **Fail closed.** Missing, expired, out-of-scope or categorical top-three range ⇒ no chart, with no fallback to slider bounds.

Under this rule, D is useful. Under a looser rule, it is chart theater and should be dropped.

---

## 4. Persona reception phase

**Verdict: MODIFY substantially.**

### Purpose and anti-sycophancy design

For each named source, use a two-stage, non-role-playing audit:

1. **Blind extraction:** Before showing the page, extract the person’s direct claims, qualifiers, non-claims and dates from the complete supplied primary-source corpus.
2. **Comparison:** Compare those propositions against exact page passages and dossier fields.
3. Classify each representation as:
   - directly entailed;
   - compatible but not source-supported;
   - contradicted;
   - over-broad/out of scope;
   - page-authored reconstruction correctly labeled as such.

Do not ask “Are you represented fairly?” Do not use first-person answers. Do not output “approval.” “No contradiction found in this corpus” is the strongest permissible null result.

The corpus also needs a completeness manifest: every included post/thread, relevant surrounding context, later correction and the authors’ selection rule. “Only the posts already cited by the page” otherwise makes the exercise circular.

### Cast

The four named-position audits are justified, but their scopes must be narrow:

- **TeorTaxes:** direct cost/margin ceilings versus page-added utilization, fleet and workload assumptions.
- **Zephyr:** the coexistence of unit-margin and company-margin claims.
- **Dylan Patel/SemiAnalysis:** separate his direct “north of 80%” claim from the site-created owned-TCO reconstruction; audit InferenceX usage against official benchmark material as well as posts.
- **fleetingbits:** audit his reported-margin/accounting claim only. Do not make him stand in for every possible skeptic or “approve” the calculator’s inverse diagnostic.

Add a **cost-accounting/financial-reporting reader** as a ninth audience. The largest enduring comprehension risk is still unit serving contribution margin versus company gross margin, and neither the ML-infra engineer nor calibration reviewer owns that perimeter.

Add **@_xjdr as a targeted source-fidelity audit, not a named persona**. His deployment statistics are load-bearing in §2c and are explicitly described as the best public Blackwell Ultra serving observation on the page. The audit should verify every transcribed number, the output-only caveat, hardware count, precision and separation from adjacent SGLang/Baseten results.

No existing audience archetype is clearly superfluous. The casual lurker, however, is only an LLM information-scent audit—not evidence that a human can navigate and comprehend the page in 90 seconds.

### Required task-template fields

Every output should contain:

- preview revision/hash and audit run metadata;
- exact page anchor and exact scenario permalink;
- affected metric, model, traffic profile and lens;
- source locator supporting the objection;
- failure class and P0/P1/P2 severity under a fixed rubric;
- exact replacement wording or UI change;
- a deterministic acceptance test;
- confidence and unresolved ambiguity;
- for the quote-tweet task: viewport, crop boundaries, proposed caption, what surrounding context is lost, and what must be placed inside the screenshot-safe card;
- for the lurker: navigation path, time-to-location, answers, confidence and where each answer was found.

For technical objections, require reproducible steps and expected versus observed behavior—not “this feels confusing.”

### Run and synthesis controls

- One Sol run per persona is acceptable for **issue discovery**, but absence of a finding is not evidence of correctness.
- Any proposed P0/P1 must be verified against the page and source by a second clean-context pass or manual evidence check before remediation.
- Opus synthesis must preserve dissent and link every synthesized issue back to the raw structured output. It may deduplicate, not silently rewrite or upgrade claims.
- Publish the exact prompts, corpus manifest, raw outputs, synthesis and a resolution table: `open / fixed / rejected with reason`.
- Never publish an aggregate approval score, named-person pass count or “the simulations agreed the page was fair.”

This makes the exercise useful without converting synthetic readers into synthetic validators.

---

## 5. What the next external review will otherwise flag

1. **P0 — workload-attribution laundering.** “Chat 56%” and “Coding 41%” will be attacked as generic labels built from provider-specific deployment observations with materially different cache semantics.

2. **P0 — hidden state corruption.** `Provider-native` will still allow a model change to alter workload behind a stable selector label; v2 links, local saved presets and analyst/replay scenarios will migrate inconsistently—especially the xAI 3:1/0% fixtures.

3. **P0 — simulated endorsement.** A published “TeorTaxes-sim: yes, fair” screenshot will overwhelm every annex disclaimer. The reviewer will call it attribution laundering by simulation.

4. **P0 — false archival provenance.** A fresh 192-row generation labeled as the missing original pack will be identified as a reconstruction masquerading as a verbatim artifact.

5. **P1 — conclusion-shopping moved, not solved.** The anti-lens span will remain correct but conditional on a user-selected traffic profile; the user can now shop workload instead. The hero must say exactly what the displayed range conditions on.

6. **P1 — tornado ranges are not empirical ranges.** “Sourced” will be challenged when a bracket comes from a model-authored dive, applies to another operating point, or splits correlated rent/utilization/MFU assumptions into independent bars.

7. **P1 — the comprehension claim still has no humans.** An LLM with full-page access cannot test scanning behavior, visual salience, distraction, mobile navigation or real 90-second comprehension. The original human gate remains open.

8. **P1 — circular persona corpora and missing accounting expertise.** Briefs assembled only from already-selected page citations will reproduce the authors’ framing, while no reader is explicitly tasked with auditing the serving-margin/accounting perimeter.

9. **P1 — §10 cuts may become caveat cuts.** A headline plus top-three list is insufficient unless metric, traffic, cost lens, non-comparability and update trigger remain in-card and therefore survive screenshots.

---

## 6. Ordering and sequencing risks

**Persona before the final gate is correct.** It must happen after the preview is feature-complete and before the independent final review, so remediations receive a clean gate. Do not run it before an internal correctness/identity gate; otherwise persona runs will spend their budget rediscovering deterministic bugs.

Recommended sequence:

1. **Freeze v2.1.1:** record engine hash, all existing permalink fixtures, saved-preset fixtures, default outputs, dive targets and lens-range membership.
2. **Apply §0 as a separately versioned editorial commit** or keep it on the v2.2 branch. Do not silently mutate the release still labeled v2.1.1.
3. **Write B’s state contract, URL-schema migration and invariant tests before UI work.**
4. **Implement the traffic-mix compiler and migrations; prove exact default and replay parity.**
5. **Then perform A’s §6 and §10 cuts.** Both must use the new traffic-profile terminology and resolved provenance. The independent §8 cut can happen earlier or in parallel.
6. **Publish C’s durable artifacts.** The adopted grounding ledger should derive from canonical data after any relevant schema changes.
7. **Implement D last.** Decide its go/no-go before freezing the reception preview; do not persona-test a chart that may then be removed.
8. **Run the deterministic release/semantic gate** on the frozen preview.
9. **Run named corpus audits and audience reception exercises.**
10. **Verify and remediate P0/P1 findings; rerun affected tasks and the full release suite.**
11. **Run the final council/GPT gate in a clean context.** Ideally, the reviewers first inspect the product blind, then inspect the persona findings and resolution ledger so the synthesis does not anchor their initial search.
12. **Ship only after the final gate covers both the product and the newly published reception annex.**

The main sequencing error to avoid is cutting §6/§10 first and then changing workload semantics underneath their new compact wording. The second is treating persona review as the first QA layer rather than a reception layer on top of a mechanically stable release.
