#!/usr/bin/env node
// build-share-card.mjs — the link-preview image (og:image / twitter:image), rendered by code.
//
// Two steps, both in headless Chrome over CDP (the same driver the browser suites use):
//   1. READ the numbers off the page itself. site/index.html is opened exactly as a first-time
//      visitor gets it (no storage, no referrer, default skin/theme) and the card's figures are read
//      from the rendered DOM — the headline tile, the two quoted estimates and the public-data floor
//      tile. The card never types a number of its own, so it cannot say something the page does not.
//   2. RENDER design/share-card/card.html with those values at exactly 1200×630 CSS px, device scale
//      1, and write site/share-card.png. The values and the PNG's sha256 go to
//      design/share-card/values.json, which tests/share-card-cdp.test.mjs re-reads against a fresh
//      render of the page — so a default that moves turns the gate red until the card is rebuilt.
//
// Not part of `npm run build`: a PNG is not guaranteed byte-stable across Chrome/font-stack
// versions, and gate:artifacts ends in `git diff --exit-code`. The card is rebuilt on purpose
// (`npm run build:share-card`) and checked on every gate run.
// Run: node scripts/build-share-card.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site", "index.html");
const TEMPLATE = join(ROOT, "design", "share-card", "card.html");
const OUT_PNG = join(ROOT, "site", "share-card.png");
const OUT_VALUES = join(ROOT, "design", "share-card", "values.json");
const W = 1200, H = 630;

export const READ_PROBE = `(() => {
  const t = (el) => (el ? el.textContent.replace(/\\s+/g, " ").trim() : null);
  const cards = [...document.querySelectorAll("#estimates .est-card")].map((c) => ({
    who: t(c.querySelector(".est-who")), median: t(c.querySelector(".est-median")),
    range: t(c.querySelector(".est-range")), basis: t(c.querySelector(".est-basis")) }));
  return JSON.stringify({
    headline: t(document.getElementById("out-margin")),
    headlineStatus: t(document.getElementById("out-margin-status")),
    scenario: t(document.querySelector(".tile-hero .win-name")),
    billing: t(document.querySelector(".tile-hero .win-billing")),
    basis: t(document.querySelector(".tile-hero .win-basis")),
    opens: t(document.querySelector("#win-head .win-default-row")),
    floor: t(document.getElementById("fa-planning-point")),
    floorLabel: (() => { const el = document.querySelector("#final-answer .tile-label"); if (!el) return null; const c = el.cloneNode(true); c.querySelectorAll("button").forEach((b) => b.remove()); return t(c); })(),
    estimates: cards,
    title: document.title,
  });
})()`;

