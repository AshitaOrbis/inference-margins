// §10 after a reader's pass on Chrome (2026-10-06, Dot A, 1405 and 400 CSS px) — the browser half of the repairs.
// Every number on §10 already agreed between hub, card and chart; these are presentation defects it found.
//
// What must stay true, and why:
//   DA  REPRODUCE KEEPS THE ESTIMATE'S NAME. A hub's "Reproduce this estimate" link is a ?s= share token on the
//       estimate's carrier row (the blank Custom row for most, the GLM 5.2 row for GLM-5.3). The calculator used
//       to label what it loaded by that row — "USER-DEFINED, UNSOURCED", or "GLM 5.2 (744B/40B) … MODIFIED" —
//       under a banner calling it someone else's saved parameters. Following each hub link at both widths, the
//       identity strip must name the estimate and its GPT-6 Astra Pro run, and neither the strip nor the banner
//       may call it user-defined or someone else's. The name holds only while the state IS the recorded point:
//       after one edit the strip goes back to the carrier's own label (DAn, the negative control).
//   DF  THE CHART TOOLTIP. At 400 px a focused mark's tooltip shrink-wrapped to whatever room was left right of
//       the previous tooltip (Dot A measured 135 × 313 px) and sat over its own row; Escape did nothing. Tabbing
//       the marks in order to GPT-5.6 Terra after a tooltip was last shown near the right edge, the box must keep
//       its natural width, must not cover the focused row's dot, and Escape must hide it.
//   DB  THE REVIEW PAGES' WIDTH. The three amended review pages carried unwrapped code blocks (JSON, equations)
//       and 64-character digests that stretched the document to 2,100–3,400 px. At 1405 and 400 px no page may
//       scroll sideways; the code blocks scroll inside themselves. DBn injects an over-wide element and requires
//       the measurement to report it, so the check can fail.
// Everything is LOCAL file:// — no network, no deploy, no production URL. Run: node tests/s10-dota-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
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
const SITE = join(HERE, "..", "site");
const HTML = join(SITE, "index.html");
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
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 700));
  return r.result.value;
};
async function waitFor(send, expr, ms = 20000) {
  for (let t = 0; t < ms; t += 100) {
    try { if (await evalExpr(send, expr)) return true; } catch { /* mid-navigation */ }
    await sleep(100);
  }
  return false;
}
const APP_READY = wantSearch => `(document.readyState !== 'loading' && typeof computeIdentity === 'function' && typeof canonicalReplay === 'function'
  && !!document.querySelector('#astra-pro-chart [data-ape-mark]') && !!document.getElementById('identity-strip')
  && document.getElementById('identity-strip').textContent.length > 0 && ${wantSearch ? "location.search.indexOf('s=') >= 0" : "location.search === ''"})`;
async function go(send, url, ready) {
  await send("Page.navigate", { url });
  await sleep(150);
  return waitFor(send, ready);
}
const setWidth = (send, w) => send("Emulation.setDeviceMetricsOverride", { width: w, height: w < 600 ? 606 : 841, deviceScaleFactor: 1, mobile: false });

