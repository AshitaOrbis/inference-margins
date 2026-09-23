/* b9 UX-B — U-16 / U-16b: the #report restructure must move NO MCP transport text.
   Design contract: research/b9-ux-memo.md §17.1, §17.3, §17.8.
//
   WHY THIS FILE LIVES HERE AND NOT IN THE CDP SUITE (R3 P1-6, upheld):
   `npm run test:browser` does not build the MCP package, and `mcp-server/dist` is ignored generated
   output that can be stale — a parity assertion run against a stale dist proves nothing. This
   package's own `test` script is `npm run build && node --test "test/*.test.mjs"`, so this file is
   picked up automatically, after a fresh build, with no script edit.
//
   WHAT IT ASSERTS, AND WHY EACH PART IS NEEDED:
   * NORMALIZED text for report-s1..s10 AND front-page, byte-identical to the fixture captured at
     bedcc23 BEFORE any markup existed to corrupt it. front-page matters on its own: without a
     wrapper-scoped strip its normalized text gains ~420 characters from ten expand/collapse labels.
   * RAW text against the sidecar, because the capture stores whitespace-normalized text
     (\s+ -> " ") and therefore CANNOT see a newline-only change (design gate P1-7).
   * NODE vs WORKER equality. `worker/scripts/build.mjs` only asserts that the Worker source
     CONTAINS the Node helper's text — an adversarial Worker file could carry it in a comment and
     execute something else. This closes that hole behaviourally, on output.
   * EXACTLY TEN summaries stripped, and the six §10 provider summaries still present. The strip
     regex is class-scoped by construction, but a future markup drift could make it silently MISS —
     counting turns that into a loud failure instead of quietly changed transport text.
   * U-16b, the NEGATIVE CONTROL: with the strip disabled the assertion must FAIL. A parity test
     that cannot fail proves nothing — this is the same discipline that caught UX-A's U-6 control
     passing vacuously.
   Run: node --test mcp-server/test/report-text-parity.test.mjs  (after `npm --prefix mcp-server run build`) */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const norm = (s) => s.replace(/\s+/g, " ").trim();

const { htmlToText: nodeHtmlToText } = await import(join(ROOT, "mcp-server/dist/reports.js"));
const index = readFileSync(join(ROOT, "site/index.html"), "utf8");
const capture = JSON.parse(readFileSync(join(ROOT, "tests/fixtures-mcp-report-sections-bedcc23.json"), "utf8"));
const sidecar = JSON.parse(readFileSync(join(ROOT, "tests/fixtures-mcp-report-raw-bedcc23.json"), "utf8"));

/* The Worker helper is a byte-identical copy of the Node one (build.mjs fails the build on drift).
   It is TypeScript, so it is exercised here by transcribing its regex chain out of the source —
   which also means a Worker-only edit that the containment gate would tolerate shows up as a
   text difference right here. */
const workerSrc = readFileSync(join(ROOT, "mcp-server/worker/overrides/reports.ts"), "utf8");
const nodeSrc = readFileSync(join(ROOT, "mcp-server/src/reports.ts"), "utf8");
const bodyOf = (src, marker) => { const i = src.indexOf(marker); const j = src.indexOf("\n}", i); return src.slice(i, j + 2); };

/* v2.2.0 PRODUCTION RELEASE — DECLARED TEXT DELTAS (row 441, owner ruling q-row441-ref-and-bridge,
   2026-08-06). The bedcc23 capture below stays BYTE-FROZEN: its whole value is predating the
   markup, so it is never re-captured. What moved here is CONTENT, not markup — merging the b9 arc
   to master carried v2.1.12's two owner-APPROVED RAISE Summit paragraphs into §7 (Anthropic's
   claimed first gross profit) and §10 (OpenAI's margin trajectory), and re-stamped the footer
   release manifest. Verified by extraction diff against the pre-merge dev tip 5325791: on
   report-s7 the ONLY change is the §7 paragraph, on report-s10 the ONLY change is the §10 OpenAI
   paragraph, and on front-page the ONLY changes are those two plus the footer manifest line. Every
   id NOT listed here, and any further drift on a listed id, still fails — this declares three
   authorized deltas, it does not relax the gate. */
/* 2026-08-07 HOTFIX — ONE FURTHER AUTHORIZED DELTA, front-page only. The §"interlock" bullet said a
   1.25x stack multiplier is "≈ +2.9 months at 3×/yr". On this engine's own trend model it is +2.4374;
   +2.9 is the months-equivalent of 1.30x. One number, corrected to +2.4, and the fixture stays
   BYTE-FROZEN as designed — this declares the delta rather than re-capturing the capture whose whole
   value is predating the markup. Verified by extraction diff against the previous commit: the
   front-page transport text differs on EXACTLY ONE line, and on that line by exactly "2.9" -> "2.4".
   No report-sN slice moves, because the bullet lives outside them. */
/* 2026-08-13 V3.0.0 ALIGNMENT — ONE FURTHER AUTHORIZED DELTA, front-page only (Polaris ruling
   esc-20260813T014805Z-1df204c8 per plan D-10: badge v3.0, machine identity 3.0.0 on all four
   surfaces). Verified by extraction diff old-vs-new through the COMPILED runtime extractor:
   the transport text differs on EXACTLY TWO lines — the subtitle ("live v2.2 path" → "live v3.0
   path") and the footer release-manifest line (methodology v3.0 · engine v3.0.0-2026-08-13).
   No report-sN slice moves. The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-13 V3.0.1 VERSION-STRING SWEEP — ONE FURTHER AUTHORIZED DELTA, front-page only
   (owner note 0b76be: current-identity strings neutral/v3.0; historical boundaries dated).
   Extraction diff through the compiled runtime extractor: EXACTLY THREE lines move — the
   deprecation prose ("before v2.2 (2026-08-06)"), the roofline sentence (version-neutral),
   and the byline (current-methodology anchor). report-s3 moves by EXACTLY the roofline sentence
   ("The v2.2 roofline makes" → "The live roofline path makes") and nothing else. */
/* 2026-08-16 ESTIMATES-CARDS REBUILD — TWO FURTHER AUTHORIZED DELTAS, report-s5 and the
   front-page slice that contains it (owner rulings q-margins-estimates-legibility-rebuild = A and
   q-margins-estimates-headline-basis = A, both 2026-08-13; build spec
   orchestration/backlog-recovery/day-2026-07-28/reports/estimates-cards-SPEC-2026-08-13.md).
   §5 is where the ruling landed: the two QUOTED adjudicator cards replace the verdict block as the
   visible surface, and that block's prose is preserved verbatim inside the section expander. This
   IS a content delta and is declared as one — transport text SHOULD move, because the two estimates
   the owner asked for were never on the page at all. Verified by extraction diff through the
   compiled runtime extractor at DUMP_PARITY_HASHES=1: EXACTLY report-s5, report-s6 and front-page move; s1,
   s2, s4, s6, s7, s8, s9, s10 and the three earlier declared deltas are byte-identical to their
   prior expectations. The bedcc23 capture stays BYTE-FROZEN as designed — its whole value is
   predating the markup, so it is never re-captured. */
