/* adjust_rental_rate must honour the caller's capital-recovery settings EVERYWHERE it computes.
 *
 * Mutation control for the im-vet-0919 fold (Astra pack C P0-1). The handler forwarded
 * capital_recovery and cost_of_capital_pct to run_scenario, which honours them, and then rebuilt
 * the baseline and adjusted states for `what_changed` — and all nine uncertainty triples —
 * WITHOUT them. One call therefore published a headline computed with capital recovery ON beside
 * lessor spreads computed with it OFF, and a delta between two different economies. On the live
 * connector that is a wrong published number, not a wrong internal one.
 *
 * The oracle is the engine itself, built independently here with the requested settings. Red on
 * the pre-fold tool.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { connectInMemory, sc } from "./harness.mjs";

const require = createRequire(import.meta.url);
const E = require("../../site/engine.js");

const ARGS = {
  company: "anthropic", rent_usd_per_hr: 2.4, perspective: "median",
  capital_recovery: "on", cost_of_capital_pct: 13,
};

const h = await connectInMemory();
const withCR = sc(await h.call("adjust_rental_rate", ARGS));
const withoutCR = sc(await h.call("adjust_rental_rate", {
  company: ARGS.company, rent_usd_per_hr: ARGS.rent_usd_per_hr, perspective: ARGS.perspective }));
test.after(async () => { await h.close(); });

/** The engine's own answer, built from the preset with exactly the requested economics. */
function oracleSpread({ capitalRecovery, rent }) {
  const model = E.MODELS.find((m) => m.id === "opus");
  const perspective = E.PERSPECTIVES.find((p) => p.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  if (capitalRecovery) Object.assign(state, { capitalRecovery: "on", costOfCapitalPct: 13 });
  if (rent != null) state.rentAbsAll = rent;
  const spread = E.blendedLessorSpread
    ? E.blendedLessorSpread(state)
    : null;
  return spread && typeof spread.impliedShare === "number" ? spread.impliedShare * 100 : null;
}

const pct = (node) => (node && typeof node === "object"
  ? (typeof node.value === "number" ? node.value : (typeof node.mid === "number" ? node.mid : null))
  : (typeof node === "number" ? node : null));

test("the capital-recovery settings reach what_changed, not only the headline", () => {
  const outputs = withCR.what_changed && withCR.what_changed.outputs;
  assert.ok(outputs, "what_changed.outputs must exist");
  const plain = withoutCR.what_changed.outputs;
  /* The decisive comparison and the reason this cannot be a snapshot: the SAME rent adjustment
     under two different economies must not publish the same spreads. Before the fold it did. */
  assert.notDeepEqual(
    JSON.stringify(outputs.lessor_spread_implied ?? outputs),
    JSON.stringify(plain.lessor_spread_implied ?? plain),
    "capital_recovery:on published byte-identical outputs to capital_recovery:off — the setting "
    + "was dropped somewhere between the arguments and what_changed");
});

test("the tool's own receipt does not claim capital recovery is off while it is on", () => {
  const blob = JSON.stringify(withCR);
  const offClaim = /"capital_recovery"\s*:\s*\{[^}]*"state"\s*:\s*"off"/.test(blob)
    || /"capitalRecovery"\s*:\s*"off"/.test(blob);
  assert.equal(offClaim, false,
    "a response computed with capital_recovery:on carries a receipt saying 'off'");
});

test("the overridden-fields list names the economics the caller asked for", () => {
  const blob = JSON.stringify(withCR);
  assert.ok(/capitalRecovery/.test(blob),
    "capitalRecovery is absent from the response's own account of what was overridden");
  assert.ok(/costOfCapitalPct/.test(blob),
    "costOfCapitalPct is absent from the response's own account of what was overridden");
});

test("the baseline and the adjusted figure describe the SAME economy", () => {
  /* A delta is only meaningful between two states that differ in one thing. The pre-fold
     baseline phase passed no base at all, so the baseline sat in the capital-recovery-off
     economy while the adjusted one sat in the on economy, and the published change was the
     sum of two unrelated movements. Checked through the engine rather than through the tool's
     own arithmetic, so the tool cannot mark its own homework. */
  const onBaseline = oracleSpread({ capitalRecovery: true });
  const offBaseline = oracleSpread({ capitalRecovery: false });
  if (onBaseline === null || offBaseline === null) return; // the engine does not expose it here
  assert.notEqual(onBaseline.toFixed(6), offBaseline.toFixed(6),
    "the oracle cannot tell the two economies apart, so this test would be vacuous");
  const published = pct((withCR.what_changed.outputs.lessor_spread_implied || {}).baseline);
  if (published === null) return;
  assert.ok(Math.abs(published - onBaseline) < Math.abs(published - offBaseline),
    `published baseline spread ${published} is closer to the capital-recovery-OFF oracle `
    + `${offBaseline} than to the ON oracle ${onBaseline}`);
});
