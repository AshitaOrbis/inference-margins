/* INERT-CONTENT FILTER — what a reader actually sees, derived rather than guessed.
 *
 * Used by tests/face-vs-registry.test.mjs to decide which parts of site/index.html are PUBLISHED
 * before it audits what the page claims. Extracted into its own module by im-guard-fix (2026-09-10)
 * for one reason: the equivalence claim below has to be testable by something other than itself, and
 * tests/inert-filter-dom-equivalence.test.mjs drives this function and Chromium over the same inputs
 * and requires them to agree.
 *
 * WHY IT WAS REBUILT. GPT Pro session 1 round 5 (pr-20260910T075843Z-ec3144, attested gpt-6-pro)
 * held publication on N6 and filed SIXTEEN cases in which Chromium displays a contradictory estimate
 * while the complete, unchanged guard exits 0, plus two ordinary inputs on which it threw
 * unnecessarily. FOURTEEN of the eighteen reproduced against the shipped bytes — thirteen as false
 * certifications and T2 as a spurious refusal. Three were already closed by fixes that landed after
 * the review packet was assembled, and one had moved from false certification to a refusal. (An
 * earlier version of this paragraph said thirteen and tallied 13+3+1 = 17 of 18; the missing case
 * was T2. Corrected after the fallback review counted it, and left visible because this file's whole
 * argument is that an assertion must not claim more than it shows.) All eighteen are pinned in the guard as N6-R5-* regressions whatever
 * their starting state, because a case that passes by accident of a later fix is not pinned.
 *
 * The predecessor was a linear scan over raw text with a quote-aware tag regex. Every one of round
 * 5's cases is the same mistake in a different costume: a SUBSTRING was asked a question only a
 * PARSE can answer.
 *
 *   `<div hidden data-path=/>`     an unquoted attribute value ending in a slash is not a
 *                                  self-closing instruction (round 5, N6-R5-A)
 *   `<div hidden />`               and a solidus before `>` on an ordinary HTML element is IGNORED,
 *                                  so this opens a div that still has to be closed
 *   `style="--memo: display:none"` a custom property whose VALUE contains those tokens declares no
 *                                  display at all (N6-R5-B)
 *   `style="display:none;display:block"`   the later declaration wins; substring membership has no
 *                                  notion of a cascade
 *   `<article hidden style="display:block">`  an author inline declaration beats the UA `[hidden]`
 *                                  rule, so this element is VISIBLE
 *   `visibility:hidden` on a parent  does not settle a descendant that sets `visibility:visible` —
 *                                  visibility inherits and can be restored, display cannot
 *   `<article 1hidden="x">`        a matching suffix is not an attribute name (N6-R5-C)
 *   `<article style style="display:none">`  a duplicate attribute is DROPPED by the tokenizer, so
 *                                  the first, valueless one is the element's style
 *   `</div>` inside script data     is a string, not a close tag (N6-R5-D)
 *   `display&colon;none`, `display:&#110one`, `display:/**​/none`   all hide, and all read as
 *                                  something else to a scanner that does not decode (N6-R5-E)
 *
 * WHAT THIS IS. An HTML tokenizer shaped after the spec's states, a tree builder that models the
 * optional-end-tag rules the page relies on, and a CSS reader scoped to inline `style` declarations.
 * Structure and visibility are computed from the resulting tree, not matched out of text.
 *
 * WHAT THIS IS NOT, said here rather than left for the next reader to find. It is a RESTRICTED
 * GRAMMAR, and the restriction is enforced rather than described: a construct it does not model
 * makes it THROW. It does not implement HTML's full tree construction (no foster parenting, no
 * adoption agency, no implied html/head/body); it reads no stylesheet, so a rule in the page's own
 * <style> block that hides an element is invisible to it; it resolves no `var()`, no `attr()`, no
 * media query and no `content-visibility`. It REFUSES SMIL rather than resolving it, and it does
 * not model script-driven mutation — "script-driven" being the word that let SMIL through for nine
 * rounds, since SMIL needs no script at all.
 * THE FOUR DOORS A DECLARATION CAN COME THROUGH, which is the structural statement eight rounds
 * were converging on and round 9 had the evidence to write:
 *   1. the `style` attribute         MODELLED — the property allowlist lives here
 *   2. SVG presentation attributes   MODELLED (round 8), ranked below the style attribute
 *   3. SMIL animation elements       REFUSED (round 9)
 *   4. the document's own stylesheet NOT READ, out of scope by declaration
 * The fourth is checked by tests/inert-filter-dom-equivalence against a real browser on the real
 * page — and that suite runs in `test:browser`, NOT in the default `npm test`, which is a limit of
 * the GATE rather than of the filter, stated because an earlier version of this sentence claimed a
 * mitigation the default gate does not run. The guard additionally asserts that no hiding rule in
 * the page's stylesheets targets an estimate card, which is what makes door 4 latent today.
 * Every one of those is a
 * reason the DOM-equivalence twin exists: the claim "equivalent for the constructs this page uses"
 * is checked against a real browser on the real page, on every run, instead of being asserted here.
 *
 * THE PROPERTY IT MUST HOLD, in round 4's words and round 5's: filtering cannot silently turn a
 * visible contradiction into agreement, and an invisible correct quotation cannot satisfy a check
 * about what is published. Where it cannot decide, it throws — a checker's way of saying it does
 * not know, which is the one answer that never certifies.
 */

/* ---------- character references ----------
   Numeric references are decoded with or without their semicolon, which is what a browser does and
   is round 5's `display:&#110one`. Named references are decoded from the table below — deliberately
   a subset, and deliberately not extended by guessing: an undecoded reference left inside a
   display/visibility declaration THROWS rather than being read as literal text. */
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  colon: ":", semi: ";", sol: "/", bsol: "\\", lpar: "(", rpar: ")",
  lbrack: "[", rbrack: "]", lbrace: "{", rbrace: "}", excl: "!", num: "#",
  dollar: "$", percnt: "%", ast: "*", midast: "*", plus: "+", comma: ",",
  period: ".", quest: "?", commat: "@", lowbar: "_", grave: "`", verbar: "|",
  tilde: "~", equals: "=", hyphen: "‐", dash: "‐", minus: "−",
  ndash: "–", mdash: "—", hellip: "…", times: "×",
  divide: "÷", deg: "°", middot: "·", bull: "•",
  dagger: "†", copy: "©", reg: "®", trade: "™",
  laquo: "«", raquo: "»", ldquo: "“", rdquo: "”",
  lsquo: "‘", rsquo: "’", sbquo: "‚", bdquo: "„",
  prime: "′", Prime: "″", larr: "←", rarr: "→",
  harr: "↔", ge: "≥", le: "≤", ne: "≠", asymp: "≈",
  Tab: "\t", NewLine: "\n", sect: "§", para: "¶", permil: "‰",
  euro: "€", pound: "£", yen: "¥", cent: "¢",
  frac12: "½", frac14: "¼", frac34: "¾",
  sup2: "²", sup3: "³", thinsp: " ", ensp: " ", emsp: " ",
};
/* Decode in ATTRIBUTE-VALUE context. The spec's one attribute-specific rule is preserved: a NAMED
   reference with no trailing semicolon that is followed by `=` or an alphanumeric is left alone,
   for historical reasons (so `?a&lt=1` keeps its literal text). Numeric references carry no such
   exception, which is exactly why `display:&#110one` hides. */
