/* query_margin_claims — filter the typed margin-claims registry (bins CLAIMS, not people).
   Bucket membership is COMPUTED via engine claimBucketRelations(); the server stores no bucket
   lists. Honest-labeling: floors never render as intervals (P0-2); company-GM / product-line /
   cohort / bundle / assumption figures never sit in the unit-serving group (P0-3); verbatim is
   byte-exact or null; provenance labels come verbatim from provenanceTierLabel(). Subject
   filtering matches who + subjectScope ONLY, never the quote text (Q4 — a quote that merely
   mentions xAI must not become an "xAI claim"). */
import { z } from "zod";
import { E } from "../engine.js";
import type { MarginClaim } from "../engine-types.js";
import {
  APPJS_MIRROR, BOARD_GROUP_META, BOARD_GROUP_ORDER, boardGroupFor,
} from "../labels.js";
import { envelope, registryReceipt, renderClaimBound, fuseUnit, flagshipCentralPct, failClosed, type ToolResult } from "../shape.js";

export const name = "query_margin_claims";

const BUCKET_IDS = ["b60minus", "b6080", "b8090", "b90plus"] as const;
const SCOPE_LAYERS = ["token-SKU", "api-product-line", "paid-user-cohort", "paid-plus-free-bundle", "company-GM", "segment", "analyst-assumption", "perimeter-undefined"] as const;
const RELATIONS = ["asserts", "locates-within", "conditional-transition", "unnamed-subject", "different-metric", "anchor", "compatible-with"] as const;

