/* R3 Row 1 (design memo D-9, R2-review P1-3 re-specification): the FINAL-ANSWER–SCOPED
   vocabulary probe. The uncertainty-vocabulary prohibition is enforced ON THIS SURFACE
   ONLY (a repo-wide ban was proven unenforceable — "range" is legitimate vocabulary in
   exploration prefixes, cited claim ranges, and cost-lens copy). Scope = the engine
   finalAnswer() token set (the ONE formatter both transports render) + the MCP
   get_report "final-answer" artifact. Spans must use the pinned allowed grammar
   ("span across N declared alternatives"); value tokens must carry the policy-labeled
   identity INSIDE the token (the D-3b crop bar, node-level half — the DOM half rides
   the browser suite). Release-chained. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
function assert(name, cond, detail) {
  if (cond) { console.log("PASS  " + name); }
  else { failures++; console.log("FAIL  " + name + (detail !== undefined ? "  — " + detail : "")); }
}

/* The scanner — a pure function over a token bag so the negative fixtures can probe
   it directly (forged phrasing must trip it). */
const FORBIDDEN = [/\brange\b/i, /\binterval\b/i, /±/, /\bconfidence\b/i, /\buncertaint/i, /\bstd\.? ?dev/i, /\bC\.?I\.?\b/];
/* b9 M6 (FA memo §2.7, D-6c): the ONE exemption, and it is TYPED, BYTE-PINNED and NON-EXTENSIBLE.
   The tripwire exists to stop the page USING statistical-uncertainty vocabulary; a verbatim r4 §C2
   disclaimer of that vocabulary is the opposite act. The exemption holds only when ALL THREE of
   these are true at once, so it cannot drift into a different sentence, a different token, or an
   assertion: (1) the key is exactly `mustNotBeCalledLine`; (2) the token STARTS WITH the pinned
   negation frame — scanner-visible proof the vocabulary appears under negation; (3) everything
   after that frame is BYTE-EQUAL to the pinned §C2 verbatim. Three negative fixtures below prove
   each condition can fail. This is the most consequential guard relaxation in M6 and is flagged as
   such in the memo and the gate row. */
const FA_VOCAB_EXEMPT_KEY = "mustNotBeCalledLine";
export function faVocabularyExempt(key, text) {
  return key === FA_VOCAB_EXEMPT_KEY
    && typeof text === "string"
    && text.startsWith(E.FA_MUST_NOT_BE_CALLED_FRAME)
    && text.slice(E.FA_MUST_NOT_BE_CALLED_FRAME.length) === E.FA_MUST_NOT_BE_CALLED_VERBATIM;
}
export function faVocabularyViolations(tokenBag) {
  const out = [];
  for (const [key, text] of Object.entries(tokenBag)) {
    /* FA extension (memo v7 J-2): higherJustificationEntries is an ordered ARRAY of
       rendered strings — the sweep flattens string arrays so no entry escapes. */
    const items = Array.isArray(text) ? text.map((x, i) => [key + "[" + i + "]", x]) : [[key, text]];
    for (const [k, v] of items) {
      if (typeof v !== "string" || !v) continue;
      if (faVocabularyExempt(k, v)) continue;
      for (const re of FORBIDDEN) if (re.test(v)) out.push(k + " ~ " + re);
    }
  }
  return out;
}

const fa = E.finalAnswer();
const bag = { subject: fa.subject, identity: fa.identity, ...fa.tokens };

/* 1. the live surface is clean */
assert("FA surface: zero uncertainty-vocabulary hits across every emitted token",
  faVocabularyViolations(bag).length === 0, JSON.stringify(faVocabularyViolations(bag)));

/* 2. the pinned span grammar is used wherever a span is emitted */
for (const key of ["lensSpanLine", "trafficSpanLine"]) {
  if (fa.tokens[key]) assert(`FA span grammar [${key}]: "span across N declared" form`,
    /span across \d+ declared/i.test(fa.tokens[key]), fa.tokens[key]);
}
assert("FA band grammar: 'Sampled at three loaded-bytes policy points (no continuity implied)'",
  fa.tokens.bandLine.startsWith("Sampled at three loaded-bytes policy points (no continuity implied)"));

