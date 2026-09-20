// TURNSTILE LOADER STATE MACHINE — deterministic release coverage, over CDP.
//
// WHY THIS FILE EXISTS. The feedback form's challenge loader was given a bounded-failure path
// (im-share-finalization, 2026-09-02) and GPT Pro review pr-20260902T153840Z-bce1bb finding 3
// observed, correctly, that NO release suite reached it: run-app-tests.sh performs no form
// interaction by design, and its 5,000 ms virtual-time budget / 8,000 ms process timeout are both
// shorter than the 10,000 ms branch. A loader repair no gate executes is a correct-by-comment
// repair. This file executes it.
//
// It never touches the live Cloudflare endpoint. A local TCP listener stands in for
// challenges.cloudflare.com via --host-resolver-rules, in two modes:
//   refuse — destroy on connect            => a DEFINITIVE error (script.onerror fires)
//   hang   — accept and never speak        => the PENDING state onerror cannot see, which is the
//                                             whole reason the bound exists
//
// WHAT IT DELIBERATELY DOES NOT CLAIM. The "loaded but window.turnstile unusable" branch is NOT
// exercised: reaching it needs a TLS stub trusted for challenges.cloudflare.com, which is more
// fixture than the branch is worth. It is asserted by inspection only and named here so a reader
// is not misled about coverage.
// Run: node tests/turnstile-loader-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
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
if (!CHROME) { console.log("FATAL: no chromium/google-chrome on PATH — this is a release gate"); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* The page's own constant. Read it out of the shipped bytes rather than duplicating it, so a
   change to the threshold cannot leave this suite silently testing the wrong number. */
const SLOW_MS = Number((readFileSync(HTML, "utf8").match(/TURNSTILE_SLOW_MS\s*=\s*(\d+)/) || [])[1]);
assert("the page declares a TURNSTILE_SLOW_MS bound this suite can read", Number.isFinite(SLOW_MS) && SLOW_MS > 0, String(SLOW_MS));

function stubServer(mode) {                       // "refuse" | "hang"
  const held = [];
  const srv = createServer(sock => {
    sock.on("error", () => {});
    if (mode === "refuse") sock.destroy();
    else held.push(sock);                          // accept, never respond, never close
  });
  return new Promise(res => srv.listen(0, "127.0.0.1", () =>
    res({ port: srv.address().port, close: () => { held.forEach(s => s.destroy()); srv.close(); } })));
}
async function pollActivePort(dir, ms = 20000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("chrome did not expose DevToolsActivePort");
}
async function pageTarget(port, ms = 20000) {
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
function cdpClient(ws, onEvent) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method && onEvent) onEvent(msg);
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
};

const CHALLENGE_HOST = "challenges.cloudflare.com";
const STATUS = `(document.querySelector('#feedback-form .fb-status')||{}).textContent||''`;
const SCRIPT_NODES = `document.querySelectorAll('script[src*="${CHALLENGE_HOST}"]').length`;
const ENGAGE = `(() => { const t=document.getElementById('fb-body'); t.dispatchEvent(new FocusEvent('focusin',{bubbles:true})); return true; })()`;
const SUBMIT = `(() => { document.getElementById('feedback-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); return true; })()`;

async function withStub(mode, fn) {
  const stub = await stubServer(mode);
  const userDir = mkdtempSync(join(tmpdir(), "im-ts-loader-"));
  const requests = [];
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + userDir,
    `--host-resolver-rules=MAP ${CHALLENGE_HOST} 127.0.0.1:${stub.port}`,
    "file://" + HTML], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws, msg => {
      if (msg.method === "Network.requestWillBeSent" && String(msg.params?.request?.url || "").includes(CHALLENGE_HOST))
        requests.push(msg.params.request.url);
    });
    await send("Runtime.enable"); await send("Network.enable");
    for (let t = 0; t < 20000; t += 150) {
      if (await evalExpr(send, "document.readyState !== 'loading' && !!document.getElementById('feedback-form')")) break;
      await sleep(150);
    }
    return await fn(send, requests);
  } finally {
    try { ws && ws.close(); } catch {}
    proc.kill("SIGKILL");
    stub.close();
    /* Cleanup must NEVER decide this suite's verdict. Chrome keeps flushing into its profile
       directory for a moment after SIGKILL, so a bare rmSync races it and throws ENOTEMPTY —
       observed intermittently, which is worse than a hard failure because it turns a green gate
       into a coin flip. Retry, then give up silently: a leftover temp directory is not a finding. */
    try { rmSync(userDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 }); } catch {}
  }
}

/* ---- A. LAZY: the release-gate property. No third-party request before interaction. ---- */
await withStub("refuse", async (send, requests) => {
  await sleep(1200);
  assert("A1 lazy: no request to the challenge host before the visitor engages the form",
    requests.length === 0, JSON.stringify(requests));
  assert("A1 lazy: no challenge <script> node exists before engagement",
    (await evalExpr(send, SCRIPT_NODES)) === 0);
});

