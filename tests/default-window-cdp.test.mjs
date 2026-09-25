// THE ONE WINDOW, THE READER'S DEFAULT, AND THE CALCULATION ON THE FACE — over CDP.
// Owner voice note note-20260912T180812Z-c9eaac (2026-09-12T18:08Z): one window, GPT Pro's scenario
// highlighted as the default, swappable, and "a button on every assumption to set as the defaults".
// Burn-queue bq-2345: both operands and the division on the headline face, the four mandatory
// qualifiers unfolded, and an honest "Engine result" sentence.
//
// Each row runs against the page itself in a fresh Chrome profile (one profile per run, so reloads
// see what this run stored and nothing else):
//   W-1  a first visit opens on the page default; the window names it, marks it Default, highlights.
//   W-2  the face shows both operands, the division built from THOSE operands, the engine result at one
//        decimal equal to the page's own full-precision margin, and the four mandatory qualifiers — all
//        visible without opening anything (nothing counted as visible inside a closed <details>).
//   W-3  swapping to Fable in the window changes name, billing treatment, operands and result together,
//        and the default highlight goes away because Fable is not the default.
//   W-4  every scenario in the window's list offers set-as-default except the default, which is named;
//        the estimate and stress cards carry set-as-default buttons.
//   W-4u UNIVERSAL, no exception (Astra round 6 F4, F5, F7): five full sweeps of EVERY model the selector offers (the
//        Custom model included) x EVERY scenario (native traffic, an explicit non-native profile, a Custom traffic mix, a
//        stored reader default, and every state after a slider edit), each state checked to be the one asked for and every
//        id set compared exactly. The window's list carries set-as-default on every scenario except the one this browser
//        opens on, which is named instead. The scenario on screen, edited or not, carries its own control unless it is that
//        opening scenario, and what the test changed (traffic mix, edits) is disclosed. No refusal sentence anywhere.
//        W-4n proves in the same run that the checker is not vacuous: removed controls (list, row, edited row) and a
//        stripped disclosure are each reported.
//   W-5  CONTROL FIRST: a reload after a swap does NOT move the opening scenario, so what moves it in the
//        next step is the stored default. Then Fable is set as default and a reload opens on Fable.
//   W-6  a shared link opens what it names even with a reader default stored, and never writes the key.
//   W-7  restoring the page default clears the key; a reload opens on the page default again.
//   W-8  a stored scenario id the page does not carry is ignored, never half-applied.
//   W-9  no stale calculation: on a state with no computed headline the calculation block is hidden and empty.
//   W-10 at a 390 px phone width the window and the calculation do not overflow horizontally.
//   W-11 the dated 83.06 -> 82.42 comparison stays scoped to Opus / Reference on another model or traffic mix.
//   W-12 a reader default on a verified-placement model keeps that model's own labels (Astra r2 F10).
//   W-13 the Custom model's scenarios are defaults like any other model's: set from the row, a reload reopens Custom on
//        that scenario with the numbers and labels reaching it by hand produced; set from the list while edited, the
//        confirmation says the edits are not part of a default; a shared link still wins; an unknown model id is refused,
//        never replaced. (Gate verdict 20260912T212606Z: round 2 F6's refusal left every offered scenario on Custom
//        without a control, and the old W-13 rewarded that.)
//   W-14 a non-native traffic mix is disclosed before success: in the row control's label and in the confirmation (F8).
//   W-15 a locked replay's default is judged on its effective mix (r3 F8). W-16 an edited lens is never called the
//        unedited preset's reading (r3 F2). W-17 the final answer names the built-in opening state (r3 F9).
//   W-18 state that S does not show (round 6 F2, F6): a custom fleet with the preset's blend and other rents, an unlocked
//        interlock, a parameter-count case left custom. None is marked default; the control and the confirmation name
//        what a default does not keep; the reload reopens the scenario's own settings.
//        (d) a forced incompatible pairing and (e) the preset fleet identity kept after a swap (round 7 F3, F4).
//   W-19 a saved scenario keeps the lens it was saved from as its base, so its row offers that scenario (round 7 F7).
//   Controls count only when a reader can use them (visible, enabled, wired; round 7 F10); representative activations are
//   real CDP mouse input; W-4n also proves a sweep carries a failure to its verdict (round 7 F9).
//   Round 8: every control's TARGET is checked (setReaderDefault intercepted, nothing stored) and ancestors' opacity and
//   pointer-events count (F9); W-4n propagates row and refusal failures through the real sweep (F8); W-19 follows a saved
//   lens through Save-again and Share (F5); W-20 covers an equal-valued traffic selection and a typed scenario name (F6).
//   Round 9: a control's save is checked at BOTH boundaries (helper and storage) and the real save path is exercised for every
//   target on every model with writes swallowed (F5); clipped and unreadable controls are unusable and every control is hit-tested
//   at its centre once per model per sweep (F6); W-19 adds the link recipient's save (F4); W-20 adds type -> Save (F3).
//   Round 10: the real save path runs for every control on EVERY state and is verified by its EFFECT on the whole of localStorage
//   (snapshot, settle, compare, restore), so named-property, clear and queued writes are seen whatever API they use (F5-F7); every
//   control is hit-tested on every state (F8). A write deferred beyond the settle window is out of reach of a browser verifier.
//   Round 11: the controls a state offers are recorded on entry and each is activated exactly once (F3); storage snapshots are
//   Maps and sentinel keys named __proto__, constructor and toString ride every sweep (F4); the stored default is read after
//   every activation and again after a timer turn, before anything is restored, so a rollback cannot hide behind cleanup (F5).
//   Round 12: every control gets its own complete observation window (restore and re-render, activate, read, one timer turn, read
//   again) before the next control runs, so a deferred write is judged against the control that scheduled it (F3); a browser that
//   dies mid-sweep rejects its pending calls and each concurrent sweep is time-bounded, so it fails instead of hanging (F6).
//   Local runs serve the site over a loopback http server, not file: (round 6 F11, diagnosed; see serveSite below).
//
// Run: node tests/default-window-cdp.test.mjs
//      node tests/default-window-cdp.test.mjs --url https://margins.ashitaorbis.com/ --only window|swap|set-default
import { spawn, execSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, existsSync, readFileSync, readFile } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const argOf = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const LIVE_URL = argOf("--url");
const ONLY = argOf("--only");
const want = mode => !ONLY || ONLY === mode;

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + String(detail).slice(0, 400)}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
/* Astra round 6 F11, diagnosed by instrumented repeats (reports/im-default-controls-tail-2026-09-12/evidence/f11-diagnosis/).
   On a file: URL, headless Chrome sometimes handed a reloaded document a localStorage snapshot from BEFORE the previous
   document's last writes: 2 of 30 store-then-reload rounds. The instrumented Storage methods recorded no removeItem or
   clear, and the new document's very first read already held the older value. The same bytes over http://127.0.0.1
   (0 of 30) and the live https origin (0 of 30) never did. So a local run serves the site over a loopback http server,
   the same kind of origin the gate's live run uses, rather than from file:. No wait and no retry. */
const TYPES = Object.freeze({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8" });
function serveSite(root) {
  return new Promise((ok, fail) => {
    const srv = createServer((req, res) => {
      let rel;
      try { rel = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname); } catch { res.writeHead(400); res.end(); return; }
      if (rel.endsWith("/")) rel += "index.html";
      const file = resolve(root, "." + rel);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
      readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
        res.end(buf);
      });
    });
    srv.on("error", fail);
    srv.listen(0, "127.0.0.1", () => { srv.unref(); ok(`http://127.0.0.1:${srv.address().port}/index.html`); });
  });
}
let BASE = LIVE_URL;
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
  let id = 0, closed = null; const pending = new Map();
  ws.addEventListener("message", ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  /* Astra round 12 F6: a browser that dies mid-run must fail its caller, not leave every pending call waiting forever. */
  const failAll = why => { if (closed) return; closed = why; for (const [, cb] of pending) cb({ error: { message: why } }); pending.clear(); };
  ws.addEventListener("close", () => failAll("the browser connection closed"));
  ws.addEventListener("error", () => failAll("the browser connection failed"));
  return (method, params = {}) => new Promise((resolve, reject) => {
    if (closed) { reject(new Error(method + ": " + closed)); return; }
    const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result.value;
};
const READY = "(document.readyState === 'complete' && typeof renderScenarioWindow === 'function' && !!document.querySelector('#win-head .win-name') && !window.__imNav)";
/* A navigation is complete only when the OLD document is gone: the marker lives on the old window object. */
async function go(send, url) {
  try { await evalExpr(send, "window.__imNav = true"); } catch {}
  await send("Page.navigate", { url });
  for (let t = 0; t < 30000; t += 150) {
    try { if (await evalExpr(send, READY)) return true; } catch {}
    await sleep(150);
  }
  return false;
}
async function reload(send) {
  try { await evalExpr(send, "window.__imNav = true"); } catch {}
  await send("Page.reload", { ignoreCache: true });
  for (let t = 0; t < 30000; t += 150) {
    try { if (await evalExpr(send, READY)) return true; } catch {}
    await sleep(150);
  }
  return false;
}
const click = async (send, sel) => {
  const ok = await evalExpr(send, `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true; })()`);
  await sleep(350);
  return ok;
};

/* A keyboard user's activation: the control has focus when it fires. A bare .click() leaves focus on <body>
   and could not show that focus survives the window's rebuild. */
const focusClick = async (send, sel) => {
  const ok = await evalExpr(send, `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.focus(); b.click(); return true; })()`);
  await sleep(350);
  return ok;
};

/* Astra round 7 F10: a reader's activation, by real input. The control is scrolled into view, must be enabled and be the element
   under its own centre (visible, not covered), and receives a CDP mouse press and release there, not a DOM .click(). The scroll is
   INSTANT: styles.css sets html { scroll-behavior: smooth }, and a smooth scroll leaves the box measured where it was before. */
const pressControl = async (send, sel) => {
  const at = await evalExpr(send, `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return { why: "no such control" };
    if (b.disabled) return { why: "disabled" };
    b.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }); const r = b.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return { why: "no box" };
    const x = r.left + r.width / 2, y = r.top + r.height / 2, hit = document.elementFromPoint(x, y);
    return hit && (hit === b || b.contains(hit)) ? { x, y } : { why: "covered by " + (hit ? hit.tagName + "." + String(hit.className).slice(0, 40) : "nothing (outside the viewport)") }; })()`);
  if (!at || at.why) { console.log(`#   pressControl ${sel}: ${at ? at.why : "no answer"}`); return false; }
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x, y: at.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: at.x, y: at.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: at.x, y: at.y, button: "left", clickCount: 1 });
  await sleep(350);
  return true;
};

const PROBE = `(() => {
  const q = s => document.querySelector(s);
  const txt = s => (q(s) ? q(s).textContent.trim() : null);
  const visible = el => {
    if (!el) return false;
    for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS' && !p.open) return false;
    if (el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  };
  const wl = appWorkload(S);
  const nameEl = q('#win-head .win-name');
  return JSON.stringify({
    persp: q('#persp-preset').value, model: q('#model-preset').value,
    name: txt('#win-head .win-name-scenario'), namePersp: nameEl ? nameEl.dataset.persp : null,
    badge: txt('#win-head .win-badge'), tileDefault: q('.tile-hero').classList.contains('win-default'),
    billing: txt('#win-head .win-billing'), basis: txt('#win-head .win-basis'), lead: txt('#win-head .win-lead'),
    restore: !!q('#win-head .win-restore'), setHere: !!q('#win-head .win-default-row .win-set-default'),
    setHereText: txt('#win-head .win-default-row .win-set-default'),
    note: txt('#win-note'),
    cost: txt('#out-calc .calc-cost .calc-op-value'), bill: txt('#out-calc .calc-billings .calc-op-value'),
    eq: txt('#out-calc .calc-eq'), engine: txt('#out-calc .calc-engine'), calcHidden: q('#out-calc').hidden,
    calcText: q('#out-calc').textContent,
    heroTitle: q('#out-margin').title || '',
    calcDisplay: getComputedStyle(q('#out-calc')).display, calcHeight: q('#out-calc').getBoundingClientRect().height,
    trafficMode: TRAFFIC.mode, defaultRowText: txt('#win-head .win-default-row'),
    marginNote: (q('#out-margin-note') || {}).textContent || '',
    hero: q('#out-margin').textContent,
    margin: wl.margin * 100, fmtCost: isFinite(wl.costMix) ? fmt$(wl.costMix) : null, fmtBill: isFinite(wl.priceMix) ? fmt$(wl.priceMix) : null,
    qualifiers: {
      gm: visible(q('.tile-hero .tile-gm')) && /Not a company gross margin/.test(txt('.tile-hero .tile-gm') || ''),
      rent: visible(q('#out-rent-segment')) && (txt('#out-rent-segment') || '').length > 0,
      analyst: visible(q('#out-margin-unanchored')) && (txt('#out-margin-unanchored') || '').length > 0,
      /* bq-3316 M2: the policy label is the value's own status label, its next sibling in the tile. */
      policy: visible(q('#out-margin-status')) && q('#out-margin').nextElementSibling === q('#out-margin-status')
        && /policy-labeled scenario/.test(q('#out-margin-status').textContent),
    },
    calcVisible: visible(q('#out-calc .calc-eq')) && visible(q('#out-calc .calc-cost')) && visible(q('#out-calc .calc-billings')) && visible(q('#out-calc .calc-engine')),
    windowVisible: visible(q('#win-head .win-name')) && visible(q('#win-head .win-swap')),
    swapButtons: [...document.querySelectorAll('#win-head .win-swap-btn')].map(b => ({ id: b.dataset.persp, pressed: b.getAttribute('aria-pressed') })),
    allItems: [...document.querySelectorAll('#win-head .win-all-item')].map(li => ({ id: li.dataset.persp, set: !!li.querySelector('.win-set-default'), isDefault: !!li.querySelector('.win-is-default') })),
    perspIds: PERSPECTIVES.map(p => p.id), pageDefault: LANDING_DEFAULT_PERSP_ID,
    cardButtons: [...document.querySelectorAll('button.set-default-btn')].map(b => ({ persp: b.dataset.setDefaultPersp, text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed') })),
    stored: (() => { try { return localStorage.getItem('im_default_scenario_v1'); } catch { return 'STORAGE-THREW'; } })(),
    focusId: document.activeElement ? document.activeElement.id : null,
    focusCls: document.activeElement ? String(document.activeElement.className) : null,
    focusPersp: document.activeElement && document.activeElement.dataset ? (document.activeElement.dataset.persp || null) : null,
    heroLiveFree: document.querySelector('.tile-hero [aria-live]') === null,
    overflow: { doc: document.documentElement.scrollWidth, vw: innerWidth,
      win: q('#win-head') ? Math.ceil(q('#win-head').getBoundingClientRect().right) : null,
      calc: q('#out-calc') && !q('#out-calc').hidden ? Math.ceil(q('#out-calc').getBoundingClientRect().right) : null },
  });
})()`;
const probe = async send => JSON.parse(await evalExpr(send, PROBE));

