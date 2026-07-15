#!/usr/bin/env node
/* Worker build step — REUSE, don't rewrite.
   Copies the tested shared sources from ../src verbatim into src/gen/ (mcp-server/src stays
   the single source of truth; src/gen is disposable build output, never edited), swaps in the
   three worker-native modules from overrides/ (engine bridge via bundler import, reports via
   live-site fetch, async get_report), bakes the fail-closed report catalog from ../../site,
   and FAILS the build on any parity drift between an override and its Node original. */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.resolve(__dirname, "..");
const MCP = path.resolve(WORKER, "..");           // mcp-server/
const SRC = path.join(MCP, "src");                // shared sources (single source of truth)
const SITE_DIR = path.resolve(MCP, "..", "site"); // the deployed site tree
const GEN = path.join(WORKER, "src", "gen");
const OVERRIDES = path.join(WORKER, "overrides");

const SITE = {
  calculator: "https://margins.ashitaorbis.com/",
  annex: "https://margins.ashitaorbis.com/research/",
};

function fail(msg) {
  console.error(`BUILD FAILED — ${msg}`);
  process.exit(1);
}

/* ---------- 0. the Node package must be built (we reuse its compiled htmlToText for titles,
   and its engine bridge as the numeric ground-truth gate) ---------- */
let nodeReports, nodeEngine;
try {
  nodeReports = await import(pathToFileURL(path.join(MCP, "dist", "reports.js")).href);
  nodeEngine = await import(pathToFileURL(path.join(MCP, "dist", "engine.js")).href);
} catch (e) {
  fail(`could not import mcp-server/dist (run \`npm run build\` in mcp-server first): ${e.message}`);
}
const { htmlToText } = nodeReports;
const E = nodeEngine.E;

/* Engine ground truth gate: opus + central lens @ native traffic must compute ≈76.8%. */
{
  const median = E.PERSPECTIVES.find((p) => p.id === "median");
  const opus = E.MODELS.find((m) => m.id === "opus");
  const pct = E.workload(E.applyPresetSettings(opus, median, { mode: "native" })).margin * 100;
  if (Math.abs(pct - 76.8) > 0.15) fail(`engine ground truth moved: opus central = ${pct} (expected ≈76.8)`);
  console.log(`engine gate: opus central = ${pct.toFixed(4)}% (${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF})`);
}

/* ---------- 1. copy shared sources verbatim ---------- */
rmSync(GEN, { recursive: true, force: true });
mkdirSync(path.join(GEN, "tools"), { recursive: true });

const SHARED_TOP = ["server.ts", "shape.ts", "labels.ts", "engine-types.d.ts"];
const SHARED_TOOLS = ["list_scenario_space.ts", "query_margin_claims.ts", "run_scenario.ts", "explore_range.ts", "get_dossier.ts"];
for (const f of SHARED_TOP) cpSync(path.join(SRC, f), path.join(GEN, f));
for (const f of SHARED_TOOLS) cpSync(path.join(SRC, "tools", f), path.join(GEN, "tools", f));

/* ---------- 2. swap in the worker-native modules ---------- */
cpSync(path.join(OVERRIDES, "engine.ts"), path.join(GEN, "engine.ts"));
cpSync(path.join(OVERRIDES, "reports.ts"), path.join(GEN, "reports.ts"));
cpSync(path.join(OVERRIDES, "get_report.ts"), path.join(GEN, "tools", "get_report.ts"));

/* ---------- 3. parity gates — overrides may not drift from their Node originals ---------- */
const nodeReportsSrc = readFileSync(path.join(SRC, "reports.ts"), "utf8");
const workerReportsSrc = readFileSync(path.join(OVERRIDES, "reports.ts"), "utf8");
const nodeGetReportSrc = readFileSync(path.join(SRC, "tools", "get_report.ts"), "utf8");
const workerGetReportSrc = readFileSync(path.join(OVERRIDES, "get_report.ts"), "utf8");

/* extract a block from marker to its closing top-level `}` / `";` line */
function block(src, marker, terminator, what) {
  const i = src.indexOf(marker);
  if (i === -1) fail(`parity extraction: "${what}" marker not found in the Node source`);
  const j = src.indexOf(terminator, i);
  if (j === -1) fail(`parity extraction: "${what}" terminator not found in the Node source`);
  return src.slice(i, j + terminator.length);
}
function assertContains(haystackName, haystack, needle, what) {
  if (!haystack.includes(needle)) fail(`parity drift: ${haystackName} no longer contains the Node original's ${what}. Re-sync overrides/ with ../src.`);
}

