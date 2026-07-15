/* app.js-mirrored state-identity sentences + evidence-board taxonomy (DECISION 5).
   These symbols live only in site/app.js (not the engine), so v1 mirrors them here.
   EVERY string below is grep-parity-tested against site/app.js (test/contract.test.mjs):
   if the site's wording moves, the build fails rather than drifting silently.
   Hoisting them into engine.js is a deferred site follow-up — do not edit the live site here. */
import { E } from "./engine.js";
import type { MarginClaim, Perspective } from "./engine-types.js";

/* ---------- mirrored sentences (byte-identical substrings of site/app.js) ---------- */
export const APPJS_MIRROR = {
  heroUnitLabel: "Unit serving margin — not company GM",
  heroScenarioLabel: "Scenario result (tariff-only preset)",
  incompatiblePair: "INCOMPATIBLE PAIR — this perspective is scoped to a different provider; no headline is computed.",
  modifiedScenarioSuffix: "— not the published operating point; replay attribution removed.",
  modifiedExplorationPrefix: "MODIFIED RANGE EXPLORATION — derived from the page-authored route “",
  modifiedExplorationSuffix: "” but since edited; route identity and ranking metadata removed; not an estimate.",
  tariffScenario: "TARIFF SCENARIO — architecture unidentified; this borrows the selected serving assumptions and is NOT a provider estimate.",
  forcedExploratory: "⚠ EXPLORATORY (forced incompatible pairing) —",
  pairingNotePrefix: "⚠ pairing note: ",
  bandAbove95: "above the cited 90–95% unit-serving claim interval (≥90% bucket); this value is calculator-generated",
  band90to95: "within the cited 90–95% unit-serving claim range; this value is calculator-generated",
  band80: "within the cited >80% unit-serving claim range; this value is calculator-generated",
  band50: "between the cited bull and reported-margin ranges; calculator-generated",
  bandLow: "at or below the cited reported-margin range; calculator-generated",
  rangeExplorationPrefix: "RANGE EXPLORATION — page-authored counterfactual; not an estimate. A page-authored reconstruction of one route to the ",
  rangeExplorationSuffix: " range (authored at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%), not any claimant's model.",
  viewedOffScopePrefix: " VIEWED OFF AUTHORED SCOPE — currently ",
  viewedOffScopeSuffix: "; range membership was defined at the flagship scope and is recomputed live here.",
  landsAtPrefix: " At the current selection it lands at ≈",
  authoredRangeSuffix: " the range it was authored for.",
  noRouteB6080: "No page-authored route is offered for this range: the central scenario itself (§5) lands here and is this range's own anchor — no route needs constructing.",
  noRouteGeneric: "No page-authored route is offered for this range — the registry carries no popular-discourse position that points here.",
  frontDoorQuestionPrefix: "What would have to be true for a ",
  frontDoorQuestionSuffix: " modeled unit serving margin (at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%)?",
  centralAnchorPrefix: "At the flagship scope the central scenario computes to ≈",
  centralAnchorSuffix: "% — it is the default state of the calculator below.",
  membershipComputed: "membership computed, never enforced.",
  whatWouldHaveToBeTrue: "What would have to be true (vs the central scenario): ",
  loadIntoCalculator: "Load into calculator ↓ — an explicit counterfactual, never the estimate",
  pageAuthoredBadge: "PAGE-AUTHORED RECONSTRUCTION",
  routeNoteSummary: "route note — a reconstruction of a route to the claimed range, not any claimant's model",
  floorBadge: "floor — compatible with this range and every higher one",
  reportedFigurePrefix: "Reported figure (no archived quote in this page's cited corpus — §7): ",
  lensSpanAtPrefix: "cost-lens span at ",
  lensSpanTail: "(traffic held fixed; excludes traffic-mix uncertainty; analysts, replays and out-of-scope lenses excluded)",
  lensSpanSinglePrefix: "only one cost lens is compatible at this scope (",
  lensSpanSingleSuffix: ") — see the valuation replays for the invoice question",
  shareLinkWarning: "It freezes the full numeric state plus schema, engine revision and data-as-of date - and it CONTAINS any private rates or discounts you typed in; review before sharing.",
  provenancePrefix: "Provenance: ",
  scopePrefix: "Scope: ",
  didNotClaimPrefix: "Did not claim: ",
} as const;

