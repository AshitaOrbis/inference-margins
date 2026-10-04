#!/usr/bin/env node
/* check-no-workspace-paths.mjs — refuse a shipped tree that names the private workspace.
 *
 * Everything under site/ is served verbatim at margins.ashitaorbis.com, comments and the
 * /tests/ twins included. On 2026-10-03 two dossier anchors shipped workspace paths as
 * [source] links (one answered 404 to every visitor), and served comments carried a dozen
 * more; nothing in the gate looked (bq-4610). This guard fails the canonical gate on any
 * token that STARTS a path at a private workspace root, or names the workspace or a home
 * directory, in any text file of the tree it is given.
 *
 * It does not judge repository-relative names (BACKLOG.md, tests/…, research/…): those are
 * this project's own public layout. Symlinks are never followed.
 *
 * Review fold (round 1, 2026-10-04): every regular file is scanned, binary or not, as raw bytes
 * (a served file with one NUL byte used to be skipped whole); a path is matched after decoding
 * the escapes a served file can carry it in (JS `\/`, `\u002f`, `\x2f`; HTML `&#47;`,
 * `&#x2f;`, `&sol;`; URL `%2F`), and also when it starts with `./` or `../`. A match inside an
 * external URL whose path merely CONTAINS one of the names (not at a root) still does not fire.
 *
 * Usage: node scripts/check-no-workspace-paths.mjs [dir]   (default: site)
 * Exit 0 clean · 1 a workspace path was found · 2 nothing could be scanned.
 */
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const WORKSPACE_PATH = new RegExp(
  String.raw`(?<![\w./-])(?:\.{1,2}/)*(?:orchestration|polaris|claude-evolution|session-management|backlog-recovery)/` +
  // Any home directory, any user. Spelled h[o]me so that this file does not itself trip the public
  // mirror's deny-grep for home-directory paths (scripts/publish.sh), which reads text, not regexes.
  String.raw`|research/inference-margins/|claudeworkspace|/h[o]me/[A-Za-z0-9._][A-Za-z0-9._-]*|~/\.claude|(?<![\w./-])(?:\.{1,2}/)*\.claude/`,
  "g",
);

// Each replacement turns one encoded slash into "/" and touches no newline, so a match's line
// number in the decoded text is its line number in the file.
function decodeSlashes(s) {
  return s
    .replace(/\\u002[fF]|\\x2[fF]|\\\//g, "/")
    .replace(/&#0*47;|&#[xX]0*2[fF];|&sol;/g, "/")
    .replace(/%2[fF]/g, "/");
}

const root = resolve(process.argv[2] || "site");
let scanned = 0;
const hits = [];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch (e) {
    console.error(`check-no-workspace-paths: cannot read ${dir}: ${e.message}`);
    process.exit(2);
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) { walk(path); continue; }
    if (!st.isFile()) continue;
    // latin1 maps every byte to one character, so ASCII paths are found in any file, text or
    // binary, and a NUL byte cannot hide the rest of the file.
    const text = decodeSlashes(readFileSync(path).toString("latin1"));
    scanned++;
    for (const m of text.matchAll(WORKSPACE_PATH)) {
      const line = text.slice(0, m.index).split("\n").length;
      const excerpt = text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 50)
        .replace(/\s+/g, " ").replace(/[^\x20-\x7e]/g, "?");
      hits.push(`${relative(root, path)}:${line}: …${excerpt}…`);
    }
  }
}

walk(root);
if (scanned === 0) {
  console.error(`check-no-workspace-paths: no file under ${root} — nothing was checked`);
  process.exit(2);
}
for (const h of hits) console.error(`WORKSPACE PATH ${h}`);
console.log(`check-no-workspace-paths: scanned ${scanned} files under ${relative(process.cwd(), root) || "."}; ${hits.length} workspace path(s)`);
process.exit(hits.length ? 1 : 0);
