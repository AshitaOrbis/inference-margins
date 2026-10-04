// Exercise the same contract requests and the complete published report/dossier catalogs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contractBatteryCalls } from "./contract-battery.mjs";
import { connectInMemory, engine, sc } from "./harness.mjs";
import { findInternalRefs } from "../../scripts/check-no-internal-refs.mjs";
import { scenarioBundle, replacementBundle } from "./dcmap-scenario-fixture.mjs";

test("all tool text outputs exclude internal process references", async () => {
  const h = await connectInMemory();
  const failures = [];
  const exercised = new Set();
  async function check(name, args, label = name) {
    exercised.add(name);
    const result = await h.call(name, args);
    const blocks = (result.content || []).filter((block) => block.type === "text");
    assert.ok(blocks.length > 0, `${label}: tool returned no text`);
    for (const block of blocks) {
      for (const hit of findInternalRefs(block.text))
        failures.push(`${label}:${hit.line}: ${hit.shape}`);
    }
    return result;
  }
  try {
    for (const [key, name, args] of contractBatteryCalls) await check(name, args, key);
    const catalog = sc(await check("list_scenario_space", {}));
    for (const { id } of catalog.reports) {
      for (const format of ["text", "html"]) {
        let offset = 0;
        while (true) {
          const result = sc(await check("get_report", { id, format, offset, max_chars: 200000 }, `report:${id}:${format}:${offset}`));
          if (!result.truncated) break;
          assert.ok(result.next_offset > offset, "report pagination must advance");
          offset = result.next_offset;
        }
      }
    }
    for (const type of ["model", "perspective"])
      for (const id of Object.keys(engine.DOSSIERS[`${type}s`]))
        await check("get_dossier", { type, id }, `dossier:${type}:${id}`);
    const fixtures = JSON.parse(readFileSync(new URL("./fixtures-im-arc.json", import.meta.url), "utf8"));
    for (const args of fixtures.rental_adjust_calls) await check("adjust_rental_rate", args);
    await check("run_fleet_sections", fixtures.fleet_sections_call);
    // Datacenter tools also expose text when no substrate release is available.
    const scenario = scenarioBundle("public-text-check");
    const calls = {
      list_datacenters: {}, get_datacenter: { site_id: "test-alpha" },
      datacenter_schedule: { site_id: "test-alpha" }, datacenter_stakeholders: { site_id: "test-alpha" },
      price_token_from_site: { scenario },
      rank_datacenters: { comparison: scenario.comparison, scenarios: [scenario] },
      datacenter_impact: { baseline: scenario, replacement: replacementBundle("public-text-check") },
    };
    for (const [name, args] of Object.entries(calls)) await check(name, args);
    const tools = (await h.client.listTools()).tools;
    assert.deepEqual([...exercised].sort(), tools.map(({ name }) => name).sort(), "every registered tool must be exercised");
    for (const tool of tools)
      for (const hit of findInternalRefs(JSON.stringify(tool))) failures.push(`tool:${tool.name}:${hit.line}: ${hit.shape}`);
    assert.deepEqual(failures, [], `${failures.length} internal reference shape(s) in connector outputs`);
  } finally {
    await h.close();
  }
});