export function decodeAttrValue(raw) {
  let out = "", i = 0;
  while (i < raw.length) {
    const amp = raw.indexOf("&", i);
    if (amp === -1) { out += raw.slice(i); break; }
    out += raw.slice(i, amp);
    const rest = raw.slice(amp);
    let m;
    if ((m = /^&#[xX]([0-9a-fA-F]+);?/.exec(rest))) {
      out += String.fromCodePoint(parseInt(m[1], 16) || 0xfffd); i = amp + m[0].length; continue;
    }
    if ((m = /^&#(\d+);?/.exec(rest))) {
      out += String.fromCodePoint(Number(m[1]) || 0xfffd); i = amp + m[0].length; continue;
    }
    if ((m = /^&([A-Za-z][A-Za-z0-9]*)(;?)/.exec(rest))) {
      const [whole, name, semi] = m;
      const next = raw[amp + whole.length] || "";
      const historical = !semi && (next === "=" || /[A-Za-z0-9]/.test(next));
      if (!historical && Object.prototype.hasOwnProperty.call(NAMED, name)) {
        out += NAMED[name]; i = amp + whole.length; continue;
      }
    }
    out += "&"; i = amp + 1;
  }
  return out;
}

/* ============================================================================================
   THE FOUR SETS THIS FILTER CONSULTS, WRITTEN DOWN — the round-4 review's actual prescription, and
   worth more than any of the fixes beside it.
   THE DIAGNOSIS: across four adversarial rounds, EVERY blocker after the first was a mirror — a
   member of a set that the filter consulted but nobody had enumerated. Each fix was made against the
   case that was FILED, and the filed case named one member. So `revert-layer` came out of display's
   keyword set while visibility's equivalents stayed in; `annotation-xml` was added while MathML's
   five text integration points were not; the show-side mutation guard was built and the hide side's
   dual was not; `[hidden]`, `dialog` and `input[type=hidden]` were modelled and `popover` was not.
   That is a search which terminates when the REVIEWER stops thinking of members, not when the filter
   is right — the reviewer's own words, and the reason it declined to predict that another clean
   round would mean closure.
   So: the sets are listed here with their sources. A reviewer can now attack the LIST.

   (1) UA RULES THAT RESOLVE TO display:none — consulted in `elementDisplayNone`, AFTER any inline
       display declaration, because an author inline declaration beats a normal-origin UA rule.
       `[hidden]` · `dialog:not([open])` · `input[type=hidden]` · `[popover]:not(:popover-open)` ·
       every element in UA_HIDDEN below.
       Source: the HTML standard's Rendering section, "Hidden elements".
       KNOWN NOT MODELLED: `:popover-open` can only be entered by script, so static source never
       opens one — if this filter is ever pointed at a live DOM that changes.

   (2) PARSER CONTEXT SWITCHES — where markup stops being HTML or starts being HTML again.
       VOID · RAWTEXT · BREAKOUT (plus conditional `font`) · SVG_INTEGRATION ·
       MATHML_TEXT_INTEGRATION · `annotation-xml` with an HTML encoding.
       Source: the HTML standard's tree-construction section, "The rules for parsing tokens in
       foreign content" — the breakout list and the integration points are given there verbatim.
       KNOWN NOT MODELLED: script-data ESCAPED states (a `<script>` body containing `<!--` refuses);
       adoption-agency reparenting (misnested formatting elements refuse); foster parenting.

   (3) CONTAINERS WHOSE CONTENT IS OR IS NOT PUBLISHED — a POLICY list, not a spec list, and the one
       most likely to grow.
       `<option>` PUBLISHED, ruled here rather than sent to the owner, and the FAILURE DIRECTION is
       what decides it rather than the `<details>` analogy. Published means the filter keeps option
       text, so a contradictory figure parked in an unselected option is AUDITED — noisier, never
       blinder. Not-published means a figure a reader reaches with one click is invisible to the
       gate, which is the certifying direction. For a checker whose whole principle is that it
       refuses where it cannot decide, because refusing never certifies, that asymmetry settles it
       without anyone having to rule on what a reader "really" sees in a closed control. The
       `<details>` ruling decided what the PAGE may put behind a click; this decides only what a
       CHECKER looks at, which is not the owner's question. The ORACLE is made to agree in the same
       change, because a filter and an oracle that disagree is the defect this file has now had
       three times ·
       `<details>` PUBLISHED by ruling, because the estimate-card bodies live in one and a
       disclosure the reader can open is published text · `<template>` NOT published, its contents
       being inert · `<template shadowrootmode>` REFUSED, because it is not a template at all once
       parsed — its contents become a shadow root and are painted · `<noscript>` NOT published, its
       content being raw text while scripting is enabled, which is the state the page and the oracle
       both run in · `<textarea>` PUBLISHED, its content being the control's value.
       KNOWN NOT MODELLED: `<slot>` assignment; `hidden="until-found"` (refused); `<dialog>` opened
       by script.

   (4) THE PAIRED IMPLEMENTATIONS — each of these exists twice, and the pairs have twice now been
       written with a difference that became a blocker.
       The two CSS-wide keyword readings (display's DISPLAY_VALUES vs visibility's `read()`) ·
       the two `!important` precedence loops · the two bounded escapes, which share
       `couldHaveChanged()` precisely so they cannot drift apart again · the two entity decoders,
       `decodeAttrValue` here and `ENT` in tests/face-vs-registry.test.mjs, which are DELIBERATELY
       different and whose difference is documented at both sites.
       AND THE THREE THAT ACTUALLY DRIFTED, added after they did (round-5 addendum T3), because this
       list was itself short in exactly the way the other four had been:
         · THE FILTER'S VISIBILITY MODEL AND THE ORACLE'S. The replaced-element rule landed here and
           not there, leaving the filter right and the oracle WRONG — the worst direction, because
           the obvious fixture then reds against a blind oracle and invites someone to "correct" the
           code back to wrong.
         · THE TWIN'S ORACLE AND THE SWEEP'S. The shadow-root repair landed in one and not the
           other, and I said twice that it was in both.
         · THE TWO FIXTURE CORPORA, with no rule about which gets a new case — which is how the
           declarative-shadow-DOM fixture ended up in one and not the other.
       THE FIRST TWO ARE NOW UNPAIRED RATHER THAN DOCUMENTED: the oracle is defined ONCE in
       tests/dom-oracle.mjs and imported by both consumers, so there is nothing left to keep in
       step. A written rule that a pair must agree is weaker than not having a pair — which is the
       lesson of its own violation, since the rule below was ADDED in the commit that broke it.
       THE RULE THIS FILE STILL ASKS OF ANYONE EDITING IT: when a fix lands on one member of a pair,
       check the other before committing — and if you can delete the pair instead, do that.
   AND THE RULE ABOUT CHANGING THEM, which is worth more than any of the lists and is the only thing
   here that would have PREDICTED a finding before it was filed. When a set grows, or when a REFUSAL
   IS REPLACED BY A RESOLUTION, two questions are due before the commit:
     · what else is now in scope?
     · is this set consulted at the point where its rule actually applies?
   Both of round 7's blockers were one instance of each, and both were introduced BY SUCCESSFUL
   FIXES. Round 3 correctly stopped `<svg>` refusing — and thereby took a silent position on every
   SVG construct at once, of which twelve do not render. Round 6 correctly enlarged RAWTEXT — and
   nobody asked that it is consulted in the tokenizer, which cannot see foreign content, where no
   raw-text switch exists.
   THE ASYMMETRY BEHIND THE RULE: replacing a refusal with a resolution converts "this filter does
   not know" into "this filter says VISIBLE", and only one of those is safe to be wrong about. Every
   such change in this file is therefore a place to re-audit, not a place to celebrate — the
   candidates as of 2026-09-10 being `<svg>` (round 3), CSS comments and escapes (F16),
   `display:noneish` falling through (round 5 B3), `plaintext` (R6-2), and the invalid-value
   fall-through generally.
   ============================================================================================ */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link",
                      "meta", "param", "source", "track", "wbr"]);
/* HTML ELEMENTS BREAK OUT OF FOREIGN CONTENT (round-2 review R2-4). The parser's own list: inside an
   `<svg>` or `<math>` subtree these tags do not stay foreign — they pop out, become ordinary HTML,
   and a trailing solidus on them is IGNORED again, which is round 5's A3/A4 one layer in.
   `<svg><div hidden /><p>HIDDEN-80</p></div></svg>` hides HIDDEN-80 in Chromium and was kept here.
   The HTML-integration points do the same for everything inside them. */
const BREAKOUT = new Set(["b", "big", "blockquote", "body", "br", "center", "code", "dd", "div",
  "dl", "dt", "em", "embed", "h1", "h2", "h3", "h4", "h5", "h6", "head", "hr", "i", "img", "li",
  "listing", "menu", "meta", "nobr", "ol", "p", "pre", "ruby", "s", "small", "span", "strong",
  "strike", "sub", "sup", "table", "tt", "u", "ul", "var"]);
/* `font` IS CONDITIONAL (round-3 review R3-3): it breaks out only when it carries `color`, `face`
   or `size`. Listing it unconditionally made `<svg><font hidden /><p>SHOWN-80</p></font></svg>`
   remove text Chromium paints — narrow, needing a `font` inside an `<svg>`, but it is the
   OVER-DELETION direction, which is round 4's original defect. */
