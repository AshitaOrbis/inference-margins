// FACE-VS-REGISTRY (bq-2189, 2026-09-10) — every QUOTED estimate face on the page must still be
// the figure the registry that feeds the calculator holds for it.
//
// Run: node tests/face-vs-registry.test.mjs — exits non-zero on any failure.
//
// WHY THIS GATE EXISTS. On 2026-08-24 a bulk recompute (`db73816`, capital recovery as an
// off-by-default named basis) rewrote 23 numeric lines of site/index.html in one pass. One of them
// was not engine-derived, and that is the defect below.
// CORRECTED 2026-09-10 (im-release-edit-r3) for Pro session 1 round 4, NEW N4. This sentence used
// to read "Twenty-two were ENGINE-DERIVED and the sweep was entitled to move every one", and that
// claimed more than the audit shows. The narrowed audit contains TWENTY engine-derived rows, one
// `mixed` row (L04, whose own row records that the authority to maintain it as engine-derived is
// UNRESOLVED), one quoted row (L05, the clobbered one) and one label inconsistency (L21). "Entitled
// to move every one" was a universal authorization claim resting on twenty established rows and one
// unresolved one. What is established: one clobbered quotation is demonstrated at L05, a separate
// engine-derived label inconsistency is documented at L21, L04's endpoints reproduce but its
// authority does not, L03 and L07 are historical comment descriptors rather than present-day
// reproductions, and no SECOND clobbered quotation has been established. The twenty-third line was
// Fable 5 round-3 card's companion figure, a QUOTED estimator reading, went from "≈80% at list" to
// "≈76% at list" — and 76 is below the 77% effective-billings figure printed beside it, which
// cannot be true, because effective price is 0.87875x list and a margin on the smaller denominator
// can never exceed the margin on the larger. It sat on master for seventeen days. Nothing caught
// it, and the reason is structural: the estimate-card faces are static markup BY DESIGN (rendering
// a quoted reading through the engine would imply the engine produced it), the bq-2120 sweep
// compared each card's face against its own BODY, and this figure disagreed with neither its body
// nor itself — it disagreed with `PERSPECTIVES[id].statedReading`, the registry the calculator
// loads when a reader clicks "Load this estimate". Face-against-body cannot see that.
//
// WHAT IT DOES NOT DO. It never recomputes a quoted reading through the engine and never asks the
// engine to agree with one. The distance between an estimator's stated figure and what this engine
// computes at the same vector is published on purpose as that estimate's "honest gap". This gate
// asserts one thing: the page and the registry quote the same estimator identically.
//
// TWO ADVERSARIAL ROUNDS (GPT-6 Astra, xhigh, 2026-09-10). Both returned NOT SOUND, and both were
// right; neither was argued with. What they taught, in the order it matters:
//
//   ROUND 2, finding A3 — THE ONE THAT CHANGED THE DESIGN. A mutation test that only asserts "the
//   gate went red" proves nothing about WHICH rule caught it. Astra restored the round-1
//   first-`data-persp` binding, restored magnitude-based ordering, and DELETED the ordering rule
//   outright — and all eleven regressions stayed green every time, because some other assertion
//   happened to fire. So every regression below now names the RULE it must trip, and the harness
//   asserts that rule specifically. A regression that goes red for the wrong reason now fails.
//   ROUND 2, A1 — attributes were read with `/class="([^"]*)"/`, so a SINGLE-QUOTED
//   `class='est-card featured'` was invisible and an injected corrupt card was never audited; and
//   `data-persp` was matched anywhere in the tag, so a decoy attribute holding old markup shadowed
//   the real one. Attributes are tokenized now, by exact name, in either quote style.
//   ROUND 2, A2 — the face's own reading on the registry's own basis was never compared to
//   `central`; ranges were compared without their UNITS, so "0-4% across 78.89-85.37 months" passed;
//   and an extra contradictory range could sit beside a correct one.
//   ROUND 2, A4 — requiring every effective reading to be paired with a list reading overreached:
//   a registry-consistent effective-only estimate would fail for a claim its registry never made.
//   Only the claims the registry actually supplies are required now.
//   ROUND 1 — numeral MEMBERSHIP is not a claim ("≈81% at list (previously ≈80%)" passed); sign was
//   discarded ("≈-80% at list" passed); span endpoints were a set, so "82 - 65%" passed; an HTML
//   COMMENT holding the correct sentence satisfied a rendered-content check; and `76% at
//   <em>list</em>` made the ordering rule silently vanish.
// WHAT IS STILL OPEN, said here rather than left for the next reader to discover (bq-2191).
// Five adversarial rounds, and the fifth held publication on the first item below. Its status has
// changed; the other two have not:
//   * "Parse HTML with an HTML parser." DONE, 2026-09-10 (im-guard-fix), and it took GPT Pro
//     session 1 round 5 filing sixteen more false certifications to force it. The regex filter this
//     line used to defend is gone: tests/inert-filter.mjs is a spec-shaped tokenizer, a tree builder
//     that models the page's optional-end-tag rules, and a CSS reader scoped to inline declarations,
//     with NO new dependency — the concern about hashing a third-party parser into a gate that
//     hashes every tracked source still stood, so it is written here and reviewed here. It is a
//     RESTRICTED grammar and the restriction is enforced by throwing rather than described, and
//     tests/inert-filter-dom-equivalence.test.mjs drives it and Chromium over every pinned case AND
//     over site/index.html itself, requiring them to agree passage for passage. That last part is
//     what makes "provably equivalent for the constructs this page uses" a claim someone checks.
//   * "Delimit the quotation explicitly in markup." Still right, still not done — sentence
//     punctuation is a weak boundary, and the abbreviation mask below is the patch that proves it.
//     It is also why round 5's SHOW regressions are extra CARDS rather than extra sentences: prose
//     after the quoted sentence is out of scope by design, so a contradictory second sentence there
//     is not something this gate claims to catch. Doing it means editing the served page.
//   * "Preserve an independent provenance reference" (the GPT council, 2026-09-10). The sharpest of
//     the three, and it is a limit rather than a bug: this gate compares the page against the ENGINE
//     REGISTRY, and both are hand-maintained in the same repository. A single careless edit touching
//     both leaves them agreeing and wrong, and nothing here would notice. What actually caught N1
//     was a third witness the gate cannot consult — research/changelog.md and the DEPLOYED BYTES,
//     which recorded ≈80% while master said ≈76%. Treat a green run as "the page and the registry
//     tell the same story", never as "the story is true".
// So: this gate catches the defect it was built for and FIFTY-FOUR mutations besides, plus one
// control asserting the unmutated page trips no rule — counted separately, because the court caught
// this header saying thirty-three by folding the control into the total, in a file whose entire
// argument is that an assertion must not claim more than it shows. Including
// every demonstration from four Astra rounds, a four-agent GPT council, GPT Pro session 1's round-3
// N3 — all ten of whose executed counterexamples are pinned below, with its two valid-markup
// controls still accepted — and round 5's eighteen.
// COUNTED, NOT RECALLED (fallback review F9, which caught three of these wrong). SIXTEEN of round
// 5's cases are pinned TWICE: once through the complete guard as a mutation, once at the filter
// boundary as a survival or removal control, because a mutation can only show that something IS
// caught and never that something harmless survived. The other TWO — T1 and T2 — are pinned once,
// at the boundary only, and the reason is structural rather than an omission: they are REJECTION
// errors, and a rejection cannot be expressed as a hide/show wrapper on the page. THIRTEEN of the
// SIXTEEN mutations went green under the filter this replaced; counting T2's spurious throw,
// FOURTEEN of the eighteen cases reproduced against the shipped bytes. The measurement is in
// reports/im-guard-fix-2026-09-10/evidence/old-vs-new-nonvacuity.txt rather than asserted here.
// It is a large improvement on nothing, which is what checked these figures before. It is not a
// proof, and the sentence above about what a green run means — "the page and the registry tell the
// same story", never "the story is true" — is unchanged by any of it.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const E = require("../site/engine.js");
const RAW = readFileSync(join(ROOT, "site", "index.html"), "utf8");

/* ============================================================================================
   THE HAND-LISTS THIS GUARD CONSULTS — written down for the same reason inert-filter.mjs's four
   sets are, and prompted by the same review finding one round later. Those four lists were all
   about the FILTER, and this file, sitting next to it, had four hand-lists of its own that nobody
   had enumerated. One of them certified.

   (a) THE ABBREVIATION MASK, `i.e|e.g|cf|approx|vs|no|fig|ca` (below). It exists so a full stop
       inside an abbreviation does not truncate the quotation early. An abbreviation NOT on it did
       exactly that, and dropped a stray contradictory range outside the checked span — executed
       through the complete guard, `etc.` `et al.` `Inc.` `Jan.` `resp.` all certified while the
       listed `Fig.` and `i.e.` went red.
       THE FIX WAS NOT A LONGER LIST. `range-closure` reads the whole FACE now, because the defect
       that rule names — "a reader cannot tell which is the claim" — belongs to a stray range
       ANYWHERE on the card, not to one that happens to fall after a sentence boundary. The mask
       still bounds the PRESENCE checks, where the quoted clause really is the right unit.
   (b) `ENT`, this file's entity table. It requires the trailing semicolon that the filter's decoder
       deliberately does not, so `≈8&#48% at list` reads as "≈80%" to a reader and as the numerals
       8 and 48 here. That is a FALSE RED, never a certification, which is why it is documented
       rather than fixed — and why the two decoders are allowed to differ at all.
   (c) The phrasings `readings()` recognises — "% at list", "% on effective billings", and the
       15% Batch variant. A reading phrased some other way is not seen; that direction is also a
       false red, because a face that fails to state a registry reading fails `companion-role`.
   (d) `UNITS`, the trailing unit words a range may carry. Same direction again.

   (b), (c) and (d) all fail SAFE — they under-recognise, and under-recognition makes this gate
   noisier rather than blinder. (a) was the one that failed the other way, which is why it is the
   only one that needed a structural answer rather than a note.
   ============================================================================================ */
/* ---------- text handling ----------
   Comments go first, in their OWN stage: a commented-out paragraph is not published, and a gate
   that reads one is checking text no reader will ever see. That stage is separately deletable on
   purpose — the N7-c regression below is red only because it runs, which is the preservation
   property GPT Pro session 1 round 5 verified by deleting it. Tags are stripped inside a face
   before it is matched, so `76% at <em>list</em>` cannot make a required comparison disappear.

   INERT AND HIDDEN CONTENT IS NOT PUBLISHED, so it must not be able to satisfy a check about what
   is published — and the filter must not be able to delete a VISIBLE contradiction either, which is
   the direction that certifies. That filter now lives in tests/inert-filter.mjs, rebuilt by
   im-guard-fix (2026-09-10) as a spec-shaped tokenizer, a tree builder that models the page's
   optional-end-tag rules, and a CSS reader scoped to inline style declarations. Its own header
   explains each of round 5's eighteen cases and what in it answers them; the eighteen are pinned
   below as N6-R5-* regressions, and tests/inert-filter-dom-equivalence.test.mjs drives the filter
   and Chromium over the same inputs — including this page — and requires them to agree. That twin
   is what keeps "equivalent for the constructs this page uses" a claim someone checks rather than a
   claim this file makes about itself.

   `<details>` is deliberately NOT stripped — the estimate-card bodies live inside one, and a
   disclosure the reader can open is published text. */
import { stripInert } from "./inert-filter.mjs";

const detag = (s) => s.replace(/<[^>]+>/g, "");
/* Entities are what a READER sees, so they are what the claim is. `&minus;83.1%` renders as
   -83.1% and used to be read here as +83.1 — Astra round 4. Decoded before anything is matched. */
