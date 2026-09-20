# v2.2 plan review — four-persona council (GPT-5.6 Sol xhigh ×4, Opus synthesis), 2026-07-11

> Pre-implementation adversarial review of PLAN-v22.md. Four personas (skeptic / architect / risk-analyst / empiricist) ran independently with full source access; synthesis below is verbatim. Full persona outputs: workspace run `2026-07-11-inference-margins-v22-plan-20260711T021118Z`. Verdict: **do not implement as written; revise against seven P0 conditions, then proceed.**

# Synthesis: PLAN-v22.md Pre-Implementation Review

All four agents independently reached the same headline verdict — **do not implement PLAN-v22 as written; revise first** — and, more tellingly, converged on the *same* two structural failure modes (false orthogonality in B, provenance laundering in C/E) as the ones that would recreate exactly what v2.1.1 was built to repair. That convergence, reached without cross-talk, is the strongest signal in this packet. The disagreements that remain are about ambition level, current deployment state, and one scope-gate call — not about direction.

---

## 1. Consensus

- **Current v2.1.1 is healthy and is the compatibility baseline.** Deployed `engine.js`/`app.js` byte-match local; all 514 assertions pass. `[unanimous]` (all four independently ran the check)
- **The plan must not be implemented as written.** `[unanimous]`
- **Q1: B as written creates a strictly worse hybrid.** Moving only `ioRatio`/`cacheHit` to a "workload" axis while `interact`, batch, SLA, fleet, and replay overrides stay scattered produces three selectors that *look* orthogonal but aren't. The load-bearing proof is the same arithmetic in all four outputs: Grok + xAI-opportunity resolves `3:1/0%` → **26.95%**; forcing that lens to `15:1/60%` → **36.52%** — the stale value v2.1.1 explicitly repaired. A single `nativeWorkload` cannot preserve both the 43.35% median default and the 26.95% replay while making lenses workload-independent. `[unanimous]`
- **B must be renamed "Traffic Mix," not "Workload."** It owns two traffic fields, not a workload ontology. `[unanimous]`
- **The proposed preset names overclaim their evidence.** "Agentic API 15:1/60%" contradicts the site's *own* tooltip (≈100–300:1 agentic); "Chat 4:1/56%" is the DeepSeek disclosure, not generic chat; "Coding 8:1/41%" is the ncode/GLM observation. Use provenance-bearing names (`Reference 15:1/60%`, `DeepSeek disclosure`, `ncode event`, `xAI dive 3:1/0%`). `[unanimous]`
- **"Provider-native" is a misnomer** — for most models it's an inherited analyst default, not an observed provider property. Rename to "model default (changes with model)." `[unanimous]`
- **Replays must become atomic composite scenarios** (model + traffic mix + perspective + operating point), not a perspective option; editing any axis exits replay; the selector must never display a value the replay silently overrides. `[unanimous]`
- **The anti-lens-shopping range must hold the selected traffic mix fixed** and vary only compatible cost lenses — it currently varies workload, which is a *residual* v2.1.1 defect B is the opportunity to close. `[unanimous]` (Skeptic and Empiricist name it as an existing, unrepaired defect)
- **Permalinks need a v3 schema; v2 links AND `im_presets_v1` browser presets must be migrated,** mapping exact known pairs to profile IDs and everything else to `legacy-custom`. `[unanimous on v3; skeptic, architect, risk-analyst explicitly flag the browser-preset migration the plan omits]`
- **Q2: the tornado gate is insufficient; D must not ship in v2.2 without a range registry.** "Top three inputs have ranges" is circular — dominance depends on the range itself, so the gate rewards parameters that happen to have convenient bounds and hides dominant un-ranged inputs (SLA, context). `[unanimous]` (Skeptic/Risk/Empiricist say reject-for-v2.2; Architect says preflight-inventory-first — see Disagreement 4)
- **Q3: the persona phase must drop named-person simulation.** "Would he QT approvingly / correct us?" asks a model to invent a real person's private reaction — neither reception evidence nor citation verification. Replace with third-person source-faithfulness audits. `[unanimous]`
- **@_xjdr should be added — as a source-faithfulness/deployment-fidelity audit, not a simulated personality** — because his §2c numbers (232/431 tok/s/GPU, 81k input, 41% cache, 60×B300, no-MTP) are load-bearing. `[unanimous]`
- **Drop the standalone quote-tweet-dunker persona** — every reviewer already carries the "worst standalone screenshot" task, making the role redundant. `[skeptic, architect, empiricist]`
- **C: reject "verbatim re-emission."** A new GPT conversation regenerating 192 rows is a *reconstruction*, not retrieval of the original artifact. Publish the original with checksum if retrievable; otherwise a clearly labeled reconstruction. `[unanimous]`
- **A: MODIFY — retain each card's one-line range-basis sentence; export §6 before cutting; don't delete unique financial/context evidence** (business-margin estimate, 5× software result, xAI contract) on the assumption the dossier already holds it. `[unanimous]`
- **The 514-assertion suite is test-count theater for this refactor** — it imports only `engine.js`, exercises no DOM/`encodeScenario`/`decodeScenario`/migration/selector-identity, and duplicates `app.js` pairing logic (a fresh drift surface). More engine assertions won't pre-empt the next review. `[empiricist, risk-analyst, skeptic]`
- **Freeze the baseline before refactoring** — current hashes, the 514 assertions, and all 180 model×perspective resolutions; every intentional delta needs a manifest. `[unanimous; risk-analyst + empiricist specify the 180-pair freeze]`
- **OUT items are correctly excluded** (numeric ISL/OSL/TTFT/TPOT controls, Epoch preset, roofline retest, Sep-1 tariff touch), and the full four-axis ontology + JSON export should be made *explicit* OUT items rather than silently absent. `[unanimous on the four; skeptic + architect on making ontology/export explicit]`
- **GPT-5.6 reviewing GPT-5.6-authored research is not independent evidence** — shared style and failure modes; nine correlated persona runs are less epistemically diverse than presented. `[skeptic, risk-analyst, empiricist]`

