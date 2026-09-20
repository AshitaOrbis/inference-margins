/* R2 PRODUCTION SINK SCANNER (im4-r2-shipment-plan §1.8, P5 redesigned) — the
   shipping generalization of the pre-R2 harness scanner (harness/sink-discovery.mjs
   + sink-manifest.mjs, which stay archived as the reference implementation and are
   imported by NOTHING in the release chain).

   (a) DISCOVERY enumerates the COMPLETE release source graph — site/*.js,
       site/index.html, mcp-server/src/**, worker src+overrides+scripts, build
       scripts at repo root — and FAILS on any eligible file not scanned (the
       scanned-file manifest is itself pinned in the registry).
   (b) Every discovered site gets a STABLE SINK ID:
       file | channel | content-hash16(line) | occurrence-index among identical
       (file, channel, hash) triples ordered by line — the hash alone collides on
       duplicate-line groups (R2-review P5/NEW-1), the occurrence index makes the
       multiset faithful.
   (c) The coverage gate (sink-coverage.test.mjs) compares claim-bearing sink IDs
       ONE-TO-ONE against the pinned registry as MULTISETS with cardinality
       equality — a duplicated sink can never vanish into set equality.
   (d) Classification is FAIL-CLOSED: every discovered site must match exactly one
       rule (first match wins); unmatched sites fail the gate. Rules anchor on
       content tokens and ENCLOSING-FUNCTION names, never raw line ranges (line
       ranges were the harness's known-brittle device; function anchors survive
       the amend loop).
   Registry: tests/sink-registry-v22.json (digest minted LAST — §4.5/§4.7 amend). */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const sha16 = (s) => createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

/* ---------- (a) the eligible release source graph ---------- */
const ELIGIBLE = Object.freeze([
  { dir: "site", ext: [".js"], recurse: false },
  { file: "site/index.html" },
  { dir: "mcp-server/src", ext: [".ts", ".d.ts"], recurse: true },
  { dir: "mcp-server/worker/src", ext: [".ts"], recurse: true },
  { dir: "mcp-server/worker/overrides", ext: [".ts"], recurse: false },
  { dir: "mcp-server/worker/scripts", ext: [".mjs"], recurse: false },
  { rootScripts: true }, // build scripts at repo root (*.mjs)
]);

export function eligibleFiles(root) {
  const out = [];
  const walk = (rel, exts, recurse) => {
    let entries;
    try { entries = readdirSync(join(root, rel)); } catch { return; }
    for (const e of entries.sort()) {
      const relPath = `${rel}/${e}`;
      const st = statSync(join(root, relPath));
      if (st.isDirectory()) {
        /* im-release-edit 2026-09-09: `economics` and `economics-node` join the exclusion list.
           They are VENDORED BUILD OUTPUT — mcp-server/scripts/sync-economics.mjs copies the U3
           modules into them, and mcp-server/.gitignore ignores both. Counting them made this
           scan's answer depend on whether `npm --prefix mcp-server run build` had been run in
           this working tree: the same commit scanned 52 files before a build and 64 after, so the
           pinned manifest could not be right in both states and the gate failed in whichever one
           it was not pinned for. A gate whose verdict depends on build state is not a gate. The
           originals these are copied from are scanned at their own source path. */
        if (recurse && e !== "node_modules" && e !== "gen" && e !== "dist"
            && e !== "economics" && e !== "economics-node") walk(relPath, exts, recurse);
        continue;
      }
      if (exts.some((x) => e.endsWith(x))) out.push(relPath);
    }
  };
  for (const spec of ELIGIBLE) {
    if (spec.file) out.push(spec.file);
    else if (spec.rootScripts) {
      for (const e of readdirSync(root).sort()) {
        if (e.endsWith(".mjs") && statSync(join(root, e)).isFile()) out.push(e);
      }
    } else walk(spec.dir, spec.ext, spec.recurse);
  }
  return [...new Set(out)].sort();
}

/* ---------- (b) discovery: text channels per file class ---------- */
/* Channel regex set: the harness set (R1–R8 reviews) applied to the WHOLE graph.
   A channel names HOW content leaves the program, not whether it is claim-bearing —
   classification decides that, fail-closed. */
