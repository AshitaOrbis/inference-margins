/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22):
   absolute-rent resolution, codec, and null-default identity contract. Written red-first. */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");
const BASE = require("./fixtures-baseline-v22.json");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const M = id => E.MODELS.find(m => m.id === id);
const P = id => E.PERSPECTIVES.find(p => p.id === id);
const state = (mid = "opus", pid = "median") => E.applyPresetSettings(M(mid), P(pid), { mode: "native" });

assert("T1 engine exports lessorSpread", typeof E.lessorSpread === "function");
assert("T1 engine exports blendedLessorSpread", typeof E.blendedLessorSpread === "function");
assert("T1 defaults carry nullable rentAbsAll", Object.hasOwn(E.DEFAULTS, "rentAbsAll") && E.DEFAULTS.rentAbsAll === null);
assert("T1 defaults carry nullable rentAbsLeg", Object.hasOwn(E.DEFAULTS, "rentAbsLeg") && E.DEFAULTS.rentAbsLeg === null);
assert("T1 rentAbsAll bounds equal CF_BOUNDS.rentPerHr", JSON.stringify(E.SCENARIO_BOUNDS.rentAbsAll) === JSON.stringify(CF.CF_BOUNDS.rentPerHr));
assert("T1 rentAbsLeg bounds equal CF_BOUNDS.rentPerHr", JSON.stringify(E.SCENARIO_BOUNDS.rentAbsLeg) === JSON.stringify(CF.CF_BOUNDS.rentPerHr));

{
  const s = state();
  const hw = E.HW.h100;
  const registered = E.hwHourCost(hw, s);
  s.rentMult = 1.7;
  s.rentMultLeg = { h100: 1.4 };
  const ladder = E.hwHourCost(hw, s);
  s.rentAbsAll = 2;
  const all = E.hwHourCost(hw, s);
  s.rentAbsLeg = { h100: 3 };
  const leg = E.hwHourCost(hw, s);
  assert("T1 rent ladder still moves the registered rate", ladder !== registered);
  assert("T1 resolution order is leg absolute > all absolute > multiplier ladder", leg === 3 && all === 2, `${leg}/${all}`);
  assert("T1 absolute rent is not multiplied by global or per-leg multipliers", leg === 3 && all === 2);
}

{
  const good = E.sanitizeScenarioDiff({ rentAbsAll: 2, rentAbsLeg: { h100: 3, tpu7: 0.05 } });
  const low = E.sanitizeScenarioDiff({ rentAbsAll: 0.01 });
  const badLeg = E.sanitizeScenarioDiff({ rentAbsLeg: { h100: 51 } });
  const unknown = E.sanitizeScenarioDiff({ rentAbsLeg: { notHardware: 2 } });
  assert("T1 sanitizer accepts in-bounds absolute rents", good.diff.rentAbsAll === 2 && good.diff.rentAbsLeg?.h100 === 3, JSON.stringify(good));
  assert("T1 sanitizer rejects rentAbsAll below the bound with the key named", !Object.hasOwn(low.diff, "rentAbsAll") && low.rejected.some(x => x.includes("rentAbsAll")), JSON.stringify(low));
  assert("T1 sanitizer rejects out-of-bounds rentAbsLeg whole", !Object.hasOwn(badLeg.diff, "rentAbsLeg") && badLeg.rejected.some(x => x.includes("rentAbsLeg")), JSON.stringify(badLeg));
  assert("T1 sanitizer rejects unknown rentAbsLeg keys whole", !Object.hasOwn(unknown.diff, "rentAbsLeg") && unknown.rejected.some(x => x.includes("rentAbsLeg")), JSON.stringify(unknown));
}

