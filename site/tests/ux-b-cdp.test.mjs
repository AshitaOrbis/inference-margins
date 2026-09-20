// b9 UX-B — the §20 R-1/R-3/R-4 document explainers + the first REAL relocation, over CDP.
// Design contract: research/b9-ux-memo.md §17 (UX-B leg spec, gate-folded: 5 P0 / 8 P1 / 3 P2).
//
// WHAT THIS FILE IS FOR, AND THE CONTROLS THAT MAKE IT MEAN SOMETHING:
//   * UX-A shipped the relocation TRANSACTION vacuously (EXPLAIN.sources was always empty). UX-B is
//     the first leg where a failed restore can DELETE live report content, so U-18 fault-injects
//     both failure routes (placeholder lost, replaceWith throwing) and requires the source to
//     survive and the dialog NOT to be removed.
//   * U-26 carries a negative control for the coarse-pointer rule: without data-explain-ready the
//     native <summary> must still be operable, because keying that CSS on the media query alone
//     would hide the disclosure on a JS failure and make the whole report body unreachable.
//   * U-14b removes a mutation guard at runtime and requires the suite to notice.
//   * U-5 carries the defect this leg found in its own draft: every deep link into the report
//     targets #sN, whose <h3> sits OUTSIDE the <details>, so an ancestors-only handler opens
//     nothing. The negative control re-runs that arithmetic and must reproduce the collapsed body.
// Run: node site/tests/ux-b-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
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
  throw new Error("chrome did not expose DevToolsActivePort");
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
  throw new Error("no page target");
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
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 700));
  return r.result.value;
};

/* ---------------- structure, typography, naming ---------------- */
const PROBE_STATIC = `(() => {
  const r = {};
  const secs = [...document.querySelectorAll('#report > details.report-section')];
  r.sectionCount = secs.length;
  r.noneOpen = secs.every(d => !d.open);                                            // U-1
  r.bodiesNamed = secs.every(d => !!d.querySelector(':scope > .report-section-body'));
  const h3 = [...document.querySelectorAll('#report h3[id]')].filter(h => /^s\\d+$/.test(h.id));
  r.h3Count = h3.length;
  r.h3AllDirectChildren = h3.every(h => h.parentElement && h.parentElement.id === 'report');  // U-2
  r.h3NoneInsideDetails = h3.every(h => !h.closest('details'));
  // U-3 / U-4: computed style ON THE EXACT NODE asserted, never a container.
  const ink3 = 'rgb(136, 136, 136)';
  const cs = sel => { const el = document.querySelector(sel); if (!el) return null; const c = getComputedStyle(el);
    return { sel, font: c.fontSize, lh: c.lineHeight, color: c.color, maxW: c.maxWidth }; };
  document.querySelectorAll('#report > details.report-section').forEach(d => { d.open = true; });
  document.querySelectorAll('details.prov, details.scope-note.methods-box, #dossier, #board-catalog').forEach(d => { d.open = true; });
  r.styles = ['#rs-body-1 p', '#rs-body-10 .prov-body p', '#rs-body-10 .prov-body li',
              '.methods-box li', '.dossier-body li', '.board-catalog-body .board-note'].map(cs).filter(Boolean);
  r.anyInk3 = r.styles.filter(s => s.color === ink3).map(s => s.sel);                // U-4
  r.allMeasured = r.styles.every(s => s.maxW !== 'none');                            // U-3
  r.allLineHeight = r.styles.every(s => parseFloat(s.lh) / parseFloat(s.font) > 1.5);
  document.querySelectorAll('#report > details.report-section').forEach(d => { d.open = false; });
  return JSON.stringify(r);
})()`;

