/* INERT-FILTER ↔ DOM EQUIVALENCE — the check that keeps the filter's claim about itself honest.
 *
 * tests/inert-filter.mjs decides which parts of site/index.html a reader can actually see, and it
 * decides that in Node, from source, with no browser. Every version of that function has been wrong
 * in a way that only a browser could settle: GPT Pro session 1 round 4 found it deleting a VISIBLE
 * contradictory card, round 5 found sixteen more shapes in which "Chromium displays a contradictory
 * estimate while the complete, unchanged guard exits 0". Both rounds arrived at the same remedy —
 * round 5's words: those questions "need a browser-backed observation or a comparably explicit,
 * enforced scope."
 *
 * So this file is the browser-backed observation, and it runs on TWO things:
 *
 *   1. EVERY ONE of round 5's eighteen filed cases, plus the earlier rounds' controls. Chromium
 *      parses the fixture, the marker text is asked whether it is painted, and the filter has to
 *      agree — case by case, in both directions.
 *
 *   2. THE REAL PAGE. site/index.html is rendered with its scripts neutered (their `type` is
 *      changed, which leaves parsing byte-identical and stops execution — the filter reads static
 *      source, so comparing against a script-mutated DOM would be comparing two different pages),
 *      every <details> is opened because the guard's standing policy is that an openable disclosure
 *      is published text, and the browser's visible text is compared against the filter's. This is
 *      the half that turns "a restricted grammar, provably equivalent for the constructs this page
 *      uses" from a sentence in a header into something that goes red when it stops being true.
 *
 * A NOTE ON WHAT IT CANNOT SETTLE, since this file exists because a previous header claimed too
 * much. Agreement here is agreement about THIS page and THESE fixtures in THIS Chromium. It is not
 * a proof of equivalence over HTML, and the filter's restricted grammar is enforced by throwing, not
 * by being complete. What this does establish is that no construct now on the page is one the two
 * disagree about — which is the specific thing round 5 said was unestablished.
 *
 * Run: node tests/inert-filter-dom-equivalence.test.mjs
 */
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripInert, publishedText, stripComments } from "./inert-filter.mjs";
/* ONE ORACLE, IMPORTED — not a copy kept in step by a written rule. The round-5 addendum found the
   shadow-root repair in the sweep and not here, and the replaced-element rule in the filter and not
   in the oracle: two halves of two pairs, both in the last two commits, one of them on the commit
   that ADDED the instruction to check the other half. A pair that must not drift is better removed
   than documented. */
import { ORACLE_EXPRESSION, CARD_PAINT_EXPRESSION, CARD_RECT_EXPRESSION } from "./dom-oracle.mjs";
/* THE TWO SIDES ARE NORMALIZED DIFFERENTLY ON PURPOSE (fallback review F16). `normalizeText` in the
   filter module decodes character references, which is right for SOURCE text and wrong for text the
   BROWSER has already decoded — running it on both sides decoded the browser's output a second time,
   so a literal `&amp;#110;one` on the page would compare as `none` against the filter's `&#110;one`
   and report a false disagreement. The browser side collapses whitespace and nothing else. */