---

## 2. Disagreements

### D1 — Current deployment state of the §0 Jukan edit

**The disagreement:** Is the §0 Jukan correction already live, applied-locally-not-deployed, or a no-op that risks collateral damage?

**Each side:**
- **Architect:** "The §0 Jukan edit is already present on the live site, so mark it DONE, not an implementation step." Treats it as shipped.
- **Empiricist / Risk Analyst:** Local `index.html` differs from production *only* through the Jukan removal, and **that edit has not yet been deployed**. Risk Analyst adds that the local §6 replacement carries a grammatical break ("— Where…") that must be finished before deploy.
- **Skeptic:** The Jukan material is already *absent* from current §1, so §0 is a no-op — and following it literally risks deleting the wrong thing, namely the load-bearing `_xjdr`/ncode §6 attribution paragraph.

**Adjudication — Empiricist + Risk Analyst win on precision.** They performed the byte-level local-vs-deployed diff and caught the unfinished grammatical break; Architect's "already live" almost certainly conflated "applied locally" with "deployed" (the same byte-check the others ran shows `index.html` is *ahead* of production). Resolution: the edit exists locally, is **not yet deployed**, needs the "— Where…" fragment finished, and Skeptic's caution stands as an overlay — deploy it as a discrete, version-boundaried step and verify the `_xjdr` §6 paragraph is untouched in the process. This is cheap and should happen before the refactor, not folded into it.

### D2 — Ambition level: full v2.2 resolver vs. honest scoped Traffic-Mix release

**The disagreement:** Should the release be a genuine typed model/workload+SLA/lens/replay resolver (earning the "v2.2 ontology" claim), or a scoped Traffic-Mix selector shipped honestly as v2.1.2?