/* 3a. reports.ts: pure text helpers + ARCHIVE_NOTE must be byte-identical */
for (const [marker, what] of [
  ["function decodeEntities(s: string): string {", "decodeEntities body"],
  ["export function htmlToText(html: string): string {", "htmlToText body"],
]) {
  assertContains("overrides/reports.ts", workerReportsSrc, block(nodeReportsSrc, marker, "\n}", what), what);
}
assertContains("overrides/reports.ts", workerReportsSrc,
  block(nodeReportsSrc, "export const ARCHIVE_NOTE =", `";`, "ARCHIVE_NOTE"), "ARCHIVE_NOTE");

/* 3b. get_report: every load-bearing string of the original must survive in the variant */
const GET_REPORT_FRAGMENTS = [
  ['description', block(nodeGetReportSrc, '"Fetch a research-annex document', '",')],
  ["fail-closed unknown-id message", 'Unknown report id "${args.id}" — no fuzzy matching (a wrong-doc fetch is a misattribution vector). '],
  ["valid-ids listing", 'Valid ids: ${validReportIds().join(", ")}.'],
  ["offset guard", 'Offset ${offset} is beyond the end of "${entry.id}" (${total} chars).'],
  ["verbatim sentence", "— archived verbatim, characters ${offset}–${offset + slice.length} of ${total}"],
  ["truncation note", "(truncated; continue with offset ${offset + slice.length})"],
  ["receipt origin", "verbatim archive fetch: ${entry.id} — quoted material, no derived estimate"],
  ["max_chars schema", "max_chars: z.number().int().min(200).max(200000).optional()"],
];
for (const [what, fragment] of GET_REPORT_FRAGMENTS) {
  assertContains("../src/tools/get_report.ts", nodeGetReportSrc, fragment, `${what} (fragment list stale?)`);
  assertContains("overrides/get_report.ts", workerGetReportSrc, fragment, what);
}

/* 3c. worker engine bridge must export the same interface and re-declare nothing */
for (const sym of ["export const E", "export const SITE", "export function engineStamp"]) {
  assertContains("overrides/engine.ts", readFileSync(path.join(OVERRIDES, "engine.ts"), "utf8"), sym, `engine bridge symbol ${sym}`);
}

/* ---------- 4. bake the fail-closed report catalog (same logic as ../src/reports.ts) ---------- */
function decodeEntitiesLocal(s) {
  return htmlToText(`<x>${s}</x>`); // titles only; htmlToText already decodes entities
}
function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntitiesLocal(m[1]).trim() : fallback;
}

const items = [];
const RESEARCH = path.join(SITE_DIR, "research");
for (const f of readdirSync(RESEARCH).sort()) {
  if (!f.endsWith(".html")) continue;
  const full = path.join(RESEARCH, f);
  if (!statSync(full).isFile()) continue;
  const stem = f.replace(/\.html$/, "");
  const id = stem === "index" ? "research-index" : stem;
  const head = readFileSync(full, "utf8").slice(0, 4096);
  items.push({ id, title: titleOf(head, stem), kind: "annex-doc", source_url: SITE.annex + f, path: `research/${f}`, section: null });
}
const index = readFileSync(path.join(SITE_DIR, "index.html"), "utf8");
items.push({ id: "front-page", title: titleOf(index, "Frontier Inference Margins"), kind: "front-page", source_url: SITE.calculator, path: "index.html", section: null });
const heads = [...index.matchAll(/<h3 id="s(\d+)">([\s\S]*?)<\/h3>/g)];
for (const h of heads) {
  const n = h[1];
  items.push({
    id: `report-s${n}`,
    title: htmlToText(h[2]).replace(/\s+/g, " ").trim(),
    kind: "report-section",
    source_url: `${SITE.calculator}#s${n}`,
    path: "index.html",
    section: n,
  });
}
if (items.filter((i) => i.kind === "annex-doc").length < 20) fail(`suspiciously few annex docs (${items.length}) — wrong site dir?`);
if (heads.length < 5) fail(`suspiciously few report sections (${heads.length}) — front page changed?`);

const catalogTs = `/* GENERATED by scripts/build.mjs from ../../site — DO NOT EDIT.
   Fail-closed id catalog for get_report: only these ids are servable; content is fetched
   from the live site at runtime by reports.ts. Regenerated on every build. */
export interface CatalogItem {
  id: string;
  title: string;
  kind: "annex-doc" | "report-section" | "front-page";
  source_url: string;
  path: string;          // path under the live site origin
  section: string | null; // h3 section number for report-sN, else null
}

export const CATALOG: CatalogItem[] = ${JSON.stringify(items, null, 2)};
`;
writeFileSync(path.join(GEN, "catalog.gen.ts"), catalogTs);

console.log(`copied ${SHARED_TOP.length + SHARED_TOOLS.length} shared sources verbatim, 3 worker-native overrides; parity gates green`);
console.log(`catalog: ${items.length} entries (${items.filter((i) => i.kind === "annex-doc").length} annex docs, ${heads.length} report sections, 1 front page)`);