function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("no DevToolsActivePort");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, (m) => (m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

// One Chrome, one tab. `fn(send)` runs with the tab open; the browser is always torn down.
export async function withTab(fn) {
  const chrome = findChrome();
  if (!chrome) throw new Error("no Chrome/Chromium on PATH");
  const userDir = mkdtempSync(join(tmpdir(), "im-share-card-"));
  const proc = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--font-render-hinting=none", "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank"], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
    const send = cdpClient(ws);
    await send("Page.enable");
    return await fn(send);
  } finally {
    try { ws && ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

// Read the figures a first-time visitor sees, from the rendered page.
export async function readPageValues(send, url = pathToFileURL(SITE).href) {
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  for (let t = 0; t < 20000; t += 200) {
    const ready = await evalExpr(send, "typeof updateTiles === 'function' && !!document.getElementById('out-margin') && /\\d/.test(document.getElementById('out-margin').textContent) && /\\d/.test((document.getElementById('fa-planning-point')||{}).textContent||'')").catch(() => false);
    if (ready) break;
    await sleep(200);
  }
  await sleep(900); // the debounced first render
  return JSON.parse(await evalExpr(send, READ_PROBE));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const SITE_ORIGIN = "https://margins.ashitaorbis.com";
export const TAG_BEGIN = "<!-- share-card:begin — generated by scripts/build-share-card.mjs from design/share-card/values.json; do not edit by hand -->";
export const TAG_END = "<!-- share-card:end -->";
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// The link-preview tags. Every figure comes from the same page read as the image, so the tags, the
// image and the page cannot say different things. ?v= is the image's own hash — a version signal that helps
// a rebuilt card reach NEW shares past X's image cache; it does not make posts already made refetch.
export function renderTagBlock(v, pngSha256) {
  // One conditional claim, like the image: the headline, whose calculation it is, the scenario's own billing
  // and cost-basis assumptions (read off the page's window facts), and the gross-margin qualifier.
  const image = `${SITE_ORIGIN}/share-card.png?v=${pngSha256.slice(0, 12)}`;
  const [scenarioName, model] = v.scenario.split(" · ");
  const after = (s, lead) => { const x = s.startsWith(lead) ? s.slice(lead.length) : s; return x.charAt(0).toLowerCase() + x.slice(1); };
  const title = `Frontier Inference Margins — ${v.headline} serving margin`;
  const description = `${v.headline} serving margin on ${model}, ${v.headlineStatus} (${scenarioName}): ` +
    `${after(v.billing, "Billing: ")}, ${after(v.basis, "Cost basis: ")}. Not a company gross margin. An interactive cost model.`;
  const alt = `Frontier Inference Margins. Serving margin ${v.headline}. Not a company gross margin. ` +
    `${v.scenario}, ${v.headlineStatus}. ${v.billing}. ${v.basis}. ${v.opens}`;
  const tags = [
    ["property", "og:type", "website"], ["property", "og:site_name", "Frontier Inference Margins"],
    ["property", "og:url", `${SITE_ORIGIN}/`], ["property", "og:title", title], ["property", "og:description", description],
    ["property", "og:image", image], ["property", "og:image:type", "image/png"],
    ["property", "og:image:width", "1200"], ["property", "og:image:height", "630"], ["property", "og:image:alt", alt],
    ["name", "twitter:card", "summary_large_image"], ["name", "twitter:title", title], ["name", "twitter:description", description],
    ["name", "twitter:image", image], ["name", "twitter:image:alt", alt],
  ];
  return [TAG_BEGIN, ...tags.map(([k, n, c]) => `<meta ${k}="${n}" content="${attr(c)}">`), TAG_END].join("\n");
}

// Replace the block in site/index.html (or insert it after the canonical link the first time).
export function writeTagBlock(block) {
  let html = readFileSync(SITE, "utf8");
  const a = html.indexOf(TAG_BEGIN), b = html.indexOf(TAG_END);
  if (a >= 0 && b > a) html = html.slice(0, a) + block + html.slice(b + TAG_END.length);
  else {
    const anchor = '<link rel="canonical" href="https://margins.ashitaorbis.com/">';
    if (!html.includes(anchor)) throw new Error("no share-card block and no canonical link to insert after");
    html = html.replace(anchor, anchor + "\n" + block);
  }
  writeFileSync(SITE, html);
}

export function fillTemplate(v) {
  const fonts = pathToFileURL(join(ROOT, "site", "fonts")).href;
  const [pro, fable] = v.estimates;
  const map = {
    FONTS: fonts,
    HEADLINE: v.headline, HEADLINE_STATUS: v.headlineStatus, SCENARIO: v.scenario, BILLING: v.billing, BASIS: v.basis, OPENS: v.opens,
    PRO_WHO: pro.who, PRO_MEDIAN: pro.median, PRO_RANGE: pro.range,
    FABLE_WHO: fable.who, FABLE_MEDIAN: fable.median, FABLE_RANGE: fable.range,
    FLOOR_LABEL: v.floorLabel, FLOOR: v.floor,
  };
  let html = readFileSync(TEMPLATE, "utf8");
  for (const [k, val] of Object.entries(map)) html = html.split(`{{${k}}}`).join(k === "FONTS" ? val : esc(val));
  const left = html.match(/\{\{[A-Z_]+\}\}/);
  if (left) throw new Error("unfilled placeholder in the share-card template: " + left[0]);
  return html;
}

// The card's required elements and the floor each must clear. A reader sees the card at ~340 px wide in an X
// phone timeline (0.28x), so a qualification below ~34 px here is below ~10 px there (GPT Pro internal review
// R3/R10). The audit runs on every build AND in tests/share-card-cdp.test.mjs, so a template that hides,
// overlaps, clips or shrinks one of these fails the gate, not just the eye.
export const REQUIRED = { headline: 150, label: 34, gm: 40, who: 34, status: 34, opens: 30, billing: 30, basis: 30 };
export const CLEAR_ZONE = { x: 0, y: 630 - 80, w: 620, h: 80 }; // X lays the link's domain over the bottom-left

export const AUDIT_PROBE = `(() => {
  const req = ${JSON.stringify(REQUIRED)}, zone = ${JSON.stringify(CLEAR_ZONE)};
  const out = { problems: [], boxes: {} };
  for (const [k, minPx] of Object.entries(req)) {
    const e = document.querySelector('[data-fit="' + k + '"]');
    if (!e) { out.problems.push(k + ": missing"); continue; }
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    out.boxes[k] = { x: r.x, y: r.y, w: r.width, h: r.height, fs: parseFloat(cs.fontSize), text: e.textContent.trim() };
    if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || r.width < 2 || r.height < 2) out.problems.push(k + ": not visible");
    if (!/\\S/.test(e.textContent)) out.problems.push(k + ": empty");
    if (parseFloat(cs.fontSize) < minPx) out.problems.push(k + ": " + cs.fontSize + " < " + minPx + "px");
    if (r.left < 0 || r.top < 0 || r.right > 1200 - 24 || r.bottom > 630) out.problems.push(k + ": outside the canvas");
    // horizontal overflow is strict; vertically, a glyph may overhang a tight line box by up to 30% of its size
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 0.3 * parseFloat(cs.fontSize)) out.problems.push(k + ": clipped");
    if (r.left < zone.x + zone.w && r.bottom > zone.y) out.problems.push(k + ": inside the bottom-left overlay zone");
  }
  const ks = Object.keys(out.boxes);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const A = out.boxes[ks[i]], B = out.boxes[ks[j]];
    if (A.x < B.x + B.w - 1 && B.x < A.x + A.w - 1 && A.y < B.y + B.h - 1 && B.y < A.y + A.h - 1) out.problems.push(ks[i] + " overlaps " + ks[j]);
  }
  return JSON.stringify(out);
})()`;

// Render the card for the given values: returns the PNG and the audit of its required elements.
export async function renderCard(values) {
  const dir = mkdtempSync(join(tmpdir(), "im-share-card-html-"));
  const htmlPath = join(dir, "card.html");
  writeFileSync(htmlPath, fillTemplate(values));
  try {
    return await withTab(async (send) => {
      await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: pathToFileURL(htmlPath).href });
      for (let t = 0; t < 10000; t += 100) {
        if (await evalExpr(send, "document.readyState === 'complete' && document.fonts.status === 'loaded'").catch(() => false)) break;
        await sleep(100);
      }
      await evalExpr(send, "document.fonts.ready.then(() => true)");
      await sleep(300);
      const audit = JSON.parse(await evalExpr(send, AUDIT_PROBE));
      const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, captureBeyondViewport: false });
      return { png: Buffer.from(r.data, "base64"), audit };
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Pixel comparison of two PNGs in the browser: the share of pixels whose largest channel difference exceeds tol.
export async function pngDiff(a, b, tol = 24) {
  return withTab(async (send) => {
    const expr = `(async () => {
      const load = (b64) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + b64; });
      const [A, B] = await Promise.all([load(${JSON.stringify(a.toString("base64"))}), load(${JSON.stringify(b.toString("base64"))})]);
      if (A.width !== B.width || A.height !== B.height) return JSON.stringify({ sizeMismatch: [A.width, A.height, B.width, B.height] });
      const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
      const da = px(A), db = px(B); let diff = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > ${tol}) diff++;
      return JSON.stringify({ differing: diff, total: da.length / 4, share: diff / (da.length / 4) });
    })()`;
    return JSON.parse(await evalExpr(send, expr));
  });
}

async function main() {
  const values = await withTab((send) => readPageValues(send));
  for (const k of ["headline", "headlineStatus", "scenario", "billing", "basis", "opens", "floor", "floorLabel"])
    if (!values[k] || (["headline", "floor"].includes(k) && !/\d/.test(values[k]))) throw new Error(`page value '${k}' did not render: ${JSON.stringify(values[k])}`);
  if (values.estimates.length !== 2 || values.estimates.some((e) => !/\d/.test(e.median || "")))
    throw new Error("expected exactly two rendered estimate cards: " + JSON.stringify(values.estimates));
  const { png, audit } = await renderCard(values);
  if (audit.problems.length) throw new Error("share-card audit failed: " + audit.problems.join("; "));
  writeFileSync(OUT_PNG, png);
  const record = { schema: "im-share-card/2", size: [W, H], png: "site/share-card.png",
    png_sha256: createHash("sha256").update(png).digest("hex"),
    template_sha256: createHash("sha256").update(readFileSync(TEMPLATE)).digest("hex"),
    read_from: "site/index.html rendered at 1440×900, default skin/theme, no storage", values };
  writeFileSync(OUT_VALUES, JSON.stringify(record, null, 2) + "\n");
  writeTagBlock(renderTagBlock(values, record.png_sha256));
  console.log(`share card: ${OUT_PNG} (${png.length} B) — ${values.headline}; audit clean (${Object.keys(audit.boxes).length} required elements)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
}
