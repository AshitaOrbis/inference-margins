/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22):
   two-basis engine contract for the paired cards and accelerator tables. Written red-first. */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const m = E.MODELS.find(x => x.id === "opus");
const p = E.PERSPECTIVES.find(x => x.id === "gptpro-r3");
const registeredPerspective = E.PERSPECTIVES.find(x => x.id === "median");
const sel = { mode: "native" };
const fresh = () => E.applyPresetSettings(m, p, sel);
const freshRegistered = () => E.applyPresetSettings(m, registeredPerspective, sel);

/* im-arc T1 fix (Sol review 2026-08-22, findings P1-1/P1-2/P1-3): execute the
   renderer's pure string builders in Node, rather than duplicating their branches in this test. */
const appSource = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
const helperMatch = appSource.match(/\/\* BEGIN im-arc T1 pure presentation helpers \*\/([\s\S]*?)\/\* END im-arc T1 pure presentation helpers \*\//);
assert("T1 renderer exposes a Node-renderable pure presentation-helper block", !!helperMatch);
const appHelpers = helperMatch
  ? Function(`${helperMatch[1]}; return { readerRentActive, rentTableTitle, rentCounterpartNote, rentSegmentText, counterpartBandText, stackTableCells, stackRawDeltaRow };`)()
  : null;

assert("T1 engine exports marginOnBasis", typeof E.marginOnBasis === "function");
assert("T1 engine exports blendedLessorSpread", typeof E.blendedLessorSpread === "function");

if (typeof E.marginOnBasis === "function") {
  const s = fresh();
  const before = JSON.stringify(s);
  const via = E.marginOnBasis(s, "tco");
  const direct = structuredClone(s); direct.hwMode = "tco";
  const directResult = E.workload(direct, undefined, E.scenarioContext(s));
  assert("T1 marginOnBasis(tco) equals the direct hwMode:tco workload", via.margin === directResult.margin && via.cOut === directResult.cOut, `${via.margin}/${directResult.margin}`);
  assert("T1 marginOnBasis never mutates its state", JSON.stringify(s) === before);
  assert("T1 owned card value for opus/gptpro-r3 is the engine TCO value", Math.round(via.margin * 100) === Math.round(directResult.margin * 100));

  let checked = 0, equal = true;
  for (const key of E.HW_ORDER) {
    const one = fresh(); one.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, k === key ? 100 : 0]));
    for (const basis of ["rent", "tco"]) {
      const table = E.marginOnBasis(one, basis);
      const directState = structuredClone(one); directState.hwMode = basis;
      const perHw = E.marginOnHw(key, directState, undefined, E.scenarioContext(one));
      if (!(Object.is(table.margin, perHw.margin) && Object.is(table.cOut, perHw.cOut))) equal = false;
      checked++;
    }
  }
  assert("T1 per-accelerator table values equal marginOnHw on both bases", equal && checked === E.HW_ORDER.length * 2, String(checked));

  const dials = E.dialsFromRanges(s.dialRanges);
  const bands = E.marginBandsPerDial(m, p, sel, dials, { base: { ...s, hwMode: "tco" } });
  const directBands = dials.filter(d => isFinite(d.lo) && isFinite(d.hi) && d.hi > d.lo)
    .map(d => E.marginBand(m, p, sel, [d], { base: { ...s, hwMode: "tco" } }));
  assert("T1 TCO card band equals the same per-dial corner evaluation", bands.length > 0 && bands.every((b, i) => b.lo === directBands[i].lo && b.hi === directBands[i].hi), JSON.stringify(bands));

  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-2): the counterpart is the
     compounded corner box, not the union of one-dial-at-a-time spans. */
  const compounded = E.marginBand(m, p, sel, dials, { base: { ...s, hwMode: "tco" } });
  const union = { lo: Math.min(...bands.map(b => b.lo)), hi: Math.max(...bands.map(b => b.hi)) };
  assert("T1 TCO counterpart compounded band is finite and materially wider than the one-dial union",
    !compounded.refused && isFinite(compounded.lo) && isFinite(compounded.hi)
      && compounded.lo < union.lo && compounded.hi > union.hi,
    JSON.stringify({ compounded, union }));
  if (appHelpers) {
    const rendered = appHelpers.counterpartBandText(compounded);
    assert("T1 rendered TCO counterpart span equals the engine compounded corner box",
      rendered === `middle assumption · selected span (compounded over the declared ranges): ≈${Math.round(compounded.lo)}% – ≈${Math.round(compounded.hi)}%`, rendered);
  }
}