{
  const s = state();
  s.rentAbsAll = 2;
  s.rentAbsLeg = { h100: 3 };
  const tr = E.resolveTraffic(M("opus"), P("median"), { mode: "native" });
  const token = E.encodeScenario(s, "opus", "median", tr, null, { fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" });
  const decoded = E.decodeScenario(token);
  assert("T1 codec round-trips rentAbsAll", decoded?.rentAbsAll === 2, JSON.stringify(decoded));
  assert("T1 codec round-trips rentAbsLeg", decoded?.rentAbsLeg?.h100 === 3, JSON.stringify(decoded));

  const clean = state();
  const cleanToken = E.encodeScenario(clean, "opus", "median", tr, null, { fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" });
  const cleanHash = createHash("sha256").update(cleanToken).digest("hex");
  /* im-arc T2 (memo §6, 2026-08-22): the generic electricity default and
     DEFAULTS_EPOCH intentionally moved. Re-mint the token hash for that named
     migration; the assertions above still prove no absolute-rent key appeared.
     im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): re-minted again for the
     T4 defaults move and its epoch bump. The property under test is unchanged and still holds —
     a clean mint carries NO absolute-rent key — and the assertions above are what prove it; this
     hash only pins the token those unchanged assertions were checked against.
     im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     re-minted a third time. The property is unchanged for the third time — a clean mint carries NO
     absolute-rent key, and the assertions above are what prove it. Adopting REGISTRY rents cannot
     put an absolute-rent key in a token, and this hash pins the token those assertions ran against.
     im-vet-six-repairs (2026-09-20, vetting finding E1): re-minted a fourth time, and the property
     is unchanged for the fourth time. The Trainium withdrawal changes the BLEND a clean mint
     encodes — five member legs instead of seven — which is a fleet-membership fact, not an
     absolute-rent key; the assertions above are still what prove no such key appeared. */
  assert("T1 permalink minted without absolute-rent keys matches the vetting-repairs epoch", cleanHash === "8fbf71f0b598ee2fac50970c9c61473e2521b50614ce59ba825b7ed9cac743a4", cleanHash);
}

{
  let checked = 0;
  for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
    const frozen = BASE.pairs[`${m.id}|${p.id}`];
    if (!frozen) continue;
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    const marginOk = frozen.margin === null ? !isFinite(w.margin) : Math.abs(w.margin * 100 - frozen.margin) < 5e-4;
    const cOutOk = frozen.cOut === null ? !isFinite(w.cOut) : Math.abs(w.cOut - frozen.cOut) < 5e-6;
    if (!(marginOk && cOutOk)) assert(`T1 null-default baseline ${m.id}|${p.id}`, false, `${w.margin * 100}/${w.cOut}`);
    checked++;
  }
  assert("T1 null-default keys preserve all 180 frozen margin/cOut pairs", checked === 180, String(checked));
  const ref = E.pinReferenceLevers(state());
  /* im-arc T4 fold (2026-08-24, declared delta): the reference-lever state moves with the
     defaults it is built on. It is still the SAME pin — one state, one exact value, re-minted
     under a named migration, never a tolerance. */
  assert("T1 reference state stays byte-identical", E.workload(ref).margin === 0.5843046405779231, String(E.workload(ref).margin));
}

if (typeof E.lessorSpread === "function" && typeof E.blendedLessorSpread === "function") {
  const s = state();
  const spread = E.lessorSpread("h100", s);
  assert("T1 lessorSpread ratio uses rentHr/tcoHr", spread.ratio === spread.rentHr / spread.tcoHr, JSON.stringify(spread));
  assert("T1 lessorSpread impliedShare is 1 - tcoHr/rentHr", spread.impliedShare === 1 - spread.tcoHr / spread.rentHr, JSON.stringify(spread));
  assert("T1 lessorSpread is positive for a priced row", spread.ratio > 0);
  const unpriced = E.lessorSpread("rubin", s);
  assert("T1 lessorSpread returns NaNs for an unpriced row", Object.values(unpriced).every(Number.isNaN), JSON.stringify(unpriced));

  const def = { id: "cf:t1abs", name: "T1 absolute", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [{ donorKey: "h100", label: "H100 custom", sharePct: 100, overrides: { rentPerHr: 10, capexUsd: 100000 }, basisDeclared: "inherit", family: CF.donorFamily("h100") }] };
  const cs = state(); cs.rentAbsAll = 2; cs.rentAbsLeg = { h100: 3 };
  const custom = E.blendedLessorSpread(cs, { customFleet: def });
  assert("T1 donor-key rentAbsLeg wins over custom-fleet rentPerHr", custom.rentHr === 3, JSON.stringify(custom));
  const customLeg = E.lessorSpread("h100", cs, def.legs[0]);
  assert("T1 lessorSpread raw custom leg applies its row and channel overrides", customLeg.rentHr === 3 && customLeg.tcoHr > spread.tcoHr, JSON.stringify(customLeg));
}

console.log(`\n${failures === 0 ? "ALL RENT-ABSOLUTE T1 TESTS PASS" : failures + " RENT-ABSOLUTE T1 FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
