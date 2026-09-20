/* U5 deliverable 3 — release binding for the Worker.

   The Cloudflare Worker has no filesystem, so the substrate release is embedded at build time. This
   suite drives the REAL build script (worker/scripts/build.mjs) rather than a copy of its logic,
   because the property being asserted is a property of the build: what it embeds, what it refuses
   to embed, and what it refuses to build at all.

   It lives here, under `npm --prefix mcp-server test`, on purpose. The Worker's own suite needs a
   wrangler/agents toolchain that is not part of this unit's required gate, and a release-binding
   contract that only runs in an optional suite is the same thing the release gate itself was found
   to be in August 2026: a contract nothing executes, which is a comment. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSyntheticRelease, materializeRelease } from "./dcmap-scenario-fixture.mjs";

const MCP = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const WORKER = resolve(MCP, "worker");
const GEN = resolve(WORKER, "src", "gen");
const RELEASE_GEN = resolve(GEN, "dcmap", "release.gen.ts");

/** Run the worker build with a given environment; return {ok, output}. */
function runBuild(env = {}) {
  try {
    return { ok: true, output: execFileSync(process.execPath, ["scripts/build.mjs"],
      { cwd: WORKER, encoding: "utf8", env: { ...process.env, ...env } }) };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

/** The generated module is TypeScript; read the one literal it exports. */
function embeddedRelease() {
  const source = readFileSync(RELEASE_GEN, "utf8");
  const start = source.indexOf("export const EMBEDDED_RELEASE: EmbeddedRelease = ");
  assert.notEqual(start, -1, "release.gen.ts does not export EMBEDDED_RELEASE");
  const json = source.slice(source.indexOf("{", start), source.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

const ABSENT = resolve(MCP, ".dcmap-test-releases", "worker-absent");
rmSync(ABSENT, { recursive: true, force: true });
const VALID = resolve(MCP, ".dcmap-test-releases", "worker-valid");
const built = materializeRelease(VALID, buildSyntheticRelease());

test("the build copies the seven datacenter tools and the vendored layer, and swaps the substrate", () => {
  const result = runBuild({ DCMAP_RELEASES: ABSENT });
  assert.ok(result.ok, `worker build failed:\n${result.output}`);
  for (const tool of ["list_datacenters", "get_datacenter", "rank_datacenters", "datacenter_schedule",
    "datacenter_impact", "datacenter_stakeholders", "price_token_from_site"]) {
    assert.ok(existsSync(resolve(GEN, "tools", `${tool}.ts`)), `${tool} was not copied into the Worker bundle`);
    assert.deepEqual(readFileSync(resolve(GEN, "tools", `${tool}.ts`)),
      readFileSync(resolve(MCP, "src", "tools", `${tool}.ts`)), `${tool} was not copied verbatim`);
  }
  assert.ok(existsSync(resolve(GEN, "dcmap", "economics", "query.ts")), "the vendored U3 layer was not bundled");
  assert.deepEqual(readFileSync(resolve(GEN, "dcmap", "substrate.ts")),
    readFileSync(resolve(WORKER, "overrides", "dcmap-substrate.ts")),
    "the worker-native substrate bridge was not swapped in");
  /* The Node-only loader must NOT reach a runtime with no filesystem. */
  assert.equal(existsSync(resolve(GEN, "dcmap", "economics-node")), false,
    "the node:fs release loader was bundled into the Worker");
});

test("with no active release the build succeeds and embeds a typed unavailable record", () => {
  const result = runBuild({ DCMAP_RELEASES: ABSENT });
  assert.ok(result.ok, `worker build failed:\n${result.output}`);
  assert.match(result.output, /dc-map release: NONE embedded/);
  const embedded = embeddedRelease();
  assert.equal(embedded.status, "unavailable");
  assert.equal(embedded.release_id, null);
  assert.equal(embedded.manifest, null);
  assert.deepEqual(embedded.artifacts, {});
  assert.ok(embedded.reasons.length > 0, "an absent release was embedded without a reason");
});

test("DCMAP_REQUIRE_RELEASE=1 turns an absent release into a build failure", () => {
  const result = runBuild({ DCMAP_RELEASES: ABSENT, DCMAP_REQUIRE_RELEASE: "1" });
  assert.equal(result.ok, false, "the build shipped a Worker with no substrate release under the strict gate");
  assert.match(result.output, /DCMAP_REQUIRE_RELEASE=1 and no active dc-map substrate release/);
});

test("an active release is embedded byte-for-byte, with its manifest and its exact id", () => {
  const result = runBuild({ DCMAP_RELEASES: VALID });
  assert.ok(result.ok, `worker build failed:\n${result.output}`);
  assert.match(result.output, new RegExp(`dc-map release: ${built.release_id} embedded`));
  const embedded = embeddedRelease();
  assert.equal(embedded.status, "ok");
  assert.equal(embedded.release_id, built.release_id);
  assert.deepEqual(embedded.reasons, []);
  assert.equal(embedded.manifest, readFileSync(resolve(VALID, built.release_id, "manifest.json"), "utf8"));
  const manifest = JSON.parse(embedded.manifest);
  assert.deepEqual(Object.keys(embedded.artifacts).sort(), Object.keys(manifest.artifacts).sort());
  for (const [name, bytes] of Object.entries(embedded.artifacts)) {
    assert.equal(bytes, readFileSync(resolve(VALID, built.release_id, name), "utf8"),
      `${name} was not embedded byte-for-byte`);
    assert.equal(JSON.parse(bytes).release_id, built.release_id, `${name} carries a foreign release id`);
  }
  for (const required of ["site-data.json", "sites.geojson", "summary.json", "t4-adapter.json"]) {
    assert.ok(embedded.artifacts[required], `the required artifact ${required} was not embedded`);
  }
});

test("a release whose bytes do not match its manifest FAILS the build — it is never downgraded to absent", () => {
  const tampered = resolve(MCP, ".dcmap-test-releases", "worker-tampered");
  const t = materializeRelease(tampered, buildSyntheticRelease());
  const summaryPath = resolve(tampered, t.release_id, "summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  summary.note = summary.note + " tampered";
  writeFileSync(summaryPath, JSON.stringify(summary));

  const result = runBuild({ DCMAP_RELEASES: tampered });
  assert.equal(result.ok, false, "the build embedded bytes the manifest does not describe");
  assert.match(result.output, /summary\.json does not match the manifest digest/);
  assert.match(result.output, /Refusing to embed bytes the release does not describe/);
});

test("a release marked FAILED, and a presentation fixture, are both refused outright", () => {
  const failed = resolve(MCP, ".dcmap-test-releases", "worker-failed");
  const f = materializeRelease(failed, buildSyntheticRelease());
  writeFileSync(resolve(failed, f.release_id, "FAILED.json"), JSON.stringify({ reason: "synthetic" }));
  const failedBuild = runBuild({ DCMAP_RELEASES: failed });
  assert.equal(failedBuild.ok, false);
  assert.match(failedBuild.output, /marked FAILED and must never be embedded/);

  const fixture = resolve(MCP, ".dcmap-test-releases", "worker-fixture");
  const x = materializeRelease(fixture, buildSyntheticRelease());
  const manifestPath = resolve(fixture, x.release_id, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.fixture_only = true;
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const fixtureBuild = runBuild({ DCMAP_RELEASES: fixture });
  assert.equal(fixtureBuild.ok, false);
  assert.match(fixtureBuild.output, /presentation FIXTURE; a Worker never serves one as a substrate release/);
});

test("a CURRENT pointer that names no readable release is absent, not a silent substitution", () => {
  const dangling = resolve(MCP, ".dcmap-test-releases", "worker-dangling");
  rmSync(dangling, { recursive: true, force: true });
  materializeRelease(dangling, buildSyntheticRelease());
  writeFileSync(resolve(dangling, "CURRENT"), "rel-" + "b".repeat(24) + "\n");
  const result = runBuild({ DCMAP_RELEASES: dangling });
  assert.ok(result.ok, `worker build failed:\n${result.output}`);
  const embedded = embeddedRelease();
  assert.equal(embedded.status, "unavailable",
    "a dangling CURRENT was resolved to some other release that happened to be on disk");
  assert.ok(embedded.reasons.some((r) => r.includes("manifest is not materialised")));
});

test("a malformed CURRENT fails the build rather than being treated as no release", () => {
  const malformed = resolve(MCP, ".dcmap-test-releases", "worker-malformed");
  materializeRelease(malformed, buildSyntheticRelease());
  writeFileSync(resolve(malformed, "CURRENT"), "latest\n");
  const result = runBuild({ DCMAP_RELEASES: malformed });
  assert.equal(result.ok, false);
  assert.match(result.output, /CURRENT names a malformed release id/);
});

/* ---------------------------------------------------------------------------------------------
   The DEPLOY half of the same question (U5-5).

   The build not refusing an absent release is deliberate (F4). Deploying that state is a separate
   decision, and until the gate below existed nothing made it one: `DCMAP_REQUIRE_RELEASE=1` was
   implemented, tested, documented — and set by nothing, so `npm run deploy` shipped
   "NONE embedded" and `--readback` certified it, because agreeing about an absence is agreement.
   These cases drive the REAL gate script, in both directions, off the real generated module. */

/** Run the deploy gate as the deploy chain runs it; return {code, output}. */
function runGate(env = {}) {
  try {
    return { code: 0, output: execFileSync(process.execPath, ["scripts/dcmap-deploy-gate.mjs"],
      { cwd: WORKER, encoding: "utf8", env: { ...process.env, ...env } }) };
  } catch (error) {
    return { code: error.status ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

test("the deploy path REFUSES a build with no dc-map release embedded", () => {
  const build = runBuild({ DCMAP_RELEASES: ABSENT });
  assert.ok(build.ok, `worker build failed:\n${build.output}`);
  assert.equal(embeddedRelease().status, "unavailable");

  const gate = runGate({ DCMAP_ALLOW_NO_RELEASE: "" });
  assert.equal(gate.code, 1, "the deploy gate passed a Worker that can answer nothing about datacenters");
  assert.match(gate.output, /REFUSING TO DEPLOY/);
  assert.match(gate.output, /NONE embedded/);
  /* it must also say how to proceed deliberately, or it is a wall rather than a gate */
  assert.match(gate.output, /DCMAP_ALLOW_NO_RELEASE=1/);
});

test("an explicit override deploys without a release, and is logged", () => {
  runBuild({ DCMAP_RELEASES: ABSENT });
  const gate = runGate({ DCMAP_ALLOW_NO_RELEASE: "1" });
  assert.equal(gate.code, 0, `the logged override did not let the deploy through:\n${gate.output}`);
  assert.match(gate.output, /OVERRIDDEN/);
  assert.match(gate.output, /release-unavailable/);
});

test("with a release embedded the gate passes and names the exact release", () => {
  const build = runBuild({ DCMAP_RELEASES: VALID });
  assert.ok(build.ok, `worker build failed:\n${build.output}`);
  const gate = runGate({ DCMAP_ALLOW_NO_RELEASE: "" });
  assert.equal(gate.code, 0, `the gate refused a build that embeds a release:\n${gate.output}`);
  assert.match(gate.output, new RegExp(`embeds substrate release ${built.release_id}`));
});

test("the deploy script runs the gate before wrangler ever uploads", () => {
  const scripts = JSON.parse(readFileSync(resolve(WORKER, "package.json"), "utf8")).scripts;
  const deploy = scripts.deploy;
  assert.ok(deploy.includes("dcmap-deploy-gate.mjs"), "the deploy chain does not run the dc-map release gate");
  assert.ok(deploy.indexOf("dcmap-deploy-gate.mjs") < deploy.indexOf("wrangler deploy"),
    "the dc-map release gate runs AFTER the upload, which is not a gate");
});

test.after(() => {
  /* Leave src/gen in the state a fresh checkout produces, so a later worker build or suite is not
     reading a release this suite invented. */
  runBuild({ DCMAP_RELEASES: ABSENT });
});
