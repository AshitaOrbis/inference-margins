/* list_scenario_space — discovery. Enum source for every other tool, so invalid-enum errors
   are self-correcting. Flags carry the honest-labeling bits: unsourced_scratch only on `custom`,
   tariff_scenario on terra/luna/gemflash, speculative_sizes from m.spec. */
import { E } from "../engine.js";
import { envelope, registryReceipt, fuseUnit, flagshipCentralPct, flagshipCentralFleetRenderable, type ToolResult, registryEmitMeta, flagshipBaselineFragment } from "../shape.js";
import { listReports } from "../reports.js";
import { datacenterSpace } from "../dcmap/space.js";

export const name = "list_scenario_space";
/* One accessor so the policy name is read from the registry rather than restated here. */
function receiptPlanningPolicy(): string {
  const receipt: any = E.registryPlanningRentReceipt("h100", E.DEFAULTS);
  return receipt.planningPolicy ?? "low-committed";
}

export const config = {
  title: "List the scenario space",
  description:
    "Discovery tool for the Frontier Inference Margins registry: every model preset, perspective (lens / replay / range-exploration), traffic profile, margin bucket, override bound and report id the other tools accept, plus the exact metric definition. This registry listing computes no result. Lead-sentence contract: quote or closely paraphrase the response's leading sentence; a bare number without its welded status is a misquote.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
};

/* U5: additive only. The eight existing keys, their sentence and their receipt are unchanged; the
   `datacenters` block is a NINTH key carrying the dc-map substrate's accepted ids, its published
   schemas, its metric definitions and its compatibility versions — read from the same U3 discovery
   call the browser reads, never restated here. Discovery is the enum source for the seven
   datacenter tools exactly as it is for the original eight, so an invalid-id error stays
   self-correcting. It is what makes this handler async; every caller in this repo already awaits. */