/* ---------------- triggers: registry, naming, survival ---------------- */
const PROBE_TRIGGERS = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const all = () => [...document.querySelectorAll('[data-explain]:not([data-fa-explain])')];
  r.registered = EXPLAIN_PAYLOADS.length;
  r.present = all().length;
  r.ids = all().map(b => b.dataset.explain);
  r.unique = new Set(r.ids).size === r.ids.length;                                   // U-9-adjacent
  r.everyPayloadHasATrigger = EXPLAIN_PAYLOADS.every(p => !p.anchor() || r.ids.includes(p.id));
  r.allNamed = all().every(b => (b.getAttribute('aria-label') || '').length > 'Deeper explanation'.length); // U-20
  r.allHavePopup = all().every(b => b.getAttribute('aria-haspopup') === 'dialog');
  r.readyFlag = document.documentElement.dataset.explainReady === '1';
  // trigger sits BEFORE its disclosure, so its position is stable in both states (design gate P0-1)
  r.beforeDisclosure = EXPLAIN_PAYLOADS.filter(p => p.anchor()).every(p => {
    const b = document.getElementById('explain-trigger-' + p.id);
    return b && b.nextElementSibling === p.anchor();
  });
  // U-25: trigger SURVIVAL across the rebuilds that destroy naive injections
  const before = all().length;
  fullRefresh(); await wait(120);
  r.afterFullRefresh = all().length;
  r.modelTriggerAlive = !!document.getElementById('explain-trigger-model-dossier');
  r.noDuplicatesAfter = new Set(all().map(b => b.id)).size === all().length;
  r.survived = r.afterFullRefresh >= before;
  // hidden mirroring (D-B5)
  const mc = document.getElementById('model-context'), mct = document.getElementById('explain-trigger-model-context');
  r.hiddenMirrored = !mc || !mct ? 'absent' : (mct.hidden === mc.hidden);
  return JSON.stringify(r);
})()`;

/* ---------------- relocation: identity, transaction, faults ---------------- */
const PROBE_RELOC = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const q = s => document.querySelector(s);
  const dialogs = () => document.querySelectorAll('dialog[data-explain-dialog]').length;
  const dupIds = () => { const seen = new Set(), dup = new Set();
    document.querySelectorAll('[id]').forEach(e => { if (seen.has(e.id)) dup.add(e.id); seen.add(e.id); }); return dup.size; };

  // ---- U-10 / U-18: identity + exact-position round trip on the worst payload ----
  const src = document.getElementById('rs-body-10');
  const parentBefore = src.parentElement.id, idxBefore = [...src.parentElement.childNodes].indexOf(src);
  const provCountBefore = src.querySelectorAll('details.prov').length;
  /* U-3b measures the payload IN PAGE first and compares the dialog against THAT. Hand-guessing the
     expected values is how you assert display:table for a table the page itself renders as
     display:block (it is a horizontally scrollable block by design, styles.css:489). */
  /* WHAT IS ASSERTED, and what deliberately is not. Structure and explicitly-styled leaf colour must
     survive relocation; inherited colour/size on CONTAINER nodes may change (that is .explain-body
     doing its job — every text node inside them carries its own rule), and grid TRACK WIDTHS are a
     function of the available width, which the dialog legitimately changes. Asserting those would
     be asserting that the legibility fix did not happen. */
  const cssSnap = () => {
    const g = sel => { const el = src.querySelector(sel); return el ? getComputedStyle(el) : null; };
    const tbl = g('table'), kk = g('.prov .kk'), badge = g('.evprofile .ev-h'),
          card = g('details.prov'), para = g('.prov .prov-body p'), th = g('th');
    return {
      tableDisplay: tbl && tbl.display,                       // block by design (a scrollable box), not a table box
      kkTracks: kk ? kk.gridTemplateColumns.split(' ').length : 0,   // two columns, widths may differ
      kkDisplay: kk && kk.display,
      badgeColor: badge && badge.color,                       // a leaf that sets its OWN colour
      cardBg: card && card.backgroundColor,                   // provider-card chrome
      cardBorder: card && card.borderTopWidth,
      paraColor: para && para.color,                          // leaf text
      thColor: th && th.color,
      thBorder: th && th.borderBottomWidth,
    };
  };
  const cssInPage = cssSnap();
  const loadOpBefore = [...src.querySelectorAll('a.load-op')].filter(a => typeof a.onclick === 'function').length;
  document.getElementById('explain-trigger-report-s10').click(); await wait(90);
  r.openPhase = EXPLAIN.phase;
  r.sameNodeInDialog = EXPLAIN.dialog && EXPLAIN.dialog.contains(src) && document.getElementById('rs-body-10') === src; // U-10
  r.oneDialog = dialogs() === 1;                                                     // U-11
  r.dupIdsWhileOpen = dupIds();                                                      // U-9
  r.sourcesRegistered = EXPLAIN.sources.length;
  r.loadOpAlive = [...src.querySelectorAll('a.load-op')].filter(a => typeof a.onclick === 'function').length; // U-17
  // U-3b: ancestor-dependent CSS re-established INSIDE the dialog (measured, not font-only)
  const cssInDialog = cssSnap();
  r.cssDrift = Object.keys(cssInPage).filter(k => cssInPage[k] !== cssInDialog[k])
    .map(k => ({ prop: k, page: cssInPage[k], dialog: cssInDialog[k] }));
  r.structurePreserved = r.cssDrift.length === 0;
  r.cssInPage = cssInPage;
  // U-18b: inner scroll offset of a descendant survives
  closeActiveExplain(); await wait(90);
  r.closedPhase = EXPLAIN.phase;
  r.restoredSameNode = document.getElementById('rs-body-10') === src;
  r.restoredParent = src.parentElement.id; r.restoredIdx = [...src.parentElement.childNodes].indexOf(src);
  r.positionExact = (r.restoredParent === parentBefore && r.restoredIdx === idxBefore);
  r.provIntact = src.querySelectorAll('details.prov').length === provCountBefore;
  r.loadOpAfter = [...src.querySelectorAll('a.load-op')].filter(a => typeof a.onclick === 'function').length === loadOpBefore;
  r.noOrphanPlaceholders = (() => { let c = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    while (w.nextNode()) if (w.currentNode.nodeValue === 'explain-src') c++; return c; })();
  r.dialogsAfter = dialogs();

  /* NEGATIVE CONTROL for U-3b: relocate the same payload into a wrapper WITHOUT its scope class.
     The ancestor-dependent rules at styles.css:464-549 stop matching and the payload breaks
     structurally — which is what makes carrying the scope class load-bearing rather than decorative. */
  explainOpen({ id: 'explain-unscoped-control', title: 'control', fa: false }, (body) => {
    const w = document.createElement('div'); w.className = 'explain-body';   // NO scope class
    body.appendChild(w); explainRelocate(document.getElementById('rs-body-10'), w);
  }, null);
  await wait(90);
  const unscoped = cssSnap();
  r.unscopedDrift = Object.keys(cssInPage).filter(k => cssInPage[k] !== unscoped[k]);
  closeActiveExplain(); await wait(80);

  // ---- U-18 nested: report §10 -> a provider dossier INSIDE it -> close ----
  const provBodyRef = document.querySelector('#prov-openai > .prov-body');   // capture BEFORE any relocation
  document.getElementById('explain-trigger-report-s10').click(); await wait(80);
  const provTrigger = document.getElementById('explain-trigger-prov-openai');
  r.provTriggerRodeIn = !!(EXPLAIN.dialog && EXPLAIN.dialog.contains(provTrigger));
  provTrigger.click(); await wait(90);
  const provBody = provBodyRef;
  r.nestedOneDialog = dialogs() === 1;
  r.nestedRightPayload = !!(EXPLAIN.dialog && EXPLAIN.dialog.contains(provBody));
  r.nestedOuterRestored = document.getElementById('rs-body-10') === src && src.parentElement.id === parentBefore;
  closeActiveExplain(); await wait(90);
  r.nestedAllRestored = document.querySelector('#prov-openai > .prov-body') === provBody   // matches again only once restored
    && provBody.parentElement.id === 'prov-openai'
    && document.getElementById('rs-body-10').parentElement.id === parentBefore
    && dialogs() === 0 && EXPLAIN.sources.length === 0;

  // ---- U-11: EVERY registered payload opens exactly its own dialog ----
  const bad = [];
  for (const p of EXPLAIN_PAYLOADS) {
    const btn = document.getElementById('explain-trigger-' + p.id);
    if (!btn || btn.hidden) continue;
    const node = p.src();                      // resolve BEFORE the move: several sources are named
    if (!node) { bad.push(p.id + ':no-source'); continue; }   // by selectors that stop matching once relocated
    btn.click(); await wait(45);
    const ok = dialogs() === 1 && EXPLAIN.phase === 'open' && EXPLAIN.dialog.contains(node);
    if (!ok) bad.push(p.id);
    closeActiveExplain(); await wait(35);
    if (!(node && node.isConnected && !document.querySelector('dialog[data-explain-dialog]'))) bad.push(p.id + ':restore');
  }
  r.payloadsTested = EXPLAIN_PAYLOADS.filter(p => { const b = document.getElementById('explain-trigger-' + p.id); return b && !b.hidden; }).length;
  r.payloadFailures = bad;
  r.finalDialogs = dialogs(); r.finalPhase = EXPLAIN.phase; r.finalSources = EXPLAIN.sources.length;
  return JSON.stringify(r);
})()`;