/* 2026-08-16 a-im-legibility — TWO FURTHER AUTHORIZED DELTAS, report-s5 and the front-page slice
   that contains it (owner annotations on the staged markup preview, verbatim: "This should be at
   the top, how did it end up down here, this is almost exactly what I wanted" and "This should be
   at the top, not way down here, and collapsed, not fully expanded and rambling"). The two estimate
   cards and the stress test are HOISTED out of §5 to the top of the page, collapsed; §5 keeps its
   heading and its expander and carries a one-line pointer to them. §5 also loses its
   round-over-round narration under his standing rule that version history belongs in the changelog.
   Both are content deltas and are declared as such — transport text SHOULD move when the page's
   information architecture moves. Verified by extraction diff through the compiled runtime
   extractor at DUMP_PARITY_HASHES=1: EXACTLY report-s5, report-s6 and front-page move; s1, s2, s3, s4, s6, s7,
   s8, s9, s10 are byte-identical to their prior expectations, including the three earlier declared
   deltas. The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-16 cards-vintage — ONE FURTHER AUTHORIZED DELTA, front-page only (owner ruling
   q-margins-cards-vintage = B, answered 2026-08-16T14:17Z): the hoisted estimate-card faces move
   from the round-2 to the round-3 self-authored readings so the headline agrees with the
   calculator's opening state. Pro face 83.1 % / 68–92 % on the list basis its author stated round 3
   on; Fable face ≈77 % unchanged, span widened to 65–82 %; round-2 pairs preserved inside the
   expanders. A content delta, declared as such. Verified by extraction diff at
   DUMP_PARITY_HASHES=1: EXACTLY front-page moves; report-s1..s10 — including s5, which the cards
   left in the legibility hoist — are byte-identical to their prior expectations. */
/* 2026-08-17 d-im-annotations — ONE FURTHER AUTHORIZED DELTA, front-page only (owner note 514e03;
   the eleven markup annotations of 2026-08-16 are the instruction set). Three content changes land
   in this slice. (1) The answer tile COLLAPSES: label, number, a title-length subject and the
   landing reading stay above the fold; the full scope declaration and every band/span line move
   inside #fa-full. Nothing is deleted and no node changes id — the transport sees a containment
   change as a text change because it extracts the slice, which is exactly what a declared delta is
   for. (2) The two estimate expanders lose their round-over-round narration under his standing
   rule nd94bbc, and both round-2 pairs move VERBATIM to research/changelog.md; the provenance
   lines naming which authored statement each face quotes are kept. (3) The cost chart's subtitle
   gains one clause saying its bars are clickable. Content deltas, declared as such. Verified by
   extraction diff through the compiled runtime extractor at DUMP_PARITY_HASHES=1: EXACTLY
   front-page moves; report-s1..s10 are byte-identical to their prior expectations, including all
   four earlier declared deltas. The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-18 d-im-tile — ONE FURTHER AUTHORIZED DELTA, front-page only (owner ruling
   q-im-tile-position, verbatim: "The 83% tile should be at the top, alongside fable estimate, as I
   described in note 11"). It answers the POSITION half of annotation nad7e98, which the 2026-08-17
   annotations leg left needing a ruling rather than moving the wrong tile on a guess. The ≈83%
   headline tile leaves .hero-row and becomes the head of the projections block — tile, then the two
   hoisted estimate cards and the stress test, then the answer tile — and the four supporting output
   tiles (blended cost, effective price, cost per 1M output, serving feasibility) follow below it.
   Its tail collapses behind one summary line, the treatment #fa-full already got for nbc7fc1; the
   mandatory disclosure surfaces stay on the face, uncollapsed, because a number may never be
   readable without the sentence that qualifies it. A layout delta, declared as one — no computed
   value moves, and the WIDE 270-state render-parity hash is unchanged as the executed proof.
   Verified by extraction diff old-vs-new through the COMPILED runtime extractor at
   DUMP_PARITY_HASHES=1: front-page differs by exactly TWO things — the four supporting tiles'
   twenty text lines relocating from above the estimates block to below the answer tile, and ONE
   added line, the new collapse's summary ("The stated reading, the bounded dial ranges and the mix
   envelope"). Nothing else in the slice moves. report-s1..s10 are byte-identical to their prior
   expectations, including all five earlier declared deltas. The bedcc23 capture stays BYTE-FROZEN
   as designed. */
