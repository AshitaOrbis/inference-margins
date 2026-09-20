/* im-arc T3 (plan §1 T3 / §4.2, owner answer d-20260822-4c26 2026-08-22):
   advanced by-value fleet composition. UI, engine and MCP all validate the exact
   site/custom-fleets.js section schema through E.validateFleetSections. */
import { z } from "zod";
import { E } from "../engine.js";
import type { ModelPreset, Perspective } from "../engine-types.js";
import { policyScenarioToolDescription } from "../labels.js";
import {
  centralForModel, changedFromCentralState, computationReceipt, envelope, failClosed,
  metricIdentityRider, mintCentralComparison, mintHeadlineResultClaim, publishedShare, round, shareUrl,
  type ToolResult,
} from "../shape.js";

export const name = "run_fleet_sections";
export const config = {
  title: "Run advanced fleet sections",
  description: policyScenarioToolDescription(
    "Runs a by-value data-center fleet using the calculator's one shared section validator, either from explicit sections or registry row ids plus generic fill. Returns section and blended low/mid/high bands, a modeled-fleet coverage ledger, the standard honest envelope, and a v7 share link."),
  inputSchema: {
    model: z.string().describe("Model preset id"),
    perspective: z.string().optional().describe("Perspective id; default gptpro-r3"),
    sections: z.array(z.record(z.unknown())).optional().describe("Explicit sections in list_scenario_space.sections_schema"),
    dc_rows: z.array(z.string()).optional().describe("Data-center/programme registry ids to compose"),
    fill: z.enum(["generic-us", "generic-cn"]).optional().describe("Required with dc_rows; supplies un-attributed modeled share"),
    overrides: z.record(z.unknown()).optional().describe("Optional state overrides validated by the same SCENARIO_BOUNDS as run_scenario"),
    /* im-arc T4 fold (2026-08-24), memo §2.1 [F6] and §2 [F5]. `capital_recovery` has ONE canonical
       default — off — identical to the basic UI, the advanced UI and the v7 codec, so a shared link
       and an MCP request reproduce the same arithmetic. `capex_scope` is REQUIRED whenever the
       caller states a capex of their own: an observed capex is meaningless without its input scope,
       and assuming bare card silently multiplies a finished-system figure by an overhead it already
       contains. */
    capital_recovery: z.enum(["off", "on"]).optional().describe("Economic capital-recovery basis (CRF). Default 'off' — identical in the UI, the codec and here; a display tier never changes it."),
    capex_scope: z.enum(["bare-card", "base-rack", "installed-system"]).optional().describe("REQUIRED when the caller states capex (overrides.capexAbsLeg or a section capex): the INPUT SCOPE of that observation. It selects the cluster overhead; it is never assumed."),
    cost_of_capital_pct: z.number().optional().describe("Cost of capital in percent, consumed ONLY when capital_recovery is 'on'. Analyst-set 6 / 8.5 / 13."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args {
  capital_recovery?: "off" | "on";
  capex_scope?: "bare-card" | "base-rack" | "installed-system";
  cost_of_capital_pct?: number;
  model: string;
  perspective?: string;
  sections?: Array<Record<string, unknown>>;
  dc_rows?: string[];
  fill?: "generic-us" | "generic-cn";
  overrides?: Record<string, unknown>;
}

const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;
/* im-arc T4 fold (2026-08-24), memo §4: a section every one of whose legs has NO admissible public
   planning rate has no cost band to report — and that is a fact about the evidence, not a
   malformed request. It is reported as an unpriced section with its reason, the same way an
   unpriced LEG is reported, instead of failing the whole call closed. Every other refusal still
   throws: a non-finite corner that is NOT explained by an unavailable rate is a real defect and
   must stay loud. */
function unpricedSection(state: Record<string, any>, section: Record<string, any>): string | null {
  const legs = (section.legs || []).filter((leg: any) => Number(leg.sharePct) > 0);
  if (!legs.length) return null;
  const reasons = legs.map((leg: any) => E.registryPlanningRentReceipt(leg.donorKey, state))
    .filter((receipt: any) => receipt.unavailable);
  if (reasons.length !== legs.length) return null;
  return "no admissible public planning rate is registered for "
    + legs.map((leg: any) => leg.donorKey).join(", ")
    + ", so this section has no cost band. Each has a declared provisional replay a caller may state explicitly; there is no silent fallback.";
}
function tripleFromBand(band: Record<string, any>, scale: number, at: string, unpricedReason?: string | null) {
  if ((band.refused || ![band.lo, band.mid, band.hi].every(Number.isFinite)) && unpricedReason)
    return { low: null, mid: null, high: null, basis: "unpriced", label: "no admissible public planning rate",
      unpriced: true, reason: unpricedReason };
  if (band.refused || ![band.lo, band.mid, band.hi].every(Number.isFinite))
    throw new Error(`${at} band refused: ${band.reason || "non-finite required evaluation"}`);
  return { low: round6(band.lo * scale), mid: round6(band.mid * scale), high: round6(band.hi * scale),
    basis: band.basis, label: band.midLabel || "middle assumption" };
}
function shareTriple(raw: unknown, normalizedMid: number, normalization?: Record<string, any> | null) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const value = raw as Record<string, unknown>;
    if ([value.lo, value.mid, value.hi].every(Number.isFinite))
      return { low: round6(value.lo as number), mid: round6(value.mid as number), high: round6(value.hi as number),
        basis: "declared section-share range evaluated on the coupled sum-to-100 polytope", label: "middle assumption" };
  }
  const point = round6(normalizedMid * 100);
  return { low: point, mid: point, high: point,
    basis: normalization?.basis ?? "point section share", label: "point" };
}
function oneSectionFleet(fleet: Record<string, any>, section: Record<string, any>) {
  return { id: fleet.id, name: fleet.name, epoch: fleet.epoch, clonedFrom: fleet.clonedFrom,
    sections: [{ ...structuredClone(section), sharePct: 100 }] };
}

export function handler(args: Args): ToolResult {
  const model = E.MODELS.find((row) => row.id === args.model) as ModelPreset | undefined;
  if (!model) return failClosed(`Unknown model "${args.model}". Valid ids: ${E.MODELS.map((row) => row.id).join(", ")}.`);
  const perspectiveId = E.normalizePerspId(args.perspective ?? "gptpro-r3");
  const perspective = E.PERSPECTIVES.find((row) => row.id === perspectiveId) as Perspective | undefined;
  if (!perspective) return failClosed(`Unknown perspective "${args.perspective}". Valid ids: ${E.PERSPECTIVES.map((row) => row.id).join(", ")}.`);
  if (E.pairingSeverity(model, perspective) === "hard")
    return failClosed(`Hard-incompatible model+perspective pairing (${model.id} + ${perspective.id}); run_fleet_sections refuses rather than relabel it.`);
  const hasSections = Array.isArray(args.sections);
  const hasRows = Array.isArray(args.dc_rows);
  if (hasSections === hasRows) return failClosed("Supply exactly one of sections or dc_rows.");
  if (hasRows && !args.fill) return failClosed("fill is required with dc_rows (generic-us or generic-cn).");
  if (hasSections && args.fill) return failClosed("fill is only valid with dc_rows; explicit sections already carry their whole composition.");
  if (args.overrides && Object.prototype.hasOwnProperty.call(args.overrides, "blend"))
    return failClosed("overrides.blend conflicts with explicit fleet sections; the section composition is the fleet authority.");

  const base = E.applyPresetSettings(model, perspective, { mode: "native" });
  const tr = E.resolveTraffic(model, perspective, { mode: "native" });
  /* im-arc T4 fold (2026-08-24), memo §2 [F5] and §2.1 [F6]: a caller-stated capex without its
     SCOPE is refused, never defaulted — a silent bare-card assumption is exactly the double count
     the fold closed. `capital_recovery` defaults to off here for the same reason it does in the UI
     and the codec: one canonical default, so the same request reproduces wherever it is rendered. */
  const t4Stated: Record<string, unknown> = {};
  {
    const bag = (args.overrides as Record<string, unknown>) ?? {};
    /* ROUND 4 (2026-08-25): a caller states capex through THREE doors, not one — the scenario
       override, a section's own tco.capexUsdByHw, and a leg's overrides.capexUsd. Rounds 1-3
       guarded only the first, so a section capex came in with no scope at all while supplying a
       scope was refused as unrelated. All three count as stated capex; a section or leg that
       carries its own scope satisfies the requirement locally and the shared validator enforces
       the pairing, so only a capex with NO scope anywhere reaches the refusal below. */
    const sectionsIn = (args.sections as Array<Record<string, any>> | undefined) ?? [];
    const sectionCapexNeedsScope = sectionsIn.some((section) => {
      const tco = (section?.tco ?? {}) as Record<string, any>;
      const sectionStates = tco.capexUsdByHw != null && Object.keys(tco.capexUsdByHw).length > 0;
      if (sectionStates && tco.capexScope == null && !args.capex_scope) return true;
      return ((section?.legs ?? []) as Array<Record<string, any>>).some((leg) => {
        const ov = (leg?.overrides ?? {}) as Record<string, any>;
        return ov.capexUsd != null && ov.capexScope == null && !args.capex_scope;
      });
    });
    const sectionStatesAnyCapex = sectionsIn.some((section) => {
      const tco = (section?.tco ?? {}) as Record<string, any>;
      if (tco.capexUsdByHw != null && Object.keys(tco.capexUsdByHw).length > 0) return true;
      return ((section?.legs ?? []) as Array<Record<string, any>>).some(
        (leg) => ((leg?.overrides ?? {}) as Record<string, any>).capexUsd != null);
    });
    const statedCapex = bag.capexAbsLeg !== undefined || sectionStatesAnyCapex;
    if (sectionCapexNeedsScope)
      return failClosed("capex_scope is REQUIRED when a section or leg states a capex: name the input "
        + "scope of that observation (bare-card, base-rack or installed-system), either on the section's "
        + "tco.capexScope / the leg's overrides.capexScope, or as the request-level capex_scope. "
        + "It selects the cluster overhead and is never assumed.");
    if (statedCapex && bag.capexAbsLeg !== undefined && !args.capex_scope)
      return failClosed("capex_scope is REQUIRED when you state capex: name the input scope of your "
        + "observation (bare-card, base-rack or installed-system). It selects the cluster overhead and is never assumed.");
    if (args.capex_scope && !statedCapex)
      return failClosed("capex_scope was supplied without a stated capex. It describes the scope of a "
        + "capex YOU state; every registry row already carries its own.");
    if (args.capital_recovery) t4Stated.capitalRecovery = args.capital_recovery;
    if (args.cost_of_capital_pct != null) t4Stated.costOfCapitalPct = args.cost_of_capital_pct;
    if (args.capex_scope === "installed-system") t4Stated.capexScopeMode = "legacy-global";
  }
  const sanitized = E.sanitizeScenarioDiff(Object.assign({}, args.overrides ?? {}, t4Stated), tr, base);
  if (sanitized.rejected.length)
    return failClosed(`Invalid overrides: ${sanitized.rejected.join("; ")}. Values are rejected, never clamped.`);
  Object.assign(base, structuredClone(sanitized.diff));

  let fleet: Record<string, any>;
  try {
    if (hasRows) {
      fleet = E.composeFleetFromDcRows(base, { modelId: model.id, dcRows: args.dc_rows!, fill: args.fill!,
        id: "cf:mcpfleet", name: `${model.name} MCP data-center fleet` });
    } else {
      const candidate = { id: "cf:mcpfleet", name: `${model.name} MCP section fleet`, epoch: E.DEFAULTS_EPOCH,
        clonedFrom: null, sections: structuredClone(args.sections) };
      const validated = E.validateFleetSections(candidate);
      if (!validated.ok) return failClosed(`sections failed the shared validator: ${validated.errors.join("; ")}`);
      fleet = validated.fleet!;
    }
  } catch (error) {
    return failClosed(`fleet composition failed: ${(error as Error).message}`);
  }

  try {
    const renderOpts = { customFleet: fleet };
    const resolved = E.resolveFleetSections(base, renderOpts);
    const blendedWorkload = E.workload(base, undefined, undefined, renderOpts);
    const compositionById = new Map((blendedWorkload.composition as Array<Record<string, any>>)
      .map((receipt) => [receipt.sectionId, receipt]));
    const sectionResults = resolved.map((entry: Record<string, any>) => {
      const sectionFleet = oneSectionFleet(fleet, entry.section);
      const sectionOpts = { customFleet: sectionFleet };
      const marginBand = E.sectionBand(base, sectionOpts);
      const costBand = E.sectionBand(base, sectionOpts, {
        cornerEval: (state, opts) => E.workload(state, undefined, undefined, opts).costMix,
      });
      const compositionReceipt = compositionById.get(entry.section.id) ?? {};
      const normalization = compositionReceipt.shareNormalization ?? null;
      return { id: entry.section.id, label: entry.section.label, dc_ref: entry.section.dcRef ?? null,
        basis: entry.section.basis, share: shareTriple(entry.section.sharePct, entry.share, normalization),
        fallback_receipts: compositionReceipt.fallbackReceipts ?? [],
        share_rounding: compositionReceipt.shareRounding ?? null,
        share_normalization: normalization ? {
          declaredSharePct: normalization.declaredSharePct,
          declaredTotalPct: normalization.declaredTotalPct,
          normalizedSharePct: normalization.normalizedSharePct,
        } : null,
        receipt_sentence: compositionReceipt.receiptSentence ?? null,
        unpriced_reason: unpricedSection(base, entry.section),
        cost_per_mtok: tripleFromBand(costBand, 1, `section ${entry.section.id} cost`,
          unpricedSection(base, entry.section)),
        margin: tripleFromBand(marginBand, 100, `section ${entry.section.id} margin`,
          unpricedSection(base, entry.section)) };
    });
    const blendedMarginBand = E.sectionBand(base, renderOpts);
    const blendedCostBand = E.sectionBand(base, renderOpts, {
      cornerEval: (state, opts) => E.workload(state, undefined, undefined, opts).costMix,
    });
    if (!Number.isFinite(blendedWorkload.margin)) return failClosed("composed fleet is infeasible; no numeric blended policy-scenario output exists.");
    const blended = {
      cost_per_mtok: tripleFromBand(blendedCostBand, 1, "blended cost"),
      margin: tripleFromBand(blendedMarginBand, 100, "blended margin"),
    };
    const coverage = E.coverageSentenceParts(E.coverageForFleetSections(fleet.sections, model.id));
    if (!coverage) return failClosed("coverage ledger could not render from the composed fleet.");
    /* The generic preset twin also rides the response through the same pure row
       renderer, so T4 can replace three-part company rows with preset-keyed
       four-part rows without touching this tool. */
    /* im-arc T4 fold (2026-08-24) [F3]: derived by the one resolver, never read off a stored row. */
    const presetCoverage = E.coverageSentenceParts(E.coverageForPreset(model.id) ?? {});
    const share = shareUrl(base, model.id, perspective.id,
      { mode: tr.mode, profileId: tr.profileId, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit },
      null, { fleet: fleet.id, totalCase: "custom" }, { customFleet: fleet });

    const central = centralForModel(model);
    const comparison = mintCentralComparison(model, central.state, central.pct, central.fleetRenderable);
    const changed = changedFromCentralState(central.state, base);
    changed.unshift(`fleet sections: ${fleet.sections.length} by-value section(s), ${coverage.sentence}`);
    const receipt = computationReceipt({ centralPct: central.pct,
      centralFleetRenderable: central.fleetRenderable,
      centralScope: `${model.name}'s own median perspective @ model-default native traffic`,
      thisPct: blendedWorkload.margin * 100,
      origin: "advanced by-value fleet sections policy scenario", changed, comparison });
    const warning = "policy scenario, not a measured margin and not a company gross margin";
    /* im-arc T3 FIX-3 (2026-08-23, item C2): a dc_rows caller can name a registry row
       that receives no donor allocation; the composer drops it, and until now the tool
       said nothing. The engine's ONE composition function records that drop and
       coverageForFleetSections surfaces it, so both the page and this tool speak from
       the same receipt. It rides the spoken Composition receipts sentence and a
       structured field — never the by-value section wire, which is caller authority. */
    const compositionReceipts = ((coverage.receipts ?? []) as Array<Record<string, any>>)
      .filter((receipt) => receipt.classification === "not-composed");
    const fallbackSentence = [
      ...sectionResults.filter((section) => section.fallback_receipts.length
        || section.share_rounding || section.share_normalization)
        .map((section) => section.receipt_sentence),
      ...compositionReceipts.map((receipt) => receipt.sentence as string),
    ].join(" · ");
    const sentence = `Policy-scenario output for ${model.name} under ${perspective.name}: `
      + `${fleet.sections.length} fleet section(s) blend to ${round(blendedWorkload.margin * 100)}% modeled unit direct-serving contribution margin `
      + `(bottom ${blended.margin.low}%, middle assumption ${blended.margin.mid}%, top ${blended.margin.high}%) `
      + `at $${blended.cost_per_mtok.mid}/M tokens. Coverage of the MODELED blend: ${coverage.sentence}. `
      + (fallbackSentence ? `Composition receipts: ${fallbackSentence}. ` : "")
      + `This is a ${warning}.`;
    const policy = (blendedWorkload.fleetRenderable as Record<string, any>).policy;
    return envelope(sentence, receipt, {
      sections: sectionResults, blended, coverage_ledger: coverage,
      composition_receipts: compositionReceipts,
      preset_coverage_ledger: presetCoverage,
      uncertainty_basis: blendedMarginBand.basis,
      metric: metricIdentityRider(), warning, share_url: share,
      share_note: "The v7 token carries this custom fleet by value and re-validates it on decode.",
      rejected_overrides: sanitized.rejected, corrections: sanitized.corrections,
    }, {
      tool: "run_fleet_sections",
      claim: mintHeadlineResultClaim({ subject: `${model.id}+${perspective.id}@fleet-sections`,
        estimand: "modeled unit direct-serving contribution margin for by-value fleet sections",
        scope: { model: model.id, perspective: perspective.id, lens: perspective.id,
          policyPoint: policy && policy.residencyBasis === "placement-registry"
            ? "placement-registry" : (policy && policy.value != null ? policy.value : "none") },
        pct: blendedWorkload.margin * 100,
        evidence: { fleet: fleet.id, sections: fleet.sections.length, coverage: coverage.values } }),
      fleetRenderable: { renderableLegs: blendedWorkload.fleetRenderable.renderableLegs,
        totalLegs: blendedWorkload.fleetRenderable.totalLegs,
        renderableWeightShare: publishedShare(blendedWorkload.fleetRenderable.renderableWeightShare) },
      display: { displayed: round(blendedWorkload.margin * 100), canonical: blendedWorkload.margin * 100,
        precisionNote: "full low/mid/high section bands are carried in structuredContent.blended" },
    });
  } catch (error) {
    return failClosed(`run_fleet_sections failed closed: ${(error as Error).message}`);
  }
}