/* ---------------- U-18 FAULT INJECTION: the data-loss path UX-A could not have ---------------- */
const PROBE_FAULT = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const dialogs = () => document.querySelectorAll('dialog[data-explain-dialog]').length;

  // fault A: the placeholder is destroyed while the dialog is open -> coordinate fallback must run
  const srcA = document.getElementById('rs-body-3');
  const parentA = srcA.parentElement.id;
  document.getElementById('explain-trigger-report-s3').click(); await wait(80);
  EXPLAIN.sources.forEach(s => { if (s.placeholder && s.placeholder.parentNode) s.placeholder.remove(); });
  closeActiveExplain(); await wait(80);
  r.faultA = { restored: document.getElementById('rs-body-3') === srcA && srcA.parentElement.id === parentA,
               dialogs: dialogs(), phase: EXPLAIN.phase, sources: EXPLAIN.sources.length };

  // fault B: BOTH routes fail -> the source must SURVIVE and the dialog must NOT be removed
  const srcB = document.getElementById('rs-body-4');
  document.getElementById('explain-trigger-report-s4').click(); await wait(80);
  EXPLAIN.sources.forEach(s => {
    if (s.placeholder && s.placeholder.parentNode) s.placeholder.remove();
    s.parent = null;                       // recorded coordinates unusable too
  });
  const dlg = EXPLAIN.dialog;
  closeActiveExplain(); await wait(80);
  r.faultB = { sourceStillInDocument: srcB.isConnected,
               dialogKept: !!(dlg && dlg.isConnected),
               marked: !!(dlg && dlg.dataset.explainStranded === '1'),
               contentNotDeleted: srcB.textContent.trim().length > 1000 };
  // recovery: put it back by hand so the rest of the run is clean
  try { document.getElementById('rs-4').appendChild(srcB); if (dlg) dlg.remove(); } catch {}
  EXPLAIN.sources = []; EXPLAIN.dialog = null; EXPLAIN.phase = 'idle';
  document.body.style.overflow = '';
  return JSON.stringify(r);
})()`;

/* ---------------- U-14b: the mutation guards, with a control ---------------- */
const PROBE_GUARDS = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const check = async (payloadId, run) => {
    const btn = document.getElementById('explain-trigger-' + payloadId);
    if (!btn || btn.hidden) return 'absent';
    const node = EXPLAIN_PAYLOADS.find(p => p.id === payloadId).src();
    if (!node) return 'no-source';
    const homeId = node.parentElement.id;      // captured BEFORE the move — afterwards it is the dialog wrapper
    btn.click(); await wait(70);
    if (EXPLAIN.phase !== 'open') return 'did-not-open';
    try { run(); } catch (e) { return 'threw:' + e.message; }
    await wait(70);
    const back = node.isConnected && node.parentElement && node.parentElement.id === homeId;
    const clean = document.querySelectorAll('dialog[data-explain-dialog]').length === 0 && EXPLAIN.phase === 'idle';
    if (EXPLAIN.phase !== 'idle') closeActiveExplain();
    return back && clean;
  };
  r.renderBoard      = await check('board-catalog', () => renderBoard());
  r.renderFrontDoor  = await check('front-door',    () => renderFrontDoorDetail());
  r.renderAll        = await check('dossier',       () => renderAll());
  r.buildControls    = await check('model-dossier', () => buildControls());

  // NEGATIVE CONTROL: with the guard neutralised, the same probe must FAIL (i.e. not report true)
  const realGuard = window.explainGuardBeforeMutation;
  try {
    window.explainGuardBeforeMutation = () => {};
    r.controlWithoutGuard = await check('board-catalog', () => renderBoard());
  } finally { window.explainGuardBeforeMutation = realGuard; }
  if (EXPLAIN.phase !== 'idle') closeActiveExplain();
  return JSON.stringify(r);
})()`;