/* 2026-08-18 d-im-desktop — ONE FURTHER AUTHORIZED DELTA, front-page only (owner notes 11b102 and
   bb3f19). It repairs a miss that shipped green twice: "The Fable display still isnt there either
   way… point 11 was a spot where you had exactly what I wanted displayed at the start much lower in
   the page, and now you cant figure out how to do it", under the interpretive rule "you have to
   actually understand it as being laid out on a desktop screen, not mobile".
   What moved: the ≈83% tile and the two estimate cards leave .controls-col for a new full-width
   #projections band placed above the evidence board, and #estimates-top stops being a <details>
   closed at first paint — measured live, the Fable card was NOT DISPLAYED on either viewport, and
   annotation n95f678 approved the pair as it RENDERED in §5, not as a summary line you click.
   A PURE REORDER, and that is an executed claim, not a characterization: the extraction diff
   old-vs-new through the COMPILED runtime extractor at DUMP_PARITY_HASHES=1 has 689 lines before
   and 689 after, ZERO lines added, ZERO removed, and the two line MULTISETS ARE IDENTICAL. The
   only difference is position: the projections text now precedes the 26 lines of the range
   explorer, saved-scenarios panel, evidence catalog and the Model / Traffic-mix control copy that
   used to stand above it. No sentence on this page gained, lost or changed a word, and the WIDE
   270-state render-parity hash is unchanged as the executed proof that no computed value moved.
   report-s1..s10 are byte-identical to their prior expectations, including all six earlier declared
   deltas — §5's slice does not move because the cards were already hoisted out of it on 2026-08-16.
   SECOND MOVE, SAME LEG, folded into this one delta: #final-answer joins the band, because
   nbc7fc1 says the answer tile "needs to be top with other projections" and lifting the tile and
   the estimates out of .controls-col without it left it below the evidence board while its own
   projections sat above — a regression this leg introduced and repaired rather than shipped. The
   pure-reorder property is re-verified against the PRE-LEG tree (acb7674~1), not merely against the
   intermediate commit: 689 lines both sides, zero added, zero removed, multisets identical.
   The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-18 d-im-followups — ONE FURTHER AUTHORIZED DELTA, front-page only (owner answer
   q-im-desktop-followups = A, enacting the two items d-im-desktop put in his court instead of
   guessing at). Only ONE of the two items touches transport at all.
   ITEM 1 (#dossier deduped to ONE route) contributes NOTHING to this delta, by construction: the
   markup change is a new .dossier-block wrapper and #preset-note promoted out of the <summary>,
   and #preset-note is EMPTY in the static bytes (app.js writes it), while the hint text is
   byte-identical. The route selection is pure CSS. Measured dossierRoutesVisible 2 -> 1 at both
   viewports, on exactly the terms ruled for the methods box: fine pointer keeps the disclosure,
   coarse keeps the popup trigger.
   ITEM 2 (the justification stack leaves the answer-tile FACE for #fa-full) is the whole delta,
   and it is A PURE REORDER — an executed claim, not a characterization. The extraction diff
   old-vs-new through the COMPILED runtime extractor at DUMP_PARITY_HASHES=1, taken against the
   PRE-LEG tree (b35eca4), has 689 lines before and 689 after, ZERO added, ZERO removed, and the
   two line MULTISETS ARE IDENTICAL. The only difference is position, in a 13-line window at
   offsets 133-145 with 133 lines of common prefix and 543 of common suffix: #fa-basis-declaration,
   #fa-higher and #fa-exec-summary now sit INSIDE #fa-full, before its terminal invitation line, so
   "Why not the higher numbers?" and "What would have to be true to reach the higher readings"
   (each with its own trigger label) precede "Read the rationale and evidence chain →" instead of
   following it, and #fa-deeper-trigger's own label moves ahead of the collapse summary because the
   trigger moves ABOVE #fa-full (design gate P0-1: a trigger sits before its disclosure so its
   position is stable whether the section is open or closed — which matters more, not less, now
   that an expanded #fa-full carries the justification stack). No sentence gained, lost or changed
   a word.
   WHY: nbc7fc1 asked for a short title and a COLLAPSED tile, and the shipped tile was still
   1,444 px tall on desktop and 3,512 px on mobile with #fa-full closed — #fa-higher alone was
   837 px / 2,548 px of that. After: 429 px and 693 px. No computed value moves and the WIDE
   270-state render-parity hash is unchanged as the executed proof. report-s1..s10 are
   byte-identical to their prior expectations, including all seven earlier declared deltas. The
   bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-22 im-arc T1 — ONE FURTHER AUTHORIZED DELTA, front-page only (plan §1 T1,
   owner answer d-20260822-4c26). The front-page report now carries the second owned/TCO card,
   the visible rental-inclusive segment, paired per-accelerator basis tables, and the rent-toggle
   label commissioned for T1. This is an intentional content delta, not markup leakage: the new
   explanations are part of the calculator surface returned by get_report("front-page"). Executed
   with DUMP_PARITY_HASHES=1 after a fresh MCP build: report-s1..s10 remain byte-identical to their
   prior expectations and only front-page moves. The bedcc23 capture remains frozen. */
/* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): ONE FURTHER
   AUTHORIZED DELTA, front-page only. The static counterpart label now states
   “If ALL sections were owned,” matching the live all-section repricer. The
   ten report sections remain byte-identical; the bedcc23 capture stays frozen. */
/* 2026-08-23 im-arc director content correction — ONE FURTHER AUTHORIZED DELTA, four
   sentences across §1, §7, §10 and (therefore) the front-page slice. These are the corrections
   the VERIFIED analyst-divergence page (research/analyst-divergence.html, two blind arms
   converged) queued against the front page: (1) the Zephyr 90–95% sentence now cites his Jun-24
   post and says the basis is UNSTATED in his own words, instead of reading it as a blended-fleet
   figure; (2) the Opus ">80%" line is upgraded from a secondary summary to the Sequoia transcript;
   (3) RAISE's "first gross profit" is flagged as an unverified summary-level claim; (4) the
   "~30%/~50%" starting points are withdrawn. Each links the research page. Executed with
   DUMP_PARITY_HASHES=1 after a fresh MCP build: EXACTLY report-s1, report-s7, report-s10 and
   front-page move (norm and raw); s2, s3, s4, s5, s6, s8, s9 are byte-identical to their prior
   expectations. report-s1 enters RELEASE_DELTAS for the first time. The bedcc23 capture stays
   BYTE-FROZEN as designed. */
/* 2026-08-24 im-arc T4 fold — TWO FURTHER AUTHORIZED DELTAS, report-s5 and the front-page slice
   that contains it. §5 publishes the calculator's own live readings (the §5–§7 bridge cost and
   margins, and the low-utilization comparison), and the fold moved every one of them under
   tests/fixtures-t4-declared-delta.json. Confirmed by the compiled runtime extractor at
   DUMP_PARITY_HASHES=1: EXACTLY report-s5, report-s6 and front-page move; every other id is byte-identical to
   its prior expectation, and the bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-08-27 T5 ROUND 6 — TWO AUTHORIZED DELTAS, report-s5 and the front-page slice that
   carries it. Round 5 found three self-contradictory published figures live on the site, all
   three introduced by the T5 commit when the ARC engine work moved the readings and only some of
   the prose that quotes them was updated; a fourth (the §5 list-vs-mix delta) had drifted the
   same way unnoticed. §5 and the stress card are where those figures are published, so both
   slices move: the stress-card expander 59/64 -> 51/57, the ratified-prior default ~69% -> ~63%
   in the two places that still said 69, the §5 delta ~4.9 -> ~5.9 points, and the
   blinded-cross-check sentence rewritten because at ~63% both readings sit BELOW the 73.3%
   central figure instead of straddling it. Confirmed at DUMP_PARITY_HASHES=1: EXACTLY report-s5
   and front-page move; the other nine ids are byte-identical to their prior expectations, and
   the bedcc23 capture stays BYTE-FROZEN as designed. Each published digit is now pinned to its
   executed value, in both directions, by tests/fa-m6-b9.test.mjs. */
/* 2026-09-02 im-share-finalization — ONE AUTHORIZED DELTA, front-page ONLY. Eleven literal
   `\uXXXX` escapes in two methods-box <li> bodies are converted to the characters they always
   meant: em dash ×3, `×` ×4, `±` ×2, `≈` ×1, `η` ×1. Until now the transport served — and the
   page displayed — backslash-u text, four of them inside the executed cost identity
   (`C = C_out + 15 × (0.40 + 0.60 × 0.05) × C_in`) and two inside the ±50% prefill sensitivity
   clause. This delta is DELIBERATELY visible to the transport: the whole point is that the
   characters a reader receives change, so a connector consumer gets the same repaired text the
   page does. No sentence gained, lost or reordered a word, and no computed value moved — the WIDE
   render-parity hashes are unchanged and were re-executed. Confirmed by the compiled runtime
   extractor at DUMP_PARITY_HASHES=1: EXACTLY front-page moves (norm and raw); report-s1..s10 are
   byte-identical to their prior expectations, including all nine earlier declared deltas, because
   the methods box sits outside the §1..§10 slices. The bedcc23 capture stays BYTE-FROZEN as
   designed. */