const breaksOut = (name, attrs) => BREAKOUT.has(name)
  || (name === "font" && (attrs.has("color") || attrs.has("face") || attrs.has("size")));
/* FOUR INTEGRATION POINTS, NOT THREE (round-3 review R3-2). MathML `<annotation-xml>` is one when
   its `encoding` is text/html or application/xhtml+xml, so its contents are HTML and a solidus on
   them is ignored. The reviewer's case used `<section>`, which is correctly NOT on the breakout
   list, so BREAKOUT could not mask it and the integration point was the only thing deciding. */
const SVG_INTEGRATION = new Set(["foreignobject", "desc", "title"]);
/* MathML TEXT integration points (round-4 review R4-2). Inside these an HTML start tag is processed
   by HTML rules, so a trailing solidus is ignored exactly as it is inside a foreignObject. Adding
   `annotation-xml` in round 3 and stopping there was the same mirror mistake one more time: the
   filed case named one member of a set nobody had written down. The set is written down now. */
const MATHML_TEXT_INTEGRATION = new Set(["mi", "mo", "mn", "ms", "mtext"]);
const isIntegrationPoint = (name, attrs) => {
  if (SVG_INTEGRATION.has(name) || MATHML_TEXT_INTEGRATION.has(name)) return true;
  if (name !== "annotation-xml") return false;
  const enc = String(attrs.get("encoding") || "").trim().toLowerCase();
  return enc === "text/html" || enc === "application/xhtml+xml";
};
/* Bodies a parser does not read as markup. `</div>` inside one is data. */
/* SHORT BY FOUR (round-5 addendum T4): `iframe`, `xmp`, `noembed` and `noframes` are raw-text or
   escapable-raw-text too, and without them F7's shape refuses where the listed `style` resolves —
   fail-closed, so an outage rather than a certification, but an outage on legal markup.
   `noembed` and `noframes` were each missing from TWO sets at once, UA_HIDDEN and this one, which
   is the mirror pattern inside a single fix. */
const RAWTEXT = new Set(["script", "style", "textarea", "title", "noscript",
                         "iframe", "xmp", "noembed", "noframes"]);
/* Elements whose content the UA does not render at all. `<details>` is deliberately NOT here —
   a disclosure the reader can open is published text, and the estimate-card bodies live in one. */
/* RETRIEVED, NOT RECALLED (round-5 review R5-4). Fetched from
   https://html.spec.whatwg.org/multipage/rendering.html on 2026-09-10 and pasted verbatim, because
   the previous version of this set was written from memory of the spec's shape: it was right in
   shape and short by five reachable members, two of which certified a hidden contradiction.

     area, base, basefont, datalist, head, link, meta, noembed,
     noframes, param, rp, script, style, template, title { display: none; }

     [hidden]:not([hidden=until-found i]):not(embed) { display: none; }
     input[type=hidden i] { display: none !important; }
     @media (scripting) { noscript { display: none !important; } }
     [popover]:not(:popover-open):not(dialog[open]) { display:none; }
     :is(table, thead, tbody, tfoot, tr) > form { display: none !important; }

   `rp` and `noframes` were MISSING and both certified — `<ruby>K<rp>CONTRADICTION</rp><rt>r</rt>`
   is not painted by Chromium and was kept here. `basefont`, `noembed`, `area` and `param` are added
   from the same rule; the last two are void, so no text was ever at stake in them.
   THE FORM RULE IS DELIBERATELY NOT IMPLEMENTED and this is why, recorded so nobody re-derives it:
   Chromium PAINTS a form inside a table, because the parser foster-parents it out of the table
   before that selector can match. The rule exists; the situation it describes does not arise. */
const UA_HIDDEN = new Set(["area", "base", "basefont", "datalist", "head", "link", "meta", "noembed",
                           "noframes", "param", "rp", "script", "style", "template", "title",
                           "noscript"]);
/* REPLACED ELEMENTS whose child content is FALLBACK and is not rendered (round-5 review R5-3).
   Measured with innerText rather than with the DOM twin's oracle, deliberately, because the oracle
   is a party to this: it calls every one of them PAINTED, since the text node's parent is the host
   and checkVisibility(host) is true. So this is a NEW instance of the shared-blind-spot class the
   round-4 addendum named — neither the twin nor the sweep could catch it, exactly as with shadow
   roots. `object` is NOT here: its fallback legitimately renders, and was measured doing so. */
export const REPLACED_FALLBACK = new Set(["canvas", "iframe", "video", "audio"]);
/* TWO MECHANISMS, NOT ONE — and the switch is split, not the sets (round-6 review R6-1).
   `hiddenByUA` is consulted only when no valid inline `display` won, which is exactly right for a
   NORMAL-ORIGIN UA display:none rule: an author's inline declaration beats it, and eight members
   were verified behaving correctly under that rule. It is WRONG for members whose content is not in
   the box tree for a reason that has nothing to do with `display`, because no inline declaration can
   beat a reason that is not a display rule. `<canvas style="display:block">CONTRADICTION-76</canvas>`
   is not seen by a reader and was KEPT here — a certification, through the complete guard.
   DERIVED, not reasoned: every candidate was given `style="display:block"` and measured with
   innerText (deliberately not the oracle, which is a party to the question). The split came back
     BEATABLE  noframes object script style title datalist basefont rp area param base link meta head
     NOT RENDERED  template noscript noembed canvas iframe video audio
   which is the same seven the review named, arrived at independently.
   `template` and `noscript` have carried this since before round 1. The replaced-element fix did not
   introduce the defect — it JOINED it, a new member added to a set that was correct in membership
   and misclassified in mechanism. That is the mirror habit with the list already written down,
   which is why set (1) now records the mechanism and not only the members. */
/* SVG'S NON-RENDERING CONTAINERS (round-7 review R7-1), and the way this became reachable is the
   finding rather than the members. `<svg>` used to REFUSE; round 3 fixed that, correctly — and in
   doing so converted "this filter does not know" into "this filter says VISIBLE" for every SVG
   construct at once, without anyone asking which parts of SVG render. Replacing a refusal with a
   resolution is not a neutral improvement: the second answer is the dangerous one.
   MEASURED WITH BOUNDING RECTS, because for SVG neither innerText nor checkVisibility is
   trustworthy. The review named seven and flagged four as unchecked; all four are real, and the
   measurement found a twelfth it had not named:
     defs symbol clipPath pattern mask marker      w=0 h=0, checkVisibility TRUE  <- oracle ALSO wrong
     desc metadata linearGradient radialGradient   w=0 h=0, checkVisibility false <- oracle correct
     filter title                                  w=0 h=0, checkVisibility false
     g a switch                                    RENDER (controls)
   The first row is a shared blind spot: neither the twin nor the sweep can catch those, so the
   filter is the only thing standing there. */
const SVG_NOT_RENDERED = new Set(["defs", "symbol", "clippath", "pattern", "mask", "marker",
                                  "desc", "metadata", "lineargradient", "radialgradient", "filter"]);
/* AND MATHML'S EQUIVALENT, which the review could not check and named as the obvious mirror. It is
   very nearly empty: annotation, semantics, annotation-xml, mrow, mstyle, merror and maction all
   RENDER their text, measured. `<mphantom>` is the only one that hides — and by a DIFFERENT
   mechanism, since it reserves its box and simply is not painted, which is why checkVisibility gets
   it right where it gets defs wrong. */
const MATHML_NOT_RENDERED = new Set(["mphantom"]);
/* A MECHANISM INSTEAD OF TWO TABLES (2026-09-10, prompted by the round-7 addendum asking WHY two
   members of one spec rule behave differently — the question that produced a category with a name
   and then a member nobody had thought of).
   Enumerating "non-rendering containers" can never be complete, and both of ours were short. What
   is actually true is a rule about where foreign text is laid out at all, and it was measured, not
   recalled:
     MATHML — direct text renders ONLY inside a TOKEN element. mtext, mi, mo, mn and ms render it;
       mrow, semantics, annotation, annotation-xml, mstyle, merror, maction, mphantom, msqrt, mfrac
       and <math> itself do NOT. Sixteen elements measured, and the split falls exactly on the token
       set.
     SVG — direct text renders ONLY inside <text>. Nineteen elements measured: text renders,
       foreignObject renders (its contents are HTML again), and everything else — including tspan
       and textPath at top level, and g, a and switch which DO lay out a <text> child — does not.
   So a definitional container like <defs> is not a special case at all; it is one instance of
   "not a text-content element". The container sets above are KEPT because they carry the second,
   independent rule — a <text> INSIDE <defs> is still not rendered — but the rule below is what
   makes the model complete rather than a list of the members someone happened to file. */