async function main() {
  if (!CHROME) { assert("a Chromium binary is available", false, "none of google-chrome/chromium/chrome on PATH"); return; }
  const require = createRequire(import.meta.url);
  const E = require(join(SITE, "engine.js"));
  const A = require(join(SITE, "astra-pro-estimates.js"));
  const recs = A.ASTRA_PRO_REGISTRY.estimates, P10 = A.SECTION10_PROVIDERS;
  const hubKeys = Object.keys(P10).filter(k => P10[k].estimateKey !== null);
  assert(`D0 ${hubKeys.length} hubs lead with an estimate (the checks below are not vacuous)`, hubKeys.length === 5);

  const userDir = mkdtempSync(join(tmpdir(), "im-s10-dota-cdp-"));
  const base = "file://" + HTML;
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank",
  ], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws && ws.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir, { recursive: true, force: true }); } catch {} };
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable"); await send("Page.enable");
    // A headless page is not focused: without this, element.focus() fires no focus event until a key arrives.
    await send("Emulation.setFocusEmulationEnabled", { enabled: true });
    await setWidth(send, 1405);
    assert("page + app initialised over CDP", await go(send, base, APP_READY(false)));
    const links = JSON.parse(await evalExpr(send, `JSON.stringify(${JSON.stringify(hubKeys)}.map(k => {
      const a = document.querySelector('#s10-hub-' + k + ' a.ape-reproduce'); return { hub: k, href: a ? a.getAttribute('href') : null }; }))`));
    assert("DA every leading hub carries a Reproduce link", links.every(l => l.href && l.href.startsWith("?s=")), JSON.stringify(links));

    const IDENTITY = `JSON.stringify({ strip: document.getElementById('identity-strip').textContent.replace(/\\s+/g, ' '),
      banner: (document.getElementById('shared-link-banner') || {}).textContent || '', bannerShown: !!document.getElementById('shared-link-banner') && !document.getElementById('shared-link-banner').hidden,
      note: (document.getElementById('preset-note') || {}).textContent || '', margin: appWorkload().margin * 100 })`;
    const daProblems = (rec, s) => {
      const out = [];
      if (!s.strip.includes(rec.name)) out.push(`strip does not name ${rec.name}`);
      if (!/GPT-6 Astra Pro/.test(s.strip)) out.push("strip does not name the GPT-6 Astra Pro run");
      if (/USER-DEFINED|user-defined, unsourced/i.test(s.strip)) out.push("strip calls it user-defined");
      if (/someone else's saved parameters|by whoever shared it/.test(s.banner)) out.push("banner calls it someone else's link");
      if (!(Math.abs(s.margin - A.canonicalReplay(rec, E).central) < 1e-6)) out.push(`margin ${s.margin} != canonical`);
      return out;
    };
    for (const w of [1405, 400]) {
      await setWidth(send, w);
      for (const l of links) {
        const rec = recs.find(r => r.key === P10[l.hub].estimateKey);
        const ready = await go(send, base + l.href, APP_READY(true));
        const s = ready ? JSON.parse(await evalExpr(send, IDENTITY)) : null;
        const p = s ? daProblems(rec, s) : ["the link did not load"];
        assert(`DA @${w}px the ${l.hub} hub's Reproduce state names ${rec.name} and its Astra Pro run`, p.length === 0, p.join("; ") + (s ? ` | strip: ${s.strip.slice(0, 220)}` : ""));
      }
    }
    // DAn: one edit, and the state is no longer the recorded point — the carrier's own label returns.
    await setWidth(send, 1405);
    for (const hub of ["zhipu", "openai"]) {
      const l = links.find(x => x.hub === hub), rec = recs.find(r => r.key === P10[hub].estimateKey);
      await go(send, base + l.href, APP_READY(true));
      const s = JSON.parse(await evalExpr(send, `(async () => {
        S.util = S.util >= 90 ? S.util - 7 : S.util + 7; if (noteUserEdit()) await new Promise(r => setTimeout(r, 50)); else renderAll();
        return ${IDENTITY};
      })()`));
      assert(`DAn after one edit the ${hub} state no longer claims to be the ${rec.name} estimate`, !/GPT-6 Astra Pro/.test(s.strip), s.strip.slice(0, 220));
      /* review r1 P1: the banner and the loaded-scenario note are written at load — after the edit they must stop
         attributing the numbers to the run, and say the state has changed. */
      const stale = /computed from the inputs that research run recorded|recorded central operating point/;
      assert(`DAn after one edit the ${hub} banner and note no longer attribute the numbers to the run`,
        s.bannerShown && !stale.test(s.banner) && /no longer that estimate/.test(s.banner) && !stale.test(s.note) && /no longer that estimate/.test(s.note),
        JSON.stringify({ banner: s.banner.slice(0, 260), note: s.note.slice(0, 260) }));
    }
    /* review r2 P2s: a round trip back to the recorded value restores the load note, and a note another flow wrote
       in between is never captured or overwritten by this one. */
    {
      const l = links.find(x => x.hub === "xai");
      await go(send, base + l.href, APP_READY(true));
      const r = JSON.parse(await evalExpr(send, `(async () => {
        const read = () => JSON.parse(${IDENTITY});
        const load = read(), u0 = S.util;
        S.util = u0 >= 90 ? u0 - 5 : u0 + 5; renderAll(); const edited = read();
        S.util = u0; renderAll(); const back = read();
        S.util = u0 >= 90 ? u0 - 5 : u0 + 5; renderAll();
        document.getElementById('preset-note').textContent = 'an unrelated notice'; renderAll();
        S.util = u0; renderAll(); const backOther = read();
        S.util = u0 >= 90 ? u0 - 5 : u0 + 5; renderAll(); const editedOther = read();
        return JSON.stringify({ load, edited, back, backOther, editedOther });
      })()`));
      assert("DAn a round trip to the recorded value restores the estimate's strip, banner and load note",
        /no longer that estimate/.test(r.edited.note) && r.back.note === r.load.note && /GPT-6 Astra Pro/.test(r.back.strip) && !/no longer that estimate/.test(r.back.banner),
        JSON.stringify({ loadNote: r.load.note.slice(0, 120), backNote: r.back.note.slice(0, 120), backBanner: r.back.banner.slice(0, 120) }));
      assert("DAn a notice another flow wrote is neither captured nor overwritten by the estimate's note",
        r.backOther.note === "an unrelated notice" && r.editedOther.note === "an unrelated notice",
        JSON.stringify({ backOther: r.backOther.note.slice(0, 120), editedOther: r.editedOther.note.slice(0, 120) }));
    }
    /* The same after a state change that is not a slider edit (a saved scenario or a preset writes the state
       and re-renders): the labels follow the state, not the gesture. */
    {
      const l = links.find(x => x.hub === "google");
      await go(send, base + l.href, APP_READY(true));
      const before = JSON.parse(await evalExpr(send, IDENTITY));
      const s = JSON.parse(await evalExpr(send, `(() => { S.util = S.util >= 90 ? S.util - 3 : S.util + 3; renderAll(); return ${IDENTITY}; })()`));
      assert("DAn a re-render on a changed state (no edit gesture) drops the estimate's name from strip, banner and note",
        /GPT-6 Astra Pro/.test(before.strip) && !/GPT-6 Astra Pro/.test(s.strip) && /no longer that estimate/.test(s.banner) && /no longer that estimate/.test(s.note),
        JSON.stringify({ before: before.strip.slice(0, 120), strip: s.strip.slice(0, 160), banner: s.banner.slice(0, 200), note: s.note.slice(0, 200) }));
    }

    // DF: the chart tooltip at 400 and 1405, tabbing the marks in order to GPT-5.6 Terra
    for (const w of [400, 1405]) {
      await setWidth(send, w);
      await go(send, base, APP_READY(false));
      const f = JSON.parse(await evalExpr(send, `JSON.stringify((() => {
        document.getElementById('rs-10').open = true;
        showTip(ttRows('a previous tooltip', [['shown near the right edge', '1']]), window.innerWidth - 40, 120);
        const all = [...document.querySelectorAll('#astra-pro-chart g[data-ape-mark]')];
        const g = document.querySelector('#astra-pro-chart g[data-ape-mark="gpt-5-6-terra"]');
        for (const o of all) { o.scrollIntoView({ block: 'center', behavior: 'instant' }); o.focus(); if (o === g) break; }
        const tip = document.getElementById('tooltip'), t = tip.getBoundingClientRect(), c = g.querySelector('circle').getBoundingClientRect();
        const natural = Math.min(320, window.innerWidth - 16);
        return { focused: document.activeElement === g, shown: !tip.hidden, w: t.width, h: t.height, natural,
          coversOwnDot: !(c.right <= t.left || c.left >= t.right || c.bottom <= t.top || c.top >= t.bottom), inView: t.left >= 0 && t.right <= window.innerWidth && t.top >= 0 && t.bottom <= window.innerHeight };
      })())`));
      assert(`DF @${w}px the focused Terra mark shows its tooltip`, f.focused && f.shown, JSON.stringify(f));
      assert(`DF @${w}px the tooltip keeps its natural width after an earlier tooltip near the right edge (${Math.round(f.w)} px, natural up to ${f.natural})`, f.w >= Math.min(240, f.natural - 1), JSON.stringify(f));
      assert(`DF @${w}px the tooltip does not cover the focused row's dot and stays in the viewport`, !f.coversOwnDot && f.inView, JSON.stringify(f));
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await sleep(80);
      const after = await evalExpr(send, `({ hidden: document.getElementById('tooltip').hidden, focus: document.activeElement && document.activeElement.getAttribute('data-ape-mark') })`);
      assert(`DF @${w}px Escape hides the tooltip and leaves focus on the mark`, after.hidden && after.focus === "gpt-5-6-terra", JSON.stringify(after));
    }

    // DB: the three amended review pages, and a negative control
    const WIDTH = `({ doc: document.documentElement.scrollWidth, view: document.documentElement.clientWidth })`;
    for (const w of [1405, 400]) {
      await setWidth(send, w);
      for (const page of ["gemini-3-1-pro", "grok-4-6", "glm-5-3"]) {
        const ok = await go(send, "file://" + join(SITE, "research", `${page}-astra-pro.html`), `document.readyState === 'complete' && !!document.querySelector('.report h1')`);
        const m = ok ? await evalExpr(send, WIDTH) : { doc: -1, view: 0 };
        assert(`DB @${w}px the ${page} review page does not scroll sideways (${m.doc} / ${m.view})`, ok && m.doc <= m.view + 1, JSON.stringify(m));
      }
    }
    {
      await setWidth(send, 400);
      const m = await evalExpr(send, `(() => { const d = document.createElement('div'); d.style.width = '2000px'; d.textContent = 'x';
        document.querySelector('.report').appendChild(d); return ${WIDTH}; })()`);
      assert("DBn negative fixture: an over-wide element injected into a review page is reported", m.doc > m.view + 1, JSON.stringify(m));
    }
  } catch (e) {
    assert("CDP harness ran", false, e.message);
  } finally { cleanup(); }
}

await main();
console.log(`\n${failures === 0 ? "ALL S10-DOTA CDP TESTS PASS" : failures + " S10-DOTA CDP FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
