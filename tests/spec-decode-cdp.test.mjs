/* =====================================================================================
   spec-decode-cdp.test.mjs — T-14, T-16 and T-19 of the b9 spec-decode LEVER test plan
   (memo research/b9-spec-decode-lever-memo.md §13, FROZEN v16).

   WHY THIS FILE EXISTS. These three are BEHAVIOURAL: a drag that keeps pointer capture across
   several `oninput` events, a focus that lands on a row rather than on its info button, a gated tick
   that refuses a click. tests/run-app-tests.sh drives headless Chrome with --dump-dom and greps the
   result — it cannot dispatch events, read document.activeElement, or compare DOM node identity
   before and after an interaction. The gap is the HARNESS, not the design, and the fa-explain-cdp
   suite already established the pattern for closing it.

   The lever suite's structural pins (tests/spec-decode-lever-b9.test.mjs, "UI the…") assert that the
   WIRING is present. These assert that it BEHAVES. Neither substitutes for the other: a structural
   pin cannot catch wiring that is present and wrong, and an interaction test cannot catch wiring
   that was deleted along with its test.
   Run: node tests/spec-decode-cdp.test.mjs
   ===================================================================================== */
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

/* Shared page helpers, injected once per probe. `openSection` matters: parameter sections render
   inside <details>, and a collapsed section still builds its controls — but the low-evidence jump
   opens the section before focusing, so the probes mirror that rather than assuming it. */
const HELPERS = `
  const q = s => document.querySelector(s);
  const rowOf = k => q('[data-param-key="' + k + '"]');
  const rangeOf = k => rowOf(k) && rowOf(k).querySelector('input[type="range"]');
  const ticksOf = k => [...(rowOf(k) ? rowOf(k).querySelectorAll('button.tick') : [])];
  /* im-arc T3 FIX-4 (2026-08-24): stackMult is advanced-tier since T3; a closed <details> cannot
     hold focus, so opening only details.ctl-section left T-19's dragged input unfocusable and every
     document.activeElement check false. The T3 Advanced expanders are opened here as well, exactly
     as openAll() already did for parameter sections. Every assertion is unchanged. */
  const openAll = () => document.querySelectorAll('details.ctl-section, details.ctl-advanced').forEach(d => d.open = true);
  const setRange = (k, domainValue) => {
    const p = SECTIONS.flatMap(s => s.params || []).find(x => x.k === k);
    const inp = rangeOf(k);
    inp.value = Math.round(sliderPos(p, domainValue) * 1000);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return inp;
  };
`;

/* ---- T-14: the jump under a shut gate ---------------------------------------------------------
   From the DEFAULT state the gate is shut, so the spec-decode control is disabled and the A-3
   affordance would otherwise land on something the reader cannot use. Two earlier fixes failed
   against this exact code: "focus the row" did not work because the search reached the row's own
   info button first, and "no descendant matches the enabled predicate" is impossible to satisfy
   without disabling that button — which must stay usable, since it explains the blockage. */
const PROBE_T14 = `(async () => {
  ${HELPERS}
  const r = {};
  openAll();
  const row = rowOf('specDec');
  r.rowPresent = !!row;
  r.gateShutByDefault = S.stackMult === 1 && !specDecGateAllows(S);
  r.rangeDisabled = !!rangeOf('specDec') && rangeOf('specDec').disabled === true;
  const ticks = ticksOf('specDec');
  r.tickCount = ticks.length;
  r.everyGatedTickDisabled = ticks.length > 0 && ticks.every(b => b.disabled === true);
  const info = row.querySelector('button.info');
  r.infoPresent = !!info;
  r.infoStillEnabled = !!info && info.disabled === false;
  r.whyLineIsDescendant = !!row.querySelector('.lock-note')
    && row.contains(row.querySelector('.lock-note'));
  r.whyLineText = (row.querySelector('.lock-note') || {}).textContent || '';

  // the ANNOUNCEMENT contract: resolved element ids, never attribute presence
  r.roleGroup = row.getAttribute('role');
  const lb = row.getAttribute('aria-labelledby'), db = row.getAttribute('aria-describedby');
  r.labelResolves = !!lb && !!document.getElementById(lb) && row.contains(document.getElementById(lb));
  r.describeResolves = !!db && !!document.getElementById(db) && row.contains(document.getElementById(db));
  r.describedTextIsWhyLine = !!db && document.getElementById(db).textContent === r.whyLineText;

  // FIRE THE JUMP: the affordance the exec-summary row renders for the spec-decode lever.
  const jump = [...document.querySelectorAll('button.low-evidence-jump')]
    .find(b => b.dataset.jumpTo === 'specDec');
  r.jumpPresent = !!jump;
  if (jump) { jump.click(); await new Promise(res => setTimeout(res, 60)); }
  const active = document.activeElement;
  r.focusIsRow = active === row;
  r.focusIsNotInfo = active !== info;
  r.activeDesc = active ? (active.tagName + '.' + (active.className || '')) : 'none';

  // REGRESSION GUARD — the jump mechanism is SHARED. The two ungated utilization rows must still
  // focus their own enabled value control exactly as before.
  const utilJumps = [...document.querySelectorAll('button.low-evidence-jump')]
    .filter(b => b.dataset.jumpTo === 'util');
  r.utilJumpCount = utilJumps.length;
  r.utilFocusesItsControl = [];
  for (const j of utilJumps) {
    j.click(); await new Promise(res => setTimeout(res, 60));
    r.utilFocusesItsControl.push(document.activeElement === rangeOf('util'));
  }
  return JSON.stringify(r);
})()`;