const collapse = (s) => String(s).replace(/[\s\u00a0]+/g, " ").trim();

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = join(HERE, "..", "site", "index.html");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const CHROME = findChrome();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pollActivePort(dir, ms = 20000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) {
    if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; }
    await sleep(100);
  }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 20000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (m) => (m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

/* THE ORACLE, run inside the page. Walks text nodes and asks the browser — not a heuristic — whether
   each one is painted. `checkVisibility` answers for display and content-visibility; computed
   `visibility` is read separately because a text node's own painting is what matters and a
   descendant may have restored it. <details> are opened first: the guard's policy, unchanged since
   the estimate-card bodies moved inside one, is that a disclosure the reader can open is published. */
const ORACLE = ORACLE_EXPRESSION;

/* Round 5's eighteen, plus the controls the earlier rounds left behind. `visible` lists the markers
   Chromium must paint; `gone` the markers it must not. The filter is required to agree with the
   browser on every one — that agreement, not a hand-written expectation, is the assertion. */
const CASES = [
  ["N6-R5-A1", '<div hidden data-path=/><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["N6-R5-A2", '<div hidden><div data-path=/>padding</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["N6-R5-A3", '<div hidden /><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["N6-R5-A4", '<div hidden><div />padding</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["N6-R5-B1", '<article style="--memo: display:none">VISIBLE-CUSTOM-PROP</article>'],
  ["N6-R5-B2", '<article style="display:none;display:block">VISIBLE-CASCADE</article>'],
  ["N6-R5-B3", '<article style="display:noneish">VISIBLE-PREFIX</article>'],
  ["N6-R5-B4", '<article hidden style="display:block">VISIBLE-OVERRIDE</article>'],
  ["N6-R5-B5", '<div style="visibility:hidden">PAINTED-OVER<article style="visibility:visible">VISIBLE-RESTORED</article></div>'],
  ["N6-R5-C1", '<article 1hidden="x">VISIBLE-SUFFIX</article>'],
  ["N6-R5-C2", '<article style style="display:none">VISIBLE-DUPLICATE</article>'],
  ["N6-R5-D1", '<div hidden><script type="application/json">"</div>"</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["N6-R5-D2", '<script type="application/json">"<div hidden>"</script><article>VISIBLE-BETWEEN</article><script type="application/json">"</div>"</script>'],
  ["N6-R5-E1", '<div style="display&colon;none">ENT-NAMED-GONE</div><p>VISIBLE-76</p>'],
  ["N6-R5-E2", '<div style="display:&#110one">ENT-NUMERIC-GONE</div><p>VISIBLE-76</p>'],
  ["N6-R5-E3", '<div style="display:/' + '*c*' + '/none">CSS-COMMENT-HIDES</div><p>VISIBLE-76</p>'],
  ["N6-R5-T1", '<input hidden><p>VISIBLE-VOID</p>'],
  ["N6-R5-T2", '<p hidden>HIDDEN-P<p>VISIBLE-P</p>'],
  ["round-4 N6-A", '<article class="est-card" title=" hidden ">VISIBLE-TITLE-HIDDEN</article>'],
  ["round-4 N6-B", '<div hidden><div title="</div>">padding</div><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["round-4 N6-C", '<div style="display:&#110;one">ENT-SEMI-GONE</div><p>VISIBLE-76</p>'],
  ["F6 void img", '<p>KEEP-A</p><img hidden src="x.png"><p>KEEP-B</p>'],
  ["F7 script string", '<div hidden><script>var s="</div>";</script><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["F7 style body", '<div hidden><style>/' + '* </div> *' + '/</style><p>HIDDEN-80</p></div><p>VISIBLE-76</p>'],
  ["aria-hidden", '<span aria-hidden="true">VISIBLE-ARIA</span>'],
  ["css escape", '<div style="display:\\6e one">CSS-ESCAPE-GONE</div><p>VISIBLE-76</p>'],
  /* `style="color:…"` is deliberately GONE: the filter refuses any inline style declaring a
     property it does not model, and a refused fixture has no verdict to compare against a browser.
     That refusal is pinned in tests/face-vs-registry.test.mjs together with the Chromium evidence
     that no visibility API reports colour, clipping or off-screen text as hidden.
     Foreign content replaces it, because that one MUST NOT refuse — fallback review F14 found
     `<svg><path/></svg>` taking the whole gate down, and the page will grow its first inline icon
     one day. */
  ["F14 foreign content self-closes", '<p>KEEP-A</p><svg viewBox="0 0 1 1"><path d="M0 0"/></svg><p>KEEP-B</p>'],
  ["F14 noscript is raw text with scripting on", '<noscript><div hidden></noscript><p>VISIBLE-76</p>'],
  ["F2 invalid display is dropped, element paints", '<article style="display:noneish">VISIBLE-PREFIX</article>'],
  ["details is published", '<details><summary>S</summary><p>INSIDE-DETAILS</p></details>'],
  ["F17 display:contents generates no box but paints its text", '<div style="display:contents">SHOWN-CONTENTS</div>'],
  /* ===== THE FIXTURES NEITHER CORPUS HAD (round-5 addendum T1/T2). Both repairs were green only
     because nothing exercised them: no replaced-element fixture existed in the twin OR the sweep,
     and the shadow-root case lived in the sweep alone. The addendum's warning about T2 is the one
     that matters — with the filter right and the oracle wrong, the obvious fixture would have gone
     RED AGAINST A BLIND ORACLE, which is the failure most likely to get correct code "corrected"
     back to wrong. */
  ["T2 canvas fallback is not rendered", '<canvas>HIDDEN-CANVAS</canvas><p>VISIBLE-76</p>'],
  ["T2 iframe fallback is not rendered", '<iframe>HIDDEN-IFRAME</iframe><p>VISIBLE-76</p>'],
  ["T2 video fallback is not rendered", '<video>HIDDEN-VIDEO</video><p>VISIBLE-76</p>'],
  ["T2 audio fallback is not rendered", '<audio>HIDDEN-AUDIO</audio><p>VISIBLE-76</p>'],
  ["T2 ...while object fallback DOES render", '<object>SHOWN-OBJECT</object>'],
  /* The <option> ruling, with its witness. Chromium's own answers disagree here — innerText returns
     both options, option.checkVisibility() is false for both — so the ruling picks the reading whose
     failure direction is safe, and the oracle is made to match it in the same change. */
  ["R6 <option> text is PUBLISHED, so a figure one click away is audited",
   '<select><option>SHOWN-OPT-A</option><option>SHOWN-OPT-B</option></select>'],
  /* A REFUSAL IS THE CORRECT OUTCOME HERE, and until now this file had no way to say so — the sweep
     grew three-outcome accounting in the round-4 addendum and the twin did not, which is the pair
     problem one more time. What this fixture pins is the ORACLE half: the filter refuses, and the
     browser must still report the shadow text PAINTED, because if the oracle cannot see into a
     shadow root then the refusal is untestable by the thing meant to test it. */
  ["T1 declarative shadow DOM is painted, and the oracle must see into it",
   '<div><template shadowrootmode="open"><p>SHOWN-SHADOW</p></template></div><p>VISIBLE-76</p>',
   { refusalIsCorrect: true, browserMustPaint: ["SHOWN-SHADOW", "VISIBLE-76"] }],
  /* ===== ROUND-2 FALLBACK REVIEW. Seven inputs where the filter and Chromium disagreed, added HERE
     FIRST and deliberately before the filter was touched — the round-2 reviewer's own advice, and
     the reason it works is that the ancestor-walking oracle from F17 already gets all seven right.
     In round 1 the oracle shared the filter's blind spot and the twin agreed with a wrong answer;
     it does not any more, so these go red on the filter alone and stay red until it agrees. */
  /* The four round-2 cases where the correct outcome is a REFUSAL live in the guard as refuses()
     pins instead of here: a refused fixture has no verdict to compare against a browser, which is
     the same reason `style="color:…"` is absent above. What stays here is every round-2 case where
     the filter produces a verdict and must match Chromium's. */
  ["R2-1 a repeated token with nothing to fall back to still paints",
   '<div style="display:none none">SHOWN-REPEATED</div>'],
  ["R2-2 ...while display:revert and display:inherit on a hidden element ARE painted",
   '<div hidden style="display:revert">SHOWN-REVERT</div><div hidden style="display:inherit">SHOWN-INHERIT</div>'],
  ["R2-3 !important is ignored for visibility — the certifying direction",
   '<div style="visibility:hidden !important;visibility:visible">HIDDEN-80</div><p>VISIBLE-76</p>'],
  ["R2-3 ...and the deleting direction",
   '<div style="visibility:visible !important;visibility:hidden">SHOWN-IMPORTANT</div>'],
  ["R2-4 an HTML element BREAKS OUT of foreign content, so the solidus is ignored again",
   '<svg><div hidden /><p>HIDDEN-80</p></div></svg><p>VISIBLE-76</p>'],
];
/* Every marker that appears anywhere in the fixtures. A case is judged by comparing, for each
   marker, whether the browser paints it and whether the filter keeps it. */
const MARKERS = [...new Set(CASES.flatMap(([, h]) => h.match(/[A-Z][A-Z0-9-]{3,}/g) || []))];

async function main() {
  assert("the equivalence twin locates site/index.html", existsSync(PAGE));
  if (!CHROME) {
    /* NOT a skip. This suite exists to be the browser half of a claim the filter makes about
       itself, and a green run with no browser would be the claim asserting itself again. */
    assert("a chromium/chrome binary is on PATH", false,
      "no browser: the DOM-equivalence claim cannot be checked, so it is not certified");
    return;
  }
  const userDir = mkdtempSync(join(tmpdir(), "im-inert-dom-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank"], { stdio: "ignore" });
  let ws;
  try {
    const wsUrl = await pageTarget(await pollActivePort(userDir));
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res);
      ws.addEventListener("error", () => rej(new Error("ws error")));
    });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    await send("Page.enable");

    const render = async (html) => {
      await send("Page.navigate", { url: "about:blank" });
      const { frameTree } = await send("Page.getFrameTree");
      await send("Page.setDocumentContent", { frameId: frameTree.frame.id, html });
      return collapse(await evalExpr(send, ORACLE));
    };

    /* ---- 1. the fixtures ---- */
    let agreed = 0;
    for (const [id, html, opts] of CASES) {
      const doc = "<!doctype html><html><body>" + html + "</body></html>";
      let browser;
      try { browser = await render(doc); } catch (e) { assert(`${id}: Chromium rendered the fixture`, false, String(e.message)); continue; }
      let mine;
      try { mine = publishedText(doc); }
      catch (e) {
        if (opts && opts.refusalIsCorrect) {
          /* Three outcomes, not two. A refused fixture has no verdict to compare — but the BROWSER
             half is still assertable, and here it is the half that matters. */
          const unseen = (opts.browserMustPaint || []).filter((m) => !browser.includes(m));
          assert(`${id}: the filter refuses (correct) AND the oracle still sees what Chromium paints`,
            unseen.length === 0,
            `the oracle did not see ${JSON.stringify(unseen)} — a refusal the oracle cannot check is untestable`);
          if (!unseen.length) agreed += 1;
          continue;
        }
        assert(`${id}: the filter resolved the fixture`, false, "it refused: " + String(e.message).slice(0, 120));
        continue;
      }
      const disagreements = MARKERS.filter((m) => html.includes(m))
        .filter((m) => browser.includes(m) !== mine.includes(m))
        .map((m) => `${m}: browser=${browser.includes(m) ? "painted" : "not painted"}, filter=${mine.includes(m) ? "kept" : "removed"}`);
      assert(`${id}: the filter agrees with Chromium on every marker in the fixture`,
        disagreements.length === 0, disagreements.join("; "));
      if (!disagreements.length) agreed += 1;
    }
    /* NON-VACUITY: the comparison has to be able to fail. A marker the browser paints and the filter
       is told to remove must be reported as a disagreement — otherwise every green above means only
       that the comparison never looked. */
    {
      /* NON-VACUITY THROUGH THE REAL COMPARISON (fallback review F15). This used to set
         `const mine = ""` and assert that the empty string lacks the marker — a tautology about a
         literal that never touched the `disagreements` expression, which is the thing whose ability
         to fail is actually in question. Now it feeds a deliberately wrong filter result through
         that same expression and requires it to report the disagreement. */
      const doc = "<!doctype html><html><body><p>CONTROL-PAINTED</p></body></html>";
      const browser = await render(doc);
      const wrong = "";                                  // a filter that removed everything
      const probe = ["CONTROL-PAINTED"]
        .filter((m) => browser.includes(m) !== wrong.includes(m))
        .map((m) => `${m}: browser=${browser.includes(m) ? "painted" : "not painted"}, filter=${wrong.includes(m) ? "kept" : "removed"}`);
      assert("the comparison expression itself reports a disagreement when the filter is wrong",
        probe.length === 1 && /browser=painted, filter=removed/.test(probe[0]), JSON.stringify(probe));
      const agree = ["CONTROL-PAINTED"].filter((m) => browser.includes(m) !== browser.includes(m));
      assert("...and reports none when the two agree", agree.length === 0);
    }
    assert(`all ${CASES.length} fixtures agree`, agreed === CASES.length, `${agreed}/${CASES.length}`);

    /* ---- 2. the real page ---- */
    const raw = readFileSync(PAGE, "utf8");
    /* Neuter execution without changing one byte of PARSING: a <script> with an unknown type is
       still script-data raw text to the tokenizer and still is not executed. The filter reads static
       source, so the DOM it is compared against must be the static one. */
    const inert = raw.replace(/<script\b(?![^>]*\btype\s*=\s*["']?text\/plain-disabled)/gi,
      '<script type="text/plain-disabled" data-was-script="1"');
    let browserText;
    try { browserText = await render(inert); }
    catch (e) { assert("Chromium rendered site/index.html", false, String(e.message)); browserText = null; }
    if (browserText !== null) {
      assert("Chromium painted a substantial page (the comparison below is not against an empty DOM)",
        browserText.length > 20000, `${browserText.length} chars`);
      let mine = null;
      try { mine = publishedText(raw); }
      catch (e) {
        assert("the filter resolves site/index.html without refusing", false,
          "it threw, which is a REAL finding about the page rather than a harness crash: " + String(e.message).slice(0, 240));
      }
      if (mine !== null) {
        /* Compare on SENTENCES rather than on the whole blob: whitespace between block elements is
           collapsed differently by a serializer and by a browser's text walk, and a diff that reports
           the entire page when one space moved tells nobody anything. */
        const sentences = (s) => new Set(String(s).split(/(?<=[.!?])\s+|\s*[·|]\s*/)
          .map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length >= 24));
        const B = sentences(browserText), M = sentences(mine);
        const onlyBrowser = [...B].filter((x) => !M.has(x));
        const onlyFilter = [...M].filter((x) => !B.has(x));
        assert("the filter keeps nothing Chromium does not paint on site/index.html",
          onlyFilter.length === 0,
          `${onlyFilter.length} passage(s) survive the filter but are not painted: ` +
          JSON.stringify(onlyFilter.slice(0, 3)));
        assert("the filter removes nothing Chromium does paint on site/index.html",
          onlyBrowser.length === 0,
          `${onlyBrowser.length} painted passage(s) are removed by the filter: ` +
          JSON.stringify(onlyBrowser.slice(0, 3)));
        assert("the page comparison is non-vacuous (both sides carry the audited estimate quotation)",
          [...B].some((x) => /round-3 self-authored reading/.test(x)) &&
          [...M].some((x) => /round-3 self-authored reading/.test(x)));
        /* AND THE COMPARISON HAS TO BE ABLE TO FAIL ON THIS PAGE, not only on a fixture. Run the
           same comparison with the filter REMOVED — the page's own text, unfiltered — and require
           it to disagree with the browser. If the raw page already matched what Chromium paints,
           the two assertions above would be green no matter what the filter did, which is the
           vacuity that Astra round-2 finding A3 was about. */
        const U = sentences(collapse(stripComments(raw).replace(/<[^>]*>/g, " ")));
        const unfilteredExtra = [...U].filter((x) => !B.has(x));
        assert("...and it can fail here: the UNFILTERED page carries passages Chromium never paints",
          unfilteredExtra.length > 0,
          "the raw page already matches the rendered one, so this comparison proves nothing about the filter");
        console.log(`  · compared ${B.size} painted passages against ${M.size} kept passages ` +
          `(${unfilteredExtra.length} unpainted passages the filter had to remove)`);
      }

      /* ---- DOOR 4, ASKED OF THE BROWSER (round-10 review R10-1) ----
         The filter reads no stylesheet. What used to stand in for that in the default gate was a
         text scan of the page's CSS that tested each hiding rule's SELECTOR against a regex of
         card class names — and the reviewer executed four ordinary, non-adversarial selectors that
         hid the audited card and passed it (`.est\-card`, `article`, `div:has(> article) > article`,
         and the same rule wrapped in `@media screen`). A selector scan at text level cannot be made
         sound and that one failed OPEN.
         This is the check that IS sound, and it is here rather than in `npm test` because it needs
         the thing that makes it sound: a browser. The document is already loaded and the oracle has
         already opened the <details>, so this asks Chromium directly whether every element the
         face-vs-registry guard audits actually has a box a reader can see. */
      const paint = JSON.parse(await evalExpr(send, CARD_PAINT_EXPRESSION));
      assert("every element the face-vs-registry guard audits is PAINTED on the live page — the stylesheet hides none of them",
        paint.dark.length === 0,
        `${paint.dark.length} of ${paint.total} audited elements are not painted, so the guard would ` +
        `certify a page a reader cannot read: ${JSON.stringify(paint.dark.slice(0, 5))}`);
      assert("...and the probe actually found the audited elements (it is not passing on an empty set)",
        paint.total >= 8, `${paint.total} elements matched the audited selectors — the page's card markup moved`);

      /* AND IT HAS TO BE ABLE TO FAIL. Four rules, one per bypass the reviewer executed against the
         text scan this replaces: a CSS-escaped class, a bare tag selector, a structural selector,
         and a media query. Each is injected into the real page and must darken something. A check
         that cannot fail is the vacuity this file's own round-2 finding A3 was about. */
      const BYPASSES = [
        ["a CSS-escaped hyphen in the class name", ".est\\-card { display: none }"],
        ["a bare tag selector — the cards ARE <article> elements", "article.est-card { display: none }"],
        ["a structural selector naming no card class", "div.est-pair > article { display: none }"],
        ["the same rule wrapped in a media query", "@media screen { .est-card .est-median { display: none } }"],
        /* ROUND 11. The four above are SELECTOR bypasses and the first predicate caught them all.
           These are MECHANISM bypasses, and the first predicate caught none: an off-screen element
           has checkVisibility true and a full-size box, so `!vis || zero-box` said painted while a
           reader could not reach it at any viewport. They are why the predicate is now geometric.
           The first is the one the reviewer executed end to end, on a listed element AND on the
           unlisted face sentence; the rest are the same family, and running them here is what turns
           "the same family" from an argument into a measurement. */
        ["position:absolute with a negative offset — checkVisibility says TRUE and the box is full size",
          ".est-median { position: absolute; left: -9999px }"],
        ["...the same, on the FACE SENTENCE, which carries no class of its own",
          ".est-card p strong { position: absolute; left: -9999px }"],
        ["text-indent:-9999px, the other half of the classic off-screen pattern",
          ".est-card p strong { position: absolute; text-indent: -9999px; white-space: nowrap }"],
        ["the sr-only clip pattern — clip-path:inset(50%) with a 1px box",
          ".est-median { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; left: -10px; top: -10px }"],
        /* ROUND 12. OCCLUSION — the class that defeated every instrument in this repo at once, and
           the reason there is now a third predicate rather than a ninth mechanism. The elements keep
           their boxes, sit inside the document, and checkVisibility() is true; a clipped screenshot
           of the covered tile came back 230 bytes for a 341x46 region, which is one flat colour.
           checkVisibility explicitly does not hit-test, so only hit-testing reaches it. The
           stylesheet already carries an overlay-shaped rule (.range-line::before), one `inset:0`
           away from this. */
        ["an opaque ::after overlay laid across the cards — generated content the filter cannot see",
          ".est-pair { position: relative } .est-pair::after { content:\"\"; position:absolute; inset:0; background:#12100f; z-index:99 }"],
        ["...and a plain element overlay, in case the fix only understood pseudo-elements",
          ".est-pair { position: relative } .est-card { position: relative } .est-card::before { content:\"\"; position:absolute; inset:0; background:#12100f; z-index:99 }"],
        /* Ancestor clipping: round 12 measured that the TWIN reds on these and the tripwire does
           not, because the mechanisms are not in HIDES_SRC. Pinned here so the half that does the
           work is the half that is asserted. */
        ["an ancestor clipped to zero height with overflow hidden",
          ".est-card { height: 0; overflow: hidden }"],
        /* ROUND 13. `pointer-events: none` renders an overlay and makes hit-testing IGNORE it —
           that is the property's entire purpose, and it is the commonest companion for a decorative
           overlay, which this stylesheet already has one of. It defeats every DOM-level question
           here; only the pixels catch it, which is why the loop below asks both. */
        ["an opaque overlay with pointer-events:none — renders, and hit-testing is told to ignore it",
          ".est-pair { position: relative } .est-pair::before { content:\"\"; position:absolute; inset:0; background:#12100f; z-index:99; pointer-events: none }"],
        /* ROUND 14. These attack the pixel check's DENOMINATOR: a density is a ratio, and shrinking
           the ink keeps the ratio high while the figure disappears. Measured by the reviewer:
           font-size:1px clips a 3x1 rect at 31,333 per 1000px^2, which is 783x the flat-block floor,
           for a figure nobody can read. Neither spelling is in the tripwire either — it pins
           font-size and scale at EXACTLY zero — so the absolute ink floor is what catches them. */
        ["font-size:1px — a legible-looking DENSITY over three pixels of ink",
          ".est-median { font-size: 1px }"],
        ["transform:scale(0.03) — the same trick, and outside the tripwire's exact-zero pin",
          ".est-median { display: inline-block; transform: scale(0.03) }"],
        /* ROUND 15's UNRUN CASE, executed here rather than left on a not-checked list. The reviewer
           queued `letter-spacing` collapse, the run timed out, and they reported NO RESULT and named
           it the obvious third member of the bidi-override / text-security content family. It is
           not a member: measured, it is caught — and by the AREA floor, not the density one.

               .est-median { letter-spacing: -0.6em }   ink rects collapse to ZERO     -> caught
               .est-median { letter-spacing: -1em }     ink rects collapse to ZERO     -> caught
               + word-spacing: -1em                     ink 23px2, density 4473        -> caught on area

           The density reading on the third is the point: 4,473 per 1000px^2 is ELEVEN TIMES the
           baseline's 946 and a hundred times the floor, so the ratio not only fails to catch it, it
           rewards it — exactly round-14 R14-1's shape. The absolute geometric term is what reds. It
           was added for shrinking and it covers collapse too, which is what a geometric term buys
           over an enumerated one. Pinned as controls so that stays true.

           AND THE PARAMETER IS SWEPT, not sampled — the reviewer's own correction on this construct
           is the reason, and it is the sharpest general rule to come out of sixteen rounds. Their
           closing note said "letter-spacing collapse is CAUGHT" on the strength of ONE value
           (-0.45em), and -0.6em then behaved differently enough to slip past the collector. True at
           the value tested, false as a statement about the mechanism. ONE VALUE IS NOT A MECHANISM:
           a construct with a parameter needs the parameter swept, or the claim needs to name the
           value. Executed across the range (evidence/content-mechanism-probe.txt):

               -0.45em   ink  91px2, density 1772   -> caught on AREA, a real rect below the floor
               -0.6em    ink   0px2                 -> caught on the zero-ink record
               -0.7em    ink   0px2                 -> caught (the reviewer's probe crashed here)
               -1em      ink   0px2                 -> caught
               -0.5em + word-spacing -1em  23px2    -> caught on AREA at density 4473

           Two of those exercise DIFFERENT branches — a small real rect versus no rect at all — so
           both are pinned. The three that only repeat a branch are in the evidence file. */
        ["letter-spacing -0.45em — a REAL rect at 91px2 that the density scores 1772",
          ".est-median { letter-spacing: -0.45em }"],
        ["letter-spacing collapse — ink rects vanish entirely; the DENSITY would have rewarded it",
          ".est-median { letter-spacing: -0.6em }"],
        ["...and the harder collapse with word-spacing, which leaves 23px2 of smudge",
          ".est-median { letter-spacing: -0.5em; word-spacing: -1em }"],
      ];
      /* ---- THE LAST QUESTION: IS ANYTHING RENDERED HERE (round-13 R13-1) ----
         `pointer-events: none` on an opaque overlay renders it and makes hit-testing ignore it —
         that is the property's whole purpose — so the third predicate above went green on a card
         the reader sees as a solid block. Pixels have no such escape. Each audited LEAF is clipped
         out of a screenshot in document coordinates and required to carry more information than a
         flat block: measured, a covered 341x46 tile is 230 bytes and the same tile with its text is
         3,381, so the floor sits an order of magnitude below the real values and an order above a
         flat fill. A FLOOR rather than an image pin, because PNG bytes move with font rendering. */
      const shotBytes = async (r) => {
        const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true,
          clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
        return Buffer.from(shot.data, "base64").length;
      };
      /* THE VIEWPORT IS RESIZED TO THE WHOLE DOCUMENT FIRST, and this is the second thing the
         measurement taught rather than the reviewer. `captureBeyondViewport` did not render the
         regions far below the fold in this headless build — nine leaves deep in the page clipped to
         flat blocks with nothing over them, which is a false POSITIVE and the worst direction for a
         check like this. Overriding the device metrics to the full document height puts every
         element inside the viewport, so document and viewport coordinates coincide at scroll 0 and
         the clip is of real painted pixels. The override is cleared afterwards. */
      /* deviceScaleFactor is PINNED for reproducibility, and the DPR-2 assertion below says WHY that
         is a reproducibility choice rather than a fragility. It used to be a declared precondition;
         it is now a measured one. */
      const measureLeaves = async (dpr = 1) => {
        const dim = JSON.parse(await evalExpr(send,
          `JSON.stringify({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })`));
        await send("Emulation.setDeviceMetricsOverride",
          { width: Math.max(800, Math.ceil(dim.w)), height: Math.ceil(dim.h) + 40, deviceScaleFactor: dpr, mobile: false });
        try {
          await evalExpr(send, `window.scrollTo(0, 0); ""`);
          const rects = JSON.parse(await evalExpr(send, CARD_RECT_EXPRESSION));
          const out = [];
          for (const r of rects) {
            /* A no-ink record has nothing to clip; it is recorded at zero so it fails both floors
               rather than disappearing from the set (see dom-oracle's note on collapse). */
            if (r.noInk) { out.push({ id: r.id + ` "${r.text}"`, w: 0, h: 0, area: 0, bytes: 0 }); continue; }
            out.push({ id: r.id, w: r.w, h: r.h, area: r.w * r.h, bytes: await shotBytes(r) });
          }
          return out;
        } finally {
          await send("Emulation.clearDeviceMetricsOverride");
        }
      };
      const leaves = await measureLeaves();
      const density = (m) => (m.bytes * 1000) / m.area;
      const FLAT_FLOOR = 40;          // flat block measured at ~14.7 per 1000px^2; real text at 580+
      /* TWO TERMS, BECAUSE A DENSITY IS A RATIO AND BOTH ITS TERMS ARE THE ATTACKER'S (round-14
         review R14-1). Density alone says how CONCENTRATED the ink is, never how MUCH there is —
         and concentration goes UP when the region shrinks. Executed by the reviewer: `font-size:1px`
         clips a 3x1 rect scoring 31,333 per 1000px^2, which is 783x this floor, for a figure nobody
         can read; `transform: scale(0.03)` does the same at 12,875. So the absolute term is
         GEOMETRIC, which is the move that worked in round 11 and has no spellings to enumerate:
         real body text on this page is never a few pixels tall or a few dozen square pixels. */
      const MIN_INK_H = 8;            // px; page body text measures 16-46 tall, a smudge 1-2
      const MIN_INK_AREA = 200;       // px^2; smallest real leaf measured well above this
      const flat = leaves.filter((m) => m.area > 0 && density(m) < FLAT_FLOOR);
      const tiny = leaves.filter((m) => m.h < MIN_INK_H || m.area < MIN_INK_AREA);
      /* `density` divides by area, so a zero-area record would be NaN and silently pass every
         comparison. Zero area is caught by `tiny` above; this keeps it out of `flat` rather than
         letting a NaN wander into the density arithmetic. */
      assert(`every audited figure is actually PAINTED IN PIXELS, not just present in the DOM (${leaves.length} leaves clipped)`,
        flat.length === 0,
        `${flat.length} of ${leaves.length} clip to a flat block — something opaque is over them, and ` +
        `every DOM-level predicate calls them visible: ` +
        JSON.stringify(flat.slice(0, 4).map((m) => `${m.id} ${m.bytes}B/${Math.round(m.area)}px2`)));
      assert(`...and each figure is BIG ENOUGH TO READ — density alone rewards a shrunken smudge (${leaves.length} leaves)`,
        tiny.length === 0,
        `${tiny.length} of ${leaves.length} clip to ink smaller than ${MIN_INK_H}px tall or ${MIN_INK_AREA}px2: ` +
        JSON.stringify(tiny.slice(0, 4).map((m) => `${m.id} ${Math.round(m.w)}x${Math.round(m.h)}`)));
      assert("...and the pixel check found leaves to measure (it is not passing on an empty set)",
        leaves.length >= 6, `${leaves.length} leaves`);
      console.log(`  · pixel density per 1000px^2: min ${Math.min(...leaves.map(density)).toFixed(1)} ` +
        `(floor ${FLAT_FLOOR}) · smallest ink ${Math.min(...leaves.map((m) => m.h)).toFixed(0)}px tall, ` +
        `${Math.min(...leaves.map((m) => m.area)).toFixed(0)}px2 (floors ${MIN_INK_H}, ${MIN_INK_AREA})`);

      /* ---- AND THE CONSTANTS ARE NOT FRAGILE TO DEVICE SCALE, measured rather than declared.
         The density floor was the newest load-bearing constant and it had ONE measurement behind it,
         at DPR 1. Both terms move with device scale, so "calibrated at DPR 1" was a precondition
         nobody had checked. Re-running the same measurement at deviceScaleFactor 2 answers it, and
         the two halves answer differently on purpose:
           * THE GEOMETRIC FLOORS ARE DPR-INVARIANT. getClientRects returns CSS pixels, so 8px and
             200px^2 mean the same thing at any scale — the smallest ink is identical at both. That
             is a dividend of making the shrink term geometric rather than byte-based: it removed a
             calibration dependency nobody was tracking.
           * THE DENSITY FLOOR MOVES IN THE SAFE DIRECTION. Bytes scale with DEVICE pixels while the
             divisor stays in CSS pixels, so density roughly doubles against an unchanged floor: a
             DPR-1 floor is CONSERVATIVE at DPR 2, not fragile.
         The caveat that comes with that, recorded because it is the cost: density's DISCRIMINATING
         POWER falls as DPR rises, since a smudge gains bytes too. Tolerable only because the shrink
         cases are caught by the geometric terms, which do not move. If density were ever the only
         thing standing, this would be a different note. */
      const leaves2x = await measureLeaves(2);
      const geo = (ms) => `${Math.min(...ms.map((m) => m.h)).toFixed(0)}x${Math.min(...ms.map((m) => m.area)).toFixed(0)}`;
      assert(`the GEOMETRIC floors read identically at DPR 2 — they are in CSS pixels, so they carry no scale calibration (${geo(leaves)} vs ${geo(leaves2x)})`,
        geo(leaves) === geo(leaves2x),
        `the ink measurements moved with device scale, so the 8px/200px2 floors are calibrated to a ` +
        `device rather than to the page`);
      const minD = (ms) => Math.min(...ms.map(density));
      assert(`...and the DENSITY floor moves in the SAFE direction at DPR 2 (${minD(leaves).toFixed(1)} -> ${minD(leaves2x).toFixed(1)}, floor ${FLAT_FLOOR})`,
        minD(leaves2x) >= minD(leaves),
        `density FELL at higher device scale, so a floor calibrated at DPR 1 would be optimistic ` +
        `rather than conservative on a retina display`);
      assert("...and nothing reds at DPR 2 either (the page passes both floors at both scales)",
        leaves2x.filter((m) => (m.area > 0 && density(m) < FLAT_FLOOR) || m.h < MIN_INK_H || m.area < MIN_INK_AREA).length === 0,
        JSON.stringify(leaves2x.filter((m) => m.h < MIN_INK_H || m.area < MIN_INK_AREA).slice(0, 3)));

      let caught = 0;
      for (const [why, css] of BYPASSES) {
        const hostile = inert.replace("</head>", `<style>${css}</style></head>`);
        let probe = null, hostileLeaves = null;
        try {
          await render(hostile);
          probe = JSON.parse(await evalExpr(send, CARD_PAINT_EXPRESSION));
          hostileLeaves = await measureLeaves();
        } catch (e) { /* falls through to the assertion below */ }
        const domReds = probe !== null && probe.dark.length > 0;
        /* BOTH INSTRUMENTS, and the tally is over their UNION on purpose. Some of these are caught
           only by the DOM questions and one only by the pixels; requiring each to be caught by a
           NAMED instrument would pin an implementation detail, while requiring that SOMETHING
           catches it is the property that matters. The per-case detail below says which did. */
        const pixReds = hostileLeaves !== null
          && hostileLeaves.filter((m) => (m.bytes * 1000) / m.area < FLAT_FLOOR
               || m.h < MIN_INK_H || m.area < MIN_INK_AREA).length > 0;
        const reds = domReds || pixReds;
        assert(`door-4 control: ${why} is caught${reds ? ` (${domReds ? "DOM" : ""}${domReds && pixReds ? "+" : ""}${pixReds ? "pixels" : ""})` : ""}`, reds,
          probe === null ? "the hostile render failed"
            : `neither instrument caught it: ${probe.total} audited elements all pass the DOM questions ` +
              `and every clipped figure still carries text`);
        if (reds) caught++;
      }
      assert("...every one of the bypasses is caught — selector shapes, off-screen mechanisms, overlays, a clip, two shrinks and three collapses",
        caught === BYPASSES.length, `${caught}/${BYPASSES.length}`);
    }
  } finally {
    try { ws?.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}
await main();
console.log(failures
  ? `\n${failures} INERT-FILTER/DOM EQUIVALENCE FAILURE(S)`
  : "\nALL INERT-FILTER/DOM EQUIVALENCE TESTS PASS (the filter and Chromium agree on every pinned case and on the live page)");
process.exit(failures ? 1 : 0);
