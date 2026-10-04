// The workspace-path guard (scripts/check-no-workspace-paths.mjs), driven through its CLI on
// synthetic trees in a temporary directory — never on site/ itself, which the canonical gate
// checks directly in gate:artifacts. bq-4610: two dossier anchors once shipped workspace paths
// as [source] links and served comments carried more; this file proves the guard catches each
// shape that leaked, and does not fire on the shapes that are legitimately public.
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("../scripts/check-no-workspace-paths.mjs", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "im-ws-guard-"));
const failures = [];
let n = 0;

function tree(name, files) {
  const dir = join(scratch, name);
  mkdirSync(dir, { recursive: true });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
function run(dir) {
  const r = spawnSync(process.execPath, [GUARD, dir], { encoding: "utf8" });
  return { rc: r.status, out: r.stdout + r.stderr };
}
function expect(label, dir, rc, mustMention) {
  n++;
  const r = run(dir);
  if (r.rc !== rc) failures.push(`${label}: rc ${r.rc}, expected ${rc}\n${r.out}`);
  else if (mustMention && !r.out.includes(mustMention)) failures.push(`${label}: output does not name ${mustMention}\n${r.out}`);
}

const clean = '<p>See <a href="research/changelog.html">the changelog</a> and BACKLOG.md section 2.</p>\n';
try {
  expect("a clean tree passes", tree("clean", { "index.html": clean, "tests/x.test.mjs": "// tests/ and research/ are public\n" }), 0, "scanned 2 files");
  // The four shapes that shipped on 2026-10-03/04.
  expect("an anchor url at a workspace root fails",
    tree("anchor", { "engine.js": 'anchor: { quote: "q", url: "orchestration/backlog-recovery/day-2026-07-28/row514-round3/x.json" },\n' }), 1, "engine.js:1");
  expect("a plan path in a served comment fails",
    tree("plan", { "a.js": "/* ok */\n/* Governing plan: orchestration/plans/p.md */\n" }), 1, "a.js:2");
  expect("a project-under-workspace path fails",
    tree("proj", { "e.js": 'procedure: "research/inference-margins/BACKLOG.md section 2",\n' }), 1, "e.js:1");
  expect("an HTML comment naming a report path fails",
    tree("html", { "index.html": "<!-- spec: orchestration/backlog-recovery/day-2026-07-28/reports/s.md -->\n" }), 1, "index.html:1");
  // Built at run time so this file carries no home-directory literal (the public mirror's deny-grep
  // refuses one); any user's home directory must fail, not only the author's.
  expect("a home-anchored path fails", tree("home", { "t.mjs": "// /" + "home/" + "someone/x\n" }), 1, "t.mjs:1");
  expect("a polaris path in a nested served test fails", tree("nested", { "tests/deep/t.mjs": "// see polaris/tools/x\n" }), 1, "tests/deep/t.mjs:1");
  // Shapes that are public and must not fire.
  expect("a path inside an external URL passes",
    tree("url", { "a.html": '<a href="https://github.com/org/repo/blob/main/orchestration/x.md">x</a> and https://e.com/polaris/y\n' }), 0);
  // A symlink is never followed, even when it points at a leaking file.
  const outside = tree("outside", { "leak.js": "// orchestration/backlog-recovery/x\n" });
  const linked = tree("linked", { "ok.js": "// fine\n" });
  symlinkSync(join(outside, "leak.js"), join(linked, "leak.js"));
  expect("a symlink is not followed", linked, 0, "scanned 1 files");
  // Review fold (round 1): every file is scanned as raw bytes. A NUL byte used to exempt a whole
  // file, so one stray NUL in a served page hid a real link after it; a path in a binary's
  // metadata is caught too.
  expect("a NUL byte does not exempt a served page",
    tree("nul", { "ok.js": "// fine\n", "page.html": '<!--\u0000-->\n<a href="orchestration/backlog-recovery/x.json">source</a>\n' }), 1, "page.html:2");
  const bin = tree("bin", { "ok.js": "// fine\n" });
  writeFileSync(join(bin, "img.png"), Buffer.concat([Buffer.from([0x89, 0x50, 0, 0]), Buffer.from(" orchestration/x")]));
  expect("a path inside a binary file is caught", bin, 1, "img.png");
  const binClean = tree("binclean", { "ok.js": "// fine\n" });
  writeFileSync(join(binClean, "img.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0x2f, 0x2e]));
  expect("a clean binary file passes and is counted", binClean, 0, "scanned 2 files");
  // Review fold (round 1): encoded and relative forms of the same paths.
  expect("a JS-escaped slash is decoded", tree("jsesc", { "a.js": 'url: "orchestration\\/backlog-recovery\\/x.json"\n' }), 1, "a.js:1");
  expect("a \\u002f escape is decoded", tree("uesc", { "a.js": 'url: "polaris\\u002ftools\\u002fx"\n' }), 1, "a.js:1");
  expect("an HTML numeric entity slash is decoded", tree("ent", { "a.html": '<a href="orchestration&#47;backlog-recovery&#47;x.json">s</a>\n' }), 1, "a.html:1");
  expect("an HTML hex entity slash is decoded", tree("hent", { "a.html": '<a href="orchestration&#x2F;x">s</a>\n' }), 1, "a.html:1");
  expect("a URL-encoded slash is decoded", tree("pct", { "a.html": '<a href="orchestration%2Fbacklog-recovery%2Fx.json">s</a>\n' }), 1, "a.html:1");
  expect("a ./ prefix does not hide a workspace root", tree("dot", { "a.js": "// ./orchestration/backlog-recovery/x.json\n" }), 1, "a.js:1");
  expect("a ../ prefix does not hide a workspace root", tree("dotdot", { "a.js": "// ../polaris/tools/x.json\n" }), 1, "a.js:1");
  expect("an escaped external URL still passes", tree("escurl", { "a.js": 'u = "https:\\/\\/e.com\\/polaris\\/y"\n' }), 0);
  // Nothing to scan is never a pass.
  expect("an empty tree is not a pass", tree("empty", {}), 2);
  expect("a missing tree is not a pass", join(scratch, "does-not-exist"), 2);
} finally {
  // Remove only the directory mkdtemp just created for this run.
  if (scratch.startsWith(join(tmpdir(), "im-ws-guard-"))) rmSync(scratch, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`WORKSPACE-PATH GUARD FAILURES (${failures.length}/${n})\n${failures.map((f) => `- ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`ALL ${n} WORKSPACE-PATH GUARD CASES PASS`);
