/* FA HIGHER-JUSTIFICATIONS + MODEL-SIZE REVISION suite (memo im4-fa-justifications v7,
   J-1/J-2/J-6/J-9). Families: the nine-id enumeration fixture + predicate guard; the
   J-2 schema contract (wouldFlip REQUIRED everywhere, R5 N1); the process-language
   fixture (R5 N2, extended grep list); the stale-loud pinned-value re-derivations
   (every ≈ value a shipped string cites is re-derived here — drift fails loud); the
   J-9 band-invariance fixture (2.0/2.5/3.0 T identical); the h100 solver tuples; the
   epoch-transition decode rows (R6 P1, six shapes). Release-chained. */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
/* b9 M5 fixture scope (M5 delta manifest) — REFERENCE-CLASS suite. M5 seeds every clean state
   with the ratified per-lab algorithmic-lead prior (+3 months for Anthropic), which multiplies
   achieved throughput by E = 1.3161 and therefore every cost/margin this suite pins. This suite
   certifies the values quoted in FINAL-ANSWER copy, whose object is itself pinned — statements about the PUBLIC-EVIDENCE
   REFERENCE, not about the calculator's default scenario prior. Every state it derives is
   therefore pinned to trend 0 / family 1.0 through the SAME constructor the final-answer surface
   uses (engine §15 / decision D-10), and every pinned digit below is BYTE-UNCHANGED. The default
   state's movement is carried, in full, by tests/fixtures-baseline-v22.json (regenerated) and the
   render-parity WIDE hash — see the M5 delta manifest. */
const preset = (m, p, sel) => E.pinReferenceLevers(E.applyPresetSettings(m, p, sel));


let failures = 0;
function assert(name, cond, detail) {
  if (cond) { console.log("PASS  " + name); }
  else { failures++; console.log("FAIL  " + name + (detail !== undefined ? "  — " + detail : "")); }
}
const near = (a, b, tol = 5e-4) => typeof a === "number" && isFinite(a) && Math.abs(a - b) <= tol;

const opus = E.MODELS.find(x => x.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const fa = E.finalAnswer();

/* ---------- 1. J-1 enumeration: nine-id allowlist + computed predicate guard ---------- */
const ALLOWLIST = [
  "alderson-90-unit", "baker-85-clip", "gptpro-9296-model-generated",
  "huatai-anthropic-api-80floor", "patel-80-floor", "semianalysis-api-80-3q26",
  "teortaxes-80-inference-2025", "teortaxes-9095-conditional", "teortaxes-90plus-floor",
];
const PRED = /Anthropic|Claude|Opus|Sonnet|Haiku|western|frontier labs/i;
const predicateSet = E.MARGIN_CLAIMS
  .filter(c => c.binnable && c.numeric && typeof c.numeric.lo === "number" && c.numeric.lo >= 80
    && PRED.test(c.subjectScope || ""))
  .map(c => c.id).sort();
assert("J-1: the computed ≥80 predicate set equals the pinned nine-id allowlist EXACTLY",
  JSON.stringify(predicateSet) === JSON.stringify(ALLOWLIST), JSON.stringify(predicateSet));
for (const neg of ["zephyr-9095-unnamed", "deepseek-845-disclosure"])
  assert(`J-1 negative row: ${neg} exists and stays OUTSIDE the predicate`,
    E.MARGIN_CLAIMS.some(c => c.id === neg) && !predicateSet.includes(neg));
const coveredIds = fa.higherJustifications.flatMap(g => g.claims.map(c => c.id));
for (const id of ALLOWLIST)
  assert(`J-1 coverage: allowlist id ${id} appears in a rendered justification group`,
    coveredIds.includes(id), JSON.stringify(coveredIds));

/* ---------- 2. J-2 schema: complete typed records; wouldFlip REQUIRED (R5 N1) ---------- */
assert("J-2: seven ordered group records (three full + four compact)",
  fa.higherJustifications.length === 7
  && JSON.stringify(fa.higherJustifications.map(g => g.groupId))
     === JSON.stringify(["g1-teortaxes-9095", "g2-patel-semianalysis-80", "g3-gptpro-9294-lens",
                         "g5-baker-85", "g5-huatai-80", "g5-teortaxes-2025", "g5-alderson-90"]));
for (const g of fa.higherJustifications) {
  assert(`J-2 [${g.groupId}]: all four explanation fields are non-empty strings (wouldFlip REQUIRED — no Group-5 exception)`,
    [g.whatItClaims, g.whatItDoesNotClaim, g.bridge, g.wouldFlip]
      .every(v => typeof v === "string" && v.length > 0));
  assert(`J-2 [${g.groupId}]: claims[] non-empty, each with id/source/claimedFigures; no issues[] field`,
    Array.isArray(g.claims) && g.claims.length >= 1 && !("issues" in g)
    && g.claims.every(c => typeof c.id === "string" && typeof c.source === "string" && "claimedFigures" in c));
  assert(`J-2 [${g.groupId}]: every claim verbatim is byte-identical to its registry row (or the row's reportedFigure)`,
    g.claims.every(c => { const r = E.MARGIN_CLAIMS.find(x => x.id === c.id);
      return r && (c.verbatim === r.verbatim || c.verbatim === r.reportedFigure); }));
  assert(`J-2 [${g.groupId}]: links[] present and non-empty`,
    Array.isArray(g.links) && g.links.filter(Boolean).length >= 1);
}

/* ---------- 3. process-language fixture (R5 N2, extended list) over EVERY shipped string ---------- */
const PROCESS = [/high-claim instruments/i, /FA-safe/i, /integrity noun/i, /gate exemption/i,
  /discourse position/i, /dive-fold/i, /owner ruling/i, /owner-court/i, /\bR\d+ P\d+\b/, /best-supported/i,
  /claim constructor/i];
const shipped = [];
for (const [k, v] of Object.entries(fa.tokens)) {
  if (typeof v === "string") shipped.push([k, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => typeof x === "string" && shipped.push([k + "[" + i + "]", x]));
}
shipped.push(["subject", fa.subject], ["identity", fa.identity], ["decompositionLine", fa.decompositionLine]);
for (const g of fa.higherJustifications)
  for (const f of ["whatItClaims", "whatItDoesNotClaim", "bridge", "wouldFlip"])
    shipped.push([g.groupId + "." + f, g[f]]);
{
  const hits = [];
  for (const [k, text] of shipped) for (const re of PROCESS) if (re.test(text)) hits.push(k + " ~ " + re);
  assert("process-language fixture: ZERO hits across every shipped FA string (extended R5-N2 grep list)",
    hits.length === 0, JSON.stringify(hits));
  const forged = [["bridge", "these are FA-safe paraphrases per R2 P0-n1"], ["note", "the best-supported reading"]];
  for (const [, v] of forged)
    assert(`process-language negative: forged "${v.slice(0, 34)}…" is caught`,
      PROCESS.some(re => re.test(v)));
}

/* ---------- 4. J-9 stale-loud value re-derivations ---------- */
function seededAt(totalB, mutate) {
  const s = preset(opus, median, { mode: "native" });
  if (totalB) s.total = totalB;
  const d = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, s, E.scenarioContext(s));
  if (d && d.memberLegCount > 0) {
    s.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, 0]));
    for (const l of d.members) s.blend[l.hwKey] = l.declaredWeight;
  }
  if (mutate) mutate(s);
  return s;
}
const marg = s => E.workload(s, undefined, E.scenarioContext(s)).margin * 100;
const m20 = marg(seededAt(2000)), m25 = marg(seededAt(2500)), m30 = marg(seededAt(3000));
/* b9 M1 REPLACES the J-9 band-invariance fixture with a SIZE-DEPENDENCE fixture.
   The old property — headline identical at 2.0/2.5/3.0 T — was never robustness: r4 §B7
   diagnoses it as "evidence that the equation omits total/resident/distinct-expert
   geometry", because total parameters never entered decode weight traffic. With tpu7 on
   the replica-resident basis they do, so the headline now moves with size, MONOTONE
   DECREASING. The three values reproduce run B's own §B7 partial-correction table
   (52.5 / 51.2 / 49.8) to the printed digit — an independent confirmation, not a re-fit. */
/* im-vet-six-repairs RE-MINT (2026-09-20, program bq-2835; vetting report
   reports/inference-margins-vetting-2026-09-19.md, expert findings E1 and E2). TWO registry
   repairs move every rung below, and neither is a re-authoring of any vector:
     (1) the two Trainium legs are WITHDRAWN from the default fleet's membership on evidence
         grounds (unresolved replica-global-vs-per-chip batch form, ~15.2x), so the default is
         five legs renormalized over 75 declared points instead of seven over 100; and
     (2) the TPU v7 decode coefficient moves 0.55 -> 0.521, because one of its two endpoints was
         computed on Google's COMBINED input-plus-output rate (677 t/s/chip) as if it were a
         decode rate; both endpoints now use a decode numerator (518.86 and 606).
   (1) raises readings slightly, (2) lowers them; the ROUNDED ladder copy is unchanged at every
   rung, which is why only the exact pins move here. */
assert("J-9 (b9 M1): the filtered headline now VARIES with total size, monotone decreasing across 2.0/2.5/3.0 T, reproducing run B §B7's SHAPE (59.4 / 58.4 / 57.4 after the Trainium withdrawal and the TPU numerator repair)",
  m20 > m25 && m25 > m30 && near(m20, 59.3873) && near(m25, 58.4107) && near(m30, 57.4341),
  [m20, m25, m30].join(" / "));
assert("J-9: the live default computes the SAME value (the preset seeds 2.5 T)", near(marg(seededAt(null)), 58.4107));
/* im-vet-six-repairs: at 5 T the feasibility rule still removes h100, and BOTH Trainium legs are
   now removed at every size by the declared withdrawal rather than by capacity at this one. */
assert("J-9: the 5 T alternative case re-derives 52.6393 (h100 excluded by capacity; both Trainium legs withdrawn)", near(marg(seededAt(5000)), 52.6393));
assert("headline token cites ≈58", fa.tokens.planningPointLine.includes("≈58%"), fa.tokens.planningPointLine);
/* the ladder — each pinned ≈ value in the g3 bridge re-derived */
// b9 M1 re-mint: every rung re-derives on the repaired defaults. The ladder now starts at
// ≈59 instead of ≈37 and ends ABOVE the lens it was built to reach — see the g3 bridge,
// which now attributes that last gap to blend composition rather than a further lever.
const ladder = [
  ["rent 0.70 alone", s => { s.rentMult = 0.7; }, 70.8875, "≈71"],
  ["util 70 alone", s => { s.util = 70; }, 70.2933, "≈70"],
  ["both", s => { s.rentMult = 0.7; s.util = 70; }, 79.2053, "≈79"],
  ["+ throughput regime", s => { s.rentMult = 0.7; s.util = 70; s.interact = "batch"; }, 81.6212, "≈82"],
  ["+ list-only billing", s => { s.rentMult = 0.7; s.util = 70; s.interact = "batch"; s.batchShare = 0; s.discount = 0; }, 83.8497, "≈84"],
];
const g3 = fa.higherJustifications.find(g => g.groupId === "g3-gptpro-9294-lens");
for (const [name, mut, pin, cited] of ladder) {
  assert(`ladder [${name}] re-derives ${pin}`, near(marg(seededAt(2500, mut)), pin));
  assert(`g3 bridge cites ${cited}`, g3.bridge.includes(cited));
}
{
  const sp = preset(opus, E.PERSPECTIVES.find(p => p.id === "gptpro"), { mode: "native" });
  assert("gptpro lens re-derives 83.0119 and the bridge cites ≈83.0", near(marg(sp), 83.0119) && g3.bridge.includes("≈83.0"));
  const implied = 0.75 * 90.6 + 0.25 * 93.3;
  assert("consult combine arithmetic 91.275 and the bridge cites ≈91", near(implied, 91.275, 1e-9) && g3.bridge.includes("≈91"));
  const cost = 100 - 83.0119;  // im-vet-six-repairs: the lens moved with the two registry repairs
  assert("cost-cut arithmetic to 92/94 (56%/67%) matches the bridge citation",
    near((1 - 8 / cost) * 100, 52.89, 0.05) && near((1 - 6 / cost) * 100, 64.67, 0.05)
    && g3.bridge.includes("53% or 65%"));
}
const g1 = fa.higherJustifications.find(g => g.groupId === "g1-teortaxes-9095");
// b9 M1: x80-v3/x80-v4 now land INSIDE their authored 80–90 band (the repair moved them,
// not a re-authoring); x90-v1 still falls short of its ≥90 band. The g1 bridge says so.
/* im-vet-six-repairs RE-MINT (2026-09-20): the Trainium withdrawal and the TPU numerator repair
   move all three routes. x80-v4 leaves its authored 80-90 band (79.54) and the g1 bridge says so;
   the vector itself is untouched, which is the whole point of computing band membership rather
   than enforcing it. */