/* SVG PRESENTATION ATTRIBUTES (round-8 review R8-1), and this is the finding that matters most
   structurally of any in eight rounds. In SVG, `display`, `visibility` and `opacity` are also
   ATTRIBUTES, and they are author-origin declarations that participate in the cascade exactly as
   CSS does. `styleDeclarations` read `el.attrs.get("style")` and nothing else, so none of them was
   ever seen: `<text display="none">CONTRADICTION</text>` is not painted and was KEPT.
   WHY IT IS WORSE THAN ANOTHER SET. The round-5 addendum established, and this file enacts, that
   MODELLED_PROPERTIES = {display, visibility} is not a style preference but THE ASSERTION STANDING
   BETWEEN A KNOWN-BLIND ORACLE AND A FALSE CERTIFICATION: `opacity:0` is invisible to the oracle,
   and the only reason it cannot certify is that this filter REFUSES the property. That refusal
   lives in styleDeclarations. `<text opacity="0">` is an equally valid spelling of the same thing,
   never reached it, never refused — the load-bearing assertion had a spelling it did not cover.
   MEASURED, including the mirror the review flagged and did not run: SVG `display="none"` (0x0, not
   painted) and `visibility="hidden"` (box present, not painted) both hide; `opacity="0"` hides from
   a reader and NOT from the oracle. MathML's equivalents do NOT — `<mtext display="none">`,
   `visibility="hidden"` and `mathcolor` all still render — so this is SVG-only and the fix is
   bounded accordingly.
   AND THE POSITION TRAP, which is R6-1 waiting in a new place: presentation attributes are
   author-origin but rank BELOW the style attribute. `<text display="none" style="display:block">`
   is VISIBLE, measured. They are therefore emitted BEFORE the style attribute's declarations, so
   the last-wins rule puts style on top. Controls in both directions below. */
/* SMIL IS THE THIRD DOOR (round-9 review R9-1), and the exclusion that would have covered it said
   the wrong word: this header excluded "script-driven mutation", and SMIL IS MARKUP — it runs with
   scripting disabled. `<set attributeName="display" to="none" fill="freeze"/>` inside a `<text>` is
   not painted by Chromium and was KEPT here; the `visibility` twin the same; and the `opacity`
   variant is hidden from a reader AND from the oracle, so the twin cannot catch that one either.
   REFUSED, NOT MODELLED, deliberately: whether an animation freezes a hiding value depends on
   begin/dur/fill/repeatCount timing, and resolving that from static source is exactly the guess
   this file exists not to make. */
const SMIL_ANIMATION = new Set(["animate", "set", "animatetransform", "animatemotion",
                                "animatecolor"]);
const SVG_PRESENTATION = new Set(["display", "visibility", "opacity", "fill-opacity",
                                  "stroke-opacity", "font-size", "color", "clip-path", "mask",
                                  "filter"]);
const SVG_TEXT_CONTENT = new Set(["text"]);
const MATHML_TOKENS = new Set(["mtext", "mi", "mo", "mn", "ms"]);
export const NOT_RENDERED = new Set(["template", "noscript", "noembed",
                                     ...REPLACED_FALLBACK, ...SVG_NOT_RENDERED,
                                     ...MATHML_NOT_RENDERED]);
/* Optional end tags, and what implicitly closes each. The page uses p / li / table sectioning, so
   these are modelled; anything left open at EOF that is NOT here is a structure this filter cannot
   resolve, and it throws. */
/* THE PARSER'S OWN p-CLOSING SET, not a rendering-flavoured block list (round-5 review R5-2). This
   was a FIFTH set the filter consults and none of the four enumerated lists named it. The HTML
   tree-construction "in body" rules close an open <p> for a longer set than "things that look like
   blocks", and every miss ran in the OVER-DELETION direction — the filter removed a sibling
   Chromium paints. Executed: `<p hidden>HIDDEN<dialog open>SHOWN`, and the same with `li`, `dd`,
   `center`, all painted by Chromium and all removed here. */
const BLOCKISH = ["address", "article", "aside", "blockquote", "center", "details", "dialog", "dir",
                  "div", "dl", "dd", "dt", "fieldset", "figcaption", "figure", "footer", "form",
                  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li", "listing",
                  "main", "menu", "nav", "ol", "p", "plaintext", "pre", "search", "section",
                  "summary", "table", "ul", "xmp"];
const CLOSED_BY = {
  p: new Set(BLOCKISH),
  li: new Set(["li"]),
  dt: new Set(["dt", "dd"]),
  dd: new Set(["dt", "dd"]),
  option: new Set(["option", "optgroup"]),
  optgroup: new Set(["optgroup"]),
  rt: new Set(["rt", "rp"]),
  rp: new Set(["rt", "rp"]),
  td: new Set(["td", "th", "tr", "tbody", "tfoot", "thead", "caption", "colgroup"]),
  th: new Set(["td", "th", "tr", "tbody", "tfoot", "thead", "caption", "colgroup"]),
  tr: new Set(["tr", "tbody", "tfoot", "thead", "caption", "colgroup"]),
  thead: new Set(["tbody", "tfoot"]),
  tbody: new Set(["tbody", "tfoot"]),
  tfoot: new Set(["tbody"]),
  caption: new Set(["caption", "colgroup", "tbody", "tfoot", "thead", "tr", "td", "th"]),
  colgroup: new Set(["caption", "colgroup", "tbody", "tfoot", "thead", "tr", "td", "th"]),
};
/* `plaintext` has NO end tag at all — everything after it is text — so it must be allowed to stand
   open at EOF or the parse refuses on legal markup (round-6 review R6-2, found in the four p-closers
   I added from the spec list without executing them; `dir`, `listing` and `xmp` were right). */
const OPTIONAL_END = new Set([...Object.keys(CLOSED_BY), "html", "body", "head", "plaintext"]);

/* Could a declaration this checker DROPPED have changed the winner? A cascade winner is the last
   `!important` declaration, or — if there is none — the last declaration at all. So an unknown can
   only matter if it is important (and the winner is not, or it comes later than the winner), or if
   neither is important. When the winner is important and every unknown is not, the outcome is
   determined whatever the unknowns turn out to be, and refusing would be an outage rather than a
   safeguard. */
/* POSITION MATTERS AND WAS MISSING (round-7 addendum). This had no notion of WHERE a dropped
   declaration sat: with a normal winner, ANY unknown counted, including one appearing BEFORE the
   winner that could not possibly have won. `display:bogus;display:none` refused where the later
   normal `none` wins either way — fail-closed, so an outage rather than a certification, but an
   outage on legal markup. The cascade rule is that the winner is the last important declaration,
   or failing that the last declaration at all, so an unknown outranks the winner only if it is
   important and the winner is not, or if they are equally important and it comes LATER. */
const couldHaveChanged = (win, unknowns) => {
  if (!unknowns.length) return false;
  if (!win) return true;
  return unknowns.some((u) => (u.important !== win.important
    ? (u.important && !win.important)
    : u.index > win.index));
};
const refuse = (why) => {
  throw new Error("inert-filter: " + why + " — refusing to guess. A filter that silently removes "
    + "more (or less) of the page than a browser does can turn a visible contradiction into "
    + "agreement; see N6 (GPT Pro session 1 rounds 4 and 5, 2026-09-10).");
};

