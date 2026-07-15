/* list_scenario_space — discovery. Enum source for every other tool, so invalid-enum errors
   are self-correcting. Flags carry the honest-labeling bits: unsourced_scratch only on `custom`,
   tariff_scenario on terra/luna/gemflash, speculative_sizes from m.spec. */
import { E } from "../engine.js";
import { envelope, registryReceipt, fuseUnit, flagshipCentralPct, type ToolResult } from "../shape.js";
import { listReports } from "../reports.js";

export const name = "list_scenario_space";
export const config = {
  title: "List the scenario space",
  description:
    "Discovery tool for the Frontier Inference Margins registry: every model preset, perspective (lens / replay / range-exploration), traffic profile, margin bucket, override bound and report id the other tools accept, plus the exact metric definition. Returns no estimate. Lead-sentence contract: quote or closely paraphrase the response's leading sentence; a bare number without its welded status is a misquote.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
};

export function handler(): ToolResult {
  const models = E.MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    speculative_sizes: !!m.spec,
    tariff_scenario: !!m.scenario,
    unsourced_scratch: m.id === "custom",
    native_traffic: m.nativeTraffic,
    note: m.note,
  }));
  const perspectives = E.PERSPECTIVES.map((p) => ({ id: p.id, kind: p.kind, name: p.name, note: p.note }));
  const traffic_profiles = E.TRAFFIC_PROFILES.map((t) => ({
    id: t.id, name: t.name, io_ratio: t.ioRatio, cache_hit: t.cacheHit, provenance: t.provenance,
  }));
  const margin_buckets = E.MARGIN_BUCKETS.map((b) => ({
    id: b.id, label: b.label,
    lo: Number.isFinite(b.lo) ? b.lo : null,
    hi: Number.isFinite(b.hi) ? b.hi : null,
  }));
  const override_bounds: Record<string, { min: number; max: number } | { enum: string[] }> = {};
  for (const [k, b] of Object.entries(E.SCENARIO_BOUNDS)) {
    override_bounds[k] = typeof b[0] === "number"
      ? { min: b[0] as number, max: b[1] as number }
      : { enum: b as string[] };
  }
  const reports = listReports().map(({ id, title }) => ({ id, title }));

  const sentence =
    `The scenario space of the Frontier Inference Margins calculator: ${models.length} model presets ` +
    `(1 user-defined scratch model, 3 tariff-only scenarios), ${perspectives.length} perspectives ` +
    `(${E.PERSPECTIVES.filter((p) => p.kind === "lens").length} cost lenses, ` +
    `${E.PERSPECTIVES.filter((p) => p.kind === "replay").length} replays of published operating points, ` +
    `${E.PERSPECTIVES.filter((p) => p.kind === "exploration").length} page-authored range-exploration routes), ` +
    `${traffic_profiles.length} provenance-labeled traffic profiles, 4 margin buckets and ` +
    `${reports.length} verbatim research documents. run_scenario is the only tool that derives an estimate; ` +
    `the central estimate at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%) is ${fuseUnit(flagshipCentralPct())}.`;

  return envelope(
    sentence,
    registryReceipt("scenario-space discovery — enumerates the registry, computes no estimate"),
    {
      models,
      perspectives,
      traffic_profiles,
      margin_buckets,
      override_bounds,
      reports,
      metric_definition: { title: E.TIPS.margin.t, body: E.TIPS.margin.b, cited_ranges: E.TIPS.margin.s },
    },
  );
}
