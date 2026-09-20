/* b9 M6 (research/b9-m6-fa-memo.md v7.3, §10.3): the FINAL-ANSWER rework suite.
   T-1..T-11 — the D-6 five-part surface, the two labeled readings, the byte-pinned block copy, the
   D-7 analyst-gap exec summary, the D-1 legacy-retirement structural properties, the guard
   extension, and the `executive-summary` emitter class.
   Release-chained (`npm test`, `test:served-node`, the sync-site-tests twin list) — a new test file
   nobody adds to those closed enumerations simply never runs. */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { provenance } from "./provenance-inputs.mjs";
import { MODE as PROVENANCE_MODE } from "./provenance-inputs.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const C = require("../site/engine-contracts-v22.js");
const HERE = dirname(fileURLToPath(import.meta.url));
/* The repo root is found by walking up to package.json rather than by counting "..", so this file
   resolves identically from tests/ and from its site/tests/ served twin (site/ has no package.json,
   so the walk is unambiguous). The twin transform rewrites relative specifiers, not path joins. */
const ROOT = (() => { let d = HERE; while (!existsSync(join(d, "package.json"))) { const up = dirname(d); if (up === d) throw new Error("repo root not found"); d = up; } return d; })();

let failures = 0;
function assert(name, cond, detail) {
  if (cond) console.log("PASS  " + name);
  else { failures++; console.log("FAIL  " + name + (detail !== undefined ? "  — " + detail : "")); }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
/* The §2.9 / §17.2 / §17.4 provenance checks read the M6 design memo, which is private and
   absent from a reconstructed public stage. They self-skip there, by count and under a labeled
   banner; in the private tree they are hard-guarded to run. See provenance-inputs.mjs. */
const P = provenance("fa-m6-b9", assert);

const fa = E.finalAnswer();
const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const stateWith = (over) => Object.assign(E.applyPresetSettings(opus, median, E.FLAGSHIP_SCOPE.traffic), over || {});
const pctOf = (st) => E.workload(st, undefined, E.scenarioContext(st)).margin * 100;

/* ================= T-1 the five-part surface ================= */
{
  const ordered = [
    ["1 public-evidence repaired reference", fa.tokens.referenceReadingLine, /public-evidence reference reading/],
    ["2 ratified-prior default", fa.tokens.priorReadingLine, /calculator's own default reading/],
    /* T5 rec 5: the adopted-analyst reading is NO LONGER a block of THE ANSWER. The token still
       exists and is still asserted — below, at its new home in #fa-higher — but it is out of the
       calculator's answer hierarchy, which is what the recommendation required. The remaining
       parts renumber 1,2,3,4. */
    ["3 no verified central comparator", fa.tokens.identityLine, /identifies no public, verified central comparator/],
    ["4 the bridge", fa.tokens.bridgeLine, /^How the readings relate\./],
  ];
  for (const [label, tok, re] of ordered)
    assert("T-1 block " + label + " is present and carries its required label", typeof tok === "string" && re.test(tok), String(tok).slice(0, 120));
  assert("T-1 the supporting §C2 blocks ride block 1 (label, must-not-be-called, convergence)",
    /run B §C2, 2026-07-25/.test(fa.tokens.c2LabelLine)
    && /must not be called/.test(fa.tokens.mustNotBeCalledLine)
    && /METHODS WITHIN ONE REVIEW/.test(fa.tokens.convergenceLine));
  /* The five blocks render in the memo's order on the page, top to bottom. Asserted on the DOM
     ORDER in index.html, because "in this order" is a property of the surface, not of the object.
     The array below MUST name all five numbered parts. The first cut named only six nodes and
     omitted `fa-most-plausible` (block 3) and `fa-identity` (block 4) — so it passed while both sat
     in the wrong place (block 4 above block 1, block 3 below block 5). An ordering assertion that
     does not include every ordered element is an assertion that cannot fail for the elements it
     leaves out; the closure below is what makes it bind. */
  const html = readFileSync(join(ROOT, "site/index.html"), "utf8");
  const idx = (id) => html.indexOf('id="' + id + '"');
  const FIVE_PARTS = [
    ["1 reference", "fa-reference-reading"], ["1 §C2 label", "fa-c2-label"],
    ["1 must-not-be-called", "fa-must-not-be-called"], ["1 convergence", "fa-convergence"],
    ["2 prior", "fa-prior-reading"],
    ["3 no-comparator", "fa-identity"], ["4 bridge", "fa-bridge"],
  ];
  const order = FIVE_PARTS.map(([, id]) => idx(id));
  assert("T-1 the blocks appear in the memo's order on the page and all exist",
    order.every(i => i > 0) && order.every((v, i, a) => i === 0 || a[i - 1] < v),
    JSON.stringify(FIVE_PARTS.map(([label, id], i) => [label, id, order[i]])));
  assert("T-1 the ordering assertion covers EVERY numbered part (blocks 1-4, none omitted)",
    ["1", "2", "3", "4"].every(n => FIVE_PARTS.some(([label]) => label.startsWith(n))),
    JSON.stringify(FIVE_PARTS.map(([l]) => l)));
  assert("T-1 negative: the order check TRIPS on a swapped pair (it can fail)",
    (() => { const swapped = [...order]; [swapped[4], swapped[6]] = [swapped[6], swapped[4]];
      return !swapped.every((v, i, a) => i === 0 || a[i - 1] < v); })());
  /* ---- T5 rec 5: the RELOCATION itself, asserted positionally ----------------------------
     The reviewer's ask was "Move … out of THE ANSWER … separate evidence ranking from the
     calculator's answer hierarchy". Deleting the node from the ordering array above would have
     satisfied the ARRAY while leaving the node free to sit anywhere — which is the same
     omission this test's own header warns about. So the node is still bound, to its new place:
     inside #fa-higher, after every ANSWER block, and leading the evidence-ranking stack. */
  {
    const iMP = idx("fa-most-plausible");
    assert("T5 rec 5: the analyst-hypothesis node still exists on the page", iMP > 0, String(iMP));
    /* ANCESTRY, not document order. The first cut of this assertion checked only that the node
       appeared after #fa-bridge, and passed while the node was still a descendant of
       <section id="final-answer"> — inside #fa-higher, inside #fa-full. "After something inside
       THE ANSWER" is not "out of THE ANSWER", and an independent review caught exactly that.
       Document offsets cannot express containment, so this walks the tag stack. */
    /* HTML CHARACTER REFERENCES. `id="final&#45;answer"` is valid HTML whose DOM id is
       `final-answer`; a release-gate review used exactly that to move the analyst section inside
       the answer while the guard reported it outside. Three rounds, three escapes — single
       quotes, uppercase attribute name, now entities — which is the argument for decoding what
       the browser decodes rather than adding one more special case each time. Numeric (decimal
       and hex) and the five named refs that can appear in an attribute value. */
    /* ROUND 5 defeated the previous cut with `id="final&#45answer"` — a numeric reference with NO
       trailing semicolon. Per the WHATWG tokenizer, the decimal/hex character-reference states
       consume digits, find no `;`, flag a missing-semicolon PARSE ERROR, and RESOLVE the
       reference regardless; only NAMED references get the ambiguous-ampersand rule that keeps
       `&amp` literal before an alphanumeric. So the semicolon is optional on the numeric forms
       and required on the named ones — which is not a shortcut, it is the spec's own asymmetry.
       The character classes stay GREEDY for the same reason: a browser reading `&#x2Danswer`
       consumes `2Da` as hex and yields U+02DA, so a decoder that stopped early would report a
       containment no real parser sees. Both directions are asserted below. */
    const decodeRefs = (s) => s == null ? null : s
      .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&(lt|gt|quot|apos|amp);/g,
        (_, n) => ({ lt: "<", gt: ">", quot: '"', amp: "&", apos: "'" })[n]);
    /* ROUND 6 defeated the walk a FIFTH time, with an HTML RAW-TEXT ELEMENT:

         <section id="final-answer"><script>"</section>"</script><div id="fa-most-plausible"></div></section>

       A browser tokenizing `<script>` enters the script-data state, where `</section>` is TEXT —
       so the section never closes and the node is genuinely inside it. This walker popped the
       section and reported the node outside; `html5lib` reported ancestry ["final-answer"], and
       the disagreement is the bug. Five rounds, five escapes, every one of them a place where a
       hand-rolled scanner and a real tokenizer part company.

       So contents of the four raw-text-ish elements are BLANKED before the walk — script and
       style (raw text) and textarea and title (escapable raw text) — preserving length so
       nothing else shifts, and comments are blanked in the SAME pass rather than pre-stripped,
       because a pre-strip could eat a `-->` that was itself script text. An UNCLOSED raw-text
       element blanks to end of document, which is what a browser does with the rest of the file. */
    const sanitizeForWalk = (src) => {
      const blank = (t) => t.replace(/[^\n]/g, " ");
      let out = "", last = 0, m;
      /* one linear pass: comments and raw-text bodies are blanked in the SAME scan, so a `-->`
         that is really script text cannot truncate the document and an already-closed <script>
         cannot be mistaken for an unclosed one. */
      /* ROUND 7: the four raw-text elements were not the whole set. `<iframe>`, `<noembed>`,
         `<noframes>` and `<xmp>` are also parsed as raw/escapable text in the HTML syntax, and a
         `</section>` inside any of them is TEXT — differential-tested against html5lib, which
         reported containment while this walker did not. `plaintext` is included because it
         consumes the REST of the document by definition. */
      const re = /<!--[\s\S]*?-->|<!--|<(script|style|textarea|title|iframe|noembed|noframes|noscript|xmp|plaintext)((?:"[^"]*"|'[^']*'|[^>"'])*?)>/gi;
      while ((m = re.exec(src))) {
        out += src.slice(last, m.index);
        if (!m[1]) {                                   // a comment
          if (m[0] === "<!--") { out += blank(src.slice(m.index)); return out; }   // unterminated
          out += blank(m[0]); last = re.lastIndex; continue;
        }
        out += m[0];                                   // keep the open tag itself
        const rest = src.slice(re.lastIndex);
        const cm = new RegExp("</" + m[1] + "\\s*>", "i").exec(rest);
        if (!cm) { out += blank(rest); return out; }    // unclosed: the rest is text, as in a browser
        out += blank(rest.slice(0, cm.index)) + cm[0];
        last = re.lastIndex + cm.index + cm[0].length;
        re.lastIndex = last;
      }
      return out + src.slice(last);
    };
    const ancestryOfIn = (source, targetId) => {
      const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"]);
      const stack = [];
      /* Comments MUST be stripped before the walk. The relocation note in index.html quotes the
         markup it is talking about — the literal text `<section id="final-answer">` appears
         inside a comment — and a raw scan reads that as an unclosed open tag, leaving
         "final-answer" on the stack forever and reporting containment that does not exist.
         (That is not hypothetical: this walk reported exactly that before the strip was added,
         disagreeing with a real HTML parser, and the comment was the reason.) */
      const src = sanitizeForWalk(source);
      const re = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
      let m;
      while ((m = re.exec(src))) {
        const [, closing, tagRaw, attrs, selfClose] = m;
        const tag = tagRaw.toLowerCase();
        if (tag === "!--" ) continue;
        /* Both quote styles, and bare ids. The first cut matched only double quotes, and the
           independent review broke it in one line: rewrite the outer element as
           id='final-answer' and the walk reports no containment while the node is genuinely
           inside it — a guard that a single character defeats. HTML permits all three forms,
           so the parser must too. */
        /* Case-INSENSITIVE on the attribute name too. HTML attribute names are
           case-insensitive, and a third review defeated the previous cut with `ID='final-answer'`
           — the walk reported the node outside a section it was genuinely inside, and every
           positive assertion passed. Two rounds, two one-character escapes (single quotes, then
           uppercase): the lesson is that a hand-rolled parser guarding a release claim has to be
           tested against the forms HTML actually permits, not the forms this file happens to
           use today. */
        const idm = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
        const id = decodeRefs(idm ? (idm[1] ?? idm[2] ?? idm[3] ?? null) : null);
        if (!closing) {
          if (id === targetId) return stack.slice();
          if (VOID.has(tag) || selfClose) continue;
          stack.push({ tag, id });
        } else {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tag === tag) { stack.length = i; break; }
          }
        }
      }
      return null;
    };
    const ancestryOf = (targetId) => ancestryOfIn(html, targetId);
    const anc = ancestryOf("fa-most-plausible");
    const ancIds = (anc || []).map(n => n.id).filter(Boolean);
    assert("T5 rec 5: the ancestry walk located the node (the check is live, not silently skipped)",
      Array.isArray(anc), String(anc));
    assert("T5 rec 5: it is NOT a descendant of <section id=\"final-answer\"> — genuinely out of THE ANSWER",
      !ancIds.includes("final-answer"), JSON.stringify(ancIds));
    assert("T5 rec 5: nor of #fa-full or #fa-higher, which live inside it",
      !ancIds.includes("fa-full") && !ancIds.includes("fa-higher"), JSON.stringify(ancIds));
    assert("T5 rec 5: it sits in its own labelled analyst-hypothesis section",
      ancIds.includes("fa-analyst-hypothesis"), JSON.stringify(ancIds));
    /* The walk must be able to FAIL, or the three assertions above prove nothing. A node that
       IS inside THE ANSWER must come back with it in its ancestry. */
    const ancBridge = (ancestryOf("fa-bridge") || []).map(n => n.id).filter(Boolean);
    assert("T5 rec 5 negative: the ancestry walk CAN report containment — #fa-bridge is still inside THE ANSWER",
      ancBridge.includes("final-answer") && ancBridge.includes("fa-full"), JSON.stringify(ancBridge));
    /* And it must survive the exact tamper the review used to defeat the first cut: the same
       markup with single-quoted ids. If the walk is quote-sensitive it reports no containment
       here and the assertion fails, which is the point. */
    {
      /* BOTH escapes a review has used against this walk: single-quoted values AND an uppercase
         attribute name. If either defeats it, the containment assertion below fails. */
      const singleQuoted = html.replace(/id="([^"]*)"/g, "ID='$1'");
      const savedHtml = html;
      /* FOUND BY REVIEW: this used to inline a SECOND COPY of the walker and tamper-test THAT.
         A negative test that exercises a copy proves nothing about the implementation — the copy
         could be fixed while the real walk stayed broken, and it silently would not track any
         later change. It calls the real `ancestryOfIn` now, like every other tamper below. */
      const ids2 = (ancestryOfIn(singleQuoted, "fa-bridge") || []).map(n => n.id).filter(Boolean);
      assert("T5 rec 5 negative: the walk is not defeated by single-quoted OR uppercase ids (both review tampers)",
        ids2.includes("final-answer") && ids2.includes("fa-full"), JSON.stringify(ids2));
      /* THE THIRD TAMPER, from the release-gate review: an HTML character reference. Encode the
         hyphen in the enclosing section's id and re-run the real walk — it must still see the
         containment, because the browser would. Encoded three ways so a decoder that handles one
         numeric form and not the other cannot pass. */
      /* THE FOURTH TAMPER, from round 5: a numeric reference with NO TRAILING SEMICOLON.
         `id="final&#45answer"` has DOM id `final-answer` — the WHATWG tokenizer's numeric
         character reference states consume the digits, find no `;`, flag a
         missing-semicolon-after-character-reference PARSE ERROR, and resolve the reference
         anyway. (The ambiguous-ampersand rule that keeps `&amp` literal before an alphanumeric
         applies to NAMED references only, which is why named refs below still require the
         semicolon and numeric ones must not.) Four rounds, four one-character escapes. */
      for (const [label, enc] of [["decimal", "final&#45;answer"], ["hex", "final&#x2D;answer"],
                                  ["mixed", "&#102;inal&#45;answer"],
                                  ["decimal, NO semicolon", "final&#45answer"],
                                  ["mixed, NO semicolon", "&#102inal&#45answer"]]) {
        const tampered = html.replace(/id="final-answer"/g, 'id="' + enc + '"');
        const ids3 = (ancestryOfIn(tampered, "fa-bridge") || []).map(n => n.id).filter(Boolean);
        assert("T5 rec 5 negative: the walk decodes " + label + " character references (" + enc + ")",
          ids3.includes("final-answer"), JSON.stringify({ enc, ids3 }));
      }
      /* CONTROL — the decoder must match the browser, not merely strip semicolons. Hex digits are
         [0-9a-f], so a browser reading `final&#x2Danswer` consumes `2Da` GREEDILY and yields
         U+02DA, i.e. `final\u02DAnswer` — NOT `final-answer`. A decoder that lazily made `;`
         optional without keeping the character class greedy would "decode" this to the target id
         and report containment that a real parser never sees. That over-decode is a false
         POSITIVE in a release guard, so it is asserted against. */
      {
        const enc = "final&#x2Danswer";
        const tampered = html.replace(/id="final-answer"/g, 'id="' + enc + '"');
        const ids4 = (ancestryOfIn(tampered, "fa-bridge") || []).map(n => n.id).filter(Boolean);
        assert("T5 rec 5 control: hex refs stay GREEDY — final&#x2Danswer is NOT final-answer, as in a browser",
          !ids4.includes("final-answer"), JSON.stringify({ enc, decoded: decodeRefs(enc), ids4 }));
        assert("T5 rec 5 control: ...and it decodes to what the tokenizer produces",
          decodeRefs(enc) === "final\u02DAnswer", JSON.stringify(decodeRefs(enc)));
      }
      /* ROUND 6's FIFTH ESCAPE — an HTML raw-text element. A browser reading `</section>` inside
         <script> treats it as TEXT, so the section stays open and the node really is inside it.
         Asserted for all four raw-text-ish elements, plus the unclosed case, plus a control
         proving the blanking does not blind the walk to markup that is genuinely outside. */
      /* The anchor is the REAL element, not the bare `<section id="final-answer">` — that spelling
         appears ONLY inside the relocation comment, and injecting there produces a test that the
         comment-blanking makes vacuous. (It did, on the first cut of these assertions.) */
      const FA_OPEN = '<section class="final-answer" id="final-answer" aria-label="The final answer">';
      assert("T5 rec 5 negative: the raw-text tampers anchor on the REAL final-answer element",
        html.includes(FA_OPEN), "the final-answer opening tag changed — these tampers would be vacuous");
      /* The set is asserted against the SPEC list below, so the next element nobody thought of
         fails the enumeration rather than becoming a sixth escape. */
      const RAW_TEXT_ELEMENTS = ["script", "style", "textarea", "title", "iframe", "noembed",
        "noframes", "noscript", "xmp", "plaintext"];
      /* FOUND BY REVIEW: the first cut of this assertion checked that every element in
         RAW_TEXT_ELEMENTS is blanked by a sanitizer whose set IS RAW_TEXT_ELEMENTS — a list
         compared to a copy of itself, which cannot detect the one thing that matters, an element
         MISSING from both. It could never have found the escapes that actually happened.

         Completeness against the HTML spec cannot be proven inside this file, and after six
         rounds of escapes the honest position is that this walk is NOT the authority. The
         authoritative containment check now runs in a REAL BROWSER
         (tests/fa-explain-cdp.test.mjs, "T5 rec 5 (DOM)"), where Element.contains() decides it and
         no enumeration is needed. What remains here is a fast static pre-check, and it is
         labelled as one. The two assertions below are what a pre-check can honestly claim: each
         listed element IS blanked, and an element that is NOT raw text is NOT blanked — so the
         sanitizer is at least doing the thing it says, in both directions. */
      assert("T5 rec 5 pre-check: every element in the raw-text set is blanked by the sanitizer",
        RAW_TEXT_ELEMENTS.every(t => sanitizeForWalk(`<${t}>"</section>"</${t}>`).includes(" ")),
        JSON.stringify(RAW_TEXT_ELEMENTS.filter(t => !sanitizeForWalk(`<${t}>"</section>"</${t}>`).includes(" "))));
      assert("T5 rec 5 pre-check: an element that is NOT raw text is NOT blanked (the sanitizer is not blanking everything)",
        ["div", "span", "section", "p"].every(t => sanitizeForWalk(`<${t}>KEEPME</${t}>`).includes("KEEPME")),
        "the sanitizer blanked ordinary element content, which would blind the walk");
      for (const tag of RAW_TEXT_ELEMENTS.filter(t => t !== "plaintext")) {
        const tampered = html.replace(FA_OPEN, `${FA_OPEN}<${tag}>"</section>"</${tag}>`);
        const ids5 = (ancestryOfIn(tampered, "fa-bridge") || []).map(n => n.id).filter(Boolean);
        assert(`T5 rec 5 negative: a </section> inside <${tag}> is TEXT — the walk must still see containment`,
          ids5.includes("final-answer"), JSON.stringify({ tag, ids5 }));
      }
      {
        const attack = html.replace(FA_OPEN, `${FA_OPEN}<script>"</section>"</script>`);
        const idsR6 = (ancestryOfIn(attack, "fa-most-plausible") || []).map(n => n.id).filter(Boolean);
        assert("T5 rec 5 negative: round 6's exact raw-text attack does not move #fa-most-plausible out of the answer",
          !idsR6.includes("final-answer"), JSON.stringify(idsR6));
        /* ROUND 7 P2: the first cut of this asserted that the ancestry list did not contain the
           TARGET'S OWN id — but ancestryOfIn returns ANCESTORS, never the target, so it passed on
           the broken walker too. A test that cannot fail is not a test. What actually
           distinguishes the behaviours: with an unclosed <script>, a browser treats the rest of
           the document as script text, so the target is not locatable at all and the walk must
           return null — whereas the unsanitized walker happily finds it. */
        const unclosed = html.replace(FA_OPEN, `${FA_OPEN}<script>"</section>"`);
        const ancU = ancestryOfIn(unclosed, "fa-bridge");
        assert("T5 rec 5 negative: after an UNCLOSED raw-text element the rest of the document is TEXT — the node is not locatable at all",
          ancU === null, JSON.stringify(ancU && ancU.map(n => n.id)));
      }
      {
        /* CONTROL: blanking raw text must not make the walk blind. #fa-bridge is genuinely inside
           THE ANSWER on the untampered page and must still be reported so. */
        const idsC = (ancestryOfIn(html, "fa-bridge") || []).map(n => n.id).filter(Boolean);
        assert("T5 rec 5 control: sanitizing raw text does not blind the walk on the real page",
          idsC.includes("final-answer") && idsC.includes("fa-full"), JSON.stringify(idsC));
      }
      void savedHtml;

      /* ============================================================================
         T5 rec 5, THE CLAIM CHECK — round 5's real finding.

         The assertions above check the ancestry of ONE node, #fa-most-plausible. Round 5:
         "the test only checks the ancestry of #fa-most-plausible, so it misses other ranking
         statements injected into the answer" — and one was. `higherJustificationEntries` put
         "(the strongest external analyst hypothesis)" into #fa-higher-entries, which is inside
         #fa-higher → #fa-full → <section id="final-answer">. The node the old test watched was
         correctly outside; the CLAIM had simply arrived by a different node.

         So this checks the property instead of the node, and derives the node set from app.js
         rather than a hand-written list — a NEW token wired into the answer is covered the day
         it is wired, which a hand-written list cannot promise.

         The rule being enforced is round 4's, and it is narrower than "no mention of the 80+
         tier": inside THE ANSWER the page MAY describe external claims and relate its own number
         to them; it may NOT state its own RANKING of them. So the needles are ranking
         ASSERTIONS. The header's outward pointer ("How this page RANKS that tier ... is stated
         separately, outside this answer") is deliberately NOT a violation — it is the sentence
         that sends a reader to where the ranking legitimately lives. */
      {
        const appJs = readFileSync(join(ROOT, "site", "app.js"), "utf8");
        const wired = [...appJs.matchAll(/\$\("([\w-]+)"\)\.textContent\s*=\s*fa\.tokens\.(\w+)/g)]
          .map(m => ({ nodeId: m[1], tokenKey: m[2] }));
        /* the entries array renders into its own container through a loop, not a textContent
           assignment, so it is named explicitly — and asserted to still be wired that way. */
        assert("T5 rec 5 claim-check: the higher-justification entries are still rendered into #fa-higher-entries",
          /\$\("fa-higher-entries"\)/.test(appJs) && /higherJustificationEntries/.test(appJs), "app.js wiring changed");
        wired.push({ nodeId: "fa-higher-entries", tokenKey: "higherJustificationEntries" });
        assert("T5 rec 5 claim-check: the wiring scan found the FA token set (not silently empty)",
          wired.length >= 15, String(wired.length));

        /* ROUND 6 broke the first cut of this check. It was a list of known phrasings, so it
           enforced WORDING, not the property it claimed to enforce — the reviewer injected
           "The leading external analyst hypothesis is this above-80 tier." and the offender list
           stayed empty while the non-vacuity control still matched four phrases. A needle list
           catches the leak you already found.

           So the check is now structural: a RANKING is a superlative standing-word within one
           clause of an external-claim noun. That is still a heuristic — no regex decides
           semantics — but it generalises past the exact sentence, and the negative fixtures below
           include the reviewer's own injection and three paraphrases it would have missed.

           The needle list is KEPT as a cheap second layer for the exact phrasings already known
           to have leaked; it is not the primary check any more. */
        /* `best` is bare-word-excluded on purpose: "the earlier figure is best read as a
           pre-review draft" is an idiom, not a ranking, and the first cut flagged it. Only
           ranking-shaped uses of it count. */
        const SUPER = "\\b(?:strongest|leading|foremost|highest-ranked|premier|weightiest" +
          "|best (?:supported|evidenced|grounded|attested|documented)" +
          "|most (?:plausible|reliable|credible|likely|defensible|authoritative|trustworthy|persuasive)" +
          "|least (?:plausible|reliable|credible))\\b";
        const CLAIMN = "\\b(?:hypothes[ei]s|claims?|claimants?|analysts?|estimates?|tiers?|readings?|sources?|adjudication)\\b";
        /* within one clause — `.` and `;` end the window, so the two must actually be related */
        const RANKING_NEAR = new RegExp(`${SUPER}[^.;]{0,70}?${CLAIMN}|${CLAIMN}[^.;]{0,70}?${SUPER}`, "i");

        /* EXEMPTIONS — exact spans, each named with its reason, and each asserted PRESENT so a
           stale exemption fails loud instead of silently widening the guard. */
        const EXEMPT = [
          { text: "Naming the most plausible closer, as this page's own inference",
            why: "names THIS PAGE'S OWN inference about what closes a gap, not an external claim's standing; " +
                 "ratified as an exact old->new pair in esc-20260801T045418Z-71b767cc" },
        ];
        const RANKING = [
          /\bstrongest external\b/i, /\bthe strongest .{0,24}\bhypothesis\b/i,
          /\branked strongest\b/i, /\bmost reliable source\b/i,
          /\badjudication of source reliability\b/i,
          /\bmost plausible reading\b/i,
        ];
        const stripExempt = (t) => EXEMPT.reduce((acc, e) => acc.split(e.text).join(" "), t);
        const textOf = (key) => {
          const v = fa.tokens[key];
          return Array.isArray(v) ? v.join("\n") : (typeof v === "string" ? v : "");
        };
        const insideAnswer = [], outsideAnswer = [];
        const unlocatable = [];
        for (const w of wired) {
          const anc = ancestryOf(w.nodeId);
          /* FAIL-OPEN, found by review: `(anc || [])` turned "the walk could not find this node"
             into "this node is outside the answer" — the safe-looking direction and the wrong
             one. An unlocatable node is an unanswered question, not a negative answer. */
          if (anc === null) { unlocatable.push(w.nodeId); continue; }
          const ids = anc.map(n => n.id).filter(Boolean);
          (ids.includes("final-answer") ? insideAnswer : outsideAnswer).push(w);
        }
        assert("T5 rec 5 claim-check: every wired node was LOCATED — an unlocatable node is not evidence of being outside the answer",
          unlocatable.length === 0, JSON.stringify(unlocatable));
        assert("T5 rec 5 claim-check: the walk actually placed the wired nodes (some ARE inside THE ANSWER)",
          insideAnswer.length >= 5, JSON.stringify(insideAnswer.map(w => w.nodeId)));
        assert("T5 rec 5 claim-check: #fa-higher-entries — the node round 5 caught — is seen as INSIDE THE ANSWER",
          insideAnswer.some(w => w.nodeId === "fa-higher-entries"),
          JSON.stringify(insideAnswer.map(w => w.nodeId)));

        const insideText = insideAnswer.map(w => textOf(w.tokenKey).replace(/\s+/g, " ")).join("\n");
        for (const e of EXEMPT)
          assert(`T5 rec 5 claim-check: the exemption "${e.text.slice(0, 40)}…" is still PRESENT (a stale exemption widens the guard silently)`,
            insideText.includes(e.text), e.why);

        const scan = (txt) => {
          const t = stripExempt(txt.replace(/\s+/g, " "));
          const hits = [];
          const near = RANKING_NEAR.exec(t);
          if (near) hits.push({ kind: "ranking-construction", hit: near[0].slice(0, 90),
            context: t.slice(Math.max(0, near.index - 50), near.index + near[0].length + 40) });
          for (const re of RANKING) {
            const m = re.exec(t);
            if (m) hits.push({ kind: "known-phrasing", hit: m[0],
              context: t.slice(Math.max(0, m.index - 60), m.index + 60) });
          }
          return hits;
        };
        const offenders = [];
        for (const w of insideAnswer)
          for (const h of scan(textOf(w.tokenKey)))
            offenders.push({ node: w.nodeId, token: w.tokenKey, ...h });
        assert("T5 rec 5 claim-check: NO ranking assertion reaches any node inside <section id=\"final-answer\">",
          offenders.length === 0, JSON.stringify(offenders, null, 1));

        /* NON-VACUITY. If the needles matched nothing anywhere, the assertion above would pass on
           an empty search and prove nothing. The ranking legitimately lives in mostPlausibleLine,
           whose node must be OUTSIDE the answer — so that token must still trip these same
           needles, and its node must still sit outside. */
        const mpl = textOf("mostPlausibleLine");
        assert("T5 rec 5 non-vacuity: the check DOES fire on the entry that legitimately carries the ranking",
          scan(mpl).length >= 3, JSON.stringify(scan(mpl).map(h => h.kind)));

        /* NEGATIVE FIXTURES — round 6's own injection, which the needle list passed, plus
           paraphrases it would also have missed. Each must be caught, or this check is back to
           enforcing wording. */
        for (const [label, sentence] of [
          ["round 6's injection", "The leading external analyst hypothesis is this above-80 tier."],
          ["paraphrase: best-supported", "Of the claims this page carries, the best supported is the above-80 estimate."],
          ["paraphrase: most credible", "This registry treats the SemiAnalysis reading as the most credible analyst source."],
          ["paraphrase: foremost", "The foremost external claim on this question is the 80+ tier."],
          ["the original leak", "The 80+ number — Dylan Patel / SemiAnalysis (the strongest external analyst hypothesis)"],
        ]) assert(`T5 rec 5 negative fixture: a ranking stated as "${label}" is CAUGHT`,
          scan(sentence).length > 0, sentence);

        /* …and a POSITIVE control: permitted description must NOT trip it, or the guard would
           force the answer to stop describing the claims it is answering about. */
        for (const [label, sentence] of [
          ["describing the claim", "The claims examined below include an above-80% tier whose underlying calculations are unpublished."],
          ["relating this page's number", "The conservative planning case computes to ~51% and does not reach that neighborhood."],
          ["the outward pointer", "How this page RANKS that tier against the others it carries is stated separately, outside this answer."],
        ]) assert(`T5 rec 5 positive control: permitted description "${label}" does NOT trip the check`,
          scan(sentence).length === 0, JSON.stringify(scan(sentence)));

        /* =====================================================================================
           THE WHITELIST — because the check above is a heuristic and round 7 proved how far it
           sits from the property. It defeated the synonym list with five sentences that are
           ordinary editorial English (e.g. "No external estimate is better supported than the
           above-80% reading", "the above-80% tier is this page's preferred external account").

           Every round of widening the blacklist has been answered by a phrasing outside it, and
           there is no reason to expect the next round to differ: a blacklist over natural
           language cannot be completed.

           So the property is enforced from the other side. The WORDING that may render inside
           <section id="final-answer"> is PINNED. Any new or edited text there fails this
           assertion until someone re-pins it deliberately — which is a review, and a review is
           the only thing that can actually judge "is this a ranking".

           NUMBERS ARE NORMALISED OUT before hashing, so an engine change that moves a published
           value does not fire this; that class is covered by the published-digit guard above.
           This pin is about WHAT THE ANSWER SAYS, that one about WHAT IT CLAIMS NUMERICALLY, and
           neither substitutes for the other. */
        {
          const normalised = insideAnswer
            .map(w => w.nodeId + "\u0000" + textOf(w.tokenKey))
            .join("\u0001")
            .replace(/\s+/g, " ")
            .replace(/[0-9][0-9.,]*/g, "#");
          const pin = createHash("sha256").update(normalised).digest("hex");
          /* Minted 2026-08-27 (T5 round 7) over the answer text AFTER the rec-5 repair: the g2
             head and its wouldFlip no longer rank the external hypothesis, and every other token
             rendering inside the answer was read for ranking language at that point. Re-pinning
             this is an approval; do not do it to make a red test green.
             RE-PINNED 2026-09-10 under owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
             This digest normalises NUMBERS to "#", so a pure recompute cannot move it — and it moved,
             which means WORDING inside the answer changed. It did, in exactly one place and
             deliberately: the §C2 label used to ASSERT that the live reference sits BELOW the r4
             quoted zone. Adopting the fleet rents moved the reading back INSIDE that zone, so the
             engine now DERIVES the relation instead of stating one, and adds the sentence
             "Agreement recovered by adopting an assumption is not the same evidence as agreement
             that was there all along." Read for what this pin exists to catch — a RANKING of an
             external claim — and it contains none: it is a caveat about this page's own reading,
             and it ranks nothing. Approved on that reading. */
          /* RE-PINNED 2026-09-12 (im-default-window-and-mcp-discrepancy; Astra review round 3 F9). Wording inside the
             answer changed in exactly two places, both about this page's own opening behaviour: the landing line now
             says the page OPENS on the preset "by default, its built-in opening state (a reader can make another
             scenario the default in their own browser)", and the prior-reading line says "by default it now opens
             on". A reader can now choose their own default, so the unqualified claim became false for that reader.
             Read for what this pin exists to catch — a RANKING of an external claim — and it contains none: it
             qualifies which default the answer's fixed readings describe, and ranks nothing. Approved on that
             reading; the text is also under Astra xhigh review round 4 before publish. */
          /* im-vet-six-repairs RE-PIN (2026-09-20, program bq-2835). READ FOR WHAT THIS PIN EXISTS TO
             CATCH — a RANKING of an external claim — and the new wording contains none. What changed
             inside THE ANSWER: the rent-class sentence now says four of the FIVE member rents are
             analyst-set (E1 + E5a), the Trainium clause says those legs are WITHDRAWN from this
             default rather than caveated inside it (E1), and the figures move with the two registry
             repairs. Every changed span is pinned reversibly in tests/fa-justifications.test.mjs
             VETTING_REPAIRS, so the bytes are enumerated rather than merely re-hashed. */
          /* RE-PINNED 2026-09-20 (im-vet-six-repairs, Astra xhigh fold). The wording moved to UNDO
             an edit, not to add one: the N1 vocabulary pass had replaced "paid-capacity occupancy"
             with "utilization" INSIDE the r4 run B §C2 label, which this surface quotes verbatim
             and attributes in the same sentence, and the old vocabulary checker's blanket
             quoted-string exemption is why nothing caught it. The quoted bytes are restored and the
             page's own gloss after the quotation now names both terms. Read for what this pin
             exists to catch, per its own failure message: no RANKING of an external claim is added,
             and the ranking-phrase control on the same surface passed on the same run. */
          const EXPECTED = "d2df037c6690ab63f723522887ca270e340bc5a07d786085f2b30e6cbdcd4d79";
          assert("T5 rec 5 WHITELIST: the wording rendered inside THE ANSWER is pinned — new text there must be REVIEWED, not merely unmatched by a needle list",
            pin === EXPECTED,
            "answer-wording digest " + pin + " (numbers normalised; " + insideAnswer.length + " nodes). " +
            "If this changed deliberately, read the new text for a RANKING of an external claim, then re-pin.");
          assert("T5 rec 5 WHITELIST non-vacuity: the pinned surface is non-trivial",
            normalised.length > 4000 && insideAnswer.length >= 5,
            normalised.length + " chars over " + insideAnswer.length + " nodes");
        }
        assert("T5 rec 5 non-vacuity: ...and that entry's node is OUTSIDE THE ANSWER",
          outsideAnswer.some(w => w.nodeId === "fa-most-plausible"),
          JSON.stringify(outsideAnswer.map(w => w.nodeId)));
      }

      /* ============================================================================
         PUBLISHED DIGITS vs EXECUTED VALUES — the guard whose absence put a fabricated
         number on the public internet.

         Round 5 found three self-contradictory figures live on the site, and re-deriving them
         showed all three were introduced by the T5 commit: the ARC engine work moved the
         readings, and the prose that quotes them was updated in some places and not others. A
         fourth (a list-vs-mix delta) had drifted the same way and nobody had noticed at all.

         The worst of them matched NO execution at any release — it was the old
         the superseded 2.0 T value with its leading digits swapped, an edit applied to two
         entries of three. It
         shipped labelled "(executed)".

         None of this was catchable, because the suite pins what the ENGINE RETURNS and nothing
         checked WHAT THE PROSE SAYS. Every assertion below is therefore two-way: it fails if the
         engine moves and the prose does not, and it fails if the prose is edited away from the
         engine. That is the only shape that would have caught what happened. */
      {
        const annexPath = join(ROOT, "site", "research", "final-answer-rationale.html");
        const annex = readFileSync(annexPath, "utf8");
        const opusM = E.MODELS.find(m => m.id === "opus");
        const perspOf = (id) => E.PERSPECTIVES.find(p => p.id === id);
        const runNative = (perspId, mutate) => {
          const st = E.applyPresetSettings(opusM, perspOf(perspId), { mode: "native" });
          if (mutate) mutate(st);
          return E.workload(st, undefined, E.scenarioContext(st)).margin * 100;
        };
        /* the reference-pinned route the annex's size ladder uses (engine §15 / D-10) */
        const seededRef = (totalB) => {
          const st = E.pinReferenceLevers(E.applyPresetSettings(opusM, perspOf("median"), { mode: "native" }));
          if (totalB) st.total = totalB;
          const d = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, st, E.scenarioContext(st));
          if (d && d.memberLegCount > 0) {
            st.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, 0]));
            for (const l of d.members) st.blend[l.hwKey] = l.declaredWeight;
          }
          return E.workload(st, undefined, E.scenarioContext(st)).margin * 100;
        };
        const flat = (t) => t.replace(/\s+/g, " ");
        const htmlFlat = flat(html), annexFlat = flat(annex);

        /* 1 — the stress card. Its head and its own expander must quote the SAME scenario.
              Round 5: the head and its own expander published different readings of one scenario. */
        const stressMix = runNative("stress-public-rate");
        const stressList = runNative("stress-public-rate", st => { st.batchShare = 0; st.discount = 0; });
        assert(`stress card HEAD quotes the executed mix reading (~${Math.round(stressMix)}%, executed ${stressMix.toFixed(4)})`,
          htmlFlat.includes(`<span class="est-stress-value">~${Math.round(stressMix)}%</span>`), stressMix.toFixed(4));
        assert(`stress card EXPANDER quotes the same two executed readings (about ${Math.round(stressMix)}% mix / about ${Math.round(stressList)}% list)`,
          htmlFlat.includes(`It reads about ${Math.round(stressMix)}% on this page's 15% Batch / 5% discount mix and about ${Math.round(stressList)}% at the undiscounted list price.`),
          `${stressMix.toFixed(4)} / ${stressList.toFixed(4)}`);

        /* 2 — the list-vs-mix delta quoted in §5. Hardcoded prose, previously pinned by nothing,
              and stale by a full point. */
        const deltaPts = stressList - stressMix;
        assert(`the list-vs-mix delta in §5 matches the executed spread (~${deltaPts.toFixed(1)} points)`,
          htmlFlat.includes(`a pure list-price run lands ~${deltaPts.toFixed(1)} points higher`), deltaPts.toFixed(4));

        /* 3 — the ratified-prior default. Round 5: one site said ~63%, two others said ~69%,
              for the same quantity. Every occurrence must now agree with the engine. */
        const ratified = runNative("median");
        const ratifiedPct = `~${Math.round(ratified)}%`;
        /* im-release-edit 2026-09-09: the three sites are unchanged in NUMBER and in duty — each
           still has to publish the engine's own computed value — but two of them are worded under
           the canonical vocabulary now. "The calculator's own default state" was retired because
           it named a state the calculator does not have: the engine's DEFAULTS carry lead 0 and
           the page opens on the GPT-5.6 Pro estimate's settings, so neither of them is this
           reading. The reading is the planning baseline plus the adopted 3-month lead, and the
           page and the glossary both call that the LEAD-ADJUSTED BASELINE. The assertion still
           derives every expected string from `ratified`, so a drift in the engine still fails it. */
        const ratifiedWord = `about ${Math.round(ratified)}%`;
        /* im-release-edit-r2 2026-09-10: the UPPER lens bound was a literal 86, and the stale-figure
           regex a literal 63 — so when the owner's fleet-rent adoption moved every one of these, the
           test failed on numbers it should have been deriving. Both ends come from the engine now.
           The rule this file already states for the central applies to its band: pin the
           RELATIONSHIP, never the digits, or the guard rots the first time the engine moves. */
        const ratifiedSpan = E.lensSpan(opusM, { mode: "explicit", profileId: "reference" });
        const ratifiedHi = Math.round(ratifiedSpan.hi * 100);
        for (const claim of [`lead-adjusted baseline</a> reads ${ratifiedPct}`,
                             `its lead-adjusted baseline of ${ratifiedPct}`,
                             `and reads <strong>${ratifiedWord} (about ${Math.round(ratified)}–${ratifiedHi}% across the same presets)</strong>`]) {
          assert(`ratified-prior default published as ${ratifiedPct} — "${claim.slice(0, 46)}…" (executed ${ratified.toFixed(4)})`,
            htmlFlat.includes(claim), claim);
        }
        const stalePat = new RegExp(`lead-adjusted baseline(?:<\\/a>)? (?:of|reads) ~(?!${Math.round(ratified)}%)\\d\\d%`);
        assert("no stale ratified-prior figure survives anywhere on the page",
          !stalePat.test(htmlFlat),
          "a ratified-prior default is published at a value the engine does not compute");

        /* 4 — the annex size ladder. The value that shipped matched no execution; and the
              sentence CLAIMS monotonic decrease, so the claim is asserted alongside the digits. */
        const [a20, a25, a30] = [seededRef(2000), seededRef(2500), seededRef(3000)];
        assert("annex size ladder: the published triple IS the executed triple",
          annexFlat.includes(`2.0/2.5/3.0 T compute ≈${a20.toFixed(2)}% / ≈${a25.toFixed(2)}% / ≈${a30.toFixed(2)}% (executed)`),
          [a20, a25, a30].map(v => v.toFixed(4)).join(" / "));
        assert("annex size ladder: and the executed values really are monotone decreasing, as the sentence claims",
          a20 > a25 && a25 > a30, [a20, a25, a30].map(v => v.toFixed(4)).join(" > "));

        /* NON-VACUITY: these string assertions would all pass silently if the needles were
           mistyped and matched an empty search. Prove the haystacks are the real ones. */
        assert("published-digit guard: the haystacks are the SERVED files, non-empty",
          htmlFlat.length > 100000 && annexFlat.length > 20000,
          `${htmlFlat.length} / ${annexFlat.length}`);
        assert("published-digit guard: a deliberately wrong digit is NOT found (the match is exact, not fuzzy)",
          !htmlFlat.includes(`<span class="est-stress-value">~${Math.round(stressMix) + 7}%</span>`),
          "the stress-card matcher accepts a value the engine does not compute");

        /* ROUND 6: "the new digit guard is non-vacuous for its two chosen files, but it scans only
           site/index.html and the final-answer annex. These defects pass it." Two further
           reader-visible surfaces were still publishing the superseded figures — the selectable
           stress preset's own note in engine.js (rendered by app.js AND exposed through MCP
           scenario discovery) and the analyst-divergence annex, which explicitly says it is
           "Re-measured from the shipped engine at each release" and was not.

           A guard that names its own two files is a list, and this is the third time in this leg
           that a hand-written list has been the defect. So the retired values are now swept
           across EVERY served text asset, enumerated from the asset manifest — the same shape as
           the barred-phrase sweep, which is the one guard here that has never been evaded. Each
           needle is the retired figure IN ITS OWN CONTEXT, never a bare number, because "59%" is
           a legitimate published value elsewhere (Sonnet's ratified-prior default executes at
           59.4623%). */
        {
          const manifestPath = join(ROOT, "site/asset-manifest.sha256");
          const servedRel = readFileSync(manifestPath, "utf8").split("\n")
            .map(l => l.trim()).filter(Boolean)
            .map(l => l.split(/\s+/).slice(1).join(" ").replace(/^\.\//, ""))
            .filter(Boolean)
            /* FOUND BY REVIEW: an extension allow-list skipped `_headers`, `_redirects` and
               `favicon.svg` — all served, all text — while the comment above claimed "every
               served asset". Sniff the bytes instead: anything that decodes as text is swept. */
            .filter(rel => {
              const abs = join(ROOT, "site", rel);
              if (!existsSync(abs)) return false;
              const head = readFileSync(abs).subarray(0, 4096);
              return !head.includes(0);
            });
          assert("superseded-figure sweep: the manifest enumeration is live (not an empty list)",
            servedRel.length >= 90, String(servedRel.length));

          /* The needles are ASSEMBLED AT RUNTIME, never written as literals. This file has a
             SERVED TWIN at /tests/fa-m6-b9.test.mjs, so a literal retired figure written here
             would be published — and the sweep would then find its own needle and fail. That is
             not hypothetical: the first cut of this sweep failed on exactly that, and it is the
             same trap a round-3 finding caught in the barred-phrase sweep. Byte-exact matching is
             preserved; only the literal is gone. */
          const N = (...parts) => parts.join("");
          const RETIRED = [
            { needle: N("It reads about ", "59", "% on this page's"), quantity: "stress card expander (mix)", now: stressMix },
            { needle: N("about ", "64", "% at the undiscounted list tariff"), quantity: "stress card expander (list)", now: stressList },
            { needle: N("about ", "59", "% under this page's illustrative billing mix"), quantity: "stress PRESET note (mix)", now: stressMix },
            { needle: N("the default reads ~", "69", "%"), quantity: "ratified-prior default", now: ratified },
            { needle: N("ratified-prior default of ~", "69", "%"), quantity: "ratified-prior default", now: ratified },
            { needle: N("≈", "51.87", "%"), quantity: "annex size ladder (2.0 T)", now: a20 },
            { needle: N("≈", "58.49", "%"), quantity: "annex size ladder (3.0 T)", now: a30 },
            { needle: N("~", "4.9", " points higher"), quantity: "list-vs-mix delta", now: deltaPts },
            { needle: N("3.15", "× rent/TCO multiple"), quantity: "analyst-divergence rent/TCO multiple", now: null },
            { needle: N("reads ≈", "59", "% and the same state owned reads ≈", "87", "%"), quantity: "analyst-divergence stress/owned pair", now: null },
            /* ROUND 7 found a THIRD kind of surface: not a published figure at all, but design
               COMMENTS naming the stress row's value — in site/styles.css and in a served test
               twin. Comments are served bytes; anyone reading source reads them, and they are
               exactly where a stale number hides from a sweep that only looks at prose. */
            { needle: N("≈", "59", "% stress row"), quantity: "stress row named in a served comment", now: stressMix },
            { needle: N("≈", "59", " % stress row"), quantity: "stress row named in a served comment (spaced)", now: stressMix },
            { needle: N("≈", "59.87", "%"), quantity: "annex size ladder (2.0 T, pre-ARC)", now: a20 },
            { needle: N("≈", "59.18", "%"), quantity: "annex size ladder (2.5 T, pre-ARC)", now: a25 },
          ];
          const survivors = [];
          for (const rel of servedRel) {
            const abs = join(ROOT, "site", rel);
            if (!existsSync(abs)) continue;
            const body = flat(readFileSync(abs, "utf8"));
            for (const r of RETIRED)
              if (body.includes(r.needle))
                survivors.push({ file: rel, quantity: r.quantity, needle: r.needle,
                  executed: r.now === null ? "(derived)" : r.now.toFixed(4) });
          }
          assert("superseded-figure sweep: NO retired figure survives in ANY served asset",
            survivors.length === 0, JSON.stringify(survivors, null, 1));

          /* NON-VACUITY — and the first cut of THIS was tautological, which round 7 caught: it built
             a synthetic document out of the needles themselves, so a mistyped needle, or an empty
             needle list, still passed. A fixture derived from the thing it validates proves
             nothing.

             The fixture is now the REAL BYTES THAT REALLY CARRIED THE DEFECTS — the tree at
             4bf3eec, the release that went public and was rolled back. Those files are not
             derived from this list and cannot be edited to suit it, so the needles must find the
             defects in genuine history or fail. */
          {
            const HIST = "4bf3eec";
            const histFiles = ["site/index.html", "site/research/final-answer-rationale.html",
              "site/engine.js", "site/research/analyst-divergence.html", "site/styles.css"];
            let histBytes = "";
            let histAvailable = true;
            for (const f of histFiles) {
              try {
                histBytes += flat(execFileSync("git", ["show", `${HIST}:${f}`],
                  { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
              } catch { histAvailable = false; }
            }
            /* THE FIXTURE IS PRIVATE HISTORY (vetting round 2026-09-19, Astra pack E P1-1,
               third consumer found in the publish dry-run). The non-vacuity fixture is the tree
               at private commit 4bf3eec — real bytes that really carried the defects, which is
               exactly what makes it a good fixture and also what makes it unreachable from a
               squashed public mirror or from the reconstructed publish stage, which is not a git
               repository at all. Both assertions below therefore failed there and blocked the
               publish. Same rule as the other two consumers: in a PRIVATE tree unreachable
               history is a FAILURE, because the history really did break; with no registered
               private input present this is the public snapshot and the two non-vacuity
               assertions skip, by name and by count. The sweep's OWN assertion — that today's
               served tree carries no superseded figure — is above and runs in every tree; what
               is skipped is only the proof that the needles can find one. */
            if (!histAvailable && PROVENANCE_MODE !== "private") {
              console.log("SKIP  superseded-figure sweep non-vacuity (2 assertions): the 4bf3eec "
                + "fixture is private history, absent from a public snapshot by design");
            } else {
            assert("superseded-figure sweep non-vacuity: the historical release is readable from git (fixture is real, not synthetic)",
              histAvailable && histBytes.length > 100000, `${histAvailable} ${histBytes.length}`);
            const hits = RETIRED.filter(r => histBytes.includes(r.needle));
            /* Not every needle has to appear at that one commit — some retired figures were
               already gone by then, and some live in files this fixture does not read. What must
               hold is that the sweep DEMONSTRABLY finds real superseded figures in real bytes. */
            assert("superseded-figure sweep non-vacuity: the needles DO find superseded figures in the 4bf3eec release",
              hits.length >= 4, JSON.stringify({ found: hits.map(h => h.quantity), of: RETIRED.length }));
            }
            /* (the "today's tree is clean" half is the main sweep assertion above; an
               `assert(..., true)` used to sit here and asserted nothing — removed.) */
          }
          assert("superseded-figure sweep non-vacuity: the sweep reads real bytes (a known live string IS found)",
            servedRel.some(rel => existsSync(join(ROOT, "site", rel))
              && flat(readFileSync(join(ROOT, "site", rel), "utf8")).includes("est-stress-value")),
            "the sweep found none of the live stress-card markup — it is not reading the served tree");
        }

        /* =====================================================================================
           THE CLAIM-ANNEX PIN — because a needle list cannot catch a figure nobody has retired yet.

           Adversarial review (2026-08-27) walked past everything above with one line: it changed a
           published reading in a served annex from 51.18% to 81.18% — a figure that contradicts
           line 98 of the same file and matches no execution — and the ENTIRE release chain stayed
           green. The sweep only proves that fourteen KNOWN-BAD strings are absent. It says nothing
           about a number that has never been wrong before, which is exactly the shape of the
           defect that put a fabricated figure on the public internet in the first place.

           "Every published figure agrees with the engine" is not decidable by pattern: nothing in
           the bytes says which scenario a number came from. So these two documents are PINNED
           instead. They are the hand-authored CLAIM annexes — the ones that publish engine-derived
           readings and argue from them — and they are not sweep output, so they do not move on
           their own. Any change to either, including a single digit, fails here until someone
           re-pins deliberately, which forces a human to check the number against the engine.

           Scope is deliberately narrow and stated: the other 37 annexes are verbatim research
           documents and generated ledgers that legitimately change with the daily sweep. Widening
           this pin to them would produce a guard everyone learns to re-pin without reading, which
           is worse than no guard. */
        {
          /* RE-PINNED 2026-09-09 (im-release-edit), and here is the check that was actually run
             rather than a claim that one was. Both pages were rendered before and after, their
             reader-visible text extracted, and EVERY numeric token compared:
               analyst-divergence — 104 numeric tokens, all identical. Only the label ladder moved,
                 CONFIRMED / SOURCE ESTIMATE / INFERENCE -> STATED / IMPLIED / OUR READING, because
                 it grades which margin a source is talking about and never whether the source's
                 figure is true. No row's attribution changed.
               final-answer-rationale — three tokens LEFT ("3.1", "3.1", "3.2", the internal
                 program-code citations "d2 §3.1 F4" and "frozen d2 §3.1-3.2", which are section
                 references and not figures) and two ENTERED, both restatements of figures this
                 site already publishes: "about 51%", which is the planning baseline the same page
                 states four paragraphs later as 51.1806%, and "about 70%" of modeled direct cost
                 on the input side, which the report's methods box states as ~70.1%.
             No engine-derived reading moved on either page.
             RE-PINNED AGAIN 2026-09-09, same file, after the Astra xhigh review found the annex
             still calling the 63% reading the calculator's "ratified-prior default" — the retired
             name the release exists to remove, missed by the first pass. Same check re-run on that
             change alone: 62 numeric tokens before, 62 after, all identical. A name moved; no
             figure did.
             RE-PINNED A THIRD TIME 2026-09-09, for Pro session 1's H3: the chain now discloses that
             the ~51% reading is a PRICED-SUBSET result over about 52% of declared fleet weight,
             because GB200, GB300 and Trainium3 carry no registered price and are renormalized out.
             Same check again, on that change alone: the only numeric token that ENTERS is "52%",
             which is the coverage itself (the engine returns 51.961%); every pre-existing figure is
             byte-identical. A property of the result was stated; no figure moved.
             RE-PINNED A FOURTH TIME 2026-09-10, and this time FIGURES DID MOVE — owner ruling
             d-20260910-im-adopt-fleet-rents-and-correct-grok adopts provisional planning rents for
             GB200, GB300 and Trainium3, so the reference reading is computed over the whole declared
             fleet instead of 52% of it. The pin's own instruction is to re-derive every engine
             figure before re-pinning, so that was done token by token rather than asserted:
             final-answer-rationale carries 282 numeric tokens BEFORE and 282 AFTER, and every
             changed one is a figure this ruling moved — 51→58 (the reference, four sites), the size
             ladder 52.51/51.18/49.85 → 58.57/57.88/57.19, and the lens span 51–82 → 58–83.
             analyst-divergence carries 385 before and 385 after: 51→58, the cost ratio 0.4882→0.4211,
             and the rent/TCO multiple 3.98→3.43 with its 75% implied lessor margin → 71% and 298%
             markup → 243%. NOTHING ENTERED AND NOTHING LEFT in either file, which is the evidence
             the edit is a recompute and not a rewrite.
             RE-PINNED A FIFTH TIME 2026-09-12 (final-answer-rationale ONLY; analyst-divergence is
             byte-untouched and its pin is unchanged), by leg im-release-contradiction-fix under the
             SAME ruling d-20260910-im-adopt-fleet-rents-and-correct-grok, across five rounds of Astra
             xhigh review that found five separate defects in this annex and THREE in this note.

             WHY THIS NOTE NO LONGER ENUMERATES TOKENS BY HAND. The pin's instruction is "re-derive
             every engine figure it publishes against the engine, then re-pin. Do not re-pin to make a
             red test green", and a re-mint resting on a false derivation is worse than a red test
             because it launders the freeze. Three successive hand-written inventories here were each
             wrong: the first claimed to list "EVERY difference" and listed 17 arrivals against 16,
             and counted the "39" of the entity &#39; as a figure (round 2, R20, BLOCKER); the second
             omitted a second 58.4305 and filed the relocated "200" of GB200 under "changed meaning"
             (round 3, T3); the third still did not account for a NET NEW GB200 mention (round 4, U2).
             Each correction introduced the next error. So the inventory is GENERATED, and this note
             states the RULE it is classified by rather than a list that rots:
               reports/im-release-contradiction-fix-2026-09-12/evidence/annex-token-enumeration.txt
             carries the extraction procedure, both source identifiers, the multisets and the ordered
             difflib hunks. BEFORE is ab232910604dec317658bc9f5fa69759273e8738; AFTER is blob
             985facd668ceb2a3005cd88d5851f0982cd0543f
             (sha256 9af7eb1245738f6c17de45ce65110a9bd1c3f63b152ecb4821e229af08d4b4d1).

             THE FIGURES THAT MOVED, which is the set this pin exists to police. Every one re-derived
             by executing site/engine.js, not copied:
               51.1806 -> 58.4305   the precise reference reading (58.43052929759557)
               51.18 x2, 43.22 -> 58, 58.40, 57.88, 0.5, 56
                                    the decomposition, from finalAnswer().decompositionLine
               63 x2 -> 68 x2       the lead-adjusted baseline (68.39894608278819)
               70.1 -> 70.5         input-side share 100*(6.45*cIn)/(cOut+6.45*cIn) = 70.5373073367345
               + 51.1786            the PREVIOUS effective result, named so the ~52% coverage history
                                    attaches to the result it actually described (round 2, R8)
               + 83.09              finalAnswer().lensSpan.hiPct today, named beside the dated ladder
               + 51                 the value that ladder starts from, now labelled as historical
             That is the whole of it. NO published percentage moved except by re-derivation.

             THE TWO REMOVALS, and they are NOT the same kind of thing \u2014 the previous draft of this
             note grouped them and thereby denied that one of them was wrong (round 6, W4):
               144  H100's registered domain width. Still a valid figure and still the registered
                    width; the rewritten paragraph simply no longer quotes it. Not retired.
               77   WAS WRONG. The paragraph said H100 "would render capped" at 77. Executed on the
                    candidate engine at total=5000, H100 reports bDeclared 96 and bFeas 75, so the
                    feasible batch is 75, not 77 \u2014 and cf26ec8's own text already said 75 two clauses
                    away from its own capped-77 phrase. It is a RETIRED INCORRECT FIGURE and the
                    rewrite removed it.

             EVERY OTHER TOKEN DIFFERENCE IS AN IDENTIFIER, A DATE, A HARDWARE NAME, AN HTML ENTITY,
             A MEASURED FLEET FACT, OR A VALUE NEWLY QUOTED AS HISTORY \u2014 and this note deliberately
             does NOT classify those 60-odd arrivals one by one. FOUR hand-written attempts to do so
             were each wrong in a new way (R20, T3, U2, V8), and the fourth misfiled the "95" of the
             commit id 4d95a59 and the "12" of the date 2026-09-12 as measurements from
             deriveDefaultFleetMembership. Each correction introduced the next error, which is the
             actual lesson: the generated file is the inventory, it is reproducible from the procedure
             at its head, and a reader who wants the classification can apply it there. What this note
             asserts is the part that matters and is small enough to be checked \u2014 the figures above,
             each re-derived by executing the engine \u2014 plus one fact that a multiset alone would hide:
               1.0   CHANGED MEANING. It was "the weight rebind moves the result by -1.0 point" and is
                     now "a renderable weight share of 1.0". Two quantities, one token, cancelling.

             WHAT THE FIVE ANNEX DEFECTS WERE: the precise parenthetical disagreeing with its own
             rounded figure in one sentence (F4); the new paragraph attaching the old ~52% coverage to
             the new result (R8); the rent classification calling GB200 observed-source-named two
             paragraphs before calling it provisional (T1/R3); the 5 T case naming H100 alone with
             "the remaining six legs" where deriveDefaultFleetMembership returns FIVE members and
             excludes h100 AND trn2 at basis 84 (U5); and the economics slot quoted as "joint-fit
             throughput" where the engine emits "analyst-set-assumed-op throughput" (U6). The retained
             52% is deliberate and explicitly HISTORICAL, attached to the 51.1786% it described; the
             ladder is dated to the commit that wrote it rather than to this document's header, which
             an earlier draft used and thereby invented its provenance (U7). This pin exists to stop a
             superseded figure being published as current, which is exactly what F4 caught. */
          const CLAIM_ANNEXES = {
            /* im-vet-six-repairs RE-PIN (2026-09-20). Every engine figure these two annexes publish was
               RE-DERIVED against the engine before re-pinning, which is what the message below demands:
               the rationale page carries the repaired form-correction span (47.61-61.30%, 13.69 pp),
               the corrected size ladder (59.40/58.43/57.46), the widened traffic span and the
               Trainium WITHDRAWAL paragraph; the analyst-divergence page carries the re-derived
               rent/TCO multiple (3.43x -> 3.55x) and implied lessor margin (71% -> 72%), both
               recomputed from the live stress and owned readings rather than transcribed. */
            "site/research/final-answer-rationale.html": "e8033bae3eb4ce33c5f44a30cee51880b0704e2eb3739b12d57d5e0cec7be249",
            "site/research/analyst-divergence.html": "e86f16b192c97286d2f59d425449a41f621d3f3d3128dc99d552ee357da8fb2d",
          };
          for (const [rel, expected] of Object.entries(CLAIM_ANNEXES)) {
            const abs = join(ROOT, rel);
            assert(`claim-annex pin: ${rel} exists`, existsSync(abs), abs);
            if (!existsSync(abs)) continue;
            const digest = createHash("sha256").update(readFileSync(abs)).digest("hex");
            assert(`claim-annex pin: ${rel} is byte-identical to the reviewed copy — a changed FIGURE fails here even if no retired string appears`,
              digest === expected,
              `${rel} digest ${digest}. If this changed deliberately, re-derive every engine figure ` +
              `it publishes against the engine, then re-pin. Do not re-pin to make a red test green.`);
          }
        }

        /* And the CURRENT values must be published on the two surfaces round 6 named, so this is
           a two-way pin there too, not merely an absence check. */
        {
          const engineSrc = flat(readFileSync(join(ROOT, "site", "engine.js"), "utf8"));
          assert(`stress PRESET note publishes the executed pair (about ${Math.round(stressMix)}% / about ${Math.round(stressList)}%)`,
            engineSrc.includes(`(about ${Math.round(stressMix)}% under this page's illustrative billing mix, about ${Math.round(stressList)}% at the undiscounted list price)`),
            `${stressMix.toFixed(4)} / ${stressList.toFixed(4)}`);
          const divPath = join(ROOT, "site", "research", "analyst-divergence.html");
          if (existsSync(divPath)) {
            /* tags stripped: the published sentence puts <em>/<strong> INSIDE the claim
               ("a 75% <em>implied</em> lessor margin"), so a raw substring match would miss it
               and the assertion would be quietly unfalsifiable. */
            const div = flat(readFileSync(divPath, "utf8").replace(/<[^>]+>/g, ""));
            const owned = (() => {
              const st = E.applyPresetSettings(opusM, perspOf("stress-public-rate"), { mode: "native" });
              st.hwMode = "tco";
              return E.workload(st, undefined, E.scenarioContext(st)).margin * 100;
            })();
            const k = (1 - stressMix / 100) / (1 - owned / 100);
            assert(`analyst-divergence publishes the executed stress/owned pair (≈${Math.round(stressMix)}% / ≈${Math.round(owned)}%)`,
              div.includes(`reads ≈${Math.round(stressMix)}% and the same state owned reads ≈${Math.round(owned)}%`),
              `${stressMix.toFixed(4)} / ${owned.toFixed(4)}`);
            assert(`analyst-divergence publishes the executed rent/TCO multiple (≈${k.toFixed(2)}×) and lessor margin (${Math.round((1 - 1 / k) * 100)}%)`,
              div.includes(`≈ ${k.toFixed(2)}`) && div.includes(`${k.toFixed(2)}× rent/TCO multiple`)
              && div.includes(`${Math.round((1 - 1 / k) * 100)}% implied lessor margin`),
              `k=${k.toFixed(4)} margin=${((1 - 1 / k) * 100).toFixed(4)}`);
          }
        }
      }
    }
    /* Scanned against the WHOLE served file, comments included, and whitespace-collapsed so a
       line break inside the phrase cannot hide it. Two earlier cuts of this assertion were
       weaker and both were wrong: the first passed only because a comment happened to wrap
       mid-phrase (a guard that depends on where a line breaks is not a guard); the second
       stripped comments, which let the retired wording stay in the shipped bytes. HTML comments
       ARE served — anyone viewing source reads them — so the bar is that the phrase appears
       nowhere in the file at all. The verbatim wording lives in the review it came from and in
       the pinned edit set in tests/fa-justifications.test.mjs, which is where a record belongs. */
    /* EVERY SERVED FILE, enumerated from the ASSET MANIFEST rather than hand-listed.
       Two earlier cuts were wrong in the same direction. The first scanned index.html alone and
       passed while site/engine.js served the phrase in a comment. The second hard-coded eight
       files — and a third review pointed out the manifest ships 117 entries, 38 of them served
       TEST TWINS, and that site/tests/fa-justifications.test.mjs carried the phrase six times
       with nothing in _headers or _redirects blocking it. So the wording the rec cleared from
       the page was publicly reachable at /tests/…, and the assertion that said otherwise was
       reading a list I had written rather than the set of things actually served.
       The manifest IS that set: it is what the deploy publishes and what manifest:check gates.
       Text-bearing entries only — hashing a PNG for prose is noise, not rigour. */
    const manifestPath = join(ROOT, "site/asset-manifest.sha256");
    const servedRel = readFileSync(manifestPath, "utf8").split("\n")
      .map(l => l.trim()).filter(Boolean)
      .map(l => l.split(/\s+/).slice(1).join(" "))
      .filter(Boolean)
      .map(rel => rel.replace(/^\.\//, ""))
      .filter(rel => /\.(html|js|mjs|css|json|txt|md|sh)$/i.test(rel));
    assert("T5 rec 5: the served sweep enumerates the ASSET MANIFEST, not a hand-written list",
      servedRel.length >= 60, "only " + servedRel.length + " text entries found — the manifest ships 117");
    const servedText = servedRel
      .map(rel => ({ f: rel, p: join(ROOT, "site", rel) }))
      .filter(x => existsSync(x.p))
      .map(x => ({ f: x.f, body: readFileSync(x.p, "utf8").replace(/\s+/g, " ") }));
    assert("T5 rec 5: ...and every manifest entry it names actually resolves on disk",
      servedText.length === servedRel.length,
      JSON.stringify(servedRel.filter(r => !existsSync(join(ROOT, "site", r))).slice(0, 5)));
    const rendered = html.replace(/\s+/g, " ");
    /* Assembled, not written as a literal: tests/ is mirrored into site/tests/ and SERVED (38
       test files sit in the asset manifest), so a literal here would publish the phrase on the
       very surface the assertion below claims is clear. A third review found exactly that. */
    const RETIRED = new RegExp(["most", "plausible", "reading", "of", "the", "actual", "figure"].join(" "), "i");
    /* The rec bars the two-word OBJECT outright — its words are the two assembled below — unless
       the source exposes the same estimand, accounting boundary, period, fleet and billing
       basis. It does not bar only the seven-word framing that object appeared in. Scoping the
       sweep to the long form let the short one survive in four manifest-served assets, which a
       release-gate review found. Assembled rather than quoted, for the same reason as above:
       this file is served, so a literal here is the thing it forbids. */
    const BARRED_OBJECT = new RegExp(["actual", "figure"].join(" "), "i");
    const offenders = servedText.filter(x => RETIRED.test(x.body)).map(x => x.f);
    assert("T5 rec 5: the retired phrasing appears in NO served file (every manifest entry, whitespace-collapsed, comments included)",
      offenders.length === 0, JSON.stringify(offenders));
    const barredOffenders = servedText.filter(x => BARRED_OBJECT.test(x.body)).map(x => x.f);
    assert("T5 rec 5: and the BARRED TWO-WORD OBJECT appears in no served file either",
      barredOffenders.length === 0, JSON.stringify(barredOffenders));
    /* The sweep must be able to FIND something, or "no offenders" is indistinguishable from a
       broken reader. Run the identical machinery for a phrase that IS served. */
    assert("T5 rec 5 negative: the served sweep CAN find a phrase — it locates the replacement wording",
      servedText.some(x => /strongest external analyst hypothesis carried by this registry/i.test(x.body)),
      "the replacement wording should be findable across the served set");
    assert("T5 rec 5: the retired phrasing is gone from the token and from the RENDERED page",
      !RETIRED.test(fa.tokens.mostPlausibleLine)
      && !RETIRED.test(rendered)
      && !RETIRED.test(fa.tokens.higherJustificationsHeader)
      && !fa.tokens.higherJustificationEntries.some(e => RETIRED.test(e))
      && /^The strongest external analyst hypothesis carried by this registry: above 80%/.test(fa.tokens.mostPlausibleLine),
      fa.tokens.mostPlausibleLine.slice(0, 140));
    /* The scan must be able to FAIL, or "not found" proves nothing. Run the identical machinery
       against a phrase that IS on the page: same source, same whitespace collapse, same test
       call — only the needle changes. */
    assert("T5 rec 5 negative: that scan CAN fail — the same machinery finds a phrase that IS present",
      /strongest external analyst hypothesis carried by this registry/i.test(rendered),
      "the replacement wording should be findable by the same scan");
    assert("T5 rec 5: the SOURCE CLAIM is preserved, not softened away with the phrase",
      /north of 80 percent for the API price/.test(fa.tokens.mostPlausibleLine)
      && /adjudication of source reliability/.test(fa.tokens.mostPlausibleLine),
      fa.tokens.mostPlausibleLine.slice(0, 240));
  }
  assert("T-1 M5's single interim-pin node is RETIRED from the page",
    !html.includes('id="fa-lever-reference"') && fa.tokens.leverReferenceLine === undefined);
}

/* ================= T-2 two readings — EXACT fields, not rendered ones =================
   Gate R3 P0-1: asserting the ÷E identity on the RENDERED values is arithmetically impossible,
   because the formatter rounds — (100−69)×3^0.25 = 40.798, not 41. Executed both ways: exact holds
   to 1e-14, rounded fails by 0.2. So the identity rides the exact fields and the rendering is
   asserted separately, as each token being the correct Math.round of its OWN exact field. */
{
  const refExact = fa.planningPoint.marginPct, priorExact = fa.priorReading.marginPct;
  assert("T-2(a) the two readings differ by EXACTLY the ratified prior on the exact fields (1e-9)",
    near((100 - priorExact) * Math.pow(3, 0.25), 100 - refExact, 1e-9),
    String((100 - priorExact) * Math.pow(3, 0.25)) + " vs " + String(100 - refExact));
  assert("T-2(b) each rendered token is the correct Math.round of its OWN exact field",
    fa.tokens.referenceReadingLine.startsWith("≈" + Math.round(refExact) + "%")
    && fa.tokens.priorReadingLine.startsWith("≈" + Math.round(priorExact) + "%")
    /* im-release-edit-r2 (2026-09-10): the literals were 51 and 63 and are now 58 and 68, under
       d-20260910-im-adopt-fleet-rents-and-correct-grok. Keeping a literal pair here is deliberate
       and NOT the rot this file otherwise polices: the assertion above already proves each token is
       the correct rounding of its own exact field, so these two exist to catch a silent engine
       drift that keeps the rendering self-consistent while the value moves. A relationship test
       cannot see that; only a stated expectation can, and moving it is a declared act. */
    && Math.round(refExact) === 58 && Math.round(priorExact) === 68,
    JSON.stringify([Math.round(refExact), Math.round(priorExact)]));
  /* im-arc T4 fold (2026-08-24), memo §4 — a FINDING, disclosed rather than re-pinned into
     agreement. The r4 adjudication's quoted 55–61% zone is someone else's dated words about a
     dated reading, so its bytes are not edited. The live reference now sits BELOW it, because the
     fold found no admissible public planning rate for GB200, GB300 or Trainium3 and the reference
     is computed over the four legs that still price. What is asserted is therefore the honest
     pair: the reading is outside the quoted zone, AND the page says so in the same block. */
  /* im-release-edit-r2 (2026-09-10): this assertion used to pin ONE relation — "sits BELOW" —
     because that was the relation on the day it was written. The owner's fleet-rent adoption moved
     the live reference from ≈51% to ≈58%, back inside the zone, and a test pinning the old relation
     would have demanded the page keep saying something false. What the page owes a reader is that
     it states the relation that HOLDS, whichever it is; so that is what is asserted. */
  {
    const below = refExact < 55, above = refExact > 61;
    const said = fa.tokens.c2LabelLine;
    const ok = below ? /live reference reading sits BELOW that quoted zone/.test(said)
      : above ? /live reference reading now sits ABOVE that quoted zone/.test(said)
      : /sits INSIDE the quoted\s+zone again/.test(said);
    assert("T-2(c) the §C2 label states the relation that actually holds between the live reference and the quoted 55–61 zone",
      ok, `${refExact} vs 55-61; label says: ${said.slice(0, 200)}`);
    /* And it must never state a relation that does NOT hold — the failure mode is a stale literal,
       so assert the absence of the other two. */
    assert("T-2(c) …and states only that relation, not a superseded one",
      [/sits BELOW that quoted zone(?!, because)/.test(said), /now sits ABOVE that quoted zone/.test(said),
       /sits INSIDE the quoted\s+zone again/.test(said)].filter(Boolean).length === 1,
      said.slice(0, 240));
  }
  /* D-6a: the QUOTED §C2 literals are bound to the engine at exactly the two strengths the memo
     asserts them at. The label's ENDPOINTS are r4's own two-parameter sensitivity under run B's
     model and are NOT re-derived here — the memo does not claim they are. */
  /* The quoted midpoint is a QUOTATION, not a derivation — it stays at the adjudication's own
     "midpoint 59%" and is bound to that literal, while the live reading is bound separately. */
  assert("T-2/D-6a the §C2 quoted midpoint is preserved verbatim, and the live reference is stated beside it",
    fa.tokens.c2LabelLine.includes("midpoint 59%")
      && fa.tokens.c2LabelLine.includes("≈" + Math.round(refExact) + "%"),
    fa.tokens.c2LabelLine.slice(-220));
  /* The page's own live band moves with the arithmetic (declared delta); the quoted zone does not. */
  /* The tripwire band is a DECLARED expectation about where this page's own reading should sit, and
     it moves when the owner rules that it should. 48–54 was the band for a reference computed over
     four priced legs; d-20260910-im-adopt-fleet-rents-and-correct-grok prices all seven, and the
     band moves with it. Re-minted from the executed reading, not widened to admit it: 55–61 is the
     §C2 zone the reading now sits inside, which is the tightest honest statement available. */
  assert("T-2/D-6a the page's OWN live band claim is the post-adoption tripwire band, and it holds",
    refExact >= 55 && refExact <= 61, String(refExact));
}

/* ================= T-3 exact block copy — EVERY static template byte-pinned =================
   Plan §5 M6 requires "exact block copy". The templates are authored in memo §2.9 (and §17.2 for
   the re-pinned spec-decode row); `{}` marks the only dynamic holes, each resolved through ONE
   named formatter so the two readings cannot drift into different rounding conventions. A one-byte
   mutation of any template FAILS. */
{
  const refPct = "≈" + Math.round(fa.planningPoint.marginPct) + "%";
  const priorPct = "≈" + Math.round(fa.priorReading.marginPct) + "%";
  /* council F1: ONE named formatter for the landing-lead clause, computed from the SAME
     fa.landingReading the hero renders — the two readings cannot drift apart again. */
  const landingLeadClause = fa.landingReading.leadMonths
    ? "its author's " + (fa.landingReading.leadMonths > 0 ? "+" : "") + fa.landingReading.leadMonths + "-month algorithmic-lead assumption"
    : "no algorithmic lead";
  const holes = { refPct, priorPct, trendMonths: "+3", trendRate: "3", E: "1.316", landingLeadClause };
  /* T-3b (council F1 detection): the FA must carry exactly ONE landing-lead story — the clause
     in priorReadingLine and the landingReading token must agree, and the stale unconditional
     "no algorithmic lead" wording may appear ONLY when the landing truly carries none. */
  assert("T-3b the prior line's landing clause derives from landingReading.leadMonths",
    fa.tokens.priorReadingLine.includes("carrying " + landingLeadClause + ","));
  assert("T-3b 'no algorithmic lead' appears in the prior line ONLY when the landing carries none",
    (fa.landingReading.leadMonths === 0) === fa.tokens.priorReadingLine.includes("carrying no algorithmic lead,"));
  const fill = (t) => t.replace(/\{(\w+)\}/g, (_, k) => {
    if (!(k in holes)) throw new Error("unknown hole {" + k + "}");
    return holes[k];
  });
  const TEMPLATES = {
    referenceReadingLine: "{refPct} — public-evidence reference reading, policy-labeled scenario. Computed at an algorithmic lead of 0 months with family multipliers at 1.0×.",
    c2LabelLine: "Quoted from the r4 adversarial adjudication (run B §C2, 2026-07-25), which is what this public-evidence reference reading is: \"Transitional public-evidence repair scenario: approximately 55–61%, midpoint 59%, under 50% paid-capacity occupancy, the reference 15:1/cache/commercial mix, declared fleet weights, low/committed planning rents, and unresolved Trainium throughput.\" (\"Under\" there means UNDER THE ASSUMPTION OF: the live reference holds utilization — which is what this page now calls what the quotation above calls paid-capacity occupancy — at exactly 50%, not below it. And the quoted \"midpoint\" is that adjudication's word for the reference point it selected, not an arithmetic centre: the rounded 55–61 span centres on 58, and the 55.2–61.3 public-only reconstruction reported below centres on 58.25.) Between 2026-08-24 and 2026-09-10 the live reference reading sat BELOW that quoted zone, because the im-arc T4 fold found no admissible public planning rate for GB200, GB300 or Trainium3 and the reference was computed over the four legs that priced. Since the owner adopted provisional planning rents for those three legs on 2026-09-10, all seven price and the live reference reading sits INSIDE the quoted zone again, at ≈58%. Agreement recovered by adopting an assumption is not the same evidence as agreement that was there all along, and this sentence is not claiming it is. The quoted zone is left exactly as it was written.",
    mustNotBeCalledLine: "That adjudication also states what this reading must not be called. It must not be called: verified; actual; central Anthropic margin; a confidence interval; a coherent public-market-rent result.",
    convergenceLine: "Three DIFFERENT METHODS inside one adjudication overlap on this zone. The r4 adversarial review ran a public-only reconstruction, a reconstruction from this project's own internal research record and a physics-only bound, landing at 55.2–61.3, 58–64 and 55–70 respectively; they overlap between 58 and 61.3. That is agreement across METHODS WITHIN ONE REVIEW — not independent corroboration, not a statistical result, and no distribution is implied.",
    /* row 499 re-mint (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
       ONE sentence replaced, because it stopped being true — the page no longer opens in this state.
       M8 exit-gate F1 (2026-08-13): the replacement itself went stale at the 08-08 opener flip
       (the landing now carries its author's +2-month assumption), so the clause is the
       {landingLeadClause} hole, derived from landingReading through one named formatter below.
       Everything else in the template, including every number and the whole prior-basis clause,
       is byte-unchanged.
       2026-09-12 im-default-window-and-mcp-discrepancy (Astra review round 3 F9): TWO WORDS added, "by default",
       because a reader can now make another scenario the default in their own browser and the unqualified
       "it now opens on" became false for that reader. No number, hole or other clause moved; memo §2.9 carries the
       same two words, so the provenance gate below still compares like with like. */
    priorReadingLine: "{priorPct} — the calculator's own default reading, policy-labeled scenario. Until 2026-08-06 this was also the state the calculator opened in; by default it now opens on a named estimate preset carrying {landingLeadClause}, and this reading is one selection away in the same control. It is the reference reading plus exactly one declared assumption: the owner-ratified {trendMonths}-month algorithmic-lead prior for closed frontier labs, which at the ratified {trendRate}×/yr rate divides modeled cost-out by E ≈ {E}. It is a scenario prior, not a measurement — this page identifies no public disclosure of any lab's private serving-stack lead, and has not measured one.",
    /* T5 rec 5, round 3: ONE span of this pinned fixture moved. The disclaimer named the
       real-world quantity directly, in a NEGATIVE construction, which is why two earlier passes
       left it alone. The reviewer's position is that rec 5 bars the phrase outright absent
       a matched estimand, boundary, period, fleet and billing basis, and that keeping it
       preserves the ambiguous object the rec asked to remove. That is right: the disclaimer does
       not need the barred referent to do its work, and "any provider's real margin" says the same
       thing without smuggling in an object this page cannot identify. Nothing else in the token
       changed. */
    bridgeLine: "How the readings relate. The public-evidence reference sits numerically below the adopted analyst reading, and is built on 50% utilization, a discounted billing mix, no generalized speculative-decode credit, unresolved Trainium throughput and a low/committed planning-rent perimeter. Those are what make THIS page's number what it is; because the analyst's own calculations are unpublished, this page does not claim they explain the gap. The calculator's own default sits above the reference by exactly one declared assumption — the owner-ratified +3-month algorithmic lead, which divides modeled cost-out by E ≈ 1.316 — and by nothing else: the two readings share every other input. Neither calculator reading is evidence that any provider's real margin is any particular number. At the public-evidence reference — algorithmic lead 0 months, family multipliers 1.0× — this page's strategic-partner ladder reaches ≈80 after adopting partner rates and higher occupancy, ≈83 after then switching to the throughput serving regime, and ≈85 after additionally taking a list-only billing mix — alternative scenarios, not findings. How this page's earlier figure relates to these readings. Until 2026-08-06 this page published ≈77%; this is the first version whose numbers have been through a full adversarial review, and the earlier figure is best read as a pre-review draft rather than a retracted claim. Nothing shared before that date silently re-renders at a new number: a pre-v5 share link no longer resolves at all and says so, and a link carrying the figure it was shared at renders that figure beside the current one. The distance was not one adjustment but three, and only the last was about margins: a rebuild of how this page models SERVING (the roofline display path, the capacity-width solver and serve-feasibility-filtered fleet membership, 2026-07-19..23) moved it by far the most; a model-size revision moved it slightly back; and the margin-evidence adjudication of 2026-07-26 raised it to the ≈58% public-evidence reference reading above. The owner-ratified algorithmic-lead prior accounts for the rest of the way to the calculator's own default reading. All of these are differences between scenario readings of this calculator, not measured changes in anyone's economics.",
    basisDeclarationLine: "Every calculator figure in the explanations below is the public-evidence reference reading — an algorithmic lead of 0 months, family multipliers at 1.0× — unless that figure names its basis otherwise where it stands. The calculator's own default reading, {priorPct}, carries the ratified prior and is shown above.",
    execSummaryFrameLine: "What would have to be true to reach the higher readings. Four of the rows below move exactly one control from the calculator's own default state ({priorPct}) and show what the engine then computes — each is a state you can reproduce by moving that one control. One row names a lever this page cannot price on public evidence and says so instead of showing a number; it states what receipts would have to exist. The rows are ordered by declared plausibility — the order this page's owner set — and are deliberately NOT sorted by result. These are estimates of what would have to be true, not claims that any of it is true.",
  };
  /* J-10 run 3: the SAME provenance hole the spec-decode row had, and it was wider. These eight
     templates are described as "authored in memo §2.9", but three runs of folds had updated the
     engine and these fixtures while §2.9 kept its pre-run-1 wording — it still said "Three
     independent methods converged" and still carried the causal "because it holds …" bridge that
     run 1 removed as an overclaim. Nothing could catch that, because the provenance lived in a
     comment. It lives here now: §2.9 is parsed and compared to the pinned templates. */
  P.gate("research/b9-m6-fa-memo.md", 10, (memoSrc) => {
    const NAMES = { referenceReadingFrame: "referenceReadingLine", c2Label: "c2LabelLine",
      mustNotBeCalled: "mustNotBeCalledLine", convergenceNote: "convergenceLine",
      priorReadingFrame: "priorReadingLine", bridge: "bridgeLine",
      basisDeclaration: "basisDeclarationLine", execSummaryFrame: "execSummaryFrameLine" };
    const norm = (x) => x.replace(/`/g, "").replace(/\s+/g, " ").trim();
    let checked = 0;
    for (const [memoName, tplKey] of Object.entries(NAMES)) {
      const at = memoSrc.indexOf("**`" + memoName + "`**");
      const lines = memoSrc.slice(at).split("\n");
      const quoted = [];
      let started = false;
      for (const ln of lines.slice(1)) {
        if (ln.startsWith(">")) { started = true; quoted.push(ln.slice(1).trim()); }
        else if (started) break;
      }
      const ok = at > 0 && quoted.length > 0 && norm(quoted.join(" ")) === norm(TEMPLATES[tplKey]);
      P.assert("T-3 provenance: memo §2.9 `" + memoName + "` IS the pinned " + tplKey,
        ok, JSON.stringify({ memo: norm(quoted.join(" ")).slice(0, 110), tpl: norm(TEMPLATES[tplKey]).slice(0, 110) }));
      if (ok) checked++;
    }
    P.assert("T-3 provenance: all EIGHT §2.9 blocks were located and matched (a renamed block cannot pass silently)",
      checked === 8, String(checked));
    /* Run 4 extended the same treatment to the low-evidence no-control copy, which is normative in
       §17.4 and was NOT covered by the §2.9 sweep — run 4's P1 edited it, and nothing would have
       caught a memo that kept the old wording. Rendered with a literal {param} so the hole survives. */
    {
      const at = memoSrc.indexOf("**`lowEvidenceNoControlCopy`**");
      const lines = memoSrc.slice(at).split("\n");
      const quoted = [];
      let started = false;
      for (const ln of lines.slice(1)) {
        if (ln.startsWith(">")) { started = true; quoted.push(ln.slice(1).trim()); }
        else if (started) break;
      }
      P.assert("T-3 provenance: memo §17.4 `lowEvidenceNoControlCopy` IS the shipped no-control copy",
        at > 0 && norm(quoted.join(" ")) === norm(E.LOW_EVIDENCE_COPY["no-control"]("{param}")),
        JSON.stringify({ memo: norm(quoted.join(" ")).slice(0, 120), live: norm(E.LOW_EVIDENCE_COPY["no-control"]("{param}")).slice(0, 120) }));
    }
  });
  assert("T-3 the pinned template set is exactly NINE (eight block templates + the spec-decode row)",
    Object.keys(TEMPLATES).length + 1 === 9, String(Object.keys(TEMPLATES).length + 1));
  for (const [key, tpl] of Object.entries(TEMPLATES))
    assert("T-3 template [" + key + "] renders BYTE-EQUAL to its pinned fixture", fa.tokens[key] === fill(tpl),
      JSON.stringify({ want: fill(tpl).slice(0, 160), got: String(fa.tokens[key]).slice(0, 160) }));
  /* The ninth: §17.2's re-pinned spec-decode row. Pinned as an INDEPENDENT byte fixture, not by
     comparing the rendered row to the engine constant it is generated from — that compares a value
     to itself and survives any mutation of the constant (verified: mutating one byte of
     MTP_ROW_COPY left the self-comparison passing). The bytes below are transcribed from memo
     §17.2, so a drift in either direction fails. */
  const MTP_ROW_FIXTURE = "Speculative decode / MTP credit \u2014 a lever this page deliberately leaves OUT of its default. [lever] Speculative decoding and multi-token prediction: related techniques, not two names for one thing \u2014 multi-token prediction is a training/architectural choice that can supply the draft model a speculative-decoding implementation needs. Speculative decoding proposes candidate tokens for the target model to verify; where accepted-token gains exceed draft and verification overhead it raises the tokens generated per unit of compute, and therefore lowers modeled cost-out. [evidence label] That the mechanism is real and material is now vendor-officially on the record and dated: an OpenAI engineering post of 2026-07-29 credits an improved draft/speculator model with \"more than 15%\" additional token-generation efficiency, and its pricing post of 2026-07-30 says it is \"passing those gains on to customers\". That is a vendor claim \u2014 self-reported, single-source, not independently verified \u2014 at ONE lab, and that lab is not this page's flagship. Separately, and from a different party, published measurements on open serving stacks span about 14% at production-like batch to about 60% at modest concurrency. Both are the SAME model on the SAME stack \u2014 DeepSeek V3 under SGLang \u2014 differing in cluster scale, concurrency, sequence lengths and draft window, so the spread measures deployment conditions rather than two independent results, and neither is transferable to this fleet. The larger figure is the MTP-versus-no-MTP delta with overlap scheduling absent from both arms: 82.0 versus 51.0 tokens/s/rank (+60.8%). The post separately reports 60.4 tokens/s/rank for overlap scheduling without MTP; because that SGLang version did not support MTP together with overlap scheduling, it does not report MTP's incremental gain on top of overlap. Both figures are cited from that post and are not registered evidence rows of this page: they label a scale, and nothing computes from them. The two classes of evidence are reported side by side and are never added together. [why no number] That the MECHANISM exists is established. That it runs in production at one frontier lab is that lab's own dated report, labeled above as the vendor claim it is \u2014 not something this page has independently verified. Whether it is deployed on the fleet THIS page models, and with what effect, is established by nothing this page has found. Acceptance rates, average accepted tokens per step, and draft-model size and architecture are not publicly disclosed for the fleet this page models. Its cited evidence set carries four non-fleet acceptance figures and no fleet-specific one: two non-flagship anchors \u2014 one reporting an average acceptance length of about 1.8\u20131.9 (SGLang's acceptance-length metric counts accepted draft tokens plus the bonus token produced per verification step), one assuming 70% acceptance for a single speculative token \u2014 and, in the open-stack post cited above, average acceptance lengths of 2.18 and 2.44 at two draft-window settings. None is for the fleet modelled here, and these are the figures this page has found, not a claim about every figure that exists. This calculator's serving form declares the speculative pair, and the roofline itself still computes at the conservative 1/1 floor structurally \u2014 any credit is applied after that floor, to decode only. The mechanism's benefit is conditional on acceptance, draft cost, batching and workload; the control offered here models none of those, so it is a scenario credit you declare, not a mechanism this page runs. Of the five legs in the default fleet exactly one documents that its anchor carries no speculative credit \u2014 and under the typed statuses this lever acts on, three legs are creditable and two, gb300 and tpu7, cannot be established and are exempt \u2014 so this page applies no fleet-wide credit of its own, and the r4 review's verdict on exactly that question is \"do not apply one universal multiplier\". [what receipts would have to exist] Per-leg workload-weighted acceptance and draft-overhead receipts. What this page ships instead is a control you turn: off by default, never applied to a leg whose deployed efficiency already absorbs speculation or whose status this page cannot establish, disclosed on every leg it does reach, and never used to select a reading of this page's own. The credit stays at zero in this page's default \u2014 a no-credit convention, which cannot inflate this page's margin, and not a finding that the credit is zero.";
  assert("T-3 template [mtpRowCopy] is byte-equal to the INDEPENDENT §17.2 fixture",
    E.MTP_ROW_COPY === MTP_ROW_FIXTURE,
    JSON.stringify({ engineLen: String(E.MTP_ROW_COPY).length, fixtureLen: MTP_ROW_FIXTURE.length }));
  assert("T-3 …and the shipped exec-summary row renders exactly those bytes",
    fa.tokens.executiveSummaryRows[3].startsWith(MTP_ROW_FIXTURE));
  /* J-10 run 3 made the fixture's PROVENANCE executable. The comment above claimed the bytes were
     transcribed from memo §17.2, but the run-1 fold had updated the engine and this fixture and NOT
     the memo — the two had silently diverged at the 14–60% attribution sentence since run 1, so the
     claim was already false when run 3 read it. A prose claim about where bytes came from cannot
     fail; this can. The memo blockquote is parsed and compared, so a future fold that edits one and
     not the other breaks the suite instead of quietly restoring the drift. */
  P.gate("research/b9-m6-fa-memo.md", 2, (memoSrc) => {
    const at = memoSrc.indexOf("**`mtpRowCopy`** (normative bytes");
    const lines = memoSrc.slice(memoSrc.indexOf("\n", at) + 1).split("\n");
    const quoted = [];
    for (const ln of lines) { if (!ln.startsWith(">")) break; quoted.push(ln.slice(1).trim()); }
    const memoBytes = quoted.join(" ")
      .replace(/\*\*(\[[^\]]+\])\*\*/g, "$1")     // the memo bolds the four section markers
      .replace(/\s+/g, " ").trim();
    P.assert("T-3 provenance: memo §17.2's normative blockquote IS the shipped mtpRowCopy (whitespace-normalised)",
      at > 0 && memoBytes === String(E.MTP_ROW_COPY).replace(/\s+/g, " ").trim(),
      JSON.stringify({ memoLen: memoBytes.length, engineLen: String(E.MTP_ROW_COPY).length }));
    P.assert("T-3 provenance negative: a one-word drift in the memo copy FAILS this check",
      memoBytes.replace("no-credit convention", "no credit convention") !== String(E.MTP_ROW_COPY).replace(/\s+/g, " ").trim());
  });
  assert("T-3 negative: the mtpRowCopy oracle is INDEPENDENT (a mutated constant would fail it)",
    MTP_ROW_FIXTURE.replace("no-credit convention", "no-credit  convention") !== E.MTP_ROW_COPY);
  assert("T-3 negative: a ONE-BYTE mutation of any template FAILS",
    fill(TEMPLATES.bridgeLine).replace("How the readings relate.", "How the readings relates.") !== fa.tokens.bridgeLine);
  assert("T-3 no hole is left unresolved in any shipped token",
    !Object.keys(TEMPLATES).some(k => /\{\w+\}/.test(fa.tokens[k])));
}

/* ================= T-4 the exec summary is ENGINE-DERIVED, not static =================
   Scoped (gate P0-4: v1's "every row must move" contradicted T-6's no-number requirement). T-4
   governs the four NUMERIC rows only; row 4 is excluded and governed solely by T-6, and the
   exclusion set is asserted to be exactly {4} so a future numeric row cannot quietly inherit it. */
{
  const rows = E.EXEC_SUMMARY_ROWS;
  const tokens = fa.tokens.executiveSummaryRows;
  assert("T-4 the row registry and the rendered rows are the same length (five)",
    rows.length === 5 && tokens.length === 5, JSON.stringify([rows.length, tokens.length]));
  const nonComputed = rows.map((r, i) => [r, i]).filter(([r]) => !r.computed).map(([, i]) => i + 1);
  assert("T-4 the T-4-exempt set is EXACTLY {4} (a future numeric row cannot inherit the exemption)",
    JSON.stringify(nonComputed) === JSON.stringify([4]), JSON.stringify(nonComputed));
  /* Each value is RE-DERIVED independently here from workload(), never read back from the token. */
  for (const row of rows.filter(r => r.computed)) {
    const st = stateWith(row.override);
    const want = "≈" + Math.round(pctOf(st)) + "%";
    const tok = tokens[row.order - 1];
    assert("T-4 row [" + row.id + "] renders the independently re-derived engine value " + want,
      tok.startsWith(want), tok.slice(0, 80));
    const controlKeys = Object.keys(row.override).filter(key => !(row.id === "owned-tco" && key === "kwh"));
    assert("T-4 row [" + row.id + "] differs by EXACTLY ONE reader-control key",
      controlKeys.length === 1, JSON.stringify({ controls: controlKeys, override: Object.keys(row.override) }));
    /* im-arc T4 fold (2026-08-24), memo §2 [F8]: the row's override is now its CONTROL ALONE. The
       T2 historical $0.07 pin is withdrawn and replaced by a region reference resolved by id, which
       is not an override at all — so "one control" is now literally true of this row's override,
       and the region it reads is asserted separately. */
    if (row.id === "owned-tco") assert("T-4 owned-TCO row carries only its control, and names its region by id",
      JSON.stringify(Object.keys(row.override).sort()) === JSON.stringify(["hwMode"])
        && row.electricityRegionRef === "us-industrial",
      JSON.stringify({ override: Object.keys(row.override), region: row.electricityRegionRef }));
  }
  /* The mutation check — and it must run THROUGH THE ROW FORMATTER, not beside it. The first cut
     compared two direct `pctOf()` calls to each other, which proves only that `workload()` responds
     to `priceOut`; four hard-coded strings carrying today's correct values would have passed every
     T-4 check including that one (verified). Perturbing the formatter's own base state and
     requiring the RENDERED tokens to move is what a static row cannot survive. */
  {
    const rendered = E.execSummaryRowTokens(opus, median, v => "≈" + Math.round(v) + "%");
    assert("T-4 the exported renderer reproduces the shipped tokens byte-for-byte (same path)",
      JSON.stringify(rendered) === JSON.stringify(tokens));
    const perturbed = E.execSummaryRowTokens(opus, median, v => "≈" + Math.round(v) + "%", { priceOut: 40 });
    const numericIdx = rows.filter(r => r.computed).map(r => r.order - 1);
    assert("T-4 mutation: perturbing an engine input MOVES every RENDERED numeric row (a static row cannot)",
      numericIdx.every(i => perturbed[i] !== tokens[i]),
      JSON.stringify(numericIdx.filter(i => perturbed[i] === tokens[i])));
    assert("T-4 mutation: the non-computed row is UNMOVED by the same perturbation (it carries no value)",
      perturbed[3] === tokens[3]);
    /* The negative fixture must exercise the SAME predicate the positive one uses, applied to a
       simulated static renderer. The first cut of this line compared two copies of the same array
       and was therefore true by construction — a tautology sitting inside the assertion written to
       catch tautologies. The predicate is factored out here so both arms genuinely run it. */
    const movesUnderPerturbation = (renderFn) => {
      const a = renderFn(null), b = renderFn({ priceOut: 40 });
      return numericIdx.every(i => a[i] !== b[i]);
    };
    assert("T-4 the REAL renderer moves every numeric row under the same predicate",
      movesUnderPerturbation(o => E.execSummaryRowTokens(opus, median, v => "≈" + Math.round(v) + "%", o)));
    assert("T-4 negative: a STATIC renderer FAILS that predicate (hard-coded rows are caught)",
      movesUnderPerturbation(() => tokens) === false);
  }
  /* D-6t: "one control" is true of the CONTROL count and false of the PARAMETER count for row 3,
     and the block says so — rendering the six declared TCO inputs READ FROM THE LIVE STATE. */
  {
    const st = stateWith(E.EXEC_SUMMARY_ROWS[2].override);
    assert("T-4/D-6t row 3 renders the six-input TCO assumption vector, read from the live state",
      tokens[2].includes("That one control pulls in six declared inputs")
      && tokens[2].includes("NOT the multi-setting owned-TCO exploration route")
      && tokens[2].includes("takes its electricity from the registered us-industrial region row by id")
      && tokens[2].includes(E.tcoAssumptionVector(st)), tokens[2].slice(0, 200));
  }
}

/* ================= T-5 ordering is DECLARED PLAUSIBILITY, never margin ================= */
{
  const rows = E.EXEC_SUMMARY_ROWS;
  const rendered = rows.map(r => r.id);
  const numeric = rows.filter(r => r.computed);
  const marginSorted = [...numeric].sort((a, b) => pctOf(stateWith(b.override)) - pctOf(stateWith(a.override))).map(r => r.id);
  const renderedNumeric = rendered.filter(id => numeric.some(r => r.id === id));
  assert("T-5 the rendered order is the declared plausibility order and is NOT the margin order",
    JSON.stringify(renderedNumeric) !== JSON.stringify(marginSorted),
    JSON.stringify({ rendered: renderedNumeric, marginSorted }));
  assert("T-5 the declared order is contiguous 1..5 and is the registry's own `order` field",
    JSON.stringify(rows.map(r => r.order)) === JSON.stringify([1, 2, 3, 4, 5]));
  /* "Not margin-sorted" + "numbered 1..5" is NOT the owner's order — a registry with util-70 and
     util-75 swapped satisfies both and would ship a different ranking under a green suite (gate
     round 2 P0-4 forged exactly that and it passed). The owner's declared plausibility order is
     therefore PINNED as a literal sequence, with a swap fixture proving the pin can fail. */
  const DECLARED_PLAUSIBILITY_ORDER = ["util-70", "util-75", "owned-tco", "specdecode", "trend-6"];
  assert("T-5 the registry ships the OWNER'S declared plausibility order, pinned as a sequence",
    JSON.stringify(rows.map(r => r.id)) === JSON.stringify(DECLARED_PLAUSIBILITY_ORDER),
    JSON.stringify(rows.map(r => r.id)));
  /* The negative fixture runs the REAL predicate against a forged registry — comparing a swapped
     copy to the pinned array would be true by construction, which is the tautology class round 2
     caught in the T-4 fold. The forgery here is exactly round 2's own: swap util-70/util-75 and
     renumber 1..5, which passed every earlier T-5 check. */
  {
    const forgedRegistry = [...rows].map(r => ({ ...r }));
    [forgedRegistry[0], forgedRegistry[1]] = [forgedRegistry[1], forgedRegistry[0]];
    forgedRegistry.forEach((r, i) => { r.order = i + 1; });
    const orderPinHolds = (reg) =>
      JSON.stringify(reg.map(r => r.id)) === JSON.stringify(DECLARED_PLAUSIBILITY_ORDER);
    const contiguous = (reg) => JSON.stringify(reg.map(r => r.order)) === JSON.stringify([1, 2, 3, 4, 5]);
    assert("T-5 negative: round 2's exact forgery (util-70/util-75 swapped, renumbered) FAILS the pin",
      contiguous(forgedRegistry) && !orderPinHolds(forgedRegistry));
    assert("T-5 …and the real registry PASSES the same predicate", orderPinHolds(rows));
  }
  assert("T-5 the rendered rows follow that same pinned sequence (order field and array agree)",
    rows.every((r, i) => r.order === i + 1 && r.id === DECLARED_PLAUSIBILITY_ORDER[i]));
  assert("T-5 the ordering BASIS is stated on the block (a reader cannot mistake it for a ranking by size)",
    readFileSync(join(ROOT, "site/app.js"), "utf8").includes("Ordering basis: the owner's declared plausibility order"));
}

/* ================= T-6 the spec-decode row =================
   Post-gate owner ruling (memo §16.2 A-1, bytes at §17.2): the row stops being a bare refusal. The
   lever exists, it is deliberately out of the default, and it is the user's to turn. The four
   elements the Polaris grant required survive inside it. */
{
  const tok = fa.tokens.executiveSummaryRows[3];
  for (const el of ["[lever]", "[evidence label]", "[why no number]", "[what receipts would have to exist]"])
    assert("T-6 the row carries its required element " + el, tok.includes(el));
  assert("T-6 the row carries NO numeric margin token (it is the one row that shows no number)",
    !/≈\d+%/.test(tok), (tok.match(/≈\d+%/g) || []).join(","));
  assert("T-6 the row states the owner's doctrine: out of the default, and a lever to be turned",
    /deliberately leaves OUT of its default/.test(tok)
    && /no-credit convention, which cannot inflate this page's margin, and not a finding that the credit is zero/.test(tok));
  /* §16.6: the evidence label is the SWEEP's, and the two evidence classes are never merged. */
  assert("T-6 the evidence label carries the dated vendor-official claim AND its cross-lab limit",
    /2026-07-29/.test(tok) && /more than 15%/.test(tok)
    && /not this page's flagship/.test(tok) && /self-reported, single-source, not\s+independently verified/.test(tok.replace(/\s+/g, " ")));
  assert("T-6 the independent measurements stay a SEPARATE class and are never summed with the vendor claim",
    /about 14% at production-like batch/.test(tok) && /never added together/.test(tok));
  /* b9 spec-decode LEVER — THE AFFORDANCE FLIP HAS FIRED. The M6 contract was always that this row
     ships `no-control` and flips to `jump` WHEN THE LEVER LANDS, "with no new mechanism": two fields
     on one frozen registry row and nothing else. The lever landed, so the assertion moves with it —
     the contract is unchanged, its precondition is. */
  assert("T-6 the low-evidence affordance renders in its `jump` state (§17.4 — the lever has landed)",
    tok.includes(E.LOW_EVIDENCE_COPY.jump("Speculative decode / MTP credit")));
  assert("T-6 the registry types this row non-computed with a jump affordance pointing at the control",
    E.EXEC_SUMMARY_ROWS[3].computed === false
    && E.EXEC_SUMMARY_ROWS[3].lowEvidence.state === "jump"
    && E.EXEC_SUMMARY_ROWS[3].lowEvidence.controlKey === "specDec");
  /* "NO NEW MECHANISM" is the load-bearing half of the contract, so it is asserted rather than
     trusted: the flip changed TWO FIELDS, the copy formatter for the retired state is retained
     unedited, and `jump` is the SAME state the two utilization rows already used. */
  assert("T-6 the flip added no mechanism — `no-control` copy is retained unedited and `jump` is pre-existing",
    typeof E.LOW_EVIDENCE_COPY["no-control"] === "function"
    && /This calculator has no control for it yet/.test(E.LOW_EVIDENCE_COPY["no-control"]("X"))
    && E.EXEC_SUMMARY_ROWS.filter(r => r.lowEvidence && r.lowEvidence.state === "jump").length === 3);
  assert("T-6 the row's param label is byte-unchanged by the flip",
    E.EXEC_SUMMARY_ROWS[3].lowEvidence.param === "Speculative decode / MTP credit");
  /* §17.4's other half: the pattern has a WORKING instance, so it is not unfalsifiable. */
  assert("T-6/§17.4 the affordance's `jump` state has at least one live instance with a real control key",
    E.EXEC_SUMMARY_ROWS.some(r => r.lowEvidence && r.lowEvidence.state === "jump" && typeof r.lowEvidence.controlKey === "string"));
  assert("T-6/§17.4 every declared jump target is a REAL engine parameter key",
    E.EXEC_SUMMARY_ROWS.filter(r => r.lowEvidence && r.lowEvidence.state === "jump")
      .every(r => E.SECTIONS.some(sec => sec.params.some(p => p.k === r.lowEvidence.controlKey))));
}

/* ================= T-7 legacy retirement — STRUCTURAL, not numeric =================
   Gate P1-3: numeric-string sweeping tests the wrong property in BOTH directions — a legitimate
   slider state can coincidentally round to a retired headline, and a retired route can be reachable
   while displaying a different number. The structural properties decide it. */
{
  const retired = E.RETIRED_PERSPECTIVES;
  // (a) every retired id is absent from every live selector and normalizes to its migration target
  assert("T-7(a) no retired perspective id survives in the live registry",
    Object.keys(retired).every(id => !E.PERSPECTIVES.some(p => p.id === id)), Object.keys(retired).join(","));
  assert("T-7(a) every retired id maps to a LIVE migration target",
    Object.values(retired).every(target => E.PERSPECTIVES.some(p => p.id === target)), JSON.stringify(retired));
  // (c) the map is byte-unchanged by M6 — M6 retires nothing, so it adds no migration row
  assert("T-7(c) RETIRED_PERSPECTIVES is byte-unchanged by M6 (M6 retires no perspective)",
    JSON.stringify(retired) === JSON.stringify({ teortaxes: "x80-v3", zephyr: "x80-v4", semi: "x90-v1", skeptic: "x60-v3" }),
    JSON.stringify(retired));
  // (d) the ≈37 language is ABSENT from every FA token — asserted against BOTH forms, since the
  //     escape `≈` is exactly what hid the live violation from four memo versions.
  {
    const bag = [];
    for (const [k, v] of Object.entries(fa.tokens)) {
      if (typeof v === "string") bag.push([k, v]);
      else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === "string") bag.push([k + "[" + i + "]", x]); });
    }
    /* im-release-edit-r2 (2026-09-10): the bare "≈37" clauses were a sound shortcut while 37 was
       ONLY ever the retired pre-repair figure. The owner's fleet-rent adoption moved the traffic
       span to "≈37% to ≈66%", so a legitimately computed 37 now trips a sweep for a retired
       COMPARISON. Narrowed to the comparison itself, which is what T-7(d) is named for and what the
       memo actually retired — a sweep that fires on a digit rather than on a claim will keep firing
       on innocent arithmetic, and the pressure then is to delete the sweep. */
    const hits = bag.filter(([, v]) => /≈\s?48\s*(?:→|->|to)\s*≈?\s?37\b/.test(v)
      || /\\u2248\s?48\s*(?:→|->|to)\s*\\u2248?\s?37\b/.test(v));
    assert("T-7(d) the pre-repair ≈48 → ≈37 comparison is ABSENT from every FA token (both forms swept)",
      hits.length === 0, JSON.stringify(hits.map(([k]) => k)));
    const engineSrc = readFileSync(join(ROOT, "site/engine.js"), "utf8");
    assert("T-7(d) and it is absent from the engine source in BOTH the literal and the escaped form",
      !engineSrc.includes("≈48 → ≈37") && !engineSrc.includes("\\u224848 \\u2192 \\u224837"));
    // …and PRESENT in the methods/changelog surface, where D-1 says it belongs
    const html = readFileSync(join(ROOT, "site/index.html"), "utf8");
    assert("T-7(d) the superseded readings survive as HISTORY in the methods box",
      html.includes("Superseded readings (history)") && /≈37%|&#8776;37%/.test(html));
  }
  /* (b) no live registry row carries a retired operating-point tuple.
     The fixture below is the r4 §C1 pre-repair cell set, READ OUT OF THE PRE-M1 COMMIT rather than
     recalled: at 6823358 `trn2.balanced` and `trn3.balanced` were `{b: 4}` with NO batchQuantity
     field at all — the b=4 Trainium operating points and the per-device batch/weight identity
     defect the r4 review named. Today both are b=32 aggregate-batch surrogates that DECLARE their
     batch quantity. Both halves carry a negative fixture, because the first cut of this assertion
     searched for a field name (`costPerMtokOut`) that does not exist anywhere in the registry — it
     therefore passed no matter what the cells contained. That is the defect class this program's
     gates keep finding, and it was mine; the replacement is written so it can fail. */
  {
    const ED = require("../site/engine-data-v22.js");
    const OP = ED.OPERATING_POINTS || {};
    const RETIRED_TUPLES = [["trn2", "balanced", 4], ["trn3", "balanced", 4]];
    const carriesRetired = (points) => RETIRED_TUPLES
      .filter(([hw, pt, b]) => points[hw] && points[hw][pt] && points[hw][pt].b === b)
      .map(([hw, pt]) => hw + "." + pt);
    assert("T-7(b) no live operating-point row carries a retired r4 §C1 pre-repair tuple (b=4 Trainium)",
      carriesRetired(OP).length === 0, JSON.stringify(carriesRetired(OP)));
    assert("T-7(b) negative: the check TRIPS when a retired tuple is re-introduced (it can fail)",
      carriesRetired({ trn2: { balanced: { b: 4 } } }).length === 1);
    // the per-device batch/weight identity defect: pre-repair cells declared no batchQuantity
    const missingIdentity = [];
    for (const [hw, pts] of Object.entries(OP))
      for (const [pt, cell] of Object.entries(pts))
        if (cell && typeof cell === "object" && !("batchQuantity" in cell)) missingIdentity.push(hw + "." + pt);
    assert("T-7(b) every live operating-point cell DECLARES its batch quantity identity",
      missingIdentity.length === 0, JSON.stringify(missingIdentity));
    assert("T-7(b) negative: a cell without a declared batch quantity IS detected",
      (() => { const probe = { trnX: { balanced: { b: 4 } } };
        return Object.values(probe.trnX).some(c => !("batchQuantity" in c)); })());
    // and the retired tuples really WERE the pre-repair state (the fixture is not invented)
    assert("T-7(b) the fixture is the real pre-repair state, not a guess: today's cells differ from it",
      OP.trn2.balanced.b !== 4 && OP.trn3.balanced.b !== 4
      && OP.trn2.balanced.b === 32 && OP.trn3.balanced.b === 32,
      JSON.stringify([OP.trn2.balanced.b, OP.trn3.balanced.b]));
  }
  // 7.2-bis: the second preset registry the enumeration must cover
  assert("T-7 MODELS (the 16-row preset registry) is enumerated and none is retired",
    E.MODELS.length === 16 && E.MODELS.every(m => typeof m.id === "string"), String(E.MODELS.length));
}

/* ================= T-8 the guard extension (D-6d) ================= */
{
  const guardSrc = readFileSync(join(ROOT, "tests", "trendline-interlock-b9.test.mjs"), "utf8");
  assert("T-8 site/engine.js is in the basis guard's scanned SURFACES, typed `evaluated`",
    // the needle is assembled rather than written literally, so the served-twin transform (which
    // rewrites the substring "../site/") cannot rewrite this test's expectation out from under it
    guardSrc.includes('{ rel: "..' + '/site/engine.js", kind: "evaluated"')
    && guardSrc.includes('"..' + '/site/engine.js": "evaluated"'));
  /* The two §3.1 figures now carry their basis in their OWN clause. Re-derived here with the same
     clause rule the guard uses, plus the negative fixture the memo requires: stripping the basis
     phrase must FAIL. */
  const clauseOf = (text, needle) => {
    const sentence = text.split(/(?<=[.!?])\s+/).find(x => x.includes(needle)) || "";
    return sentence.split(/;|,\s+(?=while\b|but\b|whereas\b|although\b|though\b|yet\b)/).find(c => c.includes(needle)) || "";
  };
  const REF_PHRASE = "public-evidence reference";
  /* im-arc T4 fold (2026-08-24, declared delta): x60-v3's published reference figure moved
     −37.8% -> −64.8%. gptpro's 81.7% blended reference reading is re-stated in the same note. */
  /* im-vet-six-repairs (2026-09-20): both figures move with the Trainium withdrawal and the TPU
     numerator repair; the property — each names its basis in its own clause — is unchanged. */
  for (const [id, needle] of [["gptpro", "83.0% blended"], ["x60-v3", "−40.4%"]]) {
    const note = E.PERSPECTIVES.find(p => p.id === id).note;
    assert("T-8 [" + id + "] the published figure \"" + needle + "\" names its basis in its OWN clause",
      clauseOf(note, needle).includes(REF_PHRASE), clauseOf(note, needle).slice(0, 160));
    const stripped = note.split(REF_PHRASE).join("the");
    assert("T-8 negative [" + id + "]: stripping the basis phrase FAILS the clause rule",
      !clauseOf(stripped, needle).includes(REF_PHRASE));
  }
}

/* ================= T-9 the `executive-summary` emitter class =================
   D-6u-bis: it mirrors `final-answer` EXACTLY — same adapter, harness-only registration, no
   `shape.ts` call site, no `envelopeFields` change. There is NO production emission of this class,
   and this suite asserts that rather than implying otherwise. */
{
  assert("T-9 `executive-summary` is in the closed emitter set and is WELD-REQUIRED",
    C.EMITTER_CLASSES.includes("executive-summary") && C.WELD_REQUIRED_CLASSES.includes("executive-summary"));
  assert("T-9 the closed sets grew by exactly this one class beyond `final-answer`",
    C.EMITTER_CLASSES.length === 10 && C.WELD_REQUIRED_CLASSES.length === 4, JSON.stringify(C.EMITTER_CLASSES));
  C.resetBoundaryForTest();
  C.registerEmitter("emitter:executive-summary", "executive-summary", C.domAdapter);
  const wl = E.workload(stateWith({}), undefined, E.scenarioContext(stateWith({})));
  const envFields = { renderableLegs: wl.fleetRenderable.renderableLegs, totalLegs: wl.fleetRenderable.totalLegs,
    renderableWeightShare: wl.fleetRenderable.renderableWeightShare };
  const weld = C.weldClause(envFields);
  const scope = { model: "opus", perspective: "median", policyPoint: 0.65, lens: "blend" };
  const claim = C.mintClaim({ subject: "opus@executive-summary", estimand: "margin.unit-serving",
    evidenceBasis: { kind: "policy-scenario", policyPoint: 0.65 }, role: "result",
    tree: C.tree({ margin: C.leaf("margin.unit-serving", scope, wl.margin * 100) }) });
  const good = { claim, weld, display: C.displayValue(wl.margin * 100), envelopeFields: envFields,
    visibleText: `${(wl.margin * 100).toFixed(1)}% ${weld}` };
  let ok = true; try { C.emit("emitter:executive-summary", good, null); } catch (e) { ok = false; var whyOk = String(e); }
  assert("T-9 a properly welded executive-summary emission is ACCEPTED", ok, typeof whyOk === "string" ? whyOk : "");
  let rejected = false;
  try { C.emit("emitter:executive-summary", { ...good, weld: undefined, visibleText: "90%" }, null); }
  catch (e) { rejected = /requires the shared weld token/.test(String(e)); }
  assert("T-9 an UNWELDED executive-summary emission is REJECTED at the boundary", rejected);
  let fabricated = false;
  try { C.emit("emitter:executive-summary", { ...good, weld: "[weld 9/9 legs renderable, 100% of blend weight; non-monotonic in scale]", visibleText: "90% [weld 9/9 legs renderable, 100% of blend weight; non-monotonic in scale]" }, null); }
  catch (e) { fabricated = /does not derive from the envelope's fields/.test(String(e)); }
  assert("T-9 a FABRICATED weld that contradicts the envelope's own fields is REJECTED", fabricated);
  C.resetBoundaryForTest();
  /* Stated rather than implied (D-6v): production registers only mcp-text/mcp-json for the six MCP
     tools. `executive-summary` — like `final-answer` — is registered in the contract harness and
     nowhere else, and this suite makes no claim that the site render goes through the boundary. */
  assert("T-9/D-6v there is NO production executive-summary registration (harness-only, like final-answer)",
    !readFileSync(join(ROOT, "mcp-server/src/shape.ts"), "utf8").includes("executive-summary"));
}

/* ================= T-10 R-4: nothing fully expanded by default ================= */
{
  const html = readFileSync(join(ROOT, "site/index.html"), "utf8");
  const m6Details = [...html.matchAll(/<details[^>]*id="(fa-[^"]+)"[^>]*>/g)];
  assert("T-10 every M6-rendered <details> in the page source is collapsed (no `open` attribute)",
    m6Details.length > 0 && m6Details.every(d => !/\bopen\b/.test(d[0])),
    JSON.stringify(m6Details.map(d => d[0])));
  const app = readFileSync(join(ROOT, "site/app.js"), "utf8");
  /* Scoped to the block that BUILDS the explainers. Two other `open` writes exist in app.js and
     neither is an M6 explainer: the slider-lock <dialog>'s no-showModal fallback, and the A-3 jump
     affordance opening the ANCESTOR sections of an existing control so the control it jumps to is
     focusable. Scoping here rather than over the whole region keeps the assertion about the thing
     it claims — that no explainer M6 RENDERS is expanded at first paint. */
  const entriesBlock = app.slice(app.indexOf("fa.tokens.higherJustificationEntries.forEach"), app.indexOf("renderExecSummary(fa);"));
  assert("T-10 the runtime-built justification <details> are never given `open` either",
    entriesBlock.length > 0 && !/\.open\s*=\s*true/.test(entriesBlock) && !/setAttribute\("open"/.test(entriesBlock));
}

/* ================= T-11 (D-6u-ter) each row's weld DERIVES from that row's own state =================
   v5 promised a cross-row REJECTION fixture. Executed across all five states, every one returns an
   IDENTICAL fleetRenderable (7/7, share 1) — so the welds are byte-identical and a swapped weld is
   indistinguishable by construction. That assertion could never fail, so it was withdrawn (gate R5
   P0). What replaces it CAN fail: a per-row derivation check plus a synthetic-state probe proving
   the derivation actually tracks renderability. The honest fact is stated, not papered over. */
{
  for (const row of E.EXEC_SUMMARY_ROWS.filter(r => r.computed)) {
    const st = stateWith(row.override);
    const wl = E.workload(st, undefined, E.scenarioContext(st));
    const want = E.fleetRenderableClause
      ? E.fleetRenderableClause(wl.fleetRenderable, false, undefined)
      : null;
    if (want === null) { assert("T-11 fleetRenderableClause is exported for per-row weld derivation", false); break; }
    assert("T-11 row [" + row.id + "] carries the weld RE-DERIVED from its OWN state",
      fa.tokens.executiveSummaryRows[row.order - 1].includes(want), want);
  }
  /* im-arc T4 fold (2026-08-24), memo §4: the honest fact CHANGED, and it is asserted as the new
     honest fact rather than relaxed. The default fleet still declares seven legs. Under a RENT
     basis only four of them price — gb200, gb300 and trn3 have no admissible public planning rate
     — so those rows weld 4/7 at 52% of the blend. The owned-TCO row prices all seven, because
     their capex is registered. Both are asserted by name; neither is allowed to drift.

     im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
     the honest fact changed AGAIN, in the other direction, and is re-asserted the same way. The
     three legs now carry adopted provisional planning rents, so a rent-basis row welds 7/7 at 100%
     of the blend exactly as the owned-TCO row does. The DIVERGENCE this assertion existed to pin —
     rent and owned welding different fleets — is gone, so what it pins now is that both bases weld
     the whole declared fleet. If a future leg loses its rate again, this fails, which is the point. */
  /* im-vet-six-repairs (2026-09-20), vetting finding E1: the honest fact changes a THIRD time and
     is re-asserted the same way. Both bases still weld the WHOLE fleet they are handed; that fleet
     is now the five-leg default, because the two Trainium legs are withdrawn on evidence grounds
     before pricing is ever reached. The divergence this assertion exists to pin — rent and owned
     welding different fleets — is still absent, and if a future leg loses its rate this still
     fails, which is the point. */
  assert("T-11 the honest fact, asserted rather than assumed: BOTH the rent-basis rows and the owned-TCO row weld the whole 5-leg default",
    E.EXEC_SUMMARY_ROWS.filter(r => r.computed).every(r => {
      const st = stateWith(r.override);
      const f = E.workload(st, undefined, E.scenarioContext(st)).fleetRenderable;
      return f.totalLegs === 5 && f.renderableLegs === 5
        && Math.abs(f.renderableWeightShare - 1) < 1e-9;
    }), JSON.stringify(E.EXEC_SUMMARY_ROWS.filter(r => r.computed).map(r => {
      const st = stateWith(r.override);
      const f = E.workload(st, undefined, E.scenarioContext(st)).fleetRenderable;
      return [r.id, st.hwMode, f.renderableLegs, f.totalLegs, f.renderableWeightShare];
    })));
  /* The sensitivity probe: a state constructed to DROP a leg must produce a DIFFERENT weld through
     the very same path, so the derivation check is demonstrably sensitive to what it claims to bind. */
  {
    const dropped = stateWith({ total: 12000 });   // executed: 5/7 legs, 84% of blend weight
    const wl = E.workload(dropped, undefined, E.scenarioContext(dropped));
    const other = E.fleetRenderableClause(wl.fleetRenderable, false, undefined);
    const base = E.fleetRenderableClause(
      E.workload(stateWith({}), undefined, E.scenarioContext(stateWith({}))).fleetRenderable, false, undefined);
    assert("T-11 synthetic-state probe: a state that drops a leg produces a DIFFERENT weld through the same path",
      other !== base, JSON.stringify({ base: base.slice(0, 70), other: other.slice(0, 70) }));
  }
}

/* ================= the exec-summary row hrefs RESOLVE (memo §5.2 validation) =================
   `site-links` scans literal HTML attributes; these hrefs are rendered by app.js at runtime and so
   never appear as literal attributes — they would be silently unvalidated. They are declared as
   typed data in the engine registry precisely so this assertion can resolve every one of them. */
{
  const html = readFileSync(join(ROOT, "site/index.html"), "utf8");
  const annexPath = join(ROOT, "site/research/final-answer-rationale.html");
  let annex = ""; try { annex = readFileSync(annexPath, "utf8"); } catch { /* built artifact */ }
  for (const row of E.EXEC_SUMMARY_ROWS) {
    const href = row.href;
    const frag = href.includes("#") ? href.slice(href.indexOf("#") + 1) : null;
    assert("hrefs: row [" + row.id + "] declares an evidence target", typeof href === "string" && href.length > 0);
    if (!frag) continue;
    if (href.startsWith("#"))
      assert("hrefs: row [" + row.id + "] in-page fragment #" + frag + " exists in index.html",
        html.includes('id="' + frag + '"'), href);
    else
      assert("hrefs: row [" + row.id + "] annex anchor #" + frag + " exists in the generated annex",
        annex.includes('id="' + frag + '"'), href);
  }
  assert("hrefs: M6 introduces no new EXTERNAL url",
    E.EXEC_SUMMARY_ROWS.every(r => !/^https?:/.test(r.href)));
}

/* ================= release-chain registration (memo §10.5) =================
   `npm test`, `test:served-node` and the twin allowlist are CLOSED enumerations — a new test file
   nobody adds to them never runs. Asserted mechanically rather than trusted. */
{
  const pkg = readFileSync(join(ROOT, "package.json"), "utf8");
  const sync = readFileSync(join(ROOT, "scripts/sync-site-tests.mjs"), "utf8");
  assert("chain: fa-m6-b9 is in the `npm test` chain", pkg.includes("tests/fa-m6-b9.test.mjs"));
  assert("chain: fa-m6-b9 is in the test:served-node loop", /test:served-node[\s\S]{0,600}fa-m6-b9/.test(pkg));
  assert("chain: fa-m6-b9 is in the sync-site-tests twin list", sync.includes('"fa-m6-b9.test.mjs"'));
  assert("chain: fa-explain-cdp is in BOTH browser scripts (the served-suite asymmetry is not inherited)",
    /"test:browser":[^"]*"[^"]*fa-explain-cdp/.test(pkg.replace(/\\"/g, '"')) || pkg.includes("tests/fa-explain-cdp.test.mjs"));
  assert("chain: fa-explain-cdp appears in test:browser AND test:served-browser",
    (pkg.match(/fa-explain-cdp/g) || []).length >= 2, String((pkg.match(/fa-explain-cdp/g) || []).length));
  assert("chain: the contrast gate is CHAINED into `npm test`, not merely mentioned",
    /"test":[^\n]*tests\/contrast-check\.mjs/.test(pkg));
}

P.summary();
console.log(failures ? `\n${failures} FA-M6 FAILURE(S)` : "\nALL FA-M6 (b9 M6) CHECKS PASS");
process.exit(failures ? 1 : 0);
