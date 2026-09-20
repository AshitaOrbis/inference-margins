/* T5 rec 5, ROUND 4b — the CONNECTOR half of the kind/envelope class sweep.
   (The Node half is tests/final-answer-vocabulary.test.mjs; this is the transport the defect
   actually shipped on.)

   The defect: the `analyst-hypothesis` catalog entry carried `kind: "final-answer"`, and
   get_report keys its ENTIRE envelope off that tag — so one reply said, in its title, "adopted
   judgment, not a calculator output", and in the sentence beside it, "LIVE engine-derived result
   surface". Both about the same entry, in the same response. An MCP consumer cannot see the page
   to notice, which is what makes it the connector's defect rather than the site's.

   Seven review rounds walked past it because each read the TEXT of the entry it already
   suspected. The fix in 541764f closes that one entry BY NAME. This file closes the CLASS: every
   catalog entry the Worker serves, discovered from the Worker's own discovery surface, driven
   through the Worker's own get_report, over the real engine — plus the Node/Worker agreement
   that makes "the same engine and claims registry" (the footer's promise) checkable on the one
   field a consumer reads first.

   The predicate is pure so the negative fixtures can drive it directly: a guard nobody has
   watched fail is a guard nobody has tested, and in this leg that has been true nine times. */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { linkedServers } from "./helpers/linked-servers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const E = require(path.resolve(__dirname, "..", "..", "..", "site", "engine.js"));

/* The kinds that ARE archived documents. Deliberately a set whose COMPLEMENT is "live", never a
   list of live kinds: a sixth kind added tomorrow must fall on the live side and trip the
   envelope check, not inherit the archive wording by default. That fall-through is exactly the
   shape of the round-4b defect. */
const ARCHIVED_KINDS = new Set(["annex-doc", "front-page", "report-section"]);

/* The evidence ranking, taken from the ENGINE — not a phrase list. Whatever entry carries these
   tokens IS an evidence-ranking entry however it is titled, which is the property rec 5 names
   ("separate evidence ranking from the calculator's answer hierarchy"). Round 7 already proved a
   blacklist over natural language cannot be completed; this is not one. */
const fa = E.finalAnswer();
const RANKING_TOKENS = [fa.tokens.mostPlausibleLine, fa.tokens.decompositionLine,
  fa.tokens.higherJustificationsHeader, ...fa.tokens.higherJustificationEntries].filter(Boolean);

/** Pure predicate over rows: {id, kind, text, title, sentence, reportedKind}. */
export function reportKindViolations(rows) {
  const out = [];
  for (const r of rows) {
    if (r.kind === "final-answer" && RANKING_TOKENS.some((t) => t && r.text.includes(t)))
      out.push(`${r.id}: carries the evidence ranking under the calculator's answer kind`);
    if (/not a calculator output/i.test(r.title) && /LIVE engine-derived result surface/i.test(r.sentence))
      out.push(`${r.id}: its title says "not a calculator output" and its envelope says "LIVE engine-derived result surface"`);
    if (ARCHIVED_KINDS.has(r.kind) !== /archived verbatim/i.test(r.sentence))
      out.push(`${r.id}: kind "${r.kind}" and the envelope disagree about whether it is archived`);
    if (r.reportedKind !== r.kind)
      out.push(`${r.id}: get_report reported kind "${r.reportedKind}" for an entry the catalog holds as "${r.kind}"`);
    /* ROUND 4b, the MACHINE half — see the Node twin for the full reasoning. registryEmitMeta was
       called with a hardcoded "verbatim archive fetch", so the emitted claim's estimand described
       both LIVE entries as archive fetches on the layer an LLM consumer parses. */
    if (ARCHIVED_KINDS.has(r.kind) !== /verbatim archive fetch/i.test(r.estimand))
      out.push(`${r.id}: kind "${r.kind}" and the MACHINE claim's estimand disagree about whether it is archived`);
    /* the layers against each other — the assertion that fails on "prose fixed, machine not" */
    if (/archived verbatim/i.test(r.sentence) !== /verbatim archive fetch/i.test(r.estimand))
      out.push(`${r.id}: the prose envelope and the MACHINE claim disagree about whether it is archived`);
  }
  return out;
}

