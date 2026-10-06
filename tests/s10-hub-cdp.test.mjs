// §10 provider hubs in the browser (2026-10-06) — the page a reader sees and clicks agrees with the record.
//
// What must stay true, and why:
//   H1  THE CHART AS DRAWN, not an attribute beside it (review r1 P1): for every registered estimate, at
//       a desktop and a phone width, the dot's position and the bar's two ends — decoded against the
//       chart's OWN axis ticks ("0%" … "100%"), so no knowledge of the layout constants is assumed —
//       equal canonicalReplay()'s central, low and high; the value label, the tooltip a reader gets on
//       focus, the accessible label and the table view print the same rounded figures. The expected
//       values are computed HERE, in node, from the same registry and engine files.
//   H1n NEGATIVE FIXTURES for H1, executed in the page: (a) the reviewer's attack — every drawn dot and
//       bar shifted and every tooltip's numbers altered while data-central is left correct — and
//       (b) a stale datum — the chart re-rendered from readings two points off. H1 must report both;
//       (a) also shows that the old data-central check alone would have passed.
//   H2  EVERY Reproduce link in §10 (review r1 P1): each current hub's link (a ?s= share link) and
//       every load link on the six July cards, Moonshot's output-token replay included. Each starts
//       from a PERSISTED reader default on another model and preset, with an unsaved edit on top, and
//       must load the link's model, scenario preset and traffic — and its margin (for the hubs,
//       canonicalReplay's central; for the July cards, the dive replay; for Moonshot, the output-token
//       margin the July card prints) — while leaving the persisted default untouched.
//   H3  PHONE WIDTH (390 × 844, §10 expanded): every hub is visible, neither the hub nor the page scrolls
//       sideways, nothing inside a hub runs past the viewport, and the current-estimate text is not
//       clipped. A negative fixture forces a too-wide element into one hub and requires the check to
//       report it. With S10_SCREENSHOT_DIR set, the Google and Moonshot hubs are saved there as
//       phone-google.png / phone-moonshot.png for a human read (nothing is written otherwise).
// Why raw CDP and not tests/run-app-tests.sh: that suite renders static DOM with --dump-dom and cannot
// seed localStorage, resize, focus a mark, edit a control or click a link. Same harness as the other
// *-cdp suites. Everything is LOCAL file:// — no network, no deploy, no production URL.
// Run: node tests/s10-hub-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
const SITE = [join(HERE, "..", "site"), join(HERE, "..")].find(d => existsSync(join(d, "index.html")) && existsSync(join(d, "astra-pro-estimates.js")));
const HTML = SITE && join(SITE, "index.html");
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
/* Readiness: the DOM is parsed and the app's classic scripts have run (see localstorage-epoch's note
   on why readyState 'complete' is not waited for). `wantSearch` distinguishes a ?s= page from the base. */
async function waitReady(send, wantSearch, ms = 20000) {
  const expr = `(document.readyState !== 'loading' && typeof canonicalReplay === 'function' && typeof appWorkload === 'function'
    && typeof currentModel === 'function' && !!document.querySelector('#astra-pro-chart [data-ape-mark]')
    && ${wantSearch ? "location.search.indexOf('s=') >= 0" : "location.search === ''"})`;
  for (let t = 0; t < ms; t += 100) {
    try { if (await evalExpr(send, expr)) return true; } catch { /* mid-navigation: the context is being replaced */ }
    await sleep(100);
  }
  return false;
}

/* ---------- H1: the chart as drawn ---------- */
/* Everything a reader can see or be read per mark, plus data-central (kept only to show that the
   negative fixture (a) leaves it intact). The tooltip is the real one: focusing the mark fires the
   chart's own focus handler, which fills #tooltip. */
