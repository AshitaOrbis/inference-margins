/* U5 — the seven datacenter tools, driven through the REAL registered server over an in-memory
   transport, against one exact synthetic substrate release.

   What this file is for, in the words of the unit's done-when: contract/parity tests. The parity
   half is the load-bearing one — "for the same inputs, the browser calculator path and the MCP path
   produce the same DTO (same profile hash, same bands, same receipts)" — and it is asserted here
   against test/dcmap-parity-vector.json, the same committed answer the browser suite
   (dc-map/site/test/calculator-parity.test.ts) is asserted against. Neither consumer is the
   authority; both are measured against the shared economics layer's own output. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectInMemory, sc, text } from "./harness.mjs";
import {
  PARITY_VECTOR_PATH, REPO_ROOT, buildSyntheticRelease, ineligibleBundle, materializeRelease,
  overlappingBundle, parityProjection, replacementBundle, scenarioBundle,
} from "./dcmap-scenario-fixture.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const MCP = resolve(HERE, "..");
const RELEASES = resolve(MCP, ".dcmap-test-releases", "contract");
const built = materializeRelease(RELEASES, buildSyntheticRelease());
process.env.DCMAP_RELEASES = RELEASES;
delete process.env.DCMAP_RELEASE_ID;

const VECTOR = JSON.parse(readFileSync(PARITY_VECTOR_PATH, "utf8"));
const h = await connectInMemory();
test.after(async () => { await h.close(); });

const DATACENTER_TOOLS = ["list_datacenters", "get_datacenter", "rank_datacenters", "datacenter_schedule",
  "datacenter_impact", "datacenter_stakeholders", "price_token_from_site"];
const bundle = () => scenarioBundle(built.release_id);
const rankingScenarios = () => [scenarioBundle(built.release_id), replacementBundle(built.release_id),
  overlappingBundle(built.release_id), ineligibleBundle(built.release_id)];

test("the synthetic release is the one the committed parity vector was minted from", () => {
  assert.equal(built.release_id, VECTOR.release_id,
    "the shared fixture no longer mints the release the vector pins — re-mint it deliberately with " +
    "scripts/mint-dcmap-parity-vector.mjs and say why");
});

test("the eight existing tools keep their names AND their order; the seven are appended after them", async () => {
  const listed = (await h.client.listTools()).tools.map((t) => t.name);
  assert.deepEqual(listed.slice(0, 8), ["list_scenario_space", "query_margin_claims", "run_scenario",
    "adjust_rental_rate", "run_fleet_sections", "explore_range", "get_report", "get_dossier"]);
  assert.deepEqual(listed.slice(8), DATACENTER_TOOLS);
  assert.equal(new Set(listed).size, listed.length, "duplicate tool name");
});

test("every datacenter response leads with its own quotable sentence and names the exact release", async () => {
  const calls = {
    list_datacenters: {}, get_datacenter: { site_id: "test-alpha" },
    datacenter_schedule: { site_id: "test-alpha" }, datacenter_stakeholders: { site_id: "test-alpha" },
    price_token_from_site: { scenario: bundle() },
    rank_datacenters: { comparison: bundle().comparison, scenarios: rankingScenarios() },
    datacenter_impact: { baseline: bundle(), replacement: replacementBundle(built.release_id) },
  };
  for (const [tool, args] of Object.entries(calls)) {
    const result = await h.call(tool, args);
    const structured = sc(result);
    assert.equal(structured.tool, tool);
    assert.ok(structured.sentence.length > 0, `${tool}: empty sentence`);
    assert.equal(text(result), structured.sentence, `${tool}: the leading text is not the sentence`);
    assert.equal(structured.release_id, built.release_id, `${tool}: response does not name the exact release`);
    assert.ok(structured.selection_receipt, `${tool}: no selection receipt`);
    /* isError ONLY for the three request-level failures. A transparent insufficient-evidence or
       not-found answer is a normal response: clients suppress structuredContent on isError, which
       would hide the named missing components that are the point of the refusal. */
    const expectError = ["invalid-request", "release-mismatch", "release-unavailable"].includes(structured.status);
    assert.equal(result.isError === true, expectError, `${tool}: isError disagrees with status ${structured.status}`);
  }
});

test("factual tools carry the typed not-applicable selection state — no margin scenario is selected", async () => {
  for (const [tool, args] of [["list_datacenters", {}], ["get_datacenter", { site_id: "test-alpha" }],
    ["datacenter_schedule", { site_id: "test-alpha" }], ["datacenter_stakeholders", { site_id: "test-alpha" }]]) {
    const receipt = sc(await h.call(tool, args)).selection_receipt;
    assert.equal(receipt.state, "not-applicable", `${tool} claims a margin selection`);
    assert.ok(receipt.reason.length > 0, `${tool} gives no reason for the not-applicable state`);
  }
});