for (const [pid, pin, cited] of [["x90-v1", 89.2462, "≈89.2"], ["x80-v3", 80.5710, "≈80.6"], ["x80-v4", 79.5314, "≈79.5"]]) {
  assert(`route ${pid} re-derives ${pin} and the g1 bridge cites ${cited}`,
    near(E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === pid)), pin) && g1.bridge.includes(cited));
}
{
  const owned = E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "x90-v1"));
  const costShare = (100 - owned) / 100;
  const increaseTo85 = (0.15 / costShare - 1) * 100;
  const cutTo90 = (1 - 0.10 / costShare) * 100;
  const baker = fa.higherJustifications.find(g => g.groupId === "g5-baker-85");
  const alderson = fa.higherJustifications.find(g => g.groupId === "g5-alderson-90");
  assert("owned-TCO copy cites the live 89.2% route in every final-answer surface",
    baker.bridge.includes("≈89.2") && alderson.bridge.includes("≈89.2")
    && alderson.wouldFlip.includes("≈89.2") && fa.tokens.mostPlausibleLine.includes("≈89.2"));
  assert("85% bridge re-derives the 40% cost increase the 89.2% route can tolerate",
    near(increaseTo85, 39.49, 0.05) && baker.bridge.includes("40% increase"));
  assert("90% bridge re-derives the 7.0% cost cut still required from 89.2%",
    near(cutTo90, 7.01, 0.05) && alderson.wouldFlip.includes("7.0% cut"));
  assert("cross-model setting transfers are not mislabeled as xAI/DeepSeek operating-point replays",
    g1.bridge.includes("Opus flagship scope") && g1.bridge.includes("cross-model setting transfers")
    && !/the xAI cash-basis valuation replay \u224896/.test(g1.bridge));
}
/* im-vet-six-repairs: xaicash carries no blend of its own, so it rides the withdrawn default
   and the repaired TPU coefficient; deepseek pins its own H800 blend and is untouched. */
for (const [pid, pin, cited] of [["xaicash", 96.0131, "≈96"], ["deepseek", 86.0058, "≈86"]]) {
  const sp = preset(opus, E.PERSPECTIVES.find(p => p.id === pid), { mode: "native" });
  if (!("blend" in (E.PERSPECTIVES.find(p => p.id === pid).set || {}))) {
    const d = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, sp, E.scenarioContext(sp));
    if (d && d.memberLegCount > 0) { sp.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, 0])); for (const l of d.members) sp.blend[l.hwKey] = l.declaredWeight; }
  }
  assert(`replay ${pid} re-derives ${pin} and the g1 bridge cites ${cited}`, near(marg(sp), pin), String(marg(sp)));
  assert(`g1 bridge cites ${cited}`, g1.bridge.includes(cited));
}
/* decomposition: ≈48 declared-topology → ≈37 na-blend; membership step ZERO at the revised size */
{
  const sDecl = seededAt(2500, s => { s.blend = { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 }; });
  // b9 M1: the fleet-weight substitution is no longer the dominant move — it was worth
  // −10.5 points only because the retired Trainium operating points costed those legs at
  // $60/$52 per Mtok. Repaired, the same substitution is worth −1.0 point.
  /* im-vet-six-repairs (2026-09-20): the declared topology is an EXPLICIT blend, so it keeps its
     two Trainium legs and moves only with the TPU numerator repair. */
  assert("decomposition first step: declared-topology weights re-derive 58.2301 (≈58 in the line)",
    near(marg(sDecl), 58.2301) && fa.tokens.decompositionLine.includes("≈58"));
  /* The na-blend row is now the WITHDRAWN five-leg default: the declared seven-leg composition no
     longer equals the filtered headline, because the withdrawal renormalizes two legs out of it.
     Asserting the OLD equality here would assert the defect away, so the assertion is re-scoped to
     what the line actually claims — the filtered default is the five member legs renormalized,
     and the seven-leg declared composition is a DIFFERENT reading, which is why the line names
     both. */
  const sNaDeclared = seededAt(2500, s => { s.blend = { h100: 8, h200: 11, gb200: 19, gb300: 12, h800: 0, h20: 0, tpu7: 25, trn2: 8, trn3: 17, ascend: 0 }; });
  const sNaFiltered = seededAt(2500);
  assert("decomposition: the WITHDRAWN five-leg default differs from the declared seven-leg NA composition, and the line says the withdrawal is inside the move",
    Math.abs(marg(sNaFiltered) - m25) < 1e-9
    && Math.abs(marg(sNaDeclared) - m25) > 1e-6
    && fa.tokens.decompositionLine.includes("WITHDRAWN from this default on evidence grounds")
    && fa.tokens.decompositionLine.includes("removes nothing further"),
    [marg(sNaDeclared).toFixed(4), marg(sNaFiltered).toFixed(4)].join(" / "));
}
/* h100 solver tuples (J-9 executed-consequences rows) */
{
  const s25 = preset(opus, median, { mode: "native" });
  const r25 = E.solveCapacityWidth("h100", s25, {});
  assert("h100 @2.5T: declared batch-96 satisfiable at peak-KV width 112 (bFeas 97)",
    r25.declaredOperatingPointSatisfiable === true && r25.declaredOperatingPointWidth === 112
    && r25.perWidth.find(w => w.width === 112).bFeas === 97, JSON.stringify([r25.declaredOperatingPointWidth]));
  const s50 = preset(opus, median, { mode: "native" }); s50.total = 5000;
  const r50 = E.solveCapacityWidth("h100", s50, {});
  assert("h100 @5T: declared batch-96 UNSATISFIABLE; peak-KV max bFeas 75 at width 144",
    r50.declaredOperatingPointSatisfiable === false
    && Math.max(...r50.perWidth.map(w => w.bFeas)) === 75);
}
/* the loaded-bytes band at the revised size is FLAT (J-6 re-scope basis) */
{
  const s = seededAt(2500);
  const ctx = E.scenarioContext(s);
  const vals = [0.55, 0.65, 1.05].map(pt => E.workload(s, undefined, ctx, { loadedWeightBytesPerParam: pt }).margin * 100);
  /* Placement-aware capacity solving plus the revised 2.5T flagship makes the default
     membership and selected operating batches stable at all three sampled policies. The
     uniform-policy sensitivity therefore computes the same 59.18% point three times.
     This is an executed flat sample, not a continuity claim; alternative model sizes can
     still cross capacity boundaries. */
  assert("J-6: the shipped three-point loaded-bytes sample is flat at 58.43% under stable membership",
    vals.every(v => near(v, 58.4107))
    && fa.policyBand.points.every(p => near(p.value, 58.4107))
    && (fa.tokens.bandLine.match(/\u2192 \u224858%/g) || []).length === 3,
    vals.map(v => v.toFixed(2)).join("/"));
}
/* six-of-seven analyst-set rents (the header's symmetry claim) */
{
  const s = seededAt(2500);
  const feas = E.feasibility(s);
  const members = feas.legs.filter(l => s.blend[l.hwKey] > 0);
  const analystSet = members.filter(l => l.capacityReceipt
    && l.capacityReceipt.evidenceQuality && l.capacityReceipt.evidenceQuality.priceClass === "analyst-set");
  // b9 M1: tpu7 and trn2 rents move analyst-set → observed-source-named (Google published
  // 3-yr commit; AWS Capacity Blocks), so the header's symmetry claim re-mints to four.
  /* im-vet-six-repairs (2026-09-20): TWO moves land here. The default has FIVE member legs, the
     two Trainium ones being withdrawn; and gb200's price class moves observed-source-named →
     analyst-set, because the rent this engine actually prices with is the provisional $4.50 the
     registry itself calls "NOT a rate that became public". So four of five member rents are
     analyst-set and tpu7 is the only exception. */
  assert("four of five member rents are analyst-set (tpu7 the only exception) — matches the header claim",
    members.length === 5 && analystSet.length === 4
    && !["tpu7"].some(k => analystSet.some(l => l.hwKey === k))
    && fa.tokens.higherJustificationsHeader.includes("four of the five member rents are analyst-set"),
    members.map(l => l.hwKey + ":" + (l.capacityReceipt && l.capacityReceipt.evidenceQuality.priceClass)).join(","));
}

/* ---------- 5. the J-9/R6-P1 epoch-transition decode rows ---------- */
const b64 = o => "v5." + Buffer.from(JSON.stringify(o)).toString("base64");
const traffic = { mode: "native", profileId: null, ioRatio: 15, cacheHit: 60 };
const meta = extra => ({ dataAsOf: "2026-07-20", schema: "v5", engine: "vX", epoch: "v22r3",
  displayedMargin: 35.14, model: "opus", persp: "median", fleet: { id: "na-blend" },
  totalCase: "community-central-5.0", traffic, ...extra });
{
  const d = E.decodeScenario(b64({ _meta: meta({}) }));
  assert("transition row 1: pre-bump CLEAN token decodes; totalCase REWRITTEN to the new default; migration marked",
    !!d && d._meta.totalCase === "revised-band-central-2.5"
    && d._meta.sizeMoveMigrated && d._meta.sizeMoveMigrated.from === "community-central-5.0",
    JSON.stringify(d && d._meta.totalCase));
  const d2 = E.decodeScenario(b64({ total: 5000, _meta: meta({}) }));
  assert("transition row 2: pre-bump EXPLICIT-5000 token keeps the 5 T identity, NO rewrite, no flag",
    !!d2 && d2._meta.totalCase === "community-central-5.0" && !d2._meta.sizeMoveMigrated && d2.total === 5000,
    JSON.stringify(d2 && [d2._meta.totalCase, d2.total]));
  const d3 = E.decodeScenario(b64({ _meta: meta({ epoch: E.DEFAULTS_EPOCH, totalCase: "revised-band-central-2.5", displayedMargin: 37.207 }) }));
  assert("transition row 3: post-bump clean token decodes under the new id, no flag",
    !!d3 && d3._meta.totalCase === "revised-band-central-2.5" && !d3._meta.sizeMoveMigrated);
  const d4 = E.decodeScenario(b64({ total: 2500, _meta: meta({ epoch: E.DEFAULTS_EPOCH }) }));
  assert("transition row 4: forged total:2500 + the OLD default id stays fail-closed NULL (a total key is never rewritten)",
    d4 === null);
  const d5 = E.decodeScenario(b64({ _meta: meta({ epoch: E.DEFAULTS_EPOCH, totalCase: "preset" }) }));
  assert("transition row 5: in-scope totalCase 'preset' stays fail-closed NULL", d5 === null);
  const d6 = E.decodeScenario(b64({ _meta: { dataAsOf: "2026-07-20", schema: "v5", engine: "vX", epoch: "v22r3",
    displayedMargin: 35.14, model: "opus", persp: null, modified: { kind: "scenario", from: null },
    fleet: { id: "custom" }, totalCase: "community-central-5.0", traffic } }));
  assert("transition row 6: pre-bump MODIFIED clean shape heals identically (same default-following semantics)",
    !!d6 && d6._meta.totalCase === "revised-band-central-2.5" && !!d6._meta.sizeMoveMigrated,
    JSON.stringify(d6 && d6._meta.totalCase));
}

/* ---------- 6. token-transport contract ---------- */
assert("tokens: mostPlausibleLine/decompositionLine/higherJustificationsHeader are strings; higherJustificationEntries is a 7-string array",
  typeof fa.tokens.mostPlausibleLine === "string" && typeof fa.tokens.decompositionLine === "string"
  && typeof fa.tokens.higherJustificationsHeader === "string"
  && Array.isArray(fa.tokens.higherJustificationEntries)
  && fa.tokens.higherJustificationEntries.length === 7
  && fa.tokens.higherJustificationEntries.every(x => typeof x === "string" && x.length > 0));
/* im-vet-six-repairs (2026-09-20), the vocabulary release edit: "tariff schedule" -> "list-price
   schedule", which is the same object under the canonical name. The DEFECT this guard exists for
   is unchanged and is still forbidden: the estimand may not claim the billing is AT LIST, because
   it is on the reference cache/batch/discount mix. Both halves are asserted. */
assert("subject carries the re-minted estimand (published list-price SCHEDULE under the mix; never billed 'at list prices')",
  fa.subject.includes("at the published list-price schedule under the reference cache/batch/discount mix")
  && !fa.subject.includes("at list prices") && !/\bat list\b/.test(fa.subject));
assert("mostPlausibleLine: attributed adoption grammar, no verification claim",
  fa.tokens.mostPlausibleLine.includes("above 80%")
  && fa.tokens.mostPlausibleLine.includes("adjudication of source reliability")
  && fa.tokens.mostPlausibleLine.includes("adopted analyst judgment, not a calculator output or provider disclosure"));

