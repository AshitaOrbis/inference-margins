// RENDER-PARITY GUARD (originated in feasibility-redesign R1, live since R2): every
// rendered quantity stays byte-identical unless an intentional reviewed re-mint changes it. WIDE surface
// (R1-impl review P0-1): ALL non-custom models x ALL perspectives (native mode), the
// COMPLETE workload DTO, every feasibility leg field (incl. b/bDeclared/capped/opBasis
// consumed by the rendered tile), blended costs + fleet receipt, and all three welded
// clause strings. Baseline minted by computing this hash at BOTH 3e7a356 (pre-R1) and
// the minting HEAD via a throwaway worktree — identical (60a879c2...), proving the R1
// batches were genuinely parallel before pinning. Residual surfaces covered elsewhere:
// browser DOM = the 95-case app suites (behavioral); MCP envelopes = these same engine
// DTOs (now fully hashed) + the MCP contract/parity suites.
// Re-mint only with an explicit reason and matching behavioral/delta evidence.
// Run: node site/tests/render-parity-r1.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
/* im-arc T4 fold (2026-08-24), memo §6 [F10]: the pre-fold overlay is GENERATED from the declared
   delta, never restated here — a hand-copied bundle is a second source of truth for the very
   values this file exists to pin. */
import { preT4Overlay } from "./t4-historical-pins.mjs";
const PRE_T4_OVERLAY = preT4Overlay();
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const E = require("../engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

/* b9 M1 re-mint (delta manifest research/b9-delta-manifests/b9-m1-delta-manifest.md):
   the WIDE 180-state hash re-derives on the r4 §C1 repaired defaults. The 180-state
   COUNT is INVARIANT (15 models × 12 perspectives unchanged); of the 180 pairs, 102
   moved and 78 are byte-unchanged — the unchanged set is exactly the states whose
   fleets contain none of the seven repaired rows, which is the check that this hash
   moved for the enumerated reason and nothing else. Every moved pair is manifested.
   Old 872cffdc… → new 1546631a….

   External adversarial review 2026-07-27: AWS specifies Trainium3 capacity as
   144 GB, not 144 GiB. Re-minting 144 GiB → 144e9 B moves 27/180 states, exactly
   the Opus/Sonnet/Haiku perspectives whose fleet includes Trainium3. The only
   fields that move are the Trainium3 bFeas and matching capacity receipt:
   Opus 112→94, Sonnet 140→123, Haiku 215→197 in the median perspective.

   Post-review adjudication 2026-07-27: OVERTURNED — the AWS Neuron architecture
   docs are unit-explicit ('HBM Capacity (GiB): 144'; '144 GiB of device memory'),
   so the marketing page's '144 GB' is a loose label, not an SI statement. Also
   registers the docs' published dense BF16 671 TFLOPS over the 1.255 PF fp8/2
   fallback. Re-minted by execution: exactly the same 27 states move back
   (under peak-KV sizing: Opus 91→108, Sonnet 119→136, Haiku 191→208 in the
   median perspective); zero cIn/cOut leaves move — the BF16 correction touches
   no rendered state because no default state runs Trainium3 at BF16. */
// External adversarial review 2026-07-27: the TPU v7 balanced row changed only
// its operating-point evidence label (anchor-stated -> analyst-declared); the
// source's global concurrency is scaled at the selected width, so it is not an
// anchor-stated per-chip load. Numeric fields remain unchanged.
// External adversarial review 2026-07-27: re-minted all 180 states after the
// renderer began consuming the exact branded capacity solve selected by the
// placement-aware solver. The former renderer silently recomputed uniform
// residency and disagreed with its solver in 1,254/1,440 sampled-policy rows.
// Re-minted after correcting the full-memory receipt to name the flat 10%-HBM
// reserve that the solver actually applies. Numeric quantities are unchanged.
// External adversarial review 2026-07-27: re-minted after capacity switched
// from representative decode L to terminal peak-KV LPeak. 52/180 scenario
// pairs move; every affected margin decreases, while the default remains exact.
// Re-minted after replacing obsolete R1/R2/R3 promises in claim-bearing
// capacity receipts with current-state limitation language. All 180 numeric
// margin/cost leaves remain byte-identical; only receipt prose moves.
// b9 M5 (delta manifest, family sliders + algorithmic-lead prior + interlock; memo v2.1
// §§8-13, design gate closed at 28d4b25): the WIDE 180-state hash MOVES BY DESIGN — this is
// the milestone whose acceptance is that the default headline moves. Every clean state now
// seeds the ratified per-lab prior (plan §3), which multiplies achieved throughput by
// E = rate^(months/12) and therefore divides modeled cost by exactly E. The move is
// CHARACTERIZED, not merely re-minted: at the flagship reference the cost side divides by
// E(+3 @ 3x/yr) = 1.3160740129524924 EXACTLY (trendline-interlock-b9 T-1/T-8), the trend-0
// reference blend margin stays byte-identical 0.5918058739356502 (energy-model-b9 T7,
// custom-fleets-b9 T-2, form-equivalence-b9), and every numeric field of the FINAL-ANSWER
// object is byte-equal to its pre-M5 value under the memo-§15 reference pin
// (trendline-interlock-b9 T-9, 50/50 fields). Feasibility, declared batch, capacity and the
// status vectors are lever-invariant (T-4). All four source pins re-minted with it.
/* b9 spec-decode LEVER (§8.4/§9.5): the WIDE 180-state hash MOVES for the first time in this leg,
   and the move is CHARACTERIZED rather than merely re-minted. `feasibility().legs` gains ONE typed
   field — `specDec: {status, factorApplied, reasonCode}` — the canonical per-leg DTO §9.5 requires,
   because before it the promise that "every leg it does reach says so" had a surface on custom
   fleets only. NO NUMERIC LEAF MOVES, and that is EXECUTED, not asserted: recomputing this hash with
   the new field STRIPPED from every leg reproduces the prior baseline
   7c2f7455d6869503ea4195642caf2bff41e53ae74d15a46466495a6183c7329f bit-for-bit. The tripwires
   re-derive exact at 59.18058739356502 / 68.98395363429421 with membership 7/0/100, and T-1's
   pre-leg oracle is byte-identical, so the default path is untouched by an additive DTO. */
/* a-im-legibility RE-MINT (2026-08-16, owner notes aa315c + c72950 and his 11 markup
   annotations on the staged preview). The WIDE grid GROWS 255 -> 270 because one exploration
   route is ADDED — x90-v2, the 90->95% claim's own batch mechanism applied alone, which the
   v2.1.3 redesign had dropped. RE-MINTED ON MEASURED DELTA EVIDENCE, not on assertion, exactly
   as row 514 was: the 255 pre-existing states were hashed with x90-v2 excluded and are
   BYTE-IDENTICAL to the prior baseline eb8bf29a…54beb08 (MATCH true), 15 states added, 0
   removed, 0 moved. Both tripwires re-derive exact — median 68.98395363429421, dive
   59.18058739356502. Evidence + the reproducing script:
   orchestration/backlog-recovery/day-2026-07-28/im-legibility/render-parity-delta.{mjs,txt}.
   The four source pins move with it, and NO OTHER RENDERED QUANTITY DID. What moved in those
   files is what the page SAYS: the four existing routes carry their claimants' names again
   (typed claimAnchor into MARGIN_CLAIMS; the vectors stay page-authored and every note says
   so); GB300's declared batch and its 36-128 sensitivity are disclosed on the leg and under
   the per-generation chart (q-im-fp4-gb300-batch-disclosure); the GB200/GB300 efficiency
   coefficients are relabelled FP4-basis (q-im-fp4-gb200-eta-basis — relabel only, the ruling
   says so and the headline proves it); the H800 row states that its NVLink export cap is
   modelled nowhere; every round-over-round passage is gone from every rendered surface (his
   standing rule: version history belongs in the changelog); the methods-box duplicate is cut;
   and the two estimate cards plus the stress test are hoisted above the answer tile, collapsed. */
/* d-im-h800 2026-08-18 (owner note aca09d — the H800/H100 differential as a NAMED, ADJUSTABLE
   assumption): all four source pins + the WIDE grid hash re-minted. WHAT MOVED, executed:
   the WIDE 270-state hash changes ONLY because every feasibility leg gains ONE typed field,
   `nvlinkCap` {lineage, reasonCode, ratio, decode:{factorApplied, rooflineRatio}, prefill:{…}} (the specDec DTO precedent). Stripping that
   field from every leg reproduces the prior baseline 3fbf8ec5… EXACTLY (916/916 legs carry it,
   both phase factors 1 on all of them, codes h800:capped-anchor / h100+h200:eligible-neutral /
   others:not-applicable), and both tripwires re-derive exact — instrument + output:
   orchestration/backlog-recovery/day-2026-07-28/im-h800/render-parity-delta.{mjs,txt}.
   engine.js: the `nvlinkCapMinRatio` lever (DEFAULTS 1.00, x*1.0===x; SCENARIO_BOUNDS
   [1.00,1.50]; SPECIFIED lever; REFERENCE_LEVER_PIN 1.0), its ladder/copy/factor at the
   leverThroughputMult chokepoint (both phases), the per-leg DTO, nvlinkCapReadout, the TIPS
   entry + own SECTION, and the corrected HW.h800 display note. engine-data-v22.js: the closed set
   NVLINK_CAP_LINEAGES + `nvlinkCapLineage` on all 11 CALIBRATION rows (annotation, no η/obs/
   roofline field moved). app.js: per-leg lines, the control-side readout, the computed note under
   the hardware chart. index.html: ONE empty hidden <p id="chart-hw-nvlink-note"> beside the
   hardware chart (no static prose; the report-text extraction is unchanged). Sink registry
   465 -> 472 (7 sinks, same ten classes), regenerated. */
/* 2026-08-23 im-arc T3 — ONE FURTHER AUTHORIZED DELTA: stress-public-rate is
   re-based onto registry-evidenced sections + generic remainder (plan line 147).
   EXACTLY these stress records move; every other WIDE record is byte-identical:
   opus   59.18058739356502  -> 59.18554342189791  (+0.004956028332891993 pp)
   sonnet 56.00266539666010  -> 56.007378947679484 (+0.004713551019386308 pp)
   haiku  61.30226113713848  -> 61.305739164454565 (+0.0034780273160839315 pp)
   grok    8.613234810603954 ->  8.613234810603954 (0 pp; serialized record moves)
   Every |numeric margin delta| is <= 0.005 pp. The per-record proof below
   executes both grids; these pre-move pins remain named so history is legible. */
/* 2026-08-24 im-arc T4 fold — ONE FURTHER AUTHORIZED DELTA, and it is MACHINE-READABLE.
   The moved sinks are not listed here: they are enumerated, one { sink, old, new, cluster,
   evidence } entry each, in tests/fixtures-t4-declared-delta.json, which this file CONSUMES —
   so a number can only move if that manifest says it moved and why. The manifest also records the
   pre-fold receipt this delta starts from (22baff37…, 273 states on merged master ad7a214) and the
   exact pre-fold default bundle, and tests/t4-historical-pins.mjs turns that bundle into the state
   overlay every historical reading reproduces through. Registry arithmetic is inside the delta:
   the three region triples, the C1 region fill, the C2 inheritance and the three planning rents
   that resolve as unavailable all move selected-scenario arithmetic even where the page-open
   scalar middle is unchanged. Coverage prose and programme notes are listed separately in the
   manifest as evidence-only changes. */
/* ============ REC 7: THE CORRECTION IS DERIVED AND MAPPED, AND DELIBERATELY NOT APPLIED HERE ============
   GPT Pro review pr-20260902T173936Z-a81123 was right that dating a stale scalar does not
   historicalize it, and right that the value is wrong: xAI's first-party page
   (docs.x.ai/developers/models/grok-4.5, read 2026-09-02 by the reviewer and independently by this
   leg) lists Input $2.00 / CACHED INPUT $0.30 / Output $6.00 — a 15% cached-read ratio against the
   25% this engine computes with.
   IT WAS APPLIED, MEASURED, AND THEN BACKED OUT, for a reason worth recording. The change is
   confined and provable — holding the engine fixed and toggling only that field, EXACTLY 15 of the
   270 WIDE states move, all grok, all 255 others byte-identical; the 12 grok baseline pairs re-mint
   and the other 168 recompute unchanged (enforced by a mint that refuses to write otherwise).
   But the cascade does not stop at the surfaces a data change is supposed to touch: it also breaks
   T4-REPRO-R1/R2 — the assertions that the LIVE engine plus the pre-T4 pin bundle still reproduces
   a HISTORICAL receipt. Re-minting those to accommodate a live tariff correction would be weakening
   a provenance guarantee to make a data change pass, which is the one trade this project should
   never make. Whether the pin bundle is meant to insulate history from live model data — and is
   failing to — is itself a finding, and it needs the T4 design read rather than a hash swapped at
   the end of a long pass.
   So the ACTIVE value stays 25 and every pin below stays where it was, while the engine now
   DISCLOSES the staleness in typed form (tariff.activeValueIsStale / cacheReadMultVerified) and in
   the model note a reader sees. The work is banked, not lost: the exhaustiveness proof, the
   confined mint and the cascade list are in BACKLOG §2 for whoever runs the data milestone.
   ======================================================================================================= */
/* ============================================================================================
   2026-09-10 RENT ADOPTION — owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok,
   answering card q-im-unpriced-legs-and-grok-cache. EVERY WIDE hash below re-mints, and this is
   the delta evidence the pins demand before anyone touches them:

     * 72 of the 180 model x perspective pairs move; 108 are byte-identical.
     * EVERY moved pair is explained by one of exactly two causes, asserted mechanically in
       tests/traffic-contract.test.mjs against an archived pre-adoption fixture: it carries one of
       the three adopted legs (gb200, gb300, trn3), or it is a Grok state WITH CACHE ON, which the
       cacheReadMult correction 25% -> the published 15% reaches because that field is a BILLING
       input. The set of pairs that moved for any other reason is EMPTY.
     * No published Grok reading moves, because every published Grok operating point runs at the
       dive's Uncached 3:1 / 0% convention and a cache-read price has nothing to multiply there.
     * The three T3FIX2-B2 stress records still differ from their projection by the same ~0.005 pp
       rounding artifact they were declared for, and by nothing else.

   The two SOURCE freezes re-mint with them: site/engine.js carries the Grok correction, the
   knownStaleInputs resolution, the derived §C2 relation and the recomputed preset notes;
   site/engine-data-v22.js carries the prefill carry disclosure. site/engine-data-dc-v1.js is where
   the three adopted quotes live and is not under a whole-file freeze.
   ============================================================================================ */
/* ============================================================================================
   RE-MINTED 2026-09-19 by leg im-vet-model-estimates, under the Polaris gen60 ruling relayed at
   ~20:1xZ: "the code leg is gone, so you are the last writer … re-run the site suites + the 1pp
   reproduce check, then LAND on master". im-vet-code closed at 19:22:56Z with its gate passed, so
   the fold that would normally re-mint these no longer exists; this leg holds the before and after
   values and the delta evidence, and records both here rather than leaving the corrections unable
   to ship.

   WHAT MOVED, AND WHY — three commits, one cause each, all of them INPUT corrections, none of them
   a coefficient, a rent, a utilization or a stack multiplier:
     1. Five presets carried a list price their vendor no longer charges, verified live on each
        vendor's own page on 2026-09-19 and corrected: gpt $5/$30 → $4/$20, terra $2.50/$15 →
        $2/$12, luna $1/$6 → $0.20/$1.20, dsv4 $0.435/$0.87 → $0.66/$1.98 off-peak, dsv4f
        $0.14/$0.28 → $0.15/$0.60 off-peak (dsv4's cache-read multiplier 1 → 3.33 with it).
     2. The two Zhipu rows' DEFAULT traffic moved ncode → reference. TRAFFIC_OSL.ncode derives
        ISL 81,000 / decode L 86,062 from one observed week and is the only profile on the page
        with a sourced absolute length; those two rows were priced at 86× the context of every row
        beside them. The profile itself is untouched and still selectable.
     3. grok and glm47 gained a `lensScenario` flag and its label. That one changes no number at
        all — it is a disclosure — but it edits site/engine.js, site/app.js and three MCP sources,
        so the whole-file pins move with it.

   WHY EVERY PIN BELOW MOVES, including the ones named "pre-": these are not stored historical
   numbers, they are the CURRENT engine re-rendered under historical settings (`asPreT4`,
   the pre-stress and pre-move projections). Settings are what they hold fixed; the model presets
   are read live. A preset price is therefore in every one of them by construction, and a pin that
   did NOT move under a price correction would be the surprising result.

   THE SHAPE OF THE MOVE IS ASSERTED, NOT ASSERTED AWAY. tests/traffic-contract.test.mjs compares
   all 180 baseline pairs against tests/fixtures-baseline-v22-pre-tariff-correction.json and
   requires: 92 moved / 88 byte-identical; 60 of them the five corrected rows with ONLY
   priceIn/priceOut/margin/cacheReadMult differing; 20 of them the two Zhipu rows with ONLY
   margin/ioRatio/cacheHit differing; 12 of them grok's stale cacheReadMult and nothing else; and
   the set that differs for any other reason EMPTY. So no utilization, rent, regime or architecture
   drifted in behind these hashes, and that is checked rather than promised.

   The 1pp reproduce contract holds: README's dsv4 dive example recomputes and the README states
   the value it now produces, asserted in tests/snapshots.test.mjs.
   ============================================================================================ */
const PRE_T3_STRESS_270_SHA256 = "1aa0da686d4b1358f7eeeff43179951fd8f6a37ebf390c1e5a95e3d82e7cc6b9";  // re-minted 2026-09-20 by im-vet-six-repairs (program bq-2835, vetting findings E1/E2/E3/E4/E5 + the N1 vocabulary release edit); see the declared-delta block at the head of this file
/* RE-MINTED 2026-09-19 for the im-vet-0919 Astra round-1 fold (pack A P1-3). The three hashes
   below are exactly the grids that contain capital-recovery states, and they moved because
   capitalRecoveryFactor() now evaluates r / -expm1(-L·log1p(r)) instead of the textbook
   r(1+r)^L / ((1+r)^L − 1). The textbook denominator cancels to EXACTLY ZERO once 1+r rounds
   to 1, so costOfCapitalPct = 1e-15 — an in-bounds value under SCENARIO_BOUNDS [0, 40], i.e. a
   shareable link — returned CRF = Infinity and a NaN margin. DELTA EVIDENCE, measured against
   a copy of the pre-fold engine over every model x perspective x {rent, TCO at 6/8.5/13%}:
   1152 states compared, 412 margins moved at all, and the maximum movement was
   8.882e-13 PERCENTAGE POINTS (worst state glm47/x60-v3 at 13%: -1120.689815260666 vs
   -1120.689815260667). That is last-digit floating-point noise twelve orders of magnitude
   below the one-decimal display, and it moves TOWARD the accurate value — the new form loses
   no significant digits where the old one cancelled them away. The two 270-state pins below
   did not move at all. Behaviour that DID change: tiny rates now render instead of returning
   NaN. Guard: tests/vetting-0919-robustness.test.mjs. */
const PRE_T3_STRESS_273_SHA256 = "2eb28bf446002b0a2676ac7c4e9016eb0aed1b6914ff232bffdfcf37ce42ec9d";  // re-minted 2026-09-20 by im-vet-six-repairs (program bq-2835, vetting findings E1/E2/E3/E4/E5 + the N1 vocabulary release edit); see the declared-delta block at the head of this file
const HISTORICAL_270_SHA256 = "82491c89300d5d6bf014c7092d034006a8ea4e55c8fe5b369c61c2b9dd1d6a6e";  // re-minted 2026-09-20 by im-vet-six-repairs (program bq-2835, vetting findings E1/E2/E3/E4/E5 + the N1 vocabulary release edit); see the declared-delta block at the head of this file
const BASELINE_SHA256 = "06576ccb130179171808860625808491f460c9e56e56d5dcbb2278724492d09d";  // 298 states;  // re-minted 2026-09-20 by im-vet-six-repairs (program bq-2835, vetting findings E1/E2/E3/E4/E5 + the N1 vocabulary release edit); see the declared-delta block at the head of this file
const PRE_T2_ELECTRICITY_SHA256 = "52547e367783f12dfb1ff1633f1d41094c69a58caf9194d568b0229499b75166";  // re-minted 2026-09-20 by im-vet-six-repairs (program bq-2835, vetting findings E1/E2/E3/E4/E5 + the N1 vocabulary release edit); see the declared-delta block at the head of this file
/* im-arc T4 fold (2026-08-24), memo §6 [F11] — MINTED FROM THE GENERATOR, not from a promise.
   The fold expands the scenario surface (a capital-recovery switch at three declared rates, four
   PUE classes, both capex-scope semantics, the three unavailable-rate paths and their declared
   replays, the GB200 alternate class, nine region corners and the full pre-fold bundle), so the
   generator now emits 298 states. The memo says to call the fresh receipt "273-state" ONLY if the
   generator still produces 273 — it does not, so this is a 298-state receipt and is named as one.
   The historical 270-state grid is untouched: it is `states.slice(0, -auditStates.length)`, and
   what grew is the tail. */
const EXPECTED_STATES = 298; /* 270 registry states (15 models x 18 perspectives) plus the three
   im-arc T2 generic-owned-TCO electricity audit states plus the twenty-five im-arc T4 fold audit
   states the block above appends (4 capital-recovery + 4 PUE classes + 2 capex-scope semantics +
   4 unavailable-rate/replay + 1 GB200 alternate class + 9 region corners + 1 pre-fold bundle):
   270 + 3 + 25 = 298. The sum is written out because the two older clauses below describe a
   273-state grid and stop being self-explanatory once a third tranche of audits lands. Row 514 originally expanded the registry:
   the two SELF-AUTHORED
   round-3 adjudicator presets (gptpro-r3, fable-r3) added. RE-MINTED ON MEASURED DELTA EVIDENCE, not
   on assertion: the 225 pre-existing states were hashed before and after and are BYTE-IDENTICAL
   (cc42d9a3dd02fd67665e96f05cd83785b9b9784df85e8c6b55d1bbb6ab9c3b4c both sides), 30 states added, 0
   removed, 0 moved. Evidence + the reproducing script:
   orchestration/backlog-recovery/day-2026-07-28/row514-round3/render-parity-delta.txt */

const wideRecord = (m, p, state, ctx) => {
  const w = E.workload(state, undefined, ctx);
  /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §0 I-1): composition is
     an additive typed contract. The historical WIDE digest continues to bind every
     pre-T2 field byte-for-byte; the new fields are asserted separately so adding
     required metadata cannot be mistaken for a numeric move. */
  const legacyW = { ...w, fleetRenderable: { ...w.fleetRenderable } };
  delete legacyW.composition; delete legacyW.coverage;
  delete legacyW.procurementBasis; delete legacyW.bases;
  delete legacyW.fleetRenderable.sections;
  const hasSectionContract = Array.isArray(w.composition) && w.composition.length >= 1
    && w.composition.every(row => row.basis && row.basis !== "inherit");
  const f = E.feasibility(state, ctx);
  const bc = E.blendedCosts(state, undefined, ctx);
  return { hasSectionContract, record: [m.id, p.id, legacyW, f.legs, f.renderableLegs, bc.cIn, bc.cOut,
    bc.fleetRenderable ? [bc.fleetRenderable.renderableLegs, bc.fleetRenderable.totalLegs, bc.fleetRenderable.renderableWeightShare] : null,
    E.fleetRenderableClause(bc.fleetRenderable, true),
    // R2 re-mint: the retired legacy width clause is replaced by the welded policy
    // clause in the hashed surface (manifest row; same three-clause coverage).
    E.policyCapacityClause(bc.fleetRenderable),
    E.fleetRenderableDisclosure ? E.fleetRenderableDisclosure(bc.fleetRenderable) : null,
  ] };
};

const states = [];
const projectedRegistryStates = [];
let sectionContracts = 0;
for (const m of E.MODELS) {
  if (m.id === "custom") continue;
  for (const p of E.PERSPECTIVES) {
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const ctx = E.scenarioContext(s);
    /* T3 FIX-2 B2: the authoritative WIDE record always hashes the live,
       WeakMap-registered state. A clone exists only as the named pre-move oracle
       used by the exact per-record delta proof below; it never feeds `states`. */
    const projectedState = p.id === "stress-public-rate" ? structuredClone(s) : s;
    const projected = wideRecord(m, p, projectedState, ctx);
    const live = wideRecord(m, p, s, ctx);
    states.push(live.record);
    projectedRegistryStates.push(projected.record);
    if (live.hasSectionContract) sectionContracts++;
  }
}

