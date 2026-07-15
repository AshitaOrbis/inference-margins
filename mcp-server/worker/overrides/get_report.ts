/* get_report (Worker variant) — fetch a research-annex document or front-page report section
   VERBATIM (never summarized). Identical to ../src/tools/get_report.ts except that read() is
   async (document content comes from the LIVE site — the Worker has no filesystem) and a
   failed live fetch fails closed as a tool error. Reads only the baked build-time catalog
   (no path traversal); unknown ids fail closed with the valid-id list — no fuzzy matching,
   since a wrong-doc fetch is a misattribution vector. Load-bearing strings are parity-checked
   against ../src/tools/get_report.ts by scripts/build.mjs. */
import { z } from "zod";
import { envelope, failClosed, registryReceipt, type ToolResult } from "../shape.js";
import { ARCHIVE_NOTE, htmlToText, reportCatalog, validReportIds } from "../reports.js";

export const name = "get_report";

export const config = {
  title: "Get an archived research document",
  description:
    "Fetch a research-annex document (GPT-Pro provider dives, sweeps, reviews, methods notes), a front-page report section (report-s1 … report-s10), or the front page itself — verbatim, never summarized. Margin figures inside these documents are quoted prose from the archived sources, not derived estimates. Unknown ids fail closed and list the valid ids. Lead-sentence contract: quote or closely paraphrase the response's leading sentence.",
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
    return failClosed((err as Error).message);
  }
  const full = format === "html" ? raw : htmlToText(raw);
  const total = full.length;
  if (offset >= total && total > 0) {
    return failClosed(`Offset ${offset} is beyond the end of "${entry.id}" (${total} chars).`);
  }
  const slice = full.slice(offset, offset + maxChars);
  const truncated = offset + slice.length < total;

  const sentence =
    `"${entry.title}" (${entry.kind}, id ${entry.id}) — archived verbatim, characters ${offset}–${offset + slice.length} of ${total}` +
    (truncated ? ` (truncated; continue with offset ${offset + slice.length})` : "") +
    `. ${ARCHIVE_NOTE}`;

  return envelope(
    sentence,
    registryReceipt(`verbatim archive fetch: ${entry.id} — quoted material, no derived estimate`),
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
      archive_note: ARCHIVE_NOTE,
    },
  );
}