**Each side:**
- **Architect (pushes hardest for full):** Recommends the full resolver (its "Alternative 3"). Moving two fields "does not earn v2.2 ontology claims"; the scoped version is a *fallback* that must be renamed v2.1.2. Backs this with the prior design council, which **unanimously called the typed split prerequisite work, not optional cleanup**.
- **Risk Analyst:** Prefers the full split, but explicitly accepts the scoped Traffic-Mix version "with SLA debt openly retained" as a legitimate alternative.
- **Skeptic / Empiricist (lean scoped-is-fine-if-labeled):** Leaving SLA/blend separate is tolerable *if* the selector is honestly named Traffic Mix and the page states the larger ontology remains incomplete ("do not claim model/workload conflation is killed").

**Adjudication — largely reconcilable, with the irreducible part being a business input the agents don't have.** Everyone agrees the scoped version is *shippable* provided it (a) is renamed, (b) doesn't claim to resolve conflation, and (c) lists the full ontology as explicit OUT. So the substantive engineering position is shared. The genuine split is over the version *label* and default ambition — and that turns on a deadline none of the four can see. **Weight the Architect's naming discipline:** the prior council's unanimous "prerequisite work" verdict is real external evidence that a two-field move shouldn't wear the v2.2 badge. Cleanest resolution: **if you do the full resolver, it's v2.2; if you ship the scoped version, call it v2.1.2** — the version number should track the ontology work actually done, which resolves the disagreement without anyone conceding on substance. *Irreducible until the deadline/resourcing constraint is stated.*

### D3 — Five-human-reader test: blocking release gate vs. deferred external validation

**The disagreement:** Should the human-reader test block v2.2, or remain an open-but-non-blocking validation deferred outside implementation?

**Each side:**
- **Empiricist (dissenter):** **REJECT the exclusion.** Simulations cannot measure human reception; this is the *cheapest actual reception measurement* and should remain a release gate (run as a blind comparison against the persona phase). Marshals the strongest evidence: persona prompting showed near-random effects across 4 model families / 2,410 questions (Zheng et al. EMNLP 2024), ~30-point swings from irrelevant persona details (Luz de Araujo EMNLP 2025), 48% of synthetic-survey coefficients diverging from human data with 32% sign flips (Bisbee), plus documented sycophancy (Sharma et al.).
- **Skeptic / Architect / Risk Analyst:** Keep it OUT of *this implementation* (externally coordinated, not code) — but all three insist it's **not closed** and the persona phase must never be recorded as satisfying it.

**Adjudication — the gap is narrower than it looks, and Empiricist's framing should win the operative call.** All four agree persona ≠ human-reception substitute, and all four agree the test remains owed. The only real split is whether it *blocks ship*. Empiricist has both the strongest evidence base and the strongest practical hook: the human test is also the **cheapest decisive experiment** (five literate readers, 90 seconds each, hours not days), and running it *before* the persona phase turns "is E worth building?" from an assumption into a measurement. Resolution: don't let it block the *code* refactor, but make the human-vs-persona blind comparison the recommended next validation action, and treat a green persona phase as non-satisfying. Functionally this adopts Empiricist's experiment while respecting the others' scope boundary.

### D4 — D tornado: outright reject vs. preflight-then-maybe (minor)

**The disagreement:** Skeptic, Risk Analyst, and Empiricist say REJECT D for v2.2 outright; Architect says run a range-metadata inventory first and implement only if ≥3 presets qualify.

**Adjudication — converges in practice.** Both paths gate on a typed range registry (bounds, source locator, date, scope, range-type, correlation group) that does not yet exist, and both leave the chart out of the v2.2 implementation sequence. The only difference is whether the inventory runs now (Architect) or in backlog (others). Resolution: **defer D from the implementation sequence; build the range registry as the gating precondition** — semantically identical outcomes, so this is a sequencing preference, not a real conflict.

---

## 3. Open questions