/* 2026-09-02 im-share-finalization, SECOND AUTHORIZED DELTA — AMENDED the same day after GPT Pro
   review pr-20260902T175643Z-034d27 found the first correction incomplete (BLOCKER 1): the sentence
   fixed its opening and left "changing only to the $3/$15 standard tariff FROM SEP 1" intact, which
   asserts the very transition the correction says never happened. It now reads as an explicit
   counterfactual sensitivity with the cancellation stated, so report-s5 and front-page move once
   more for the same reason and no other slice does.
   (original delta, owner note d85f73) — report-s5 and
   the front-page slice that carries it. The Sonnet-class line stopped promising readers a September
   price increase that was cancelled: Anthropic made the $2/$10 rate PERMANENT on 2026-08-10 and the
   2026-09-01 step to $3/$15 never took effect, verified at the primary source (the pricing docs say
   the increase "will not occur"; the launch post carries an Edit of 2026-08-10). The line now reads
   "$2/$10 standing tariff (made permanent 2026-08-10; the September 2026 step to $3/$15 was
   cancelled)". NO PRICE MOVED — the preset was always $2/$10, and every WIDE render-parity hash is
   unchanged and was re-executed. Confirmed by the compiled runtime extractor at
   DUMP_PARITY_HASHES=1: EXACTLY report-s5 and front-page move (norm and raw); the other nine ids
   are byte-identical to their prior expectations. The bedcc23 capture stays BYTE-FROZEN. */
/* 2026-09-09 im-release-edit — THE LANGUAGE EDITION. EIGHT AUTHORIZED DELTAS: report-s1, s2, s3,
   s5, s6, s7, s10 and front-page (owner voice note a0b244, 2026-09-09; DECISIONS
   d-20260909-im-release-edit-approved-push-deploy; work order
   im-language-rationalize-2026-09-08.md §9; burn-queue bq-2120).
   This is the largest declared delta this gate has carried, and it SHOULD be: the release edit
   rewrites the site under one canonical vocabulary and settles seven result-identity conflicts in
   the source, so transport text moves wherever reader-facing text moved. What did NOT move is the
   proof that the edit stayed inside its scope — report-s4, report-s8 and report-s9 are byte-
   identical to their prior expectations on both the normalized and raw slices, and those are
   exactly the three sections the edit did not touch. NO NUMBER, source quotation or evidence-label
   value changed anywhere except in the four settled provider-card identity conflicts, each of
   which is recorded with its losing and kept text in
   reports/im-release-edit-2026-09-09/evidence/bq2120-settlements.json.
   Verified through the COMPILED runtime extractor at DUMP_PARITY_HASHES=1 after a fresh MCP build.
   The bedcc23 capture stays BYTE-FROZEN as designed — its whole value is predating the markup. */
/* 2026-09-10 im-release-edit-r2 — ONE FURTHER AUTHORIZED DELTA, front-page only, and it is a
   RESTORATION (court answer to esc-20260910T033916Z-99df24ac, court-intake, intake-no-card;
   burn-queue bq-2189). The Fable 5 round-3 estimate card's companion figure goes back to "≈80% at
   list" from the "≈76% at list" that db73816 wrote into it on 2026-08-24 — six days AFTER the
   deploy that still serves 80. It is a QUOTED estimator reading, not an engine output, and all
   three witnesses say 80: the deployed bytes at faf6bec, research/changelog.md:135 where the face
   was installed, and site/engine.js:1117, the registry entry the calculator loads. So the transport
   text moves BACK to what the live connector already serves, and no published number moves.
   Verified through the COMPILED runtime extractor at DUMP_PARITY_HASHES=1 after a fresh MCP build:
   EXACTLY front-page moves (norm and raw). report-s1 through report-s10 are byte-identical to their
   prior expectations — including report-s5, and that is not an accident: the estimate cards were
   hoisted out of §5 to the top of the page on 2026-08-16, so a card-face edit lands in the
   front-page slice and nowhere else. Ten unmoved ids against one moved one is the proof this round
   touched a single figure. The bedcc23 capture stays BYTE-FROZEN. */
/* 2026-09-10 im-guard-fix — ONE FURTHER AUTHORIZED DELTA, front-page only, and this one moves a
   PUBLISHED FIGURE by owner ruling rather than moving prose around it. Ruling
   d-20260910-im-r3-lead-diagnostic-recompute (card q-im-r3-lead-diagnostic-designation, answered
   2026-09-10T16:09:47Z, option A): "recompute on all three surfaces and keep it recomputed". The
   GPT-5.6 Pro round-3 estimate card's lead-only diagnostic reads 78.89-85.37 % where it read
   80.48-86.47 %. The value is the engine's own sweep of that preset EXECUTED at the current
   defaults — 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653 across 0-4 months of lead at the
   undiscounted list tariff — not a figure read off any surface.
   THE CARD'S OWN STATED READINGS DO NOT MOVE: 83.1 % central and the 68-92 % span are its author's
   and are byte-untouched, which is precisely the distinction the ruling turns on. What settled it
   is that the author declared a lead range in MONTHS and never stated a percentage range at all.
   Verified through the COMPILED runtime extractor at DUMP_PARITY_HASHES=1 after a fresh MCP build:
   EXACTLY front-page moves (norm and raw); report-s1 through report-s10 are byte-identical to their
   prior expectations, INCLUDING report-s5. That is not luck and it is the same structural fact the
   2026-09-10 im-release-edit-r2 delta relied on: the estimate cards were hoisted out of §5 to the
   top of the page on 2026-08-16, so a card-face edit lands in the front-page slice and nowhere
   else. Ten unmoved ids against one moved one is the proof this round touched a single figure.
   The registry moved in the same commit and the face-vs-registry gate proves they moved TOGETHER;
   research/changelog.md carries the entry. The bedcc23 capture stays BYTE-FROZEN. */