const liveVsProjectedMovement = states.flatMap((live, index) => {
  const projected = projectedRegistryStates[index];
  return JSON.stringify(live) === JSON.stringify(projected) ? [] : [{
    model: live[0], perspective: live[1],
    projectedMarginPct: projected[2].margin * 100,
    liveMarginPct: live[2].margin * 100,
    deltaPp: (live[2].margin - projected[2].margin) * 100,
  }];
});
const projectedRegistryHash = crypto.createHash("sha256").update(JSON.stringify(projectedRegistryStates)).digest("hex");
const liveRegistryHash = crypto.createHash("sha256").update(JSON.stringify(states)).digest("hex");
/* im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
   the three records re-mint with the adopted rents, and THE PROPERTY IS UNCHANGED — the same three
   model/perspective pairs, no more and no fewer, each still differing from its projection by a
   sub-0.005 pp rounding artifact. The magnitudes even keep their sign convention flipped the same
   way (the live value is now fractionally ABOVE the projection rather than below, because the
   registry composition the stress preset reads is priced differently). What this gate exists to
   forbid — a NEW pair entering the set, or a delta escaping 0.005 pp — is still forbidden. */
/* im-vet-six-repairs (2026-09-20) re-mint: the three records move with the Trainium withdrawal
   and the TPU numerator repair, and THE PROPERTY IS UNCHANGED for the second release running —
   the same three model/perspective pairs, no more and no fewer, each still a sub-0.005 pp
   rounding artifact against its own projection. What this gate forbids — a NEW pair entering the
   set, or a delta escaping the relative bound — is still forbidden, and opus's artifact actually
   SHRANK (0.0064 -> 0.0015 pp). */
const expectedStressMovement = [
  { model: "opus", perspective: "stress-public-rate", projectedMarginPct: 58.41067415764696,
    liveMarginPct: 58.41215402451034, deltaPp: 0.001479866863385304 },
  { model: "sonnet", perspective: "stress-public-rate", projectedMarginPct: 53.84594522307161,
    liveMarginPct: 53.850658774090995, deltaPp: 0.004713551019386308 },
  { model: "haiku", perspective: "stress-public-rate", projectedMarginPct: 59.39050075754749,
    liveMarginPct: 59.39397878486359, deltaPp: 0.0034780273160950337 },
];
/* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the declared stress set narrows
   from four records to THREE. The reason is the fold, not a widening
   of the gate: `stress-public-rate` composes its fleet FROM the registry, and the registry moved
   (three region endpoint sets, the C1 region fill, the C2 inheritance, the C1 mixed aggregate that
   allocates no weights). Grok's stress record no longer moves at all: Colossus C1 states its inventory as one unsplit mixed aggregate, which allocates no fleet weights, so the composed Grok stress fleet is now identical to its projection. The BOUND is
   unchanged and is what keeps this a delta rather than a licence: every |margin delta| is still
   under 0.005 pp, asserted on the same line. */
/* THE BOUND IS RELATIVE NOW, and that is a tightening rather than a widening (im-release-edit-r2,
   2026-09-10). The absolute 0.005 pp ceiling was minted against readings near 51%; the rent adoption
   moves the same readings to ~58% and the artifact scales with them, so opus reaches 0.0064 pp and
   the fixed ceiling fires on arithmetic that has not changed in character. Widening the constant to
   0.007 would buy silence and would have to be bought again at the next move. The artifact's real
   size is its RATIO to the reading, and that is stable across both regimes — measured, not asserted:
   before, 6.8e-5 / 1.04e-4 / 6.6e-5; after, 1.10e-4 / 8.7e-5 / 5.8e-5. A 2e-4 relative bound holds
   in both and is roughly half the headroom the old constant had at 58%. The absolute ceiling stays
   as a backstop so a large reading cannot hide a large artifact behind a small ratio. */
assert("T3FIX2-B2 live-vs-projected per-record diff is exactly the three declared stress records",
  JSON.stringify(liveVsProjectedMovement) === JSON.stringify(expectedStressMovement)
    && liveVsProjectedMovement.every(row => Math.abs(row.deltaPp) / Math.abs(row.liveMarginPct) <= 2e-4)
    && Math.max(...liveVsProjectedMovement.map(row => Math.abs(row.deltaPp))) <= 0.01,
  JSON.stringify(liveVsProjectedMovement));
assert("T3FIX2-B2 live and pre-move 270-state hashes bind the executed grids",
  liveRegistryHash === HISTORICAL_270_SHA256
    && projectedRegistryHash === PRE_T3_STRESS_270_SHA256,
  JSON.stringify({ liveRegistryHash, projectedRegistryHash }));

/* im-arc T2 Commit C (memo §6): the historical 270-state registry has no unpinned
   owned-TCO state — 240 rows are rent and the remaining 30 are the explicitly pinned
   x90-v1/x90-v2 histories. Add the three commissioned generic-owned-TCO audit states
   to WIDE itself so the electricity-default move cannot hide behind that registry shape. */
const opus = E.MODELS.find((row) => row.id === "opus");
const nativeTraffic = { mode: "native", profileId: null };
const auditStates = [];
for (const perspectiveId of ["median", "gptpro-r3"]) {
  const perspective = E.PERSPECTIVES.find((row) => row.id === perspectiveId);
  const state = E.applyPresetSettings(opus, perspective, nativeTraffic);
  state.hwMode = "tco";
  auditStates.push({ id: `forced-tco:${perspectiveId}`, state, ctx: E.scenarioContext(state) });
}
{
  const traffic = E.resolveTraffic(opus, null, nativeTraffic);
  const state = structuredClone(E.DEFAULTS);
  Object.assign(state, { ioRatio: traffic.ioRatio, cacheHit: traffic.cacheHit, hwMode: "tco" });
  auditStates.push({ id: "generic-default:opus", state,
    ctx: E.makeScenarioContext(opus, traffic, state.customDonor) });
}
/* im-arc T4 fold (2026-08-24), memo §6 [F11]: the parity surface must EXERCISE what the fold
   added, or the receipt says nothing about it. These append to the audit tail, so the historical
   270-state grid stays byte-frozen (it is `states.slice(0, -auditStates.length)`), and each names
   the case it exists to cover. */
{
  const opusModel = E.MODELS.find((row) => row.id === "opus");
  const medianPersp = E.PERSPECTIVES.find((row) => row.id === "median");
  const t4State = (mutate) => {
    const state = E.applyPresetSettings(opusModel, medianPersp, nativeTraffic);
    state.hwMode = "tco";
    mutate(state);
    return { state, ctx: E.scenarioContext(state) };
  };
  const push = (id, mutate) => auditStates.push({ id, ...t4State(mutate) });
  /* capitalRecovery OFF and ON, and the cost of capital at both declared corners. */
  push("t4:capital-recovery-off", (s) => { s.capitalRecovery = "off"; });
  push("t4:capital-recovery-on-middle", (s) => { s.capitalRecovery = "on"; });
  push("t4:capital-recovery-on-cost-bottom", (s) => { s.capitalRecovery = "on"; s.costOfCapitalPct = 6; });
  push("t4:capital-recovery-on-cost-top", (s) => { s.capitalRecovery = "on"; s.costOfCapitalPct = 13; });
  /* Every PUE class band, INCLUDING the purpose-built-AI class fold [F4] restored. */
  for (const facilityClass of E.DC_SCHEMA.FACILITY_CLASSES)
    push("t4:pue-class-" + facilityClass, (s) => { s.pue = E.pueBandForClass(facilityClass).mid; });
  /* Each capex scope, exercised through the scope-derived overhead on a representative row. */
  push("t4:capex-scope-legacy-global", (s) => { s.capexScopeMode = "legacy-global"; });
  push("t4:capex-scope-scoped", (s) => { s.capexScopeMode = "scoped"; });
  /* The unavailable-rate paths and their DECLARED provisional replays. */
  push("t4:unavailable-gb200-gb300-trn3", (s) => { s.hwMode = "rent"; });
  push("t4:replay-gb300-6.00", (s) => { s.hwMode = "rent"; s.rentAbsLeg = { gb300: 6.00 }; });
  push("t4:replay-trn3-2.20", (s) => { s.hwMode = "rent"; s.rentAbsLeg = { trn3: 2.20 }; });
  push("t4:replay-gb200-4.50", (s) => { s.hwMode = "rent"; s.rentAbsLeg = { gb200: 4.50 }; });
  /* The GB200 alternate class — the on-demand public-slice / capacity-block span, never a default. */
  push("t4:gb200-alternate-on-demand-span", (s) => {
    s.hwMode = "rent";
    s.rentAbsLeg = { gb200: E.rentQuoteByClass("gb200", "on-demand-public-slice-and-capacity-block").usdPerHr.mid };
  });
  /* Region bottom / middle / top for every region whose endpoints moved. */
  for (const [regionId, region] of Object.entries(E.dcRegions()))
    for (const corner of ["lo", "mid", "hi"])
      push("t4:region-" + regionId + "-" + corner, (s) => { s.kwh = region.usdPerKwh[corner]; });
  /* The FULL pre-fold bundle, so the parity receipt itself carries a state that reproduces the
     pre-T4 arithmetic — the memo §6 requirement that a historical state reach every moved sink. */
  push("t4:pre-fold-bundle", (s) => { Object.assign(s, PRE_T4_OVERLAY); });
}
const auditSurface = ({ id, state, ctx }) => {
  const w = E.workload(state, undefined, ctx);
  const legacyW = { ...w, fleetRenderable: { ...w.fleetRenderable } };
  delete legacyW.composition; delete legacyW.coverage;
  delete legacyW.procurementBasis; delete legacyW.bases;
  delete legacyW.fleetRenderable.sections;
  const f = E.feasibility(state, ctx);
  const bc = E.blendedCosts(state, undefined, ctx);
  return ["__t2-electricity-audit__", id, legacyW, f.legs, f.renderableLegs, bc.cIn, bc.cOut,
    bc.fleetRenderable ? [bc.fleetRenderable.renderableLegs, bc.fleetRenderable.totalLegs, bc.fleetRenderable.renderableWeightShare] : null,
    E.fleetRenderableClause(bc.fleetRenderable, true), E.policyCapacityClause(bc.fleetRenderable),
    E.fleetRenderableDisclosure ? E.fleetRenderableDisclosure(bc.fleetRenderable) : null];
};
const preMoveAuditSurfaces = [];
const preT3StressStates = [...projectedRegistryStates];
const electricityMovement = [];
for (const audit of auditStates) {
  const current = auditSurface(audit);
  const old = auditSurface({ ...audit, state: { ...audit.state, kwh: 0.07 } });
  states.push(current); preT3StressStates.push(current);
  preMoveAuditSurfaces.push(old); sectionContracts++;
  electricityMovement.push({ id: audit.id,
    deltaPp: (current[2].margin - old[2].margin) * 100 });
}
const preMoveStates = [...projectedRegistryStates, ...preMoveAuditSurfaces];
const historicalHash = crypto.createHash("sha256")
  .update(JSON.stringify(states.slice(0, -auditStates.length))).digest("hex");
const preT3StressHash = crypto.createHash("sha256").update(JSON.stringify(preT3StressStates)).digest("hex");
const preMoveHash = crypto.createHash("sha256").update(JSON.stringify(preMoveStates)).digest("hex");
/* im-arc T4 fold (2026-08-24): the audit tail grew from three states to twenty-eight, so the T2
   electricity characterization is scoped to the three audits it was written for. The T4 audits
   are characterized by their own ids and by the declared-delta manifest. */
const t2ElectricityMovement = electricityMovement.filter((row) => !row.id.startsWith("t4:"));
const maxElectricityDeltaPp = Math.max(...t2ElectricityMovement.map((row) => Math.abs(row.deltaPp)));
const h = crypto.createHash("sha256").update(JSON.stringify(states)).digest("hex");
assert("R1 render parity (WIDE): historical grid plus commissioned T2 electricity audits match the characterized baseline",
  h === BASELINE_SHA256, `got ${h} over ${states.length} states — re-mint only with explicit behavioral/delta evidence.`);
assert("R1 render parity: state grid complete", states.length === EXPECTED_STATES, String(states.length));
assert("im-arc T2: every WIDE state carries one resolved section composition contract",
  sectionContracts === EXPECTED_STATES, `${sectionContracts}/${EXPECTED_STATES}`);
assert("im-arc T3 FIX-2: live 270-state WIDE surface matches the authorized stress re-base",
  historicalHash === HISTORICAL_270_SHA256, historicalHash);
assert("im-arc T3 FIX-2: pre-stress 270-state WIDE surface remains independently pinned",
  projectedRegistryHash === PRE_T3_STRESS_270_SHA256, projectedRegistryHash);
assert("im-arc T3 FIX-2: pre-stress 273-state WIDE surface remains independently pinned",
  preT3StressHash === PRE_T3_STRESS_273_SHA256, preT3StressHash);
assert("im-arc T2: pre-move WIDE surface is independently pinned",
  preMoveHash === PRE_T2_ELECTRICITY_SHA256, preMoveHash);
assert("im-arc T2: WIDE electricity movement is exactly the three commissioned unpinned TCO states",
  t2ElectricityMovement.length === 3 && t2ElectricityMovement.every((row) => row.deltaPp < 0)
    && maxElectricityDeltaPp > 0 && maxElectricityDeltaPp < 1,
  JSON.stringify({ t2ElectricityMovement, maxElectricityDeltaPp }));