const PROBE_CHART = `(() => {
  document.getElementById('rs-10').open = true; // marks inside a collapsed section cannot take focus
  const svg = document.querySelector('#astra-pro-chart svg');
  const ticks = [...svg.querySelectorAll(':scope > text')]
    .filter(t => t.getAttribute('text-anchor') === 'middle' && /^-?\\d+%$/.test(t.textContent))
    .map(t => [Number(t.textContent.slice(0, -1)), Number(t.getAttribute('x'))]);
  const marks = {};
  for (const g of svg.querySelectorAll('g[data-ape-mark]')) {
    const c = g.querySelector('circle'), r = g.querySelector('rect');
    g.focus();
    const tipTitle = (document.querySelector('#tooltip .tt-title') || {}).textContent || null;
    const tip = [...document.querySelectorAll('#tooltip .tt-row')].map(row => [row.querySelector('span').textContent, row.querySelector('b').textContent]);
    g.blur();
    marks[g.getAttribute('data-ape-mark')] = {
      cx: c ? Number(c.getAttribute('cx')) : null, rx: r ? Number(r.getAttribute('x')) : null, rw: r ? Number(r.getAttribute('width')) : null,
      texts: [...g.querySelectorAll('text')].map(t => t.textContent), tipTitle, tip,
      aria: g.getAttribute('aria-label'), dataCentral: g.getAttribute('data-central'),
    };
  }
  const table = [...document.querySelectorAll('#astra-pro-chart table tr')].map(tr => [...tr.children].map(td => td.textContent));
  return JSON.stringify({ narrow: ASTRA_PRO_CHART_NARROW, ticks, marks, table });
})()`;
const EPS_PTS = 1e-6; // percentage points; SVG attributes carry the full double
/* Named problems of one probed chart against the node-side canonical readings. */
function chartProblems(probe, recs, expected) {
  const out = [];
  const bad = (rule, key, msg) => out.push({ rule, key, msg });
  const t0 = probe.ticks.find(([v]) => v === 0), t100 = probe.ticks.find(([v]) => v === 100);
  if (!t0 || !t100 || !(t100[1] > t0[1])) { bad("axis", "*", "the 0% and 100% ticks are missing — nothing can be decoded"); return out; }
  const decode = x => (x - t0[1]) / (t100[1] - t0[1]) * 100;
  for (const rec of recs) {
    const m = probe.marks[rec.key], c = expected[rec.key];
    if (!m) { bad("presence", rec.key, "no mark"); continue; }
    const R = v => Math.round(v);
    if (!(Math.abs(decode(m.cx) - c.central) <= EPS_PTS)) bad("geometry", rec.key, `dot at ${decode(m.cx)} != central ${c.central}`);
    if (!(Math.abs(decode(m.rx) - c.low) <= EPS_PTS)) bad("geometry", rec.key, `bar starts at ${decode(m.rx)} != low ${c.low}`);
    const hiAt = decode(m.rx + m.rw);
    if (m.rw > 2 + 1e-9 ? !(Math.abs(hiAt - c.high) <= EPS_PTS) : !(c.high - c.low <= decode(m.rx + 2) - decode(m.rx) + EPS_PTS))
      bad("geometry", rec.key, `bar ends at ${hiAt} != high ${c.high}`);
    if (!m.texts.includes(`~${R(c.central)}%`)) bad("label", rec.key, `value label ${JSON.stringify(m.texts)} lacks ~${R(c.central)}%`);
    const row = label => (m.tip.find(([l]) => l === label) || [])[1];
    if (m.tipTitle !== `${rec.provider} — ${rec.name}` || row("Central (this calculator)") !== `~${R(c.central)}%`
        || row("Low – high scenarios") !== `${R(c.low)}% – ${R(c.high)}%` || row("Its own stated reading") !== `${Number(rec.stated.headline_pct).toFixed(1)}%`)
      bad("tooltip", rec.key, `tooltip ${m.tipTitle} ${JSON.stringify(m.tip)}`);
    if (!m.aria || !m.aria.includes(`~${R(c.central)}% serving margin`) || !m.aria.includes(`${R(c.low)}% to ${R(c.high)}%`)) bad("aria", rec.key, String(m.aria));
    const tr = probe.table.find(cells => cells[0] === `${rec.provider} — ${rec.name}`);
    if (!tr || tr[1] !== `~${R(c.central)}%` || tr[2] !== `${R(c.low)}% – ${R(c.high)}%`) bad("table", rec.key, JSON.stringify(tr));
  }
  return out;
}
async function setWidth(send, width, wantNarrow) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
  for (let t = 0; t < 5000; t += 100) {
    if (await evalExpr(send, `ASTRA_PRO_CHART_NARROW === ${wantNarrow} && !!document.querySelector('#astra-pro-chart [data-ape-mark]')`)) return true;
    await sleep(100);
  }
  return false;
}