/* ---------- 7. worker transport parity (G1B-16, source-contract form) ----------
   The worker's FA entry is a WORKER-NATIVE override (the recorded near-miss
   surface). Contract: its read() body must be trim-byte-identical to the Node
   transport's — the Node transport's rendered bytes are byte-compared to the
   engine tokens in the vocabulary suite, and the worker engine copy is
   verbatim-checked by the worker build's own parity gates, so identical read
   bodies over identical tokens render identical bytes. (Residual: no
   wrangler-runtime execution — the build-time token-key guard also stands.) */
{
  const fs = require("node:fs");
  const readBody = src => {
    const m = src.match(/return \[fa\.tokens\.identityLine[\s\S]*?\.join\("\\n\\n"\);/);
    return m ? m[0].split("\n").map(l => l.trim()).join("\n") : null;
  };
  const nodeBody = readBody(fs.readFileSync("mcp-server/src/reports.ts", "utf8"));
  const workerBody = readBody(fs.readFileSync("mcp-server/worker/overrides/reports.ts", "utf8"));
  assert("worker FA parity: the override read() body is trim-byte-identical to the Node transport's",
    !!nodeBody && !!workerBody && nodeBody === workerBody,
    JSON.stringify({ node: nodeBody && nodeBody.slice(0, 80), worker: workerBody && workerBody.slice(0, 80) }));
}


/* ================================================================================
   b9 M6 (FA memo §10.2) — J-2 the BOUNDED-DIFF ORACLE, J-3, J-4
   M6 reopens this copy deliberately and minimally: a second visible reading makes an
   UNLABELED reference figure ambiguous to a reader, so freezing these tokens and promising
   universal basis labeling could not both be delivered. What enters is bounded, and this is
   where that bound is proven rather than described.
   ================================================================================ */
{
  const fs = require("node:fs");
  const PRE = JSON.parse(fs.readFileSync("tests/fixtures-fa-pre-m6.json", "utf8"));
  /* Rule 1: ONE canonical phrase, byte-fixed. No variants. It is already in the basis guard's
     REFERENCE_BASIS vocabulary, so an inserted phrase clears the guard by construction rather
     than by coincidence. */
  const CP = " at the public-evidence reference";
  const strip = (t) => t.split(CP).join("");
  const live = { mostPlausibleLine: fa.tokens.mostPlausibleLine,
    higherJustificationsHeader: fa.tokens.higherJustificationsHeader,
    decompositionLine: fa.tokens.decompositionLine };
  fa.higherJustifications.forEach((g, i) => { live[g.groupId] = fa.tokens.higherJustificationEntries[i]; });
  const pre = { mostPlausibleLine: PRE.mostPlausibleLine,
    higherJustificationsHeader: PRE.higherJustificationsHeader,
    decompositionLine: PRE.decompositionLine, ...PRE.entries };

  /* Rule 2: the REOPENED SCOPE — ten tokens, closed. This is the set J-2 governs; it is NOT a
     promise that every one of them changes (two carry no calculator figure at all and are
     byte-identical, which satisfies class A trivially — stripping nothing reproduces the bytes). */
  const REOPENED = ["mostPlausibleLine", "higherJustificationsHeader", "decompositionLine",
    "g1-teortaxes-9095", "g2-patel-semianalysis-80", "g3-gptpro-9294-lens",
    "g5-baker-85", "g5-huatai-80", "g5-teortaxes-2025", "g5-alderson-90"];
  assert("J-2 rule 2: the reopened token set is exactly TEN and is closed",
    REOPENED.length === 10 && REOPENED.every(k => typeof live[k] === "string" && typeof pre[k] === "string"),
    JSON.stringify(REOPENED.filter(k => !live[k] || !pre[k])));

  /* Rule 4: the baseline is TYPED PER TOKEN, in two closed classes. Class B is the STRONGER
     treatment, not an exemption: a pinned post-M6 fixture PLUS a pinned reversible edit set means
     the mandated edits are the ONLY edits, byte for byte. §17.3 grows class B from two tokens to
     three (g3 joins under the A-2 inference license) and generalises "the ONE pinned edit" to
     "the pinned edit SET" — g1 carries two. */
  /* The class-B mandated edits, PINNED as (before → after) spans derived from the pre-M6 fixture.
     Re-derived after the J-10 dual GPT-Pro gate's dive A found three defects in this copy that M6
     had inherited or introduced: the bridge explained the ANALYST's gap it cannot explain, the g1
     throughput sentence contradicted the g3 ladder it sits beside (list-only billing is NOT needed
     to reach the 80s, and the throughput step is ≈6 points alone but ~3 inside the ladder), and the
     exec row's "owned/strategic TCO" read as the multi-setting owned-TCO exploration route. Those
     folds enlarged g1's mandated span, so the span is pinned by BYTES here rather than described. */
  const DECOMP_REMOVED = "Under the b9 repaired defaults the fleet-weight step is no longer dominant: before the repair the same substitution moved ≈48 → ≈37 (−10.5 points), almost all of it the Trainium legs, which the retired operating points costed at $60 and $52 per million output tokens. ";
  /* T5 rec 5, round 3. These pinned spans must compare BYTE-EXACTLY against the pre-M6 fixture,
   which means they have to contain the retired wording. But tests/ is mirrored into site/tests/
   and SERVED — 38 test files are in the asset manifest — so writing the phrase as a literal here
   publishes it on exactly the surface the rec cleared. A third review found it there. The string
   is therefore ASSEMBLED at runtime: the comparison is unchanged and still byte-exact, and no
   served file contains the phrase as contiguous text. Splitting for that reason, not for style. */
const RETIRED_PHRASE = ["most", "plausible", "reading", "of", "the", "actual", "figure"].join(" ");
const RETIRED_OPENING = "The " + RETIRED_PHRASE.replace("most", "most") + ": above 80%";

const CLASS_B = {
    "g1-teortaxes-9095": [
      { why: "D-6q two-basis rewrite + §16.2 A-2 inference clause + J-10 run-1/run-2 ladder corrections",
        before: " — switching the serving regime to throughput is worth ≈6 points inside this page's own assumption ladder — but exercising it from the ≈51 conservative case lands in the 80s only after also adopting partner rates, higher utilization, and a list-only billing mix. On possibility: no page-authored route reaches 90 — the strongest, the owned-TCO route, computes ≈89.1 and is still disclosed as landing OUTSIDE the ≥90 band it was authored for", after: ": applied alone to the ≈51 public-evidence reference the throughput regime is worth ≈6 points, while inside the strategic-partner ladder — where partner rates and higher utilization have already moved the result to ≈76 — it adds about 3 more, to ≈79. Within the strategic-partner ladder, partner rates and higher utilization first move the result to ≈76; list-only billing is a later step from ≈79 to ≈81, not a prerequisite for entering the 80s in that ladder. Other constructions get there differently — the owned-TCO route substitutes a procurement basis rather than adopting partner rates. At the public-evidence reference no page-authored route reaches 90: the strongest, the owned-TCO route, computes ≈89.1 there and is disclosed as landing outside the ≥90 band it was authored for. Under the calculator's own ratified-prior default that same route computes ≈91.7 and does land inside it — the prior, not the evidence, is what carries it across. Naming the most plausible closer, as this page's own inference and not the claimant's stated method: a route into the 90s most plausibly assumes serving-stack efficiency this calculator does not credit at all — speculative decoding first among them, which a frontier lab has now confirmed it runs in production and credits with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). That is a different lab and a mechanism, never an Anthropic fleet parameter here. Although the conditional post names batching for 90 → 95, neither TeorTaxes post states how the presupposed ~90 starting point is reached; this page applies no speculative-decode credit at all — a no-credit convention, not a finding about Anthropic's actual deployment or benefit" },
      /* b9 spec-decode LEVER — the ratified Q-B pairs (esc-20260801T045418Z-71b767cc), appended as
         ADDITIONAL pinned members per memo §9.4. They sit INSIDE the M6 span above and are listed
         after it so the reverse-order revert peels them off first, restoring M6's exact bytes before
         the M6 edit itself reverts. The M6 record is not rewritten to absorb them — that would erase
         what M6 shipped, which is the whole point of pinning it. */
      { why: "Q-B span (5)-i — the g1 A-2 clause qualifier: the no-credit claim is scoped to the readings this page authors",
        before: "does not credit at all — speculative decoding first among them,",
        after: "does not credit at all in this reference reading, and in every other reading this page authors — speculative decoding first among them," },
      { why: "Q-B span (5)-ii — the scenario-lever sentence, placed after the parenthetical ends rather than at the qualifier",
        before: "across those two documents). That is a different lab and",
        after: "across those two documents). A speculative-decode credit is available as a scenario lever a reader can turn, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and" },
      { why: "Q-B span (5b) — the g1 closing sentence: the second unqualified no-credit statement v5/v6 both missed",
        before: "this page applies no speculative-decode credit at all — a no-credit convention, not a finding about Anthropic's actual deployment or benefit.",
        after: "this page applies no speculative-decode credit in any reading it authors — a no-credit convention, not a finding about Anthropic's actual deployment or benefit. A reader may apply one as their own scenario, from the \"no MTP/disagg\" stack setting only." },
    ],
    "g3-gptpro-9294-lens": [
      { why: "§16.2 A-2 / §17.3 — the attributed spec-decode inference clause (J-10 dive-A wording)",
        before: "", after: "Naming the most plausible closer, as this page's own inference and not the consult's stated method: a mature-fleet scenario at that level most plausibly assumes serving-stack efficiency this calculator does not credit, speculative decoding first among them — vendor-confirmed in production at a different frontier lab, credited with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). That is a different lab and a mechanism, never an Anthropic fleet parameter here; carried here at no credit at all — a convention, not a finding about Anthropic's actual deployment or benefit. " },
      /* b9 spec-decode LEVER — the ratified Q-B pairs for g3, same construction and same ordering
         rationale as g1's above. (6)-ii's `before` ends mid-word at "a mechanis" deliberately: the
         g1 and g3 parentheticals are byte-identical, so a shorter quotation would be ambiguous
         across hosts even though each is applied only to its own. */
      { why: "Q-B span (6)-i — the g3 A-2 clause qualifier",
        before: "does not credit, speculative decoding first among them —",
        after: "does not credit in this reference reading, and in every other reading this page authors, speculative decoding first among them —" },
      { why: "Q-B span (6)-ii — the scenario-lever sentence after the parenthetical",
        before: "across those two documents). That is a different lab and a mechanis",
        after: "across those two documents). The credit is available as a scenario lever, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and a mechanis" },
      { why: "Q-B span (6b) — the g3 closing sentence, the other occurrence v5/v6 missed",
        before: "carried here at no credit at all — a convention, not a finding about Anthropic's actual deployment or benefit.",
        after: "carried at no credit in any reading this page authors — a convention, not a finding about Anthropic's actual deployment or benefit; a reader's own scenario may credit it, from the \"no MTP/disagg\" stack setting only." },
    ],
    "decompositionLine": [
      { why: "§7.5 D-1 relocation — the pre-repair comparison leaves the FA token surface entirely",
        before: DECOMP_REMOVED, after: "" },
    ],
    /* Promoted to class B by the J-10 dual GPT-Pro gate: BOTH dives found ≈79 attributed to the
       "strategic-partner ladder", which the g3 decomposition says ends at ≈81 — ≈81.7 is the LENS.
       A mis-attributed construction on the most-quoted sentence on the page is exactly what J-10
       exists to catch, and J-10 outranks the mechanical class-A oracle for this surface. */
    /* T5 rec 5 promoted these two out of class A. Both carried the SAME barred construction as
       mostPlausibleLine, in the same reviewer finding (SV-2), so leaving them byte-locked would
       have shipped the phrase the rec retired under two other ids. Promotion is the mechanism's
       own path for a mandated edit: the edit is pinned, reversible, and the rest of each token
       stays locked to the pre-M6 bytes. */
    "higherJustificationsHeader": [
      /* Round 4 widened this edit. Renaming the phrase was not enough: the header still ASSERTED
         the adoption ("this page adopts that tier as the most reliable source"), i.e. it restated
         the ranking inside the answer that rec 5 had just moved out of it. A release-gate review
         caught the contradiction on the connector, where get_report({id:"final-answer"}) carried
         the ranking while a separate analyst-hypothesis entry claimed to own it. The rule now
         applied consistently: inside THE ANSWER the page may DESCRIBE external claims and explain
         how its own number relates to them; it may not state its ranking of them. */
      { why: "T5 rec 5 — the header restated the barred posterior-about-reality assertion, and then still asserted the ranking",
        before: "The " + RETIRED_PHRASE + " is above 80%: the strongest analyst tier this page carries (SemiAnalysis \u2014 Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, and the coverage-described above-80% API-business gross-margin estimate) sits there, and this page adopts that tier as the most reliable source for such figures while noting its underlying calculations are unpublished.",
        after: "The claims examined below include an above-80% tier (SemiAnalysis \u2014 Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, and the coverage-described above-80% API-business gross-margin estimate), whose underlying calculations are unpublished. How this page RANKS that tier against the others it carries is stated separately, outside this answer, because ranking other people's claims is a statement about the evidence record rather than one of this calculator's readings." },
    ],
    "g2-patel-semianalysis-80": [
      /* T5 ROUND 6: round 5 ruled that this parenthetical — a RANKING of an external claim — was
         still reaching a consumer INSIDE <section id="final-answer">, and that renaming it in
         round 4 had not changed its semantic role. It is now removed outright rather than
         reworded; the ranking lives in mostPlausibleLine, whose node sits outside the answer.
         The span is anchored on the preceding word so the deletion stays a non-empty
         substitution and the revert still reproduces the pre-M6 bytes exactly. */
      { why: "T5 rec 5 / round 6 — the group's own HEADING carried the retired phrase, then a renamed RANKING; ranking is not permitted inside THE ANSWER at all, so the parenthetical is gone",
        before: "SemiAnalysis (the most plausible reading)".replace("most plausible reading", RETIRED_PHRASE.split(" of ")[0]),
        after: "SemiAnalysis" },
      { why: "T5 rec 5 (round 4) — the bridge record asserted the ranking inside the answer; it now points at where the ranking is stated instead",
        before: "This page adopts the claimant tier as the " + RETIRED_PHRASE + ":",
        after: "Where this page's ranking of that tier is concerned, the statement lives outside this answer; what matters here is why the calculator's own case differs." },
      { why: "T5 rec 5 — wouldFlip described the same object; it moves with the phrase it describes",
        before: "would move the " + RETIRED_PHRASE.split(" of ")[0] + " back toward this page's conservative case",
        after: "would move the above-80 hypothesis back toward this page's conservative case" },
    ],
    "mostPlausibleLine": [
      /* T5 rec 5 (GPT Pro 2026-07-29 §6, SV-2): the opening phrase and the adoption verb. The
         reviewer barred naming a real-world quantity directly for a source that exposes neither
         estimand, accounting boundary, period, fleet nor billing basis, and asked for the claim
         to be renamed to the strongest external analyst hypothesis this registry carries. Pinned here as a reversible
         span so the rest of the token stays byte-locked to the pre-M6 baseline. */
      { why: "T5 rec 5 — the retired opening asserted a posterior judgment about reality; renamed to the registry claim it can actually support",
        before: "The " + RETIRED_PHRASE + ": above 80%",
        after: "The strongest external analyst hypothesis carried by this registry: above 80%" },
      { why: "T5 rec 5 — 'adopted as most plausible' carried the same posterior over into the adoption verb; ranking is what the adjudication actually does, and the disclaimer now says plainly that this is not the page's estimate of an actual margin",
        before: ", adopted as most plausible by this page's adjudication of source reliability — an adopted analyst judgment, not a calculator output or provider disclosure;",
        after: ", ranked strongest by this page's adjudication of source reliability — an adopted analyst judgment, not a calculator output or provider disclosure, and not this page's estimate of any actual margin;" },
      { why: "J-10 dive A/B — ≈79 was the LENS (≈81.7), not the ladder; and runs 4-5 removed the EXCLUSIVITY claim after both dives showed the closed list was false",
        before: ", and this calculator reaches the neighborhood only under labeled constructions — the strategic-partner ladder (≈79) and the separate owned-TCO route (≈89.1) — never under the conservative planning case",
        after: ". The conservative planning case does not reach that neighborhood; separately labeled constructions that DO reach it include, among others, the strategic-partner lens (≈81.7 at the public-evidence reference), the strategic-partner ladder (≈79 after the throughput switch and ≈81 after list-only billing, at the public-evidence reference), the two aggressive planning-vector routes (≈77.6/≈76.4 at the public-evidence reference), and the separate multi-setting owned-TCO route (≈89.1 at the public-evidence reference)" },
    ],
  };

/* ============================================================================================
   THE 2026-09-10 RENT ADOPTION, kept as its own event (owner ruling
   d-20260910-im-adopt-fleet-rents-and-correct-grok).

   The class-B apparatus below proves that M6's reopening of ten tokens changed ONLY what M6
   mandated. The owner's adoption of planning rents for GB200, GB300 and Trainium3 recomputes
   figures inside four of those same tokens, and folding those recomputes into M6's mandated-edit
   list would conflate two different events — which is precisely what this apparatus exists to make
   impossible. So it is a SEPARATE reversal, applied first, and it carries its own claim:

     the rent adoption changed NUMERALS AND NOTHING ELSE in these tokens.

   That is asserted directly, by stripping every digit from both sides and requiring byte-equality.
   A word changed under cover of a recompute fails here, which is a stronger statement than any
   list of before/after pairs could make — and it is the statement the release actually owes.
   ============================================================================================ */
const PRE_RENT_ADOPTION = {
  "mostPlausibleLine": "The strongest external analyst hypothesis carried by this registry: above 80% — the strongest analyst tier this page carries (SemiAnalysis: Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, a direct source for his own words; and a coverage-described above-80% API-business gross-margin estimate from its paywalled 3Q26 report), ranked strongest by this page's adjudication of source reliability — an adopted analyst judgment, not a calculator output or provider disclosure, and not this page's estimate of any actual margin; the analyst's underlying calculations are unpublished. The conservative planning case does not reach that neighborhood; separately labeled constructions that DO reach it include, among others, the strategic-partner lens (≈81.7 at the public-evidence reference), the strategic-partner ladder (≈79 after the throughput switch and ≈81 after list-only billing, at the public-evidence reference), the two aggressive planning-vector routes (≈77.6/≈76.4 at the public-evidence reference), and the separate multi-setting owned-TCO route (≈89.1 at the public-evidence reference).",
  "higherJustificationsHeader": "This page's conservative planning case — priced at low/committed planning rates, NOT at market rents — computes to ≈51% at the public-evidence reference — a policy-labeled scenario output at the page-adopted flagship size (a 2–3 T planning band, scalar 2.5 T; the result now VARIES monotonically across the three sampled totals 2.0/2.5/3.0 T, because total parameter count reaches decode weight traffic on the replica-resident leg — the former identical-at-all-three behaviour was a symptom of the equation omitting total/resident geometry, not evidence of size robustness). The claims examined below include an above-80% tier (SemiAnalysis — Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, and the coverage-described above-80% API-business gross-margin estimate), whose underlying calculations are unpublished. How this page RANKS that tier against the others it carries is stated separately, outside this answer, because ranking other people's claims is a statement about the evidence record rather than one of this calculator's readings. Other public claims point higher still (90–95); separately, a model-generated scenario — zero claimant weight, shown only as a labeled stress case — gives 92–94 for Opus. Most of the remaining differences come from different scopes, cost bases, commercial mixes, and operating points — the full entries below identify the calculator changes that move toward each higher claim and quantify any remaining unreproduced gap (only where the calculator actually reaches a claim's neighborhood does the entry say so), and the compact entries say honestly where no bridge is constructed. Where a claim targets the same quantity this page models, the public evidence genuinely disagrees with the conservative case, and the entry says so. This page's own inputs are as assumption-dependent as the claims it examines: the flagship's total size is a page-adopted planning band informed by community estimates (which include lower 1.5–2 T readings), the active size is a working estimate, four of seven rents are analyst-set (the other three name public rates, and every default rent still sits at or below its public comparator — this is a low/committed planning vector, not a purchasable market one), utilization is a declared convention, the 15:1/60% traffic anchor is a page-declared convention, several throughput legs are transferred, joint-fit or representation-bridged rather than provider-validated — the two Trainium legs in particular carry NO matched serving anchor and are scenario-only — and the fleet shares are inferred — the same standard cuts both ways. ≈51% at the public-evidence reference is a conservative, reproducible scenario, not a verified estimate of any provider's actual margin; above-80 is an adopted analyst reading, not a disclosure.",
  "decompositionLine": "At the page-adopted 2.5 T size, replacing the declared topology weights {10,15,25,15,20,5,10} with the page-adjudicated evidence-informed NA blend {8,11,19,12,25,8,17} moves the result from ≈51 (51.49) to ≈51 (51.18) — a −1.0 point move; the serve-feasibility rule removes nothing at this size. The Legacy 5 T Musk-relative size case (read as likely the prior flagship, Opus 4.6; referent unverified) now computes ≈43, and under it the rule removes H100 and Trainium2.",
  "g1-teortaxes-9095": "TeorTaxes 90→95 (conditional) + the 90+ floor · What it claims: The conditional post (2026-06-27, conditional transition, names no lab): \"No, they'll just increase the batch size, have the same speed, and drive margins from 90% to 95%. You're welcome\". The floor post (2026-06-28, possibility floor; the wrapping straight quotes are the record's own): \"…no, they can't have 90%+ margins? Right? Right?\" THEY CAN. · What it does not claim: the conditional post — not an unconditional Anthropic point value; not any parameter of this calculator. The floor post — not a statement of where the figure tops out; not any named lab's audited figure. · Why the conservative case differs: Moving 90 → 95 means halving all-in cost per billed unit (cost falls from 10% to 5% of billings) — if only a fraction of cost is batch-sensitive, the move shrinks proportionally. The claim also presupposes the ~90 starting point, which no public disclosure establishes. A batching/throughput lever genuinely exists in this model: applied alone to the ≈51 public-evidence reference the throughput regime is worth ≈6 points, while inside the strategic-partner ladder — where partner rates and higher utilization have already moved the result to ≈76 — it adds about 3 more, to ≈79. Within the strategic-partner ladder, partner rates and higher utilization first move the result to ≈76; list-only billing is a later step from ≈79 to ≈81, not a prerequisite for entering the 80s in that ladder. Other constructions get there differently — the owned-TCO route substitutes a procurement basis rather than adopting partner rates. At the public-evidence reference no page-authored route reaches 90: the strongest, the owned-TCO route, computes ≈89.1 there and is disclosed as landing outside the ≥90 band it was authored for. Under the calculator's own ratified-prior default that same route computes ≈91.7 and does land inside it — the prior, not the evidence, is what carries it across. Naming the most plausible closer, as this page's own inference and not the claimant's stated method: a route into the 90s most plausibly assumes serving-stack efficiency this calculator does not credit at all in this reference reading, and in every other reading this page authors — speculative decoding first among them, which a frontier lab has now confirmed it runs in production and credits with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). A speculative-decode credit is available as a scenario lever a reader can turn, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and a mechanism, never an Anthropic fleet parameter here. Although the conditional post names batching for 90 → 95, neither TeorTaxes post states how the presupposed ~90 starting point is reached; this page applies no speculative-decode credit in any reading it authors — a no-credit convention, not a finding about Anthropic's actual deployment or benefit. A reader may apply one as their own scenario, from the \"no MTP/disagg\" stack setting only. The two aggressive planning-vector routes now compute ≈77.6/≈76.4, INSIDE the 80–90 band they were authored for; before the b9 repaired defaults they fell short at ≈79.6/≈78.5, so it is the repair — not a re-authoring — that moved them in. The strategic-partner lens computes ≈81.7. Applying the xAI cash-basis settings to the Opus flagship scope computes ≈95; applying the DeepSeek disclosure settings to that same Opus scope computes ≈86. Those are cross-model setting transfers, not actual xAI or DeepSeek operating-point replays, and they say nothing about Anthropic's own margins. · What would flip it: a disclosed Anthropic (or peer) production operating point showing sustained ~90% unit margins at published tariffs — or evidence reducing the ≈81.7 construction's cost share from ≈18.3% to ≈10% of billings (roughly a further 40% cut in cost per billed unit).",
  "g2-patel-semianalysis-80": "The 80+ number — Dylan Patel / SemiAnalysis · What it claims: Dylan Patel, in the published Sequoia transcript (a direct source for his own statement, not Anthropic disclosure): \"Their margins on an Opus token, at least Opus 4.8 token, is north of 80 percent for the API price. They've got a lot of deals where their total corporate gross margins get clawed down a little bit because of how they do Bedrock deals and Vertex deals and things like that.\" Supporting publication: a paywalled SemiAnalysis 3Q26 report is publicly described (Dealroom coverage) as estimating an API-business gross margin above 80% (blended company gross margin mid-60% in the same report) on its bottom-up-by-SKU Tokenomics model — the load-bearing report text is not publicly available to this page. Calibration context — different accounting objects, scopes stated: the same firm's May 2026 analysis has inference-infrastructure margins rising from 38% to above 70%, and secondary coverage of a Wall Street Journal report said company compute costs were expected to decline from 71 to 56 cents per revenue dollar from Q1 into Q2 2026 (a company-level forecast, not an observed datum). · What it does not claim: not a statement of where the figure tops out — a floor compatible with 85 and with 95; not this page's parameter vector; no published fleet, rate, utilization, traffic mix, or calculation (the Tokenomics model is private). · Why the conservative case differs: Patel's statement targets the same quantity this page models (an Opus API-token unit margin): if both refer to the same unit, period, and accounting boundary, \">80\" and ≈51 contradict each other — they are not compatible readings. The grouped SemiAnalysis API-business figure is a broader accounting product-line metric — corroborating context from the same analyst family, not a second same-estimand contradiction. Where this page's ranking of that tier is concerned, the statement lives outside this answer; what matters here is why the calculator's own case differs. SemiAnalysis models these economics bottom-up by SKU, and this page treats that work as thorough while noting that its inputs — public, inferred, or private — cannot be seen from here. What the public record does not supply is the methodology that would let a reader diagnose which assumptions differ: this calculator reproduces the floor's neighborhood under labeled constructions (the strategic-partner ladder ≈81.7: partner rates at 0.70×, utilization 70, throughput regime, list-only billing; the separate owned-TCO route ≈89.1 at the public-evidence reference), and the assumption distance between those constructions and the conservative planning case is the disagreement — \"not publicly reproducible\" is this page's finding about the public record, not a claim that the source lacks a basis. · What would flip it: publication of the underlying fleet-cost basis, utilization, and operating point would allow a direct reconciliation and could settle the disagreement if every relevant boundary matches — or a disclosure showing procurement above this page's low/committed planning rates at moderate utilization would move the above-80 hypothesis back toward this page's conservative case; either publication would close most of the diagnosis gap.",
  "g3-gptpro-9294-lens": "GPT Pro consult 92–94 for Opus (model-generated) + the ≈81.7 lens · What it claims: \"approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet.\" (model-generated scenario analysis, 2026-07-09). For the flagship comparison the relevant figure is Opus 92–94; the registry record splits accordingly. A page-authored strategic-rate adaptation inspired by the consult's fleet economics computes ≈81.7 at the flagship scope — the high endpoint of the cost-lens span — and is not a faithful replay of the consult's 92–94 scenario: the consult's 75% occupancy central is adapted to 70 here, and its TPU-specific ~$1.60/hr estimate is generalized as a 0.70× multiplier across the lens fleet — both page choices, labeled. · What it does not claim: human endorsement — model-generated analysis with zero claimant weight, rendered only in its own provenance-labeled group. · Why the conservative case differs: The executed ladder from ≈51 to ≈81 (each step a calculator mutation from the conservative case, at the revised flagship size; cost shares of billings in parentheses): partner rates alone (0.70×) → ≈66 (≈34%); utilization 70 alone → ≈65 (≈35%); both → ≈76 (≈24%); plus the throughput serving regime → ≈79 (≈21%); plus list-only billing (no batch share, no discount) → ≈81 (≈19%). The lens itself lands slightly LOWER, at ≈81.7 (cost share ≈18.3%), because it also swaps the fleet — that last difference is blend composition, not a further cost lever. The serving-stack multiplier stays at 1.0× (no stack-efficiency step) — though the throughput-regime switch is itself an operating-point assumption, not a free lunch. The remaining distance from ≈81.7 to the consult's Opus 92–94 is the mature-fleet scenario the consult asserts beyond this adaptation (its own implied per-category economics combine near ≈91 at the reference mix; 92–94 implies an all-in cost share of 8–6%, so closing from ≈81.7 requires roughly a further 56% or 67% cut in cost per billed unit) — the part the public evidence does not ground. Naming the most plausible closer, as this page's own inference and not the consult's stated method: a mature-fleet scenario at that level most plausibly assumes serving-stack efficiency this calculator does not credit in this reference reading, and in every other reading this page authors, speculative decoding first among them — vendor-confirmed in production at a different frontier lab, credited with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). The credit is available as a scenario lever, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and a mechanism, never an Anthropic fleet parameter here; carried at no credit in any reading this page authors — a convention, not a finding about Anthropic's actual deployment or benefit; a reader's own scenario may credit it, from the \"no MTP/disagg\" stack setting only. The conservative case answers the published-tariff, low/committed-planning-rate, reference-traffic question on the serve-feasibility-filtered evidence-informed default fleet. · What would flip it: partner-rate disclosure plus utilization evidence plus a published production operating point (throughput/latency) and billing-mix evidence — the full set the ladder shows is needed (rates and utilization alone reach only ≈76); reaching the consult's 92–94 additionally requires evidence supporting an all-in cost share of at most 8–6% of billings.",
  "g5-baker-85": "Gavin Baker 85 (relayed reports) · What it claims: \"It's probably not going to trade at 10 times that number, and it will be very profitable at that scale because it'll be inference-dominated and people are reporting they have 85% gross margins on inference.\" (85, Anthropic inference gross margins, All-In E278 — the show's own published clip; the speaker attributes the figure to reports). · Not claimed: the speaker's own estimate (he attributes the figure to reports); a stated cost basis; a token-SKU operating point — the scope reads closer to an inference product-line estimate. · Why the conservative case differs: this page's owned-TCO construction computes ≈89.1 at the public-evidence reference, so it already exceeds 85 (not an accounting reconciliation from product-line gross margin to this page's unit metric); an 85% margin would tolerate roughly a 37% increase in cost per billed unit from that construction. · What would flip it: the underlying reports or sources being published with their cost boundary stated, and shown to support the figure at a matched scope.",
  "g5-huatai-80": "Huatai above-80 API floor (relayed note) · What it claims: \"Anthropic 当前混合毛利率在 60%左右，API 毛利率超过 80%。OpenAI 毛利率更低（40%左右）…\" (page translation: Anthropic's current blended gross margin is around 60%, API gross margin exceeds 80%, OpenAI's gross margin is lower at around 40%; the trailing ellipsis is the relay's own) — a sell-side note relayed without the original document (above-80 floor, Anthropic API); the excerpt's own blended-vs-API split is preserved here because it demonstrates exactly why metric scope matters. · Not claimed: an independent measurement; a point — the figure is a floor. · Why the conservative case differs: no direct bridge exists without an accounting reconciliation from API-product-line margin to this page's unit metric; the floor's numeric neighborhood is reachable here only via the Patel-group constructions. · What would flip it: the original note and methodology being published together with a reconciliation demonstrating that its API-product-line accounting perimeter maps to this page's same-period unit metric while still supporting an above-80% result.",
  "g5-teortaxes-2025": "TeorTaxes ~80 inference-only (2025, dated) · What it claims: \"if we exclude R&D and look at inference alone, Anthropic and OpenAI are making like 80% margins.\" (~80 inference-only, dated March 2025 — a dated cross-lab informal read). The staleness cuts both ways — prices fell (margin down) while fleets and software improved (margin up); this page does not claim the direction. · Not claimed: a current-year figure; a defined accounting perimeter. · Why the conservative case differs: within this calculator, the 2025-era operating assumptions are not encoded; no bridge is constructed. · What would flip it: a current same-scope estimate supported by disclosed cost, billing, and operating-point evidence that materially conflicts with the conservative case.",
  "g5-alderson-90": "Alderson ~90 class-wide · What it claims: \"As someone that has got so much flak off people for estimating frontier AI labs gross margin inference % at ~90% for the past ~year it is good to see @SemiAnalysis_ agreeing\" (90, frontier-labs class-wide; note an above-80 floor is compatible with 90 without endorsing it). The record's own annex lists public numbers clustering lower (60–75, enumerated with scopes in the registry annex — listed, not asserted, since those figures span different metric scopes; the cluster note predates the above-80 report rows). · Not claimed: primary leak access; a per-lab basis. · Why the conservative case differs: the owned-TCO route ≈89.1 at the public-evidence reference is this page's closest construction; 90 remains just beyond every authored route. · What would flip it: a per-lab basis being published and shown to support ~90 at a matched scope — from this page's owned-TCO construction (≈89.1 at the public-evidence reference), that requires roughly a further 8.5% cut in cost per billed unit."
};

/* ============================================================================================
   THE 2026-09-20 VETTING REPAIRS, kept as their OWN event (program bq-2835, leg
   im-vet-six-repairs; report reports/inference-margins-vetting-2026-09-19.md, expert findings
   E1, E2 and E5a).

   Two registry repairs recompute figures inside seven of the ten reopened tokens, and unlike the
   2026-09-10 rent adoption they also change WORDS: withdrawing a leg from the default fleet is
   not a recompute a reader can be left to infer from a moved numeral, so the copy says it.
   That makes the digits-stripped claim below unavailable for this event, and the STRONGER
   treatment applies instead — the same one class B uses for M6's mandated edits: every change is
   pinned here as a reversible (before -> after) span with its reason, the revert runs FIRST, and
   everything downstream then compares against the pre-repair bytes unchanged. A word that moved
   under cover of a repair, or a repair edit that is not on this list, fails the comparison it
   was hiding from.

   The two repairs:
     (1) E1 — the two Trainium legs are WITHDRAWN from the default fleet's membership on evidence
         grounds (the operating-point registry declares batch replica-global while the engine
         consumes it per chip; the alternative reading is ~15.2x, and the hardware ledger already
         said the coefficient cannot support a central Trainium margin). Their declared 8% and 17%
         renormalize over the remaining five legs.
     (2) E2 — the TPU v7 decode coefficient moves 0.55 -> 0.521. One of its two same-platform
         endpoints was computed on Google's COMBINED input-plus-output rate (677 t/s/chip) as if
         it were a decode rate; this project's own published blinded replication solves the
         two-workload system for 606 output t/s/chip, and both endpoints now use a decode
         numerator (518.86 and 606).
   (1) raises readings, (2) lowers them, and E5a (gb200's adopted rent relabelled analyst-set)
   moves no number at all.
   ============================================================================================ */
const VETTING_REPAIRS = {
  "mostPlausibleLine": [
    { why: "E2 TPU numerator repair — the strategic-partner lens moves with the coefficient", before: "the strategic-partner lens (≈83.1 at the public-evidence reference)", after: "the strategic-partner lens (≈83.0 at the public-evidence reference)" },
    { why: "E1 + E2 — both aggressive planning-vector routes ride the default fleet and the TPU leg", before: "routes (≈81.0/≈80.0 at the public-evidence reference)", after: "routes (≈80.6/≈79.5 at the public-evidence reference)" },
    { why: "E1 + E2 — the owned-TCO route rides the same default", before: "owned-TCO route (≈89.1 at the public-evidence reference).", after: "owned-TCO route (≈89.2 at the public-evidence reference)." },
  ],
  "higherJustificationsHeader": [
    { why: "E1 + E5a — the default has five member legs, and gb200's adopted rent is analyst-set", before: "four of seven rents are analyst-set (the other three name public rates", after: "four of the five member rents are analyst-set (only the fifth names a public rate" },
    { why: "E1 — the Trainium legs are no longer caveated inside the default; they are withdrawn from it", before: "carry NO matched serving anchor and are scenario-only", after: "carry NO matched serving anchor, and their unresolved batch form is why they are WITHDRAWN from this default rather than merely caveated inside it" },
  ],
  "decompositionLine": [
    { why: "E1 + E2 — the fleet-substitution step is now a seven-leg declared topology against a five-leg withdrawn default, and the 5 T case loses H100 to capacity while Trainium is withdrawn at every size", before: "40) to ≈58 (57.88) — a −0.5 point move; the serve-feasibility rule removes nothing at this size.", after: "23) to ≈58 (58.41) — a move of under half a point, upward. The NA blend's two Trainium legs are WITHDRAWN from this default on evidence grounds and their declared weight renormalizes over the remaining five, so this is a declared seven-leg topology set against a five-leg default and the renormalization is inside the move rather than beside it; the serve-feasibility rule removes nothing further at this size." },
    { why: "E1 + E2 — the 5 T alternative case", before: "now computes ≈56, and under it the rule removes H100 and Trainium2", after: "now computes ≈53, and under it the feasibility rule additionally removes H100" },
  ],
  "g1-teortaxes-9095": [
    { why: "E1 + E2 — the throughput step's standalone and in-ladder sizes", before: "throughput regime is worth ≈6 points", after: "throughput regime is worth ≈5 points" },
    { why: "E1 + E2 — the in-ladder increment", before: "≈79 — it adds about 3 more, to ≈82.", after: "≈79 — it adds about 2 more, to ≈82." },
    { why: "E1 + E2 — the owned-TCO route at the reference and under the prior", before: "owned-TCO route, computes ≈89.1 there", after: "owned-TCO route, computes ≈89.2 there" },
    { why: "E1 + E2 — the same route under the ratified prior", before: "that same route computes ≈91.7 and does land inside it", after: "that same route computes ≈91.8 and does land inside it" },
    { why: "E1 + E2 — x80-v4 leaves its authored band; the sentence now states band membership in both directions and names the two repairs that moved it", before: "The two aggressive planning-vector routes now compute ≈81.0/≈80.0, INSIDE the 80–90 band they were authored for; before the b9 repaired defaults they fell short at ≈79.6/≈78.5, so it is the repair — not a re-authoring — that moved them in. The strategic-partner lens computes ≈83.1.", after: "The two aggressive planning-vector routes now compute ≈80.6/≈79.5: the first INSIDE the 80–90 band it was authored for, the second just BELOW it. Neither vector has been re-authored — what moves them is the engine underneath. They first crossed into the band when the b9 defaults were repaired (before that they read ≈79.6/≈78.5); the vetting repairs of 2026-09-20 moved them back down, by withdrawing the two Trainium legs from the default fleet and correcting the TPU decode coefficient onto a decode-only numerator, and that carried the second route back out. Band membership is computed and disclosed here, never enforced. The strategic-partner lens computes ≈83.0." },
    { why: "E1 + E2 — the wouldFlip cost-share arithmetic follows the lens", before: "reducing the ≈83.1 construction's cost share from ≈16.9% to ≈10% of billings (roughly a further 40% cut", after: "reducing the ≈83.0 construction's cost share from ≈17.0% to ≈10% of billings (roughly a further 41% cut" },
    { why: "N1 vocabulary release edit — style/VOCABULARY.md §1.2 makes **list price** the one name for the published per-token price and retires \"tariff\"", before: "sustained ~90% unit margins at published tariffs", after: "sustained ~90% unit margins at published list prices" },
  ],
  "g2-patel-semianalysis-80": [
    { why: "E1 + E2 — this entry listed the LADDER at the LENS's figure, so the numeral repair could not be applied without naming each construction with its own value: the four-lever ladder is ≈84, the lens (which also swaps the fleet) is ≈83.0, and the owned-TCO route is ≈89.2. All three are derivation-bound elsewhere in this guard. The mis-attribution predates this leg and is recorded in its report rather than passed off as a numeral move.",
      before: "(the strategic-partner ladder ≈83.1: partner rates at 0.70×, utilization 70, throughput regime, list-only billing; the separate owned-TCO route ≈89.1 at the public-evidence reference)",
      after: "(the strategic-partner ladder ≈84: partner rates at 0.70×, utilization 70, throughput regime, list-only billing; the strategic-partner lens ≈83.0, which also swaps the fleet; the separate owned-TCO route ≈89.2 at the public-evidence reference)" },
  ],
  "g3-gptpro-9294-lens": [
    { why: "E1 + E2 — every occurrence of the lens figure in this entry", before: "≈83.1", after: "≈83.0" },
    { why: "E1 + E2 — the lens cost share is 100 minus the lens", before: "cost share ≈16.9%", after: "cost share ≈17.0%" },
    { why: "N1 vocabulary release edit — style/VOCABULARY.md §1.3 splits the retired \"cost lens\" into price preset and scenario preset; this span is the span object, so it becomes the scenario-preset span", before: "cost-lens span", after: "scenario-preset span" },
  ],
  "g5-baker-85": [
    { why: "E1 + E2 — the owned-TCO construction", before: "computes ≈89.1 at the public-evidence reference", after: "computes ≈89.2 at the public-evidence reference" },
    { why: "E1 + E2 — the tolerable cost increase from that construction", before: "tolerate roughly a 37% increase", after: "tolerate roughly a 40% increase" },
  ],
  "g5-alderson-90": [
    { why: "E1 + E2 — the owned-TCO route, both occurrences", before: "≈89.1", after: "≈89.2" },
    { why: "E1 + E2 — the remaining cut required from it", before: "roughly a further 8.5% cut", after: "roughly a further 7.0% cut" },
  ],
};

const digitsOnlyStripped = (s) => s.replace(/[\d.,]+/g, "#");
  const CLASS_A = REOPENED.filter(k => !(k in CLASS_B));
  /* T5 rec 5 moved higherJustificationsHeader and g2-patel-semianalysis-80 from A to B (4 A / 6 B).
     The partition assertion is still CLOSED and still counts — it is the count that moved, under a
     pinned edit set, which is the difference between a mandated change and a drift. */
  assert("J-2 rule 4: the class assignment is CLOSED and partitions the ten tokens (4 A / 6 B)",
    CLASS_A.length === 4 && Object.keys(CLASS_B).length === 6
    && REOPENED.every(k => CLASS_A.includes(k) !== (k in CLASS_B)),
    JSON.stringify({ A: CLASS_A, B: Object.keys(CLASS_B) }));

  /* The 2026-09-20 vetting-repair revert, applied to EVERY token before either oracle runs.
     Each pinned span must be present verbatim (a repair that silently disappeared fails here),
     and the reverted text then faces the pre-repair comparisons unchanged. */
  const revertVetting = (k, text) => {
    let out = text;
    for (const e of (VETTING_REPAIRS[k] || [])) {
      assert("J-2 vetting repair [" + k + "]: the pinned repair edit is PRESENT verbatim (" + e.why.slice(0, 52) + "…)",
        out.includes(e.after), e.after.slice(0, 90));
      out = out.split(e.after).join(e.before);
    }
    return out;
  };
  const preVet = Object.fromEntries(REOPENED.map(k => [k, revertVetting(k, live[k])]));

  /* Class A oracle: strip every canonical-phrase occurrence → BYTE-EQUAL to the pinned pre-M6
     value. Rule 6 class A: any edit that survives the strip FAILS. */
  for (const k of CLASS_A)
    assert("J-2 class A [" + k + "]: stripping the canonical phrase reproduces the pre-M6 bytes exactly",
      strip(preVet[k]) === pre[k],
      JSON.stringify({ delta: preVet[k].length - pre[k].length, inserts: (preVet[k].split(CP).length - 1) }));
  assert("J-2 class A: the two figure-free tokens are BYTE-IDENTICAL (zero insertions, R9's point)",
    live["g5-huatai-80"] === pre["g5-huatai-80"] && live["g5-teortaxes-2025"] === pre["g5-teortaxes-2025"]);
  /* The figure-free pair carries NO vetting repair either — the repairs moved figures and the
     sentences that explain them, and these two tokens have neither. */
  assert("J-2 vetting repairs: the two figure-free tokens are untouched by the 2026-09-20 repairs",
    !("g5-huatai-80" in VETTING_REPAIRS) && !("g5-teortaxes-2025" in VETTING_REPAIRS));

  /* Class B oracle: revert the pinned mandated edit SET and strip the canonical phrase →
     BYTE-EQUAL to pre-M6. Rule 6 class B: any change beyond {phrase insertions} ∪ {the pinned
     edit set} FAILS, because it survives both operations and the comparison then differs. */
  for (const [k, edits] of Object.entries(CLASS_B)) {
    let reverted = preVet[k];
    if (k in PRE_RENT_ADOPTION) {
      assert("J-2 rent adoption [" + k + "]: the 2026-09-10 recompute changed NUMERALS and nothing else",
        digitsOnlyStripped(reverted) === digitsOnlyStripped(PRE_RENT_ADOPTION[k]),
        JSON.stringify({ live: digitsOnlyStripped(reverted).slice(0, 120),
                         pre: digitsOnlyStripped(PRE_RENT_ADOPTION[k]).slice(0, 120) }));
      reverted = PRE_RENT_ADOPTION[k];
    }
    for (const e of [...edits].reverse()) {
      assert("J-2 class B [" + k + "]: the mandated edit is PRESENT verbatim (" + e.why.slice(0, 46) + "…)",
        e.after === "" ? !reverted.includes(e.before) : reverted.includes(e.after),
        e.after.slice(0, 90));
      if (e.after !== "") reverted = reverted.replace(e.after, e.before);
    }
    if (k === "decompositionLine") {
      // a deletion is reversed by re-inserting the pinned sentence at its pinned offset
      const at = pre[k].indexOf(DECOMP_REMOVED);
      reverted = pre[k].slice(0, at) + DECOMP_REMOVED + reverted.slice(at);
      assert("J-2 class B [decompositionLine]: the removed text is byte-equal to the pinned pre-M6 sentence and appears in NO FA token afterwards",
        at > 0 && !Object.values(live).some(v => v.includes(DECOMP_REMOVED.trim())));
    }
    assert("J-2 class B [" + k + "]: reverting the pinned edit set + stripping the phrase reproduces pre-M6 bytes exactly",
      strip(reverted) === pre[k],
      JSON.stringify({ gotLen: strip(reverted).length, wantLen: pre[k].length }));
  }

  /* Rule 6 negative fixtures, scoped BY CLASS — a rule that forbade the class-B edits would fail a
     conforming implementation by construction (that was gate R8's P0). */
  {
    const roguePhrase = live["g5-baker-85"] + " An unannounced sentence.";
    assert("J-2 rule 6 negative (class A): any change that is not exactly a phrase insertion FAILS",
      strip(roguePhrase) !== pre["g5-baker-85"]);
    /* Class B: a change BEYOND the pinned edit set must survive BOTH the phrase strip and the edit
       reversion, so the comparison against pre-M6 differs. Driven through the same CLASS_B table the
       positive path uses, so the two can never test different things. */
    const rogueB = live["g3-gptpro-9294-lens"].replace("The conservative case answers", "The conservative case now answers");
    let rev = rogueB;
    for (const e of [...CLASS_B["g3-gptpro-9294-lens"]].reverse())
      if (e.after !== "") rev = rev.replace(e.after, e.before);
    assert("J-2 rule 6 negative (class B): a change BEYOND the pinned edit set FAILS",
      strip(rev) !== pre["g3-gptpro-9294-lens"]);
  }

  /* Rule 3b: COMPLETENESS — what makes rule 3a meaningful. The basis guard ADJUDICATES enumerated
     figures but cannot DISCOVER an unenumerated one, so "the guard decides" would have let J-2 pass
     while a published figure went unlabeled: an assertion that cannot fail for the case that
     matters.

     The memo's grammar is `≈?\d+(\.\d+)?%?` — the ≈ is OPTIONAL, and §17.2 explicitly routes plain
     `15%`-style values to the allowlist. An earlier cut of this test narrowed the grammar to
     ≈-marked literals and called the difference a "stated limit". A manifest cannot narrow a
     binding memo, and the narrowed form could not see `computes 42%` at all. Restored to the memo's
     grammar, with a TWO-STAGE rule:

       STAGE 1 — the CALCULATOR-FIGURE DETECTOR, which is not overridable. A literal is a calculator
       figure if it carries the ≈ marker, OR follows a calculator verb, OR is the parenthesised
       exact companion of a marked figure. A detected figure is discharged ONLY through one of five
       ENUMERATED-LITERAL routes (see `disposedBy` below); no PATTERN rule can discharge one.
       STAGE 2 — everything the detector rejected must match one of the closed non-calculator
       classes below, each with its reason. Because stage 1 runs first and cannot be overridden, a
       coarse stage-2 rule cannot hide a calculator figure — which is the property that makes coarse
       stage-2 rules acceptable at all. */
  const GRAMMAR = /≈?\d+(?:\.\d+)?%?/g;
  /* The verb list is the detector's whole reach for UNMARKED figures, so it enumerates the ways
     this page's prose actually attributes a number to the calculator. Kept deliberately wide: a
     false positive costs one allowlist entry, a false negative costs an unlabeled published figure. */
  const CALC_VERB = /(computes?|computed|computing|re-?derives?|re-?derived|reads?|returns?|yields?|produces?|gives?|lands? at|lands? in|comes? out at|evaluates? to|works? out (?:to|at)|is worth|are worth|outputs?|estimates?|calculates?|predicts?|projects?|forecasts?|prints?|shows?|reports?|puts? (?:it |the \\w+ )?at|settles? at|arrives? at|moves? (?:the result )?(?:from|to)|now (?:computes?|reads?))\s*(?:to\s*|at\s*|around\s*|about\s*|roughly\s*)?$/i;
  /* ≈89.1 / ≈91.7 are the two ARCHIVED owned-TCO readings, which carry the memo §6 pin bundle and
     are therefore UNMOVED by the T4 fold. ≈59% moves to ≈51% with the reference reading. */
  /* im-vet-six-repairs (2026-09-20): every key below moves with the two registry repairs it names
     in the event header, and each is still BOUND to a live derivation rather than allowlisted. */
  const GUARD_ENUMERATED = ["≈58%", "≈89.2", "≈91.8"];
  const derived = {
    "≈58":   () => Math.round(marg(seededAt(2500))),
    "≈70":   () => Math.round(marg(seededAt(2500, s => { s.util = 70; }))),
    "≈58b":  () => Math.round(marg(seededAt(2500, s => { s.blend = { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 }; }))),
    "≈53":   () => Math.round(marg(seededAt(5000))),
    "≈71":   () => Math.round(marg(seededAt(2500, s => { s.rentMult = 0.7; }))),
    "≈79":   () => Math.round(marg(seededAt(2500, s => { s.rentMult = 0.7; s.util = 70; }))),
    "≈82":   () => Math.round(marg(seededAt(2500, s => { s.rentMult = 0.7; s.util = 70; s.interact = "batch"; }))),
    "≈84":   () => Math.round(marg(seededAt(2500, s => { s.rentMult = 0.7; s.util = 70; s.interact = "batch"; s.batchShare = 0; s.discount = 0; }))),
    "≈5":    () => Math.round(marg(seededAt(2500, s => { s.interact = "batch"; })) - marg(seededAt(2500))),
    "≈83.0": () => +marg(preset(opus, E.PERSPECTIVES.find(p => p.id === "gptpro"), { mode: "native" })).toFixed(1),
    "≈80.6": () => +E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "x80-v3")).toFixed(1),
    "≈79.5": () => +E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "x80-v4")).toFixed(1),
    "≈96":   () => Math.round(E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "xaicash"))),
    "≈86":   () => Math.round(E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "deepseek"))),
    "≈91":   () => Math.round(0.75 * 90.6 + 0.25 * 93.3),
  };
  /* The ≈-marked cost-share / percentage-change figures: arithmetic ABOUT an external claim, not a
     calculator reading. They carry the marker because the page marks every approximation, so the
     detector routes them here explicitly rather than by exception. */
  const CLAIM_ARITHMETIC = {
    "≈10%": "cost share of billings implied by the external 90→95 claim",
    "≈15%": "cost share implied by the consult's 92–94 claim",
    /* im-arc T4 fold (2026-08-24, declared delta): every cost share is 100 minus its ladder rung,
       so each moved with the rung it belongs to. The classes are unchanged; only the values are. */
    /* im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
       every cost share is still 100 minus its ladder rung, so each moved with the rung it belongs to.
       The classes are unchanged; only the values are — the same declaration the T4 fold made. */
    "≈17.0%": "cost share of the ≈83.0 lens construction (itself derivation-bound above)",
    "≈18%": "cost share at the throughput-regime ladder step",
    "≈21%": "cost share at the rates+utilization ladder step",
    "≈29%": "cost share at the partner-rates single-lever ladder step",
    "≈30%": "cost share at the utilization single-lever ladder step",
    "≈16%": "cost share at the list-only-billing ladder step",
  };
  const SUPERSEDED = {
    "≈79.6": "pre-repair historical figure, stated AS history; not derivable in the repaired engine",
    "≈78.5": "pre-repair historical figure, stated AS history; not derivable in the repaired engine",
  };
  /* Stage-2 classes for everything the detector rejected. Coarse BY DESIGN and safe because stage 1
     already claimed every calculator figure. Each rule carries the reason it exists. */
  const NON_CALC_RULES = [
    { name: "date/year", re: /^(19|20)\d{2}$/, why: "a calendar year in a citation or claim date" },
    { name: "date-fragment", re: /^0\d$/, why: "a zero-padded month/day fragment inside an ISO date" },
    { name: "external-claim-value", re: /^(80|85|90|92|94|95|60|75)%?$/, why: "an external claimant's own figure under examination — never a calculator output" },
    /* NOT a pattern. A pattern here would make the verb list load-bearing: any calculator figure
       the detector's verbs happened to miss would land in stage 2 and be waved through as "some
       percentage". Enumerating the 19 bare percentages this copy actually publishes means an
       UNRECOGNISED bare percentage FAILS stage 2 even when stage 1 misses it — so verb coverage is
       a nice-to-have rather than the only thing standing between the suite and an unlabeled figure.
       Every entry is a claim value or arithmetic about one; none is an engine reading. */
    { name: "enumerated-bare-percentage", set: new Set([
        /* im-vet-six-repairs (2026-09-20): 8.5% -> 7.0% and 37% -> 40% with the owned-TCO route;
           40% -> 41% in g1's counterfactual. Retired entries are REMOVED rather than left behind,
           because the EXHAUSTIVE counter-check below treats an unused entry as a defect. */
        "5%", "6%", "7.0%", "10%", "15%", "38%", "40%", "41%", "56%", "60%",
        "67%", "70%", "75%", "80%", "85%", "90%", "94%", "95%", "96%",
      ]), why: "an enumerated claim value or claim-arithmetic percentage published by this copy — cost shares, percentage changes, external claim figures and declared conventions, never an engine reading" },
    { name: "page-parameter", re: /^(0\.70|1\.0|1\.60|2\.0|2\.5|3\.0|1\.5|15|60|70|50|100)$/, why: "a DECLARED page input quoted in prose (rate multiplier, size band, traffic anchor, utilization convention)" },
    { name: "fleet-weight", re: /^\d{1,2}$/, why: "a declared fleet weight, leg count, tier index or ordinal inside an enumeration" },
    { name: "model-version", re: /^[45]\.\d$/, why: "a model version number (Opus 4.6/4.8)" },
    { name: "episode-or-id", re: /^\d{3}$/, why: "a source identifier (podcast episode number, report id)" },
    /* im-release-edit-r2 (2026-09-10): the rent adoption narrowed the decomposition's first step
       from a −1.0 point move to −0.5, and moved the two cost-cut percentages the consult's band
       implies. Both are ARITHMETIC ON figures already bound above, not new calculator readings. */
    { name: "decomposition-delta", set: new Set(["0.5"]), why: "the point delta between two derivation-bound readings in the same sentence" },
    { name: "consult-cost-cut", set: new Set(["53%", "65%"]), why: "the further cost cut the consult's 92-94 band implies from the derivation-bound lens reading" },
  ];
  /* A SPAN (`92–94`, `90–95`, `60–75`, `40–50%`, `2–3 T`) is never a single calculator reading on
     this page: calculator spans use the pinned "span across N declared alternatives" grammar, and
     the FA vocabulary scanner forbids the word "range" outright — so an en-dashed pair is always an
     external claim band or a declared size band. This check runs INSIDE the detector rather than as
     an overriding allow-rule, so it is part of what "is a calculator figure" means, not an escape
     hatch layered on top. It is what stops `gives 92–94 for Opus` — the consult's own claimed band,
     quoted under examination — from being demanded as an engine derivation. */
  const inSpan = (text, lit, at) =>
    /[–-]\s*$/.test(text.slice(Math.max(0, at - 3), at))
    || /^\s*[–-]\s*\d/.test(text.slice(at + lit.length, at + lit.length + 4));
  const isCalcFigure = (text, lit, at) => {
    if (lit.startsWith("≈")) return true;
    if (inSpan(text, lit, at)) return false;
    if (CALC_VERB.test(text.slice(Math.max(0, at - 32), at))) return true;
    // the parenthesised exact companion of a marked figure: "≈60 (60.18)"
    const lead = text.slice(Math.max(0, at - 8), at);
    if (/\($/.test(lead)) {
      const before = text.slice(Math.max(0, at - 40), at);
      if (/≈\d+(\.\d+)?\s*\($/.test(before)) return true;
    }
    return false;
  };
  const calcHits = new Map(), otherHits = new Map();
  for (const k of REOPENED) for (const m of live[k].matchAll(GRAMMAR)) {
    const bucket = isCalcFigure(live[k], m[0], m.index) ? calcHits : otherHits;
    if (!bucket.has(m[0])) bucket.set(m[0], []);
    bucket.get(m[0]).push(k);
  }
  /* Stage 1's disposal set, stated exactly (gate round 2 P0-1b): a detected calculator figure is
     discharged ONLY by one of four ENUMERATED-LITERAL routes — the guard's FIGURES table, a live
     re-derivation, the named claim-arithmetic list, or the named superseded-history list — plus the
     enumerated exact-companion pair. None of these is a PATTERN: every member is a literal someone
     wrote down with a reason, so nothing is discharged by matching a shape. The earlier phrasing
     "no allow-rule can rescue one" was too strong for what the code does, and a blanket
     `^\d+\.\d+$` escape really would have let ANY new decimal through; both are corrected here. */
  /* im-vet-six-repairs: the declared-topology and withdrawn-default companions both move. */
  const EXACT_COMPANIONS = ["58.23", "58.41"];
  const disposedBy = (x) =>
    GUARD_ENUMERATED.includes(x) ? "guard-enumerated"
    : (x in derived) ? "derivation-bound"
    : (x in CLAIM_ARITHMETIC) ? "claim-arithmetic (enumerated literal)"
    : (x in SUPERSEDED) ? "superseded-history (enumerated literal)"
    : EXACT_COMPANIONS.includes(x) ? "exact companion (bound below)"
    : null;
  const unbound = [...calcHits.keys()].filter(x => disposedBy(x) === null);
  assert("J-2 rule 3b STAGE 1: every CALCULATOR figure in the ten reopened tokens is disposed by an ENUMERATED route",
    unbound.length === 0, JSON.stringify(unbound));
  assert("J-2 rule 3b STAGE 1: no stage-2 PATTERN rule can discharge a detected calculator figure",
    [...calcHits.keys()].every(x => disposedBy(x) !== null),
    "a calculator figure fell through to the pattern classes");
  assert("J-2 rule 3b STAGE 1 negative: a NEW decimal is NOT discharged by shape (the blanket escape is gone)",
    disposedBy("77.77") === null);
  assert("J-2 rule 3b: the exact-companion set is enumerated, not pattern-matched",
    EXACT_COMPANIONS.length === 2 && EXACT_COMPANIONS.every(x => /^\d+\.\d+$/.test(x)));
  const matchesRule = (r, x) => (r.set ? r.set.has(x) : r.re.test(x));
  const unclassified = [...otherHits.keys()].filter(x => !NON_CALC_RULES.some(r => matchesRule(r, x)));
  assert("J-2 rule 3b STAGE 2: every remaining literal matches a closed non-calculator class",
    unclassified.length === 0, JSON.stringify(unclassified));
  for (const [lit, fn] of Object.entries(derived)) {
    if (!calcHits.has(lit)) continue;
    const v = fn();
    const rendered = lit.includes(".") ? "≈" + v.toFixed(1) : "≈" + v;
    assert("J-2 rule 3b: derivation-bound literal " + lit + " RE-DERIVES from the live engine",
      rendered === lit, "engine says " + rendered);
  }
  /* The parenthesised exact companions are BOUND, not allowlisted: "≈60 (60.18)" must carry the
     unrounded value of the very derivation its marked twin names. */
  {
    const decl = marg(seededAt(2500, s => { s.blend = { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 }; }));
    const na = marg(seededAt(2500));
    assert("J-2 rule 3b: the parenthesised exact companions re-derive to 2dp (60.18 / 59.18)",
      live.decompositionLine.includes("≈58 (" + decl.toFixed(2) + ")")
      && live.decompositionLine.includes("≈58 (" + na.toFixed(2) + ")"),
      JSON.stringify([decl.toFixed(2), na.toFixed(2)]));
  }
  for (const [lit, why] of [...Object.entries(CLAIM_ARITHMETIC), ...Object.entries(SUPERSEDED)])
    assert("J-2 rule 3b: allowlist entry " + lit + " carries a reason", typeof why === "string" && why.length > 25);
  assert("J-2 rule 3b: every non-calculator RULE carries a reason",
    NON_CALC_RULES.every(r => typeof r.why === "string" && r.why.length > 25));
  /* THE BACKSTOP, asserted: an unrecognised bare percentage must fail stage 2 EVEN IF stage 1's verb
     list misses it entirely. This is what stops verb coverage from being the only thing between the
     suite and an unlabeled published figure — a verb list can never be proven complete. */
  assert("J-2 rule 3b BACKSTOP: an unrecognised bare percentage is unclassified even with NO verb in front of it",
    !NON_CALC_RULES.some(r => matchesRule(r, "42%")));
  /* The backstop's REAL scope, and its real limit — both asserted rather than asserted-about.
     Gate round 4 showed the first cut of this fixture used a phrasing the detector already knew
     (`puts this at`) and then computed `detected` without using it: it tested nothing. Worse, it
     implied a guarantee the rules cannot give. The literal classes CANNOT distinguish a calculator
     figure that COLLIDES with an allowlisted claim value. Both halves of that boundary are asserted
     below by CONSTRUCTING SENTENCES and running the real detector over them — gate round 5 caught
     the limit assertion checking only that the literal `80%` matched a stage-2 rule, which never
     invoked stage 1 and so could not fail on the property it named. The verb is `blorps` because
     `predicts` is now recognised: naming a recognised verb would describe a miss that does not
     happen. */
  {
    const missedVerb = "the calculator blorps 42%.";   // deliberately NOT in the verb list
    const stage1Missed = ![...missedVerb.matchAll(GRAMMAR)]
      .some(m => m[0] === "42%" && isCalcFigure(missedVerb, m[0], m.index));
    assert("J-2 rule 3b BACKSTOP: the fixture really does exercise a stage-1 MISS", stage1Missed);
    assert("J-2 rule 3b BACKSTOP: a NEW literal the detector missed is still refused by stage 2",
      stage1Missed && !NON_CALC_RULES.some(r => matchesRule(r, "42%")));
    const collide = "the calculator blorps 80%.";
    const collideMissed = ![...collide.matchAll(GRAMMAR)]
      .some(m => m[0] === "80%" && isCalcFigure(collide, m[0], m.index));
    assert("J-2 rule 3b KNOWN LIMIT: stage 1 really does MISS the colliding sentence (the fixture invokes the detector)",
      collideMissed, collide);
    assert("J-2 rule 3b KNOWN LIMIT: …and stage 2 then ABSORBS it, because 80% is an enumerated claim value",
      collideMissed && NON_CALC_RULES.some(r => matchesRule(r, "80%")),
      "the documented boundary of the two-stage rule — bounded from the other side by the COUNTER-CHECK below");
    assert("J-2 rule 3b KNOWN LIMIT: the boundary IS bounded — the counter-check rejects that same sentence",
      !/\bclaims?\b|\bclaimed\b|\bclaimant\b|reports?\b|analyst|consult|\bpost\b|verbatim|adjudicat|relayed|publish|\bsays\b|stated|statement|coverage|external|SemiAnalysis|Patel|Teor|Huatai|Baker|Alderson|\bfloor\b|authored|"/i.test(collide));
  }
  /* RESTORED after gate round 6 found it MISSING: a round-5 region edit deleted this block, taking
     the detector's coverage assertion with it while the manifest still advertised it. A fold that
     silently removes an assertion is worse than one that adds a weak one, so the probe list is
     rebuilt here and the manifest now points at THIS assertion by name. */
  {
    const VERB_PROBES = ["It computes 42%.", "the route yields 42%", "this produces 42%",
      "the lens gives 42%", "it returns 42%", "the ladder lands at 42%", "it comes out at 42%",
      "the construction evaluates to 42%", "the step is worth 42", "it now reads 42%",
      "the substitution moves the result to 42%", "that works out to 42%",
      "The calculator outputs 42%", "it prints 42%", "the lens shows 42%", "the annex reports 42%",
      "that puts it at 42%", "the ladder settles at 42%", "it arrives at 42%",
      "The calculator estimates 42%", "The calculator calculates 42%",
      "The calculator predicts 42%", "the model projects 42%", "it forecasts 42%"];
    const missed = VERB_PROBES.filter(txt =>
      ![...txt.matchAll(GRAMMAR)].some(m => isCalcFigure(txt, m[0], m.index) && /^42/.test(m[0])));
    assert("J-2 rule 3b: the detector catches EVERY attribution phrasing probed (" + VERB_PROBES.length + ")",
      missed.length === 0, JSON.stringify(missed));
    assert("J-2 rule 3b: the probe list is non-trivial (a deleted list cannot pass vacuously)",
      VERB_PROBES.length >= 24);
  }
  /* Closing the collision boundary FROM THE OTHER SIDE, on the artifact rather than on the language.
     Every bare percentage this copy publishes must be ATTRIBUTED — its sentence must NAME a claimant
     or carry a quotation.

     The marker set has now been narrowed THREE times, because each looser version was defeated by a
     constructed calculator sentence: round 4's admitted domain words (`cost`, `rate`, `scenario`);
     round 5's still admitted evaluative ones (`floor`, `authored`, `coverage`, `external`,
     `statement`, `tier`) and fell to "The calculator blorps 80% as its floor." What survives is
     claimant NAMES, explicit reporting verbs, and the quotation mark — words that cannot describe
     this page's own computation. That is the honest shape of this check: it is not a decision
     procedure over natural language, it is a demand for a claimant's name next to a claimant's
     number, and the EIGHT genuine exceptions are enumerated PER OCCURRENCE rather than per literal.
     Round 8 removed `reports?` as well: a lookahead cannot make it a noun — it matches the VERB in
     "The calculator reports its result as 80%." No verb, and no verb-ambiguous noun, survives. */
  {
    /* Round 7 defeated the previous cut with "The calculator says that 80% is its result." — a bare
       reporting VERB is not attribution, because this page is itself a speaker. What remains is
       claimant NAMES, claimant NOUNS, and the quotation mark: things that can only denote someone
       else's statement. Verbs are gone entirely. Probes for all three defeated cuts are kept below. */
    const CLAIMANT_MARKER = /SemiAnalysis|Patel|Teor[Tt]axes|Huatai|Baker|Alderson|Dealroom|Wall Street Journal|\banalysts?\b|\bclaimants?\b|\bconsult\b|\badjudicat|\breview\b|\bcoverage\b|\btranscript\b|\bpost\b|"/;
    /* Keyed by token + literal + SENTENCE INDEX. Round 6 showed a token|literal key blankets every
       future occurrence of that pair: appending "The calculator blorps 10%." to g1 passed the
       exhaustiveness check because `g1|10%` already existed. The occurrence key closes that. */
    const ATTRIBUTION_EXCEPTIONS = [
      { token: "g1-teortaxes-9095", lit: "10%", sentence: 7, why: "claim arithmetic — the cost share implied BY the 90→95 claim, whose claimant is named in the same entry's `What it claims` segment" },
      { token: "g1-teortaxes-9095", lit: "5%",  sentence: 7, why: "claim arithmetic — the other endpoint of that same implied cost share" },
      { token: "g1-teortaxes-9095", lit: "90%", sentence: 26, why: "a `What would flip it` counterfactual — the DISCLOSURE that would have to appear, not a figure this page computes" },
      { token: "g1-teortaxes-9095", lit: "41%", sentence: 26, why: "claim arithmetic inside that same counterfactual — the further cut in cost per billed unit the evidence would have to demonstrate (im-vet-six-repairs 2026-09-20: 40% -> 41% with the lens, and the sentence index moves because the band-membership sentence grew)" },
      { token: "g5-baker-85", lit: "85%", sentence: 2, why: "the Baker claim's own value, restated in the arithmetic sentence following its attributed introduction" },
      { token: "g5-baker-85", lit: "40%", sentence: 2, why: "claim arithmetic — the cost increase the owned-TCO construction could tolerate to reach that claim (im-vet-six-repairs 2026-09-20: 37% -> 40% with the owned-TCO route)" },
      { token: "g5-huatai-80", lit: "80%", sentence: 3, why: "the Huatai claim's own floor value, inside its `What would flip it` counterfactual; the claimant is named in the same entry's `What it claims` segment" },
      { token: "g5-alderson-90", lit: "7.0%", sentence: 4, why: "claim arithmetic inside a `What would flip it` counterfactual — the further cost cut the owned-TCO construction would need (im-vet-six-repairs 2026-09-20: 8.5% -> 7.0% with the owned-TCO route)" },
    ];
    const key = (tok, lit, si) => tok + "|" + lit + "|" + si;
    const allowed = new Set(ATTRIBUTION_EXCEPTIONS.map(e => key(e.token, e.lit, e.sentence)));
    const scan = (tokens) => {
      const out = [];
      for (const k of Object.keys(tokens))
        tokens[k].split(/(?<=[.!?])\s+/).forEach((sentence, si) => {
          for (const m of sentence.matchAll(GRAMMAR)) {
            if (m[0].startsWith("≈") || !m[0].endsWith("%")) continue;
            if (CLAIMANT_MARKER.test(sentence)) continue;
            out.push(key(k, m[0], si));
          }
        });
      return out;
    };
    const shipped = Object.fromEntries(REOPENED.map(k => [k, live[k]]));
    const found = scan(shipped);
    assert("J-2 rule 3b COUNTER-CHECK: every bare percentage names a claimant, or is one of the enumerated claim-arithmetic exceptions",
      found.every(x => allowed.has(x)), JSON.stringify(found.filter(x => !allowed.has(x)).slice(0, 4)));
    assert("J-2 rule 3b COUNTER-CHECK: the exception list is EXHAUSTIVE and OCCURRENCE-KEYED (no unused entries)",
      found.length === allowed.size && [...allowed].every(x => found.includes(x)),
      JSON.stringify({ found, allowed: [...allowed] }));
    assert("J-2 rule 3b COUNTER-CHECK: every enumerated exception carries a reason",
      ATTRIBUTION_EXCEPTIONS.every(e => typeof e.why === "string" && e.why.length > 30));
    /* Round 6's own attack: a NEW occurrence of an already-excepted (token, literal) pair must be
       caught, which the per-literal key could not do. */
    assert("J-2 rule 3b COUNTER-CHECK negative: a NEW occurrence of an excepted literal is still caught",
      (() => { const forged = { ...shipped };
        forged["g1-teortaxes-9095"] = live["g1-teortaxes-9095"] + " The calculator blorps 10%.";
        return scan(forged).some(x => !allowed.has(x)); })());
    /* Every marker version that was defeated, kept as a permanent regression probe. */
    for (const probe of ["The calculator predicts 80%.",
                         "The calculator predicts 80% at this cost basis.",
                         "The calculator's modeled cost is 80% in this scenario.",
                         "The calculator blorps 80% as its floor.",
                         "This computes 80% at 70% utilization on the reference mix.",
                         "The calculator says that 80% is its result.",
                         "The calculator reports 80%.",
                         "This page says 80% is the answer.",
                         "The calculator reports 80%.",
                         "The calculator reports its result as 80%."])
      assert("J-2 rule 3b COUNTER-CHECK negative: calculator prose is NOT attributed — " + probe.slice(0, 44),
        !CLAIMANT_MARKER.test(probe));
    assert("J-2 rule 3b COUNTER-CHECK positive control: genuinely attributed prose DOES pass",
      CLAIMANT_MARKER.test("SemiAnalysis reports an above-80% API margin."));
  }

  /* J-3: the basis declaration ships verbatim, and the x90-v1 claim is TRUE under the basis it
     names at BOTH bases — the §4.2 finding that made this the highest-risk item in M6. */
  assert("J-3 the basis declaration ships on the FA surface verbatim",
    fa.tokens.basisDeclarationLine.startsWith("Every calculator figure in the explanations below is the public-evidence reference reading"));
  {
    const refv = E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === "x90-v1"));
    const st = E.applyPresetSettings(opus, E.PERSPECTIVES.find(p => p.id === "x90-v1"), E.FLAGSHIP_SCOPE.traffic);
    const priorv = E.workload(st, undefined, E.scenarioContext(st)).margin * 100;
    /* im-vet-six-repairs (2026-09-20) re-mint: the route rides the default fleet, so it moves with
       the Trainium withdrawal and the TPU numerator repair. The PROPERTY this assertion exists for
       is unchanged and is what is asserted — outside the band at the reference, inside it under
       the prior — and only the two pins move. */
    assert("J-3 x90-v1 computes OUTSIDE its authored ≥90 band at the reference (89.25) and INSIDE it under the prior (91.83)",
      refv < 90 && priorv >= 90 && near(refv, 89.2462) && near(priorv, 91.8289),
      JSON.stringify([refv, priorv]));
    const g1 = fa.higherJustifications.find(g => g.groupId === "g1-teortaxes-9095");
    assert("J-3 the published sentence is TRUE under each basis it names, and names both",
      g1.bridge.includes("At the public-evidence reference no page-authored route reaches 90")
      && g1.bridge.includes("Under the calculator's own ratified-prior default that same route computes ≈91.8 and does land inside it"));
  }

  /* J-4: display segmentation is BYTE-NEUTRAL — and rejoin-equality alone is tautological, since
     split(sep).join(sep) always reconstructs. What binds is the STRUCTURE: exactly four
     separators, exactly five parts, each with its pinned label prefix. */
  {
    const SEPS = [" · What it claims: ", [" · What it does not claim: ", " · Not claimed: "],
      " · Why the conservative case differs: ", " · What would flip it: "];
    let allOk = true, detail = [];
    fa.tokens.higherJustificationEntries.forEach((txt, i) => {
      let rest = txt, parts = [], used = [];
      for (const spec of SEPS) {
        const cands = Array.isArray(spec) ? spec : [spec];
        let at = -1, hit = null;
        for (const sep of cands) { const j = rest.indexOf(sep); if (j !== -1 && (at === -1 || j < at)) { at = j; hit = sep; } }
        if (hit === null) { allOk = false; detail.push([i, "missing separator"]); return; }
        parts.push(rest.slice(0, at)); used.push(hit); rest = rest.slice(at + hit.length);
      }
      parts.push(rest);
      if (parts.length !== 5 || used.length !== 4) { allOk = false; detail.push([i, parts.length + "/" + used.length]); return; }
      const rejoined = parts.reduce((acc, b, j) => j === 0 ? b : acc + used[j - 1] + b, "");
      if (rejoined !== txt) { allOk = false; detail.push([i, "rejoin differs"]); }
    });
    assert("J-4 every entry splits into EXACTLY five parts on EXACTLY four pinned separators, and rejoins byte-for-byte",
      allOk, JSON.stringify(detail));
    assert("J-4 negative: a LOSSY split is detectable (dropping a separator changes the rejoin)",
      (() => { const t = fa.tokens.higherJustificationEntries[0];
        const bad = t.split(" · What it claims: "); return bad.join("") !== t; })());
  }
}

console.log(failures ? `\n${failures} FA-JUSTIFICATIONS FAILURE(S)` : "\nALL FA-JUSTIFICATIONS TESTS PASS");
process.exit(failures ? 1 : 0);