/* ---------- tokenizer ---------- */
export function tokenize(html) {
  const toks = [];
  let i = 0;
  /* A lightweight mirror of the tree builder's foreign-context walk — same helpers, so there is one
     rule and not two. It only has to answer "are we inside foreign content right now". */
  const fstack = [];
  const tokForeign = () => {
    for (let k = fstack.length - 1; k >= 0; k--) {
      if (fstack[k].integration) return false;
      if (fstack[k].foreign) return true;
    }
    return false;
  };
  const isAlpha = (c) => c !== undefined && /[A-Za-z]/.test(c);
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) { if (i < html.length) toks.push({ kind: "text", start: i, end: html.length }); break; }
    if (lt > i) toks.push({ kind: "text", start: i, end: lt });
    if (html.startsWith("<!--", lt)) {
      const e = html.indexOf("-->", lt + 4);
      if (e === -1) refuse(`an unterminated HTML comment beginning at offset ${lt}`);
      toks.push({ kind: "comment", start: lt, end: e + 3 }); i = e + 3; continue;
    }
    if (html.startsWith("<!", lt) || html.startsWith("<?", lt)) {
      const e = html.indexOf(">", lt);
      const end = e === -1 ? html.length : e + 1;
      toks.push({ kind: "decl", start: lt, end }); i = end; continue;
    }
    const isEnd = html[lt + 1] === "/";
    const nameAt = lt + (isEnd ? 2 : 1);
    if (!isAlpha(html[nameAt])) {                     // `<` that opens nothing is ordinary text
      toks.push({ kind: "text", start: lt, end: lt + 1 }); i = lt + 1; continue;
    }
    let j = nameAt;
    while (j < html.length && !/[\s/>]/.test(html[j])) j++;
    const name = html.slice(nameAt, j).toLowerCase();
    if (isEnd) {
      while (j < html.length && html[j] !== ">") j++;
      if (j >= html.length) refuse(`an unterminated end tag </${name}> at offset ${lt}`);
      for (let k = fstack.length - 1; k >= 0; k--) {
        if (fstack[k].name === name) { fstack.length = k; break; }
      }
      toks.push({ kind: "end", name, start: lt, end: j + 1 }); i = j + 1; continue;
    }
    /* ATTRIBUTES, tokenized the way the spec's states do. The unquoted-value state ends on
       whitespace or `>` and NOT on a solidus, which is round 5's `data-path=/`; and a solidus that
       is not immediately followed by `>` is a parse error the spec IGNORES, so it cannot mark a tag
       self-closing either. */
    const attrs = new Map();
    let selfClosing = false;
    for (;;) {
      while (j < html.length && /\s/.test(html[j])) j++;
      if (j >= html.length) refuse(`an unterminated <${name}> start tag at offset ${lt}`);
      if (html[j] === ">") { j++; break; }
      if (html[j] === "/") {
        if (html[j + 1] === ">") { selfClosing = true; j += 2; break; }
        j++; continue;                                 // stray solidus: a parse error, ignored
      }
      const nStart = j;
      if (html[j] === "=") j++;                        // leading `=` is part of the name, per spec
      while (j < html.length && !/[\s/>=]/.test(html[j])) j++;
      const aName = html.slice(nStart, j).toLowerCase();
      while (j < html.length && /\s/.test(html[j])) j++;
      let value = "";
      if (html[j] === "=") {
        j++;
        while (j < html.length && /\s/.test(html[j])) j++;
        const q = html[j];
        if (q === '"' || q === "'") {
          const e = html.indexOf(q, j + 1);
          if (e === -1) refuse(`an unterminated attribute value in <${name}> at offset ${lt}`);
          value = decodeAttrValue(html.slice(j + 1, e)); j = e + 1;
        } else {
          const vs = j;
          while (j < html.length && !/[\s>]/.test(html[j])) j++;
          value = decodeAttrValue(html.slice(vs, j));
        }
      }
      if (!attrs.has(aName)) attrs.set(aName, value);  // duplicate attributes are DROPPED
    }
    {
      const foreignRoot = name === "svg" || name === "math";
      const inF = foreignRoot || (!breaksOut(name, attrs) && tokForeign());
      if (!VOID.has(name) && !(selfClosing && inF)) {
        fstack.push({ name, foreign: inF, integration: inF && isIntegrationPoint(name, attrs) });
      }
    }
    toks.push({ kind: "start", name, attrs, selfClosing, start: lt, end: j });
    i = j;
    /* THERE IS NO RAW-TEXT SWITCH IN FOREIGN CONTENT (round-7 review R7-2). A browser's raw-text
       decision is driven by the tree builder, and inside `<svg>` or `<math>` markup is parsed as
       TAGS: `<svg><style></div></style></svg>` contains a real `</div>` end tag. Treating it as raw
       text swallowed that tag and left a hidden region open, deleting a card Chromium paints.
       Same cause as R7-1 — a set enlarged correctly in T4, with nobody asking where it is consulted.
       The tokenizer therefore tracks its own foreign context, using the SAME `breaksOut` and
       `isIntegrationPoint` helpers the tree builder uses, so this is not a second implementation to
       keep in step. */
    /* `<plaintext>` does not merely stay open — EVERYTHING AFTER IT IS LITERAL TEXT, to the end of
       the document, and there is no end tag. R6-2 correctly gave it an optional end tag and did not
       ask the second question this file's own rule requires: what else is now in scope. The filter
       went on parsing the rest as markup and DELETED a region Chromium paints as text — round 4's
       defect arriving through R6-2's fix. It is obsolete and cannot appear in a maintained page, so
       refusing is the smaller change and it restores what R6-2 traded away. */
    if (name === "plaintext") {
      refuse("<plaintext> makes every byte after it literal text with no end tag, and this checker "
        + "would go on parsing it as markup");
    }
    if (RAWTEXT.has(name) && !tokForeign() && !(selfClosing && VOID.has(name))) {
      /* A raw-text body runs to its matching end tag and nothing inside it is markup. The one
         script construct this filter does not model is the spec's script-data ESCAPED states, where
         a `<!--` changes which `</script>` closes the element — so a script body containing `<!--`
         is refused rather than resolved. */
      const close = new RegExp("</" + name + "(?=[\\s/>])", "i");
      const rest = html.slice(i);
      const m = close.exec(rest);
      if (!m) refuse(`an unterminated raw-text <${name}> beginning at offset ${lt}`);
      const bodyEnd = i + m.index;
      if (name === "script" && html.slice(i, bodyEnd).includes("<!--")) {
        refuse(`a <script> body at offset ${lt} contains "<!--", which changes which </script> `
          + "closes the element under the spec's script-data escaped states");
      }
      toks.push({ kind: "text", start: i, end: bodyEnd, rawtext: true });
      i = bodyEnd;
    }
  }
  return toks;
}

/* ---------- inline CSS, scoped ----------
   Only inline `style` attributes are read; the page's stylesheet is out of scope and the
   DOM-equivalence twin is what keeps that honest.

   AND ONLY TWO PROPERTIES ARE MODELLED (fallback review F1, 2026-09-10). This filter answers one
   question — can a reader see this text — and it answers it from `display`, `visibility`, the
   `hidden` attribute and the UA's own hidden elements. EVERY other way to make text unreadable was
   silently resolved as VISIBLE, and seven of them were executed through the complete guard:

       opacity:0 · content-visibility:hidden · font-size:0 · color:transparent
       clip-path:inset(100%) · position:absolute;left:-9999px · width:0;height:0;overflow:hidden

   That is N6's own failure — an invisible correct quotation satisfying a check about published
   text. The sharpest version of it: this module REFUSED `hidden="until-found"` precisely BECAUSE it
   hides through content-visibility, while accepting the CSS spelling of the same mechanism two
   properties away. Naming a hazard in a header is not refusing it.

   AND NO BROWSER SETTLES IT EITHER, which is what decided the remedy. Executed in Chromium
   (evidence/visually-hidden-oracle-probe.txt): `checkVisibility({opacityProperty:true})` catches
   ONLY opacity:0; the other six report a painted, visible box under every option Chromium offers.
   Short of comparing pixels there is nothing to compare against — which is exactly the situation
   this file already has an answer for.

   So an inline style may declare `display`, `visibility`, or a CUSTOM PROPERTY, and nothing else.
   The cost is a loud failure the day someone writes `style="margin-top:4px"` on the page, and the
   fix that day is one entry below, added by someone who has checked the property cannot hide text.
   The cost of the alternative is a silent certification. Today it costs nothing: site/index.html
   carries ZERO static inline style attributes, asserted in the guard rather than claimed here. */
const MODELLED_PROPERTIES = new Set(["display", "visibility"]);

/* THE CLOSED SET OF `display` VALUES THIS FILTER READS (fallback review F2). A browser DROPS an
   invalid declaration at parse time, so an earlier valid one wins and, if none survives, the UA
   `[hidden] { display:none }` rule applies. Taking the last token as the winner regardless of
   whether it parses is how `<div hidden style="display:bogus">` — hidden in Chromium — was read as
   visible here. Rather than guess which side of valid an unrecognised token falls on, an
   unrecognised `display` value is REFUSED: skipping it silently would fall through to `[hidden]`
   and over-delete, which is the certifying direction. */
