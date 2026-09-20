/* BAND LOCK — a declared range on a LOCKED dial must not compute, and must SAY it did not.
   Owner note 74103a (2026-08-07 19:33Z) confirmed the algorithmic-lead dial is a first-class
   3-point axis: "that would be a spot where many people would like to set their upper and lower
   bounds and their median... this one is very uncertain."

   Confirming that is exactly what surfaced these two, and they fail in OPPOSITE directions, which
   is why only an interaction test can see them:
     * a REPLAY perspective forces E = 1 on the lead, so a declared lead range contributes NOTHING
       and the readout would report an absence of uncertainty where there is a locked control;
     * the INTERLOCK locks the lead after a family edit, and a range declared beforehand would keep
       widening the band through a lever the reader can no longer see — re-introducing the very
       double-count the interlock exists to prevent.
   Neither is visible to --dump-dom: both locks only exist after the page has been driven.
   Run: node tests/band-lock-cdp.test.mjs */
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

const PROBE_LEAD = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const bandText = () => (document.getElementById('out-margin-band') || {}).textContent || '';

  // 1. THE LEAD IS A FIRST-CLASS 3-POINT AXIS: declare a range on it, on the page-open preset.
  S.dialRanges = Object.assign({}, S.dialRanges || {}, { trendMonths: { lo: 0, mid: 3, hi: 6 } });
  renderMarginBand(); await wait(60);
  r.leadHandlesRendered = !!document.querySelector('[aria-label^="Algorithmic lead"][aria-label$="median"]');
  r.leadInBand = /Algorithmic lead/.test(bandText());
  r.leadBasisMoved = /the algorithmic-lead prior itself is part of this range/.test(bandText());
  r.leadEmphasised = !!document.querySelector('#out-margin-band .band-lead-moved');

  // 2. A REPLAY PERSPECTIVE LOCKS THE LEAD AT 0. The range is still declared; it must be EXCLUDED
  //    and NAMED, not silently reported as an axis that moves nothing.
  const sel = document.getElementById('persp-preset');
  const replay = [...sel.options].find(o => /xaicash/.test(o.value));
  r.replayFound = !!replay;
  if (replay) {
    sel.value = replay.value; sel.dispatchEvent(new Event('change')); await wait(220);
    S.dialRanges = Object.assign({}, S.dialRanges || {}, { trendMonths: { lo: 0, mid: 3, hi: 6 } });
    renderMarginBand(); await wait(80);
    const t = bandText();
    r.lockedNamed = /Not in this range/.test(t) && /Algorithmic lead/.test(t);
    r.lockedGivesReason = /locked at 0/.test(t) || /double-count/.test(t);
    r.notReportedAsZeroMovement = !/Algorithmic lead[^.]*moves the margin by nothing/.test(t);
    r.headerExcludesLocked = !document.getElementById('out-margin-range');
  }
  return JSON.stringify(r);
})()`;

const PROBE_OPTIN = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const r = {};
  const band = () => document.getElementById('out-margin-band');
  const val = () => band().querySelector('.band-compounded-value');
  const btn = () => band().querySelector('.band-toggle');

  // The page opens on a preset that DECLARES five ranges, so the per-dial breakdown is present.
  r.perDialAtOpen = !!band().querySelector('.band-per-dial li');
  r.headerRangeAbsent = !document.getElementById('out-margin-range');

  // THE STATE IS REAL: the compounded value is not in the DOM until asked for.
  r.valueAbsentAtOpen = !val();
  r.controlPresent = !!btn();
  r.ariaClosed = btn() && btn().getAttribute('aria-expanded') === 'false';
  r.flagFalse = (typeof COMPOUNDED_BAND_OPT_IN !== 'undefined') && COMPOUNDED_BAND_OPT_IN === false;

  // CLICK IT: the value appears, the flag flips, aria follows.
  if (btn()) { btn().click(); await wait(120); }
  r.valuePresentAfterClick = !!val();
  r.valueCarriesAPercent = !!val() && /%/.test(val().textContent);
  r.valueCarriesTheLabel = !!val() && /COMPOUNDED/.test(val().textContent);
  r.flagTrue = (typeof COMPOUNDED_BAND_OPT_IN !== 'undefined') && COMPOUNDED_BAND_OPT_IN === true;
  r.ariaOpen = btn() && btn().getAttribute('aria-expanded') === 'true';

  // CLICK AGAIN: it goes away. A one-way reveal is not an opt-in.
  if (btn()) { btn().click(); await wait(120); }
  r.valueGoneAfterSecondClick = !val();
  r.ariaClosedAgain = btn() && btn().getAttribute('aria-expanded') === 'false';
  return JSON.stringify(r);
})()`;

async function main() {
  if (!HTML) { assert("locate site/index.html", false); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  await withPage(async (send, ready) => {
    assert("band-lock page initialised", ready);
    if (!ready) return;
    const r = JSON.parse(await evalExpr(send, PROBE_LEAD));

    assert("the ALGORITHMIC LEAD dial carries 2/3-point handles like any other axis (owner note 74103a)",
      r.leadHandlesRendered);
    assert("...and a range declared on it actually reaches the band", r.leadInBand);
    assert("...and the band says the prior is part of the range width (no cannot-be-compared framing)", r.leadBasisMoved);
    assert("...and that note is emphasised rather than filed with the rest", r.leadEmphasised);

    assert("a replay perspective is selectable (the lock probe is not vacuous)", r.replayFound);
    assert("under a replay lock the declared lead range is EXCLUDED and NAMED", r.lockedNamed);
    assert("...with the lock's own reason, not a bare exclusion", r.lockedGivesReason);
    assert("...and never reported as an axis that simply moves the margin by nothing",
      r.notReportedAsZeroMovement);
    assert("...and no header range exists to disagree with the breakdown", r.headerExcludesLocked);

    const o = JSON.parse(await evalExpr(send, PROBE_OPTIN));
    assert("per-dial ranges DO render at page open (the owner-accepted half)", o.perDialAtOpen);
    assert("no compounded range renders beneath the headline number", o.headerRangeAbsent);
    assert("the compounded VALUE is absent from the DOM until asked for", o.valueAbsentAtOpen);
    assert("...and the opt-in control is present and reports itself closed",
      o.controlPresent && o.ariaClosed && o.flagFalse);
    assert("clicking it REVEALS a compounded percentage carrying its label",
      o.valuePresentAfterClick && o.valueCarriesAPercent && o.valueCarriesTheLabel);
    assert("...and the state and aria both follow the click", o.flagTrue && o.ariaOpen);
    assert("clicking again HIDES it — a one-way reveal is not an opt-in",
      o.valueGoneAfterSecondClick && o.ariaClosedAgain);

  });
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
  console.log(failures === 0 ? "\nALL BAND-LOCK CDP CHECKS PASS" : `\n${failures} BAND-LOCK CDP FAILURE(S)`);
  process.exitCode = failures === 0 ? 0 : 1;
}
