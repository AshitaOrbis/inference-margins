/* THE DOM ORACLE — ONE definition, imported by everything that needs to ask a browser what a reader
 * can see. It is a separate module for a reason that cost two blockers to learn.
 *
 * The round-5 addendum found the shadow-root repair landed in the SWEEP and not in the TWIN, and
 * the replaced-element rule landed in the FILTER and not in the ORACLE — two halves of two pairs,
 * both in the last two commits, one of them on the very commit that added the standing instruction
 * "when a fix lands on one member of a pair, check the other before committing". I had also stated
 * twice that the shadow-root fix was in both halves. It was not, and my own verification had used a
 * hand-written reconstruction of this oracle rather than the one the twin actually runs — so it
 * proved the concept and not the deployment. Testing a copy is not testing the thing.
 *
 * A written rule that a pair must agree is weaker than not having a pair. So the oracle is defined
 * ONCE, here, and both consumers import it. There is nothing left to keep in sync.
 *
 * WHAT IT ANSWERS: which text nodes a reader can actually see, as Chromium computes it.
 *   · <details> are opened first — the guard's standing policy is that an openable disclosure is
 *     published text, because the estimate-card bodies live in one.
 *   · Shadow roots are collected and walked. A TreeWalker does not enter them, which is how
 *     declarative shadow DOM was invisible to the oracle and the filter at once.
 *   · Ancestors are walked rather than the immediate parent consulted, because a text node whose
 *     parent is `display:contents` generates no box of its own.
 *   · Replaced elements' FALLBACK content is not rendered — canvas, iframe, video, audio. The
 *     oracle called all of them painted, because the text node's parent is the host and
 *     checkVisibility(host) is true. `object` is deliberately absent: its fallback really renders.
 *
 * KNOWN BLIND SPOTS, executed rather than assumed (evidence/oracle-blindspots-probe.txt):
 *   · opacity:0 on an ancestor — reports PAINTED; a reader sees nothing. CONFIRMED BLIND. What
 *     keeps it safe is that the filter REFUSES `opacity`, which it does only because the modelled-
 *     property allowlist is exactly {display, visibility} — pinned in the guard for that reason.
 *   · generated content (::before/::after) — in neither the source nor this walk, so a reader can
 *     see text the guard could never audit. Bounded by the guard's assertion that no `content:`
 *     string on this page carries a character a reading is made of.
 *   · content-visibility:auto — NOT a blind spot. Executed twice, including against an off-screen
 *     9000px ancestor inside a clipped box: checkVisibility({contentVisibilityAuto:true}) catches
 *     it correctly. Recorded because it was claimed as one and is not.
 * The rule these produce: WHERE THE ORACLE CANNOT ANSWER, THE FILTER MUST REFUSE — otherwise "they
 * agree" means "neither can see it".
 */
import { REPLACED_FALLBACK, NOT_RENDERED } from "./inert-filter.mjs";

/* R7-4: THE SETS ARE INTERPOLATED FROM THE FILTER, not restated here. The first version of this
   module carried its own literal copy of REPLACED_FALLBACK — in the file whose header says "there
   is nothing left to keep in sync". Interpolation DELETES the pair rather than documenting it, and
   the same applies to everything else both sides need to agree about. */
const SETS = {
  replaced: JSON.stringify([...REPLACED_FALLBACK]),
  notRendered: JSON.stringify([...NOT_RENDERED]),
};

