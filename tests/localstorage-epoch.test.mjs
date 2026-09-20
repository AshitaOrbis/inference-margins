// localStorage EPOCH deprecation contract (IM1 / v2.2) — the permanent automated gate for the
// im_presets_v1 saved-scenario epoch check (governing plan §4 risk 1(c), memo
// research/im1-permalink-epoch-memo.md §3). Run: node tests/localstorage-epoch.test.mjs
//
// Why raw CDP (no Playwright dependency): the browser suite (run-app-tests.sh) renders static DOM via
// --dump-dom and cannot seed localStorage before load or click a control. This test drives Chrome over
// the DevTools Protocol (--remote-debugging-port + a WebSocket, both Node built-ins on node>=21) to
// seed a saved-preset store, then exercises the real app functions (renderSavedList / loadSavedPreset)
// and asserts on live DOM + state. Everything is LOCAL file:// — no network, no deploy, no prod URL.
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

// Resolve chrome and the served HTML (works from tests/ source AND from the served site/tests/ copy).
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
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const list = await res.json();
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

// The in-page probe: seeds a stale + a current-epoch preset, then exercises the REAL app functions and
// reports back. Runs in the page's global scope, so app.js/engine.js globals resolve by bare name.
const PROBE = `(() => {
  const r = {};
  localStorage.setItem('im_presets_v1', JSON.stringify({
    'Legacy scenario': { active: 200, total: 3000, __persp: 'median' },
    /* A CURRENT record now also carries model + fleet identity (Polaris ruling 2026-09-19 on
       Astra pack B P0-4). Seeding it without them made this fixture a PRE-v3.x record, which
       correctly raises the identity notice — so the "clears the notice" assertion below was
       testing the wrong record. The identity-incomplete case gets its own row instead. */
    'Fresh scenario':  { active: 250, total: 4000, __persp: 'median', __epoch: DEFAULTS_EPOCH,
                         __model: 'opus', __fleet: { id: 'preset' } },
    'Pre-v3 identity scenario': { active: 250, total: 4000, __persp: 'median', __epoch: DEFAULTS_EPOCH },
    'Invalid current scenario': { active: 500, total: 200, __persp: 'median', __epoch: DEFAULTS_EPOCH }
  }));
  renderSavedList();
  const listTxt = document.getElementById('saved-list').textContent;
  r.staleMarkedInList = /Legacy scenario · predates v2.2/.test(listTxt);
  r.freshNotMarked    = /Fresh scenario/.test(listTxt) && !/Fresh scenario · predates/.test(listTxt);
  const notice = document.getElementById('epoch-deprecation-notice');
  // --- load the STALE preset: non-destructive deprecation ---
  hideEpochDeprecationNotice();
  loadSavedPreset('Legacy scenario');
  r.staleRaisesNotice     = !notice.hidden && /stored before the v2.2 engine/.test(notice.textContent);
  const store1 = JSON.parse(localStorage.getItem('im_presets_v1') || '{}');
  r.staleNotDeleted       = !!store1['Legacy scenario'] && store1['Legacy scenario'].active === 200;
  r.staleNumbersNotApplied= (S.active !== 200 && S.active === DEFAULTS.active);
  // --- load a SAME-EPOCH but invalid preset: schema validation, not epoch trust ---
  const beforeInvalid = JSON.stringify(S);
  loadSavedPreset('Invalid current scenario');
  const store2 = JSON.parse(localStorage.getItem('im_presets_v1') || '{}');
  r.invalidRejected = /values the current engine rejects and was not loaded/.test(
    document.getElementById('preset-note').textContent);
  r.invalidStateUnchanged = JSON.stringify(S) === beforeInvalid;
  r.invalidNotDeleted = !!store2['Invalid current scenario']
    && store2['Invalid current scenario'].active === 500
    && store2['Invalid current scenario'].total === 200;
  // --- load the CURRENT-epoch preset: loads normally, notice cleared ---
  loadSavedPreset('Fresh scenario');
  r.freshClearsNotice     = notice.hidden;
  // ...and a current-epoch record that predates identity recording says so, rather than being
  // silently re-interpreted under whatever model is selected.
  loadSavedPreset('Pre-v3 identity scenario');
  r.preV3RaisesIdentityNotice = !notice.hidden && /stored before this page recorded/.test(notice.textContent);
  r.preV3KeptNotDeleted = !!JSON.parse(localStorage.getItem('im_presets_v1'))['Pre-v3 identity scenario'];
  loadSavedPreset('Fresh scenario');
  r.freshLoads            = document.getElementById('preset-note').textContent.includes('Loaded saved scenario');
  r.freshNumbersApplied   = (S.active === 250);
  return JSON.stringify(r);
})()`;

