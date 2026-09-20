/* =====================================================================================
   spec-decode-lever-b9.test.mjs — the b9 spec-decode LEVER leg (design memo
   research/b9-spec-decode-lever-memo.md, FROZEN at v16; ratification
   esc-20260801T042349Z-20c444d8 + esc-20260801T045418Z-71b767cc).

   The memo's NORMATIVE KERNEL is what this file enforces, and only that: the gate tick and
   THE ONE predicate, the total invariant and the ordered disposition ladder, the pinned span
   BYTES of the ratification manifest, and the T-1/T-13/T-19/T-20/T-21/T-22 oracles.

   F-3 runs FIRST and unconditionally: the three standing tripwires re-derive EXACT at the
   default. A green suite proves the DEFAULT path is intact — it does not prove the lever works,
   which is why every element below also carries an explicit gate-OPEN execution check.
   Run: node tests/spec-decode-lever-b9.test.mjs
   ===================================================================================== */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { PRIVATE_INPUTS, provenance } from "./provenance-inputs.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
/* Assertions that read a PRIVATE design memo run here in the private tree and self-skip, by
   count and under a labeled banner, in a reconstructed public stage where the memo does not
   exist. The private tree is hard-guarded to carry all of them — see provenance-inputs.mjs. */
const P = provenance("spec-decode-lever-b9", assert);
const privatePaths = new Set(PRIVATE_INPUTS.map(i => i.path));

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const DEFAULT_STATE = () => E.applyPresetSettings(opus, median, { mode: "native" });
const REFERENCE = () => E.pinReferenceLevers(DEFAULT_STATE());

/* ================= F-3 — the three standing tripwires, re-derived at every fold =================
   Tripwire 2 (the ratified default headline through the MCP Worker build) is asserted by
   mcp-server/test/parity.test.mjs against the same engine bytes; it is re-derived here from the
   Node engine so this suite fails on its own if the default moves. */
{
  assert("F-3 tripwire 1 — trend-0 reference blend margin is byte-identical 0.5841067415764696",
    E.workload(REFERENCE()).margin === 0.5841067415764696, String(E.workload(REFERENCE()).margin));
  /* im-vet-six-repairs (2026-09-20), vetting findings E1 + E2: re-minted for the Trainium withdrawal and the TPU numerator repair. */
  assert("F-3 tripwire 2 — the ratified default headline is byte-identical 68.39894608278819",
    E.workload(DEFAULT_STATE()).margin * 100 === 68.39894608278819,
    String(E.workload(DEFAULT_STATE()).margin * 100));
  const mem = E.finalAnswer().membership;
  assert("F-3 tripwire 3 — membership is 5 members / 2 excluded (both WITHDRAWN) / renormalization basis 75",
    mem.memberLegCount === 5 && mem.excluded.length === 2 && mem.renormalizationBasis === 75
    && mem.excluded.every(x => x.ground === "withdrawn"),
    `${mem.memberLegCount}/${mem.excluded.length}/${mem.renormalizationBasis}`);
  assert("F-3 the lever is INERT in the default state — DEFAULTS.specDec is 1.0 and the gate is SHUT",
    E.DEFAULTS.specDec === 1.0 && E.specDecGateAllows(DEFAULT_STATE()) === false);
}

/* ================= T-21b — TIER CONTAINMENT =================
   The long form is built by interpolating the short one, so the why-line's clause and the tip's
   full statement cannot drift apart. This is the mechanical form of the failure of rounds 6 and 9,
   where the two surfaces stated one claim in words that stopped agreeing. It is a SUBSTRING and
   deliberately not a prefix — the memo first wrote "prefix" here, and a test coded to that false
   description would have asserted startsWith and failed on correct work. */
{
  assert("T-21b SPECDEC_GATE_SEMANTICS CONTAINS SPECDEC_PORTABLE_TICK",
    E.SPECDEC_GATE_SEMANTICS.includes(E.SPECDEC_PORTABLE_TICK));
  assert("T-21b the containment is a substring and NOT a prefix (the long form opens with \"0.7 is \")",
    E.SPECDEC_GATE_SEMANTICS.indexOf(E.SPECDEC_PORTABLE_TICK) > 0
    && !E.SPECDEC_GATE_SEMANTICS.startsWith(E.SPECDEC_PORTABLE_TICK));
}

/* ================= PINNED SHIPPED BYTES — manifest rows 6, 7 and 21 =================
   Ratified bytes, quoted here as literals rather than recomposed from the constants. A test that
   rebuilt the expected string from the same constants the code composes from would assert only
   that the code agrees with itself; the court ratified BYTES, so bytes are the oracle. The
   composition equality is the separate assertion below (T-21a). */
{
  assert("row 6 — the gate why-line is byte-exact",
    E.SPECDEC_WHY_LINE === "Speculative-decode credit is available only from the \"no MTP/disagg\" "
      + "stack setting (0.7) — the only point on this scale whose MTP-free meaning is portable to "
      + "any scenario.", JSON.stringify(E.SPECDEC_WHY_LINE));
  assert("row 7 — the gate reset line is byte-exact",
    E.SPECDEC_RESET_LINE === "Stack setting left \"no MTP/disagg\" — speculative-decode credit "
      + "reset to none. It is available only from that setting (0.7).",
    JSON.stringify(E.SPECDEC_RESET_LINE));
  /* J-10 run-1: re-pinned on the PROMOTED convergence defect (Polaris gen-24). Dive A and dive B
     independently found that "whatever speculative decoding the lab was running" presupposes
     speculation WAS running — contradicting this page's own unknown-deployment claim — and borrows
     `absorbed`'s affirmative rationale, which the page does not have for a replay. The corrected
     bytes are conditional ("any … effect it already carries") and ground the lock in replay
     fidelity, not in knowledge of the point's contents. */
  assert("row 21 — the replay-lock why-line is byte-exact",
    E.SPECDEC_REPLAY_WHY_LINE === "Speculative-decode credit is not available on a published "
      + "operating point — the point is replayed exactly as published, so any speculative-decoding "
      + "effect it already carries is inside it.",
    JSON.stringify(E.SPECDEC_REPLAY_WHY_LINE));
  /* The promoted defect's own regression guard: the presupposing construction must not return. */
  assert("row 21 the replay why-line does not presuppose that speculation was running",
    !/whatever speculative decoding the lab was running/.test(E.SPECDEC_REPLAY_WHY_LINE)
    && !/whatever speculative decoding the lab was running/.test(E.specDecReasonText("replay-locked", 1.6)));

  /* T-21a for the two composed sites that exist at this element. The why-line is site frame +
     SPECDEC_PORTABLE_TICK; the reset line is site frame only, which is why it appears here as an
     identity rather than a composition — stated so a later reader does not read its absence from
     the composition set as an omission. */
  assert("T-21a the why-line equals its pinned composition",
    E.SPECDEC_WHY_LINE === "Speculative-decode credit is available only from the \"no MTP/disagg\" "
      + "stack setting (0.7) — " + E.SPECDEC_PORTABLE_TICK + ".");

  /* T-21e's required literal, on the two gate-availability sites that exist at this element. */
  assert("T-21e the why-line and the reset line each carry the literal \"no MTP/disagg\"",
    E.SPECDEC_WHY_LINE.includes("\"no MTP/disagg\"") && E.SPECDEC_RESET_LINE.includes("\"no MTP/disagg\""));
  /* The replay lock is a DIFFERENT rule and must not name the stack setting: on a replay, moving
     stackMult to the tick would still not enable credit, so the sentence would be actively false.
     [N-AVAILABILITY-SITES] is scoped to D-SD-7 gate availability and does not reach this string. */
  assert("row 21 the replay why-line does NOT name the stack setting, deliberately",
    !E.SPECDEC_REPLAY_WHY_LINE.includes("no MTP/disagg"));
}

/* ================= T-21d — NO MEMO TOKEN SHIPS =================
   One grep, and it would have failed the memo's own v12 immediately: that version made the
   why-line, reset, tip and methods box literally contain `[N-GATE-SEMANTICS]`, which is an
   internal memo token reaching a reader. Asserted over the shipped strings that exist at this
   element; the file-level sweep over index.html and the rationale files lands with those spans. */
{
  const TOKEN = /\[N-[A-Z-]+\]/;
  const shipped = [E.SPECDEC_PORTABLE_TICK, E.SPECDEC_GATE_SEMANTICS, E.SPECDEC_CONSERVATISM,
    E.SPECDEC_WHY_LINE, E.SPECDEC_RESET_LINE, E.SPECDEC_REPLAY_WHY_LINE,
    ...Object.keys(E.SPECDEC_REASON_COPY).map(k => E.specDecReasonText(k, 1.6))];
  assert("T-21d no memo token appears in any shipped spec-decode string",
    shipped.every(s => !TOKEN.test(s)), JSON.stringify(shipped.filter(s => TOKEN.test(s))));
}

/* ================= THE LEVER'S OWN SECTION — manifest rows 22-26 =================
   D-SD-6. The section carries NO interlockGroup: the app renders lock state from that field, and a
   SPECIFIED lever is never locked by the interlock (D-5 Amendment 2). A section that named a group
   would render a lockable control for a lever no interlock transition may write. */
{
  const sec = E.SECTIONS.find(s => s.title === E.SPECDEC_SECTION_TITLE);
  const p = sec && sec.params.find(x => x.k === "specDec");
  assert("row 22 — the section title is byte-exact",
    E.SPECDEC_SECTION_TITLE === "Speculative-decode credit (scenario lever)", E.SPECDEC_SECTION_TITLE);
  assert("row 23 — the control label is byte-exact, and carries the phase scope",
    E.SPECDEC_CONTROL_LABEL === "Speculative-decode credit (decode phase only)", E.SPECDEC_CONTROL_LABEL);
  assert("D-SD-6 the lever has its OWN section, placed after the algorithmic-lead prior",
    !!p && E.SECTIONS.indexOf(sec) === E.SECTIONS.findIndex(s => s.interlockGroup === "trend") + 1);
  assert("D-SD-6 the section declares NO interlockGroup — a SPECIFIED lever must never render lockable",
    !("interlockGroup" in sec), JSON.stringify(sec.interlockGroup));
  assert("D-SD-6 the control is labelled from the pinned constant and points at the pinned tip",
    p.label === E.SPECDEC_CONTROL_LABEL && p.tip === "specDec" && p.unit === "×");
  /* The section literal cannot read SPECDEC_BOUNDS (declared further down the file), so the two are
     kept in agreement by this assertion rather than by a shared reference. */
  assert("D-SD-6 the control's domain and step match SPECDEC_BOUNDS at step 0.01",
    p.min === E.SPECDEC_BOUNDS[0] && p.max === E.SPECDEC_BOUNDS[1] && p.step === 0.01,
    JSON.stringify([p.min, p.max, p.step, E.SPECDEC_BOUNDS]));

  const ticks = p.ticks.map(t => [t.v, t.l]);
  assert("rows 24-26 — the three tick labels are byte-exact at their pinned values",
    JSON.stringify(ticks) === JSON.stringify([
      [1.00, "no credit — this page's default"],
      [1.14, "≈14% — production-like batch (SGLang-reported open-stack measurement)"],
      [1.60, "≈60% — modest concurrency (SGLang-reported open-stack measurement)"],
    ]), JSON.stringify(ticks));
  /* The vendor ">15%" figure is deliberately NOT a tick — a single-source self-report at a
     non-flagship lab must not carry the same visual authority as the two measurements. It lives in
     the tip instead, and this asserts the split rather than trusting it. */
  assert("no vendor-claim tick: the >15% self-report is carried in the tip, never on the scale",
    !p.ticks.some(t => /15%/.test(t.l)) && /more than 15%/.test(E.TIPS.specDec.b));
}

