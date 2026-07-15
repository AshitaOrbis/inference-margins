/* Research-annex catalog for get_report. Built at startup by globbing site/research/*.html and
   parsing site/index.html section headings; get_report reads ONLY paths in this catalog
   (fail-closed — no path traversal, no fuzzy matching: a wrong-doc fetch is a misattribution
   vector). Documents are served verbatim, never summarized. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(__dirname, "../../site");
const RESEARCH_DIR = path.join(SITE_DIR, "research");

export interface ReportEntry {
  id: string;
  title: string;
  kind: "annex-doc" | "report-section" | "front-page";
  source_url: string;
}

interface CatalogEntry extends ReportEntry {
  read(): string; // raw HTML of the document / section
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

export function htmlToText(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(td|th)[^>]*>/gi, " | ");
  s = s.replace(/<\/?(h[1-6]|p|div|section|article|li|ul|ol|table|tr|thead|tbody|blockquote|header|footer|details|summary|figure|figcaption|pre)[^>]*>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  s = s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function titleOf(html: string, fallback: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : fallback;
}

let catalog: Map<string, CatalogEntry> | null = null;

function buildCatalog(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();
  // 1) research annex docs
  for (const f of readdirSync(RESEARCH_DIR).sort()) {
    if (!f.endsWith(".html")) continue;
    const full = path.join(RESEARCH_DIR, f);
    if (!statSync(full).isFile()) continue;
    const stem = f.replace(/\.html$/, "");
    const id = stem === "index" ? "research-index" : stem;
    const head = readFileSync(full, "utf8").slice(0, 4096);
    map.set(id, {
      id,
      title: titleOf(head, stem),
      kind: "annex-doc",
      source_url: SITE.annex + f,
      read: () => readFileSync(full, "utf8"),
    });
  }
  // 2) front page + report sections s1..s10 from site/index.html
  const indexPath = path.join(SITE_DIR, "index.html");
  const index = readFileSync(indexPath, "utf8");
  map.set("front-page", {
    id: "front-page",
    title: titleOf(index, "Frontier Inference Margins"),
    kind: "front-page",
    source_url: SITE.calculator,
    read: () => readFileSync(indexPath, "utf8"),
  });
  const heads = [...index.matchAll(/<h3 id="s(\d+)">([\s\S]*?)<\/h3>/g)];
  for (let i = 0; i < heads.length; i++) {
    const n = heads[i][1];
    const start = heads[i].index!;
    const next = i + 1 < heads.length ? heads[i + 1].index! : index.indexOf("</section>", start);
    const end = next === -1 ? index.length : next;
    const sectionTitle = htmlToText(heads[i][2]).replace(/\s+/g, " ").trim();
    const snapshot = index.slice(start, end); // startup snapshot — offsets never applied to a changed file
    map.set(`report-s${n}`, {
      id: `report-s${n}`,
      title: sectionTitle,
      kind: "report-section",
      source_url: SITE.calculator + `#s${n}`,
      read: () => snapshot,
    });
  }
  return map;
}

export function reportCatalog(): Map<string, CatalogEntry> {
  if (!catalog) catalog = buildCatalog();
  return catalog;
}

export function listReports(): ReportEntry[] {
  return [...reportCatalog().values()].map(({ id, title, kind, source_url }) => ({ id, title, kind, source_url }));
}

export function validReportIds(): string[] {
  return [...reportCatalog().keys()];
}

export const ARCHIVE_NOTE =
  "Archived verbatim from the research annex — served as-is, never summarized. Any margin figures embedded in this document are quoted prose from the archived source, outside this server's honest-labeling envelope: they record what sources said, they are not derived estimates of this server.";