- **Are the original roofline derivation and the 192-row preset pack still retrievable?** The Empiricist could not confirm either survives (roofline annex is a 7-line summary; the pack exists only as a claimed sandbox artifact). This gates C's entire approach — verbatim-with-checksum vs. labeled-reconstruction. `[empiricist surfaced; skeptic, architect, risk-analyst all flag the retrieval dependency]`
- **What is the deadline?** D2's full-vs-scoped choice hinges entirely on it, and no agent has this input. `[synthesis-emergent from Architect's Alternative-3-vs-2 fork]`
- **Does persona simulation add incremental signal over source audits + the human test?** Unknown until the blind comparison runs — it may show E's simulation track produces only persuasive synthetic objections. `[empiricist]`
- **What is the preregistered dominance-ranking procedure for the tornado?** All four say the range registry needs one; none specifies it. Must rank *all* mutable inputs (including un-ranged ones) before filtering for available bounds, or the selection bias persists. `[synthesis-emergent from all four]`
- **Will full-state v3 permalinks leak private rates?** Risk Analyst flags that serializing full effective state can expose private overrides; needs a "strip private overrides" decision and preserved share-warning. `[risk-analyst]`
- **Can v2 links whose workload values equal the global default be disambiguated at all?** Risk Analyst reproduced the existing codec bug directly: a link that changed GPT to `15:1/60%` encodes *neither* field and reloads as `9:1/78%`. Some v2→v3 migration is therefore irrecoverably lossy — the open question is only whether to accept `legacy-custom` as the honest fallback. `[risk-analyst]`
- **Is there any rollback boundary?** The project is not under Git — a cross-cutting multi-file refactor currently has no source-level undo, only isolated `.bak` files and deployed Cloudflare assets. `[risk-analyst — unique catch]`

---

## 4. Final recommendation

**Do not implement PLAN-v22 as written. Revise it against the seven P0 conditions below, then proceed with mitigation.** A/C can proceed after provenance cleanup; B needs a written state contract before any code; E needs redesign; D is deferred.

**Confidence:**
- *High* (all four converge, ~85–90% self-reported) that the **direction — revise before implement — is correct**, and high on the specific B/E/C/D adjudications, because the load-bearing ones rest on reproduced arithmetic (the xAI 26.95%/36.52% conflict) and primary-source checks, not reasoning-by-proxy.
- *Medium* on **version ambition (D2)** and **whether the human test blocks ship (D3)** — both depend on a deadline and a resourcing decision that none of the four agents had, so they are owner inputs, not analysis gaps.
- The confidence is downgraded on exactly one class of claim the Empiricist grounded and others asserted: treat the persona phase as an *idea generator with no established error rate*, not validation.

**The seven P0-before-implementation conditions** (consolidated from all four P0 lists):

1. **Write and test the B state-resolution contract first** — traffic/lens/replay resolution precedence, atomic-replay semantics, anti-shopping range invariance, v2→v3 permalink migration (accepting lossy `legacy-custom` where default-equality is irrecoverable), and `im_presets_v1` migration — as *failing fixtures* before any implementation.
2. **Rename Workload → Traffic Mix; re-ground every preset name** to evidence-honest labels; replace "provider-native" with "model default." Remove the generic "Agentic/Chat/Coding" labels the site's own tooltips contradict.
3. **Redesign E:** third-person source-faithfulness audits, remove all predicted-approval/QT questions, add @_xjdr as a source-fidelity audit (not a sim), split off an anonymous reception track, drop the redundant dunker persona, and rerun affected tasks after remediation. Note the Dylan citation is a Podcast Alpha post *featuring* him, not a primary post — the plan's "only from cited primary posts" rule is already false for one source.
4. **Defer D** from the implementation sequence; build the typed range registry (with a preregistered dominance ranking over *all* inputs) in backlog as its gate.
5. **C:** confirm artifact retrievability before any promise; prohibit calling a re-emission "verbatim"; export §6 in full before A's cuts (the current "full response" is a 39-line summary).
6. **Establish a rollback boundary** — `git init` or a checksum-stamped v2.1.1 snapshot — and freeze the 514 baseline + all 180 model×perspective resolutions before touching anything.
7. **Finish and deploy §0** — complete the "— Where…" grammatical break, deploy as a discrete version-boundaried step, and verify the `_xjdr` §6 paragraph is untouched.

**Two live defects to fix regardless of the plan** (Empiricist-found, currently shipped): the `_xjdr` blockquote alters "2.1 sec TTFT overage" → "average" and drops his 61-second p95 without marking the omission; both are attribution-fidelity errors the *next* review will flag independently of anything in v2.2. These are near-free and should ride along with the §0 deploy.

**Gaps where Risk Analyst's failure modes are not addressed by Architect's design:** the git/rollback boundary, the v3-permalink private-rate exposure, and the reproduced v2-default-equality lossy-migration bug. Fold these into the B contract (P0 #1) and the rollback step (P0 #6).

**Conditions that would change the recommendation:**
- *Hard near-term deadline* → ship the scoped Traffic-Mix version as **v2.1.2** (Architect's Alternative 2) — same seven P0s, lower version ambition, full ontology stays OUT. The P0s don't relax; only the badge does.
- *Original artifacts prove retrievable* → C becomes "publish verbatim + checksum" (cleaner); otherwise labeled reconstruction with an original-vs-adopted delta.
- *Blind human-vs-persona experiment shows persona adds no incremental signal* → downscope E to source audits + the human test only.

**Cheapest next action that moves the decision forward:** Write the **B resolver fixture matrix** as failing tests — legacy Opus link, Grok + xAI-opportunity, GLM dive replay, model-default workload, named workload, custom workload — asserting selector identity, final state, provenance, dive targets, and lens-range invariance. It's hours of work, it's a specification test not a research experiment, and it forces the #1 P0 (the state contract) to be pinned down before a line of production code is written. Run it alongside the Empiricist's five-reader blind comparison, which for a few more hours answers whether E's simulation track is worth building at all. Both are cheap, both are decisive, and neither commits you to the refactor.

---

## 5. Attribution map

| Claim | Contributing agent(s) |
|---|---|
| v2.1.1 healthy; 514 pass; assets byte-match | all four (independent verification) |
| B is a worse hybrid; xAI 26.95% vs 36.52% conflict | skeptic, risk-analyst, empiricist (arithmetic); architect (mechanism) |
| Rename Workload → Traffic Mix | unanimous |
| Preset names overclaim vs. site's own tooltips | unanimous (empiricist cited DeepSeek/xjdr/Epoch primary sources) |
| "Provider-native" is a misnomer → "model default" | unanimous |
| Anti-shopping range is a *residual* unrepaired defect | skeptic, empiricist |
| v3 schema + `im_presets_v1` browser-preset migration | skeptic, architect, risk-analyst |
| v2 codec loses default-equal workload values (reproduced) | risk-analyst |
| Replays must be atomic composites | unanimous |
| Tornado gate is circular / selection-biased; defer D | unanimous (architect = preflight-first) |
| Drop named-person sim; add @_xjdr as source audit | unanimous |
| Drop redundant dunker persona | skeptic, architect, empiricist |
| C: reject verbatim re-emission | unanimous |
| A: retain range-basis sentence; export §6 first | unanimous |
| 514 suite = test-count theater (no DOM/permalink coverage) | empiricist, risk-analyst, skeptic |
| Full-resolver vs. scoped-v2.1.2; prior council "prerequisite work" | architect (primary); risk-analyst (accepts scoped) |
| Five-human test should be a release gate + cheapest experiment | empiricist |
| Persona-fidelity literature (Zheng, Luz de Araujo, Bisbee, Sharma) | empiricist |
| §0 applied-locally-not-deployed; "— Where…" break | empiricist, risk-analyst |
| §0 collateral-damage risk to `_xjdr` paragraph | skeptic |
| `_xjdr` blockquote "overage→average" + dropped p95 defect | empiricist |
| Dylan citation is not a primary post | empiricist |
| No Git / rollback boundary | risk-analyst |
| Freeze 180 resolutions before refactor | risk-analyst, empiricist |
| v3 permalinks may leak private rates | risk-analyst |
| GPT-reviewing-GPT is not independent | skeptic, risk-analyst, empiricist |
| Resolver fixture matrix = cheapest unblock | empiricist |