export const ORACLE_EXPRESSION = `(() => {
  for (const d of document.querySelectorAll("details")) d.open = true;
  const REPLACED_FALLBACK = new Set(${SETS.replaced});
  const NOT_RENDERED = new Set(${SETS.notRendered});
  /* OPTION IS PUBLISHED, and this oracle is made to agree with the filter in the same change that
     ruled it — because a filter and an oracle that disagree is the defect this pair has had three
     times, and the third would have been this. option.checkVisibility() returns false for every
     option in a closed select while innerText returns their text, so the browser own answers
     disagree with each other; the ruling picks the one whose failure direction is safe. Published
     means a contradictory figure parked in an unselected option is AUDITED — the gate is noisier
     and never blinder.
     NB no backticks in this comment: it lives inside a template literal, and the first version of
     it terminated the string. */
  const ALWAYS_PUBLISHED = new Set(["option", "optgroup", "select"]);
  const roots = [document.documentElement];
  for (let i = 0; i < roots.length; i++) {
    const s = document.createTreeWalker(roots[i], NodeFilter.SHOW_ELEMENT);
    for (let e = s.nextNode(); e; e = s.nextNode()) if (e.shadowRoot) roots.push(e.shadowRoot);
  }
  const out = [];
  for (const r of roots) {
    const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue; if (!t || !t.trim()) continue;
      const el = n.parentElement; if (!el) continue;
      let hidden = false, vis = null;
      /* R7-3: THE OPTION RULING WAS ENACTED ONE STEP TOO BROADLY. This check used to sit BEFORE
         every hidden test, so an option was reported painted no matter what hid it — inside a
         display:none select, inside a [hidden] div, inside a visibility:hidden select, all three
         reported PAINTED while the filter correctly removed them. That is the filter-right,
         oracle-wrong pattern a third time.
         What the failure-direction argument actually supports is narrower: THE CLOSED-DROPDOWN
         STATE DOES NOT COUNT AS HIDING. It says nothing about ordinary display:none. So the
         suppression applies only to the element's OWN checkVisibility verdict, after the display
         and visibility tests have had their say. */
      for (let a = el; a; a = a.parentElement || (a.getRootNode() instanceof ShadowRoot ? a.getRootNode().host : null)) {
        if (NOT_RENDERED.has(a.localName) || REPLACED_FALLBACK.has(a.localName)) { hidden = true; break; }
        const cs = getComputedStyle(a);
        if (cs.display === "none" || cs.contentVisibility === "hidden") { hidden = true; break; }
        /* The option exemption suppresses ONE thing: this element own checkVisibility verdict,
           which is false for every option in a closed dropdown. It does not survive into the final
           decision, so display:none and visibility:hidden still hide an option exactly as they hide
           anything else. My first cut let the flag override the whole loop, which reported an
           option painted inside a display:none select — the filter-right, oracle-wrong pattern for
           a third time, in the fix for the second one. */
        const exempt = ALWAYS_PUBLISHED.has(a.localName);
        if (!exempt && vis === null && cs.display !== "contents"
            && !a.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })) { hidden = true; break; }
        if (vis === null) vis = cs.visibility;
      }
      if (hidden || (vis !== null && vis !== "visible")) continue;
      out.push(t);
    }
  }
  return out.join(" ");
})()`;

/* ===== DOOR 4, ASKED OF THE BROWSER INSTEAD OF PARSED OUT OF A SELECTOR (round-10 review R10-1).
 *
 * The filter reads no stylesheet and says so. The guard's default-gate companion to that admission
 * used to be a TEXT scan: pull the hiding rules out of the page's CSS, test each selector against a
 * regex of estimate-card class names, and assert none matches. The reviewer executed four bypasses
 * against it, and none of them is adversarial —
 *
 *     .est\-card { display:none }                        a CSS-escaped hyphen; legal, matches
 *     article { display:none }                           the cards ARE <article> elements
 *     div:has(> article) > article { display:none }      a structural selector
 *     @media screen { .est-card .est-median{display:none} }   which is what responsive CSS looks like
 *
 * — all four hid the audited card and all four passed the scan. The last one is the worst: the
 * naive rule split attributes the declaration to the selector `@media screen`, so the completeness
 * counter still balances. A selector scan at text level cannot be made sound, and this one failed
 * OPEN, which is the one direction nothing else in this work is allowed to fail.
 *
 * So stop parsing selectors. The twin already has the page in a browser; ASK IT. Every element that
 * the face-vs-registry guard audits must have a box and must be visible, as Chromium computes it —
 * no CSS engine of our own, no mechanism list, and nothing a selector's spelling can dodge.
 * The four bypasses above all red here, and the negative control in the twin proves it can. */