test("list_datacenters: physical default, coverage counts, and non-physical only on request", async () => {
  const base = sc(await h.call("list_datacenters", {})).data;
  assert.deepEqual(base.sites.map((s) => s.slug), ["test-alpha", "test-beta"]);
  assert.equal(base.coverage.default_sites, 2);
  assert.equal(base.coverage.nonphysical_entities, 0);
  assert.ok(base.capacity.note.includes("never independently added"),
    "the capacity total does not state the parent/child rule it applied");
  const withNonPhysical = sc(await h.call("list_datacenters", { include_nonphysical: true })).data;
  assert.ok(withNonPhysical.sites.some((s) => s.slug === "test-delta"),
    "an identity-unresolved record is not returned even on explicit request");
  assert.equal(sc(await h.call("list_datacenters", { country: "Nowhere" })).data.sites.length, 0);
});

test("list_datacenters: a pagination cursor is bound to the exact release and to the filters", async () => {
  const page = sc(await h.call("list_datacenters", { limit: 1 })).data;
  assert.equal(page.sites.length, 1);
  assert.ok(page.next_cursor, "no cursor for a truncated page");
  const next = sc(await h.call("list_datacenters", { limit: 1, cursor: page.next_cursor })).data;
  assert.deepEqual(next.sites.map((s) => s.slug), ["test-beta"]);
  const wrongFilters = await h.call("list_datacenters", { limit: 1, cursor: page.next_cursor, country: "Testland" });
  assert.equal(sc(wrongFilters).status, "invalid-request");
  assert.equal(wrongFilters.isError, true);
});

test("get_datacenter: promoted atoms keep their claim nature, and conflicts are not-exported rather than empty", async () => {
  const data = sc(await h.call("get_datacenter", { site_id: "test-alpha" })).data;
  assert.equal(data.site.slug, "test-alpha");
  assert.ok(data.promoted_evidence.length > 0);
  for (const atom of data.promoted_evidence) {
    assert.equal(atom.record_kind, "adjudicated");
    assert.ok(typeof atom.claim_nature === "string" && atom.claim_nature.length > 0);
  }
  assert.equal(data.conflicts.status, "not-exported");
  assert.deepEqual(data.scenarios, [], "factual retrieval invented a scenario");
  const missing = sc(await h.call("get_datacenter", { site_id: "no-such-site" }));
  assert.equal(missing.status, "not-found");
});

test("price_token_from_site reproduces the committed parity vector exactly — same hash, bands and receipts", async () => {
  const result = await h.call("price_token_from_site", { scenario: bundle() });
  const priced = sc(result).data;
  assert.equal(result.isError, undefined, "a modeled price is not a tool error");
  assert.equal(priced.status, "modeled");
  assert.equal(priced.profile_hash, VECTOR.profile_hash);
  assert.deepEqual(parityProjection(priced), VECTOR.priced,
    "the MCP path and the committed economics-layer answer disagree");
  assert.ok(priced.run_scenario, "a modeled priced result must carry the run_scenario envelope");
  assert.equal(priced.run_scenario.sentence, priced.sentence);
  assert.equal(priced.run_scenario.headline.epistemic_status, "derived-estimate");
  assert.equal(priced.coverage.provider_allocation, "unresolved");
  assert.equal(priced.coverage.factual_coverage_increased, false);
  assert.equal(priced.value.scope.result, "modeled",
    "a priced result is modeled even when every input it consumed was disclosed");
});

test("an insufficient-evidence price NAMES its missing components and is not a tool error", async () => {
  const incomplete = bundle();
  incomplete.pool.verified_zero_components = [];
  const result = await h.call("price_token_from_site", { scenario: incomplete });
  const priced = sc(result).data;
  assert.equal(result.isError, undefined, "a transparent refusal must not be flagged as a tool failure");
  assert.equal(priced.status, "insufficient-evidence");
  assert.equal(priced.value, null);
  assert.equal(priced.annual_cost, null);
  assert.equal(priced.run_scenario, null);
  for (const component of ["network", "support", "cooling", "water", "taxes"]) {
    assert.ok(priced.missing.some((m) => m.includes(component)), `missing component ${component} is not named`);
  }
  assert.ok(sc(result).reasons.length > 0, "the reasons array does not relay the missing components");
});