/* 3. value tokens carry the identity INSIDE the token (crop bar, node half) */
assert("FA planning-point token carries the policy-labeled identity inside the single token",
  /policy-labeled/.test(fa.tokens.planningPoint));
assert("FA band values each carry the identity inside the value token",
  (fa.tokens.bandLine.match(/policy-labeled scenario/g) || []).length >= 3);

/* 3-bis. the conservative-case label + the most-plausible token (memo v7 J-5) */
assert("FA planning line carries the conservative-case label + the re-minted estimand",
  // b9 M1: "market-rent" retired on the default case (r4 defect D4 — every default rent
  // sits at or below its public comparator, so the vector is low/committed planning, not market).
  fa.tokens.planningPointLine.startsWith("The conservative planning case, priced at low/committed planning rates:")
  // im-vet-six-repairs (2026-09-20), the vocabulary release edit: "tariff schedule" -> "list-price
  // schedule", the same object under style/VOCABULARY.md §1.2's canonical name.
  && /published list-price schedule under the reference cache\/batch\/discount mix/.test(fa.tokens.planningPointLine));
assert("FA most-plausible token is attributed, floor-form, adoption-labeled",
  /above 80%/.test(fa.tokens.mostPlausibleLine) && /adjudication of source reliability/.test(fa.tokens.mostPlausibleLine));

/* 4. the planning point's policy identity is stated and is NOT a band abscissa */
assert("FA planning point states its policy identity distinctly from the band abscissae",
  /at the fp8 loaded-bytes planning policy \(1 B\/param\)/.test(fa.tokens.planningPointLine)
  && !E.CAPACITY_POLICY_BAND.includes(1));

/* 5. fixed-membership contract visible when membership would differ at sampled points */
{
  const sensNonEmpty = (fa.membershipSensitivity || []).some(x => x.wouldEnter.length || x.wouldLeave.length);
  if (sensNonEmpty) assert("FA band discloses the fixed-membership rule + would-re-enter counterfactual separation",
    /membership FIXED at the planning-policy point/.test(fa.tokens.bandLine)
    && /NOT the sampled points above/.test(fa.tokens.bandLine));
}

/* 6. negative fixtures: forged uncertainty phrasing INSIDE the surface trips the scanner */
const FORGERIES = [
  { k: "planningPointLine", v: "≈35% ± 5% (95% confidence interval)" },
  { k: "lensSpanLine", v: "the uncertainty range spans 35–83%" },
  { k: "bandLine", v: "an interval of plausible values" },
];
for (const f of FORGERIES) {
  const forged = { ...bag, [f.k]: f.v };
  assert(`negative: forged "${f.v.slice(0, 30)}…" is caught`,
    faVocabularyViolations(forged).some(hit => hit.startsWith(f.k)));
}

/* 6-bis. V-2/V-3/V-4 — b9 M6 (FA memo §10.1) */
/* V-2: the exemption is exactly ONE key, byte-pinned, negation-framed */
assert("V-2 the §C2 disclaimer is the ONE exempt token, byte-pinned to the pinned verbatim",
  faVocabularyExempt("mustNotBeCalledLine", fa.tokens.mustNotBeCalledLine)
  && fa.tokens.mustNotBeCalledLine.startsWith(E.FA_MUST_NOT_BE_CALLED_FRAME)
  && fa.tokens.mustNotBeCalledLine.slice(E.FA_MUST_NOT_BE_CALLED_FRAME.length) === E.FA_MUST_NOT_BE_CALLED_VERBATIM,
  fa.tokens.mustNotBeCalledLine);
assert("V-2 NO other emitted token is exempt (the scanner still sweeps every other key)",
  Object.keys(bag).filter(k => faVocabularyExempt(k, bag[k])).length === 1);
