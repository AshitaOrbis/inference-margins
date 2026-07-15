/* run_scenario — the mechanism-first calculator: the ONLY tool that produces a derived estimate,
   and only when the state genuinely is one. Engine pipeline in the site's own order:
   applyPresetSettings → sanitizeScenarioDiff → apply clean diff → overlayDivergesFromReplay →
   workload + feasibility + lensSpan + pairingWarning/Severity.
   Honest-labeling: response-level envelope (Variant B); ONE rounded scalar in the receipt
   (value_pct_unrounded deliberately absent); status-fused value strings; replay locks honored
   (MLI-1); divergent replay edits remove attribution; custom flagged unsourced-scratch;
   lens_span non-optional; share_url minted under the truthful identity.
   Override VALUES are never logged anywhere (they may contain private negotiated rates). */
import { z } from "zod";
import { E } from "../engine.js";
import type { ModelPreset, Perspective } from "../engine-types.js";
import { APPJS_MIRROR, bandSentence } from "../labels.js";
import {
  envelope, failClosed, computationReceipt, centralForModel, changedFromCentralState,
  fusedHeadlineValue, fuseUnit, metricIdentityRider, round, shareUrl, toTrafficSel,
  type ToolResult,
} from "../shape.js";

export const name = "run_scenario";

export const config = {
  title: "Run a calculator scenario",
  description:
    "Compute the modeled unit direct-serving contribution margin (NOT a company gross margin) for a model preset under a perspective (cost lens / replay / range-exploration route), a traffic selection and optional overrides. The only tool that derives an estimate. Every response carries the central estimate alongside the result (selection_receipt); replay traffic locks are enforced, divergent edits to a replay remove its attribution, and hard-incompatible pairings refuse unless force_exploratory is set. Lead-sentence contract: quote or closely paraphrase the response's leading sentence; a bare number without its welded status is a misquote.",
  inputSchema: {
    model: z.string().describe("Model preset id — see list_scenario_space.models (includes 'custom', a user-defined scratch model)"),
    perspective: z.string().optional().describe("Perspective id (default 'median', the central lens) — see list_scenario_space.perspectives"),
    traffic: z.object({
      mode: z.enum(["native", "profile", "custom"]),
      profile_id: z.string().optional().describe("Required when mode='profile'"),
      io_ratio: z.number().optional().describe("Required when mode='custom'"),
      cache_hit: z.number().optional().describe("Required when mode='custom' (percent, 0–95)"),
    }).optional().describe("Traffic-mix selection; default = the model's native profile. Replays lock their traffic — selections cannot move them."),
    overrides: z.record(z.unknown()).optional().describe("State overrides validated against SCENARIO_BOUNDS (see list_scenario_space.override_bounds); invalid values are rejected, never clamped"),
    force_exploratory: z.boolean().optional().describe("Required to compute a hard-incompatible model+perspective pairing; the result is labeled exploratory"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args {
  model: string;
  perspective?: string;
  traffic?: { mode: "native" | "profile" | "custom"; profile_id?: string; io_ratio?: number; cache_hit?: number };
  overrides?: Record<string, unknown>;
  force_exploratory?: boolean;
}

function provenancePayload(m: ModelPreset, p: Perspective) {
  return {
    model_provenance: {
      id: m.id, name: m.name, note: m.note,
      speculative_sizes: !!m.spec, tariff_scenario: !!m.scenario,
      unsourced_scratch: m.id === "custom", native_traffic: m.nativeTraffic,
    },
    perspective_provenance: { id: p.id, name: p.name, kind: p.kind, note: p.note },
  };
}

export function handler(args: Args): ToolResult {
  const m = E.MODELS.find((x) => x.id === args.model);
  if (!m) return failClosed(`Unknown model "${args.model}". Valid ids: ${E.MODELS.map((x) => x.id).join(", ")}.`);
  const pid = E.normalizePerspId(args.perspective ?? "median");
  const p = E.PERSPECTIVES.find((x) => x.id === pid);
  if (!p) return failClosed(`Unknown perspective "${args.perspective}". Valid ids: ${E.PERSPECTIVES.map((x) => x.id).join(", ")}.`);

  // traffic selection validation — fail closed, never clamp
  const t = args.traffic;
  if (t?.mode === "profile") {
    if (!t.profile_id || !E.TRAFFIC_PROFILES.some((x) => x.id === t.profile_id)) {
      return failClosed(`Unknown traffic profile "${t?.profile_id}". Valid ids: ${E.TRAFFIC_PROFILES.map((x) => x.id).join(", ")}.`);
    }
  }
  if (t?.mode === "custom") {
    const [ioLo, ioHi] = E.SCENARIO_BOUNDS.ioRatio as [number, number];
    const [chLo, chHi] = E.SCENARIO_BOUNDS.cacheHit as [number, number];
    if (typeof t.io_ratio !== "number" || !isFinite(t.io_ratio) || t.io_ratio < ioLo || t.io_ratio > ioHi ||
        typeof t.cache_hit !== "number" || !isFinite(t.cache_hit) || t.cache_hit < chLo || t.cache_hit > chHi) {
      return failClosed(`Custom traffic requires io_ratio in [${ioLo}, ${ioHi}] and cache_hit in [${chLo}, ${chHi}]; values are rejected, never clamped.`);
    }
  }
  // Narrow the validated traffic (checks above guarantee the required fields) into the
  // discriminated union toTrafficSel expects; runtime is already enforced by the validation.
  const sel = toTrafficSel(
    !t ? undefined
      : t.mode === "profile" ? { mode: "profile", profile_id: t.profile_id! }
      : t.mode === "custom" ? { mode: "custom", io_ratio: t.io_ratio!, cache_hit: t.cache_hit! }
      : { mode: "native" }
  );

  const severity = E.pairingSeverity(m, p);
  const warn = E.pairingWarning(m, p);
  const { pct: centralPct, state: centralState } = centralForModel(m);
  const forced = severity === "hard" && !!args.force_exploratory;

  if (severity === "hard" && !forced) {
    const sentence =
      `${APPJS_MIRROR.incompatiblePair} ${m.name} + ${p.name}: ${warn}. ` +
      `The central estimate for ${m.name} (central lens @ model-default traffic) is ${fuseUnit(centralPct)}. ` +
      `Pass force_exploratory: true to compute anyway as an explicitly labeled exploratory pairing.`;
    return envelope(
      sentence,
      computationReceipt({
        centralPct, thisPct: null,
        origin: `refused: hard-incompatible pairing (${m.id} + ${p.id}); no headline computed`,
        changed: [`perspective: [lens] Central scenario (Claude) → ${p.name}`],
      }),
      { refused: true, pairing: { severity, warning: warn || null }, ...provenancePayload(m, p) },
    );
  }

  // --- engine pipeline, site order ---
  const diveFallback = p.id === "dive" && !m.dive;
  const tr = E.resolveTraffic(m, p, sel);
  const base = E.applyPresetSettings(m, p, sel);
  const { diff: clean, rejected } = E.sanitizeScenarioDiff((args.overrides as Record<string, unknown>) ?? {}, tr);
  const state: Record<string, any> = Object.assign(structuredClone(base), structuredClone(clean));
  const overrideKeys = Object.keys(clean).filter((k) => JSON.stringify(clean[k]) !== JSON.stringify(base[k]));
  const replayDiverges = p.kind === "replay" && !diveFallback && E.overlayDivergesFromReplay(m, p, clean);
  const explDiverges = p.kind === "exploration" && overrideKeys.length > 0;
  const trafficSelectionIgnored = !!(t && t.mode !== "native" && tr.locked);
  const trafficOverridden = overrideKeys.includes("ioRatio") || overrideKeys.includes("cacheHit");

  const wl = E.workload(state);
  const pct = wl.margin * 100;
  const feas = E.feasibility(state);

  // epistemic status (mirrors the app.js state identities)
  let status: string;
  if (forced) status = "exploratory-forced-pairing";
  else if (m.id === "custom") status = "custom-scenario";
  else if (p.kind === "exploration") status = explDiverges ? "modified-range-exploration" : "range-exploration-counterfactual";
  else if (p.kind === "replay" && !diveFallback) status = replayDiverges ? "modified-scenario" : "replay";
  else if (m.scenario) status = "tariff-scenario";
  else status = "derived-estimate";

  // receipt — the ONLY place bare margin scalars live, whole-point rounded
  const changed: string[] = [];
  if (p.id !== "median") changed.push(`perspective: [lens] Central scenario (Claude) → ${p.name}`);
  changed.push(...changedFromCentralState(centralState, state));
  const originBits = [
    p.id === "median" && !t && overrideKeys.length === 0 ? "central-default" : null,
    p.id !== "median" ? `caller-selected perspective '${p.id}' (${p.kind}${diveFallback ? ", no §10 card — median fallback" : ""})` : null,
    t ? `caller traffic selection (${t.mode}${trafficSelectionIgnored ? " — ignored, locked by replay" : ""})` : null,
    overrideKeys.length ? `caller overrides on ${overrideKeys.join(", ")}` : null,
    rejected.length ? `${rejected.length} override(s) rejected` : null,
    forced ? "force_exploratory" : null,
  ].filter(Boolean).join("; ");
  const receipt = computationReceipt({
    centralPct,
    thisPct: isFinite(pct) ? pct : null,
    origin: originBits || "central-default",
    changed,
  });

  if (!isFinite(pct)) {
    const sentence =
      `No finite margin at these assumptions (realized price is zero or negative for ${m.name} under ${p.name}); no headline is computed. ` +
      `The central estimate for ${m.name} is ${fuseUnit(centralPct)}.`;
    return envelope(sentence, receipt, {
      refused: false, pairing: { severity, warning: warn || null },
      rejected_overrides: rejected, ...provenancePayload(m, p),
    });
  }

  // lens span — non-optional; comparator lenses pinned to byte-identical effective traffic
  const spanRes = E.lensSpan(m, { mode: "custom", ioRatio: state.ioRatio, cacheHit: state.cacheHit });
  const trafficLabel = trafficOverridden ? `Custom ${state.ioRatio}:1 / ${state.cacheHit}% (set by overrides)` : tr.label;
  let spanText: string;
  if (!spanRes) spanText = "no compatible cost lens at this scope";
  else if (spanRes.single) spanText = `${APPJS_MIRROR.lensSpanSinglePrefix}≈${round(spanRes.lo * 100)}%${APPJS_MIRROR.lensSpanSingleSuffix}`;
  else spanText = `${APPJS_MIRROR.lensSpanAtPrefix}${trafficLabel}: ${spanRes.lo * 100 < -100 ? "<−100%" : "≈" + round(spanRes.lo * 100) + "%"}–≈${round(spanRes.hi * 100)}% across ${spanRes.n} lenses ${APPJS_MIRROR.lensSpanTail}`;
  const lens_span = {
    span: spanText,
    n_lenses: spanRes ? spanRes.n : 0,
    traffic_label: trafficLabel,
    note: "quoting the headline without its lens span is lens-shopping; the span holds traffic byte-identical across compatible cost lenses",
  };

  // exploration flagship membership (mirrors app.js hero identity)
  const rb = p.kind === "exploration" ? E.explorationComputedBucket(p) : null;
  const inRange = rb ? pct >= rb.lo && pct < rb.hi : null;
  const offScope = p.kind === "exploration"
    ? !(m.id === E.FLAGSHIP_SCOPE.modelId && state.ioRatio === 15 && state.cacheHit === 60)
    : false;

  // status sentence (label) — mirrored app.js identities
  let label: string;
  switch (status) {
    case "range-exploration-counterfactual":
      label = APPJS_MIRROR.rangeExplorationPrefix + (rb ? rb.label : "claimed") + APPJS_MIRROR.rangeExplorationSuffix
        + (offScope ? APPJS_MIRROR.viewedOffScopePrefix + m.name + " · " + state.ioRatio + ":1/" + state.cacheHit + "%" + APPJS_MIRROR.viewedOffScopeSuffix : "")
        + APPJS_MIRROR.landsAtPrefix + round(pct) + "% — " + (inRange ? "inside" : "OUTSIDE") + APPJS_MIRROR.authoredRangeSuffix;
      break;
    case "modified-range-exploration":
      label = APPJS_MIRROR.modifiedExplorationPrefix + (p.subtitle ?? p.name) + APPJS_MIRROR.modifiedExplorationSuffix;
      break;
    case "modified-scenario":
      label = `MODIFIED SCENARIO (derived from ${p.name}) ${APPJS_MIRROR.modifiedScenarioSuffix}`;
      break;
    case "replay":
      label = `Replay of a published operating point: ${p.name}. Traffic is part of the position and stays locked (${tr.label}).`;
      break;
    case "custom-scenario":
      label = `USER-DEFINED SCRATCH MODEL — ${m.note}`;
      break;
    case "tariff-scenario":
      label = APPJS_MIRROR.tariffScenario;
      break;
    case "exploratory-forced-pairing":
      label = `${APPJS_MIRROR.forcedExploratory} ${warn}.`;
      break;
    default:
      label = `${APPJS_MIRROR.heroUnitLabel} — derived estimate under ${p.name} at ${trafficLabel}.`;
  }

  const mustCarry =
    status === "range-exploration-counterfactual" || status === "modified-range-exploration"
      ? ["page-authored counterfactual — what would have to be true; not an estimate", metricIdentityRider()]
      : status === "custom-scenario"
        ? [metricIdentityRider(), "user-defined scratch model — no provider, nothing sourced"]
        : status === "tariff-scenario"
          ? [metricIdentityRider(), "tariff scenario — architecture unidentified; not a provider estimate"]
          : status === "modified-scenario"
            ? [metricIdentityRider(), "not the published operating point; replay attribution removed"]
            : status === "replay"
              ? [metricIdentityRider(), `traffic locked by the replay (${tr.ioRatio}:1 / ${tr.cacheHit}%)`]
              : status === "exploratory-forced-pairing"
                ? [metricIdentityRider(), "forced exploratory pairing — perspective scoped to a different provider"]
                : [metricIdentityRider()];

  const headline = {
    kind: "modeled-unit-direct-serving-contribution-margin",
    epistemic_status: status,
    label,
    value: fusedHeadlineValue(pct, status),
    must_carry: mustCarry,
    cited_range_context: m.id === "custom" ? null : bandSentence(pct),
    derived_from: status === "modified-scenario" ? p.name : status === "modified-range-exploration" ? (p.subtitle ?? p.name) : null,
  };

  // share_url under the truthful identity
  let share: string;
  if (replayDiverges) {
    share = shareUrl(state, m.id, "__modified", { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, p.name);
  } else if (explDiverges) {
    share = shareUrl(state, m.id, "__modified-exploration", { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, p.id);
  } else if (trafficOverridden) {
    share = shareUrl(state, m.id, p.id, { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit });
  } else {
    share = shareUrl(state, m.id, p.id, { mode: tr.mode, profileId: tr.profileId, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit });
  }

  // ---- the complete honest sentence ----
  const parts: string[] = [];
  if (status !== "derived-estimate") parts.push(label);
  if (severity === "soft" && warn) parts.push(APPJS_MIRROR.pairingNotePrefix + warn + ".");
  if (diveFallback) parts.push("(no §10 card for this model — using the evidence median instead)");
  parts.push(
    `${m.name} · ${p.name} · traffic ${trafficLabel}: the modeled unit direct-serving contribution margin computes to ` +
    `${fusedHeadlineValue(pct, status)} — ${bandSentence(pct)}.`,
  );
  if (overrideKeys.length) parts.push(`Under user-specified assumptions — overridden fields vs the preset: ${overrideKeys.join(", ")}.`);
  if (rejected.length) parts.push(`⚠ ${rejected.length} override(s) failed schema or replay-integrity validation and were ignored (${rejected.join("; ")}).`);
  if (trafficSelectionIgnored) parts.push(`Requested traffic selection ignored — the replay's traffic is part of the position and stays locked (${tr.label}).`);
  parts.push(`· ${spanText}.`);
  parts.push(
    receipt.is_central
      ? `This IS the central estimate for ${m.name} (central lens @ model-default traffic).`
      : `The central estimate for ${m.name} (central lens @ model-default traffic) is ${fuseUnit(centralPct)}; this result differs via: ${changed.slice(0, 6).join("; ")}${changed.length > 6 ? "; …" : ""}.`,
  );
  const sentence = parts.join(" ");

  return envelope(sentence, receipt, {
    headline,
    costs: {
      blended_cost_usd_per_mtok: wl.costMix,
      realized_price_usd_per_mtok: wl.priceMix,
      decode_cost_usd_per_mtok: wl.cOut,
      fresh_prefill_cost_usd_per_mtok: wl.cIn,
      cache_read_cost_usd_per_mtok: wl.cCache,
      perimeter_note: E.TIPS.margin.b,
    },
    traffic: {
      io_ratio: state.ioRatio,
      cache_hit_pct: state.cacheHit,
      mode: tr.mode,
      locked: tr.locked,
      label: trafficLabel,
      provenance: tr.profileId ? (E.TRAFFIC_PROFILES.find((x) => x.id === tr.profileId)?.provenance ?? null) : null,
      selection_note: trafficSelectionIgnored ? `requested traffic selection ignored — locked by the replay (${tr.label})` : null,
    },
    lens_span,
    feasibility: {
      gpus_min: feas.gpus,
      weights_gb: Math.round(feas.gb),
      racks: feas.racks,
      dominant_hw: E.HW[feas.domKey].name,
      note: `${Math.round(feas.gb).toLocaleString("en-US")} GB weights (${state.precision}) on ${E.HW[feas.domKey].name} ⇒ ≥${feas.racks} × 72-rack${feas.racks > 1 ? "s" : ""}`,
    },
    pairing: { severity, warning: warn || null },
    ...provenancePayload(m, p),
    rejected_overrides: rejected,
    share_url: share,
    share_note: APPJS_MIRROR.shareLinkWarning,
  });
}
