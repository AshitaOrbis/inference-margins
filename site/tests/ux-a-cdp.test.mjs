// b9 UX-A — the §20 R-1/R-2/R-3 dialog coordinator + tooltip reachability, over CDP.
// Design contract: research/b9-ux-memo.md §16 (UX-A leg spec, gate-A folded, 0 P0 / 4 P1).
//
// WHY THIS FILE EXISTS AND WHAT IT DELIBERATELY DOES NOT ASSERT:
//   * The defect this leg exists to fix is not "small text" — it is text that could not be reached
//     by any means. TIPS.specDec (3,352 chars) rendered a 1,328px box in an 844px viewport at
//     top:-494px with `pointer-events: none`. U-6 therefore carries its own NEGATIVE CONTROL: the
//     OLD clamp arithmetic is re-evaluated in-page against the same box, and the test fails if that
//     arithmetic does NOT reproduce the off-screen placement. A fix whose bug cannot be reproduced
//     is a fix nobody can trust.
//   * The tooltip keeps `pointer-events: none` ON PURPOSE, so `overflow-y: auto` does NOT make it
//     user-scrollable. This suite must never claim it does — the dialog is the scrollable read.
//   * UX-A has NO relocated payload (tipContent() CONSTRUCTS a fragment). There is no fake
//     relocation here to make the machinery look exercised; relocation lands with UX-B.
// Run: node site/tests/ux-a-cdp.test.mjs
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
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result.value;
};

/* ---- U-6: viewport containment, with the OLD arithmetic as the negative control ---- */
const PROBE_TIPS = `(() => {
  const r = { vw: innerWidth, vh: innerHeight, coarse: matchMedia('(pointer: coarse)').matches, tips: [] };
  const t = document.getElementById('tooltip');
  const G = 8;
  // the four viewport corners plus the centre — a one-anchor test proves almost nothing
  const anchors = [[4, 4], [innerWidth - 4, 4], [4, innerHeight - 4], [innerWidth - 4, innerHeight - 4], [innerWidth / 2, innerHeight / 2]];
  for (const key of ['specDec', 'hw-ascend', 'trendMonths', 'hw-tpu7', 'stackMult']) {
    for (const [ax, ay] of anchors) {
      const frag = tipContent(key); if (!frag) continue;
      showTip(frag, ax, ay);
      const b = t.getBoundingClientRect();
      const inside = b.left >= G - 1 && b.top >= G - 1 && b.right <= innerWidth - G + 1 && b.bottom <= innerHeight - G + 1;
      /* NEGATIVE CONTROL. It must reproduce the PRE-UX-A geometry, which means measuring the box
         with the new CSS caps LIFTED — against the capped box the old arithmetic no longer escapes
         and the control would pass vacuously, which is precisely what it exists to prevent. */
      const savedH = t.style.maxHeight, savedW = t.style.maxWidth;
      t.style.maxHeight = 'none'; t.style.maxWidth = 'none';
      const u = t.getBoundingClientRect();
      const oldLeft = Math.min(innerWidth - u.width - 10, Math.max(8, ax + 12));
      const oldTop = Math.min(innerHeight - u.height - 10, Math.max(8, ay + 14));
      t.style.maxHeight = savedH; t.style.maxWidth = savedW;
      r.tips.push({ key, ax: Math.round(ax), ay: Math.round(ay),
        h: Math.round(b.height), w: Math.round(b.width),
        left: Math.round(b.left), top: Math.round(b.top), inside,
        oldWouldEscape: oldLeft < 0 || oldTop < 0 });
      hideTip();
    }
  }
  const cs = getComputedStyle(t);
  r.style = { maxH: cs.maxHeight, overflowY: cs.overflowY, pointerEvents: cs.pointerEvents, maxW: cs.maxWidth };
  return JSON.stringify(r);
})()`;