test("an unsplit mixed inventory stays unsplit — it is never priced as one accelerator", async () => {
  const unsplit = bundle();
  unsplit.pool.hardware = [{ kind: "unsplit", hw_keys_present: ["h100", "h200"], count: 100, evidence_id: "hardware-1" }];
  const priced = sc(await h.call("price_token_from_site", { scenario: unsplit })).data;
  assert.equal(priced.status, "insufficient-evidence");
  assert.equal(priced.coverage.hardware, "unsplit");
  assert.ok(priced.missing.some((m) => m.includes("unsplit mixed inventory")));
});

test("rank_datacenters: overlap groups, a labelled midpoint sort, and exclusions with reasons", async () => {
  const overlap = sc(await h.call("rank_datacenters",
    { comparison: bundle().comparison, scenarios: rankingScenarios() })).data;
  assert.equal(overlap.profile_hash, VECTOR.profile_hash);
  assert.deepEqual(overlap.groups, VECTOR.ranked.groups);
  assert.deepEqual(overlap.excluded, VECTOR.ranked.excluded);
  assert.deepEqual(overlap.eligible.map((r) => r.scenario_id), VECTOR.ranked.eligible_ids);
  assert.deepEqual(overlap.eligible.map((r) => r.value.band), VECTOR.ranked.eligible_bands);
  assert.equal(overlap.sentence, VECTOR.ranked.sentence);

  /* The sentence is the quotable unit, so what it does NOT say is contractual too. */
  assert.ok(overlap.sentence.includes("among these eligible scenarios"));
  assert.ok(!/cheapest/i.test(overlap.sentence), "the ranking sentence claims a cheapest datacenter");
  const ambiguous = overlap.groups.find((g) => g.scenario_ids.length > 1);
  assert.ok(ambiguous, "the fixture no longer exercises an ambiguous overlap group");
  assert.ok(ambiguous.interpretation.includes("not a proven tie"));
  assert.ok(ambiguous.interpretation.includes("no supported internal rank"));
  assert.equal(overlap.excluded[0].reasons.length > 0, true);

  const midpoint = sc(await h.call("rank_datacenters",
    { comparison: bundle().comparison, scenarios: rankingScenarios(), sort: "midpoint" })).data;
  assert.equal(midpoint.ordering_basis, VECTOR.ranked_midpoint.ordering_basis);
  assert.ok(midpoint.ordering_basis.startsWith("labelled midpoint sort"), "a midpoint sort is not labelled as one");
  assert.ok(midpoint.sentence.includes("labelled midpoint sort"));
  assert.deepEqual(midpoint.eligible.map((r) => r.scenario_id), VECTOR.ranked_midpoint.eligible_ids);
  assert.deepEqual(midpoint.groups, VECTOR.ranked.groups,
    "a midpoint sort silently changed the overlap groups it is not allowed to resolve");
});

test("a comparison entry never carries a per-scenario run_scenario envelope", async () => {
  const ranked = sc(await h.call("rank_datacenters",
    { comparison: bundle().comparison, scenarios: rankingScenarios() })).data;
  for (const entry of ranked.eligible) assert.equal(entry.run_scenario, null);
});

test("rank_datacenters refuses a registered profile id the substrate does not publish", async () => {
  /* A quotable ranking is pinned to a registered comparison profile, and the substrate publishes
     none yet — so the honest answer is a refusal with reasons, not a ranking against an invented
     profile. Nothing is ranked, no group is formed, and the request is named in `excluded`. */
  const ranked = sc(await h.call("rank_datacenters",
    { comparison: { profile_id: "not-registered" }, scenarios: [bundle()] })).data;
  assert.equal(ranked.status, "insufficient-evidence");
  assert.deepEqual(ranked.eligible, []);
  assert.deepEqual(ranked.groups, []);
  assert.equal(ranked.profile_hash, null, "an unregistered profile still produced a canonical hash");
  assert.ok(ranked.excluded.length > 0 && ranked.excluded[0].reasons.length > 0,
    "the refusal names no reason");
});

test("datacenter_impact needs a NAMED allocation assumption; it never defaults one", async () => {
  const args = { baseline: bundle(), replacement: replacementBundle(built.release_id) };
  const without = sc(await h.call("datacenter_impact", args));
  assert.equal(without.status, "insufficient-evidence");
  assert.equal(without.data.adjusted, null);
  assert.ok(without.reasons.some((r) => r.includes("provider allocation is unresolved")));
  assert.ok(without.receipts.some((r) => r.kind === "unresolved-dependency" && r.component === "allocation"));

  const withShare = sc(await h.call("datacenter_impact", {
    ...args,
    allocation: { share: 0.25, assumption: { id: "alloc", scope: "modeled", evidence_ids: [],
      description: "Synthetic U5 named allocation assumption; no disclosure implied." } },
  }));
  assert.equal(withShare.status, "modeled");
  assert.equal(withShare.data.central_label, "modeled comparison baseline, not a verified central margin");
  assert.ok(withShare.data.adjusted.band.lo > withShare.data.central.band.lo);
  assert.ok(withShare.data.what_changed.some((c) => c.component === "costs"),
    "what_changed does not name the pool component that differs");
});

