/* get_dossier — per-preset provenance ledger (engine DOSSIERS). Dossiers store NO values;
   live preset values are composed at call time from the registry, so the ledger can never
   drift from the model. Retired perspective ids normalize through the engine's migration map. */
import { z } from "zod";
import { E } from "../engine.js";
import { boardFieldVal } from "../labels.js";
import { envelope, failClosed, registryReceipt, type ToolResult, registryEmitMeta } from "../shape.js";

export const name = "get_dossier";

/* IM3 exit-gate fix 3 made the evidence/engine identity fork reachable on this path;
   IM4 slice A (schema rev 2.2, 2026-07-21) CLOSED that fork: every deployed record in the
   internal evidence registry now carries the discriminated live identity (fitClass, live
   per-row roofline eta bound by test equality to the engine's calibration registry, a
   calibrationRef naming its own registry row) with the retired scalar effDec/effPre fields
   archived in-record as legacyScalar — no longer a live identity anywhere. The note stays
   registry-wide on every response so consumers see the reconciled status explicitly. */
const EVIDENCE_REGISTRY_STATUS_NOTE =
  "the internal evidence registry backing this system's hardware anchors carries the live " +
  "engine identity on every deployed record (schema rev 2.2, 2026-07-21: discriminated fit " +
  "class + live per-row roofline eta, test-bound to the engine's calibration registry); the " +
  "retired scalar effDec/effPre fields are archived in-record as legacyScalar, not a live " +
  "identity (this dossier's own values compose live from the preset registry as before)";

export const config = {
  title: "Get a preset's provenance dossier",
  description:
    "Per-preset provenance ledger: attribution class (calculator-synthesis | reconstruction | quoted-position), the anchoring quote, each pinned parameter's source with its evidence tier (DISCLOSED / CREDIBLY REPORTED / COMMUNITY-SOURCED / SPECULATION / USER-SET), stated assumptions and falsifiers. Values are composed live from the preset registry at call time — dossiers store no values. Lead-sentence contract: quote or closely paraphrase the response's leading sentence.",
  inputSchema: {
    type: z.enum(["model", "perspective"]),
    id: z.string().describe("Preset id — see list_scenario_space (retired perspective ids normalize to their successors)"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args { type: "model" | "perspective"; id: string }

export function handler(args: Args): ToolResult {
  if (args.type === "model") {
    const m = E.MODELS.find((x) => x.id === args.id);
    const d = m ? E.DOSSIERS.models[m.id] : undefined;
    if (!m || !d) {
      return failClosed(`Unknown model dossier "${args.id}". Valid ids: ${Object.keys(E.DOSSIERS.models).join(", ")}.`);
    }
    const nativeTr = E.resolveTraffic(m, E.PERSPECTIVES.find((p) => p.id === "median")!, { mode: "native" });
    const params = Object.entries(d.params).map(([k, v]) => {
      const raw = k in m.set ? m.set[k]
        : k === "ioRatio" ? nativeTr.ioRatio
        : k === "cacheHit" ? nativeTr.cacheHit
        : E.DEFAULTS[k];
      return {
        param: k,
        live_value: raw !== null && typeof raw === "object" ? boardFieldVal(k, raw) : (raw as string | number | null),
        source: v.src,
        evidence_label: v.label,
      };
    });
    const labels = [...new Set(params.map((p) => p.evidence_label))].join(", ");
    const sentence =
      `Provenance dossier for ${m.name} (model preset, attribution: ${d.attribution}). ${d.who} ` +
      (d.anchor ? `Anchor: "${d.anchor.quote}" (${d.anchor.url}). ` : "No anchor — nothing is sourced. ") +
      `${params.length} pinned parameters with evidence labels {${labels}}; values compose live from the preset registry — the dossier stores none. ` +
      `This is provenance, not an estimate; run_scenario derives estimates. ` +
      `Registry status: ${EVIDENCE_REGISTRY_STATUS_NOTE}.`;
    return envelope(sentence, registryReceipt(`provenance dossier: model ${m.id} — ledger only, no derived estimate`), {
      type: "model", id: m.id, name: m.name,
      attribution: d.attribution, who: d.who, anchor: d.anchor,
      params, assumes: d.assumes, falsifiers: d.falsifiers,
      note: m.note,
      evidence_registry_status: EVIDENCE_REGISTRY_STATUS_NOTE,
    }, registryEmitMeta("get_dossier", "provenance dossier"));
  }

  const pid = E.normalizePerspId(args.id);
  const p = E.PERSPECTIVES.find((x) => x.id === pid);
  const d = p ? E.DOSSIERS.perspectives[p.id] : undefined;
  if (!p || !d) {
    return failClosed(`Unknown perspective dossier "${args.id}". Valid ids: ${Object.keys(E.DOSSIERS.perspectives).join(", ")} (retired ids ${Object.keys(E.RETIRED_PERSPECTIVES).join(", ")} normalize automatically).`);
  }
  const params = Object.entries(d.params).map(([k, v]) => {
    const raw = p.set[k] ?? E.DEFAULTS[k];
    return {
      param: k,
      live_value: raw !== null && typeof raw === "object" ? boardFieldVal(k, raw) : (raw as string | number | null),
      source: v.src,
      evidence_label: v.label,
    };
  });
  const migrated = pid !== args.id ? ` (requested id "${args.id}" is retired; normalized to "${pid}" — numbers unchanged, the parameter vector was always page-authored and is now labeled as such)` : "";
  const sentence =
    `Provenance dossier for ${p.name} (${p.kind} perspective, attribution: ${d.attribution})${migrated}. ${d.who} ` +
    (d.anchor ? `Anchor: "${d.anchor.quote}" (${d.anchor.url}). ` : "") +
    (params.length
      ? `${params.length} pinned parameters; values compose live from the preset registry — the dossier stores none. `
      : `This entry pins no parameters of its own (per-model replay). `) +
    `This is provenance, not an estimate; run_scenario derives estimates. ` +
    `Registry status: ${EVIDENCE_REGISTRY_STATUS_NOTE}.`;
  return envelope(sentence, registryReceipt(`provenance dossier: perspective ${p.id} — ledger only, no derived estimate`), {
    type: "perspective", id: p.id, name: p.name, kind: p.kind,
    attribution: d.attribution, who: d.who, anchor: d.anchor,
    params, assumes: d.assumes, falsifiers: d.falsifiers,
    note: p.note,
    evidence_registry_status: EVIDENCE_REGISTRY_STATUS_NOTE,
  }, registryEmitMeta("get_dossier", "provenance dossier"));
}
