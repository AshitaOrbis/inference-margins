import {
  existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const twins = [
  "calibration-invariant-r1.test.mjs",
  "capacity-solver-r1.test.mjs",
  "compute-presets.mjs",
  "epoch-deprecation.test.mjs",
  "evidence-schema.test.mjs",
  "fa-justifications.test.mjs",
  "fa-dual-default-r1.test.mjs",   // T5 rec 1: the initial-load dual-default regression test
  "fa-explain-cdp.test.mjs",
  "fa-m6-b9.test.mjs",
  "fleets.test.mjs",
  "im4-fleet-policy-harness.mjs",
  "landing-hero-modes.test.mjs",
  "loao.mjs",
  "localstorage-epoch.test.mjs",
  "margin-band.test.mjs",              // row 499: attainable margin bands from range-valued dials
  "mix-band.test.mjs",                 // owner ruling q-sliders-fleet-util-point: max/min/median over sum-to-100 provider mixes
  "permalink-defaults-move.test.mjs",   // row 499: the across-a-baseline-move permalink gate
  // Not a suite: the private-input registry and two-mode discipline the twins below import.
  // It resolves the repository root by walking up to package.json, so the served copy needs
  // no path rewriting — but it must BE there, or every twin that imports it fails to load.
  "provenance-inputs.mjs",
  /* im-arc T4 fold (2026-08-24), memo §6 [F10]: the generated pre-fold pin bundle. Like
     provenance-inputs.mjs it is not a suite — render-parity-r1 imports it, so the served twin
     fails to LOAD without it. Its JSON source is copied below.
     r2 (2026-08-25): the bundle's registry half reads the archived pre-fold module bytes under
     im-arc/bak/, which is repository provenance and is deliberately NOT a served artifact. The
     served twin therefore carries those functions unused — importing the module does not touch
     the archive — and tests/t4-receipt-reproduction.test.mjs, the only caller, is deliberately
     ABSENT from this list. Do not "fix" that by adding it: it would resolve im-arc/bak against
     site/ and fail on a path that is not supposed to exist there. */
  "t4-historical-pins.mjs",
  "render-parity-r1.test.mjs",
  "roofline-core.test.mjs",
  "roofline-parallel-diff.mjs",
  "site-links.test.mjs",
  "snapshots.test.mjs",
  "tariff-contract.mjs",             // shared tariff validator (GPT Pro pr-20260902T175643Z-034d27 finding 6: one implementation, both twins)
  "traffic-contract.test.mjs",
  "turnstile-loader-cdp.test.mjs",  // the feedback loader state machine (GPT Pro pr-20260902T153840Z-bce1bb finding 3)
  "derive-c1-control.mjs",          // engine-derived C-1 negative control (same review, finding 1)
  "ux-a-cdp.test.mjs",
  "ux-b-cdp.test.mjs",
  "ux-c-cdp.test.mjs",
];

const copies = [
  ["tests/archived/README.md", "site/tests/archived/README.md"],
  /* im-arc T4 fold (2026-08-24): the declared-delta manifest the served render-parity twin and its
     pin bundle both read. */
  ["tests/fixtures-t4-declared-delta.json", "site/tests/fixtures-t4-declared-delta.json"],
  ["tests/archived/fixtures-baseline-v211.json", "site/tests/archived/fixtures-baseline-v211.json"],
  ["tests/fixtures-baseline-v22.json", "site/tests/fixtures-baseline-v22.json"],
  /* im-release-edit-r2 (2026-09-10): the archived PRE-adoption baseline, mirrored because the
     served traffic-contract twin now asserts the rent-adoption invariant against it — that no
     pair moved except through an adopted leg or Grok-with-cache. Without the mirror the served
     twin cannot load at all. */
  ["tests/fixtures-baseline-v22-pre-rent-adoption.json", "site/tests/fixtures-baseline-v22-pre-rent-adoption.json"],
  ["tests/fixtures-baseline-v22-pre-tariff-correction.json", "site/tests/fixtures-baseline-v22-pre-tariff-correction.json"],
  /* im-vet-six-repairs (2026-09-20): same reason one more time — the served traffic-contract twin
     asserts the 2026-09-20 biconditional against this archived pre-repair baseline, so without the
     mirror the served twin cannot load. */
  ["tests/fixtures-baseline-v22-pre-vetting-repairs.json", "site/tests/fixtures-baseline-v22-pre-vetting-repairs.json"],
  ["tests/fixtures-minted-tokens-v211.json", "site/tests/fixtures-minted-tokens-v211.json"],
  ["tests/fixtures-ux-c-tails.json", "site/tests/fixtures-ux-c-tails.json"],
  ["tests/ux-c-states.mjs", "site/tests/ux-c-states.mjs"],
  ["tests/roofline-diagnostic.mjs", "site/tests/roofline-diagnostic.mjs"],
  ["research/evidence-instances-v22.json", "site/tests/evidence-instances-v22.json"],
];

function servedTwin(source) {
  return source
    .replaceAll("Run: node tests/", "Run: node site/tests/")
    .replaceAll('new URL("../", import.meta.url)', 'new URL("../../", import.meta.url)')
    .replaceAll('new URL("../build-', 'new URL("../../build-')
    .replaceAll('new URL("../research/', 'new URL("../../research/')
    .replaceAll('new URL("../README.md"', 'new URL("../../README.md"')
    .replaceAll('new URL("../scripts/', 'new URL("../../scripts/')
    .replaceAll('new URL("../feedback/', 'new URL("../../feedback/')
    .replaceAll('require("../package.json")', 'require("../../package.json")')
    .replaceAll("../site/", "../")
    .replaceAll("../research/evidence-instances-v22.json", "./evidence-instances-v22.json")
    .replace(
      'join(dirname(fileURLToPath(import.meta.url)), "..", "site", "index.html")',
      'join(dirname(fileURLToPath(import.meta.url)), "..", "index.html")',
    );
}

function servedBrowserScript(source) {
  return source.replace('/site/index.html"', '/index.html"');
}

const desired = [
  ...twins.map((name) => [
    `tests/${name}`,
    `site/tests/${name}`,
    (source) => servedTwin(source),
  ]),
  ["tests/run-app-tests.sh", "site/tests/run-app-tests.sh", servedBrowserScript],
  ...copies.map(([source, target]) => [source, target, (value) => value]),
];

const drift = [];
const desiredTargets = new Set(desired.map(([, targetRel]) => targetRel));
for (const [sourceRel, targetRel, transform] of desired) {
  const sourcePath = join(ROOT, sourceRel);
  const targetPath = join(ROOT, targetRel);
  if (!existsSync(sourcePath)) throw new Error(`served-test source missing: ${sourceRel}`);
  const next = transform(readFileSync(sourcePath, "utf8"));
  const targetIsFile = existsSync(targetPath) && lstatSync(targetPath).isFile();
  const current = targetIsFile ? readFileSync(targetPath, "utf8") : null;
  if (current === next) continue;
  drift.push(`${targetRel} != transformed ${sourceRel}`);
  if (!CHECK) {
    if (existsSync(targetPath) && !targetIsFile) rmSync(targetPath, { recursive: true, force: true });
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, next);
  }
}
const servedDir = join(ROOT, "site", "tests");
function pruneUnexpected(directory, relDirectory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const targetRel = `${relDirectory}/${entry.name}`;
    const targetPath = join(directory, entry.name);
    if (desiredTargets.has(targetRel)) continue;
    const isDesiredParent = entry.isDirectory()
      && [...desiredTargets].some(candidate => candidate.startsWith(`${targetRel}/`));
    if (isDesiredParent) {
      pruneUnexpected(targetPath, targetRel);
      continue;
    }
    drift.push(`${targetRel} has no source twin`);
    if (!CHECK) rmSync(targetPath, { recursive: true, force: true });
  }
}
if (existsSync(servedDir)) pruneUnexpected(servedDir, "site/tests");

if (drift.length) {
  const lead = CHECK ? "served-test drift detected" : "synchronized served tests";
  console.error(`${lead} (${drift.length}):\n${drift.map((x) => `- ${x}`).join("\n")}`);
  if (CHECK) process.exit(1);
} else {
  console.log(`served tests synchronized (${desired.length} artifacts)`);
}
