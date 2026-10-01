/* ChatGPT citation markers in the served site — a release check (bq-3035, 2026-10-01).
 *
 * WHY THIS EXISTS. A ChatGPT answer pasted without cleaning carries the tool's citation markers:
 * a `cite`/`filecite` word, the token id `turn<digits><kind><digits>` (kind = view, search, news,
 * fetch, file, image …) and private-use delimiters U+E200 / U+E201 / U+E202 that most fonts draw
 * as empty boxes. A live census on 2026-10-01 found 178 such tokens on four annex pages of
 * margins.ashitaorbis.com. Nothing in `npm test` looked for them, so the annex generator passed
 * them through from the research markdown, and the MCP Worker's archive (built from site/) served
 * them a second time. This check reads the SERVED bytes under site/, which both surfaces are built
 * from, so it does not depend on which markdown source a page came from. It does NOT read the
 * Worker's own build outputs (src/gen/, dist-release/): those are rebuilt from site/ by the
 * release re-pin, and a checkout can legitimately hold a stale copy until then, so the release
 * steps read the re-pinned bundle back separately.
 *
 * WHAT COUNTS AS A MARKER (any one fails the check):
 *   * a character in the Basic Multilingual Plane's private-use area, U+E000–U+F8FF;
 *   * a ChatGPT reference token id, `turn` + digits + a kind word + digits;
 *   * the `oaicite` / `contentReference[` copy artefact;
 *   * the older assistant citation shape, a fullwidth bracket holding digits and a dagger.
 * Prose that DESCRIBES the markers without a real token id (the changelog's "`[cite: turn…viewN]`"
 * sentence, the dive provenance notes) carries no digits after `turn` and does not match.
 *
 * PINNED PAGES. Three annex pages are verbatim recoveries whose headers stamp a SHA-256 over a
 * response body that CONTAINS markers, and one of them says the markers are "preserved as
 * received". Stripping them would make the stamp false, so they are pinned at their exact counts
 * instead of being exempt: a count that rises (a new paste) or falls (a strip) fails here, and
 * the fix is to change the page and its provenance stamp together, then this pin.
 *
 * Usage: node tests/annex-citation-markers.test.mjs [--root DIR]   (DIR defaults to the repo root;
 * --root exists so the check can be proved red against a fixture tree).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = (() => { let d = HERE; while (!existsSync(join(d, "package.json"))) { const up = dirname(d); if (up === d) throw new Error("repo root not found"); d = up; } return d; })();
const rootArg = process.argv.indexOf("--root");
const ROOT = rootArg > 0 ? process.argv[rootArg + 1] : REPO;
if (!ROOT || !existsSync(join(ROOT, "site"))) { console.log(`FAIL  no site/ directory under ${ROOT}`); process.exit(1); }

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const SHAPES = {
  pua: /[\uE000-\uF8FF]/g,
  token: /turn\d+(?:search|view|news|fetch|file|image|product|forecast|finance|sports|time|academia)\d+/g,
  oaicite: /oaicite|contentReference\[/g,
  bracket: /\u3010\d+(?::\d+)?\u2020[^\u3011]{0,40}\u3011/g,
};
const TEXT = new Set([".html", ".htm", ".js", ".mjs", ".json", ".css", ".md", ".txt", ".svg", ".xml", ".sha256", ""]);

/* Exact counts on the SHA-stamped verbatim pages (see PINNED PAGES above). */
const PINNED = {
  "site/research/gptpro-consult-anthropic-verbatim.html": { pua: 143, token: 59, oaicite: 0, bracket: 0 },
  "site/research/consult-roofline-verbatim.html": { pua: 44, token: 20, oaicite: 0, bracket: 0 },
  "site/research/consult-preset-pack-reaudit.html": { pua: 6, token: 2, oaicite: 0, bracket: 0 },
};

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) walk(full, out);
    else if (TEXT.has(extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
};
const files = walk(join(ROOT, "site")).sort();
assert("the scan found served files to read", files.length > 0, `0 files under ${ROOT}/site`);

const count = text => Object.fromEntries(Object.entries(SHAPES).map(([k, re]) => [k, (text.match(re) || []).length]));
const seenPins = new Set();
let dirty = 0;
for (const f of files) {
  const rel = relative(ROOT, f).split("\\").join("/");
  const c = count(readFileSync(f, "utf8"));
  if (rel in PINNED) {
    seenPins.add(rel);
    const want = PINNED[rel];
    const same = Object.keys(want).every(k => c[k] === want[k]);
    assert(`${rel} keeps its pinned marker counts`, same, `found ${JSON.stringify(c)}, pinned ${JSON.stringify(want)} — change the page and its SHA-256 stamp together, then this pin`);
    continue;
  }
  if (Object.values(c).some(n => n > 0)) {
    dirty++;
    const text = readFileSync(f, "utf8");
    const first = Object.values(SHAPES).map(re => { re.lastIndex = 0; const m = re.exec(text); re.lastIndex = 0; return m ? m.index : Infinity; }).reduce((a, b) => Math.min(a, b));
    const ctx = JSON.stringify(text.slice(Math.max(0, first - 80), first + 60));
    assert(`${rel} carries no citation markers`, false, `${JSON.stringify(c)}; first at ${first}: ${ctx}`);
  }
}
assert(`${files.length - seenPins.size} unpinned served files carry no citation markers`, dirty === 0, `${dirty} file(s) above`);
/* A pin whose page has gone (renamed, dropped from the build) is a check that has gone quietly
   narrow; only the repo's own tree is held to this, a fixture tree need not carry the pinned pages. */
if (ROOT === REPO) for (const p of Object.keys(PINNED)) assert(`pinned page ${p} still exists`, seenPins.has(p), "renamed or removed — update PINNED");

console.log(failures ? `\n${failures} failure(s)` : "\nall citation-marker checks passed");
process.exit(failures ? 1 : 0);
