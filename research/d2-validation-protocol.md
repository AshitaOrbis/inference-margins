# D2 Validation Protocol — pre-registration (v1.0, 2026-07-16)

**Program:** `orchestration/plans/im-reengineer-defaults-2026-07-16.md` (council-gated, owner-signed).
**Status:** v1.0 (2026-07-16). Freeze state lives EXCLUSIVELY in `research/validation-ledger.md`:
this document is FROZEN and immutable if and only if that ledger's freeze block records this file's
sha256 plus both §7(3) signatures; absent that entry it is a pre-freeze candidate. (This header
deliberately asserts no freeze state of its own — a state word baked into the hashed bytes could
not survive the transition it describes; round-2 review, P1-1 residual.) The §7 freeze procedure
content is complete: the sensitivity derivation is attached (Appendix A) and thresholds were
finalized in the single §7a amendment pass (owner-ruled via AskUserQuestion, 2026-07-16). Once the
ledger entry exists, amendments require a new version, a fresh Sol review, and re-scoring from
scratch. **No D2 engine code may be written before the freeze** (none was).

**Purpose.** The phase-specific MoE serving model (WS-D2) replaces the single effective-MFU scalar.
Its risk is unfalsifiable flexibility: more parameters than independent anchors constrain. This
protocol pre-registers — before construction — what D2 predicts, which evidence may calibrate it,
which evidence scores it, and the numeric gates it must pass. The prior art is binding precedent: the
2026-07 single-scalar transfer test was pre-registered, failed (37% mean / 59% worst-case error), and
was published as a negative result. D2 gets the same treatment.

---

## 1. Estimand

For a platform row `p` at an operating point `o` (model served, active/total params, precision path,
batch/concurrency, TTFT/TPOT or stated SLO class, topology/replica width):

- **E1 (decode):** delivered generated-token throughput per device, `tok_dec(p, o)`.
- **E2 (prefill):** delivered prefill token throughput per device, `tok_pre(p, o)`.
- **E3 (margin translation):** the change in the v2.1.11-default-workload unit serving margin when
  row `p`'s modeled throughputs are replaced by predicted values — i.e., prediction error expressed in
  **margin points at the default workload** (the unit readers actually consume).

  **Operationalization (finalized §7a, before any scoring):** the prediction-error ratio
  `r = T_pred / T_obs` from an anchor is applied multiplicatively to row `p`'s corresponding phase
  throughput at the default workload — the engine is linear in a row's `effDec`/`effPre`, so scaling
  that field scales the row's modeled throughput by exactly `r`. E3 is the resulting change in the
  flagship margin, in points. The default workload is pinned forever to the v2.1.11 defaults (Opus 4.x
  preset + central-scenario lens + Reference 15:1/60% traffic; base margin 76.78%, fleet weights
  h100 10% / h200 15% / gb200 25% / gb300 15% / tpu7 20% / trn2 5% / trn3 10%) — later default-fleet
  changes (IM4) do not move this estimand. A row with **zero default-fleet weight** (Ascend — the
  CM384 anchor's platform) has E3 ≡ 0 by construction; this is stated, not hidden, and such anchors
  are gated by G1/G2 raw relative error alone (Appendix A shows why importing other presets' workloads
  for these rows would make E3 scales incomparable across anchors).

D2 is validated on E1/E2 per anchor; gates are set on both raw relative error and the E3 translation.

## 2. Anchor eligibility (what may enter the ledger at all)

Eligible (ANCHOR level): public, primary-sourced measurements with a named model, a defined
throughput denominator (per-device, or per-system with device count), and enough stated workload
context to reconstruct a scoreable operating point under the frozen equation-set conventions —
where unknown batch / precision-component / SLO fields are operating-point COMPLETION questions
governed by the two-level rule below, never standalone eligibility disqualifiers. Audited results
(MLPerf) rank above vendor-published-with-methodology, which rank above vendor marketing with
workload definition. (Signing-review round-5: the original conjunctive sentence here — "named
precision path, stated or reconstructable batch/concurrency and SLO class" as eligibility
requirements — was rewritten because it contradicted the two-level rule it now sits above; a
strict implementer could have read it as excluding the §4-registered score set.)

**Eligibility vs operating-point completeness (pinned pre-freeze after the Sol signing review
conflated-levels finding):** eligibility is decided at the ANCHOR level (public, primary-sourced,
named model, defined denominator, tier). Unknown OPERATING-POINT fields (batch, a precision
component, SLO) do not by themselves make an observation ineligible — that has been the seeded
practice since IM0: the H800 CALIBRATION anchor itself carries `batch: unknown` yet
`eligible: true` in the IM2 evidence instances, and §4 registers the four RETRO anchors as the
score set in full knowledge of their receipts. Unknown fields are handled EXCLUSIVELY by the
conventions pre-stated in the frozen equation set, in three tiers: (a) for anchors with a STATED
SLO, SLO-batch inversion IS this section's "reconstructable" mechanism — an SLO-constrained
benchmark is produced by an operator optimizing batch under the stated bound, so the inversion
mirrors the measurement process rather than substituting a favorable fiction; (b) for anchors with
neither batch nor SLO stated, the filling convention is an analyst scenario, disclosed, with
sensitivity reported alongside (never gate-substituted); (c) where the DOMINANT unmeasured
determinant cannot be fixed by any disclosed convention without inventing a de-facto fitted
parameter — speculative-decode acceptance — the observation is E1-INELIGIBLE (the equation set's
C7 rule; Trn2 spec rows, GB300 Interactive). Every convention-filled prediction carries its
convention labels into its score row (§8), so a stated-receipt prediction is always
distinguishable from a convention-completed one.

Excluded (hard): reasoning-summary-derived figures without a pinnable primary source (precedent: the
withheld AMD MI355X 396–408 tok/s figures); interactive-chart-locked values not extractable as text;
aggregate "total throughput" numbers without a prefill/decode or interactivity decomposition
(precedent: the Q-007 3.5K "total at low interactivity" correction); figures whose price leg and
throughput leg come from irreconcilable workload definitions.

## 3. Three-status classification (council P0-2)

- **FITTED** — used to calibrate D2 parameters. Reproduction of a fitted anchor is an identity, not
  evidence; the ledger and the site must label it so.
- **RETRO (retrospective pseudo-holdout)** — arrived after the v2.1.x single-scalar fits but is known
  to D2's designers (all four current candidates: GB300 MLPerf v6.0, CM384 FlexNPU, TPU v7 Ironwood,
  Trn2 Neuron). Passing on RETRO anchors supports **retrospective-only** claims, stated as such.
