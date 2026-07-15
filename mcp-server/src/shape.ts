/* Response shaping — the DECISIONS made concrete:
   - Variant B response-level envelope: every result leads with a complete honest sentence
     (plain-text content), then a MANDATORY selection_receipt; a non-central result is never
     returned without the central estimate alongside.
   - Values are STATUS-FUSED STRINGS ("≈93% (counterfactual)", "≥80% (floor)",
     "~70% company-GM", "≈77% (unit serving, not company GM)"): the epistemic status is welded
     into the same token as the number, because the fixture experiment showed the welded token
     is the only qualifier that survives maximal LLM compression.
   - Bare margin scalars live ONLY inside selection_receipt, whole-point rounded
     (no manufactured tenths; value_pct_unrounded is deliberately absent from all outputs). */
import { E, SITE, engineStamp } from "./engine.js";
import type { MarginClaim, ModelPreset, TrafficSel } from "./engine-types.js";

/* ---------- status-fused value strings ---------- */
export const round = (pct: number): number => Math.round(pct);

export function fuseUnit(pct: number): string {
  return `≈${round(pct)}% (unit serving, not company GM)`;
}
export function fuseCounterfactual(pct: number): string {
  return `≈${round(pct)}% (counterfactual)`;
}

export function fusedHeadlineValue(pct: number, status: string): string {
  const n = round(pct);
  switch (status) {
    case "derived-estimate":
      return `≈${n}% (unit serving, not company GM)`;
    case "replay":
      return `≈${n}% (replay of a published operating point — unit serving, not company GM)`;
    case "range-exploration-counterfactual":
      return `≈${n}% (counterfactual — page-authored route, not an estimate; unit serving metric, not company GM)`;
    case "modified-range-exploration":
      return `≈${n}% (counterfactual, since edited — not an estimate; unit serving metric, not company GM)`;
    case "modified-scenario":
      return `≈${n}% (modified scenario — user-specified assumptions, attribution removed; unit serving, not company GM)`;
    case "custom-scenario":
      return `≈${n}% (user-defined scratch model, nothing sourced; unit serving metric, not company GM)`;
    case "tariff-scenario":
      return `≈${n}% (tariff scenario — architecture unidentified, not a provider estimate; unit serving metric, not company GM)`;
    case "exploratory-forced-pairing":
      return `≈${n}% (forced exploratory pairing — out-of-scope lens; unit serving metric, not company GM)`;
    default:
      return `≈${n}% (unit serving, not company GM)`;
  }
}

/* Status-fused rendering of a claim's cited bound. Floors are NEVER intervals (P0-2). */
export function renderClaimBound(c: MarginClaim): { type: string | null; lo: number | null; hi: number | null; rendered: string } | null {
  if (!c.numeric || typeof c.numeric.lo !== "number") return c.boundType ? { type: c.boundType, lo: null, hi: null, rendered: "(no numeric bound — see the record's reason)" } : null;
  const { lo, hi } = c.numeric;
  const companyish = /company-GM/.test(c.metricScope || "") || c.scopeLayer === "company-GM";
  if (c.boundType === "floor" || hi === null || hi === undefined) {
    return { type: "floor", lo, hi: null, rendered: `≥${lo}% (floor — compatible with this range and every higher one; NOT an interval and NOT a point)${companyish ? " — company/product-line perimeter, not the unit metric" : ""}` };
  }
  if (c.boundType === "conditional-range") {
    return { type: c.boundType, lo, hi, rendered: `${lo}%→${hi}% (conditional transition — the stated mechanism's endpoint claim, not a point estimate)` };
  }
  if (lo === hi) {
    const scopeTag = companyish ? "company-GM" : c.scopeLayer === "api-product-line" ? "API/product-line GM, not the unit metric" : c.scopeLayer === "paid-user-cohort" ? "paid-user-cohort compute margin, not the unit metric" : c.scopeLayer === "analyst-assumption" ? "analyst modeling assumption, not a measurement" : "point, " + (c.metricScope || "unspecified scope");
    return { type: "point", lo, hi, rendered: `~${lo}% ${scopeTag}` };
  }
  const scopeTag = companyish ? "company-GM interval, not the unit metric" : `interval, ${c.metricScope || "unspecified scope"}`;
  return { type: c.boundType || "interval", lo, hi, rendered: `${lo}–${hi}% (${scopeTag})` };
}