/* ---------------- U-5 / U-21: deep links, with the broken-draft control ---------------- */
const PROBE_HASH = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const vis = el => !!(el && el.checkVisibility && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true }) && el.offsetHeight > 0);
  document.querySelectorAll('#report > details.report-section').forEach(d => { d.open = false; });

  // NEGATIVE CONTROL: the draft's ancestors-only handler leaves the body collapsed.
  const naive = t => { const el = document.getElementById(t); for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true; };
  naive('s5');
  r.naiveLeavesCollapsed = !document.getElementById('rs-5').open && !vis(document.getElementById('rs-body-5'));

  // the shipped handler
  location.hash = '#s5'; await wait(140);
  r.s5Open = document.getElementById('rs-5').open && vis(document.getElementById('rs-body-5'));   // U-5
  r.s5Focused = document.activeElement === document.getElementById('s5');
  // a target genuinely nested inside a section body still needs the ancestor walk
  document.querySelectorAll('#report > details.report-section').forEach(d => { d.open = false; });
  location.hash = '#s10-normalized'; await wait(140);
  r.nestedVisible = vis(document.getElementById('s10-normalized'));
  // U-21: a hash change WHILE a dialog is open closes it, and the hash target wins
  location.hash = '#report'; await wait(80);
  document.querySelectorAll('#report > details.report-section').forEach(d => { d.open = false; });
  document.getElementById('explain-trigger-report-s7').click(); await wait(80);
  const wasOpen = EXPLAIN.phase === 'open';
  location.hash = '#s7'; await wait(160);
  r.hashClosedDialog = wasOpen && EXPLAIN.phase === 'idle' && document.querySelectorAll('dialog[data-explain-dialog]').length === 0;
  r.sourceRestoredOnHashNav = document.getElementById('rs-body-7').parentElement.id === 'rs-7';
  r.hashTargetWon = document.activeElement === document.getElementById('s7') && document.getElementById('rs-7').open;
  return JSON.stringify(r);
})()`;

/* ---------------- U-19: print ---------------- */
const PROBE_PRINT = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const secs = () => [...document.querySelectorAll('#report > details.report-section')];
  secs().forEach((d, i) => { d.open = (i === 2); });              // a distinctive reader state
  const snapshotBefore = secs().map(d => d.open);
  window.dispatchEvent(new Event('beforeprint'));
  await wait(60);
  const allOpen = secs().every(d => d.open);
  window.dispatchEvent(new Event('beforeprint'));                 // a repeat must not overwrite the snapshot
  await wait(30);
  window.dispatchEvent(new Event('afterprint'));
  await wait(60);
  const restored = secs().map(d => d.open);
  // an open dialog is closed for printing — declared, not silent
  document.getElementById('explain-trigger-report-s2').click(); await wait(70);
  const openedForPrint = EXPLAIN.phase === 'open';
  window.dispatchEvent(new Event('beforeprint')); await wait(60);
  const closedForPrint = EXPLAIN.phase === 'idle' && document.getElementById('rs-body-2').parentElement.id === 'rs-2';
  window.dispatchEvent(new Event('afterprint')); await wait(60);
  return JSON.stringify({ allOpen, snapshotBefore, restored,
    restoredExactly: JSON.stringify(snapshotBefore) === JSON.stringify(restored), openedForPrint, closedForPrint });
})()`;