/* ---------- evidence-board group taxonomy (mirrors app.js BOARD_GROUP_META et al.) ---------- */
export const BOARD_GROUP_META: Record<string, { cls: string; title: string }> = {
  unit:    { cls: "g-unit",    title: "Unit-serving (token-SKU) claim records compatible with this range — relation badged per record (this calculator's metric)" },
  api:     { cls: "g-api",     title: "API / product-line margins — a product-line perimeter, not the single-token unit metric" },
  cohort:  { cls: "g-cohort",  title: "Paid-user-cohort compute margins — a paying-user perimeter, not the unit metric and not company GM" },
  bundle:  { cls: "g-bundle",  title: "Paid+free bundle margins — all products including free users; not the unit metric" },
  segment: { cls: "g-segment", title: "Segment-split figures — company-GM and API-GM reported side by side; not claimants for the unit metric" },
  assumption: { cls: "g-assume", title: "Analyst modeling assumptions — inputs to models, not measured or disclosed figures" },
  unnamed: { cls: "g-unnamed", title: "Unnamed-subject claim — names no lab" },
  anchor:  { cls: "g-anchor",  title: "Disclosure anchor — a provider's own serving, not a claim about any other lab" },
  diff:    { cls: "g-diff",    title: "Company-GM / reported accounting figures (§7) — different objects; not claimants for the unit metric" },
  model:   { cls: "g-model",   title: "Model-generated scenario analysis — zero claimant weight" },
};
export const BOARD_GROUP_ORDER = ["api", "cohort", "bundle", "segment", "assumption", "unnamed", "anchor", "diff", "model"];
export const BOARD_REL_LABEL: Record<string, string> = { "asserts": "asserts", "locates-within": "locates within", "conditional-transition": "conditional transition", "unnamed-subject": "unnamed subject", "different-metric": "different metric", "anchor": "disclosure anchor" };
export const BOARD_BOUND_LABEL: Record<string, string> = { point: "point", interval: "interval", floor: "floor", ceiling: "ceiling", "conditional-range": "conditional range" };
export const BOARD_SRC_LABEL: Record<string, string> = { "primary-post": "primary post", "quoted-secondary": "quoted-secondary", reporting: "reporting", "model-generated": "model-generated", "disclosure-anchor": "provider disclosure", "sweep-non-finding": "sweep non-finding" };
export const BOARD_FIELD_LABEL: Record<string, string> = { hwMode: "cost basis", rentMult: "GPU-hour multiplier", util: "fleet utilization", stackMult: "serving-stack efficiency", interact: "interactivity", batchShare: "batch-API share", discount: "average discount", blend: "hardware blend" };

/* Logic fragments of the mirrored app.js functions, grep-parity-tested so the routing below
   cannot silently diverge from the site's boardGroupFor / boardFieldVal. */
export const MIRRORED_LOGIC_FRAGMENTS = [
  'if (claim.sourceClass === "model-generated") return "model";',
  'if (relation === "unnamed-subject") return "unnamed";',
  'if (relation === "anchor") return "anchor";',
  'case "api-product-line": return "api";',
  'case "paid-user-cohort": return "cohort";',
  'case "paid-plus-free-bundle": return "bundle";',
  'case "segment": return "segment";',
  'case "analyst-assumption": return "assumption";',
  'case "company-GM": return "diff";',
  'if (relation === "different-metric") return "diff";',
  'if (k === "hwMode") return v === "tco" ? "Owned TCO" : "Rental $/hr";',
  'if (k === "interact") return v === "batch" ? "Throughput" : v === "fast" ? "Low-latency" : "Balanced";',
];

/* Mirror of app.js boardGroupFor(claim, relation). */
export function boardGroupFor(claim: MarginClaim, relation: string): string {
  if (claim.sourceClass === "model-generated") return "model";
  if (relation === "unnamed-subject") return "unnamed";
  if (relation === "anchor") return "anchor";
  switch (claim.scopeLayer) {
    case "api-product-line": return "api";
    case "paid-user-cohort": return "cohort";
    case "paid-plus-free-bundle": return "bundle";
    case "segment": return "segment";
    case "analyst-assumption": return "assumption";
    case "company-GM": return "diff";
  }
  if (relation === "different-metric") return "diff";
  return "unit";
}

/* Mirror of app.js boardFieldVal(k, v). */
export function boardFieldVal(k: string, v: unknown): string {
  if (k === "hwMode") return v === "tco" ? "Owned TCO" : "Rental $/hr";
  if (k === "interact") return v === "batch" ? "Throughput" : v === "fast" ? "Low-latency" : "Balanced";
  if (k === "rentMult" || k === "stackMult") return v + "×";
  if (k === "util" || k === "batchShare" || k === "discount") return v + "%";
  if (k === "blend") {
    return Object.entries(v as Record<string, number>)
      .filter(([, s]) => s > 0)
      .map(([hw, s]) => (E.HW[hw] ? E.HW[hw].name : hw) + " " + s)
      .join(" / ");
  }
  return String(v);
}

/* Mirror of app.js boardChangedSummary(p) — "what would have to be true" vs the central scenario. */
export function boardChangedSummary(p: Perspective): string {
  const central = E.PERSPECTIVES.find((x) => x.id === "median")!.set;
  return E.PERSPECTIVE_SPACE_KEYS
    .filter((k) => JSON.stringify(p.set[k] ?? E.DEFAULTS[k]) !== JSON.stringify(central[k] ?? E.DEFAULTS[k]))
    .map((k) => BOARD_FIELD_LABEL[k] + " " + boardFieldVal(k, central[k] ?? E.DEFAULTS[k]) + " → " + boardFieldVal(k, p.set[k] ?? E.DEFAULTS[k]))
    .join(" · ");
}

/* Mirror of app.js boardNoRouteStatement(bid). */
export function noRouteStatement(bucketId: string): string {
  return bucketId === "b6080" ? APPJS_MIRROR.noRouteB6080 : APPJS_MIRROR.noRouteGeneric;
}

/* Mirror of the app.js hero cited-range band (interval-aware, P0-5). */
export function bandSentence(pct: number): string {
  return pct > 95 ? APPJS_MIRROR.bandAbove95
    : pct >= 90 ? APPJS_MIRROR.band90to95
    : pct >= 80 ? APPJS_MIRROR.band80
    : pct >= 50 ? APPJS_MIRROR.band50
    : APPJS_MIRROR.bandLow;
}