/* ROUND 11 MADE THIS GEOMETRIC, and that is the difference between a check and another list.
 * The first cut asked `checkVisibility()` plus a non-zero box. The reviewer executed
 * `position: absolute; left: -9999px` — on a LISTED element and on the unlisted face sentence —
 * and BOTH halves of the door-4 pair stayed green, because an off-screen element has
 * checkVisibility true and a full-size box (measured: the face sentence at rect
 * [-9999, 6051, 1124, 22]). The tripwire could not see it either: `position`/`left` are not
 * hiding MECHANISMS, so the rule never joins the hiding set and the hash does not move.
 *
 * Asking the browser was right. Asking it `checkVisibility()` was asking the ORACLE's question,
 * and round 1 already established that is not the reader's question — `opacity:0` was that
 * lesson's first counterexample and is why MODELLED_PROPERTIES is load-bearing in the filter.
 *
 * So the predicate is GEOMETRY, which has no spellings to enumerate: the box must intersect the
 * document's scrollable area. Two comparisons close off-screen positioning, `text-indent:-9999px`,
 * `clip: rect(0,0,0,0)`, `clip-path: inset(50%)` and the whole sr-only / visually-hidden family at
 * once — none of which any list here covered. Executed against the real page before it was pinned:
 * zero false positives, and the twin runs each of those as a negative control.
 *
 * ITS OWN LIMIT, stated: the scroll origin is the left edge in LTR, so content at -9999px is
 * unreachable at any viewport (measured at 1280x900 and 420x800; `scrollTo(-99999,0)` leaves
 * scrollX at 0). In an RTL document the origin is on the other side and the sign would have to
 * follow it. This page is lang="en" and the twin runs it on this page. */