/* ---- U-7/U-9/U-11/U-13/U-20/U-21/U-22: the coordinator ---- */
const PROBE_DIALOG = `(async () => {
  const r = {}; const q = s => document.querySelector(s);
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const infos = [...document.querySelectorAll('.info')];
  r.infoCount = infos.length;
  r.allHavePopup = infos.every(b => b.getAttribute('aria-haspopup') === 'dialog');
  r.allNamed = infos.every(b => (b.getAttribute('aria-label') || '').length > 0);
  r.faTriggersHavePopup = [...document.querySelectorAll('[data-fa-explain]')].every(b => b.getAttribute('aria-haspopup') === 'dialog');

  // U-13: live data-tip keys are a bijection onto reachable payloads
  const liveKeys = [...new Set(infos.map(b => b.dataset.tip))];
  r.liveKeys = liveKeys.length;
  r.everyLiveKeyInTips = liveKeys.every(k => !!TIPS[k]);
  r.tipsTotal = Object.keys(TIPS).length;
  r.keysWithoutTrigger = Object.keys(TIPS).filter(k => !liveKeys.includes(k)).length;

  // U-7: activation hides the tooltip, then opens the dialog carrying the FULL body
  const target = infos.find(b => b.dataset.tip === 'specDec') || infos[0];
  const key = target.dataset.tip;
  target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: 10, clientY: 10 }));
  await wait(30);
  target.click(); await wait(80);
  const dlg = q('dialog[data-explain-dialog]');
  r.opened = !!dlg && dlg.open === true;
  r.tooltipHidden = document.getElementById('tooltip').hidden === true;
  r.bodyExact = !!q('#explain-tip-body') && q('#explain-tip-body').textContent.includes(TIPS[key].b);
  r.titleExact = !!q('.fa-explain-title') && q('.fa-explain-title').textContent === TIPS[key].t;
  r.labelledBy = !!dlg && !!dlg.getAttribute('aria-labelledby') &&
    document.querySelectorAll('#' + CSS.escape(dlg.getAttribute('aria-labelledby'))).length === 1;
  r.phaseOpen = EXPLAIN.phase === 'open';
  // U-9: no duplicate ids while a dialog is open
  { const seen = new Set(); let dup = 0;
    document.querySelectorAll('[id]').forEach(el => { if (seen.has(el.id)) dup++; seen.add(el.id); });
    r.duplicateIds = dup; }

  // U-11/U-22: tip -> M6 -> close leaves exactly one, then none; ownership crosses cleanly
  q('#fa-deeper-trigger').click(); await wait(80);
  r.afterCrossOpen = document.querySelectorAll('dialog[data-explain-dialog]').length;
  r.crossIsFa = !!q('dialog[data-fa-explain]');
  closeActiveExplain(); await wait(60);
  r.afterClose = document.querySelectorAll('dialog[data-explain-dialog]').length;
  r.phaseIdle = EXPLAIN.phase === 'idle';
  r.bodyUnlocked = getComputedStyle(document.body).overflow !== 'hidden';

  // U-21: hash navigation while open closes the dialog
  target.click(); await wait(60);
  location.hash = '#s7'; await wait(80);
  r.hashClosed = EXPLAIN.phase === 'idle' && !q('dialog[data-explain-dialog]');

  // U-14: the PRE-MUTATION guard — a dialog opened from a GENERATED .info must not survive a
  // rebuild of its own container. buildControls() runs before renderAll() in onChange(true).
  const gen = [...document.querySelectorAll('#controls .info')][0];
  if (gen) {
    gen.click(); await wait(60);
    r.genOpened = EXPLAIN.phase === 'open';
    buildControls(); await wait(60);
    r.guardClosedOnRebuild = EXPLAIN.phase === 'idle' && !q('dialog[data-explain-dialog]');
    r.noStrandedFocusTarget = EXPLAIN.returnFocus === null;
  } else { r.genOpened = r.guardClosedOnRebuild = r.noStrandedFocusTarget = 'no-generated-info'; }

  // U-22 fault injection: a throwing payload builder must still land idle with no dialog
  try { explainOpen({ id: 'explain-fault', title: 'fault', fa: false }, () => { throw new Error('injected'); }, null); } catch {}
  await wait(60);
  r.faultLeavesIdle = EXPLAIN.phase === 'idle' && !q('dialog[data-explain-dialog]');
  r.faultUnlocked = getComputedStyle(document.body).overflow !== 'hidden';

  // idempotence: closing when already idle is a no-op, not a throw
  let threw = false; try { closeActiveExplain(); closeActiveExplain(); } catch { threw = true; }
  r.closeIdempotent = !threw && EXPLAIN.phase === 'idle';
  return JSON.stringify(r);
})()`;

const PROBE_COARSE = `(() => {
  const r = { coarse: matchMedia('(pointer: coarse)').matches };
  const boxes = [...document.querySelectorAll('.info')].map(b => { const x = b.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; });
  r.count = boxes.length;
  r.allMeet44 = boxes.every(([w, h]) => w >= 44 && h >= 44);
  r.smallest = boxes.reduce((a, b) => (b[0] * b[1] < a[0] * a[1] ? b : a), boxes[0] || [0, 0]);
  return JSON.stringify(r);
})()`;

