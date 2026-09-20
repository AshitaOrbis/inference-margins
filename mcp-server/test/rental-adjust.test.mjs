/* im-arc T3 — adjust_rental_rate contract (PLAN §4.1, verbatim field coverage). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { connectInMemory, sc } from "./harness.mjs";

const require = createRequire(import.meta.url);
const E = require("../../site/engine.js");

const fixtures = JSON.parse(readFileSync(new URL("./fixtures-im-arc.json", import.meta.url), "utf8"));
const h = await connectInMemory();
const calls = Object.fromEntries(await Promise.all(fixtures.rental_adjust_calls.map(async (input) =>
  [String(input.rent_usd_per_hr), await h.call("adjust_rental_rate", input)])));
const deepseekDefault = await h.call("adjust_rental_rate", { company: "deepseek", rent_usd_per_hr: 2.4 });
const partialMap = await h.call("adjust_rental_rate", { company: "anthropic",
  rent_usd_per_hr_by_hw: { h100: 3 } });
const inactiveMap = await h.call("adjust_rental_rate", { company: "anthropic",
  rent_usd_per_hr_by_hw: { h20: 3 } });
const stressCall = await h.call("adjust_rental_rate", { company: "anthropic",
  perspective: "stress-public-rate", rent_usd_per_hr: 2.4 });

test.after(async () => { await h.close(); });

test("T3-B-R1 adjust_rental_rate defaults to gptpro-r3 and resolves the company flagship", () => {
  const result = sc(calls["2.4"]);
  assert.equal(result.what_changed.scope.company, "anthropic");
  assert.equal(result.what_changed.scope.model, "opus");
  assert.equal(result.what_changed.scope.perspective, "gptpro-r3");
});

test("T3-B-R1b the existing model/dossier registries resolve DeepSeek's current flagship", () => {
  assert.equal(sc(deepseekDefault).what_changed.scope.model, "dsv4");
});

test("T3-B-R2 Anthropic/Opus rental ladder is monotone at $1.50, $2.40 and $5.27", () => {
  const rows = ["1.5", "2.4", "5.27"].map((key) => sc(calls[key]).what_changed.outputs);
  assert.ok(rows[0].margin_pct.adjusted.mid > rows[1].margin_pct.adjusted.mid);
  assert.ok(rows[1].margin_pct.adjusted.mid > rows[2].margin_pct.adjusted.mid);
  assert.ok(rows[0].cost_per_mtok.adjusted.mid < rows[1].cost_per_mtok.adjusted.mid);
  assert.ok(rows[1].cost_per_mtok.adjusted.mid < rows[2].cost_per_mtok.adjusted.mid);
});

test("T3-B-R3 what_changed carries every §4.1 field and low/mid/high triples", () => {
  const changed = sc(calls["2.4"]).what_changed;
  assert.equal(changed.variable, "rental $/accelerator-hour");
  assert.equal(typeof changed.scope.affected_basis, "string");
  assert.ok(changed.scope.affected_basis.length > 10);
  assert.ok(changed.from.by_hw && typeof changed.from.source === "string" && typeof changed.from.basis_label === "string");
  assert.ok(changed.to.by_hw && ["policy-scenario override", "evidence update"].some((prefix) => changed.to.kind.startsWith(prefix)));
  for (const metric of ["margin_pct", "cost_per_mtok", "lessor_spread_implied"])
    for (const phase of Object.values(changed.outputs[metric]))
      assert.deepEqual(Object.keys(phase).sort(), ["basis", "high", "label", "low", "mid"]);
  assert.equal(changed.outputs.margin_pct.adjusted.label, "middle assumption");
  assert.match(changed.outputs.margin_pct.adjusted.basis, /policy-scenario rental override/);
  assert.equal(typeof changed.metric, "string");
  assert.equal(typeof changed.uncertainty_basis, "string");
  assert.equal(typeof changed.warning, "string");
});

test("T3FIX-P1-5 gptpro-r3 propagates declared scenario uncertainty into rental deltas", () => {
  const outputs = sc(calls["2.4"]).what_changed.outputs;
  for (const [metric, phases] of Object.entries(outputs)) {
    for (const [phase, triple] of Object.entries(phases)) {
      assert.ok(triple.low <= triple.mid && triple.mid <= triple.high,
        `${metric}.${phase} is not ordered: ${JSON.stringify(triple)}`);
      assert.equal(triple.label, "middle assumption", `${metric}.${phase}`);
    }
  }
  assert.ok(outputs.margin_pct.delta_pp.low < outputs.margin_pct.delta_pp.high,
    JSON.stringify(outputs.margin_pct.delta_pp));
});

test("T3FIX-P1-6 every donor carries its registered rent source and reader-stated replacement receipt", () => {
  const changed = sc(calls["2.4"]).what_changed;
  const engineDataSource = readFileSync(new URL("../../site/engine-data-v22.js", import.meta.url), "utf8");
  const donors = Object.keys(changed.from.by_hw);
  assert.ok(donors.length > 0);
  for (const donor of donors) {
    const from = changed.from.by_hw[donor];
    const to = changed.to.by_hw[donor];
    assert.equal(typeof from.value, "number", donor);
    assert.equal(typeof from.source, "string", donor);
    assert.ok(engineDataSource.includes(from.source), `${donor} source is not verbatim engine-data-v22 provenance`);
    assert.equal(typeof to.value, "number", donor);
    assert.equal(to.source, "reader-stated", donor);
    assert.match(changed.sentence, new RegExp(`registeredRent\\{${donor}=`));
    assert.match(changed.sentence, new RegExp(`rentAbsLeg\\{${donor}=`));
  }
});

test("T3FIX-REVIEW-P1 partial donor maps receipt only reader-stated donors, including inactive keys", () => {
  const partial = sc(partialMap).what_changed;
  assert.deepEqual(Object.keys(partial.from.by_hw), ["h100"]);
  assert.deepEqual(Object.keys(partial.to.by_hw), ["h100"]);
  assert.equal(partial.to.by_hw.h100.source, "reader-stated");
  assert.doesNotMatch(partial.sentence, /rentAbsLeg\{h200=/);

  const inactive = sc(inactiveMap).what_changed;
  assert.deepEqual(Object.keys(inactive.from.by_hw), ["h20"]);
  assert.deepEqual(Object.keys(inactive.to.by_hw), ["h20"]);
  assert.equal(inactive.to.by_hw.h20.source, "reader-stated");
  assert.match(inactive.sentence, /rentAbsLeg\{h20=/);
});

test("T3FIX-REVIEW-P1 stress rental spread and scope use the same registry composition as margin", () => {
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "stress-public-rate");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  state.rentAbsAll = 2.4;
  const fleet = E.composeFleetFromDcRows(state, { modelId: "opus",
    dcRows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us" });
  const expected = E.blendedLessorSpread(state, { customFleet: fleet }).impliedShare * 100;
  const changed = sc(stressCall).what_changed;
  assert.ok(Math.abs(changed.outputs.lessor_spread_implied.adjusted.mid - expected) <= 5e-7,
    JSON.stringify({ actual: changed.outputs.lessor_spread_implied.adjusted.mid, expected }));
  assert.match(changed.scope.fleet, /registry/i);
  assert.doesNotMatch(changed.scope.fleet, /generic provider fleet/i);
});

test("T3-B-R4 spoken sentence names old → new, delta range, basis and the full warning", () => {
  const sentence = sc(calls["2.4"]).what_changed.sentence;
  assert.match(sentence, /old assumption/i);
  assert.match(sentence, /new assumption/i);
  assert.match(sentence, /delta/i);
  assert.match(sentence, /range/i);
  assert.match(sentence, /basis/i);
  assert.match(sentence, /policy scenario/i);
  assert.match(sentence, /not a measured margin/i);
  assert.match(sentence, /not a company gross margin/i);
});

test("T3-B-R5 out-of-bounds all-fleet and per-hardware inputs are rejected by input name", async () => {
  const all = await h.call("adjust_rental_rate", { company: "anthropic", rent_usd_per_hr: 0.01 });
  const map = await h.call("adjust_rental_rate", { company: "anthropic", rent_usd_per_hr_by_hw: { h100: 99 } });
  assert.equal(all.isError, true);
  assert.match(all.content[0].text, /rent_usd_per_hr/);
  assert.equal(map.isError, true);
  assert.match(map.content[0].text, /rent_usd_per_hr_by_hw\.h100/);
});