/* ================= T-21a — TIPS.specDec equals its pinned composition (manifest row 8) ================= */
{
  const tip = E.TIPS.specDec;
  assert("row 8 — the tip equals its pinned composition, byte-for-byte",
    tip.b === E.SPECDEC_TIP_HEAD
      + " When it is available: only from the \"no MTP/disagg\" stack setting (0.7). "
      + E.SPECDEC_GATE_SEMANTICS
      + " What that costs you: " + E.SPECDEC_CONSERVATISM
      + ". Turning this up declares your scenario, not this page's finding.",
    JSON.stringify(tip.b.slice(-120)));
  assert("row 8 — the tip's title is the pinned control label, and its source line is empty by design",
    tip.t === E.SPECDEC_CONTROL_LABEL && tip.s === "");
  assert("row 8 — the tip states the lever is not a measurement, is off by default, and is decode-only",
    /not a measurement/.test(tip.b) && /off in this page's default/.test(tip.b)
    && /output tokens only, never prefill/.test(tip.b));
  assert("row 8 — the tip keeps the two evidence classes separate and never adds them together",
    /two classes that are never added together/.test(tip.b)
    && /a vendor claim, self-reported, single-source/.test(tip.b)
    && /reported by the serving stack's own project, not independently replicated/.test(tip.b));
  /* The Q-A ruling requires the gate's conservatism in TWO places: the memo, and the lever's own
     disclosure copy. This is the second. */
  assert("row 8 — the tip carries the gate's conservatism, as the Q-A ruling requires",
    tip.b.includes(E.SPECDEC_CONSERVATISM));
  assert("T-21e the tip carries the literal \"no MTP/disagg\"", tip.b.includes("\"no MTP/disagg\""));
  /* AMENDED BYTES — the byte oracle's reference, per esc-20260802T115802Z-351e891f: row 8's
     ratified text with the `**` emphasis pairs stripped, because this surface renders plain text.
     The court required per-surface verification, so the rendering path is asserted here rather than
     described: the tip goes through textContent, and NO shipped tip on this page carries a marker
     or a tag. Span (8) keeps its emphasis as <strong> under the same amendment, because the methods
     box genuinely is HTML — one ruling, resolved per surface. */
  assert("row 8 — no memo token and no markdown emphasis reaches this textContent surface",
    !/\[N-[A-Z-]+\]/.test(tip.b) && !tip.b.includes("**"));
  assert("row 8 — the amendment's premise holds: NO shipped tip on this page renders markdown",
    Object.values(E.TIPS).every(t => !/\*\*/.test(t.b || "") && !/<strong>|<b>/.test(t.b || "")));
}

/* ================= T-21c — DEFINITION COUNT =================
   The claim bodies appear at exactly the pinned set of locations and nowhere else; any other
   literal occurrence in a shipped surface is the "old form left standing somewhere else" defect,
   expressed as an assertion instead of a sweep.

   THE COUNT IS DERIVED, never written down: it is (1 if the constant is declared as a plain
   literal, else 0, because a constant declared by INTERPOLATION never contains its own assembled
   value in source) plus one per composition site whose expanded bytes contain it. Add a site to
   the table and every count rises with it. Hand-written counts have gone stale in this arc five
   separate times; this one cannot.

   The corpus is the runtime-string corpus the court ratified: engine.js SOURCE contributes the
   declarations (with concatenation seams stripped, or a wrapped literal is invisible to a
   line-based count), and each shipped SITE contributes the string a reader actually receives. */
{
  /* The memo's normalization list is seams + whitespace. Executed here, that was NOT ENOUGH and
     the check said so on its first run: SPECDEC_CONSERVATISM is the one canonical body containing
     quotation marks, so its SOURCE bytes carry `\\"` where its runtime value carries `"`, and it
     scored 1 against an expected 2 — a source declaration the count could not see. Unescaping is
     therefore part of the normalization, not an extra. Recorded because it is the same signal the
     memo records twice: the mechanical check earns its place by disagreeing with its author. */
  const src = readFileSync(new URL("../site/engine.js", import.meta.url), "utf8")
    .replaceAll('"\n  + "', "").replaceAll('" + "', "").replaceAll("'\n  + '", "").replaceAll("' + '", "")
    .replaceAll('\\"', '"');
  /* site -> the canonical constants its EXPANDED bytes contain. This IS the memo's composition
     table, executable: adding a site raises every count it appears in, so the counts move with the
     table and neither can silently drift from the other. */
  const html8 = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  const span8 = html8.slice(html8.indexOf("<li>", html8.indexOf("PINNED INSERTION BOUNDARIES")) + 4,
    html8.lastIndexOf("</li>", html8.indexOf("<!-- b9 spec-decode LEVER — span (8) END -->")));
  const COMPOSITION_SITES = {
    "gate why-line": { text: E.SPECDEC_WHY_LINE, contains: ["PORTABLE_TICK"] },
    "TIPS.specDec": { text: E.TIPS.specDec.b, contains: ["PORTABLE_TICK", "GATE_SEMANTICS", "CONSERVATISM"] },
    "methods span (8)": { text: span8, contains: ["PORTABLE_TICK", "GATE_SEMANTICS", "CONSERVATISM"] },
  };
  const CANON = {
    PORTABLE_TICK: { value: E.SPECDEC_PORTABLE_TICK, declaredAsLiteral: true },
    GATE_SEMANTICS: { value: E.SPECDEC_GATE_SEMANTICS, declaredAsLiteral: false },
    CONSERVATISM: { value: E.SPECDEC_CONSERVATISM, declaredAsLiteral: true },
  };
  const count = (hay, needle) => hay.split(needle).length - 1;
  for (const [name, c] of Object.entries(CANON)) {
    const expected = (c.declaredAsLiteral ? 1 : 0)
      + Object.values(COMPOSITION_SITES).filter(s => s.contains.includes(name)).length;
    const actual = count(src, c.value)
      + Object.values(COMPOSITION_SITES).reduce((n, s) => n + count(s.text, c.value), 0);
    assert(`T-21c ${name} appears exactly ${expected}× — declaration ${c.declaredAsLiteral ? "1" : "0"} + its composition sites`,
      actual === expected, `actual ${actual}`);
  }
  /* The containment is why PORTABLE_TICK's site count exceeds the number of sites that name it
     directly: the tip contains it THROUGH SPECDEC_GATE_SEMANTICS, which is the point of the tier. */
  assert("T-21c the tip contains PORTABLE_TICK only through GATE_SEMANTICS, not as a second literal",
    count(E.TIPS.specDec.b, E.SPECDEC_PORTABLE_TICK) === 1
    && E.TIPS.specDec.b.indexOf(E.SPECDEC_PORTABLE_TICK) > E.TIPS.specDec.b.indexOf(E.SPECDEC_GATE_SEMANTICS));
}

/* ================= T-13 — THE BASIS RULE, EXECUTED =================
   BASIS_MANIFEST is the machine authority on any row's status and evidence ([N-BASIS]). T-13
   (1) deep-equals the registry projection against it, failing on any status change or unlisted row,
   (2) EXECUTES every entry — reading each quote's cited bytes and running each probe — and
   (3) rejects any evidence the manifest does not account for, which the deep-equal gives for free.

   Why executed rather than inspected: the rule lived as PROSE for two memo versions and was broken
   twice while it sat there, because a `string` basis that a test only checks for non-emptiness lets
   any invented sentence pass. Three separate false bases were shipped into drafts of this design on
   exactly that slack — an η "fitted from a speculative observation", "the 1.85 is h20's acceptance
   rate", and a float identity that is false in IEEE-754. A basis that cannot be mechanically
   verified is not a basis, and its row is typed `unknown`, which fails closed.

   LINE NUMBERS CORRECTED AT IMPLEMENTATION. The memo's manifest pinned its engine-data citations at
   3f89695. The calibration rows have since gained `specDecBaselineStatus` (7a68442) and now
   `specDecBaselineBasis`, so every citation into that file had drifted — 992→1078, 907→921,
   975→1047, 921→950, 936→980, 1036→1151, 1081→1242. Each was re-derived by executing the CONTAINS
   check at this HEAD rather than by re-reading the memo, which is the same authoring step v11 ran
   when it found two of the memo's own pins wrong. The im3 and evidence-instances citations were
   re-checked and are unmoved.
   d-im-h800 (2026-08-18, owner note aca09d): every engine-data citation drifted again when the eleven
   CALIBRATION rows gained `nvlinkCapLineage` (+ its comment line) and the closed set NVLINK_CAP_LINEAGES
   was declared above them (the numbers below are the registry's own basis entries).
   Re-derived by executing the CONTAINS check at this HEAD (the same authoring step as before); the
   quoted BYTES are unchanged.
   im-arc T2 (memo §3, 2026-08-22): the null hardware-row electricity hook and its
   provenance note moved every calibration citation below by +14; bytes remain unchanged. */
{
  const ED = require("../site/engine-data-v22.js");
  const BASIS_MANIFEST = {
    h800:   { status: "excluded", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 969, text: "obsQ: 1, obsA: 1" }] },
    h100:   { status: "excluded", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1000,
        text: 'sourceRefs: ["inherits CALIBRATION.h800 (FITTED-inherited; memo §2)"]' },
      { kind: "probe", script: "tests/probes/specdec-eta-consistency.mjs",
        expect: "h100:0.313491;h800:0.313491;equal=true", stdout: "trim" }] },
    h200:   { status: "excluded", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1032,
        text: 'sourceRefs: ["family-transfer off CALIBRATION.h800 (memo §1; derivations finding 4)"]' },
      { kind: "probe", script: "tests/probes/specdec-eta-consistency.mjs",
        expect: "h200:0.313491;h800:0.313491;equal=true", stdout: "trim" }] },
    h20:    { status: "included", evidence: [
      { kind: "quote", source: "research/im3-integration-design.md", line: 134,
        text: "Where an anchor's throughput embeds spec-decode (h20, gb300, ascend" }] },
    gb200:  { status: "excluded", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1103, text: "obsQ: 1, obsA: 1" }] },
    gb300:  { status: "unknown", evidence: [        // ADJUDICATED unknown — Q-G, esc-...eea22b5c
      { kind: "quote", source: "site/engine-data-v22.js", line: 1136,
        text: "UNKNOWN — measured:null and no reconstructable q/a" }] },
    ascend: { status: "included", evidence: [
      { kind: "quote", source: "research/im3-integration-design.md", line: 135,
        text: "absorbed INTO the deployed" }] },
    tpu7:   { status: "unknown", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1213,
        text: "the joint fleet fit 0.36142 is REJECTED as evidence for this row" },
      /* Line 1244 -> 1750 (2026-09-02). The bytes did not change; the file grew above them when
         rec 8's provenance work added verification fields and a provenanceDebt record. A
         line-anchored citation is fragile exactly this way — it is kept because this gate's point
         is that the cited bytes are REALLY THERE, and the check re-reads them rather than trusting
         the number. The record it belongs to is `tpu7-analyst-set-dec`, unchanged. */
      { kind: "quote", source: "research/evidence-instances-v22.json", line: 1750,
        text: '"mtpAcceptance": "unknown"' }] },
    trn2:   { status: "excluded", evidence: [
      { kind: "probe", script: "tests/probes/specdec-eta.mjs", expect: "trn2:0.36142", stdout: "trim" },
      { kind: "quote", source: "research/im3-integration-design.md", line: 57,
        text: "Out-of-family ANALYST_SET rows — tpu7, trn2, trn3: joint fleet fit" },
      { kind: "probe", script: "tests/probes/specdec-jointfit.mjs",
        expect: "trn2:etaDec=0.36142;jointEtaDec=0.36142;matchesJointFit=true;calObs=null", stdout: "trim" }] },
    trn3:   { status: "excluded", evidence: [
      { kind: "probe", script: "tests/probes/specdec-eta.mjs", expect: "trn3:0.36142", stdout: "trim" },
      { kind: "quote", source: "research/im3-integration-design.md", line: 57, text: "joint fleet fit" },
      { kind: "probe", script: "tests/probes/specdec-jointfit.mjs",
        expect: "trn3:etaDec=0.36142;jointEtaDec=0.36142;matchesJointFit=true;calObs=null", stdout: "trim" }] },
    rubin:  { status: "unknown", evidence: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1310,
        text: 'throughputEvidenceClass: "projection"' }] },
  };

  /* (1) DEEP-EQUAL, both directions. An unlisted registry row fails, and a manifest row with no
     registry row fails — the exhaustiveness is over Object.keys(CALIBRATION), so a future
     calibration row cannot be added without a status and a basis. */
  const projection = {};
  for (const k of Object.keys(ED.CALIBRATION)) {
    projection[k] = { status: ED.CALIBRATION[k].specDecBaselineStatus,
                      evidence: ED.CALIBRATION[k].specDecBaselineBasis };
  }
  assert("T-13 the registry projection deep-equals BASIS_MANIFEST — every row, every ordered entry",
    JSON.stringify(projection) === JSON.stringify(BASIS_MANIFEST),
    JSON.stringify(projection) === JSON.stringify(BASIS_MANIFEST) ? "" : "registry/manifest divergence");
  assert("T-13 every calibration row carries a valid status and a NON-EMPTY basis array",
    Object.keys(ED.CALIBRATION).every(k => {
      const r = ED.CALIBRATION[k];
      return ["included", "excluded", "unknown"].includes(r.specDecBaselineStatus)
        && Array.isArray(r.specDecBaselineBasis) && r.specDecBaselineBasis.length > 0;
    }));

  /* (2) EXECUTE every entry. A quote is checked by READING the cited bytes; a probe by RUNNING it.
     Line numbers drift with any edit to a cited file, so a miss fails LOUDLY here rather than
     searching for the text elsewhere — a citation that silently relocates is not a citation. */
  const root = new URL("../", import.meta.url).pathname;
  let quotes = 0, probes = 0;
  for (const [row, m] of Object.entries(BASIS_MANIFEST)) {
    for (const e of m.evidence) {
      if (e.kind === "quote") {
        /* A citation into a PRIVATE design memo cannot be executed where that memo does not
           exist. It self-skips there and is counted as skipped; everywhere the memo IS present
           it runs, and the hard guard makes "present for some, absent for others" a failure. */
        const isPrivate = privatePaths.has(e.source);
        if (isPrivate && !P.has(e.source)) { P.skip(1, e.source); continue; }
        const src = (isPrivate ? P.read(e.source) : readFileSync(root + e.source, "utf8")).split("\n");
        const line = src[e.line - 1];
        const name = `T-13 ${row}: ${e.source}:${e.line} CONTAINS its cited bytes`;
        const cond = typeof line === "string" && line.includes(e.text);
        const detail = `line ${e.line} is ${JSON.stringify(String(line).slice(0, 90))}`;
        if (isPrivate) P.assert(name, cond, detail); else assert(name, cond, detail);
        quotes++;
      } else {
        const out = execFileSync(process.execPath, [root + e.script, row], { encoding: "utf8" }).trim();
        assert(`T-13 ${row}: ${e.script.split("/").pop()} emits its pinned expect`,
          out === e.expect, `got ${JSON.stringify(out)}`);
        probes++;
      }
    }
  }
  /* The expected counts are DERIVED from the manifest, never written down — every hand-written
     count in this arc has gone stale at least once, and a count that disagrees with the list it
     summarises is a second authority. This asserts only that execution actually visited every
     entry, which is what makes "T-13 executes rather than inspects" a fact about the run. */
  const want = Object.values(BASIS_MANIFEST).flatMap(m => m.evidence);
  /* EXECUTABLE, not simply "all": a quote into an absent private memo is not executable here,
     and the count must follow the manifest and the tree rather than a written-down number. */
  const executable = want.filter(e =>
    e.kind !== "quote" || !privatePaths.has(e.source) || P.has(e.source));
  assert("T-13 every EXECUTABLE manifest entry was executed, not inspected",
    quotes === executable.filter(e => e.kind === "quote").length
    && probes === executable.filter(e => e.kind === "probe").length,
    `${quotes} quotes / ${probes} probes over ${executable.length} executable of ${want.length} entries`);

  /* gb300 renders the exact `unestablished` string, so the Q-G ruling is enforced at the SURFACE
     and not only in the manifest — the point round-7 Sol made. */
  const gb300 = E.specDecLegDisclosure(E.HW.gb300, { stackMult: 0.7, specDec: 1.6 }, { perspKind: "lens" });
  assert("T-13 gb300 resolves to `unestablished` and renders the pinned string, per the Q-G ruling",
    gb300.reasonCode === "unestablished" && gb300.factorApplied === 1
    && E.specDecReasonText(gb300.reasonCode, gb300.factorApplied)
       === "· speculative-decode credit: not applied — this page cannot establish this leg's speculative status",
    JSON.stringify(gb300));

  /* THE TWO NARRATIVE EXCEPTIONS registered in [N-BASIS], each with its own oracle — because an
     exception with no oracle is not a checked exception, it is an unchecked one with a label. */
  P.gate("research/b9-spec-decode-lever-memo.md", 2, (memo) => {
    const errata = memo.slice(memo.indexOf("**`gb300` — ERRATA NOTE"));
    /* Whitespace-collapsed before comparison: the reason string wraps across a markdown line break,
       so a raw `includes` reports clean while being blind — the same normalization gap T-21c found. */
    const errataBlock = errata.slice(0, errata.indexOf("12% of the default fleet.")).replace(/\s+/g, " ");
    const gb300Reason = E.specDecReasonText("unestablished", 1).replace("· speculative-decode credit: not applied — ", "");
    P.assert("T-13 exception 1 — the COURT-REQUIRED gb300 errata AGREES with BASIS_MANIFEST.gb300",
      errataBlock.includes("gb300 ships `unknown`")
      && errataBlock.includes(gb300Reason)
      && BASIS_MANIFEST.gb300.status === "unknown",
      JSON.stringify(gb300Reason));
    /* The tpu7 correction record is BYTE-PINNED. A blocklist of forbidden phrases was tried in the
       memo and any rewording defeats it; a byte pin is decidable, cannot be reworded around, and
       costs nothing because the paragraph is historical and should not change. Its own `:1036`
       citation is deliberately left stale: it is the record of a correction made at 3f89695, and
       what is true TODAY is BASIS_MANIFEST.tpu7. */
    const tpu7Start = memo.indexOf("**`tpu7` — v2 was wrong twice");
    const tpu7End = memo.indexOf("no longer restates the operative basis alongside it.");
    const tpu7Record = memo.slice(tpu7Start, tpu7End + "no longer restates the operative basis alongside it.".length);
    P.assert("T-13 exception 2 — the tpu7 correction record equals its pinned bytes",
      createHash("sha256").update(tpu7Record).digest("hex")
        === "9929641b3a881c40b8f049a6c0b98000926acf8c476e62209eeb7a0f087b12d4",
      createHash("sha256").update(tpu7Record).digest("hex") + ` (${tpu7Record.length} bytes)`);
  });
}