/* 2026-09-12 im-release-contradiction-fix (bq-2315, P1) — FOUR AUTHORIZED DELTAS: report-s5,
   report-s6, report-s10 and the front-page slice that contains them. Release 3f89d63 published two
   readings of ONE comparison — 63-vs-93 in the §6 lead-in and 57-vs-93 in the procurement row three
   paragraphs below — and seven rounds of Astra xhigh review found that owner ruling
   d-20260910-im-adopt-fleet-rents-and-correct-grok's recomputation had been left half-applied across
   the served surface. What moved, and where:
     §6  the procurement row 57-vs-93 -> 63-vs-93 (the filed defect), and the Fleet row's
         "all 7 memory-feasible, 4 priced" -> all seven priced, three provisional.
     §5  the Sonnet paragraph's "four of them carry a registered price" -> all seven priced, three
         provisional. That is the WHOLE of §5's delta.
     §10 the Grok known-knowns line "$2/$0.50/$6 (disclosed)" -> "$2/$0.30/$6": the ruling moved
         cacheReadMult 25 -> 15, so 15% of $2 is $0.30.
     front-page  all of the above, plus three edits that live OUTSIDE every report-sN slice and
         therefore move this id alone: the subtitle's lead-adjusted reading 63% -> 68%
         (site/index.html:60); the methods box's input-side cost share ~70.1% -> ~70.5% and its
         prefill sensitivity ±14.3 -> ±14.9 points (:100); and the stress case's public-rate-card
         reproducibility claim (:313), which stopped being true when three rents became declared
         provisional judgments.
   NB the methods-box pair was filed under §5 in this note's first draft. It is not in §5: the slicer
   cuts sections at their <h3 id="sN"> headings, §1 opens well below line 100, so :100 belongs to the
   front-page slice only. Caught by the round-10 review (A1) — the same misattribution class this leg
   has been corrected for three times, and the hashes were never implicated.
   EVERY replacement figure was MEASURED by executing site/engine.js, not copied: planning baseline
   57.88142929759557 effective / 62.988305995262095 at list, lead-adjusted 67.99680695167343,
   fleetRenderable 7 of 7 at weight share 1, input share 70.5373073367345, sensitivity
   14.854652831097416 points, grok cacheReadMult 15.
   Executed with DUMP_PARITY_HASHES=1 after a fresh MCP build: EXACTLY report-s5, report-s6,
   report-s10 and front-page move (norm and raw); s1, s2, s3, s4, s7, s8 and s9 are byte-identical to
   their prior expectations, and the bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-09-12 im-default-window-and-mcp-discrepancy — ONE AUTHORIZED DELTA, front-page ONLY (owner voice note
   note-20260912T180812Z-c9eaac; bq-2345; bq-2334; the Astra round-2 fold). Extraction diff old-vs-new through the
   COMPILED runtime extractor (mcp-server/dist/reports.js htmlToText, release stamp canonicalized) against f13afda:
   727 lines before and 727 after, and exactly SIX lines replaced, none added or removed:
     (1) the standfirst says the calculator opens on the GPT-5.6 Pro settings unless the reader chooses another
         default, and dates the stated 83.1% to this calculator's reading of 2026-08-07;
     (2) the GPT-5.6 Pro card's honest-gap paragraph: its public-rate stress case reads 62.99%, the object the
         2026-08-06 proposal defined (this page's rents, 50% occupancy, list-only billing); the 72.19% it
         replaces had measured the estimate's own vector at public rents instead;
     (3) its 'Which vintage is where' paragraph names the page's built-in opening state and gives the gap's actual
         cause (the author worked 83.1% from the 2026-08-07 engine's 79.65% reading; two later calculator changes
         moved the unchanged settings);
     (4)-(6) each of the three load-op rows (GPT-5.6 Pro, Fable 5, stress case) gains its 'Set as default' control
         label, and the GPT-5.6 Pro row names the page's built-in opening state.
   The new #win-head and #out-calc containers are EMPTY in the static bytes (app.js fills them), so they add
   nothing to transport text. Executed with DUMP_PARITY_HASHES=1 after a fresh MCP build: EXACTLY front-page
   moves (norm and raw); report-s1..s10 are byte-identical to their prior expectations, and the bedcc23
   capture stays BYTE-FROZEN as designed. Line-level evidence:
   orchestration/backlog-recovery/day-2026-07-28/reports/im-default-window-2026-09-12/evidence/front-page-text-delta.json */
  // 2026-09-20 im-vet-six-repairs — DECLARED RELEASE DELTA, program bq-2835, the six outside-reading findings.
  // This IS a content delta and is declared as one: the two registry repairs (E1 the Trainium
  // withdrawal, E2 the TPU numerator) move published figures across §5, §6, §7 and §10; E3 corrects the
  // input-side share and links a new reconstruction annex; E4 rewrites both estimate cards around
  // the vector that runs; and the N1 vocabulary release edit gives each idea one name on the page's
  // own voice (enforced from here on by tests/vocabulary-consistency.test.mjs). The connector's
  // report text is EXTRACTED from site/index.html, so it moves with the page by construction — which
  // is exactly the case style/VOCABULARY.md §6 says must be re-declared rather than re-captured.
  // Minted from executed values with DUMP_PARITY_HASHES=1, never guessed. The bedcc23 capture stays
  // BYTE-FROZEN as designed; report-s1, s3 and s4 are byte-identical to their prior expectations.
/* 2026-09-20 im-vet-six-repairs — ONE FURTHER AUTHORIZED DELTA, front-page ONLY (program
   bq-2835, owner ruling d-20260920-im-replace-repo-then-publish-deploy). front-page's raw source
   is the WHOLE canonicalized site/index.html, so it carries every page edit including the ones
   already declared per section. The ten section ids were minted earlier in this same round and
   are byte-identical to their declared expectations; this entry declares what is left, and the
   whole of it is the six findings landing:
     * E4 — both estimate cards rewritten. Each now opens with "The vector that actually runs —
       round 3, the one the face quotes" and keeps its round-2 text below under an explicit
       "kept as history (2026-08-06)" heading, so the old analysis is visible as history instead
       of being overwritten. This is the largest part of the delta, ~20 lines.
     * N1/P1 — the vocabulary release, on surfaces outside §1..§10 that the section slices
       therefore never saw: the hero tile "Serving contribution margin" -> "Serving margin",
       "Blended effective price" -> "Effective price", "effective billings" -> "effective price",
       "at the undiscounted list tariff" -> "at the undiscounted list price", "paid-capacity
       occupancy" / "fleet occupancy" -> "utilization", "posture" -> "settings", and the stress
       preset "public-rate reproducibility floor" -> "planning baseline".
     * E1/E2 — the figures those repairs moved where the page quotes them outside the sections:
       ≈$6.49/Mtok -> ≈$5.99/Mtok, 74.06/77.20 -> 74.01/77.16.
     * E3 — the methods box's input-side figure and its new link to the reconstruction annex.
   No sentence gained a claim it did not have; the two cards gained a heading each and lost none
   of their round-2 text. Confirmed by the COMPILED runtime extractor at DUMP_PARITY_HASHES=1
   after a fresh MCP build, enumerated id by id rather than trusting the first failure: EXACTLY
   front-page moves (norm and raw); report-s1..s10 are byte-identical to their declared
   expectations, all of them. The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-09-20 im-vet-six-repairs, ASTRA FOLD — ONE FURTHER AUTHORIZED DELTA, front-page ONLY.
   The Astra xhigh review of record requested changes on the repair commit and this is the fold.
   The page-text part of it is one sentence: the round-3 card explained 0.92 months as
   "integer-floored to one", and the floor of 0.92 is zero. It now says the convention it actually
   uses — rounded to the nearest whole month — and says out loud that the floor would be zero, so
   the correction is legible rather than quiet. The rest of the fold is engine, app and connector
   code (the withdrawal's disclosure on the exploration surfaces and in the coverage sentence, the
   E2 mixed-basis relabel, the E3 decode-evidence relabel, the restored r4 quotation and four
   renamed reader strings), and none of it sits inside a report section slice. Confirmed by the
   COMPILED runtime extractor at DUMP_PARITY_HASHES=1 after a fresh MCP build, enumerated id by
   id: EXACTLY front-page moves (norm and raw); report-s1..s10 are byte-identical to their
   declared expectations, all ten. The bedcc23 capture stays BYTE-FROZEN as designed. */