const servers = await linkedServers("report-kind-class");
test.after(async () => { await servers.close(); });

const sentenceOf = (result) => (result.content.find((p) => p.type === "text") || {}).text || "";

/* Ids are DISCOVERED from the Worker's own discovery surface, never listed here — a hand-written
   id list is the enumerate-what-you-know defect one level down. */
async function idsFrom(harness) {
  const space = await harness.call("list_scenario_space", {});
  return ((space.structuredContent || {}).reports || []).map((r) => r.id);
}

async function rowsFrom(harness) {
  const rows = [];
  for (const id of await idsFrom(harness)) {
    /* The WHOLE document, not the default 24 000-char first page: a ranking token past the
       default cut would otherwise be invisible to the sweep. `truncated` is asserted false
       below, so if a document ever outgrows the schema maximum this FAILS loudly instead of
       quietly sweeping a prefix. Largest entry today is 116,981 chars. */
    const result = await harness.call("get_report", { id, max_chars: 200000 });
    const sc = result.structuredContent || {};
    assert.equal(sc.truncated, false,
      `get_report("${id}") is still truncated at the schema maximum — the sweep would read a prefix only`);
    /* The served bytes are `content`, and they are taken STRICTLY — no `|| sentence` fallback.
       A fallback here would let an empty payload silently downgrade the ranking check into a
       scan of the lead sentence, which contains no ranking tokens, so it would pass while
       proving nothing. That is the vacuity shape this repo's reviews have found four times. */
    assert.equal(typeof sc.content, "string",
      `get_report("${id}") returned no content string — the ranking sweep would be vacuous`);
    assert.ok(sc.content.length > 0, `get_report("${id}") returned empty content`);
    rows.push({
      id, kind: sc.kind, reportedKind: sc.kind, title: sc.title || "",
      text: sc.content,
      sentence: sentenceOf(result),
      estimand: ((sc.claims || [])[0] || {}).estimand || "",
      claimTree: ((sc.claims || [])[0] || {}).tree,
      claimSubject: ((sc.claims || [])[0] || {}).subject,
    });
  }
  return rows;
}

test("the Worker serves no entry whose kind and envelope contradict each other", async () => {
  const rows = await rowsFrom(servers.worker);
  assert.ok(rows.length >= 40, `catalog looks truncated: ${rows.length} entries`);
  assert.ok(RANKING_TOKENS.length >= 4,
    "the ranking-token set is empty — the ranking check could not fail, so it proves nothing");
  assert.ok(new Set(rows.map((r) => r.kind)).size >= 5,
    `fewer kinds than the catalog declares: ${JSON.stringify([...new Set(rows.map((r) => r.kind))])}`);
  assert.deepEqual(reportKindViolations(rows), []);
});

test("exactly one Worker entry carries the evidence ranking, and it is not the calculator's answer", async () => {
  const rows = await rowsFrom(servers.worker);
  const carriers = rows.filter((r) => RANKING_TOKENS.some((t) => t && r.text.includes(t)));
  assert.deepEqual(carriers.map((c) => `${c.id}:${c.kind}`), ["analyst-hypothesis:analyst-hypothesis"]);
});

test("Worker and Node agree on the kind of EVERY entry — the footer's sameness promise, on the field a consumer reads first", async () => {
  const [workerRows, nodeRows] = [await rowsFrom(servers.worker), await rowsFrom(servers.node)];
  const kinds = (rows) => Object.fromEntries(rows.map((r) => [r.id, r.kind]));
  assert.deepEqual(kinds(workerRows), kinds(nodeRows));
  /* And for the LIVE entries the whole lead sentence must match byte for byte. Archived entries
     legitimately differ (the Worker appends its RELEASE_NOTE, which is the rec-6 provenance
     rider), so the assertion is scoped to where sameness is actually claimed. */
  for (const w of workerRows.filter((r) => !ARCHIVED_KINDS.has(r.kind))) {
    const n = nodeRows.find((r) => r.id === w.id);
    assert.equal(w.sentence, n.sentence, `live entry "${w.id}" is described differently by the two transports`);
  }
});