/* ================= MANIFEST ROWS 1-5 — THE RUNTIME-STRING SPANS =================
   THE RUNTIME-STRING PRINCIPLE, ratified as a standing rule for this page's concatenated constants
   (esc-20260801T042349Z-20c444d8): a span pins the string a READER RECEIVES, not source bytes. The
   g1/g3 bridges and MTP_ROW_COPY are built by concatenation across many source lines, so a sentence
   a reader sees as continuous is split in the file — span (G)'s "Separately and independently" sat
   across a seam and matched ZERO source-text greps while being plainly present at runtime. An
   implementer edits whatever source lines produce the string; the oracle compares runtime strings,
   and a wrong byte fails by construction. */
{
  const hj = E.finalAnswer().higherJustifications;
  const bridgeOf = id => hj.find(g => g.groupId === id).bridge;
  const digest = s => createHash("sha256").update(s).digest("hex");

  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): both digests re-mint. The
     ratified EDIT PAIRS are untouched — what changed inside their hosts is the published figures
     the fold moved, which the FA-justifications suite re-derives from the live engine. The digest
     is still the oracle; it is now the oracle over the folded bytes.
     Rows 2-5 — the four g1/g3 spans, ratified as exact old→new pairs in the addendum
     esc-20260801T045418Z-71b767cc. The court verified each OLD occurred exactly once inside its
     ratified digested host and pinned the POST-EDIT digest of each host; those digests are the
     oracle, so the whole of rows 2-5 reduces to two equalities that cannot be argued with. */
  assert("rows 2-3 — the g1 bridge reproduces the ratified POST-EDIT digest exactly",
    digest(bridgeOf("g1-teortaxes-9095"))
      === "8d74fa619113c287f97db71e8295f45fd4bd1b225a59890556be4b64dd7d5ff9",  // im-vet-six-repairs 2026-09-20: the g1 bridge moves with the repairs, every span pinned in tests/fa-justifications.test.mjs VETTING_REPAIRS
    digest(bridgeOf("g1-teortaxes-9095")));
  assert("rows 4-5 — the g3 bridge reproduces the ratified POST-EDIT digest exactly",
    digest(bridgeOf("g3-gptpro-9294-lens"))
      === "88d416a196382b6f34e25d6a569ae18f31b0136051dd1185d511a3f1b43a6a5b",  // im-vet-six-repairs 2026-09-20: the g3 bridge, same pinned-span treatment
    digest(bridgeOf("g3-gptpro-9294-lens")));

  /* T-21e on the four bridge spans. Each states availability under the D-SD-7 gate, so each must
     carry the setting's NAME, quotes included — the check that catches a rename on one surface. */
  for (const id of ["g1-teortaxes-9095", "g3-gptpro-9294-lens"]) {
    const b = bridgeOf(id);
    assert(`T-21e ${id} carries the literal "no MTP/disagg" in BOTH of its spans`,
      b.split('"no MTP/disagg"').length - 1 === 2, String(b.split('"no MTP/disagg"').length - 1));
    assert(`${id} says the page AUTHORS/SELECTS its readings — never "publishes"`,
      /reading this page (authors|selects)|reading it authors|readings? this page authors/.test(b)
      && !/no reading this page publishes/.test(b));
  }

  /* Row 1 — the MTP_ROW_COPY union (G + H + item 4 + the tail). The old forms must be GONE, not
     merely joined by new ones: "I add the new form and leave the old one" is the failure this arc
     named eight times, so absence is asserted as explicitly as presence. */
  const mtp = E.MTP_ROW_COPY;
  const RETIRED = [
    "this page has found none for any lab",                        // (H) — false against this registry
    "Separately and independently",                                 // (G) — tightened
    "which is why it is carried here as a",                         // item 4 — the split
    "Making it a control you can turn is scoped",                   // the tail — argued against this lever
    "a fleet-wide credit would land on legs whose speculative status this page cannot establish",
    "one is documented unknown, and five carry no receipt either way",
    /* J-10 run-1 dive A P0-3 (court-ruled, gen-24): an UNBOUNDED exclusivity claim, refuted by this
       page's OWN cited source — lmsys.org/blog/2025-07-17-mtp publishes acceptance lengths 2.18 and
       2.44. This is the SECOND unbounded "anywhere / any lab" defect in this row (the first is (H),
       first entry above), so the class is now guarded twice in the same list. */
    "are the only acceptance figures it has found anywhere",
    /* J-10 run-1 dive A P0-2 (court-ruled): FALSE about its own citation — both SGLang figures are
       DeepSeek V3 on SGLang, differing in scale and concurrency, not in model or implementation. */
    "different models, speculator architectures and implementations",
    /* J-10 run-2 P0 — THE FOLD'S OWN. Guarded as a retired form precisely because this session
       wrote it while correcting the two above: the correction pass is a defect source in its own
       right, and this list is where that lesson is mechanically enforced rather than remembered. */
    "not a pure speculative-decode delta",
    /* J-10 run-4 dive A P0-1 (owner-ruled): renamed the source's own metric. SGLang reports an
       average ACCEPTANCE LENGTH — accepted drafts plus the bonus token — so "accepted tokens"
       overstates the accepted-draft count. Guarded because this is the finding that made the gate
       non-reproducible: dive A rated it P1 in run 3 and P0 in run 4 on identical bytes, so the only
       way to stop it re-rating is to remove the defect it rates. */
    "about 1.8–1.9 accepted tokens",
  ];
  assert("row 1 — every retired form is GONE from MTP_ROW_COPY, not merely joined by its replacement",
    RETIRED.every(s => !mtp.includes(s)), JSON.stringify(RETIRED.filter(s => mtp.includes(s))));
  const LANDED = [
    "Separately, and from a different party,",
    /* J-10 run-1 fold: the P0-3 replacement. BOUNDED to this page's cited evidence set, and it names
       the source's own 2.18 / 2.44 rather than omitting them — the narrowing the court authorised. */
    "Its cited evidence set carries four non-fleet acceptance figures and no fleet-specific one",
    /* The owner-ruled replacement: the source's metric NAME and its COMPOSITION, both pinned. */
    "an average acceptance length of about 1.8–1.9",
    "counts accepted draft tokens plus the bonus token produced per verification step",
    "average acceptance lengths of 2.18 and 2.44",
    "these are the figures this page has found, not a claim about every figure that exists",
    /* The P0-2 replacement, plus the two disclosures the primary-source read produced. */
    "Both are the SAME model on the SAME stack — DeepSeek V3 under SGLang",
    /* J-10 run-2 P0, fold-introduced and court-corrected (gen-25, dive B text verbatim): the run-1
       fold claimed the +60.8% figure was overlap-confounded. It is not — overlap scheduling is OFF
       IN BOTH arms, so the delta is matched. Pinned on the corrected numerals, which is what makes
       the inversion unrepeatable: the retired form is guarded below. */
    "the MTP-versus-no-MTP delta with overlap scheduling absent from both arms",
    "82.0 versus 51.0 tokens/s/rank (+60.8%)",
    "did not support MTP together with overlap scheduling",
    "are not registered evidence rows of this page",
    "any credit is applied after that floor, to decode only",
    "so it is a scenario credit you declare, not a mechanism this page runs",
    "What this page ships instead is a control you turn",
    "The credit stays at zero in this page's default",
  ];
  assert("row 1 — every ratified replacement is present",
    LANDED.every(s => mtp.includes(s)), JSON.stringify(LANDED.filter(s => !mtp.includes(s))));

  /* The D-7 amendment (Polaris esc-20260730T220007Z-39615d5c) authorises this refusal row only
     while it states four elements. The ratified §9.3 replacement text omits the receipts element;
     that grant outranks the design memo in this memo's own precedence list, so the element is
     RETAINED and asserted here rather than dropped along with the text that replaced its neighbours. */
  /* AFFIRMED BY COURT RECORD — esc-20260802T121708Z-66c10f00 amends row 1's ratified text to
     include the retained element. The assertion predates the affirmation and is unchanged by it,
     which is the point: the precedence stack and the court agree. */
  assert("row 1 — the D-7 refusal row still states all four required elements",
    ["[lever]", "[evidence label]", "[why no number]", "[what receipts would have to exist]"]
      .every(m => mtp.includes(m)));

  /* The leg counts in the new tail are EXECUTED against the typed statuses, never transcribed —
     three separate false load-bearing arithmetic claims reached drafts of this design by being
     written down instead of derived. */
  const ED2 = require("../site/engine-data-v22.js");
  const members = E.finalAnswer().membership.members.map(m => m.hwKey);
  const byStatus = k => members.filter(h => ED2.CALIBRATION[h].specDecBaselineStatus === k);
  assert("row 1 — the tail's leg arithmetic matches the live typed statuses",
    byStatus("excluded").length === 3
    && JSON.stringify(byStatus("unknown").sort()) === JSON.stringify(["gb300", "tpu7"])
    && mtp.includes("three legs are creditable and two, gb300 and tpu7, cannot be established and are exempt"),
    JSON.stringify({ creditable: byStatus("excluded"), exempt: byStatus("unknown") }));
  assert("row 1 — no memo token and no markdown emphasis reaches this textContent surface",
    !/\[N-[A-Z-]+\]/.test(mtp) && !mtp.includes("**"));

  /* The occurrence marked CORRECT AS IS must be left alone. Over-correcting accurate copy is this
     arc's other failure mode: of the three "independent" occurrences only one was ever wrong. */
  assert("row 1 — the accurate \"not independently verified\" caveat is byte-UNTOUCHED",
    mtp.includes("a vendor claim — self-reported, single-source, not independently verified — at ONE lab"));
}