/* 2026-09-20 im-vet-six-repairs ROUND 2 (completion-gate FAIL) — THREE AUTHORIZED DELTAS:
   report-s5, report-s7 and the front-page slice that contains them. The gate ruled that DISCLOSING
   E2's basis inconsistency is neither repairing it nor withdrawing the contribution, which is what
   the commission required, so the TPU coefficient moved off the mixed 0.521 onto 0.519 with both
   endpoints on ONE stated timing convention (output tokens per second per chip over total serving
   wall time at 1K-in/8K-out). Every published figure that rides on the default fleet moved the last
   fraction with it, and §5 and §7 are where those figures are published: the reference reading
   58.43 -> 58.41, its 35%-utilization counterpart 40.61 -> 40.59, the lead-adjusted pair
   68.41/54.88 -> 68.40/54.86, the dollar walk $1.35843 -> $1.35908 and $1.03218 -> $1.03268 with
   its 24.1-48.1% conversion -> 24.0-48.1%, the Amendment-3 debt span 47.61-61.30 (13.69 pp) ->
   47.54-61.28 (13.74 pp), the input-side share 72.45% -> 72.42%, the billable-cached-share span's
   low end 31.1% -> 31.0%, and the owned-TCO route citation 89.3 -> 89.2. NO SENTENCE CHANGED ITS
   CLAIM; every one of these is the same statement about a number the engine now computes slightly
   differently, and every one moved DOWNWARD or stayed put, which is what choosing the lower of two
   candidate bases must do. Confirmed by the COMPILED runtime extractor at DUMP_PARITY_HASHES=1
   after a fresh MCP build, enumerated id by id: EXACTLY report-s5, report-s7 and front-page move;
   the other eight ids are byte-identical to their declared expectations. The bedcc23 capture stays
   BYTE-FROZEN as designed.
   RE-MINTED ONCE MORE after rebasing onto im-repo-replacement's release package: that leg's own
   tariff-tail fix moves report-s10, and front-page contains both its edits and mine, so the two
   ids were re-derived from executed values on the MERGED tree rather than either side being
   kept. report-s5 and report-s7 are unchanged from the values above — the rebase did not touch
   what moved them. */
