/* im-arc T4 fold (2026-08-24) — the ONE coverage resolver.
   Spec: research/im-arc-t4-fold-memo.md §1.5 [F3], §3, §6.1 (the two T3 carry-forwards).

   What this file gates:
   * percentages are DERIVED from stored key-level evidence and the selected modeled blend —
     never hand-stored, because a stored percentage drifts the moment a blend changes;
   * the precedence is SET-SUBTRACTIVE: named-site, then programme MINUS named-site, then the
     generic remainder — so one piece of evidence can never be counted twice;
   * the prominent partition is THREE parts summing to 100, and the SKU/workload count-backed
     share is a subordinate, explicitly NON-ADDITIVE line;
   * the rounding band is 0.05 x the number of ADDITIVE parts, computed, never a literal
     (memo §6.1a — the T3 tests asserted 0.15, which is 0.05 x 3);
   * a genuinely non-zero share below 0.05 renders `<0.1%` with an unrounded `exactPct` beside
     it, so a sliver of named-site evidence never reads as none (memo §6.1b, director ruling).
   Run: node tests/dc-coverage-resolver-t4.test.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-dc-v1.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/* ---------- 1. the memo's expected table, reproduced from stored evidence ---------- */
/* memo §1.5: "if the executed resolver differs, the executed value wins and this table is
   corrected — never the reverse". These are the executed values; the report records any
   difference from the memo's table. */
/* RE-MINTED 2026-09-20 (im-vet-six-repairs, Astra xhigh fold, review finding 2). `opus` moves
   38/33/29 -> 50.666.../33.333.../16, and the move is the POINT, not a side effect: the resolver
   used to derive coverage from `fleet.legs`, the DECLARED seven legs, so after the E1 Trainium
   withdrawal it published coverage of a fleet the page no longer renders. It now derives from the
   effective five-leg composition, and the row carries a sentence naming the two withdrawn legs.
   The memo's own rule applies unchanged (§1.5: "if the executed resolver differs, the executed
   value wins and this table is corrected — never the reverse"). Only `opus` moves, because it is
   the only preset whose coverage blend is the default fleet; every other row below is untouched,
   which is itself evidence the change is scoped to the withdrawal. */
const expected = {
  opus: [50.666666666666664, 33.333333333333336, 16, 0], sonnet: [50, 25, 25, 0], haiku: [50, 25, 25, 0],
  grok: [0, 0, 100, 0], dsr1: [0, 100, 0, 100],
  dsv4: [0, 0, 100, 0], dsv4f: [0, 0, 100, 0],
  gpt: [0, 0, 100, 0], terra: [0, 0, 100, 0], luna: [0, 0, 100, 0],
  gemini: [0, 0, 100, 0], gemflash: [0, 0, 100, 0],
  glm: [0, 0, 100, 0], glm47: [0, 0, 100, 0], kimi: [0, 0, 100, 0],
};
for (const [preset, [named, programme, generic, countBacked]] of Object.entries(expected)) {
  const row = E.coverageForPreset(preset);
  assert(`T4-COV-1 ${preset} derives ${named} / ${programme} / ${generic}, count-backed ${countBacked}`,
    row && close(row.namedSiteServingEvidencePct, named)
      && close(row.programmeTypeEvidencePct, programme)
      && close(row.genericFillPct, generic)
      && close(row.skuWorkloadCountBackedPct, countBacked),
    JSON.stringify(row && [row.namedSiteServingEvidencePct, row.programmeTypeEvidencePct,
      row.genericFillPct, row.skuWorkloadCountBackedPct]));
}