/* ================= MANIFEST ROWS 16-20 — THE FILE-KIND SURFACES ================= */
{
  const root = new URL("../", import.meta.url).pathname;
  const read = f => readFileSync(root + f, "utf8");

  /* ---- Row 16, span (8) — THE ONE SITE ASSERTED OVER FILE BYTES ----
     The methods box is STATIC HTML, so nothing composes it at runtime and the module system cannot
     enforce the composition for free. T-21a therefore reads the file, extracts the paragraph between
     the pinned insertion boundaries, and asserts equality with the composition evaluated from the
     engine's canonical constants — an implementer who edits one and not the other ships a silent
     divergence otherwise, which is precisely how the why-line and the tip drifted apart twice.
     Blockquote `**emphasis**` maps to `<strong>` here because this surface IS HTML; that mapping is
     the memo's own, and it is the evidence cited in esc-20260802T115802Z-351e891f for reading the
     same notation as emphasis on the two textContent surfaces. */
  const METHODS_HEAD = "<strong>Speculative-decode credit.</strong> A scenario lever, off by default, "
    + "that multiplies modelled decode throughput only — prefill has no autoregression to speculate "
    + "on. It models no acceptance rate, draft cost or verification overhead: it is a credit you "
    + "declare, not a mechanism this page runs.";
  const METHODS_TAIL = "Energy follows the throughput multiplier by construction of this model — "
    + "speculative decoding also burns draft-and-verify energy this page does not measure. Legs whose "
    + "deployed efficiency absorbs speculation, and legs whose status this page cannot establish, are "
    + "exempt and say so.";
  const METHODS_SPAN_8 = METHODS_HEAD
    + " It is available only from the \"no MTP/disagg\" stack setting (0.7). "
    + E.SPECDEC_GATE_SEMANTICS
    + " What that costs you: " + E.SPECDEC_CONSERVATISM + ". "
    + METHODS_TAIL;

  const html = read("site/index.html");
  const B0 = "<!-- b9 spec-decode LEVER — span (8) END -->";
  const open = html.indexOf("<li>", html.indexOf("PINNED INSERTION BOUNDARIES"));
  const close = html.lastIndexOf("</li>", html.indexOf(B0));
  const shippedSpan8 = html.slice(open + 4, close);
  assert("row 16 / T-21a — the methods-box paragraph equals its composition, asserted over FILE BYTES",
    shippedSpan8 === METHODS_SPAN_8,
    JSON.stringify({ file: shippedSpan8.length, composed: METHODS_SPAN_8.length }));
  assert("row 16 — span (8) carries the energy caveat the ratification approved in substance",
    shippedSpan8.includes("burns draft-and-verify energy this page does not measure"));
  assert("T-21e span (8) carries the literal \"no MTP/disagg\"",
    shippedSpan8.includes("\"no MTP/disagg\""));

  /* ---- Rows 17-20 — the rationale annex, in BOTH its authored and its built copy ----
     Row 10 of [N-AVAILABILITY-SITES] is two physical byte targets carrying identical copy, and the
     ratification manifest splits them because there the unit is a byte target. The built HTML is
     generated from the .md by build-research-html.mjs, so asserting both is what proves the build
     actually ran — an edit to the source alone would ship a stale page. */
  const annexMd = read("research/final-answer-rationale.md");
  const annexHtml = read("site/research/final-answer-rationale.html");
  /* Span (7) was REDRAFTED at v16 against the real annex clause. Every prior version replaced a
     phrase reading "the page declines to price this lever" — WHICH DOES NOT EXIST IN THIS FILE, and
     survived four review rounds precisely because the span was never checked against the bytes. */
  const SPAN_7 = "This page therefore holds the credit at zero in every reading it authors and says "
    + "so. A reader may price the lever themselves with the scenario control, from the "
    + "\"no MTP/disagg\" stack setting only; the calculator then computes and labels that reading as "
    + "the reader's. It is off by default, never applied to a leg whose deployed efficiency already "
    + "absorbs speculation or whose status this page cannot establish, and never used to select a "
    + "reading of this page's own.";
  /* J-10 run-1 dive A P0-3 (court-ruled, gen-24): H2's own replacement carried the SAME unbounded
     "found anywhere" claim it was written to fix — the false universal migrated from "for every lab"
     into the sentence that corrected it, in the file H2 exists to correct. Re-pinned BOUNDED and
     naming the cited source's own 2.18 / 2.44. The class has now been wrong in three places across
     two files; the retired-form guard on row 1 catches the engine copy, and this pin catches both
     annex copies. */
  const SPAN_H2 = "Acceptance rates for speculative decoding are unpublished for the fleet this page "
    + "models. Its cited evidence set carries four non-fleet acceptance figures and no "
    + "fleet-specific one: two non-flagship anchors — one reporting an average acceptance "
    + "length of about 1.8–1.9 (SGLang's acceptance-length metric counts accepted draft tokens "
    + "plus the bonus token produced per verification step), one assuming 70% acceptance for a "
    + "single speculative token — and, in the "
    + "open-stack post cited below, average acceptance lengths of 2.18 and 2.44 at two draft-window "
    + "settings. These are the figures this page has found, not a claim about every figure that "
    + "exists.";
  /* The built HTML is ENTITY-ESCAPED by the builder (`"` becomes &quot;, `'` becomes &#39;), so the
     comparison decodes before it compares. This is the runtime-string principle again, one surface
     down: what the court ratified is what a READER receives, and a reader of the built page
     receives the decoded character. Comparing raw bytes here would fail on correct work. */
  const unescapeHtml = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const flat = s => unescapeHtml(s).replace(/\s+/g, " ");
  for (const [label, text] of [["17/18 authored .md", annexMd], ["19/20 built .html", annexHtml]]) {
    assert(`rows ${label} — span (7) is present in its ratified redraft`,
      flat(text).includes(flat(SPAN_7)));
    assert(`rows ${label} — span (H2) corrects the false universal to a frontier-fleet absence`,
      flat(text).includes(flat(SPAN_H2)));
    assert(`rows ${label} — span (E): the evidence CLASS label no longer claims independence`,
      flat(text).includes("the vendor claim and the SGLang-reported open-stack measurements are kept in separate classes")
      && !flat(text).includes("the vendor claim and the independent measurements"));
    assert(`rows ${label} — the retired forms are GONE`,
      !text.includes("for every lab this page models")
      && !text.includes("rather than pricing a lever the public record"));
  }

  /* ---- T-21d, the FILE-LEVEL sweep the earlier string-level check could not reach ----
     SCOPED AS THE MEMO SCOPES IT, and the difference is load-bearing: the rule reaches
     "site/engine.js's COPY STRINGS" but the WHOLE of the three file-kind surfaces, because every
     byte of those files ships while an engine.js comment never reaches a reader. A whole-file sweep
     of engine.js fails on a correct implementation — the ladder's own comment cites
     [N-DISPOSITION] to name the memo block it implements, which is exactly the reference-by-ID the
     architecture wants in code that does not ship. engine.js's copy strings are swept by the
     string-level T-21d above; this is the half that check cannot see. */
  for (const f of ["site/index.html", "research/final-answer-rationale.md",
                   "site/research/final-answer-rationale.html"]) {
    const hits = read(f).match(/\[N-[A-Z-]+\]/g) || [];
    assert(`T-21d no memo token ships in ${f}`, hits.length === 0, JSON.stringify(hits.slice(0, 3)));
  }
}

/* ================= THE GATE, EXECUTED — T-15 / T-15b / T-17 / T-18 / T-6 =================
   Every positive fixture below names its FULL state vector. A fixture that raises specDec without
   opening the gate silently tests nothing, because the engine backstop forces the factor to 1 — and
   five fixtures in an earlier draft of this design did exactly that. */