/* ---- B. DEFINITIVE ERROR: one request, an honest message, and exactly ONE retry. ---- */
await withStub("refuse", async (send, requests) => {
  await evalExpr(send, ENGAGE);
  for (let t = 0; t < 8000 && requests.length === 0; t += 100) await sleep(100);
  await sleep(800);
  assert("B1 error: engagement produces exactly ONE challenge request",
    requests.length === 1, JSON.stringify(requests));
  const msg = await evalExpr(send, STATUS);
  assert("B2 error: the visitor is told the challenge could not load",
    /could not load/i.test(msg), JSON.stringify(msg));
  /* A definitive error is the ONE case where the state machine returns to idle, so a second
     engagement must produce a second request — this is what makes 'retry' real rather than a
     comment. Anything other than exactly 2 means the guard is stuck or leaking. */
  await evalExpr(send, ENGAGE);
  for (let t = 0; t < 8000 && requests.length < 2; t += 100) await sleep(100);
  await sleep(400);
  assert("B3 error: a second engagement retries exactly once more (idle is reachable ONLY after a definitive error)",
    requests.length === 2, JSON.stringify(requests));
});

/* ---- C. PENDING: the state onerror cannot see. Soft warning, ONE request, node retained. ---- */
await withStub("hang", async (send, requests) => {
  await evalExpr(send, ENGAGE);
  for (let t = 0; t < 8000 && requests.length === 0; t += 100) await sleep(100);
  assert("C1 pending: engagement produces exactly one request against a host that never answers",
    requests.length === 1, JSON.stringify(requests));
  /* NEGATIVE CONTROL for the bound itself: BEFORE the threshold there must be no warning. Without
     this the C2 assertion could pass on a message that was always there. */
  const early = await evalExpr(send, STATUS);
  assert("C2 pending NEGATIVE CONTROL: no warning is shown before the bound elapses",
    early === "", JSON.stringify(early));
  /* Hammer the form while the request is pending. A single-flight loader must not reinject. */
  for (let i = 0; i < 5; i++) { await evalExpr(send, ENGAGE); await sleep(120); }
  await sleep(SLOW_MS + 2500);
  const msg = await evalExpr(send, STATUS);
  assert("C3 pending: the bound fires and the visitor is told it is taking longer than expected",
    /taking longer than expected/i.test(msg), JSON.stringify(msg));
  assert("C4 pending: the message is a SOFT warning, never a false offline classification",
    !/you appear to be offline/i.test(msg) && /reload/i.test(msg), JSON.stringify(msg));
  assert("C5 single-flight: six engagements and an elapsed bound produced exactly ONE request",
    requests.length === 1, JSON.stringify(requests));
  assert("C6 single-flight: the pending <script> is RETAINED, not removed and reinjected",
    (await evalExpr(send, SCRIPT_NODES)) === 1);
  /* THE REINJECTION CASE, asserted by ELEMENT IDENTITY rather than by request count. Counting
     requests cannot see this: Chrome coalesces a second <script> with an identical URL onto the
     still-pending fetch, so no new requestWillBeSent is emitted and a request-count assertion
     passes against the very defect it is meant to catch — verified by running this suite against
     the pre-review loader, where a naive count-based form PASSED while the node was in fact being
     removed and reinjected. Node COUNT is also blind (1 removed, 1 added = 1). So mark the live
     element and require the SAME element to survive: the defect replaced here re-armed the loader
     when the bound elapsed, and a post-bound engagement then injected a fresh script whose late
     callbacks could clear a newer attempt's timer. */
  /* Null-safe on purpose: if the node has ALREADY been removed by the bound (the defect C6 
     catches), tagging must report a clean failure below rather than throwing and aborting the
     suite — a crashing gate tells a reader far less than a failing one. */
  const tagged = await evalExpr(send,
    `(() => { const el = document.querySelector('script[src*="${CHALLENGE_HOST}"]'); if (!el) return false; el.dataset.probeId = 'attempt-1'; return true; })()`);
  assert("C6b precondition: a challenge <script> is still present to mark before the post-bound engagement",
    tagged === true, "the node was already gone — see C6");
  for (let i = 0; i < 3; i++) { await evalExpr(send, ENGAGE); await sleep(200); }
  await sleep(600);
  assert("C6b single-flight: the SAME script element survives a post-bound engagement (no remove-and-reinject)",
    tagged === true && (await evalExpr(send, `(document.querySelector('script[src*="${CHALLENGE_HOST}"]')||{dataset:{}}).dataset.probeId === 'attempt-1'`)) === true);
  assert("C6b single-flight: still exactly one challenge <script> node after post-bound engagement",
    (await evalExpr(send, SCRIPT_NODES)) === 1);
  /* The user-facing point of the whole repair: submitting with no token must explain WHY there is
     no challenge, rather than asking the visitor to complete one that never arrived. */
  await evalExpr(send, SUBMIT);
  await sleep(300);
  const afterSubmit = await evalExpr(send, STATUS);
  assert("C7 pending: submitting tells the truth instead of 'complete the challenge' with nothing to complete",
    /taking longer than expected/i.test(afterSubmit) && !/^Complete the anti-abuse challenge/.test(afterSubmit),
    JSON.stringify(afterSubmit));
  assert("C8 pending: a tokenless submit still issues NO request anywhere (no feedback POST, no second challenge)",
    requests.length === 1, JSON.stringify(requests));
});

console.log(failures === 0 ? "\nALL TURNSTILE LOADER TESTS PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