/* ── NEGATIVE FIXTURES. Each reproduces a real defect against real bytes and must be CAUGHT. ── */
test("the predicate catches the defects it exists for — and is silent on the real catalog", async () => {
  const rows = await rowsFrom(servers.worker);
  const ah = rows.find((r) => r.id === "analyst-hypothesis");
  const faRow = rows.find((r) => r.id === "final-answer");
  const annex = rows.find((r) => ARCHIVED_KINDS.has(r.kind));

  /* the ACTUAL round-4b defect: the ranking entry's own title and text, under the answer's kind,
     inside the sentence the real handler emits for that kind. Not an invented string — this is
     the response the connector returned before 541764f. */
  assert.ok(reportKindViolations([{ ...ah, kind: "final-answer", reportedKind: "final-answer",
    sentence: faRow.sentence }]).length >= 2, "the round-4b defect itself is not caught");
  /* the case the by-name assertions CANNOT see: a second, differently-named entry with the same
     defect, while analyst-hypothesis stays correctly tagged. This is the whole reason the class
     sweep exists. */
  assert.ok(reportKindViolations([{ ...ah, id: "some-future-entry", kind: "final-answer",
    reportedKind: "final-answer", sentence: faRow.sentence }]).length >= 2,
    "a SECOND ranking-carrying entry is not caught — the sweep is still a two-entry list");
  assert.ok(reportKindViolations([{ ...faRow, sentence: annex.sentence }]).length >= 1,
    "a live entry described as an archived document is not caught");
  assert.ok(reportKindViolations([{ ...annex, sentence: faRow.sentence }]).length >= 1,
    "an archived entry described as a live engine render is not caught");
  assert.ok(reportKindViolations([{ ...annex, kind: "some-new-kind", reportedKind: "some-new-kind" }]).length >= 1,
    "a NEW sixth kind falling through to the archive wording is not caught");
  assert.ok(reportKindViolations([{ ...ah, reportedKind: "final-answer" }]).length >= 1,
    "get_report reporting a kind the catalog does not hold is not caught");
  /* the round-4b review's own finding, reproduced on the connector: prose fixed, machine block
     still calling a LIVE entry a verbatim archive fetch. Every by-name assertion passes on it. */
  assert.ok(reportKindViolations([{ ...ah, estimand: annex.estimand }]).length >= 2,
    "a live entry whose MACHINE estimand still calls it an archive fetch is not caught");
  assert.ok(reportKindViolations([{ ...faRow, estimand: annex.estimand }]).length >= 2,
    "the same defect on the calculator's own answer is not caught");
  assert.ok(reportKindViolations([{ ...annex, estimand: ah.estimand }]).length >= 2,
    "an archived entry whose MACHINE estimand claims a live render is not caught");
  assert.ok(rows.every((r) => r.estimand.length > 20),
    "some entry carries no machine estimand — the estimand checks would be vacuous there");
  /* See the Node twin: the flagship receipt must be UNIFORM across the catalog, or an entry's
     claim could be read as that entry's own figure — and this entry's own figure is above 80%,
     not 51%. One value, one subject, and the value is a real number. */
  assert.equal(new Set(rows.map((r) => JSON.stringify(r.claimTree))).size, 1,
    "entries carry DIFFERENT machine claim values — the receipt is being read as a per-entry result");
  assert.equal(new Set(rows.map((r) => r.claimSubject)).size, 1,
    "entries carry different machine claim subjects");
  assert.ok(Number.isFinite((((ah.claimTree || {}).nodes || [])[0] || {}).value),
    "the shared claim value is not a finite number — 'all the same' would be trivially true");

  /* the control on the controls: if the predicate fired on everything, every negative above
     would pass while proving nothing. */
  assert.deepEqual(reportKindViolations(rows), []);
});
