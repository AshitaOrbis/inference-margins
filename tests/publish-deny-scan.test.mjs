/* publish-deny-scan — the publisher's privacy gate must SEE every shipped byte.
 *
 * Mutation control for the im-vet-0919 fold. scripts/publish.sh's deny-grep is the single
 * control that keeps the owner's real name, personal email and machine paths out of the public
 * repository, and it had four blind spots:
 *
 *   0. No `-a`. GNU grep classifies a file containing one NUL byte as binary and, with output
 *      redirected, reports NOTHING and exits 1 — so the gate printed "clean" and shipped it
 *      unscanned. This was LIVE: tests/dc-registry-schema-t4.test.mjs is allow-listed and
 *      carried a literal NUL as a negative-control needle.
 *   1. Pathnames were never scanned; the address could sit in the filename.
 *   2. The email pattern was case-sensitive, so an uppercase free-mail address passed.
 *   3. It ran once, BEFORE validate_stage installed into and built inside the stage.
 *
 * This suite extracts deny_scan() from the live publisher and runs it against scratch trees.
 * It deliberately uses SYNTHETIC values only — writing the real deny patterns into a tracked
 * test file would put the very strings the gate exists to exclude into the repository.
 * publish.sh is a registered private input, so the behavioural half runs in the private tree
 * and skips loudly on the public snapshot, where the publisher is absent by design.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { provenance, repoPath } from "./provenance-inputs.mjs";

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const prov = provenance("publish-deny-scan", assert);

/* ASSEMBLED AT RUNTIME, NEVER WRITTEN AS LITERALS. This file is inside `tests/`, which
   publish.sh ships wholesale, so a literal home-directory path or free-mail address here would be
   caught by the very gate it is testing — the first dry-run after the gate was hardened failed
   on exactly that, naming this file. A test for a privacy gate must not carry the strings the
   gate excludes. Concatenation defeats the scanner's line-oriented match while producing the
   identical bytes on disk in the scratch tree below, which is what is actually under test. */
const HOME_PATH = ["", "home", "synthetic-user", "private", "notes.md"].join("/");  // deny pattern (3)
const EMAIL_UPPER = "synthetic" + "@" + "GMAIL" + "." + "COM";                      // deny pattern (2)