export const CARD_PAINT_EXPRESSION = `(() => {
  for (const d of document.querySelectorAll("details")) d.open = true;
  /* .est-card p strong is the FACE SENTENCE — the guard's most important read, carrying the
     companion figure whose corruption is the N1 defect this whole gate exists for. It has no class
     of its own, so every class-based selector missed it (round-11 Q1). A class would say what it
     means; that is a served-byte change and is noted rather than smuggled into a test commit. */
  const SEL = ".est-card, .est-who, .est-median, .est-range, .est-basis, .load-op, .est-pair,"
    + " #estimates, .est-card p strong";
  const els = Array.from(document.querySelectorAll(SEL));
  const doc = document.documentElement;
  const dark = [];
  /* THREE QUESTIONS, THREE PREDICATES (round-12 review R12-1), and they are not one question asked
     three ways:
       is it RENDERED   -> checkVisibility(), which is the ORACLE's question
       is it REACHABLE  -> geometry: does the box intersect the scrollable document (round 11)
       is it IN FRONT   -> hit-testing: does a point inside the box actually land on it (round 12)
     The third exists because an opaque ::after overlay laid across the cards defeated every other
     instrument here AT ONCE: the boxes stay, the document contains them, checkVisibility is true,
     the oracle paints the text and the filter keeps it — and a clipped screenshot of the central
     tile came back 230 bytes for a 341x46 region, which is one flat colour. checkVisibility
     explicitly does not hit-test, so no amount of asking it harder reaches this. Occlusion is not a
     mechanism to add to a list; it is a different question.
     elementFromPoint is VIEWPORT-relative, so each element is scrolled into view first — a probe
     that skips that returns null for everything and reports the whole page occluded.
     FIVE POINTS, NOT ONE: a single centre sample false-positives on anything legitimately overlapped
     at its exact middle, so an element counts as covered only when EVERY sampled point misses it. */
  const hitsSelf = (el) => {
    /* getClientRects(), NOT getBoundingClientRect(), and this is the second defect the controls
       found in this predicate. A wrapped INLINE element's bounding box is the UNION of its line
       boxes, so its corners sit in empty space past the end of a short last line — sampling there
       hits the parent block and the element reports as covered. Measured on the live page: the face
       sentence (a two-line 733x35 union) and the Load link both false-positived on the bounding-box
       version. getClientRects returns the line boxes THEMSELVES, so every sample is on real
       rendered content. Blocks are unaffected: one rect, same points as before. */
    const rects = Array.from(el.getClientRects()).filter((b) => b.width > 0 && b.height > 0);
    if (!rects.length) return true;
    const pts = [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
    for (const b of rects) for (const pt of pts) {
      const x = b.left + b.width * pt[0], y = b.top + b.height * pt[1];
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
      const top = document.elementFromPoint(x, y);
      /* THE ANCESTOR CLAUSE IS DELIBERATELY ABSENT, and leaving it in was how the first cut of this
         failed its own overlay control. The obvious predicate is
         top === el || el.contains(top) || top.contains(el) — but an ancestor being TOPMOST at a
         point inside a descendant's box is precisely what an overlay looks like: .est-pair::after
         with inset:0 hit-tests as .est-pair, which CONTAINS every card, so the ancestor clause
         reported every occluded card as visible. Self or a descendant is a hit; anything else,
         ancestor included, is something in front. */
      if (top && (top === el || el.contains(top))) return true;
    }
    return false;
  };
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const vis = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true });
    /* DOCUMENT COORDINATES, NOT VIEWPORT ONES — and this line is a defect found by its own control.
       getBoundingClientRect is VIEWPORT-relative; doc.scrollWidth/scrollHeight are DOCUMENT
       dimensions. Round 11 compared them directly and passed, because nothing had ever scrolled the
       page and at scrollY 0 the two frames coincide. Round 12's hit-test added scrollIntoView, the
       page started moving between elements, and the very next run reported NINE audited elements
       "outside the scrollable document" with tops like -275 — every one of them simply scrolled
       above the viewport. A predicate that is only correct while the page never moves is not a
       predicate; adding the offsets makes the frames agree at any scroll position. */
    const dx = window.scrollX || window.pageXOffset || 0, dy = window.scrollY || window.pageYOffset || 0;
    const L = r.left + dx, T = r.top + dy, R = r.right + dx, B = r.bottom + dy;
    const offDoc = R <= 0 || B <= 0 || L >= doc.scrollWidth || T >= doc.scrollHeight;
    let covered = false;
    if (vis && r.width > 0 && r.height > 0 && !offDoc) {
      try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (e) { /* older engines */ }
      covered = !hitsSelf(el);
    }
    if (!vis || r.width === 0 || r.height === 0 || offDoc || covered) {
      dark.push((el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")
        + (el.className ? "." + String(el.className).split(/\\s+/).join(".") : "")).slice(0, 70)
        + " [doc " + Math.round(L) + "," + Math.round(T) + " " + Math.round(r.width) + "x" + Math.round(r.height)
        + (vis ? "" : ", checkVisibility=false") + (offDoc ? ", outside the scrollable document" : "")
        + (covered ? ", covered by something in front of it" : "") + "]");
    }
  }
  return JSON.stringify({ total: els.length, dark: dark });
})()`;

