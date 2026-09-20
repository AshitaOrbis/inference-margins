/* im-arc T3 — Pro 2026-07-29 rec 3 policy-scenario tool-description vocabulary. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const labels = readFileSync(new URL("../mcp-server/src/labels.ts", import.meta.url), "utf8");
const registeredNoun = labels.match(/policyScenarioOutput:\s*"([^"]+)"/)?.[1] || "";
assert.equal(registeredNoun, "policy-scenario output", "T3-B-V0 claim vocabulary registers the policy-scenario noun");
/* U5 (dc-map DESIGN §6) appended seven datacenter tools. The gate covers every REGISTERED tool —
   the length assertion below is what keeps that true — so the seven are listed here and their
   descriptions are held to the same retired-vocabulary rule as the original eight. */
const files = [
  "mcp-server/src/tools/list_scenario_space.ts",
  "mcp-server/src/tools/query_margin_claims.ts",
  "mcp-server/src/tools/run_scenario.ts",
  "mcp-server/src/tools/adjust_rental_rate.ts",
  "mcp-server/src/tools/run_fleet_sections.ts",
  "mcp-server/src/tools/explore_range.ts",
  "mcp-server/src/tools/get_report.ts",
  "mcp-server/src/tools/get_dossier.ts",
  "mcp-server/src/tools/list_datacenters.ts",
  "mcp-server/src/tools/get_datacenter.ts",
  "mcp-server/src/tools/rank_datacenters.ts",
  "mcp-server/src/tools/datacenter_schedule.ts",
  "mcp-server/src/tools/datacenter_impact.ts",
  "mcp-server/src/tools/datacenter_stakeholders.ts",
  "mcp-server/src/tools/price_token_from_site.ts",
];
const DATACENTER_FILES = files.filter((f) => /list_datacenters|get_datacenter|rank_datacenters|datacenter_|price_token_from_site/.test(f));
const retired = /\bestimat(?:e|es|ed)\b|estimated actual|central estimate/i;
const server = readFileSync(new URL("../mcp-server/src/server.ts", import.meta.url), "utf8");
const instructions = server.match(/const INSTRUCTIONS\s*=\s*`([\s\S]*?)`;\s*\n/)?.[1] || "";
assert.ok(instructions.length > 100, "T3-B-V4 server instructions are present and testable");
assert.doesNotMatch(instructions, retired,
  "T3-B-V4 server instructions reject retired estimate vocabulary");
for (const file of files) {
  const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const configPrefix = source.match(/export const config\s*=\s*\{([\s\S]*?)\n\s*inputSchema:/)?.[1] || "";
  const usesPolicyHelper = /description:\s*policyScenarioToolDescription\(/.test(configPrefix);
  if (["run_scenario", "adjust_rental_rate", "run_fleet_sections"].some((name) => file.includes(name)))
    assert.ok(usesPolicyHelper, `T3-B-V1 ${file} draws its description noun from the claim vocabulary helper`);
  const description = usesPolicyHelper ? `Returns a ${registeredNoun}. ${configPrefix}` : configPrefix;
  assert.ok(description.length > 20, `T3-B-V1 ${file} exposes a testable description`);
  assert.doesNotMatch(description, retired,
    `T3-B-V2 ${file} registered description rejects retired estimate vocabulary`);
  if (usesPolicyHelper)
    assert.match(description, /policy-scenario output/i, `T3-B-V3 ${file} uses the registered policy-scenario noun`);
  /* U5: a datacenter tool draws the shared honest-labeling rider from ONE helper, the same way the
     three policy tools draw their noun from one — a per-tool restatement is what drifts. */
  if (DATACENTER_FILES.includes(file))
    assert.match(configPrefix, /description:\s*datacenterToolDescription\(/,
      `U5-V1 ${file} builds its description through the shared datacenter helper`);
  if (file.endsWith("adjust_rental_rate.ts"))
    assert.doesNotMatch(configPrefix, /provider model's generic fleet/i,
      "T3FIX-REVIEW-P2 rental tool description must not misdescribe the registry-composed stress perspective");
}
const registered = server.match(/const tools\s*=\s*\[([\s\S]*?)\];/)?.[1]
  .split(",").map((name) => name.trim()).filter(Boolean) || [];
assert.equal(registered.length, files.length, "T3-B-V5 vocabulary gate covers every registered tool");
/* U5: the shared rider itself is held to the same rule, since it reaches every datacenter
   description and no per-file check above can see it. */
const layer = readFileSync(new URL("../mcp-server/src/dcmap/layer.ts", import.meta.url), "utf8");
const rider = layer.match(/export function datacenterToolDescription\(body: string\): string \{([\s\S]*?)\n\}/)?.[1] || "";
assert.ok(rider.length > 100, "U5-V2 the shared datacenter description rider is present and testable");
assert.doesNotMatch(rider, retired, "U5-V2 the shared datacenter rider rejects retired estimate vocabulary");
assert.match(rider, /modeled scenario output with receipts/i,
  "U5-V3 the shared datacenter rider carries the modeled-with-receipts identity");
const transports = readFileSync(new URL("../mcp-server/test/transports.test.mjs", import.meta.url), "utf8");
assert.match(transports, /expectReadOnlyToolSurface/,
  "T3FIX-P1-7 transport contract names its tool-surface expectation honestly");
for (const tool of ["adjust_rental_rate", "run_fleet_sections", "price_token_from_site", "rank_datacenters"])
  assert.match(transports, new RegExp(`"${tool}"`),
    `T3FIX-P1-7 transport expected-name set includes ${tool}`);
let workerParity = "";
try {
  workerParity = readFileSync(new URL("../mcp-server/worker/test/new-tools-parity.test.mjs", import.meta.url), "utf8");
} catch { /* red state: the Worker regression test does not exist */ }
for (const tool of ["adjust_rental_rate", "run_fleet_sections"])
  assert.match(workerParity, new RegExp(`call\\(.*["']${tool}["']`),
    `T3FIX-P1-7 Worker parity suite invokes ${tool}`);
console.log("ALL MCP POLICY VOCABULARY T3 TESTS PASS");
