/* im-arc T3 — run_fleet_sections contract and shared-validator parity. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { connectInMemory, engine, sc } from "./harness.mjs";

const fixtures = JSON.parse(readFileSync(new URL("./fixtures-im-arc.json", import.meta.url), "utf8"));
const model = engine.MODELS.find((row) => row.id === "grok");
const perspective = engine.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
const state = engine.applyPresetSettings(model, perspective, { mode: "native" });
const fixture = engine.composeFleetFromDcRows(state, { modelId: model.id,
  dcRows: ["xai-colossus-c1", "xai-colossus-ii"], fill: "generic-us",
  id: "cf:t3mcp01", name: "MCP fixture" });
const h = await connectInMemory();

test.after(async () => { await h.close(); });

test("T3-B-F1 sections path returns per-section triples, blend, coverage, envelope and share URL", async () => {
  const input = fixtures.fleet_sections_call;
  const result = await h.call("run_fleet_sections", input);
  const output = sc(result);
  assert.equal(result.isError, undefined);
  assert.equal(output.sections.length, input.sections.length);
  assert.deepEqual(output.sections.map((section) => section.share.mid), [60, 40]);
  for (const section of output.sections) {
    assert.equal(typeof section.basis, "string");
    assert.deepEqual(Object.keys(section.share).sort(), ["basis", "high", "label", "low", "mid"]);
    for (const field of ["cost_per_mtok", "margin"])
      assert.deepEqual(Object.keys(section[field]).sort(), ["basis", "high", "label", "low", "mid"]);
  }
  assert.ok(output.blended && output.coverage_ledger && output.coverage_ledger.sentence);
  /* im-arc T4 fold (2026-08-24) [F3]: coverage percentages are derived by the one resolver. */
  assert.deepEqual(output.preset_coverage_ledger,
    engine.coverageSentenceParts(engine.coverageForPreset("opus")));
  assert.match(output.share_url, /^https:\/\/margins\.ashitaorbis\.com\/\?s=v7\./);
  assert.ok(output.selection_receipt && Array.isArray(output.claims_sidecar));
});

test("T3-B-F2 dc_rows path composes two rows plus generic remainder and emits the matching coverage", async () => {
  const result = sc(await h.call("run_fleet_sections", { model: "grok", perspective: "gptpro-r3",
    dc_rows: ["xai-colossus-c1", "xai-colossus-ii"], fill: "generic-us" }));
  /* im-arc T4 fold (2026-08-24), memo §1.1 and §1.5: Colossus C1 states its inventory as ONE
     unsplit mixed aggregate, so it allocates no fleet weights and composes no section — the
     scenario now rests on Colossus 2 alone (gb200 25 + gb300 25) with a 50-point generic
     remainder. And its coverage is 0/0/100: the Colossus rows prove typed accelerators are
     PRESENT at a site, never that a share of the modeled Grok blend is SERVED there. */
  assert.deepEqual(result.sections.map((section) => section.share.mid), [50, 50]);
  /* The Colossus 2 section carries gb200 and gb300, neither of which has an admissible public
     planning rate after the fold, so the section reports itself UNPRICED with a stated reason
     rather than failing the whole call closed. The generic-fill section still prices, and the
     blended band is computed over what prices.
     im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     that reason expired. gb200 and gb300 carry adopted provisional planning rates now, so the
     section PRICES and there is nothing to report unpriced. Re-minted from the executed reading —
     and deliberately not shrunk to `unpriced_reason === null`, which would pass just as happily if
     the section had silently stopped computing a margin at all. What replaces the unpriced branch
     is the positive fact it used to stand in for: both sections price, with finite margins, and
     the blend is computed over both rather than over the generic fill alone. */
  assert.equal(result.sections[0].unpriced_reason, null,
    "the Colossus 2 section prices now that gb200 and gb300 carry adopted planning rates");
  assert.ok(!result.sections[0].margin.unpriced && Number.isFinite(result.sections[0].margin.mid),
    "and it prices to a finite margin rather than merely dropping the unpriced flag: "
    + JSON.stringify(result.sections[0].margin));
  assert.equal(result.sections[1].unpriced_reason, null);
  assert.ok(Number.isFinite(result.sections[1].margin.mid));
  assert.ok(Number.isFinite(result.blended.margin.mid)
    && result.blended.margin.mid > Math.min(result.sections[0].margin.mid, result.sections[1].margin.mid)
    && result.blended.margin.mid < Math.max(result.sections[0].margin.mid, result.sections[1].margin.mid),
    "the blend is computed over BOTH priced sections — it lies between them, which it could not do "
    + "while one of the two contributed nothing: " + JSON.stringify(result.blended.margin.mid));
  assert.equal(result.coverage_ledger.values.named_site_serving_evidence_pct, 0);
  assert.equal(result.coverage_ledger.values.programme_type_evidence_pct, 0);
  assert.equal(result.coverage_ledger.values.generic_fill_pct, 100);
  assert.equal(result.coverage_ledger.subordinate.value, 0,
    "the SKU/workload count-backed line is present and non-additive");
  assert.ok(result.sections.every((section) => Array.isArray(section.fallback_receipts)));
  assert.ok(result.sections.some((section) => section.fallback_receipts.length > 0));
  assert.match(result.sentence, /fallback/i);
});