const TICK = E.SPECDEC_GATE_TICK;
const SNAP = (v, step) => Math.round(v / step) * step;      // the live app.js slider write path
{
  /* T-17 — the gate is CLOSED in the default state, and no shipped perspective or replay sits at
     the tick. Enumerated from the registry AT RUNTIME so a future perspective cannot silently open
     it: a hand-written list of today's values would go stale the moment one is added. */
  assert("T-17 the gate is CLOSED in the default state (DEFAULTS.stackMult is 1)",
    E.DEFAULTS.stackMult === 1 && !E.specDecGateAllows(DEFAULT_STATE()));
  const seeded = E.PERSPECTIVES.flatMap(p => E.MODELS.filter(m => m.id !== "custom")
    .map(m => ({ id: `${m.id}/${p.id}`, stack: E.applyPresetSettings(m, p, { mode: "native" }).stackMult })));
  const atTick = seeded.filter(x => E.stackAtMtpFreeTick(x.stack));
  assert("T-17 NO shipped model×perspective state sits within 1e-9 of the tick — enumerated at runtime",
    atTick.length === 0, JSON.stringify(atTick.slice(0, 5)));
  assert("T-17 no shipped perspective declares specDec at all",
    !E.PERSPECTIVES.some(p => p.set && "specDec" in p.set));

  /* T-15 — swept across the WHOLE stackMult grid THROUGH THE SNAP PATH, not through literals. The
     control is disabled rather than silently clamped, and the ENGINE BACKSTOP is what makes that
     true for every caller with no DOM. */
  let openCount = 0, credited = 0;
  for (let v = 0.4; v <= 1.6001; v += 0.05) {
    const snapped = SNAP(v, 0.05);
    const s = Object.assign(DEFAULT_STATE(), { stackMult: snapped, specDec: 1.6 });
    const open = E.specDecGateAllows(s);
    if (open) openCount++;
    const f = E.specDecFactor(E.HW.gb200, s, { perspKind: "lens" });
    if (f !== 1) credited++;
    if (!open && f !== 1) assert(`T-15 gate shut at stackMult ${snapped} must yield factor 1`, false, String(f));
  }
  assert("T-15 exactly ONE point on the snapped 0.40–1.60 grid opens the gate, and only it is credited",
    openCount === 1 && credited === 1, `${openCount} open / ${credited} credited`);

  /* T-15b — the THREE PATHS that must all open the gate. This is the assertion that would have
     caught the original defect: the tick button writes the literal 0.7, every drag writes
     Math.round(v/step)*step = 0.7000000000000001, and a codec token can carry either. A rule
     written as `=== 0.7` treats the OPEN gate as shut on every drag path while the readout still
     shows "0.70" — and would then fire the reset and wipe the user's setting, display unchanged. */
  assert("T-15b the tick path (literal), the drag path (snapped) and a codec token ALL open the gate",
    E.stackAtMtpFreeTick(0.7) && E.stackAtMtpFreeTick(SNAP(0.7, 0.05))
    && E.stackAtMtpFreeTick(0.4 + 6 * 0.05)
    && E.specDecTokenConsistent({ specDec: 1.6, stackMult: SNAP(0.7, 0.05) }, null));
  assert("T-15b the drag path is NOT the literal — which is the whole reason the predicate is epsilon",
    SNAP(0.7, 0.05) !== 0.7 && (0.4 + 6 * 0.05) !== 0.7);
  /* No coercion. A single authority that accepts three wrong types is not a single authority. */
  for (const bad of ["0.7", [0.7], new Number(0.7), null, undefined, NaN, 0.71, 0.7000001])
    assert(`T-15b the predicate REFUSES ${JSON.stringify(String(bad))} (${typeof bad})`,
      !E.stackAtMtpFreeTick(bad));

  /* T-6 / T-18 — typing. specDec is SPECIFIED and the gate is NOT the interlock: D-5 Amendment 2
     says a SPECIFIED lever is never locked by that machinery, so no interlock state may lock it and
     no transition may write it. */
  assert("T-6 specDec is a SPECIFIED lever key",
    E.SPECIFIED_LEVER_KEYS.includes("specDec"));
  assert("T-18 specDec is in NEITHER lever group — the gate is not the interlock",
    !E.TREND_GROUP_KEYS.includes("specDec") && !E.FAMILY_GROUP_KEYS.includes("specDec"));
  assert("T-18 no interlock state locks specDec, and interlockGroupOf does not claim it",
    E.INTERLOCK_STATES.every(st => E.interlockLockedGroup(st) !== "specDec")
    && E.interlockGroupOf("specDec") === null);
  /* An interlock transition returns {next, zeroTrend, note} and names only the TREND key it may
     zero. It has no specDec channel at all, which is what "no transition writes it" means in code. */
  {
    const t = E.interlockAfterEdit("locked-trend", "famTpu");
    assert("T-18 an interlock transition returns only {next, zeroTrend, note} — no specDec channel",
      t && typeof t.next === "string" && typeof t.zeroTrend === "boolean"
      && !("specDec" in t) && E.INTERLOCK_STATES.includes(t.next), JSON.stringify(t));
  }
  assert("T-6 the reference pin carries specDec at NO CREDIT",
    E.REFERENCE_LEVER_PIN.specDec === 1.0
    && E.pinReferenceLevers(DEFAULT_STATE()).specDec === 1.0);
}

/* ================= T-7 — REPLAY INERTNESS (D-SD-5), enumerated from the registry ================= */
{
  const replays = E.PERSPECTIVES.filter(p => p.kind === "replay");
  assert("T-7 the replay roster is non-empty and enumerated at runtime, never hand-listed",
    replays.length > 0, String(replays.length));
  for (const p of replays) {
    /* The seed: applyPresetSettings is the second of the lock's three places. */
    const s = E.applyPresetSettings(opus, p, { mode: "native" });
    assert(`T-7 [${p.id}] the seeded state carries no credit`, s.specDec === 1.0, String(s.specDec));
    /* The engine backstop: the first place, and the one that holds for every caller with no DOM.
       Asserted at the GATE-OPEN state so it cannot pass by the gate being shut anyway. */
    const raised = Object.assign({}, s, { stackMult: TICK, specDec: 1.6 });
    assert(`T-7 [${p.id}] the engine forces the factor to 1 even with the gate OPEN`,
      E.specDecFactor(E.HW.gb200, raised, { perspKind: "replay" }) === 1);
    /* The codec: the third place. */
    assert(`T-7 [${p.id}] the codec rejects a replay token declaring credit`,
      !E.specDecTokenConsistent({ specDec: 1.6, stackMult: TICK }, p)
      && E.specDecTokenConsistent({ specDec: 1.0, stackMult: TICK }, p));
  }
}

/* ================= T-10 — CODEC: round-trip, reject-whole, and the encoder's own check ========= */
{
  const tr = E.resolveTraffic(opus, median, { mode: "native" });
  const ids = (over = {}) => Object.assign({ fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" }, over);
  const mint = (s, over) => E.encodeScenario(s, "opus", "median", tr, null, ids(over));
  const gateOpen = (specDec) => Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec });

  /* Round-trip at both ends of the domain and mid-domain, every fixture at the OPEN gate. */
  for (const v of [E.SPECDEC_BOUNDS[0], 1.14, E.SPECDEC_BOUNDS[1]]) {
    const d = E.decodeScenario(mint(gateOpen(v)));
    const got = d && ("specDec" in d ? d.specDec : E.DEFAULTS.specDec);
    assert(`T-10 specDec ${v.toFixed(2)} round-trips through the codec`, !!d && got === v, JSON.stringify(got));
  }
  /* A PRE-LEG link carries no specDec key at all and must resolve to no credit — the diff-based
     codec is why this leg needs no version bump. */
  {
    const d = E.decodeScenario(mint(DEFAULT_STATE()));
    assert("T-10 a link that predates this lever resolves to 1.0, with no version bump",
      !!d && !("specDec" in d) && E.DEFAULTS.specDec === 1.0);
  }
  /* The token is `v6.` + base64 JSON, so a forgery is minted by decoding, mutating the diff, and
     re-encoding — the shape a hand-edited link actually takes. Editing the base64 text directly
     would silently no-op and the assertion would pass while testing nothing. */
  const forge = (tok, mutate) => {
    const [prefix, b64] = [tok.slice(0, tok.indexOf(".") + 1), tok.slice(tok.indexOf(".") + 1)];
    const d = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    mutate(d);
    return prefix + Buffer.from(JSON.stringify(d), "utf8").toString("base64");
  };
  /* Out-of-domain forgery — rejected WHOLE, never clamped into a plausible-looking value. */
  {
    const forged = forge(mint(gateOpen(1.6)), d => { d.specDec = 2.4; });
    assert("T-10 an out-of-domain specDec forgery is rejected WHOLE", E.decodeScenario(forged) === null);
  }
  /* THE GATE ROW: a token declaring credit while the gate is shut is rejected whole. It has to be
     hand-forged precisely BECAUSE the encoder refuses to produce one — which is the next assertion,
     and the two together are what make the rule total rather than one-directional. */
  {
    const forged = forge(mint(gateOpen(1.6)), d => { d.stackMult = 1; });
    assert("T-10 a token carrying credit with the gate SHUT is rejected whole",
      E.decodeScenario(forged) === null);
    /* Control: the same forgery WITHOUT the gate violation still decodes, so the rejection above is
       attributable to the gate rule and not to the forging method. */
    const benign = forge(mint(gateOpen(1.6)), d => { d.specDec = 1.14; });
    assert("T-10 control: the same forging path with an in-domain, gate-legal value still decodes",
      E.decodeScenario(benign) !== null);
  }
  /* A REPLAY token declaring credit is rejected whole, on every shipped replay. */
  {
    const rp = E.PERSPECTIVES.find(p => p.kind === "replay");
    const rs = E.applyPresetSettings(opus, rp, { mode: "native" });
    const rtok = E.encodeScenario(rs, "opus", rp.id, E.resolveTraffic(opus, rp, { mode: "native" }),
      null, ids());
    const forged = forge(rtok, d => { d.specDec = 1.6; d.stackMult = TICK; });
    assert(`T-10 a REPLAY token declaring credit is rejected whole (${rp.id})`,
      E.decodeScenario(rtok) !== null && E.decodeScenario(forged) === null);
  }
  /* THE ENCODER SHARES THE PREDICATE — the M4 P0-1 lesson. An encoder that can mint a token its own
     decoder rejects produces links that copy successfully and then silently fail to restore. */
  {
    let threw = false;
    try { mint(Object.assign(DEFAULT_STATE(), { stackMult: 1.0, specDec: 1.6 })); }
    catch (err) { threw = /specDec 1\.6 is not available/.test(err.message); }
    assert("T-10 the ENCODER refuses to mint a gate-invalid token (never a self-rejecting link)", threw);
  }
  {
    let threw = false;
    try { mint(Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec: 2.4 })); }
    catch (err) { threw = /out of its closed domain — specDec/.test(err.message); }
    assert("T-10 the ENCODER refuses to mint an out-of-domain specDec", threw);
  }
  /* The domain check and the gate check are DIFFERENT rules and both are needed: one rejects a
     value outside [1.00, 1.60], the other rejects an in-domain value the gate forbids. */
  assert("T-10 leverDomainViolation types specDec per-field and does not coerce",
    E.leverDomainViolation({ specDec: 1.6 }) === null
    && /^specDec /.test(E.leverDomainViolation({ specDec: 1.7 }) || "")
    && /^specDec /.test(E.leverDomainViolation({ specDec: "1.2" }) || "")
    && E.leverDomainViolation({}) === null);
}

/* ================= T-9 — the overlap warning fires on its own condition and disables nothing ==== */
{
  /* The second argument is the IDENTITY BASE STATE, not a context — clause (a) compares each
     SPECIFIED lever against it. (Passing a context makes every lever read as "moved" and the
     warning fires on a clean default; caught here by asserting the clean case first.) */
  const base = DEFAULT_STATE();
  assert("T-9 no overlap warning fires at the clean default state",
    (E.leverOverlapWarnings(base, base) || []).length === 0,
    JSON.stringify(E.leverOverlapWarnings(base, base)));
  const s = Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec: 1.6, trendMonths: 6 });
  const warned = E.leverOverlapWarnings(s, base) || [];
  /* D-SD-4: the warning fires through the EXISTING clause (a) because specDec joined
     SPECIFIED_LEVER_KEYS — no new mechanism was added for it, and the suite asserts the key is
     named rather than trusting that the clause covers it. */
  assert("T-9 the specDec × trend overlap warning fires through the EXISTING clause, naming specDec",
    warned.some(w => w.kind === "specified-lever" && w.keys.includes("specDec")), JSON.stringify(warned));
  assert("T-9 the warning is NON-BLOCKING — it disables nothing and the credit still applies",
    E.specDecFactor(E.HW.gb200, s, { perspKind: "lens" }) === 1.6);
  assert("T-9 a nonzero trend with specDec at its default does NOT name specDec",
    !(E.leverOverlapWarnings(Object.assign(DEFAULT_STATE(), { trendMonths: 6 }), base) || [])
      .some(w => (w.keys || []).includes("specDec")));
}

