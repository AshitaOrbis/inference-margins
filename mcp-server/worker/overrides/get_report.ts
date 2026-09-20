/* get_report (Worker variant) — fetch a research-annex document or front-page report section
   VERBATIM (never summarized). Identical to ../src/tools/get_report.ts except that read() is
   async (the Worker has no filesystem, so the document bytes are bundled at build time from
   the release this Worker was built from) and a missing archive entry fails closed as a tool
   error. Reads only the baked build-time catalog (no path traversal); unknown ids fail closed
   with the valid-id list — no fuzzy matching, since a wrong-doc fetch is a misattribution
   vector. Load-bearing strings are parity-checked against ../src/tools/get_report.ts by
   scripts/build.mjs.

   RELEASE RIDER (Pro review 2026-07-29 rec 6 / C-6; bq-1253): every archived answer now names
   the release it came from and the sha256 of the document it was sliced out of, because the
   thing that made the old live-fetch behaviour a provenance bug was not the staleness — it was
   that the response said "archived verbatim" without saying archived FROM WHAT. */
import { z } from "zod";
import { envelope, failClosed, registryReceipt, registryEmitMeta, type ToolResult } from "../shape.js";
import { ARCHIVE_NOTE, htmlToText, reportCatalog, validReportIds, RELEASE, type ReportEntry } from "../reports.js";

/* Names the release these archived bytes are from. Appended to the lead sentence of every
   ARCHIVED answer (the live final-answer entry gets FINAL_ANSWER_NOTE instead). */
const RELEASE_NOTE =
  `Release-bound archive: these bytes are the ones bundled into this server at release ${RELEASE.built_from}` +
  ` (site release-commit ${RELEASE.site_release_commit}, engine ${RELEASE.engine_revision}, data as of ${RELEASE.data_as_of}),` +
  ` not a live read of the current site — so this document and this server's computed results are always the same release.` +
  ` source_url points at the CURRENT live document, which may have moved on.`;

/* R3 D-9: the honest note for the ONE live entry (everything else stays archived-verbatim). */
/* ══ ROUND 4b P1 — the MACHINE half of rec 5. ═══════════════════════════════════════════════
   `registryEmitMeta` bakes this string into the emitted claim's estimand ("modeled unit
   direct-serving contribution margin (flagship baseline carried by a ${responseKind}
   response)"), and this tool passed "verbatim archive fetch" UNCONDITIONALLY. So the machine
   envelope told a consumer that the live calculator answer AND the adopted analyst judgment
   were both verbatim archive fetches — the same contradiction the leading sentence had, one
   layer down, on the layer an LLM consumer parses rather than reads.

   Every other registry tool passes its own true response kind; get_report is the only one with
   three and it named one. Derived from `entry.kind` here so the machine layer cannot drift from
   the sentence above.

   Written as a Record over the kind union ON PURPOSE: a SIXTH kind added to ReportEntry stops
   compiling until someone states what a response carrying it actually is. The round-4b defect
   was a new semantic entry silently inheriting an existing branch's wording; a total map turns
   that fall-through into a build error instead of a false claim. */
const RESPONSE_KIND: Record<ReportEntry["kind"], string> = {
  "annex-doc": "verbatim archive fetch",
  "front-page": "verbatim archive fetch",
  "report-section": "verbatim archive fetch",
  "final-answer": "live engine-derived result-surface",
  "analyst-hypothesis": "live adopted-analyst-judgment",
};
/* The three archived kinds keep the original string, so every archived entry's estimand is
   byte-unchanged and only the two live entries move — which is the whole of the defect. The two
   live phrasings are chosen to read correctly inside registryEmitMeta's own template,
   "...carried by a ${responseKind} response"; an estimand a consumer cannot parse as English is
   not an improvement on one that is false. */

const ANALYST_HYPOTHESIS_NOTE =
  "Adopted analyst judgment, live-rendered: these bytes come from this server's own engine tokens at call time, but what they carry is this registry's RANKING of external analyst claims — an adopted judgment about the evidence record, NOT a calculator output and not this page's estimate of any actual margin. The calculator's own answer is the separate 'final-answer' entry.";

const FINAL_ANSWER_NOTE =
  "Live engine-derived result surface: rendered at call time from this server's own engine (the same one formatter as the site block); every value is a policy-labeled scenario estimate carrying its identity inside the token, never an archived quotation.";

export const name = "get_report";