async function main() {
  if (!HTML) { assert("locate site/index.html", false, "not found next to the test"); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  const userDir = mkdtempSync(join(tmpdir(), "im-ls-cdp-"));
  const url = "file://" + HTML;
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, url,
  ], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws && ws.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir, { recursive: true, force: true }); } catch {} };
  try {
    const port = await pollActivePort(userDir);
    const wsUrl = await pageTarget(port);
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    // Wait for app init (classic scripts executed; saved-list present).
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      // CHROME 150 REGRESSION (b9 M1 close-out): readyState only reaches 'complete' once
      // every subresource settles, and the page loads Cloudflare Turnstile from a remote
      // host that Chrome 150 waits on indefinitely (see tests/run-app-tests.sh for the full
      // diagnosis). The load-bearing readiness signals are the app symbols themselves; the
      // parse gate below ('loading' means the DOM is still being built) is what this actually
      // needs. Classic scripts have run by then, which is exactly what the three conjuncts
      // that follow verify. This does NOT weaken the test: every assertion after it operates
      // on the initialised app.
      const ok = await evalExpr(send, "(document.readyState!=='loading' && typeof loadSavedPreset==='function' && typeof DEFAULTS_EPOCH==='string' && !!document.getElementById('saved-list'))");
      if (ok) { ready = true; break; }
      await sleep(150);
    }
    assert("page + app initialised over CDP", ready);
    if (!ready) return;
    const res = JSON.parse(await evalExpr(send, PROBE));
    // Stale preset (the P1(c) contract): deprecated non-destructively, numbers never applied.
    assert("stale preset marked '· predates v2.2' in the saved list", res.staleMarkedInList);
    assert("current-epoch preset NOT marked in the saved list", res.freshNotMarked);
    assert("loading a stale preset raises the LOUD deprecation notice", res.staleRaisesNotice);
    assert("stale preset is NOT deleted (kept inert/readable)", res.staleNotDeleted);
    assert("stale preset numbers are NOT applied (central scenario shown)", res.staleNumbersNotApplied);
    assert("same-epoch preset with active > total is visibly rejected", res.invalidRejected);
    assert("rejected same-epoch preset leaves the rendered state unchanged", res.invalidStateUnchanged);
    assert("rejected same-epoch preset is NOT deleted (kept inert/readable)", res.invalidNotDeleted);
    // Positive control: a current-epoch preset still loads and clears the notice.
    assert("current-epoch preset with identity clears the notice on load", res.freshClearsNotice);
    assert("a current-epoch preset saved BEFORE identity recording raises the identity notice",
      res.preV3RaisesIdentityNotice);
    assert("...and that record is kept, not migrated or discarded", res.preV3KeptNotDeleted);
    assert("current-epoch preset loads normally", res.freshLoads);
    assert("current-epoch preset numbers ARE applied", res.freshNumbersApplied);
  } catch (e) {
    assert("CDP localStorage harness ran", false, e.message + " (if raw CDP is flaky in this env, see the note atop this file — fall back to a Playwright-driven test)");
  } finally { cleanup(); }
}

await main();
console.log(`\n${failures === 0 ? "ALL LOCALSTORAGE-EPOCH TESTS PASS" : failures + " LOCALSTORAGE-EPOCH FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