const JS_CHANNELS = Object.freeze([
  ["dom-write", /\.(innerHTML|textContent)\s*=/],
  ["mkel-call", /\b(mkEl|boardBadge)\(/],
  ["chart-text", /\bchartText\(/],
  ["title-attr", /\.title\s*=(?!=)/],
  ["append-call", /\.append\(/],
  ["tooltip-call", /\b(ttRows|showTip|attachMarkTip)\(/],
  ["aria-label", /aria-label|ariaLabel/],
  ["dataset-attr", /dataset\.\w+\s*=(?!=)/],
  ["share-url", /replaceState\(|pushState\(|writeText\(/],
  ["svg-geometry", /\bsvgEl\(/],
  ["class-style", /\.className\s*=|classList\.(add|remove|toggle)\(|\.style\.\w+\s*=|\.cssText\s*=/],
]);
const TS_CHANNELS = Object.freeze([
  ["mcp-build", /\b(content|structuredContent)\s*[:=](?!=)/],
  ["boundary-emit", /CONTRACTS\.emit\(/],
  ["stdout-log", /console\.(log|error)\(/],
]);
const HTML_CHANNELS = JS_CHANNELS; // inline <script> blocks use the same channels
const MJS_ROOT_CHANNELS = Object.freeze([
  ["build-write", /writeFileSync\(/],
  ["stdout-log", /console\.(log|error)\(/],
]);

function channelsFor(file) {
  if (file.startsWith("site/") && file.endsWith(".js")) return JS_CHANNELS;
  if (file === "site/index.html") return HTML_CHANNELS;
  if (file.endsWith(".ts") || file.endsWith(".d.ts")) return TS_CHANNELS;
  return MJS_ROOT_CHANNELS;
}

/* Enclosing top-level function per line (content anchor for classification). */
function functionSpans(lines) {
  const spans = [];
  lines.forEach((text, i) => {
    const m = text.match(/^(?:async )?function (\w+)\(/) || text.match(/^const (\w+) = (?:async )?\(?[\w{,\s)]*\)?\s*=>/);
    if (m) spans.push({ name: m[1], start: i + 1 });
  });
  return (lineNo) => {
    let name = null;
    for (const s of spans) { if (s.start <= lineNo) name = s.name; else break; }
    return name;
  };
}

export function discoverSinks(root, readFile = (rel) => readFileSync(join(root, rel), "utf8")) {
  const files = eligibleFiles(root);
  const sites = [];
  for (const rel of files) {
    const channels = channelsFor(rel);
    const lines = readFile(rel).split("\n");
    const fnOf = functionSpans(lines);
    lines.forEach((text, i) => {
      for (const [kind, re] of channels) {
        if (re.test(text)) {
          sites.push({ file: rel, line: i + 1, kind, fn: fnOf(i + 1), snippet: text.trim().slice(0, 200) });
          break; // one site per line, first channel wins (harness dedupe semantics)
        }
      }
    });
  }
  return { files, sites };
}

/* Stable sink IDs: occurrence-indexed among identical (file, kind, hash) triples. */
export function stableSinkIds(sites) {
  const counters = new Map();
  return sites.map((s) => {
    const h = sha16(s.snippet);
    const key = `${s.file}|${s.kind}|${h}`;
    const occ = counters.get(key) ?? 0;
    counters.set(key, occ + 1);
    return { ...s, hash16: h, occ, id: `${key}|${occ}` };
  });
}

/* ---------- (d) classification manifest — fail-closed, first match wins ---------- */
const R = (name, match, disposition) => Object.freeze({ name, ...match, disposition: Object.freeze(disposition) });

export const SINK_RULES = Object.freeze([
  /* ---- non-app files with no claim surface of their own ---- */
  R("engine-modules-no-sink",
    { filePattern: /^site\/(engine|engine-data-v22|engine-roofline-v22|engine-contracts-v22|evidence-schema|uncertainty-contract)\.js$/ },
    { exempt: "pure engine/data/contract modules — they RETURN values; every render/emission surface consuming them is discovered at its own call site (app.js, shape.ts, worker). Channel hits here are string-building internals, comments, or the contracts module's own adapters (exercised only through registered emitters)" }),
  R("root-build-scripts",
    { filePattern: /^[^/]+\.mjs$/ },
    { exempt: "repo-root build scripts (grounding ledger + research HTML builders) — build-time artifact writers whose OUTPUTS are the site/research pages already covered by render-parity file freezes; not runtime claim emitters" }),
  R("index-html-static",
    { fileIs: "site/index.html" },
    { exempt: "static page markup + the pre-paint theme/skin head script (presentation-only; theme/skin toggles carry no claim values). Static prose claims on the page are covered by the render-parity file freeze, not the runtime sink gate" }),

  /* ---- claim-bearing app.js surfaces (checked before exemption chrome) ---- */
  R("factory-definitions",
    { pattern: /function (mkEl|boardBadge|chartText)\(/ },
    { exempt: "element/text factory DEFINITIONS — the sink is realized at call sites, which are separately discovered and classified" }),
  R("fleet-renderability-chip",
    { pattern: /id-chip id-state|id-chip id-status-vector|out-fleet-renderable|fleetRenderableText|fleet status — weightCapacity/ },
    { class: "hero-tile", why: "fleet-renderability disclosure chip + the R2 five-status/two-boolean emission — weld surfaces qualifying the hero" }),
  R("form-correction-debt",
    { fnIn: ["renderFormCorrectionDebt"] },
    { class: "hero-tile", why: "the visible open-calibration-debt warning that qualifies every calculator result, including the Trainium batch-quantity exposure" }),
  /* b9 M6 (FA memo §5.4 D-6m): the analyst-gap EXECUTIVE SUMMARY — its own weld-required emitter
     class, deliberately not a final-answer alias, because the two surfaces move independently and
     their pins must never alias. Function-anchored, and checked BEFORE the final-answer rule so the
     exec rows are never absorbed into it. */
  R("executive-summary-block",
    { fnIn: ["renderExecSummary", "lowEvidenceAffordance", "faExplainExecPayload"] },
    { class: "executive-summary", why: "b9 M6 (D-7): the analyst-gap bridge rows — four engine-computed single-control margins from the calculator's own default state (each welded from ITS OWN state) plus the spec-decode lever row, its evidence links and the low-evidence affordance. Every rendered string IS an engine token" }),
  R("final-answer-block",
    { fnIn: ["renderFinalAnswer", "refreshFinalAnswerDiffers",
             "openFaExplain", "faExplainShell", "renderSegmentedInto", "segmentJustification",
             "wireFaExplainTriggers", "faCoarsePointer"] },
    { class: "final-answer", why: "R3 Row 1 (design memo D-9): the FINAL-ANSWER result surface — engine finalAnswer() token strings (weld-required class; values bind the clean thesis baseline, never live state) + the live differs-note. Function-anchored: every sink in the two renderers IS this surface" }),
  R("im-arc-t1-hero-bases",
    { fnIn: ["renderRentSegment", "renderBasisCounterpart"] },
    { class: "hero-tile", why: "im-arc T1: the visible rental-inclusive lessor-cut segment and the paired other-basis card — live cost, implied-spread and unit-serving-margin claims qualifying the hero" }),
  R("im-arc-t1-hardware-tables",
    { fnIn: ["renderHwTwoTables"] },
    { class: "hardware-lens-tile", why: "im-arc T1: the paired inferred-rent and owned/TCO per-accelerator tables, sourced from the same engine paths as the charts" }),
  R("blend-exclusion-marker",
    { fnIn: ["buildBlend"], pattern: /excluded from the default|hw-excluded|membershipExclusionClause\(memb\)/ },
    { class: "hardware-lens-tile", why: "R3 Row 0 (design memo D-3d): the slider-row exclusion marker — an excluded leg sits at 0 with the disclosure attached (title text = the ONE shared exclusion formatter; user may still raise the leg)" }),
  /* b9 spec-decode LEVER (§9.5). CLAIM-BEARING, and deliberately NOT the exemption the gate's
     control-row disclosure gets: this string carries `factorApplied` — a computed factor on a
     RENDERED leg — and states whether the credit reached that leg. It is the same surface class as
     the custom-fleet leg panel below, which already covers the identical disclosure on custom
     fleets; this rule covers the default and named fleet rows, which had no per-leg surface at all
     before this leg. Anchored on the class name so it cannot absorb neighbouring slider chrome. */
  /* The share-slider row's PROVIDER-BOUNDED note (owner ruling q-sliders-fleet-util-point). It
     carries the declared range's own ends, so it states an adjudicator's claim on a control row and
     is claim-bearing for the same reason the exclusion marker above is. It also explains why this
     leg offers no range handles of its own — a provider range and a leg range inside it would state
     one claim twice, and the engine refuses the pair. */
  R("blend-provider-range-note",
    { fnIn: ["buildBlend"], pattern: /Bounded with the rest of its provider/ },
    { class: "hardware-lens-tile", why: "owner ruling q-sliders-fleet-util-point: the slider-row note naming the provider-wide share range this leg is bounded inside, with that range's declared ends, and why a per-leg range is not offered on top of it" }),
  R("specdec-per-leg-disclosure",
    { fnIn: ["buildBlend"], pattern: /hw-specdec|specDecReasonText/ },
    { class: "hardware-lens-tile", why: "b9 spec-decode LEVER (§9.5): the per-leg spec-decode disclosure on default and named fleet rows — whether the credit reached this leg and, when it did, the factor applied. Bytes come from the ONE engine-owned formatter; the leg DTO carries codes only" }),
  R("custom-fleet-leg-panel",
    { fnIn: ["cfPerLegPanel"] },
    { class: "hardware-lens-tile", why: "b9 M4 (memo §5.4): the read-only per-leg panel that replaces the share sliders under a custom-fleet selection — leg labels + donor calibration identity (attribution), user-declared share values, override enumeration, and the analyst-transfer disclosure sentence. Function-anchored like the switcher rule: every sink in the panel builder IS this surface" }),
  R("fleet-switcher-block",
    { fnIn: ["buildFleetSwitcher", "renderFleetCompositionLine", "renderFleetDisclosure", "fleetPresentedSpan", "fleetSwitcherLabel", "cfManagementRow"] },
    { class: "hardware-lens-tile", why: "Slice C (design memo C-5/C-6, gate closed 2026-07-23): the named-fleet switcher — the LOCKED span estimand sentence (build-time derivation, never a pinned string), per-fleet disclosure from typed DTO fields (class chip w/ counterfactual bar, verbatim attribution, evidenced weight share, live TWO-quantity renderable readout, membership head on the default selection). Function-anchored: every sink in the switcher builders IS this surface" }),
  /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
     new fleet-mode and band writes are classified before generic builder/chrome
     exemptions. Coverage and mode wording are assumptions about the modeled fleet;
     band helpers carry computed result ranges. */
  R("im-arc-t3-dc-registry-row",
    { fnIn: ["cfOpenDcComposer"], pattern: /row\.(site|programme|operator|coverage)|registryRowClass/ },
    { class: "hardware-lens-tile", why: "im-arc T3: each selectable DC/programme row renders its registry coverage class; evidence-bearing fleet input, not generic dialog chrome" }),
  R("im-arc-t3-dc-composer-chrome",
    { fnIn: ["cfOpenDcComposer"] },
    { exempt: "im-arc T3: data-center composer lifecycle controls, static guidance and validation errors; the registry evidence row itself is separately classified above" }),
  R("im-arc-t3-fleet-mode",
    { fnIn: ["fleetModeControl", "renderFleetCoverageLine"] },
    { class: "hardware-lens-tile", why: "im-arc T3: generic-vs-DC mode identity, generic-cost assumption wording, and the modeled-blend coverage ledger" }),
  R("im-arc-t3-section-band-cells",
    { fnIn: ["sectionBandCell"] },
    { class: "hardware-lens-tile", why: "im-arc T3: middle assumption plus bottom-to-top section/share-polytope band cells used by accelerator tables and result surfaces" }),
  R("im-arc-t3-hero-section-band",
    { fnIn: ["renderSectionBandFace"] },
    { class: "hero-tile", why: "im-arc T3: hero middle-assumption section band container; the band value is emitted by the classified sectionBandCell adapter" }),
  R("im-arc-t3-chart-section-band",
    { fnIn: ["renderStackChart"], pattern: /chart-section-band/ },
    { class: "hardware-lens-tile", why: "im-arc T3: section/share-polytope band attached to the procurement-basis chart" }),
  R("total-case-bookmarks",
    { fnIn: ["buildTotalCaseBookmarks"] },
    { class: "hardware-lens-tile", why: "Slice C (memo C-8/C-10): the labeled total-parameter bookmarks — each button cites its TOTAL_CASES row (label + citation in the title attr); machine-guarded in-scope-only rendering on top of the state-machine guard" }),
  R("energy-rent-chip",
    /* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): the sign branch is
       still the same claim-bearing energy/rent comparison chip. */
    { pattern: /energy-rent-chip|Current lens is a rent basis|Current lens declares the owned|Current lens is owned\/TCO|chip\.textContent = hasRentBelow|displayedProcurementBasis\(|db\.basis ===|TIPS\.procBasis\.b/ },
    { class: "hardware-lens-tile", why: "b9 M3 (memo §3.4; plan D-2): the embedded-in-rent electricity chip above the owned/strategic-TCO counterfactual stack chart — names the lens's procurement basis and carries the implied physical Wh/Mtok (info-only; electricity dollars under rent bases would be fabrication)" }),
  R("chart-svg-text",
    { pattern: /chartText\(/ },
    { class: "hardware-lens-tile", why: "SVG chart text: computed values, verdict phrases, axis/series labels — the chart claim surface" }),
  R("saved-scenario-controls",
    { pattern: /saved-row|saved-load|saved-act|saved-empty|Enter to save|Rename this saved|Delete this saved|predates v2\.2/ },
    { exempt: "saved-scenario management controls — user-data lifecycle chrome, no computed claim values" }),
  R("custom-fleet-builder-chrome",
    /* T5 rec 4: cfHbmField joins the builder-chrome family. It is the typed HBM capacity control
       lifted out of the generic ovField, and it emits what this rule already exempts — a field
       label quoting the donor's registry capacity the reader is editing, plus a per-donor hint
       about which entry reproduces it. No computed claim value: the donor figure is a registry
       constant, and every claim-bearing custom-fleet readout still renders through the
       separately-classified emitters.

       WHAT THIS EXEMPTION DOES NOT COVER, named because a review proved it matters: exempting
       the function means a SWAPPED GB/GiB divisor passes every semantic sink gate. The exemption
       is still the right class — these are constants being edited, not claims being made — but
       "right class" is not "unguarded". The conversion is asserted where it is read, in
       tests/custom-fleets-cdp.test.mjs: the rendered donor label must carry the exact byte count
       and both conventions must be that number divided by 1e9 and 2^30. Widening a classifier to
       cover a risk is the wrong tool; a check that fails on the risk is the right one. */
    { fnIn: ["cfOpenChooser", "cfDialogShell", "cfLegEditor", "cfValueField", "cfSectionEditor", "cfOpenBuilder", "cfHbmField"] },
    { exempt: "b9 M4 (memo §14): the custom-fleet BUILDER dialog — user-data lifecycle chrome (create/clone/edit/save/delete controls, field labels showing donor DEFAULTS the user is editing, the read-only spec drill-down with its LOAO lock sentence, validation errors). No computed claim values: every claim-bearing custom-fleet surface (hero, disclosure chips, per-leg panel readouts) renders through the separately-classified emitters, and the drill-down's spec strings restate registry constants already covered by the render-parity file freeze" }),
  R("custom-fleet-controls",
    { pattern: /Custom fleet…|cf-chip|cf-manage|Save a copy of|Delete custom fleet|aria-label", "Edit |aria-label", "Delete / },
    { exempt: "b9 M4 (memo §14): custom-fleet management-row chrome — lifecycle buttons and fleet-name labels, no computed claim values" }),
  R("interlock-lever-panel",
    { fnIn: ["interlockGroupPanel"] },
    { class: "hardware-lens-tile", why: "b9 M5 (memo §§9.5, 10.5, 12.4): the broad-lever panel under the family and algorithmic-lead sections. CLAIM-BEARING and deliberately not exempt: it renders the COMPUTED lead factor and its cost effect (E = ×N.NN → cost-out ÷N.NN), the resolved lab binding and its ratified months, plus the qualifying copy those numbers may never appear without — the not-a-measurement label, the soft-warning past ±6, the primary citation, the permanent price-series refusal, the lock/transition/stacking lines and the non-blocking overlap warnings. Function-anchored like the switcher rule: every sink in the panel builder IS this surface" }),
  R("slider-scroll-lock-chrome",
    { fnIn: ["openSliderLockPopup", "sliderLockChip"] },
    { exempt: "b9 M5 (memo §12): the touch scroll-lock popup and its lock chip — INPUT-SAFETY chrome (three lifecycle choices plus the why-line distinguishing this lock from the broad-lever interlock). No computed claim values: it decides whether sliders accept input, never what any number is" }),
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-2): the registered-rate
     sentence is a hardware assumption claim, even though its neighbouring inputs are chrome. */
  R("im-arc-t1-registered-rate-claim",
    { fnIn: ["buildRentAbsolute"], pattern: /HW\[k\]\.name \+ " — registered \$"/ },
    { class: "hardware-lens-tile", why: "im-arc T1 fix: the per-accelerator registered $/hr assumption shown beside an absolute-rent input; classified with the hardware claim surface" }),
  R("im-arc-t1-control-chrome",
    { fnIn: ["buildControls", "buildNullableNumber", "buildRentAbsolute"] },
    { exempt: "im-arc T1: basic/advanced section chrome and absolute-rent inputs — labels plus echoes of reader-stated prices; no modeled margin or cost-per-token result" }),
  R("lever-group-data-attr",
    { pattern: /dataset\.leverGroup/ },
    { exempt: "b9 M5: a data attribute binding a control section to its lever group so the app can render the lock state — plumbing, never user-visible text" }),
  /* ORDERING: this rule sits ABOVE the pattern-matched rules deliberately. It is scoped to ONE
     function, so it cannot over-capture, and a function-scoped rule knows strictly more than a text
     pattern about what a line is. Found the honest way — the evidence-board pattern matches the
     token `b.label`, which is also the per-dial band's own variable, so a band readout was being
     filed under the evidence catalogue. Both classes are claim-bearing, so nothing escaped; it was
     the WRONG claim class, which is the kind of drift this registry exists to prevent. */
  /* row 499: the band readout is CLAIM-BEARING and classified as such — it renders margin
     percentages beside the hero, which is the strongest thing this page says. The two controls
     beside it are not: one is a mode toggle, the other echoes the reader's own bound values back at
     them. If the range handles ever render a computed margin, they move classes.
     The per-dial rows and the compounded opt-in belong to the SAME rule and the same class: both
     emit computed margin percentages, and the compounded one emits the widest number on the page.
     The button that reveals it is chrome, but the panel it reveals is not — so the whole function
     is classified rather than the strings inside it, which is what keeps a later author from
     adding a fourth readout that nobody classified. */
  /* The header range (owner ruling 2026-08-07 19:02Z) is the SAME claim class as the band it
     summarizes — it renders margin percentages directly under the hero, which makes it the most
     prominent computed claim on the page after the hero number itself. Same rule, same class, so
     the two cannot drift apart about what they are. */
  /* The QUOTED adjudicator pair gets its OWN rule and its own reason, rather than being folded into
     the band readout it sits above. Both are claim-bearing and both render percentages at the hero,
     but their provenance is opposite: the band is something this page DERIVES, and this is something
     an adjudicator WROTE. A registry that files them together would lose exactly the distinction the
     surface exists to make, and the next author would have no reason to keep them apart. */
  /* THE ONE WINDOW (owner voice note note-20260912T180812Z-c9eaac, 2026-09-12). Filed as IDENTITY, not
     as chrome: the window head names which scenario the number belongs to, whether it is the default,
     and its cost basis and billing treatment — the same claim class as the identity strip, which is
     why a crop of the tile must never carry a false or absent name. Function-anchored. */
  R("scenario-window",
    { fnIn: ["renderScenarioWindow", "refreshSetDefaultButtons", "wireSetDefaultButtons", "setReaderDefault", "swapScenario"] },
    { class: "identity-strip", why: "the one-window head: the named scenario, its default status, lead, cost basis and billing treatment, the in-place swap and the per-scenario set-as-default controls" }),
  /* bq-2345: the operands and the division on the headline face. Computed values qualifying the hero,
     so hero-tile. */
  R("hero-calculation",
    { fnIn: ["renderHeroCalc", "clearHeroCalc"] },
    { class: "hero-tile", why: "bq-2345: serving cost, modeled billings, the division and the engine's one-decimal result on the headline face, from the same state as the hero" }),
  R("stated-adjudicator-reading",
    { fnIn: ["renderStatedReading"] },
    { class: "hero-tile", why: "the preset author's OWN stated median and range, quoted beneath the hero — external claim values plus the sentence marking them as quoted rather than computed, and the live gap against this page's own arithmetic" }),
  /* THE FEASIBLE-MIX READOUT is filed separately from the band readout beside it, for the same
     reason the stated-adjudicator reading is filed separately from both: the surfaces render
     percentages at the same hero and their DERIVATIONS are different objects. The band compounds
     INDEPENDENT dials over a box; this one solves a COUPLED axis — shares constrained to sum to
     100 % — over a polytope, and it additionally reports WHICH MIX attains each bound and whether
     the median was declared or computed. Filing them together would lose exactly the distinction
     the owner's 2026-08-09 ruling created, and the next author would have no reason to keep the two
     derivations apart. */
  R("mix-band-readout",
    { fnIn: ["renderMixBand", "mixBlocksText", "mixOverlayTrack", "mixFleetText", "famDisplayName"] },
    { class: "hero-tile", why: "owner ruling q-sliders-fleet-util-point: the min/median/max the fleet mix reaches over the provider distributions that sum to 100 % — computed margin percentages, the declared shares of the mix attaining each bound, the median's provenance (declared vs nearest-feasible), and the sentences governing how the range may be read (attainable vs enclosure), plus the named refusals" }),
  R("margin-band-readout",
    { fnIn: ["renderMarginBand"] },
    { class: "hero-tile", why: "the attainable-range readouts at the hero — the full range directly beneath the headline number, the per-dial ranges, the compounded basis, the procurement-scope note and the declared lead basis: computed margin percentages plus the sentences governing how they may be read" }),
  R("evidence-board",
    { pattern: /claim-row|claim-who|claim-badges|claim-reported|claim-src|claim-scope|claim-notclaimed|claim\.url|src\.append|claim\.verbatim|claim-group|BOARD_GROUP_META|range-chip|What would have to be true|b\.label|boardBadge\(|config-row|config-head|config-meta|config-changes|config-note|config-name|config-loaded-tag|bucket|chip-range|chip-meta|chip-current|fd-question|fd-null|fd-claims-line|board-note|unrounded flagship-scope value/ },
    { class: "evidence-board", why: "evidence catalog rows, page-authored route cards, and bucket chips — sourced claims, calculator-relative relation badges, and computed route ≈% values (incl. unrounded title attrs)" }),
  R("typed-tail-commit",
    { fnIn: ["commitTail"], pattern: /tile-mandatory|tile-receipts|tile-actions|tile-receipt-unit|TAIL\.mandatory|TAIL\.receipts|TAIL\.actions|replaceChildren\(man, rec, act\)|u\.textContent = unit|rec\.append/ },
    { class: "hero-tile", why: "b9 UX-C (memo §18.5): the atomic three-region tail commit — every mandatory label, receipt unit and trailing affordance of the hero note flows through this ONE writer; claim-bearing and never exempt (U-15b extends to it)" }),
  R("hero-margin-cost-price-block",
    { pattern: /\$\("out-(margin|cost|price|cost-out|cost-in|margin-note|margin-unanchored|price-note)"\)|heroLabel|"out-price-note"|"out-margin-unanchored"|un\.textContent = parts\.length|pn\.textContent|HERO SUPPRESSED|renderSuppressedHero|TAIL\.mandatory|TAIL\.receipts\.push|TAIL\.actions\.push/ },
    { class: "hero-tile", why: "landing hero margin/cost/price values + weld-bearing notes + the R2 gate-6 suppression tile (engine-derived receipts + the sampled policy band)" }),
  R("feasibility-tile",
    { pattern: /out-feas/ },
    { class: "hardware-lens-tile", why: "feasibility tile + per-leg clause strings incl. R2 solved widths" }),
  R("subscription-verdict",
    { pattern: /verdict\.textContent|declared fleet infeasible at declared serving topology/ },
    { class: "hardware-lens-tile", why: "subscription-lens verdict/no-result (computed claim)" }),
  R("computed-presentation-state",
    { pattern: /subMargin >= 0|bucket-current|identity-strip " \+ id\.cls|infeasible|classList\.toggle\("(chip-active|bucket-current)/ },
    { class: "hardware-lens-tile", why: "presentation state COMPUTED from claim values (profitability color, current-bucket highlight, identity-state class) — the visual state encodes the claim (R8)" }),
  R("svg-chart-geometry",
    { pattern: /svgEl\(/ },
    { class: "hardware-lens-tile", why: "computed SVG geometry (bar widths/positions derive from margin/cost values) — the visual encoding IS a claim channel (R7)" }),
  R("share-permalink",
    { pattern: /replaceState\(|pushState\(|writeText\(/ },
    { class: "share-string", why: "the full-state scenario URL emitted via history + clipboard (R6)" }),
  R("dataset-claim-refs",
    { pattern: /dataset\.(claim|config|bucket)\s*=/ },
    { class: "evidence-board", why: "machine-readable claim/route/bucket identifiers on board rows (R5)" }),
  R("dataset-ui-state",
    { pattern: /dataset\.(tip|theme|skin|paramKey|rowId|jumpTo|lowEvidenceState|faExplain|explainReady|explainStranded|explain|wired)\s*=/ },
    { exempt: "UI-state data attributes (tooltip keys, theme/skin toggles, and the b9 M6 navigation/state hooks: the per-parameter jump target, the exec-row id, the low-evidence affordance state and the explain-trigger payload key) — routing and state only, no claim content and no value. b9 UX-B adds three of the same kind: `explain` is the payload id a generic trigger routes to, `explainReady` is the flag telling CSS that JS enhancement succeeded (the coarse-pointer disclosure rule must never fire without it), and `explainStranded` marks a dialog that could not restore its relocated source. None carries user-visible text." }),
  /* ---- owner annotations n12b450 / n45cb3d / ndadaca / nd4f4c7 (2026-08-17) ---- */
  R("chart-jump-affordance",
    { fnIn: ["makeHwMarkNavigable"], pattern: /./ },
    { class: "hardware-lens-tile", why: "the chart bar's click-to-controls affordance re-labels the mark, and that accessible name CARRIES the mark's computed margin and cost — the same claim channel as chart-helper-values above, reached through a second call on the same node. Classified claim-bearing rather than exempted as chrome, because the accessible name is where a screen-reader user reads the number." }),
  R("dataset-navigation-targets",
    { pattern: /dataset\.(hwJump|hwKey|hwKind|tickValue|rangeWhich)\s*=/ },
    { exempt: "navigation and control identity written so a querySelector can find a row: which accelerator a bar jumps to, which tick opens the spec-decode gate, which of the three range handles a dot is. Keys and declared control-domain constants echoed back from the engine's own HW/SECTIONS records — never rendered as prose, never a computed output. Same kind as the paramKey/jumpTo hooks above." }),
  R("fa-higher-load-ops",
    { fnIn: ["faHigherLoadOps"], pattern: /./ },
    { class: "evidence-board", why: "the load-into-calculator ops under each higher-justification entry name a page-authored route and the band it was authored for — the same object the evidence-board rule already covers on the route cards. Claim-bearing deliberately: the stated-position-vs-our-inference distinction the owner asked for (annotation nd4f4c7) is carried in exactly this text, so it belongs inside the registry rather than beside it." }),
  R("chart-aria-labels",
    { pattern: /"aria-label": "(Margin|Cost|Subscription)/ },
    { class: "hardware-lens-tile", why: "chart svg accessibility titles — they name the chart claim surfaces (R4)" }),
  R("chart-tooltip-values",
    { pattern: /ttRows\(|showTip\(|attachMarkTip\(|tt-key|l\.append\(label\)|v\.textContent = value|tipEl\.append\(html\)/ },
    { class: "hardware-lens-tile", why: "chart hover tooltips carry LIVE computed margin/cost values + the R2 per-accelerator policy band" }),
  R("chart-helper-values",
    { fnIn: ["attachMarkTip", "appendChartTable"], pattern: /./ },
    { class: "hardware-lens-tile", why: "chart accessibility names and tabular adapters carry the same live computed claims as the visual marks" }),
  R("chart-surfaces",
    { pattern: /\$\("chart-(hw|stack|sens|gen|sub)(-sub)?"\)|\$\("sub-controls"\)|sub\.textContent = "(at current settings|all settings fixed|What heavy users)/ },
    { class: "hardware-lens-tile", why: "chart containers + chart subtitles carrying computed values/claim context" }),
  /* a-im-legibility 2026-08-16 (owner ruling q-im-fp4-gb300-batch-disclosure): the per-generation
     chart now prints the DECLARED OPERATING POINT under it — the assumption that sets a bar's
     height. CLAIM-BEARING by the same logic as the tooltip values beside it: the sensitivity band
     and the throughput exposure across it are engine-computed (formCorrectionDebt), never authored
     in the renderer, and they qualify a rendered cost. */
  R("chart-operating-point-disclosure",
    { pattern: /chart-gen-op-note|renderGenChartOpNote|READ THE BAR HEIGHTS WITH THIS/ },
    { class: "hardware-lens-tile", why: "the declared-batch disclosure under the per-generation chart — engine-computed exposure qualifying a rendered cost claim" }),
  /* d-im-h800 2026-08-18 (owner note aca09d): the H800/H100 differential — the NVLink-cap lever's
     computed readout beside its control, the disclosure under the per-accelerator chart, and the
     per-leg lineage/disposition lines. CLAIM-BEARING by the same logic as the operating-point
     disclosure above: the fabric-term share, the no-overlap bracket and the at-probe margins are
     engine-computed (nvlinkCapReadout), never authored in the renderer, and they qualify rendered
     margins; the per-leg lines carry the typed lineage codes through the ONE engine formatter. */
  R("chart-nvlink-cap-disclosure",
    { fnIn: ["renderHwChartNvlinkNote", "nvlinkCapReadoutText", "refreshNvlinkCapSurfaces"], pattern: /./ },
    { class: "hardware-lens-tile", why: "the disclosure under the per-accelerator chart (lead + computed body) — anchored by enclosing renderer, like the chart-table-cells rule" }),
  R("nvlink-cap-lever-lines",
    { pattern: /nvlinkcap-readout|hw-nvlinkcap|cf-leg-nvlinkcap|nvlinkCapReadoutText\(/ },
    { class: "hardware-lens-tile", why: "the NVLink-cap lever's readout, chart disclosure and per-leg lineage lines — engine-computed exposure and typed codes qualifying rendered margins" }),
  R("chart-table-cells",
    { fnIn: ["renderHwChart", "renderStackChart", "renderGenChart", "renderSubChart", "renderSensChart", "renderNormalized"], pattern: /td\.textContent = c|mkRow\(/ },
    { class: "hardware-lens-tile", why: "table view of the chart claims (same numbers, tabular adapter) — anchored by enclosing chart renderer, not line ranges" }),
  R("normalized-table",
    { fnIn: ["renderNormalized"], pattern: /./ },
    { class: "hardware-lens-tile", why: "normalized comparison table, including its accessible name and cells, carries computed scenario claims" }),
  R("board-current-scenario-chip",
    { pattern: /boardStateLabel/ },
    { class: "hardware-lens-tile", why: "evidence-board chip carrying the current scenario's ≈% claim" }),
  R("identity-strip",
    { pattern: /id-chip|id-reset/ },
    { class: "identity-strip", why: "scenario-identity strip — identity IS claim-bearing (R2: central state + epistemic chip gate on placement-verified eligibility)" }),

  /* ---- MCP + Worker ---- */
  R("mcp-boundary-emit",
    { pattern: /CONTRACTS\.emit\(/ },
    { class: "mcp-text", why: "the closed-boundary emission call sites (envelope(): mcp-text + mcp-json artifacts) — the R2 production emission door" }),
  R("mcp-content-text",
    { filePattern: /^mcp-server\/(src|worker\/overrides)\/.*\.ts$/, pattern: /\bcontent\s*[:=](?!=)/ },
    { class: "mcp-text", why: "MCP content-text builders (envelope/failClosed + the server's fail-closed catch) — lead-sentence weld surfaces" }),
  R("mcp-structured",
    { filePattern: /^mcp-server\/(src|worker\/overrides)\/.*\.ts$/, pattern: /\bstructuredContent\s*[:=](?!=)/ },
    { class: "mcp-json", why: "MCP structured payload builders" }),
  R("mcp-types-no-sink",
    { filePattern: /^mcp-server\/src\/(claims-types|engine-types)\.d?\.ts$/ },
    { exempt: "type declarations — no runtime emission" }),
  /* T5 round 4: the release GATE is tooling, not a report emitter. It must sit BEFORE
     worker-report-overrides, which would otherwise sweep it into `report-dossier` and count a
     build tool's digest/status lines as claim-bearing report content. What it prints is a
     sha256, a pass/fail line and a live tool list — no registry quantity, no engine output. */
  R("worker-release-gate",
    { fileIs: "mcp-server/worker/scripts/release-gate.mjs" },
    { exempt: "release-artifact gate — prints the rebuilt bundle digest, the approved pin, and the post-deploy readback verdict. Build/release tooling; emits no claim value and renders nothing a reader consumes" }),
  R("worker-report-overrides",
    { filePattern: /^mcp-server\/worker\/(overrides|src|scripts)\// },
    { class: "report-dossier", why: "Worker-native modules (report catalog/serving, entrypoint, build script) — report emitters; whole-surface coverage, parity-gated against src by build.mjs" }),
  R("mcp-server-logs",
    { filePattern: /^mcp-server\/src\//, pattern: /console\.(log|error)\(/ },
    { exempt: "transport startup/diagnostic logs — engine stamp + listen address; no claim values (request contents are never logged)" }),

  /* ---- typed exemptions (explicit reasons; re-adjudicated THIS migration) ---- */
  R("container-reset",
    { pattern: /\.textContent = "";?\s*(\}|$)|\.textContent = ""; *[a-zA-Z]/ },
    { exempt: "container reset — emits nothing" }),
  R("dossier-panel",
    { fnIn: ["renderPerspDossier", "renderModelDossier", "dossierBlock", "setModelContextPanel", "renderDossier"], pattern: /./ },
    { class: "report-dossier", why: "site dossier panels: sourced quotes + page-authored synthesis + live parameter values — claim-bearing (function-anchored, replacing the harness line-range rule)" }),
  R("tooltip-chrome",
    { pattern: /tt-title|tt-src|bo\.textContent = t\.b|tipEl\.hidden|\w+\.title = (tk\.l|"Enter|tr\.locked|stale)/ },
    { exempt: "tooltip chrome — supplementary source notes + registry spec values (inputs, not computed claims)" }),
  R("control-option-button-label",
    { pattern: /createElement\("(option|button|th|h4|a|li|span)"\)|o\.textContent =|b\.textContent =|btn\.textContent =|opt\b.*textContent|chip\.textContent = txt|sp\.textContent = tk\.l|aria-label", "Explanation"/ },
    { exempt: "control/label chrome (options, buttons, headers, links) — user-input affordances, no computed claim values" }),
  R("control-accessible-labels",
    { fnIn: ["buildParam", "buildBlend", "infoBtn", "wireExplainTriggers"], pattern: /setAttribute\("aria-(label|haspopup)"/ },
    { exempt: "accessible names for scenario controls — labels describe user inputs and carry no computed result. b9 UX-A adds `infoBtn`: its name is composed from the TIPS registry TITLE and its aria-haspopup declares the dialog affordance; neither is a computed value. The tooltip BODY is separately handled by `tooltip-chrome`. b9 UX-B adds `wireExplainTriggers` on the same footing: N triggers all reading \"Deeper explanation\" are indistinguishable in an assistive-technology control list, so each name is composed from the constant label plus its payload's OWN EXISTING TITLE — a section <h3>, a provider name, or a fixed string. No value is computed or read. Deliberately NOT extended to explainRelocate(), which creates no discovered sink at all (appendChild/insertBefore/createComment are not channels) and therefore needs no rule: exempting it would be a hole with nothing in it." }),
  /* b9 spec-decode LEVER (D-SD-7). The gate's own disclosure sites inside the control row: the
     why-line (why the credit is unavailable here), the reset announcement (a value THIS user set and
     the gate zeroed), the correction notice (a value a LINK or SAVED SCENARIO carried and the
     sanitizer overrode), and the row's group/labelledby/describedby wiring. Each states the
     AVAILABILITY of a control or echoes a user's own setting back to them — none carries a computed
     result. The strings are ratified pinned bytes and are byte-asserted by
     tests/spec-decode-lever-b9.test.mjs, which is a stronger guard than this gate provides.

     DELIBERATE SCOPE NOTE: the per-leg disclosure strings are NOT covered by this rule. They carry
     `factorApplied` — a computed value on a rendered leg — so when they land on the fleet surfaces
     they need a CLAIM-BEARING classification of their own, not this exemption. */
  R("specdec-gate-disclosure",
    { fnIn: ["buildParam"], pattern: /specdec-(label|why|reset|correction)|SPECDEC_RESET_LINE|specDecCorrectionNotice|setAttribute\("aria-(labelledby|describedby)"|setAttribute\("role", "group"\)/ },
    { exempt: "b9 spec-decode LEVER: the D-SD-7 gate's control-row disclosure — why-line, reset announcement, correction notice and the gated row's accessible wiring. Availability statements and echoes of the user's own setting; no computed result. The bytes are ratified and separately byte-pinned by the lever suite" }),
  R("input-readouts",
    { pattern: /val\.textContent|pct\.textContent|hw-pct|controlsEl\.textContent|ms\.textContent|ps\.textContent|ts\.textContent/ },
    { exempt: "input-control readouts (sliders, user-set fleet weights, selector rebuilds) — echo user inputs, not computed claims" }),
  /* row 499 (owner ruling ccb4a1): the shared-link banner. Deliberately its OWN rule rather than
     folded into scenario-status-notes, because it is a different kind of statement: it makes a
     PROVENANCE claim about whose assumptions the reader is looking at. It is exempt from the
     claim-VALUE registry for the same reason the deprecation notice is — it emits no computed
     quantity; the one variable part is `identitySummary()`, which is itself a discovered sink and
     is classified where it is built. If this banner ever starts quoting a margin, this rule must be
     revisited rather than widened. */
  /* row 499 (completeness doctrine): the per-accelerator procurement panel. Classified with the
     input-readout family rather than a claim class, and the reasoning is stated because it is a
     judgement call: the only arithmetic it renders is `registered rate × the reader's own dial`,
     i.e. an echo of a user input applied to a published registry value that the hardware tile
     already discloses. It emits NO margin, cost-per-token or throughput quantity. If this panel
     ever renders a modeled cost or a margin, it becomes claim-bearing and must move — that is a
     rule for the next author, not a licence. */
  R("point-mode-controls",
    { fnIn: ["pointModeControl", "rangeHandles", "rangeHandlesFor"] },
    { exempt: "1/2/3-point mode toggle and its per-dial bound handles — control chrome plus readouts echoing the reader's own declared bounds; no computed quantity is rendered here" }),
  R("rent-discount-panel",
    { fnIn: ["buildRentDiscounts"] },
    { exempt: "per-accelerator procurement discount controls — slider readouts echoing the reader's own multiplier against the registered rent row; no modeled cost or margin is rendered here" }),
  /* im-vet-0919 (Astra pack B P0-1): the REJECTED-link notice. Its own rule rather than folded
     into traffic-and-modified-notes, on the same reasoning row 499 gave the provenance banner:
     it makes a PROVENANCE statement — that the link the reader followed was not applied and the
     number below is this page's own — and it renders no computed quantity at all. The one
     variable part is the reason string, which is either a character count or a fixed phrase
     chosen in this function. If it ever starts quoting a margin, this rule must be revisited
     rather than widened. */
  /* im-vet-0919 round 2 (Polaris ruling on Astra pack B P0-4): the saved-record identity notice.
     Grouped with the other provenance statements rather than with the status notes, on the same
     reasoning: it says WHICH PARTS of the scenario on screen came from the save and which came
     from the page's current selection. It renders no computed quantity — the numbers it is about
     are emitted and classified at their own surfaces. If it ever quotes a margin, this rule must
     be revisited rather than widened. */
  R("saved-record-identity-notice",
    { fnIn: ["loadSavedPreset"], pattern: /was stored before this page recorded|Saved before v3\.x/ },
    { exempt: "saved-record identity notice — names what a pre-v3.x record did not record (model, fleet) so the reader is never told a reconstructed part of the state is theirs; carries no computed claim value" }),
  R("rejected-shared-link-notice",
    { fnIn: ["showRejectedLinkNotice"] },
    { exempt: "rejected shared-link notice — states that the link could not be read and that the figure on screen is the page's own opening scenario; emits no computed claim value" }),
  R("shared-link-provenance-banner",
    { fnIn: ["showSharedLinkBanner", "hideSharedLinkBanner"] },
    { exempt: "shared-link provenance banner — states WHOSE parameters are on screen and offers the page's own default; carries no computed claim value (the identity summary it interpolates is classified at its own site)" }),
  R("scenario-status-notes",
    { pattern: /preset-note|save-note|setSaveNote|epoch-deprecation|lockNote|lockOpt|sumNote|sum\.textContent|meta\.textContent|row\.textContent|list\.textContent|Skin:|"Table view"|Scenario (link copied|URL set)/ },
    { exempt: "scenario lifecycle status text (save/load/rename/deprecation/lock notes, section titles) — identity-ADJACENT strings, re-adjudicated this migration: none carries a computed claim value" }),
  R("static-presentation-state",
    { pattern: /\.className\s*=|classList\.(add|remove|toggle)\(|\.style\.\w+\s*=|\.cssText\s*=/ },
    { exempt: "static presentation classes/styles — placed AFTER every claim rule so computed-state sites route to claim rules first" }),
  R("theme-skin-toggle-labels",
    { fnIn: ["refreshSkinToggle", "refreshThemeToggle"], pattern: /\.title =/ },
    { exempt: "theme/skin toggle accessible descriptions — presentation-only and explicitly state that numbers do not change" }),
  /* b9 UX-A (memo §16.4): the explanation-dialog SHELL only. Deliberately NOT an fnIn-only
     exemption — a bare `fnIn` would exempt any future sink added to these functions, including a
     computed textContent write. Every allowed line is listed WHOLE, one statement per source line,
     so nothing can piggyback on an allowed fragment. `showTip` is NOT here and must never be: it is
     already claim-bearing through the chart tooltips (`chart-tooltip-values` -> hardware-lens-tile).
     `openFaExplain` keeps its `final-answer` classification; `openExplain` needs no exemption
     because it only calls tipContent() and appends. Payload content is classified at its own
     builder or at its original emission sink, never here. */
  R("explanation-dialog-shell-chrome",
    { fnIn: ["explainShell", "closeActiveExplain"],
      pattern: /^(?:dlg\.dataset\.explainDialog = "1";|const h = mkEl\("h2", "fa-explain-title", spec\.title\);|x\.setAttribute\("aria-label", "Close"\); x\.textContent = "\\u2715";|dlg\.setAttribute\("aria-labelledby", h\.id\);|document\.body\.style\.overflow = EXPLAIN\.bodyOverflow \|\| "";)$/ },
    { exempt: "b9 UX-A: static explanation-dialog shell chrome and the scroll-lock restoration — the dialog frame (marker, title element, close affordance, accessible-name wiring) and body-overflow bookkeeping. It computes nothing and re-renders nothing; every figure the dialog shows was emitted and classified by its own source surface" }),
  R("element-composition-appends",
    { pattern: /\.append\(/ },
    { exempt: "element-composition appends — children carry their own separately discovered sinks; string-content appends in claim regions are caught by the earlier claim rules" }),
  R("traffic-and-modified-notes",
    { pattern: /Effective traffic mix|banner\.textContent|note\.textContent|body\.textContent|box\.textContent|nat\.textContent|o\.textContent = "\[modified|t\.textContent = str|e\.textContent = text|el\.textContent = what|grid\.textContent|chips\.textContent|det\.textContent/ },
    { exempt: "traffic-mix labels, modified-scenario banners, dossier-body resets — status/derivation notes, no computed claim values" }),
]);

export function classifySites(sites) {
  const classified = [];
  const unmatched = [];
  for (const site of sites) {
    const rule = SINK_RULES.find((r) => {
      if (r.fileIs && site.file !== r.fileIs) return false;
      if (r.filePattern && !r.filePattern.test(site.file)) return false;
      if (r.fnIn && !r.fnIn.includes(site.fn)) return false;
      if (r.pattern && !r.pattern.test(site.snippet)) return false;
      if (!r.pattern && !r.fileIs && !r.filePattern && !r.fnIn) return false;
      return true;
    });
    if (rule) classified.push({ ...site, rule: rule.name, disposition: rule.disposition });
    else unmatched.push(site);
  }
  return { classified, unmatched };
}

export function claimBearingClasses(classified) {
  return [...new Set(classified.filter((s) => s.disposition.class).map((s) => s.disposition.class))].sort();
}

/* Canonical registry form + digest (minted LAST — §4.5/amend loop). */
export function buildRegistry(root) {
  const { files, sites } = discoverSinks(root);
  const withIds = stableSinkIds(sites);
  const { classified, unmatched } = classifySites(withIds);
  const claimSinks = classified.filter((s) => s.disposition.class)
    .map((s) => ({ id: s.id, file: s.file, kind: s.kind, hash16: s.hash16, occ: s.occ, class: s.disposition.class, rule: s.rule }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    files, unmatched,
    classifiedCount: classified.length,
    claimSinks,
    classes: claimBearingClasses(classified),
    digest: sha16(JSON.stringify({ files, claimSinks: claimSinks.map((s) => s.id) })),
  };
}