/* V-3: the exemption MUST be able to fail — three negative fixtures, one per condition */
{
  const mutated = fa.tokens.mustNotBeCalledLine.replace("central Anthropic margin", "central Anthropic margins");
  assert("V-3(a) negative: ONE mutated byte in the pinned verbatim FAILS the exemption",
    !faVocabularyExempt("mustNotBeCalledLine", mutated)
    && faVocabularyViolations({ ...bag, mustNotBeCalledLine: mutated }).length > 0);
  assert("V-3(b) negative: the SAME string moved into any other token FAILS",
    !faVocabularyExempt("identityLine", fa.tokens.mustNotBeCalledLine)
    && faVocabularyViolations({ ...bag, identityLine: fa.tokens.mustNotBeCalledLine }).length > 0);
  const unframed = E.FA_MUST_NOT_BE_CALLED_VERBATIM;
  assert("V-3(c) negative: dropping the negation frame FAILS (the vocabulary would read as assertion)",
    !faVocabularyExempt("mustNotBeCalledLine", unframed)
    && faVocabularyViolations({ ...bag, mustNotBeCalledLine: unframed }).length > 0);
}
/* V-4: both reading tokens carry their basis INSIDE the token (crop-bar discipline, D-3b) */
assert("V-4 the reference reading token carries its basis inside the token",
  /public-evidence reference reading/.test(fa.tokens.referenceReadingLine)
  && /policy-labeled scenario/.test(fa.tokens.referenceReadingLine));
assert("V-4 the prior reading token carries its basis inside the token",
  /calculator's own default reading/.test(fa.tokens.priorReadingLine)
  && /policy-labeled scenario/.test(fa.tokens.priorReadingLine)
  && /scenario prior, not a measurement/.test(fa.tokens.priorReadingLine));
assert("V-4 the single value token (the crop unit) names its basis too",
  /public-evidence reference reading/.test(fa.tokens.planningPoint));