/* ---- T-16: the reverse direction ---------------------------------------------------------------
   A one-directional gate is not a gate. From a gate-OPEN state with credit selected, any write that
   shuts the gate must reset specDec to 1.00 and SAY SO. */
const PROBE_T16 = `(async () => {
  ${HELPERS}
  const r = {};
  openAll();
  // open the gate through the TICK path, which is what a user actually clicks
  const tick = ticksOf('stackMult').find(b => /no MTP\\/disagg/.test(b.textContent));
  r.tickFound = !!tick;
  tick.click(); await new Promise(res => setTimeout(res, 60));
  openAll();
  r.gateOpen = specDecGateAllows(S);
  r.controlEnabledWhenOpen = rangeOf('specDec') && rangeOf('specDec').disabled === false;
  r.ticksEnabledWhenOpen = ticksOf('specDec').every(b => b.disabled === false);

  // raise the lever to its ceiling through the control itself
  setRange('specDec', 1.60); await new Promise(res => setTimeout(res, 60));
  r.credited = S.specDec;

  // now move stackMult OFF the tick — the reset must fire, loudly and attributed
  setRange('stackMult', 1.0); await new Promise(res => setTimeout(res, 80));
  openAll();
  r.gateShutAfter = !specDecGateAllows(S);
  r.specDecAfter = S.specDec;
  const row = rowOf('specDec');
  r.resetNotePresent = !!row.querySelector('.specdec-reset');
  r.resetNoteText = (row.querySelector('.specdec-reset') || {}).textContent || '';
  r.reDisabled = rangeOf('specDec').disabled === true;
  r.ticksReLocked = ticksOf('specDec').every(b => b.disabled === true);

  // and the announcement clears on the NEXT edit — a subsequent action, never the one that made it
  setRange('util', 55); await new Promise(res => setTimeout(res, 80));
  openAll();
  r.noteClearedOnNextEdit = !rowOf('specDec').querySelector('.specdec-reset');
  return JSON.stringify(r);
})()`;

/* ---- T-19: the reconcile must not destroy an active drag ---------------------------------------
   The NEGATIVE assertion is the point of this test: a full buildParam rebuild of the stackMult row
   during any `oninput` fails it. That is exactly what "rebuilt or locally refreshed" wording would
   have permitted, and it loses pointer capture after the first movement of a drag. */
const PROBE_T19 = `(async () => {
  ${HELPERS}
  const r = {};
  openAll();
  const dragged = rangeOf('stackMult');
  r.startNodeCaptured = !!dragged;
  dragged.focus();
  dragged.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));

  // a LIVE DRAG: several oninput events with no intervening pointerup, crossing ONTO the tick
  const path = [1.0, 0.9, 0.8, 0.75, 0.7, 0.7, 0.65];
  r.sameNodeEveryStep = []; r.focusHeldEveryStep = []; r.gateAtStep = [];
  for (const v of path) {
    setRange('stackMult', v);
    await new Promise(res => setTimeout(res, 25));
    r.sameNodeEveryStep.push(rangeOf('stackMult') === dragged);   // IDENTITY, not equality
    r.focusHeldEveryStep.push(document.activeElement === dragged);
    r.gateAtStep.push(specDecGateAllows(S));
  }
  // crossing ONTO the tick reconciled the DEPENDENT row while the dragged input stayed put
  r.crossedOnto = r.gateAtStep.some(Boolean);
  r.crossedOff = r.gateAtStep[r.gateAtStep.length - 1] === false;
  r.dependentRowReconciled = rangeOf('specDec').disabled === true;   // gate shut again at 0.65

  dragged.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
  await new Promise(res => setTimeout(res, 120));
  r.sameNodeAfterPointerUp = rangeOf('stackMult') === dragged;       // no deferred rebuild
  return JSON.stringify(r);
})()`;