/* ===== THE LAST QUESTION: IS ANYTHING RENDERED HERE (round-13 review R13-1).
 *
 * The DOM-question tower ends here, and it ends because each question turned out to have a CSS
 * property built to divorce it from what a reader sees:
 *
 *     is it rendered     checkVisibility()   defeated by opacity:0, and by off-screen positioning
 *     is it reachable    geometry            defeated by occlusion
 *     is it in front     hit-testing         defeated by `pointer-events: none`
 *     is anything here   PIXELS              nothing, by construction
 *
 * The third fell to one declaration. An overlay with `pointer-events: none` renders opaquely and is
 * ignored by hit-testing — that is the property's entire purpose — and it is the single most common
 * companion for a decorative overlay, which this stylesheet already has one of. Measured: the
 * covered tile clips to 230 bytes for a 341x46 region, one flat colour, against a 3,381-byte
 * baseline, and every instrument above it stayed green.
 *
 * Pixels have no such escape, because they are the thing a reader actually receives. This exports
 * the document-coordinate rectangles of the TEXT-BEARING audited elements; the twin clips a
 * screenshot to each and asserts the result is not a flat block. Containers are deliberately out:
 * a large mostly-background box has a low information density honestly, and the figures a reader
 * must be able to read are the leaves.
 *
 * WHAT IT DOES NOT CLAIM: that the text says the right thing — that is the guard's job, and this is
 * only about whether anything is painted. The assertion is a FLOOR on information content rather
 * than an image comparison, because PNG bytes move with font rendering and an exact-match pin would
 * be a flake generator. */
export const CARD_RECT_EXPRESSION = `(() => {
  for (const d of document.querySelectorAll("details")) d.open = true;
  const LEAVES = ".est-who, .est-median, .est-range, .est-basis, .load-op, .est-card p strong";
  const dx = window.scrollX || window.pageXOffset || 0, dy = window.scrollY || window.pageYOffset || 0;
  const out = [];
  /* RANGE RECTS, NOT ELEMENT BOXES, and the first cut got this wrong in a way worth recording.
     Clipping the ELEMENT box measures where the box is, not where the ink is: .est-who is a
     749x18 full-width block carrying about forty pixels of text, so twelve of forty-four leaves
     came back below the flat-block floor HONESTLY — mostly empty boxes, nothing covering them.
     A Range over the element's contents returns the TEXT's own rectangles, one per line, tight to
     the inline extent. That is the region a reader is looking at, so it is the region to ask about. */
  for (const el of document.querySelectorAll(LEAVES)) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const id = (el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(/\\s+/).join(".") : "")).slice(0, 40);
    /* A LEAF THAT HAS TEXT BUT PRODUCES NO INK IS THE DEFECT, NOT AN ABSENCE — and reporting it as
       an absence is how it escaped. Round 15 left letter-spacing collapse unrun; executed, it
       collapses the Range rects to NOTHING, so a collector that simply emits fewer rects dropped
       the element out of the measurement entirely and nothing could fail on it. Same shape as the
       sub-8px filter that hid its own evidence one round earlier: a check cannot detect a case its
       collector discards. So an element with non-whitespace text and zero usable rects emits an
       explicit zero record, which fails both floors. Guarded on textContent so a legitimately empty
       leaf is still an absence rather than a defect. */
    const rectsOf = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (rectsOf.length === 0 && String(el.textContent || "").trim().length > 0) {
      out.push({ id: id, x: 0, y: 0, w: 0, h: 0, noInk: true, text: String(el.textContent).trim().slice(0, 24) });
      continue;
    }
    for (const r of Array.from(range.getClientRects())) {
      /* ONLY DEGENERATE RECTS ARE DROPPED, and the threshold moved here for a reason worth keeping.
         It used to be < 8px, which excluded exactly the evidence the ink-floor assertion needs:
         under font-size:1px the audited figure's rect is 3x1, so a "skip anything under 8" filter
         removed it from the measurement and the check reported nothing wrong. A filter that
         discards the small cases cannot be the instrument that detects small cases. */
      if (r.width <= 0 || r.height <= 0) continue;
      out.push({ id: id, x: r.left + dx, y: r.top + dy, w: r.width, h: r.height });
    }
    range.detach && range.detach();
  }
  return JSON.stringify(out);
})()`;
