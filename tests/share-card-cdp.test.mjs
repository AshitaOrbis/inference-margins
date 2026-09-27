// SHARE CARD — browser half (bq-3550, 2026-09-27). Renders site/index.html as a first-time visitor
// gets it and reads the same figures scripts/build-share-card.mjs read when it drew the card. They must
// equal design/share-card/values.json: if the page's opening scenario, an estimate face or the floor
// moves and the card is not rebuilt, every link preview would advertise a number the page no longer
// shows. That is the failure this suite exists to stop. (The static half: tests/share-card.test.mjs.)
// Run: node tests/share-card-cdp.test.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import { withTab, readPageValues, renderCard, pngDiff } from "../scripts/build-share-card.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const rec = JSON.parse(readFileSync(join(ROOT, "design", "share-card", "values.json"), "utf8"));
const live = await withTab((send) => readPageValues(send));

assert("rendered: the headline figure the card advertises", live.headline === rec.values.headline, `${live.headline} vs card ${rec.values.headline}`);
assert("rendered: the headline's status line", live.headlineStatus === rec.values.headlineStatus, `${live.headlineStatus} vs ${rec.values.headlineStatus}`);
assert("rendered: the opening scenario's name", live.scenario === rec.values.scenario, `${live.scenario} vs ${rec.values.scenario}`);
assert("rendered: the 'page opens on this scenario' line the card states (a shared ?s= link opens another state; the card says whose number this is)",
  live.opens === rec.values.opens, `${live.opens} vs ${rec.values.opens}`);
assert("rendered: the scenario's billing and cost-basis facts the card states",
  live.billing === rec.values.billing && live.basis === rec.values.basis, JSON.stringify([live.billing, live.basis, rec.values.billing, rec.values.basis]));
assert("rendered: the public-data floor figure and its label", live.floor === rec.values.floor && live.floorLabel === rec.values.floorLabel,
  JSON.stringify([live.floor, live.floorLabel, rec.values.floor, rec.values.floorLabel]));
assert("rendered: both quoted estimates (who, median, stated range)",
  JSON.stringify(live.estimates.map(({ who, median, range }) => [who, median, range])) ===
  JSON.stringify(rec.values.estimates.map(({ who, median, range }) => [who, median, range])),
  JSON.stringify({ live: live.estimates, card: rec.values.estimates }));

/* THE IMAGE ITSELF (GPT Pro internal review R3): the checks above bind page → values; these bind values → pixels.
   The card is re-rendered from the recorded values with the current template and compared with the served PNG
   pixel by pixel, and its required elements are audited (present, visible, unclipped, not overlapping, above
   their size floor, clear of the overlay zone) — so a hidden headline, an edited template or a valid-but-wrong
   PNG all fail here even when the numbers on the page have not moved. */
const tplSha = createHash("sha256").update(readFileSync(join(ROOT, "design", "share-card", "card.html"))).digest("hex");
assert("the card was built from the current template (values.json template_sha256)", rec.template_sha256 === tplSha, `${rec.template_sha256} vs ${tplSha}`);
const served = readFileSync(join(ROOT, "site", "share-card.png"));
const fresh = await renderCard(rec.values);
assert("a fresh render of the recorded values passes the required-element audit", fresh.audit.problems.length === 0, fresh.audit.problems.join("; "));
const d = await pngDiff(fresh.png, served);
// Re-renders are byte-identical on one machine (0 differing pixels, measured 2026-09-27); 0.02% (151 px) leaves room
// for anti-aliasing drift only — a recoloured 5 px accent bar alone is ~1,100 px and fails.
assert("the served PNG shows what the recorded values render to (≤ 0.02% of pixels differ beyond tolerance)",
  !d.sizeMismatch && d.share <= 0.0002, JSON.stringify(d));

/* SERVED BOUNDARY: fetch the page over loopback HTTP, read the og:image the crawler would read, and fetch THAT. */
const TYPES = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(ROOT, "site", path === "/" ? "index.html" : path);
  if (!file.startsWith(join(ROOT, "site"))) { res.writeHead(403); return res.end(); }
  try { const body = readFileSync(file); res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const html = await (await fetch(base + "/")).text();
  const og = (html.match(/<meta property="og:image" content="([^"]+)">/) || [])[1];
  assert("served HTML names an og:image", !!og, String(og));
  const url = new URL(og);
  const resp = await fetch(base + url.pathname + url.search);
  const buf = Buffer.from(await resp.arrayBuffer());
  assert("the og:image path is served as image/png", resp.status === 200 && /^image\/png/.test(resp.headers.get("content-type") || ""), `${resp.status} ${resp.headers.get("content-type")}`);
  assert("the served og:image bytes are the recorded card (sha256) and 1200×630",
    createHash("sha256").update(buf).digest("hex") === rec.png_sha256 && buf.readUInt32BE(16) === 1200 && buf.readUInt32BE(20) === 630);
} finally { server.close(); }

console.log(failures ? `\n${failures} FAILURE(S) — rebuild the card: npm run build:share-card` : "\nSHARE CARD MATCHES THE RENDERED PAGE");
process.exit(failures ? 1 : 0);