- **PROSPECTIVE (post-freeze holdout)** — arrives via the pipeline after the D2 freeze, scored against
  the frozen model **before** any refit decision. Only PROSPECTIVE passes can upgrade claims to
  "validated" and satisfy the §6a hold-release rule of the governing plan.

**Reserved-untouched designations (made now, irrevocably):** the first public production-interactive
AMD MI355X anchor capable of a $/token leg; the first observed GB300 rack rental rate; any future Trn3
or Rubin serving anchor. These are PROSPECTIVE by construction — they may not inform D2 design in any
way, and any dive/summary content about them is off-limits to the D2 design sessions from this date.

## 4. Partitions (frozen at IM2.5 entry)

- **Fit set:** the CLOSED enumeration F1–F7 in `research/d2-equation-set.md` §3 (six decode + one
  prefill FITTED observations across four platform families — H800, H20, GB200, Ascend 910C;
  census completed 2026-07-16 via the receipt pack). That file is hash-pinned at its own freeze — hash recorded in the ledger beside
  this protocol's — so the calibration set cannot drift through later ledger edits; the ledger
  registry is provenance and status bookkeeping, NOT the freeze boundary (Sol freeze-review #7).
- **Score set (IM2.5):** the four RETRO anchors — scored with **zero tuning passes**. One scoring run
  per anchor per D2 candidate structure; no post-hoc anchor exclusions (an exclusion discovered during
  scoring voids the run and requires a protocol amendment before re-scoring).
- **Prospective set:** everything arriving post-freeze, in arrival order, no cherry-picking: every
  eligible arrival is scored and recorded, pass or fail.

## 5. Metrics and gates (FINALIZED at the §7a one-shot amendment, 2026-07-16)

Report per-anchor, per-phase, per-operating-point. Pooled means are forbidden in the pass/fail
decision (a catastrophic row must not hide in an average). **Relative error ≡
(T_pred − T_obs) / T_obs; every gate evaluates |relative error|** (signing-review P2: stated
explicitly so no harness can choose a different formula).

| Gate | Metric | Finalized threshold |
|---|---|---|
| G1 decode accuracy | E1 relative error per RETRO anchor | median ≤25%, worst ≤40% |
| G2 prefill accuracy | E2 relative error per RETRO anchor (where prefill data exists) | median ≤35%, worst ≤60% |
| G3 margin translation | **joint replacement E3**: ONE engine run at the default workload with every scored anchor's platform-row throughput simultaneously replaced by its predicted value (ratio `r` per §1; decode and prefill fields both replaced where both are scored). Per-anchor E3 is additionally computed and reported per §8 — reporting, not the gate. | abs(E3_joint) ≤ 5pp |
| G4 baseline beat | D2 vs the single-scalar model's error on the SAME anchors | D2 strictly better on median AND worst |
| G5 identifiability | independent anchor observations ÷ free D2 parameters fitted | ≥1.0 (report the ratio prominently) |

**Statistic population (stated now, before any scoring):** G1/G2's median and worst are computed over
ALL scored (anchor × operating point) observations of that phase — an anchor with several operating
points contributes one observation per SCORED operating point (GB300 MLPerf: Server and Offline;
its Interactive point is E1-ineligible per the equation set's C7-parity ruling and contributes
nothing). Collapsing an anchor's operating points to a per-anchor mean before the median/worst would
itself be a forbidden pooled mean.

G3 edge rules (stated now, before any scoring): if multiple scored anchors OR multiple operating
points cover the same platform row, the joint run does NOT pick one by a proxy rule —
**E3_joint = the maximum |E3| over every combination of per-row candidate ratios** (per phase),
found by exhaustive engine evaluation (a few dozen runs at the seeded set — trivial). This replaced
an earlier "largest absolute relative error per row" selection after the Sol freeze review (#11)
showed |relative error| is the wrong proxy: over-prediction is materially E3-damped vs
under-prediction (Appendix A.4: ≈2.3× at the joint ±40% corners, −2.35pp vs +1.01pp; up to ≈4.0×
at single-row ±60%, −1.936pp vs +0.484pp), so the proxy could select a LESS adverse candidate; the
exhaustive maximum needs no tie-break and is worst-case by construction. Zero-default-fleet-weight rows participate formally and
contribute 0 (§1). G3 is scoreable exactly when G1 is (≥1 decode-bearing RETRO anchor — a
precondition of the spike).

**G3 scope disclosure (Sol freeze-review #10 — stated plainly, before any scoring):** G3 bounds the
flagship translation of SCORED-ROW prediction error only. About 60% of the pinned default-fleet
weight (h100 10% / h200 15% / gb200 25% / trn3 10%) has no RETRO anchor, and D2-induced changes to
those rows are INVISIBLE to G1–G5 — verified illustration: scaling only the unanchored H200+Trn3
rows to decode 0.60× / prefill 0.40× moves the flagship 76.778% → 69.190% (−7.589pp, engine run
2026-07-16) while every gate stays green on perfect scored-anchor predictions. These gates were
never the mechanism bounding that exposure and MUST NOT be reported as if they were. The exposure
is bounded elsewhere in the pre-registered program: (a) IM4's anchored-only default fleet removes
unanchored rows from the defaults entirely (plan WS-A / B3); (b) unfitted opt-in rows carry WS-C
stress-envelope uncertainty; (c) IM6's shadow comparison (v2.1.11 vs v2.2, plan §4.4) must explain
EVERY flagship-moving diff — scored or not — before release. Every report of gate results carries
this scope statement.

**Decision rule (total, three-state gates — IM0 gate P0-2, reconciled with P0-4 per the 2026-07-16
fix-verification):** each gate scores exactly one of **PASS / FAIL / UNSCOREABLE**.

- A gate is **UNSCOREABLE** only when no eligible (§2) anchor exists for it in the ledger registry at
  scoring time — never by choosing to skip available anchors. G4 and G5 are structural and always
  scoreable; G1 and G3 must be scoreable for any verdict to exist at all (≥1 decode-bearing RETRO
  anchor is a precondition of running the spike).
- **Verdict: PASS = every scoreable gate met at its stated threshold. Any scoreable gate missed =
  FAIL → KILL/redesign.** No marginal/discretionary middle among scoreable gates; a documented
  mechanism analysis accompanies every miss but never converts FAIL to PASS.
- **UNSCOREABLE gates do not block the verdict — they scope the claims.** The verdict is always
  labeled with its scope (e.g. "PASS (decode-scope; G2 unscoreable)"), and each unscoreable gate's
  dependent claims are forbidden per its stated consequences (for G2: no prefill or blended-margin
  claims) until that gate is scored and passed.
- **Only scoreable-gate FAILs count against the §"Redesign iteration cap".** An unscoreable gate can
  never burn a redesign cycle — waiting for data is not a design failure.

Median convention at even n: the mean of the two middle values (IM0 gate P2-3).

**G4 baseline recomputation (IM0 gate P0-3, mandatory before D2 scoring):** the published
`methods-loao.md` errors were measured on a DIFFERENT anchor set (H20/GB200/Ascend) and are historical
context only. Before any D2 scoring, the single-scalar baseline (the frozen H800-fit coefficient,
6.91% global decode MFU) must be freshly scored on the four actual RETRO anchors of §4, per-phase,
per-operating-point, and recorded as its own ledger rows. THAT recomputed record is G4's comparison
target — same anchors, same metrics, same E3 translation.

**G2 status at IM2.5 (IM0 gate P0-4 — stated, not silent):** none of the four seeded RETRO anchors
carries a measured prefill throughput (the MLPerf GB300 figures are generated-token throughput; CM384's
6,688 tok/s prefill figure is a projection and ineligible under §2). **G2 is therefore UNSCOREABLE at
IM2.5 as seeded.** Consequences: (1) no claim about D2's prefill behavior may ship on IM2.5 results;
(2) the blended-margin estimator language additionally requires a prefill-bearing anchor to clear G2
(see prospective gate below) — decode-only estimator language may clear on decode evidence alone;
(3) sourcing at least one eligible prefill-bearing anchor is a standing pipeline priority;
(4) **G3 at IM2.5 is decode-only and cannot fail while G1 passes** — a G1-passing run caps every
per-observation error at 40%, and Appendix A.4 puts the all-rows decode joint corner at that bound
at −2.35pp (over-prediction side +1.01pp), inside the 5pp threshold. An IM2.5 verdict line of
"G3: PASS (decode-scope)" therefore carries NO independent evidential weight beyond G1 and must be
reported with exactly that caveat. G3 becomes a binding constraint the moment a prefill-bearing
anchor enters the joint run (Appendix A.4: the GATE-COMPLIANT corner — a population clearing both
G1 and G2 medians and worsts — reaches −6.47pp → FAIL).

**Redesign iteration cap (IM0 gate P1-1):** at most **2** KILL→redesign cycles may be scored against
the same RETRO set. A third attempt requires an expanded/refreshed holdout set AND an owner/council
check-in with full disclosure of all prior attempts' per-anchor errors. Each new freeze's review must
explicitly compare the new structure against every previously failed structure (guarding against
architecture search overfitting the four anchors' idiosyncrasies).

**Prospective gate (claim upgrade + plan §6a hold-release; stated in joint-G3 terms):**
≥1 PROSPECTIVE decode-bearing anchor whose G1 relative errors are within bound AND for which the G3
joint run, recomputed with that anchor's replacement included, stays within its 5pp bound — AND, for
any blended-margin (flagship) estimator claim, ≥1 **PROSPECTIVE** prefill-bearing anchor whose G2
errors are within bound and whose prefill replacement, added to the G3 joint run, keeps it within
bound — with no PROSPECTIVE anchor since freeze exceeding the per-observation worst-case bounds
(G1 40% / G2 60%). (The earlier draft's "or a newly-arrived eligible RETRO" clause was STRUCK at
the signing review: §3 admits no post-freeze RETRO arrivals, and the clause would have let
retrospective prefill evidence unlock prospective validation. A prefill anchor discovered before
the freeze would enter as RETRO and make G2 scoreable retrospectively — supporting
retrospective-only claims, never "validated". The governing plan's §6 phrasing predates this
strike; this protocol governs scoring.) PROSPECTIVE observations never enter G1/G2's median
machinery — that population is the frozen §4 RETRO score set; prospective evaluation is
per-observation worst caps + the accumulated joint G3, exactly as above. G3 is never evaluated per-anchor; it is always
the joint number recomputed with the new anchor included. **Cohort definition (Sol freeze-review
#6):** that joint run = the frozen RETRO score-set replacements PLUS every PROSPECTIVE anchor scored
since freeze, accumulated in arrival order — never the arriving anchor alone — with the exhaustive
per-row worst-corner rule of §5 applied to the whole cohort. "Within bound" for a PROSPECTIVE
anchor's own errors means the per-observation worst caps above; the median machinery applies only to
the RETRO population of §4. Claims upgrade from "retrospective-only" to "validated" only then; the
plan's HOLD on v2.2 releases only then.

## 6. IM2.5 feasibility spike procedure (council's decisive experiment)

1. Freeze this protocol (§7) — equation set, fit set, exclusions, thresholds — in writing, first.
2. Score the four RETRO anchors with the candidate D2 structure, zero tuning.
3. Report per-phase, per-operating-point, per-anchor; translate every error to E3.
4. Publish the result to the ledger **whichever way it goes** (a failed spike is a publishable
   negative result, per site precedent).
5. Decision per §5: proceed (labeled retrospective-only) / KILL and redesign.

## 7. Freeze procedure

At IM2.5 entry: (1) the sensitivity derivation (engine run mapping G1/G2 error magnitudes to E3 at
the default workload) is attached as an appendix; (2) thresholds are finalized in one amendment pass —
direction of change and rationale documented; (3) orchestrator + a fresh Sol instance sign the frozen
version (Sol review recorded by hash in the ledger); (4) the frozen file's sha256 is recorded in
`research/validation-ledger.md`. After that: immutable, as above.

**Technical enforcement (IM0 gate P1-2, extended per Sol freeze-review #7/#13):** the IM2.5 spike
harness (and every later scoring harness) MUST begin by recomputing and verifying THREE sha256
hashes against the ledger's freeze block, hard-failing on any mismatch: (1) this file,
`research/d2-validation-protocol.md`; (2) `research/d2-equation-set.md` (the closed fit set +
recipes — hash recorded at its own freeze, before any scoring); (3)
`research/e3-evaluator-v2111/engine-v2111-frozen.js` — the frozen E3 evaluator, a byte-copy of the
pre-D2 engine. Every E3 computation, now and for all future PROSPECTIVE scoring, imports the frozen
evaluator and NEVER the live `site/engine.js` (which IM3+ modifies). A scoring run produced without
these checks is void.

## 7a. One-shot finalization amendment log (2026-07-16)

Sequenced per §7: Appendix A was derived first (engine runs, `tests/sensitivity-e3.mjs`), then this
single amendment pass, then signatures + sha256 (ledger). No scoring of any kind existed at amendment
time; no RETRO anchor value was consulted for any scoring purpose. Owner visibility: the finalized set
was surfaced via AskUserQuestion on 2026-07-16 with four options (adopt as below / keep G3 per-anchor
as seeded / additionally tighten G2 worst to 50% / hold the freeze); the owner chose **adopt**.

- **G1 — UNCHANGED** (median ≤25%, worst ≤40%). Rationale: precedent-consistent (the pre-registered
  LOAO bar was ~25% and the single-scalar failed it at 37%/59%; the roofline diagnostic showed ≤16%
  achievable on good decode points). Appendix A gives no reason to move it in either direction:
  sensitivity data speaks to flagship impact, not to achievable accuracy.
- **G2 — UNCHANGED** (median ≤35%, worst ≤60%). Rationale: G2 is UNSCOREABLE as seeded (§5 status
  note); no eligible prefill anchor exists to inform a tighter bar, and tightening in a data vacuum is
  threshold theater. The restructured G3 becomes the binding blended-margin control ONCE a
  prefill-bearing anchor is scored (Appendix A.4: the gate-compliant prefill-bearing corner reaches
  −6.47pp, which the joint G3 catches; at IM2.5 itself G3 cannot fail while G1 passes — §5 G2-status
  consequence 4).
- **G3 — RESTRUCTURED, direction: STRENGTHENED** (per-anchor median ≤5pp / worst ≤10pp → joint
  replacement gate, abs(E3_joint) ≤ 5pp; per-anchor E3 demoted to mandatory reporting). Rationale:
  Appendix A proves the per-anchor form was vacuous — with default-fleet shares of 15/20/5%, a single
  row cannot move the flagship 5pp at any error inside G1/G2's own caps (max 0.86pp at G1-worst;
  reaching 5pp needs a 73–86% single-row error, at which G1/G2 fail first). A gate that cannot fail is
  the tests-as-tautology trap (plan §4.6 / cold-review #20). Meanwhile error populations that clear
  BOTH G1/G2 medians and worsts (multi-operating-point anchors absorb the sub-threshold entries) can
  still drive every in-fleet row to its per-row worst, distorting the flagship −6.47pp (gate-compliant
  corner, Appendix A.4, corrected per Sol #5 — the unconstrained all-rows-at-worst corner reaches
  −8.8pp but would not itself clear the medians), and the per-anchor form left that whole class
  ungated. The joint gate closes exactly that hole. Scope candor: this is a
  metric-basis change, beyond a literal thresholds-only reading of §7(2); it was adopted pre-freeze
  and pre-scoring, is strictly gate-strengthening, and was the explicit subject of the owner ruling.
- **G4, G5 — UNCHANGED** (structural gates; no sensitivity input applies).
- **Welded clarifications in the same pass:** the E3 operationalization in §1 (ratio `r` applied
  multiplicatively at the pinned default workload); the zero-weight-row statement (CM384 ⇒ E3 ≡ 0,
  gated by G1 alone); the G3 edge rules in §5 (shared-row worst-case incl. multi-operating-point
  anchors, scoreability); the G1/G2 statistic population in §5 (median/worst over all anchor ×
  operating-point observations — per-anchor collapsing would be a pooled mean).
- **Freeze-review fixes (2026-07-16, pre-hash):** the §7(3) review (Claude-native fallback — the
  dispatched Sol process stalled in-flight with the proxy UP; true-Sol re-pass queued) returned
  FINDINGS-BLOCK-FREEZE with three text findings, all fixed before hashing: the Status header now
  routes freeze-state authority to the ledger entry ("no entry = not yet frozen") instead of
  asserting completion (P1-1); the §5 G2-status note now
  discloses that IM2.5's decode-only joint G3 cannot fail while G1 passes (P1-2 — the amendment's
  own tautology-trap standard, applied to itself); the prospective gate is restated in joint-G3
  terms (P1-3 — the one G3-touching clause the amendment pass had missed). The reviewer verified
  Appendix A's reproduction as exact BEFORE these fixes; no number changed. A P2 robustness fix
  (try/finally in the derivation script's joint-perturbation paths) was applied with output
  verified byte-identical.
- **Sol freeze-review remediation (2026-07-16, pre-hash, second pass):** the delayed true-Sol
  dispatch completed (~30 min; it reviewed the pre-fix text and its FINDINGS-BLOCK-FREEZE verdict
  concurred with the fallback) and surfaced five findings surviving the first fix set, all
  remediated before hashing: fit set pinned to the equation set's closed, hash-pinned enumeration
  (#7 → §4); G3 candidate selection replaced by exhaustive worst-corner maximization (#11 → §5);
  G3's scored-rows-only scope disclosed, with the unanchored-fleet exposure named, engine-verified
  (−7.589pp illustration) and cross-referenced to the IM4 / WS-C / IM6 mechanisms that bound it
  (#10 → §5); the prospective-gate G3 cohort pinned to the accumulated frozen-RETRO + PROSPECTIVE
  set (#6 → §5); the E3 evaluator frozen as a hash-pinned byte-copy with three-hash harness
  enforcement (#13 → §7); and Appendix A.4's "passes G1 and G2" corner corrected with a
  gate-compliant counterexample, engine-verified at −6.470pp (#5 → A.4). Every embedded number from
  the Sol report was independently re-verified by engine run before being written here.
- **Round-2 review + remediation (2026-07-16, pre-hash):** the round-2 review (Claude-native
  fallback — the two-document Sol dispatch failed twice: argv limit, then a WebSocket reset at
  ~40 min with the proxy up; circuit breaker invoked, true-Sol re-pass queued) returned
  FINDINGS-BLOCK-FREEZE on both documents. Adjudication and fixes, all pre-hash: (1) CONFIRMED —
  the 6P2D score target used the prefill-bottlenecked system rate; corrected to the decode pool's
  standalone 811.52 req/s ⇒ 2,885.4 tok/s/decode-card (equation set recipe 4 + C6 + ledger).
  (2) REFUTED at source — the proposed FP8 re-precisioning of the Trn2 405B no-spec baseline: the
  tutorial's Scenario 1 baseline is explicitly BF16 (verified verbatim at the tutorial page; the
  receipt-pack addendum table, whose per-model precision column had conflated the two scenarios,
  is clarified). (3) P1-1 residual fixed — this header is now state-neutral; freeze state lives
  only in the ledger. (4) The "~4×" damping multiplier corrected to its accurate per-context
  values (≈2.3× joint ±40%; ≈4.0× single-row ±60%). (5) The §5 statistic-population example
  updated for the Interactive exclusion. (6) A G5 honesty line added to the equation set (no
  convention calibrated on RETRO). The score-set miscount (8→7) was caught by the round-2
  reviewer's pre-verification and fixed live. The reviewer independently reproduced Appendix A,
  the evaluator byte-copy hashes, and the −7.589pp illustration.
- **Sol signing review (round 4, 2026-07-16/17, pre-hash):** the first compact true-Sol SIGNING
  dispatch on the post-round-3 bytes completed (~34 min) and returned **NO SIGN-OFF on both
  documents** while RATIFYING the substantive design (C7 exclusions "accepted; unknown acceptance
  makes them unreconstructable"; 6P2D correction arithmetic verified; joint G3 reproduced at
  −6.470pp and "non-vacuous prospectively... adequately disclosed"). Its findings, adjudicated and
  fixed pre-hash: (1) P0 — §2's eligibility text, read strictly, excluded the very score set §4
  registers (self-contradiction); resolved by pinning the two-level structure §2 always practiced
  (anchor-level eligibility vs operating-point completeness; SLO-inversion as the "reconstructable"
  mechanism for SLO-stated anchors; precedent: the H800 calibration instance is batch-unknown yet
  eligible since IM2) — an intent clarification consistent with the seeded ledger, not a weakening;
  the strict alternative would render the pre-registered experiment unrunnable. (2) P1 — the
  prospective gate's "newly-arrived eligible RETRO" prefill clause STRUCK as a validation loophole
  (plan-text divergence noted; protocol governs). (3) P2 — relative-error formula pinned;
  prospective population explicitly excluded from median machinery. (4) P1 — equation set closed
  mechanically: W_resident defined (Total/N_shard), TTFT scope stated (TPOT+feasibility only),
  prefill formula pinned exactly. (5) P1 — dense-TP compute/KV terms corrected to per-device shares
  (Φ/N, K/N — an earlier draft charged full-model FLOPs against per-chip FLOPS; numerically
  immaterial at the b=1 HBM-bound Trn2 points, but a real equation error). (6) P2 — fit-set family
  count corrected (four families, not five) and G5's "independent" glossed as parameter-capacity,
  not statistical independence. Sol also disclosed a review-side scratch calculation (recorded
  here per the strict pre-freeze rule; it used no result as gate evidence, and no protocol score
  existed — the feasibility definition it would have needed was itself still absent).
- **Signing attempt 2 (round 5, 2026-07-17, pre-hash):** NO SIGN-OFF with exactly three findings —
  all residuals of the round-4 fix application — and "no additional substantive findings" (both
  empirical checks PASS; −6.470pp reproduced again): (1) §2's original conjunctive eligibility
  sentence still contradicted the two-level rule beneath it — the sentence itself is now
  rewritten; (2) protocol §4 still said five fit-set families where the equation set correctly
  says four — corrected; (3) the pinned dense-TP prefill formula was still unsharded and the
  "÷N" parenthetical pointed at the fabric payload instead of the compute share — `Φ_pre_dev`
  is now defined exactly parallel to §1 decode, and `D` is stated as never divided. Every other
  round-4 fix was verified CLOSED by Sol in the same pass.

## 8. Reporting invariants

Every score row carries: anchor id, status (FITTED/RETRO/PROSPECTIVE), operating point, predicted vs
observed per phase, relative errors, E3 translation, D2 version hash, protocol version hash, date.
The site's tests page consumes these statuses for its four-row split (software consistency / source
transcription / out-of-sample economics / coverage calibration) — out-of-sample counts come ONLY from
RETRO and PROSPECTIVE rows, labeled separately. No coverage/confidence language anywhere until ≥5
PROSPECTIVE scores exist (and then only if an explicit coverage analysis is published).

## Appendix A — Sensitivity derivation (§7 step 1; engine runs 2026-07-16)

**Provenance:** `node tests/sensitivity-e3.mjs` against the FROZEN E3 evaluator
`research/e3-evaluator-v2111/engine-v2111-frozen.js` — a byte-copy of the v22 `site/engine.js` at
ENGINE_REVISION `v2.1.11-2026-07-16` taken before any D2 work (sha256 recorded in the ledger's
freeze block; engine numbers identical to the master/production v2.1.11 engine — the IM1 codec work
touched no engine number). Base scenario = the pinned §1 default
workload: Opus 4.x + central-scenario lens + Reference 15:1/60% (native). **Base margin 76.78%.**
Fleet weights: h100 0.10, h200 0.15, gb200 0.25, gb300 0.15, tpu7 0.20, trn2 0.05, trn3 0.10; the
Ascend row (CM384's platform) carries **zero** default-fleet weight.

Perturbations scale a row's `effDec`/`effPre` by `(1+δ)` — exactly a ×`(1+δ)` on that row's modeled
throughput (engine linearity, §1). Negative δ = under-prediction (margin understated); positive δ =
over-prediction (margin overstated). Values are E3 in margin points (pp).

### A.1 Decode (G1 axis) — single-row perturbation

| row | −60% | −40% | −25% | −10% | +10% | +25% | +40% | +60% |
|---|---|---|---|---|---|---|---|---|
| gb300 | −1.936 | −0.861 | −0.430 | −0.143 | +0.117 | +0.258 | +0.369 | +0.484 |
| tpu7 | −1.915 | −0.851 | −0.426 | −0.142 | +0.116 | +0.255 | +0.365 | +0.479 |
| trn2 | −1.433 | −0.637 | −0.318 | −0.106 | +0.087 | +0.191 | +0.273 | +0.358 |
| ascend | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### A.2 Prefill (G2 axis) — single-row perturbation

| row | −60% | −35% | −10% | +10% | +35% | +60% |
|---|---|---|---|---|---|---|
| gb300 | −2.467 | −0.886 | −0.183 | +0.150 | +0.426 | +0.617 |
| tpu7 | −2.810 | −1.009 | −0.208 | +0.170 | +0.486 | +0.702 |
| trn2 | −1.186 | −0.426 | −0.088 | +0.072 | +0.205 | +0.297 |
| ascend | 0 | 0 | 0 | 0 | 0 | 0 |

### A.3 Inversion — single-row error at which abs(E3) reaches the old per-anchor bounds

| row | phase | δ for 5pp (under-pred) | δ for 10pp (under-pred) | over-pred |
|---|---|---|---|---|
| gb300 | decode | 79.5% | 88.6% | >95% for either |
| gb300 | prefill | 75.2% | 85.9% | >95% |
| tpu7 | decode | 79.7% | 88.7% | >95% |
| tpu7 | prefill | 72.7% | 84.2% | >95% |
| trn2 | decode | 84.0% | 91.3% | >95% |
| trn2 | prefill | 86.3% | 92.7% | >95% |
| ascend | both | unreachable (zero fleet weight) | — | — |

Every 5pp entry sits far beyond G1/G2's own worst-case caps (40% / 60%) ⇒ the per-anchor G3 form
could never fire before G1/G2 failed — the vacuity finding behind the §7a restructure.

### A.4 Joint corners (gb300 + tpu7 + trn2 simultaneously)

- decode −25% (G1 median bound): **−1.17 pp** · decode −40% (G1 worst bound): **−2.35 pp**
- decode +25%: +0.71 pp · decode +40%: +1.01 pp (over-prediction is naturally damped — ≈2.3×
  tighter than understatement at these joint ±40% corners, up to ≈4.0× at single-row ±60% in A.1)
- prefill −35% (G2 median bound): **−2.32 pp** · prefill −60% (G2 worst bound): **−6.46 pp**
- **combined worst corner** (decode −40% AND prefill −60%, all three rows): **−8.81 pp** — the
  unconstrained per-row worst. NOTE (Sol freeze-review #5): a UNIFORM population at these errors
  would NOT itself clear G1/G2 (its medians equal the worst caps). The gate-compliant demonstration:
- **gate-compliant corner**: an error population clearing G1 (median ≤25%, worst ≤40%) AND G2
  (median ≤35%, worst ≤60%) — multi-operating-point anchors absorb the sub-threshold entries while
  the exhaustive per-row selection still drives each row to its per-row worst: decode −40% on all
  three rows, prefill gb300 −35% / tpu7 −60% / trn2 −35% → **E3 = −6.47 pp**, FAILING the joint G3
  gate. This configuration class — not the unconstrained corner — is what the restructured G3
  exists to catch.

### A.5 Why zero-weight rows stay at E3 ≡ 0 (rather than borrowing another workload)

Scoring the Ascend row's E3 on a workload where it has share was considered and rejected: on the
GLM 5.2 preset (40% Ascend) a −40% decode error moves that margin −3.0pp, but on DeepSeek V4 Pro
(30% Ascend, near-zero prices, base margin −25.3%) the same error moves it −19.9pp — the E3 scale
becomes preset-dependent and incomparable across anchors. E3 stays pinned to the §1 default workload;
CM384 is gated by G1 raw relative error alone.