const DISPLAY_VALUES = new Set([
  "none", "contents", "block", "inline", "inline-block", "flow-root", "list-item",
  "flex", "inline-flex", "grid", "inline-grid", "table", "inline-table",
  "table-row", "table-cell", "table-row-group", "table-header-group", "table-footer-group",
  "table-column", "table-column-group", "table-caption",
  "ruby", "ruby-base", "ruby-text", "ruby-base-container", "ruby-text-container",
  "inherit", "initial", "unset", "revert",
  /* `revert-layer` is deliberately ABSENT (round-2 review R2-2). With no author layer declared it
     rolls back PAST the author origin, so the UA `[hidden] { display:none }` rule applies and
     Chromium does not paint the element — the opposite of every other global keyword here. Leaving
     it in the set read it as "some display that is not none" and certified. Out of the set it is an
     unrecognised value, which routes it into the bounded escape below. `revert` and `inherit` stay:
     on a hidden element Chromium paints both, and the filter already agrees. */
]);
function stripCssComments(v) {
  let out = "", i = 0, q = null;
  while (i < v.length) {
    const c = v[i];
    if (q) { out += c; if (c === q && v[i - 1] !== "\\") q = null; i++; continue; }
    if (c === '"' || c === "'") { q = c; out += c; i++; continue; }
    if (c === "/" && v[i + 1] === "*") {
      const e = v.indexOf("*/", i + 2);
      if (e === -1) refuse("an unterminated CSS comment in a style attribute");
      out += " "; i = e + 2; continue;
    }
    out += c; i++;
  }
  return out;
}
/* CSS escapes: `\6e ` is the letter n, and a browser resolves it before reading the declaration.
   Resolved rather than refused — the predecessor threw here, which is a refusal on legal markup. */
function decodeCssEscapes(v) {
  return v.replace(/\\([0-9a-fA-F]{1,6})[ \t\n\r\f]?|\\(.)/gs,
    (_, hex, ch) => (hex !== undefined ? String.fromCodePoint(parseInt(hex, 16) || 0xfffd) : ch));
}
export function declarations(styleValue) {
  const src = stripCssComments(String(styleValue));
  const out = [];
  let depth = 0, q = null, start = 0;
  const push = (chunk) => {
    const colon = (() => {
      let d = 0, s = null;
      for (let k = 0; k < chunk.length; k++) {
        const c = chunk[k];
        if (s) { if (c === s && chunk[k - 1] !== "\\") s = null; continue; }
        if (c === '"' || c === "'") { s = c; continue; }
        if (c === "(") d++;
        else if (c === ")") d--;
        else if (c === ":" && d === 0) return k;
      }
      return -1;
    })();
    if (colon === -1) return;
    const rawProp = chunk.slice(0, colon).trim();
    let value = chunk.slice(colon + 1).trim();
    if (!rawProp) return;
    /* WHAT DEFEATS ROUND 5's B1 (`--memo: display:none`) IS THE COLON SPLIT ABOVE, not this line
       (fallback review F13). The split is depth- and quote-aware, so the property name of that
       declaration is `--memo` and a lookup for `display` finds nothing. The branch below only stops
       a custom property's name being case-folded — custom property names are case-SENSITIVE, so
       `--Memo` and `--memo` are different properties — and no amount of case-folding could ever
       turn either into `display`. Pinned by the `--Memo` control in the guard. */
    const prop = rawProp.startsWith("--") ? rawProp : rawProp.toLowerCase();
    let important = false;
    const bang = /!\s*important\s*$/i;
    if (bang.test(value)) { important = true; value = value.replace(bang, "").trim(); }
    out.push({ prop, value, important, index: out.length });
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === q && src[i - 1] !== "\\") q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ";" && depth === 0) { push(src.slice(start, i)); start = i + 1; }
  }
  push(src.slice(start));
  return out;
}
/* A value this filter is willing to read. Anything left that a browser would resolve and this will
   not — a variable, an attribute reference, a surviving escape or character reference — is refused
   rather than compared as text, because comparing it as text is how `display:&#110one` stayed
   visible to a reader and hidden to the checker. */