if (typeof E.blendedLessorSpread === "function" && typeof E.marginOnBasis === "function") {
  const s = fresh();
  const spread = E.blendedLessorSpread(s);
  const rent = E.marginOnBasis(s, "rent");
  const tco = E.marginOnBasis(s, "tco");
  assert("T1 blendedLessorSpread rent cost matches rent-basis workload", spread.rentCostPerMtok === rent.costMix, `${spread.rentCostPerMtok}/${rent.costMix}`);
  assert("T1 blendedLessorSpread TCO cost matches TCO-basis workload", spread.tcoCostPerMtok === tco.costMix, `${spread.tcoCostPerMtok}/${tco.costMix}`);
  assert("T1 blended rent-minus-TCO cost is consistent", spread.rentCostPerMtok - spread.tcoCostPerMtok === rent.costMix - tco.costMix);
}

/* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): renderer and table consume
   this one engine row model; both positive and negative signed columns must add to Total. */
assert("T1 engine exports pure stackRowsFor", typeof E.stackRowsFor === "function");
if (typeof E.stackRowsFor === "function") {
  const positiveRows = E.stackRowsFor(fresh(), true);
  const negativeState = fresh(); negativeState.rentAbsAll = 0.05;
  const negativeRows = E.stackRowsFor(negativeState, true);
  const sums = row => Object.values(row.tcoComponents).reduce((a, v) => a + v, 0) + row.rentMinusTco;
  const close = (a, b) => Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
  assert("T1 positive-spread stack rows retain four TCO columns plus rent-minus-TCO and sum to Total",
    positiveRows.some(row => row.rentMinusTco >= 0)
      && positiveRows.every(row => !row.renderable || close(sums(row), row.total)),
    JSON.stringify(positiveRows));
  assert("T1 rentAbsAll 0.05 produces below-TCO rows whose signed columns sum to the rent-basis Total",
    negativeRows.some(row => row.rentBelowTco)
      && negativeRows.filter(row => row.rentBelowTco).every(row => row.rentMinusTco < 0 && close(sums(row), row.total)),
    JSON.stringify(negativeRows));
  if (appHelpers && typeof appHelpers.stackTableCells === "function") {
    /* im-arc T1 director fix (fix-verify 2026-08-23, rounds 1–2, P1-1 residual): the DISPLAYED cells must
       sum to the DISPLAYED total — checked on the printed strings. All six cells are uniform 3-decimal
       toFixed strings (never locale-grouped), and the signed column closes the row exactly. */
    const parse = x => { assert("T1 stack-table cell is a plain 3-decimal dollar string (no locale grouping possible)", /^\$-?\d+\.\d{3}$/.test(x), x); return Math.round(Number(String(x).replace("$", "")) * 1000); };
    const rowsOk = rows => rows.filter(r => r.renderable).every(r => {
      const cells = appHelpers.stackTableCells(Object.values(r.tcoComponents), r.total);
      return cells.length === 6 && cells.slice(0, 5).reduce((a, c) => a + parse(c), 0) === parse(cells[5]);
    });
    const big = fresh(); big.rentAbsAll = 50; big.util = 1; // $/Mtok in the thousands
    const bigRows = E.stackRowsFor(big, true);
    assert("T1 DISPLAYED stack-table cells sum to the DISPLAYED total on every positive row", rowsOk(positiveRows));
    assert("T1 DISPLAYED stack-table cells sum to the DISPLAYED total on every negative (below-TCO) row", rowsOk(negativeRows));
    /* Round-3 fix-verify (2026-08-23): the header's promise — the raw signed delta lives in the bar tooltip —
       must hold on positive AND negative rows. The tooltip row comes from one pure helper, and the renderer
       must call it on both tooltip branches (source parity). */
    const fmt$ = v => v >= 100 ? "$" + Math.round(v).toLocaleString() : v >= 10 ? "$" + v.toFixed(1) : v >= 1 ? "$" + v.toFixed(2) : "$" + v.toFixed(v >= 0.1 ? 2 : 3);
    const rawOk = rows => rows.filter(r => r.renderable).every(r => { const row = appHelpers.stackRawDeltaRow(r, fmt$); return row[0] === "rent − modelled TCO (raw, signed)" && row[1] === fmt$(r.rentMinusTco); });
    assert("T1 tooltip raw-delta row carries the raw signed rent − modelled TCO on positive rows", rawOk(positiveRows));
    assert("T1 tooltip raw-delta row carries the raw signed rent − modelled TCO on negative rows", rawOk(negativeRows));
    assert("T1 renderer appends the raw-delta tooltip row on BOTH tooltip branches", (appSource.match(/stackRawDeltaRow\(r, fmt\$\)/g) || []).length === 2);
    assert("T1 DISPLAYED stack-table cells sum to the DISPLAYED total on thousands-range rows (no grouping separators)", rowsOk(bigRows) && bigRows.filter(r => r.renderable).some(r => /^\$\d{4,}\./.test(appHelpers.stackTableCells(Object.values(r.tcoComponents), r.total)[5])));
  }
  if (appHelpers) {
    const spread = E.blendedLessorSpread(negativeState);
    const money = v => "$" + Number(v).toFixed(3);
    const sentence = appHelpers.rentSegmentText(spread, money);
    assert("T1 negative-spread card uses the explicit BELOW-modelled-TCO sentence",
      sentence === `Rental-inclusive. The stated rent (≈${money(spread.rentCostPerMtok)}/Mtok) is BELOW this page's modelled TCO (≈${money(spread.tcoCostPerMtok)}/Mtok) — implied spread ${spread.ratio.toFixed(1)}×; no lessor's cut is implied above modelled TCO at these rates.`, sentence);
  }
}