const RELEASE_DELTAS = {
  norm: {
    "report-s1":   "57ad77847b1305de6279828ab7cca40bb33c0567b2531302dde0700b80b0f903",  // 2026-09-09 im-release-edit: the framing paragraph names the page's own metric instead of borrowing the discourse's phrase, and 'warm GPU' becomes 'warm accelerator'
    "report-s3":   "a860fc1a78a6f99e90fcab19bf75ff74998f35dc14d6fffb446397d96bd390a4",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-20 im-share-ready-0920, program bq-2998: the transfer-test statistic. §3 said the single-scalar test failed at "mean error 37%"; that mean averaged an INFERRED PROXY comparator (1,303 tok/s, a neutral read of DeepSeek's "60% of H100") in the Measured column alongside three benchmark measurements, and it was the closest row, so it made the failure look milder than the measurements support. §3 now says 47% across the three measured platforms. CONTENT delta, declared not re-captured.  // 2026-09-09 im-release-edit, Astra xhigh fold: the precision sentence goes back to naming the FLOPS rate and byte widths — the rewrite had turned processing capacity into per-token work, which are different quantities; and the H20/Ascend coefficients get their 'source-informed neutral' description back
    "report-s5":   "68a70f44e4f0dff9e561940e5aaf41565ac92eb7cb93e97e218877272a2489b7",  // 2026-09-20 im-repo-replacement, owner ruling d-20260920-im-replace-repo-then-publish-deploy (answer C on q-im-vetted-publish-deploy-share-2026-09-19, which authorises six written prose corrections to this frozen text): the cache-read serving cost stops being asserted and is stated as the analyst-set, unobserved figure the methods box already calls it. ONE sentence in this slice differs
    "report-s6":     "fdf9668cd0bb2996a17296aae3dc0929c8cbd3667e58582de467bf9ccfb6758f",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-12 im-release-contradiction-fix, bq-2315 + ruling d-20260910-im-adopt-fleet-rents-and-correct-grok
    "report-s7":   "e295bc443a3553143c3bfd9ef7a5af273f8042df0ff9788e27eb8df9ad70d7a2",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-20 im-repo-replacement, same ruling: 'realized' -> 'as the modeled effective price' (the glossary reserves 'realized' for source-reported revenue), and the training-compute claim is attributed to the accounting policies these providers report instead of stated universally. TWO sentences in this slice differ
    "report-s10":   "3469f309fd883c4fad7021bcd0eb7eb87f41c196533dc2afa0911365c80461ef",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-20 im-share-ready-0920 ROUND 2, program bq-2998: the council's third group. The §10 normalized table called itself "Same-assumption scenario outputs" while its rows do NOT share an algorithmic-lead prior (measured: 3 months for Anthropic/OpenAI/Google, 1 for DeepSeek, 0 for xAI/Moonshot/Zhipu; holding it at 0 moves Google 45.58% -> 28.38%). The paragraph now names the priors instead of implying equality. CONTENT delta, declared not re-captured; no computed figure moved.  // 2026-09-20 im-share-ready-0920, program bq-2998: the §10 provider cards stop explaining their replays with inputs the 2026-09-19 refresh replaced. DeepSeek: "~74%" and the retired $0.435/$0.87 tariff -> the executed 86.467% on $0.66/$1.98 off-peak with its FP4 tuple named, the "60% below R1" clause -> ~10%, and the 45-83% range marked SUPERSEDED because it was derived on the retired tariff and no longer brackets the headline. Kimi: 4.6x -> 2.02x against $1.98. Gemini: the derived Ironwood hour stated as ~$1.28 twice -> $1.62, the registered $5.40 x the dive's 0.30 scalar, shown inline. GLM: the card described 8:1/41% where the replay computes Reference 15:1/60%. NO ENGINE OUTPUT MOVED - measured, 0 of 270 records differ numerically.  // 2026-09-20 im-repo-replacement, the unfinished tail of the tariff correction the same answer authorises: the OpenAI card BODY was still quoting $5/$30, $2.50/$15 and $1/$6 -- one of them inside a 'Known knowns ... (disclosed)' list -- against a face the tariff round moved to ~90% and a registry moved to $4/$20, $2/$12 and $0.20/$1.20. The body now quotes the registry and names what it used to say
    "front-page":   "6a237d43f6743184487b4d19b0335b45cbbfedc13e7b9e0189bb3f28c28019ec",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-20 im-share-ready-0920 ROUND 2: the whole page carries the §10 delta above.  // 2026-09-20 im-share-ready-0920, program bq-2998: the front-page slice is the WHOLE canonicalized page, so it carries the §3 and §10 deltas declared above PLUS the two methods-box edits that sit outside every section slice - the transfer statistic in the calibration bullet (37% -> 47% across three measured platforms) and the new clause saying that applying the Gundlach 3x/yr cross-model rate to residual serving efficiency at fixed geometry is an additional, unvalidated assumption.  // 2026-09-20 im-repo-replacement, same ruling: the front-page slice is the WHOLE page, so it carries report-s5, report-s7 and report-s10 above PLUS the three methods-box corrections that sit above <h3 id="s1"> and therefore belong to no section -- the flat factual error 'idle accelerators do not draw board power' (refuted by this page's own Google annex), a basis promise broader than the suite enforces, and an unscoped superlative now scoped to the xAI card
    "report-s2":   "f995ed238d56b28e244652e93d044fd7a0dc1a995b71d056166acad72de78b30",  // 2026-09-09 im-release-edit: the heading stops calling the evidence base 'verified' — a word this page also uses for a result identity, and which the honesty gate polices as one
    "report-s4":   "cbd702ae8bfeb15c300a87e6b123b5d8f950d99893cad455d5a08d4d9f36d2e5",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md). // 2026-09-10 im-release-edit-r3, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok: the previous delta's REASON expired — it said GB300 carries no registered price and is renormalized out, and the ruling registered one. The note now says the $6.00 IS an input to the published readings as a registered provisional row, dates when that changed, and states plainly that no evidence changed: no GB300 NVL72 rack rental is published by any provider the arms checked
    "report-s8":   "b597df842128e2adadb872349a4f712049a24d0cfc4b2af0974684e9bb844086",
    "report-s9":   "056f65e9d639de84f5f178c46efd226b52940f48c5de44b002829f6f032d97de",

  },
  raw: {
    "report-s1":   "4c855427c7a28fcfcafbb666bb7086772ba7081710c4191d6ee6e1761734882a",  // 2026-09-09 im-release-edit: the framing paragraph names the page's own metric instead of borrowing the discourse's phrase, and 'warm GPU' becomes 'warm accelerator' (raw slice)
    "report-s3":   "7cb860b1f7c36e3ac6e29de852fc4ca5491e185a515fef65d8cf80fe427ed21a",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-20 im-share-ready-0920, program bq-2998: raw counterpart of the norm delta above.  // 2026-09-09 im-release-edit, Astra xhigh fold: the precision sentence goes back to naming the FLOPS rate and byte widths — the rewrite had turned processing capacity into per-token work, which are different quantities; and the H20/Ascend coefficients get their 'source-informed neutral' description back (raw slice)
    "report-s5":   "f114afef2e37091babfa4292ef82c9ea46d66e8431e7b1dabf1ed97797e054e0",  // 2026-09-20 im-repo-replacement, owner ruling d-20260920-im-replace-repo-then-publish-deploy (answer C on q-im-vetted-publish-deploy-share-2026-09-19, which authorises six written prose corrections to this frozen text): the cache-read serving cost stops being asserted and is stated as the analyst-set, unobserved figure the methods box already calls it. ONE sentence in this slice differs (raw slice)
    "report-s6":     "765403d021eadf59586a21ffc1f4290794520a68c8a37a9a7c0611fc68041f41",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-12 im-release-contradiction-fix, bq-2315 + ruling d-20260910-im-adopt-fleet-rents-and-correct-grok
    "report-s7":   "a857649a6b6f75ef61392bdbaae3b612dae44e4e14487515306abebc457a749a",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-20 im-repo-replacement, same ruling: 'realized' -> 'as the modeled effective price' (the glossary reserves 'realized' for source-reported revenue), and the training-compute claim is attributed to the accounting policies these providers report instead of stated universally. TWO sentences in this slice differ (raw slice)
    "report-s10":   "970bae0ca085bb397e1f3190300e27cde38c10f9afead8f14706f80404979c32",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-20 im-share-ready-0920 ROUND 2: raw counterpart.  // 2026-09-20 im-share-ready-0920, program bq-2998: raw counterpart of the §10 norm delta above.  // 2026-09-20 im-repo-replacement, the unfinished tail of the tariff correction the same answer authorises: the OpenAI card BODY was still quoting $5/$30, $2.50/$15 and $1/$6 -- one of them inside a 'Known knowns ... (disclosed)' list -- against a face the tariff round moved to ~90% and a registry moved to $4/$20, $2/$12 and $0.20/$1.20. The body now quotes the registry and names what it used to say (raw slice)
    "front-page":   "93b5bce98688d8c24d9c0ab4d21765f6c9b396efd2b83da76310a51ae4f19402",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-20 im-share-ready-0920 ROUND 2: raw counterpart.  // 2026-09-20 im-share-ready-0920, program bq-2998: raw counterpart of the front-page norm delta above.  // 2026-09-20 im-repo-replacement, same ruling: the front-page slice is the WHOLE page, so it carries report-s5, report-s7 and report-s10 above PLUS the three methods-box corrections that sit above <h3 id="s1"> and therefore belong to no section -- the flat factual error 'idle accelerators do not draw board power' (refuted by this page's own Google annex), a basis promise broader than the suite enforces, and an unscoped superlative now scoped to the xAI card (raw slice)
    "report-s2":   "25380a4bc9bbc210a96010be34320317a0199237064fd5c4401cc3356c97c337",  // 2026-09-09 im-release-edit: the heading stops calling the evidence base 'verified' — a word this page also uses for a result identity, and which the honesty gate polices as one (raw slice)
    "report-s4":   "d3639c85219290e9f067ae85abdb532ba95c7ffe4429ac11640d1db48360ac2c",  // 2026-09-23 im-share-ready-r2-0923, program bq-2998: folding the GPT Pro checkpoint pr-20260923T092854Z-f07d0e (prose only; executed, not quoted; evidence im-share-ready-r2-0923-work/pro/FOLD.md) (raw). // 2026-09-10 im-release-edit-r3, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok: same expiry as the normalized row above — the $6.00 is now a registered provisional planning rent and the note says so, dated, with the evidence position unchanged (raw slice)
    "report-s8":   "c3bf875465991c3e9e365cbfc7b2cc1e00becef2b91c81b48ee60dd58bc2c371",
    "report-s9":   "71adf45d67f9c3c6216157e3696d95cbf47dc914ece34d318e7b850688b9f23d",

  },
};
const expectNorm = (id) => RELEASE_DELTAS.norm[id] ?? capture.sections[id].textSha256;
const expectRaw  = (id) => RELEASE_DELTAS.raw[id]  ?? sidecar.sections[id].textRawSha256;