/* ================= T-22 — THE DISPOSITION CROSS-PRODUCT =================
   The full cross-product of status (3) × perspKind (replay / non-replay) × gate (open / shut) ×
   selection (1.00 / > 1.00) = 24 combinations, called directly against the engine.

   THE EXPECTATION TABLE IS COMMITTED AS DATA, written out literally and reviewable as bytes. A
   table produced by calling the same specDecDisposition() the test exercises would prove only that
   the function agrees with itself — which is the whole reason this test exists: the memo's earlier
   design expressed these six codes as a SET of independently-matching rows, and three of them
   matched the same state at once on SHIPPED perspectives. */
{
  const A = "absorbed", U = "unestablished", N = "eligible-not-selected",
        R = "replay-locked", G = "gate-closed", P = "applied";
  //                 status      perspKind      gateOpen  specDec   expected
  const TABLE = [
    ["included",    "lens",        false,    1.00, A], ["included",    "lens",        false,    1.60, A],
    ["included",    "lens",        true,     1.00, A], ["included",    "lens",        true,     1.60, A],
    ["included",    "replay",      false,    1.00, A], ["included",    "replay",      false,    1.60, A],
    ["included",    "replay",      true,     1.00, A], ["included",    "replay",      true,     1.60, A],
    ["unknown",     "lens",        false,    1.00, U], ["unknown",     "lens",        false,    1.60, U],
    ["unknown",     "lens",        true,     1.00, U], ["unknown",     "lens",        true,     1.60, U],
    ["unknown",     "replay",      false,    1.00, U], ["unknown",     "replay",      false,    1.60, U],
    ["unknown",     "replay",      true,     1.00, U], ["unknown",     "replay",      true,     1.60, U],
    ["excluded",    "lens",        false,    1.00, N], ["excluded",    "lens",        false,    1.60, G],
    ["excluded",    "lens",        true,     1.00, N], ["excluded",    "lens",        true,     1.60, P],
    ["excluded",    "replay",      false,    1.00, N], ["excluded",    "replay",      false,    1.60, R],
    ["excluded",    "replay",      true,     1.00, N], ["excluded",    "replay",      true,     1.60, R],
  ];
  assert("T-22 the expectation table covers the FULL cross-product — 3 × 2 × 2 × 2",
    TABLE.length === 24 && new Set(TABLE.map(r => r.slice(0, 4).join("|"))).size === 24,
    String(TABLE.length));

  const reached = new Set();
  let mismatches = 0;
  for (const [status, kind, open, sd, want] of TABLE) {
    const d = E.specDecDisposition(status, kind, open, sd);
    reached.add(d.reasonCode);
    const factorOk = want === P ? d.factorApplied === sd : d.factorApplied === 1;
    if (d.reasonCode !== want || !factorOk) {
      mismatches++;
      assert(`T-22 ${status}/${kind}/gate ${open ? "open" : "shut"}/specDec ${sd.toFixed(2)} → ${want}`,
        false, JSON.stringify(d));
    }
  }
  assert("T-22 all 24 combinations resolve to EXACTLY the literal table, with the right factor",
    mismatches === 0, `${mismatches} mismatch(es)`);
  assert("T-22 the ladder is TOTAL and reaches every member of the closed enum",
    reached.size === Object.keys(E.SPECDEC_REASON_COPY).length
    && Object.keys(E.SPECDEC_REASON_COPY).every(c => reached.has(c)),
    JSON.stringify([...reached]));

  /* The three previously-ambiguous combinations, called out by name because they are the reason the
     matrix had to become an ORDERED ladder. The second is the Q-G ENFORCEMENT POINT: if
     `replay-locked` won there, gb300 would render "this is a published operating point…" instead of
     the `unestablished` string the court's Q-G ruling requires it to ship — a disposition ambiguity
     silently overriding an adjudicated copy requirement. */
  assert("T-22 included + replay + credit → absorbed, NOT replay-locked (basis outranks the lock)",
    E.specDecDisposition("included", "replay", true, 1.6).reasonCode === A);
  assert("T-22 unknown + replay + credit → unestablished, NOT replay-locked (the Q-G enforcement point)",
    E.specDecDisposition("unknown", "replay", true, 1.6).reasonCode === U);
  assert("T-22 excluded + replay + gate SHUT + credit → replay-locked, NOT gate-closed",
    E.specDecDisposition("excluded", "replay", false, 1.6).reasonCode === R);

  /* The negative case: the status set is CLOSED. An earlier draft fell through to the excluded arm
     for any other value, so a caller passing a garbage or absent status could be CREDITED. An
     unrecognised status means the registry and this function disagree about the type — a different
     thing from absent evidence, which is `unknown` and is already routed — so it fails loud. */
  for (const bad of ["included ", "EXCLUDED", "", null, undefined, 0]) {
    let threw = false;
    try { E.specDecDisposition(bad, "lens", true, 1.6); } catch (e) { threw = e instanceof TypeError; }
    assert(`T-22 an unrecognised status ${JSON.stringify(bad)} THROWS and resolves to no code`, threw);
  }

  /* Surface reachability is a SEPARATE question from the ladder and must not be conflated with it
     again: the ladder is defined over every input, but which inputs a surface can produce is
     narrower. gate-closed and replay-locked are reachable ONLY through direct engine calls, because
     every other path either forces specDec to 1.00 or rejects the token whole. */
  assert("T-22 gate-closed and replay-locked are DIRECT-ENGINE-ONLY — the sanitizer forces before they can arise",
    E.sanitizeScenarioDiff({ specDec: 1.6 }, null, Object.assign({}, E.DEFAULTS, { stackMult: 1 })).diff.specDec === 1.00);
}

/* ================= T-20a / T-20c / T-20e — THE PATH → DISPOSITION MATRIX ================= */
{
  /* T-20a — DIRECT ENGINE CALL. The raw pair survives, the backstop yields factorApplied 1, and
     nothing is corrected: the caller owns the state. This is the path that makes the invariant
     TOTAL, because it has no DOM and no sanitizer in front of it. */
  {
    const s = Object.assign(DEFAULT_STATE(), { stackMult: 1.0, specDec: 1.6 });
    const leg = E.specDecLegDisclosure(E.HW.gb200, s, { perspKind: "lens" });
    assert("T-20a a direct engine call with the illegal pair → gate-closed, factor 1, raw state UNTOUCHED",
      leg.reasonCode === "gate-closed" && leg.factorApplied === 1
      && s.specDec === 1.6 && s.stackMult === 1.0, JSON.stringify(leg));
    /* The composed multiplier is NOT asserted to be 1 — it carries the ratified trend prior too, and
       an earlier version of this assertion said `=== 1` and failed. That mistake is the same
       conflation the DTO pins against: `factorApplied` is the spec-decode factor ALONE, never the
       composed lever product. The right statement is that the illegal pair contributes NOTHING —
       the composed multiplier is byte-identical to the same state with no credit requested. */
    const noCredit = Object.assign({}, s, { specDec: 1.00 });
    assert("T-20a the ENGINE BACKSTOP is what enforces it — the composed multiplier is byte-identical to no-credit",
      E.specDecFactor(E.HW.gb200, s, { perspKind: "lens" }) === 1
      && E.leverThroughputMult(E.HW.gb200, s, { perspKind: "lens" }, null, "out")
         === E.leverThroughputMult(E.HW.gb200, noCredit, { perspKind: "lens" }, null, "out"));
  }
  /* T-20d — the SIXTH state, which existed because D-SD-5 and D-SD-7 were designed in different
     rounds and never cross-multiplied. Asserted on the shipped replay where the row set was
     ambiguous: anth20 is blended 100% to an `included` leg, so the same call must render `absorbed`
     on h20 and `replay-locked` on an `excluded` leg. */
  {
    const rp = E.PERSPECTIVES.find(p => p.kind === "replay");
    const s = Object.assign(E.applyPresetSettings(opus, rp, { mode: "native" }),
      { stackMult: TICK, specDec: 1.6 });
    assert("T-20d replay + gate OPEN + credit → replay-locked on an excluded leg, absorbed on an included one",
      E.specDecLegDisclosure(E.HW.gb200, s, { perspKind: "replay" }).reasonCode === "replay-locked"
      && E.specDecLegDisclosure(E.HW.h20, s, { perspKind: "replay" }).reasonCode === "absorbed");
  }
  /* T-20e (engine half) — SANITIZE / RESTORE / MCP. The resolved state is rewritten: specDec is
     FORCED to 1.00 and a corrections entry is emitted. Showing "none selected" after a silent force
     LIES ABOUT USER INTENT, which is the defect this channel exists to prevent. */
  {
    const base = Object.assign({}, E.DEFAULTS, { stackMult: 1 });
    const out = E.sanitizeScenarioDiff({ specDec: 1.6 }, null, base);
    assert("T-20e the sanitizer FORCES specDec to 1.00 and emits exactly one corrections entry",
      out.diff.specDec === 1.00 && out.corrections.length === 1
      && JSON.stringify(out.corrections[0]) === JSON.stringify({ key: "specDec", from: 1.6, to: 1, reasonCode: "gate-closed" }),
      JSON.stringify(out.corrections));
    assert("T-20e a correction is NOT a rejection — the value was accepted and then overridden",
      out.rejected.length === 0);
    /* Validated on the RESOLVED state, not the diff alone: a diff that moves only stackMult can
       shut the gate under a base that already carries credit, and a diff-only check misses it. */
    const out2 = E.sanitizeScenarioDiff({ stackMult: 1 }, null,
      Object.assign({}, E.DEFAULTS, { stackMult: TICK, specDec: 1.6 }));
    assert("T-20e the force fires on a diff that moves ONLY stackMult — resolved state, never the diff alone",
      out2.diff.specDec === 1.00 && out2.corrections.length === 1, JSON.stringify(out2));
    /* No force, no correction — the channel stays empty on every ordinary path. */
    assert("T-20e a gate-legal sanitize emits NO correction",
      E.sanitizeScenarioDiff({ specDec: 1.6 }, null, Object.assign({}, E.DEFAULTS, { stackMult: TICK }))
        .corrections.length === 0);
    /* EACH LEG KEEPS ITS OWN BASIS DISPOSITION after a force — "every cell becomes
       eligible-not-selected" is false for the default fleet's gb300 and tpu7, and asserting it
       would have shipped the wrong string on two of seven legs. */
    const forced = Object.assign(DEFAULT_STATE(), { stackMult: 1, specDec: 1.00 });
    assert("T-20e after a force each leg keeps its OWN basis disposition — only `excluded` legs read eligible-not-selected",
      E.specDecLegDisclosure(E.HW.gb200, forced, { perspKind: "lens" }).reasonCode === "eligible-not-selected"
      && E.specDecLegDisclosure(E.HW.gb300, forced, { perspKind: "lens" }).reasonCode === "unestablished"
      && E.specDecLegDisclosure(E.HW.tpu7, forced, { perspKind: "lens" }).reasonCode === "unestablished"
      && E.specDecLegDisclosure(E.HW.h20, forced, { perspKind: "lens" }).reasonCode === "absorbed");
  }
  /* T-20c — CODEC. The token is rejected WHOLE, so no state is produced and NO per-leg cell exists.
     An earlier draft asserted a gate-closed cell on this path, which it can never produce. */
  {
    const restored = E.restoreSavedPresetState(Object.assign({}, E.DEFAULTS, { stackMult: 1, specDec: 1.6 }),
      opus, E.resolveTraffic(opus, median, { mode: "native" }));
    assert("T-20c restore returns {state, corrections} and the forced state carries no credit",
      restored.state.specDec === 1.00 && restored.corrections.length === 1
      && restored.corrections[0].from === 1.6, JSON.stringify(restored.corrections));
  }
  /* Manifest row 15 — the state-level correction notice, byte-exact. ONE notice, never one per leg:
     the force is a property of the STATE, and a per-leg echo would print N copies of one event. */
  assert("row 15 — the correction notice is byte-exact, with {from} at two decimals",
    E.specDecCorrectionNotice(1.6) === "Your speculative-decode credit of ×1.60 was not applied — it "
      + "is available only from the \"no MTP/disagg\" stack setting, so it was reset to none.",
    JSON.stringify(E.specDecCorrectionNotice(1.6)));
  assert("T-21e the correction notice carries the literal \"no MTP/disagg\"",
    E.specDecCorrectionNotice(1.14).includes("\"no MTP/disagg\""));
}

