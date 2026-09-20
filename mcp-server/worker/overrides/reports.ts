/* Worker research-annex catalog for get_report — RELEASE-ARCHIVE variant of ../src/reports.ts.
   The fail-closed id catalog (ids/titles/kinds/source_urls) AND the document bytes themselves
   are baked at BUILD time from the local site/ tree (catalog.gen.ts + archive.gen.ts, generated
   by scripts/build.mjs with the same regexes as the Node reports.ts), since the Worker has no
   filesystem. get_report reads ONLY ids in this catalog (fail-closed — no path traversal, no
   fuzzy matching: a wrong-doc fetch is a misattribution vector). Documents are served verbatim,
   never summarized. htmlToText / decodeEntities / titleOf / ARCHIVE_NOTE are byte-identical
   copies of ../src/reports.ts (parity-checked by scripts/build.mjs — the build fails on drift).

   RELEASE-BOUND (Pro review 2026-07-29 rec 6 / finding C-6; re-found 2026-08-16 as bq-1253).
   Until 2026-08-21 this module fetched document content from https://margins.ashitaorbis.com/
   at call time, so a Worker built at one release served another release's prose under the words
   "archived verbatim" — measured live that day: the deployed Worker's own bundled engine
   reported v3.0.0-2026-08-13 while its get_report("front-page") returned bytes stamped
   release-commit faf6bec, three releases and five days later. The bytes now come from the
   release this Worker was BUILT from, each carrying its sha256, and RELEASE names that release
   so a caller can tell which one they are reading. This also retires finding S-5 (the runtime
   fetch had no timeout, no response-size cap and no content-type validation) by removing the
   fetch: there is no longer a network read on this path at all. */
import { E, SITE } from "./engine.js";
import { CATALOG, type CatalogItem } from "./catalog.gen.js";
import { ARCHIVE, RELEASE } from "./archive.gen.js";

export { RELEASE };

export interface ReportEntry {
  id: string;
  title: string;
  /* T5 rec 5, round 4b: "analyst-hypothesis" is a kind of its own — see the entry below and
     mcp-server/src/reports.ts for why neither existing branch could describe it honestly. */
  kind: "annex-doc" | "report-section" | "front-page" | "final-answer" | "analyst-hypothesis";
  source_url: string;
}

interface CatalogEntry extends ReportEntry {
  /* sha256 of the WHOLE archived document this entry is served from, as baked at build time.
     Present for archived entries; null for "final-answer", which is rendered live from this
     Worker's own engine and is therefore release-bound by construction, not by digest. */
  sha256: string | null;
  read(): Promise<string>; // raw markup of the document / section, from the bundled release archive
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

/* ---------- release archive read (no network; bytes are bundled, nothing is logged) ----------
   rec 6 / C-6: the document this returns is the one baked into THIS Worker at build time, so a
   get_report answer and a run_scenario answer from the same Worker are always the same release.
   Fails closed on an id whose bytes are missing — which scripts/build.mjs already makes
   unreachable by gating catalog/archive coupling at build time; this is the runtime backstop. */
function readArchived(path: string): string {
  const entry = ARCHIVE[path];
  if (entry === undefined) {
    throw new Error(`No archived copy of "${path}" is bundled in this Worker (release ${RELEASE.built_from}); nothing is substituted (fail closed).`);
  }
  return entry.text;
}

/* Same section-slicing logic as the Node reports.ts buildCatalog (h3 id="sN" → next h3 or
   </section>), applied to the BUNDLED front page of this Worker's release. */
function extractSection(index: string, n: string): string {
  const heads = [...index.matchAll(/<h3 id="s(\d+)">([\s\S]*?)<\/h3>/g)];
  const i = heads.findIndex((h) => h[1] === n);
  if (i === -1) {
    throw new Error(`Section s${n} is not in the front page bundled with this Worker (release ${RELEASE.built_from}); nothing is substituted (fail closed).`);
  }
  const start = heads[i].index!;
  const next = i + 1 < heads.length ? heads[i + 1].index! : index.indexOf("</section>", start);
  const end = next === -1 ? index.length : next;
  return index.slice(start, end);
}

function makeEntry(item: CatalogItem): CatalogEntry {
  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    source_url: item.source_url,
    sha256: ARCHIVE[item.path] ? ARCHIVE[item.path].sha256 : null,
    read: async () => {
      const raw = readArchived(item.path);
      return item.section === null ? raw : extractSection(raw, item.section);
    },
  };
}

let catalog: Map<string, CatalogEntry> | null = null;

export function reportCatalog(): Map<string, CatalogEntry> {
  if (!catalog) {
    catalog = new Map(CATALOG.map((item) => [item.id, makeEntry(item)]));
    /* R3 Row 1 (design memo D-9): the FINAL ANSWER — the ONE live, engine-derived
       entry, rendered from THIS Worker's own bundled engine finalAnswer() token
       strings (one formatter — byte-identical to the site block and the Node
       transport; never fetched, never archived). */
    catalog.set("final-answer", {
      id: "final-answer",
      title: "THE FINAL ANSWER — planning point + labeled spans (live, engine-derived; policy-labeled)",
      kind: "final-answer",
      source_url: SITE.calculator + "#final-answer",
      sha256: null, // live engine render, not an archived document — release-bound by construction
      read: async () => {
        const fa = (E as any).finalAnswer();
        // b9 M6: the worker twin renders the SAME token list as the Node transport (build-gated).
        /* T5 rec 5 (GPT Pro 2026-07-29 §6, SV-2). `mostPlausibleLine` is NOT in this list any
             more. The site moved that claim out of THE ANSWER into its own section; leaving it
             inside the report titled "THE FINAL ANSWER" would have left the connector contradicting
             the website and the annex — a third review caught exactly that, and it is the sharper
             version of the defect, because an MCP consumer cannot see the page to notice. The claim
             is preserved, in its own catalog entry below, which is what the rec's "preserve the
             source claim, but separate evidence ranking" asks for.
             Everything else keeps its place: on the site #fa-higher ("why not the higher numbers")
             is still inside the answer tile, so the decomposition, header and entries stay here too.
             The connector mirrors the page's hierarchy exactly rather than inventing its own. */
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
    /* T5 rec 5: the relocated claim, as its own entry — the Worker twin of the Node catalog. */
    catalog.set("analyst-hypothesis", {
      id: "analyst-hypothesis",
      title: "STRONGEST EXTERNAL ANALYST HYPOTHESIS carried by this registry (adopted judgment, not a calculator output)",
      /* T5 rec 5, round 4b — see mcp-server/src/reports.ts for the reason: the envelope is
         keyed off this tag, so "final-answer" here made get_report call an adopted analyst
         judgment a LIVE engine-derived result surface, in the same reply as a title saying
         it is not a calculator output. Mirrors the Node source exactly. */
      kind: "analyst-hypothesis",
      source_url: SITE.calculator + "#fa-analyst-hypothesis",
      sha256: null, // live engine render, not an archived document
      read: async () => {
        const fa = (E as any).finalAnswer();
        return [fa.tokens.mostPlausibleLine, fa.tokens.decompositionLine,
          fa.tokens.higherJustificationsHeader,
          ...fa.tokens.higherJustificationEntries].filter(Boolean).join("\n\n");
      },
    });
  }
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