// R1-impl R2 F1: PRESENTATION-FILE FREEZE — R1 has no business touching presentation
// files at all, so app.js, index.html, and every MCP source are pinned BY FILE HASH.
// This closes the DOM-prose / MCP-envelope / share-string surfaces completely and
// mechanically (any byte edit fails; legitimate edits belong to R2's shipment, which
// re-mints these alongside its delta manifest).
{ const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = new URL("../../", import.meta.url).pathname;
  const fh = (p) => crypto.createHash("sha256").update(readFileSync(join(root, p))).digest("hex");
  const indexRaw = readFileSync(join(root, "site/index.html"), "utf8");
  const releaseStamps = [...indexRaw.matchAll(/<span id="release-commit">([^<]+)<\/span>/g)];
  assert("R1 freeze: site/index.html has exactly one valid release stamp",
    releaseStamps.length === 1 && /^[0-9a-f]{7,40}$/.test(releaseStamps[0][1]),
    releaseStamps.map(m => m[1]).join(","));
  // deploy.sh writes the source commit before testing the exact release tree. Treat that one
  // provenance token as a parameter of the frozen page, while every surrounding byte remains pinned.
  const indexCanonical = indexRaw.replace(
    /<span id="release-commit">[^<]+<\/span>/,
    '<span id="release-commit">0d2f84c</span>',
  );
  const indexHash = crypto.createHash("sha256").update(indexCanonical).digest("hex");
  // External adversarial review 2026-07-27: re-minted after wiring the
  // final-answer DTO's rationale-annex id to a visible local link.
  // External adversarial review 2026-07-27: re-minted after adding keyboard
  // names and tabular alternatives to interactive chart marks.
  // Re-minted again after fail-closing malformed saved states, pinning the
  // active-parameter sweep's floating-point endpoint to the legal domain, and
  // exposing domain values/names on generated range controls.
  // Re-minted for the review shipment after the disclosure-table,
  // accessibility, and Turnstile token guards were made part of the surface.
  // Re-minted after replacing the last two inline style attributes with
  // named classes so the served CSP can reject un-hashed inline styles.
  // Re-minted after registered context-window failures gained a distinct,
  // source-backed no-number label instead of a false topology diagnosis.
  // b9 M3 (delta manifest, energy/electricity dimension): all four source pins below
  // re-minted. The FILES moved (energy surface + procurement-basis typing + methods-box
  // energy bullet); no RENDERED COST VALUE did — the reference blend margin is byte-
  // identical 0.5918058739356502 at both hashes (energy-model-b9 T7) and every rent-lens
  // number is byte-invariant under kwh/pue sweeps (T1). Re-minted again at the gate fix round
  // (P1 displayedProcurementBasis + chip label; engine.js/app.js only).
  // b9 M4 (delta manifest, custom fleet builder; memo research/b9-m45-ui-memo.md v2.1,
  // design gate closed at 28d4b25): all five source pins re-minted. The FILES moved
  // (custom-fleets leg path + hbmBytesOverride channel + codec v6 + builder UI + the
  // custom-fleets.js script tag); no RENDERED VALUE did — the WIDE 180-state workload
  // hash above is UNCHANGED, the reference blend margin is byte-identical
  // 0.5918058739356502 (custom-fleets-b9 T-2), and resolveFleetLegs is the proven
  // identity refactor for every non-custom-fleet state.
  // b9 M4 impl-gate fold (round-1 FAIL, 3xP0/7xP1/1xP2 closed — manifest §0-pre):
  // app.js + engine.js pins re-minted for the fold edits (mirror re-seed, feasibility
  // through resolveFleetLegs, energy channel merge, panel chips/divergence, live
  // validation, spec table). The WIDE 180-state hash was TRIPPED mid-fold by a
  // speculative legLabel field on feasibility legs and RESTORED by dropping it —
  // the baseline hash above is UNCHANGED; no rendered quantity moved.
  // b9 M5 implementation-gate round-1 fold (PASS-WITH-FIXES, 0×P0/2×P1/1×P2): app.js +
  // engine.js pins re-minted for the three folds — the captured MODIFIED_TREND_BASELINE
  // (P1-1), the shared closed-domain lever validator the ENCODER now runs before minting
  // (P1-2), and the reference-basis label on the form-correction span (P2). The WIDE
  // 180-state hash is UNCHANGED by the fold: no rendered quantity moved.
  // b9 M5 fix-verify fold (P1-2 codec closure + P2 page-wide reference labeling): app.js,
  // engine.js and the MCP concat pins re-minted. The WIDE 180-state hash is UNCHANGED — the
  // fold adds an encoder self-decode assertion and names the basis on three board surfaces;
  // no rendered QUANTITY moved (the live central figure the board now shows beside the
  // pinned one is the engine's own default, already covered by the WIDE surface).
  /* b9 M6 (FA memo §9): engine.js, app.js, index.html and the MCP concat pins are RE-MINTED for the
     FINAL-ANSWER rework, the D-7 exec summary and the §20 explain surface. COPY + PRESENTATION +
     TEST-SURFACE ONLY: the WIDE 180-state hash above is UNCHANGED, and it hashes ENGINE quantities
     (workload / feasibility / blended costs / renderable + policy clauses across every model x
     perspective). No computed value moved — that is M6's own no-value-move bar, and this is where
     it is visible. */
  // b9 spec-decode LEVER ([N-CORRECTION-LIFETIME], manifest row 15): re-minted for the browser's
  // correction transaction — the single `activeCorrection` record, clearActiveCorrection (which
  // removes the rendered notice as well as the variable, because a non-rebuilding slider edit would
  // otherwise leave a stale notice on screen), commitScenario as the ONE write path from a sanitize
  // result, all THREE enumerated producers wired, and the row-15 notice rendered adjacent to the
  // control from the engine-owned formatter. Also the required follow-through on
  // restoreSavedPresetState's new {state, corrections} contract. No rendered value moves.
  // b9 spec-decode LEVER (D-SD-7 UI row, section 6.2): re-minted for THE GATE'S DOM BEHAVIOUR — the
  // gate feeding the SAME `locked` boolean the range and its ticks consult, gated ticks actually
  // `disabled` rather than merely inert, the reset-on-move-off at the one slider-machinery
  // chokepoint, reconcileSpecDecRow (which replaces ONE sibling row so a stackMult drag never loses
  // pointer capture), role="group" + aria-labelledby/describedby on the gated row, and the jump
  // narrowed to VALUE controls so it stops landing on the row's own explanation button. The info
  // button stays ENABLED by design. No rendered value moves; the engine backstop was already total.
  // b9 spec-decode LEVER (§9.5): re-minted for the PER-LEG DISCLOSURE on the two fleet surfaces
  // that never had one — buildBlend's hw-row (default and named fleets) and cfPerLegPanel (custom).
  // Rendered only for legs actually in the mix: a 0%-weight leg is not part of this reading, and a
  // credit disclosure on it would answer a question the reader did not ask. Copy comes from the ONE
  // engine-owned formatter; the DTO the engine attached carries codes only.
  // b9 spec-decode LEVER: re-minted for (a) A LIVE DEFECT FIX IN SHIPPED CODE — leverLockState
  // compared a null group against a null locked-group, so in the DEFAULT `free` interlock state 19
  // of 28 controls rendered `disabled` with a why-line reading "🔒 undefined Use …". Pre-existing
  // since M5 (byte-identical at 7a68442); found by this leg's CDP probes, which were the first tests
  // ever to assert that a control is ENABLED. (b) clearSpecDecResetNotice, which removes the RENDERED
  // reset line and not merely the variable — clearing a flag is not clearing a notice.
  // b9 UX-A (§20 R-1/R-2/R-3; memo §16): re-minted for the ONE explanation-dialog coordinator and
  // the tooltip reachability fix. NO COMPUTED VALUE MOVES — the WIDE 180-state hash above is
  // unchanged and both tripwires re-derive exact at 59.18058739356502 / 68.98395363429421.
  // What changed and why it had to: (a) showTip()'s clamp was one-sided on BOTH axes — the outer
  // max(8,…) guarded the pointer-derived term, not the clamp — so TIPS.specDec (3,352 chars,
  // 1,328px tall) rendered at top:-494px in an 844px viewport with pointer-events:none, i.e. the
  // BEGINNING of the note was unreachable by any means; at 320px every tooltip was also 10px off
  // horizontally. (b) .info gained a click route to the full text, because on coarse pointers no
  // hover exists at all. (c) M6's dialog closed through a private closure and removed by its own
  // marker; with a second dialog client that can leave two dialogs open and strand a returnFocus,
  // so both entry points now route through one idempotent close. M6's payload construction is
  // byte-unchanged and tests/fa-explain-cdp.test.mjs passes COMPLETELY UNMODIFIED.
  /* b9 UX-B (§20 R-1/R-3/R-4; memo §17): re-minted for the #report R-4 restructure, the document
     explainer routes and the first REAL relocation. NO COMPUTED VALUE MOVES — the WIDE 180-state
     hash above is UNCHANGED and both tripwires re-derive exact at 0.5918058739356502 /
     68.98395363429421. Claim-bearing sinks are 390 BEFORE and 390 AFTER, with the ten-class set
     unmoved: UX-B adds no emission at all, because relocation moves an already-rendered, already-
     classified node instead of rendering a second copy of it.
     What moved in each file, and why it had to:
     (a) index.html — the ten sections gain `<details class="report-section">` + a single named
         `.report-section-body`, with the `<h3 id="sN">` deliberately left OUTSIDE as a direct child
         of #report so both MCP slicers keep cutting h3 -> next h3; and #board-catalog gains one
         wrapper so the catalog's honesty note travels with the grid it governs instead of being
         left behind. No copy, no number, no content node added or removed.
     (b) app.js — the payload registry, explainRelocate() with recovery coordinates, restore made a
         real transaction (removal is now CONDITIONAL on every source being back in the document —
         the old best-effort path would have DELETED a relocated node with the dialog), idempotent
         trigger injection, the deep-link handler and the print snapshot.
     (c) the MCP concat pin — the class-scoped `details.report-section > summary` strip, added
         byte-identically to BOTH runtime htmlToText helpers. Gate-A ruled re-minting this in UX-A
         unsupported movement precisely because the helper work belongs to THIS leg. The delta
         evidence is executed, not asserted: mcp-server/test/report-text-parity.test.mjs holds all
         eleven ids (report-s1..s10 AND front-page) byte-identical to the bedcc23 capture in
         NORMALIZED text, byte-identical to a re-derived sidecar in RAW text, equal between Node and
         Worker, with the six §10 provider summaries surviving — and a negative control that FAILS
         with the strip disabled. */
  /* MIX-BAND RE-MINT (owner ruling q-sliders-fleet-util-point, 2026-08-09; delta manifest
     research/b9-delta-manifests/mix-band-delta-manifest.md). The FILES moved; no RENDERED VALUE
     did. Measured on both tools rather than argued: verify/pair-hashes.mjs base-vs-head gives
     {pairs:255, moved:0, new:0, removed:0}, and verify/link-stability.mjs gives
     {pairs:255, moved:0, unresolvable:0, worstDelta:0} — which is the load-bearing one here,
     because dialRanges is PERSPECTIVE SPACE and gptpro-ctx gained three keys, exactly the class of
     change that silently moves a link somebody already shared. DEFAULTS untouched, so no epoch bump.
     What is new: mixBand's polytope derivation, blend.* dial ids reaching dialBounds (and therefore
     the sanitizer and the codec), the guard that keeps blend ids OUT of dialsFromRanges, the
     #out-mix-band readout, and per-leg share range handles. */
  /* CONSULT-ENACTMENT re-mint (owner ruling q-sliders-fleet-util-point + the 2026-08-10 dual consult;
     delta manifest research/b9-delta-manifests/mix-band-delta-manifest.md). engine.js: the exactness
     criterion moved from an affineness probe to a SURVIVOR-SET REGIME check (the consult's argument:
     with the renderable set fixed, renormalizing makes the objective linear-fractional, which still
     attains extrema at vertices), author-declared intra-family `split` support, and BOTH arms'
     declared blend ranges on gptpro-r3 and fable-r3. app.js: reference/envelope vocabulary, the
     derived-fleets overlay behind its toggle, the live-blend base so the readout describes what is
     on screen, and the compounded band's mix-held-at-point disclosure. NO PRE-EXISTING RENDERED
     VALUE MOVED — 255/255 pair hashes and 255/255 saved links unchanged; the new numbers are the two
     presets' own mix envelopes, which did not exist before. */
  /* b9 UX-C (memo §18, v6 + R6 addendum): app.js pin re-minted for the typed three-region tail
     (TAIL/commitTail + the split write sites), the two-source tile-tails POPUP-SPLIT payload,
     and the whole-lifecycle close-path redesign (transactional restore, stranded phase,
     boolean guards at every census site, the leveled replay dispatcher, downgrade
     continuations, NAV_INTENT). PRESENTATION + LIFECYCLE ONLY: the WIDE 180-state hash above
     is UNCHANGED (it hashes engine DTOs, which this leg never touches), index.html is
     UNTOUCHED (MCP front-page reads the whole file), and U-C0 pins the tail textContent
     byte-identical to the pre-implementation fixture across 21 states — no rendered value
     and no rendered BYTE of the fresh-state tail moved; the one declared behavioral delta is
     the incompatible-branch pair-clear (§18.1 P0-1/§18.10 P0-d), asserted separately. */
  /* M8 RECONCILIATION re-mint (2026-08-12, d-im-m4, bq-251): the master line (mix-band +
     consult enactment, pinned e54d6a4a…) and the v22-reengineer line (UX-C typed tail +
     close-path lifecycle, pinned 250b280f…) merge here; site/app.js is the union of both
     change-sets (renderAll keeps UX-C's pending-escalation guard AND the master line's
     renderMarginBand in the chain). Both parents’ provenance blocks above are preserved;
     the pin below is the sha of the MERGED bytes. Graded by the full chain before commit. */
  /* OWNER-ANNOTATIONS re-mint (2026-08-17) — see the block above the index pin for the per-
     annotation account. app.js gains the chart-bar jump affordance, the spec-decode gate jump,
     the one-line three-handle range control, the short-subject write and the load ops; the WIDE
     270-state hash above is unchanged and both tripwires are exact. It ALSO narrows the
     low-evidence jump's control search by `.low-evidence-jump`, which T-14 demanded rather than
     inspection finding: the gate-unlock button is enabled inside a row whose every value control
     the gate disables, so the search focused the button instead of the row. A jump affordance is
     never the control an affordance is for — the same reason `.info` was already excluded — and
     T-14's guard on the two utilization rows proves they still focus `util` exactly as before. */
  /* TILE-POSITION re-mint (2026-08-18, d-im-tile) — owner ruling q-im-tile-position, verbatim:
     "The 83% tile should be at the top, alongside fable estimate, as I described in note 11". That
     answers the POSITION half of annotation nad7e98, the one item the 2026-08-17 annotations leg
     left needing a ruling. app.js moves TWO things and computes nothing new: the load-scroll intent
     now targets ".tile-hero" (with ".hero-row" kept only as a fallback) because the headline tile
     left that row, and syncHeroFull() owns the content-dependent visibility of the tail collapse —
     the same rule syncTailTrigger() already follows, so a summary line never opens onto nothing.
     No emitter is added, moved or renamed; the WIDE 270-state parity hash above is UNCHANGED and
     both tripwires re-derive exact, which is the executed evidence that no rendered quantity moved.
     The sink registry is untouched (465, same ten classes): neither edit matches a sink channel. */
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): re-minted
     for paired basis cards/tables, visible rent segment, rent toggle and basic/advanced controls.
     The WIDE 270-state digest above remains byte-identical. */
  /* im-arc T1 fix (Sol review 2026-08-22, findings P1-1/P1-2/P1-3/P2-3):
     re-minted for the signed rent presentation, compounded counterpart, shared rent labels and
     contextual clear-button names. The WIDE digest above remains byte-identical. */
  // im-arc T1 director fix (fix-verify 2026-08-23, P1-1 residual): app.js pin re-minted for the
  // stackTableCells helper + the accessible stack-table row builder (displayed cells now sum to the
  // displayed total). Presentation only: the WIDE 270-state hash above is UNCHANGED.
  // Re-minted again for round 2 (residual computed from the amounts fmt$ rounds to — locale-independent —
  // and the column header disclosing it as a residual). WIDE still UNCHANGED.
  // Round 3: rent-on rows print all cells at uniform 3 decimals (toFixed, never locale-grouped) with an
  // exact closing residual; toggle-off branch byte-identical. WIDE still UNCHANGED.
  // Round 4: the raw signed rent − modelled TCO rides every rent-on bar tooltip (the header's promise). WIDE still UNCHANGED.
  /* im-arc T2 Commit B (memo §7): re-minted for the section builder, composition
     receipt, mixed electricity disclosure, and no-number DOM controls. AS OF T2 the historical
     270-state component remained exactly f98b97a1…. SUPERSEDED BY im-arc T4 fold (2026-08-24):
     the fold moved the generic defaults, so the LIVE 270-state component is no longer f98b97a1…
     and this line is kept only as the T2 entry in this changelog. f98b97a1… is not abandoned —
     it is re-earned by execution in tests/t4-receipt-reproduction.test.mjs, which reproduces it
     from the live engine plus the generated pre-T4 pin bundle. */
  // im-arc T2 director fix (browser suite B-8, 2026-08-23): app.js pin re-minted — the custom-fleet
  // electricity chip keeps the b9 M4 DERIVED-price and inert-under-rent disclosures beside the
  // section composition. Presentation only; no rendered quantity moved.
  /* im-arc T2 fix (Sol review 2026-08-23, findings P1-1/P1-4/P1-7/P1-8):
     app.js pin re-minted for all-section T1 receipts, effective basis labels,
     total by-hardware maps, point-or-triple middle-assumption rendering, and
     the verification fold that binds both accelerator tables/card bands to
     the recomposed section receipts. The final review fold also resolves
     region-only visible electricity through the pricing receipt. */
  /* im-arc T2 fix-2 R1: source pin re-minted for engine-owned hypothetical
     byHw rent receipts and honest unavailable reasons in tables/tooltips.
     The historical and characterized WIDE hashes above remain unchanged. */
  /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
     app pin re-minted for every-box basic/advanced grammar, fleet-mode/DC
     composer, prominent coverage ledger and section bands. WIDE is unchanged. */
  /* im-arc T3 fix (2026-08-23): app pin re-minted only for consuming the
     engine-owned fallback/share-normalization receipt sentence. */
  /* im-arc T3 FIX-2 B1: re-minted after the saved/link collision check adopted
     the shared caller-authored fleet comparison; no render computation moved. */
  /* im-arc T4 fold ROUND 4 (2026-08-25, Polaris toss-back #3): app.js, engine.js and the MCP
     sources re-minted for the reader-capex SCOPE requirement and the coverage evidence now
     published through MCP discovery. NO WIDE hash moved and none is re-minted here — the change
     is structural: a capexScope is required beside a capex the READER states, and no preset or
     registry state states one, so every hashed grid above is byte-identical across this commit. */
  /* T5 (2026-08-27) — re-minted for recs 1, 4 and 5 of the 2026-07-29 GPT Pro repo review.
     NO COMPUTED VALUE MOVES, and that is EXECUTED rather than asserted: the WIDE state hash
     above is UNCHANGED by all three, which is what says these are surface and contract changes
     and not a defaults move.
     (a) rec 4 — the custom-fleet HBM override becomes a TYPED BYTE quantity. `hbmGB` is retired
         to a read-side alias folded once in custom-fleets.js; engine.js stops multiplying by 1e9
         and now throws if an unfolded legacy key reaches it; app.js replaces the unqualified GB
         box with a unit-carrying control whose donor figure derives from the normative hbmBytes
         record. Nothing in the default fleet carries an HBM override, which is why no shipped
         number moves.
     (b) rec 5 — the analyst-hypothesis token is renamed off its retired posterior-about-reality
         opening (quoted in the 07-29 review) and its NODE MOVES OUT of THE ANSWER into its own
         #fa-analyst-hypothesis section, a sibling of #final-answer. Relocation, not a
         second emission: the sink count and classes are unmoved.
     (c) rec 1 — finalAnswer() gains a frozen `referenceState` fingerprint and
         refreshFinalAnswerDiffers() compares against it instead of isCentralClean(), fixing a
         notice that fired on an untouched page. A visibility predicate; no value is computed
         from it. */
  /* RE-MINTED 2026-09-12 (im-default-window-and-mcp-discrepancy): the one window (owner voice note
     note-20260912T180812Z-c9eaac) and the calculation on the headline face (bq-2345). app.js gains
     renderScenarioWindow / setReaderDefault / swapScenario / renderHeroCalc / clearHeroCalc and a
     per-browser opening default under localStorage key im_default_scenario_v1; fillPresetSelects, the
     shared-link reset and the epoch notice open on openingScenario() (the page default unless a reader
     chose another), and isLandingClean() follows that opening state. The hero value token is NOT
     restructured: tests/run-app-tests.sh pins it serialized as one run of text, so the proposed re-size
     of its policy label was dropped rather than the guard rewritten. The window carries no live region
     (§18.6); a set-default confirmation is announced by taking focus, and focus is handed back to the
     rebuilt control after a swap. No engine call changes and no computed value moves: every WIDE hash in
     this file is unchanged across the edit (executed), and tests/default-window-cdp.test.mjs drives the
     behaviour in a real browser, with a reload control, a shared link opening what it names, focus rows,
     and a refused pairing leaving no stale calculation. */
  /* RE-MINTED AGAIN 2026-09-12, same leg, for the Astra round-2 fold (review/astra-r2.md): F6 a Custom model is
     refused as a default with its reason; F7 the incompatible-pair branch clears the headline's unrounded tooltip;
     F8 the current-scenario default button is withheld while a non-native traffic mix is selected, and any default
     set from the list says it opens with the model's own mix; F9 the window's list and the shared-link banner name
     the page's built-in default and the reader's own default; F10 the opening-state policy label stays scoped to
     Opus; F11 the calculation block carries .tile-calc only while it has content; F2 the stated-reading call also
     passes the reading at the estimate's own settings. No computed value moves: the WIDE hashes are unchanged across
     the fold (executed), and tests/default-window-cdp.test.mjs rows W-9 and W-12..W-14 drive each in a browser. */
  /* RE-MINTED AGAIN 2026-09-12 for the Astra round-3 fold (review/astra-r3.md): F8 default decisions are taken on the
     EFFECTIVE traffic mix (reopenTrafficDiffers / reopenTrafficText), so a locked replay's latent selection no longer
     withholds the default or claims a changed mix; F2 the stated-reading caller's comment names the unedited preset
     reading. No computed value moves (WIDE hashes unchanged, executed); browser rows W-15 and W-16 drive both. */
  /* RE-MINTED AGAIN 2026-09-12 for leg im-default-controls-tail (gate verdict 20260912T212606Z on commission
     im-default-window-and-mcp-discrepancy-20260912): the set-as-default control now appears on every scenario on every
     model. setReaderDefault no longer refuses the Custom model (its starting settings are page code, so a model id and a
     scenario id rebuild them) and refuses an unknown model id instead of substituting Opus; the confirmation says the
     edits on screen are not part of a default. renderScenarioWindow drops the Custom refusal and the withheld traffic-mix
     row: the row keeps its control and names the mix a default opens with (round 2 F8 fix). Display and control code
     only; this suite's other rows, including the WIDE hashes, pass unchanged (executed). Browser rows W-4u, W-4n, W-13 and
     W-14 drive each change.
     RE-MINTED AGAIN the same day for the Astra round-6 fold (review/astra-r6.md F2, F6, F7): reopenDifferences compares the
     screen with a scenario's whole reopening state (settings, fleet, parameter-count case, interlock, traffic), so a
     custom fleet, an unlocked interlock or a custom case beside equal settings is never marked default and the control
     and the confirmation name what a default does not keep; the row carries a control for an edited scenario too.
     Display and control code only; this suite's WIDE hashes pass unchanged (executed). Browser rows W-4u, W-4n, W-13
     and W-18 drive each change.
     RE-MINTED AGAIN for the Astra round-7 fold (review/astra-r7.md F3, F4, F7, F8): a forced incompatible pairing and the
     exact fleet identity join the reopening comparison (a reader's own fleet worded as not kept, the page's left-over identity
     as the fleet a fresh visit assigns), a saved scenario keeps its lens base beside its breadcrumb (MODIFIED_BASE), and the
     comment states what the comparison covers and excludes. Display and control code only; this suite's WIDE hashes pass
     unchanged (executed). Browser rows W-4n, W-18 (d, e) and W-19 drive each change.
     RE-MINTED AGAIN for the Astra round-8 fold (review/astra-r8.md F5, F6): an equal-valued traffic selection and a typed
     scenario name join the reopening comparison, the name input re-renders the window, and a saved lens's base travels
     through Save-again (__persp) and Share (the lens name as the modified origin). Display, control and share-origin code
     only; this suite's WIDE hashes pass unchanged (executed). Browser rows W-19 and W-20 drive each change.
     RE-MINTED AGAIN for the Astra round-9 fold (review/astra-r9.md F3, F4): Save re-renders the window after clearing a typed
     name, and Save records the window's resolved lens base (saveOriginId) for an edited state however that base became known.
     Control code only; this suite's WIDE hashes pass unchanged (executed). Browser rows W-19 and W-20 drive each change. */
  /* RE-MINTED 2026-09-19 for the im-vet-0919 Astra round-1 fold (pack B P0-1, P0-2, P0-5, P1-1).
     Four client-side defects, none of which moves a computed value — no engine input changes,
     and the WIDE hashes above are unchanged (executed).
     P0-1: a `?s=` link that was PRESENT and REJECTED rendered the page's OWN opening scenario
     with no notice of any kind, under normal shared-scenario styling — `?s=v6.bad`, or a
     well-formed token naming a model, perspective, fleet or total-case that does not exist, put
     82.42% on screen as if the sharer had sent it. This file already stated the doctrine one
     branch below, for deprecated links: "NEVER a silent default". A rejected link now raises
     the same visible notice, worded for its own cause.
     P1-1: the receiving side had no size bound at all while the sharing side refuses to emit a
     link over 4,000 characters — a 1.3-million-character token was accepted and produced a
     million-character note. Capped at 16,384, refused with the same notice.
     P0-2: `_meta.dataAsOf` went straight into a rendered sentence, so a decoded
     `{"toString": null}` threw during initialisation and the interactive result never rendered;
     a string was taken verbatim, so "2099-01-01 - DISCLOSED" read as the page's own dating. It
     is now coerced to a plain ISO date or dropped.
     P0-5: the saved-scenario store was whatever JSON.parse returned, so saving a scenario named
     `__proto__` reported success while nothing was stored, a store holding `[]` reported success
     and stayed `[]`, and a store holding `"hello"` threw. Null-prototype record, non-record
     values treated as no store (and left in place, unread, as the reader's data), and success
     announced only after the record is read back. */
  /* RE-MINTED AGAIN 2026-09-19 (Polaris ruling on Astra pack A P0-2): POINT_MODE_COPY and the
     per-dial basis line. The copy asserted that no setting reaches outside the range and the
     basis line was withheld from exactly the case that claimed the most; both now state the
     search that was performed, and the basis renders on every band. Display strings only — no
     engine input moves and the WIDE hashes above are unchanged (executed). */
  /* RE-MINTED AGAIN 2026-09-19 (Polaris ruling on Astra pack B P0-4): a saved scenario records
     the MODEL it was saved under and its fleet identity, and restoring one selects that model
     before rebuilding the state. A record written before this round carries neither; it is NOT
     migrated and NOT re-interpreted — it loads with a visible notice naming what was not
     recorded, and the record is kept exactly as found. Astra had saved Kimi/median at
     67.762158%, selected Opus, reloaded, and been shown 61.417830% under the words "Loaded
     saved scenario"; and had watched a custom fleet's flat $10/hour rent vanish on reload,
     8.460317% becoming 79.128952%. Display and restore logic only — no engine input moves and
     the WIDE hashes above are unchanged (executed). Guard:
     tests/rejected-link-and-store-cdp.test.mjs, red on the pre-ruling app in 6 of its checks. */
  /* RE-MINTED AGAIN 2026-09-19 (Polaris ruling on Astra pack B P0-3): the three range call sites
     pass the LIVE state as their base. They passed none, so they swept the dials against the
     PRESET's values while the headline above them was computed on the reader's edited state, and
     the two disagreed in a way that reads as a contradiction rather than an edit. On Opus /
     gptpro-r3 with the output price moved from $25 to $50 the point computes 87.6244% while all
     TEN declared ranges were drawn on the unedited preset — every one of them excluded it; with
     the live base none does, and the utilization range reads 83.9118–89.9449% instead of
     77.1520–85.7200%. A RENDERED VALUE MOVES: every displayed range on an edited state. The
     point itself does not, no engine input changes, and the WIDE hashes above are unchanged
     (executed) — they are computed on unedited preset states, which is exactly the case where
     the live base and the preset base agree. `bandBase()` is one composition used by all three
     sites so they cannot drift apart again. Guard:
     tests/rejected-link-and-store-cdp.test.mjs. */
  /* RE-MINTED AGAIN 2026-09-19 (completion-gate adjudication): the `_meta` coercion covers every
     field that reaches a rendered sentence, not just the date. The first cut took `dataAsOf`
     alone while Astra had named the engine identifier in the same finding — `meta.engine` is
     interpolated into the engine-drift warning, so `{toString: null}` threw there exactly as it
     had in the date, and the gate marked B P0-2 only partially fixed. A field is now either a
     bounded string this page will render, or it is dropped. Display only; no engine input moves
     and the WIDE hashes above are unchanged (executed). */
  assert("R1 freeze: site/app.js byte-identical", fh("site/app.js") === "d37c2b4e6a8712ecddf7d889b462f7717387b0bddf5c234a017769b649d41804" /* RE-MINTED 2026-09-25 by im-astra-pro-estimates-0925 (bq-3351, owner ruling d-20260925-im-astra-pro-estimates-category-and-drop-same-assumption-section): renderNormalized REMOVED with the §10 one-lens table; renderAstraProChart ADDED (the category chart, each recorded operating point through astraProReplay, registry order, never sorted). No existing surface's arithmetic changed: every WIDE pin and the T4 receipts are UNCHANGED. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-astra-pro-estimates-0925-work/evidence/remint.md [app.js] previous: 1d604f8cb7131174… */ /* RE-MINTED AGAIN 2026-09-25 for the review-of-record r1 fold (bq-3316: archived tag kept on the preset line, reader wording of the policy clause corrected, round-3 attribution corrected, fable-r3 note history moved to the changelog, 82.42->82.33 quote corrected to the engine's own value, stress line keeps 'policy-labeled'); WIDE, T4 receipts and the answer-DIGITS pin still UNCHANGED [app.js] previous: 108953c28f2d135d… */ /* RE-MINTED 2026-09-25 by im-legibility-merge-enact-0925 (bq-3316, the bq-1141 legibility merge builder half): PRESENTATION + COPY ONLY — M1 preset note into the dossier, M2 value/status split, M3b one name (planning baseline) for the 58% reading incl. the four FA templates + memo 2.9 amendment, M4 one-sentence standfirst, M7/M8 history to the changelog verbatim, M10 destination labels, M11 reader wording at the display funnel, M12 vocabulary, M13 masthead, M20 footer. EXECUTED: every WIDE pin and the T4 historical receipts are UNCHANGED, so no rendered engine quantity moved; the fa-explain answer DIGITS pin is unchanged. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-legibility-merge-enact-0925-work/evidence/remint.md [app.js] previous: 640431d25ef4a8be… */ /* RE-MINTED 2026-09-21 by im-share-ready-0920 (program bq-2998): the ONE genuine code defect the share-readiness review found. Two of five evidence-catalog route rows printed "undefined 0.0871 -> 0.07 ... undefined null -> [object Object]" at readers, measured live with every <details> forced open: 13 spurious "undefined" and 6 "[object Object]". Three causes fixed: boardChangedSummary now applies the migrationPins exclusion changedFieldsFromCentral already applied (the primary fix, and why the row's "(4 changed)" count disagreed with its 10 listed deltas); BOARD_FIELD_LABEL completed from 13 to all 20 PERSPECTIVE_SPACE_KEYS as its own F11 comment requires; and boardFieldVal/fmtDossierVal no longer let an object reach a reader as "[object Object]". Re-measured after: 13 -> 0 and 6 -> 0, 0 bad route rows. This is a PRESENTATION file — no engine value, no WIDE surface pin and no MCP transport id moves with it, which the gate round confirms by failing on this pin alone. Found by the browser-QA arm; see review/browser-qa-verdict.md finding 1. */ /* RE-MINTED AGAIN 2026-09-20 by im-vet-six-repairs, ASTRA xhigh FOLD: the withdrawal is now disclosed on the exploration route cards and in the coverage sentence (findings 1 and 2), E2 is relabelled MIXED-BASIS with the inconsistency and the 0.525 alternative stated (finding 3), E3 names its decode evidence per leg (finding 5), the r4 §C2 quotation is RESTORED after the N1 pass had changed a word inside it, four reader strings the old checker scope had hidden are renamed including the hero label, and the round-3 card states the rounding convention it actually uses (finding 8). */   /* re-minted 2026-09-20 by im-vet-six-repairs: the N1 vocabulary release edit renames six reader-facing strings in app.js (cost lens -> scenario preset). NO behaviour changes. */, fh("site/app.js"));
  // b9 M5 micro-verify fold (P2 residual, 4th recurrence of the class): index.html pin
  // re-minted for the §7/verdict prose sweep — seven sentences that presented
  // reference-pinned figures as "the activated/deployed default" now name the
  // public-evidence reference and, where meaningful, state the ratified-prior reading
  // beside it. COPY ONLY: no computed value moved, WIDE hash unchanged.
  // b9 M5 implementation-gate round 5 fold: index.html, engine.js and the MCP concat pins
  // re-minted for the P1 Worker-build gate fix, the stale 53.29 source comment, and the
  // sentence-scoped class guard's copy corrections. COPY + BUILD-GATE ONLY: no computed
  // value moved, WIDE 180-state hash unchanged.
  // b9 spec-decode LEVER (kernel element 3, manifest row 16): re-minted for span (8) — the
  // methods-box paragraph, inserted between PINNED INSERTION BOUNDARIES so T-21a can extract and
  // compare it. This is the ONE shipped site where the module system cannot enforce the
  // composition, so the paragraph's bytes are asserted against the composition evaluated from
  // engine.js's canonical constants: edit one without the other and the suite fails. One <li>
  // added; no existing byte of this file moved.
  // b9 spec-decode LEVER (J-10 run-1 fold, manifest row 16): re-minted because SPECDEC_GATE_SEMANTICS
  // grew the P0-1 copy fix — the gate now NAMES the per-leg typed baseline status as what carries the
  // no-double-counting guarantee, instead of letting the "no MTP/disagg" label imply it. The methods
  // paragraph is static HTML and composes from that constant, so it was RE-DERIVED from the constant
  // programmatically rather than retyped (1,326 -> 1,708 bytes), which is exactly the divergence
  // T-21a exists to catch. NO COMPUTED VALUE MOVES — copy only; tripwires re-derive exact at
  // 59.18058739356502 / 68.98395363429421, membership 7/0/100.
  // b9 UX-A: re-minted for aria-haspopup="dialog" on the five static .info controls — they are
  // dialog triggers now, and a trigger that does not say so is a trigger assistive technology
  // cannot announce. ATTRIBUTE ONLY: no copy, no number, no node added or removed.
  /* v2.2.0 PRODUCTION RELEASE (row 441, owner ruling q-row441-ref-and-bridge 2026-08-06): both pins
     below re-minted for the master merge. index.html gained the two owner-APPROVED RAISE Summit
     paragraphs (§7 Anthropic realized-profit, §10 OpenAI trajectory) and its footer release
     manifest now reads v2.2.0-2026-08-06 / data as of 2026-07-26. engine.js gained the same two
     MARGIN_CLAIMS records with the analyst-characterization provenanceTier, the version identity
     bump, and the LEGACY BRIDGE appended to bridgeLine (FA-arc rows G1A-1/G1A-3). NO COMPUTED
     VALUE MOVES — the WIDE 180-state hash above is UNCHANGED and the tripwires are exact at
     59.18058739356502 / 68.98395363429421. Evidence-board records and prose only. */
  /* row 499 re-mint (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
     THREE added elements across the row-499 rulings (the third is the margin-band readout container): the shared-link banner container (ccb4a1) and
     the FINAL-ANSWER landing-reading node (the "the FA block carries the hero numbers" ruling).
     Both are empty divs the app fills; neither computes anything. The WIDE render grid is unchanged
     by both and the tripwires are exact. */
  /* mix-band re-mint (same delta manifest): ONE added element, `#out-mix-band` — an empty div the
     app fills with the min/median/max the fleet mix reaches over the distributions that sum to
     100 %. It is a separate node from #out-margin-band deliberately: that one compounds INDEPENDENT
     dials over a box, this one solves a COUPLED axis over a polytope, and one container would let a
     reader carry one method's claim onto the other's number. It computes nothing itself. The WIDE
     render grid is unchanged (255/255 byte-identical) and the tripwires are exact. */
  /* V3.0.0 ALIGNMENT re-mint (2026-08-13, Polaris ruling esc-1df204c8 per plan D-10): exactly
     two index.html sentences moved — the subtitle's "live v2.2 path" → "live v3.0 path" and the
     footer's release-manifest line (methodology v3.0 · engine v3.0.0-2026-08-13). Version
     identity ONLY; snapshots #27 asserts footer/engine agreement, and the headline-invariance
     evidence separately proves no computed value moved. */
  /* V3.0.1 VERSION-STRING SWEEP re-mint (2026-08-13, owner note 0b76be): current-identity
     strings go version-neutral or v3.0; historical epoch boundaries KEEP their version name and
     gain the 2026-08-06 date (index: 2 comments + the deprecation prose + the byline anchor +
     the roofline sentence; app: the three saved/link deprecation strings). COPY ONLY — no
     computed value moves; the grounding-ledger/annex regen (bq-1101) rides in the same commit. */
  /* ESTIMATES-CARDS REBUILD re-mint (2026-08-16, owner rulings q-margins-estimates-legibility-
     rebuild = A and q-margins-estimates-headline-basis = A, both 2026-08-13; build spec
     orchestration/backlog-recovery/day-2026-07-28/reports/estimates-cards-SPEC-2026-08-13.md).
     §5 gains the two QUOTED adjudicator cards (GPT-5.6 Pro 81.8 % / Fable 5 ≈77 % on the
     effective-billings basis, with their ranges and per-card expanders), the shared judgment-range
     label, and the ≈51 % stress row; the §5 heading and its TOC entry are retitled to match the
     content the ruling put there. The verdict block that stood in that position is REPLACED as an
     above-the-fold surface and its prose is preserved BYTE-IDENTICAL inside the section expander —
     only its `<div class="verdict">` accent-box wrapper is gone (the ruling says replace the
     section, not delete the prose; snapshots §6e still asserts every one of its labeling strings).
     STATIC MARKUP AND COPY ONLY: no engine value is read, computed or rendered by any of it — the
     card numbers are QUOTED adjudicator readings, which is why they are markup and not an emitter.
     The WIDE 255-state render grid above is UNCHANGED and the tripwires are exact, which is the
     evidence that this leg moved no rendered quantity. */
  /* CARDS-VINTAGE re-mint (2026-08-16, owner ruling q-margins-cards-vintage = B, answered
     2026-08-16T14:17Z): the card FACES move from the round-2 to the ROUND-3 self-authored
     readings so the headline and the calculator's opening state (gptpro-r3, owner ruling
     2026-08-08) agree. Pro face: 83.1 % / 68–92 % with basis line "undiscounted list" —
     round 3 is stated by its author at list only, and quoting it at effective billings would
     fabricate a number (documented in the cards' comment block). Fable face: ≈77 % unchanged,
     span widened to 65–82 %, basis unchanged. Round-2 pairs preserved verbatim inside each
     expander; each expander's provenance line now names both vintages; the load-op links move
     to the r3 presets (gptpro-r3 / fable-r3 — both pre-existing in the engine). STATIC MARKUP
     AND COPY ONLY, same as the rebuild re-mint above: quoted adjudicator readings, no engine
     value read or rendered. */
  /* OWNER-ANNOTATIONS RE-MINT (2026-08-17, owner note 514e03; the eleven markup annotations of
     2026-08-16 are the instruction set, and this leg enacts the interaction-level ones the
     2026-08-16 legibility deploy had queued rather than built).

     NO RENDERED QUANTITY MOVES, and that is EXECUTED rather than asserted: the WIDE 270-state
     render-parity hash above is UNCHANGED across every edit in this leg, and both standing
     tripwires re-derive exact (default headline 68.98395363429421, trend-0 reference blend
     0.5918058739356502, membership 7/0/100). Nothing here reads, computes or renders an engine
     value that was not already read, computed and rendered.

     What moved, by annotation:
     · n12b450 / n45cb3d — a chart bar is a control now. Clicking (or activating by keyboard) a
       bar in either chart opens the section holding that accelerator's own control and focuses
       it. NO second editor is built: his complaint was reachability ("the edits are in sections
       collapsed to the left but that's not ergonomic"), so the fix is reachability. app.js gains
       makeHwMarkNavigable/revealHwRow and two data-attribute identities per row; index.html gains
       one subtitle clause on the cost chart saying the bars are clickable.
     · ndadaca — the spec-decode gate gets its unlock affordance. The pinned SPECDEC_WHY_LINE
       bytes are UNTOUCHED; a separate button beside it jumps to the stack setting and focuses the
       tick that opens the gate. Scoped to the D-SD-7 gate and NOT the replay lock, whose why-line
       must not name the setting (D-SD-5). Jump, not toggle: 0.7 also removes disaggregation, and
       writing it from a control labelled for speculative decoding would move a number as a side
       effect the reader did not ask for.
     · n9c61af — "3 stacked dots should be on a single line". rangeHandlesFor renders ONE track
       with three dots instead of three stacked slider rows. The three inputs are still native
       <input type="range">, deliberately: the browser's own step snapping is what has been
       writing S.dialRanges all along, and a pointer-math reimplementation could land a hair off
       on a log or fractional-step dial — a moved number for what was asked as a layout fix. `put`
       is byte-identical; only geometry and the readout changed.
     · nbc7fc1 — the answer tile collapses. Above the fold: label, number, a title-length subject
       (engine-minted `subjectShort`, beside the long form so they cannot drift), and the reading
       the page opens on. The FULL scope declaration is the first thing inside #fa-full and is
       NOT shortened — dropping the tariff basis, the cache/batch/discount mix, the fleet filter
       or the traffic anchor from a margin figure is the conclusion-shopping the invariants exist
       to prevent. Every emitter still writes into the same element by the same id; collapsing is
       a containment change, so the vocabulary sweeps, the sink registry and the MCP twin read the
       same nodes with the same bytes.
     · nd4f4c7 — the higher-justification entries become loadable. Load targets are found by TYPED
       claim anchor (a route is offered under an entry only when its own claimAnchor.claimIds
       intersects that entry's claims), never by matching names in prose — which is what keeps the
       stated-vs-inferred line he asked for from blurring. Three of the seven entries have no
       authored route and say so instead of carrying a dead button; their own bridge text already
       said why in the same words. The gptpro LENS gains a claimAnchor, asserting nothing new: its
       own note and the g3 entry already declared that relationship from both sides.
     · nd94bbc — his STANDING RULE, enforced against a regression. The 2026-08-16 sweep removed
       every round-over-round passage and verified 0 on the live bytes; the cards-vintage rebuild
       later the SAME DAY put comparison prose back into the two estimate expanders ("wider than
       round 2", "The round-2 reading: …", "the central is unchanged at ≈77 %, the span widened",
       "round 3 revises the headline reading"). His 14:17Z ruling moved the FACES to round 3 and
       said nothing about narrating the move, so the faces stay and the narration goes. It is
       MOVED, not deleted: both round-2 pairs are now in research/changelog.md verbatim, which is
       where he said version history belongs. Provenance lines naming which authored statement
       each face quotes are KEPT — that is citation, and the rule is about narrating changes.

     THE SINK REGISTRY GOT STRICTER, NOT LOOSER, and the numbers say so: 450 -> 465 claim-bearing
     sinks, 18 added and 3 re-hashed-in-place, and EVERY ONE OF THE 18 IS CLAIM-BEARING — none is
     a new exemption. Two new rules classify them (chart-jump-affordance -> hardware-lens-tile,
     because the bar's accessible name carries its computed margin and cost and that is where a
     screen-reader user reads the number; fa-higher-load-ops -> evidence-board, because the
     stated-vs-inferred distinction lives in exactly that text). The one new EXEMPT rule,
     dataset-navigation-targets, covers querySelector keys only — which row a bar jumps to, which
     tick opens the gate, which of three handles a dot is — and the class set is unchanged at the
     same ten emitter classes. */
  /* TILE-POSITION re-mint (2026-08-18, d-im-tile) — owner ruling q-im-tile-position, answering
     annotation nad7e98 ("This should be at the top, not way down here, and collapsed, not fully
     expanded and rambling"). LAYOUT ONLY, and the WIDE hash above is the executed proof of it.
     What moved: the ≈83% headline tile leaves .hero-row and becomes the head of the projections
     block — tile, then the two hoisted estimate cards and the stress test, then the answer tile —
     with the four supporting output tiles (cost, price, cost-out, feasibility) following below.
     Measured cause of "way down here": that tail rendered 5,055 px tall inside the 189 px tile
     column and pushed the estimate cards he had just approved down to y≈8,900; after this it is
     950 px at full column width and the cards sit at y≈4,000.
     WHAT COLLAPSED, AND WHAT DELIBERATELY DID NOT. Inside the new #hero-full: the quoted stated
     reading and the two band readouts. Left on the face: the "not a company gross margin" caveat
     (persona RL3 — it must survive a screenshot), #out-margin-unanchored and #out-margin-note.
     Those last two are the MANDATORY disclosure surfaces, and collapsing them would put a number
     on screen whose qualifying sentence is not — the whole reason the typed tail exists. Worth
     knowing, because it is the opposite of reassuring: U-23 would NOT have caught that. Its vis()
     oracle is getClientRects(), and Chrome >=128 keeps closed-<details> content in the box tree via
     content-visibility rather than display:none (fa-explain-cdp's own comment says exactly this),
     so a mandatory surface hidden inside a collapse still reports rects and the suite stays green.
     So this is the maximal collapse the INVARIANTS allow, not the maximal collapse the gates would
     have allowed, and the limit is stated rather than quietly taken. The leg's archived probe
     asserts the split with checkVisibility, which is the correct predicate.
     NOTHING IS DELETED and no node loses its id; every emitter still writes into the same element
     by the same id, which is why containment is all the transport sees. One front-page MCP delta
     is declared for it; report-s1..s10 are byte-identical. Sink registry unchanged — every site in
     index.html is exempt by the `index-html-static` rule, covered by this freeze instead. */
  /* DESKTOP re-mint (2026-08-18, d-im-desktop) — owner notes 11b102 and bb3f19, answering a
     miss the 2026-08-17 and 2026-08-18 legs both shipped green. His words: "The Fable display
     still isnt there either way… point 11 was a spot where you had exactly what I wanted displayed
     at the start much lower in the page, and now you cant figure out how to do it", and the
     interpretive rule "you have to actually understand it as being laid out on a desktop screen,
     not mobile, and anchored to where that desktop screen shows things".
     LAYOUT ONLY, and the WIDE hash above is the executed proof of it. What moved: the ≈83% tile
     and the two estimate cards leave .controls-col for a new full-width #projections band placed
     above the evidence board, and the estimates stop being a closed <details>.
     THREE MEASURED DEFECTS, all of them live on BOTH viewports until now, none visible to any
     gate we had. (1) #estimates-top shipped as a <details> CLOSED at first paint, so the Fable
     card was not displayed at all — annotation n95f678 approved the pair AS RENDERED in section 5,
     and the "collapsed, not rambling" instruction the hoist quoted is nbc7fc1's, which is the
     ANSWER TILE. (2) Every estimate-card style was written `.report .est-*` and the hoist moved
     the markup OUT of #report, so the pair rendered display:block with border-width 0px and no
     grid — verbatim markup is not verbatim rendering, and those selectors are now class-scoped.
     (3) .layout is `390px 1fr`: on DESKTOP the block he judged was squeezed into a 390 px rail
     beside a 792 px column of report, which is why a 1400 px-WINDOW probe still could not see the
     problem. Width, not window width, was the variable.
     NOTHING IS DELETED and no node loses its id: #hero-lead, #estimates-top, #estimates and every
     emitter target move as whole subtrees, #estimates-top keeps its id so section 5's .est-moved
     link still resolves, and the only element-type change is that <details class="est-top"> becomes
     <div class="est-top"> with its <summary> becoming a visible <h2 class="est-top-head">.
     The dual-viewport matrix is archived at im-desktop/dual-viewport-probe.mjs and the rebuilt
     im-annotations/live-annotations-probe.mjs, which assert BOTH viewports — and BOTH pointer
     environments — so single-viewport verification can never again call an enactment live-verified.
     SECOND MOVE IN THE SAME LEG: #final-answer joins the band. Annotation nbc7fc1 says the answer
     tile "needs to be top with other projections", and lifting the tile and the estimates out of
     .controls-col without it left it BELOW the evidence board while its own projections sat above
     — a regression this leg introduced and then repaired rather than shipping. The band places the
     ≈83% tile spanning both rows of column 1, the estimates in column 2 row 1 and the answer in
     column 2 row 2; below 980 px all three fall into one column in source order. */
  /* FOLLOW-UPS re-mint (2026-08-18, d-im-followups) — owner answer q-im-desktop-followups = A,
     enacting the two owner-court items d-im-desktop reported rather than guessed at. BOTH ARE
     CONTAINMENT/AFFORDANCE CHANGES ONLY, and the WIDE 270-state parity hash above is UNCHANGED as
     the executed proof that NO COMPUTED VALUE MOVES.
     (1) #dossier is deduped to ONE route, on exactly the terms he ruled for the methods box one
     element higher: measured dossierRoutesVisible = 2 at BOTH viewports (the injected popup
     trigger AND the inline <summary> both rendered), now 1 at each — fine pointer keeps the
     disclosure and hides #explain-trigger-dossier, coarse keeps the trigger and hides the summary.
     #preset-note was PROMOTED OUT of that <summary> into a new .dossier-block wrapper first,
     because it is not part of the route: it carries the loaded-link identity warnings ("MODIFIED
     RANGE EXPLORATION — … the route identity and its ranking metadata no longer apply to these
     numbers"), and hiding the summary on a coarse pointer would have deleted an honesty label to
     remove a duplicate affordance. The wrapper draws exactly the frame .dossier used to draw and
     the nested .dossier draws none, so the rendered box is unchanged; #model-dossier-card shares
     the .dossier class and is deliberately untouched. The hint text is byte-identical, so this
     half of the leg contributes NO transport delta at all.
     (2) The justification stack leaves the answer-tile FACE for the tile's own expander. nbc7fc1
     asked for a short title and a collapsed tile; measured on the shipped page the tile was still
     1,444 px tall on DESKTOP and 3,512 px on MOBILE with #fa-full closed, and #fa-higher alone was
     837 px / 2,548 px of that. #fa-basis-declaration, #fa-higher and #fa-exec-summary move inside
     #fa-full, in source order, immediately BEFORE the invitation/annex line so that line stays
     terminal. The basis declaration travels WITH the explanations because its own text says "every
     calculator figure in the explanations below" — separating a label from the content it governs
     is design gate P0-3's error. #fa-deeper-trigger STAYS on the face (P0-1: the popup route must
     not require opening the disclosure it replaces) and its payload already carries the basis
     declaration, and it MOVES ABOVE #fa-full in the same edit — design gate P0-1's own reason
     ("the trigger sits BEFORE its disclosure so its position is stable whether the section is open
     or closed") binds harder after this leg, because an expanded #fa-full now carries the whole
     justification stack. Measured after: tile 1,444 -> 429 px desktop, 3,512 -> 693 px mobile;
     document 8,779 -> 7,785 and 17,381 -> 14,502. Nothing is deleted, no node loses its id, and
     every emitter writes into the same element it wrote into before. */
  /* im-arc T1: re-minted for the second basis card, rent-segment disclosure, paired-table
     container and stack rent checkbox. The release stamp canonicalization is unchanged. */
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): first-paint
     counterpart copy now states the same ALL-sections contract as app.js. */
  /* 2026-09-09 im-release-edit — RE-MINTED FOR THE LANGUAGE EDITION (owner voice note a0b244;
     DECISIONS d-20260909-im-release-edit-approved-push-deploy; work order
     im-language-rationalize-2026-09-08.md §9; burn-queue bq-2120). This mint carries the largest
     copy change the page has taken: one canonical name per idea, the opener and the §5 verdict and
     the §3 cost model rewritten fact-first, §7's reported gross margins moved from prose into a
     table, program codes out of body copy, abbreviations expanded once per section, glossary links
     to the new /glossary route, and the seven result-identity conflicts settled in the source.
     NOTHING NUMERIC MOVED except inside four settled provider-card conflicts, each recorded with
     its losing and kept text in reports/im-release-edit-2026-09-09/evidence/bq2120-settlements.json.
     The 273-state WIDE hash and the engine source freezes below are UNCHANGED and were re-executed:
     this is a text mint, and the calculator computes exactly what it computed before it.
     RE-MINTED for DECLARED EXCEPTIONS 8-11 (court answer to esc-20260910T022934Z-14b6c2fd): four
     printed statements ABOUT the engine's output are corrected to what it computes — a point drop
     that did not equal its own endpoints, an output-token margin taken on a different billing basis
     from the price beside it, a stale cost numerator, and a percentage conversion of two dollar
     figures printed in the same sentence. Arithmetic for each:
     reports/im-release-edit-2026-09-09/evidence/declared-exceptions-8-11.md. No input, assumption,
     source quotation or evidence label moved, and the three engine sources remain byte-identical
     with their own freezes passing. tests/snapshots.test.mjs now RECOMPUTES all four relationships
     from the engine, so they cannot rot again without failing.
     2026-09-10 im-release-edit-r2 — RE-MINTED FOR EXACTLY ONE CHARACTER PAIR, and it is a
     RESTORATION rather than a change (court answer to esc-20260910T033916Z-99df24ac, court-intake,
     disposition intake-no-card; burn-queue bq-2189). The Fable 5 round-3 card's companion figure
     goes back to "≈80% at list" from the "≈76% at list" that db73816 wrote into it on 2026-08-24,
     six days AFTER the deploy that still serves 80. It is a QUOTED estimator reading, and the three
     witnesses the court weighed all say 80: the deployed bytes at faf6bec, research/changelog.md:135
     where the face was installed, and site/engine.js:1117, the registry entry the calculator loads
     when a reader clicks "Load this estimate". So this mint does not move a published number — it
     returns master to what the public surface already shows. Nothing is swapped: the 77% effective
     figure beside it is untouched, and no dial, vector or preset moved, which is what session 1
     warned against. The full per-line audit of all 23 numeric lines that commit rewrote — 21 of
     them engine-derived and rightly swept, each re-executed against the engine today — is at
     reports/im-release-edit-r2-2026-09-10/evidence/db73816-audit.json, and the structural gap it
     exposed (face checked against its own body, never against the registry) is now closed by
     tests/face-vs-registry.test.mjs inside `npm run gate`. */
  assert("R1 freeze: site/index.html byte-identical apart from its validated release stamp",
    /* im-vet-six-repairs (2026-09-20) RE-MINT — program bq-2835, the six outside-reading findings.
       FIVE kinds of change land in this file, and the numeric ones are the reason the WIDE hashes
       above moved with it rather than staying put:
         E1  the two Trainium legs are WITHDRAWN from the default fleet on evidence grounds, so
             §5's coverage paragraph, §7's dollar walk and the §5 Sonnet fleet sentence all say
             5 of 7 with the renormalization stated, and the §5/§7 figures move with it.
         E2  the TPU v7 decode coefficient is corrected onto a decode-only numerator (0.55 ->
             0.521), which moves the same published figures.
         E3  the input-side share is corrected 70.5% -> 72.45% and the sentence now links the new
             one-page reconstruction annex.
         E4  both estimate cards are rewritten around the vector they actually run (lead ranges
             0/2/4 and 0/1/2, not "prior off"), with the round-2 reasoning kept as a labelled
             historical block.
         N1  the vocabulary release edit: one name per idea on the page's own voice, enforced from
             here on by tests/vocabulary-consistency.test.mjs (0 unlicensed retired variants). */
    // im-arc director content correction (2026-08-23): four front-page passages corrected from the
    // verified analyst-divergence research page (the Zephyr lab-specificity sentence; the Opus >80%
    // citation upgraded to the Sequoia transcript; the RAISE "first gross profit" claim flagged as a
    // summary artifact; the unsourced ~30%/~50% OpenAI GM starting points withdrawn). Copy only; the
    // 273-state WIDE hash and the historical 270 are UNCHANGED.
    // T5 ROUND 6 (2026-08-27): four published figures corrected to the values the engine actually
    // executes, after round 5 found three of them contradicting each other on the live page and a
    // fourth (the list-vs-mix delta) drifting unnoticed. The stress-card expander, the
    // ratified-prior default in the two places that still disagreed, and the §5 list-vs-mix delta
    // were each set to the value the engine executes; the blinded-cross-check sentence was
    // rewritten because at the corrected default both
    // readings now sit BELOW the 73.3% central figure rather than straddling it — correcting the
    // digit without the comparison it feeds would have left a new false statement behind.
    // COPY ONLY: every WIDE state hash above is unchanged and was re-executed. The values did not
    // move; the prose had stopped describing them. tests/fa-m6-b9.test.mjs now pins each of these
    // published digits to its executed value in both directions, which is the guard whose absence
    // let a figure the engine has never returned ship labelled "(executed)".
    // im-share-finalization (2026-09-02): RE-MINTED for two presentation-file changes, both
    // COPY/BEHAVIOUR only — no rendered VALUE moved, which is why every WIDE parity hash above is
    // unchanged and was re-executed. (1) Eleven literal `\uXXXX` escapes in two methods-box <li>
    // bodies converted to the characters they always meant (em dash ×3, × ×4, ± ×2, ≈, η). They
    // rendered to readers as backslash-u text, four of them inside the executed cost identity and
    // two inside the ±50% sensitivity clause. (2) The lazily-loaded Turnstile request is now a
    // SINGLE-FLIGHT state machine (idle → loading → ready, with slow and failed branches), because
    // a dead or captive network can leave the request PENDING rather than erroring, in which case
    // onerror never fires and the visitor is stranded on "Complete the anti-abuse challenge" with
    // no challenge to complete. RE-MINTED A SECOND TIME the same day after GPT Pro review
    // pr-20260902T153840Z-bce1bb finding 2: the first cut removed the pending node and re-armed
    // the listeners, which is a same-document retry RACE — timers and callbacks are per-element
    // while the flags were shared, so a late callback from one attempt could clear another's timer,
    // and removing a node is not a proven cancellation boundary for an already-fetched vendor
    // script. There is now ONE request per document, the bound degrades to a soft warning instead
    // of a false offline classification, and readiness is validated against the vendor API rather
    // than inferred from transport completion. Gated by tests/turnstile-loader-cdp.test.mjs, which
    // fails six ways against the superseded loader. The inline-script edit moved its CSP sha256,
    // so site/_headers and both snapshots.test.mjs copies were re-pinned in the same change.
    // THIRD RE-MINT, same day (owner note d85f73): the Sonnet copy no longer promises readers a
    // September price increase. Anthropic made the $2/$10 rate PERMANENT on 2026-08-10 and the
    // Sep-1-2026 step to $3/$15 was cancelled — verified at the primary source. The displayed
    // Sonnet-class line now reads "$2/$10 standing tariff (made permanent 2026-08-10; the September
    // 2026 step to $3/$15 was cancelled)". COPY ONLY: the preset was already $2/$10, so no computed
    // value moves and every WIDE parity hash is unchanged.
    // FOURTH re-mint, same day (GPT Pro pr-20260902T175643Z-034d27, BLOCKER 1): the Sonnet-class
    // line fixed its first half and left the second asserting the cancelled transition — "changing
    // only to the $3/$15 standard tariff FROM SEP 1 lands at ~64%". A reader could leave that
    // paragraph believing the increase took effect. It now reads as an explicit counterfactual
    // sensitivity, with the cancellation stated. COPY ONLY; no value moves.
    /* RE-MINTED 2026-09-10 (im-release-edit-r3) FOR ONE CLOSING TAG — bq-2195, and it is a repair,
       not a content change. 8db1a85 rewrote the GB300 $6/GPU-hr note in report section 4 and opened
       `<strong>Until 2026-09-10 it was not a registered accelerator-hour price at all…` without
       closing it; the sentence it replaced was `<strong>It is not a registered accelerator-hour
       price</strong>`, so the close was lost in the rewrite. In a BROWSER the parser then nests
       everything after that tag inside it: report sections 5 through 10 and their <h3> anchors
       stopped being children of #report, and six of the report's ten sections became unreachable by
       deep link. No static gate saw it — a strict parser reading this FILE reports all ten as
       direct children at every revision, including the broken one — and this freeze did not see it
       either, because it hashes bytes that were, byte for byte, what 8db1a85 wrote. Caught by
       test:browser (ux-b-cdp U-1/U-2), the suite r2's handoff records as not having been run at the
       post-ruling tree. Bisected: PASS at 3ca5301 and 54fe358, FAIL at 8db1a85 and d739962.
       ONE `</strong>` is the entire diff. No text a reader sees changes, no figure moves, and every
       WIDE parity hash above is unchanged and was re-executed. A tag-balance guard now runs in
       `npm test` (tests/tag-balance.test.mjs, with a negative control on this exact shape) so the
       next unclosed inline element is named at its cause instead of reported as a symptom.
       im-guard-fix (2026-09-10): RE-MINTED for ONE PUBLISHED FIGURE, moved by owner ruling
       d-20260910-im-r3-lead-diagnostic-recompute (card q-im-r3-lead-diagnostic-designation,
       answered 16:09:47Z, option A). The GPT-5.6 Pro round-3 card's lead-only diagnostic reads
       78.89-85.37 % across 0-4 months where it read 80.48-86.47 %. UNLIKE every other mint in this
       comment, a published number DOES move here, and that is the ruling's whole content — so the
       delta evidence is not "nothing moved" but "nothing moved EXCEPT this, and it moved to what
       the engine executes":
         * WHAT ESTABLISHES that nothing computed moved is the DIFF, not the hashes: the change is
           one string field plus comments, and a string in `statedReading.companion` is read only
           for display and by the face-vs-registry guard — it is not an input to any computation.
           Every WIDE state hash above is unchanged and was re-executed, which CORROBORATES that
           over the pinned state set; unchanged hashes over a fixed set cannot by themselves prove
           that nothing moved outside it (round-10 review, item 4 — the clause this replaces said
           the hashes were the evidence, which is exactly the class of overreach this file grades);
         * the value was produced by EXECUTING this preset, not read off any surface —
           applyPresetSettings(opus, gptpro-r3, {mode:"explicit", profileId:"reference"}) with
           trendMonths swept 0..4 gives 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653 at
           discount 0 / batchShare 0, the undiscounted list tariff the row declares as its basis;
         * the card's own STATED readings are byte-untouched — 83.1 central, 68-92 span — because
           they are its author's and this field is not. That distinction is the ruling.
       The registry moved in the same commit and the face-vs-registry guard proves they moved
       TOGETHER; research/changelog.md carries the entry, because the defect that produced the
       question was a 2026-08-24 sweep moving this figure with no record that it had.
       im-release-contradiction-fix (2026-09-12): RE-MINTED for THREE PROSE CORRECTIONS, all of them
       sentences that had stopped describing what the engine computes after the rent adoption of
       8db1a85 (owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok). NO figure moves here:
       every number written in is the number the engine executes TODAY, measured, not copied.
         * the §6 Procurement row: the retired distance (57 against 93) -> "the 63-vs-93 distance".
           This is the public defect bq-2315 (P1) was filed for — release 3f89d63 named the same
           comparison twice, 63 in the §6 lead-in and 57 in the procurement row of the table
           immediately below it.
           NB the retired reading is WRITTEN OUT here rather than quoted, for one narrow reason: the
           commission's frozen acceptance check bans that EXACT SPELLING anywhere in the deployed
           tree, and site/tests/ is deployed. Writing it out meets the check while keeping the whole
           history. NO figure and NO pin changes. That is the whole claim — an earlier draft of this
           note argued more broadly, that serving a retired literal is itself a current-content
           defect, and that argument does not hold: this same note publishes 80.48-86.47, "4 priced",
           ~70.1%, 14.3 and $2/$0.50/$6 as explicit history, correctly, and the replacement still
           conveys the meaning 57 against 93. An explicitly dated historical value is not a current
           claim. (Round 11, B2 and B5.) The lead-in was recomputed
           by 8db1a85; this row was left behind. Measured: the planning baseline is 62.9883 % at list
           (1 - 1.37637/3.71875) and 58.4305 % at effective (1 - 1.37637/3.26785), and 93 is a list
           figure, so the like-for-like comparison is 63-vs-93.
         * the page subtitle: "about 63% with the page's adopted 3-month algorithmic lead" -> "about
           68%". The lead-adjusted baseline moved 62.9038 -> 67.9968 in the same commit; measured
           today at 68.39894608278819. Left uncorrected it also made 63 mean two different quantities
           on one page, which is the same defect class as the row above.
         * the two surviving "4 priced" fleet claims (the §5 Sonnet paragraph and the §6 Fleet row).
           Measured: workload().fleetRenderable now reports renderableLegs 7, totalLegs 7,
           renderableWeightShare 1 for both Opus and Sonnet, so "4 priced" was false on the page.
       The last two were NOT in the filed defect and were NOT found by the completion gate — they came
       from the Astra xhigh review of ab23291 (findings F6 and F3), which is also why this mint exists
       before the publish rather than after it. Evidence, with the reviewer's own engine execution:
       reports/im-release-contradiction-fix-2026-09-12/evidence/astra-findings.md.
       WHAT ESTABLISHES that nothing computed moved: every WIDE parity hash above is unchanged and was
       re-executed, and no engine, registry, vector, dial or preset file is in this diff at all — the
       change is prose in site/index.html plus the glossary and rationale SOURCES (style/GLOSSARY.md,
       research/final-answer-rationale.md) that generate two other served pages.
       EXTENDED 2026-09-12, same leg, rounds 3 and 4 of the review, all measured the same way:
         * the methods box: "~70.1% of modeled direct cost" -> "~70.5%" and "roughly \u00b114.3 points" ->
           "roughly \u00b114.9 points on the planning baseline". The page's own identity,
           100*(6.45*cIn)/(cOut+6.45*cIn), gives 70.5373073367345, and 50*(6.45*cIn/16)/priceMix gives
           14.854652831097416 points. The stale pair was published as executed arithmetic (round 2, R12).
         * the stress case's reproducibility claim: it said a reader could rebuild it "from public rate
           cards without trusting a private-economics judgment" and was "the only number on this page a
           reader can check from the outside". Three of the seven rents have been declared PROVISIONAL
           judgments since 2026-09-10, so that was false as published (round 2, R14); it now says what
           it is, reproducible from the page's fully declared assumptions including those three.
         * the Grok known-knowns line: "$2/$0.50/$6 list (disclosed)" -> "$2/$0.30/$6". The ruling moved
           cacheReadMult 25 -> 15 and applyPresetSettings(grok, median) returns 15, so 15% of $2 is
           $0.30 (round 2, R16, main-page half; the site/engine.js dossier half is deferred to bq-2334).
       Still no engine, registry, vector, dial or preset file in this diff. */
    /* RE-MINTED 2026-09-12 (im-default-window-and-mcp-discrepancy; owner voice note
       note-20260912T180812Z-c9eaac and bq-2345). The hero tile gains two empty containers that app.js
       fills (#win-head, #out-calc); the GPT-5.6 Pro, Fable 5 and stress cards each gain a "Set as default"
       button; the standfirst says the page opens on the GPT-5.6 Pro settings unless a reader chooses
       another default, and dates the stated 83.1 %; the GPT-5.6 Pro card's "Which vintage is where"
       paragraph now gives the gap's actual cause (its author worked 83.1 % from the 2026-08-07 engine's
       79.65 % reading, that engine computed 83.06 %, and two later calculator changes moved the unchanged
       settings to 82.42 %) instead of pointing at the round-2 lead-0 gap; and its public-rate stress case
       reads 62.99 % where it read 72.19 %. The 2026-09-10 recompute had measured the estimate's own vector
       at public rents (72.1881) instead of the object the 2026-08-06 proposal defined: this page's rents,
       50 % occupancy, list-only billing, 64.1299 then and 62.9939 now, both executed. The authors' own
       83.1 % / 68-92 % and 77 % / 65-82 % are byte-untouched; the release-stamp canonicalization is
       unchanged. Previous pin e1f3d6f0bb12b04d. */
    /* RE-MINTED AGAIN 2026-09-12 for the Astra round-2 fold: F9 the GPT-5.6 Pro card says "the page's built-in opening
       state" where it said "the calculator's opening state" (two places), because a reader may now open on another
       default; F11 the static #out-calc container carries no class (app.js adds .tile-calc while the block has
       content), with no inline style — the static-inline-style guards in face-vs-registry and snapshots pass. */
    indexHash === "8d909db7d8f3d7963396621455a7a9d3bc8efd85ed2c425c0d9c68863892327a" /* RE-MINTED 2026-09-25 by im-astra-pro-estimates-0925 (bq-3351, same ruling): the §10 one-lens table section REMOVED (its text moved verbatim to the changelog), the "Astra Pro estimates" sub-category ADDED — fourteen generated card faces whose every figure is astraProReplay of a recorded operating point (pinned face == replay by tests/astra-pro-estimates.test.mjs), the chart container, a pointer sentence in the §10 intro, and the astra-pro-estimates.js script tag. WIDE pins and T4 receipts UNCHANGED. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-astra-pro-estimates-0925-work/evidence/remint.md [index.html] previous: 41473c70f24c69d2… */ /* RE-MINTED AGAIN 2026-09-25 for the review-of-record r1 fold (bq-3316: archived tag kept on the preset line, reader wording of the policy clause corrected, round-3 attribution corrected, fable-r3 note history moved to the changelog, 82.42->82.33 quote corrected to the engine's own value, stress line keeps 'policy-labeled'); WIDE, T4 receipts and the answer-DIGITS pin still UNCHANGED [index.html] previous: b3ac39d3334f9414… */ /* RE-MINTED 2026-09-25 by im-legibility-merge-enact-0925 (bq-3316, the bq-1141 legibility merge builder half): PRESENTATION + COPY ONLY — M1 preset note into the dossier, M2 value/status split, M3b one name (planning baseline) for the 58% reading incl. the four FA templates + memo 2.9 amendment, M4 one-sentence standfirst, M7/M8 history to the changelog verbatim, M10 destination labels, M11 reader wording at the display funnel, M12 vocabulary, M13 masthead, M20 footer. EXECUTED: every WIDE pin and the T4 historical receipts are UNCHANGED, so no rendered engine quantity moved; the fa-explain answer DIGITS pin is unchanged. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-legibility-merge-enact-0925-work/evidence/remint.md [index.html] previous: 7be486b48d6df779… */ /* RE-MINTED 2026-09-23 by im-share-ready-r2-0923 (program bq-2998): PROSE ONLY, folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (F2 DeepSeek repricing moved off the retired tariff to 83%/39%; F3 the effective-price card's estimand sentence; F4 7 declared / 5 included legs, GB300 12-of-100 vs 16% renormalized, the 09-10 vs 09-20 chronology; F6 the <=50B caution scoped to decode-calibration observations and 105-300B; F7 0.63 -> 0.73 points; F1 prose: GB200's primary source marked unrecovered; F9 GLM range marked historical). Executed: every WIDE pin and the engine.js / engine-roofline / engine-data source freezes UNCHANGED, so no rendered record moved. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-share-ready-r2-0923-work/pro/FOLD.md */ /* previous: 7ad1814796d5e471de116f2d55b112f8369af9a1e64ddfefdc05e93f85805765 RE-MINTED 2026-09-20 by im-share-ready-0920 (program bq-2998, share-readiness review), RE-MINTED AGAIN for the council's third group: PROSE ONLY. The four-arm review found the page explaining its numbers with tariffs the 2026-09-19 refresh had replaced (DeepSeek ~74%/$0.435-$0.87 vs an executed 86.467% on $0.66/$1.98; Gemini's Ironwood hour stated as ~$1.28 where the preset yields $1.62; GLM's card describing 8:1/41% where the replay computes 15:1/60%; Kimi's 4.6x becoming 2.02x; the Ascend decode ratio 1.49x -> 1.75x; the loao transfer headline 37% -> 47% once its inferred comparator is classed). MEASURED over both trees: 0 of 270 records move numerically and 0 hashed WIDE records move at all, so every WIDE pin and the engine-data freeze are UNCHANGED. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-share-ready-0920-work/evidence/render-parity-delta-2026-09-20.md */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 2, completion-gate FAIL): the gate ruled that DISCLOSING E2's basis inconsistency is neither repairing it nor withdrawing the contribution. The TPU coefficient moved from the mixed 0.521 to 0.519 with both endpoints on ONE stated timing convention, two guards lost in the E1 re-scope were restored with executed mutation proofs, and the published figures moved the last fraction with them. */
    /* RE-MINTED 2026-09-20 by im-repo-replacement — owner ruling
       d-20260920-im-replace-repo-then-publish-deploy (answer C on
       q-im-vetted-publish-deploy-share-2026-09-19), which authorises SIX written prose
       corrections to this frozen text. COPY ONLY: no rendered VALUE moves, which is why every
       WIDE state hash above and every other freeze in this file (app.js, engine.js,
       engine-roofline-v22.js, engine-data-v22.js, the concatenated MCP/Worker source hash) is
       UNCHANGED and was re-executed.
         1. the methods box said "idle accelerators do not draw board power" — a flat factual
            error this page's OWN Google annex refutes. Idle boards do draw power; this page does
            not model that draw, so the Wh figure is an operating-point intensity and not a
            fleet average, and it now says so.
         2. "The page never mixes bases inside one number" promised more than the suite enforces;
            it now says it never SILENTLY SUBSTITUTES one basis for another, and names the
            mixed-fleet and valuation-replay cases that are allowed and declared.
         3. an unscoped superlative the page's own data contradicts, now scoped to the xAI card
            with the wider sensitivity named.
         4. "realized" -> "as the modeled effective price" (§7); the glossary reserves "realized"
            for source-reported revenue.
         5. the ~1-5%-of-prefill cache-read serving cost is stated as the analyst-set,
            unobserved figure the methods box already calls it.
         6. the training-compute claim is attributed to the accounting policies these providers
            report, because the classification is the filer's and varies.
       PLUS the unfinished tail of the tariff correction the same answer authorises: the §10
       OpenAI card BODY was still quoting $5/$30, $2.50/$15 and $1/$6 — one of them inside a
       "Known knowns … (disclosed)" list — against a face the tariff round moved to ~90% and a
       registry moved to $4/$20, $2/$12, $0.20/$1.20.
       THE MOVED SET IS MEASURED, NOT ASSUMED: the MCP parity dump over all ELEVEN section ids
       reports exactly report-s5, report-s7, report-s10 and front-page moving, and the other
       seven byte-identical. That comparison had to be done by hand, because the parity suite
       throws on the FIRST mismatch and therefore cannot enumerate the rest. */  /* re-minted 2026-09-20 by im-vet-six-repairs: see the declared block above this assertion */, indexHash);
  // R1-impl R6 F8: SOLVER-WIRING FREEZE — retained after the R2 shipment as a reviewed
  // whole-file source pin. Minted at gate-close (NOT span-equivalent to 3e7a356 — the R1 batches
  // legitimately edited these; the WIDE parity hash above separately proves rendered
  // values never moved). Closes count-preserving refactor routes (e.g. a shared private
  // helper carrying solver output into an already-rendered export) that value parity,
  // export-name pins, body scans, and occurrence counts cannot see.
  // External adversarial review 2026-07-27: re-minted for the Rubin primary-source
  // correction (dense BF16 8.75→4 PF plus provenance wording). The WIDE 180-state
  // workload hash above is unchanged because Rubin remains an unpriced projection.
  // External adversarial review 2026-07-27: re-minted after making the explicit
  // scenario context authoritative for Custom-donor geometry in both solve and render.
  // Re-minted again after validating saved states through the current scenario
  // schema and correcting the flagship prefill-cost-share disclosure.
  // Re-minted after distinguishing the legacy effDec throughput targets from
  // the executable H20/Ascend source-informed-neutral etaDec values; no
  // rendered quantity moved.
  // Re-minted after the full-memory receipt was corrected to disclose the
  // flat 10%-HBM reserve; only receipt prose moved.
  // Re-minted after Rubin's unpriced status was enforced inside every
  // economics API; the WIDE surface excludes that projection and is unchanged.
  // Re-minted after maxPos enforcement moved ahead of capacity solving and
  // propagated a typed context receipt through claim-bearing wrappers.
  // Re-minted after correcting stale live-capacity and renormalization comments;
  // executable values and the WIDE surface hash above are unchanged.
  // Re-minted again after the wrapped solver's lifecycle comment was corrected.
  // Re-minted after claim-bearing capacity receipts stopped promising already-live
  // milestones and named role-split/model-divisibility work as currently deferred.
  // b9 spec-decode LEVER (chunk A): re-minted for the D-SD-7 mutual-exclusion gate — the tick
  // constant, the ONE epsilon predicate, the engine backstop specDecFactor(), and the decode-only
  // narrowing of leverThroughputMult per D-P24-1. Reviewed across 13 design-gate rounds / 26
  // lens-runs and ratified by Polaris (esc-20260801T042349Z-20c444d8); memo frozen at v16.
  // NO RENDERED VALUE MOVED, and this is executed rather than asserted: the T-1 pre-leg identity
  // oracle still reproduces sha256 157f79d5…0702db at 9,932 bytes, and the tripwires re-derive
  // exact at 59.18058739356502 / 68.98395363429421 with membership 7/0/100. The lever is inert
  // by default (DEFAULTS.specDec = 1.0; x * 1.0 === x exactly in IEEE-754).
  // b9 spec-decode LEVER (kernel element 3, manifest rows 6/7/21): re-minted for the three
  // CANONICAL CLAIM CONSTANTS and the gate why-line, reset line and replay-lock why-line composed
  // from them. Ratified bytes (esc-20260801T042349Z-20c444d8). ADDITIVE only — no existing string
  // moved and nothing consumes these yet; the tripwires re-derive exact at 59.18058739356502 /
  // 68.98395363429421 with membership 7/0/100, executed by tests/spec-decode-lever-b9.test.mjs.
  // b9 spec-decode LEVER (kernel element 3, manifest rows 8/22-26): re-minted for the lever's OWN
  // section (title, control label, three tick labels) and TIPS.specDec composed from the canonical
  // constants. The copy constants moved UP beside TIPS in the same edit — a `const` cannot be read
  // before its declaration is evaluated, and TIPS.specDec composes from them. ADDITIVE: no shipped
  // string moved, DEFAULTS.specDec stays 1.0 and x * 1.0 === x exactly, so no rendered value moves;
  // the tripwires re-derive exact at 59.18058739356502 / 68.98395363429421, membership 7/0/100.
  // b9 spec-decode LEVER (kernel element 3, manifest rows 1-5): re-minted for the RUNTIME-STRING
  // spans — the four g1/g3 pairs and the MTP_ROW_COPY union (G tightening, the H frontier-fleet
  // correction, the item-4 split, and the ratified [why no number] tail). SHIPPED COPY MOVES HERE BY
  // DESIGN and that is this element's whole content: the old tail argued present-tense against the
  // very control the page now ships. NO COMPUTED VALUE MOVES — the g1/g3 post-edit digests reproduce
  // the court's ratified 897c1a18… / 6da1926b… exactly, the WIDE 180-state hash is unchanged, and
  // the tripwires re-derive exact at 59.18058739356502 / 68.98395363429421, membership 7/0/100.
  // b9 spec-decode LEVER (D-SD-5 / D-SD-7 codec rows): re-minted for the shared codec predicate
  // specDecTokenConsistent, run by the ENCODER and the DECODER against the RESOLVED state; the
  // specDec clause in leverDomainViolation; and the replay seed in applyPresetSettings, the second
  // of the replay lock's three places. NO DEFAULT MOVES: the seed is a no-op at this HEAD (no
  // shipped perspective declares specDec, asserted) and the codec rows only REJECT. WIDE 180-state
  // hash unchanged; tripwires exact at 59.18058739356502 / 68.98395363429421, membership 7/0/100.
  // b9 spec-decode LEVER: re-minted for COMMENT-ONLY changes — the two Polaris gen-24 amendment
  // records (esc-20260802T115802Z-351e891f on rows 1 and 8, esc-20260802T121708Z-66c10f00 on row 1)
  // written beside the rows they amend. Zero shipped bytes moved; this hash moves because the freeze
  // is whole-file, which is what makes it worth having.
  // b9 spec-decode LEVER ([N-CORRECTION-LIFETIME], manifest row 15): re-minted for THE CORRECTION
  // CHANNEL — sanitizeScenarioDiff returns a third field `corrections`, restoreSavedPresetState
  // returns {state, corrections} instead of discarding its own sanitize result, and
  // specDecCorrectionNotice owns the ratified notice bytes. A path that FORCES a value must say so:
  // showing "none selected" after a silent force lies about user intent. The force fires only on the
  // gate-shut-with-credit state, which no default reaches — WIDE 180-state hash unchanged, tripwires
  // exact at 59.18058739356502 / 68.98395363429421, membership 7/0/100.
  // b9 spec-decode LEVER (§8.4/§9.5): re-minted for the canonical per-leg DTO on
  // feasibility().legs — attached to the ONE canonical object and propagated unchanged to every
  // renderer and transport. Additive; the WIDE re-mint above proves no numeric leaf moved.
  // b9 spec-decode LEVER (memo §9.2): re-minted for THE AFFORDANCE FLIP. The M6 contract is that the
  // spec-decode exec-summary row's `no-control` affordance flips to `jump` WHEN THE LEVER LANDS, with
  // no new mechanism — two fields on one frozen registry row. The lever has landed. LOW_EVIDENCE_COPY
  // ["no-control"] is retained unedited per §9.2: it is no longer reached, and deleting it would be a
  // mechanism change rather than a field change.
  // b9 spec-decode LEVER (J-10 run-1 fold): re-minted for the FOUR court-ruled dive fixes, all copy,
  // no mechanism. (1) P0-2 — the SGLang characterization said the 14%/60% figures came from
  // "different models, speculator architectures and implementations"; verified FALSE at the primary
  // source (lmsys.org/blog/2025-07-17-mtp, read 2026-08-02): both are DeepSeek V3 under SGLang,
  // differing in scale, concurrency, sequence lengths and draft window. (2) P0-3 — "the only
  // acceptance figures it has found anywhere" was refuted by that same cited post, which publishes
  // acceptance lengths 2.18 and 2.44; the claim is now bounded to this page's cited evidence set and
  // names them. (3) P0-1 sustained-as-copy — SPECDEC_GATE_SEMANTICS now names the per-leg typed
  // status as the guarantee's carrier. (4) The PROMOTED replay-lock defect — both why-line and
  // per-leg string dropped the presupposition that speculation WAS running, restoring the
  // distinction from `absorbed`. Also disclosed: the 60% figure's baseline lacks overlap scheduling
  // (worth ~20% alone), and both figures are declared cited-not-registered.
  // NO COMPUTED VALUE MOVES — tripwires exact at 59.18058739356502 / 68.98395363429421,
  // membership 7/0/100, WIDE 180-state hash unchanged, T-1 pre-leg oracle byte-identical.
  // b9 spec-decode LEVER (J-10 run-2 fold, SMALLEST POSSIBLE — one replacement, three places):
  // re-minted for the correction of THIS SESSION'S OWN run-1 P0. The run-1 fold asserted the +60.8%
  // SGLang figure was overlap-confounded; overlap scheduling is OFF IN BOTH the 51.0 baseline and
  // the 82.0 MTP arm, so the delta is matched, and that SGLang version could not run MTP and overlap
  // together at all. Both dives found it independently. Dive B's replacement adopted VERBATIM per
  // Polaris gen-25 (esc-20260802T201114Z-0e9b3ae3), which also ruled P0-ONLY: the re-raised P1 set
  // stays under gen-24 non-coverage and the new methods-box ladder-shadowing P1 is a registered
  // post-gate row, because every touched surface in this arc has minted a fresh defect.
  // NO COMPUTED VALUE MOVES — tripwires exact at 59.18058739356502 / 68.98395363429421,
  // membership 7/0/100, WIDE 180-state hash unchanged, T-1 pre-leg oracle byte-identical.
  // b9 spec-decode LEVER (J-10 run-4 fold, OWNER-RULED 2026-08-02T22:47Z, card
  // q-im-specdec-dive-gate-run4): re-minted for ONE bounded correction in two reader-facing places —
  // row 1 occurrence (H) here and annex H2 — restating the ≈1.8–1.9 figure in the SOURCE'S OWN terms.
  // SGLang reports an average ACCEPTANCE LENGTH, which counts accepted drafts PLUS the bonus token
  // per verification step; "accepted tokens" overstated the accepted-draft count. The ruling scoped
  // this to those two sites and nothing else. NOT touched, and deliberately so: the registry's own
  // `mtpAcceptance` receipt field (site/engine-data-v22.js:1015, evidence-instances-v22.json:214)
  // carries the same phrasing — surfaced to the court before the ruling and left standing by it, so
  // it is a RULED residue, not an oversight. Recorded here because a later reader will find it.
  // NO COMPUTED VALUE MOVES — tripwires exact at 59.18058739356502 / 68.98395363429421,
  // membership 7/0/100, WIDE 180-state hash unchanged, T-1 pre-leg oracle byte-identical.
  /* v2.2.0 PRODUCTION RELEASE (row 441, owner ruling q-row441-ref-and-bridge 2026-08-06): both pins
     below re-minted for the master merge. index.html gained the two owner-APPROVED RAISE Summit
     paragraphs (§7 Anthropic realized-profit, §10 OpenAI trajectory) and its footer release
     manifest now reads v2.2.0-2026-08-06 / data as of 2026-07-26. engine.js gained the same two
     MARGIN_CLAIMS records with the analyst-characterization provenanceTier, the version identity
     bump, and the LEGACY BRIDGE appended to bridgeLine (FA-arc rows G1A-1/G1A-3). NO COMPUTED
     VALUE MOVES — the WIDE 180-state hash above is UNCHANGED and the tripwires are exact at
     59.18058739356502 / 68.98395363429421. Evidence-board records and prose only. */
  /* v2.2.0 live-verification fold (same release, 2026-08-06): engine.js re-minted ONCE more after
     verifying the legacy bridge against the DEPLOYED page. The first copy said a link shared before
     this release "restores with a drift notice"; the live check showed that is true only for v5+
     tokens — every link the ≈77% page itself minted is pre-v5 and is deprecated wholesale, notice
     and all. The sentence now states both paths. NO COMPUTED VALUE MOVES — the WIDE 180-state hash
     is UNCHANGED and the tripwires are exact at 59.18058739356502 / 68.98395363429421. */
  /* row-514 opener enactment (2026-08-09, adjudicated esc-20260809T001150Z-18a9186a, gate
     d-opener-enact-20260809): engine.js pin re-minted for TWO changes and nothing else —
     (1) LANDING_DEFAULT_PERSP_ID gptpro-ctx -> gptpro-r3 (the owner's voice-accepted round-3
     opener; an OPENING-SELECTION move, explicitly not a DEFAULTS move per its own declaration,
     re-interpreting no token), and (2) the gptpro-r3 six identical NVIDIA leg ranges carried as
     the ONE family-scoped range the engine resolves onto exactly those legs (values byte-
     identical 0.90/0.95/1.00; the >12-dial fail-closed cap untouched; the landing default's
     compounded band now COMPUTES: 10 live dials, 1024 corners, point 83.0561 unmoved).
     Measured, not asserted: link-stability base=master head=HEAD {pairs:180, moved:0,
     unresolvable:0, worstDelta:0}; DEFAULTS untouched; DEFAULTS_EPOCH v23r499 unchanged (the
     branch's own bump, first served by THIS deploy — no additional bump per the standing
     design, permalink-and-epoch.md). */
  /* M8 RECONCILIATION re-mint (2026-08-12, d-im-m4): engine.js pin re-minted for the ONE
     decode-validator scope fix — the preset+blend contradiction row is now CLEAN-identity-scoped
     (`&& !d._meta.modified`, engine.js decodeScenario fleet table). Before it, encodeScenario
     minted modified-identity tokens its own decoder refused whenever the state's blend differed
     from DEFAULTS (every exploration route after any dial edit): assertSelfDecodable threw on the
     Share click, live-reproduced at ec7f360 and on master 6b1c71c. No computed value moved — the
     change admits previously-refused tokens on decode and mints previously-crashing links on
     encode; the C-7 fixture table keeps the clean rejection and adds the modified round-trip. */
  /* M8 gate-R1 fold (M8-R1-01, 2026-08-12): pin re-minted again for the SECOND carve-out of the
     same class — the preset-totalCase + explicit-total contradiction row is now clean-identity-
     scoped too (every model outside TOTAL_CASE_SCOPE carries totalCase "preset" with a preset
     total ≠ DEFAULTS.total, so a modified state of such a model could not mint a share link).
     Decode-only again; C-7 pins the out-of-scope round-trip, C-8 keeps the clean rejection. */
  /* M8 gate-R2 fold (M8-R2-01, 2026-08-12): pin re-minted for the stale-label normalization at
     the MODIFIED mint — a model switch while modified carries FLEET_ID/TOTAL_CASE_ID across scope
     boundaries; the encoder now downgrades a no-longer-applicable label to "custom" (values ride
     the diff) instead of minting a token the decode contract's scope rows must reject. Decoder
     untouched this round; clean identities never normalized. C-7 pins all three stale shapes. */
  /* CENTROID WIRING re-mint (bq-231 / M8, 2026-08-12-13): engine gains the exact-centroid mean
     mix inside mixBand (centroidOnSum lifted verbatim from the reviewed reference
     tests/mix-centroid-reference.mjs; mean joins the regime sample set; meanIsExpected gates the
     expected-margin claim on the regime signature) and app renders the derived-fleets stat as the
     margin AT the mean mix (band-mean line; declared reference kept separate; ruling-C
     vocabulary). ADDITIVE: no existing rendered value moves — mixBand's prior fields are
     byte-identical (mix-band suite green incl. the memo-§3 trap rows: asymmetric 50.922 vs the
     projection's 50.833, skewed 85/7.5/7.5, k=2 midpoint), and the WIDE 180/255-state hash does
     not consume mixBand. Sink registry 443 → 449 (+6 = the mean line's own writes), classes
     exactly ten. */
  /* CENTROID-GATE R1 FOLD re-mint (2026-08-13): (P0-1) centroidOnSum gains the
     complement-symmetry reduction + fail-closed postcondition — upper slivers cancelled
     catastrophically (a legal 10-block declaration returned a mean summing to 4,116 against
     T=540); the reduction solves the lower sliver and reflects, exact; out-of-certification
     means return null and the line suppresses. Reference module fixed identically. (P0-2) the
     expected-margin gate now ALSO requires a structurally fixed denominator (every varying
     leg renderable) — a constant survivor set alone leaves the objective linear-fractional
     and f(E) ≠ E[f] (measured 0.0034 pp on the strained fixture, now asserted DENIED there).
     (P1) the rendered sentence speaks in the band's own T. All asserted in mix-band. */
  /* CENTROID-GATE R2 FOLD re-mint (2026-08-13): (P0) the float inclusion–exclusion is
     REPLACED by an exact BigInt integer core — floats are dyadic rationals, denominators clear
     to a shared power of two, the whole construction runs in integers and rounds ONCE at the
     final division; the flip-boundary counterexample drops from 1.7e-3 to terminal-rounding
     error, symmetry-asserted. (P1) zero-width blocks pin-and-reduce instead of collapsing V.
     (P1 pre-existing) band-head + reference-basis copy now speak in the band's own T alongside
     the mean sentence. Both centroid copies fixed identically; all asserted in mix-band.
     R3 residue fold (PASS-WITH-FINDINGS): k=1 clamp refuses infeasible T; pinned branches share
     the tolerance discipline; sums-clause trigger reads band.T; flip row tightened to 1e-12.
     M8 EXIT-GATE COUNCIL FOLD (2026-08-13, F1-F5): the FA landing-lead clause DERIVES from
     landingReading (T-3b agreement rows; memo section 2.9 lockstep); mixLabelParts clauses are
     denominator-aware (tWord); the modified-identity staleness rule is ONE exported helper
     (normalizeModifiedIdentities) applied by encoder AND sender UI; copyScenarioLink catches
     encoder invariant failures with a visible refusal; the public changelog's affineness claim
     carries a dated correction to the regime-constant linear-fractional argument.
     V3.0.0 ALIGNMENT re-mint (2026-08-13, Polaris ruling esc-1df204c8 per plan D-10): ENGINE_REVISION
     v2.2.0-2026-08-06 → v3.0.0-2026-08-13 with its prepended history segment — version identity
     ONLY; headline invariance separately proven at m8-headline-invariance-evidence.md. */
  /* OWNER-ANNOTATIONS re-mint (2026-08-17, owner note 514e03) — ADDITIVE METADATA ONLY, no
     computed value read or moved. Three additions, all for annotation nd4f4c7 and nbc7fc1:
     (1) `loadScope` on the five exploration routes and the gptpro lens — which model a route
     loads onto, already implicit in every existing load-op link on the page; (2) `hjLoadOps`,
     which JOINS a higher-justification entry to a route by TYPED claimAnchor intersection and
     emits `rangeLabel` as a pre-formatted STRING rather than lo/hi numbers, deliberately, so the
     T-9 FA-numeric-surface gate stays exactly as strict as it was (T-9 caught the numeric version
     and was right to); (3) `subjectShort`, minted beside the long `subject` so a title-length line
     and the full scope declaration cannot drift apart. The gptpro lens gains a claimAnchor that
     asserts nothing new — its own note and the g3 entry already declared the adaptation
     relationship from both sides. The WIDE 270-state render-parity hash above is UNCHANGED and
     both tripwires re-derive exact. */
  /* im-arc T1: re-minted for null-default absolute-rent keys, their fail-closed map sanitizer,
     and the three exported read-only basis/spread derivations. The WIDE digest above proves the
     null-default path moves no rendered quantity. */
  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): re-minted for the pure
     signed stack-row derivation shared by renderer and Node suite; WIDE is unchanged. */
  /* im-arc T2 Commit B (memo §§2,5): sectionBand plus mixed-basis/PUE energy
     receipts; ordinary flattened consumers remain WIDE-byte-identical. */
  /* im-arc T2 Commit C (memo §6): DEFAULTS.kwh now reads the registry's 0.0871
     US-industrial midpoint. AS OF T2 the historical 270-state component remained f98b97a1…
     because its 240 rent-basis states ignore electricity and its only 30 owned-TCO states
     are x90-v1/x90-v2, both enumerated historical pins at 0.07. SUPERSEDED BY im-arc T4 fold
     (2026-08-24) for the FIRST clause only: the fold's default moves take the live component
     off f98b97a1…, while the reason given here still holds and is why those thirty x90 records
     reproduce byte-for-byte under the pin bundle. The receipt itself is re-earned by execution
     in tests/t4-receipt-reproduction.test.mjs. WIDE now adds and
     characterizes the three moving generic-owned-TCO audit states directly:
     forced-tco:median -0.1643376282 pp, forced-tco:gptpro-r3 -0.1066516334 pp,
     generic-default:opus -0.2096314938 pp; max |delta| = 0.2096314938 pp. */
  /* im-arc T2 fix (Sol review 2026-08-23, findings P1-1/P1-2/P1-3/P1-4/P1-5/P2-1):
     engine pin re-minted for section repricing, exact share vertices, finite-corner
     refusal, semantic-compatible v6 provenance, honest electricity receipts,
     pre-deletion guards, section-aware counterpart bands/tables, and exact
     preservation of matching non-inherit legacy declarations. */
  /* im-arc T2 fix-2 R1/R2: source pin re-minted for the shared planning-rent
     resolver, optional byHw receipt/unavailable row, and all-raw-leg guard.
     No WIDE state carries a custom byHw fleet; both WIDE hashes stay fixed. */
  /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
     engine pin re-minted for explicit tiers plus the pure registry composition,
     coverage rendering and validator-schema bridge. No DEFAULT or WIDE value moved. */
  /* im-arc T3 registry-projection follow-through (2026-08-22): company model
     membership/defaults now derive from MODELS.lab + existing dossier flagship wording. */
  /* im-arc T3 fix (2026-08-23): whole-file re-mint for the reviewed registry
     fallback, coverage, stress-composition, rounding, normalization, and corner-eval fixes.
     Historical WIDE pins above remain literal and green. */
  /* im-arc T3 final review: re-minted after fallback receipts became derived runtime
     results and lessor spread adopted the same effective stress fleet as margin/cost. */
  /* im-arc T3 FIX-2 B1 (2026-08-23): source pin re-minted after cf: sections
     became authoritative over the blend mirror and v7 stopped carrying derived
     receipt fields. Codec-only: the characterized WIDE delta above is B2 alone. */
  /* im-arc T3 FIX-3 (2026-08-23): whole-file re-mint for the coverage display fix (C1,
     one-decimal rounding in coverageForFleetSections + whole-number formatting in
     coverageSentenceParts) and the not-composed composition receipt (C2). Both are
     DISPLAY/RECEIPT surfaces: every WIDE state hash above is unchanged and was
     re-executed, because wideRecord() deletes `coverage` from the hashed record and
     no numeric margin, cost or feasibility field moved. */
  // T5 recs 1/4/5 — see the app.js note above; the WIDE state hash is unchanged.
  /* T5 ROUND 6 (2026-08-27): re-minted for the rec-5 fix round 5 said was NOT done. Ranking
     ASSERTIONS are removed from every token that renders inside <section id="final-answer">:
     the g2 head lost "(the strongest external analyst hypothesis)" — the exact leak round 5
     named — and its wouldFlip lost "the strongest external hypothesis", which described the same
     object. TWO further superlatives were examined and DELIBERATELY LEFT: g1's "the strongest,
     the owned-TCO route" ranks this page's own computed routes by magnitude, and "Naming the
     most plausible closer" names the page's own inference; neither ranks an external claim's
     standing, and both sit inside content ratified as exact old->new pairs in
     esc-20260801T045418Z-71b767cc. Editing them would have meant silently rewriting ratified
     text to satisfy a rule nobody had applied to it. The outward POINTER in
     higherJustificationsHeader also stays: it is the sentence that sends a reader to where the
     ranking legitimately lives.
     ROUND 6 addendum: the selectable `stress-public-rate` PRESET carried its OWN copy of the
     superseded pair in its `note` — a surface the round-5 sweep never
     looked at, rendered by app.js AND published through MCP scenario discovery. Corrected to the
     executed 51% / 57%, and the superseded-figure sweep now runs over EVERY served asset from the
     manifest rather than two named files, which is what let this one survive.
     ROUND 7 addendum: a dated marker added to the row-499 design note, whose "~69% to ~59%" is a
     COUNTERFACTUAL OF ITS OWN ERA quoted to describe a defect that was prevented. It is not a
     current published reading and must not be re-derived against today's engine; leaving it
     undated invited exactly that misreading in a sweep. Comment only.
     STRING TOKENS ONLY — every WIDE state hash above is unchanged and was re-executed; no
     numeric margin, cost or feasibility field moved. The claim is now enforced by property
     rather than by watching one node: fa-m6-b9 derives the wired node set from app.js, walks
     each node's ancestry, and asserts no ranking assertion reaches anything inside the answer,
     with mostPlausibleLine as the non-vacuity control. */
  /* im-t5 MERGE candidate (2026-08-29) — engine-first base, minimal's cost centre 3 grafted on,
     maximal's assertion-path garbage removal grafted on, and engine-first's two precomputed
     legal-width tables DELETED. Re-minted for six changes to this file, none of which can move a
     rendered value. Each, and why it is identical by construction:
       (1) ED_CAPACITY resolves five engine-data specifiers at module parse instead of inside
           solveCapacityWidth and rooflinePoint. Identical by construction: a cached require()
           returns the SAME exports object every time, and the stored property values ARE the
           registry objects, not copies, so a test or caller that mutates a registry row is still
           seen live here. Same idiom ED_FLEET already ships in production.
       (2) rooflineCore() holds the resolved module after first use. Same reason; the dual-mode
           browser/node branch is unchanged, only its repetition is gone. Nothing in this repo
           assigns onto the object rooflineCore() returns, so a shared instance is unobservable.
       (3) clonePresetValue returns primitives unchanged instead of routing them through
           structuredClone, which returns an equal primitive and gives a primitive no identity to
           detach. Objects, null, and the function/symbol values structuredClone is REQUIRED to
           reject all still go through it, so an uncloneable preset fails exactly as loudly.
       (4) blendedLessorSpread takes a third parameter (grafted from the `minimal` candidate).
           `opts.shareOnly === true` returns the same four leading fields WITHOUT the two
           marginOnBasis() calls that exist only to fill rentCostPerMtok / tcoCostPerMtok — two
           fields adjust_rental_rate never reads, at one structuredClone and one full workload()
           evaluation each. The four expressions are copied VERBATIM from the return statement
           below, including the `isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0` guards, so
           the share-only path cannot diverge from the full path on a degenerate rent (checked by
           executed text comparison, not by reading). Every existing caller passes no third
           argument and reaches the ORIGINAL return statement, unchanged byte for byte. NO export
           surface changes, so the sealed export-contract pin in tests/capacity-solver-r1.test.mjs
           stays untouched — that is why the third argument was chosen over a separate exported
           function. It is an API EXTENSION and is named as one in the deploy note: a caller that
           passes an options bag carrying a truthy `shareOnly` now gets four keys where a third
           argument was previously inert. No such caller exists in this tree or in any of the
           eight MCP tools.
       (5) The lazy-getter alternative to (4) was tested and rejected: it turns two data
           properties into accessors (observable in a property descriptor) and defers
           marginOnBasis past a point where the caller may have mutated `s`.
       (6) DELETED relative to the `engine-first` candidate: CAPACITY_LEGAL_WIDTHS and
           capacityLegalWidths. That table was gated on the IDENTITY of each row's
           hardwareLegalShapes object, so an in-place mutation of a registered shapes object's
           CONTENTS would have gone unseen and the table would have served a stale width set.
           Its author priced the deletion at 4.0% of allocation and ZERO cost to the promotion and
           plateau results. Deleting it also restores solveCapacityWidth's receipt.legalShapeSet
           to a FRESH MUTABLE per-call array — executed: Object.isFrozen false, not aliased across
           two solves, .sort() and .push() succeed, identical to a pristine checkout of this
           commit and to the tree before this round.
     Executed, not asserted, against an INDEPENDENT pristine checkout of the same base commit
     (1584179) built in its own worktree: a 849-case cross-TOOL grid over ALL EIGHT MCP tools
     (run_scenario 619, run_fleet_sections 24, explore_range 82, get_dossier 39, get_report 19,
     list_scenario_space 1, query_margin_claims 10, adjust_rental_rate 55; 109 legitimately
     isError, 0 uncaught throws) renders 27,194,812 bytes hashing
     ab33f42bed5c62ea2213411e2995d029b734eb795db56ee6898af0cc5b1c9571 BEFORE and AFTER —
     identical, with 0 differing per-case digests. A 224-probe assertion-message differential
     (199 of them throws) covering every rdScaleCheck and assertTopologyCase branch at case
     indices 0, 1 and 2 hashes 9c9a1aa267ff4cfb8005eba42eda6d63907fd292556df8d381d0d0169ba3e334
     on this tree, on that pristine checkout, and on all three earlier candidate worktrees.
     A 1,000-probe direct engine differential is identical on 936 probes; the 64 that differ are
     all the probe's own deliberate blendedLessorSpread(s, undefined, {shareOnly:true}) call,
     where the four shared fields are bit-identical and only the two extra keys are absent.
     Effect, the reason the round was authorised: bytes ALLOCATED per adjust_rental_rate
     invocation of the exact production challenge {company:"anthropic", rent 6.281173,
     gptpro-r3, capital_recovery on, cost_of_capital 8.5} 463.2 -> 93.3 MB (-79.8%; two reps
     each side, alternated, marker-free --trace-gc slope (N=12 - N=4)/8 at
     --max-semi-space-size=1, zero unmatched GC lines on either side), and bytes PROMOTED into
     old space 15.49 -> 0.42 MB (-97.3%; v8.getHeapSpaceStatistics old_space
     deltas, two reps). Node wall median 449/431 -> 180/179 ms; workload() evaluations
     319 -> 115, capacityWidthSolve calls 8,867 -> 5,765, marginOnBasis calls 204 -> 0. The workerd committed-heap plateau is NOT lowered.
     Measured to N=80, two reps each side, alternated, on one persistent local workerd isolate
     per run read over its own inspector: before plateaus at ~94.5/94.0 MB and after plateaus at
     ~95.5/96.5 MB. What moves is the number of calls an isolate takes to get there. The before
     curve has one riser, at call 3 (56.0 -> 88.8); the after curve has two, at call 15
     (42.8 -> 59.0) and call 47 (63-67 -> 95.8). First call reaching >=85 MB: before 3 and 3,
     after 47 and 47 — a ~15.7x DELAY of the ratchet, not a lower ceiling. Stating this as a
     lowered plateau, as an earlier candidate in this round did from a run that stopped at N=25
     on a flat tread six calls before the next riser, would be false. Local workerd enforces NO
     per-isolate memory cap, so none of this is proof of a production fix; it is evidence about
     the mechanism only, and the deploy must be verified by reading the outcome off a failing
     call under `wrangler tail` against a SETTLED deployment. */
  /* RE-MINTED 2026-09-02 (im-share-finalization): GPT Pro 2026-07-29 rec 7 applied via its second
     branch - the grok row gains a `tariff` record effective-dating its cacheReadMult (validFrom
     2026-07-08, the published $0.50/$2.00 source, reVerifiedSince false, and the review's contested
     15% recorded as UNCONFIRMED). PURE METADATA: cacheReadMult is still 25 and every WIDE parity
     hash above is unchanged and was re-executed, which is the executed proof that no displayed
     value moved. Flipping the RATE would move numbers and belongs to the consolidated tariff touch
     (BACKLOG section 2), not here. */
  /* SECOND RE-MINT, same day (owner note d85f73): the sonnet `tariff` record is corrected from
     {validUntil 2026-08-31, flipTo $3/$15} to {validUntil null, permanentSince 2026-08-10,
     reVerifyAfter 2027-03-01} with its primary-source URLs, and the two priceIn/priceOut provenance
     labels plus the §10 falsifier stop describing an introduction that ended. METADATA AND PROSE
     ONLY — priceIn/priceOut were and remain 2/10, and no WIDE parity hash moves. */
  /* RE-MINTED again 2026-09-02 (round 2). engine.js now carries the grok tariff PROVENANCE record
     — activeValueIsStale, cacheReadMultActive 25, cacheReadMultVerified 15, the first-party URL and
     the superseded launch rate — plus the reader-facing note saying the computed value is known
     stale. The COMPUTED value is unchanged at 25, which is why every WIDE parity hash above is
     unchanged and was re-executed. The rec-7 record above says why the correction is derived and
     mapped but not applied here. */
  /* RE-MINTED again (same review, BLOCKERS 2-3 and findings 5-7). engine.js now carries a
     DISCRIMINATED tariff schema — current / scheduled / verification / history — replacing two
     incompatible shapes under one key, and the sonnet dossier anchor no longer quotes wording its
     own live URL contradicts (the superseded quote is kept as dated history). No computed value
     moves: prices were and remain $2/$10 and $2/$6, and tests/tariff-contract.mjs now ASSERTS that
     tariff.current equals set.priceIn/priceOut so the record cannot drift from them. */
  /* Re-minted once more for round-3 findings 8 and 9: the verification horizon shortens from 91 to
     30 days with an accountable owner and a named procedure (a longer one is decorative while the
     intake gap bq-1873 is open), and the long incident narratives collapse to single pointers at
     BACKLOG section 2 so the same mutable facts stop being restated across source, two test twins,
     notes and the dossier. No computed value moves. */
  /* RE-MINTED 2026-09-10 (im-guard-fix), and the delta evidence the pin demands is that NOTHING
     RENDERED MOVED — asserted by the rest of this file rather than promised here. Every WIDE hash
     above, every historical receipt reproduction in tests/t4-receipt-reproduction.test.mjs and all
     180 v2.2 contract pairs are byte-identical across this change; the ONLY reason this whole-file
     freeze moves is that the file's bytes did. Two changes are in it:
       * bq-2196 — rooflinePoint() gains the absent-by-design branch for a no-domain registry row
         asked for a regime it declares no cell for. RUBIN is a projection row with only `balanced`,
         so `applyPreset()` threw on 132 of the 288 model x perspective pairs and the
         cost-per-generation chart rendered as NOTHING on every one of them. The branch returns a
         typed no-render state instead; the hard error is untouched for any row WITH a domain, which
         is the case memo §4/§6 was written for. No number the page prints changes: RUBIN's column
         was already drawn as an unpriced-projection placeholder with its computed cost discarded.
       * bq-2192 — the gptpro-r3 row records `companionDesignation`, the field the council's
         question asked for and nothing carried, plus the re-measurement of a reproduction claim
         whose literal had gone stale. Comments and one added string field; no computed value.
       * bq-2194, the SECTION half — fleetRenderable.sections[].renderableShare now renders a
         section's own declared share when every leg in it renders, instead of a float sum landing
         one unit in the last place above it. `sections` is an additive T2 receipt and is outside
         every hash above, which is why nothing here moves for it.
     THE FLEET-LEVEL HALF OF bq-2194 IS DELIBERATELY NOT IN THIS MINT, and it was measured rather
     than assumed: splitting the published renderableWeightShare from the renormalization divisor
     re-mints five WIDE constants, this freeze, eighteen v2.2 baseline pairs — and breaks all three
     historical receipt reproductions, whose whole claim is that the LIVE engine plus a declared pin
     bundle still reproduces a pre-T4 receipt bit for bit. Zero margins move either way. Trading a
     reproduction proof of what the engine used to compute for one ulp in a field both publication
     boundaries already normalise is the wrong way round; the measurement is on bq-2194. */
  /* RE-MINTED AGAIN 2026-09-10 (im-guard-fix), for the owner ruling
     d-20260910-im-r3-lead-diagnostic-recompute — card q-im-r3-lead-diagnostic-designation,
     answered 16:09:47Z, option A: "recompute on all three surfaces and keep it recomputed".
     ONE string field moves: gptpro-r3's `statedReading.companion` now reads
     "the lead-only diagnostic across 0-4 months is 78.89-85.37 %" where it read 80.48-86.47 %,
     plus the comment above it, which stops raising the question and records the answer.
     THE VALUE IS EXECUTED, NOT QUOTED: sweeping trendMonths 0..4 through
     applyPresetSettings(opus, gptpro-r3, {mode:"explicit", profileId:"reference"}) and reading
     workload().margin * 100 gives 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653 at discount 0 /
     batchShare 0. NOTHING COMPUTED CAN HAVE MOVED, and the diff is what says so: this change is
     one string field and comments, and `statedReading.companion` is read for display and by the
     face-vs-registry guard, never as a computation input. Every WIDE hash above, the T4 receipt
     reproductions and the v2.2 contract pairs are byte-identical across it, which corroborates
     that over the pinned states. One PUBLISHED string moved, onto what the engine computes.
     Option D was NOT chosen. The row keeps its "QUOTED, not computed here" clause and bq-2191
     stays open for it; the author's own 83.1 and 68-92 are untouched. */
  /* RE-MINTED 2026-09-12 (im-default-window-and-mcp-discrepancy), for owner voice note
     note-20260912T180812Z-c9eaac ("where's this small discrepancy coming from") and the bq-2334 residue.
     WHAT MOVES is display strings and one display-only record, no computation input:
       * gptpro-r3 and fable-r3 `statedReading` gain `authoredAgainst` {date, engine, computed, route}: what
         this calculator computed for the unchanged settings when each figure was stated (83.0561 and
         77.3145, executed from site/engine.js at c45c2c3 extracted with git archive); statedReadingClause()
         renders it with the calculator's own move since, derived from the live computation;
       * preset and model notes stop describing earlier computations as current (bq-2334 R14-R17): Grok
         cache reads at 15 % since 2026-09-10; the stress case no longer claims public-rate-card
         reproducibility; fable-ctx ~75 -> ~74; gptpro-ctx ~80/~77 -> ~79/~76 and its public-rate stress
         case 64.13 -> 62.99 (this page's rents, 50 % occupancy, list-only billing, the object the
         2026-08-06 proposal defined); fable-r3 and gptpro-r3 dated to the engine that measured them.
     NOTHING COMPUTED MOVES: `authoredAgainst` is read only by statedReadingClause(), and every WIDE hash
     in this file is unchanged across the edit (executed). The author's own 83.1 / 68-92 and 77 / 65-82
     are byte-untouched. */
  /* RE-MINTED AGAIN 2026-09-12, same leg, for Astra review round 1 finding F1: the dated-reading sentence was
     compared with whatever the caller computed, so on another model it attributed that model's own difference to
     "later calculator changes". It is now computed at the authored scope recorded in `authoredAgainst`
     (model, profileId, scopeLabel added) by authoredScopeReading() / authoredScopeSentence(), and names that
     scope. Still display-only: no computation input moves, and the WIDE hashes above are unchanged (executed). */
  /* RE-MINTED AGAIN 2026-09-12 for the Astra round-2 fold: F2 statedReadingClause(p, computedPct, opts) — given
     opts.atScope, the reading at the estimate's own settings (STATED_READING_SCOPE, authoredScopeLabel), a different
     on-screen object is named as such and the gap is stated at the estimate's own settings; a two-argument call is
     unchanged, and the standing margin-band pins on it pass untouched. F5 the fable-r3 note says its 0.9159-month
     equivalence is represented by a one-month midpoint (both 77.31 and 76.33 computed at one month). Display strings
     and one frozen scope record; the WIDE hashes are unchanged (executed). */
  /* RE-MINTED AGAIN 2026-09-12 for the Astra round-3 fold: F2 the off-scope sentence names the preset's UNEDITED
     settings on the selected model and traffic ("Applied unedited to the model and traffic mix selected now"), since
     after a slider edit that reading is not the on-screen result; F9 the final-answer landing and prior-reading lines
     name the page's built-in opening state ("OPENS on by default, its built-in opening state ...", "by default it
     now opens on"). tests/fa-m6-b9.test.mjs's template, memo §2.9 and answer-wording digest were re-pinned with the
     ranking reading recorded, and a mutation control against the pre-fold wording turns both rows red
     (evidence/mutation-control-fa-m6.txt). Display strings only; the WIDE hashes are unchanged (executed). */
  /* RE-MINTED 2026-09-19 for the im-vet-0919 Astra round-1 fold (pack A P0-1): tokPerS() now
     brings dense-TP PREFILL onto the per-accelerator basis its two consumers (costPerMtok,
     energyPerMtok) require, by dividing the replica rate prefillRoofline returns by the shard
     width. The frozen Φ_pre_dev = Φ_pre/N branch in engine-roofline-v22.js and its guard in
     tests/roofline-core.test.mjs:674 are UNTOUCHED and that file's freeze hash below is
     unchanged — the equation was never the defect, the basis it was priced on was. A RENDERED
     VALUE DOES MOVE on this path, and only on this path: custom/llama70 at h100/bf16, solved
     width 16, went from $0.0764/Mtok of input and a 96.6473% margin to $1.2231/Mtok and
     73.0720%. It had been claiming 281.3% of one H100's peak BF16 FLOPs — exactly 17.581%
     (= η_pre_eff) of sixteen of them — while being charged one accelerator-hour. `tokPerS`
     itself still returns the RAW roofline rate, so the parallel-diff prefill identity is
     unchanged; the division lives in the new pricedTokPerS() that costPerMtok and
     energyPerMtok call. ROUND-2 AMENDMENT (same day): that wrapper first took its divisor from
     `widthRendered`, which projection rows do not carry — Rubin fell through uncorrected at
     17.737187873272283 Wh/Mtok of input energy where the per-accelerator figure is
     141.89750298617827 — and it resolved the roofline point a second time, taking a renderable
     leg from three capacity solves to four. It now resolves the point once and takes the
     divisor from the prefill result's own nShard; the solver is back to 15 solves for the
     five-leg default, and both properties are pinned in the guard. No shipped
     model/perspective pair renders dense-TP (0 of 288 enumerated), so no §10 headline, no
     provider replay and no WIDE-hash state moves; the WIDE hashes above are unchanged
     (executed). The mutation control is tests/dense-tp-prefill-basis.test.mjs, which is red on
     the pre-fold engine. */
  /* RE-MINTED AGAIN 2026-09-19 (Polaris ruling on Astra pack A P0-2 and P0-3): marginBand keeps
     its extrema search and drops its exhaustiveness CLAIM — the probe values it already computes
     are checked for containment, a point whose own settings sit inside the declared box may not
     fall outside the band, and both labels now describe the search rather than promising it was
     complete. sectionBand stops calling a band exact when its own midpoint lies outside it (the
     declared mid is normalised independently of the sum-to-100 polytope the endpoints are
     searched over). A band's lo/hi are UNCHANGED in every case — only `exact`, the new
     `searchEscapes` / `pointOutsideBand` / `pointInsideDeclaredBox` fields and the label strings
     move, and the WIDE hashes above are unchanged (executed). Guard:
     tests/margin-band-searched-label.test.mjs. */
  assert("source freeze: site/engine.js matches the reviewed whole-file hash", fh("site/engine.js") === "0fd3cd851e669a298ee98d75a83f3b4622e5e98568bbb2aa6039837e16281d7b" /* RE-MINTED AGAIN 2026-09-25 for the review-of-record r1 fold (bq-3316: archived tag kept on the preset line, reader wording of the policy clause corrected, round-3 attribution corrected, fable-r3 note history moved to the changelog, 82.42->82.33 quote corrected to the engine's own value, stress line keeps 'policy-labeled'); WIDE, T4 receipts and the answer-DIGITS pin still UNCHANGED [engine.js] previous: 2c996e4461768c6c… */ /* RE-MINTED 2026-09-25 by im-legibility-merge-enact-0925 (bq-3316, the bq-1141 legibility merge builder half): PRESENTATION + COPY ONLY — M1 preset note into the dossier, M2 value/status split, M3b one name (planning baseline) for the 58% reading incl. the four FA templates + memo 2.9 amendment, M4 one-sentence standfirst, M7/M8 history to the changelog verbatim, M10 destination labels, M11 reader wording at the display funnel, M12 vocabulary, M13 masthead, M20 footer. EXECUTED: every WIDE pin and the T4 historical receipts are UNCHANGED, so no rendered engine quantity moved; the fa-explain answer DIGITS pin is unchanged. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-legibility-merge-enact-0925-work/evidence/remint.md [engine.js] previous: d7a73b502d95c643… */ /* RE-MINTED 2026-09-20 by im-share-ready-0920 (program bq-2998, share-readiness review), RE-MINTED AGAIN for the council's third group: PROSE ONLY. The four-arm review found the page explaining its numbers with tariffs the 2026-09-19 refresh had replaced (DeepSeek ~74%/$0.435-$0.87 vs an executed 86.467% on $0.66/$1.98; Gemini's Ironwood hour stated as ~$1.28 where the preset yields $1.62; GLM's card describing 8:1/41% where the replay computes 15:1/60%; Kimi's 4.6x becoming 2.02x; the Ascend decode ratio 1.49x -> 1.75x; the loao transfer headline 37% -> 47% once its inferred comparator is classed). MEASURED over both trees: 0 of 270 records move numerically and 0 hashed WIDE records move at all, so every WIDE pin and the engine-data freeze are UNCHANGED. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-share-ready-0920-work/evidence/render-parity-delta-2026-09-20.md */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 4, Astra xhigh review of round 3): the hardware help still published the retired 0.55 live coefficient beside a corrected calibration record, and the rationale still claimed BOTH sources publish in the output-only convention when only the rental anchor does — the x8/9 conversion is this page's, and it now says so. No number the engine computes moved. */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 3, Astra xhigh review of round 2): the E2 rationale is corrected where it made two FALSE claims a reader could disprove in one click, the cache-cost tooltip is moved off a stale 72.45% the methods box had already left, and the directional claim is narrowed from "every reading" to the measured 100 lower / 188 unchanged / zero higher across 288 combinations, with the quantities that RISE named. */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 2, completion-gate FAIL): the gate ruled that DISCLOSING E2's basis inconsistency is neither repairing it nor withdrawing the contribution. The TPU coefficient moved from the mixed 0.521 to 0.519 with both endpoints on ONE stated timing convention, two guards lost in the E1 re-scope were restored with executed mutation proofs, and the published figures moved the last fraction with them. */ /* RE-MINTED AGAIN 2026-09-20 by im-vet-six-repairs, ASTRA xhigh FOLD: the withdrawal is now disclosed on the exploration route cards and in the coverage sentence (findings 1 and 2), E2 is relabelled MIXED-BASIS with the inconsistency and the 0.525 alternative stated (finding 3), E3 names its decode evidence per leg (finding 5), the r4 §C2 quotation is RESTORED after the N1 pass had changed a word inside it, four reader strings the old checker scope had hidden are renamed including the hero label, and the round-3 card states the rounding convention it actually uses (finding 8). */   /* re-minted 2026-09-20 by im-vet-six-repairs: the Trainium withdrawal's membership path + exclusion clause (E1), three evidence-label downgrades (E5), the two GB-class precision-identity corrections (E2), the estimate-card and final-answer copy rewritten to the vector that runs (E4), the corrected 72.45% input share with its annex link (E3), and the N1 vocabulary release edit */, fh("site/engine.js"));
  // b9 M2 (delta manifest family 1/2): both hashes below re-minted for the topology-aware form.
  // The FILES moved; no RENDERED VALUE did — the reference blend is 59.1806% at both hashes and
  // tpu7 holds 393.153094 tok/s exactly, which is the milestone's acceptance (memo §10.1).
  // External adversarial review 2026-07-27: re-minted after correcting the
  // dormant expert-coverage branch from with-replacement draws to top-k
  // without-replacement inclusion. No shipped calibration selects that branch.
  // Re-minted after the core began enforcing registered maxPos against
  // ISL+OSL while preserving explicit unregistered status for absent bounds.
  // Re-minted after its capacity equation and solver-lifecycle comments were
  // corrected to describe the live R2 path; executable values are unchanged.
  /* im-t5 MERGE candidate (2026-08-29). Re-minted for seven changes to this file, none of which
     can move a rendered value; proved by the same executed 849-case cross-TOOL grid and the
     224-probe assertion-message differential recorded above the engine.js freeze.
       (1) The capacity solve's brand record no longer holds its own perWidth rows; the rows carry
           that same record as their own brand (RD_CAPACITY_SOLVE_ROWS, a WeakMap keyed BY the
           rows) and feasibilityRoofline compares brand IDENTITY. This is the change that removes
           the promotion: a WeakMap VALUE is released only by the MAJOR collector, so holding the
           36-row graph in the sibling map's value carried it into old space on each of the ~8,867
           solves an invocation performs. Retention strictly DECREASES; cardinality is unchanged
           at one entry per live solve result, and eviction is still automatic with the key.
           INTENTIONAL ERROR-SURFACE CHANGE, not an optimisation, and stated as such in the deploy
           note: a caller who substitutes result.perWidth for foreign rows used to have the
           substitution SILENTLY IGNORED (the rows were read off the trusted record) and is now
           REFUSED with a typed RooflineDataError. That is a fail-closed tightening of a sealed
           door and it is kept deliberately, together with the brand it exists to enforce. It is
           not adversary-reachable: capacitySolve objects are constructed only inside the engine
           (site/engine.js:1751 and :1762 are the sole production producers, and both pass the
           solve object straight through), and no `.perWidth =` assignment exists anywhere in the
           repository. The pre-existing forged-solve test in tests/capacity-solver-r1.test.mjs
           still fails at the earlier trusted-record guard and still matches /trusted capacity
           solve/. Because engine.js is served to every visitor, the release must be gated on a
           live site smoke render in addition to the Worker readback — a Worker-only verification
           cannot see a browser-side render throw.
       (2) capacityWidthSolve orders the caller's widths and the registered set ONCE each. The
           registered side was being re-sorted INSIDE the .some() callback that consumed it — once
           per element of the array being compared against it — and the caller's side was sorted a
           second time to build perWidth. Both operands are private .slice() copies, so neither
           `widths` nor the registry array is touched; same predicate, same corners, same error.
       (3) The unsharded per-token KV basis is hoisted out of the per-width loop; it is a function
           of the arch record and the precision tuple, on neither of which the width bears.
       (4) contextWindowStatus writes its shared fields directly instead of building a `common`
           object and spreading it. The key order below is byte-for-byte what the spread produced,
           in BOTH branches — which matters because mcp-server/src/tools/run_scenario.ts spreads
           this record verbatim into its published `context_window` object and branches on its
           `state`; run_scenario is one of the eight tools the 849-case grid drives, so that
           serialized key order is covered by an executed hash rather than by reading.
       (5) The maxPos refusal sentence is formatted by a module-level rdCount helper only where it
           is used, instead of through a closure allocated on every call including the
           overwhelming majority that return `reason: null`. That sentence is reachable from NO
           MCP tool; the direct engine differential reaches it and it is byte-identical.
       (6) resolveTrafficLengths composes its rdNum error label only on the throw path, with
           rdNum's accept condition inlined VERBATIM — anything rdNum would reject still goes
           through rdNum and throws the identical error.
       (7) Grafted from the `maximal` candidate, throw-path-only string and closure removal:
           assertTopologyCase takes (owner, caseIndex) and joins them with rdCaseWhat at throw
           time instead of the caller building `hwKey + ".topologySensitivity.cases[" + index +
           "]"` eagerly at ~279,632 calls per invocation; the evidence-class predicate is hoisted
           to module scope (it captured nothing, so .some() passes it the identical (element,
           index, array)); the per-row scale check is hoisted to rdScaleCheck instead of an arrow
           allocated fresh on ~17,700 calls to close over hwKey; the flops loop reads Object.keys
           rather than Object.entries (same keys, same order, one fewer two-element array per
           basis per call); and sensitivity.cases is walked with a plain for loop rather than
           forEach. assertTopologyCase is module-internal — it is NOT in the sealed roofline
           export pin — and assertHwRowUnits' exported signature is unchanged. rdCaseWhat's
           `caseIndex == null` guard exists only for resolveNShardValue's call site, which is
           unreachable at this commit (the line above it refuses any non-undefined nShardCase
           outright as a RETIRED channel, and decodeRoofline never forwards one) — verified by
           execution, not by reading.
       (8) DELETED relative to the `engine-first` candidate: RD_LEGAL_WIDTHS and rdLegalWidthsFor,
           for the same reason CAPACITY_LEGAL_WIDTHS was deleted from engine.js. assertDeclared-
           OperatingWidth and capacityWidthSolve enumerate live again, exactly as before this
           round; only the double sort in (2) survives from that area.
     No corner was dropped and no band narrowed. */
  /* im-t5-ultra DIRECTOR correction (2026-08-29), comment only, no executable line changed.
     A verification lens found ONE behavioural difference in ~21,700 probes across the whole
     merge, and it was undocumented: replacing `sensitivity.cases.forEach(...)` with a plain
     `for` loop changes what happens to a SPARSE cases array, because forEach SKIPS holes and
     the loop visits them as `undefined`. A sparse array now refuses at the case assertion
     rather than later at the defaultCaseId resolution. Both refuse the same malformed registry,
     neither is reachable through the public connector (the registry is authored, not
     caller-supplied, and no registered row has a hole), and refusing earlier and more
     specifically is the better of the two — but an undocumented behaviour change is how the
     next round inherits a defect, so it is written at the site. Re-minted for that comment. */
  assert("source freeze: site/engine-roofline-v22.js matches the reviewed whole-file hash", fh("site/engine-roofline-v22.js") === "15508ac9e66b2c66e23aca56a4517e56269390f12a5683dea9dcc2e43d1c3fc2", fh("site/engine-roofline-v22.js"));
  // External adversarial review 2026-07-27: re-minted after splitting the
  // GB300 measured observation from its analyst-set live coefficient. Values
  // are unchanged; only the source-record identities became non-contradictory.
  // Re-minted again after correcting the top-k probability DTO and the stale
  // prefill sensitivity arithmetic; neither changes the 180 shipped states.
  // Re-minted for evidence-class/range corrections and the explicit
  // source-informed-neutral operating-point labels, then for the effDec
  // throughput-target versus etaDec roofline-coefficient distinction.
  // Re-minted after correcting the stale traffic-profile comment: billCacheHit
  // is an independent control whose null default alone assumes equality.
  // Re-minted after the domain registry comment was corrected to name its live R2 use.
  // Re-minted after domain metadata stopped promising an already-live R2 catalog
  // and named exact legal slices plus cross-rack fabric/latency as unmodeled.
  // b9 spec-decode LEVER (chunk B + kernel element 2): re-minted for specDecBaselineStatus on
  // all 11 CALIBRATION rows (the typed baseline the credit reads), the ORDERED disposition
  // ladder, and the ratified per-leg reason copy. NO RENDERED VALUE MOVED: the T-1 pre-leg
  // identity oracle still reproduces 157f79d5…0702db at 9,932 bytes and the tripwires are
  // exact. Statuses are DATA the default path never reads — DEFAULTS.specDec is 1.00.
  // b9 spec-decode LEVER (kernel element 4, T-13): re-minted for `specDecBaselineBasis` on all 11
  // CALIBRATION rows — the typed, MECHANICALLY VERIFIABLE evidence array D-SD-3 requires, each entry
  // a verbatim quote with file:line or a committed probe with a pinned `expect`. ANNOTATION ONLY: no
  // etaDec, obs, weight or roofline field moved, and the WIDE 180-state hash above is unchanged,
  // which is the evidence that this is provenance and not calibration.
  // d-im-h800 2026-08-18: re-minted for NVLINK_CAP_LINEAGES + nvlinkCapLineage on all 11 rows (annotation only; WIDE hash movement fully accounted for above).
  // im-arc T2 (memo §3): every hardware row gained a null kwhPerKwh evidence hook; the executable
  // spec-decode citations were re-derived at their +14 line locations. Pricing invariance and WIDE unchanged.
  /* RE-MINTED 2026-09-02: one line-anchored self-citation moved (research/evidence-instances-v22.json
     1244 -> 1750) because rec 8's provenance work grew the JSON above those bytes. The bytes are
     unchanged and the gate re-reads them. NOTE the fix is a ONE-LINE comment in that file, because
     it cites its OWN lines and a multi-line note there shifted two other citations. */
  assert("source freeze: site/engine-data-v22.js matches the reviewed whole-file hash", fh("site/engine-data-v22.js") === "818665f7e347c869f883c45484d6e2f6eb7c87ccb8bf8789292ca711db2cda50" /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 5, Astra xhigh review of round 4): the SAME false attribution survived in etaStatus after deployedBasis was corrected — the record contradicted itself, and the contradiction regenerated into the authoritative ledger and its connector report. etaStatus now says NORMALIZED and names whose conversion it is. No number moved. */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 4, Astra xhigh review of round 3): the hardware help still published the retired 0.55 live coefficient beside a corrected calibration record, and the rationale still claimed BOTH sources publish in the output-only convention when only the rental anchor does — the x8/9 conversion is this page's, and it now says so. No number the engine computes moved. */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 3, Astra xhigh review of round 2): the E2 rationale is corrected where it made two FALSE claims a reader could disprove in one click, the cache-cost tooltip is moved off a stale 72.45% the methods box had already left, and the directional claim is narrowed from "every reading" to the measured 100 lower / 188 unchanged / zero higher across 288 combinations, with the quantities that RISE named. */ /* RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs ROUND 2, completion-gate FAIL): the gate ruled that DISCLOSING E2's basis inconsistency is neither repairing it nor withdrawing the contribution. The TPU coefficient moved from the mixed 0.521 to 0.519 with both endpoints on ONE stated timing convention, two guards lost in the E1 re-scope were restored with executed mutation proofs, and the published figures moved the last fraction with them. */ /* RE-MINTED AGAIN 2026-09-20 by im-vet-six-repairs, ASTRA xhigh FOLD: the withdrawal is now disclosed on the exploration route cards and in the coverage sentence (findings 1 and 2), E2 is relabelled MIXED-BASIS with the inconsistency and the 0.525 alternative stated (finding 3), E3 names its decode evidence per leg (finding 5), the r4 §C2 quotation is RESTORED after the N1 pass had changed a word inside it, four reader strings the old checker scope had hidden are renamed including the hero label, and the round-3 card states the rounding convention it actually uses (finding 8). */   /* re-minted 2026-09-20 by im-vet-six-repairs: the declared Trainium withdrawal on FLEETS["na-blend"] (E1), the TPU v7 numerator repair 0.55 -> 0.521 with its reconciled derivation (E2), gb200's price class observed-source-named -> analyst-set (E5a), and the trn2/trn3 SPECULATION relabels */, fh("site/engine-data-v22.js"));
  // R4 NEW-851-P1 (+ R5 refinement): worker/src/gen is BUILD OUTPUT minted by
  // worker/scripts/build.mjs — excluded from the FREEZE because its inputs are not all
  // pinned (catalog.gen.ts derives in part from site/research/*.html titles, editorial
  // content outside the R1 rendered-quantity contract), so its bytes can move with zero
  // emitter-source change; a mere worker build/typecheck must not move this hash. When
  // present, gen .ts files remain subject to the capacity-solver boundary scan (which
  // walks all of mcp-server/worker). The exclusion is EXACT-PATH — no real source
  // directory that happens to be named gen can be skipped.
  const files = []; const walk = (dir) => { for (const f of readdirSync(join(root, dir))) {
    const rel = dir + "/" + f; const st = statSync(join(root, rel));
    /* im-release-edit 2026-09-09: `economics` and `economics-node` are excluded for the same
       reason tests/sink-scanner.mjs excludes them — they are VENDORED BUILD OUTPUT, written by
       mcp-server/scripts/sync-economics.mjs and gitignored by mcp-server/.gitignore. Including them
       made THIS FREEZE depend on build state: the same commit hashes 49 files to 07e3394d… after
       `npm --prefix mcp-server run build` and 37 files to 640acd78… before it. That is not a
       theoretical hazard. `npm run gate` runs gate:site (which reaches this file) BEFORE gate:mcp
       (whose pretest does the build), so on a fresh checkout this freeze saw the pre-build surface
       while the pinned value had been minted post-build — a red gate on a clean clone, for a tree
       nobody had touched. The originals these are copied from are hashed at their own source path. */
    if (st.isDirectory()) { if (!/node_modules|dist/.test(rel) && rel !== "mcp-server/worker/src/gen"
        && f !== "economics" && f !== "economics-node") walk(rel); }
    else if (/\.ts$/.test(f)) files.push(rel); } };
  // R1-impl R3 F1: the freeze surface INCLUDES the Worker-native emitters (overrides,
  // worker src, worker build script) — a Worker-side rendered quantity (e.g. total_chars
  // in overrides/get_report.ts) can no longer move without tripping this hash. Extension
  // minted at HEAD; git diff 3e7a356..HEAD over the added paths is EMPTY, so this pin is
  // byte-equivalent to a 3e7a356 mint (worker/package.json is excluded: it changed for
  // the R2 F2 ship-gate fix and is build config, not an emitter — covered by the
  // no-co-emission scan instead).
  // R2 (manifest row): the concat list grew 20 → 22 files — src/claims-types.ts (shared
  // contract types) + worker/overrides/claims.ts (Worker contracts bridge) added.
  // b9 M1 (manifest row): re-minted for ONE file — worker/scripts/build.mjs, whose engine
  // ground-truth gate re-mints from 37.207 to 59.181 (the gate exists precisely so a
  // headline move is ship-blocking until a gated manifest re-mints it). No .ts emitter
  // source changed; the file COUNT is invariant.
  walk("mcp-server/src"); walk("mcp-server/worker/overrides"); walk("mcp-server/worker/src");
  files.push("mcp-server/worker/scripts/build.mjs"); files.sort();
  const mh = crypto.createHash("sha256");
  for (const f of files) mh.update(readFileSync(join(root, f)));
  const mhHex = mh.digest("hex");
  // Re-minted after retaining explicit deprecated receipt aliases while
  // adding the unambiguous capacity-target fields.
  // Re-minted after MCP infeasible responses began carrying the engine's typed
  // context-window receipt and exact no-number reason.
  /* b9 M5 (delta manifest): re-minted for the MINIMAL MCP copy touch plan §6.4 mandates —
     the site+MCP single-clause weld extends to new disclosures, so the route note's new
     reference-basis sentence enters APPJS_MIRROR (grep-welded to app.js byte-for-byte) and
     explore_range carries its own MCP-only basis clause. NO MCP tool, schema or shape changed
     (memo §3.7 holds: custom fleets remain non-MCP-addressable and no surface was expanded);
     the MCP suite is green with its default-state values re-minted by exactly ÷E. */
  /* 2026-08-22 Step 0 before im-arc T1: re-minted for the 2026-08-21 crash-fix
     commits fa4a6da/f53301e. Only MCP/Worker sources moved; the WIDE engine-state
     baseline above remains unchanged. */
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1): re-minted for no-change
     rejected-only prose and deterministic closed-map receipt serialization. */
  /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
     MCP concat grows 23→25 sources for adjust_rental_rate + run_fleet_sections;
     shared server/shape/labels/discovery/types and the Worker verbatim copy list move with them. */
  /* im-arc T3 §2.4 follow-through (2026-08-22): re-minted after every new
     machine-output triple gained its explicit basis + label metadata. */
  /* im-arc T3 fix (2026-08-23): whole-concat re-mint for uncertainty/provenance
     receipts, eight-tool vocabulary, and shared Worker/Node tool fixes. */
  /* im-arc T3 final review: re-minted for exact supplied-donor receipts and truthful
     registry-stress fleet scope; no historical WIDE member consumes these MCP fields. */
  /* im-arc T3 FIX-3 (2026-08-23): concat re-mint for run_fleet_sections' structured
     composition_receipts field and its Composition receipts sentence (C2). No tool,
     schema, or WIDE-consumed field moved. */
  /* T5 rec 5, round 3: re-minted for the connector half of the relocation. `mostPlausibleLine`
     left the `final-answer` catalog entry and got its own `analyst-hypothesis` entry, in BOTH
     the Node source and the Worker override, so the connector stops contradicting the page.
     No token bytes changed — only which entry carries which token. */
    /* T5 ROUND 8 (2026-08-27): re-minted for the adjust_rental_rate fix that resolves the 1102.
     metricValue no longer reads one metric off a record that computes all three, so the corner
     walks stop paying for blendedLessorSpread on the margin and cost triples. Measured: heap per
     call 70.1 -> 21.6 MB and wall 2,341 -> 1,136 ms, which is what took the Worker over the
     isolate's memory limit. VALUES ARE UNCHANGED and executed: eight cases across all four
     perspectives, both override forms, three companies and capital-recovery on hash identically
     before and after (683b3b19...f745, 372,792 bytes), and the Worker/Node byte-for-byte parity
     test stays green. */
    /* T5 ROUND 4b (2026-08-27): re-minted for the rec-5 connector fix. `analyst-hypothesis` carried
     `kind: "final-answer"`, and get_report keys its whole envelope off that tag — so one reply
     said "adopted judgment, not a calculator output" in the title and "LIVE engine-derived result
     surface" in the sentence beside it. It now has its own kind, in the Node source and the
     Worker override, with an envelope that says what it actually is. Seven review rounds missed
     this because each read the TEXT of the final-answer entry and none read the METADATA of the
     sibling entry that carries the ranking. Tokens and metadata only; no computed value moves and
     the WIDE hash above is unchanged. */
    /* T5 ROUND 4b, SECOND MINT (2026-08-28, third session): re-minted for the parity gate that
     protects the branch the first mint added. scripts/build.mjs is a Worker-native emitter and
     is inside this freeze; GET_REPORT_FRAGMENTS gained the three analyst-hypothesis strings —
     the envelope sentence, the note and the receipt origin — so the two transports cannot drift
     on the new branch without the build failing. Proven by drift: changing one word of the
     Worker override's sentence ("JUDGMENT" -> "JUDGEMENT") fails the build with
     "parity drift: overrides/get_report.ts no longer contains the Node original's
     analyst-hypothesis sentence". Gate text only — no tool, schema, token or computed value
     moves, and the WIDE hash above is unchanged and was re-executed. */
    /* T5 ROUND 4b, THIRD MINT (2026-08-28) — the MACHINE half of rec 5, which round 4b found and
     the first two mints did not fix. `registryEmitMeta("get_report", "verbatim archive fetch")`
     was called UNCONDITIONALLY, so the emitted claim's estimand told a machine consumer that the
     live calculator answer AND the adopted analyst judgment were both verbatim archive fetches —
     the same contradiction the leading sentence had, one layer down, on the layer an LLM parses
     rather than reads. The response kind is now derived from `entry.kind` through a
     `Record<ReportEntry["kind"], string>`, so a SIXTH kind stops compiling instead of silently
     inheriting a branch (proven: adding one gives TS2741). The three archived kinds keep the
     original string, so only the two live entries' estimands move. The stale tool description
     ("the ONE exception is final-answer") now names both live entries. Three more parity
     fragments pin the map and its call site on both transports.
     Metadata, estimand strings and gate text only; no computed value moves and the WIDE hash
     above is unchanged and was re-executed. */
    /* T5 OPTIMISATION CYCLE (2026-08-28, owner-authorised: one bounded round). Re-minted for the
     one change that round makes — `adjust_rental_rate` memoises its metric evaluation on the
     STATE'S CONTENT for the lifetime of a single handler call. Measured on the shape the release
     gate challenges with: workload() ran 709 times over 104 distinct states and
     blendedLessorSpread() 352 times over 102, so 85% and 71% of those calls were recomputing an
     answer already held. The duplication is structural — the margin and cost triples walk the same
     corners and read the same workload record, and the delta triple's `prior` re-evaluates exactly
     what the baseline triple already computed. Content keying is required rather than object
     identity, because every corner builds a fresh state and the delta evaluator mutates its state
     between two calls.

     Executed, not asserted: 111 cases across three companies, four perspectives, three rents, both
     capital-recovery forms and the by-hw override render 4,800,945 bytes hashing
     7e8421bd97a3630c4aa992b73557008825b0a947a5866891cff61c2e5851adc8 BEFORE and AFTER — identical.
     The Worker/Node byte-for-byte parity test stays green, and this file's WIDE hash is unchanged.

     Effect, the reason the round was authorised: peak in-call heap above baseline 67.5 -> 29.1 MB
     and wall 1,617 -> 513 ms. 67.5 MB in a 128 MB isolate is what returned Cloudflare 1102. */
  /* im-t5 MERGE candidate (2026-08-29): re-minted for the two MCP-side halves of the shareOnly
     graft and nothing else — mcp-server/src/tools/adjust_rental_rate.ts points its two
     blendedLessorSpread call sites at a module-level frozen `SHARE_ONLY` literal, and
     mcp-server/src/engine-types.d.ts widens the declaration with the optional third parameter.
     Both are the `minimal` candidate's forms, verbatim. The tool projects `.impliedShare` and
     nothing else out of that record, which is what makes the narrowing safe; measured on the
     exact production challenge, workload() evaluations fall 319 -> 115 and capacityWidthSolve
     calls 8,867 -> 5,765. No emitter and no other tool source changed. */
  assert("R1 freeze: all MCP TypeScript sources + Worker-native emitters byte-identical (concatenated hash)",
    /* im-t5-ultra DIRECTOR correction (2026-08-29): SHARE_ONLY is now Object.freeze'd. It was
       written `as const`, which is a TYPE-level assertion emitting no runtime protection, while
       the comment above and the candidate record both called it "frozen" — a verification lens
       caught the record describing a guarantee the code did not have. The object is module-scope
       and is passed by reference into an engine function that is also served to every visitor's
       browser, so freezing it is what makes the description true rather than the description
       being softened to match. Re-minted for that one call. */
    /* RE-MINTED 2026-09-02 (im-share-finalization): GPT Pro 2026-07-29 rec 13 applied to
       mcp-server/src/server.ts. Callers used to receive the raw Error.message, which can carry
       implementation detail, registry identifiers or unexpected source content. They now receive a
       CLOSED enum - invalid_request / refused_by_contract / internal_error - with a FIXED sentence
       per code, so nothing interpolates into the public surface; the diagnostic stays server-side,
       bounded to name plus 300 characters, with no stack and no argument values. No emitter and no
       tool handler changed, and no rendered value moves - this is the transport's failure surface
       only. */
    /* RE-MINTED 2026-09-09 (im-release-edit) FOR TWO DELTAS, DECLARED SEPARATELY.
       (1) THE ONE THIS LEG INHERITED. The dc-map stage-3 integration (commit b216807) added seven
       datacenter tools and the dcmap layer to mcp-server/ and never re-minted this hash, so the
       gate was ALREADY red on master before this leg touched anything — expected f376c05b…, actual
       e9f4f1d1…. That is what this freeze exists to catch and it caught it; it is recorded here
       rather than quietly absorbed.
       (2) THE ONE THIS LEG MADE. The language edition moves reader-facing report text, which the
       connector serves, so mcp-server/src/reports.ts's Node/Worker pair and the report-text parity
       expectations move with the page — the eight authorized text deltas are itemized in
       mcp-server/test/report-text-parity.test.mjs, and the three sections the edit did not touch
       (report-s4, s8, s9) are byte-identical to their prior expectations, which is the proof the
       edit stayed in scope.
       CORRECTED 2026-09-09, after a review could not reproduce the delta this note claimed. It was
       right that it could not: the hash was BUILD-STATE DEPENDENT, because the walk above was
       including the vendored economics directories. The value first pinned here, 07e3394d…, was a
       49-file post-build surface; the honest, build-independent one is 640acd78… over 37 tracked
       files, and that is what is pinned now. The dc-map delta (1) is still real and still what left
       this gate red on master — it is 13 TRACKED sources, not the vendored copies — and delta (2)
       is unchanged. No computed value moves under either.
       2026-09-10 im-release-edit-r2 — RE-MINTED FOR ONE SOURCE FILE, mcp-server/src/dcmap/layer.ts,
       closing burn-queue bq-2188 (the red gate:worker that blocked deploy.sh --prepare; assigned to
       this leg by Polaris because no dc-map stage-3 session is alive). `release_binding` — the field
       that says WHERE a datacenter answer's bytes came from, filesystem on the Node server and
       embedded at build time in the Worker — is the CONNECTOR layer's, not the producer's, which is
       why U3's OutputSchemas is strict without it. It was attached on the refusal path only. That
       was invisible while no dc-map release existed: every call refused, so every answer carried a
       binding. b216807 materialized a release, the success path ran for the first time, and the
       connector began answering with thirteen sites while saying nothing about where it had loaded
       them from. Be exact about the claim (Astra xhigh round 2, finding B2, correcting round 1's
       account): the response DID name which release answered — U3 stamps release_id on every
       envelope — so exact-release identity was never at risk. What was missing is loading
       provenance, and that is the one axis on which Node and Worker legally differ, so it is the
       axis a parity check must compare and cannot compare while one branch alone emits it.
       Both paths carry it now. NO COMPUTED VALUE MOVES: the
       field is transport provenance, no producer figure, sentence, receipt or release_id changes,
       and every WIDE parity hash above is unchanged and was re-executed. Pinned three ways so it
       cannot come back — new-tools-parity asserts it on both transports, dcmap-release-binding
       asserts the LAYER emits it for every tool rather than one branch, and the readback gate's
       ROUND 8 fixtures now answer list_datacenters so they reach their own assertions instead of
       stopping at the substrate check. Evidence:
       reports/im-release-edit-r2-2026-09-10/evidence/bq2188.json
       ROUND 2, same day: the Astra xhigh review of this change returned SOUND WITH FIXES and
       corrected the ACCOUNT above rather than the code. Its finding B4: a successful response
       always named its release — U3's `respond` stamps `release_id` on every envelope — so the
       first version of this note, which said callers could not tell which release answered, was
       wrong. What the success path omitted was LOADING PROVENANCE: whether the bytes were read off
       a filesystem or baked into a bundle, which is the one axis on which Node and Worker legally
       differ and therefore the axis a parity check must compare. The comment in layer.ts is
       rewritten to say that, and to state the consumer boundary the new field creates: a caller
       re-parsing the whole structuredContent through U3's strict OutputSchemas will now reject a
       successful response on `unrecognized_keys: ["release_binding"]`, and the answer is to project
       the producer fields first, never to loosen the producer schema. Nothing in this repository
       re-parses connector output that way. Its finding B2 was code: the refusal-path assertion
       cannot prove the success-path fix, verified by reintroducing the bug and watching that file
       stay green, so the success path is now pinned against a materialized synthetic release in
       mcp-server/test/dcmap-success-binding.test.mjs, which does go red on the same revert. */
    /* RE-MINTED 2026-09-10 (im-release-edit-r3) FOR TWO SOURCE FILES, owner ruling
       d-20260910-im-adopt-fleet-rents-and-correct-grok. Both are connector-side and neither moves a
       computed value.
       (1) NOT THIS LEG'S — mcp-server/src/tools/list_scenario_space.ts moved in d739962
       (im-release-edit-r2) and left this freeze red at that commit, which is worth naming rather
       than absorbing: r2's handoff reported `npm test rc=0` at d739962, and this was the one
       failure there. The planning default now publishes the QUOTE registry's `basis` and
       `observationKind` instead of nothing, which mattered the day the owner adopted three
       PROVISIONAL rates as planning defaults — the page disclosed the rent as provisional and the
       connector did not. The value comes from the quote and not the receipt because the receipt's
       basis is the PROCUREMENT basis ("committed-planning-rent"), a different claim that would read
       firmer than the ground warrants.
       (2) THIS LEG'S — mcp-server/src/shape.ts normalizes the PUBLISHED
       `*_renderable_weight_share` at the boundary that makes the claim. The connector's own schema
       types it `nonnegative.max(1)` (dcmap/economics/dto.ts) and the engine's float accumulation
       began returning 1.0000000000000002 once the ruling made all seven legs render — a proportion
       above 1, published against a schema forbidding it, unreachable before this release because
       the sum had been ~0.52. Corrected here rather than in the engine ON PURPOSE: the engine's sum
       is its own renormalization divisor and the input to byte-frozen historical receipt
       reproductions, and correcting it there was measured to move five WIDE parity constants, two
       source freezes, an 180-pair baseline fixture and three historical-receipt reproductions — for
       a field both publication surfaces already round to "100%". The engine-internal identity is
       filed as bq-2194.
       (4) THIS LEG'S, ROUND THREE — and the round count is the finding. An audit that WALKED every
       numeric field named *weight_share across every tool response, rather than reading the code to
       list call sites, found a FOURTH publication surface: the claims sidecar's envelopeFields. The
       first pass normalized two sites, a review found a third, the walk found a fourth. Three rounds
       of enumeration, three misses. All four now go through the shared helper, and
       mcp-server/test/published-share-bound.test.mjs asserts the bound by WALKING responses instead
       of enumerating anything, so a fifth surface fails without anyone remembering it exists.
       (3) THIS LEG'S, ROUND TWO — the fallback review's finding F3 corrected the normalization
       itself. The first cut read `renderableLegs === totalLegs ? 1 : Math.min(1, share)`, which
       published a LITERAL on one branch (an engine regression to 0.52 with seven legs rendering
       would still have published 100%) and silently clamped ANY out-of-range value on the other.
       It is now a one-ulp correction — `Math.abs(share - 1) <= 1e-9 ? 1 : share` — so a share that
       is genuinely above 1 fails the schema, which is what the schema is for. The review also found
       a THIRD publication surface the first pass missed, `tools/run_scenario.ts`, now covered by the
       same shared helper.
       NO COMPUTED VALUE MOVES under any of these: every WIDE parity hash above is unchanged and was
       re-executed, and no figure, sentence, receipt or release_id changes. */
    /* RE-MINTED 2026-09-19 (im-vet-0919 Astra round-1 fold, pack C P0-1) FOR ONE SOURCE FILE:
       mcp-server/src/tools/adjust_rental_rate.ts. The handler forwarded capital_recovery and
       cost_of_capital_pct to run_scenario, which honours them, and then rebuilt the baseline and
       adjusted states for `what_changed` - and all nine uncertainty triples - WITHOUT them. One
       call published a headline computed with capital recovery ON beside lessor spreads computed
       with it OFF, and a delta between two different economies, under a receipt that said
       "state: off". On anthropic / median at $2.40/hr with cost_of_capital_pct 13 the published
       baseline spread read 71.777629% against a true 59.681948%, the adjusted 52.085470% against
       31.550027%, and the change -19.692159pp against -28.131921pp. A VALUE DOES MOVE, and it is
       a value the live connector publishes: these spreads are now what the requested economics
       actually imply. The baseline and delta phases take the same capital-recovery configuration
       as the adjusted one, so the delta is again a difference in one thing. No other tool source
       and no emitter changed; the WIDE hashes above are unchanged (executed). Guard:
       mcp-server/test/rental-adjust-capital-recovery.test.mjs, red on the pre-fold tool with
       three of its four checks failing, including the tool publishing byte-identical outputs for
       capital_recovery on and off.
       ROUND-2 AMENDMENT 2026-09-19 (Polaris ruling on Astra pack C P1-1), ONE MORE SOURCE:
       mcp-server/worker/src/index.ts gains a JSON-RPC batch cap. The 64 KB body cap bounds BYTES,
       not WORK, and an array multiplies one by the other — 128 adjust_rental_rate calls fit in
       18,579 bytes and returned 128 results, ~10.7 s of local CPU and ~6 MB of response against a
       configured 5,000 ms Worker CPU limit, and 449 fit inside the cap with consecutive ids. Every
       tool here is read-only and idempotent, so a legitimate client never needs a long batch;
       eight is generous against observed usage and two orders of magnitude below the
       amplification. An over-long batch is a 400, refused before any server is built, and a body
       that does not parse falls through to the MCP handler's own error shape. No tool source, no
       emitter and no computed value changed. Guard:
       mcp-server/worker/test/batch-cap.test.mjs.
       ROUND-3 AMENDMENT, same day: the predicate MOVED from index.ts into src/body-cap.ts, for
       the same reason readBodyCapped lives there — no Workers-runtime import, so the suite can
       exercise the PRODUCTION function under plain Node. Astra round 3 showed what the first cut
       was worth: replacing the predicate with `return 0`, and separately dropping the `return`
       from its refusal, both left all eight test bodies green, because the suite had
       re-implemented the predicate locally. Both mutations now go red (5 and 3). Behaviour is
       unchanged; only where the function lives. */
    mhHex === "797eed3eaac962a1a4b7c997d542d12f157dd20b389d895b8ec2cee85ff6f03f" /* RE-MINTED 2026-09-25 by im-legibility-merge-enact-0925 (bq-3316, the bq-1141 legibility merge builder half): PRESENTATION + COPY ONLY — M1 preset note into the dossier, M2 value/status split, M3b one name (planning baseline) for the 58% reading incl. the four FA templates + memo 2.9 amendment, M4 one-sentence standfirst, M7/M8 history to the changelog verbatim, M10 destination labels, M11 reader wording at the display funnel, M12 vocabulary, M13 masthead, M20 footer. EXECUTED: every WIDE pin and the T4 historical receipts are UNCHANGED, so no rendered engine quantity moved; the fa-explain answer DIGITS pin is unchanged. Evidence: orchestration/backlog-recovery/day-2026-07-28/im-legibility-merge-enact-0925-work/evidence/remint.md [MCP concat] previous: 2e3efd93b2e3c2a4… */ /* RE-MINTED AGAIN 2026-09-20 by im-vet-six-repairs, ASTRA xhigh FOLD: the withdrawal is now disclosed on the exploration route cards and in the coverage sentence (findings 1 and 2), E2 is relabelled MIXED-BASIS with the inconsistency and the 0.525 alternative stated (finding 3), E3 names its decode evidence per leg (finding 5), the r4 §C2 quotation is RESTORED after the N1 pass had changed a word inside it, four reader strings the old checker scope had hidden are renamed including the hero label, and the round-3 card states the rounding convention it actually uses (finding 8). */   /* re-minted 2026-09-20 by im-vet-six-repairs: the N1 vocabulary release edit renames the connector's "cost lens" strings to "scenario preset" in labels.ts, tools/list_scenario_space.ts, tools/run_scenario.ts and dcmap/economics/legacy.ts, and the Worker build's two engine-ground-truth pins move with the E1/E2 repairs. NO behaviour changes; the transport-text deltas are declared in mcp-server/test/report-text-parity.test.mjs. */  /* re-minted 2026-09-19: the lens-scenario epistemic status, its label and its must_carry rider in labels.ts / shape.ts / tools/run_scenario.ts */, mhHex); }

console.log(`\n${failures === 0 ? "ALL RENDER-PARITY TESTS PASS" : failures + " RENDER-PARITY FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
