// im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): paired-card
// and rent-segment browser contract. Raw CDP, matching custom-fleets-cdp.test.mjs.
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = list.find(x => x.type === "page" && x.webSocketDebuggerUrl); if (pg) return pg.webSocketDebuggerUrl; } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => { let msg; try { msg = JSON.parse(ev.data); } catch { return; } if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
  return (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)); ws.send(JSON.stringify({ id: mid, method, params })); });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const PROBE = `(async () => {
  const q = s => document.querySelector(s);
  const visible = s => { const e=q(s); if(!e) return false; const c=getComputedStyle(e), r=e.getBoundingClientRect(); return c.display!=='none' && c.visibility!=='hidden' && r.width>0 && r.height>0; };
  const text = s => (q(s)?.textContent || '').trim();
  const r = {};
  r.hero = visible('#out-margin') && text('#out-margin').length > 0;
  r.owned = visible('#out-margin-owned') && text('#out-margin-owned').length > 0;
  r.rentSegment = visible('#out-rent-segment') && /Rental-inclusive/.test(text('#out-rent-segment'));
  const tables = [...document.querySelectorAll('#hw-two-tables table')];
  r.tables = tables.length; r.equalRows = tables.length===2 && tables[0].rows.length===tables[1].rows.length;
  const toggle=q('#stack-rent-toggle');
  const hasRent = () => [...document.querySelectorAll('#chart-stack table th')].some(x => /^rent/i.test(x.textContent.trim()));
  r.rentInitially = !!toggle?.checked && hasRent();
  toggle.checked=false; toggle.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(x=>setTimeout(x,50)); r.rentOff=!hasRent();
  toggle.checked=true; toggle.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(x=>setTimeout(x,50)); r.rentOn=hasRent();
  const tco=[...document.querySelectorAll('[data-param-key="hwMode"] button')].find(b=>/Owned TCO/.test(b.textContent));
  tco.click(); await new Promise(x=>setTimeout(x,50)); r.flipped=/rented/.test(text('#out-owned-label'));
  const rent=[...document.querySelectorAll('[data-param-key="hwMode"] button')].find(b=>/Rental/.test(b.textContent));
  rent.click(); await new Promise(x=>setTimeout(x,50));
  const abs=q('[data-param-key="rentAbsAll"] input[type="number"]'); abs.value='2'; abs.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(x=>setTimeout(x,50));
  /* im-arc T1 fix (Sol review 2026-08-22, findings P1-3/P2-3): exercise the live
     title flip and contextual clear-button names after the reader states a rent. */
  r.readerRentTitle=[...document.querySelectorAll('#hw-two-tables h3')].some(x=>(x.textContent||'').trim()==='Reader-stated rents → margin per accelerator');
  const clears=[...document.querySelectorAll('[data-param-key="rentAbsAll"] .abs-clear, [data-param-key="rentAbsLeg"] .abs-clear')];
  r.clearNames=clears.map(x=>x.getAttribute('aria-label')||'');
  const margin=text('#out-margin'); const share=q('#share-scenario'); share.click(); await new Promise(x=>setTimeout(x,50));
  r.permalinkUrl=location.href; r.originalMargin=margin;
  return r;
})()`;