/* ---------- 2. derived, never stored ---------- */
assert("T4-COV-2 the stored ledger carries no percentage at all",
  !/Pct"?\s*:\s*\d/.test(JSON.stringify(D.COVERAGE_LEDGER)),
  (JSON.stringify(D.COVERAGE_LEDGER).match(/\w+Pct"?\s*:\s*\d+/g) || []).join(","));
/* The T3 fix-3 diagnostic in one assertion: change the blend, and the derived numbers move.
   A hand-stored 33/67 could not do this. */
{
  const shifted = E.coverageForPreset("opus", { blend: { h100: 100 } });
  assert("T4-COV-2 the derived partition follows the blend it is derived against",
    close(shifted.namedSiteServingEvidencePct, 100) && close(shifted.programmeTypeEvidencePct, 0)
      && close(shifted.genericFillPct, 0),
    JSON.stringify(shifted));
}

/* ---------- 3. precedence is SET-SUBTRACTIVE ---------- */
{
  const row = E.coverageForPreset("opus");
  assert("T4-COV-3 the three additive parts sum to 100 within the computed band",
    Math.abs(row.namedSiteServingEvidencePct + row.programmeTypeEvidencePct + row.genericFillPct - 100)
      <= 0.05 * 3, JSON.stringify(row));
  /* Rainier is a MULTI-data-center programme milestone. If it were counted as named-site the
     Anthropic partition would fold programme into named — 84% on today's effective fleet — which
     is the fleet synthesis's own inconsistency, and the review refused to carry it into the
     schema (fold F3). RE-SCOPED 2026-09-20 (im-vet-six-repairs, Astra fold): the executed value
     moved with the withdrawal, so the pin moves with it, and the counterfactual it forbids is
     re-derived at the same operating point rather than left at the pre-withdrawal 46. The
     SET-level half below is what makes this drift-proof; this half is the value it produces. */
  assert("T4-COV-3 Rainier is counted as programme evidence, never as a named site",
    close(row.namedSiteServingEvidencePct, 50.666666666666664)
      && !close(row.namedSiteServingEvidencePct, 84),
    String(row.namedSiteServingEvidencePct));
  /* The C1 DATACENTER row and the Anthropic C1 programme/contract row describe the SAME
     evidence. Precedence (2) subtracts (1), so it is counted exactly once. */
  assert("T4-COV-3 the C1 facility row and the C1 capacity programme row are not double-counted",
    row.evidenceKeys.namedSite.slice().sort().join(",") === "gb200,h100,h200"
      && row.evidenceKeys.programme.slice().sort().join(",") === "tpu7,trn2"
      && row.evidenceKeys.programme.every((key) => !row.evidenceKeys.namedSite.includes(key)),
    JSON.stringify(row.evidenceKeys));
}

/* ---------- 4. the count-backed line is NON-ADDITIVE ---------- */
{
  const row = E.coverageForPreset("dsr1");
  assert("T4-COV-4 a 100% count-backed share sits OUTSIDE the three-part partition",
    close(row.skuWorkloadCountBackedPct, 100)
      && close(row.namedSiteServingEvidencePct + row.programmeTypeEvidencePct + row.genericFillPct, 100)
      && row.countBackedIsAdditive === false,
    JSON.stringify(row));
  const parts = E.coverageSentenceParts(row);
  assert("T4-COV-4 the sentence renders three additive parts plus a subordinate line",
    parts.mode === "three-part-plus-count-backed" && parts.parts.length === 3
      && parts.subordinate && /SKU\/workload count-backed: 100% \(non-additive\)/.test(parts.subordinate.sentence),
    JSON.stringify(parts));
  /* The field is named for what it measures. "count-attributed" was the T3 draft name. */
  assert("T4-COV-4 the field is skuWorkloadCountBackedPct, not 'count-attributed'",
    "skuWorkloadCountBackedPct" in row && !/countAttributed/.test(JSON.stringify(row)));
}

/* ---------- 5. the rounding band is COMPUTED (memo §6.1a) ---------- */
{
  const parts = E.coverageSentenceParts(E.coverageForPreset("opus"));
  assert("T4-COV-5 the asserted band is 0.05 x the ADDITIVE part count, not a literal",
    close(parts.roundingBand, 0.05 * parts.parts.length) && parts.parts.length === 3
      && close(parts.roundingBand, 0.15),
    JSON.stringify({ band: parts.roundingBand, parts: parts.parts.length }));
  assert("T4-COV-5 the band never counts the non-additive line among its parts",
    parts.roundingBasis && /additive/i.test(parts.roundingBasis)
      && !/0\.15/.test(parts.roundingBasis), parts.roundingBasis);
}

/* ---------- 6. a sub-0.1 sliver renders <0.1%, not 0% (memo §6.1b) ---------- */
{
  /* A blend where named-site evidence covers a genuinely non-zero but tiny share. */
  const sliver = E.coverageForPreset("opus", { blend: { h100: 0.02, tpu7: 49.99, trn3: 49.99 } });
  const parts = E.coverageSentenceParts(sliver);
  const named = parts.parts.find((part) => part.key === "named_site_serving_evidence_pct");
  assert("T4-COV-6 a genuinely non-zero share below 0.05 renders as <0.1%",
    named.display === "<0.1" && named.value > 0 && named.exactPct > 0
      && /<0\.1%/.test(parts.sentence),
    JSON.stringify({ named, sentence: parts.sentence }));
  assert("T4-COV-6 the unrounded value travels beside the display value",
    close(named.exactPct, 100 * 0.02 / 100.0), JSON.stringify(named));
  /* A share that really IS zero still prints a bare 0. */
  const zero = E.coverageSentenceParts(E.coverageForPreset("gpt"));
  assert("T4-COV-6 a true zero still prints 0%, never <0.1%",
    /0% named-site serving evidence/.test(zero.sentence) && !/<0\.1/.test(zero.sentence),
    zero.sentence);
}

/* ---------- 7. wording, and the separate physical-inventory sentence ---------- */
{
  const grok = E.coverageSentenceParts(E.coverageForPreset("grok"));
  assert("T4-COV-7 the denominator wording is unchanged, exactly",
    grok.sentence.includes("share of the MODELED fleet resting on DC-specific public evidence, not how much of the real fleet is known"),
    grok.sentence);
  assert("T4-COV-7 xAI reports physical inventory in its OWN sentence, never as coverage",
    close(E.coverageForPreset("grok").namedSiteServingEvidencePct, 0)
      && /physical inventory types present: 100% of the modeled blend/.test(grok.sentence)
      && /current Grok inference allocation is not disclosed/.test(grok.sentence),
    grok.sentence);
  const gemini = E.coverageSentenceParts(E.coverageForPreset("gemini"));
  assert("T4-COV-7 Google keeps its TPU-family note",
    /TPU-family serving is public; current TPU7 count and internal site allocation are not disclosed/.test(gemini.sentence),
    gemini.sentence);
}

/* ---------- 8. ONE resolver — the composed-fleet path agrees with the preset path ---------- */
{
  const model = E.MODELS.find((row) => row.id === "grok");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const fleet = E.composeFleetFromDcRows(state,
    { modelId: "grok", dcRows: ["xai-colossus-c1", "xai-colossus-ii"], fill: "generic-us" });
  const composed = E.coverageForFleetSections(fleet.sections, "grok");
  assert("T4-COV-8 the composed path emits the same three-part field names",
    ["namedSiteServingEvidencePct", "programmeTypeEvidencePct", "genericFillPct",
      "skuWorkloadCountBackedPct"].every((key) => key in composed), JSON.stringify(Object.keys(composed)));
  assert("T4-COV-8 a composed Grok fleet still rests on zero named-site SERVING evidence",
    close(composed.namedSiteServingEvidencePct, 0), JSON.stringify(composed));
  assert("T4-COV-8 both paths render through the one sentence function",
    typeof E.coverageSentenceParts(composed).sentence === "string"
      && E.coverageSentenceParts(composed).mode === "three-part-plus-count-backed");
}

console.log(failures ? `\n${failures} DC-COVERAGE-RESOLVER T4 FAILURE(S)` : "\nALL DC-COVERAGE-RESOLVER T4 TESTS PASS");
process.exit(failures ? 1 : 0);