test("release pinning: a request for another release is a typed mismatch, never a substitution", async () => {
  const other = "rel-" + "0".repeat(24);
  for (const [tool, args] of [["list_datacenters", { release_id: other }],
    ["get_datacenter", { release_id: other, site_id: "test-alpha" }],
    ["price_token_from_site", { release_id: other, scenario: bundle() }]]) {
    const result = await h.call(tool, args);
    assert.equal(sc(result).status, "release-mismatch", `${tool} did not refuse a foreign release`);
    assert.equal(result.isError, true, `${tool} did not flag a release mismatch as a request error`);
    assert.equal(sc(result).release_id, built.release_id, `${tool} did not name the release it is pinned to`);
  }
});

test("a malformed request never computes: the transport rejects it, and so does the layer", async () => {
  /* Two boundaries, and both must refuse. The MCP SDK validates against the PUBLISHED schema — U3's
     own `InputSchemas`, not a restatement — so a field-level violation is rejected before the
     handler runs. Anything the published shape admits but the strict schema rejects (a cursor from
     another release, a cursor carrying different filters) comes back as the layer's own typed
     invalid-request, with the reason naming what was wrong. */
  const rejected = await h.call("get_datacenter", { site_id: "" });
  assert.equal(rejected.isError, true, "the transport accepted a field the published schema forbids");
  assert.ok(/site_id/.test(text(rejected)), "the transport rejection does not name the offending field");

  const layerRejected = await h.call("list_datacenters", { cursor: "not-a-dcmap-cursor" });
  assert.equal(sc(layerRejected).status, "invalid-request");
  assert.equal(layerRejected.isError, true);
  assert.deepEqual(sc(layerRejected).reasons, ["invalid cursor"]);
  assert.equal(sc(layerRejected).data, null, "an invalid request still returned data");
});

test("list_scenario_space carries the dc-map block additively — the original keys are untouched", async () => {
  const space = sc(await h.call("list_scenario_space", {}));
  for (const key of ["models", "perspectives", "traffic_profiles", "margin_buckets", "override_bounds",
    "reports", "fleets", "dc_registry", "coverage_ledgers", "evidence_schema", "rent_quotes",
    "planning_policy", "regions", "sections_schema", "band_schema", "defaults", "metric_definition"]) {
    assert.ok(space[key] !== undefined, `list_scenario_space lost its existing key ${key}`);
  }
  const dc = space.datacenters;
  assert.equal(dc.status, "ok");
  assert.equal(dc.release_id, built.release_id);
  assert.deepEqual(dc.tools, DATACENTER_TOOLS);
  assert.deepEqual(dc.accepted_ids.sites, ["test-alpha", "test-beta", "test-delta"]);
  assert.ok(dc.accepted_ids.hardware.includes("h100"));
  assert.deepEqual(dc.accepted_ids.comparison_profiles, [],
    "the substrate publishes no registered comparison profile; discovery must say so rather than mint one");
  for (const tool of DATACENTER_TOOLS) assert.ok(dc.schemas.tools[tool], `no published schema for ${tool}`);
  assert.equal(dc.compatibility.release_id, built.release_id);
  assert.equal(dc.compatibility.contract, "dc-map/v0.3");
  assert.ok(dc.metrics.some((m) => m.id === "cost-per-million-tokens"));
});

test("the vendored U3 layer is byte-identical to dc-map/economics/src", () => {
  const source = resolve(REPO_ROOT, "dc-map", "economics", "src");
  const vendored = resolve(MCP, "src", "dcmap", "economics");
  const names = readdirSync(source).filter((f) => f.endsWith(".ts")).sort();
  assert.ok(names.length >= 8, "economics source looks truncated");
  for (const name of names) {
    assert.deepEqual(readFileSync(resolve(vendored, name)), readFileSync(resolve(source, name)),
      `the vendored copy of ${name} has drifted from dc-map/economics/src`);
  }
  const manifest = JSON.parse(readFileSync(resolve(vendored, "VENDORED.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest.modules).sort(), names);
});