async function main() {
  if (!HTML) { assert("#two-card fixture locates site/index.html", false); return; }
  const html = readFileSync(HTML, "utf8");
  for (const id of ["out-margin-owned", "out-owned-label", "out-owned-note", "out-owned-band", "out-rent-segment", "stack-rent-toggle", "hw-two-tables"])
    assert(`#${id} exists in site/index.html`, html.includes(`id="${id}"`));
  if (failures) return;
  if (!CHROME) { assert("#two-card CDP locates a chromium/chrome binary", false, "none on PATH"); return; }
  const userDir = mkdtempSync(join(tmpdir(), "im-two-card-cdp-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", "--user-data-dir=" + userDir, "file://" + HTML], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws?.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir,{recursive:true,force:true}); } catch {} };
  try {
    const wsUrl = await pageTarget(await pollActivePort(userDir)); ws = new WebSocket(wsUrl);
    await new Promise((res,rej)=>{ws.addEventListener("open",res);ws.addEventListener("error",()=>rej(new Error("ws error")));});
    const send=cdpClient(ws); await send("Runtime.enable");
    for (const width of [1400,390]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      await send("Page.navigate", { url: "file://" + HTML });
      let first = null;
      for (let t=0;t<15000;t+=100) {
        first=await evalExpr(send,"({hero:(document.querySelector('#out-margin')?.textContent||'').trim(),owned:(document.querySelector('#out-margin-owned')?.textContent||'').trim(),hv:document.querySelector('#out-margin')?.getBoundingClientRect().height||0,ov:document.querySelector('#out-margin-owned')?.getBoundingClientRect().height||0,ready:document.readyState,tables:document.querySelectorAll('#hw-two-tables table').length})");
        /* im-arc T1 (director fix 2026-08-23): the static markup carries the placeholder "—" in
           both tiles, so a truthy-text poll exits BEFORE the page's script has run (readyState
           "loading", charts unrendered) and the probe below then reads an unrendered page. Wait for
           RENDERED values — a percent in each tile — and a complete document. */
        /* Round-2 fix-verify (2026-08-23): exit on the LAST renderer's output (the two basis tables), so a
           legitimate "n/a" / "—" hero state (tariff-only preset, incompatible pairing) cannot stall the poll
           for its full budget. The two-tables container is filled at the end of renderAll(). */
        if (first.ready === "complete" && first.tables === 2 && first.hero && first.owned) break; await sleep(100);
      }
      assert(`#out-margin visible and non-empty at ${width}px first paint`, !!first.hero && first.hv > 0, JSON.stringify(first));
      assert(`#out-margin-owned visible and non-empty at ${width}px first paint`, !!first.owned && first.ov > 0, JSON.stringify(first));
    }
    const r=await evalExpr(send,PROBE);
    assert("#out-rent-segment is visible under the default rent lens", r.rentSegment);
    assert("#hw-two-tables contains exactly two tables", r.tables===2, String(r.tables));
    assert("#hw-two-tables tables have equal row counts", r.equalRows);
    assert("#stack-rent-toggle defaults on and adds the rent column", r.rentInitially);
    assert("#stack-rent-toggle off removes the rent column", r.rentOff);
    assert("#stack-rent-toggle on restores the rent column", r.rentOn);
    assert("#out-owned-label flips to the rent counterpart after hwMode TCO", r.flipped);
    assert("#hw-two-tables flips to Reader-stated rents after rentAbsAll input", r.readerRentTitle);
    assert("absolute-rent clear buttons have unique accessible names",
      r.clearNames.length >= 2 && new Set(r.clearNames).size === r.clearNames.length, JSON.stringify(r.clearNames));
    assert("fleet-wide absolute-rent clear names the all-accelerator action",
      r.clearNames.includes("Rental price, all accelerators: use registered rates"), JSON.stringify(r.clearNames));
    assert("every per-accelerator absolute-rent clear names its accelerator and fallback action",
      r.clearNames.filter(x=>x!=="Rental price, all accelerators: use registered rates").every(x=>/: use fallback rental rate$/.test(x)), JSON.stringify(r.clearNames));
    assert("#share-scenario mints a rentAbsAll permalink", /[?&]s=/.test(r.permalinkUrl), r.permalinkUrl);
    await send("Page.navigate", { url: r.permalinkUrl });
    let restored = null;
    for (let t=0;t<15000;t+=100) {
      restored=await evalExpr(send,"({ready:document.readyState!=='loading'&&!!document.querySelector('[data-param-key=rentAbsAll] input[type=number]'),value:document.querySelector('[data-param-key=rentAbsAll] input[type=number]')?.value,margin:(document.querySelector('#out-margin')?.textContent||'').trim()})");
      if (restored.ready && restored.margin) break; await sleep(100);
    }
    assert("[data-param-key=rentAbsAll] permalink re-opens with value 2", restored?.value === "2", JSON.stringify(restored));
    assert("#out-margin is byte-identical after the rentAbsAll permalink re-open", restored?.margin === r.originalMargin, JSON.stringify({restored,original:r.originalMargin}));
  } catch (e) { assert("#two-card CDP harness completes", false, String(e?.message || e)); }
  finally { cleanup(); }
}
await main();
console.log(`\n${failures === 0 ? "ALL TWO-CARD CDP TESTS PASS" : failures + " TWO-CARD CDP FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