test("T3-B-F3 MCP rejects exactly what the builder's shared validator rejects", async () => {
  const invalid = structuredClone(fixture.sections);
  invalid[0].dcRef = "not-a-row";
  const direct = engine.validateFleetSections({ id: "cf:t3bad01", name: "bad", epoch: engine.DEFAULTS_EPOCH,
    clonedFrom: null, sections: invalid });
  assert.equal(direct.ok, false);
  const result = await h.call("run_fleet_sections", { model: "grok", sections: invalid });
  assert.equal(result.isError, true);
  assert.ok(direct.errors.some((message) => result.content[0].text.includes(message)));
});

test("T3-B-F4 sections and dc_rows are mutually exclusive and fill is required on dc_rows", async () => {
  const both = await h.call("run_fleet_sections", { model: "grok", sections: fixture.sections,
    dc_rows: ["xai-colossus-c1"], fill: "generic-us" });
  const noFill = await h.call("run_fleet_sections", { model: "grok", dc_rows: ["xai-colossus-c1"] });
  assert.equal(both.isError, true);
  assert.equal(noFill.isError, true);
});

test("T3FIX-A3 normalized section shares carry the declared value and total through the MCP receipt", async () => {
  /* im-arc T4 fold (2026-08-24): section[0] is now the Colossus 2 row, whose two donors have no
     admissible public planning rate — a fleet made of it alone prices nothing and the tool
     correctly fails closed. This case is about SHARE NORMALIZATION, so it runs on the section that
     prices; the unpriced path has its own assertion in T3-B-F2 above. */
  const lone = structuredClone(fixture.sections[1]);
  lone.sharePct = 70;
  const loneResult = sc(await h.call("run_fleet_sections", { model: "grok", perspective: "gptpro-r3",
    sections: [lone] }));
  assert.equal(loneResult.sections[0].share.mid, 100);
  assert.match(loneResult.sections[0].share.basis, /normalized from a declared 70 \(declared shares summed to 70\)/);
  assert.deepEqual(loneResult.sections[0].share_normalization,
    { declaredSharePct: 70, declaredTotalPct: 70, normalizedSharePct: 100 });
  assert.match(loneResult.sentence, /normalized from a declared 70/i);

  const pair = structuredClone(fixtures.fleet_sections_call.sections);
  pair[0].sharePct = 60;
  pair[1].sharePct = 30;
  const pairResult = sc(await h.call("run_fleet_sections", { model: "grok", perspective: "gptpro-r3",
    sections: pair }));
  assert.deepEqual(pairResult.sections.map((section) => section.share.mid), [66.666667, 33.333333]);
  assert.ok(pairResult.sections.every((section) => section.share_normalization.declaredTotalPct === 90));
  assert.match(pairResult.sentence, /declared shares summed to 90/i);
});

/* im-arc T3 FIX-3 (2026-08-23), item C1: the MCP twin consumes the SAME pure
   coverage functions the page's #fleet-coverage-line renders, so the two surfaces
   must print one identical sentence for one identical composition. A formatter
   added in either caller instead of in coverageSentenceParts breaks this. */
test("T3FIX3-C1 the MCP coverage sentence is byte-equal to the page's engine expression", async () => {
  const opus = engine.MODELS.find((row) => row.id === "opus");
  const gptpro = engine.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
  const opusState = engine.applyPresetSettings(opus, gptpro, { mode: "native" });
  const composed = engine.composeFleetFromDcRows(opusState, { modelId: "opus",
    dcRows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us",
    id: "cf:mcpfleet", name: `${opus.name} MCP data-center fleet` });
  const pageSentence = engine.coverageSentenceParts(
    engine.coverageForFleetSections(composed.sections, "opus")).sentence;
  const result = sc(await h.call("run_fleet_sections", { model: "opus", perspective: "gptpro-r3",
    dc_rows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us" }));
  assert.equal(result.coverage_ledger.sentence, pageSentence);
  const printed = [...pageSentence.matchAll(/(\d+(?:\.\d+)?)%/g)].map((match) => match[1]);
  assert.deepEqual(printed.filter((text) => !/^\d+(\.\d)?$/.test(text)), [], pageSentence);
  for (const value of Object.values(result.coverage_ledger.values))
    assert.equal(value, Math.round(value * 10) / 10, `${value} carries more than one decimal`);
});

/* im-arc T3 FIX-3 (2026-08-23), item C2: a selected registry row that receives no
   donor allocation is dropped by the composer. Keep the partition rule, disclose the
   drop — on the structured field AND in the spoken Composition receipts sentence. */
test("T3FIX3-C2 dc_rows discloses a selected row that received no donor allocation", async () => {
  const result = sc(await h.call("run_fleet_sections", { model: "opus", perspective: "gptpro-r3",
    dc_rows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us" }));
  assert.equal(result.sections.filter((section) => section.dc_ref).length, 1);
  assert.ok(Array.isArray(result.composition_receipts), "composition_receipts must be an array");
  assert.deepEqual(result.composition_receipts.map((receipt) => receipt.rowId),
    ["anthropic-rainier-trainium"]);
  assert.equal(result.composition_receipts[0].classification, "not-composed");
  assert.deepEqual(result.composition_receipts[0].hwKeys, ["trn2"]);
  assert.match(result.composition_receipts[0].reason, /gptpro-r3/);
  /* Both channels carry it by design: the coverage sentence because the ONE engine
     function owns it and the page must stay byte-equal (C1), the Composition receipts
     sentence because that is where this tool speaks composition events. */
  assert.match(result.sentence, /Composition receipts:[\s\S]*anthropic-rainier-trainium/);
  assert.match(result.coverage_ledger.sentence, /Coverage fallbacks:[\s\S]*anthropic-rainier-trainium/);
});