function resolveValue(prop, raw) {
  const v = decodeCssEscapes(String(raw)).trim();
  if (/\b(?:var|attr|env|calc)\s*\(/i.test(v)) {
    refuse(`a ${prop} declaration uses a function this checker does not resolve: ${JSON.stringify(v).slice(0, 80)}`);
  }
  if (v.includes("&")) {
    refuse(`a ${prop} declaration still carries an undecoded character reference: ${JSON.stringify(v).slice(0, 80)}`);
  }
  if (v.includes("\\")) {
    refuse(`a ${prop} declaration still carries an unresolved CSS escape: ${JSON.stringify(v).slice(0, 80)}`);
  }
  return v.toLowerCase();
}

/* ---------- tree ---------- */
export function parse(html) {
  const toks = tokenize(html);
  const root = { name: "#root", attrs: new Map(), children: [], start: 0, end: html.length };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  for (const t of toks) {
    if (t.kind === "text" || t.kind === "comment" || t.kind === "decl") {
      top().children.push({ ...t, node: t.kind }); continue;
    }
    if (t.kind === "start") {
      while (stack.length > 1 && CLOSED_BY[top().name] && CLOSED_BY[top().name].has(t.name)) {
        top().end = t.start; stack.pop();
      }
      const el = { node: "element", name: t.name, attrs: t.attrs, children: [],
                   start: t.start, end: t.end, contentStart: t.end };
      top().children.push(el);
      /* FOREIGN CONTENT HONOURS `/>` AT ANY DEPTH (fallback review F14). This used to test
         `t.selfClosing && (name === "svg" || name === "math")` — the ROOT only — so an ordinary
         `<svg><path d="…"/></svg>` refused with "an unterminated <path>" and took the whole gate
         down. The page carries no `<svg` today, which made it a landmine rather than a bug: the
         first inline icon anyone adds trips it. Inside SVG or MathML a trailing solidus really does
         close the element; outside it, the spec ignores it, which is round 5's A3/A4. */
      const foreignRoot = t.name === "svg" || t.name === "math";
      /* THE NEAREST ANCESTOR DECIDES, not "any ancestor" — an `<svg>` re-enters foreign content
         even inside a `<foreignObject>`, and everything under THAT inner svg is foreign again.
         Testing `stack.some(x => x.integration)` made the whole subtree HTML forever after the
         first integration point, so `<svg><foreignObject><svg><path d="M0 0"/></svg>…` refused on
         an "unterminated <path>". Found by testing the nesting case I had flagged to the reviewer
         as the one I was least confident about, rather than waiting to be told. */
      let ctxForeign = false;
      for (let k = stack.length - 1; k >= 1; k--) {
        if (stack[k].integration) { ctxForeign = false; break; }
        if (stack[k].foreign) { ctxForeign = true; break; }
      }
      const inForeign = foreignRoot || (!breaksOut(t.name, t.attrs) && ctxForeign);
      el.foreign = inForeign;
      el.svg = inForeign && (t.name === "svg" || (top().svg === true && !isIntegrationPoint(t.name, t.attrs)));
      el.integration = inForeign && isIntegrationPoint(t.name, t.attrs);
      if (VOID.has(t.name) || (t.selfClosing && inForeign)) continue;
      stack.push(el);
      continue;
    }
    /* END TAG. A stray one is ignored, as a parser does. Popping PAST an element whose end tag is
       required means the structure is not one this filter models — and guessing where that region
       ends is exactly the failure round 4 held publication over. */
    let k = -1;
    for (let s = stack.length - 1; s >= 1; s--) if (stack[s].name === t.name) { k = s; break; }
    if (k === -1) continue;
    for (let s = stack.length - 1; s > k; s--) {
      if (!OPTIONAL_END.has(stack[s].name)) {
        refuse(`</${t.name}> at offset ${t.start} would close an unterminated <${stack[s].name}> `
          + `opened at offset ${stack[s].start}`);
      }
      stack[s].end = t.start; stack.pop();
    }
    stack[k].end = t.end; stack.pop();
  }
  for (let s = stack.length - 1; s >= 1; s--) {
    if (!OPTIONAL_END.has(stack[s].name)) {
      refuse(`an unterminated <${stack[s].name}> region beginning at offset ${stack[s].start}`);
    }
    stack[s].end = html.length; stack.pop();
  }
  return root;
}

/* ---------- visibility ----------
   The style attribute is parsed ONCE per element and validated against the modelled set before any
   value is read, so an unmodelled property refuses whether or not a display declaration sits beside
   it. */
export function styleDeclarations(el) {
  /* Presentation attributes FIRST, so the style attribute's declarations outrank them under the
     last-wins rule — which is what a browser does and what was measured. Only inside SVG: MathML's
     equivalents do not hide, so reading them there would invent a rule the browser does not have. */
  const pres = [];
  if (el.svg) {
    for (const [k, v] of el.attrs) {
      if (!SVG_PRESENTATION.has(k)) continue;
      pres.push({ prop: k, value: String(v), important: false, index: pres.length });
    }
  }
  const style = el.attrs.get("style");
  if (style === undefined && !pres.length) return [];
  const decls = pres.concat(
    (style === undefined ? [] : declarations(style)).map((d, i) => ({ ...d, index: pres.length + i })));
  for (const d of decls) {
    if (d.prop.startsWith("--")) continue;               // a custom property declares no property
    if (!MODELLED_PROPERTIES.has(d.prop)) {
      refuse(`a declaration on <${el.name}> sets \`${d.prop}\`, which this checker does not `
        + "model. It resolves display and visibility only, and a property it cannot resolve may be "
        + "hiding text from a reader — opacity, colour, font-size, clipping, zero sizing and "
        + "off-screen positioning all do, and no browser visibility API reports them as hidden");
    }
  }
  return decls;
}
function elementDisplayNone(el, decls) {
  /* A BROWSER DROPS AN INVALID DECLARATION AT PARSE TIME, so the winner is the last VALID one and,
     if none survives, the UA `[hidden] { display:none }` rule applies. Round 5's B3
     (`display:noneish`, which Chromium paints) and the fallback review's F2
     (`<div hidden style="display:bogus">`, which Chromium hides) are the SAME rule seen from its two
     sides, and only computing over the valid declarations satisfies both. */
  const valid = [], unrecognised = [], unrecognisedDecls = [];
  for (const d of decls) {
    if (d.prop !== "display") continue;
    const kw = resolveValue("display", d.value);
    const parts = kw.split(/\s+/).filter(Boolean);
    /* VOCABULARY IS NOT SYNTAX (round-2 review R2-1). Testing that every token is a legal display
       keyword accepts any MULTISET of them — `display:block none`, `display:none none`,
       `display:inline block`, `display:inherit block` — each of which Chromium DROPS, so the earlier
       `display:none` or the UA `[hidden]` rule wins and the element is not painted. The filter read
       all four as "valid, and not none" and certified, and because the tokens were all legal the
       bounded escape below never fired. The two-value grammar is `<display-outside> ||
       <display-inside>`; modelling it properly is more surface than this checker wants, so ANY
       multi-token value is unrecognised — which routes it INTO the escape instead of past it.
       Single-token values are untouched, so round 5's B3 (`display:noneish`) still falls through in
       the safe direction. */
    if (parts.length === 1 && DISPLAY_VALUES.has(parts[0])) valid.push({ ...d, kw });
    else { unrecognised.push(kw); unrecognisedDecls.push(d); }
  }
  let win = null;
  for (const d of valid) { if (win && win.important && !d.important) continue; win = d; }

  /* THE UA RULES THAT RESOLVE TO display:none — the set is enumerated at UA_DISPLAY_NONE_RULES
     above, and it is consulted here, AFTER an inline display declaration, for the same reason
     `[hidden]` is: an author inline declaration beats a normal-origin UA rule.
     `popover` joined it in round 4 — `[popover]:not(:popover-open) { display:none }` is in the UA
     stylesheet and nothing in static source can open a popover, so `<div popover>` is not painted.
     It was the named case for that round's hold. */
  /* A REFUSAL OUTRANKS EVERY VERDICT, so it is tested first. Ordering matters here and I got it
     wrong once, in the very change that fixed an ordering defect: putting the NOT_RENDERED
     short-circuit above this made `<template shadowrootmode>` silently REMOVED instead of refused,
     because `template` is in NOT_RENDERED. The pin for that refusal is what caught it. */
  /* DECLARATIVE SHADOW DOM IS THE `<details>` RULING'S MIRROR, and it is refused (round-4 review
     R4-3). `<template>` is in UA_HIDDEN because a template's contents are inert — but a template
     carrying `shadowrootmode` is not a template by the time a browser is done with it: its contents
     become a SHADOW ROOT and are PAINTED. Executed on a real file:// navigation, 764x18 pixels of
     painted text that this filter deleted — the over-deletion direction, round 4's original defect.
     Refused rather than modelled, because modelling it means modelling slot assignment, and because
     the thing that would normally catch a mistake here could not see it: a TreeWalker does not enter
     shadow roots, so the DOM twin agreed with the filter and certified. The twin's oracle now
     descends into open shadow roots — without that half this refusal is untestable by the very
     thing meant to test it. */
  if (el.name === "template" && el.attrs.has("shadowrootmode")) {
    refuse("a <template> carrying `shadowrootmode` is declarative shadow DOM: its contents become a "
      + "shadow root and ARE painted, so treating it as an inert template would delete visible text");
  }

  /* `<object data=…>` IS UNDECIDABLE FROM SOURCE, and it is the first case here whose right answer
     is a REFUSAL rather than a set membership (round-7 addendum). Whether an object's fallback
     content renders depends on whether the resource LOADS — a runtime fact about a fetch, not a
     property of the markup. Measured: a bare `<object>` shows its fallback and is kept; an
     `<object data="…">` that loads does NOT show it and was kept here; one whose data 404s shows it
     again. A filter reading static source cannot resolve that in principle — not "has not yet",
     CANNOT — and the oracle calls all three painted, so it is a shared blind spot as well.
     Worth stating as a category: some of these questions are decidable from source and some are
     not, and the undecidable ones do not belong in a set at all. */
  if (el.svg && SMIL_ANIMATION.has(el.name)) {
    refuse(`<${el.name}> is a SMIL animation element: it can freeze a hiding value onto its target `
      + "from markup alone, with no script involved, and whether it does depends on begin/dur/fill "
      + "timing this checker will not resolve from static source");
  }
  if (el.name === "object" && el.attrs.has("data")) {
    refuse("an <object> carrying `data` shows its fallback content only if the resource FAILS to "
      + "load, which is a runtime fact about a fetch and not a property of the markup — no filter "
      + "reading static source can decide it");
  }
  /* CONSULTED BEFORE `win`: no inline display can beat a reason that is not a display rule. */
  if (NOT_RENDERED.has(el.name)) return true;
  const hiddenByUA = (el.attrs.has("hidden") && el.name !== "embed")
    || (el.name === "dialog" && !el.attrs.has("open"))
    || (el.name === "input" && String(el.attrs.get("type") || "").toLowerCase() === "hidden")
    /* `[popover]:not(:popover-open):not(dialog[open])` — the carve-out was missing, and it ran in
       the OVER-DELETION direction: `<dialog open popover>` is PAINTED by Chromium and was removed
       here, which is round 4's original defect appearing on the rule added in round 4. */
    || (el.attrs.has("popover") && !(el.name === "dialog" && el.attrs.has("open")))
    || UA_HIDDEN.has(el.name);
  const result = win ? win.kw === "none" : hiddenByUA;

  /* THE ONE PLACE THE SET'S COMPLETENESS COULD COST SOMETHING, refused rather than guessed. If a
     value this filter does not recognise is in fact VALID, a browser keeps it and the element is
     visible — so concluding HIDDEN off the back of having dropped it would delete visible text,
     which is the certifying direction. Concluding VISIBLE is safe either way, because `none` is in
     the set and an unrecognised value therefore cannot be `none`. */
  /* THE ESCAPE ONLY FIRES WHEN THE DROPPED VALUE COULD HAVE CHANGED THE ANSWER (round-4 review
     R4-4). It used to fire whenever ANYTHING was dropped and the answer came out hidden, which
     refused `display:none !important;display:bogus` — where the important declaration wins whatever
     `bogus` turns out to be, so the outcome is determined and this checker could simply have
     decided. That over-refusal was then copied wholesale onto the visibility path when its escape
     was built: the mirror was made and it carried the bug across with the feature. */
  if (result && couldHaveChanged(win, unrecognisedDecls)) {
    refuse(`<${el.name}> resolves to hidden only because this checker dropped a display value it `
      + `does not recognise (${JSON.stringify(unrecognised).slice(0, 80)}). If that value is `
      + "actually valid a browser keeps it and paints the element, so treating it as absent would "
      + "delete visible text");
  }
  if (win) return win.kw === "none";
  /* `[hidden]:not([hidden=until-found i]):not(embed)` — `embed` is carved out of the [hidden] rule
     by the retrieved selector. It is void, so no text was ever at stake, but the carve-out is
     implemented rather than noted because the next reader should not have to re-derive which half
     of a two-part exclusion was deliberate. */
  if (el.attrs.has("hidden") && el.name !== "embed") {
    const hv = String(el.attrs.get("hidden")).trim().toLowerCase();
    if (hv === "until-found") {
      refuse(`<${el.name}> uses hidden="until-found", which hides through content-visibility rather `
        + "than display and is not modelled here");
    }
    return true;
  }
  return hiddenByUA;
}
function elementVisibility(el, inherited, decls) {
  if (!decls.some((d) => d.prop === "visibility")) return inherited;
  /* AN UNRECOGNISED VALUE IS DROPPED BY A BROWSER, so it falls through to the previous declaration
     and then to the inherited value — the same rule `display` follows above (fallback review F2,
     F14). This used to refuse, which is the opposite error: `visibility:hidden;visibility:bogus`
     hides in Chromium and took the gate down here. */
  const read = (raw) => {
    const kw = resolveValue("visibility", raw);
    if (kw === "hidden" || kw === "collapse") return "hidden";
    if (kw === "visible" || kw === "initial") return "visible";
    /* VISIBILITY IS AN INHERITED PROPERTY, and that changes three of the five CSS-wide keywords
       (round-3 review R3-1). On an inherited property `unset` MEANS `inherit`; `revert` and
       `revert-layer` roll back past the author origin and there is no UA rule for visibility, so
       what is left is the inherited value too. All three inherit `hidden` from a hidden ancestor,
       and mapping them to "visible" kept text Chromium does not paint —
       `<div style="visibility:hidden"><span style="visibility:unset">` was the named case for the
       round-3 hold. `initial` is genuinely visible (visibility's initial value IS visible) and is
       pinned as the control. This is R2-2 mirrored onto the other property: display's revert-layer
       came out of its set and visibility's equivalents were left behind. */
    if (kw === "inherit" || kw === "unset" || kw === "revert" || kw === "revert-layer") return inherited;
    return null;                                          // invalid: a browser drops it
  };
  /* `!important` IS HONOURED HERE TOO (round-2 review R2-3). It was parsed by declarations(), and
     honoured on the display path, and simply never consulted on this one — which broke in BOTH
     directions: `visibility:hidden !important;visibility:visible` kept text Chromium does not paint
     (a certification), and `visibility:visible !important;visibility:hidden` deleted text it does
     (an over-removal). An important declaration beats every normal one; among equals the last wins. */
  const droppedDecls = [];
  let win = null;
  for (const d of decls) {
    if (d.prop !== "visibility") continue;
    const r = read(d.value);
    if (r === null) { droppedDecls.push(d); continue; }
    if (win && win.important && !d.important) continue;
    /* The index travels with the winner here TOO. The display path spreads the declaration and got
       it for free; this path built a fresh object and silently dropped it, so couldHaveChanged
       compared against undefined and stopped refusing. The pair problem once more, in the fix for
       an ordering defect — which is why the ordering pins below exist on both properties. */
    win = { important: d.important, value: r, index: d.index };
  }
  const out = win ? win.value : null;
  /* THE SAME ASYMMETRY `display` CARRIES, and it was missing here until the reviewer's
     "make them consistent" landed — on the opposite side from the one it named. Falling through an
     unrecognised value is safe only when the answer comes out VISIBLE: if the value is in fact
     valid (a vendor keyword this set does not list), a browser keeps it and paints, so concluding
     HIDDEN off the back of having dropped it deletes visible text. Executed before the fix:
     `visibility:hidden;visibility:-x-odd` removed the text where a browser honouring the second
     declaration would paint it. */
  if (couldHaveChanged(win, droppedDecls) && (out === "hidden" || (out === null && inherited === "hidden"))) {
    refuse("an element resolves to visibility:hidden only because this checker dropped a "
      + "visibility value it does not recognise; if that value is valid a browser keeps it and "
      + "paints the element, so treating it as absent would delete visible text");
  }
  return out === null ? inherited : out;
}

/* Collect the source ranges that are NOT published. A `display:none` subtree goes entirely,
   tags included, because the element is not in the rendered box tree at all. A `visibility:hidden`
   run removes only the TEXT it paints over — a descendant that restores `visibility:visible` is
   still on the reader's screen, which is round 5's N6-R5-B subtree case. */
function collect(node, inheritedVis, cuts, ftext) {
  for (const child of node.children) {
    /* COMMENT REMOVAL LIVES HERE, INSIDE THE PARSE (fallback review F3). It used to be a textual
       `/<!--[\s\S]*?-->/g` pre-pass in the guard's own call path — which is precisely the mistake
       this module's header says it exists to end, and it was executed as one: a comment INSIDE an
       attribute value (`style="display:no<!--x-->ne"`) and a comment SPANNING two script strings
       both deleted a VISIBLE contradiction before the parser ever saw them. It also silently
       disarmed this file's own `<script>`-containing-`<!--` refusal, because the pre-pass removed
       the `<!--` first.
       ROUND 5's N7-c WITNESS IS PRESERVED, which is why the pre-pass existed in the first place:
       that regression is red only because comments are removed, and deleting THIS ONE LINE makes it
       green again — the same deletable implementation, moved to where a parse can see it. */
    if (child.node === "comment") { cuts.push([child.start, child.end]); continue; }
    if (child.node === "decl") continue;
    if (child.node === "text") {
      /* `ftext` is null in ordinary HTML, and otherwise says whether this text node sits somewhere
         foreign content actually lays text out. See SVG_TEXT_CONTENT / MATHML_TOKENS above. */
      if (inheritedVis === "hidden" || ftext === false) cuts.push([child.start, child.end]);
      continue;
    }
    const decls = styleDeclarations(child);
    if (elementDisplayNone(child, decls)) { cuts.push([child.start, child.end]); continue; }
    let nextFtext = ftext;
    if (child.name === "svg") nextFtext = false;
    else if (child.name === "math") nextFtext = false;
    else if (ftext !== null && ftext !== undefined) {
      if (isIntegrationPoint(child.name, child.attrs)) nextFtext = null;      // HTML again
      else if (SVG_TEXT_CONTENT.has(child.name) || MATHML_TOKENS.has(child.name)) nextFtext = true;
      /* Once foreign text IS being laid out, descendants inherit that — <tspan> and <textPath>
         inside a <text> render, and they are not text-content elements in their own right. */
      else if (child.foreign) nextFtext = ftext === true;
      else nextFtext = null;                                                  // broke out to HTML
    }
    collect(child, elementVisibility(child, inheritedVis, decls), cuts, nextFtext);
  }
}

/* ---------- the filter ----------
   Returns the page source with every unpublished region removed. Throws when it cannot decide.  */
export function stripInert(html) {
  const root = parse(html);
  const cuts = [];
  collect(root, "visible", cuts, null);
  cuts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let out = "", at = 0;
  for (const [a, b] of cuts) {
    if (b <= at) continue;
    const s = Math.max(a, at);
    if (s > at) out += html.slice(at, s);
    at = Math.max(at, b);
  }
  return out + html.slice(at);
}

/* The reader-visible TEXT of a page, as this filter computes it. The DOM-equivalence twin compares
   this against what Chromium paints, which is the only thing that can check the claim this module
   makes about itself. */
/* KEPT AS AN EXPORT FOR THE ONE THING IT IS STILL HONEST FOR — a caller that wants the textual
   behaviour for comparison. It is NO LONGER in the guard's call path: comments are removed inside
   the parse (see `collect`). */
export const stripComments = (s) => String(s).replace(/<!--[\s\S]*?-->/g, "");
export function publishedText(html) {
  return normalizeText(stripInert(html).replace(/<[^>]*>/g, " "));
}
export function normalizeText(s) {
  return decodeAttrValue(String(s)).replace(/[\s ]+/g, " ").trim();
}