/* 7. the MCP twin renders from the SAME tokens (one formatter — byte-inclusion) */
{
  const { reportCatalog } = await import("../mcp-server/dist/reports.js");
  const entry = reportCatalog().get("final-answer");
  assert("MCP get_report 'final-answer' entry exists (live, engine-derived)", !!entry);
  const text = entry.read();
  /* T5 rec 5: `mostPlausibleLine` left THIS entry and got its own — see below. The site moved
     the analyst hypothesis out of THE ANSWER, and a connector still bundling it into the report
     titled "THE FINAL ANSWER" would contradict the page and the annex, where no consumer could
     see the discrepancy. The token is still asserted byte-identical; what changed is which entry
     must carry it, and that BOTH facts are now checked rather than one. */
  for (const key of ["identityLine", "planningPointLine", "bandLine", "invitationLine"])
    assert(`MCP twin includes tokens.${key} byte-identically`, text.includes(fa.tokens[key]));
  /* T5 rec 5, ROUND 4. The first cut of this only checked that the standalone hypothesis token
     was absent from `final-answer` — which a release-gate review called semantically vacuous, and
     was right to: the same claim was still reaching the consumer through the justifications
     header and entries, so the connector contradicted both the separate entry and the annex while
     this assertion passed. The check is now about the CLAIM, not one token: nothing a consumer
     receives from `final-answer` may carry the above-80 hypothesis or the page's ranking of it. */
  for (const key of ["mostPlausibleLine", "decompositionLine", "higherJustificationsHeader"])
    assert(`T5 rec 5: the FINAL ANSWER entry does NOT carry tokens.${key}`,
      !text.includes(fa.tokens[key]));
  fa.tokens.higherJustificationEntries.forEach((e, i) =>
    assert(`T5 rec 5: ...nor higherJustificationEntries[${i}]`, !text.includes(e)));
  assert("T5 rec 5: and nothing in the FINAL ANSWER entry states the above-80 hypothesis at all",
    !/above 80/i.test(text) && !/north of 80 percent/i.test(text)
    && !/adjudication of source reliability/i.test(text),
    text.slice(0, 200));
  {
    const ah = reportCatalog().get("analyst-hypothesis");
    assert("T5 rec 5: a separate 'analyst-hypothesis' entry exists on the connector", !!ah);
    const ahText = ah ? ah.read() : "";
    assert("T5 rec 5: ...and it carries every evidence-ranking token byte-identically",
      ["mostPlausibleLine", "decompositionLine", "higherJustificationsHeader"]
        .every(k => ahText.includes(fa.tokens[k]))
      && fa.tokens.higherJustificationEntries.every(e => ahText.includes(e)));
    assert("T5 rec 5: ...and its title does not present it as the calculator's answer",
      !!ah && /STRONGEST EXTERNAL ANALYST HYPOTHESIS/.test(ah.title) && !/FINAL ANSWER/.test(ah.title),
      ah && ah.title);
    /* ROUND 4b. The title was checked here from round 4 onward; the KIND was not, and the whole
       get_report envelope is keyed off the kind. So this entry shipped with a title saying
       "adopted judgment, not a calculator output" inside a sentence saying "LIVE engine-derived
       result surface" — both about the same entry, in the same reply. Seven rounds read the TEXT
       of the final-answer entry and none read the METADATA of this one.
       The tag and the prose it produces are both pinned now, and the two are asserted to AGREE,
       which is the property that was actually violated. */
    assert("T5 rec 5: ...and its KIND is not the calculator's answer class either",
      !!ah && ah.kind === "analyst-hypothesis", ah && ah.kind);
    {
      const G = require("../mcp-server/dist/tools/get_report.js");
      const out = G.handler({ id: "analyst-hypothesis" });
      const sc = out.structuredContent || {};
      const sentence = ((out.content || [])[0] || {}).text || "";
      assert("T5 rec 5: get_report reports that kind to the consumer", sc.kind === "analyst-hypothesis", sc.kind);
      assert("T5 rec 5: ...and does NOT call it a live engine-derived result surface",
        !/LIVE engine-derived result surface/i.test(sentence), sentence.slice(0, 220));
      assert("T5 rec 5: ...and does NOT call it an archived document either — it is neither",
        !/archived verbatim/i.test(sentence), sentence.slice(0, 220));
      assert("T5 rec 5: ...it says what it actually is",
        /ADOPTED ANALYST JUDGMENT/.test(sentence) && /NOT a calculator output/i.test(sentence),
        sentence.slice(0, 260));
      /* the title and the envelope must not contradict each other — the defect itself */
      const claimsNotCalculator = /not a calculator output/i.test(sc.title || "");
      const envelopeSaysEngineDerived = /LIVE engine-derived result surface/i.test(sentence)
        || /engine-derived policy-labeled estimates/i.test(JSON.stringify(out));
      assert("T5 rec 5: the title and the envelope AGREE — no entry says both 'not a calculator output' and 'engine-derived result surface'",
        !(claimsNotCalculator && envelopeSaysEngineDerived),
        JSON.stringify({ title: sc.title, sentence: sentence.slice(0, 200) }));
      /* non-vacuity: the final-answer entry SHOULD trip the engine-derived needle */
      const faOut = G.handler({ id: "final-answer" });
      const faSentence = ((faOut.content || [])[0] || {}).text || "";
      assert("T5 rec 5 non-vacuity: the needle DOES fire on the entry that legitimately is engine-derived",
        /LIVE engine-derived result surface/i.test(faSentence), faSentence.slice(0, 160));
    }
    /* Non-vacuity: the absence assertions above must be capable of failing. The same needles
       ARE present in the entry that is supposed to carry them. */
    assert("T5 rec 5 negative: those absence checks CAN fail — the needles are present next door",
      /above 80/i.test(ahText) && /north of 80 percent/i.test(ahText));
  }
  /* ══ ROUND 4b — THE CLASS, not the instance. ══════════════════════════════════════════════
     Everything above names `analyst-hypothesis` and `final-answer` by hand. That is a
     TWO-ENTRY LIST, and "a guard that enumerates the cases it knows and then asserts a
     universal" is the one-line summary of all nine P0s the guard rounds found in this leg.
     Closing the instance and leaving the class open is precisely how a `kind: "final-answer"`
     tag on an evidence-ranking entry survived seven review rounds: every round read the TEXT
     of the entry it already suspected, and no round swept the METADATA of the other fifty-one.

     So this sweeps the WHOLE catalog — discovered from the catalog itself, never listed here —
     through the REAL get_report handler, and asserts four properties of every entry:

       1. no entry carrying the evidence ranking is tagged as the calculator's answer;
       2. no entry's title and envelope contradict each other;
       3. an archived kind is described as archived and a live kind is not — BOTH directions,
          written as the complement of the archived set, so a sixth kind added tomorrow lands
          on the live side and trips this check rather than silently inheriting the archive
          wording (which is the exact fall-through that produced the round-4b defect);
       4. the kind the consumer is told is the kind the catalog holds.

     The predicate is a pure function over rows so the negative fixtures below can drive it
     directly — the same idiom faVocabularyViolations() uses at the top of this file, and for
     the same reason: a guard nobody has watched fail is a guard nobody has tested. */
  {
    const G = require("../mcp-server/dist/tools/get_report.js");
    const catalog = reportCatalog();

    /* The ranking tokens come from the ENGINE, not from a phrase list. Whatever entry carries
       these IS an evidence-ranking entry, whatever it is titled — which is the property rec 5
       is about ("separate evidence ranking from the calculator's answer hierarchy"), and it is
       not a wording question, so no blacklist is involved. Round 7 already proved a blacklist
       over natural language cannot be completed. */
    const rankingTokens = [fa.tokens.mostPlausibleLine, fa.tokens.decompositionLine,
      fa.tokens.higherJustificationsHeader, ...fa.tokens.higherJustificationEntries].filter(Boolean);

    /* The kinds that ARE archived documents. Deliberately written as a SET whose complement is
       "live", not as a list of live kinds: an unlisted new kind must fail, not pass. */
    const ARCHIVED_KINDS = new Set(["annex-doc", "front-page", "report-section"]);

    /** Pure predicate over rows: {id, kind, text, title, sentence, reportedKind}. */
    function reportKindViolations(rows) {
      const out = [];
      for (const r of rows) {
        if (r.kind === "final-answer" && rankingTokens.some(t => t && r.text.includes(t)))
          out.push(`${r.id}: carries the evidence ranking under the calculator's answer kind`);
        if (/not a calculator output/i.test(r.title) && /LIVE engine-derived result surface/i.test(r.sentence))
          out.push(`${r.id}: its title says "not a calculator output" and its envelope says "LIVE engine-derived result surface"`);
        if (ARCHIVED_KINDS.has(r.kind) !== /archived verbatim/i.test(r.sentence))
          out.push(`${r.id}: kind "${r.kind}" and the envelope disagree about whether it is archived`);
        if (r.reportedKind !== r.kind)
          out.push(`${r.id}: get_report told the consumer kind "${r.reportedKind}", the catalog holds "${r.kind}"`);
        /* ROUND 4b, the MACHINE half. Fixing the leading sentence left `registryEmitMeta` still
           called with a hardcoded "verbatim archive fetch", so the emitted claim's estimand told
           an LLM consumer that the live calculator answer and the adopted analyst judgment were
           both archive fetches — the same contradiction, one layer down, on the layer a machine
           parses rather than reads. Checked in BOTH directions, like the prose. */
        if (ARCHIVED_KINDS.has(r.kind) !== /verbatim archive fetch/i.test(r.estimand))
          out.push(`${r.id}: kind "${r.kind}" and the MACHINE claim's estimand disagree about whether it is archived`);
        /* And the two layers must agree with EACH OTHER. This is the assertion that would have
           failed on the round-4b fix as shipped: prose corrected, machine block not. A guard that
           checks each layer against the kind but never the layers against each other passes the
           moment someone repairs the surface they happened to be looking at. */
        if (/archived verbatim/i.test(r.sentence) !== /verbatim archive fetch/i.test(r.estimand))
          out.push(`${r.id}: the prose envelope and the MACHINE claim disagree about whether it is archived`);
      }
      return out;
    }

    const rows = [];
    for (const [id, entry] of catalog) {
      const out = G.handler({ id });
      const sc = out.structuredContent || {};
      rows.push({
        id, kind: entry.kind, text: entry.read(),
        title: sc.title || entry.title || "",
        sentence: ((out.content || [])[0] || {}).text || "",
        reportedKind: sc.kind,
        estimand: ((sc.claims || [])[0] || {}).estimand || "",
      });
    }

    /* Scope proof first: a sweep over an empty or truncated catalog proves nothing, and a
       ranking-token set that came back empty would make check 1 unfalsifiable. */
    assert("T5 rec 5 CLASS: the sweep walked the whole catalog, not a sample",
      rows.length === catalog.size && rows.length >= 40, `${rows.length} of ${catalog.size}`);
    assert("T5 rec 5 CLASS: the ranking-token set is non-empty, so check 1 can fail",
      rankingTokens.length >= 4, String(rankingTokens.length));
    assert("T5 rec 5 CLASS: every declared kind is actually present in the sweep",
      new Set(rows.map(r => r.kind)).size >= 5,
      JSON.stringify([...new Set(rows.map(r => r.kind))]));

    assert("T5 rec 5 CLASS: NO entry in the catalog violates any of the four kind/envelope properties",
      reportKindViolations(rows).length === 0, JSON.stringify(reportKindViolations(rows)));

    /* Exactly one entry may carry the ranking, and it must not be the answer. Stated as a
       count so a SECOND ranking-carrying entry appearing anywhere is a failure, not a pass. */
    const carriers = rows.filter(r => rankingTokens.some(t => t && r.text.includes(t)));
    assert("T5 rec 5 CLASS: exactly one entry carries the evidence ranking, and its kind is its own",
      carriers.length === 1 && carriers[0].id === "analyst-hypothesis"
      && carriers[0].kind === "analyst-hypothesis",
      JSON.stringify(carriers.map(c => c.id + ":" + c.kind)));

    /* ── NEGATIVE FIXTURES. Each reproduces a real defect and must be CAUGHT. The forged rows
       are built from real bytes — the ranking entry's own title and text, and the sentence the
       real handler emits for the kind being forged — so these are the responses the connector
       would actually have returned, not invented strings. ── */
    const ah = rows.find(r => r.id === "analyst-hypothesis");
    const faRow = rows.find(r => r.id === "final-answer");
    const annex = rows.find(r => r.kind === "annex-doc");

    assert("T5 rec 5 CLASS negative: the ACTUAL round-4b defect (ranking entry tagged final-answer) is caught",
      reportKindViolations([{ ...ah, kind: "final-answer", reportedKind: "final-answer",
        sentence: faRow.sentence }]).length >= 2);
    assert("T5 rec 5 CLASS negative: a SECOND, differently-named entry with the same defect is caught too",
      reportKindViolations([{ ...ah, id: "some-future-entry", kind: "final-answer",
        reportedKind: "final-answer", sentence: faRow.sentence }]).length >= 2);
    assert("T5 rec 5 CLASS negative: a live entry described as an archived document is caught",
      reportKindViolations([{ ...faRow, sentence: annex.sentence }]).length >= 1);
    assert("T5 rec 5 CLASS negative: an archived entry described as a live engine render is caught",
      reportKindViolations([{ ...annex, sentence: faRow.sentence }]).length >= 1);
    assert("T5 rec 5 CLASS negative: a NEW sixth kind falling through to the archive wording is caught",
      reportKindViolations([{ ...annex, kind: "some-new-kind", reportedKind: "some-new-kind" }]).length >= 1);
    assert("T5 rec 5 CLASS negative: get_report reporting a kind the catalog does not hold is caught",
      reportKindViolations([{ ...ah, reportedKind: "final-answer" }]).length >= 1);
    /* the round-4b review's own finding, reproduced: prose fixed, machine block still saying
       "verbatim archive fetch" on a live entry. The by-name assertions above ALL pass on this. */
    assert("T5 rec 5 CLASS negative: a live entry whose MACHINE estimand still calls it an archive fetch is caught",
      reportKindViolations([{ ...ah, estimand: annex.estimand }]).length >= 2);
    assert("T5 rec 5 CLASS negative: ...and so is the same defect on the calculator's own answer",
      reportKindViolations([{ ...faRow, estimand: annex.estimand }]).length >= 2);
    assert("T5 rec 5 CLASS negative: an archived entry whose MACHINE estimand claims a live render is caught",
      reportKindViolations([{ ...annex, estimand: ah.estimand }]).length >= 2);
    assert("T5 rec 5 CLASS: every entry actually HAS a machine estimand to check (else the above is vacuous)",
      rows.every(r => r.estimand.length > 20), JSON.stringify(rows.filter(r => r.estimand.length <= 20).map(r => r.id)));

    /* Round 4b also observed that the analyst-hypothesis reply "binds a policy-scenario result
       claim and 51.17863577679238% to the evidence-ranking presentation". The claim is there by
       design — the Variant B envelope returns the central estimate alongside EVERY response, so a
       figure can never be decontextualised — and its estimand now says truthfully which kind of
       response carried it. What would make it genuinely misleading is if this entry's claim ever
       became a DIFFERENT value from every other entry's, because a consumer could then read it as
       the entry's own figure — and the analyst hypothesis's own figure is above 80%, not 51%.
       So the invariant is pinned: one subject, one value, across the whole catalog. The receipt
       is uniform; only the estimand and the presentation vary, which is what they are for. */
    {
      const claimOf = (id) => (((G.handler({ id }).structuredContent || {}).claims || [])[0] || {});
      const trees = new Set(), subjects = new Set();
      for (const r of rows) { const c = claimOf(r.id); trees.add(JSON.stringify(c.tree)); subjects.add(c.subject); }
      assert("T5 rec 5 CLASS: every entry's machine claim carries the SAME flagship value — no entry's claim is its own figure",
        trees.size === 1, `${trees.size} distinct claim values across ${rows.length} entries`);
      assert("T5 rec 5 CLASS: ...and the same subject, so it reads as a receipt and not as that entry's result",
        subjects.size === 1, JSON.stringify([...subjects]));
      /* non-vacuity: the value must actually be a finite number, or "all the same" is trivially
         satisfied by all-of-them-missing. */
      const leaf = (claimOf("analyst-hypothesis").tree || {}).nodes || [];
      assert("T5 rec 5 CLASS: ...and that shared value is a real finite number",
        leaf.length === 1 && Number.isFinite(leaf[0].value), JSON.stringify(leaf));
    }
    /* and the control on the controls: the real rows, unmodified, must produce NOTHING, or
       every negative above would be passing on a predicate that fires on everything. */
    assert("T5 rec 5 CLASS negative-control: the predicate is silent on the real catalog",
      reportKindViolations(rows).length === 0);
  }
  /* The entries moved to the analyst-hypothesis entry with the rest of the evidence ranking
     (round 4); their byte-identity is asserted there instead, above. */
  /* b9 M6 (§2.7 D-6c, transport half): the MCP twin renders every FA token joined into ONE blob, so
     a KEY-scoped exemption cannot reach it. The transport analogue of the two-node DOM inventory is
     an OCCURRENCE inventory: excise exactly the pinned frame+verbatim string — asserted to appear
     EXACTLY ONCE — and sweep everything that remains. The exemption therefore stays byte-pinned and
     non-extensible here too: a second occurrence, or one altered byte, falls through to the sweep. */
  {
    const pinned = E.FA_MUST_NOT_BE_CALLED_FRAME + E.FA_MUST_NOT_BE_CALLED_VERBATIM;
    const occurrences = text.split(pinned).length - 1;
    assert("MCP twin: the §C2 disclaimer appears EXACTLY ONCE, byte-pinned", occurrences === 1, String(occurrences));
    const swept = text.split(pinned).join(" ");
    assert("MCP twin: zero uncertainty-vocabulary hits outside the ONE pinned disclaimer",
      faVocabularyViolations({ text: swept }).length === 0,
      JSON.stringify(faVocabularyViolations({ text: swept })));
    assert("MCP twin negative: a SECOND copy of the disclaimer is NOT exempt (the inventory is closed)",
      (() => { const two = text + "\n\n" + pinned;
        return (two.split(pinned).length - 1) !== 1; })());
    assert("MCP twin negative: one mutated byte in the pinned string falls through to the sweep",
      faVocabularyViolations({ text: text.replace(pinned, pinned.replace("a confidence interval", "a confidence  interval")).split(pinned).join(" ") }).length > 0);
  }
}

/* 8. D-9 bind: the block's values ignore live scenario state (thesis baseline only) */
{
  const before = fa.tokens.planningPoint;
  const again = E.finalAnswer(); // no state argument EXISTS — the bind is structural
  assert("FA values are state-independent by construction (no live-state parameter; recompute identical)",
    again.tokens.planningPoint === before);
}

console.log(failures ? `\n${failures} FINAL-ANSWER-VOCABULARY FAILURE(S)` : "\nALL FINAL-ANSWER VOCABULARY PROBES PASS");
process.exit(failures ? 1 : 0);
