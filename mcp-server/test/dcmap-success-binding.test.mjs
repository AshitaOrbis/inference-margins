/* bq-2188 — the SUCCESS path names where it loaded its bytes from, pinned against a release that
   this file materializes itself.

   WHY A SEPARATE FILE, and why it is not the one beside it. `dcmap-release-binding.test.mjs`
   asserts the binding on the REFUSAL path, and it has to: it sets `DCMAP_RELEASES` to an empty
   directory for its whole process, which is the only way to observe what a datacenter tool does
   with no release to answer from. That is also its limit, and an Astra xhigh review (2026-09-10,
   finding B2) proved the limit empirically: reintroducing the defect this suite exists for leaves
   every assertion in that file green, because the code path it exercises was never the broken one.

   THE DEFECT, stated precisely. `release_binding` is not release IDENTITY — U3's own `respond`
   stamps `release_id` on every envelope, success or refusal. It is LOADING PROVENANCE: filesystem
   on the Node server, embedded at build time in the Worker. That is the one axis on which the two
   transports legally differ, so it is the axis a parity check must compare, and it was published
   on the refusal path alone. Invisible while nothing had a release; live the moment `b216807`
   materialized one.

   So this file does the opposite of its neighbour: it materializes a synthetic release, drives
   every datacenter tool that can succeed against it, and asserts the answer both COMPUTED something
   and said where it loaded the bytes from. Removing the fix in `dcmap/layer.ts` fails it.

   Its own process, pointed at its own release directory (test files each get one, because the
   layer pins one release for the life of a process). */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSyntheticRelease, materializeRelease, scenarioBundle } from "./dcmap-scenario-fixture.mjs";

const MCP = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const RELEASES = resolve(MCP, ".dcmap-test-releases", "success-binding");
const built = materializeRelease(RELEASES, buildSyntheticRelease());
process.env.DCMAP_RELEASES = RELEASES;
delete process.env.DCMAP_RELEASE_ID;

const { connectInMemory, sc } = await import("./harness.mjs");
const h = await connectInMemory();
test.after(async () => { await h.close(); });

/* Every datacenter tool, with arguments that reach the synthetic release rather than bouncing off
   input validation. The three economic tools take a full bundle pinned to THIS release's id. */
const CALLS = {
  list_datacenters: {},
  get_datacenter: { site_id: "test-alpha" },
  datacenter_schedule: { site_id: "test-alpha" },
  datacenter_stakeholders: { site_id: "test-alpha" },
  price_token_from_site: { scenario: scenarioBundle(built.release_id) },
  rank_datacenters: { comparison: scenarioBundle(built.release_id).comparison,
    scenarios: [scenarioBundle(built.release_id)] },
  datacenter_impact: { baseline: scenarioBundle(built.release_id),
    replacement: scenarioBundle(built.release_id) },
};

test("the release opened, so these answers are the SUCCESS path and not a refusal in disguise", async () => {
  /* The guard on this whole file. If the synthetic release ever stops opening, every assertion
     below would still pass — on the refusal path, proving nothing — which is exactly the failure
     mode this file was written to escape. */
  const structured = sc(await h.call("list_datacenters", {}));
  assert.notEqual(structured.status, "release-unavailable",
    "the synthetic release did not open, so this suite is testing the refusal path again");
  assert.equal(structured.release_id, built.release_id, "a different release answered");
  assert.ok(structured.data && Array.isArray(structured.data.sites) && structured.data.sites.length > 0,
    "list_datacenters computed nothing, so there is no success path here to check");
});

/* What each tool is expected to REACH against this synthetic release. The economic tools may
   legitimately land on `modeled` or on a typed `insufficient-evidence` when the fixture does not
   carry an allocation assumption — what none of them may do is refuse for want of a release, or
   answer with no status at all. Written per tool rather than as one permissive predicate, because a
   single "not release-unavailable" is exactly the assertion round 3 showed proves nothing. */
const EXPECT_STATUS = {
  list_datacenters: ["ok"], get_datacenter: ["ok"], datacenter_schedule: ["ok"],
  datacenter_stakeholders: ["ok"],
  price_token_from_site: ["ok", "modeled", "insufficient-evidence"],
  rank_datacenters: ["ok", "modeled", "insufficient-evidence"],
  datacenter_impact: ["modeled", "insufficient-evidence"],
};

test("every datacenter tool names its LOADING PROVENANCE on the success path, not only when refusing", async () => {
  for (const [tool, args] of Object.entries(CALLS)) {
    const structured = sc(await h.call(tool, args));
    assert.equal(structured.release_id, built.release_id, `${tool} named a different release`);
    assert.ok(structured.release_binding,
      `${tool} answered from ${built.release_id} without saying where it loaded those bytes from`);
    assert.equal(structured.release_binding.kind, "filesystem",
      `${tool} named a loading provenance the Node server cannot have`);
    assert.equal(structured.release_binding.root, "dc-map/releases",
      `${tool} published a binding root that is not the server's declared one`);
    /* GPT Pro session 1 round 3, finding N5: `status !== "release-unavailable"` is not "it computed".
       An object with the right release fields and NO status at all would satisfy it, because
       `undefined` is not that string — so the loop could report seven successes while proving one.
       Assert the status this tool is expected to reach, and that it returned a payload. */
    assert.ok(EXPECT_STATUS[tool].includes(structured.status),
      `${tool} answered with status ${JSON.stringify(structured.status)}; expected one of ${EXPECT_STATUS[tool].join(", ")}`);
    /* CORRECTED 2026-09-10 (im-release-edit-r3) for Pro session 1 round 4, NEW N9. This file imports
       `node:assert/strict`, under which `assert.notEqual(undefined, null)` PASSES — so the previous
       form accepted a response with status "ok" and NO `data` property at all, which is exactly the
       hole the round-3 fold was written to close. Under legacy `node:assert` the loose comparison
       would have rejected it; the assertion's correctness depended on an import nobody was looking
       at. Assert PRESENCE and non-null separately, so neither absent nor null can pass, and so the
       failure message says which one it was. This proves a payload exists; it does not claim to
       validate its schema. */
    assert.ok(Object.hasOwn(structured, "data"),
      `${tool} reached an expected status but returned no data property at all`);
    assert.ok(structured.data != null,
      `${tool} reached an expected status but its data payload is ${JSON.stringify(structured.data)}`);
  }
});

test("the binding is a SEPARATE fact from the release id — neither stands in for the other", async () => {
  /* Astra xhigh review finding B4. The first account of this defect said callers could not tell
     which release answered; that was wrong, and the correction is worth pinning rather than only
     writing down. `release_id` answers WHICH release. `release_binding` answers WHERE it was loaded
     from, and carries no identity of its own — so a consumer cannot derive either from the other. */
  const structured = sc(await h.call("get_datacenter", { site_id: "test-alpha" }));
  assert.match(structured.release_id, /^rel-[a-f0-9]{24}$/);
  assert.deepEqual(Object.keys(structured.release_binding).sort(), ["kind", "note", "root"]);
  assert.ok(!JSON.stringify(structured.release_binding).includes(structured.release_id),
    "the binding restates the release id, so it is no longer an independent fact");
});
