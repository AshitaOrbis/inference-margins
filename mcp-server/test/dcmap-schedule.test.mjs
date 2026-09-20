/* U5 — schedule windows and stakeholder state, on a release whose promoted bytes carry all four
   of the assessments this unit has to prove are RELAYED rather than derived here.

   Its own process (node --test runs each file separately), because a server pins ONE release for
   its lifetime — which is the E9 property, not a testing inconvenience. */
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectInMemory, sc } from "./harness.mjs";
import {
  RELAYED_ASSESSMENTS, buildSyntheticRelease, materializeRelease, withProspectiveTenant, withScheduleWindows,
} from "./dcmap-scenario-fixture.mjs";

const MCP = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const RELEASES = resolve(MCP, ".dcmap-test-releases", "schedule");
materializeRelease(RELEASES, buildSyntheticRelease((site) => {
  withScheduleWindows(site);
  withProspectiveTenant(site);
}));
process.env.DCMAP_RELEASES = RELEASES;
delete process.env.DCMAP_RELEASE_ID;

const h = await connectInMemory();
test.after(async () => { await h.close(); });

test("datacenter_schedule relays every producer assessment token verbatim, with its formula and as-of", async () => {
  const response = sc(await h.call("datacenter_schedule", { site_id: "test-alpha" }));
  const data = response.data;
  assert.equal(data.site_id, "test-alpha");
  assert.equal(data.assessment_as_of, "2026-09-05", "the assessment date is not the release's own");
  const byToken = new Map(data.schedule.map((s) => [s.baseline_assessment.assessment, s]));
  for (const token of RELAYED_ASSESSMENTS) {
    const entry = byToken.get(token);
    assert.ok(entry, `the ${token} comparison did not survive to the response`);
    assert.equal(entry.baseline_assessment.formula, "decision-table@v2",
      `${token} lost the producer's derivation formula`);
    assert.equal(entry.baseline_assessment.assessment_as_of, "2026-09-05",
      `${token} was re-derived against a different date`);
  }
  /* `no-baseline` is a producer DECISION, not the absence of an export: the entry carrying it has
     no baseline atom AND no baseline_target_id, and it is present because the producer wrote it. */
  const noBaseline = byToken.get("no-baseline");
  assert.equal(noBaseline.baseline, null);
  assert.equal(noBaseline.baseline_assessment.baseline_target_id, null);
  /* ...and an entry that DOES have a baseline never borrows that token. */
  for (const entry of data.schedule) {
    if (entry.baseline) assert.notEqual(entry.baseline_assessment.assessment, "no-baseline");
  }
  assert.equal(data.revision_history_complete, false,
    "the response implies complete revision history the presentation contract does not guarantee");
  assert.ok(data.note.includes("Intermediate revisions are not guaranteed"));
});

test("the schedule sentence names the states and never calls silence a delay", async () => {
  const response = sc(await h.call("datacenter_schedule", { site_id: "test-alpha" }));
  for (const token of RELAYED_ASSESSMENTS) {
    assert.ok(response.sentence.includes(token), `the sentence does not name ${token}`);
  }
  assert.ok(!/\bdelayed\b/i.test(JSON.stringify(response)),
    "overdue-unverified was softened into 'delayed' somewhere in the response");
  assert.ok(!/\bon schedule\b/i.test(response.sentence));
});

test("no assessment token is invented: the response only ever carries the release's own", async () => {
  const response = sc(await h.call("datacenter_schedule", { site_id: "test-alpha" }));
  const emitted = new Set(response.data.schedule.map((s) => s.baseline_assessment.assessment));
  assert.deepEqual([...emitted].sort(), ["future-target", ...RELAYED_ASSESSMENTS].sort());
});

test("a milestone filter narrows the comparison set without changing any assessment", async () => {
  const all = sc(await h.call("datacenter_schedule", { site_id: "test-alpha" })).data.schedule;
  const filtered = sc(await h.call("datacenter_schedule",
    { site_id: "test-alpha", milestone: "grid-energized" })).data.schedule;
  assert.equal(filtered.length, RELAYED_ASSESSMENTS.length);
  assert.ok(filtered.every((s) => s.milestone === "grid-energized"));
  for (const entry of filtered) {
    const original = all.find((s) => s.key === entry.key);
    assert.deepEqual(entry.baseline_assessment, original.baseline_assessment);
  }
});

test("a site with no exported schedule says so rather than reporting no-baseline", async () => {
  const response = sc(await h.call("datacenter_schedule", { site_id: "test-beta" }));
  assert.deepEqual(response.data.schedule, []);
  assert.ok(response.sentence.includes("no exported schedule comparison"));
  assert.ok(!response.sentence.includes("no-baseline"),
    "an empty export was reported as the producer's no-baseline decision");
});

test("datacenter_stakeholders fuses the prospective count into the sentence and denies allocation", async () => {
  const response = sc(await h.call("datacenter_stakeholders", { site_id: "test-alpha" }));
  assert.equal(response.data.prospective_count, 1);
  assert.ok(response.sentence.includes("1 prospective or non-executed"));
  assert.ok(response.sentence.includes("do not establish serving allocation"));
  assert.equal(response.data.assessment_as_of, "2026-09-05");
  assert.equal(response.selection_receipt.state, "not-applicable");
});