export const config = {
  title: "Get an archived research document, or a live registry entry",
  description:
    "Fetch a research-annex document (GPT-Pro provider dives, sweeps, reviews, methods notes), a front-page report section (report-s1 … report-s10), the front page itself — verbatim, never summarized — or one of the TWO live entries. Margin figures inside the ARCHIVED documents are quoted prose from their sources, not engine-derived results; the exceptions are id 'final-answer', whose figures ARE this engine's live policy-labeled scenario outputs, each carrying its identity inside the token, and id 'analyst-hypothesis', which is live-rendered from the same engine tokens but carries this registry's RANKING of external analyst claims — an adopted judgment, not a calculator output. Unknown ids fail closed and list the valid ids. Lead-sentence contract: quote or closely paraphrase the response's leading sentence.",
  inputSchema: {
    id: z.string().describe("Report id — see list_scenario_space.reports (annex stems, report-s1..report-s10, front-page, research-index)"),
    format: z.enum(["text", "html"]).optional().describe("Default 'text' (tag-stripped); 'html' returns the archived markup for fidelity"),
    offset: z.number().int().min(0).optional().describe("Character offset into the document (default 0)"),
    max_chars: z.number().int().min(200).max(200000).optional().describe("Maximum characters to return (default 24000)"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args { id: string; format?: "text" | "html"; offset?: number; max_chars?: number }

export async function handler(args: Args): Promise<ToolResult> {
  const entry = reportCatalog().get(args.id);
  if (!entry) {
    return failClosed(
      `Unknown report id "${args.id}" — no fuzzy matching (a wrong-doc fetch is a misattribution vector). ` +
      `Valid ids: ${validReportIds().join(", ")}.`,
    );
  }
  const format = args.format ?? "text";
  const offset = args.offset ?? 0;
  const maxChars = args.max_chars ?? 24000;
  let raw: string;
  try {
    raw = await entry.read();
  } catch (err) {
    /* SANITIZED (GPT Pro pr-20260902T173936Z-a81123, finding 2). This used to hand the caller
       `(err as Error).message` verbatim, and failClosed copies its argument into BOTH the text and
       the structured sentence — while the archive reader's own throws name internal paths and
       release identifiers. That is precisely the leak rec 13 was about, surviving in the one
       transport rec 13's wrapper does not cover. The public sentence is now fixed text; the
       diagnostic stays in the Worker log. */
    console.error("[inference-margins-worker/get_report] archive read failed", JSON.stringify({
      name: err instanceof Error ? err.name : "Error", id: entry.id,
    }));
    return failClosed("The archived document could not be read. Details are recorded server-side and are not returned.");
  }
  const full = format === "html" ? raw : htmlToText(raw);
  const total = full.length;
  if (offset >= total && total > 0) {
    return failClosed(`Offset ${offset} is beyond the end of "${entry.id}" (${total} chars).`);
  }
  const slice = full.slice(offset, offset + maxChars);
  const truncated = offset + slice.length < total;

  const sentence =
    (entry.kind === "final-answer"
      ? `"${entry.title}" (final-answer, id ${entry.id}) — LIVE engine-derived result surface (policy-labeled; NOT an archived document), characters ${offset}–${offset + slice.length} of ${total}`
      : entry.kind === "analyst-hypothesis"
      ? `"${entry.title}" (analyst-hypothesis, id ${entry.id}) — ADOPTED ANALYST JUDGMENT, live-rendered from engine tokens; this registry's RANKING of external claims, NOT a calculator output, characters ${offset}–${offset + slice.length} of ${total}`
      : `"${entry.title}" (${entry.kind}, id ${entry.id}) — archived verbatim, characters ${offset}–${offset + slice.length} of ${total}`) +
    (truncated ? ` (truncated; continue with offset ${offset + slice.length})` : "") +
    `. ${entry.kind === "final-answer" ? FINAL_ANSWER_NOTE
        : entry.kind === "analyst-hypothesis" ? ANALYST_HYPOTHESIS_NOTE
        : ARCHIVE_NOTE + " " + RELEASE_NOTE}`;

  return envelope(
    sentence,
    registryReceipt(entry.kind === "final-answer"
      ? `live final-answer render: ${entry.id} — engine-derived policy-labeled estimates (D-9 result surface)`
      : entry.kind === "analyst-hypothesis"
      ? `live analyst-hypothesis render: ${entry.id} — adopted ranking of external claims, not a calculator output`
      : `verbatim archive fetch: ${entry.id} — quoted material, no derived estimate`),
    {
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      format,
      content: slice,
      truncated,
      next_offset: truncated ? offset + slice.length : null,
      total_chars: total,
      source_url: entry.source_url,
      archive_note: entry.kind === "final-answer" ? FINAL_ANSWER_NOTE
        : entry.kind === "analyst-hypothesis" ? ANALYST_HYPOTHESIS_NOTE : ARCHIVE_NOTE,
      /* rec 6 / C-6: the provenance of the bytes above, machine-readable. document_sha256 is of
         the WHOLE archived document (report-sN entries are a slice of the front page), so a
         caller can pin what they read; it is null for the live final-answer render. */
      release: {
        built_from: RELEASE.built_from,
        site_release_commit: RELEASE.site_release_commit,
        engine_revision: RELEASE.engine_revision,
        data_as_of: RELEASE.data_as_of,
        document_sha256: entry.sha256,
        live_fetch: false,
      },
    },
    registryEmitMeta("get_report", RESPONSE_KIND[entry.kind]),
  );
}