prov.gate("scripts/publish.sh", 31, (publisher) => {  // 29 + 2 (2026-09-20, im-repo-replacement):
  // the single-point exit-status interpretation, and the "any unexpected status is a refusal" rule.
  /* --- structural: every grep inside deny_scan reads binary files as text ---
     WIDENED 2026-09-20 (im-repo-replacement): the three DETECTING scans now go through a
     `grep_status` helper, which is the only place grep's exit status is interpreted — 0 matched,
     1 genuinely no match, anything else a refusal, because `if grep …; then` read exit 2 ("an
     error occurred") exactly like exit 1 and printed "clean" on a tree nobody had scanned. The
     helper is DEFINED ABOVE deny_scan, so a slice that starts at `deny_scan() {` no longer
     contains the implementation it is judging, and the flags now sit at the CALL SITES
     (`grep_status -ranniE …`), which `\bgrep\s+` cannot see. Both are corrected here: the slice
     starts at the helper, and the flag pattern accepts either spelling. The guarantee is
     unchanged — every scanning invocation must still carry -a or -I. */
  const fn = publisher.slice(publisher.indexOf("grep_status() {"), publisher.indexOf("\ndeny_scan \""));
  prov.assert("publish.sh defines deny_scan() as a function, so the two calls cannot drift",
    fn.length > 0 && /deny_scan\(\) \{/.test(fn));
  prov.assert("the exit status of every scan is interpreted in exactly one place",
    /grep_status\(\) \{/.test(fn) && /\brc=\$\?/.test(fn));
  /* COUNTED, not merely present. The first cut of this assertion tested `/!= 1/.test(fn)` and
     stayed GREEN when the three content scans were reverted to `= 2`, because the PATHNAME scan
     carries its own `!= 1` and satisfied the regex on its own. Each of the four scans has to
     carry the rule itself, so each of the four is counted. (Verified by reverting the three
     content branches to `= 2`: this assertion goes red, the count-free version did not.) */
  prov.assert("a scan that could not RUN is a refusal, not a clean result — on ANY unexpected status",
    (fn.match(/COULD NOT COMPLETE/g) || []).length >= 4
      && (fn.match(/!= 1 \]/g) || []).length >= 4,
    `COULD NOT COMPLETE x${(fn.match(/COULD NOT COMPLETE/g) || []).length}, "!= 1 ]" x${(fn.match(/!= 1 \]/g) || []).length}`);
  const greps = [...fn.matchAll(/\bgrep(?:_status)?\s+(-[A-Za-z]+)/g)].map((m) => m[1]);
  prov.assert("every grep inside deny_scan passes -a (binary files read as text)",
    greps.length >= 6 && greps.every((flags) => flags.includes("a") || flags.includes("I")),
    JSON.stringify(greps));
  prov.assert("deny_scan refuses NUL-bearing TEXT files outright, not only by reading past them",
    /NUL byte/.test(fn) && /tr -d/.test(fn));
  prov.assert("...while excluding genuine binary assets by EXTENSION, not by path",
    /! -iname '\*\.woff2'/.test(fn) && /! -iname '\*\.png'/.test(fn) && !/site\/fonts/.test(fn),
    "a path-based exemption would quietly cover a future text file in the same directory");
  prov.assert("deny_scan scans PATHNAMES as well as contents",
    /find "\$stage"[\s\S]*-printf/.test(fn) && /PATHNAME/.test(fn));
  prov.assert("the email scan is case-insensitive AND names the percent-encoded variants",
    /grep(?:_status)? -rani/.test(fn) && new RegExp('%40' + 'gmail').test(fn) && new RegExp('@' + 'gmail%2e' + 'com').test(fn),
    "the scan must be -i and must name the encoded forms explicitly — a gate that decodes "
    + "arbitrarily is a gate nobody can reason about, so the set is named and the residual stated");
  prov.assert("publish.sh calls deny_scan BOTH before and after validate_stage",
    (publisher.match(/^deny_scan "\$STAGE"/gm) || []).length === 2,
    JSON.stringify(publisher.match(/^deny_scan "\$STAGE".*$/gm)));
  prov.assert("the post-validate call comes after validate_stage, over the bytes that ship",
    publisher.indexOf('deny_scan "$STAGE" "post-validate"') > publisher.indexOf('validate_stage "$STAGE"'));

  /* --- behavioural: run the extracted function against scratch trees --- */
  const fnFile = join(mkdtempSync(join(tmpdir(), "im-deny-fn-")), "deny_scan.sh");
  /* Extract BOTH functions: deny_scan now calls grep_status, and an extraction that dropped the
     helper made every call return 127. That is worth stating rather than fixing quietly, because
     it is how the fail-open below was found — deny_scan's branches tested for status 2 alone, so
     127 fell through as CLEAN. They test `!= 1` now, and this extraction gives the behavioural
     runs the real implementation instead of a decapitated one. */
  writeFileSync(fnFile,
    execFileSync("sed", ["-n", "/^grep_status() {/,/^}$/p", repoPath("scripts/publish.sh")], { encoding: "utf8" })
    + execFileSync("sed", ["-n", "/^deny_scan() {/,/^}$/p", repoPath("scripts/publish.sh")], { encoding: "utf8" }));

  const run = (root) => {
    try {
      const out = execFileSync("bash", ["-c", `set -uo pipefail; . "${fnFile}"; deny_scan "${root}" "test"`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      return { rc: 0, out };
    } catch (err) {
      return { rc: err.status ?? 1, out: (err.stdout || "") + (err.stderr || "") };
    }
  };
  const tree = (build) => {
    const root = mkdtempSync(join(tmpdir(), "im-deny-"));
    mkdirSync(join(root, "sub"), { recursive: true });
    build(root);
    return root;
  };

  const clean = tree((root) => writeFileSync(join(root, "sub", "ok.txt"), "nothing to see here\n"));
  prov.assert("a clean tree passes", run(clean).rc === 0, run(clean).out);
  rmSync(clean, { recursive: true, force: true });

  /* The headline: the same string that the old gate caught in a plain file and MISSED in a
     NUL-bearing one. Only the NUL file is present, so a pass here means the gate is blind. */
  const fontish = tree((root) => {
    // A genuine binary asset — NULs by construction — must pass, or the gate blocks every
    // publish that ships a font. The five vendored woff2 files are exactly this case.
    writeFileSync(join(root, "sub", "vendored.woff2"), Buffer.from([0x77, 0x4f, 0x46, 0x32, 0, 0, 0, 1, 0, 0]));
    writeFileSync(join(root, "sub", "ok.txt"), "nothing to see here\n");
  });
  const fontRun = run(fontish);
  prov.assert("a NUL-bearing BINARY asset does not trip the gate", fontRun.rc === 0, fontRun.out);
  rmSync(fontish, { recursive: true, force: true });

  const hidden = tree((root) =>
    writeFileSync(join(root, "sub", "hidden.txt"), Buffer.concat([
      Buffer.from("a"), Buffer.from([0]), Buffer.from(` ${HOME_PATH}\n`)])));
  const hiddenRun = run(hidden);
  prov.assert("a home path hidden behind a NUL byte is CAUGHT (the live blind spot)",
    hiddenRun.rc === 1 && hiddenRun.out.includes("hidden.txt"), hiddenRun.out);
  rmSync(hidden, { recursive: true, force: true });

  const upper = tree((root) => writeFileSync(join(root, "sub", "contact.txt"), `contact: ${EMAIL_UPPER}\n`));
  const upperRun = run(upper);
  prov.assert("an uppercase personal-looking email in contents is caught",
    upperRun.rc === 1 && /personal-looking email/.test(upperRun.out), upperRun.out);
  rmSync(upper, { recursive: true, force: true });

  /* Percent-encoded, which is how a free-mail address arrives inside a URL, a JSON blob or an
     HTML attribute. It passed every pattern until the round-3 re-check: the first fix had
     closed only the capitalization and pathname halves of pack D P1-2. */
  const ENCODED = "synthetic" + "%40" + "GMAIL" + "." + "COM";
  const encoded = tree((root) => writeFileSync(join(root, "sub", "encoded.txt"), `contact: ${ENCODED}\n`));
  const encodedRun = run(encoded);
  prov.assert("a percent-encoded free-mail address in contents is caught",
    encodedRun.rc === 1 && /personal-looking email/.test(encodedRun.out), encodedRun.out);
  rmSync(encoded, { recursive: true, force: true });

  const named = tree((root) => writeFileSync(join(root, "sub", `${EMAIL_UPPER}.txt`), "ok\n"));
  const namedRun = run(named);
  prov.assert("an address that appears only in a FILENAME is caught",
    namedRun.rc === 1 && /PATHNAME/.test(namedRun.out), namedRun.out);
  rmSync(named, { recursive: true, force: true });

  /* --- the stage-hygiene rules folded in the same round --- */
  const hygiene = publisher.slice(publisher.indexOf("assert_stage_hygiene() {"),
    publisher.indexOf("\n# Never ship build artifacts"));
  prov.assert("assert_stage_hygiene refuses a staged SYMLINK (the publisher dereferences one during preprocessing)",
    /find "\$stage" -type l/.test(hygiene) && /staged symlink/.test(hygiene));
  prov.assert("assert_stage_hygiene refuses staged working-copy backups (*.bak-*, *~, .DS_Store)",
    /\*\.bak-\*/.test(hygiene) && /staged working-copy backup/.test(hygiene));
  prov.assert("assert_stage_hygiene refuses a surviving feedback deployment identifier",
    /database_id\|ACCESS_AUD/.test(hygiene));
  prov.assert("the publisher strips the feedback D1 id and Access audience before the hygiene assert",
    /sed -i 's\/\^database_id = /.test(publisher) && /sed -i 's\/\^ACCESS_AUD = /.test(publisher));
  prov.assert("the publish commit pins all FOUR git identity variables, not just the two -c settings",
    /GIT_AUTHOR_NAME="\$AUTHOR_NAME"/.test(publisher) && /GIT_COMMITTER_EMAIL="\$AUTHOR_EMAIL"/.test(publisher));
  prov.assert("...and reads the committed identity back before pushing",
    /COMMITTED_IDENT=/.test(publisher)
      && publisher.indexOf("COMMITTED_IDENT=") < publisher.indexOf("git push origin HEAD:main"));
  prov.assert("the staged file inventory is recorded before validation and enforced after it",
    /STAGE_INVENTORY=/.test(publisher) && /POST_INVENTORY=/.test(publisher)
      && /comm -z -13 "\$STAGE_INVENTORY" "\$POST_INVENTORY"/.test(publisher)
      && /FATAL: validation removed an allow-listed path from the stage/.test(publisher));
  /* The first live run of that guard found 82 files validation had added — the vendored
     economics copies, the synthetic dc-map test releases and a preset-pairs artifact — all of
     which `git add -A` would have committed. The guard now REMOVES what the allow-list did not
     put there, rather than only reporting it, so a publish is not blocked by an ordinary build
     product; a removal is what stays fatal. */
  prov.assert("...and removes what validation added rather than only reporting it",
    /cleanup: removed/.test(publisher)
      && publisher.indexOf("ADDED_LIST=") < publisher.indexOf("FATAL: validation removed"));
  /* NUL-delimited end to end, and every deletion target resolved INSIDE the stage (Astra pack D
     round 3): a filename may contain a newline, which a line-oriented inventory turns into two
     pathnames — the cleanup recorded `$STAGE/../outside-victim.txt` as a deletion target — and
     which also lets `foo` and `bar` be replaced by one `foo\nbar` with an identical sorted
     inventory, hiding both removals and the addition. */
  {
    /* Scoped to the INVENTORY block: deny_scan's pathname listing is line-oriented too, but it
       feeds a grep for display, never a deletion, so a split name there costs nothing. */
    const inv = publisher.slice(publisher.indexOf('STAGE_INVENTORY="$(mktemp)"'),
      publisher.indexOf('rm -f "$POST_INVENTORY" "$ADDED_LIST"'));
    prov.assert("the inventory is NUL-delimited end to end, so a newline in a filename cannot split it",
      inv.length > 0 && /-printf '%P\\0'/.test(inv) && /sort -z/.test(inv)
        && /read -r -d ''/.test(inv) && !/-printf '%P\\n'/.test(inv),
      "a line-oriented inventory turns one newline-bearing name into two pathnames");
  }
  prov.assert("...and every deletion target is resolved and required to be inside the stage",
    /realpath -m -- "\$STAGE\/\$rel"/.test(publisher)
      && /cleanup resolved a path outside the stage/.test(publisher));
  prov.assert("the symlink refusal runs BEFORE any preprocessing touches the stage",
    publisher.indexOf("early_link=") > 0
      && publisher.indexOf("early_link=") < publisher.indexOf("sed -i '/^account_id = /d'"),
    "a sed -i on a symlinked file imports the target's bytes into the stage");

  /* Behavioural: the symlink rule, which is the one that can import a byte from outside the
     archived commit. A scratch stage with the two wrangler files the function inspects. */
  const hygieneFile = join(mkdtempSync(join(tmpdir(), "im-hygiene-fn-")), "hygiene.sh");
  writeFileSync(hygieneFile, execFileSync("sed",
    ["-n", "/^assert_stage_hygiene() {/,/^}$/p", repoPath("scripts/publish.sh")], { encoding: "utf8" }));
  const stageTree = () => {
    const root = mkdtempSync(join(tmpdir(), "im-stage-"));
    mkdirSync(join(root, "mcp-server", "worker"), { recursive: true });
    mkdirSync(join(root, "feedback"), { recursive: true });
    writeFileSync(join(root, "mcp-server", "worker", "wrangler.toml"), 'name = "x"\n');
    writeFileSync(join(root, "feedback", "wrangler.toml"),
      'name = "y"\ndatabase_id = "REPLACE-WITH-YOUR-D1-DATABASE-ID"\n');
    return root;
  };
  const hygieneRun = (root) => {
    try {
      execFileSync("bash", ["-c", `set -uo pipefail; . "${hygieneFile}"; assert_stage_hygiene "${root}"`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      return { rc: 0, out: "" };
    } catch (err) { return { rc: err.status ?? 1, out: (err.stdout || "") + (err.stderr || "") }; }
  };
  const okStage = stageTree();
  prov.assert("a clean stage passes assert_stage_hygiene", hygieneRun(okStage).rc === 0, hygieneRun(okStage).out);
  rmSync(okStage, { recursive: true, force: true });

  const linked = stageTree();
  execFileSync("ln", ["-s", "/etc/hostname", join(linked, "mcp-server", "worker", "imported.toml")]);
  const linkedRun = hygieneRun(linked);
  prov.assert("a staged symlink is refused", linkedRun.rc === 1 && /staged symlink/.test(linkedRun.out), linkedRun.out);
  rmSync(linked, { recursive: true, force: true });

  const backed = stageTree();
  writeFileSync(join(backed, "feedback", "wrangler.toml.bak-2026-01-01-pre-something"), "old\n");
  const backedRun = hygieneRun(backed);
  prov.assert("a staged working-copy backup is refused",
    backedRun.rc === 1 && /working-copy backup/.test(backedRun.out), backedRun.out);
  rmSync(backed, { recursive: true, force: true });

  const leaky = stageTree();
  writeFileSync(join(leaky, "feedback", "wrangler.toml"),
    'name = "y"\ndatabase_id = "4fc6ed7e-0000-0000-0000-000000000000"\n');
  const leakyRun = hygieneRun(leaky);
  prov.assert("a surviving feedback deployment identifier is refused",
    leakyRun.rc === 1 && /deployment identifier/.test(leakyRun.out), leakyRun.out);
  rmSync(leaky, { recursive: true, force: true });
});
prov.summary();

console.log(failures ? `\n${failures} PUBLISH DENY-SCAN FAILURE(S)` : "\nALL PUBLISH DENY-SCAN TESTS PASS");
process.exit(failures ? 1 : 0);