async function withBrowser(fn) {
  const userDir = mkdtempSync(join(tmpdir(), "im-default-window-cdp-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank"], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable"); await send("Page.enable");
    return await fn(send);
  } finally {
    try { ws && ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

/* The face's arithmetic, checked against the page's OWN full-precision state rather than a pinned figure,
   so an engine move re-derives this row instead of stranding it. */
function checkFace(tag, s) {
  assert(`${tag} both operands are the formatted values of the same state the result came from`,
    s.cost === s.fmtCost && s.bill === s.fmtBill, JSON.stringify({ cost: s.cost, fmtCost: s.fmtCost, bill: s.bill, fmtBill: s.fmtBill }));
  assert(`${tag} the division line is built from those operands`,
    s.eq === `1 − ${s.fmtCost} cost ÷ ${s.fmtBill} billings`, s.eq);
  assert(`${tag} the engine result is the full-precision margin at one decimal, with the rounding sentence`,
    s.engine === `Engine result: ${s.margin.toFixed(1)}%. Dollar amounts above are rounded.`, s.engine);
  assert(`${tag} no false '= NN%' is appended to the rounded operands`, !/=\s*-?\d/.test(s.eq || ""), s.eq);
  assert(`${tag} the hero's whole-point value agrees with the engine result`,
    s.hero.startsWith("≈" + Math.round(s.margin) + "%"), s.hero);
  assert(`${tag} the calculation is visible without opening anything`, s.calcVisible && !s.calcHidden);
}

async function main() {
  if (!BASE && HTML) BASE = await serveSite(resolve(dirname(HTML)));
  if (!BASE) { assert("locate site/index.html", false); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  console.log(`# target: ${BASE}${ONLY ? "  (only: " + ONLY + ")" : ""}`);

  await withBrowser(async send => {
    assert("W-0 page initialised", await go(send, BASE));
    const s1 = await probe(send);

    if (want("window")) {
      assert("W-1 a first visit opens on the page default", s1.persp === s1.pageDefault && s1.model === "opus", JSON.stringify({ persp: s1.persp, model: s1.model }));
      assert("W-1 the page default is GPT-5.6 Pro's scenario", s1.pageDefault === "gptpro-r3", s1.pageDefault);
      assert("W-1 the window names the scenario it shows", s1.namePersp === "gptpro-r3" && s1.name === "GPT-5.6 Pro estimate", JSON.stringify({ name: s1.name, namePersp: s1.namePersp }));
      assert("W-1 ...and marks it as the default, highlighted", s1.badge === "★ Default" && s1.tileDefault === true, JSON.stringify({ badge: s1.badge, tileDefault: s1.tileDefault }));
      assert("W-1 nothing is stored on a first visit", s1.stored === null, s1.stored);
      assert("W-1 the window states lead, cost basis and billing treatment",
        s1.lead === "Assumed algorithmic lead: 2 months" && /^Cost basis: \S/.test(s1.basis || "") && s1.billing === "Billing: undiscounted list price"  /* re-minted 2026-09-20 (im-vet-six-repairs, Astra fold): the N1 vocabulary release retires "list tariff" for "list price", and the old checker scope had missed this app.js string. Wording only — the billing treatment is unchanged. */,
        JSON.stringify({ lead: s1.lead, basis: s1.basis, billing: s1.billing }));
      assert("W-1 the window is visible without opening anything", s1.windowVisible);
      assert("W-1 the hero tile carries no live region (the §18.6 invariant the window must keep)", s1.heroLiveFree);
      checkFace("W-2", s1);
      assert("W-2 all four mandatory qualifiers are unfolded on the face (not a company gross margin, rent segment, analyst-input share, policy label)",
        Object.values(s1.qualifiers).every(Boolean), JSON.stringify(s1.qualifiers));
      if (!LIVE_URL) {
        const E = require("../site/engine.js");
        const opus = E.MODELS.find(m => m.id === "opus");
        const expected = E.workload(E.applyPresetSettings(opus, E.PERSPECTIVES.find(p => p.id === "gptpro-r3"), { mode: "explicit", profileId: "reference" })).margin * 100;
        assert("W-2 the page's margin equals the engine's gptpro-r3 execution in node", Math.abs(expected - s1.margin) < 1e-9, `${expected} vs ${s1.margin}`);
      }
    }

    if (want("window")) {
      /* W-11 (Astra round 1, F1): the dated comparison is scoped to where the figure was stated. On another
         model or another traffic mix the stated-reading panel must still state the Opus / Reference move,
         and must never attribute the new object's own difference to calculator changes. Expected values are
         computed in the page from its own engine, not pinned. */
      const sc = JSON.parse(await evalExpr(send, `(() => {
        const read = () => ((document.getElementById("out-stated-reading") || {}).textContent || "");
        const p = PERSPECTIVES.find(x => x.id === "gptpro-r3"), aa = p.statedReading.authoredAgainst;
        const at = workload(applyPresetSettings(MODELS.find(m => m.id === aa.model), p, { mode: "explicit", profileId: aa.profileId })).margin * 100;
        const out = { moved: "moved that reading " + (at < aa.computed ? "down" : "up") + " by " + Math.abs(aa.computed - at).toFixed(2) + " points", then: aa.computed, at };
        out.onOpus = read();
        const other = MODELS.find(m => m.id !== "opus" && m.id !== "custom" && pairingSeverity(m, p) !== "hard");
        $("model-preset").value = other.id; $("persp-preset").value = "gptpro-r3"; applyPreset();
        out.otherModel = other.id; out.onOther = read(); out.otherPct = workload(S).margin * 100;
        $("model-preset").value = "opus"; $("persp-preset").value = "gptpro-r3"; applyPreset();
        const ts = $("traffic-preset");
        /* Not the current mix and not Reference: for Opus the native mix IS Reference, so picking it moves nothing
           and the row would pass without testing anything. */
        const alt = [...ts.options].find(o => o.value && !o.disabled && o.value !== ts.value && !/^(reference|native)$/i.test(o.value));
        if (alt) { ts.value = alt.value; ts.dispatchEvent(new Event("input", { bubbles: true })); ts.dispatchEvent(new Event("change", { bubbles: true })); }
        out.altTraffic = alt ? alt.value : null; out.trafficPct = workload(S).margin * 100; out.onTraffic = read();
        return JSON.stringify(out);
      })()`));
      assert("W-11 on the page default the stated-reading panel states the authored-scope move", sc.onOpus.includes(sc.moved), sc.onOpus.slice(0, 400));
      assert(`W-11 on ${sc.otherModel} the panel still states the Opus / Reference move`, sc.onOther.includes(sc.moved) && /At its authored settings \(Claude Opus 4\.x/.test(sc.onOther), sc.onOther.slice(0, 400));
      assert(`W-11 on ${sc.otherModel} the older gap clause is stated at the estimate's own settings and names the on-screen object (Astra round 2 F2)`,
        sc.onOther.includes("from their vector at its own settings (") && sc.onOther.includes("Applied unedited to the model and traffic mix selected now, these settings read"), sc.onOther.slice(0, 600));
      assert(`W-11 ...and never attributes ${sc.otherModel}'s own difference to calculator changes`,
        Math.abs(Math.abs(sc.then - sc.otherPct) - Math.abs(sc.then - sc.at)) < 0.005 || !sc.onOther.includes("moved that reading " + (sc.otherPct < sc.then ? "down" : "up") + " by " + Math.abs(sc.then - sc.otherPct).toFixed(2)),
        JSON.stringify({ otherPct: sc.otherPct, at: sc.at }));
      assert("W-11 a different traffic mix is available to test against, and moves the reading", !!sc.altTraffic && Math.abs(sc.trafficPct - sc.at) > 0.005, JSON.stringify({ alt: sc.altTraffic, trafficPct: sc.trafficPct, at: sc.at }));
      assert("W-11 on another traffic mix the panel still states the authored-scope move", sc.onTraffic.includes(sc.moved), sc.onTraffic.slice(0, 400));
      assert("W-11 back to a clean page", await go(send, BASE.split("?")[0]));
    }

    if (want("swap")) {
      assert("W-3 the window offers the four primary swaps", ["gptpro-r3", "fable-r3", "stress-public-rate", "median"].every(id => s1.swapButtons.some(b => b.id === id)), JSON.stringify(s1.swapButtons));
      assert("W-3 clicking Fable in the window swaps in place", await focusClick(send, '#win-head .win-swap-btn[data-persp="fable-r3"]'));
      const s3 = await probe(send);
      assert("W-3 keyboard focus survives the rebuild, on the same swap control",
        /\bwin-swap-btn\b/.test(s3.focusCls || "") && s3.focusPersp === "fable-r3", JSON.stringify({ focusCls: s3.focusCls, focusPersp: s3.focusPersp }));
      assert("W-3 the selection, the window's name and its pressed state move to Fable",
        s3.persp === "fable-r3" && s3.namePersp === "fable-r3" && s3.name === "Fable 5 estimate" && s3.swapButtons.find(b => b.id === "fable-r3").pressed === "true",
        JSON.stringify({ persp: s3.persp, name: s3.name, swap: s3.swapButtons }));
      assert("W-3 the billing treatment moves with it", /Batch share 15% · negotiated discount 5%/.test(s3.billing || ""), s3.billing);
      assert("W-3 both operands and the result move together", s3.cost !== s1.cost && s3.bill !== s1.bill && s3.engine !== s1.engine && s3.hero !== s1.hero,
        JSON.stringify({ before: [s1.cost, s1.bill, s1.engine], after: [s3.cost, s3.bill, s3.engine] }));
      checkFace("W-3", s3);
      assert("W-3 Fable is not the default, so the window drops the badge and highlight and offers to set it",
        s3.badge === null && s3.tileDefault === false && s3.setHere === true, JSON.stringify({ badge: s3.badge, tileDefault: s3.tileDefault, setHere: s3.setHere }));
      assert("W-3 swapping stores nothing", s3.stored === null, s3.stored);
    }

    if (want("set-default")) {
      assert("W-4 the window's list covers every scenario", s1.allItems.length === s1.perspIds.length && s1.perspIds.every(id => s1.allItems.some(i => i.id === id)),
        `${s1.allItems.length} items vs ${s1.perspIds.length} scenarios`);
      assert("W-4 every scenario except the default offers set-as-default; the default is named",
        s1.allItems.every(i => i.id === "gptpro-r3" ? (i.isDefault && !i.set) : (i.set && !i.isDefault)), JSON.stringify(s1.allItems));
      assert("W-4 the GPT-5.6 Pro, Fable 5 and stress cards each carry a set-as-default button, the page default pressed",
        ["gptpro-r3", "fable-r3", "stress-public-rate"].every(id => s1.cardButtons.some(b => b.persp === id))
          && s1.cardButtons.find(b => b.persp === "gptpro-r3").pressed === "true" && s1.cardButtons.find(b => b.persp === "fable-r3").pressed === "false",
        JSON.stringify(s1.cardButtons));

      /* W-4u (gate verdict 20260912T212606Z; Astra round 6 F4, F5, F7): executable 2's words, "every scenario the window
         offers carries a set-as-default control", taken literally with NO exception. Five full sweeps, each over every model
         the selector offers (the Custom model included) x every scenario. Each state is applied through the page's own
         selection path and checked to be the pair asked for. The sweeps are: native traffic; an explicit non-native profile;
         a Custom traffic mix; native with a reader default stored; and every state after a slider edit. For each state, from
         the DOM:
         (a) the window's list, the selector and the sweep each name exactly the registry's scenario ids;
         (b) every list item carries the control, except the one scenario this browser opens on (read from storage, else
             the built-in GPT-5.6 Pro estimate on Opus), which carries the marker and no control;
         (c) the row carries a control for the scenario on screen, edited or not, unless it IS that opening scenario, in
             which case it is marked or named;
         (d) what the test itself changed is disclosed, a differing traffic mix (decided by the engine's resolveTraffic,
             not the page's own predicate) and an edit, and the Default badge appears only on the opening scenario
             unedited with its own mix;
         (e) no refusal sentence appears.
         One checker does it all, and W-4n runs that same checker on a mutated window. */
      const INSTALL_CHECK = `(() => {
        window.__imCheckState = (baseId, edited, hit) => {
          const out = { gaps: [], row: null, refusal: null, differs: false };
          const mid = $("model-preset").value;
          let stored = null; try { stored = JSON.parse(localStorage.getItem("im_default_scenario_v1")); } catch {}
          const opening = stored && MODELS.some(x => x.id === stored.model) && PERSPECTIVES.some(x => x.id === stored.persp)
            ? { model: stored.model, persp: stored.persp } : { model: "opus", persp: "gptpro-r3" };
          const box = document.getElementById("win-head");
          /* Round 7 F10: a control counts only when a reader can use it. The list is expanded first (collapsed content is
             legitimately hidden); then a control must be an enabled, wired button with a laid-out box that is not hidden. */
          const det = box.querySelector("details.win-all"); if (det && !det.open) det.open = true;
          const usable = b => {
            if (!b || b.tagName !== "BUTTON" || b.disabled || b.closest("[hidden]") || typeof b.onclick !== "function") return false;
            for (let e = b; e && e !== document.body; e = e.parentElement) {
              const cs = getComputedStyle(e);
              if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || cs.pointerEvents === "none"
                || (cs.clipPath && cs.clipPath !== "none") || (cs.clip && cs.clip !== "auto")) return false;
            }
            /* Round 9 F6: a control must also carry a readable label. */
            if (!(parseFloat(getComputedStyle(b).fontSize) >= 9) || !b.textContent.trim()) return false;
            const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0;
          };
          /* Round 9 F6: a laid-out box is not a reachable one. Scrolled into view (instantly), the control must be what a pointer hits
             at its centre. Run on the first state of each model in every sweep (hit), and in W-4n's covered/clipped mutations. */
          const hits = b => {
            b.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
            const r = b.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!h && (h === b || b.contains(h));
          };
          /* Round 8 F9 and round 9 F5: the CALL SHAPE of a control, checked synchronously for one call. setReaderDefault is intercepted, and
             a direct setItem, removeItem or clear of the stored default is recorded and swallowed; a correct control makes exactly one
             helper call with its own target and no direct write. What this cannot see (a named-property write, queued work, a wrong
             write inside the real helper) is what __imPersist's effect check and the state-level settle below are for (round 10). */
          const targetOf = b => {
            const real = window.setReaderDefault, calls = [], SP = Storage.prototype, set = SP.setItem, rem = SP.removeItem, clr = SP.clear;
            window.setReaderDefault = (model, persp) => { calls.push([model, persp]); };
            SP.setItem = function (k, v) { if (k === "im_default_scenario_v1") { calls.push(["direct-write", v]); return; } return set.call(this, k, v); };
            SP.removeItem = function (k) { if (k === "im_default_scenario_v1") { calls.push(["direct-remove"]); return; } return rem.call(this, k); };
            SP.clear = function () { calls.push(["direct-clear"]); };
            try { b.onclick(); } catch (e) { calls.push(["threw", String(e && e.message)]); }
            finally { window.setReaderDefault = real; SP.setItem = set; SP.removeItem = rem; SP.clear = clr; }
            return calls;
          };
          const items = [...box.querySelectorAll(".win-all-item")];
          const listIds = items.map(i => i.dataset.persp).sort(), registry = PERSPECTIVES.map(x => x.id).sort();
          if (JSON.stringify(listIds) !== JSON.stringify(registry)) out.gaps.push({ listIds, registry });
          for (const q of PERSPECTIVES) {
            const li = items.filter(i => i.dataset.persp === q.id);
            if (li.length !== 1) { out.gaps.push({ item: q.id, listed: li.length }); continue; }
            const all = [...li[0].querySelectorAll(".win-set-default")], set = all.filter(usable).length, mark = li[0].querySelectorAll(".win-is-default").length;
            const isOpening = mid === opening.model && q.id === opening.persp;
            if (isOpening ? !(mark === 1 && all.length === 0) : !(set === 1 && all.length === 1 && mark === 0)) { out.gaps.push({ item: q.id, set, present: all.length, mark, isOpening }); continue; }
            if (!isOpening) {
              const t = targetOf(all[0]);
              if (t.length !== 1 || t[0][0] !== mid || t[0][1] !== q.id) out.gaps.push({ item: q.id, target: t });
              else if (hit && !hits(all[0])) out.gaps.push({ item: q.id, hit: false });
            }
          }
          const m = MODELS.find(x => x.id === mid), p = PERSPECTIVES.find(x => x.id === baseId);
          try { const a = resolveTraffic(m, p, currentTrafficSel()), b = resolveTraffic(m, p, { mode: "native" }); out.differs = a.ioRatio !== b.ioRatio || a.cacheHit !== b.cacheHit; } catch {}
          const nameEl = box.querySelector(".win-name"), rowEl = box.querySelector(".win-default-row"), badgeEl = box.querySelector(".win-badge");
          const rowText = rowEl ? rowEl.textContent : "";
          const rowSet = rowEl ? [...rowEl.querySelectorAll(".win-set-default")] : [];
          const onOpening = mid === opening.model && baseId === opening.persp;
          const problems = [];
          if (!edited && (!nameEl || nameEl.dataset.persp !== baseId)) problems.push("the window names " + (nameEl && nameEl.dataset.persp));
          if (badgeEl && (!onOpening || edited || out.differs)) problems.push("a Default badge on a state that is not the opening scenario unedited with its own mix");
          if (onOpening) {
            if (rowSet.length !== 0) problems.push("a control offered on the opening scenario itself");
            if (!badgeEl) {
              if (!/opens on this scenario/.test(rowText)) problems.push("the opening scenario is neither marked nor named: " + rowText);
              if (/own traffic mix/.test(rowText) !== out.differs) problems.push("opening-row traffic disclosure wrong: " + rowText);
              if (/without the edits/.test(rowText) !== !!edited) problems.push("opening-row edit disclosure wrong: " + rowText);
            }
          } else if (rowSet.length !== 1 || !usable(rowSet[0])) {
            problems.push(rowSet.length + " row controls for the scenario on screen" + (rowSet.length === 1 ? ", not usable by a reader" : ""));
          } else {
            const label = rowSet[0].textContent;
            if (rowSet[0].dataset.persp !== baseId) problems.push("the row's control saves " + rowSet[0].dataset.persp);
            const t = targetOf(rowSet[0]);
            if (t.length !== 1 || t[0][0] !== mid || t[0][1] !== baseId) problems.push("the row's control calls " + JSON.stringify(t));
            if (hit && !hits(rowSet[0])) problems.push("the row's control is not what a pointer hits at its centre");
            if (/own traffic mix/.test(label) !== out.differs) problems.push("traffic disclosure wrong: " + label);
            if (/without the edits/.test(label) !== !!edited) problems.push("edit disclosure wrong: " + label);
          }
          if (problems.length) out.row = problems;
          if (/cannot be saved as a default|exists only in this visit|cannot reopen as a default/.test(box.textContent)) out.refusal = box.textContent.slice(0, 200);
          return out;
        };
        /* Rounds 9-12: the REAL save path for every control a state offers, verified by its EFFECT on the whole of localStorage.
           On entry, the state's offered controls are recorded (the row's first, then the list's in order) along with a Map snapshot
           of storage. It is a Map, so a key named __proto__ is a key like any other. Each recorded control is then activated exactly
           once, in its own window: storage restored and the window re-rendered, the activation, and then two reads (after a microtask
           checkpoint and a message-task turn, and again after one timer turn). At both reads the stored default must be that
           control's own record (absent for GPT-5.6 Pro on Opus) and every other key must equal the snapshot. A write deferred beyond
           that timer turn is out of reach of any browser verifier and outside this probe's claim. */
        const snapshotStorage = () => { const m = new Map(); for (let k = 0; k < localStorage.length; k++) { const key = localStorage.key(k); m.set(key, localStorage.getItem(key)); } return m; };
        const restoreStorage = snap => {
          for (const key of snapshotStorage().keys()) if (!snap.has(key)) Storage.prototype.removeItem.call(localStorage, key);
          for (const [key, v] of snap) if (localStorage.getItem(key) !== v) Storage.prototype.setItem.call(localStorage, key, v);
        };
        const storageDiff = (a, b) => [...new Set([...a.keys(), ...b.keys()])].filter(key => a.has(key) !== b.has(key) || a.get(key) !== b.get(key));
        const settleTurn = () => new Promise(done => { const ch = new MessageChannel(); ch.port1.onmessage = () => done(); ch.port2.postMessage(0); });
        /* A timer scheduled from a message task is not nested in a timer, so it is not clamped to 4 ms. */
        const timerTurn = () => new Promise(done => { const ch = new MessageChannel(); ch.port1.onmessage = () => setTimeout(done, 0); ch.port2.postMessage(0); });
        window.__imSnapshotStorage = snapshotStorage;
        window.__imPersist = async (mid, baseId) => {
          const key = "im_default_scenario_v1", failures = [], before = snapshotStorage();
          const rowSel = "#win-head .win-default-row .win-set-default";
          const offered = [];
          if (document.querySelector(rowSel)) offered.push({ kind: "row", sel: rowSel, target: baseId });
          for (const li of document.querySelectorAll("#win-head .win-all-item"))
            if (li.querySelector(".win-set-default")) offered.push({ kind: "list", sel: '#win-head .win-all-item[data-persp="' + li.dataset.persp + '"] .win-set-default', target: li.dataset.persp });
          const expectFor = target => (mid === "opus" && target === "gptpro-r3") ? null : target;
          const holds = (snap, target) => {
            const want = expectFor(target);
            if (want === null) return !snap.has(key);
            try { const rec = JSON.parse(snap.get(key)); return !!rec && rec.model === mid && rec.persp === want; } catch { return false; }
          };
          let n = 0, rows = 0;
          for (const c of offered) {
            /* Round 12 F3: each control gets its OWN complete observation window before the next one runs. The state is restored,
               storage and the rendered window both, then the control is activated and its save is judged twice: after a microtask
               checkpoint and a message-task turn, and again after one timer turn. A deferred write from this control lands inside
               this window and is judged against THIS control's target, whatever value it writes: the state's snapshot, or another
               control's target. */
            restoreStorage(before); renderScenarioWindow();
            const b = document.querySelector(c.sel);
            if (!b) { failures.push({ control: c.sel, target: c.target, missing: true }); continue; }
            let threw = null;
            try { b.onclick(); } catch (e) { threw = String(e && e.message); }
            await Promise.resolve(); await settleTurn();
            n++; if (c.kind === "row") rows++;
            const early = snapshotStorage();
            const earlyOthers = storageDiff(before, early).filter(k2 => k2 !== key);
            if (threw || !holds(early, c.target) || earlyOthers.length)
              failures.push({ control: c.sel, target: c.target, stored: early.has(key) ? early.get(key) : null, others: earlyOthers, threw });
            await timerTurn(); await settleTurn();
            const settled = snapshotStorage();
            const settledOthers = storageDiff(before, settled).filter(k2 => k2 !== key);
            if (!holds(settled, c.target) || settledOthers.length)
              failures.push({ afterTimerTurn: true, control: c.sel, target: c.target, stored: settled.has(key) ? settled.get(key) : null, others: settledOthers });
          }
          restoreStorage(before);
          renderScenarioWindow();
          return { n, rows, offered: offered.length, offeredRows: offered.filter(c => c.kind === "row").length, failures };
        };
        window.__imCoverage = async spec => {
          const models = [...$("model-preset").options].map(o => o.value).filter(v => !spec.models || spec.models.includes(v));
          const selectorIds = [...$("persp-preset").options].map(o => o.value).filter(v => !v.startsWith("__"));
          const res = { models, registry: MODELS.map(x => x.id), selectorIds, scenarios: PERSPECTIVES.map(x => x.id), visited: {},
            states: 0, reached: 0, differing: 0, edited: 0, trafficMode: {}, failures: [], persisted: 0, hitStates: 0, settled: 0,
            offered: 0, offeredRows: 0, activatedRows: 0 };
          for (const mid of models) {
            res.visited[mid] = [];
            for (const pid of selectorIds) {
              $("model-preset").value = mid; $("persp-preset").value = pid;
              if (spec.traffic === "explicit") { TRAFFIC = { mode: "explicit", profileId: "uncached" }; applyPreset(true); }
              else if (spec.traffic === "custom") { S.ioRatio = 7; S.cacheHit = 13; TRAFFIC = { mode: "custom", profileId: null }; applyPreset(true); }
              else { TRAFFIC = { mode: "native", profileId: null }; applyPreset(); }
              const reached = $("model-preset").value === mid && $("persp-preset").value === pid;
              res.trafficMode[TRAFFIC.mode] = (res.trafficMode[TRAFFIC.mode] || 0) + 1;
              /* An edit on a replay or exploration downgrades the state, and noteUserEdit's onChange(true) renders on a 30 ms timer
                 (app.js onChange); a lens edit renders synchronously through renderAll. Yield past that timer before reading. */
              if (spec.edit) { S.util = S.util >= 99 ? S.util - 1 : S.util + 1; if (noteUserEdit()) await new Promise(r => setTimeout(r, 50)); else renderAll(); }
              const edited = !!spec.edit && !(presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN);
              res.states++; res.visited[mid].push(pid);
              if (reached) res.reached++;
              if (edited) res.edited++;
              /* Round 10 F5-F8: on EVERY state, every control is hit-tested, the real save path runs for every control and is verified by its
                 effect, and a timer turn later the whole of localStorage must still equal what it was before this state's checks. */
              const stateSnap = snapshotStorage();
              const r = window.__imCheckState(pid, edited, true);
              res.hitStates++;
              const pr = await window.__imPersist(mid, pid);
              res.persisted += pr.n; res.offered += pr.offered; res.offeredRows += pr.offeredRows; res.activatedRows += pr.rows;
              if (pr.failures.length) res.failures.push({ model: mid, persp: pid, reached, gaps: [], row: null, refusal: null, persist: pr.failures });
              await timerTurn();
              const late = storageDiff(stateSnap, snapshotStorage());
              res.settled++;
              if (late.length) { res.failures.push({ model: mid, persp: pid, reached, gaps: [], row: null, refusal: null, storageAfterSettle: late }); restoreStorage(stateSnap); }
              if (r.differs) res.differing++;
              if (!reached || r.gaps.length || r.row || r.refusal) res.failures.push({ model: mid, persp: pid, reached, gaps: r.gaps, row: r.row, refusal: r.refusal });
            }
          }
          return res;
        };
        return true;
      })()`;
      assert("W-4u the coverage checker is installed in the page", await evalExpr(send, INSTALL_CHECK) === true);
      const sameIds = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
      /* The ONE verdict every W-4u sweep row uses; W-4n's propagation mutation must make it fail (round 7 F9). */
      const sweepFailed = c => c.failures.length > 0 || c.reached !== c.states;
      const SENTINELS = `(() => { localStorage.setItem("__proto__", "sentinel-proto"); localStorage.setItem("constructor", "sentinel-constructor"); localStorage.setItem("toString", "sentinel-tostring"); })()`;
      const UNSENTINEL = `(() => { const ok = localStorage.getItem("__proto__") === "sentinel-proto" && localStorage.getItem("constructor") === "sentinel-constructor" && localStorage.getItem("toString") === "sentinel-tostring";
        for (const k of ["__proto__", "constructor", "toString"]) localStorage.removeItem(k); return ok; })()`;
      /* The five sweeps run CONCURRENTLY, each in its own browser profile (its own localStorage, so no sweep's saves or restores can
         reach another's). They are the bulk of the work, and the gate runs this mode under a 300 s per-check ceiling
         (polaris/config/policy/completion-gate.json check_timeout_s). The checks are unchanged; the results are judged below in the
         order the sweeps used to run. A sweep whose browser fails comes back as an error and fails its rows; it never passes. */
      /* Astra round 12 F6: a sweep that cannot finish returns an error, which fails its rows, instead of holding the whole mode. */
      const withinBound = (p, ms, what) => new Promise(resolve => {
        const t = setTimeout(() => resolve({ error: what + " did not finish within " + (ms / 1000) + " s" }), ms); t.unref();
        p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); resolve({ error: String(e && e.message) }); });
      });
      const runSweep = (spec, setup) => withinBound(withBrowser(async s2 => {
        if (!await go(s2, BASE.split("?")[0])) return { error: "the page did not load in the sweep's browser" };
        if (await evalExpr(s2, INSTALL_CHECK) !== true) return { error: "the coverage checker did not install in the sweep's browser" };
        await evalExpr(s2, SENTINELS);
        if (setup) await evalExpr(s2, setup);
        const c = JSON.parse(await evalExpr(s2, `(async () => JSON.stringify(await window.__imCoverage(${JSON.stringify(spec)})))()`));
        c.sentinelsKept = await evalExpr(s2, UNSENTINEL);
        return c;
      }).catch(e => ({ error: "the sweep's browser failed: " + String(e && e.message).slice(0, 300) })), 200000, "the sweep");
      const judge = (label, c) => {
        const ok = !c.error;
        assert(`W-4u ${label}: the sweep reached every model the page carries (the Custom model included) x every scenario, by exact ids`,
          ok && c.models.includes("custom") && sameIds(c.models, c.registry) && sameIds(c.selectorIds, c.scenarios)
            && c.models.every(mid => sameIds(c.visited[mid], c.scenarios)) && c.states === c.models.length * c.scenarios.length && c.reached === c.states,
          ok ? JSON.stringify({ models: c.models.length, registry: c.registry.length, selector: c.selectorIds.length, scenarios: c.scenarios.length, states: c.states, reached: c.reached }) : c.error);
        assert(`W-4u ${label} (${ok ? c.states : 0} states): every offered scenario carries set-as-default or is named as the one this browser opens on, disclosed as the test changed it, and none is refused`,
          ok && !sweepFailed(c), ok ? `${c.failures.length} failing states: ` + JSON.stringify(c.failures.slice(0, 3)) : c.error);
        assert(`W-4u ${label}: the real save path ran exactly once for each of the ${ok ? c.offered : 0} controls the states offered (${ok ? c.offeredRows : 0} of them rows), each verified by its effect on storage, and every control was hit-tested at its centre in every state`,
          ok && c.persisted === c.offered && c.activatedRows === c.offeredRows && c.offered >= c.states * (c.scenarios.length - 1) && c.hitStates === c.states && c.settled === c.states && c.sentinelsKept === true,
          ok ? JSON.stringify({ persisted: c.persisted, offered: c.offered, offeredRows: c.offeredRows, activatedRows: c.activatedRows, states: c.states, hitStates: c.hitStates, settled: c.settled, sentinelsKept: c.sentinelsKept }) : c.error);
        return ok ? c : { error: c.error, states: 0, trafficMode: {}, differing: 0, edited: -1 };
      };
      const SWEEP_SPECS = [
        ["native traffic", {}],
        ["an explicit non-native traffic profile", { traffic: "explicit" }],
        ["a Custom traffic mix (7:1 / 13%)", { traffic: "custom" }],
        ["native traffic with a reader default stored (Custom model, Fable 5 estimate)", {}, `localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "custom", persp: "fable-r3" }))`],
        ["after a slider edit on every state", { edit: true }],
      ];
      const sweepResults = await Promise.all(SWEEP_SPECS.map(([, spec, setup]) => runSweep(spec, setup)));
      judge(SWEEP_SPECS[0][0], sweepResults[0]);
      const cE = judge(SWEEP_SPECS[1][0], sweepResults[1]);
      assert(`W-4u ...the explicit pass ran in explicit mode on every state and changed the reopening mix on ${cE.differing}`,
        !cE.error && cE.trafficMode.explicit === cE.states && cE.differing > 0, JSON.stringify({ modes: cE.trafficMode, differing: cE.differing, error: cE.error }));
      const cC = judge(SWEEP_SPECS[2][0], sweepResults[2]);
      assert(`W-4u ...the Custom-traffic pass ran in custom mode on every state and changed the reopening mix on ${cC.differing}`,
        !cC.error && cC.trafficMode.custom === cC.states && cC.differing > 0, JSON.stringify({ modes: cC.trafficMode, differing: cC.differing, error: cC.error }));
      judge(SWEEP_SPECS[3][0], sweepResults[3]);
      const cX = judge(SWEEP_SPECS[4][0], sweepResults[4]);
      assert(`W-4u ...the edit pass edited every one of its ${cX.states} states`, !cX.error && cX.edited === cX.states, JSON.stringify({ edited: cX.edited, states: cX.states, error: cX.error }));

      /* W-4n: the SAME checker on a mutated window must report the gap, or W-4u proves nothing. On the Custom model with Fable
         on screen: remove the control from one list item; remove the row's control; then, on an edited screen, remove the
         row's control, and separately strip its "without the edits" disclosure. Each must be reported. */
      const neg = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "custom"; $("persp-preset").value = "fable-r3"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const before = window.__imCheckState("fable-r3", false);
        const li = document.querySelector('#win-head .win-all-item[data-persp="stress-public-rate"] .win-set-default'); if (li) li.remove();
        const afterList = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const rb = document.querySelector('#win-head .win-default-row .win-set-default'); if (rb) rb.remove();
        const afterRow = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const restored = window.__imCheckState("fable-r3", false);
        const hb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (hb) hb.hidden = true;
        const afterHidden = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const db = document.querySelector('#win-head .win-default-row .win-set-default'); if (db) db.disabled = true;
        const afterDisabled = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const nb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (nb) nb.onclick = () => {};
        const afterNoop = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const wb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (wb) wb.onclick = () => setReaderDefault("custom", "dive");
        const afterWrong = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const ob = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (ob) ob.style.opacity = "0";
        const afterTransparent = window.__imCheckState("fable-r3", false);
        renderScenarioWindow();
        const cb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (cb) cb.style.clipPath = "inset(50%)";
        const afterClipped = window.__imCheckState("fable-r3", false, true);
        renderScenarioWindow();
        const zb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); if (zb) zb.style.fontSize = "0px";
        const afterZeroFont = window.__imCheckState("fable-r3", false, true);
        renderScenarioWindow();
        /* The cover moves WITH the control: an overlay inside the same list item, over the button. A viewport-fixed overlay would also
           cover every other control the checker scrolls to the same centre position. */
        const vb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default'); let ov = null;
        if (vb) { const li = vb.parentElement; li.style.position = "relative"; ov = document.createElement("div");
          ov.style.cssText = "position:absolute;left:" + vb.offsetLeft + "px;top:" + vb.offsetTop + "px;width:" + vb.offsetWidth + "px;height:" + vb.offsetHeight + "px;z-index:5;background:transparent";
          li.appendChild(ov); }
        const afterCovered = window.__imCheckState("fable-r3", false, true);
        if (ov) ov.remove();
        renderScenarioWindow();
        const xb = document.querySelector('#win-head .win-all-item[data-persp="median"] .win-set-default');
        if (xb) xb.onclick = () => { setReaderDefault("custom", "median"); localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "custom", persp: "dive" })); };
        const afterOverwrite = window.__imCheckState("fable-r3", false);
        const storedAfterOverwrite = localStorage.getItem("im_default_scenario_v1");
        renderScenarioWindow();
        S.util = S.util >= 99 ? S.util - 1 : S.util + 1; if (!noteUserEdit()) renderAll();
        const editedBefore = window.__imCheckState("fable-r3", true);
        const eb = document.querySelector('#win-head .win-default-row .win-set-default'); if (eb) eb.remove();
        const editedNoControl = window.__imCheckState("fable-r3", true);
        renderScenarioWindow();
        const el = document.querySelector('#win-head .win-default-row .win-set-default'); if (el) el.textContent = "Set this scenario as my default";
        const editedNoDisclosure = window.__imCheckState("fable-r3", true);
        renderScenarioWindow();
        return JSON.stringify({ before, removedList: !!li, afterList, removedRow: !!rb, afterRow, restored, hid: !!hb, afterHidden, dis: !!db, afterDisabled, noop: !!nb, afterNoop, wrong: !!wb, afterWrong, transparent: !!ob, afterTransparent, clipped: !!cb, afterClipped, zero: !!zb, afterZeroFont,
          covered: !!ov, afterCovered, overwrite: !!xb, afterOverwrite, storedAfterOverwrite,
          editedBefore, removedEdited: !!eb, editedNoControl, relabelled: !!el, editedNoDisclosure });
      })()`));
      assert("W-4n control: the unmutated window on the Custom model has no gap", neg.before.gaps.length === 0 && !neg.before.row && !neg.before.refusal, JSON.stringify(neg.before));
      assert("W-4n a control removed from one list item is reported as exactly that gap",
        neg.removedList && neg.afterList.gaps.length === 1 && neg.afterList.gaps[0].item === "stress-public-rate" && !neg.afterList.row, JSON.stringify(neg.afterList));
      assert("W-4n a control removed from the scenario on screen is reported as a row gap", neg.removedRow && !!neg.afterRow.row && neg.afterRow.gaps.length === 0, JSON.stringify(neg.afterRow));
      assert("W-4n re-rendering the window restores it with no gap", neg.restored.gaps.length === 0 && !neg.restored.row, JSON.stringify(neg.restored));
      assert("W-4n control: the edited window has no gap", neg.editedBefore.gaps.length === 0 && !neg.editedBefore.row && !neg.editedBefore.refusal, JSON.stringify(neg.editedBefore));
      assert("W-4n a control removed from the edited scenario on screen is reported as a row gap", neg.removedEdited && !!neg.editedNoControl.row, JSON.stringify(neg.editedNoControl));
      assert("W-4n an edited scenario's control stripped of its disclosure is reported as a row gap", neg.relabelled && !!neg.editedNoDisclosure.row, JSON.stringify(neg.editedNoDisclosure));
      assert("W-4n a list control a reader cannot see (hidden) is reported as a gap",
        neg.hid && neg.afterHidden.gaps.length === 1 && neg.afterHidden.gaps[0].item === "median" && !neg.afterHidden.row, JSON.stringify(neg.afterHidden));
      assert("W-4n a row control a reader cannot use (disabled) is reported as a row gap", neg.dis && !!neg.afterDisabled.row, JSON.stringify(neg.afterDisabled));
      assert("W-4n a list control whose handler does nothing is reported as a gap",
        neg.noop && neg.afterNoop.gaps.length === 1 && neg.afterNoop.gaps[0].item === "median" && Array.isArray(neg.afterNoop.gaps[0].target), JSON.stringify(neg.afterNoop));
      assert("W-4n a list control that saves another scenario is reported as a gap",
        neg.wrong && neg.afterWrong.gaps.length === 1 && neg.afterWrong.gaps[0].item === "median" && Array.isArray(neg.afterWrong.gaps[0].target), JSON.stringify(neg.afterWrong));
      assert("W-4n a transparent list control is reported as a gap",
        neg.transparent && neg.afterTransparent.gaps.length === 1 && neg.afterTransparent.gaps[0].item === "median", JSON.stringify(neg.afterTransparent));
      assert("W-4n a list control clipped out of sight is reported as a gap",
        neg.clipped && neg.afterClipped.gaps.length === 1 && neg.afterClipped.gaps[0].item === "median", JSON.stringify(neg.afterClipped));
      assert("W-4n a list control with unreadable zero-size text is reported as a gap",
        neg.zero && neg.afterZeroFont.gaps.length === 1 && neg.afterZeroFont.gaps[0].item === "median", JSON.stringify(neg.afterZeroFont));
      assert("W-4n a list control covered by another element is reported as a gap",
        neg.covered && neg.afterCovered.gaps.length === 1 && neg.afterCovered.gaps[0].item === "median" && neg.afterCovered.gaps[0].hit === false, JSON.stringify(neg.afterCovered));
      assert("W-4n a list control that saves its own target and then overwrites the stored default is reported as a gap",
        neg.overwrite && neg.afterOverwrite.gaps.length === 1 && neg.afterOverwrite.gaps[0].item === "median" && neg.storedAfterOverwrite === null,
        JSON.stringify({ gaps: neg.afterOverwrite.gaps, stored: neg.storedAfterOverwrite }));
      /* W-4n (round 7 F9): the SWEEP must carry a missing control to its verdict, not only the checker notice it. For this run the
         page's own renderScenarioWindow is wrapped to drop one scenario's list control after every render; the same __imCoverage
         and the same sweepFailed verdict the W-4u rows use must then fail, on exactly that scenario in every state. */
      const prop = JSON.parse(await evalExpr(send, `(async () => {
        const orig = window.renderScenarioWindow;
        window.renderScenarioWindow = function () { const r = orig.apply(this, arguments);
          const b = document.querySelector('#win-head .win-all-item[data-persp="dive"] .win-set-default'); if (b) b.remove(); return r; };
        try { return JSON.stringify(await window.__imCoverage({ models: ["custom", "opus"] })); }
        finally { window.renderScenarioWindow = orig; renderScenarioWindow(); }
      })()`));
      assert("W-4n a sweep over windows missing one scenario's control fails the W-4u verdict, on exactly that scenario in every state",
        sweepFailed(prop) && prop.states === 2 * s1.perspIds.length && prop.failures.length === prop.states
          && prop.failures.every(f => f.gaps.length === 1 && f.gaps[0].item === "dive" && !f.row && !f.refusal),
        JSON.stringify({ states: prop.states, failures: prop.failures.length, sample: prop.failures.slice(0, 2) }));
      /* Round 8 F8: the same for the two other failure channels. A row control missing on ONE state, and a refusal sentence on ONE
         state, must each reach the sweep's verdict on exactly that state. */
      const propRow = JSON.parse(await evalExpr(send, `(async () => {
        const orig = window.renderScenarioWindow;
        window.renderScenarioWindow = function () { const r = orig.apply(this, arguments);
          if ($("model-preset").value === "custom" && $("persp-preset").value === "x90-v1") { const b = document.querySelector('#win-head .win-default-row .win-set-default'); if (b) b.remove(); }
          return r; };
        try { return JSON.stringify(await window.__imCoverage({ models: ["custom"] })); }
        finally { window.renderScenarioWindow = orig; renderScenarioWindow(); }
      })()`));
      assert("W-4n a sweep over one scenario's window missing its row control fails the W-4u verdict, on exactly that state",
        sweepFailed(propRow) && propRow.failures.length === 1 && propRow.failures[0].model === "custom" && propRow.failures[0].persp === "x90-v1"
          && !!propRow.failures[0].row && propRow.failures[0].gaps.length === 0, JSON.stringify(propRow.failures.slice(0, 2)));
      const propRefusal = JSON.parse(await evalExpr(send, `(async () => {
        const orig = window.renderScenarioWindow;
        window.renderScenarioWindow = function () { const r = orig.apply(this, arguments);
          if ($("model-preset").value === "custom" && $("persp-preset").value === "median") { const row = document.querySelector('#win-head .win-default-row'); if (row) row.append(" This scenario cannot be saved as a default."); }
          return r; };
        try { return JSON.stringify(await window.__imCoverage({ models: ["custom"] })); }
        finally { window.renderScenarioWindow = orig; renderScenarioWindow(); }
      })()`));
      assert("W-4n a sweep over one scenario's window carrying a refusal sentence fails the W-4u verdict, on exactly that state",
        sweepFailed(propRefusal) && propRefusal.failures.length === 1 && propRefusal.failures[0].model === "custom" && propRefusal.failures[0].persp === "median"
          && !!propRefusal.failures[0].refusal, JSON.stringify(propRefusal.failures.slice(0, 2)));
      /* Round 10 F5-F8: what an intercept cannot see must still fail. For one run each, the page's own writeReaderDefault or
         renderScenarioWindow is wrapped, and the real __imPersist or the real sweep, with the shared verdict, must catch it. */
      const effect = JSON.parse(await evalExpr(send, `(async () => {
        $("model-preset").value = "custom"; $("persp-preset").value = "fable-r3"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const realWrite = window.writeReaderDefault, out = {};
        const run = async (name, wrap) => { window.writeReaderDefault = wrap; try { out[name] = await window.__imPersist("custom", "fable-r3"); } finally { window.writeReaderDefault = realWrite; renderScenarioWindow(); } };
        /* The overwrite names a scenario no control saves, so it is wrong for EVERY control (an overwrite with a real scenario id would
           leave that scenario's own control with its correct record, and rightly pass it). */
        await run("microtask", (model, persp) => { const r = realWrite(model, persp); queueMicrotask(() => localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model, persp: "no-such-scenario" }))); return r; });
        await run("named", (model, persp) => { const r = realWrite(model, persp); localStorage["im_default_scenario_v1"] = JSON.stringify({ model, persp: "no-such-scenario" }); return r; });
        localStorage.setItem("w4n-sentinel", "kept");
        await run("clear", (model, persp) => { const r = realWrite(model, persp); localStorage.clear(); return r; });
        const sentinelRestored = localStorage.getItem("w4n-sentinel") === "kept";
        localStorage.removeItem("w4n-sentinel");
        const clearSawOthers = out.clear.failures.some(f => f.others.includes("w4n-sentinel"));
        /* Since round 11 a lasting overwrite fails twice: at its own activation, and again for the last control after the timer turn. */
        const perActivation = pr => pr.failures.filter(f => !f.afterTimerTurn).length;
        const afterTimer = pr => pr.failures.filter(f => f.afterTimerTurn).length;
        return JSON.stringify({ n: out.microtask.n, microtask: perActivation(out.microtask), named: perActivation(out.named), clear: perActivation(out.clear),
          microtaskTimer: afterTimer(out.microtask), namedTimer: afterTimer(out.named), clearTimer: afterTimer(out.clear), clearSawOthers, sentinelRestored });
      })()`));
      /* Since round 12 each control's window has two reads, so a lasting overwrite fails at both, for every control. */
      assert("W-4n a save whose helper queues a microtask overwrite is caught by its effect on storage", effect.n > 0 && effect.microtask === effect.n && effect.microtaskTimer === effect.n, JSON.stringify(effect));
      assert("W-4n a save whose helper overwrites the default by named-property assignment is caught by its effect on storage", effect.n > 0 && effect.named === effect.n && effect.namedTimer === effect.n, JSON.stringify(effect));
      assert("W-4n a save whose helper clears storage is caught by its effect on storage", effect.n > 0 && effect.clear === effect.n && effect.clearTimer === effect.n && effect.clearSawOthers && effect.sentinelRestored, JSON.stringify(effect));
      const later = async (wrapSource) => JSON.parse(await evalExpr(send, `(async () => {
        const realWrite = window.writeReaderDefault, realRender = window.renderScenarioWindow;
        ${wrapSource}
        try { return JSON.stringify(await window.__imCoverage({ models: ["custom"] })); }
        finally { window.writeReaderDefault = realWrite; window.renderScenarioWindow = realRender; renderScenarioWindow(); }
      })()`));
      const wrongLater = await later(`window.writeReaderDefault = (model, persp) => realWrite(model, (currentPersp() && currentPersp().id === "dive") ? "median" : persp);`);
      assert("W-4n a save that stores the wrong scenario only while one later scenario is on screen fails the W-4u verdict, on exactly that state",
        sweepFailed(wrongLater) && wrongLater.failures.length === 1 && wrongLater.failures[0].persp === "dive" && Array.isArray(wrongLater.failures[0].persist), JSON.stringify(wrongLater.failures.slice(0, 2)));
      const timerLater = await later(`window.writeReaderDefault = (model, persp) => { const r = realWrite(model, persp);
          if (currentPersp() && currentPersp().id === "x90-v1") setTimeout(() => localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model, persp: "median" })), 0); return r; };`);
      assert("W-4n a timer-deferred overwrite while one later scenario is on screen fails the W-4u verdict, on that state only",
        sweepFailed(timerLater) && timerLater.failures.length >= 1 && timerLater.failures.every(f => f.persp === "x90-v1"), JSON.stringify(timerLater.failures.slice(0, 2)));
      const coverLater = await later(`window.renderScenarioWindow = function () { const r = realRender.apply(this, arguments);
          if ($("model-preset").value === "custom" && $("persp-preset").value === "x90-v1") {
            const li = document.querySelector('#win-head .win-all-item[data-persp="dive"]');
            if (li) { li.style.position = "relative"; const cov = document.createElement("div"); cov.style.cssText = "position:absolute;inset:0;z-index:5;background:transparent"; li.appendChild(cov); } }
          return r; };`);
      assert("W-4n a control covered only while one later scenario is on screen fails the W-4u verdict, on exactly that state",
        sweepFailed(coverLater) && coverLater.failures.length === 1 && coverLater.failures[0].persp === "x90-v1" && coverLater.failures[0].gaps.some(g => g.item === "dive" && g.hit === false),
        JSON.stringify(coverLater.failures.slice(0, 2)));
      /* Round 11 F3: a ROW save that goes wrong only on the last scenario, with every list save correct. The row control's handler is
         marked for this run; the helper stores median only for a row call on deepseek. The call shape is correct, so only the real
         save path, reaching the row even after the list, can catch it. */
      const rowLast = await later(`window.renderScenarioWindow = function () { const r = realRender.apply(this, arguments);
          const rb = document.querySelector("#win-head .win-default-row .win-set-default");
          if (rb) { const h = rb.onclick; rb.onclick = function () { window.__imRowCall = true; try { return h.apply(this, arguments); } finally { window.__imRowCall = false; } }; }
          return r; };
        window.writeReaderDefault = (model, persp) => realWrite(model, (window.__imRowCall && currentPersp() && currentPersp().id === "deepseek") ? "median" : persp);`);
      assert("W-4n a row save that goes wrong only on the last scenario, list saves correct, fails the W-4u verdict on exactly that state",
        sweepFailed(rowLast) && rowLast.failures.length === 1 && rowLast.failures[0].persp === "deepseek" && Array.isArray(rowLast.failures[0].persist)
          && rowLast.failures[0].persist.some(f => /win-default-row/.test(f.control || "")), JSON.stringify(rowLast.failures.slice(0, 2)));
      /* Round 11 F5: a zero-delay timer that rolls the save back to the value before the activation, on one later state, with the
         default absent and with a reader default stored. */
      const ROLLBACK = `window.writeReaderDefault = (model, persp) => { const old = localStorage.getItem("im_default_scenario_v1"); const r = realWrite(model, persp);
          if (currentPersp() && currentPersp().id === "x90-v1") setTimeout(() => { if (old === null) localStorage.removeItem("im_default_scenario_v1"); else localStorage.setItem("im_default_scenario_v1", old); }, 0);
          return r; };`;
      const rollbackAbsent = await later(ROLLBACK);
      assert("W-4n a timer that rolls the save back, default absent, fails the W-4u verdict on exactly that state",
        sweepFailed(rollbackAbsent) && rollbackAbsent.failures.length >= 1 && rollbackAbsent.failures.every(f => f.persp === "x90-v1"), JSON.stringify(rollbackAbsent.failures.slice(0, 2)));
      await evalExpr(send, `localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "custom", persp: "fable-r3" }))`);
      const rollbackStored = await later(ROLLBACK);
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);
      assert("W-4n a timer that rolls the save back, reader default stored, fails the W-4u verdict on exactly that state",
        sweepFailed(rollbackStored) && rollbackStored.failures.length >= 1 && rollbackStored.failures.every(f => f.persp === "x90-v1"), JSON.stringify(rollbackStored.failures.slice(0, 2)));
      /* Round 12 F3: one control's deferred write that stores ANOTHER control's expected value. On Custom/deepseek the median list
         save schedules a write of deepseek's record, once from a zero-delay timer (message task first) and once from a microtask
         (landing before the first read). Each must fail on the median control, the one that scheduled it, and on no other. */
      const laterValue = async scheduler => JSON.parse(await evalExpr(send, `(async () => {
        $("model-preset").value = "custom"; $("persp-preset").value = "deepseek"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const realWrite = window.writeReaderDefault;
        window.writeReaderDefault = (model, persp) => { const r = realWrite(model, persp);
          if (model === "custom" && persp === "median") {
            const later = JSON.stringify({ model: "custom", persp: "deepseek", setAt: new Date().toISOString() });
            const put = () => localStorage.setItem("im_default_scenario_v1", later);
            if (${JSON.stringify(scheduler)} === "timer") setTimeout(put, 0); else queueMicrotask(put);
          }
          return r; };
        let pr; try { pr = await window.__imPersist("custom", "deepseek"); } finally { window.writeReaderDefault = realWrite; renderScenarioWindow(); }
        return JSON.stringify({ n: pr.n, failures: pr.failures.map(f => ({ target: f.target, afterTimerTurn: !!f.afterTimerTurn })) });
      })()`));
      const lvTimer = await laterValue("timer");
      assert("W-4n a zero-delay timer that writes another control's expected value fails on the control that scheduled it",
        lvTimer.n > 0 && lvTimer.failures.length >= 1 && lvTimer.failures.every(f => f.target === "median") && lvTimer.failures.some(f => f.afterTimerTurn), JSON.stringify(lvTimer));
      const lvMicro = await laterValue("microtask");
      assert("W-4n a microtask that writes another control's expected value fails on the control that scheduled it",
        lvMicro.n > 0 && lvMicro.failures.length >= 1 && lvMicro.failures.every(f => f.target === "median") && lvMicro.failures.some(f => !f.afterTimerTurn), JSON.stringify(lvMicro));
      /* Round 11 F4: keys named like Object.prototype members are storage keys like any other. */
      const protoKeys = JSON.parse(await evalExpr(send, `(async () => {
        $("model-preset").value = "custom"; $("persp-preset").value = "fable-r3"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        localStorage.setItem("__proto__", "keep-proto"); localStorage.setItem("constructor", "keep-constructor");
        const realWrite = window.writeReaderDefault;
        window.writeReaderDefault = (model, persp) => { const r = realWrite(model, persp); localStorage.removeItem("__proto__"); localStorage.setItem("constructor", "changed"); localStorage.setItem("toString", "added"); return r; };
        let pr; try { pr = await window.__imPersist("custom", "fable-r3"); } finally { window.writeReaderDefault = realWrite; renderScenarioWindow(); }
        const restored = localStorage.getItem("__proto__") === "keep-proto" && localStorage.getItem("constructor") === "keep-constructor" && localStorage.getItem("toString") === null;
        for (const k of ["__proto__", "constructor", "toString"]) localStorage.removeItem(k);
        return JSON.stringify({ n: pr.n, failures: pr.failures.length, sawAll: pr.failures.length > 0 && pr.failures.every(f => ["__proto__", "constructor", "toString"].every(k => (f.others || []).includes(k))), restored });
      })()`));
      assert("W-4n a save that erases __proto__, changes constructor and adds toString is caught for every control, and all three are restored",
        protoKeys.n > 0 && protoKeys.failures >= protoKeys.n && protoKeys.sawAll && protoKeys.restored, JSON.stringify(protoKeys));
      assert("W-4u back to a clean page", await go(send, BASE.split("?")[0]));

      /* W-5 CONTROL: swap, reload, and the opening scenario must not move. */
      await click(send, '#win-head .win-swap-btn[data-persp="stress-public-rate"]');
      assert("W-5 control: the swap actually happened before the reload", (await probe(send)).persp === "stress-public-rate");
      assert("W-5 control: reload after a swap", await reload(send));
      const c = await probe(send);
      assert("W-5 control: a swap alone does not change what the page opens on", c.persp === "gptpro-r3" && c.stored === null, JSON.stringify({ persp: c.persp, stored: c.stored }));

      await evalExpr(send, "document.querySelector('#win-head details.win-all').open = true");
      assert("W-5 set Fable as default from the window's list", await focusClick(send, '#win-head .win-all-item[data-persp="fable-r3"] .win-set-default'));
      const s5 = await probe(send);
      assert("W-5 the confirmation takes focus, so it is announced without a live region", s5.focusId === "win-note" && s5.heroLiveFree,
        JSON.stringify({ focusId: s5.focusId, heroLiveFree: s5.heroLiveFree }));
      assert("W-5 the choice is stored in this browser and said so", /"persp":"fable-r3"/.test(s5.stored || "") && /^Default set: this browser will open on Fable 5 estimate/.test(s5.note || ""),
        JSON.stringify({ stored: s5.stored, note: s5.note }));
      assert("W-5 the Fable card's button now reads as the default", (s5.cardButtons.find(b => b.persp === "fable-r3") || {}).pressed === "true", JSON.stringify(s5.cardButtons));
      assert("W-5 reload", await reload(send));
      const s5b = await probe(send);
      assert("W-5 the page now opens on the reader's default, marked as theirs and highlighted",
        s5b.persp === "fable-r3" && s5b.namePersp === "fable-r3" && s5b.badge === "★ Your default" && s5b.tileDefault && s5b.restore,
        JSON.stringify({ persp: s5b.persp, badge: s5b.badge, tileDefault: s5b.tileDefault, restore: s5b.restore }));
      checkFace("W-5", s5b);

      /* W-6: a shared link for the stress case opens the stress case, and does not touch the stored default. */
      const token = await evalExpr(send, `(() => { $("persp-preset").value = "stress-public-rate"; applyPreset();
        return encodeScenario(S, "opus", "stress-public-rate", resolvedTraffic(), null, { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }); })()`);
      const linkUrl = BASE.split("?")[0].split("#")[0] + "?s=" + encodeURIComponent(token);
      assert("W-6 open a shared link while a default is stored", await go(send, linkUrl));
      const s6 = await probe(send);
      assert("W-6 the link opens what it names, not the stored default", s6.persp === "stress-public-rate", s6.persp);
      assert("W-6 opening a link never writes the stored default", /"persp":"fable-r3"/.test(s6.stored || ""), s6.stored);

      assert("W-7 back to the plain page", await go(send, BASE.split("?")[0]));
      const s7a = await probe(send);
      assert("W-7 the plain page still opens on the reader's default", s7a.persp === "fable-r3", s7a.persp);
      assert("W-7 restore the page's default", await click(send, "#win-head .win-restore"));
      const s7b = await probe(send);
      assert("W-7 restoring clears the stored default", s7b.stored === null, s7b.stored);
      assert("W-7 reload", await reload(send));
      const s7c = await probe(send);
      assert("W-7 the page opens on its own default again", s7c.persp === "gptpro-r3" && s7c.badge === "★ Default", JSON.stringify({ persp: s7c.persp, badge: s7c.badge }));

      await evalExpr(send, `localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "opus", persp: "no-such-scenario" }))`);
      assert("W-8 reload with an unknown stored id", await reload(send));
      const s8 = await probe(send);
      assert("W-8 an id the page does not carry is ignored, never half-applied", s8.persp === "gptpro-r3" && s8.badge === "★ Default", JSON.stringify({ persp: s8.persp, badge: s8.badge }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-12 (Astra round 2 F10): a reader's default on a model whose placement IS verified keeps that model's own
         labels. Control first: the same model and scenario reached WITHOUT a stored default. */
      assert("W-12 clean page", await go(send, BASE.split("?")[0]));
      await evalExpr(send, `(() => { $("model-preset").value = "dsr1"; $("persp-preset").value = "dive"; TRAFFIC = { mode: "native", profileId: null }; applyPreset(); })()`);
      await sleep(300);
      const c12 = await probe(send);
      await evalExpr(send, `localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "dsr1", persp: "dive" }))`);
      assert("W-12 reload with a DeepSeek default stored", await reload(send));
      const s12 = await probe(send);
      assert("W-12 the page opens on the stored DeepSeek default", s12.model === "dsr1" && s12.persp === "dive", JSON.stringify({ model: s12.model, persp: s12.persp }));
      assert("W-12 ...with exactly the labels that scenario carries without a stored default", s12.marginNote === c12.marginNote && c12.marginNote.length > 0,
        JSON.stringify({ control: c12.marginNote.slice(0, 200), stored: s12.marginNote.slice(0, 200) }));
      assert("W-12 ...and no Opus-flagship 'placement unverified' text", !/placement unverified/.test(s12.marginNote), s12.marginNote.slice(0, 300));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-13 (gate verdict 20260912T212606Z, which requeued round 2 F6's refusal): the Custom model's scenarios are set as
         defaults like any other model's. A default is a model id and a scenario id, and Custom's starting settings are page
         code (MODELS "custom".set), so the stored pair rebuilds what was on screen. Control first: Custom on Fable reached
         by hand, with nothing stored. */
      const storedIs = (s, model, persp) => { try { const r = JSON.parse(s); return r.model === model && r.persp === persp; } catch { return false; } };
      assert("W-13 clean page", await go(send, BASE.split("?")[0]));
      await evalExpr(send, `(() => { $("model-preset").value = "custom"; $("persp-preset").value = "fable-r3"; TRAFFIC = { mode: "native", profileId: null }; applyPreset(); })()`);
      await sleep(300);
      const c13 = await probe(send);
      assert("W-13 control: Custom on Fable by hand stores nothing and is not marked a default",
        c13.model === "custom" && c13.persp === "fable-r3" && c13.stored === null && c13.badge === null, JSON.stringify({ model: c13.model, persp: c13.persp, stored: c13.stored, badge: c13.badge }));
      assert("W-13 on the Custom model the scenario on screen and every scenario in the list carry set-as-default",
        c13.setHere === true && c13.allItems.length === c13.perspIds.length && c13.allItems.every(i => i.set && !i.isDefault) && !/cannot be saved|only in this visit/.test(c13.defaultRowText || ""),
        JSON.stringify({ setHere: c13.setHere, row: c13.defaultRowText, missing: c13.allItems.filter(i => !i.set).map(i => i.id) }));
      assert("W-13 set it from the row", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s13 = await probe(send);
      assert("W-13 the Custom model is what is stored, and the confirmation names it",
        storedIs(s13.stored, "custom", "fable-r3") && /^Default set: this browser will open on Fable 5 estimate \(Custom\)\. Shared links still open what they name\.$/.test(s13.note || ""),
        JSON.stringify({ stored: s13.stored, note: s13.note }));
      assert("W-13 reload", await reload(send));
      const s13b = await probe(send);
      assert("W-13 reload opens the Custom model on Fable, marked as the reader's default and highlighted",
        s13b.model === "custom" && s13b.persp === "fable-r3" && s13b.badge === "★ Your default" && s13b.tileDefault && s13b.restore,
        JSON.stringify({ model: s13b.model, persp: s13b.persp, badge: s13b.badge, tileDefault: s13b.tileDefault, restore: s13b.restore }));
      assert("W-13 ...with exactly the numbers and labels reaching it by hand produced",
        Math.abs(s13b.margin - c13.margin) < 1e-9 && s13b.cost === c13.cost && s13b.bill === c13.bill && s13b.engine === c13.engine
          && s13b.marginNote === c13.marginNote && c13.marginNote.length > 0,
        JSON.stringify({ control: [c13.margin, c13.cost, c13.bill], stored: [s13b.margin, s13b.cost, s13b.bill], notesEqual: s13b.marginNote === c13.marginNote }));
      checkFace("W-13", s13b);
      assert("W-13 ...and the list names Fable as the default on Custom while every other scenario keeps its control",
        s13b.allItems.every(i => i.id === "fable-r3" ? (i.isDefault && !i.set) : (i.set && !i.isDefault)),
        JSON.stringify(s13b.allItems.filter(i => i.id === "fable-r3" ? !(i.isDefault && !i.set) : !(i.set && !i.isDefault))));

      const token13 = await evalExpr(send, `(() => { $("model-preset").value = "opus"; $("persp-preset").value = "stress-public-rate"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        return encodeScenario(S, "opus", "stress-public-rate", resolvedTraffic(), null, { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }); })()`);
      assert("W-13 open a shared link while a Custom default is stored", await go(send, BASE.split("?")[0].split("#")[0] + "?s=" + encodeURIComponent(token13)));
      const s13c = await probe(send);
      assert("W-13 the link opens what it names, not the stored Custom default, and writes nothing",
        s13c.model === "opus" && s13c.persp === "stress-public-rate" && storedIs(s13c.stored, "custom", "fable-r3"),
        JSON.stringify({ model: s13c.model, persp: s13c.persp, stored: s13c.stored }));

      assert("W-13 back to the plain page, which opens on the Custom default", await go(send, BASE.split("?")[0]) && (await probe(send)).model === "custom");
      const e13 = JSON.parse(await evalExpr(send, `(() => { S.util = 40; if (!noteUserEdit()) renderAll();
        return JSON.stringify({ model: $("model-preset").value, clean: presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN }); })()`));
      assert("W-13 an edit on the Custom model leaves the screen edited", e13.model === "custom" && e13.clean === false, JSON.stringify(e13));
      const r13 = await probe(send);
      assert("W-13 on the edited opening scenario the row says the browser opens on its own settings, without the edits, and offers no redundant control",
        r13.setHere === false && /^This browser opens on this scenario's own settings, without the edits on screen\.$/.test(r13.defaultRowText || "") && r13.badge === null,
        JSON.stringify({ setHere: r13.setHere, row: r13.defaultRowText, badge: r13.badge }));
      await evalExpr(send, "document.querySelector('#win-head details.win-all').open = true");
      assert("W-13 set the planning baseline as the default from the list, on the edited Custom model",
        await pressControl(send, '#win-head .win-all-item[data-persp="stress-public-rate"] .win-set-default'));
      const s13d = await probe(send);
      assert("W-13 stored as the Custom model, and the confirmation says the edits on screen are not part of a default",
        storedIs(s13d.stored, "custom", "stress-public-rate")
          && /^Default set: this browser will open on Planning baseline \(conservative\) \(Custom\)\. It opens that scenario's own settings, without the edits on screen\. Shared links still open what they name\.$/.test(s13d.note || ""),
        JSON.stringify({ stored: s13d.stored, note: s13d.note }));
      assert("W-13 ...and the edited Fable screen, no longer the opening scenario, now carries its own control, which says the edits are not kept",
        s13d.setHere === true && /^Set Fable 5 estimate's own settings as my default \(without the edits on screen\)$/.test(s13d.setHereText || ""),
        JSON.stringify({ setHere: s13d.setHere, label: s13d.setHereText }));
      assert("W-13 reload", await reload(send));
      const s13e = await probe(send);
      assert("W-13 the page reopens the Custom model on the planning baseline's unedited settings, as disclosed",
        s13e.model === "custom" && s13e.persp === "stress-public-rate" && s13e.badge === "★ Your default" && s13e.restore && s13e.name === "Planning baseline (conservative)",
        JSON.stringify({ model: s13e.model, persp: s13e.persp, badge: s13e.badge, name: s13e.name }));
      assert("W-13 restore the page's default", await click(send, "#win-head .win-restore"));
      assert("W-13 restoring clears the stored Custom default", (await probe(send)).stored === null);
      await evalExpr(send, `setReaderDefault("no-such-model", "fable-r3")`);
      await sleep(200);
      const s13f = await probe(send);
      assert("W-13 an unknown model id is refused with a reason and never replaced by another model",
        s13f.stored === null && /not one this page carries/.test(s13f.note || ""), JSON.stringify({ stored: s13f.stored, note: s13f.note }));

      /* W-14 (Astra round 2 F8): with a different traffic mix selected, setting a default says the default opens with the
         model's own mix, and a reload does exactly that. */
      assert("W-14 clean page", await go(send, BASE.split("?")[0]));
      const t14 = await evalExpr(send, `(() => { $("persp-preset").value = "fable-r3"; applyPreset();
        const ts = $("traffic-preset"); const o = [...ts.options].find(x => x.value === "uncached");
        if (!o) return "no-uncached"; ts.value = "uncached"; ts.dispatchEvent(new Event("input", { bubbles: true })); ts.dispatchEvent(new Event("change", { bubbles: true }));
        return TRAFFIC.mode; })()`);
      await sleep(300);
      const s14 = await probe(send);
      assert("W-14 a non-native traffic mix is selected", t14 !== "no-uncached" && s14.trafficMode !== "native", JSON.stringify({ t14, mode: s14.trafficMode }));
      /* The row used to WITHHOLD this scenario's control while a non-native mix was selected: an offered scenario without a
         control (gate verdict 20260912T212606Z). Round 2 F8's own suggested fix allows a control that discloses the change of
         mix before success is announced, so the control stays and its label names the mix a default opens with. */
      assert("W-14 the current scenario keeps its own set-as-default, and its label names the mix a default opens with",
        s14.setHere === true && /^Set (this scenario|Fable 5 estimate's own settings) as my default \(it opens with its own traffic mix, \d+:1 \/ \d+%( and the fleet a fresh visit assigns)?\)$/.test(s14.setHereText || ""),
        JSON.stringify({ setHere: s14.setHere, label: s14.setHereText, row: s14.defaultRowText }));
      assert("W-14 ...and the list offers that scenario its control too", s14.allItems.some(i => i.id === "fable-r3" && i.set), JSON.stringify(s14.allItems.find(i => i.id === "fable-r3")));
      assert("W-14 set Fable as default from the row", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s14b = await probe(send);
      assert("W-14 the confirmation discloses the traffic mix the default will open with",
        /with its own traffic mix \(\d+:1 \/ \d+%\) rather than the mix selected now/.test(s14b.note || "") && /"persp":"fable-r3"/.test(s14b.stored || ""), JSON.stringify({ note: s14b.note, stored: s14b.stored }));
      assert("W-14 reload", await reload(send));
      const s14c = await probe(send);
      assert("W-14 the default opens with the model's own traffic mix, as disclosed", s14c.persp === "fable-r3" && s14c.trafficMode === "native" && s14c.badge === "★ Your default",
        JSON.stringify({ persp: s14c.persp, mode: s14c.trafficMode, badge: s14c.badge }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-15 (Astra round 3 F8): a replay locks its published traffic mix, so a latent explicit selection changes
         nothing a default would reopen with. The window must offer the default, say nothing about a changed mix, and
         reopen on the same locked mix. */
      assert("W-15 clean page", await go(send, BASE.split("?")[0]));
      const t15 = JSON.parse(await evalExpr(send, `(() => { $("model-preset").value = "grok"; $("persp-preset").value = "xaicash"; applyPreset();
        TRAFFIC = { mode: "explicit", profileId: "uncached" }; applyPreset(true);
        const r = resolvedTraffic(); return JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, mode: TRAFFIC.mode, io: r.ioRatio, cache: r.cacheHit, locked: !!r.locked }); })()`));
      await sleep(300);
      const s15 = await probe(send);
      assert("W-15 a locked replay with a latent non-native selection", t15.model === "grok" && t15.persp === "xaicash" && t15.mode === "explicit" && t15.locked, JSON.stringify(t15));
      assert("W-15 the window still offers this scenario as a default (the effective mix would not change)", s15.setHere === true, JSON.stringify({ setHere: s15.setHere, row: s15.defaultRowText }));
      assert("W-15 set it", await focusClick(send, "#win-head .win-default-row .win-set-default"));
      const s15b = await probe(send);
      assert("W-15 the confirmation claims no change of traffic mix", /^Default set: this browser will open on/.test(s15b.note || "") && !/rather than the mix selected now/.test(s15b.note || ""), s15b.note);
      assert("W-15 reload", await reload(send));
      const r15 = JSON.parse(await evalExpr(send, `(() => { const r = resolvedTraffic(); return JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, io: r.ioRatio, cache: r.cacheHit }); })()`));
      const s15c = await probe(send);
      assert("W-15 the default reopens on the same locked mix, marked as the reader's default", r15.model === "grok" && r15.persp === "xaicash" && r15.io === t15.io && r15.cache === t15.cache && s15c.badge === "★ Your default",
        JSON.stringify({ r15, badge: s15c.badge }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-16 (Astra round 3 F2): after a slider edit on another model, the stated-reading panel must not call the
         preset's unedited reading "the scenario on screen"; it names it as the unedited settings on the selected model. */
      assert("W-16 clean page", await go(send, BASE.split("?")[0]));
      const t16 = JSON.parse(await evalExpr(send, `(() => { $("model-preset").value = "sonnet"; $("persp-preset").value = "gptpro-r3"; applyPreset();
        S.util = 40; if (!noteUserEdit()) renderAll();
        const p = PERSPECTIVES.find(x => x.id === "gptpro-r3");
        const unedited = workload(applyPresetSettings(currentModel(), p, currentTrafficSel())).margin * 100;
        return JSON.stringify({ edited: workload(S).margin * 100, unedited, clean: presetIsClean(), panel: (document.getElementById("out-stated-reading") || {}).textContent || "" }); })()`));
      const r1 = x => (Math.round(x * 10) / 10).toString();
      assert("W-16 a real edit moved the on-screen result away from the unedited preset", t16.clean === false && Math.abs(t16.edited - t16.unedited) > 1, JSON.stringify({ edited: t16.edited, unedited: t16.unedited, clean: t16.clean }));
      assert("W-16 the panel never calls the unedited reading the scenario on screen", !/scenario on screen/.test(t16.panel), t16.panel.slice(0, 500));
      assert("W-16 ...it names the unedited settings on the selected model, with that reading", t16.panel.includes("Applied unedited to the model and traffic mix selected now, these settings read ≈" + r1(t16.unedited) + " %"), t16.panel.slice(0, 600));

      /* W-17 (Astra round 3 F9): with a reader's own default stored, the final-answer block still describes the page's
         BUILT-IN opening state, and says it is that, never that this page opens on the preset when this reader's does not. */
      await evalExpr(send, `localStorage.setItem("im_default_scenario_v1", JSON.stringify({ model: "opus", persp: "stress-public-rate" }))`);
      assert("W-17 reload with the planning baseline as the reader's default", await reload(send));
      const t17 = JSON.parse(await evalExpr(send, `JSON.stringify({ persp: $("persp-preset").value,
        landing: (document.getElementById("fa-landing-reading") || {}).textContent || "",
        prior: (document.getElementById("fa-prior-reading") || {}).textContent || "" })`));
      assert("W-17 the page opened on the reader's default", t17.persp === "stress-public-rate", t17.persp);
      assert("W-17 the final answer names the built-in opening state as such",
        /OPENS on by default, its built-in opening state/.test(t17.landing) && /by default it now opens on a named estimate preset/.test(t17.prior),
        JSON.stringify({ landing: t17.landing.slice(0, 220), prior: t17.prior.slice(0, 280) }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-18 (Astra round 6 F2, F6): state that S alone does not show, each built through the page's own paths. The window
         must not mark it as the default, the row's control and the confirmation must name what a default does not keep,
         and a reload must reopen the scenario's own settings. (a) round 6 F2's counterexample: a custom fleet carrying the
         preset's own blend with other rents. */
      assert("W-18 clean page (custom fleet)", await go(send, BASE.split("?")[0]));
      const f18 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "custom"; $("persp-preset").value = "median"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const canonical = { margin: appWorkload(S).margin, fleet: FLEET_ID, blend: JSON.stringify(S.blend) };
        const src = customFleetSource();
        const legs = Object.entries(S.blend).filter(([, v]) => v > 0).map(([k, v]) => ({ ...makeLegFromDonor(k, v), overrides: { rentPerHr: 20 } }));
        const v = validateCustomFleet({ name: "W-18 equal-blend fleet", clonedFrom: null, epoch: DEFAULTS_EPOCH, id: newCustomFleetId(src.ids(), 18),
          sections: [{ ...makeBlankSection("s1", 100), label: "(whole fleet)", legs }] }, { requireId: true });
        if (!v.ok) return JSON.stringify({ error: v.errors });
        src.save(v.fleet); FLEET_ID = v.fleet.id;
        const fb = fleetBaselineBlend(v.fleet.id, S, appEngineContext()); if (fb) S.blend = fb;
        if (!noteUserEdit()) fullRefresh(); else fullRefresh();
        return JSON.stringify({ canonical, fleet: FLEET_ID, clean: presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN,
          blendEqual: JSON.stringify(S.blend) === canonical.blend, margin: appWorkload(S).margin });
      })()`));
      assert("W-18 a custom fleet with the preset's blend and other rents: settings equal to the preset's, a different result",
        !f18.error && /^cf:/.test(f18.fleet) && f18.clean === true && f18.blendEqual === true && Math.abs(f18.margin - f18.canonical.margin) > 0.01, JSON.stringify(f18));
      const s18 = await probe(send);
      assert("W-18 the window does not mark it default, and the row's control names the fleet selection as not kept",
        s18.badge === null && s18.setHere === true && /^Set Central scenario's own settings as my default \(without the fleet selection on screen\)$/.test(s18.setHereText || ""),
        JSON.stringify({ badge: s18.badge, label: s18.setHereText, row: s18.defaultRowText }));
      assert("W-18 set it (custom fleet)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s18b = await probe(send);
      assert("W-18 stored as Custom on the central scenario; the confirmation says the fleet selection is not kept, and the fleet state is not marked the default",
        storedIs(s18b.stored, "custom", "median")
          && /^Default set: this browser will open on Central scenario \(Custom\)\. It opens that scenario's own settings, without the fleet selection on screen\. Shared links still open what they name\.$/.test(s18b.note || "")
          && s18b.badge === null && /^This browser opens on this scenario's own settings, without the fleet selection on screen\.$/.test(s18b.defaultRowText || ""),
        JSON.stringify({ stored: s18b.stored, note: s18b.note, badge: s18b.badge, row: s18b.defaultRowText }));
      assert("W-18 reload (custom fleet)", await reload(send));
      const r18 = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, fleet: FLEET_ID, margin: appWorkload(S).margin })`));
      const s18c = await probe(send);
      assert("W-18 the reload reopens the central scenario's own settings: the page's fleet and the result it computed before the fleet was chosen, marked as the reader's default",
        r18.model === "custom" && r18.persp === "median" && r18.fleet === f18.canonical.fleet && Math.abs(r18.margin - f18.canonical.margin) < 1e-12 && s18c.badge === "★ Your default",
        JSON.stringify({ r18, canonical: f18.canonical, badge: s18c.badge }));
      await evalExpr(send, `(() => { localStorage.removeItem("im_default_scenario_v1"); localStorage.removeItem("im_custom_fleets_v1"); })()`);

      /* (b) round 6 F6: an interlock unlocked while the family multiplier is back at the preset's value. */
      assert("W-18 clean page (interlock)", await go(send, BASE.split("?")[0]));
      const i18 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "custom"; $("persp-preset").value = "median"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const key = FAMILY_GROUP_KEYS.find(k => typeof S[k] === "number");
        const v0 = S[key];
        S[key] = v0 + 0.1; afterScenarioAxisEdit(key); const locked = INTERLOCK;
        INTERLOCK = "unlocked"; INTERLOCK_NOTE = ""; UNLOCK_ARMED = false; fullRefresh();
        S[key] = v0; afterScenarioAxisEdit(key); if (!noteUserEdit()) fullRefresh(); else fullRefresh();
        return JSON.stringify({ key, locked, interlock: INTERLOCK, clean: presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN });
      })()`));
      assert("W-18 an unlocked interlock beside settings equal to the preset's", i18.locked !== "free" && i18.interlock === "unlocked" && i18.clean === true, JSON.stringify(i18));
      const s18i = await probe(send);
      assert("W-18 the row's control names the trend-interlock choice as not kept",
        s18i.badge === null && s18i.setHere === true && /^Set Central scenario's own settings as my default \(without the trend-interlock choice on screen\)$/.test(s18i.setHereText || ""),
        JSON.stringify({ badge: s18i.badge, label: s18i.setHereText }));
      assert("W-18 set it (interlock)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      assert("W-18 reload (interlock)", await reload(send));
      const r18i = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, interlock: INTERLOCK })`));
      assert("W-18 the reload reopens with the interlock free, as disclosed", r18i.model === "custom" && r18i.persp === "median" && r18i.interlock === "free", JSON.stringify(r18i));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* (c) round 6 F6: a parameter-count case left "custom" after a total edit and a same-model preset application. */
      assert("W-18 clean page (parameter-count case)", await go(send, BASE.split("?")[0]));
      /* Starts from a fresh application of Opus on the central scenario, as a first visit to it would, so the fleet identity is the one
         a reload assigns and only the parameter-count case differs. */
      const t18 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "opus"; $("persp-preset").value = "median"; TRAFFIC = { mode: "native", profileId: null }; LAST_APPLIED_MODEL = null; applyPreset();
        const caseBefore = TOTAL_CASE_ID;
        S.total = S.total + 100; afterScenarioAxisEdit("total"); if (!noteUserEdit()) fullRefresh(); else fullRefresh();
        const caseEdited = TOTAL_CASE_ID;
        $("persp-preset").value = "median"; applyPreset();
        return JSON.stringify({ caseBefore, caseEdited, caseNow: TOTAL_CASE_ID, clean: presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN });
      })()`));
      assert("W-18 a parameter-count case left custom beside settings equal to the preset's", t18.caseBefore !== "custom" && t18.caseNow === "custom" && t18.clean === true, JSON.stringify(t18));
      const s18t = await probe(send);
      assert("W-18 the row's control names the parameter-count case as not kept",
        s18t.badge === null && s18t.setHere === true && /^Set Central scenario's own settings as my default \(without the parameter-count case on screen\)$/.test(s18t.setHereText || ""),
        JSON.stringify({ badge: s18t.badge, label: s18t.setHereText }));
      assert("W-18 set it (parameter-count case)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      assert("W-18 reload (parameter-count case)", await reload(send));
      const r18t = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, totalCase: TOTAL_CASE_ID, fresh: initTotalCaseFor(currentModel(), S.total) })`));
      assert("W-18 the reload reopens with the parameter-count case a fresh visit assigns, as disclosed",
        r18t.model === "opus" && r18t.persp === "median" && r18t.totalCase !== "custom" && r18t.totalCase === r18t.fresh && r18t.totalCase === t18.caseBefore, JSON.stringify({ r18t, before: t18.caseBefore }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* (d) Astra round 7 F3: "Compute anyway" on an incompatible pairing forces a headline that a reopened default will not compute.
         Applied fresh, as a first visit to the pairing would be, so the forced calculation is the only difference under test (a same-
         model swap would also leave the page's fleet identity behind, which (e) tests on its own). */
      assert("W-18 clean page (forced pairing)", await go(send, BASE.split("?")[0]));
      const d18 = JSON.parse(await evalExpr(send, `(() => {
        let pair = null;
        for (const m of MODELS) { for (const p of PERSPECTIVES) if (m.id !== "custom" && pairingSeverity(m, p) === "hard") { pair = [m.id, p.id]; break; } if (pair) break; }
        if (!pair) return JSON.stringify({ pair });
        $("model-preset").value = pair[0]; $("persp-preset").value = pair[1]; TRAFFIC = { mode: "native", profileId: null }; LAST_APPLIED_MODEL = null; applyPreset();
        const btn = [...document.querySelectorAll("button")].find(b => /^Compute anyway/.test(b.textContent.trim()));
        if (btn) btn.dataset.w18 = "compute-anyway";
        return JSON.stringify({ pair, hero: $("out-margin").textContent.trim(), button: !!btn });
      })()`));
      assert("W-18 an incompatible pairing shows no headline and offers Compute anyway", Array.isArray(d18.pair) && d18.hero === "n/a" && d18.button, JSON.stringify(d18));
      assert("W-18 press Compute anyway", await pressControl(send, 'button[data-w18="compute-anyway"]'));
      const f18d = JSON.parse(await evalExpr(send, `JSON.stringify({ forced: FORCE_EXPLORATORY, hero: $("out-margin").textContent.trim() })`));
      const s18d = await probe(send);
      assert("W-18 the forced headline is computed, the window does not mark it default, and the row's control names the forced calculation as not kept",
        f18d.forced === true && /%/.test(f18d.hero) && s18d.badge === null && s18d.setHere === true
          && /^Set .+'s own settings as my default \(without the forced calculation of this incompatible pairing on screen\)$/.test(s18d.setHereText || ""),
        JSON.stringify({ f18d, badge: s18d.badge, label: s18d.setHereText }));
      assert("W-18 set it (forced pairing)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s18d2 = await probe(send);
      assert("W-18 the confirmation says the forced calculation is not kept",
        storedIs(s18d2.stored, d18.pair[0], d18.pair[1]) && /\. It opens that scenario's own settings, without the forced calculation of this incompatible pairing on screen\. Shared links still open what they name\.$/.test(s18d2.note || ""),
        JSON.stringify({ stored: s18d2.stored, note: s18d2.note }));
      assert("W-18 reload (forced pairing)", await reload(send));
      const r18d = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, forced: FORCE_EXPLORATORY, hero: $("out-margin").textContent.trim() })`));
      assert("W-18 the reload reopens the pairing without the forced calculation, as disclosed",
        r18d.model === d18.pair[0] && r18d.persp === d18.pair[1] && r18d.forced === false && r18d.hero === "n/a", JSON.stringify(r18d));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* (e) Astra round 7 F4: swapped away from a preset that owns its blend, the page keeps the "preset" fleet identity where a fresh
         visit assigns the model's default fleet. They compute alike, but the fleet panel and a shared link differ, so the control says
         which fleet a default opens with, and the reload shows it, in the share token too. */
      assert("W-18 clean page (page fleet)", await go(send, BASE.split("?")[0]));
      const e18 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "opus"; $("persp-preset").value = "gptpro-r3"; TRAFFIC = { mode: "native", profileId: null }; LAST_APPLIED_MODEL = null; applyPreset();
        const from = FLEET_ID;
        $("persp-preset").value = "median"; applyPreset();
        let tokenFleet = null;
        try { const dec = decodeScenario(encodeScenario(S, $("model-preset").value, $("persp-preset").value, resolvedTraffic(), null, { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }));
          tokenFleet = dec && dec._meta && dec._meta.fleet ? dec._meta.fleet.id : null; } catch (e) { tokenFleet = "ENCODE-THREW: " + String(e && e.message).slice(0, 120); }
        return JSON.stringify({ from, fleet: FLEET_ID, tokenFleet, clean: presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN });
      })()`));
      assert("W-18 swapped from GPT-5.6 Pro to the central scenario, the screen keeps the preset fleet identity, in its share token too",
        e18.from === "preset" && e18.fleet === "preset" && e18.tokenFleet === "preset" && e18.clean === true, JSON.stringify(e18));
      const s18e = await probe(send);
      assert("W-18 the row's control says a default opens with the fleet a fresh visit assigns",
        s18e.badge === null && s18e.setHere === true && /^Set Central scenario's own settings as my default \(it opens with the fleet a fresh visit assigns\)$/.test(s18e.setHereText || ""),
        JSON.stringify({ badge: s18e.badge, label: s18e.setHereText }));
      assert("W-18 set it (page fleet)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s18e2 = await probe(send);
      assert("W-18 the confirmation names the fleet a fresh visit assigns",
        /^Default set: this browser will open on Central scenario\. It opens that scenario's own settings, with the fleet a fresh visit assigns\. Shared links still open what they name\.$/.test(s18e2.note || ""), s18e2.note);
      assert("W-18 reload (page fleet)", await reload(send));
      const r18e = JSON.parse(await evalExpr(send, `(() => {
        let tokenFleet = null;
        try { const dec = decodeScenario(encodeScenario(S, $("model-preset").value, $("persp-preset").value, resolvedTraffic(), null, { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }));
          tokenFleet = dec && dec._meta && dec._meta.fleet ? dec._meta.fleet.id : null; } catch (e) { tokenFleet = "ENCODE-THREW: " + String(e && e.message).slice(0, 120); }
        return JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, fleet: FLEET_ID, tokenFleet }); })()`));
      const s18e3 = await probe(send);
      assert("W-18 the reload opens with the fleet a fresh visit assigns, in the share token too, marked as the reader's default",
        r18e.model === "opus" && r18e.persp === "median" && r18e.fleet !== "preset" && r18e.tokenFleet === r18e.fleet && s18e3.badge === "★ Your default",
        JSON.stringify({ r18e, badge: s18e3.badge }));
      await evalExpr(send, `localStorage.removeItem("im_default_scenario_v1")`);

      /* W-19 (Astra round 7 F7): a saved scenario loads as an edited state. Its page base (a lens here) is kept, so the row offers that
         scenario's own settings and names what a default does not keep, and a reload reopens those settings. */
      assert("W-19 clean page", await go(send, BASE.split("?")[0]));
      const w19 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "custom"; $("persp-preset").value = "median"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const canonical = appWorkload(S).margin;
        const inp = $("scenario-name"); if (inp) { inp.value = "W-19 saved lens"; NAME_DIRTY = true; }
        $("save-preset").click();
        loadSavedPreset("W-19 saved lens");
        const b = windowBaseScenario();
        return JSON.stringify({ canonical, modifiedFrom: MODIFIED_FROM, base: b ? b.id : null, fleet: FLEET_ID, totalCase: TOTAL_CASE_ID });
      })()`));
      assert("W-19 the loaded saved scenario is an edited state whose base is the lens it was saved from", /saved scenario/.test(w19.modifiedFrom || "") && w19.base === "median", JSON.stringify(w19));
      const s19 = await probe(send);
      assert("W-19 the row offers the central scenario's own settings and names what a default does not keep",
        s19.setHere === true && /^Set Central scenario's own settings as my default \(.*without the edits, the fleet selection.* on screen\)$/.test(s19.setHereText || "")
          && !/names none of this page's scenarios/.test(s19.defaultRowText || ""),
        JSON.stringify({ label: s19.setHereText, row: s19.defaultRowText }));
      assert("W-19 set it", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s19b = await probe(send);
      assert("W-19 stored as Custom on the central scenario, and the confirmation names what is not kept",
        storedIs(s19b.stored, "custom", "median") && /It opens that scenario's own settings, without the edits, the fleet selection/.test(s19b.note || ""), JSON.stringify({ stored: s19b.stored, note: s19b.note }));
      assert("W-19 reload", await reload(send));
      const r19 = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, modifiedFrom: MODIFIED_FROM, margin: appWorkload(S).margin })`));
      assert("W-19 the reload reopens the central scenario's own settings",
        r19.model === "custom" && r19.persp === "median" && r19.modifiedFrom === null && Math.abs(r19.margin - w19.canonical) < 1e-12, JSON.stringify({ r19, canonical: w19.canonical }));
      /* Round 8 F5: the lens base survives saving the loaded state again, and sharing it to a fresh visit. The default stored above is
         cleared first, so the fresh visit's row is not the opening scenario's and must carry the control itself. */
      const c19 = JSON.parse(await evalExpr(send, `(() => {
        localStorage.removeItem("im_default_scenario_v1");
        loadSavedPreset("W-19 saved lens");
        const inp = $("scenario-name"); if (inp) { inp.value = "W-19 saved again"; NAME_DIRTY = true; }
        $("save-preset").click();
        let rec = null; try { rec = JSON.parse(localStorage.getItem("im_presets_v1") || "{}")["W-19 saved again"] || null; } catch {}
        loadSavedPreset("W-19 saved again");
        const b = windowBaseScenario();
        return JSON.stringify({ savedPersp: rec ? rec.__persp : null, base: b ? b.id : null, modifiedFrom: MODIFIED_FROM });
      })()`));
      assert("W-19 saved again from the loaded lens, the record keeps the lens as its origin and loads with that base",
        c19.savedPersp === "median" && c19.base === "median" && /saved scenario/.test(c19.modifiedFrom || ""), JSON.stringify(c19));
      const link19 = await evalExpr(send, `(() => { copyScenarioLink(); return location.href; })()`);
      assert("W-19 share the loaded lens: a link is minted", /[?&]s=/.test(link19 || ""), String(link19).slice(0, 160));
      assert("W-19 open that link as a fresh visit", await go(send, link19));
      const r19c = JSON.parse(await evalExpr(send, `(() => { const b = windowBaseScenario(); return JSON.stringify({ base: b ? b.id : null, modifiedFrom: MODIFIED_FROM, model: $("model-preset").value }); })()`));
      const s19c = await probe(send);
      assert("W-19 the fresh visit resolves the link's origin to the central scenario, and the row offers its own settings",
        r19c.base === "median" && r19c.model === "custom" && s19c.setHere === true && /^Set Central scenario's own settings as my default \(/.test(s19c.setHereText || "")
          && !/names none of this page's scenarios/.test(s19c.defaultRowText || ""), JSON.stringify({ r19c, label: s19c.setHereText, row: s19c.defaultRowText }));
      /* Round 9 F4: the recipient of that link saves it; the saved record keeps the lens, and loading it resolves the base again. */
      const d19 = JSON.parse(await evalExpr(send, `(() => {
        const inp = $("scenario-name"); if (inp) { inp.value = "W-19 recipient save"; NAME_DIRTY = true; }
        $("save-preset").click();
        let rec = null; try { rec = JSON.parse(localStorage.getItem("im_presets_v1") || "{}")["W-19 recipient save"] || null; } catch {}
        loadSavedPreset("W-19 recipient save");
        const b = windowBaseScenario();
        return JSON.stringify({ savedPersp: rec ? rec.__persp : null, base: b ? b.id : null });
      })()`));
      assert("W-19 the link's recipient saves it, and that record keeps the lens as its origin and loads with that base",
        d19.savedPersp === "median" && d19.base === "median", JSON.stringify(d19));
      await evalExpr(send, `(() => { localStorage.removeItem("im_default_scenario_v1"); localStorage.removeItem("im_presets_v1"); })()`);

      /* W-20 (Astra round 8 F6): choices that compute alike but identify or share differently. (a) Custom traffic at the model's own
         numbers; (b) a scenario name the reader typed. */
      assert("W-20 clean page (traffic selection)", await go(send, BASE.split("?")[0]));
      const a20 = JSON.parse(await evalExpr(send, `(() => {
        $("model-preset").value = "custom"; $("persp-preset").value = "median"; TRAFFIC = { mode: "native", profileId: null }; applyPreset();
        const before = resolvedTraffic();
        const ts = $("traffic-preset"); ts.value = "__custom"; ts.oninput();
        const after = resolvedTraffic();
        return JSON.stringify({ before: [before.mode, before.profileId, before.ioRatio, before.cacheHit], after: [after.mode, after.profileId, after.ioRatio, after.cacheHit] });
      })()`));
      assert("W-20 Custom traffic selected at the model's own numbers: the same mix, a different selection",
        a20.before[0] === "native" && a20.after[0] === "custom" && a20.before[2] === a20.after[2] && a20.before[3] === a20.after[3], JSON.stringify(a20));
      const s20 = await probe(send);
      assert("W-20 the row's control names the traffic selection as not kept",
        s20.badge === null && s20.setHere === true && /^Set Central scenario's own settings as my default \(without the traffic selection on screen\)$/.test(s20.setHereText || ""),
        JSON.stringify({ badge: s20.badge, label: s20.setHereText }));
      assert("W-20 set it (traffic selection)", await pressControl(send, "#win-head .win-default-row .win-set-default"));
      const s20b = await probe(send);
      assert("W-20 the confirmation names the traffic selection",
        storedIs(s20b.stored, "custom", "median") && /\. It opens that scenario's own settings, without the traffic selection on screen\. Shared links still open what they name\.$/.test(s20b.note || ""),
        JSON.stringify({ stored: s20b.stored, note: s20b.note }));
      assert("W-20 reload (traffic selection)", await reload(send));
      const r20 = JSON.parse(await evalExpr(send, `JSON.stringify({ model: $("model-preset").value, persp: $("persp-preset").value, mode: TRAFFIC.mode })`));
      const s20c = await probe(send);
      assert("W-20 the reload opens with the model's own traffic selection, marked as the reader's default",
        r20.model === "custom" && r20.persp === "median" && r20.mode === "native" && s20c.badge === "★ Your default", JSON.stringify({ r20, badge: s20c.badge }));
      await evalExpr(send, `(() => { const inp = $("scenario-name"); inp.value = "W-20 budget"; inp.oninput(); })()`);
      const s20d = await probe(send);
      assert("W-20 a typed scenario name on the opening scenario is not marked default, and the row says the name is not kept",
        s20d.badge === null && /^This browser opens on this scenario's own settings, without the scenario name you typed on screen\.$/.test(s20d.defaultRowText || ""),
        JSON.stringify({ badge: s20d.badge, row: s20d.defaultRowText }));
      /* Round 9 F3: saving the typed name clears it from the comparison, and the window shows that at once (no other render first). */
      await evalExpr(send, `$("save-preset").click()`);
      const s20s = await probe(send);
      assert("W-20 saving the typed name marks the opening scenario as the default again at once, and the row no longer mentions the name",
        s20s.badge === "★ Your default" && !/scenario name you typed/.test(s20s.defaultRowText || ""), JSON.stringify({ badge: s20s.badge, row: s20s.defaultRowText }));
      await evalExpr(send, `(() => { const inp = $("scenario-name"); inp.value = "W-20 again"; inp.oninput(); })()`);
      await evalExpr(send, `(() => { const inp = $("scenario-name"); inp.value = ""; inp.oninput(); })()`);
      const s20e = await probe(send);
      assert("W-20 clearing the typed name marks the opening scenario as the default again", s20e.badge === "★ Your default", JSON.stringify({ badge: s20e.badge, row: s20e.defaultRowText }));
      await evalExpr(send, `(() => { localStorage.removeItem("im_default_scenario_v1"); localStorage.removeItem("im_presets_v1"); })()`);
    }

    if (want("window") && !LIVE_URL) {
      /* W-9: find a pairing the page refuses to compute and require the calculation to go with the number. */
      const hard = await evalExpr(send, `(() => { for (const m of MODELS) for (const p of PERSPECTIVES) if (pairingSeverity(m, p) === "hard") return [m.id, p.id]; return null; })()`);
      assert("W-9 a refused pairing exists to test against", Array.isArray(hard), String(hard));
      if (Array.isArray(hard)) {
        await evalExpr(send, `(() => { $("model-preset").value = ${JSON.stringify(hard[0])}; $("persp-preset").value = ${JSON.stringify(hard[1])}; FORCE_EXPLORATORY = false; applyPreset(); })()`);
        await sleep(300);
        const s9 = await probe(send);
        assert("W-9 no headline, and no stale calculation beside it", s9.hero.trim() === "n/a" && s9.calcHidden === true && s9.calcText === "",
          JSON.stringify({ hero: s9.hero, calcHidden: s9.calcHidden, calcText: s9.calcText }));
        assert("W-9 no previous percentage survives in the headline's tooltip (Astra round 2 F7)", !/\d/.test(s9.heroTitle), s9.heroTitle);
        assert("W-9 the empty calculation box is not displayed at all (Astra round 2 F11)", s9.calcDisplay === "none" && s9.calcHeight === 0,
          JSON.stringify({ display: s9.calcDisplay, height: s9.calcHeight }));
      }
    }
  });

  if (want("window")) {
    await withBrowser(async send => {
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      assert("W-10 page initialised at 390 px", await go(send, BASE));
      const s = await probe(send);
      assert("W-10 the page does not scroll horizontally at 390 px", s.overflow.doc <= s.overflow.vw, JSON.stringify(s.overflow));
      assert("W-10 the window and the calculation fit the viewport", s.overflow.win <= s.overflow.vw && (s.overflow.calc === null || s.overflow.calc <= s.overflow.vw), JSON.stringify(s.overflow));
      checkFace("W-10", s);
    });
  }
}

main().catch(e => { assert("harness completed", false, e && e.stack); })
  .finally(() => {
    console.log(failures === 0 ? "\nALL DEFAULT-WINDOW CHECKS PASS" : `\n${failures} DEFAULT-WINDOW FAILURE(S)`);
    process.exit(failures === 0 ? 0 : 1);
  });