export const config = {
  title: "Query the margin-claims registry",
  description:
    "Filter the 34-record typed margin-claims registry by bucket, margin percentage, scope layer, subject, or relation (no filter = full registry). Returns CITED CLAIMS with byte-exact quotes, provenance-tier labels and scope segregation — never a derived estimate. Floors relate to ranges as compatible-with, never as intervals; company-GM and other non-unit perimeters render in their own groups, never among unit-serving claimants. Lead-sentence contract: quote or closely paraphrase the response's leading sentence; a bare number without its welded status is a misquote.",
  inputSchema: {
    bucket: z.enum(BUCKET_IDS).optional().describe("Margin bucket id (see list_scenario_space.margin_buckets)"),
    margin_pct: z.number().finite().optional().describe("A margin percentage — resolved to its computed bucket"),
    scope_layer: z.enum(SCOPE_LAYERS).optional().describe("Perimeter the figure describes"),
    subject: z.string().max(200).optional().describe("Matched against claimant + subject scope only — never against quote text"),
    relation: z.enum(RELATIONS).optional(),
    include_non_binnable: z.boolean().optional().describe("Also return records that can never be placed on a margin axis (telemetry, usage, architecture, non-findings) in their own array"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

function mapClaim(c: MarginClaim, relation: string | null) {
  const quote: Record<string, unknown> = {
    verbatim: c.verbatim ?? null,
    reported_figure: c.reportedFigure ?? null,
    quote_kind: c.verbatim ? "verbatim" : c.reportedFigure ? "reported-figure" : "none",
  };
  if (!c.verbatim && c.reportedFigure) quote.reported_note = APPJS_MIRROR.reportedFigurePrefix + c.reportedFigure;
  return {
    id: c.id,
    who: c.who,
    quote,
    source_url: c.url,
    date: c.date ?? null,
    bound: renderClaimBound(c),
    metric_scope: c.metricScope,
    scope_layer: c.scopeLayer,
    subject_scope: c.subjectScope,
    not_claimed: c.notClaimed,
    provenance: E.provenanceTierLabel(c),
    source_class: c.sourceClass,
    relation_to_query: relation,
  };
}

interface Args {
  bucket?: (typeof BUCKET_IDS)[number];
  margin_pct?: number;
  scope_layer?: (typeof SCOPE_LAYERS)[number];
  subject?: string;
  relation?: (typeof RELATIONS)[number];
  include_non_binnable?: boolean;
}

export function handler(args: Args): ToolResult {
  let bucketId: string | null = args.bucket ?? null;
  if (args.margin_pct !== undefined) {
    const b = E.bucketForMargin(args.margin_pct);
    if (!b) return failClosed(`margin_pct ${args.margin_pct} resolves to no bucket.`);
    if (bucketId && bucketId !== b.id) {
      return failClosed(`Contradictory query: bucket "${bucketId}" but margin_pct ${args.margin_pct} computes to bucket "${b.id}". Pass one or the other.`);
    }
    bucketId = b.id;
  }
  const bucket = bucketId ? E.MARGIN_BUCKETS.find((b) => b.id === bucketId)! : null;

  const subjectMatch = (c: MarginClaim) =>
    !args.subject || (c.who + " " + c.subjectScope).toLowerCase().includes(args.subject.toLowerCase());

  let scoped: Array<{ claim: MarginClaim; relation: string | null }> = bucketId
    ? E.claimsForBucket(bucketId).map(({ claim, relation }) => ({ claim, relation }))
    : E.MARGIN_CLAIMS.filter((c) => c.binnable).map((c) => ({ claim: c, relation: c.relation }));

  scoped = scoped.filter(({ claim, relation }) =>
    subjectMatch(claim) &&
    (!args.scope_layer || claim.scopeLayer === args.scope_layer) &&
    (!args.relation || relation === args.relation));

  // group by the mirrored BOARD_GROUP taxonomy — unit first, then the app's group order
  const byGroup = new Map<string, ReturnType<typeof mapClaim>[]>();
  for (const { claim, relation } of scoped) {
    const g = boardGroupFor(claim, relation ?? "");
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(mapClaim(claim, relation));
  }
  const groups = ["unit", ...BOARD_GROUP_ORDER]
    .filter((g) => byGroup.has(g))
    .map((g) => ({ group_id: g, group_title: BOARD_GROUP_META[g].title, claims: byGroup.get(g)! }));

  const unitCount = byGroup.get("unit")?.length ?? 0;
  const otherCount = scoped.length - unitCount;
  const empty_statement = bucketId && unitCount === 0 ? E.EMPTY_BUCKET_STATEMENT : null;

  const negativeSubject = args.subject && /google|gemini|xai|grok|moonshot|kimi/i.test(args.subject);
  const negative_findings = negativeSubject || (args.subject && scoped.length === 0)
    ? E.NEGATIVE_FINDINGS_STATEMENT : null;

  const nonBinnable = E.MARGIN_CLAIMS.filter((c) => !c.binnable && subjectMatch(c));
  const non_binnable_records = args.include_non_binnable
    ? nonBinnable.map((c) => ({
        id: c.id, who: c.who,
        quote: { verbatim: c.verbatim ?? null, reported_figure: c.reportedFigure ?? null, quote_kind: c.verbatim ? "verbatim" : c.reportedFigure ? "reported-figure" : "none" },
        source_url: c.url, date: c.date ?? null,
        subject_scope: c.subjectScope, not_claimed: c.notClaimed,
        provenance: E.provenanceTierLabel(c),
        source_class: c.sourceClass,
        reason_not_binnable: c.reason ?? null,
      }))
    : [];

  const filterDesc = [
    bucket ? `bucket ${bucket.label} (${bucket.id})` : null,
    args.margin_pct !== undefined ? `margin_pct ${args.margin_pct} (computed bucket)` : null,
    args.scope_layer ? `scope layer ${args.scope_layer}` : null,
    args.subject ? `subject ~ "${args.subject}" (matched on claimant + subject scope only, never quote text)` : null,
    args.relation ? `relation ${args.relation}` : null,
  ].filter(Boolean).join(", ") || "no filter (full registry)";

  const sentence =
    `Margin-claims registry query (${filterDesc}): ${scoped.length} of ${E.MARGIN_CLAIMS.filter((c) => c.binnable).length} binnable records match — ` +
    `${unitCount} unit-serving (token-SKU) claim record${unitCount === 1 ? "" : "s"} and ${otherCount} record${otherCount === 1 ? "" : "s"} in other perimeters ` +
    `(company-GM, API/product-line, paid-user-cohort, bundle, analyst-assumption, unnamed-subject, disclosure-anchor, model-generated) that are different objects, never claimants for the unit metric. ` +
    `Floors relate as compatible-with — never intervals. These are cited claims, not derived estimates; ` +
    `the calculator's central estimate at the flagship scope is ${fuseUnit(flagshipCentralPct())}.` +
    (empty_statement ? ` Unit-serving records for this range: ${empty_statement}.` : "") +
    (negative_findings ? ` Negative findings — ${negative_findings}` : "");

  return envelope(
    sentence,
    registryReceipt("claims-registry query — returns cited claims with relations and provenance, no derived estimate"),
    {
      groups,
      non_binnable_records,
      non_binnable_count: nonBinnable.length,
      empty_statement,
      negative_findings,
    },
  );
}