/* im-arc T1 fix (Sol review 2026-08-22, finding P1-3): one predicate drives both
   reader-stated surfaces, and both registered/default strings remain covered. */
if (appHelpers) {
  const registered = freshRegistered();
  const reader = freshRegistered(); reader.rentAbsAll = 2;
  assert("T1 readerRentActive distinguishes registered defaults from an absolute reader price",
    appHelpers.readerRentActive(registered) === false && appHelpers.readerRentActive(reader) === true);
  assert("T1 rent table title flips between inferred and reader-stated rents",
    appHelpers.rentTableTitle(registered) === "Inferred rents → margin per accelerator"
      && appHelpers.rentTableTitle(reader) === "Reader-stated rents → margin per accelerator");
  assert("T1 counterpart note flips between registered planning and reader-stated rates",
    appHelpers.rentCounterpartNote(registered, "1.2×").includes("at the registered planning rates")
      && appHelpers.rentCounterpartNote(reader, "1.2×").includes("at the reader-stated rates"));
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): section-owned
     receipts control the table/card label and ignore unrelated global rent edits. */
  const sectionReceipt = { hasSectionRates: true, hasRegistered: true };
  assert("T2 section rent labels disclose stated receipts plus registered fallbacks",
    appHelpers.rentTableTitle(reader, sectionReceipt)
      === "Section-stated rents + registered planning rents → margin per accelerator"
      && appHelpers.rentCounterpartNote(reader, "1.2×", sectionReceipt)
        .includes("at the section-stated rents + registered planning rents"));
}

console.log(`\n${failures === 0 ? "ALL TWO-CARD T1 TESTS PASS" : failures + " TWO-CARD T1 FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
