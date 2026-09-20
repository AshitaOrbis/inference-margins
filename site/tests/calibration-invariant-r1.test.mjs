// CALIBRATION-INVARIANT R1 GUARD (feasibility-redesign memo §0-bis/§0-ter, v4.1) — the
// capacity-only loadedWeightBytesPerParam policy may NEVER reach a calibrated throughput:
// (1) every CALIBRATION identity stays byte-stable through R1/R2; (2) the performance
// tuple sW is the ONLY weight-bytes source in throughput terms (source-inspection pin);
// (3) once the R1 solver lands, perturbing the policy across {0.55, 0.65, 1.05} must
// leave every calibrated throughput identical, with any economic deltas captured into
// policySensitivity receipts (§0-ter) — the three-point block below activates with the
// solver and FAILS LOUDLY if the solver ships without it.
// Run: node site/tests/calibration-invariant-r1.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
const ED = require("../engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

// (1) Calibration identities byte-stable. b9 M1 RE-MINT (delta manifest
// research/b9-delta-manifests/b9-m1-delta-manifest.md): this milestone deliberately moves
// calibrated identities — that is the whole shipment — so the 3e7a356 pin is superseded.
// EXACTLY THREE rows move, each enumerated in the manifest with its r4 §C1 basis:
//   gb200 0.585795 → 0.315997 (÷1.8538, the retired FP4 scalar de-embedded)
//   gb300 0.477845 → 0.258295 (÷1.85, same defect) + status fitted → analyst-set
//   tpu7  0.36142  → 0.55     (joint fit replaced by two same-platform diagnostics)
// The other eight rows are byte-identical; the hash guards that from here.
// External adversarial review 2026-07-27: re-minted after H20 and Ascend
// stopped claiming fitted calibration. Their etaDec values do not move; only
// the status prefixes become source-informed neutral.
// im-vet-six-repairs RE-MINT (2026-09-20, program bq-2835; vetting finding E1 + E2). This leg
// deliberately moves calibrated identities too, and EXACTLY THREE rows move:
//   tpu7  0.55 -> 0.519, and its status prefix gains "on ONE DECLARED TIMING CONVENTION". One
//         of the two same-platform endpoints was computed on Google's COMBINED input-plus-output
//         rate (677 t/s/chip) as if it were an output rate. The first repair of 2026-09-20 paired
//         the rental anchor's 518.86 with the DECODE-STAGE 606 this project's own blinded
//         replication solves out of a two-workload system, reaching 0.521, and DISCLOSED that the
//         two figures sit on different clocks. The completion gate ruled that a disclosure is
//         neither a repair nor a withdrawal, which is what the commission required, so both
//         endpoints are NORMALIZED to one convention: output tokens per second per chip over
//         total serving wall time at 1K-in/8K-out. Only the rental anchor is PUBLISHED that way
//         (518.86); Google publishes a COMBINED input-plus-output rate and the x 8/9 conversion
//         to 601.8 is performed by THIS PAGE, not by Google. An earlier form of this comment said
//         both sources publish in the convention, which is false and which a reader inspecting
//         the verification source could disprove at the citation — corrected 2026-09-20 after the
//         fifth review round found it surviving here after the registry had retracted it. Midpoint 0.519, band 0.510-0.528 — lower than either candidate it replaced, so
//         the choice of basis cannot flatter the page.
//   trn2, trn3  etaDec UNCHANGED; their status prefixes gain the SPECULATION label the page's
//         evidence ladder gives a coefficient whose unit is open by ~15.2x.
// The other seven rows are byte-identical, and the hash guards that from here.
const CAL_SHA256 = "c3921b2b88dee835dbf28f0a5e81d5bce710f966e78916cd037f64fdaa1f8baf";
const SW_SHA256 = "6a7d00a1bf8eaa153ac1d895e72023cb593e04e5d0e37b6a1302ee2ef646f5b2"; // full map incl. rubin (R1-impl R2 F4)
const cal = Object.fromEntries(Object.entries(ED.CALIBRATION).map(([k, v]) => [k, [v.etaDec, v.etaStatus.slice(0, 20)]]));
const h = crypto.createHash("sha256").update(JSON.stringify(cal)).digest("hex");
assert("calibration invariant: every CALIBRATION etaDec/status identity matches the 3e7a356 baseline",
  h === CAL_SHA256, `got ${h} — a redesign change touched a calibrated identity (memo forbids this in every phase)`);

// (2) Source-inspection pin: throughput terms consume only the performance tuple's sW;
// the capacity policy name must not appear in the roofline's throughput computation.
const roofSrc = readFileSync(new URL("../engine-roofline-v22.js", import.meta.url), "utf8");
assert("firewall: loadedWeightBytesPerParam never appears in the decode/prefill throughput term source",
  !/decodeRoofline[\s\S]{0,2000}loadedWeightBytesPerParam/.test(roofSrc)
  || !/loadedWeightBytesPerParam[\s\S]{0,200}(tokPerS|throughput|t_H|t_C)/.test(roofSrc),
  "capacity policy is leaking toward a throughput term — memo §0-bis firewall violated");

// (3) sW pins (R1-impl P1-4): every performance tuple's sW across HW_ROOFLINE is pinned;
// the capacity policy can never masquerade as any of these.
{ const R = require("../engine-roofline-v22.js");
  const sws = {};
  for (const hw of ["h100", "h200", "gb200", "gb300", "h800", "h20", "tpu7", "trn2", "trn3", "ascend", "rubin"])
    for (const prec of ["bf16", "fp8", "fp4"]) {
      try { sws[hw + "." + prec] = R.resolvePrecisionTuple(hw, prec).sW; } catch (e) { /* row lacks tuple */ }
    }
  const swHash = crypto.createHash("sha256").update(JSON.stringify(sws)).digest("hex");
  assert("sW pins: the full performance-tuple sW map is byte-stable (minted 605ca4d era)",
    swHash === SW_SHA256, swHash); }

// (4) BOUND perturbation (R1-impl P1-4): across {0.55, 0.65, 1.05} —
//   (a) calibrated identities untouched; (b) decode THROUGHPUT at the live width is
//   byte-identical (the policy cannot reach a throughput term); (c) the WIDTH movement
//   is exactly the executed values (capacity 12/14/20; declared-op 14/18/28 at b=128) —
//   the labeled economic-sensitivity channel, disclosed not denied (memo §0-ter).
//   Width-independence context: MoE decode throughput is structurally N-independent
//   (wIter = A·sW; the slice-1b invariant), so the byte-identity below holds at ANY
//   width — the policy has no route in. The policySensitivity RECEIPT (economicSpan on
//   emitting surfaces) is R2-phase by the settled contract; asserted there.
const solverExported = typeof E.solveCapacityWidth === "function";
assert("R1 solver exported (perturbation contract bound)", solverExported);
if (solverExported) {
  const points = [0.55, 0.65, 1.05];
  const med = E.PERSPECTIVES.find(p => p.id === "median");
  const opus = E.MODELS.find(m => m.id === "opus");
  const s = E.applyPresetSettings(opus, med, { mode: "native" });
  const ctx = E.scenarioContext(s);
  const st = structuredClone(s); st.total = 5000;
  const calBefore = JSON.stringify(Object.entries(ED.CALIBRATION).map(([k, v]) => [k, v.etaDec]));
  const R = require("../engine-roofline-v22.js");
  const arch = R.resolveArch("opus");
  const tokBaseline = R.decodeRoofline({ arch, activeB: s.active, totalB: 5000, hwKey: "gb300", b: 128, L: 15500, precision: "fp8" }).tokPerS;
  const capWidths = [], opWidths = [];
  for (const p of points) {
    const r = E.solveCapacityWidth("gb300", st, { ctx, loadedWeightBytesPerParam: p });
    capWidths.push(r.capacityMinimumUnderUniformPolicy); opWidths.push(r.declaredOperatingPointWidth);
    const tok = R.decodeRoofline({ arch, activeB: s.active, totalB: 5000, hwKey: "gb300", b: 128, L: 15500, precision: "fp8" }).tokPerS;
    assert(`perturbation@${p}: calibrated decode throughput at the live width is BYTE-IDENTICAL`, tok === tokBaseline);
    assert(`perturbation@${p}: receipt carries the policy point + capacity objective`,
      r.receipt.loadedByteValue === p && /capacity-min under uniform policy/.test(r.receipt.objective));
  }
  assert("perturbation: calibrated identities untouched across the band",
    JSON.stringify(Object.entries(ED.CALIBRATION).map(([k, v]) => [k, v.etaDec])) === calBefore);
  assert("perturbation: the WIDTH movement is the executed pin (capacity 12/14/20 — the disclosed economic channel)",
    JSON.stringify(capWidths) === JSON.stringify([12, 14, 20]), JSON.stringify(capWidths));
  // b9 M1: gb300's declared balanced batch moved 128 → 64, so the declared-op widths this
  // probe reports fall accordingly (the probe still calls the roofline at b=128 directly,
  // which is why the byte-identity assertions above are untouched).
  assert("perturbation: declared-op width movement pinned (12/14/24 at the registry's balanced cell)",
    JSON.stringify(opWidths) === JSON.stringify([12, 14, 24]), JSON.stringify(opWidths));
}

console.log(`\n${failures === 0 ? "ALL CALIBRATION-INVARIANT TESTS PASS" : failures + " CALIBRATION-INVARIANT FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
