/* U5 — what the connector does when there is NO release to answer from, and what it does when the
   bytes are not the ones the manifest describes.

   DESIGN §1.7 E9: "a release that cannot be served returns a typed `release-unavailable` /
   `release-mismatch` result and never falls back to latest". So the interesting assertions here are
   negative ones: nothing is computed, nothing is substituted, and the refusal is typed rather than
   an exception or an empty registry that reads like "there are no datacenters".

   Its own process, pointed at a directory with no active release. */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectInMemory, sc, text } from "./harness.mjs";
import { buildSyntheticRelease, materializeRelease, scenarioBundle } from "./dcmap-scenario-fixture.mjs";

const MCP = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const EMPTY = resolve(MCP, ".dcmap-test-releases", "absent");
rmSync(EMPTY, { recursive: true, force: true });
mkdirSync(EMPTY, { recursive: true });
process.env.DCMAP_RELEASES = EMPTY;
delete process.env.DCMAP_RELEASE_ID;

const h = await connectInMemory();
test.after(async () => { await h.close(); });

const DATACENTER_CALLS = {
  list_datacenters: {}, get_datacenter: { site_id: "test-alpha" },
  datacenter_schedule: { site_id: "test-alpha" }, datacenter_stakeholders: { site_id: "test-alpha" },
  price_token_from_site: { scenario: scenarioBundle("rel-" + "a".repeat(24)) },
  rank_datacenters: { comparison: scenarioBundle("rel-" + "a".repeat(24)).comparison,
    scenarios: [scenarioBundle("rel-" + "a".repeat(24))] },
  datacenter_impact: { baseline: scenarioBundle("rel-" + "a".repeat(24)),
    replacement: scenarioBundle("rel-" + "a".repeat(24)) },
};

test("with no active release every datacenter tool refuses, typed, and computes nothing", async () => {
  for (const [tool, args] of Object.entries(DATACENTER_CALLS)) {
    const result = await h.call(tool, args);
    const structured = sc(result);
    assert.equal(structured.status, "release-unavailable", `${tool} did not refuse`);
    assert.equal(result.isError, true, `${tool} did not flag the refusal as a request error`);
    assert.equal(structured.data, null, `${tool} returned data without a release`);
    assert.equal(structured.release_id, null, `${tool} named a release it could not open`);
    assert.equal(text(result), structured.sentence, `${tool} lost its quotable sentence`);
    assert.ok(structured.sentence.includes("No other release was substituted"),
      `${tool} does not state that it refused rather than fell back`);
    assert.equal(structured.selection_receipt.state, "not-applicable");
    assert.ok(structured.reasons.length > 0, `${tool} refused without a reason`);
  }
});

test("a refusal reason never publishes a server filesystem path", async () => {
  const structured = sc(await h.call("list_datacenters", {}));
  for (const reason of structured.reasons) {
    assert.ok(!/\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/.test(reason),
      `a refusal reason carries a server path: ${reason}`);
  }
  assert.equal(structured.release_binding.kind, "filesystem");
  assert.equal(structured.release_binding.root, "dc-map/releases");
});

/* bq-2188, and READ THE SCOPE LINE BEFORE TRUSTING THIS. Everything in this file runs against an
   intentionally ABSENT release, so every assertion here — including this one — describes the
   REFUSAL path. An Astra xhigh review (2026-09-10, finding B2) checked exactly that and proved it:
   reintroducing the success-path defect leaves this whole file green. A test that survives its own
   bug is not coverage, and saying otherwise would be the more expensive mistake.

   What this case IS good for is the other half of the claim — that the binding is emitted by the
   LAYER, uniformly, for all seven tools, rather than by whichever branch someone remembered. The
   success path is pinned where it can actually be observed, against a materialized synthetic
   release, in mcp-server/test/dcmap-success-binding.test.mjs, and that file DOES fail when the fix
   is removed. The two are deliberately separate processes: the layer pins one release for the life
   of a process, so "no release" and "a release" cannot be observed in the same one. */
test("every datacenter tool names its release binding on the REFUSAL path — the layer emits it, not one branch", async () => {
  for (const [tool, args] of Object.entries(DATACENTER_CALLS)) {
    const structured = sc(await h.call(tool, args));
    assert.ok(structured.release_binding, `${tool} answered without naming where its bytes came from`);
    assert.equal(structured.release_binding.kind, "filesystem", `${tool} named a binding of the wrong kind`);
  }
});

test("discovery says the substrate is unavailable rather than publishing an empty registry", async () => {
  const dc = sc(await h.call("list_scenario_space", {})).datacenters;
  assert.equal(dc.status, "release-unavailable");
  assert.equal(dc.release_id, null);
  assert.equal(dc.accepted_ids, null, "an unopened release published an accepted-id list");
  assert.equal(dc.compatibility, null);
  assert.ok(dc.reasons.length > 0);
  /* the eight existing tools keep working: an absent substrate release is not an outage */
  const space = sc(await h.call("list_scenario_space", {}));
  assert.ok(space.models.length > 0 && space.metric_definition.title.length > 0);
  assert.equal((await h.call("run_scenario", { model: "opus" })).isError, undefined);
});

test("a tampered artifact is a release-mismatch, and the reason names the artifact, not its path", async () => {
  const dir = resolve(MCP, ".dcmap-test-releases", "tampered");
  const built = materializeRelease(dir, buildSyntheticRelease());
  const summary = resolve(dir, built.release_id, "summary.json");
  const parsed = JSON.parse(readFileSync(summary, "utf8"));
  parsed.note = parsed.note + " tampered";
  writeFileSync(summary, JSON.stringify(parsed));

  const { loadRelease } = await import(resolve(MCP, "dist/dcmap/economics-node/loader.js"));
  const opened = await loadRelease(dir);
  assert.equal(opened.ok, false);
  assert.equal(opened.status, "release-mismatch");
  assert.ok(opened.reasons.some((r) => r.includes("summary.json") && r.includes("digest mismatch")),
    `the digest failure is not named: ${JSON.stringify(opened.reasons)}`);
});

test("a release marked FAILED is never served", async () => {
  const dir = resolve(MCP, ".dcmap-test-releases", "failed");
  const built = materializeRelease(dir, buildSyntheticRelease());
  writeFileSync(resolve(dir, built.release_id, "FAILED.json"), JSON.stringify({ reason: "synthetic" }));
  const { loadRelease } = await import(resolve(MCP, "dist/dcmap/economics-node/loader.js"));
  const opened = await loadRelease(dir);
  assert.equal(opened.ok, false);
  assert.equal(opened.status, "release-unavailable");
});

test("publicReason keeps the diagnostic and drops the tree it came from", async () => {
  const { publicReason } = await import(resolve(MCP, "dist/dcmap/substrate.js"));
  assert.equal(publicReason("ENOENT: no such file or directory, open '/srv/someone/deep/tree/CURRENT'"),
    "ENOENT: no such file or directory, open 'CURRENT'");
  assert.equal(publicReason("site-data.json digest mismatch"), "site-data.json digest mismatch");
  /* A repository-relative name is not a server path and must survive whole — an earlier cut cut
     it to "dc-mapCURRENT", which is neither the path nor a usable diagnostic. */
  assert.equal(publicReason("dc-map/releases/CURRENT is not present in this tree"),
    "dc-map/releases/CURRENT is not present in this tree");
  assert.equal(publicReason("x".repeat(500)).length, 300);
});
