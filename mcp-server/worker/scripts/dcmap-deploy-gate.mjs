/* =====================================================================================
   dcmap-deploy-gate.mjs — "NONE embedded" fails CLOSED at deploy time.

   `scripts/build.mjs` deliberately does not refuse to BUILD when there is no active dc-map
   substrate release: the release artifacts are regenerable producer output and are git-ignored, so
   a fresh checkout has none, and failing there would take the eight existing margin tools down with
   the seven datacenter ones over a release nobody has materialised. That call is right, and the
   Worker degrades honestly — every datacenter tool answers `release-unavailable` and nothing is
   substituted.

   DEPLOYING that state is a different decision, and until this gate existed nothing made it one.
   `DCMAP_REQUIRE_RELEASE=1` existed and worked, and NOTHING in the repository ever set it: the
   round-1 review grepped and found it only in the implementation, its test, the README and a status
   file. So `npm run deploy` built with `dc-map release: NONE embedded`, shipped, and passed
   `--readback` — because the readback leg checks AGREEMENT about the absence, not that a release
   exists. A gate that lives only in prose is the same thing the release gate itself was found to be
   in August 2026: a contract nothing executes, which is a comment.

   So: the deploy path runs this, and it refuses. An operator who genuinely wants to ship the
   connector with no substrate release sets DCMAP_ALLOW_NO_RELEASE=1, and the waiver is printed —
   a gate nobody can see waived is not a gate.

   Usage:  node scripts/dcmap-deploy-gate.mjs [path/to/release.gen.ts]
   ===================================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const OVERRIDE_ENV = "DCMAP_ALLOW_NO_RELEASE";
export const RELEASE_GEN = join(HERE, "..", "src", "gen", "dcmap", "release.gen.ts");

/** Read the identity of the release the BUILD embedded, from the generated module the bundle
 *  carries — not from dc-map/releases, which says what CURRENT points at right now rather than what
 *  is about to ship. Same two literals `release-gate.mjs --readback` reads. */
export function readEmbeddedRelease(genPath = RELEASE_GEN) {
  if (!existsSync(genPath))
    return { status: "missing", release_id: null,
      reason: `${genPath} does not exist — run \`npm run build\` before the deploy gate` };
  const source = readFileSync(genPath, "utf8");
  const status = /"status":\s*"([^"]+)"/.exec(source);
  const id = /"release_id":\s*(null|"[^"]+")/.exec(source);
  if (!status || !id)
    return { status: "missing", release_id: null,
      reason: "the generated module carries no embedded dc-map release identity" };
  return { status: status[1], release_id: id[1] === "null" ? null : JSON.parse(id[1]), reason: null };
}

/** The decision, kept pure so it can be tested without a deploy. */
export function dcmapDeployDecision(embedded, env = process.env) {
  if (embedded.status === "ok" && embedded.release_id)
    return { ok: true, override: false,
      message: `dc-map deploy gate: OK — this build embeds substrate release ${embedded.release_id}` };
  const why = embedded.reason
    ?? "this build embedded NO dc-map substrate release (`dc-map release: NONE embedded`)";
  if (env[OVERRIDE_ENV] === "1")
    return { ok: true, override: true,
      message: `dc-map deploy gate: OVERRIDDEN — ${OVERRIDE_ENV}=1 is set, so this deploy ships with no dc-map `
        + `substrate release: ${why}. All seven datacenter tools will answer release-unavailable on the live `
        + `connector, and \`--readback\` will agree with them about the absence. Recorded here because a waiver `
        + `nobody can see is not a waiver.` };
  return { ok: false, override: false,
    message: `dc-map deploy gate: REFUSING TO DEPLOY — ${why}. The connector would serve seven datacenter tools `
      + `that can answer nothing, and the readback gate would certify it because it checks agreement about the `
      + `absence, not that a release exists. Materialise the release and rebuild (\`npm run build\`, with `
      + `DCMAP_REQUIRE_RELEASE=1 to make an absence fail the build too), or set ${OVERRIDE_ENV}=1 to deploy `
      + `without one — the waiver is logged.` };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const decision = dcmapDeployDecision(readEmbeddedRelease(process.argv[2] ? resolve(process.argv[2]) : undefined));
  if (!decision.ok) { console.error(decision.message); process.exit(1); }
  console.log(decision.message);
}
