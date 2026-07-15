/* explore_range — a margin range → the page-authored counterfactual route(s) into it.
   NEVER returns an estimate: the flagship-scope number appears ONLY inside the IF-conditional
   string (council Q2 resolution); routes carry no numeric margin field. Range membership is
   computed at the flagship scope via the engine, never enforced. The empty 60–80% bucket is the
   central scenario's own anchor — a statement, never an error. */
import { z } from "zod";
import { E } from "../engine.js";
import {
  APPJS_MIRROR, boardChangedSummary, noRouteStatement,
} from "../labels.js";
import {
  envelope, failClosed, registryReceipt, fuseCounterfactual, fuseUnit, flagshipCentralPct,
  round, shareUrl, type ToolResult,
} from "../shape.js";

export const name = "explore_range";

const BUCKET_IDS = ["b60minus", "b6080", "b8090", "b90plus"] as const;

export const config = {
  title: "Explore a claimed margin range",
  description:
    "For a margin range you have heard claimed (bucket id or a number), returns the page-authored counterfactual route(s) that would land there at the flagship scope — what would have to be true, NOT an estimate and never the headline. The flagship-scope figure appears only inside each route's IF-conditional sentence. The 60–80% range deliberately has no route: the central scenario itself is that range's anchor. Lead-sentence contract: quote or closely paraphrase the response's leading sentence; a bare number without its welded status is a misquote.",
  inputSchema: {
    range: z.union([z.enum(BUCKET_IDS), z.number().finite()])
      .describe("Margin bucket id (b60minus | b6080 | b8090 | b90plus) or a margin percentage resolved to its computed bucket"),
    at_model: z.string().optional()
      .describe("Optionally recompute each route at another model preset (native traffic) — shows drift vs the authored flagship scope"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args { range: string | number; at_model?: string }

export function handler(args: Args): ToolResult {
  const bucket = typeof args.range === "number"
    ? E.bucketForMargin(args.range)
    : E.MARGIN_BUCKETS.find((b) => b.id === args.range) ?? null;
  if (!bucket) {
    return failClosed(`Unresolvable range "${args.range}". Valid bucket ids: ${E.MARGIN_BUCKETS.map((b) => b.id).join(", ")}, or pass a finite margin percentage.`);
  }
  let atModel = null as import("../engine-types.js").ModelPreset | null;
  if (args.at_model) {
    atModel = E.MODELS.find((x) => x.id === args.at_model) ?? null;
    if (!atModel) return failClosed(`Unknown at_model "${args.at_model}". Valid ids: ${E.MODELS.map((x) => x.id).join(", ")}.`);
  }

  const flagshipModel = E.MODELS.find((x) => x.id === E.FLAGSHIP_SCOPE.modelId)!;
  const ranked = E.rankExplorations();
  const total = ranked.length;
  const mine = ranked.filter((p) => (E.explorationComputedBucket(p) || { id: null }).id === bucket.id);

  const routes = mine.map((p) => {
    const fm = E.explorationFlagshipMargin(p);
    const changedSummary = boardChangedSummary(p);
    const flagshipState = E.applyPresetSettings(flagshipModel, p, E.FLAGSHIP_SCOPE.traffic);
    const flagshipTr = E.resolveTraffic(flagshipModel, p, E.FLAGSHIP_SCOPE.traffic);

    let at_model_drift: string | null = null;
    if (atModel) {
      const s2 = E.applyPresetSettings(atModel, p, { mode: "native" });
      const pct2 = E.workload(s2).margin * 100;
      const off = !(atModel.id === E.FLAGSHIP_SCOPE.modelId && s2.ioRatio === 15 && s2.cacheHit === 60);
      const inR2 = isFinite(pct2) && pct2 >= bucket.lo && pct2 < bucket.hi;
      at_model_drift =
        `Viewed at ${atModel.name} · ${s2.ioRatio}:1/${s2.cacheHit}%${off ? " — outside authored scope; range membership was defined at the flagship scope and is recomputed live here" : ""}:` +
        `${APPJS_MIRROR.landsAtPrefix}${round(pct2)}% — ${inR2 ? "inside" : "OUTSIDE"}${APPJS_MIRROR.authoredRangeSuffix}`;
    }

    return {
      id: p.id,
      subtitle: p.subtitle ?? p.name,
      rank: ranked.indexOf(p) + 1,
      rank_of: total,
      n_changed: E.changedFieldsFromCentral(p),
      order_basis: E.EXPLORATION_ORDER_BASIS,
      what_would_have_to_be_true: APPJS_MIRROR.whatWouldHaveToBeTrue + changedSummary + ".",
      conditional:
        `IF ${changedSummary} (vs the central scenario), the flagship scope (Claude Opus 4.x @ Reference 15:1/60%) ` +
        `would compute to ${fuseCounterfactual(fm)} — a page-authored reconstruction of one route to the ${bucket.label} range, ` +
        `not any claimant's model; not an estimate and never the headline.`,
      membership_note: `Range membership is computed at the flagship scope, never enforced (${APPJS_MIRROR.membershipComputed.replace(/\.$/, "")}).`,
      route_note: p.note,
      at_model_drift,
      load_in_calculator: {
        label: APPJS_MIRROR.loadIntoCalculator,
        tool: "run_scenario",
        args: { model: E.FLAGSHIP_SCOPE.modelId, perspective: p.id, traffic: { mode: "profile", profile_id: "reference" } },
      },
      share_url: shareUrl(flagshipState, flagshipModel.id, p.id, {
        mode: flagshipTr.mode, profileId: flagshipTr.profileId, ioRatio: flagshipTr.ioRatio, cacheHit: flagshipTr.cacheHit,
      }),
    };
  });

  const no_route_statement = mine.length ? null : noRouteStatement(bucket.id);
  const central_anchor = bucket.id === "b6080"
    ? APPJS_MIRROR.centralAnchorPrefix + round(flagshipCentralPct()) + APPJS_MIRROR.centralAnchorSuffix.replace(" below.", ".")
    : null;
  const nClaims = E.claimsForBucket(bucket.id).length;
  const claims_in_range_hint =
    `${nClaims} sourced claim record${nClaims === 1 ? "" : "s"} relate${nClaims === 1 ? "s" : ""} to this range — ` +
    `query_margin_claims({ bucket: "${bucket.id}" }) returns them with relations and provenance.`;

  const framing =
    APPJS_MIRROR.frontDoorQuestionPrefix + bucket.label + APPJS_MIRROR.frontDoorQuestionSuffix +
    " Routes are page-authored counterfactuals — reconstructions of what would have to be true; not an estimate, never the headline.";

  const sentence =
    framing + " " +
    (mine.length
      ? `${mine.length} page-authored route${mine.length === 1 ? "" : "s"} (ranked by ${E.EXPLORATION_ORDER_BASIS}): ` +
        routes.map((r) => `${r.subtitle} — ${r.conditional}`).join(" · ")
      : `${no_route_statement}${central_anchor ? " " + central_anchor : ""}`) +
    ` The calculator's central estimate at the flagship scope remains ${fuseUnit(flagshipCentralPct())}. ${claims_in_range_hint}`;

  return envelope(
    sentence,
    registryReceipt(`range-exploration: ${bucket.id} (${bucket.label}) — page-authored counterfactual routes, no derived estimate`),
    {
      bucket: { id: bucket.id, label: bucket.label },
      framing,
      routes,
      no_route_statement,
      central_anchor,
      claims_in_range_hint,
    },
  );
}