const ENT = { nbsp: " ", minus: "-", ndash: "-", mdash: "-", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#8722": "-", "#8211": "-", "#8212": "-", "#45": "-", "#8776": "~" };
const decode = (s) => String(s).replace(/&(#?\w+);/g, (m, k) => (k in ENT ? ENT[k] : (/^#\d+$/.test(k) ? String.fromCharCode(Number(k.slice(1))) : m)));
const norm = (s) => decode(detag(decode(String(s)))).replace(/ /g, " ").replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim();
const SIGNED = /-?\d+(?:\.\d+)?/g;                     // SIGNED: "-80%" is a different claim from "80%"
const nums = (s) => (norm(s).match(SIGNED) || []).map(Number);

/* Tokenize a tag's attributes by NAME. `/data-persp="..."/` over the whole tag matched whichever
   copy came first, so a decoy attribute carrying old markup could shadow the real one, and a
   single-quoted attribute was not seen at all. */
function attrs(tagInner) {
  const out = {};
  const re = /([A-Za-z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;
  while ((m = re.exec(tagInner)) !== null) { const k = m[1].toLowerCase(); if (!(k in out)) out[k] = m[2] ?? m[3] ?? m[4] ?? ""; }
  return out;
}
const classList = (a) => String(a.class || "").split(/\s+/).filter(Boolean);

/* ---------- claims ----------
   A READING is a signed value plus the billing basis it is stated on. That is the unit a claim is
   made in, and the unit a bag of numerals cannot express. A RANGE is an ordered pair plus the UNIT
   it is stated in — "0-4 months" and "0-4%" are different claims. */
function readings(text) {
  const t = norm(text), out = [];
  for (const [re, basis] of [
    [/(-?\d+(?:\.\d+)?)\s*% (?:at|on) (?:the )?(?:undiscounted )?list(?: tariff| price)?\b/gi, "list"],
    /* im-vet-six-repairs (2026-09-20), the vocabulary release edit: the page now says
       "% at the effective price" where it said "% at the effective price". BOTH are recognised — a
       recogniser that stopped reading the retired phrase would classify an archived or mutated
       page as null instead of catching it, which is the opposite of this guard's job. */
    [/(-?\d+(?:\.\d+)?)\s*% (?:at |on )?(?:the )?effective (?:billings|price)\b/gi, "effective"],
    [/(-?\d+(?:\.\d+)?)\s*% (?:on|at) (?:this page's )?(?:illustrative )?(?:15 ?% Batch|effective)/g, "effective"],
  ]) { let m; while ((m = re.exec(t)) !== null) out.push({ basis, value: Number(m[1]) }); }
  return out;
}
const UNITS = ["%", "months"];
function ranges(text) {
  const t = norm(text), out = [];
  const re = /(-?\d+(?:\.\d+)?)\s*%?\s*-\s*(-?\d+(?:\.\d+)?)\s*(%|months)?/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    /* The unit may trail the pair ("78.89-85.37 %") or the noun may follow a gap
       ("0-4 months"); when neither is adjacent, look just ahead for the first unit word. */
    let unit = m[3] || null;
    if (!unit) {
      const after = t.slice(re.lastIndex, re.lastIndex + 24);
      const u = UNITS.find((x) => new RegExp("^\\s*" + x.replace("%", "%")).test(after));
      unit = u || null;
    }
    out.push({ lo: Number(m[1]), hi: Number(m[2]), unit });
  }
  return out;
}
const sameRange = (a, b) => a.lo === b.lo && a.hi === b.hi && a.unit === b.unit;

/* ---------- the audit ----------
   Returns the list of rule ids that FAILED, so a mutation regression can assert which rule caught
   it rather than only that something did (round-2 finding A3). */
function auditRules(html, log) {
  const failed = [];
  const check = (rule, name, cond, detail = "") => {
    if (!cond) failed.push(rule);
    if (log) console.log(`${cond ? "PASS" : "FAIL"}  [${rule}] ${name}${cond ? "" : "  — " + detail}`);
  };

  /* Every <article> whose class LIST contains est-card, in either quote style. */
  const cards = [];
  {
    const open = /<article\b((?:"[^"]*"|'[^']*'|[^>])*)>/gi;
    let m;
    while ((m = open.exec(html)) !== null) {
      const a = attrs(m[1]);
      if (!classList(a).includes("est-card")) continue;
      const end = html.toLowerCase().indexOf("</article>", open.lastIndex);
      cards.push({ a, body: html.slice(open.lastIndex, end === -1 ? html.length : end) });
    }
  }
  check("cards-present", "the page publishes estimate cards at all", cards.length > 0,
    "no <article> with an est-card class was found");

  /* COVERAGE — Astra round 3, finding 1: "verify every estimate card is audited". A parser gap is
     silent by construction; the card it cannot see is exactly the one nobody checks. So count every
     element ANYWHERE on the page whose class list carries est-card, whatever its tag or case, and
     require that number to equal the number actually audited above. An est-card on something other
     than an <article> fails here too, which is right: the audit walks articles, so a card that is
     not one would never be read. */
  {
    let all = 0;
    const anyTag = /<([A-Za-z][-\w]*)\b((?:"[^"]*"|'[^']*'|[^>])*)>/gi;
    let m;
    while ((m = anyTag.exec(html)) !== null) if (classList(attrs(m[2])).includes("est-card")) all += 1;
    check("coverage", "every element carrying an est-card class was audited as a card",
      all === cards.length,
      `${all} element(s) on the page carry class est-card; ${cards.length} were audited — ` +
      `the difference is a card no rule ever read`);
  }

  const boundIds = [];
  for (const card of cards) {
    const who = norm((/<h4 class="est-who">([^<]*)</.exec(card.body) || [, ""])[1]) || "(unnamed card)";

    /* THE BINDING, and only from the anchor the reader clicks: site/app.js reads that anchor's own
       dataset, so it is the authority on which registry row this face quotes. */
    const links = [];
    {
      const anchor = /<a\b((?:"[^"]*"|'[^']*'|[^>])*)>/gi;
      let m;
      while ((m = anchor.exec(card.body)) !== null) {
        const a = attrs(m[1]);
        if (classList(a).includes("load-op")) links.push(a);
      }
    }
    if (links.length !== 1) {
      check("binding", `${who}: has exactly one load link naming the estimate it quotes`, false,
        `${links.length} anchors with class load-op; zero is unbindable and two is ambiguous`);
      continue;
    }
    const id = links[0]["data-persp"], model = links[0]["data-model"];
    if (!id) { check("binding", `${who}: its load link names a perspective`, false, "no data-persp on the load-op anchor"); continue; }
    boundIds.push(id);

    const p = E.PERSPECTIVES.find((x) => x.id === id);
    if (!p) { check("binding", `${who}: its perspective ${id} is registered`, false, "no such id in PERSPECTIVES"); continue; }
    const s = p.statedReading;
    if (!s) { check("binding", `${who}: quotes a registered stated reading`, false,
      `${id} has no statedReading, so this face quotes nothing checkable`); continue; }

    /* WHOSE reading this is. Round-2 finding A3: repointing a load link at the other estimate's row
       made a dozen content rules fail and left `binding` green, so the regression could not pin the
       binding rule it existed for. Content mismatch is a SYMPTOM; the defect is that the card and
       the row name different authors. `statedReading.who` is the registry's own attribution, and
       the card's own byline must sit inside it. */
    check("binding", `${who}: the row it loads is attributed to the estimator on the card`,
      !!who && new RegExp(who.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(String(s.who || "")),
      `card byline ${JSON.stringify(who)} does not appear in the registry's attribution for ${id}: ` +
      `${JSON.stringify(String(s.who || ""))}`);

    /* The model the link loads. Both current estimate cards state ON THE CARD that their estimand is
       "identical to the card beside it by construction", and that estimand is the Opus flagship; a
       link loading another model would put a vector on screen that is not the one the estimate
       declared, under the estimate's own headline. SCOPED DELIBERATELY (round-2 A4): this is right
       for the two estimands carded today and is not a claim about estimates in general. A non-Opus
       estimate card fails here and gets re-decided, which is what a gate is for. */
    check("model", `${who}: its load link names a registered model`,
      !!model && E.MODELS.some((x) => x.id === model), `data-model=${JSON.stringify(model)}`);
    check("model", `${who}: its load link loads the model this card's estimand names`,
      model === "opus", `data-model=${JSON.stringify(model)}; the two carded estimands are the Opus flagship`);

    /* CENTRAL and SPAN — positional, signed, and the span ASCENDING as printed. */
    const median = nums((/<p class="est-median">([^<]*)</.exec(card.body) || [, ""])[1]);
    /* EXACTLY one number in the tile and exactly two in the span (Astra round 4): checking only the
       first numeral let "83.1% (obsolete; now 70%)" through, which publishes two centrals and lets
       the reader pick. A tile that states more than one figure is not a central. */
    check("central", `${who}: face central matches the registry, and states one figure only`,
      median.length === 1 && median[0] === s.central,
      `face reads ${JSON.stringify(median)}; the registry states exactly one central, ${s.central}`);
    const span = nums((/<p class="est-range">([^<]*)</.exec(card.body) || [, ""])[1]);
    check("span", `${who}: face span matches the registry, low end first, and states two figures only`,
      span.length === 2 && span[0] === s.lo && span[1] === s.hi,
      `face reads ${JSON.stringify(span)}; the registry states ${s.lo} then ${s.hi}`);
    check("span-order", `${who}: face span is not printed backwards`,
      span.length === 2 && span[0] < span[1], `face reads ${JSON.stringify(span)}`);

    const face = norm((/<p><strong>The face carries ([\s\S]*?)<\/strong>/i.exec(card.body) || [, ""])[1]);
    check("face-present", `${who}: publishes a face sentence at all`, face.length > 0,
      "no 'The face carries …' sentence — the companion reading has nowhere to live");

    /* THE QUOTATION CLAUSE — the boundary Astra's round 3 (finding A4) said was missing, and it was
       right that both the closure and central rules over-reached without it. A face may legitimately
       go on to say what THIS ENGINE computes at the same vector, or cite a stress case from another
       source; that is the published "honest gap" and it is not the estimator's quotation. So the
       registry rules apply to the QUOTATION only: the text from the dash that introduces it to the
       end of that first sentence. A decimal point is not a sentence end, so the terminator has to be
       followed by whitespace or the string's end — which is what lets "78.89-85.37 %" live inside a
       clause that ends in a period. Anything after that sentence is prose about the quotation and is
       deliberately out of scope. */
    const afterDash = face.includes(" - ") ? face.slice(face.indexOf(" - ") + 3) : face;
    /* Astra round 4: "i.e." and "e.g." end in a period and are not sentence ends. Masking them
       before the search is what stops an abbreviation from truncating the quotation early — which
       would put a contradictory clause OUTSIDE the checked span, the wrong way for this to fail. */
    const masked = afterDash.replace(/\b(?:i\.e|e\.g|cf|approx|vs|no|fig|ca)\./gi, (m) => "_".repeat(m.length));
    const stop = /\.(?:\s|$)/.exec(masked);
    const quote = (stop ? afterDash.slice(0, stop.index) : afterDash).trim();
    check("face-present", `${who}: its quotation clause is non-empty`, quote.length > 0,
      `no quoted reading found after the dash in ${JSON.stringify(face)}`);

    /* BASIS — which denominator the face declares. Changing it changes what the number means
       without changing a digit, which is the class of edit numbers cannot catch. */
    const basisLine = norm((/<p class="est-basis">([^<]*)</.exec(card.body) || [, ""])[1]);
    const classify = (t) => (/effective (?:billings|price)|billings mix|Batch/i.test(t) ? "effective"
      : /list/i.test(t) ? "list" : null);
    check("basis", `${who}: face basis line states the basis the registry states`,
      classify(basisLine) !== null && classify(basisLine) === classify(s.basis || ""),
      `face basis ${JSON.stringify(basisLine)} reads as ${classify(basisLine)}; ` +
      `registry basis ${JSON.stringify(norm(s.basis || ""))} reads as ${classify(s.basis || "")}`);

    /* THE FACE'S OWN READING ON THE REGISTRY'S OWN BASIS must be the registry's central. Round-2
       A2: the est-median tile was checked and the sentence beneath it was not, so the explanatory
       face could say ≈70% at the effective price under a ≈77% headline and nothing objected. */
    const faceReadings = readings(quote);
    const ownBasis = classify(s.basis || "");
    if (ownBasis) {
      const mine = faceReadings.filter((r) => r.basis === ownBasis).map((r) => r.value);
      check("face-central", `${who}: the face sentence states the registry's central on its own basis`,
        mine.length > 0 && mine.every((v) => v === s.central),
        `registry central ${s.central} on the ${ownBasis} basis; the face sentence says ` +
        `${mine.length ? mine.join(", ") : "nothing on that basis"}`);
    }

    /* COMPANION — the OTHER billing basis, the half N1 clobbered, and the one figure on a card that
       nothing else on this page reads. By ROLE, never by membership: for each basis the registry
       states a value on, the face must state that same signed value and no different one; and every
       range must match in BOTH endpoints AND its unit, with no extra contradictory range on that
       unit sitting beside it. */
    if (s.companion) {
      const want = readings(s.companion), have = faceReadings;
      for (const w of want) {
        const mine = have.filter((r) => r.basis === w.basis).map((r) => r.value);
        check("companion-role", `${who}: face states the registry's ${w.basis}-basis companion reading`,
          mine.length > 0 && mine.every((v) => v === w.value),
          `registry says ${w.value}% ${w.basis}; the face says ` +
          `${mine.length ? mine.join(", ") + "%" : "nothing on that basis"}`);
      }
      /* RANGE-CLOSURE SCANS THE WHOLE FACE, not the quotation (round-5 review R5-1, a BLOCKER).
         The quotation ends at the first sentence terminator, and an abbreviation mask exists to stop
         a full stop inside "i.e." truncating it early. That mask is a HAND-LIST, and an abbreviation
         NOT on it ends the quotation early and drops a stray contradictory range outside the checked
         span. Executed through the complete guard, appending a second diagnostic range after an
         abbreviation: `etc.` 0 rule failures, `et al.` 0, `Inc.` 0, `Jan.` 0, `resp.` 0 — while the
         listed `Fig.` and `i.e.` both go red. Astra's round-4 finding reopened through unlisted
         members.
         A LONGER LIST IS THE WRONG FIX and the reviewer said so: the defect this rule names is "a
         reader cannot tell which is the claim", and a stray range ANYWHERE on the card has that
         property regardless of where a sentence happens to end. So it reads the FACE. The
         presence checks above still read the quotation, because what they assert is that the
         QUOTED clause carries the registry's range — a different question, and one the sentence
         boundary is the right unit for. */
      const wantR = ranges(s.companion), haveR = ranges(face);
      for (const r of wantR) {
        check("companion-range", `${who}: face carries the registry's ${r.lo}-${r.hi}${r.unit || ""} range, endpoints and unit`,
          haveR.some((x) => sameRange(x, r)),
          `face ranges ${JSON.stringify(haveR)}; registry companion states ${JSON.stringify(r)}`);
      }
      /* RANGE CLOSURE. Membership alone lets a wrong range sit beside a right one — "81.48-87.47%
         (previously 78.89-85.37%)" states a new claim while satisfying every membership test. So
         every range PRINTED on the face must be one the registry states: the judgment span, or a
         companion range. A blanket "no second range" rule would be wrong — the span and the
         diagnostic are two legitimate ranges on the same unit — and this is the rule that actually
         distinguishes them. */
      const allowed = [{ lo: s.lo, hi: s.hi, unit: "%" }, ...wantR];
      const stray = haveR.filter((x) => !allowed.some((a) => sameRange(a, x)));
      /* SEPARATE RULE ID from presence above, deliberately (Astra round 3): while the two shared
         one id, deleting the presence assertion left every regression green, because closure fired
         under the same name and masked the deletion. Two rules, two ids, two regressions. */
      check("range-closure", `${who}: every range in the quotation is one the registry states`,
        stray.length === 0,
        `unregistered range(s) ${JSON.stringify(stray)}; the registry states ` +
        `${JSON.stringify(allowed)} — a reader cannot tell which is the claim`);
      const missing = nums(s.companion).filter((n) => !nums(quote).includes(n));
      check("companion-floor", `${who}: no figure from the registry companion is missing from the face`,
        missing.length === 0, `missing ${missing.join(", ")}`);
    }

    /* THE SPAN, WHERE IT IS LABELLED. Astra round 3: reassigning the judgment span and the
       diagnostic to each other's endpoints kept every numeral present and passed. A range carries a
       ROLE when the quotation names one, and the role is part of the claim. */
    {
      const m = /\bspan\s+(-?\d+(?:\.\d+)?)\s*%?\s*-\s*(-?\d+(?:\.\d+)?)/i.exec(quote);
      if (m) check("span", `${who}: the range the quotation labels "span" is the registry's span`,
        Number(m[1]) === s.lo && Number(m[2]) === s.hi,
        `quotation says span ${m[1]}-${m[2]}; the registry states ${s.lo}-${s.hi}`);
    }

    /* THE ARITHMETIC N1 VIOLATED, on SIGNED values. Effective billings apply a batch share and a
       negotiated discount to the list tariff, so the effective denominator is strictly smaller and
       a margin computed on it can never exceed the margin at list — at any sign, including a loss,
       where the ordering still holds and only magnitude reverses. Round-2 A4: this runs when the
       face states both bases and does not DEMAND both, because the registry is what decides which
       claims a card owes. A face that drops the list figure the registry supplies already fails
       `companion-role` above; a face that never had one owes nothing here. */
    const list = faceReadings.filter((r) => r.basis === "list").map((r) => r.value);
    const eff = faceReadings.filter((r) => r.basis === "effective").map((r) => r.value);
    if (list.length && eff.length) {
      check("ordering", `${who}: the at-list reading is not below the effective-billings reading`,
        Math.min(...list) >= Math.max(...eff),
        `face publishes ${Math.max(...eff)}% effective against ${Math.min(...list)}% at list — effective ` +
        `price is a smaller denominator than list, so the effective margin cannot be the larger`);
    }
  }

  const dupes = boundIds.filter((id, i) => boundIds.indexOf(id) !== i);
  check("distinct", "each estimate card quotes a distinct registry row", dupes.length === 0,
    `duplicated: ${[...new Set(dupes)].join(", ")} — one correct card would mask a corrupted twin`);

  /* The other direction: a stated reading that enters the registry and never reaches the page.
     An ARCHIVED reading is exempt by name — it stays loadable in the calculator on purpose. */
  const published = new Set(boundIds);
  for (const p of E.PERSPECTIVES) {
    if (!p.statedReading || /archived/i.test(p.name || "")) continue;
    check("published", `registry ${p.id}: its stated reading is published on a card`,
      published.has(p.id),
      `${p.id} states a reading (${p.statedReading.central}, ${p.statedReading.lo}-${p.statedReading.hi}) ` +
      `that no estimate card quotes`);
  }
  return { failed, cardCount: cards.length };
}

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

/* im-release-edit-r3, fallback-review finding F17. The mutation loop already scores a fail-closed
   throw as caught; THIS call site had no such handling, so a throw on the real page would abort the
   script with a stack trace — never printing this file's own failures summary, and never reaching
   the inert-filter controls at the bottom. Every other check here goes through `assert` and
   accumulates; the one path that could refuse to certify was the one that bypassed the accounting.
   The throw stays — it is the right primitive — and is recorded as the loud failure it is. */
let live;
try {
  live = auditRules(stripInert(RAW), true);
} catch (err) {
  assert("the inert filter could resolve the live page (it refuses rather than guessing, so a refusal here is a REAL finding about the page, not a harness crash)",
    false, String(err.message).slice(0, 300));
  console.log(`\n${failures} FACE-VS-REGISTRY FAILURE(S)`);
  process.exit(1);
}
failures += live.failed.length;

/* ---------- MUTATION REGRESSIONS ----------
   Each names the RULE it must trip. Round-2 finding A3: a regression that only asserts "the gate
   went red" survives the removal of the very rule it is supposed to pin, because some other
   assertion fires instead. Astra proved that by restoring the round-1 binding, restoring
   magnitude-based ordering, and deleting the ordering rule outright — all eleven stayed green.
   Applied to the real page bytes, in memory; nothing is written. */
{
  const silent = (fn) => { const real = console.log; console.log = () => {}; try { return fn(); } finally { console.log = real; } };
  const M = [
    ["binding", "the load link repointed at the other estimate's registry row",
      (h) => h.replace('data-model="opus" data-persp="fable-r3"', 'data-model="opus" data-persp="gptpro-r3"')],
    ["binding", "a DECOY attribute carrying the old binding, with the real data-persp moved after it",
      (h) => h.replace('<a href="#" class="load-op" data-model="opus" data-persp="fable-r3"',
        '<a href="#" class="load-op" data-original=\'data-persp="fable-r3"\' data-model="opus" data-persp="gptpro-r3"')],
    ["model", "the load link repointed at a different model",
      (h) => h.replace('data-model="opus" data-persp="fable-r3"', 'data-model="gpt" data-persp="fable-r3"')],
    ["central", "the central moved off the registry's stated reading",
      (h) => h.replace('<p class="est-median">≈77%</p>', '<p class="est-median">≈78%</p>')],
    ["span-order", "a span printed backwards — 82 – 65%",
      (h) => h.replace('<p class="est-range">65 – 82%</p>', '<p class="est-range">82 – 65%</p>')],
    ["basis", "the face's declared basis switched from effective billings to undiscounted list",
      (h) => h.replace('<p class="est-basis">effective price · judgment range</p>',
        '<p class="est-basis">undiscounted list · judgment range</p>')],
    ["face-central", "the explanatory face restated the central as ≈70% while the tile still says ≈77%",
      (h) => h.replace("reading — ≈77% at the effective price", "reading — ≈70% at the effective price")],
    ["companion-role", "THE ORIGINAL N1 DEFECT — the companion clobbered to 76% at list",
      (h) => h.replace("span 65–82%, ≈80% at list", "span 65–82%, ≈76% at list")],
    ["companion-role", "a companion keeping the old figure as an aside — '≈81% at list (previously ≈80%)'",
      (h) => h.replace("≈80% at list", "≈81% at list (previously ≈80%)")],
    ["companion-role", "a sign flip — '≈−80% at list'",
      (h) => h.replace("≈80% at list", "≈−80% at list")],
    ["companion-role", "a mangled basis word that used to make the ordering rule vanish — 76% at <em>list</em>",
      (h) => h.replace("≈80% at list", "≈76% at <em>list</em>")],
    /* ===== THE DIAGNOSTIC'S NUMBERS WERE RE-MINTED 2026-09-10 under owner ruling
       d-20260910-im-r3-lead-diagnostic-recompute (card q-im-r3-lead-diagnostic-designation,
       answered 16:09:47Z, option A: recompute on all three surfaces and keep it recomputed).
       80.48-86.47 -> 78.89-85.37 in EIGHT places in this file: four in prose above, four as the
       needles of the mutations below. The needles are the reason this is a re-mint and not a
       find-and-replace — every one of them is a substring of the live face, and a stale needle
       makes `replace` return the page unchanged. That does NOT pass silently (the loop reds a
       mutation that did not apply, and says the page's markup moved), which corrects something I
       wrote on the card itself: I told the owner these would "silently become no-ops". They would
       have been loud. The needles were re-minted from the face's own bytes either way.
       BUT NAME THE PROPERTY THAT ACTUALLY PROTECTS THEM, because it is not the loop (round-10
       review, item 1). `mutated === RAW` catches a needle that matches NOTHING. It cannot catch a
       needle that still matches THE WRONG PLACE. What makes these four safe is that each carries
       the whole diagnostic clause and every fragment of it occurs exactly ONCE on the page —
       measured: "a lead-only diagnostic of 78.89-85.37% across 0-4 months" x1, "across 0-4 months"
       x1, "78.89-85.37%" x1. Shorten a future needle to something that appears twice and the
       protection is gone without a word from the loop. Keep them long enough to stay unique.
       The VALUE came from executing the engine, not from reading it off the page:
         applyPresetSettings(opus, gptpro-r3, {mode:"explicit", profileId:"reference"}),
         trendMonths swept 0..4, workload().margin * 100
         -> 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653   (discount 0, batchShare 0 = list)
       Option D was NOT chosen: the "QUOTED, not computed here" clause stays as it is and bq-2191
       stays open. The author's own 83.1 and 68-92 are byte-untouched. */
    ["companion-range", "the diagnostic's two ranges swapped units — '0–4% across 78.89–85.37 months'",
      (h) => h.replace("a lead-only diagnostic of 78.89–85.37% across 0–4 months",
        "a lead-only diagnostic of 0–4% across 78.89–85.37 months")],
    ["range-closure", "a new diagnostic range stated while the correct one is kept as 'previously'",
      (h) => h.replace("a lead-only diagnostic of 78.89–85.37% across 0–4 months",
        "a lead-only diagnostic of 79.89–86.37% (previously 78.89–85.37%) across 0–4 months")],
    ["companion-range", "the registry's diagnostic range simply dropped from the quotation",
      (h) => h.replace("with a lead-only diagnostic of 78.89–85.37% across 0–4 months",
        "with a lead-only diagnostic across 0–4 months")],
    ["span", "the judgment span and the diagnostic swapped endpoints inside the quotation",
      (h) => h.replace("span 68–92%, with a lead-only diagnostic of 78.89–85.37% across 0–4 months",
        "span 78.89–85.37%, with a lead-only diagnostic of 68–92% across 0–4 months")],
    /* Astra round 3: magnitude-based ordering ACCEPTS an impossible loss-making pair, and every
       earlier ordering fixture used positive values where magnitude and sign agree — so restoring
       magnitude comparison left the suite green. A signed fixture is the only one that pins it. */
    ["ordering", "an impossible SIGNED pair — −77% effective against −80% at list",
      (h) => h.replace("≈77% at the effective price, span 65–82%, ≈80% at list",
        "≈-77% at the effective price, span 65–82%, ≈-80% at list")],
    ["companion-role", "a contradictory restatement inside the quotation — 'the author now quotes 76% on list'",
      (h) => h.replace("≈80% at list.", "≈80% at list (obsolete; the author now quotes 76% on list).")],
    /* Astra round 4. Each of these left the whole suite green before this revision. */
    ["companion-role", "a corrupt card hidden behind an attribute containing '>', which truncates a naive tag match",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        '<div class="est-pair" id="estimates">\n      <article title="1 > 0" class="est-card">\n' +
        '        <h4 class="est-who">Fable 5</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">65 – 82%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the round-3 self-authored reading — ≈77% at the effective price, span 65–82%, ≈76% at list.</strong></p>\n' +
        '        <p class="load-op-row"><a href="#" class="load-op" data-model="opus" data-persp="fable-r3">Load</a></p>\n' +
        '      </article>')],
    ["central", "the central negated with an ENTITY a reader sees as a minus sign — &minus;83.1%",
      (h) => h.replace('<p class="est-median">83.1%</p>', '<p class="est-median">&minus;83.1%</p>')],
    ["central", "a second central smuggled into the tile — '83.1% (obsolete; now 70%)'",
      (h) => h.replace('<p class="est-median">83.1%</p>', '<p class="est-median">83.1% (obsolete; now 70%)</p>')],
    ["range-closure", "an abbreviation used to end the quotation early, hiding a contradictory range after it",
      (h) => h.replace("across 0–4 months.</strong>", "across 0–4 months, i.e. 1–5 months.</strong>")],
    /* GPT Pro session 1 round 3, finding N3-C, executed in a browser: the original 76-vs-80 defect
       wearing a disguise. Inert and hidden text is not published, so it must not be able to satisfy
       a check about what is published — the same reason comments were stripped in round 1. */
    ["companion-role", "the correct paragraph parked in <div hidden> above a visible one saying 76%",
      (h) => h.replace(/(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/,
        (m) => `<div hidden>${m}</div>` + m.replace("≈80% at list", "≈76% at list"))],
    ["companion-role", "the correct paragraph parked in <template> above a visible one saying 76%",
      (h) => h.replace(/(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/,
        (m) => `<template>${m}</template>` + m.replace("≈80% at list", "≈76% at list"))],
    ["model", "duplicate data-model, where a browser reads the FIRST and a naive regex reads the second",
      (h) => h.replace('<a href="#" class="load-op" data-model="opus" data-persp="fable-r3"',
        '<a href="#" class="load-op" data-model=\'gpt\' data-model="opus" data-persp="fable-r3"')],
    ["face-central", "the face's basis switched to 'on undiscounted list' while the basis line stays effective",
      (h) => h.replace("reading — ≈77% at the effective price", "reading — ≈77% on undiscounted list")],
    ["face-central", "the GPT face central raised to 93.1% while its tile and registry stay at 83.1%",
      (h) => h.replace("revision — 83.1% at the undiscounted list price", "revision — 93.1% at the undiscounted list price")],
    ["span", "the GPT prose span widened to 69–93% while its tile stays at 68–92%",
      (h) => h.replace("83.1% at the undiscounted list price, span 68–92%", "83.1% at the undiscounted list price, span 69–93%")],
    ["companion-role", "a corrupt extra card in UPPERCASE markup, which a case-sensitive parser cannot see",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        "<div class=\"est-pair\" id=\"estimates\">\n      <ARTICLE CLASS='est-card featured'>\n" +
        '        <h4 class="est-who">Fable 5 (archived)</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">70 – 84%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the archived reading — ≈77% at the effective price, range 74–86%, ≈76% at list.</strong></p>\n' +
        "        <p class=\"load-op-row\"><A HREF='#' CLASS='load-op' DATA-MODEL='opus' DATA-PERSP='fable-ctx'>Load</A></p>\n" +
        '      </ARTICLE>')],
    ["ordering", "an impossible pair with the companion made to agree so only the arithmetic is left",
      (h) => h.replace("≈77% at the effective price, span 65–82%, ≈80% at list",
        "≈77% at the effective price, span 65–82%, ≈80% at list — a stress reading of 90% at the effective price against 85% at list")],
    ["cards-present", "the estimate cards removed from the page entirely",
      (h) => h.replace(/<article class="est-card">/g, '<article class="est-card-retired">')],
    ["distinct", "a second card quoting the same registry row as the first",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        '<div class="est-pair" id="estimates">\n      <article class="est-card">\n' +
        '        <h4 class="est-who">Fable 5</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">65 – 82%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the round-3 self-authored reading — ≈77% at the effective price, span 65–82%, ≈80% at list.</strong></p>\n' +
        '        <p class="load-op-row"><a href="#" class="load-op" data-model="opus" data-persp="fable-r3">Load</a></p>\n' +
        '      </article>')],
    /* Round-2 A1: SINGLE-quoted, and bound to the archived row so `distinct` cannot fire for it —
       the corruption must be caught by auditing the extra card itself. */
    ["companion-role", "an extra corrupted card, single-quoted class, bound to a row of its own",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        "<div class=\"est-pair\" id=\"estimates\">\n      <article class='est-card featured'>\n" +
        '        <h4 class="est-who">Fable 5 (archived)</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">70 – 84%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the archived reading — ≈77% at the effective price, range 74–86%, ≈76% at list.</strong></p>\n' +
        "        <p class=\"load-op-row\"><a href='#' class='load-op' data-model='opus' data-persp='fable-ctx'>Load</a></p>\n" +
        '      </article>')],
    /* ===== GPT Pro session 1 ROUND 4 (2026-09-10), NEW N6 — the publication hold. =====
       Round 4's finding ran in the direction that matters: the inert filter could DELETE a visible,
       contradictory card before it was ever audited, and the whole script then passed reporting
       only the survivors. Both of its executed counterexamples are pinned here, so the repair
       cannot be undone quietly. Their negative controls — that an ordinary `title=" hidden "` and
       an `aria-hidden` span survive the filter — are asserted separately below the loop, because a
       mutation harness can only show that something IS caught, never that something ISN'T. */
    ["companion-role", "N6-A: a visible corrupt card whose ordinary title attribute merely CONTAINS the word hidden — the filter used to delete it and count only the survivors",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        '<div class="est-pair" id="estimates">\n      <article class="est-card" title=" hidden ">\n' +
        '        <h4 class="est-who">Fable 5 (archived)</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">70 – 84%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the archived reading — ≈77% at the effective price, range 74–86%, ≈76% at list.</strong></p>\n' +
        '        <p class="load-op-row"><a href="#" class="load-op" data-model="opus" data-persp="fable-ctx">Load</a></p>\n' +
        '      </article>')],
    ["companion-role", "N6-B: the correct paragraph really hidden, but behind `<div title=\"</div>\">` so a non-quote-aware nesting scan ends the hidden region early and reads it anyway",
      (h) => h.replace(/(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/,
        (m) => `<div hidden><div title="</div>">padding</div>${m}</div>` + m.replace("≈80% at list", "≈76% at list"))],
    ["companion-role", "N6-C: display:none written with an entity — `display:&#110;one` — which a browser decodes and a raw-text filter did not",
      (h) => h.replace(/(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/,
        (m) => `<div style="display:&#110;one">${m}</div>` + m.replace("≈80% at list", "≈76% at list"))],
    /* ===== ROUND 4, NEW N7 — the three deletions the reviewer executed and the suite did not notice.
       Round 4 disabled `coverage`, skipped only the month-range presence check, and replaced comment
       stripping with the identity function; the complete script exited 0 on all three, because no
       mutation in this array required any of them. Naming a rule is necessary and not sufficient —
       the array has to contain a case that only that rule can catch. These are those cases. */
    /* ISOLATING the coverage rule takes an est-card the AUDIT cannot reach: the audit walks
       <article> elements, coverage counts the class on ANY tag. A <section> carrying est-card is
       therefore counted and never audited, and no other rule has anything to say about it — which
       is precisely the silent-parser-gap shape coverage was written for. */
    ["coverage", "N7-a: an est-card on a <section>, which the article walk cannot reach — counted but never audited, and only the coverage rule can see the disagreement",
      (h) => h.replace('<div class="est-pair" id="estimates">',
        '<div class="est-pair" id="estimates">\n      <section class="est-card"><h4 class="est-who">Unreachable</h4></section>')],
    ["companion-range", "N7-b: ONLY the month range corrupted, leaving the percentage range correct — the month-presence check is the only thing that can catch it",
      (h) => h.replace("across 0–4 months", "across 0–9 months")],
    /* THE COMMENT-STRIPPING WITNESS. The rule that fires is companion-role, and that is the point:
       this mutation goes red ONLY BECAUSE comments are stripped first. Round 4 replaced comment
       stripping with the identity function and the whole script still exited 0, because no mutation
       needed it — with stripping removed, the commented-out CORRECT sentence satisfies the face
       check (the guard takes the first match) and the visible 76% is never reached. So if anyone
       deletes comment stripping again, this case goes green and the harness reports a mutation that
       stopped being caught. That is the regression, whatever the rule name on the red line says. */
    ["companion-role", "N7-c: the correct companion parked in an HTML COMMENT above a visible one saying 76% — red ONLY because comments are stripped first",
      (h) => h.replace(/(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/,
        (m) => `<!-- ${m} -->` + m.replace("≈80% at list", "≈76% at list"))],

    /* ===== GPT PRO SESSION 1, ROUND 5 (pr-20260910T075843Z-ec3144) — all eighteen filed cases,
       driven through the COMPLETE guard rather than the filter alone, which was the reviewer's
       central procedural point: every one of its sixteen false certifications "passes the entire
       supplied guard, not merely auditRules() with the harness bypassed."

       Thirteen of the eighteen reproduced against the shipped bytes; the packet was assembled
       before the fallback review's F6/F7/F16 fixes landed, so three (D1, D2, T1) were already
       closed by the time it was read and one (E3) had moved from false certification to a refusal.
       All eighteen are pinned regardless. A case that passes by accident of a later fix is not
       pinned, and the thing being defended is that it STAYS closed.

       Two directions, because N6 runs both ways and only one of them is obvious:
         HIDE — the CORRECT companion sentence is put inside a construct a browser HIDES and a
                contradictory copy is left visible after it. A filter that fails to hide the
                construct leaves the correct sentence available to satisfy a check about published
                text while the reader is shown 76%.
         SHOW — the CORRECT sentence is REPLACED by a contradictory one inside a construct a browser
                RENDERS. A filter that deletes the construct removes the contradiction before it can
                be audited and the whole script then certifies agreement, which is round 4's defect
                and the one that is worse than no gate at all. */
    ...(() => {
      const TARGET = /(<p><strong>The face carries the round-3 self-authored reading[\s\S]*?<\/p>)/;
      const corrupt = (m) => m.replace("≈80% at list", "≈76% at list");
      /* THE HIDE FAMILY NEEDS THE DUAL GUARD (round-3 review R3-4). Every hide regression names
         `companion-role`, and that rule is satisfied by an ABSENT face as readily as by a
         contradictory one — executed: with the fable face paragraph removed outright, which is what
         an OVER-DELETING filter produces, the failing rules include face-present, face-central,
         companion-role and companion-floor. So a filter that deleted BOTH copies would satisfy
         every hide regression for the wrong reason, which is the exact mirror of the empty-face
         defect F4(b) fixed on the show side. A hide mutation therefore asserts both halves before
         any red is accepted: the CORRECT reading is gone, and the CONTRADICTORY one survived. */
      const hide = (open, close) => Object.assign(
        (h) => h.replace(TARGET, (m) => open + m + close + corrupt(m)),
        { hidesCorrect: "≈80% at list", keepsContradiction: "≈76% at list" });
      /* THE SHOW DIRECTION NEEDS A CARD, NOT A SENTENCE, and the reason is worth writing down
         because the first cut of these regressions got it wrong and went red for the wrong reason.
         Replacing the correct sentence with a contradictory one goes red under a BROKEN filter too
         — not because a contradiction was audited, but because the correct sentence went missing.
         That is round-2 finding A3 all over again. Adding a second contradictory SENTENCE does not
         work either: the quotation extent is deliberately one sentence, so prose after it is out of
         scope by design. What discriminates is round 5's own fixture shape — a contradictory extra
         CARD, which the coverage and companion rules must audit and reject. Delete it and the guard
         certifies agreement over the survivors; keep it and the guard goes red. */
      const CORRUPT_CARD =
        '<article class="est-card">\n' +
        '        <h4 class="est-who">Fable 5 (archived)</h4>\n        <p class="est-median">≈77%</p>\n' +
        '        <p class="est-range">70 – 84%</p>\n' +
        '        <p class="est-basis">effective price · judgment range</p>\n' +
        '        <p><strong>The face carries the archived reading — ≈77% at the effective price, range 74–86%, ≈76% at list.</strong></p>\n' +
        '        <p class="load-op-row"><a href="#" class="load-op" data-model="opus" data-persp="fable-ctx">Load</a></p>\n' +
        '      </article>';
      const ANCHOR = '<div class="est-pair" id="estimates">';
      /* A SHOW REGRESSION MUST GO RED FOR THE RIGHT REASON (fallback review F4(b), which my first
         pass did not close). The rule id alone is not enough: a `visibility:hidden` region cuts an
         injected card's TEXT while leaving its tags, so `companion-role` fires on "the face says
         nothing on that basis" — an EMPTY face — rather than on a contradiction. Deleting the
         visibility-restoration left the B5 mutation green on exactly that. So a show mutation is
         tagged, and the loop additionally requires the contradictory reading to SURVIVE the filter:
         if the construct was deleted, the contradiction was never audited and the regression fails
         whatever colour the rule came out. */
      const show = (open, close) => Object.assign(
        (h) => h.replace(ANCHOR, ANCHOR + "\n      " + open + CORRUPT_CARD + close),
        { showsContradiction: "≈76% at list" });
      return [
        ["companion-role", "N6-R5-A1: an unquoted attribute value ENDING IN A SLASH read as a self-closing instruction, so the hidden region never opened",
          hide('<div hidden data-path=/>', '</div>')],
        ["companion-role", "N6-R5-A2: the same slash one level in, where it made the nesting walk mistake the inner close tag for the end of the hidden region",
          hide('<div hidden><div data-path=/>pad</div>', '</div>')],
        ["companion-role", "N6-R5-A3: `<div hidden />` — a solidus before `>` on an ordinary HTML element is IGNORED, so this opens a region that still has to be closed",
          hide('<div hidden />', '</div>')],
        ["companion-role", "N6-R5-A4: the same ignored solidus on a nested `<div />` inside a hidden region",
          hide('<div hidden><div />pad</div>', '</div>')],
        ["companion-role", "N6-R5-B1: a CUSTOM PROPERTY whose value contains the tokens display:none declares no display at all — the element renders",
          show('<div style="--memo: display:none">', '</div>')],
        ["companion-role", "N6-R5-B2: `display:none;display:block` — the later declaration wins, and substring membership has no notion of a cascade",
          show('<div style="display:none;display:block">', '</div>')],
        ["companion-role", "N6-R5-B3: `display:noneish` is not `display:none`",
          show('<div style="display:noneish">', '</div>')],
        ["companion-role", "N6-R5-B4: an author inline `display:block` BEATS the UA `[hidden]` rule, so a hidden attribute is not the last word",
          show('<div hidden style="display:block">', '</div>')],
        ["companion-role", "N6-R5-B5: a descendant restoring `visibility:visible` under a hidden parent is on the reader's screen — visibility inherits and can be restored, display cannot",
          show('<div style="visibility:hidden"><div style="visibility:visible">', '</div></div>')],
        ["companion-role", "N6-R5-C1: `1hidden=\"x\"` — a matching SUFFIX is not an attribute name",
          show('<div 1hidden="x">', '</div>')],
        ["companion-role", "N6-R5-C2: a DUPLICATE attribute is dropped by the tokenizer, so the first, valueless `style` is the element's style",
          show('<div style style="display:none">', '</div>')],
        ["companion-role", "N6-R5-D1: `</div>` inside a <script> holding JSON is string data, not a close tag",
          hide('<div hidden><script type="application/json">"</div>"</script>', '</div>')],
        ["companion-role", "N6-R5-D2: neither is a `<div hidden>` inside script data an element that can open a hidden region around the card between them",
          show('<script type="application/json">"<div hidden>"</script>', '<script type="application/json">"</div>"</script>')],
        ["companion-role", "N6-R5-E1: `display&colon;none` — a named character reference a browser decodes before reading the declaration",
          hide('<div style="display&colon;none">', '</div>')],
        ["companion-role", "N6-R5-E2: `display:&#110one` — a numeric reference carries NO missing-semicolon exception in an attribute value",
          hide('<div style="display:&#110one">', '</div>')],
        ["companion-role", "N6-R5-E3: `display:/*c*/none` — a CSS comment is resolved before the declaration is read, not grounds to refuse",
          hide('<div style="display:/' + '*c*' + '/none">', '</div>')],
      ];
    })(),
  ];
  for (const [rule, name, mutate] of M) {
    const mutated = mutate(RAW);
    if (mutated === RAW) {
      assert(`mutation regression: ${name}`, false,
        "the mutation did not apply — the page's markup moved, so this regression tests nothing");
      continue;
    }
    /* SUPERSEDED, and left here as the record of what changed. im-release-edit-r3's F12 stopped a
       fail-closed throw from aborting the run, and scored it as catching EVERY rule on the grounds
       that a refusal is the strongest form of "caught". That is true of a CORRECT filter and false
       of a broken one, which is the case that matters — see the block below, which replaced it. */
    /* A THROW SATISFIES ONLY A REGRESSION THAT ASKED FOR ONE (fallback review F4). This used to
       score ANY throw as catching EVERY rule, on the reasoning that a refusal is the strongest form
       of "caught". Under a CORRECT filter that is true. Under a BROKEN one it silently converts a
       false-certification regression into a green line, which is the whole failure mode this
       harness exists to prevent — executed: deleting the foreign-content guard left A3 and A4
       green, because the broken parse threw on an unrelated unterminated <details> and the throw
       was credited to `companion-role`. A regression that wants a refusal names the rule `refused`;
       every other regression must trip its own named rule, and an unexpected throw is a FAILURE
       with its message, not a pass. */
    /* R3-4: for a hide mutation, BOTH halves have to hold — the correct reading gone, the
       contradictory one still present — or the red below is the audit missing a face rather than
       rejecting a contradiction. */
    if (mutate.hidesCorrect) {
      let view = null;
      try { view = stripInert(mutated); } catch { view = null; }
      if (view !== null) {
        if (view.includes(mutate.hidesCorrect)) {
          assert(`mutation regression: [${rule}] catches — ${name}`, false,
            `the filter did NOT hide the correct reading, so this case is not exercising what it pins`);
          continue;
        }
        if (!view.includes(mutate.keepsContradiction)) {
          assert(`mutation regression: [${rule}] catches — ${name}`, false,
            `the filter deleted the CONTRADICTORY copy as well, so any red below would be the audit `
            + `missing a face rather than rejecting a contradiction — the over-deletion direction`);
          continue;
        }
      }
    }
    /* F4(b): for a show mutation, the contradiction has to still be there to audit. */
    if (mutate.showsContradiction) {
      let survived = false;
      try { survived = stripInert(mutated).includes(mutate.showsContradiction); } catch { survived = false; }
      if (!survived) {
        assert(`mutation regression: [${rule}] catches — ${name}`, false,
          `the filter DELETED the contradictory card before it could be audited, so any red below `
          + `would be the audit missing a face rather than rejecting a contradiction — which is `
          + `exactly the defect this regression exists to detect`);
        continue;
      }
    }
    let failed;
    try {
      ({ failed } = silent(() => auditRules(stripInert(mutated), false)));
    } catch (err) {
      assert(`mutation regression: [${rule}] catches — ${name}`, rule === "refused",
        rule === "refused"
          ? `refused, as this regression requires: ${String(err.message).slice(0, 100)}`
          : `the filter REFUSED instead of tripping [${rule}] — a refusal is not evidence that `
            + `this rule works: ${String(err.message).slice(0, 140)}`);
      continue;
    }
    assert(`mutation regression: [${rule}] catches — ${name}`, failed.includes(rule),
      failed.length ? `the gate went red on [${[...new Set(failed)].join(", ")}] instead` : "the gate PASSED this defect");
  }
  /* NON-VACUITY OF THE HARNESS ITSELF: the unmutated page must trip NO rule. Without this, a
     regression that "catches" every mutation because the baseline is already red reads as green. */
  assert("the unmutated page trips no rule (the regressions above mean something)",
    live.failed.length === 0, `baseline failures: ${live.failed.join(", ")}`);

  /* ===== POSITIVE CONTROLS ON THE INERT FILTER (Pro session 1 round 4, NEW N6 closure). =====
     A mutation harness can only demonstrate that something IS caught. It structurally cannot show
     that something HARMLESS survives — and that is the exact direction round 4's defect ran: the
     filter was deleting a visible card, so the page looked more consistent than it was. These read
     stripInert directly and assert what must SURVIVE it, which is the half no mutation can express.
     Round 4's own words for the property being pinned: filtering must never "silently turn a
     visible contradiction into agreement." */
  /* EVERY CONTROL ACCOUNTS FOR A THROW (fallback review F5). The header above records F17 as having
     fixed this; F17 fixed it at ONE call site. Three of the five helpers still let an exception
     escape, so a refusing filter killed the run with a Node stack trace — no FAIL line, no summary,
     and roughly thirty later controls never reached. Executed by the reviewer, and again here. */
  const guarded = (fn, onThrow) => { try { return fn(); } catch (err) { return onThrow(err); } };
  const survives = (label, html, needle) =>
    assert(`inert filter positive control: ${label}`,
      guarded(() => stripInert(html).includes(needle), () => false),
      guarded(() => `"${needle}" was removed from: ${html.slice(0, 90)}`,
        (e) => `the filter REFUSED this input rather than keeping "${needle}": ${String(e.message).slice(0, 140)}`));
  const removed = (label, html, needle) =>
    assert(`inert filter negative control: ${label}`,
      guarded(() => !stripInert(html).includes(needle), () => false),
      guarded(() => `"${needle}" survived: ${html.slice(0, 90)}`,
        (e) => `the filter REFUSED this input rather than removing "${needle}": ${String(e.message).slice(0, 140)}`));

  survives("an ordinary title attribute CONTAINING the word hidden is not a hiding instruction",
    '<article class="est-card" title=" hidden ">VISIBLE-CARD</article>', "VISIBLE-CARD");
  survives("aria-hidden is not a hiding instruction — it is common on decorative spans",
    '<span aria-hidden="true">VISIBLE-ARIA</span>', "VISIBLE-ARIA");
  survives("a title attribute whose TEXT looks like a style declaration hides nothing",
    '<article title="style=&quot;display:none&quot;">VISIBLE-TITLE-STYLE</article>', "VISIBLE-TITLE-STYLE");
  survives("markup inside an attribute value does not end a hidden region early",
    '<div hidden><div title="</div>">pad</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "VISIBLE-76");
  removed("...and the genuinely hidden paragraph in that same shape really is removed",
    '<div hidden><div title="</div>">pad</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("a real bare hidden attribute still hides",
    '<article class="est-card" hidden>GONE</article>', "GONE");
  removed("display:none written with an entity is decoded and still hides",
    '<div style="display:&#110;one">ENT-GONE</div>', "ENT-GONE");

  /* ===== FALLBACK REVIEW, 2026-09-10 (findings F6 and F7). Two ways the first N6 repair was still
     wrong, both executed against this function before being pinned here.
     F6: VOID ELEMENTS. `<img hidden>` is spec-legal and is how a hidden tracking pixel is written.
     The first cut looked for `</img>`, never found one, and threw — taking the entire gate down on
     ordinary markup, with a message blaming an "unterminated inert region" that had not happened.
     F7: RAW TEXT AND COMMENTS. The N6-B defect reproduced through a different door: `</div>` inside
     a <script> string or an HTML comment was read as a close tag, ended the hidden region early,
     and left the hidden correct paragraph in the audited view — precisely what round 4 held
     publication over, wearing its third disguise. */
  survives("F6: a void element carrying `hidden` has no body and must not take the gate down",
    '<p>KEEP</p><img hidden src="x.png"><p>ALSO-KEEP</p>', "ALSO-KEEP");
  survives("F6: nor does a hidden void <input>",
    '<p>KEEP</p><input style="display:none"><p>ALSO</p>', "ALSO");
  removed("F6: a hidden region containing an unclosed INNER block still resolves, as a browser would",
    '<div hidden><div><p>x</p></div><p>HIDDEN</p></div><p>VISIBLE</p>', "HIDDEN");
  survives("F6: ...and the visible text after it survives",
    '<div hidden><div><p>x</p></div><p>HIDDEN</p></div><p>VISIBLE</p>', "VISIBLE");
  removed("F7: `</div>` inside a <script> string is data, not a close tag — the hidden text stays hidden",
    '<div hidden><script>var s="</div>";</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("F7: ...and the visible contradiction is still there to be audited",
    '<div hidden><script>var s="</div>";</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "VISIBLE-76");
  removed("F7: the same through an HTML comment",
    '<div hidden><!-- </div> --><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("F7: and through a <style> body",
    '<div hidden><style>/* </div> */</style><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");

  /* FAIL CLOSED, asserted rather than described: an unterminated inert element means this function
     cannot say where the hidden region ends, and guessing in the direction of deleting more of the
     page than a browser would is the failure mode round 4 demonstrated. */
  let threw = false;
  try { stripInert("<div hidden><p>never closed"); } catch { threw = true; }
  assert("inert filter FAILS CLOSED on an unterminated inert region rather than guessing its extent", threw);

  /* F16: the SECOND undecidable case. A browser resolves CSS comments and CSS escapes before
     reading a declaration; this filter resolves neither, and under-stripping is the direction that
     leaves hidden text able to satisfy a face check. Refusing is the answer, not more decoders —
     but only when the value actually concerns display or visibility, so an ordinary style with a
     comment in it is untouched. Both halves pinned, because a fail-closed rule with no upper bound
     on what it refuses is its own outage. */
  const refuses = (label, html) => {
    let t = false;
    try { stripInert(html); } catch { t = true; }
    assert(`inert filter FAILS CLOSED: ${label}`, t, "it resolved a value it cannot resolve");
  };
  /* F16, RE-CUT by im-guard-fix (2026-09-10). These two USED to be refusals, and the refusal was
     the right answer to a filter that could not resolve them. It is the wrong answer to one that
     can: a browser strips CSS comments and resolves CSS escapes before reading a declaration, both
     are small and closed operations, and refusing on markup a browser handles is its own outage —
     the same class of defect as F6's `<img hidden>`, one layer in. They are resolved now and pinned
     as NEGATIVE controls, which is a strictly stronger assertion than "it refused". */
  removed("F16 re-cut: a display value interrupted by a CSS comment is RESOLVED and hides",
    '<div style="display:/' + '*c*' + '/none">CSS-COMMENT-GONE</div>', "CSS-COMMENT-GONE");
  removed("F16 re-cut: a display value spelled with a CSS escape is RESOLVED and hides",
    '<div style="display:\\6e one">CSS-ESCAPE-GONE</div>', "CSS-ESCAPE-GONE");
  /* THIS CONTROL USED TO ASSERT THE OPPOSITE, and the reversal is the point. It read "an ordinary
     style carrying a comment is NOT refused", scoping the refusal to display/visibility — and that
     scoping WAS the hole (fallback review F1). `color` is one of the properties that hides text
     from a reader (`color:transparent`), and so are opacity, font-size, clipping, zero sizing and
     off-screen positioning. The filter now models `display`, `visibility` and custom properties and
     refuses every other declared property. */
  refuses("an ordinary style declaring a property this filter does not model",
    '<div style="color:/' + '*c*' + '/red">VISIBLE-ORDINARY</div>');
  /* WHAT IS STILL REFUSED, and the upper bound on it. Fail-closed with no upper bound is an
     outage; fail-closed with no LOWER bound is the certification defect. Both halves are pinned. */
  refuses("a display value that depends on a custom property this checker does not resolve",
    '<div style="display:var(--d)">X</div>');
  refuses("a display value carrying a character reference outside the decoded set",
    '<div style="display:&notareference;none">X</div>');
  refuses("hidden=\"until-found\", which hides through content-visibility rather than display",
    '<div hidden="until-found">X</div>');
  refuses("a <script> body containing `<!--`, where the spec's escaped states decide which </script> closes the element",
    '<div hidden><script>var s = "<!-- </script> -->";</script><p>X</p></div>');

  /* ===== THE VISUALLY-HIDDEN CLASS (fallback review F1) — seven ways to make text unreadable that
     this filter read as VISIBLE, each executed through the complete guard by the reviewer. Closed by
     REFUSING rather than by modelling seven more properties, and what decided that is that no
     browser settles them either: `checkVisibility({opacityProperty:true})` catches only the first,
     and the other six report a painted, visible box under every option Chromium offers
     (evidence/visually-hidden-oracle-probe.txt). */
  refuses("opacity:0 — a painted box a reader cannot read", '<div style="opacity:0">X</div>');
  refuses("content-visibility:hidden — the CSS spelling of the `hidden=until-found` mechanism this filter already refused",
    '<div style="content-visibility:hidden">X</div>');
  refuses("font-size:0", '<div style="font-size:0">X</div>');
  refuses("color:transparent", '<div style="color:transparent">X</div>');
  refuses("clip-path:inset(100%)", '<div style="clip-path:inset(100%)">X</div>');
  refuses("off-screen absolute positioning", '<div style="position:absolute;left:-9999px">X</div>');
  refuses("zero sizing with overflow hidden", '<div style="width:0;height:0;overflow:hidden">X</div>');
  survives("...while a CUSTOM property declares no property at all and is not refused",
    '<div style="--x: opacity:0">VISIBLE-CUSTOM</div>', "VISIBLE-CUSTOM");
  /* F13, AND THE FIXTURE IS DELIBERATELY ABSENT. The review found the custom-property comment
     crediting a line that is not the defence, and my first correction was to add a `--Memo` control
     — which passed with the branch DELETED, because case-folding `--Memo` yields `--memo`, and
     neither can ever equal `display`. The branch cannot change any visibility verdict, so no
     visibility fixture can pin it, and a control that cannot fail is worse than none: it reads as
     evidence and is not. What actually defeats round 5's B1 is the depth- and quote-aware colon
     split in declarations(); the comment now credits that, and the case branch is documented as
     defensive correctness with no witness available at this boundary. */
  /* F12: `!important` precedence was correct and unpinned. My first attempt at a witness was
     vacuous too — it targeted the copy in `winning()`, which the display path no longer calls; the
     line that decides is the one inside `elementDisplayNone`. Verified to discriminate against
     THAT line. */
  survives("F12: an !important declaration is not overridden by a later normal one",
    '<div style="display:block !important;display:none">VISIBLE-IMPORTANT</div>', "VISIBLE-IMPORTANT");
  removed("F12: ...but a later !important does win",
    '<div style="display:block !important;display:none !important">GONE-IMPORTANT</div>', "GONE-IMPORTANT");

  /* ===== INVALID VALUES (fallback review F2). A browser DROPS an invalid declaration, so an earlier
     valid one wins and, failing that, the UA `[hidden]` rule applies. Taking the last token as the
     winner regardless of whether it parses read all three of these as VISIBLE while Chromium painted
     nothing. Refused rather than resolved, because skipping an unrecognised value would fall through
     to `[hidden]` and DELETE visible text whenever the value was in fact valid and merely unknown
     here — the certifying direction. */
  refuses("an invalid display value beside a hidden attribute", '<div hidden style="display:bogus">X</div>');
  refuses("an invalid display value after a valid one", '<div style="display:none;display:bogus">X</div>');
  refuses("an empty display value after a valid one", '<div style="display:none;display:">X</div>');
  /* THE OVER-REMOVAL SIDE, which is the one the reviewer warned about when it argued AGAINST a
     plain fall-through: `display:none;display:-webkit-box` would resolve HIDDEN here while Chromium
     paints it, trading a certification for a deletion. The fall-through is kept — it is what makes
     round 5's B3 come out right — but it REFUSES whenever the answer comes out hidden and an
     unrecognised value was dropped to get there. Both properties carry the asymmetry; visibility
     did not until it was executed and found over-removing. */
  refuses("a vendor display keyword this set does not list, where dropping it would resolve HIDDEN",
    '<div style="display:none;display:-webkit-box">X</div>');
  refuses("...the same through the UA [hidden] rule", '<div hidden style="display:-webkit-box">X</div>');
  /* ===== ROUND-2 FALLBACK REVIEW (2026-09-10), four blockers, all in the logic the first round
     never saw. Each certified a hidden contradiction through the COMPLETE guard before this.
     R2-1: `parts.every(x => DISPLAY_VALUES.has(x))` validated the VOCABULARY, not the SYNTAX — any
     multiset of legal tokens passed, and because every token WAS legal the bounded escape never
     fired. Chromium drops all of them, so the earlier `display:none` or `[hidden]` wins.
     R2-2: `revert-layer` rolls back past the author origin, so a hidden element stays hidden — the
     one global keyword that does not behave like the others.
     R2-4: HTML elements break OUT of foreign content, so the trailing solidus is ignored again —
     round 5's A3/A4 one layer in, reached through `<svg>`. */
  refuses("R2-1: a multiset of legal display tokens is not a legal declaration",
    '<div hidden style="display:block none">X</div>');
  refuses("R2-1: ...two outside keywords", '<div hidden style="display:inline block">X</div>');
  refuses("R2-1: ...a global keyword beside a box keyword", '<div hidden style="display:inherit block">X</div>');
  refuses("R2-2: display:revert-layer rolls back PAST the author origin, so [hidden] still applies",
    '<div hidden style="display:revert-layer">X</div>');
  survives("R2-2: ...while display:revert on a hidden element IS painted",
    '<div hidden style="display:revert">VISIBLE-REVERT</div>', "VISIBLE-REVERT");
  survives("R2-2: ...and so is display:inherit",
    '<div hidden style="display:inherit">VISIBLE-INHERIT</div>', "VISIBLE-INHERIT");
  removed("R2-3: !important is honoured for visibility — the certifying direction",
    '<div style="visibility:hidden !important;visibility:visible">GONE-VIS-IMPORTANT</div>', "GONE-VIS-IMPORTANT");
  survives("R2-3: ...and the deleting direction",
    '<div style="visibility:visible !important;visibility:hidden">VISIBLE-VIS-IMPORTANT</div>', "VISIBLE-VIS-IMPORTANT");
  removed("R2-4: an HTML element breaks OUT of foreign content, so its solidus is ignored",
    '<svg><div hidden /><p>HIDDEN-80</p></div></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R2-4: ...and the visible text after it survives",
    '<svg><div hidden /><p>HIDDEN-80</p></div></svg><p>VISIBLE-76</p>', "VISIBLE-76");
  survives("R2-4: ...while a genuine foreign element still self-closes",
    '<p>KEEP-A</p><svg><path d="M0 0"/></svg><p>KEEP-B</p>', "KEEP-B");
  /* THE NESTING, found by testing the case I had flagged as least confident rather than waiting to
     be told about it. The HTML-integration points (`foreignObject`, `desc`, `title`) make their
     contents HTML — but an `<svg>` inside one re-enters foreign content, and everything under THAT
     is foreign again. Resolving the context from "any ancestor is an integration point" instead of
     "the NEAREST ancestor decides" made the whole subtree HTML forever after the first
     foreignObject, and refused on an unterminated <path>. */
  removed("R2-4 nesting: inside a foreignObject an HTML element is HTML again, so its solidus is ignored",
    '<svg><foreignObject><div hidden /><p>HIDDEN-80</p></div></foreignObject></svg>', "HIDDEN-80");
  survives("R2-4 nesting: ...but an <svg> inside a foreignObject re-enters foreign content",
    '<p>KEEP-A</p><svg><foreignObject><svg><path d="M0 0"/></svg></foreignObject></svg><p>KEEP-C</p>', "KEEP-C");
  removed("R2-4 nesting: ...and three levels deep still resolves",
    '<svg><foreignObject><svg><foreignObject><div hidden /><p>HIDDEN-80</p></div></foreignObject></svg></foreignObject></svg>',
    "HIDDEN-80");

  /* ===== ROUND-3 FALLBACK REVIEW (2026-09-10). Two blockers, four inputs, down from eleven then
     eight. Both were a property the code already modelled correctly on the OTHER side.
     R3-1: `visibility` is an INHERITED property, so `unset` means `inherit`, and `revert` /
     `revert-layer` roll back past the author origin to the inherited value — there is no UA rule
     for visibility. All three inherit `hidden` from a hidden ancestor. `initial` is genuinely
     visible and is the control. This is R2-2 mirrored: display's revert-layer came out of its set
     and visibility's equivalents were left in.
     R3-2: there are FOUR HTML integration points. MathML `<annotation-xml>` is one when its
     `encoding` is text/html or application/xhtml+xml. The case uses `<section>` deliberately —
     correctly NOT on the breakout list, so nothing else could be deciding. */
  removed("R3-1: visibility:unset under a hidden ancestor INHERITS hidden — the named round-3 case",
    '<div style="visibility:hidden"><span style="visibility:unset">HIDDEN-80</span></div>', "HIDDEN-80");
  removed("R3-1: ...so does visibility:revert",
    '<div style="visibility:hidden"><span style="visibility:revert">HIDDEN-80</span></div>', "HIDDEN-80");
  removed("R3-1: ...and visibility:revert-layer",
    '<div style="visibility:hidden"><span style="visibility:revert-layer">HIDDEN-80</span></div>', "HIDDEN-80");
  survives("R3-1: ...while visibility:initial IS visible, because visibility's initial value is `visible`",
    '<div style="visibility:hidden"><span style="visibility:initial">VISIBLE-INITIAL</span></div>', "VISIBLE-INITIAL");
  removed("R3-2: MathML annotation-xml with an HTML encoding is the FOURTH integration point",
    '<math><annotation-xml encoding="text/html"><section hidden /><p>HIDDEN-80</p></section></annotation-xml></math>',
    "HIDDEN-80");
  survives("R3-3: a <font> inside foreign content does NOT break out without color/face/size",
    '<svg><font hidden /><p>VISIBLE-FONT</p></font></svg>', "VISIBLE-FONT");
  removed("R3-3: ...and DOES with one of them, per the spec",
    '<svg><font color="red" hidden /><p>HIDDEN-80</p></font></svg>', "HIDDEN-80");

  /* ===== ROUND-4 FALLBACK REVIEW (2026-09-10). Three blockers, and ALL THREE were mirrors of
     decisions already in the file — which is why the module header now enumerates the four sets it
     consults rather than listing the members it happens to have been told about. */
  removed("R4-1: [popover]:not(:popover-open) is a UA display:none rule, and static source never opens one",
    '<div popover>HIDDEN-80</div><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R4-1: ...including the explicit manual state",
    '<div popover="manual">HIDDEN-80</div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R4-1: ...while an inline display declaration still beats it, as it beats [hidden]",
    '<div popover style="display:block">VISIBLE-POPOVER</div>', "VISIBLE-POPOVER");
  removed("R4-2: MathML <mtext> is a TEXT integration point, so HTML inside it is HTML",
    '<math><mtext><section hidden /><p>HIDDEN-80</p></section></mtext></math>', "HIDDEN-80");
  removed("R4-2: ...and so is <mi>",
    '<math><mi><section hidden /><p>HIDDEN-80</p></section></mi></math>', "HIDDEN-80");
  refuses("R4-3: a <template shadowrootmode> is declarative shadow DOM — its contents are PAINTED, not inert",
    '<div><template shadowrootmode="open"><p>SHOWN-SHADOW</p></template></div>');
  removed("R4-3: ...while a plain <template> really is inert",
    '<template><p>HIDDEN-80</p></template><p>VISIBLE-76</p>', "HIDDEN-80");
  /* R4-4: the escape must not fire when the outcome is DETERMINED regardless of what was dropped.
     An `!important` declaration wins whatever an unknown beside it turns out to be, so refusing
     there is an outage rather than a safeguard — and the over-refusal had been copied wholesale onto
     the visibility path when its escape was built, carrying the bug across with the feature. Both
     paths now share `couldHaveChanged()` precisely so they cannot drift apart again. */
  removed("R4-4: an !important display declaration decides the outcome, so a dropped value beside it is not a reason to refuse",
    '<div style="display:none !important;display:bogus">GONE-IMPORTANT-DISPLAY</div>', "GONE-IMPORTANT-DISPLAY");
  removed("R4-4: ...the same on the visibility path",
    '<div style="visibility:hidden !important;visibility:bogus">GONE-IMPORTANT-VIS</div>', "GONE-IMPORTANT-VIS");
  refuses("R4-4: ...but with NO important declaration the dropped value could still have won, so it refuses",
    '<div style="display:none;display:bogus">X</div>');

  /* ===== ROUND-5 FALLBACK REVIEW (2026-09-10). It stopped hunting members and found two SETS, and
     it FETCHED the spec I had cited from memory rather than trusting my description of it. */
  removed("R5-4: `rp` is in the retrieved UA display:none rule and was missing — it certified",
    '<ruby>K<rp>HIDDEN-80</rp><rt>r</rt></ruby><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R5-4: so was `noframes`",
    '<noframes>HIDDEN-80</noframes><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R5-4: the popover rule carves out `dialog[open]`, which Chromium PAINTS — the over-deletion direction, on the rule added the round before",
    '<dialog open popover>VISIBLE-DIALOG-POPOVER</dialog>', "VISIBLE-DIALOG-POPOVER");
  removed("R5-4: ...while a popover that is not an open dialog is still not painted",
    '<div popover>HIDDEN-80</div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R5-4: `[hidden]` carves out `embed`, per the retrieved selector",
    '<embed hidden>x</embed><p>VISIBLE-EMBED</p>', "VISIBLE-EMBED");
  /* R5-3: replaced-element FALLBACK is not rendered — and this is a NEW instance of the shared
     blind spot, because the DOM oracle calls all of them painted (the text node's parent is the
     host, and checkVisibility(host) is true). Measured with innerText, deliberately, since the
     oracle is a party to the question. `object` is the control: its fallback really does render. */
  removed("R5-3: <canvas> fallback content is not rendered",
    '<canvas>HIDDEN-80</canvas><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R5-3: nor is <iframe> fallback", '<iframe>HIDDEN-80</iframe><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R5-3: nor <video>", '<video>HIDDEN-80</video><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R5-3: nor <audio>", '<audio>HIDDEN-80</audio><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R5-3: ...while <object> fallback DOES render, measured, and is the control",
    '<object>VISIBLE-OBJECT</object>', "VISIBLE-OBJECT");
  /* R5-2: the parser's p-closing set is longer than a rendering-flavoured block list. Every miss
     removed a sibling Chromium paints. */
  survives("R5-2: <dialog> closes an open <p>, so the text after it is NOT inside the hidden one",
    '<p hidden>HIDDEN-80<dialog open>VISIBLE-DIALOG</dialog>', "VISIBLE-DIALOG");
  survives("R5-2: ...so does <li>", '<p hidden>HIDDEN-80<li>VISIBLE-LI</li>', "VISIBLE-LI");
  survives("R5-2: ...and <dd>", '<p hidden>HIDDEN-80<dd>VISIBLE-DD</dd>', "VISIBLE-DD");
  survives("R5-2: ...and <center>", '<p hidden>HIDDEN-80<center>VISIBLE-CENTER</center>', "VISIBLE-CENTER");

  /* ===== ROUND-7 FALLBACK REVIEW (2026-09-10). Both blockers were INTRODUCED BY SUCCESSFUL FIXES,
     which is the most useful thing anyone has said about this file: replacing a refusal with a
     resolution converts "this filter does not know" into "this filter says VISIBLE", and the second
     is the dangerous answer. Round 3 correctly stopped `<svg>` refusing, and in doing so silently
     took a position on every SVG construct at once. */
  removed("R7-1: <defs> holds definitions, not rendered content — and the ORACLE calls it painted too",
    '<svg><defs><text>HIDDEN-80</text></defs></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R7-1: ...so do clipPath, pattern, mask, symbol, marker",
    '<svg><clipPath><text>HIDDEN-80</text></clipPath></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R7-1: ...and desc/metadata, where the oracle IS right",
    '<svg><desc>HIDDEN-80</desc></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R7-1: ...and the gradient/filter containers the review flagged but did not execute",
    '<svg><linearGradient><text>HIDDEN-80</text></linearGradient></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R7-1: ...while <g> renders and is the control",
    '<svg><g><text>VISIBLE-G</text></g></svg>', "VISIBLE-G");
  /* MathML's equivalent, which the review named as the obvious mirror and could not check. Measured:
     it is very nearly EMPTY — annotation, semantics, annotation-xml, mrow, mstyle, merror and
     maction all render. <mphantom> is the only one that hides, and by a different mechanism: it
     reserves its box and is not painted, which is why checkVisibility gets it right here and wrong
     on <defs>. */
  removed("R7-1 mirror: MathML <mphantom> reserves its box and is not painted",
    '<math><mphantom><mtext>HIDDEN-80</mtext></mphantom></math><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("R7-1 mirror: ...while <mrow> renders, and so does every other MathML container tested",
    '<math><mrow><mtext>VISIBLE-MROW</mtext></mrow></math>', "VISIBLE-MROW");
  /* R7-2: there is no raw-text switch in foreign content. `<svg><style></div></style>` contains a
     REAL `</div>` end tag, and treating the body as raw text swallowed it, left the hidden region
     open and deleted a card Chromium paints. The tokenizer tracks foreign context now, using the
     same helpers the tree builder uses. What remains on the deepest nesting is a REFUSAL rather
     than a resolution — popping past an unterminated <style> is outside this grammar — which is a
     loud non-certification replacing a silent deletion. */
  survives("R7-2: markup inside <svg><style> is parsed as tags, so a plain case resolves",
    '<svg><style></div></style></svg><p>VISIBLE-FOREIGN-STYLE</p>', "VISIBLE-FOREIGN-STYLE");
  removed("R7-2: ...while an HTML <style> really is raw text and its `</div>` is data",
    '<div hidden><style></div></style><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  refuses("R7-2: ...and the deepest nesting REFUSES rather than guessing where the region ends",
    '<div hidden><svg><style></div></style></svg><p>X</p></div><p>Y</p>');

  /* ===== ROUND-7 ADDENDUM. It asked WHY two members of one spec rule behave differently — the
     question produced a category with a name, the category produced a member neither side had, and
     the member turned out to be a whole class that no set can hold. */
  refuses("addendum: <object data> is UNDECIDABLE from source — its fallback shows only if the fetch FAILS",
    '<object data="x.svg">X</object>');
  survives("addendum: ...while a bare <object> shows its fallback and is decidable",
    '<object>VISIBLE-BARE-OBJECT</object>', "VISIBLE-BARE-OBJECT");
  /* THE MECHANISM THAT REPLACED TWO TABLES. Enumerating "non-rendering containers" can never be
     complete and both attempts were short; what is true is a rule about where foreign text is laid
     out at all, measured across 16 MathML and 19 SVG elements. */
  removed("addendum: SVG text renders ONLY inside <text> — direct text in <g> does not",
    '<svg><g>HIDDEN-80</g></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("addendum: ...while <text> renders, and <tspan> inside it inherits",
    '<svg><text><tspan>VISIBLE-TSPAN</tspan></text></svg>', "VISIBLE-TSPAN");
  removed("addendum: ...and a <tspan> ALONE does not, because it is not a text-content element",
    '<svg><tspan>HIDDEN-80</tspan></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("addendum: MathML text renders ONLY inside a token element — <annotation> does not",
    '<math><semantics><mtext>b</mtext><annotation>HIDDEN-80</annotation></semantics></math><p>VISIBLE-76</p>',
    "HIDDEN-80");
  survives("addendum: ...while <mtext> is a token element and renders",
    '<math><mrow><mtext>VISIBLE-MTEXT</mtext></mrow></math>', "VISIBLE-MTEXT");
  /* couldHaveChanged had no notion of WHERE a dropped declaration sat. */
  removed("addendum: an unknown BEFORE the winner cannot have won, so it is not grounds to refuse",
    '<div style="display:bogus;display:none">GONE-EARLIER-UNKNOWN</div>', "GONE-EARLIER-UNKNOWN");
  refuses("addendum: ...while an unknown AFTER a normal winner could have, so it still refuses",
    '<div style="display:none;display:bogus">X</div>');
  /* THE SAME RULE ON THE OTHER PROPERTY, pinned because it is a PAIR and the pair broke — for the
     fourth time — inside this very fix. The display path spread the declaration and inherited the
     index for free; the visibility path built a fresh winner object and dropped it silently, so
     couldHaveChanged compared against `undefined` and stopped refusing. A written instruction to
     check the other half has now failed to prevent this four times; a pinned assertion on both
     halves is what actually catches it. */
  refuses("addendum: visibility carries the same ordering rule — an unknown AFTER the winner refuses",
    '<div style="visibility:hidden;visibility:-x-odd">X</div>');
  removed("addendum: ...and an unknown BEFORE it decides, exactly as on the display path",
    '<div style="visibility:-x-odd;visibility:hidden">GONE-VIS-EARLIER</div>', "GONE-VIS-EARLIER");

  /* ===== ROUND 8. Both blockers came from the class this file itself nominated — places where a
     refusal had been replaced by a resolution — which is the first time the rule about changing
     lists predicted a finding instead of explaining one afterwards. */
  removed("R8-1: SVG `display` is a PRESENTATION ATTRIBUTE and participates in the cascade",
    '<svg><text display="none">HIDDEN-80</text></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R8-1: ...so does `visibility`, which keeps its box and is still not painted",
    '<svg><text visibility="hidden">HIDDEN-80</text></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("R8-1: ...and it applies to ancestors, not just the text element",
    '<svg><g display="none"><text>HIDDEN-80</text></g></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  /* THE ONE THAT MATTERS MOST: the allowlist is what stands between a blind oracle and a false
     certification, and it lived somewhere `opacity="0"` could never reach. */
  refuses("R8-1: `opacity` as an ATTRIBUTE now reaches the allowlist and refuses, as the style spelling does",
    '<svg><text opacity="0">X</text></svg>');
  /* THE POSITION TRAP, in both directions — presentation attributes are author-origin but rank
     BELOW the style attribute, and getting that backwards is R6-1 in a new place. */
  survives("R8-1: a style attribute OUTRANKS a presentation attribute",
    '<svg><text display="none" style="display:block">VISIBLE-STYLE-WINS</text></svg>', "VISIBLE-STYLE-WINS");
  removed("R8-1: ...and the presentation attribute still decides when style says nothing about it",
    '<svg><text display="none" style="visibility:visible">HIDDEN-80</text></svg><p>VISIBLE-76</p>', "HIDDEN-80");
  /* THE MIRROR THE REVIEW FLAGGED AND DID NOT RUN — measured here, and it does NOT reproduce.
     MathML `display="none"`, `visibility="hidden"` and `mathcolor` all still render, so reading
     presentation attributes there would invent a rule the browser does not have. A negative result
     is worth pinning precisely so nobody re-derives it as a finding. */
  survives("R8-1 mirror: MathML presentation attributes do NOT hide — measured, and deliberately not modelled",
    '<math><mtext display="none">VISIBLE-MATH-ATTR</mtext></math>', "VISIBLE-MATH-ATTR");
  /* R8-2: R6-2 gave `<plaintext>` an optional end tag and did not ask the second question this
     file's own rule requires — what else is now in scope. Everything after it is literal text to
     the end of the document, and the filter went on parsing markup, DELETING a region Chromium
     paints. Round 4's defect arriving through a fix for round 6. */
  refuses("R8-2: <plaintext> makes every byte after it literal text, and this checker will not parse past it",
    '<p>K</p><plaintext><div hidden><p>X</p></div>');

  /* ===== ROUND 9 answered the only-door question with a NO: there are FOUR doors and two were
     open. SMIL was the third, and the exclusion that should have covered it said "script-driven
     mutation" — SMIL is MARKUP and runs with scripting disabled, which is how it went nine rounds
     unnoticed. Refused rather than modelled: whether an animation freezes a hiding value depends on
     timing this checker will not resolve from source. */
  refuses("R9-1: <set> can freeze display:none onto its target from markup alone, with no script",
    '<svg><text>X<set attributeName="display" to="none" fill="freeze"/></text></svg>');
  refuses("R9-1: ...and <animate> the same, including the opacity spelling the ORACLE cannot see either",
    '<svg><text>X<animate attributeName="opacity" to="0" fill="freeze" dur="0.001s"/></text></svg>');
  survives("R9-1: ...while a plain <text> is untouched, and a <set> outside foreign content is not SMIL",
    '<svg><text>VISIBLE-PLAIN-TEXT</text></svg>', "VISIBLE-PLAIN-TEXT");

  refuses("an unrecognised VISIBILITY keyword, where dropping it would resolve hidden",
    '<div style="visibility:hidden;visibility:-x-odd">X</div>');
  /* WHY THE ASYMMETRY IS SOUND RATHER THAN LUCKY, written out because the reviewer checked the
     adjacent case that would have made it a certification and it holds: an unrecognised `display`
     value can NEVER be `none`, because `none` is a single token and is in the set. So concluding
     VISIBLE after dropping one is always safe, and only concluding HIDDEN needs the escape.
     `<div style="display:none none">` alone is painted by Chromium and kept here; the same value
     with a `hidden` attribute to fall back to refuses. */
  survives("...while an unrecognised value that resolves VISIBLE is harmless, because `none` is in the set and an unrecognised value therefore cannot be `none`",
    '<article style="display:noneish">VISIBLE-UNRECOGNISED</article>', "VISIBLE-UNRECOGNISED");
  removed("...while a display value this filter DOES recognise still resolves",
    '<div style="display:none;display:contents">KEEP</div><div style="display:block;display:none">GONE</div>', "GONE");

  /* ===== COMMENTS ARE REMOVED INSIDE THE PARSE (fallback review F3). Both of these deleted a
     VISIBLE contradiction when comment removal was a textual pre-pass in this file's own call path.
     The second also disarmed the module's `<script>`-containing-`<!--` refusal by removing the
     `<!--` before the tokenizer could see it. */
  survives("a comment INSIDE an attribute value does not delete the element",
    '<div title="a<!--x-->b">VISIBLE-ATTR-COMMENT</div>', "VISIBLE-ATTR-COMMENT");
  refuses("a comment spanning two script strings, which used to delete everything between them",
    '<script>var a="<!--";</script><p>VISIBLE-76</p><script>var b="-->";</script>');
  refuses("...and the <script> body carrying `<!--` is refused on the guard's OWN path, not just when called directly",
    '<div hidden><script>var s = "<!-- </script> -->";</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>');

  /* ===== WHAT MAKES THE ORACLE'S BLIND SPOTS SAFE, pinned because it is LOAD-BEARING rather than
     incidental. The round-4 addendum flagged three places where the DOM twin's oracle and this
     filter could be blind TOGETHER — and "they agree" then means "neither can see it". I executed
     all three rather than leave them as reasoning:

       opacity:0 on an ancestor      the oracle reports the text PAINTED; a reader sees nothing.
                                     CONFIRMED BLIND. The only thing preventing a certification is
                                     that the filter REFUSES `opacity` — which it does only because
                                     the modelled-property allowlist is exactly {display,
                                     visibility}. Widen that allowlist to any property whose zero
                                     value hides, and the filter and its own witness go wrong
                                     together, silently.
       content-visibility:auto       DOES NOT REPRODUCE. `checkVisibility({contentVisibilityAuto:
                                     true})` catches it; the oracle reports it unpainted, correctly.
       generated content (::before)  CONFIRMED BLIND on both sides — a reader sees it, neither the
                                     oracle nor the filter can. Latent: site/styles.css declares no
                                     `content:` with a string, asserted below.

     So the allowlist is pinned to its exact membership. This is not a style preference: it is the
     assertion that stands between a known-blind oracle and a false certification, and widening it
     should cost someone a deliberate decision rather than happen by accident. */
  assert("the modelled-property allowlist is EXACTLY {display, visibility} — the assertion that keeps the oracle's opacity blindness safe",
    (() => { const m = readFileSync(join(ROOT, "tests", "inert-filter.mjs"), "utf8")
        .match(/const MODELLED_PROPERTIES = new Set\(\[([^\]]*)\]\)/);
      return !!m && m[1].replace(/["'\s]/g, "") === "display,visibility"; })(),
    "widening it means a property whose value the DOM oracle may not be able to adjudicate — read the block above before changing this");
  /* THE ASSERTION I FIRST WROTE HERE WAS "styles.css declares no generated content" AND IT WAS
     WRONG — it failed immediately. The round-4 addendum's grep reported none; there are TWELVE.
     Looking at them is what settled it: eleven are disclosure triangles (▸ ▾) and one is an empty
     string for a rule line. Every one is decorative, so the blind spot is real and carries no risk
     of a false certification TODAY — no generated content on this page could satisfy or corrupt a
     face check, because none of it contains a character a reading is made of.
     That is the property worth asserting, and it is narrower and more useful than either "none
     exists" (false) or nothing (no protection). It goes red the day someone writes
     `content: "80% at list"` — text a reader sees and NEITHER the filter NOR the oracle can. */
  {
    const css = readFileSync(join(ROOT, "site", "styles.css"), "utf8");
    const strings = [...css.matchAll(/content\s*:\s*(["'])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
    const textual = strings.filter((v) => /[A-Za-z0-9%]/.test(v));
    assert(`no generated content on this page carries a character a READING is made of (${strings.length} content strings, all decorative)`,
      textual.length === 0,
      `generated content is painted for a reader and invisible to BOTH the filter and the DOM ` +
      `oracle, so textual generated content is a hole in the equivalence check: ${JSON.stringify(textual.slice(0, 4))}`);
  }

  /* ===== IS `styleDeclarations` THE ONLY DOOR? The round-8 review named this as the one thing to do
     before shipping: every bounded case in eight rounds was bounded by that one function, and R8-1
     was a spelling of a declaration that never reached it. Answering "yes" in prose would be worth
     nothing — eleven things I asserted from memory today turned out false — so it is asserted here
     instead, by auditing the source for every place an attribute is read at all.
     THE STRUCTURAL CLAIM, and it is narrow on purpose:
       · DECLARATIONS reach an element two ways in this filter's scope — the `style` attribute and
         SVG presentation attributes — and BOTH now arrive through `styleDeclarations`, which is
         where the modelled-property allowlist lives. That allowlist is what stands between a
         known-blind oracle and a false certification, so it must be on the only path.
       · UA RULES are not declarations. They are an enumerated set consulted separately, split by
         mechanism (beatable by an inline display, versus not in the box tree at all).
       · PARSER-CONTEXT reads (`font`'s attributes, `annotation-xml`'s encoding) decide markup
         structure, not visibility, and are not on this path at all.
       · A STYLESHEET is a third way a declaration can reach an element, and it is OUT OF SCOPE by
         declaration — bounded not by this assertion but by the DOM twin's live-page comparison,
         which reds if a stylesheet rule ever hides audited content.
     What this pin catches is a NEW attribute read appearing outside those places — which is exactly
     how R8-1 happened, and it would have caught it. */
  {
    const src = readFileSync(join(ROOT, "tests", "inert-filter.mjs"), "utf8");
    const lines = src.split("\n");
    const reads = [];
    /* THE RECEIVER IS NOT PART OF THE RULE — round-13 review R13-2, which is R9-4 demonstrated
       rather than counted. This pattern used to require `el.` or `a.`, and the reviewer added a
       real new hiding door spelled through a different variable —
       `if (child.attrs.has("data-collapsed")) { cuts.push(...); continue; }` in collect() — and the
       whole suite stayed green. A pin whose entire purpose is to catch a NEW door, silently missing
       a new door, because of which local someone happened to be holding. The control confirms it was
       the spelling and nothing else: the same decision written `el.attrs.get("aria-hidden")` fires
       the pin immediately.
       So the receiver is now ANY identifier, and the three PARSER-CONTEXT reads that legitimately
       use a bare `attrs` are allowlisted BY CONTENT below. Those decide markup structure, not
       visibility, which is why they are exempt — and naming them explicitly is what keeps the
       exemption from being "whatever the regex happened not to match". */
    lines.forEach((line, i) => {
      if (!/\battrs\.(?:get|has)\b/.test(line)) return;
      if (/^\s*(?:\*|\/\*|\/\/)/.test(line)) return;                       // prose, not code
      reads.push({ n: i + 1, line: line.trim() });
    });
    /* The declaration door, and the enumerated UA-rule triggers. Anything else is a new door. */
    const KNOWN = [
      /\battrs\.get\("style"\)/,                                             // the style attribute
      /\battrs\.has\("hidden"\)/, /\battrs\.get\("hidden"\)/,             // [hidden]
      /\battrs\.has\("open"\)/,                                              // dialog:not([open])
      /\battrs\.get\("type"\)/,                                              // input[type=hidden]
      /\battrs\.has\("popover"\)/,                                           // [popover]
      /\battrs\.has\("shadowrootmode"\)/,                                    // the DSD refusal
      /\battrs\.has\("data"\)/,                                              // the object refusal
      /* PARSER CONTEXT — markup structure, not visibility. Matched by their own content so the
         exemption names three specific reads rather than a receiver spelling. */
      /name === "font" && \(attrs\.has\("color"\)/,                          // the BREAKOUT font conditional
      /const enc = String\(attrs\.get\("encoding"\)/,                         // annotation-xml's encoding
      /if \(!attrs\.has\(aName\)\) attrs\.set\(aName, value\)/,             // the tokenizer's duplicate-attribute drop
    ];
    const unknown = reads.filter((r) => !KNOWN.some((k) => k.test(r.line)));
    assert(`every visibility-deciding attribute read goes through the declaration door or a named UA rule (${reads.length} reads audited)`,
      unknown.length === 0,
      `a read outside both: ${JSON.stringify(unknown.slice(0, 3))} — if it is a DECLARATION it must ` +
      `go through styleDeclarations so the allowlist sees it, and if it is a UA rule it belongs in ` +
      `set (1) with its mechanism recorded`);
    assert("...and the declaration door is actually present in that audit (the check is not vacuous)",
      reads.some((r) => /\battrs\.get\("style"\)/.test(r.line)));
    /* AND THE AUDIT REACHES THE BARE-RECEIVER READS, which is the whole of R13-2: if the pattern
       ever goes back to requiring a receiver spelling, these three drop out of `reads` and this
       reds — before the next new door slips through on a variable name. */
    assert(`...and it reaches the bare-receiver reads too, so a new door cannot hide behind a variable name (${reads.length} reads audited)`,
      reads.filter((r) => !/\b(?:el|a)\.attrs\./.test(r.line)).length === 3,
      `the three parser-context reads with a bare attrs receiver are not all in the audit: ` +
      JSON.stringify(reads.filter((r) => !/\b(?:el|a)\.attrs\./.test(r.line))));
  }

  /* ===== DOOR 4: THE STYLESHEET — REBUILT AFTER ROUND 10 BROKE THE FIRST VERSION.
     The filter reads no stylesheet and says so. Round 9 added a default-gate companion to that
     admission: pull the hiding rules out of the page's CSS, test each SELECTOR against a regex of
     estimate-card class names, assert none matches. I told the reviewer it was the crudest
     instrument in the repo and asked them to attack it. They did, and it failed OPEN — four
     ordinary selectors that hide the audited card and pass the scan, each injected into the page
     and measured in Chromium:

         .est\-card { display:none }                            a CSS-escaped hyphen; legal, matches
         article { display:none }                               the cards ARE <article> elements
         div:has(> article) > article { display:none }          a structural selector
         @media screen { .est-card .est-median{display:none} }   what responsive CSS looks like

     The last one is the one to keep in mind, because nobody has to be adversarial to write it: the
     naive `([^{}]+)\{([^}]*)\}` split attributes the declaration to the selector `@media screen`,
     so even the completeness counter still balanced. A selector scan at TEXT LEVEL cannot be made
     sound — a selector reaches a card in ways that never spell a card's name, and one that spells a
     name need not match anything.

     SO THE JOB IS SPLIT ACROSS THE TWO GATES, each getting the half it can actually do:

       * `test:browser` HAS A BROWSER, so it asks one. tests/inert-filter-dom-equivalence now
         asserts that every element this guard audits has a box and is visible as Chromium computes
         it, with all four bypasses above as executed negative controls. That is the GUARANTEE:
         no CSS engine of ours, no mechanism list, nothing a selector's spelling can dodge.
       * `npm test` HAS NO BROWSER, so it stops pretending to reason about selectors and becomes a
         TRIPWIRE instead: the set of hiding rules in the page's stylesheets must be EXACTLY the
         known set, by rule text. A new one reds — whatever its selector, whoever wrote it — until
         someone has looked at it and re-minted with a reason. That fails CLOSED, which is how
         everything else in this file behaves and is the one property the old scan lacked.

     THE TRIPWIRE'S OWN LIMIT, stated rather than left to be discovered: its notion of "hiding" is a
     list of mechanisms, and hiding has more spellings than any list (clip-path, off-screen
     positioning, transparent colour, scale(0) — round-10 R10-2). A NEW rule using a mechanism not
     in the list is not counted, so the set can miss it. That is exactly why the browser check above
     is the guarantee and this is the tripwire, and why the two are not redundant.

     ===== AND THE LARGEST LIMIT IN THIS FILE, which was implicit until round 15 made it explicit.
     Every instrument here — the parse, the oracle, geometry, hit-testing, pixels — asks a
     VISIBILITY question. Four rungs, each added because the one below it had a CSS property built
     to divorce it from what a reader sees. There is no fifth rung, because the next thing CSS can
     do is not a visibility mechanism at all:

         THIS GATE ESTABLISHES that the page's SOURCE and the registry quote the same estimator,
         and that the source text is VISIBLE to a reader. It does NOT establish that the rendered
         GLYPHS SPELL WHAT THE SOURCE SAYS. CSS can change the second without touching the first,
         and no visibility question can see it.

     Executed: `unicode-bidi: bidi-override` with `direction: rtl` leaves the DOM text byte-identical
     and renders %1.38 where the source says 83.1%; `-webkit-text-security: disc` renders five
     bullets. Both pass every rung HONESTLY — rendered, reachable, in front, carrying ink at 421.4
     and 191.0 density against a floor of 40. The instrument that would close this is rendered-text
     recognition, which is out of all proportion to a page with two estimate cards, and saying so is
     better than leaving the option hanging. Both mechanisms are in the tripwire's list instead,
     because it is the only thing positioned for a class no measurement here can reach.
     THE LIMIT IS THE SHAPE OF THE PROBLEM, not an implementation gap: even a perfect visibility
     model would not close door 4. */
  {
    /* R10-3: read the stylesheets THE PAGE ACTUALLY LOADS rather than one filename. The page has
       exactly one <link rel=stylesheet> today, so naming styles.css was complete BY COINCIDENCE;
       a second sheet would have been unscanned and unmentioned. */
    const hrefs = [...RAW.matchAll(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*>/gi)]
      .map((m) => (m[0].match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1])
      .filter((h) => h && !/^(https?:)?\/\//.test(h));
    assert("the CSS scan reads every stylesheet the page links, not a hard-coded filename",
      hrefs.length >= 1, "the page links no local stylesheet — the scan below would be vacuous");
    const inline = RAW.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) || [];
    /* COMMENTS FIRST. Without the strip a comment above a rule is glued onto the selector this
       scan reads — found by attacking my own instrument in round 9, kept because the reason has
       not changed. */
    const css = (hrefs.map((h) => readFileSync(join(ROOT, "site", h.replace(/^\.?\//, "")), "utf8")).join("\n")
      + "\n" + inline.join("\n")).replace(/\/\*[\s\S]*?\*\//g, " ");
    /* The mechanism list, widened past round 9's four on R10-2. `content-visibility: hidden` gets
       its own alternative and a lookbehind keeps it from being counted twice as a `visibility`
       match — round 9 caught it only as a substring, which was the right answer for the wrong
       reason and would stop being right at different spacing. */
    const HIDES_SRC = "(?:display\\s*:\\s*none"
      + "|(?<!content-)visibility\\s*:\\s*(?:hidden|collapse)"
      + "|content-visibility\\s*:\\s*hidden"
      + "|opacity\\s*:\\s*0(?!\\.\\d*[1-9])"
      + "|font-size\\s*:\\s*0(?!\\.\\d*[1-9])"
      + "|clip-path\\s*:\\s*inset\\(\\s*100%"
      + "|transform\\s*:\\s*scale\\(\\s*0\\s*\\)"
      + "|color\\s*:\\s*transparent"
      /* `filter` joins the list on round-14 R14-2, and it is here rather than in the pixel check
         because pixels CANNOT adjudicate it: a 6px Gaussian over 30px digits is unreadable and
         scores 530.8 per 1000px^2 against sharp text's 423.4 — PNG bytes measure entropy, and
         smearing glyphs ADDS intermediate colours. The check would reward it. Blur is a legibility
         mechanism arriving through door 4, and the tripwire is the enumerative half by design, so
         this is the honest place for it. Any non-`none` filter reds and somebody looks; the one on
         this page today (`.fb-submit:hover { filter: brightness(1.08) }`) is in the pinned set. */
      + "|filter\\s*:\\s*(?!none\\b)[a-z(]"
      /* THE LAST TWO ARE NOT HIDING MECHANISMS AT ALL, and that is exactly why they are here
         (round-15 review R15-1). `unicode-bidi: bidi-override` with `direction: rtl` leaves the DOM
         text byte-identical and lays the glyphs out backwards — a reader sees %1.38 where the source
         says 83.1%. `-webkit-text-security: disc` replaces every glyph with a bullet. Both pass
         EVERY rung of the visibility tower honestly: rendered, reachable, in front, and carrying ink
         at 421.4 and 191.0 density against a floor of 40.
         They are CONTENT mechanisms, not visibility ones, so no fifth instrument closes them — a
         visibility question cannot see a figure that is fully visible and says something else. The
         tripwire is the only thing positioned for them, and its whole job is to ask somebody to look
         once. Enumerative, and it will go short again; worth it anyway. */
      + "|unicode-bidi\\s*:\\s*(?:bidi-override|isolate-override|plaintext)"
      + "|(?:-webkit-)?text-security\\s*:\\s*(?!none\\b)[a-z])";
    /* TWO regexes on purpose. A `g`-flagged pattern used with `.test()` is STATEFUL — it carries
       lastIndex between calls and starts skipping matches — which I introduced here in round 9 one
       line before the completeness assertion that caught it. The counter needs `g`; the predicate
       must not have it. */
    const ONE = new RegExp(HIDES_SRC, "i");
    const rules = [];
    let reached = 0;
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const n = (m[2].match(new RegExp(HIDES_SRC, "ig")) || []).length;
      if (!n) continue;
      reached += n;
      const decls = m[2].split(";").map((x) => x.trim()).filter((x) => ONE.test(x));
      rules.push((m[1] + " { " + decls.join("; ") + " }").replace(/\s+/g, " ").trim());
    }
    rules.sort();
    const setSha = createHash("sha256").update(rules.join("\n"), "utf8").digest("hex");
    /* MINTED 2026-09-10 (im-guard-fix, round-10 R10-1), RE-MINTED the same day for round-14 R14-2.
       NINETEEN rules were `display:none` on a details marker, a `[hidden]` attribute, an empty
       save-note, or a coarse/fine-pointer affordance swap. The TWENTIETH arrived by adding `filter`
       to the mechanism list: `.fb-submit:hover { filter: brightness(1.08) }` — a hover brightness on
       the feedback button, nowhere near an estimate card. It is in the set because the tripwire is
       deliberately blunt about mechanisms and precise about CHANGE; a rule joining the set is not an
       accusation, it is a request that somebody look once.
       NONE of the twenty reaches an estimate card — and that fact is asserted by the BROWSER, in
       tests/inert-filter-dom-equivalence, not inferred from these strings. What this hash asserts is
       only that the set has not changed since someone checked.
       THE RE-MINT ITSELF IS THE DEMONSTRATION: widening the mechanism list reddened this assertion
       immediately, which is the fail-closed behaviour it was rebuilt for in round 10. */
    assert(`the page's stylesheets carry EXACTLY the known set of hiding rules (${rules.length} rules)`,
      setSha === "f8074e680c9a1d159dbd45ee6dfc82c81cf1430df43836f711967a5c0a48a682",
      `the set moved. This gate cannot tell whether the new rule reaches an audited card — a text `
      + `scan cannot — so it refuses instead. Run tests/inert-filter-dom-equivalence (it asks a real `
      + `browser whether every audited element is painted), then re-mint this hash with the reason. `
      + `Current set:\n` + rules.map((r) => "      " + r).join("\n"));
    assert("...and the scan actually found hiding rules to check (it is not passing on an empty set)",
      rules.length >= 10, `${rules.length} hiding rules found — the pattern has stopped matching`);
    /* AND IT REACHED EVERY ONE OF THEM. The rule-splitting regex is naive about nesting, and the
       question that matters for a SET pin is whether a hiding declaration can exist in the file
       that the scan never attributes to a rule at all — then the set could stay stable while the
       CSS changed. Measured: it reaches all 19 today, 3 of them inside @media. Asserted rather
       than trusted, so a nesting shape it cannot split reds here instead of passing silently. */
    const declared = (css.match(new RegExp(HIDES_SRC, "ig")) || []).length;
    assert(`the scan attributes EVERY hiding DECLARATION in the page's CSS to a rule (${reached} of ${declared}, across ${rules.length} rules)`,
      reached === declared,
      `${declared - reached} hiding declaration(s) exist that this scan never reached — a nesting `
      + `shape it does not split, so the set pin above could hold while the CSS moved underneath it`);
    /* AND THE MECHANISM LIST IS ITSELF CONTROLLED, in both directions. Every member has to match
       something, and a benign declaration has to match nothing — otherwise a member could quietly
       stop matching (round 9's `content-visibility`, which was caught only as a SUBSTRING of
       `visibility:hidden` and would have stopped being caught at different spacing) or the whole
       list could widen into noise. `filter: blur` is the case R14-2 turned up: pixels REWARD a blur,
       because smearing glyphs adds intermediate colours, so this list is the only instrument that
       can see it and the control says so explicitly. */
    const MECH_POSITIVE = [
      ["display:none", "a { display: none }"],
      ["visibility:hidden", "a { visibility: hidden }"],
      ["visibility:collapse", "a { visibility: collapse }"],
      ["content-visibility:hidden, at spacing that defeats a substring match", "a { content-visibility:hidden }"],
      ["opacity:0", "a { opacity: 0 }"],
      ["font-size:0", "a { font-size: 0 }"],
      ["clip-path:inset(100%)", "a { clip-path: inset(100%) }"],
      ["transform:scale(0)", "a { transform: scale(0) }"],
      ["color:transparent", "a { color: transparent }"],
      ["filter:blur — unreadable, and the PIXEL check REWARDS it (round-14 R14-2)", "a { filter: blur(6px) }"],
      ["filter:opacity", "a { filter: opacity(0) }"],
      ["unicode-bidi:bidi-override — the glyphs read BACKWARDS while the DOM text is unchanged", "a { unicode-bidi: bidi-override; direction: rtl }"],
      ["-webkit-text-security:disc — every glyph becomes a bullet, DOM text unchanged", "a { -webkit-text-security: disc }"],
    ];
    const MECH_NEGATIVE = [
      ["a non-zero opacity", "a { opacity: 0.85 }"],
      ["a non-zero font-size", "a { font-size: 0.9rem }"],
      ["filter:none, which hides nothing", "a { filter: none }"],
      ["an ordinary colour", "a { color: #e8e8e8 }"],
      ["a partial clip", "a { clip-path: inset(10%) }"],
      ["an ordinary bidi isolate, which changes no glyph order", "a { unicode-bidi: isolate }"],
      ["text-security:none", "a { -webkit-text-security: none }"],
    ];
    const mechRe = new RegExp(HIDES_SRC, "i");
    const missed = MECH_POSITIVE.filter(([, css2]) => !mechRe.test(css2)).map(([why]) => why);
    const overreach = MECH_NEGATIVE.filter(([, css2]) => mechRe.test(css2)).map(([why]) => why);
    assert(`every mechanism in the hiding list actually matches its own case (${MECH_POSITIVE.length} checked)`,
      missed.length === 0, `these members match nothing, so the list is shorter than it reads: ${JSON.stringify(missed)}`);
    assert(`...and none of them fires on a benign declaration (${MECH_NEGATIVE.length} checked)`,
      overreach.length === 0, `these would put ordinary CSS in the hiding set: ${JSON.stringify(overreach)}`);
  }

  /* THE SCOPE'S COST TODAY, asserted rather than claimed. */
  assert("the live page declares ZERO static inline style attributes, so the modelled-property scope costs it nothing",
    (RAW.match(/<[^>]*\sstyle\s*=/gi) || []).length === 0,
    `${(RAW.match(/<[^>]*\sstyle\s*=/gi) || []).length} inline style attribute(s) on the page — ` +
    "each must declare only display, visibility or a custom property, or the filter will refuse");

  /* ===== ROUND 5's TWO REJECTION ERRORS. Not equivalent in severity to false certification — a
     fail-closed checker may deliberately reject unsupported syntax — but a checker that refuses
     ORDINARY markup takes the gate down for a defect that has not happened, which is F6 again.
     Both are pinned as resolutions, in both directions. */
  const resolves = (label, html) => {
    let t = null;
    try { stripInert(html); } catch (e) { t = String(e.message).slice(0, 90); }
    assert(`inert filter RESOLVES rather than refusing: ${label}`, t === null, t || "");
  };
  resolves("N6-R5-T1: a hidden VOID element needs no closing tag", '<input hidden><p>VISIBLE</p>');
  survives("N6-R5-T1: ...and the visible paragraph after it survives",
    '<input hidden><p>VISIBLE</p>', "VISIBLE");
  resolves("N6-R5-T2: a <p> end tag may be omitted, and the next <p> closes it",
    '<p hidden>HIDDEN<p>VISIBLE</p>');
  removed("N6-R5-T2: ...the hidden paragraph really is hidden, and only as far as the next <p>",
    '<p hidden>HIDDEN<p>VISIBLE</p>', "HIDDEN");
  survives("N6-R5-T2: ...and the visible one survives",
    '<p hidden>HIDDEN<p>VISIBLE</p>', "VISIBLE");

  /* ===== AND THE SIXTEEN AT THE FILTER BOUNDARY. The mutations above prove each case is caught
     through the complete guard; these say what the filter must do with the construct itself, which
     is the half a mutation cannot express — a mutation can only show that something IS caught, never
     that something harmless SURVIVED. */
  removed("N6-R5-A1: an unquoted attribute value ending in a slash does not un-hide the region",
    '<div hidden data-path=/><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("N6-R5-A1: ...and the visible contradiction is left to be audited",
    '<div hidden data-path=/><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "VISIBLE-76");
  removed("N6-R5-A2: nor does it when the slash sits on a nested element",
    '<div hidden><div data-path=/>pad</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("N6-R5-A2: ...and the visible contradiction survives that too",
    '<div hidden><div data-path=/>pad</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "VISIBLE-76");
  removed("N6-R5-A3: `<div hidden />` opens a region rather than closing itself",
    '<div hidden /><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  removed("N6-R5-A4: and a nested `<div />` does not end one",
    '<div hidden><div />pad</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>', "HIDDEN-80");
  survives("N6-R5-B1: a custom property containing display:none declares no display",
    '<article style="--memo: display:none">VISIBLE-CUSTOM-PROP</article>', "VISIBLE-CUSTOM-PROP");
  survives("N6-R5-B2: the later declaration wins",
    '<article style="display:none;display:block">VISIBLE-CASCADE</article>', "VISIBLE-CASCADE");
  survives("N6-R5-B3: display:noneish is not display:none",
    '<article style="display:noneish">VISIBLE-PREFIX</article>', "VISIBLE-PREFIX");
  survives("N6-R5-B4: an inline display declaration beats the UA [hidden] rule",
    '<article hidden style="display:block">VISIBLE-OVERRIDE</article>', "VISIBLE-OVERRIDE");
  survives("N6-R5-B5: a descendant restoring visibility:visible is still on screen",
    '<div style="visibility:hidden"><article style="visibility:visible">VISIBLE-RESTORED</article></div>',
    "VISIBLE-RESTORED");
  removed("N6-R5-B5: ...while the text the hidden parent paints over is not published",
    '<div style="visibility:hidden">PAINTED-OVER<article style="visibility:visible">VISIBLE-RESTORED</article></div>',
    "PAINTED-OVER");
  survives("N6-R5-C1: a matching suffix is not an attribute name",
    '<article 1hidden="x">VISIBLE-SUFFIX</article>', "VISIBLE-SUFFIX");
  survives("N6-R5-C2: a duplicate attribute is dropped, so the first valueless style wins",
    '<article style style="display:none">VISIBLE-DUPLICATE</article>', "VISIBLE-DUPLICATE");
  removed("N6-R5-D1: `</div>` inside a <script> holding JSON is data, not a close tag",
    '<div hidden><script type="application/json">"</div>"</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>',
    "HIDDEN-80");
  survives("N6-R5-D2: a `<div hidden>` inside script data opens no region around a visible card",
    '<script type="application/json">"<div hidden>"</script><article>VISIBLE-BETWEEN</article><script type="application/json">"</div>"</script>',
    "VISIBLE-BETWEEN");
  removed("N6-R5-E1: display&colon;none is decoded and hides",
    '<div style="display&colon;none">ENT-NAMED-GONE</div>', "ENT-NAMED-GONE");
  removed("N6-R5-E2: display:&#110one is decoded and hides — a numeric reference needs no semicolon",
    '<div style="display:&#110one">ENT-NUMERIC-GONE</div>', "ENT-NUMERIC-GONE");
  removed("N6-R5-E3: display:/*c*/none is resolved and hides",
    '<div style="display:/' + '*c*' + '/none">CSS-COMMENT-HIDES</div>', "CSS-COMMENT-HIDES");
}

console.log(failures
  ? `\n${failures} FACE-VS-REGISTRY FAILURE(S)`
  : `\nALL FACE-VS-REGISTRY TESTS PASS (${live.cardCount} cards audited; every mutation regression names the rule it trips)`);
process.exit(failures ? 1 : 0);
