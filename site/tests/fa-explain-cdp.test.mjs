// b9 M6 — the §20 R-1..R-4 explain surface over CDP (memo research/b9-m6-fa-memo.md §10.4, D-6x).
// WHY THIS FILE EXISTS: tests/run-app-tests.sh drives headless Chrome with --dump-dom and greps the
// result. It cannot click a trigger, read getComputedStyle(dialog, "::backdrop"), measure a touch
// target, check focus, or emulate a coarse pointer — so B-1..B-6 were unrunnable as written. The
// gap was the HARNESS, not the design (an opaque ::backdrop is perfectly achievable in CSS; the
// existing .cf-dialog precedent is deliberately translucent). The dump-DOM suite keeps the
// assertions it CAN make (presence, collapsed-by-default, class application); this suite takes the
// interaction ones. Registered in BOTH browser scripts — the pre-existing test:served-browser gap
// that omits custom-fleets-cdp is NOT inherited here and is NOT widened either.
// Run: node site/tests/fa-explain-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
const CHROME = findChrome();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find(x => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

/* ---- B-1..B-4, B-6, B-7b: the FINE-pointer probe (one page load) ---- */
const PROBE_FINE = `(async () => {
  const r = {};
  const q = s => document.querySelector(s);
  const cs = (el, pseudo) => getComputedStyle(el, pseudo || null);
  const opaque = (c) => { const m = String(c).match(/rgba?\\(([^)]+)\\)/); if (!m) return false;
    const p = m[1].split(',').map(x => parseFloat(x)); return p.length < 4 || p[3] >= 0.999; };

  // ---- B-1: the trigger is present and HYPERLINK-STYLED, asserted on COMPUTED style
  //      (underline + pointer + the page's own link colour), never by class-name presence.
  const trig = q('#fa-deeper-trigger');
  r.triggerPresent = !!trig;
  const ts = cs(trig);
  const linkProbe = document.createElement('a');
  linkProbe.href = '#'; linkProbe.style.display = 'none'; document.body.appendChild(linkProbe);
  const linkColor = cs(linkProbe).color; linkProbe.remove();
  r.triggerUnderlined = ts.textDecorationLine.includes('underline');
  r.triggerPointer = ts.cursor === 'pointer';
  r.triggerLinkColor = ts.color === linkColor;
  r.triggerColorDetail = ts.color + ' vs link ' + linkColor;

  // ---- B-6 (desktop half): the <details> collapse still EXISTS and is collapsed at first paint,
  //      and its expanded body computes to the .explain-body type scale.
  const det = q('details.fa-higher-entry');
  r.detailsExists = !!det;
  r.detailsCollapsed = !!det && det.open === false;
  det.open = true;
  const body = det.querySelector('.explain-body');
  const bs = cs(body);
  r.bodyFontPx = parseFloat(bs.fontSize);
  r.bodyLineHeight = bs.lineHeight;
  r.bodyIsInk2 = bs.color === cs(document.documentElement).getPropertyValue('--ink-2').trim()
    || bs.color.length > 0;   // resolved colour compared below via the token probe
  const inkProbe = document.createElement('div');
  inkProbe.style.color = 'var(--ink-2)'; inkProbe.style.display = 'none'; document.body.appendChild(inkProbe);
  r.bodyInk2Match = cs(inkProbe).color === bs.color; inkProbe.remove();
  r.bodySegmented = body.querySelectorAll('p').length === 5
    && body.querySelectorAll('.explain-seg-label').length === 4;
  det.open = false;

  // ---- B-7b: the exec summary is collapsed at first paint and its ORDERING-BASIS line becomes
  //      VISIBLE when opened (a state change --dump-dom cannot reach).
  const exec = q('#fa-exec-details');
  r.execExists = !!exec;
  r.execCollapsed = exec.open === false;
  const basis = q('#fa-exec-ordering-basis');
  // Chrome >=128 keeps <details> content in the box tree via content-visibility rather than
  // display:none, so getClientRects() alone is not a visibility oracle here. checkVisibility()
  // accounts for content-visibility and is the correct predicate.
  r.basisHiddenClosed = typeof basis.checkVisibility === 'function'
    ? basis.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true, opacityProperty: true }) === false
    : (basis.offsetParent === null && basis.getClientRects().length === 0);
  exec.open = true;
  r.basisVisibleOpen = basis.getClientRects().length > 0 && /Ordering basis/.test(basis.textContent);
  r.execRowCount = document.querySelectorAll('#fa-exec-rows .fa-exec-row').length;
  /* b9 spec-decode LEVER: the affordance FLIPPED. The M6 contract was always no-control now, jump
     when the lever lands, with no new mechanism — so this probe follows the contract to its other
     side rather than being deleted. It now asserts the flipped state AND that the flip target is
     the real control, which is what makes the affordance useful rather than decorative.
     (No backticks in this comment: it lives inside a template literal.) */
  r.specDecJumpRendered = !!q('#fa-exec-rows [data-low-evidence-state="jump"]');
  r.specDecJumpTargetsControl = !![...document.querySelectorAll('#fa-exec-rows button.low-evidence-jump')]
    .find(b => b.dataset.jumpTo === 'specDec')
    && !!q('[data-param-key="specDec"]');
  r.jumpRendered = !!q('#fa-exec-rows [data-low-evidence-state="jump"]');

  // ---- the A-3 jump affordance actually JUMPS: focus lands on the named control.
  const jumpBtn = q('#fa-exec-rows [data-low-evidence-state="jump"] .low-evidence-jump');
  r.jumpTargetKey = jumpBtn ? jumpBtn.dataset.jumpTo : null;
  const targetRow = jumpBtn ? document.querySelector('[data-param-key="' + jumpBtn.dataset.jumpTo + '"]') : null;
  r.jumpTargetExists = !!targetRow;
  if (jumpBtn && targetRow) {
    r.jumpFocusable = [...targetRow.querySelectorAll('input, select, button')]
      .map(el => el.tagName + (el.disabled ? ':disabled' : '')).join(',');
    jumpBtn.click(); await new Promise(res => setTimeout(res, 80));
    r.activeTag = document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : 'none';
    r.jumpFocused = targetRow.contains(document.activeElement);
    r.jumpOpenedSection = (() => { for (let x = targetRow.parentElement; x; x = x.parentElement)
      if (x.tagName === 'DETAILS' && !x.open) return false; return true; })();
  }

  // ---- B-2/B-3/B-4: open the popup and measure it. Settle first: the A-3 jump above scrolled the
  //      page, and measuring scroll restoration against a still-settling position would be a
  //      harness race rather than a product property.
  await new Promise(res => setTimeout(res, 120));
  // The page sets scroll-behavior: smooth, which animates scrollTo — an unsettled read here would
  // be a harness race, not a product property. Set it instantly and read what actually landed.
  window.scrollTo({ top: 400, behavior: 'instant' });
  await new Promise(res => setTimeout(res, 120));
  const pageScrollBefore = window.scrollY;
  trig.click();
  await new Promise(res => setTimeout(res, 60));
  const dlg = q('dialog[data-fa-explain]');
  r.dialogOpen = !!dlg && dlg.open === true;
  r.dialogId = dlg ? dlg.id : null;
  const ds = cs(dlg);
  const rect = dlg.getBoundingClientRect();
  r.dlgWidthPctVw = (rect.width / window.innerWidth) * 100;
  r.dlgHeightPctVh = (rect.height / window.innerHeight) * 100;
  // B-2: the backdrop is OPAQUE — this is R-2's "not the sort of grayed-out background", made
  // testable. The existing .cf-dialog::backdrop is rgba(0,0,0,0.45) and would FAIL this.
  const bd = cs(dlg, '::backdrop');
  r.backdropColor = bd.backgroundColor;
  r.backdropOpaque = opaque(bd.backgroundColor);
  r.dialogSurfaceOpaque = opaque(ds.backgroundColor);
  // the negative control: the M4 dialog's dim would NOT pass the same predicate
  r.opaquePredicateRejectsDim = opaque('rgba(0, 0, 0, 0.45)') === false;
  // B-3: the X sits TOP-RIGHT and is >= 44x44 CSS px; Esc closes; focus returns to the trigger.
  const x = q('#fa-explain-close');
  const xr = x.getBoundingClientRect();
  r.closeSize = [xr.width, xr.height];
  r.closeBigEnough = xr.width >= 44 && xr.height >= 44;
  r.closeTopRight = (xr.left - rect.left) > rect.width / 2 && (xr.top - rect.top) < rect.height / 2;
  r.closeLabelled = x.getAttribute('aria-label') === 'Close';
  r.focusInDialog = dlg.contains(document.activeElement);
  // B-4: the body scrolls INTERNALLY and page scroll is locked while open.
  const dbody = q('#fa-explain-body');
  r.bodyScrolls = cs(dbody).overflowY === 'auto';
  r.bodyScrollable = dbody.scrollHeight > dbody.clientHeight;
  r.pageScrollLocked = cs(document.body).overflow === 'hidden';
  // the two-node vocabulary inventory: the popup carries its OWN must-not-be-called node
  r.dlgDisclaimerNode = !!q('#fa-must-not-be-called-dlg');
  r.disclaimersMatch = r.dlgDisclaimerNode
    && q('#fa-must-not-be-called-dlg').textContent === q('#fa-must-not-be-called').textContent;
  // ---- the RENDERED-DOM vocabulary sweep (memo §2.7 (ii)): remove EXACTLY the two inventoried
  //      nodes from a clone of the union (#final-answer + the open dialog) and require zero hits.
  {
    const FORBIDDEN = [/\\brange\\b/i, /\\binterval\\b/i, /±/, /\\bconfidence\\b/i, /\\buncertaint/i, /\\bstd\\.? ?dev/i, /\\bC\\.?I\\.?\\b/];
    /* The inventory is a typed set of exactly TWO NODE IDENTITIES. Removing every node that MATCHES
       either id is not the same thing: a third node reusing one of those ids would be scrubbed too
       and would escape the sweep (gate round 2 P0-5). So CARDINALITY is asserted first — exactly one
       node per allowed id across the swept union — and only the first match of each is removed. */
    const CARD = (sel) => document.querySelectorAll(sel).length;
    r.inventoryCardinality = [CARD('#fa-must-not-be-called'), CARD('#fa-must-not-be-called-dlg')];
    const scrubWith = (rootSel, ids) => { const c = q(rootSel).cloneNode(true);
      for (const id of ids) { const first = c.querySelector('#' + id); if (first) first.remove(); }
      return c.textContent; };
    const IDS = ['fa-must-not-be-called', 'fa-must-not-be-called-dlg'];
    const text = scrubWith('#final-answer', IDS) + ' ' + scrubWith('dialog[data-fa-explain]', IDS);
    r.domVocabHits = FORBIDDEN.filter(re => re.test(text)).map(String);
    const sentence = q('#fa-must-not-be-called').textContent;
    // (a) a third node under a DIFFERENT id is caught
    const rogue = document.createElement('div'); rogue.id = 'rogue-disclaimer';
    rogue.textContent = sentence; q('#final-answer').appendChild(rogue);
    r.rogueCaught = FORBIDDEN.some(re => re.test(scrubWith('#final-answer', IDS)));
    rogue.remove();
    // (b) a third node REUSING an inventoried id is caught too — by cardinality AND by the sweep
    const dupe = document.createElement('div'); dupe.id = 'fa-must-not-be-called';
    dupe.textContent = sentence; q('#final-answer').appendChild(dupe);
    r.dupeCardinalityCaught = CARD('#fa-must-not-be-called') !== 1;
    r.dupeSweepCaught = FORBIDDEN.some(re => re.test(scrubWith('#final-answer', IDS)));
    dupe.remove();
  }
  // Esc closes, focus returns, page scroll restored
  dlg.dispatchEvent(new Event('cancel', { cancelable: true }));
  await new Promise(res => setTimeout(res, 60));
  r.closedByEsc = !q('dialog[data-fa-explain][open]');
  r.focusReturned = document.activeElement === trig;
  r.pageScrollUnlocked = cs(document.body).overflow !== 'hidden';
  r.pageScrollRestored = Math.abs(window.scrollY - pageScrollBefore) < 5;
  // The three triggers differ only in id/title/payload. NOT "reuse one element": each open builds a
  // fresh <dialog> and each close removes it (site/app.js faExplainShell). The guarantee is AT MOST
  // ONE at a time, which is what the assertions below actually test.
  const ids = [];
  for (const t of document.querySelectorAll('[data-fa-explain]')) {
    t.click(); await new Promise(res => setTimeout(res, 40));
    const d = q('dialog[data-fa-explain]');
    ids.push(d.id + '|' + d.querySelector('.fa-explain-title').textContent);
    d.querySelector('#fa-explain-close').click(); await new Promise(res => setTimeout(res, 40));
  }
  r.triggerMap = ids;
  r.oneDialogAtATime = document.querySelectorAll('dialog[data-fa-explain]').length === 0;
  // AT-MOST-ONE is the real guarantee, and "zero remain after closing" does not test it: three
  // separately created-and-destroyed elements satisfy that equally. Open all three WITHOUT closing
  // any, and require the document to still hold exactly one.
  for (const t of document.querySelectorAll('[data-fa-explain]')) {
    t.click(); await new Promise(res => setTimeout(res, 40));
  }
  r.atMostOneWhileOpening = document.querySelectorAll('dialog[data-fa-explain]').length;
  r.lastOpenId = (q('dialog[data-fa-explain]') || {}).id || null;
  const leftover = q('dialog[data-fa-explain]');
  if (leftover) { leftover.querySelector('#fa-explain-close').click(); await new Promise(res => setTimeout(res, 40)); }
  return JSON.stringify(r);
})()`;

/* ---- B-5: coarse-pointer route EXCLUSIVITY (device emulation) ---- */
const PROBE_COARSE = `(() => {
  const r = {};
  r.coarseDetected = window.matchMedia('(pointer: coarse)').matches;
  r.inlineDetailsAbsent = document.querySelectorAll('details.fa-higher-entry').length === 0;
  r.flatEntriesRendered = document.querySelectorAll('.fa-higher-entry-flat').length > 0;
  r.triggerStillPresent = !!document.querySelector('#fa-higher-trigger');
  return JSON.stringify(r);
})()`;


/* =====================================================================================
   T5 rec 5 — THE AUTHORITATIVE CONTAINMENT + WORDING CHECK, IN A REAL BROWSER.

   Adversarial review (Opus, 2026-08-27) closed a five-round argument. The static guard in
   tests/fa-m6-b9.test.mjs decides "is this node inside <section id='final-answer'>" with a
   hand-rolled regex scanner, and SIX consecutive rounds each found an input where it disagreed
   with a real HTML parser — single-quoted ids, an uppercase attribute name, `&#45;`, `&#45`
   without its semicolon, `</section>` inside `<script>`, and finally a well-formed `</body>`
   (which per WHATWG does NOT pop the stack) and SVG `<title>` (raw-text-ness is context
   dependent, and a context-free blanker cannot know that). The reviewer's conclusion, which I
   accept: the class is not closed and cannot be closed that way.

   It also found the companion defect. The wording pinned inside the answer was derived from a
   REGEX over one assignment shape in app.js — `$("id").textContent = fa.tokens.X` — which sees
   20 nodes. A real parser reports 34 element ids inside the answer. The six it cannot see include
   `fa-subject`, `fa-differs` and the `fa-exec-rows` loop, all of which put reader-visible text
   inside THE ANSWER; the reviewer pushed the guard's own negative fixture through two of them
   without moving the digest.

   Both defects are the same mistake — deciding a DOM question without a DOM — so both are
   answered here, where the browser IS the oracle. `Element.contains()` is not a heuristic, and
   `innerText` is what a reader actually reads, whatever render path produced it.
   ===================================================================================== */
const ANSWER_SURFACE_PROBE = `(() => {
  const answer = document.querySelector('#final-answer');
  if (!answer) return JSON.stringify({ error: 'no #final-answer' });
  /* every id the browser places inside the answer — render path irrelevant */
  const inside = [...answer.querySelectorAll('[id]')].map(n => n.id).sort();
  const mp = document.querySelector('#fa-most-plausible');
  const ah = document.querySelector('#fa-analyst-hypothesis');
  /* the text a reader receives from the answer, numbers normalised so an engine change that
     moves a published value does not fire this pin — that class is the published-digit guard's */
  /* WHAT A READER RECEIVES IS NOT textContent.

     Adversarial review, round 2: a textContent digest is blind to every carrier that renders or
     is announced but is not a text node. It demonstrated the guard staying GREEN while a ranking
     sentence was inserted through CSS ::after content, img alt, aria-label, input value, an
     open shadow root and an iframe srcdoc — six escapes, all of them things a browser shows or
     a screen reader reads.

     So the surface is collected the way it is consumed: text nodes, the attributes that surface
     as text, generated content from both pseudo-elements, shadow roots and same-document iframes.
     textContent (not innerText) is still the base, because most of the answer sits inside
     collapsed <details> that a reader reaches by expanding. */
  const parts = [];
  const ATTRS = ['alt', 'title', 'aria-label', 'aria-description', 'placeholder', 'value', 'aria-valuetext'];
  const collect = (root) => {
    parts.push(root.textContent || '');
    /* H1: querySelectorAll('*') does NOT return root, so six carriers were closed on every
       descendant and left open on the one element guaranteed to exist — the answer section
       itself. Its attributes and its ::before/::after were unread. */
    const all = root.nodeType === 1 ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
    for (const el of all) {
      for (const a of ATTRS) {
        const v = el.getAttribute && el.getAttribute(a);
        if (v) parts.push(a + '=' + v);
      }
      for (const pseudo of ['::before', '::after']) {
        let c = '';
        try { c = getComputedStyle(el, pseudo).content || ''; } catch (e) { c = ''; }
        if (c && c !== 'none' && c !== 'normal') parts.push(pseudo + c);
      }
      if (el.shadowRoot) collect(el.shadowRoot);
      if (el.tagName === 'IFRAME') {
        const sd = el.getAttribute('srcdoc');
        if (sd) parts.push('srcdoc=' + sd);
        try { if (el.contentDocument && el.contentDocument.body) parts.push(el.contentDocument.body.textContent || ''); } catch (e) {}
      }
    }
  };
  collect(answer);
  const surface = parts.join(' ').replace(/\\s+/g, ' ').trim();
  /* TWO digests. The wording pin normalises digits out, so an engine change that moves a
     published value does not fire it. But review pointed out that leaves 51 -> 81 INSIDE the
     answer unguarded, so the digits are pinned separately. That one is EXPECTED to fire whenever
     a published answer figure moves — which is exactly when someone should re-derive it. */
  const text = surface.replace(/[0-9][0-9.,]*/g, '#');
  const digitsOnly = (surface.match(/[0-9][0-9.,]*/g) || []).join(',');
  return JSON.stringify({
    inside,
    insideCount: inside.length,
    mostPlausibleInsideAnswer: !!(mp && answer.contains(mp)),
    analystSectionInsideAnswer: !!(ah && answer.contains(ah)),
    mostPlausibleInAnalystSection: !!(mp && ah && ah.contains(mp)),
    textLen: text.length,
    text,
    digitsOnly,
  });
})()`;

/* The RANKING check, run over what the browser actually renders. The static guard's needle list
   was defeated by ordinary English in round 7; this is the same heuristic kept only as a signal.
   The binding control is the wording pin below — anything new inside the answer fails it. */
/* Both pins are minted from the browser's own reading (see the note above). Re-minting either is
   an APPROVAL: it means someone read the new text or the new node and judged it not a ranking of
   an external claim. Do not re-mint to make a red test green. */
const ANSWER_IDS_PIN = [
    "fa-annex-link",
    "fa-band-line",
    "fa-basis-declaration",
    "fa-bridge",
    "fa-c2-label",
    "fa-convergence",
    "fa-decomposition",
    "fa-deeper-trigger",
    "fa-differs",
    "fa-exclusion",
    "fa-exec-details",
    "fa-exec-frame",
    "fa-exec-ordering-basis",
    "fa-exec-rows",
    "fa-exec-summary",
    "fa-exec-trigger",
    "fa-full",
    "fa-higher",
    "fa-higher-entries",
    "fa-higher-header",
    "fa-higher-trigger",
    "fa-identity",
    "fa-invitation",
    "fa-landing-reading",
    "fa-lens-span",
    "fa-must-not-be-called",
    "fa-planning-line",
    "fa-planning-point",
    "fa-prior-reading",
    "fa-reference-reading",
    "fa-subject",
    "fa-subject-short",
    "fa-traffic-span"
  ];
/* RE-MINTED 2026-09-10 (im-release-edit-r3), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
   BOTH pins moved, and they moved for different reasons — which is the whole point of pinning them
   separately, so it is worth saying that the split did its job here.

   THE DIGITS moved because the ruling moved the published figures. Re-derived against the engine
   before re-pinning, as this assertion's own failure message demands: E.finalAnswer() reports
   planningPoint 57.88 (the reference, rendered ≈58), priorReading 68.00 (the calculator's own
   default state) and landingReading 82.42, and those are the values the rendered answer carries.

   THE WORDING moved because the §C2 disclosure is now DERIVED rather than asserted. The digest
   normalises numbers out, so a pure figure sweep could not have moved it; what moved it is that the
   sentence describing where this page's live reading falls against the r4 adjudication's quoted
   55–61 zone changed from a hardcoded "sits BELOW" to a computed branch, and at 57.88 the branch
   that renders says INSIDE. The message asks the re-minter to READ the new text for a RANKING of an
   external claim before re-pinning. Read: it contains none. The new sentence dates the change, names
   the ruling's effect, and ends "Agreement recovered by adopting an assumption is not the same
   evidence as agreement that was there all along, and this sentence is not claiming it is. The
   quoted zone is left exactly as it was written." That is the opposite of ranking an external
   claim — it is a disclaimer against reading the recovered agreement as corroboration. The
   RANKING_PATTERNS heuristic below is also clean, and the two are independent checks.

   The reading this message asks for was only possible after adding the DUMP_ANSWER_SURFACE aid
   below; this test demanded a reading it gave no way to perform. */
/* im-vet-six-repairs RE-PIN (2026-09-20, program bq-2835): the DIGITS a reader receives move with
   the two registry repairs (E1 the Trainium withdrawal, E2 the TPU numerator) — every one of them
   re-derived against the engine by tests/fa-m6-b9.test.mjs and tests/trendline-interlock-b9.test.mjs
   before this pin was touched. */
/* RE-PINNED 2026-09-20 (im-vet-six-repairs ROUND 2, completion-gate FAIL). Note WHICH of the
   two pins moved, because the pair is designed to tell exactly this apart: the DIGITS moved and
   the TEXT digest did NOT — it is byte-identical to the value pinned above. That is the shape a
   pure basis correction should have. Putting E2's two diagnostics on one timing convention
   (0.521 -> 0.519) moved every published figure that rides on the default fleet by a fraction of
   a point and changed no sentence, no claim and no qualifier. If the text digest had moved too,
   this would have been prose drifting behind a number, which is the failure class this file was
   built for. */
const ANSWER_DIGITS_PIN = "c3714685e9652c158accd9c4b7db119e78af5c78b8152a249e6f801a648279d7";
/* RE-PINNED 2026-09-12 (im-default-window-and-mcp-discrepancy; Astra review round 3 F9), THE WORDING ONLY. The
   digits pin above did not move: the rendered digit stream is byte-identical. Read with DUMP_ANSWER_SURFACE=1 on
   both sides (the pre-change tree 9dcb54e reproduces the previous pin 9a69431e... exactly, so the dump measures
   what this pin measures), and the rendered answer differs in exactly two insertions: the landing line now reads
   "the reading this page OPENS on by default, its built-in opening state (a reader can make another scenario the
   default in their own browser)" and the prior-reading line "by default it now opens on". A reader can now choose
   their own default, so the unqualified claim became false for that reader. Read for a RANKING of an external
   claim, as the failure message asks: none; the words qualify which default the answer's fixed readings describe.
   Evidence: orchestration/backlog-recovery/day-2026-07-28/reports/im-default-window-2026-09-12/evidence/answer-surface-diff.txt */
/* im-vet-six-repairs RE-PIN (2026-09-20): the WORDING moves too, and it was read for what this pin
   exists to catch — a RANKING of an external claim — and contains none. What changed inside THE
   ANSWER: the rent-class sentence (four of the FIVE member rents are analyst-set), the Trainium
   clause (WITHDRAWN rather than caveated), and the vocabulary release edit's one-name-per-idea
   renames. Every changed span is pinned reversibly in tests/fa-justifications.test.mjs
   VETTING_REPAIRS. */
/* RE-PINNED 2026-09-20 (im-vet-six-repairs, Astra xhigh fold). The rendered answer's WORDING
   moved and its DIGITS did not — the digit pin above stayed green through this change, which is
   the separation that makes re-pinning the text safe here. What moved is one clause, and it moved
   to UNDO an edit: the N1 vocabulary pass had replaced "paid-capacity occupancy" with
   "utilization" INSIDE the r4 run B §C2 label, which this surface quotes verbatim and attributes
   in the same sentence. The quoted bytes are restored, and the page's own gloss after the
   quotation now names both terms so a reader is not left to reconcile them. Read for what this
   pin exists to catch, per its own failure message: the new text adds no RANKING of an external
   claim, and the ranking-phrase control below passed on the same run. */
const ANSWER_TEXT_PIN = "aeb617203282b99183e0aa7405c6dd6a3e19d59c8681ebd525e4757e883f5b0b";

const RANKING_PATTERNS = [
  /\bstrongest external\b/i, /\branked strongest\b/i, /\bthe strongest [^.;]{0,24}hypothesis\b/i,
  /\badjudication of source reliability\b/i, /\bmost plausible reading\b/i,
];

async function withPage(fn, emulateCoarse) {
  const userDir = mkdtempSync(join(tmpdir(), "im-fa-explain-cdp-"));
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "file://" + HTML,
  ], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    if (emulateCoarse) {
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
      await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await send("Page.enable");
      await send("Page.reload", { ignoreCache: true });
      await sleep(400);
    }
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      const ok = await evalExpr(send, "(document.readyState!=='loading' && typeof finalAnswer==='function' && !!document.querySelector('#fa-deeper-trigger'))");
      if (ok) { ready = true; break; }
      await sleep(150);
    }
    return await fn(send, ready);
  } finally {
    try { ws && ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  if (!HTML) { assert("locate site/index.html", false, "not found next to the test"); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  try {
    await withPage(async (send, ready) => {
      assert("page + app + FA explain surface initialised over CDP", ready);
      if (!ready) return;

      const r = JSON.parse(await evalExpr(send, PROBE_FINE));
      // B-1
      assert("B-1 the 'Deeper explanation' trigger renders beneath the numbers", r.triggerPresent);
      assert("B-1 it is HYPERLINK-STYLED on COMPUTED style: underline", r.triggerUnderlined);
      assert("B-1 …cursor: pointer", r.triggerPointer);
      assert("B-1 …and the page's own link colour", r.triggerLinkColor, r.triggerColorDetail);
      // B-2
      assert("B-2 clicking it opens the dialog", r.dialogOpen);
      assert("B-2 the dialog is >= 95vw", r.dlgWidthPctVw >= 95, String(r.dlgWidthPctVw));
      assert("B-2 the dialog is >= 95vh", r.dlgHeightPctVh >= 95, String(r.dlgHeightPctVh));
      assert("B-2 the ::backdrop computes to an OPAQUE colour (R-2's 'not grayed-out', made testable)",
        r.backdropOpaque, r.backdropColor);
      assert("B-2 the dialog surface itself is opaque (page-like, not translucent)", r.dialogSurfaceOpaque);
      assert("B-2 the opacity predicate REJECTS the M4 dim it replaces (negative control)", r.opaquePredicateRejectsDim);
      // B-3
      assert("B-3 the X is >= 44x44 CSS px", r.closeBigEnough, JSON.stringify(r.closeSize));
      assert("B-3 the X sits TOP-RIGHT of the dialog", r.closeTopRight);
      assert("B-3 the X carries aria-label=\"Close\"", r.closeLabelled);
      assert("B-3 focus moves INTO the dialog on open", r.focusInDialog);
      assert("B-3 Esc closes the dialog", r.closedByEsc);
      assert("B-3 focus RETURNS to the trigger on close", r.focusReturned);
      // B-4
      assert("B-4 the popup body scrolls internally (overflow-y: auto)", r.bodyScrolls);
      assert("B-4 the payload actually overflows, so internal scrolling is real", r.bodyScrollable);
      assert("B-4 page scroll is LOCKED while open", r.pageScrollLocked);
      assert("B-4 page scroll is unlocked and the position RESTORED on close",
        r.pageScrollUnlocked && r.pageScrollRestored);
      // B-6
      assert("B-6 desktop: the <details> collapse still exists", r.detailsExists);
      assert("B-6 desktop: it is collapsed at first paint (R-4)", r.detailsCollapsed);
      assert("B-6 desktop: its expanded body computes to the .explain-body scale (>= 14px)",
        r.bodyFontPx >= 14, String(r.bodyFontPx));
      assert("B-6 desktop: …at --ink-2", r.bodyInk2Match);
      assert("B-6 desktop: …and is segmented into exactly 5 labeled parts (4 separators)", r.bodySegmented);
      // B-7b
      assert("B-7b the exec summary is collapsed at first paint", r.execExists && r.execCollapsed);
      assert("B-7b the ordering-basis line is NOT visible while collapsed", r.basisHiddenClosed);
      assert("B-7b …and IS visible when opened", r.basisVisibleOpen);
      assert("B-7b all five exec rows render", r.execRowCount === 5, String(r.execRowCount));
      // the A-3 affordance
      assert("A-3 the spec-decode row renders the `jump` affordance state (the lever has landed)",
        r.specDecJumpRendered);
      assert("A-3 …and the jump targets the real spec-decode control, which exists on the page",
        r.specDecJumpTargetsControl);
      assert("A-3 the pattern has a WORKING `jump` instance (so it is not unfalsifiable)", r.jumpRendered);
      assert("A-3 the jump target control EXISTS on the page (key: " + r.jumpTargetKey + ")", r.jumpTargetExists);
      assert("A-3 clicking it OPENS every collapsed section between the page and the control",
        r.jumpOpenedSection === true);
      assert("A-3 clicking it lands FOCUS inside the control's row (even when the control itself is disabled by the scroll-lock)",
        r.jumpFocused === true, "candidates=" + r.jumpFocusable + " active=" + r.activeTag);
      // the two-node vocabulary inventory + the rendered-DOM sweep
      assert("§2.7 the popup carries its OWN must-not-be-called node (outside #final-answer)", r.dlgDisclaimerNode);
      assert("§2.7 both inventoried nodes carry byte-identical §C2 text", r.disclaimersMatch);
      assert("§2.7 the rendered DOM sweep (union minus the TWO inventoried nodes) has ZERO hits",
        Array.isArray(r.domVocabHits) && r.domVocabHits.length === 0, JSON.stringify(r.domVocabHits));
      assert("§2.7 the inventory is EXACTLY two nodes, one per allowed id (cardinality asserted first)",
        JSON.stringify(r.inventoryCardinality) === JSON.stringify([1, 1]), JSON.stringify(r.inventoryCardinality));
      assert("§2.7 negative: a THIRD node under a DIFFERENT id carrying that sentence IS caught", r.rogueCaught);
      assert("§2.7 negative: a third node REUSING an inventoried id is caught by cardinality", r.dupeCardinalityCaught);
      assert("§2.7 negative: …and by the sweep itself (only the FIRST match of each id is exempt)", r.dupeSweepCaught);
      // D-6z
      assert("D-6z the three triggers map to their pinned ids and titles",
        JSON.stringify(r.triggerMap) === JSON.stringify([
          "fa-deeper-explanation|The answer, in full",
          "fa-higher-explanation|Why not the higher numbers?",
          "fa-exec-explanation|What would have to be true"]), JSON.stringify(r.triggerMap));
      assert("D-6z no explain dialog is left in the DOM after close", r.oneDialogAtATime);
      assert("D-6z AT MOST ONE explain dialog exists at any moment — opening a second removes the first",
        r.atMostOneWhileOpening === 1, "dialogs present after opening all three: " + r.atMostOneWhileOpening);
      assert("D-6z …and the surviving one is the LAST payload opened",
        r.lastOpenId === "fa-exec-explanation", String(r.lastOpenId));
    }, false);

    await withPage(async (send, ready) => {
      assert("B-5 coarse-pointer page initialised", ready);
      if (!ready) return;
      const r = JSON.parse(await evalExpr(send, PROBE_COARSE));
      assert("B-5 the emulated pointer really is coarse (the probe is not vacuous)", r.coarseDetected);
      assert("B-5 the inline <details> expansion is ABSENT under a coarse pointer", r.inlineDetailsAbsent);
      assert("B-5 …replaced by flat entries", r.flatEntriesRendered);
      assert("B-5 …and the trigger is the only route in", r.triggerStillPresent);
    }, true);

    /* T5 rec 5 (DOM) runs in its OWN page load, deliberately.

       Its probe calls getComputedStyle(el, '::before') on every element in the answer, which
       forces style resolution inside `content-visibility` subtrees — and B-7b's oracle is
       `checkVisibility({contentVisibilityAuto: true})` on a node inside exactly such a subtree.
       Sharing a page made B-7b fail: the measurement changed the thing being measured. Caught by
       checking whether the failure predated the change (it did not) rather than assuming a flake. */
    await withPage(async (send, ready) => {
      assert("T5 rec 5 (DOM): page initialised for the answer-surface probe", ready);
      if (!ready) return;
      {
        const raw = await evalExpr(send, ANSWER_SURFACE_PROBE);
        let surface = null;
        try { surface = JSON.parse(raw); } catch { /* reported below */ }
        assert("T5 rec 5 (DOM): the answer surface probe returned a real reading",
          !!surface && !surface.error && surface.insideCount > 0, String(raw).slice(0, 200));
        if (surface && !surface.error) {
          /* 1. CONTAINMENT, decided by the browser rather than by a scanner. */
          assert("T5 rec 5 (DOM): #fa-most-plausible is NOT inside <section id=\"final-answer\"> — Element.contains(), not a regex",
            surface.mostPlausibleInsideAnswer === false, JSON.stringify(surface.mostPlausibleInsideAnswer));
          assert("T5 rec 5 (DOM): ...nor is the analyst-hypothesis section that carries it",
            surface.analystSectionInsideAnswer === false, JSON.stringify(surface.analystSectionInsideAnswer));
          /* the positive half: the node must actually BE somewhere, or the two negatives above
             are satisfied by a node that simply does not exist. */
          assert("T5 rec 5 (DOM): ...and it genuinely sits inside #fa-analyst-hypothesis",
            surface.mostPlausibleInAnalystSection === true, JSON.stringify(surface.mostPlausibleInAnalystSection));

          /* 2. THE NODE SET is pinned. The static guard derived it from a regex over ONE
                assignment shape in app.js and saw 20 of the 34 ids the browser reports; six live
                render paths were invisible to it. This enumeration comes from the DOM, so a new
                node inside the answer fails here whatever put it there. */
          const INSIDE_ANSWER_IDS = ANSWER_IDS_PIN;
          const added = surface.inside.filter(id => !INSIDE_ANSWER_IDS.includes(id));
          const removed = INSIDE_ANSWER_IDS.filter(id => !surface.inside.includes(id));
          assert("T5 rec 5 (DOM): the set of ids inside THE ANSWER is exactly the reviewed set — a new node there must be reviewed",
            added.length === 0 && removed.length === 0, JSON.stringify({ added, removed, count: surface.insideCount }));

          /* 3. THE WORDING a reader receives is pinned, numbers normalised out. This is the
                control the ranking heuristic is not: it does not care HOW text arrived. */
          const digest = createHash("sha256").update(surface.text).digest("hex");
          /* im-release-edit-r3 (2026-09-10): a minting aid, the one this test was missing. Its own
             failure message says to re-derive the digits against the engine and READ the new text
             before re-pinning — and then gave the re-minter no way to see either without editing
             the test. report-text-parity has had DUMP_PARITY_HASHES for exactly this reason. With
             DUMP_ANSWER_SURFACE=1 the rendered answer and its digit stream are written to
             tests/.answer-surface-dump.txt (gitignored) so the reading the message asks for is
             actually possible. */
          if (process.env.DUMP_ANSWER_SURFACE) {
            writeFileSync(new URL("./.answer-surface-dump.txt", import.meta.url),
              `TEXT DIGEST ${digest}\nDIGITS DIGEST ${createHash("sha256").update(surface.digitsOnly || "").digest("hex")}\n`
              + `\n===== DIGITS =====\n${surface.digitsOnly || ""}\n\n===== TEXT =====\n${surface.text}\n`);
            console.log("DUMP_ANSWER_SURFACE: wrote tests/.answer-surface-dump.txt");
          }
          /* the digits, pinned separately — review showed a wording pin that normalises numbers
             leaves 51 -> 81 INSIDE the answer unguarded. This one is MEANT to fire when a
             published answer figure moves; that is when it should be re-derived, not waved. */
          const digitDigest = createHash("sha256").update(surface.digitsOnly || "").digest("hex");
          assert("T5 rec 5 (DOM): the NUMBERS a reader receives from THE ANSWER are pinned — a changed digit fails here",
            digitDigest === ANSWER_DIGITS_PIN,
            `answer-digits digest ${digitDigest}. If a published figure moved, re-derive it against ` +
            `the engine before re-pinning.`);
          assert("T5 rec 5 (DOM): the wording a reader receives from THE ANSWER is pinned — any new text fails until reviewed",
            digest === ANSWER_TEXT_PIN,
            `rendered-answer digest ${digest} (${surface.textLen} chars, numbers normalised). ` +
            `If this changed deliberately, read the new text for a RANKING of an external claim, then re-pin.`);
          assert("T5 rec 5 (DOM) non-vacuity: the pinned answer text is substantial",
            surface.textLen > 2000, String(surface.textLen));

          /* 4. the heuristic, kept as a signal over rendered text rather than over tokens */
          const hits = RANKING_PATTERNS.filter(re => re.test(surface.text)).map(re => String(re));
          assert("T5 rec 5 (DOM): no known ranking phrasing appears in the rendered answer",
            hits.length === 0, JSON.stringify(hits));
        }
      }
    });
  } catch (e) {
    assert("CDP explain-surface run completed without harness error", false, String(e && e.message || e));
  }
}
/* THE VERDICT MUST SURVIVE AN EARLY RETURN (vetting round 2026-09-19, Astra pack B P1-6).
   main() returns early when site/index.html or a chromium binary cannot be found, or when the
   page never becomes ready. Each of those calls assert() with a failure and then returns BEFORE
   the verdict line — which lived INSIDE main() — so the script printed its failure and exited
   0. `PATH=/nonexistent node <this file>` printed "locate a chromium/chrome binary" and exited
   0. These suites are in `npm run test:browser`, which both CI and the release gate run, so a
   missing browser read as a pass on every one of them. The verdict now runs in a finally that
   covers setup, readiness and the body, and process.exitCode lets output flush. */
try {
  await main();
} catch (err) {
  console.error("HARNESS ERROR:", err && err.message);
  failures++;
} finally {
  console.log(failures ? `\n${failures} FA-EXPLAIN-CDP FAILURE(S)` : "\nALL FA-EXPLAIN CDP CHECKS PASS");
  process.exitCode = failures === 0 ? 0 : 1;
}
