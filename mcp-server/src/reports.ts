/* Research-annex catalog for get_report. Built at startup by globbing site/research/*.html and
   parsing site/index.html section headings; get_report reads ONLY paths in this catalog
   (fail-closed — no path traversal, no fuzzy matching: a wrong-doc fetch is a misattribution
   vector). Documents are served verbatim, never summarized. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { E, SITE } from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(__dirname, "../../site");
const RESEARCH_DIR = path.join(SITE_DIR, "research");

export interface ReportEntry {
  id: string;
  title: string;
  kind: "annex-doc" | "report-section" | "front-page" | "final-answer" | "analyst-hypothesis";
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
  /* b9 UX-B: the ten #report sections are now collapsed <details class="report-section"> wrappers,
     whose <summary> carries a UI-only expand/collapse label. That label is CHROME, not document
     text, so it must not enter the MCP transport — without this strip `front-page` alone gains ~420
     characters and all eleven ids move. The rule is CLASS-SCOPED and anchored to the wrapper's own
     open tag with the summary as its FIRST child, so the six provider-dossier summaries inside §10
     are safe BY CONSTRUCTION rather than by luck. It lives here, in htmlToText, and NOT at read()
     time: `format:"html"` is a verbatim fidelity path and stripping there would corrupt it. */
  s = s.replace(/(<details\b[^>]*\bclass\s*=\s*["'][^"']*\breport-section\b[^"']*["'][^>]*>\s*)<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "$1");
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
  /* R3 Row 1 (design memo D-9): the FINAL ANSWER — the ONE live, engine-derived
     catalog entry. Unlike every other entry (archived verbatim documents), its
     figures ARE derived estimates, rendered from engine finalAnswer()'s own token
     strings (one formatter — byte-identical to the site block), each carrying its
     policy-labeled identity inside the token. */
  map.set("final-answer", {
    id: "final-answer",
    title: "THE FINAL ANSWER — planning point + labeled spans (live, engine-derived; policy-labeled)",
    kind: "final-answer",
    source_url: SITE.calculator + "#final-answer",
    read: () => {
      const fa = (E as any).finalAnswer();
      /* b9 M6 (FA memo §8.4, §9): the D-6 five-part surface + the D-7 exec summary. The
         MCP twin renders the SAME minted tokens the site does, so all three transports
         emit byte-identical text. This ALSO closes the recorded `leverReferenceLine`
         parity gap by retiring that token: an MCP consumer previously received the FA
         figures without the statement that they were trend-0-pinned; now every reading
         token states its own basis inside itself. */
      /* T5 rec 5 (GPT Pro 2026-07-29 §6, SV-2). `mostPlausibleLine` is NOT in this list any
         more. The site moved that claim out of THE ANSWER into its own section; leaving it
         inside the report titled "THE FINAL ANSWER" would have left the connector contradicting
         the website and the annex — a third review caught exactly that, and it is the sharper
         version of the defect, because an MCP consumer cannot see the page to notice. The claim
         is preserved, in its own catalog entry below, which is what the rec's "preserve the
         source claim, but separate evidence ranking" asks for.
         ROUND 4: the decomposition, the justifications header and its entries move here too.
         Renaming the header was not enough — a release-gate review found that a consumer calling
         get_report({id:"final-answer"}) still received the above-80 hypothesis and its supporting
         claim, so the connector contradicted both the separate analyst-hypothesis entry and the
         annex. On the SITE these render inside the answer tile, deliberately (owner annotation
         nbc7fc1 put them in the collapsed expander, and #fa-basis-declaration governs "the
         explanations BELOW", so they travel with it). The connector has no collapse and no
         reading order: an entry titled THE FINAL ANSWER is simply the answer. So the two surfaces
         diverge HERE, on purpose, and this is the note that says so. */
      return [fa.tokens.identityLine, "Subject: " + fa.subject,
        fa.tokens.referenceReadingLine, fa.tokens.c2LabelLine, fa.tokens.mustNotBeCalledLine,
        fa.tokens.convergenceLine, fa.tokens.priorReadingLine,
        fa.tokens.planningPointLine, fa.tokens.bridgeLine,
        fa.tokens.bandLine, fa.tokens.lensSpanLine, fa.tokens.trafficSpanLine,
        fa.tokens.exclusionLine, fa.tokens.invitationLine, fa.tokens.basisDeclarationLine,
        fa.tokens.execSummaryFrameLine,
        ...fa.tokens.executiveSummaryRows].filter(Boolean).join("\n\n");
    },
  });
  /* T5 rec 5: the relocated claim, as its own entry. Same token, same bytes, separate id —
     evidence ranking, not one of the calculator's answers. */
  map.set("analyst-hypothesis", {
    id: "analyst-hypothesis",
    title: "STRONGEST EXTERNAL ANALYST HYPOTHESIS carried by this registry (adopted judgment, not a calculator output)",
    /* T5 rec 5, round 4b: this was `kind: "final-answer"`, and `get_report` keys its whole
       envelope off that tag — so the response said "adopted judgment, not a calculator output" in
       the title and "LIVE engine-derived result surface" in the sentence beside it. Both about
       the same entry, in the same reply. Seven review rounds missed it because each checked the
       TEXT of the final-answer entry and none checked the METADATA of this one.
       It needs its OWN kind: it is not the calculator's answer, and it is not an archived
       document either (it is rendered live from engine tokens), so neither existing branch could
       describe it honestly. */
    kind: "analyst-hypothesis",
    source_url: SITE.calculator + "#fa-analyst-hypothesis",
    read: () => {
      const fa = (E as any).finalAnswer();
      return [fa.tokens.mostPlausibleLine, fa.tokens.decompositionLine,
        fa.tokens.higherJustificationsHeader,
        ...fa.tokens.higherJustificationEntries].filter(Boolean).join("\n\n");
    },
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