export async function handler(): Promise<ToolResult> {
  const datacenters = await datacenterSpace();
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
  // Slice C (memo C-11): the named-fleet registry, enumerated so agents discover
  // valid run_scenario fleet ids AND their identity classes before selecting.
  const fleets = Object.entries((E as any).FLEETS as Record<string, any>).map(([id, f]) => ({
    id, name: f.name, class: f.class, models: f.models, representativeness: f.representativeness,
    is_default: id === (E as any).DEFAULT_FLEET_ID,
    counterfactual_bar: f.class === "counterfactual" ? "selectable, receipted, never a default" : null,
    attribution: f.attribution,
  }));
  /* im-arc T3 (plan §1 T3 / §4.3, owner answer d-20260822-4c26 2026-08-22):
     discovery exposes the registries and the ONE validator schema through engine
     functions; no MCP-local copy can drift from the builder. */
  const dc_registry = Object.entries(E.registryRows()).map(([id, row]: [string, any]) => ({
    id, row_class: E.registryRowClass(id), coverage: row.coverage ?? null,
    company: row.company, region_ref: row.regionRef ?? null,
  }));
  const company_models = Object.fromEntries(Object.entries(E.COMPANY_MODELS)
    .map(([company, ids]) => [company, { flagship: ids[0], models: [...ids] }]));
  /* im-arc T4 fold (2026-08-24) [F3]: the coverage ledger is keyed {company, preset} and stores
     EVIDENCE, not percentages — so discovery publishes the DERIVED partition from the one resolver,
     exactly what the page renders, rather than a transcription that could drift from it. */
  const coverage_ledgers = Object.fromEntries(models.map(({ id }) => {
    const row: any = E.coverageForPreset(id);
    if (!row) return [id, null];
    const snake = (keys: any) => keys ? {
      named_site: [...(keys.namedSite ?? [])], programme: [...(keys.programme ?? [])],
      count_backed: [...(keys.countBacked ?? [])], physical_inventory: [...(keys.physicalInventory ?? [])],
    } : null;
    /* ROUND 4 (2026-08-25), memo :28: the DERIVED partition and the EVIDENCE it was derived from
       travel together. `rendered` is the same one-resolver output the page shows; everything
       beside it is the stored key-level evidence a caller needs to check that output rather than
       take it on faith. Nothing here is recomputed locally — every field is the resolver's own. */
    return [id, {
      rendered: E.coverageSentenceParts(row),
      company: row.company ?? null,
      as_of: row.asOf ?? null,
      wording: row.wording ?? null,
      named_site_serving_evidence_pct: row.namedSiteServingEvidencePct ?? null,
      programme_type_evidence_pct: row.programmeTypeEvidencePct ?? null,
      generic_fill_pct: row.genericFillPct ?? null,
      sku_workload_count_backed_pct: row.skuWorkloadCountBackedPct ?? null,
      count_backed_is_additive: row.countBackedIsAdditive ?? false,
      physical_inventory_pct: row.physicalInventoryPct ?? null,
      physical_inventory_sentence: row.physicalInventorySentence ?? null,
      evidence_keys: snake(row.evidenceKeys),
      notes: [...(row.notes ?? [])],
      receipts: [...(row.receipts ?? [])],
    }];
  }).filter(([, row]) => row));
  /* im-arc T4 fold (2026-08-24), memo §7: the ONE closed schema, published so a caller reads the
     same enum lists the validator enforces and the page renders. Nothing here is an MCP-local copy:
     every list is the registry's own. */
  const dcSchema: any = (E as any).DC_SCHEMA ?? {};
  const evidence_schema = {
    basis: [...(dcSchema.BASIS ?? [])],
    observation_kind: [...(dcSchema.OBSERVATION_KINDS ?? [])],
    point_observation_kinds: [...(dcSchema.POINT_OBSERVATION_KINDS ?? [])],
    span_observation_kinds: [...(dcSchema.SPAN_OBSERVATION_KINDS ?? [])],
    facility_class: [...(dcSchema.FACILITY_CLASSES ?? [])],
    capex_scope: [...(dcSchema.CAPEX_SCOPES ?? [])],
    rate_class: [...(dcSchema.RATE_CLASSES ?? [])],
    allocation: [...(dcSchema.ALLOCATIONS ?? [])],
    capital_recovery: [...(E.SCENARIO_BOUNDS.capitalRecovery as string[])],
    pue_by_facility_class: structuredClone(dcSchema.PUE_CLASS_BANDS ?? {}),
    cluster_overhead_by_capex_scope: structuredClone(dcSchema.CLUSTER_OH_BY_CAPEX_SCOPE ?? {}),
    notes: [
      "`basis` says what kind of EVIDENCE stands behind a value; `observationKind` says what the three numbers MEAN. They are orthogonal and both are required on every triple.",
      "Only selected-span, tariff-derived-delivered and load-state-average-peak may carry different endpoints. A point, floor, ceiling, milestone or region-fill is a single value.",
      "A PUE class band is a scenario/default fallback. It is never written into a facility row: DATACENTERS[*].pue stays null until a facility receipt exists.",
      "`capexScope` describes the INPUT SCOPE of an observed capex, never the product form. An installed-system observation already contains its clustering overhead.",
    ],
  };
  /* The quote registry and the selection policy, so a caller can see WHICH observation the
     planning number is, address an alternate by class, and read why a row has no default. */
  const rentPolicy: any = (E as any).RENT_POLICY_VIEW ? (E as any).RENT_POLICY_VIEW() : null;
  const rent_quotes = Object.fromEntries(E.HW_ORDER.map((hwKey: string) => {
    const receipt = E.registryPlanningRentReceipt(hwKey, E.DEFAULTS);
    return [hwKey, {
      planning_default: receipt.unavailable
        ? { available: false, reason: receipt.reason,
            declared_replay: receipt.replay
              ? { usd_per_hr: receipt.replay.usdPerHr.mid, basis: receipt.replay.basis,
                  rate_class: receipt.replay.rateClass, declared_as: receipt.replay.declaredAs,
                  how_to_use: "state it explicitly as overrides.rentAbsLeg — there is no silent fallback" }
              : null }
        /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
           `basis` was published on every ALTERNATE quote below and on nothing the caller actually
           gets by default — which was survivable while every selected default was a disclosed or
           analyst-set rate, and stopped being survivable the day the owner adopted three
           PROVISIONAL rates as planning defaults. A consumer reading $4.50/hr off this surface has
           to be able to see that it is provisional, and until now it could not: the page disclosed
           it and the connector did not. `observation_kind` rides along for the same reason. */
        : { available: true, quote_id: receipt.quoteId, rate_class: receipt.rateClass,
            /* the QUOTE's evidence basis, not the receipt's procurement basis — they are different
               words for different things and only one of them tells a caller how good the number is */
            basis: (E.rentQuotesFor(hwKey).find((q: any) => q.quoteId === receipt.quoteId) || {}).basis ?? null,
            observation_kind: (E.rentQuotesFor(hwKey).find((q: any) => q.quoteId === receipt.quoteId) || {}).observationKind ?? null,
            usd_per_hr: structuredClone(receipt.usdPerHr), term: receipt.term, region: receipt.region,
            configuration: receipt.configuration, bundle_scope: receipt.bundleScope, as_of: receipt.asOf },
      quotes: E.rentQuotesFor(hwKey).map((quote: any) => ({
        quote_id: quote.quoteId, rate_class: quote.rateClass, is_default: quote.isDefault,
        usd_per_hr: structuredClone(quote.usdPerHr), term: quote.term, region: quote.region,
        configuration: quote.configuration, bundle_scope: quote.bundleScope,
        basis: quote.basis, observation_kind: quote.observationKind, as_of: quote.asOf,
        source_file: quote.sourceFile, source_needle: quote.sourceNeedle, note: quote.note ?? null,
      })),
      capex_scope: E.hardwareRow(hwKey)?.capexScope ?? null,
      cluster_overhead: E.clusterOverheadFor(hwKey, E.DEFAULTS),
      capex_provenance: E.capexProvenanceFor(hwKey),
    }];
  }));
  const planning_policy = {
    policy: receiptPlanningPolicy(),
    statement: "the low/committed planning observation for each hardware — a SELECTION POLICY, not one literal contract class",
    unavailable: E.HW_ORDER.filter((hwKey: string) =>
      E.registryPlanningRentReceipt(hwKey, E.DEFAULTS).unavailable),
  };
  const tco_default_bands = E.tcoDefaultBands();

  const sentence =
    `The scenario space of the Frontier Inference Margins calculator: ${models.length} model presets ` +
    `(1 user-defined scratch model, 3 tariff-only scenarios), ${perspectives.length} perspectives ` +
    `(${E.PERSPECTIVES.filter((p) => p.kind === "lens").length} scenario presets, ` +
    `${E.PERSPECTIVES.filter((p) => p.kind === "replay").length} replays of published operating points, ` +
    `${E.PERSPECTIVES.filter((p) => p.kind === "exploration").length} page-authored range-exploration routes), ` +
    `${traffic_profiles.length} provenance-labeled traffic profiles, 4 margin buckets and ` +
    `${reports.length} verbatim research documents. Calculator tools return policy-scenario outputs, not measured results; ` +
    // IM3 exit-gate fix 1/2/3 + R2 §1.4: the baseline fragment's noun, fused token and
    // weld all gate on the SAME central-eligibility decision the receipt uses.
    `${flagshipBaselineFragment()}.`;

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
      fleets,
      company_models,
      dc_registry,
      coverage_ledgers,
      evidence_schema,
      rent_quotes,
      planning_policy,
      tco_default_bands,
      regions: E.dcRegions(),
      sections_schema: E.fleetSectionsSchema(),
      band_schema: E.bandSchema(),
      defaults: { basic_perspective: "gptpro-r3" },
      metric_definition: { title: E.TIPS.margin.t, body: E.TIPS.margin.b, cited_ranges: E.TIPS.margin.s },
      datacenters,
    },
    registryEmitMeta("list_scenario_space", "scenario-space discovery"),
  );
}