/* ---------------- U-22: M6 <-> generic cross-ownership ---------------- */
const PROBE_M6 = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const dialogs = () => document.querySelectorAll('dialog[data-explain-dialog]').length;
  const r = {};
  const fa = document.querySelector('[data-fa-explain]');
  const methodsSrc = document.querySelector('details.scope-note.methods-box > ul');  // BEFORE relocation
  document.getElementById('explain-trigger-methods').click(); await wait(80);
  r.genericOpen = EXPLAIN.phase === 'open' && EXPLAIN.dialog.contains(methodsSrc);
  fa.click(); await wait(90);
  r.afterM6 = { dialogs: dialogs(), isFa: !!document.querySelector('dialog[data-fa-explain]'),
                sourceRestored: methodsSrc.parentElement && methodsSrc.parentElement.classList.contains('methods-box'),
                sourcesDrained: EXPLAIN.sources.length === 0 };
  closeActiveExplain(); await wait(80);
  r.afterClose = { dialogs: dialogs(), phase: EXPLAIN.phase, sources: EXPLAIN.sources.length };
  // reverse order
  fa.click(); await wait(80);
  document.getElementById('explain-trigger-methods').click(); await wait(90);
  r.reverse = { dialogs: dialogs(), generic: !document.querySelector('dialog[data-fa-explain]'),
                relocated: EXPLAIN.dialog.contains(methodsSrc) };
  closeActiveExplain(); await wait(80);
  r.reverseClosed = dialogs() === 0 && methodsSrc.parentElement.classList.contains('methods-box') && EXPLAIN.sources.length === 0;
  return JSON.stringify(r);
})()`;

/* ---------------- U-26: the coarse-pointer replacement, and its no-JS control ---------------- */
const PROBE_COARSE = `(() => {
  const r = { coarse: matchMedia('(pointer: coarse)').matches };
  const sum = document.querySelector('#rs-1 > summary');
  const trig = document.getElementById('explain-trigger-report-s1');
  r.readyFlag = document.documentElement.dataset.explainReady === '1';
  r.summaryHidden = getComputedStyle(sum).display === 'none';
  r.triggerVisible = !!trig && getComputedStyle(trig).display !== 'none';
  const tr = trig.getBoundingClientRect();
  r.triggerTouchTarget = tr.height >= 44;
  // NEGATIVE CONTROL: without the JS-enhancement flag the native disclosure must remain operable,
  // or a JS failure on mobile would make the entire report body unreachable.
  delete document.documentElement.dataset.explainReady;
  r.summaryOperableWithoutJsFlag = getComputedStyle(sum).display !== 'none';
  document.documentElement.dataset.explainReady = '1';
  return JSON.stringify(r);
})()`;

async function withPage(fn, emulate) {
  const userDir = mkdtempSync(join(tmpdir(), "im-ux-b-cdp-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + userDir,
    "file://" + HTML], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    if (emulate) {
      await send("Emulation.setDeviceMetricsOverride", { ...emulate, deviceScaleFactor: 2, mobile: true });
      await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await send("Page.enable"); await send("Page.reload", { ignoreCache: true }); await sleep(700);
    }
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      if (await evalExpr(send, "(document.readyState!=='loading' && typeof EXPLAIN==='object' && typeof EXPLAIN_PAYLOADS==='object' && !!document.getElementById('rs-body-1'))")) { ready = true; break; }
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
  if (!HTML) { assert("locate site/index.html", false); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }

  await withPage(async (send, ready) => {
    assert("structure: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_STATIC));
    assert("U-1 all ten report sections are <details>, NONE open at first paint", r.sectionCount === 10 && r.noneOpen, JSON.stringify({ n: r.sectionCount, noneOpen: r.noneOpen }));
    assert("U-1 …each names its body with a single relocatable .report-section-body", r.bodiesNamed);
    assert("U-2 every <h3 id=\"sN\"> is a DIRECT CHILD of #report, outside its <details> (the MCP contract)",
      r.h3Count === 10 && r.h3AllDirectChildren && r.h3NoneInsideDetails, JSON.stringify(r));
    assert("U-3 every asserted explanatory node has a finite measure (on the node itself, not a container)",
      r.allMeasured, JSON.stringify(r.styles));
    assert("U-3 …and a line-height above 1.5", r.allLineHeight, JSON.stringify(r.styles.map(s => s.sel + " " + s.lh + "/" + s.font)));
    assert("U-4 no enumerated explanatory selector still computes at --ink-3", r.anyInk3.length === 0, r.anyInk3.join(", "));
  }, null);

  await withPage(async (send, ready) => {
    assert("triggers: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_TRIGGERS));
    assert("U-11 every registered payload with a live anchor has exactly one trigger",
      r.everyPayloadHasATrigger && r.unique, JSON.stringify({ registered: r.registered, present: r.present }));
    assert("U-20 every trigger carries an accessible name naming its own payload", r.allNamed);
    assert("U-20 …and declares aria-haspopup=dialog", r.allHavePopup);
    assert("D-B2 every trigger sits BEFORE its disclosure, not after it", r.beforeDisclosure);
    assert("D-B3 the JS-enhancement flag is set only after triggers exist", r.readyFlag);
    assert("U-25 triggers SURVIVE fullRefresh() (SECTION_INJECT rescues only three ids)",
      r.survived && r.modelTriggerAlive, JSON.stringify({ after: r.afterFullRefresh, model: r.modelTriggerAlive }));
    assert("U-25 …with no duplicates re-injected", r.noDuplicatesAfter);
    assert("D-B5 a hideable panel's trigger mirrors its `hidden`", r.hiddenMirrored === true || r.hiddenMirrored === "absent", String(r.hiddenMirrored));
  }, null);

  await withPage(async (send, ready) => {
    assert("relocation: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_RELOC));
    assert("U-10 the dialog holds the SAME live node (relocated, not cloned)", r.sameNodeInDialog);
    assert("U-11 exactly one dialog page-wide while open", r.oneDialog);
    assert("U-9 zero duplicate ids while a payload is relocated", r.dupIdsWhileOpen === 0, String(r.dupIdsWhileOpen));
    assert("U-17 handlers on relocated controls survive the move", r.loadOpAlive > 0, String(r.loadOpAlive));
    assert("U-3b ancestor-dependent CSS is re-established INSIDE the dialog (table/grid/card chrome/badge/leaf colour)",
      r.structurePreserved, JSON.stringify(r.cssDrift));
    assert("U-3b NEGATIVE CONTROL: an UNSCOPED wrapper breaks the payload structurally (the scope class is load-bearing)",
      r.unscopedDrift.length >= 3, JSON.stringify({ drift: r.unscopedDrift, inPage: r.cssInPage }));
    console.log("      [control detail] unscoped drift:", JSON.stringify(r.unscopedDrift));
    assert("U-10 close restores the same node to its EXACT original position",
      r.restoredSameNode && r.positionExact, JSON.stringify({ p: r.restoredParent, i: r.restoredIdx }));
    assert("U-18 …with content intact and every handler still bound", r.provIntact && r.loadOpAfter);
    assert("U-18 …leaving no dialog and no orphan placeholder", r.dialogsAfter === 0 && r.noOrphanPlaceholders === 0,
      JSON.stringify({ d: r.dialogsAfter, ph: r.noOrphanPlaceholders }));
    assert("U-18 NESTED: a provider trigger rides into the §10 dialog with its section", r.provTriggerRodeIn);
    assert("U-18 …and opening it restores §10 first, then relocates the provider body",
      r.nestedOneDialog && r.nestedRightPayload && r.nestedOuterRestored,
      JSON.stringify({ one: r.nestedOneDialog, right: r.nestedRightPayload, outer: r.nestedOuterRestored }));
    assert("U-18 …closing leaves BOTH sources home and the registry drained", r.nestedAllRestored);
    assert("U-11 EVERY registered payload opens its own dialog and restores cleanly",
      r.payloadFailures.length === 0 && r.payloadsTested >= 18,
      `${r.payloadsTested} tested; failures: ${r.payloadFailures.join(", ")}`);
    assert("U-11 …and the page ends idle: no dialog, no registered source", r.finalDialogs === 0 && r.finalPhase === "idle" && r.finalSources === 0);
  }, null);

  await withPage(async (send, ready) => {
    assert("fault injection: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_FAULT));
    assert("U-18 FAULT A: a lost placeholder falls back to the recorded coordinates and restores",
      r.faultA.restored && r.faultA.dialogs === 0 && r.faultA.phase === "idle", JSON.stringify(r.faultA));
    assert("U-18 FAULT B: with BOTH restore routes broken the source SURVIVES in the document",
      r.faultB.sourceStillInDocument && r.faultB.contentNotDeleted, JSON.stringify(r.faultB));
    assert("U-18 FAULT B: …and the dialog is KEPT and marked rather than deleting page content",
      r.faultB.dialogKept && r.faultB.marked, JSON.stringify(r.faultB));
  }, null);

  await withPage(async (send, ready) => {
    assert("guards: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_GUARDS));
    for (const [name, v] of [["renderBoard", r.renderBoard], ["renderFrontDoorDetail", r.renderFrontDoor],
                             ["renderAll", r.renderAll], ["buildControls", r.buildControls]]) {
      assert(`U-14b ${name}() while its payload is open restores the source and closes cleanly`,
        v === true || v === "absent", String(v));
    }
    assert("U-14b NEGATIVE CONTROL: with the guard neutralised the same probe does NOT report clean",
      r.controlWithoutGuard !== true, String(r.controlWithoutGuard));
  }, null);

  await withPage(async (send, ready) => {
    assert("hash: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_HASH));
    assert("U-5 NEGATIVE CONTROL: the ancestors-only handler leaves §5's body collapsed (the draft defect)",
      r.naiveLeavesCollapsed);
    assert("U-5 a deep link to #s5 — M6's own shipped citation — opens the section and reveals its body", r.s5Open);
    assert("U-5 …and moves focus to the hash target", r.s5Focused);
    assert("U-5 a target nested INSIDE a section body is revealed by the ancestor walk", r.nestedVisible);
    assert("U-21 a hash change while a dialog is open closes it and restores the source",
      r.hashClosedDialog && r.sourceRestoredOnHashNav, JSON.stringify({ c: r.hashClosedDialog, s: r.sourceRestoredOnHashNav }));
    assert("U-21 …and the HASH TARGET, not the old trigger, is the final destination", r.hashTargetWon);
  }, null);

  await withPage(async (send, ready) => {
    assert("print: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_PRINT));
    assert("U-19 beforeprint opens all ten sections", r.allOpen);
    assert("U-19 afterprint restores the reader's exact open-state snapshot (repeat events do not clobber it)",
      r.restoredExactly, JSON.stringify({ before: r.snapshotBefore, after: r.restored }));
    assert("U-19 an open dialog is closed for printing and its source returned to the page (declared destructive transition)",
      r.openedForPrint && r.closedForPrint, JSON.stringify(r));
  }, null);

  await withPage(async (send, ready) => {
    assert("M6 ownership: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_M6));
    assert("U-22 a generic relocated payload opens", r.genericOpen);
    assert("U-22 generic -> M6 leaves exactly ONE dialog, the M6 one, with the source restored",
      r.afterM6.dialogs === 1 && r.afterM6.isFa && r.afterM6.sourceRestored && r.afterM6.sourcesDrained, JSON.stringify(r.afterM6));
    assert("U-22 …and closing leaves none, phase idle, registry drained",
      r.afterClose.dialogs === 0 && r.afterClose.phase === "idle" && r.afterClose.sources === 0, JSON.stringify(r.afterClose));
    assert("U-22 M6 -> generic also leaves exactly one dialog, the generic one, holding the live node",
      r.reverse.dialogs === 1 && r.reverse.generic && r.reverse.relocated, JSON.stringify(r.reverse));
    assert("U-22 …and closing that restores the source and drains the registry", r.reverseClosed);
  }, null);

  await withPage(async (send, ready) => {
    assert("coarse pointer: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_COARSE));
    assert("U-26 the emulated pointer really is coarse (the probe is not vacuous)", r.coarse);
    assert("U-26 R-2 enacted: on a coarse pointer the inline disclosure control is hidden", r.summaryHidden, JSON.stringify(r));
    assert("U-26 …and the popup trigger is visible in its place", r.triggerVisible);
    assert("U-26 …at a >=44px touch target", r.triggerTouchTarget);
    assert("U-26 NEGATIVE CONTROL: without the JS-enhancement flag the native disclosure stays operable",
      r.summaryOperableWithoutJsFlag, "a JS failure on mobile would otherwise make the whole report body unreachable");
  }, { width: 390, height: 844 });

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
  console.log(failures ? `\n${failures} UX-B CDP FAILURE(S)` : "\nALL UX-B CDP CHECKS PASS");
  process.exitCode = failures === 0 ? 0 : 1;
}
