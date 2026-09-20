/* im-arc T3 (plan §1 T3 / §4.1, owner answer d-20260822-4c26 2026-08-22):
   the narrow stateless rent tool. It delegates the standard envelope to run_scenario,
   but computes its provenance-rich delta from the same engine states. Override values
   are never logged. */
import { z } from "zod";
import { E } from "../engine.js";
import type { ModelPreset, Perspective, TrafficSel } from "../engine-types.js";
import { policyScenarioToolDescription } from "../labels.js";
import { failClosed, metricIdentityRider, toTrafficSel, type ToolResult } from "../shape.js";
import { handler as runScenario } from "./run_scenario.js";

export const name = "adjust_rental_rate";
export const config = {
  title: "Adjust a provider rental rate",
  description: policyScenarioToolDescription(
    "Applies a reader-stated absolute rental $/accelerator-hour to one provider model's effective fleet (generic except for the registry-evidenced public-rate stress perspective), then returns the standard honest envelope plus a provenance-rich what_changed delta. This is unit-serving economics, not a measured margin and not company gross margin."),
  inputSchema: {
    company: z.string().describe("Provider id from list_scenario_space.company_models"),
    model: z.string().optional().describe("Provider model preset; default is the company's flagship"),
    rent_usd_per_hr: z.number().optional().describe("Absolute rental $/accelerator-hour for every active fleet leg"),
    rent_usd_per_hr_by_hw: z.record(z.number()).optional().describe("Absolute rental $/accelerator-hour by registered accelerator donor key"),
    perspective: z.string().optional().describe("gptpro-r3 (default), fable-r3, stress-public-rate, or median"),
    /* im-arc T4 fold (2026-08-24), memo §2.1 [F6] and §2 [F5]. `capital_recovery` has ONE canonical
       default — off — identical to the basic UI, the advanced UI and the v7 codec, so a shared link
       and an MCP request reproduce the same arithmetic. `capex_scope` is REQUIRED whenever the
       caller states a capex of their own: an observed capex is meaningless without its input scope,
       and assuming bare card silently multiplies a finished-system figure by an overhead it already
       contains. */
    capital_recovery: z.enum(["off", "on"]).optional().describe("Economic capital-recovery basis (CRF). Default 'off' — identical in the UI, the codec and here; a display tier never changes it."),
    capex_scope: z.enum(["bare-card", "base-rack", "installed-system"]).optional().describe("REQUIRED when the caller states capex (overrides.capexAbsLeg or a section capex): the INPUT SCOPE of that observation. It selects the cluster overhead; it is never assumed."),
    cost_of_capital_pct: z.number().optional().describe("Cost of capital in percent, consumed ONLY when capital_recovery is 'on'. Analyst-set 6 / 8.5 / 13."),
    traffic: z.object({
      mode: z.enum(["native", "profile", "custom"]),
      profile_id: z.string().optional(), io_ratio: z.number().optional(), cache_hit: z.number().optional(),
    }).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args {
  capital_recovery?: "off" | "on";
  capex_scope?: "bare-card" | "base-rack" | "installed-system";
  cost_of_capital_pct?: number;
  company: string;
  model?: string;
  rent_usd_per_hr?: number;
  rent_usd_per_hr_by_hw?: Record<string, number>;
  perspective?: string;
  traffic?: { mode: "native" | "profile" | "custom"; profile_id?: string; io_ratio?: number; cache_hit?: number };
}

const PERSPECTIVES = Object.freeze(["gptpro-r3", "fable-r3", "stress-public-rate", "median"]);
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;
const dollars = (value: number): string => "$" + value.toFixed(value >= 10 ? 2 : 2);
type MetricEvaluator = (state: Record<string, any>) => number;

function selectedTraffic(args: Args): TrafficSel {
  const t = args.traffic;
  return toTrafficSel(!t ? undefined
    : t.mode === "profile" ? { mode: "profile", profile_id: t.profile_id! }
    : t.mode === "custom" ? { mode: "custom", io_ratio: t.io_ratio!, cache_hit: t.cache_hit! }
    : { mode: "native" });
}

function rentalVector(state: Record<string, any>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(E.blendWeights(state))) {
    const rent = E.lessorSpread(key, state).rentHr;
    if (Number.isFinite(rent)) out[key] = round6(rent);
  }
  return out;
}

interface RentReceipt { value: number; source: string }
function vectorText(vector: Record<string, RentReceipt>, key: "registeredRent" | "rentAbsLeg"): string {
  return Object.entries(vector).map(([donor, receipt]) =>
    `${key}{${donor}=${dollars(receipt.value)}/hr; source=${receipt.source}}`).join(", ");
}

/* im-t5 (2026-08-28): this tool projects `.impliedShare` and nothing else out of the spread
   record. Without this flag every spread evaluation also ran marginOnBasis on both bases —
   two structuredClones plus two full workload() evaluations — to fill two cost-per-Mtok
   fields that are then discarded. `shareOnly` skips exactly those two calls; the four fields
   this tool can see are computed by the same expressions on the same state. Measured on the
   production challenge: workload() evaluations 319 -> 115. */
/* Object.freeze, not just `as const`: `as const` is a TYPE-level assertion and emits no
   runtime protection. This object is module-scope and is passed by reference into an engine
   function that is also served to every visitor's browser, so a mutable shared literal is a
   cross-call channel however unlikely a writer is. A review of this candidate found the
   record calling it "frozen" when it was not; freezing it makes the record true. */
const SHARE_ONLY = Object.freeze({ shareOnly: true } as const);

function resultMetrics(state: Record<string, any>) {
  const workload = E.workload(state);
  const spread = E.blendedLessorSpread(state, undefined, SHARE_ONLY).impliedShare;
  return { margin: workload.margin * 100, cost: workload.costMix, spread: spread * 100 };
}

/* WHY THIS IS NOT `resultMetrics(state)[metric]`, which is what it used to be.

   This tool builds NINE uncertainty triples (three metrics x baseline/adjusted/delta), and each
   one walks every declared dial's corners. Reading one metric off a record that computes all
   three meant every corner of every triple paid for all three, so `blendedLessorSpread` — which
   only the `spread` triples need — ran on the margin and cost corners too.

   Measured on the deployed shape (company=anthropic, rent_usd_per_hr=2.0): 1,056 calls to
   `blendedLessorSpread` costing 2,303 ms of a 3,186 ms total, and 1,061 calls to `workload`.
   That is the cost that put the connector over Cloudflare's per-request limit and returned
   HTTP 503 / error 1102 on 2026-08-27 — not bundle size, which is ~10x under the ceiling.

   Each metric now computes only what it needs. The VALUES are unchanged: the same engine
   functions over the same states, just not the ones whose results were being discarded. The
   Worker/Node byte-for-byte parity test is the proof that stayed green.

   (2026-08-28: the uncached `metricValue` that used to sit here was left with no callers once the
   memo below took over, and a dead near-duplicate of live logic is how two copies drift apart —
   a review found exactly that shape in this repo before. It is deleted; the memo is now the only
   place these two engine functions are called for a metric.)

   ── 2026-08-28, the ONE authorised optimisation round (owner answer 12:47Z on
   q-im-t5-machine-envelope-2026-08-27). ────────────────────────────────────────────────────────
   The fix above stopped each corner computing metrics it did not need. It was not enough: the
   deployed Worker still returned Cloudflare 1102 on this tool. Measured on the shape the release
   gate actually challenges with (company=anthropic, rent=6.281173, perspective=gptpro-r3,
   capital_recovery=on, cost_of_capital_pct=8.5):

     workload()            709 calls over  104 DISTINCT states  -> 605 duplicates (85%)
     blendedLessorSpread()  352 calls over  102 DISTINCT states  -> 250 duplicates (71%)

   The duplication is structural, not accidental, and there are two sources of it:

     1. The margin and cost triples walk the SAME corners and both read the SAME workload record,
        one taking `.margin` and the other `.costMix`. Six walks, three states' worth of work.
     2. The baseline triple and the delta triple's `prior` evaluate the SAME state — delta is
        built on the unadjusted base and applies the override inside its own evaluator, so its
        first half is exactly what baseline already computed.

   Neither can be removed by reordering: the band machinery needs a scalar per corner and margin
   and cost do not share extrema, so one walk cannot yield both bands. What they DO share is the
   state. So the work is memoised on the state's CONTENT, per invocation.

   Why content and not object identity: `marginBand.evalAt` builds a fresh state for every corner,
   so identity keying would never hit — and the delta evaluator deliberately MUTATES its state
   between two calls, which identity keying would answer wrongly. Content keying is correct in
   both directions.

   Why this is affordable, measured rather than assumed: a state serialises to 878-1,496 bytes in
   0.003-0.006 ms, against 0.682 ms for workload() and 2.213 ms for blendedLessorSpread() — a
   ratio of roughly 227x and 369x. The cache holds ~200 numbers and their keys, a few hundred KB
   against the ~46 MB this call was moving.

   The cached value is the extracted NUMBER, never the engine's record: the record is not frozen,
   so handing the same object to two callers would let one mutate what the other reads. */
const stateKey = (state: Record<string, any>): string =>
  /* A COMPLETE key. Plain JSON.stringify maps NaN, Infinity, -Infinity and undefined all onto
     `null`, so two states differing only there would collide and one would silently answer for the
     other. That is the silent-collision class this repo has found repeatedly, so each is made
     distinguishable instead of trusted not to occur. */
  JSON.stringify(state, (_key, value) =>
    typeof value === "number" && !Number.isFinite(value) ? "\u00abnonfinite:" + String(value) + "\u00bb"
    : value === undefined ? "\u00abundefined\u00bb"
    : value);

/** A metricValue memoised for the lifetime of ONE handler call. Created per invocation on
    purpose: a module-level cache would outlive the request, and would answer from a previous
    release's engine after a hot reload. */
function memoisedMetricValue(): (metric: "margin" | "cost" | "spread", state: Record<string, any>) => number {
  const workloadPairs = new Map<string, { margin: number; costMix: number }>();
  const spreads = new Map<string, number>();
  return (metric, state) => {
    const key = stateKey(state);
    if (metric === "spread") {
      let value = spreads.get(key);
      if (value === undefined) { value = E.blendedLessorSpread(state, undefined, SHARE_ONLY).impliedShare * 100; spreads.set(key, value); }
      return value;
    }
    let pair = workloadPairs.get(key);
    if (pair === undefined) {
      const workload = E.workload(state);
      pair = { margin: workload.margin * 100, costMix: workload.costMix };
      workloadPairs.set(key, pair);
    }
    return metric === "margin" ? pair.margin : pair.costMix;
  };
}

/* The site presents one-dial-at-a-time corner bands rather than compounding every
   assumption into one misleadingly enormous box. The MCP receipt follows the same
   doctrine, and folds the coupled blend polytope into the selected span without ever
   treating its shares as independent dials. */
function uncertaintyTriple(model: ModelPreset, perspective: Perspective, traffic: TrafficSel,
  evaluator: MetricEvaluator, basis: string, base?: Record<string, any>) {
  const pointState = E.applyPresetSettings(model, perspective, traffic);
  if (base) Object.assign(pointState, structuredClone(base));
  const pointValue = evaluator(pointState);
  const ranges = pointState.dialRanges ?? {};
  const dials = E.dialsFromRanges(ranges);
  const mixRanges = E.mixRangesFromRanges(ranges);
  const declaredMixes = mixRanges ? Object.keys(mixRanges).length : 0;
  const perDial = E.marginBandsPerDial(model, perspective, traffic, dials,
    { base, cornerEval: evaluator });
  const mix = mixRanges ? E.mixBand(model, perspective, traffic, mixRanges,
    { base, cornerEval: evaluator }) : null;
  const evaluable = perDial.filter((band: Record<string, any>) => !band.refused
    && Number.isFinite(band.lo) && Number.isFinite(band.hi));
  if (mix && !mix.refused && Number.isFinite(mix.lo) && Number.isFinite(mix.hi)) evaluable.push(mix);
  const declared = dials.length + declaredMixes;
  const lows = [pointValue, ...evaluable.map((band: Record<string, any>) => band.lo)];
  const highs = [pointValue, ...evaluable.map((band: Record<string, any>) => band.hi)];
  const refused = [
    ...perDial.filter((band: Record<string, any>) => band.refused).map((band: Record<string, any>) => band.id),
    ...(mix && mix.refused ? ["coupled composition: " + mix.refused] : []),
  ];
  if (![pointValue, ...lows, ...highs].every(Number.isFinite))
    throw new TypeError("engine corner evaluation did not produce a finite rental-adjustment span");
  const method = declared
    ? `selected span from engine corner evaluation over ${dials.length} declared box dial(s)`
      + (declaredMixes ? ` and ${declaredMixes} coupled composition range(s)` : "")
      + "; each axis/polytope varies at the other middle assumptions"
      + (refused.length ? `; disclosed non-applicable/refused ranges: ${refused.join(" | ")}` : "")
    : "point because the selected perspective declares no range-valued dial or coupled composition range";
  return { low: round6(Math.min(...lows)), mid: round6(pointValue), high: round6(Math.max(...highs)),
    basis: `${basis}; ${method}`, label: declared ? "middle assumption" : "point" };
}

export function handler(args: Args): ToolResult {
  const models = E.COMPANY_MODELS[args.company];
  if (!models) return failClosed(`Unknown company "${args.company}". Valid ids: ${Object.keys(E.COMPANY_MODELS).join(", ")}.`);
  const modelId = args.model ?? models[0];
  if (!models.includes(modelId))
    return failClosed(`Model "${modelId}" does not belong to company "${args.company}". Valid model ids: ${models.join(", ")}.`);
  const perspectiveId = args.perspective ?? "gptpro-r3";
  if (!PERSPECTIVES.includes(perspectiveId))
    return failClosed(`Unknown perspective "${perspectiveId}" for adjust_rental_rate. Valid ids: ${PERSPECTIVES.join(", ")}.`);
  const hasAll = args.rent_usd_per_hr !== undefined;
  const hasMap = args.rent_usd_per_hr_by_hw !== undefined;
  if (hasAll === hasMap)
    return failClosed("Supply exactly one of rent_usd_per_hr or rent_usd_per_hr_by_hw.");
  const bounds = E.SCENARIO_BOUNDS.rentAbsAll as [number, number];
  if (hasAll && (typeof args.rent_usd_per_hr !== "number" || !Number.isFinite(args.rent_usd_per_hr)
      || args.rent_usd_per_hr < bounds[0] || args.rent_usd_per_hr > bounds[1]))
    return failClosed(`rent_usd_per_hr must be a finite number in [${bounds[0]}, ${bounds[1]}]; rejected, never clamped.`);
  if (hasMap) {
    const map = args.rent_usd_per_hr_by_hw!;
    if (!Object.keys(map).length) return failClosed("rent_usd_per_hr_by_hw must contain at least one registered accelerator key.");
    for (const [key, value] of Object.entries(map)) {
      if (!E.HW_ORDER.includes(key) || !Number.isFinite(value) || value < bounds[0] || value > bounds[1])
        return failClosed(`rent_usd_per_hr_by_hw.${key} must name a registered accelerator and be in [${bounds[0]}, ${bounds[1]}]; rejected, never clamped.`);
    }
  }

  /* im-arc T4 fold (2026-08-24): the scenario fields ride through to run_scenario, which owns the
     one validation path — this wrapper never re-implements it. */
  const overrides: Record<string, unknown> = hasAll
    ? { rentAbsAll: args.rent_usd_per_hr } : { rentAbsLeg: args.rent_usd_per_hr_by_hw };
  /* Let the existing tool validate traffic, pairings and codec identity first. */
  const standard = runScenario({ model: modelId, perspective: perspectiveId,
    traffic: args.traffic, overrides, capital_recovery: args.capital_recovery,
    cost_of_capital_pct: args.cost_of_capital_pct, _emitTool: "adjust_rental_rate" });
  if (standard.isError) return standard;

  const model = E.MODELS.find((row) => row.id === modelId) as ModelPreset;
  const perspective = E.PERSPECTIVES.find((row) => row.id === perspectiveId) as Perspective;
  /* THE T4 CAPITAL-RECOVERY SETTINGS TRAVEL WITH THE OVERRIDES (vetting round 2026-09-19, Astra
     pack C P0-1). They were forwarded to run_scenario above, which honours them, and then this
     handler rebuilt the baseline and adjusted states for `what_changed` and for all nine
     uncertainty triples WITHOUT them — so the same call published a headline computed with
     capital recovery ON beside lessor spreads computed with it OFF, and a receipt that said
     "state: off". Measured on anthropic / median at $2.40/hr with capital_recovery on and
     cost_of_capital_pct 13: the published baseline spread was 71.777629% against a true
     59.681948%, the adjusted 52.085470% against 31.550027%, and the change -19.692159pp
     against -28.131921pp. One configuration, built once, is used for every derived state
     below; run_scenario keeps its own canonical handling of the same two arguments. */
  const t4Overrides: Record<string, unknown> = {};
  if (args.capital_recovery) t4Overrides.capitalRecovery = args.capital_recovery;
  if (args.cost_of_capital_pct != null) t4Overrides.costOfCapitalPct = args.cost_of_capital_pct;
  Object.assign(overrides, structuredClone(t4Overrides));
  const base = E.applyPresetSettings(model, perspective, selectedTraffic(args));
  Object.assign(base, structuredClone(t4Overrides));
  /* A second preset application preserves the engine's WeakMap scenario context;
     structuredClone would silently drop the model/traffic identity. */
  const adjusted = E.applyPresetSettings(model, perspective, selectedTraffic(args));
  Object.assign(adjusted, structuredClone(overrides));
  const fromVector = rentalVector(base), toVector = rentalVector(adjusted);
  const receiptKeys = hasAll ? Object.keys(fromVector) : Object.keys(args.rent_usd_per_hr_by_hw!).sort();
  const fromReceipts = Object.fromEntries(receiptKeys.map((key) => {
    const receipt = E.registryPlanningRentReceipt(key, base);
    return [key, { value: round6(fromVector[key] ?? receipt.value), source: receipt.source }];
  })) as Record<string, RentReceipt>;
  const toReceipts = Object.fromEntries(receiptKeys.map((key) => [key,
    { value: round6(toVector[key] ?? args.rent_usd_per_hr_by_hw![key]), source: "reader-stated" }]
  )) as Record<string, RentReceipt>;
  const basisKey = E.procurementBasisFor(perspective, model) ?? "committed-planning-rent";
  const fleetLabel = perspective.id === "stress-public-rate"
    ? `registry-evidenced provider fleet plus generic remainder (${modelId})`
    : `generic provider fleet (${modelId})`;
  const affectedBasis = `${basisKey} → reader-set absolute rent on the modeled ${fleetLabel}`;
  const warning = "policy scenario, not a measured margin and not a company gross margin";
  const modeLabel = perspective.id === "gptpro-r3" ? "GPT Pro mode" : perspective.name;
  const baselineBasis = `registered ${basisKey} planning vector`;
  const adjustedBasis = `policy-scenario rental override on ${basisKey}`;
  const deltaBasis = `difference: policy-scenario rental override minus registered ${basisKey} planning vector`;
  /* One cache for all nine triples of THIS call — see memoisedMetricValue above. It is created
     here and dropped when the handler returns, so nothing survives the request. */
  const metric_ = memoisedMetricValue();
  /* Every phase starts from the SAME economic configuration — the caller's capital-recovery
     settings — so the only thing that separates baseline from adjusted is the rent override
     itself. Before the 2026-09-19 fold the baseline and delta phases passed no base at all,
     which silently evaluated them with capital recovery OFF while the adjusted phase and the
     published headline had it ON: a delta between two different economies. */
  const t4Base = Object.keys(t4Overrides).length ? t4Overrides : undefined;
  const triple = (metric: "margin" | "cost" | "spread", phase: "baseline" | "adjusted" | "delta") => {
    if (phase === "baseline") return uncertaintyTriple(model, perspective, selectedTraffic(args),
      (state) => metric_(metric, state), baselineBasis, t4Base);
    if (phase === "adjusted") return uncertaintyTriple(model, perspective, selectedTraffic(args),
      (state) => metric_(metric, state), adjustedBasis, overrides);
    return uncertaintyTriple(model, perspective, selectedTraffic(args), (state) => {
      const prior = metric_(metric, state);
      Object.assign(state, structuredClone(overrides));
      return metric_(metric, state) - prior;
    }, deltaBasis, t4Base);
  };
  let bands;
  try {
    bands = {
      margin: { baseline: triple("margin", "baseline"), adjusted: triple("margin", "adjusted"),
        delta: triple("margin", "delta") },
      cost: { baseline: triple("cost", "baseline"), adjusted: triple("cost", "adjusted"),
        delta: triple("cost", "delta") },
      spread: { baseline: triple("spread", "baseline"), adjusted: triple("spread", "adjusted"),
        delta: triple("spread", "delta") },
    };
  } catch (error) {
    return failClosed(`Rental-adjustment uncertainty evaluation refused: ${error instanceof Error ? error.message : String(error)}.`);
  }
  const marginDelta = bands.margin.delta.mid;
  const sentence = `Under ${modeLabel} on ${model.name}, the old assumption was ${vectorText(fromReceipts, "registeredRent")}; `
    + `the new assumption is ${vectorText(toReceipts, "rentAbsLeg")}. Delta: unit serving margin `
    + `${marginDelta >= 0 ? "+" : ""}${round6(marginDelta)} percentage points (selected-span range ${bands.margin.delta.low} to ${bands.margin.delta.high}), `
    + `from ${bands.margin.baseline.mid}% to ${bands.margin.adjusted.mid}%; affected basis: ${affectedBasis}. This is a ${warning}.`;

  standard.structuredContent.what_changed = {
    variable: "rental $/accelerator-hour",
    scope: { company: args.company, model: modelId, perspective: perspectiveId,
      fleet: fleetLabel, affected_basis: affectedBasis },
    from: { by_hw: fromReceipts,
      source: `per-donor registered planning sources from engine-data-v22.js, with ${perspective.name} multipliers reflected in each value`,
      basis_label: basisKey },
    to: { by_hw: toReceipts, kind: "policy-scenario override" },
    outputs: {
      margin_pct: { baseline: bands.margin.baseline, adjusted: bands.margin.adjusted,
        delta_pp: bands.margin.delta },
      cost_per_mtok: { baseline: bands.cost.baseline, adjusted: bands.cost.adjusted,
        delta: bands.cost.delta },
      lessor_spread_implied: { baseline: bands.spread.baseline, adjusted: bands.spread.adjusted,
        delta_pp: bands.spread.delta },
    },
    /* im-arc T4 fold (2026-08-24), memo §7: a receipt that names only the reader's own move is
       incomplete when the REGISTRY under it moved too. These name the registry arithmetic this
       request rests on — the selected quote per donor, the rows with no admissible public planning
       rate, and the scope-derived cluster overhead — so a caller can see what changed beneath its
       override as well as what it changed itself. */
    registry_arithmetic: {
      migration: "im-arc T4 fold (2026-08-24) — tests/fixtures-t4-declared-delta.json enumerates every moved sink",
      planning_policy: (E.registryPlanningRentReceipt("h100", base) as any).planningPolicy ?? "low-committed",
      selected_quotes: Object.fromEntries(receiptKeys.map((key) => {
        const receipt: any = E.registryPlanningRentReceipt(key, base);
        return [key, receipt.unavailable
          ? { available: false, reason: receipt.reason,
              declared_replay: receipt.replay ? receipt.replay.usdPerHr.mid : null }
          : { available: true, quote_id: receipt.quoteId, rate_class: receipt.rateClass,
              usd_per_hr: structuredClone(receipt.usdPerHr), as_of: receipt.asOf }];
      })),
      unavailable_planning_rates: receiptKeys.filter((key) =>
        (E.registryPlanningRentReceipt(key, base) as any).unavailable),
      cluster_overhead_by_donor: Object.fromEntries(receiptKeys.map((key) =>
        [key, { capex_scope: E.hardwareRow(key)?.capexScope ?? null,
                cluster_overhead: E.clusterOverheadFor(key, base) }])),
      capital_recovery: { state: base.capitalRecovery ?? "off",
        note: "canonical default off in the basic UI, the advanced UI, the codec and here" },
    },
    metric: metricIdentityRider(),
    uncertainty_basis: bands.margin.delta.basis,
    warning,
    sentence,
  };
  return standard;
}