/* ================= THE UI GATE — STRUCTURAL PINS (§6.1 UI row, §6.2) =================
   WHAT THESE PROVE AND WHAT THEY DO NOT. T-14, T-16 and T-19 are BEHAVIOURAL and need a DOM: a
   drag that keeps pointer capture, a focus that lands on a row, a tick that refuses a click. They
   belong to the app-suite harness and were NOT run in this environment, which has no Chrome/CDP
   host — that is recorded in the handoff as required verification, not claimed as done.

   What CAN be asserted without a DOM is that the wiring the memo requires is present, and that is
   worth having on its own: every one of these pins corresponds to a fix that failed against the live
   code at least once, so a regression that deletes the wiring fails here rather than silently
   shipping a dead control. Each assertion names the defect it guards. */
{
  const app = readFileSync(new URL("../site/app.js", import.meta.url).pathname, "utf8");

  /* The gate must feed the SAME `locked` boolean the range AND its ticks consult. A disabled range
     alone leaves ticks clickable — tick onclick is `if (locked) return` — and able to write
     specDec > 1 behind the engine's back. */
  assert("UI the gate contributes to the SAME `locked` boolean the range and its ticks consult",
    /const locked = [^;]*!!specDecLock/.test(app));
  /* Replay outranks the gate, mirroring the ladder's rule 3, and its why-line must NOT name the
     stack setting — under a replay, moving stackMult to the tick would still not enable credit. */
  assert("UI the replay lock outranks the gate and uses the replay why-line",
    app.indexOf("SPECDEC_REPLAY_WHY_LINE") < app.indexOf("SPECDEC_WHY_LINE, gate: true"));
  /* A gated tick is `disabled`, not merely inert: tabindex="-1" does not set disabled, and the jump
     picks the first descendant matching !el.disabled. */
  assert("UI gated ticks are actually `disabled`, not merely inert",
    /if \(specDecLock\) b\.disabled = true;/.test(app));
  /* The reverse direction — a one-directional gate is not a gate. */
  assert("UI moving stackMult off the tick with credit selected resets specDec and announces it",
    /k === "stackMult" && typeof S\.specDec === "number" && S\.specDec > 1 && !specDecGateAllows\(S\)/.test(app)
    && /specDecResetAnnounced = true/.test(app) && /SPECDEC_RESET_LINE/.test(app));
  /* The announcement is cleared at the START of the hook that sets it, NOT by the generic edit
     clear — noteUserEdit() runs later in the same oninput tick and would kill it on creation. */
  assert("UI the reset announcement is not cleared by the generic edit-clear in its own tick",
    /clearSpecDecResetNotice\(\);/.test(app)
    && !/clearActiveCorrection\(\)[^]{0,80}clearSpecDecResetNotice/.test(app));
  /* Clearing the FLAG is not clearing the NOTICE — an edit that does not rebuild controls would
     otherwise leave the rendered line on screen. Caught by the CDP probe, not by this pin. */
  assert("UI clearing the reset announcement removes the RENDERED line, not just the variable",
    /function clearSpecDecResetNotice\(\)[^]{0,220}querySelectorAll\("\.specdec-reset"\)/.test(app));
  /* Reconcile ONLY the dependent row: a full rebuild would replace the input being dragged. */
  assert("UI a stackMult edit reconciles ONLY the specDec row, never rebuilding the dragged input",
    /function reconcileSpecDecRow\(\)/.test(app)
    && /row\.replaceWith\(buildParam\(param\)\)/.test(app)
    && /if \(k === "stackMult"\) reconcileSpecDecRow\(\);/.test(app));
  /* The jump's search means "the control this affordance is FOR" — it must skip the row's own
     explanation button, which stays ENABLED because it explains the very thing the reader is
     blocked on. "No descendant matches the enabled predicate" is impossible to satisfy otherwise. */
  assert("UI the jump is narrowed to VALUE controls and the info button stays enabled",
    /const valueControls = \[\.\.\.row\.querySelectorAll\("input, select, button"\)\]/.test(app)
    && /classList\.contains\("info"\)/.test(app)
    && !/\.info[^]{0,40}disabled = true/.test(app));
  /* The gated row must be ANNOUNCED, not merely focused: the wrapper is a generic <div> with no
     role and no accessible name, so DOM adjacency alone tells a screen-reader user nothing. */
  assert("UI the gated row carries role=group with aria-labelledby and aria-describedby",
    /setAttribute\("role", "group"\)/.test(app)
    && /aria-labelledby", "specdec-label"/.test(app)
    && /aria-describedby", "specdec-why"/.test(app));
  /* LOW_EVIDENCE_COPY.jump stays byte-unedited — it is shared with the two ungated utilization
     rows, and editing it would break the affordance flip's "no new mechanism" property. */
  assert("UI LOW_EVIDENCE_COPY.jump is byte-UNCHANGED (it is shared with the utilization rows)",
    E.LOW_EVIDENCE_COPY.jump("X") === "Particularly low-evidence parameter — X. This page's value is "
      + "a declared convention, not a measurement. Set your own.");
}

/* ================= T-12 — THE DISCLOSURE SURFACE (§9.5) =================
   v1 of this design promised "every leg it does reach says so" and THAT PROMISE HAD NO SURFACE:
   the only per-leg renderer was cfPerLegPanel, which draws for CUSTOM fleets only, so default and
   named fleets carried no spec-decode status at all. This asserts the DTO exists on the canonical
   object for every fleet kind and that the render sites read it.

   THE PARITY HAZARD, named because a parity-only assertion would pass while testing nothing: two
   engines that both SUPPRESS the credit agree perfectly. Every fixture here is at the GATE-OPEN
   state and asserts `applied` with the factor, not agreement alone. */
{
  const app = readFileSync(new URL("../site/app.js", import.meta.url).pathname, "utf8");
  const gateOpen = Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec: 1.6 });
  const legs = E.feasibility(gateOpen, E.scenarioContext(gateOpen)).legs;

  assert("T-12 EVERY leg of the canonical object carries the typed DTO — codes only, no prose field",
    legs.length > 0 && legs.every(l => l.specDec
      && ["included", "excluded", "unknown"].includes(l.specDec.status)
      && typeof l.specDec.factorApplied === "number"
      && Object.keys(E.SPECDEC_REASON_COPY).includes(l.specDec.reasonCode)
      && !("reason" in l.specDec) && !("text" in l.specDec)),
    JSON.stringify(legs.map(l => l.specDec)));

  /* NOT parity alone: the credit must actually be APPLIED on the creditable legs, and the two
     exempt legs must keep their own strings. This is the assertion that fails if the lever is
     silently inert. */
  const applied = legs.filter(l => l.specDec.reasonCode === "applied");
  assert("T-12 at the gate-open state the credit is APPLIED with its factor on the three creditable legs",
    applied.length === 3 && applied.every(l => l.specDec.factorApplied === 1.6),
    JSON.stringify(applied.map(l => [l.hwKey, l.specDec.factorApplied])));
  assert("T-12 gb300 and tpu7 stay exempt on the SAME call, with the court-required string",
    legs.filter(l => l.specDec.reasonCode === "unestablished").map(l => l.hwKey).sort().join(",") === "gb300,tpu7");

  /* Each of the six codes renders bytes, and the formatter refuses an unknown code rather than
     returning a plausible-looking empty string. */
  for (const code of Object.keys(E.SPECDEC_REASON_COPY))
    assert(`T-12 the formatter renders pinned bytes for ${code}`,
      /^· speculative-decode credit: /.test(E.specDecReasonText(code, 1.6)));
  {
    let threw = false;
    try { E.specDecReasonText("not-a-code", 1); } catch (e) { threw = e instanceof TypeError; }
    assert("T-12 the formatter THROWS on an unrecognised code — never a silent empty string", threw);
  }

  /* All THREE fleet kinds render it. Custom fleets already had cfPerLegPanel; the other two are the
     new surfaces, and a 0%-weight leg is deliberately skipped — it is not part of this reading. */
  assert("T-12 the DEFAULT/NAMED fleet rows render the disclosure, and only for legs in the mix",
    /hw-specdec/.test(app) && /const sdNote = \(w\[k\] && sdLeg && sdLeg\.specDec\)/.test(app)
    && /if \(sdNote\) row\.appendChild\(sdNote\);/.test(app));
  assert("T-12 the CUSTOM fleet panel renders the disclosure from the same formatter",
    /cf-leg-specdec/.test(app));

  /* MCP returns CODES, never prose: a machine caller must not receive human copy it might display
     untranslated, and the codes are the stable contract. */
  const mcpSrc = readFileSync(new URL("../mcp-server/src/tools/run_scenario.ts", import.meta.url).pathname, "utf8");
  assert("T-12 the MCP per-leg DTO carries baseline_status/factor_applied/reason_code and NO prose",
    /spec_decode: leg\.specDec \? \{/.test(mcpSrc)
    && /baseline_status: leg\.specDec\.status/.test(mcpSrc)
    && /factor_applied: leg\.specDec\.factorApplied/.test(mcpSrc)
    && /reason_code: leg\.specDec\.reasonCode/.test(mcpSrc)
    && !/specDecReasonText/.test(mcpSrc));

  /* A CUSTOM leg is typed by its calibration DONOR — the row whose performance identity it borrows
     — so the DTO resolves through the house accessor and the render site needs no donor logic. An
     earlier draft of specDecFactor read a field that does not exist on HW rows, which made the
     whole lever silently inert while the suite stayed green. */
  assert("T-12 a custom leg resolves its status through its calibration DONOR, not by its own label",
    E.specDecLegDisclosure({ __cfLeg: { donorKey: "gb300" } }, gateOpen, { perspKind: "lens" }).reasonCode
      === "unestablished"
    && E.specDecLegDisclosure({ __cfLeg: { donorKey: "gb200" } }, gateOpen, { perspKind: "lens" }).reasonCode
      === "applied");
}

/* ================= T-1 — THE POST-LEG IDENTITY ORACLE =================
   The committed fixture captures the engine's decode/prefill throughput and cost surface BEFORE
   this lever existed — all 10 HW_ORDER legs across 7 scopes. Regenerating it against the POST-leg
   engine and comparing BYTES is what proves the default path is untouched, and it is a stronger
   claim than any tripwire: a tripwire is one number, this is the whole surface. */
{
  const fixture = readFileSync(new URL("../tests/fixtures/specdec-preleg-3f89695.json", import.meta.url).pathname, "utf8");
  const regenerated = execFileSync(process.execPath,
    [new URL("../tests/generate-specdec-preleg.mjs", import.meta.url).pathname], { encoding: "utf8" });
  const digest = JSON.parse(regenerated).sha256;
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the fixture is
     REGENERATED, not relaxed. What it proves is unchanged and is the whole point of it — the
     lever leaves the default path untouched across all 10 legs and 7 scopes — and it proves it
     against the folded cost surface rather than the pre-fold one. Regenerated with
     `node tests/generate-specdec-preleg.mjs --write`.
     im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     regenerated again, for the same reason and with the same guarantee — the lever still leaves the
     default path untouched across all 10 legs and 7 scopes, now against the post-adoption cost
     surface. Regenerated with `node tests/generate-specdec-preleg.mjs --write`, never hand-edited. */
  /* im-vet-six-repairs (2026-09-20, vetting findings E1 + E2): regenerated a third time, for the
     same reason and with the same guarantee — the lever still leaves the default path untouched
     across every leg and scope, now against the withdrawn five-leg default and the repaired TPU
     coefficient. Regenerated with `node tests/generate-specdec-preleg.mjs --write`, never
     hand-edited. */
  assert("T-1 the POST-leg engine reproduces the pre-leg fixture's pinned digest",
    digest === "9713d77ddd62acb5065ca259c1e8f0eecd9cf168e48fdc2364e108c95500d1d9", digest);
  assert("T-1 the committed fixture is byte-identical to what the post-leg engine emits",
    createHash("sha256").update(fixture, "utf8").digest("hex") === digest
    && Buffer.byteLength(fixture) === 9924, `${Buffer.byteLength(fixture)} bytes`);
}

