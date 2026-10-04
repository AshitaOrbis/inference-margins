// Exercise the same tree scanner the CLI runs, including binary files and symlinks.
// In-process fixtures make the filesystem/decoding assertions portable to restricted sandboxes.
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { findInternalRefs, scanInternalRefTree } from "../scripts/check-no-internal-refs.mjs";

const scratch = mkdtempSync(join(tmpdir(), "im-refs-guard-"));
const failures = [];
let n = 0;
function tree(name, files = {}) {
  const dir = join(scratch, name);
  mkdirSync(dir, { recursive: true });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
function expect(label, dir, rc, mention, hidden, options) {
  n++;
  const r = scanInternalRefTree(dir, options);
  const out = r.stdout + r.stderr;
  if (r.error) failures.push(`${label}: subprocess failed: ${r.error.code}`);
  else if (r.status !== rc || (mention && !out.includes(mention)) || (hidden && out.includes(hidden)))
    failures.push(`${label}: rc ${r.status}, expected ${rc}\n${out}`);
}
try {
  const red = [
    ["backlog row id", "bq-4078"],
    ["escalation or note id", "esc-20260904T225031Z-9a03b379"],
    ["escalation or note id", "note-20260919T142116Z-6b5c1a"],
    ["broker request id", "pr-20260925T060752Z-f9b29c"],
    ["decision or card id", "d-20260910-im-adopt-fleet-rents"],
    ["decision or card id", "p-20261001-release"],
    ["decision or card id", "q-im-fp4-gb200-eta-basis"],
    ["decision or card id", "q-margins-cards-vintage"],
    ["decision or card id", "d-im-h800"],
    ["decision or card id", "d-20260822-4c26"],
    ["owner provenance", "owner ruling"],
    ["owner provenance", "owner note aca09d"],
    ["owner provenance", "owner answer"],
    ["owner provenance", "owner voice note"],
    ["owner provenance", "owner ask"],
    ["owner provenance", "owner notes 11b102"],
    ["owner provenance", "owner voice ruling"],
    ["owner provenance", "owner rule nd94bbc"],
    ["owner provenance", "owner-ratified"],
    ["owner provenance", "owner amendment"],
    ["owner provenance", "owner-ruled"],
    ["owner provenance", "owner inputs"],
    ["owner provenance", "owner edit"],
    ["owner possessive provenance", "owner's declared plausibility order"],
    ["owner example provenance", "owner case"],
    ["owner example provenance", "owner pick"],
    ["owner example provenance", "the order this page's owner set"],
    ["dated owner commissioning", "by owner 2026-07-15"],
    ["private memo citation", "memo im4-fa-justifications v7, J-2"],
    ["private memo citation", "shared memo\n<code>research/b9-m45-ui-memo.md</code>"],
    ["internal milestone label", "M1–M4 milestones"],
    ["internal court reference", "the court's record"],
    ["internal program label", "im-arc T3"],
    ["internal program label", "im3-integration"],
    ["internal program label", "im4-fa-justifications"],
    ["internal program phase", "IM3 program"],
    ["internal program phase", "IM4 phase"],
    ["internal program phase", "IM5 design"],
    ["internal phase label", "b9 defaults"],
    ["internal milestone label", "M4 phase"],
    ["internal milestone label", "phase M12"],
    ["internal milestone label", "pre-M4"],
    ["internal fold label", "T4 fold"],
    ["review-process jargon", "toss-back"],
    ["review-process jargon", "fold round"],
    ["review-process jargon", "three Sol rounds"],
    ["review-process jargon", "lens-runs"],
    ["internal row number", "row 499"],
    ["internal row number", "rows 494 and 499"],
    ["orchestrator name", "Polaris gen60"],
    ["worker session name", "im-sol61-estimate-1001"],
    ["worker session name", "im-legibility-merge-enact-0925"],
    ["worker session name", "inference-margins-lane-1004"],
    ["worker session name", "inference-margins-visual-polish-0927"],
    // Residue kinds the first sweep missed: row labels, note and annotation ids, private records, undated labels.
    ["internal row label", "the row-499 null convention"],
    ["internal row label", "row514-round3"],
    ["note or annotation id", "the author’s note + c72950"],
    ["note or annotation id", "notes aa315c + c72950"],
    ["note or annotation id", "annotation nad7e98"],
    ["annotation id", "nbc7fc1 says the answer tile"],
    ["private record citation", "closing burn-queue the release"],
    ["private record citation", "the private plan of that release"],
    ["private record citation", "in the release work folder (private workspace)"],
    ["private record citation", "court answer to a research review"],
    ["private record citation", "court-intake"],
    ["worker label", "im-release-edit"],
    ["worker label", "a-im-legibility"],
    ["worker label", "by leg im-vet-six-repairs"],
    ["worker label", "im-default-window-and-mcp-discrepancy"],
    // Kinds the second sweep missed: private files, run ids, labelled runs, one-word work labels.
    ["annotation id", "NBC7FC1 says the answer tile"],
    ["private file citation", "a review of PLAN-v22.md"],
    ["private file citation", "merged in the leg's VISUAL-REVIEW.md"],
    ["private file citation", "Full persona outputs: workspace run"],
    ["private file citation", "reports/codex-council/2026-07-16-plan/persona.md"],
    ["private file citation", "logs/weekly/2026-07-15-expedited4.md"],
    ["run identifier", "gate verdict 20260912T212606Z requeued it"],
    ["labelled run id", "IM2-anchor-verification-2026-07-16"],
    ["worker label", "im-finalize (transcribed from the record)"],
    ["worker label", "archived at im-desktop/dual-viewport-probe.mjs"],
  ];
  for (const [i, [shape, value]] of red.entries()) {
    expect(shape, tree(`red-${i}`, { "nested/a.bin": Buffer.from(`\0ok\n${value}\n`, "utf8") }), 1, `nested/a.bin:2: ${shape}`, value);
  }
  const bypasses = [
    ["backlog row id", "bq&#45;4078"],
    ["backlog row id", "bq&#x2d;4078"],
    ["backlog row id", "bq&hyphen;4078"],
    ["backlog row id", "bq&ndash;4078"],
    ["owner provenance", "owner&nbsp;ruling"],
    ["owner provenance", "owner<br>ruling"],
    ["owner provenance", "owner<wbr>ruling"],
    ["owner provenance", 'owner<span title=">">ruling</span>'],
    ["backlog row id", "bq<wbr>-4078"],
    ["worker session name", "IM-SOL61-ESTIMATE-1001"],
    ["worker session name", "INFERENCE-MARGINS-LANE-1004"],
    ["owner provenance", 'owner<span class="x"> </span>ruling'],
    ["owner provenance", String.raw`"owner\nruling"`],
    ["owner provenance", String.raw`"owner\truling"`],
    ["owner provenance", String.raw`"owner\u00a0ruling"`],
    ["backlog row id", String.raw`"bq\u002d4078"`],
    ["backlog row id", String.raw`"bq\x2d4078"`],
    ["backlog row id", "BQ-4078"],
    ["decision or card id", "D-20260910-IM-ADOPT-FLEET-RENTS"],
    ["owner provenance", "owner-ratified"],
    ["editorial process label", "ruling im-algo-lead-defaults"],
    ["editorial process label", "r4 run B"],
    ["editorial process label", "im-arc T2"],
    ["editorial process label", "memo §4"],
    ["editorial process label", "T4 fold"],
    ["editorial process label", "b9 M3"],
    ["editorial process label", "r4 §C3"],
    ["editorial process label", "design analysis§6"],
    ["editorial process label", "b9 spec-decode"],
    // Ordinary formatting: a slug ending a sentence, and labels wrapped in inline markup.
    ["internal program label", "See im4-fa-justifications."],
    ["internal program label", "<code>im4-fa-justifications</code>."],
    ["internal phase label", "The <code>b9</code> defaults"],
    ["owner provenance", "owner <strong>ruling</strong>"],
    ["owner provenance", "owner <em>note</em>"],
    ["owner provenance", '<a href="#x">owner</a> <code>ruling</code>'],
    // A reference inside an attribute of a formatting tag is still decoded and seen.
    ["backlog row id", '<a title="bq&#45;4078">link</a>'],
    ["owner provenance", '<code title="owner&nbsp;ruling">x</code>'],
    // A line break between two formatted words still separates them.
    ["owner provenance", "owner<br><strong>ruling</strong>"],
    ["owner provenance", "<code>owner</code><br><em>ruling</em>"],
    ["annotation id", "NAD7E98 asked for it"],
  ];
  for (const [i, [shape, value]] of bypasses.entries()) {
    n++;
    const hits = findInternalRefs(`first\n${value}\nlast`);
    if (!hits.some(hit => hit.shape === shape && hit.line === 2)) failures.push(`direct bypass ${i}: missing ${shape}`);
    expect(`encoded/uppercase ${i}`, tree(`bypass-${i}`, { "a.js": `first\n${value}\nlast` }), 1, `a.js:2: ${shape}`, value);
  }
  expect("decoded newlines preserve raw line mapping", tree("line-map", {
    "a.js": String.raw`"ok\n"` + "\n" + String.raw`"owner\nruling"` + "\nPolaris"
  }), 1, "a.js:3: orchestrator name");
  for (const value of ["D-1", "Q-001", "d-2", "q-learning", "p-type", "d-wave"]) {
    n++;
    if (findInternalRefs(value).length) failures.push(`direct clean ${value}: unexpected match`);
    expect(`clean ${value}`, tree(`clean-${value}`, { "a.txt": value }), 0);
  }
  const clean = "row rows polar polarization d- inside words adopted-im-h800 D-1 D-SD-3 Q-001 p-value p-values q-factor q-factors 3-D H800 GB200 FP4 research/changelog.html re-mint im-research-2026-10-01 im-research-2026 DeepSeek-R1-0528 qwen3.8-max-0902 GPT-6.1 Sol GPT-6 Astra Pro fleet legs leg fold Ulanqab M890 owner-operator owner TCO model owner's actual gross margin shared memo about public pricing gb200-owner-adopted-scenario-2026-09 v25-im-arc-t4-fold-20260824 \"research/dives/im-arc/entry.md\" tests/im4-fleet-policy-harness.mjs tests/spec-decode-lever-b9.test.mjs M22 14 H16 m2 MTP";
  expect("public vocabulary", tree("clean", { "index.html": clean, "a.bin": Buffer.from([0, 0xff]) }), 0, "scanned 2 files");
  for (const [i, lookalike] of ["GPT-6.1 Sol", "GPT-6 Astra Pro", "fleet legs", "leg", "fold", "Ulanqab M890 instances", "owner-operator", "Internal memo reportedly put training MFU at ~11%", "anonymous market memo", "a federal court ruling", "IM5 deferral", 'd="M22 14 H16 V50 H22"',
    "im4-fleet-policy-harness.mjs", "<code>im4-fleet-policy-harness.mjs</code>.", "<code>b9.json</code>",
    "<strong>owner</strong>-operator", "the owner <em>TCO</em> model",
    "<code>b9</code><em>.json</em>", "grid-row-1234", "row-major order", "a 3-row table", "annotations: { readOnlyHint: true }",
    "note 202609 is a number", "a court answered the motion", "work folders", "v25-im-arc-t4-fold-20260824",
    "im-research-2026-10-01", "\"research/dives/im-arc/entry.md\"", "#nabc123", "sha-nab12cd",
    "SECURITY.md", "CONTRIBUTING.md and README.md", "PLANNING.md", 'class="im-claim"', "2026-07-11T02:11:18Z",
    "\"research/reception/meta/notes.md\"", "the browser logs it"].entries())
    // The two research paths are quoted values: an unquoted unpublished research path is a citation (see the
    // unpublished-research cases below); a quoted one is a functional pointer, which is what these two test.
    expect(`public look-alike ${i}`, tree(`lookalike-${i}`, { "a.txt": lookalike }), 0);
  const heldText = "The design gate was closed in three Sol rounds at 28d4b25.";
  const heldSha = createHash("sha256").update(heldText).digest("hex");
  const heldOptions = { pathRoot: scratch, heldLines: [{ path: "held/a.txt", line: 1, sha256: heldSha, reason: "held for the author's decision" }] };
  const heldTree = tree("held", { "a.txt": `${heldText}\n` });
  expect("exact listed line is held", heldTree, 0, "a.txt:1: review-process jargon (held for the author's decision)", heldText, heldOptions);
  writeFileSync(join(heldTree, "a.txt"), `${heldText}!\n`);
  expect("one changed character voids exemption", heldTree, 1, "a.txt:1: review-process jargon", "(held for the author's decision)", heldOptions);
  const unlistedTree = tree("unlisted", { "a.txt": `${heldText}\n` });
  expect("unlisted path with identical words fails", unlistedTree, 1, "a.txt:1: review-process jargon", "(held for the author's decision)", heldOptions);
  writeFileSync(join(heldTree, "a.txt"), `${heldText}\n${heldText}\n`);
  expect("unlisted duplicate in same file fails", heldTree, 1, "a.txt:2: review-process jargon", undefined, heldOptions);
  writeFileSync(join(heldTree, "a.txt"), `${heldText}\r\n`);
  expect("CR is part of exact line bytes", heldTree, 1, "a.txt:1: review-process jargon", "(held for the author's decision)", heldOptions);
  expect("invalid exemption reason fails closed", heldTree, 2, "valid held-lines manifest", undefined, {
    pathRoot: scratch, heldLines: [{ path: "held/a.txt", line: 1, sha256: heldSha, reason: "other" }]
  });
  const multiline = ["shared memo", "<code>research/b9-m45-ui-memo.md</code>"];
  const multilineOptions = { pathRoot: scratch, heldLines: multiline.map((line, index) => ({
    path: "multiline/a.html", line: index + 1,
    sha256: createHash("sha256").update(line).digest("hex"), reason: "held for the author's decision"
  })) };
  const multilineTree = tree("multiline", { "a.html": multiline.join("\n") });
  expect("all consumed lines are held", multilineTree, 0, "held for the author's decision", undefined, multilineOptions);
  writeFileSync(join(multilineTree, "a.html"), multiline.join("\n").replace("m45", "m46"));
  expect("changed continuation voids multiline exemption", multilineTree, 1, "private memo citation", "held for the author's decision", multilineOptions);
  expect("compressed bytes resembling phase labels stay clean", tree("binary-lookalikes", {
    "a.png": Buffer.from([0x1b, 0xff, 0xfe, 0x40, 0x42, 0x39, 0xff, 0x46, 0x7d]),
    "b.png": Buffer.from([0x0e, 0x42, 0x39, 0xff, 0xff, 0x62])
  }), 0, "scanned 2 files");
  for (const [i, slash] of ["\\/", "\\u002f", "\\x2f", "&#47;", "&#x2f;", "&sol;", "%2F"].entries())
    expect("slash decoding", tree(`esc-${i}`, { "a.js": `ok\n${slash}Polaris${slash}tools` }), 1, "a.js:2: orchestrator name");
  const outside = tree("outside", { "leak": "bq-4078" });
  const linked = tree("linked", { "clean": "ok" });
  symlinkSync(join(outside, "leak"), join(linked, "leak"));
  symlinkSync(outside, join(linked, "directory"));
  expect("symlinks ignored", linked, 0, "scanned 1 files");
  const linkedRoot = join(scratch, "linked-root");
  symlinkSync(outside, linkedRoot);
  expect("a symlink root is never followed", linkedRoot, 2);
  for (const [i, text] of ["(research/gptpro-reports/x-dive-2026-07-15.md, not part of the annex)",
    "// fetched and archived (research/notes/y-2026-05-01.md), so the", "\"verifierRef\": \"research/z-ledger.md (row a)\"",
    "see `research/notes/w.md` for the derivation", "(research/../research/v.md)"].entries())
    expect("a research document named in prose or a comment, unpublished", tree(`unpublished-${i}`, { "a.js": `ok\n${text}\n` }), 1,
      "a.js:2: unpublished research citation");
  for (const [i, text] of ["sourceFile: \"research/dives/x/y-2026-08-23.md\"", "{ path: 'research/b.md' }", "<a href=\"research/c.md\">c</a>",
    "see research/gptpro-reports/dive-tpu-2026-07-15.md for the dive"].entries())
    expect("a quoted pointer or a published research document stays clean", tree(`pointer-${i}`, { "a.js": `ok\n${text}\n` }), 0, "scanned 1 files");
  const gen = tree("gen-root", { "mcp-server/worker/src/gen/a.gen.ts": "/* bq-1253 */\n", "mcp-server/worker/src/index.ts": "ok\n",
    "site/gen/a.js": "/* bq-1253 */\n" });
  expect("the Worker's generated build output is skipped", join(gen, "mcp-server/worker/src"), 0, "scanned 1 files", undefined,
    { pathRoot: gen, heldLines: [] });
  expect("...and no other directory named gen", join(gen, "site"), 1, "gen/a.js:1: backlog row id", undefined, { pathRoot: gen, heldLines: [] });
  expect("empty", tree("empty"), 2);
  expect("missing", join(scratch, "missing"), 2);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
if (failures.length) {
  console.error(`INTERNAL-REFERENCE GUARD FAILURES (${failures.length}/${n})\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`ALL ${n} INTERNAL-REFERENCE GUARD CASES PASS`);