/* ---------- H2: every Reproduce link from a persisted, edited state ---------- */
const STATE = `JSON.stringify({ model: (currentModel() || {}).id || null, persp: (currentPersp() || {}).id || document.getElementById('persp-preset').value || null, tr: (({ mode, ioRatio, cacheHit }) => ({ mode, ioRatio, cacheHit }))(resolvedTraffic()),
  util: S.util, margin: appWorkload().margin * 100, outTok: (1 - appWorkload().cOut / S.priceOut) * 100, readerDefault: readReaderDefault(), rawDefault: (() => { try { return localStorage.getItem('im_default_scenario_v1'); } catch (e) { return 'THREW ' + e.name; } })(),
  body: document.body.textContent.indexOf('Loaded a shared scenario') >= 0 })`;

async function main() {
  if (!SITE) { assert("locate site/index.html and site/astra-pro-estimates.js", false, "not found next to the test"); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  const require = createRequire(import.meta.url);
  const E = require(join(SITE, "engine.js"));
  const A = require(join(SITE, "astra-pro-estimates.js"));
  if (!A.SECTION10_PROVIDERS || typeof A.canonicalReplay !== "function" || typeof A.julyReplay !== "function") {
    assert("astra-pro-estimates.js exports SECTION10_PROVIDERS, canonicalReplay and julyReplay", false, "missing"); return;
  }
  const recs = A.ASTRA_PRO_REGISTRY.estimates;
  const expected = Object.fromEntries(recs.map(r => [r.key, A.canonicalReplay(r, E)]));
  const P10 = A.SECTION10_PROVIDERS;
  const hubKeys = Object.keys(P10).filter(k => P10[k].estimateKey !== null);
  assert(`H0 ${recs.length} registered estimates and ${hubKeys.length} hubs leading with one (the checks below are not vacuous)`, recs.length > 0 && hubKeys.length > 0);

  const userDir = mkdtempSync(join(tmpdir(), "im-s10-hub-cdp-"));
  const base = "file://" + HTML;
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, base,
  ], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws && ws.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir, { recursive: true, force: true }); } catch {} };
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable"); await send("Page.enable");
    const ready = await waitReady(send, false);
    assert("page + app initialised over CDP", ready);
    if (!ready) return;
    const report = (label, problems) => assert(label, problems.length === 0, problems.slice(0, 6).map(p => `[${p.rule}] ${p.key}: ${p.msg}`).join("; "));

    // H1 at both widths
    for (const [width, narrow] of [[1440, false], [390, true]]) {
      const ok = await setWidth(send, width, narrow);
      assert(`H1 the chart re-renders in its ${narrow ? "narrow" : "wide"} layout at ${width} px`, ok);
      if (!ok) continue;
      const probe = JSON.parse(await evalExpr(send, PROBE_CHART));
      assert(`H1 @${width}px every registered estimate has a drawn mark (${recs.length})`, recs.every(r => probe.marks[r.key]), Object.keys(probe.marks).join(","));
      report(`H1 @${width}px dots, bar ends, value labels, tooltips, accessible labels and table rows == canonicalReplay central/low/high for all ${recs.length} estimates`,
        chartProblems(probe, recs, expected));
    }

    // H1n negative fixtures, at the wide layout
    await setWidth(send, 1440, false);
    {
      // (a) the reviewer's attack: drawn dots and bars shifted, tooltip numbers altered, data-central untouched
      const probe = JSON.parse(await evalExpr(send, `(() => {
        for (const g of document.querySelectorAll('#astra-pro-chart g[data-ape-mark]')) {
          const c = g.querySelector('circle'), r = g.querySelector('rect');
          c.setAttribute('cx', Number(c.getAttribute('cx')) + 9); r.setAttribute('x', Number(r.getAttribute('x')) + 9);
        }
        window.__s10OrigTT = ttRows;
        ttRows = (title, rows) => __s10OrigTT(title, rows.map(([l, v, k]) => [l, String(v).replace(/\\d+/, d => String(Number(d) + 3)), k]));
        const out = ${PROBE_CHART};
        ttRows = __s10OrigTT; renderAstraProChart();
        return out;
      })()`));
      const p = chartProblems(probe, recs, expected);
      const rules = new Set(p.map(x => x.rule));
      const dataCentralStillRight = recs.every(r => probe.marks[r.key] && probe.marks[r.key].dataCentral === expected[r.key].central.toFixed(4));
      assert("H1n negative fixture (a): shifted dots and bars with altered tooltips — data-central still reads right, and H1 reports the geometry and the tooltips for every mark",
        dataCentralStillRight && rules.has("geometry") && rules.has("tooltip")
          && recs.every(r => p.some(x => x.key === r.key && x.rule === "geometry") && p.some(x => x.key === r.key && x.rule === "tooltip")),
        `dataCentralStillRight=${dataCentralStillRight} rules=${[...rules].join(",")} problems=${p.length}`);
    }
    {
      // (b) a stale datum: the chart re-rendered from readings two points off
      const probe = JSON.parse(await evalExpr(send, `(() => {
        window.__s10OrigCR = canonicalReplay;
        canonicalReplay = rec => { const c = __s10OrigCR(rec); return Object.assign({}, c, { central: c.central + 2, low: c.low + 2, high: c.high + 2 }); };
        renderAstraProChart();
        const out = ${PROBE_CHART};
        canonicalReplay = __s10OrigCR; renderAstraProChart();
        return out;
      })()`));
      const rules = new Set(chartProblems(probe, recs, expected).map(x => x.rule));
      assert("H1n negative fixture (b): a chart drawn from stale readings fails H1 on geometry, labels, tooltips and the table",
        ["geometry", "label", "tooltip", "table"].every(r => rules.has(r)), [...rules].join(","));
    }
    report("H1n after both fixtures the restored chart passes H1 again (the fixtures did not leak)",
      chartProblems(JSON.parse(await evalExpr(send, PROBE_CHART)), recs, expected));

    // H3 — phone width
    {
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      let narrowOk = false;
      for (let t = 0; t < 5000 && !narrowOk; t += 100) { narrowOk = await evalExpr(send, "ASTRA_PRO_CHART_NARROW === true && innerWidth === 390"); if (!narrowOk) await sleep(100); }
      assert("H3 the page is laid out at a 390 px phone width", narrowOk);
      const PROBE_PHONE = `(() => {
        document.getElementById('rs-10').open = true;
        const de = document.documentElement, vw = de.clientWidth, out = { page: { sw: de.scrollWidth, cw: de.clientWidth }, hubs: {} };
        /* the layout viewport's width, not innerWidth: under mobile emulation innerWidth grows to fit overflowing content */
        for (const hub of document.querySelectorAll('.s10-hub')) {
          const cs = getComputedStyle(hub), r = hub.getBoundingClientRect();
          const cur = hub.querySelector('.s10-hub-current'), cr = cur.getBoundingClientRect(), ccs = getComputedStyle(cur);
          const past = [...hub.querySelectorAll('*')].filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > vw + 1 || b.left < -1); }).length;
          out.hubs[hub.dataset.s10Hub] = {
            visible: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0,
            sw: hub.scrollWidth, cw: hub.clientWidth, past,
            cur: { sw: cur.scrollWidth, cw: cur.clientWidth, sh: cur.scrollHeight, ch: cur.clientHeight, left: cr.left, right: cr.right, nowrapEllipsis: ccs.textOverflow === 'ellipsis' && ccs.whiteSpace === 'nowrap', text: cur.textContent.length },
            rect: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } };
        }
        out.iw = vw;
        return JSON.stringify(out);
      })()`;
      const phoneProblems = ph => {
        const out = [];
        if (!(ph.page.sw <= ph.page.cw + 1)) out.push({ rule: "page-overflow", key: "*", msg: `document scrollWidth ${ph.page.sw} > clientWidth ${ph.page.cw}` });
        for (const key of Object.keys(P10)) {
          const h = ph.hubs[key];
          if (!h) { out.push({ rule: "presence", key, msg: "no hub" }); continue; }
          if (!h.visible) out.push({ rule: "visible", key, msg: "not visible" });
          if (!(h.sw <= h.cw + 1)) out.push({ rule: "hub-overflow", key, msg: `scrollWidth ${h.sw} > clientWidth ${h.cw}` });
          if (h.past) out.push({ rule: "past-viewport", key, msg: `${h.past} element(s) run past the viewport` });
          const c = h.cur;
          if (!(c.sw <= c.cw + 1 && c.sh <= c.ch + 1 && c.left >= -1 && c.right <= ph.iw + 1 && !c.nowrapEllipsis && c.text > 0))
            out.push({ rule: "clipped", key, msg: JSON.stringify(c) });
        }
        return out;
      };
      const ph = JSON.parse(await evalExpr(send, PROBE_PHONE));
      report(`H3 @390px all ${Object.keys(P10).length} hubs visible, no sideways scroll on the hub or the page, nothing past the viewport, current-estimate text unclipped`, phoneProblems(ph));
      const shots = process.env.S10_SCREENSHOT_DIR;
      if (shots) {
        mkdirSync(shots, { recursive: true });
        for (const key of ["google", "moonshot"]) {
          const r = ph.hubs[key] && ph.hubs[key].rect;
          if (!r) continue;
          const img = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
          writeFileSync(join(shots, `phone-${key}.png`), Buffer.from(img.data, "base64"));
          console.log(`      saved ${join(shots, `phone-${key}.png`)} (${Math.round(r.w)}×${Math.round(r.h)} CSS px)`);
        }
      }
      // H3n negative fixture (e): a too-wide element forced into one hub must be reported
      const forced = JSON.parse(await evalExpr(send, `(() => {
        const cur = document.querySelector('#s10-hub-google .s10-hub-current');
        const x = document.createElement('span'); x.id = 's10-phone-fixture'; x.style.cssText = 'display:inline-block;width:620px;height:4px';
        cur.append(x);
        const out = ${PROBE_PHONE};
        x.remove();
        return out;
      })()`));
      const fr = new Set(phoneProblems(forced).filter(p => p.key === "google" || p.key === "*").map(p => p.rule));
      assert("H3n negative fixture (e): a 620 px element forced into the Google hub is reported (past the viewport, hub and page overflow, clipped text)",
        ["past-viewport", "hub-overflow", "clipped", "page-overflow"].every(r => fr.has(r)), [...fr].join(","));
      await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await setWidth(send, 1440, false);
    }

    // H2 — every Reproduce link in §10, each from a persisted, edited state
    const links = JSON.parse(await evalExpr(send, `JSON.stringify([
      ...[...document.querySelectorAll('.s10-hub a.ape-reproduce')].map(a => ({ kind: 'hub', hub: a.closest('.s10-hub').dataset.s10Hub, href: a.getAttribute('href') })),
      ...[...document.querySelectorAll('#provider-cards details.prov a.load-op')].map(a => ({ kind: 'july', card: a.closest('details.prov').id, model: a.dataset.model, persp: a.dataset.persp }))
    ])`));
    const nHub = links.filter(l => l.kind === "hub").length, nJuly = links.filter(l => l.kind === "july").length;
    assert(`H2 found every Reproduce link: ${nHub} hub links (one per hub with an estimate) and ${nJuly} July-card load links on the six cards`,
      nHub === hubKeys.length && new Set(links.filter(l => l.kind === "july").map(l => l.card)).size === Object.keys(P10).length,
      JSON.stringify(links.map(l => l.hub || `${l.card}:${l.model}/${l.persp}`)));
    /* One link, end to end, against what THAT link is meant to load. `tamper` (negative fixtures only)
       is page code run on the link just before the click. Returns named problems. */
    async function checkLink(link, ordinal, tamper = "") {
      const out = [];
      const bad = (rule, msg) => out.push({ rule, msg });
      const target = link.kind === "hub" ? recs.find(r => r.key === P10[link.hub].estimateKey).carrier : link.model;
      const def = target === "grok" ? { model: "gpt", persp: "dive" } : { model: "grok", persp: "xaiopp" };
      // a persisted reader default on another model and preset, the page reopened on it, then an unsaved edit
      await evalExpr(send, `writeReaderDefault(${JSON.stringify(def.model)}, ${JSON.stringify(def.persp)})`);
      await send("Page.navigate", { url: base });
      await sleep(150);
      if (!await waitReady(send, false)) { bad("start", "the base page did not reopen"); return { def, out }; }
      const pre = JSON.parse(await evalExpr(send, `(async () => {
        const before = ${STATE};
        S.util = S.util >= 90 ? S.util - 7 : S.util + 7; if (noteUserEdit()) await new Promise(r => setTimeout(r, 50)); else renderAll();
        return JSON.stringify({ before: JSON.parse(before), after: JSON.parse(${STATE}) });
      })()`));
      if (!(pre.before.model === def.model && pre.before.persp === def.persp && pre.after.util !== pre.before.util))
        bad("start", "not a persisted, edited start: " + JSON.stringify(pre));
      await evalExpr(send, `(() => {
        document.getElementById('rs-10').open = true; document.querySelectorAll('#provider-cards details.prov').forEach(d => { d.open = true; });
        const a = ${link.kind === "hub" ? `document.querySelector('#s10-hub-${link.hub} a.ape-reproduce')`
          : `document.querySelectorAll('#provider-cards details.prov a.load-op')[${ordinal}]`};
        ${tamper}
        a.scrollIntoView(); a.click(); return true;
      })()`);
      let s;
      if (link.kind === "hub") {
        if (!await waitReady(send, true)) { bad("navigation", "the link did not navigate to a shared scenario"); return { def, out }; }
      } else await sleep(150);
      s = JSON.parse(await evalExpr(send, STATE));
      if (!(s.readerDefault && s.readerDefault.model === def.model && s.readerDefault.persp === def.persp)) bad("default", "the persisted default changed: " + JSON.stringify(s.readerDefault) + " (raw " + JSON.stringify(s.rawDefault) + ")");
      if (link.kind === "hub") {
        const rec = recs.find(r => r.key === P10[link.hub].estimateKey), t = rec.scenarios.central.traffic;
        if (s.model !== rec.carrier) bad("model", `${s.model} != ${rec.carrier}`);
        if (s.persp !== "median") bad("persp", `${s.persp} != median`);
        if (!(s.tr.mode === "custom" && s.tr.ioRatio === t.io_ratio && s.tr.cacheHit === t.cache_hit)) bad("traffic", JSON.stringify(s.tr));
        if (s.util !== rec.scenarios.central.overrides.util) bad("util", `${s.util}`);
        if (!(Math.abs(s.margin - expected[rec.key].central) < 1e-6)) bad("margin", `${s.margin} != canonicalReplay ${expected[rec.key].central}`);
        if (!s.body) bad("note", "no 'Loaded a shared scenario' note");
      } else {
        const m = E.MODELS.find(x => x.id === link.model), p = E.PERSPECTIVES.find(x => x.id === link.persp);
        const st = E.pinReferenceLevers(E.applyPresetSettings(m, p)), tr = E.resolveTraffic(m, p, { mode: "native" });
        if (s.model !== link.model) bad("model", `${s.model} != ${link.model}`);
        if (s.persp !== link.persp) bad("persp", `${s.persp} != ${link.persp}`);
        if (s.util !== st.util) bad("util", `${s.util} != ${st.util}`);
        if (tr.locked) {
          /* a replay locks its traffic and pins its reference levers: the link reproduces the card */
          if (!(s.tr.mode === tr.mode && s.tr.ioRatio === tr.ioRatio && s.tr.cacheHit === tr.cacheHit)) bad("traffic", `${JSON.stringify(s.tr)} != locked ${tr.ioRatio}:1/${tr.cacheHit}%`);
          if (!(Math.abs(s.margin - E.workload(st).margin * 100) < 1e-6)) bad("margin", `${s.margin} != replay ${E.workload(st).margin * 100}`);
        } else {
          /* a scenario preset that does NOT lock traffic (the China public-cloud lens on R1) keeps the
             traffic mix in force when it is clicked — by the calculator's design only replays lock
             traffic — so that is the contract asserted for it, not the replay one */
          const kept = pre.after.tr;
          if (!(s.tr.ioRatio === kept.ioRatio && s.tr.cacheHit === kept.cacheHit && s.tr.mode !== "replay-locked")) bad("traffic", `${JSON.stringify(s.tr)} != kept ${JSON.stringify(kept)}`);
        }
        const prov = Object.entries(P10).find(([k]) => `prov-${k}` === link.card);
        if (prov && prov[1].julyMetric === "output-token" && link.model === prov[1].julyModelId && link.persp === "dive") {
          const jr = A.julyReplay(prov[0], E);
          const receipt = await evalExpr(send, `document.body.textContent.indexOf(${JSON.stringify(`OUTPUT-TOKEN margin (the §10 metric): ${jr.value.toFixed(1)}%`)}) >= 0`);
          if (!(Math.abs(s.outTok - jr.value) < 1e-6 && receipt === true)) bad("output-token", JSON.stringify({ outTok: s.outTok, want: jr.value, receipt }));
        }
      }
      return { def, out, s };
    }
    const july = links.filter(l => l.kind === "july");
    for (const link of links) {
      const ordinal = link.kind === "july" ? july.indexOf(link) : -1;
      const { def, out } = await checkLink(link, ordinal);
      let what;
      if (link.kind === "hub") {
        const rec = recs.find(r => r.key === P10[link.hub].estimateKey), t = rec.scenarios.central.traffic;
        what = `hub ${link.hub} (${rec.key}): loads ${rec.carrier} · median · custom ${t.io_ratio}:1/${t.cache_hit}% at canonicalReplay's central ${expected[rec.key].central.toFixed(4)}`;
      } else {
        const m = E.MODELS.find(x => x.id === link.model), p = E.PERSPECTIVES.find(x => x.id === link.persp), tr = E.resolveTraffic(m, p, { mode: "native" });
        what = `July ${link.card} → ${link.model}/${link.persp}: loads that model and preset with ${tr.locked ? `its locked ${tr.ioRatio}:1/${tr.cacheHit}% traffic and the replay's margin` : "its own utilization, keeping the traffic in force (not a replay)"}`
          + (link.card === "prov-moonshot" && link.persp === "dive" ? ", and keeps the OUTPUT-TOKEN metric of the July card" : "");
      }
      assert(`H2 ${what} — from a persisted ${def.model}/${def.persp} default with an edit, the default left untouched`,
        out.length === 0, out.map(p => `[${p.rule}] ${p.msg}`).join("; "));
    }
    /* H2n NEGATIVE FIXTURES: the same per-link check on a tampered link must report it */
    {
      const hubs = links.filter(l => l.kind === "hub");
      const [h0, h1] = hubs;
      const r = await checkLink(h0, -1, `a.setAttribute('href', ${JSON.stringify(h1.href)});`);
      const rules = new Set(r.out.map(x => x.rule));
      assert(`H2n negative fixture (c): the ${h0.hub} hub's link pointed at the ${h1.hub} estimate's share token is reported (margin, traffic)`,
        rules.has("margin") && rules.has("traffic"), [...rules].join(","));
      const moon = july.find(l => l.card === "prov-moonshot" && l.persp === "dive");
      const r2 = await checkLink(moon, july.indexOf(moon), `a.setAttribute('data-persp', 'median');`);
      const rules2 = new Set(r2.out.map(x => x.rule));
      assert("H2n negative fixture (d): Moonshot's July link retargeted off its dive replay is reported (preset, traffic, output-token metric)",
        rules2.has("persp") && rules2.has("traffic") && rules2.has("output-token"), [...rules2].join(","));
    }
  } catch (e) {
    assert("CDP harness ran", false, e.message);
  } finally { cleanup(); }
}

await main();
console.log(`\n${failures === 0 ? "ALL S10-HUB CDP TESTS PASS" : failures + " S10-HUB CDP FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