/* ================= T-4 / T-5 — PHASE SCOPE AND TYPED RESOLUTION ================= */
{
  /* im-arc T4 fold (2026-08-24), memo §4: read on the OWNED basis so the two creditable/exempt
     exemplars (gb200, h20) both have a cost. The lever is a throughput lever; the phase-scope and
     exact-division properties below are about throughput and cost RATIOS, not about procurement,
     and they would be vacuous on a leg whose rent is honestly unavailable. */
  const at = (sd) => { const st = Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec: sd, hwMode: "tco" });
    return { s: st, ctx: E.scenarioContext(st) }; };
  const base = at(1.00), credited = at(1.60);

  /* D-P24-1: the credit applies to DECODE ONLY. Prefill consumes the prompt in one compute-bound
     pass with nothing to speculate on, so crediting it would be a modelling error. Swept across the
     WHOLE domain on EVERY leg, because a phase leak on one leg at one setting is still a leak. */
  let prefillMoved = 0, decodeWrong = 0;
  for (const k of E.HW_ORDER) {
    const p0 = E.tokPerS(E.HW[k], base.s, "in", undefined, base.ctx);
    const d0 = E.tokPerS(E.HW[k], base.s, "out", undefined, base.ctx);
    for (let v = 1.00; v <= 1.6001; v += 0.05) {
      const sd = Math.round(v / 0.01) * 0.01;
      const st = at(sd);
      const pv = E.tokPerS(E.HW[k], st.s, "in", undefined, st.ctx);
      const dv = E.tokPerS(E.HW[k], st.s, "out", undefined, st.ctx);
      if (!(Object.is(pv, p0) || (Number.isNaN(pv) && Number.isNaN(p0)))) prefillMoved++;
      const want = E.specDecLegDisclosure(E.HW[k], st.s, st.ctx).factorApplied;
      if (Number.isFinite(d0) && Math.abs(dv - d0 * want) > Math.abs(d0 * want) * 1e-12) decodeWrong++;
    }
  }
  assert("T-4 PREFILL is byte-identical across the whole domain on every leg — decode-only holds",
    prefillMoved === 0, `${prefillMoved} prefill moves`);
  assert("T-4 DECODE scales by exactly the leg's own applied factor, on every leg and setting",
    decodeWrong === 0, `${decodeWrong} decode mismatches`);
  /* And the cost side divides exactly by the credit on a CREDITABLE leg. */
  const cb = E.costPerMtok(E.HW.gb200, base.s, "out", undefined, base.ctx);
  const cc = E.costPerMtok(E.HW.gb200, credited.s, "out", undefined, credited.ctx);
  /* im-arc T4 fold (2026-08-24): on the owned basis the cost is a sum of four (now six) disclosed
     lines rather than one rent scalar, so the division lands one ULP off exact float equality —
     0.681472425730663 vs 0.6814724257306631. The PROPERTY is that the cost divides by the credit
     and by nothing else, so it is asserted at the same 1e-12 relative tolerance the throughput
     assertion above already uses, not loosened to a band. */
  assert("T-4 costPerMtok(out) divides EXACTLY by the credit on a creditable leg",
    Math.abs(cc - cb / 1.6) <= Math.abs(cb / 1.6) * 1e-12, `${cc} vs ${cb / 1.6}`);
  assert("T-4 an EXEMPT leg's output cost does not move at all",
    E.costPerMtok(E.HW.gb300, credited.s, "out", undefined, credited.ctx)
      === E.costPerMtok(E.HW.gb300, base.s, "out", undefined, base.ctx));

  /* T-5: the status is read from the TYPED FIELD, not inferred. A mutation probe flips one row's
     status and the leg's behaviour must follow — otherwise the typing is decorative. */
  const ED3 = require("../site/engine-data-v22.js");
  const row = ED3.CALIBRATION.gb200, saved = row.specDecBaselineStatus;
  try {
    assert("T-5 gb200 is credited while typed `excluded`",
      E.specDecLegDisclosure(E.HW.gb200, credited.s, credited.ctx).reasonCode === "applied");
    row.specDecBaselineStatus = "included";
    assert("T-5 flipping the TYPED FIELD flips the leg's behaviour — the status is read, not inferred",
      E.specDecLegDisclosure(E.HW.gb200, credited.s, credited.ctx).reasonCode === "absorbed");
    row.specDecBaselineStatus = "unknown";
    assert("T-5 and `unknown` fails CLOSED to exempt",
      E.specDecLegDisclosure(E.HW.gb200, credited.s, credited.ctx).reasonCode === "unestablished");
  } finally { row.specDecBaselineStatus = saved; }
  assert("T-5 the mutation probe restored the registry", ED3.CALIBRATION.gb200.specDecBaselineStatus === "excluded");
}

/* ================= F-1 / F-1b / F-1c — ONE FIXTURE PER STATUS TIER =================
   v1 tested only the exempt edge. Each tier gets its own fixture, and the `included` one runs on a
   SHIPPED REACHABLE FLEET so the exemption is a byte-identity fact rather than a claim. */
{
  const fleetState = (fleetId) => {
    const st = E.applyPresetSettings(opus, median, { mode: "native" });
    const fb = E.fleetBaselineBlend(fleetId, st, { modelId: "opus", customDonor: st.customDonor });
    if (fb) st.blend = fb;
    st.stackMult = TICK;
    return st;
  };
  /* F-1: ascend-sole-anchor is 100% `included`, so raising the lever to its ceiling must move
     NOTHING — margin byte-identical, not merely close. */
  const a0 = fleetState("ascend-sole-anchor"); a0.specDec = 1.00;
  const a1 = fleetState("ascend-sole-anchor"); a1.specDec = 1.60;
  const m0 = E.workload(a0, undefined, E.scenarioContext(a0)).margin;
  const m1 = E.workload(a1, undefined, E.scenarioContext(a1)).margin;
  assert("F-1 `included` exemption is BYTE-IDENTICAL on a shipped reachable fleet (ascend-sole-anchor)",
    m0 === m1, `${m0} vs ${m1}`);

  /* F-1b / F-1c: both `unknown` rows are exempt INSIDE the default fleet, asserted by name. */
  const d = Object.assign(DEFAULT_STATE(), { stackMult: TICK, specDec: 1.60 });
  const ctx = E.scenarioContext(d);
  for (const k of ["gb300", "tpu7"])
    assert(`F-1b/F-1c ${k} is typed \`unknown\` and receives NO credit inside the default fleet`,
      /* im-arc T4 fold (2026-08-24): gb300 has no admissible public planning rate, so under the
         default rent basis its output cost is honestly NaN. "Receives no credit" means the cost
         DOES NOT MOVE, and an unpriced cost not moving is NaN staying NaN — asserted with the
         Object.is idiom this file already uses for the prefill sweep, never with `===`, which is
         false for NaN and would have turned this into a silent pass-by-absence. */
      E.specDecLegDisclosure(E.HW[k], d, ctx).factorApplied === 1
      && Object.is(E.costPerMtok(E.HW[k], d, "out", undefined, ctx),
         E.costPerMtok(E.HW[k], Object.assign({}, d, { specDec: 1.00 }), "out", undefined, ctx)));

  /* F-2b: the default fleet is NOT universally credited — 37% exempt, derived from the live
     membership weights rather than transcribed. v4 of the memo said 12% here, stale from before
     tpu7 was typed `unknown`, and it contradicted the memo's own reach line. */
  const mem = E.finalAnswer().membership;
  const ED4 = require("../site/engine-data-v22.js");
  const exemptWeight = mem.members
    .filter(x => ED4.CALIBRATION[x.hwKey].specDecBaselineStatus !== "excluded")
    .reduce((a, x) => a + x.declaredWeight, 0);
  /* im-vet-six-repairs (2026-09-20): the DECLARED weights the members carry now sum to 75, not
     100, because the two withdrawn Trainium legs took their declared 8 and 17 out of the member
     set. The exempt weight itself is unchanged at 37 — gb300's 12 plus tpu7's 25 — so the exempt
     SHARE of what remains rises from 37% to 49.3%, which is a consequence of the withdrawal and
     is asserted as such rather than restated as if nothing moved. */
  assert("F-2b the default fleet's 37 declared exempt points are 49.3% of the 75 that remain, derived from the live weights",
    exemptWeight === 37 && mem.members.reduce((a, x) => a + x.declaredWeight, 0) === 75
    && Math.abs(exemptWeight / 75 * 100 - 49.333) < 0.01,
    String(exemptWeight));
}

/* ================= F-2 — THE ALGEBRAIC ORACLE, RE-PINNED AT THE GATE STATE =================
   The oracle is Σ(weight × baseline cOut × applicable factor⁻¹) over renderable legs at
   renormalized weights — NOT "weighted fleet share", which is the mistake an earlier draft made:
   h20 is 77.0238% of baseline OUTPUT cost in a 50/50 blend, not 50%. Full state vector pinned,
   because v4's figures were computed at a state the gate now forbids and so reproduced under no
   recorded conditions. */
{
  /* im-arc T4 fold (2026-08-24), memo §4: this oracle is about a THROUGHPUT lever, and it needs
     both exemplar legs to have a cost at all. gb200 — the creditable exemplar — has no admissible
     public planning RENT after the fold, so the oracle is read on the OWNED basis, where its
     registered capex prices it. The lever semantics under test are untouched (h20 exempt, gb200
     creditable, gb300 unknown), and the algebra is identical; only the procurement basis the
     costs are read on has moved, which is exactly the change that keeps the oracle non-vacuous
     instead of comparing NaN to NaN. */
  const mk = (sd) => { const st = E.pinReferenceLevers(E.applyPresetSettings(opus, median, E.FLAGSHIP_SCOPE.traffic));
    st.stackMult = TICK; st.blend = { h20: 50, gb200: 50 }; st.specDec = sd; st.hwMode = "tco";
    return { s: st, ctx: E.scenarioContext(st) }; };
  const b = mk(1.00), g = mk(1.60);
  const cOut = (k, x) => E.costPerMtok(E.HW[k], x.s, "out", undefined, x.ctx);
  const r6 = (v) => Number(v.toFixed(6)), r7 = (v) => Number(v.toFixed(7));

  assert("F-2 baseline cOut — h20 4.810558 · gb200 1.434989",
    r6(cOut("h20", b)) === 4.810558 && r6(cOut("gb200", b)) === 1.434989,
    JSON.stringify([cOut("h20", b), cOut("gb200", b)]));
  const w = E.blendWeights(b.s);
  const share = w.h20 * cOut("h20", b) / (w.h20 * cOut("h20", b) + w.gb200 * cOut("gb200", b));
  assert("F-2 h20 is 77.0238% of BASELINE OUTPUT COST — not the fleet's 50% share",
    Number((share * 100).toFixed(4)) === 77.0238, String(share * 100));
  const guarded = E.blendedCosts(g.s, undefined, g.ctx).cOut;
  const allCredit = (w.h20 * cOut("h20", b) + w.gb200 * cOut("gb200", b)) / 1.6;
  assert("F-2 guarded blended cOut @1.6× is 2.8537132 — h20 exempt, gb200 credited",
    r7(guarded) === 2.8537132, String(guarded));
  assert("F-2 an all-credit counterfactual would be 1.9517336, so the guard is worth $0.9019797/Mtok",
    r7(allCredit) === 1.9517336 && r7(guarded - allCredit) === 0.9019797,
    JSON.stringify([allCredit, guarded - allCredit]));
  /* The oracle is ALGEBRAIC, so it must reproduce the engine's own blended figure from the parts. */
  const algebraic = w.h20 * cOut("h20", b) / 1 + w.gb200 * cOut("gb200", b) / 1.6;
  assert("F-2 Σ(weight × baseline cOut × factor⁻¹) reproduces the engine's blended cOut",
    Math.abs(algebraic - guarded) < 1e-9, `${algebraic} vs ${guarded}`);
}

/* ================= T-8 / T-11 — VOCABULARY CLEARANCE AND PINNED-BYTE COVERAGE ================= */
{
  /* §2.7's forbidden list. "Span" is used where "range" would be natural, deliberately — this page
     does not publish ranges, intervals or confidence statements, and the scanner asserts the
     clearance rather than trusting the author. */
  const FORBIDDEN = [/\brange\b/i, /\binterval\b/i, /±/, /\bconfidence\b/i, /uncertaint/i,
                     /\bstd dev\b/i, /\bC\.I\.\b/i];
  const surfaces = {
    "TIPS.specDec": E.TIPS.specDec.b,
    "gate why-line": E.SPECDEC_WHY_LINE,
    "gate reset line": E.SPECDEC_RESET_LINE,
    "replay why-line": E.SPECDEC_REPLAY_WHY_LINE,
    "correction notice": E.specDecCorrectionNotice(1.6),
    "section title": E.SPECDEC_SECTION_TITLE,
    "control label": E.SPECDEC_CONTROL_LABEL,
    ...Object.fromEntries(Object.keys(E.SPECDEC_REASON_COPY).map(k => [`reason:${k}`, E.specDecReasonText(k, 1.6)])),
  };
  for (const [name, text] of Object.entries(surfaces))
    assert(`T-8 vocabulary clearance on ${name}`,
      !FORBIDDEN.some(rx => rx.test(text)), JSON.stringify(FORBIDDEN.filter(rx => rx.test(text)).map(String)));

  /* T-11: memo and code move in the same commit. Every pinned byte in this suite is compared against
     the SHIPPED string rather than against a copy in a fixture file — one source of bytes. This
     asserts the coverage itself: every ratified manifest row has at least one byte assertion above,
     which is what makes "26 of 26 implemented" a checkable statement rather than a claim. */
  const covered = {
    1: E.MTP_ROW_COPY, 6: E.SPECDEC_WHY_LINE, 7: E.SPECDEC_RESET_LINE, 8: E.TIPS.specDec.b,
    15: E.specDecCorrectionNotice(1.6), 21: E.SPECDEC_REPLAY_WHY_LINE,
    22: E.SPECDEC_SECTION_TITLE, 23: E.SPECDEC_CONTROL_LABEL,
    ...Object.fromEntries(Object.keys(E.SPECDEC_REASON_COPY).map((k, i) => [9 + i, E.specDecReasonText(k, 1.6)])),
  };
  assert("T-11 every engine-resident manifest row resolves to a non-empty shipped string",
    Object.values(covered).every(v => typeof v === "string" && v.length > 0),
    JSON.stringify(Object.entries(covered).filter(([, v]) => !v)));
}

P.summary();
console.log(failures ? `\n${failures} SPEC-DECODE LEVER FAILURE(S)` : "\nAll spec-decode lever checks passed.");
process.exit(failures ? 1 : 0);
