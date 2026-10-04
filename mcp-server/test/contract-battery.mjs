// Shared request battery: both contracts and public-text checks exercise the same inputs.
export const contractBatteryCalls = [
  ["list", "list_scenario_space", {}],
  ["claims_full", "query_margin_claims", {}],
  ["claims_b8090", "query_margin_claims", { bucket: "b8090" }],
  ["claims_b90", "query_margin_claims", { bucket: "b90plus" }],
  ["claims_b6080", "query_margin_claims", { bucket: "b6080" }],
  ["claims_xai", "query_margin_claims", { subject: "xAI" }],
  ["claims_nonbin", "query_margin_claims", { include_non_binnable: true }],
  ["run_opus", "run_scenario", { model: "opus" }],
  ["run_grok_opp", "run_scenario", { model: "grok", perspective: "xaiopp" }],
  ["run_expl", "run_scenario", { model: "opus", perspective: "x90-v1" }],
  ["run_custom", "run_scenario", { model: "custom" }],
  ["run_tariff", "run_scenario", { model: "terra" }],
  ["run_hard_refused", "run_scenario", { model: "dsr1", perspective: "xaiopp" }],
  ["run_hard_forced", "run_scenario", { model: "dsr1", perspective: "xaiopp", force_exploratory: true }],
  ["run_mli1", "run_scenario", { model: "grok", perspective: "xaiopp", overrides: { ioRatio: 300, cacheHit: 95 } }],
  ["run_modified", "run_scenario", { model: "grok", perspective: "xaiopp", overrides: { util: 60 } }],
  ["run_lens_override", "run_scenario", { model: "opus", overrides: { priceOut: 30 } }],
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): absolute
     rent is a first-class MCP override and must reject, never clamp, outside its bounds. */
  ["run_rent_abs_base", "run_scenario", { model: "opus" }],
  ["run_rent_abs_2", "run_scenario", { model: "opus", overrides: { rentAbsAll: 2 } }],
  ["run_rent_abs_oob", "run_scenario", { model: "opus", overrides: { rentAbsAll: 0.01 } }],
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1): map receipts must name
     donors deterministically rather than falling through String(object). */
  ["run_rent_abs_leg", "run_scenario", { model: "opus", overrides: { rentAbsLeg: { h200: 2.5, h100: 1.25 } } }],
  ["explore_90", "explore_range", { range: "b8090" }],
  ["explore_num", "explore_range", { range: 85 }],
  ["explore_6080", "explore_range", { range: "b6080" }],
  ["explore_60", "explore_range", { range: "b60minus" }],
  ["explore_at", "explore_range", { range: "b8090", at_model: "grok" }],
  ["report_s7", "get_report", { id: "report-s7" }],
  ["dossier_opus", "get_dossier", { type: "model", id: "opus" }],
  ["dossier_route", "get_dossier", { type: "perspective", id: "x90-v1" }],
  ["dossier_retired", "get_dossier", { type: "perspective", id: "semi" }],
];
