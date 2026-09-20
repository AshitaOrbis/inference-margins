// Regression fixture for bq-294: a symlink under site/ must FAIL the manifest.
//
// The defect: readdirSync(..., {withFileTypes: true}) yields Dirents describing
// the entry itself (lstat semantics), so a symlink answers false to BOTH
// isFile() and isDirectory(). The original traversal's else-if chain skipped
// those entries silently — a symlink was neither hashed nor recursed into and
// simply vanished from the manifest, while the deploy could still serve it.
//
// This fixture drives the REAL script against a throwaway tree rather than
// re-implementing its traversal, so it cannot pass while the shipped script is
// broken. It runs the script with a patched ROOT via a temporary copy, because
// the script resolves ROOT from its own module URL.
//
// Run: node tests/asset-manifest-symlink.test.mjs
import { execFileSync } from "node:child_process";
import {
  mkdtempSync, mkdirSync, writeFileSync, symlinkSync, readFileSync, rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const REAL_SCRIPT = join(HERE, "..", "scripts", "asset-manifest.mjs");

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

/** Build a throwaway project: <tmp>/scripts/asset-manifest.mjs + <tmp>/site/. */
function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "am-fixture-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "site"));
  writeFileSync(join(root, "scripts", "asset-manifest.mjs"),
                readFileSync(REAL_SCRIPT, "utf8"));
  writeFileSync(join(root, "site", "index.html"), "<h1>real</h1>\n");
  return root;
}

function runScript(root, args = []) {
  try {
    const stdout = execFileSync(
      process.execPath, [join(root, "scripts", "asset-manifest.mjs"), ...args],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { code: 0, out: stdout, err: "" };
  } catch (e) {
    return { code: e.status ?? 1, out: e.stdout ?? "", err: e.stderr ?? "" };
  }
}

// --- 1. baseline: a clean tree writes and then verifies -----------------------
const clean = makeFixture();
const wrote = runScript(clean, ["--write"]);
check("clean tree: --write succeeds", wrote.code === 0);
const verified = runScript(clean);
check("clean tree: verify succeeds", verified.code === 0);

// --- 2. the regression: a symlink must fail, not be skipped -------------------
// The link is the ONLY change made after --write, and its target lives OUTSIDE
// site/ on purpose. An earlier draft of this fixture put the payload inside
// site/ as a regular file; that made the assertion pass even against the broken
// traversal, because the extra regular file caused ordinary manifest DRIFT and a
// non-zero exit for the wrong reason. Mutation testing caught it. With the target
// outside site/, the broken traversal produces a byte-identical manifest and exits
// 0 — so this assertion can only pass when symlinks are genuinely rejected.
const linked = makeFixture();
runScript(linked, ["--write"]);
writeFileSync(join(linked, "payload-outside-site.txt"), "payload\n");
symlinkSync(join(linked, "payload-outside-site.txt"), join(linked, "site", "sneaky.html"));

const afterLink = runScript(linked);
check("symlink under site/ forces a NON-ZERO exit", afterLink.code !== 0);
check("failure names the offending path", /sneaky\.html/.test(afterLink.err + afterLink.out));
check("failure says it is a symlink", /symlink/i.test(afterLink.err + afterLink.out));

// --write must refuse too: a manifest generated over a tree containing a link
// would bless the omission permanently.
const onWrite = runScript(linked, ["--write"]);
check("--write also refuses while a symlink is present", onWrite.code !== 0);

// --- 3. a symlinked DIRECTORY is caught as well ------------------------------
// Same discipline as above: the real directory and its file exist BEFORE the
// manifest is written, so the ONLY post-manifest change is the link. Otherwise a
// skipped link still trips ordinary drift and the assertion passes for the wrong
// reason.
const dirLink = makeFixture();
mkdirSync(join(dirLink, "site", "real-dir"));
writeFileSync(join(dirLink, "site", "real-dir", "a.txt"), "a\n");
runScript(dirLink, ["--write"]);
symlinkSync(join(dirLink, "site", "real-dir"), join(dirLink, "site", "linked-dir"));
const dirResult = runScript(dirLink);
check("symlinked DIRECTORY under site/ also fails", dirResult.code !== 0);

for (const d of [clean, linked, dirLink]) rmSync(d, { recursive: true, force: true });

console.log();
if (failures) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("all fixtures pass — symlinks and special entries cannot slip past the manifest");