async function withPage(fn, emulate) {
  const userDir = mkdtempSync(join(tmpdir(), "im-ux-a-cdp-"));
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
      await send("Page.enable"); await send("Page.reload", { ignoreCache: true }); await sleep(600);
    }
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      if (await evalExpr(send, "(document.readyState!=='loading' && typeof TIPS==='object' && typeof showTip==='function' && typeof EXPLAIN==='object')")) { ready = true; break; }
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

  /* U-6 across the three viewports that matter — 320 is where the horizontal clamp failed. */
  for (const vp of [null, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    const label = vp ? `${vp.width}x${vp.height}` : "desktop";
    await withPage(async (send, ready) => {
      assert(`U-6 [${label}] page initialised`, ready);
      if (!ready) return;
      const r = JSON.parse(await evalExpr(send, PROBE_TIPS));
      const escaped = r.tips.filter(t => !t.inside);
      assert(`U-6 [${label}] every tooltip stays inside the viewport gutter at all five anchors`,
        escaped.length === 0,
        escaped.slice(0, 3).map(t => `${t.key}@${t.ax},${t.ay} -> ${t.left},${t.top} ${t.w}x${t.h}`).join(" | "));
      const controls = r.tips.filter(t => t.oldWouldEscape);
      assert(`U-6 [${label}] NEGATIVE CONTROL: the OLD clamp arithmetic still escapes on this page`,
        controls.length > 0,
        "the pre-UX-A bug no longer reproduces here — this test would pass vacuously");
      assert(`U-6 [${label}] the tooltip is height-capped and not left to grow unbounded`,
        r.style.maxH !== "none", r.style.maxH);
      assert(`U-6 [${label}] pointer-events stays none (the preview is deliberately NON-interactive)`,
        r.style.pointerEvents === "none", r.style.pointerEvents);
    }, vp);
  }

  /* the coordinator, on a fine pointer */
  await withPage(async (send, ready) => {
    assert("coordinator: page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_DIALOG));
    assert("U-20 every .info declares aria-haspopup=dialog", r.allHavePopup, String(r.infoCount));
    assert("U-20 …and carries a non-empty accessible name", r.allNamed);
    assert("U-20 the three M6 triggers declare it too", r.faTriggersHavePopup);
    assert("U-13 every live data-tip key exists in TIPS", r.everyLiveKeyInTips,
      `${r.liveKeys} live keys of ${r.tipsTotal} TIPS`);
    assert("U-13 TIPS keys with no live trigger are counted, not silently unreachable",
      typeof r.keysWithoutTrigger === "number", String(r.keysWithoutTrigger));
    assert("U-7 activating .info opens the dialog", r.opened);
    assert("U-7 …and hides the hover preview first (never both at once)", r.tooltipHidden);
    assert("U-7 …carrying the FULL tip body verbatim", r.bodyExact);
    assert("U-7 …under the tip's own title", r.titleExact);
    assert("U-20 the dialog's aria-labelledby resolves to exactly one heading", r.labelledBy);
    assert("U-9 zero duplicate ids while a dialog is open", r.duplicateIds === 0, String(r.duplicateIds));
    assert("U-11/U-22 tip -> M6 leaves exactly ONE dialog", r.afterCrossOpen === 1, String(r.afterCrossOpen));
    assert("U-11/U-22 …and it is the M6 one (ownership crossed cleanly)", r.crossIsFa);
    assert("U-11 closing leaves none, phase idle, body unlocked",
      r.afterClose === 0 && r.phaseIdle && r.bodyUnlocked);
    assert("U-21 hash navigation while open closes the dialog", r.hashClosed);
    assert("U-14 a dialog opened from a GENERATED .info opens", r.genOpened === true || r.genOpened === "no-generated-info");
    assert("U-14 …and the PRE-MUTATION guard closes it when its container is rebuilt",
      r.guardClosedOnRebuild === true || r.guardClosedOnRebuild === "no-generated-info", String(r.guardClosedOnRebuild));
    assert("U-14 …leaving no stranded return-focus target",
      r.noStrandedFocusTarget === true || r.noStrandedFocusTarget === "no-generated-info");
    assert("U-22 a THROWING payload builder still lands idle with no dialog", r.faultLeavesIdle);
    assert("U-22 …and does not leave the page scroll locked", r.faultUnlocked);
    assert("U-22 close is idempotent (closing twice from idle is a no-op, not a throw)", r.closeIdempotent);
  }, null);

  /* U-8: coarse-pointer touch targets */
  await withPage(async (send, ready) => {
    assert("U-8 coarse page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_COARSE));
    assert("U-8 the emulated pointer really is coarse (the probe is not vacuous)", r.coarse);
    assert("U-8 every .info is at least 44x44 CSS px on a coarse pointer", r.allMeet44,
      `smallest ${JSON.stringify(r.smallest)} of ${r.count}`);
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
  console.log(failures ? `\n${failures} UX-A CDP FAILURE(S)` : "\nALL UX-A CDP CHECKS PASS");
  process.exitCode = failures === 0 ? 0 : 1;
}