async function withPage(fn) {
  const userDir = mkdtempSync(join(tmpdir(), "im-specdec-cdp-"));
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
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      const ok = await evalExpr(send,
        `(document.readyState!=='loading' && typeof specDecGateAllows==='function'`
        + ` && !!document.querySelector('[data-param-key=\\'specDec\\']'))`);
      if (ok) { ready = true; break; }
      await sleep(150);
    }
    await fn(send, ready);
  } finally {
    try { ws && ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  if (!CHROME || !HTML) {
    /* FAIL, never skip. These are release-gate tests: a silently skipped gate is a gate that does
       not exist, and this leg's whole discipline is that an assertion which cannot fail is worse
       than no assertion. */
    assert("CDP harness available (chrome + site/index.html)", false,
      `chrome=${CHROME || "MISSING"} html=${HTML || "MISSING"}`);
    console.log(`\n${failures} SPEC-DECODE CDP FAILURE(S)`);
    process.exit(1);
  }
  try {
    await withPage(async (send, ready) => {
      assert("T-14 page initialised with the spec-decode row rendered", ready);
      if (!ready) return;
      const r = JSON.parse(await evalExpr(send, PROBE_T14));
      assert("T-14 the gate is SHUT in the default state (the probe is not vacuous)", r.gateShutByDefault);
      assert("T-14 the specDec range renders DISABLED under a shut gate", r.rangeDisabled);
      assert("T-14 EVERY gated tick is disabled — not merely inert", r.everyGatedTickDisabled,
        `${r.tickCount} ticks`);
      assert("T-14 the INFO button stays ENABLED — it explains the very thing the reader is blocked on",
        r.infoPresent && r.infoStillEnabled);
      assert("T-14 the gate why-line is a DESCENDANT of the same param wrap", r.whyLineIsDescendant);
      assert("T-14 the why-line is the ratified gate copy", /available only from the "no MTP\/disagg" stack setting \(0\.7\)/.test(r.whyLineText), r.whyLineText.slice(0, 80));
      assert("T-14 the row is ANNOUNCED: role=group with aria ids that RESOLVE to real descendants",
        r.roleGroup === "group" && r.labelResolves && r.describeResolves);
      assert("T-14 …and aria-describedby resolves to the why-line itself, not merely to some node",
        r.describedTextIsWhyLine);
      assert("T-14 the jump affordance exists for specDec", r.jumpPresent);
      assert("T-14 the jump focuses THE ROW, never the disabled control", r.focusIsRow, r.activeDesc);
      assert("T-14 …and never the info button, which the old search reached first", r.focusIsNotInfo);
      assert("T-14 REGRESSION GUARD: the shared jump still focuses the utilization rows' own control",
        r.utilJumpCount > 0 && r.utilFocusesItsControl.every(Boolean),
        JSON.stringify(r.utilFocusesItsControl));
    });

    await withPage(async (send, ready) => {
      assert("T-16 page initialised", ready);
      if (!ready) return;
      const r = JSON.parse(await evalExpr(send, PROBE_T16));
      assert("T-16 clicking the 'no MTP/disagg' tick OPENS the gate", r.tickFound && r.gateOpen);
      assert("T-16 …and the control and its ticks become usable", r.controlEnabledWhenOpen && r.ticksEnabledWhenOpen);
      assert("T-16 the lever reaches its ceiling while the gate is open", r.credited === 1.6, String(r.credited));
      assert("T-16 moving stackMult OFF the tick SHUTS the gate", r.gateShutAfter);
      assert("T-16 …and RESETS specDec to 1.00 — never a silent clamp", r.specDecAfter === 1, String(r.specDecAfter));
      assert("T-16 …loudly, with the ratified reset line rendered", r.resetNotePresent
        && r.resetNoteText === 'Stack setting left "no MTP/disagg" — speculative-decode credit reset to none. It is available only from that setting (0.7).',
        JSON.stringify(r.resetNoteText));
      assert("T-16 …and the control re-locks with its ticks", r.reDisabled && r.ticksReLocked);
      assert("T-16 the announcement clears on the NEXT edit, not the one that produced it",
        r.noteClearedOnNextEdit);
    });

    await withPage(async (send, ready) => {
      assert("T-19 page initialised", ready);
      if (!ready) return;
      const r = JSON.parse(await evalExpr(send, PROBE_T19));
      assert("T-19 the drag crosses ONTO the tick and back OFF (the probe exercises both edges)",
        r.crossedOnto && r.crossedOff, JSON.stringify(r.gateAtStep));
      /* THE NEGATIVE ASSERTION, and it is the point of this test. */
      assert("T-19 the dragged stackMult input is the SAME DOM NODE after every oninput (identity)",
        r.sameNodeEveryStep.every(Boolean), JSON.stringify(r.sameNodeEveryStep));
      assert("T-19 …and keeps focus throughout the drag", r.focusHeldEveryStep.every(Boolean),
        JSON.stringify(r.focusHeldEveryStep));
      assert("T-19 the DEPENDENT specDec row reconciled while the dragged input was untouched",
        r.dependentRowReconciled);
      assert("T-19 no deferred rebuild replaces the dragged input on pointerup", r.sameNodeAfterPointerUp);
    });
  } catch (e) {
    assert("CDP spec-decode run completed without harness error", false, String(e && e.message || e));
  }
  console.log(failures ? `\n${failures} SPEC-DECODE CDP FAILURE(S)` : "\nALL SPEC-DECODE CDP CHECKS PASS");
  process.exit(failures ? 1 : 0);
}
main();