const SLICE_RE = /<h3 id="s(\d+)">([\s\S]*?)<\/h3>/g;
function sections(src) {
  const out = new Map();
  const heads = [...src.matchAll(SLICE_RE)];
  for (let i = 0; i < heads.length; i++) {
    const n = heads[i][1], start = heads[i].index;
    const next = i + 1 < heads.length ? heads[i + 1].index : src.indexOf("</section>", start);
    out.set(`report-s${n}`, src.slice(start, next === -1 ? src.length : next));
  }
  return out;
}
const SEC = sections(index);
/* The front-page slice is the WHOLE page, so it contains the footer's release-commit token — and
   deploy.sh rewrites that token BEFORE running the gates (release reproducibility: the suites must
   exercise the exact bytes that ship). Without canonicalizing it, this parity assertion is
   unsatisfiable on any real deploy and satisfiable only on a branch that never deploys, which is
   why it survived on the dev line and failed on master's first release run. Same treatment, and
   same wording, as the render-parity presentation freeze: treat that ONE provenance token as a
   parameter of the frozen page, while every surrounding byte remains pinned. The ten report-sN
   slices do not contain the footer and are untouched by this. */
const CANON_STAMP = '<span id="release-commit">0d2f84c</span>';
const canonIndex = index.replace(/<span id="release-commit">[^<]+<\/span>/, CANON_STAMP);
const rawOf = (id) => (id === "front-page" ? canonIndex : SEC.get(id));

/* Authorized-delta minting aid: DUMP_PARITY_HASHES=1 prints each id's computed norm/raw hashes
   so a DECLARED release delta can be written from executed values, never guessed. */
if (process.env.DUMP_PARITY_HASHES) {
  for (const id of Object.keys(capture.sections)) {
    const src = rawOf(id);
    console.log(`${id} norm=${sha(norm(nodeHtmlToText(src)))} raw=${sha(nodeHtmlToText(src))}`);
  }
}

test("U-16 the Node and Worker htmlToText bodies are byte-identical (the two runtime extractors cannot diverge)", () => {
  const a = bodyOf(nodeSrc, "export function htmlToText(html: string): string {");
  const b = bodyOf(workerSrc, "export function htmlToText(html: string): string {");
  assert.equal(a, b, "the Worker override drifted from its Node original — re-sync overrides/ with ../src");
  assert.ok(a.includes("report-section"), "the class-scoped <summary> strip is missing from htmlToText");
});

test("U-16 normalized MCP text is byte-identical to the bedcc23 capture for all eleven ids", () => {
  const ids = Object.keys(capture.sections);
  assert.equal(ids.length, 11, "the capture must cover report-s1..s10 and front-page");
  for (const id of ids) {
    const src = rawOf(id);
    assert.ok(src !== undefined, `${id}: no source slice — the #report structure changed shape`);
    assert.equal(sha(norm(nodeHtmlToText(src))), expectNorm(id),
      `${id}: normalized MCP text moved. The report markup may only change in ways the transport cannot see.`);
  }
});

test("U-16 RAW MCP text is byte-identical to the re-derived bedcc23 sidecar for all eleven ids", () => {
  for (const id of Object.keys(sidecar.sections)) {
    assert.equal(sha(nodeHtmlToText(rawOf(id))), expectRaw(id),
      `${id}: raw MCP text moved — a whitespace-only change the normalized assertion cannot see.`);
  }
});

test("U-16 the capture's indexHtmlSha256 is PROVENANCE, not an assertion input", () => {
  /* It records which revision the text was captured from. site/index.html has legitimately moved
     since (UX-A's aria-haspopup re-mint, and this leg's report restructure), so asserting equality
     here would fail for a reason that has nothing to do with MCP text — and "fixing" it by
     re-capturing would destroy the only thing the fixture is for: predating the markup. */
  assert.equal(capture.commit, "bedcc23252c605ce2dad57f4805195ff43eec6d6");
  assert.equal(sidecar.indexHtmlSha256, capture.indexHtmlSha256, "the sidecar must be derived from the SAME revision as the capture");
  assert.notEqual(sha(index), capture.indexHtmlSha256, "index.html is expected to have moved since capture — the text, not the file, is what is pinned");
});

test("U-16 exactly ten report summaries are stripped, and the six §10 provider summaries survive", () => {
  const STRIP = /(<details\b[^>]*\bclass\s*=\s*["'][^"']*\breport-section\b[^"']*["'][^>]*>\s*)<summary\b[^>]*>[\s\S]*?<\/summary>/gi;
  assert.equal([...index.matchAll(STRIP)].length, 10,
    "the class-scoped strip no longer matches exactly ten report summaries — markup drift would silently change transport text");
  const s10 = nodeHtmlToText(rawOf("report-s10"));
  for (const name of ["OpenAI — GPT-5.6 Sol", "Google — Gemini 3.1 Pro", "xAI — Grok 4.5",
                      "DeepSeek — V4 Pro", "Zhipu / Z.ai — GLM 5.2", "Moonshot — Kimi K2.7 Code"]) {
    assert.ok(s10.includes(name), `§10 lost the provider dossier summary "${name}" — the strip is not class-scoped`);
  }
  assert.ok(!nodeHtmlToText(index).includes("Expand this section"), "disclosure chrome leaked into MCP transport text");
});

test("U-16b NEGATIVE CONTROL: with the strip disabled, parity MUST fail", () => {
  /* Reproduces the pre-strip helper by removing exactly the one added replacement, so this control
     tracks the real implementation instead of a hand-written imitation of it. */
  const stripless = (html) => {
    let s = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    s = s.replace(/<(td|th)[^>]*>/gi, " | ");
    s = s.replace(/<\/?(h[1-6]|p|div|section|article|li|ul|ol|table|tr|thead|tbody|blockquote|header|footer|details|summary|figure|figcaption|pre)[^>]*>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
    s = s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
         .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
         .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
    return s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  };
  const differing = Object.keys(capture.sections)
    .filter((id) => sha(norm(stripless(rawOf(id)))) !== capture.sections[id].textSha256);
  assert.equal(differing.length, 11,
    "the strip is not load-bearing: without it the text should differ on ALL eleven ids. If this control passes vacuously the parity test above proves nothing.");
  assert.ok(stripless(rawOf("report-s1")).includes("Expand this section"),
    "the control does not reproduce the leak it exists to demonstrate");
});