/* ---------- selection receipt ---------- */
export interface SelectionReceipt {
  central_estimate_pct: number;
  this_result_pct: number | null;
  is_central: boolean;
  selection_origin: string;
  changed_from_central: string[];
}

let flagshipCache: number | null = null;
export function flagshipCentralPct(): number {
  if (flagshipCache === null) {
    const median = E.PERSPECTIVES.find((p) => p.id === "median")!;
    flagshipCache = E.explorationFlagshipMargin(median);
  }
  return flagshipCache;
}

/* The central estimate FOR A MODEL: that model under the central lens at its native traffic. */
export function centralForModel(m: ModelPreset): { pct: number; state: Record<string, any> } {
  const median = E.PERSPECTIVES.find((p) => p.id === "median")!;
  const state = E.applyPresetSettings(m, median, { mode: "native" });
  return { pct: E.workload(state).margin * 100, state };
}

export function computationReceipt(opts: {
  centralPct: number;
  thisPct: number | null;
  origin: string;
  changed: string[];
}): SelectionReceipt {
  const central = round(opts.centralPct);
  const thisPct = opts.thisPct === null || !isFinite(opts.thisPct) ? null : round(opts.thisPct);
  return {
    central_estimate_pct: central,
    this_result_pct: thisPct,
    is_central: thisPct !== null && thisPct === central && opts.changed.length === 0,
    selection_origin: opts.origin,
    changed_from_central: opts.changed,
  };
}

/* Registry-style receipt for tools that compute nothing (claims/report/dossier/list):
   still mandatory — the central estimate rides along so no response exists without it. */
export function registryReceipt(origin: string): SelectionReceipt {
  return {
    central_estimate_pct: round(flagshipCentralPct()),
    this_result_pct: null,
    is_central: false,
    selection_origin: origin,
    changed_from_central: [],
  };
}

/* Fields changed vs the model's central state, formatted "key: central → this".
   Values the caller supplied come back to the caller only — they are never logged. */
export function changedFromCentralState(centralState: Record<string, any>, state: Record<string, any>): string[] {
  const out: string[] = [];
  for (const k of Object.keys(E.DEFAULTS)) {
    if (JSON.stringify(centralState[k]) === JSON.stringify(state[k])) continue;
    const fmt = (v: unknown) =>
      k === "blend" ? Object.entries((v as Record<string, number>) || {}).filter(([, s]) => s > 0).map(([hw, s]) => `${hw} ${s}`).join("/")
      : v === null ? "null" : String(v);
    out.push(`${k}: ${fmt(centralState[k])} → ${fmt(state[k])}`);
  }
  return out;
}

/* ---------- envelope ---------- */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

export function envelope(sentence: string, receipt: SelectionReceipt, payload: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: sentence }],
    structuredContent: {
      sentence,
      selection_receipt: receipt,
      ...payload,
      engine: engineStamp(),
      site: { calculator: SITE.calculator, annex: SITE.annex },
    },
  };
}

export function failClosed(message: string): ToolResult {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { sentence: message, error: true },
    isError: true,
  };
}

/* Metric identity rider — derived from the engine's TIPS.margin, never hardcoded (HL-3). */
export function metricIdentityRider(): string {
  return `${E.TIPS.margin.t} — not an audited accounting company gross margin (unit serving, not company GM)`;
}

/* mint a share link under a truthful identity */
export function shareUrl(state: Record<string, any>, modelId: string, perspId: string, traffic: { mode: string; profileId?: string | null; ioRatio: number; cacheHit: number }, modifiedFrom?: string | null): string {
  const token = E.encodeScenario(state, modelId, perspId, traffic, modifiedFrom ?? null);
  return SITE.calculator + "?s=" + encodeURIComponent(token);
}

export function toTrafficSel(input:
  | undefined
  | { mode: "native" }
  | { mode: "profile"; profile_id: string }
  | { mode: "custom"; io_ratio: number; cache_hit: number }): TrafficSel {
  if (!input || input.mode === "native") return { mode: "native" };
  if (input.mode === "profile") return { mode: "explicit", profileId: input.profile_id };
  return { mode: "custom", ioRatio: input.io_ratio, cacheHit: input.cache_hit };
}
