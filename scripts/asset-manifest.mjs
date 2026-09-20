import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)), "site");
const MANIFEST = join(ROOT, "asset-manifest.sha256");
const WRITE = process.argv.includes("--write");

// bq-294: fail closed on anything that is not a regular file or a real directory.
//
// readdirSync(..., {withFileTypes: true}) yields Dirents describing the ENTRY
// itself (lstat semantics, no follow), so a symlink answers false to BOTH
// isFile() and isDirectory(). The original else-if chain therefore SKIPPED
// symlinks silently: they were neither hashed nor recursed into, and simply
// vanished from the manifest. An entry absent from the manifest is an entry the
// integrity check cannot protect, while the deploy may still serve it — the one
// direction an integrity tool must never fail in.
//
// Throwing is deliberate. A link under site/ is either a mistake or an attempt
// to smuggle content past the hash, and "skip it" is the wrong answer to both.
// If a link policy is ever genuinely wanted, it must hash BOTH the link metadata
// and a deployment-equivalent target — until then, refuse.
function describeEntry(entry) {
  if (entry.isSymbolicLink()) return "symlink";
  if (entry.isBlockDevice()) return "block device";
  if (entry.isCharacterDevice()) return "character device";
  if (entry.isFIFO()) return "FIFO";
  if (entry.isSocket()) return "socket";
  return "special entry";
}

function filesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(ROOT, path).split(sep).join("/");
    if (entry.isDirectory()) {
      out.push(...filesUnder(path));
    } else if (entry.isFile()) {
      if (path !== MANIFEST) out.push(path);
    } else {
      throw new Error(
        `refusing to build or verify an asset manifest over a ${describeEntry(entry)}: ./${rel}\n` +
        "  Every entry under site/ must be a regular file or a directory, so that every\n" +
        "  served byte is hashed. Remove the entry, or replace it with a real file.",
      );
    }
  }
  return out;
}

function manifestLine(path) {
  const rel = relative(ROOT, path).split(sep).join("/");
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  return `${hash}  ./${rel}`;
}

const expected = filesUnder(ROOT).sort().map(manifestLine).join("\n") + "\n";
if (WRITE) {
  writeFileSync(MANIFEST, expected);
  console.log(`wrote ${expected.trimEnd().split("\n").length} asset hashes`);
  process.exit(0);
}

let actual = "";
try {
  if (!statSync(MANIFEST).isFile()) throw new Error("not a regular file");
  actual = readFileSync(MANIFEST, "utf8");
} catch (error) {
  console.error(`asset manifest missing or unreadable: ${error.message}`);
  process.exit(1);
}

if (actual !== expected) {
  const actualRows = new Map(actual.trim().split("\n").filter(Boolean).map((line) => {
    const match = /^([0-9a-f]{64})  (\.\/.+)$/.exec(line);
    return match ? [match[2], match[1]] : [line, null];
  }));
  const expectedRows = new Map(expected.trim().split("\n").map((line) => {
    const match = /^([0-9a-f]{64})  (\.\/.+)$/.exec(line);
    return [match[2], match[1]];
  }));
  const missing = [...expectedRows.keys()].filter((path) => !actualRows.has(path));
  const extra = [...actualRows.keys()].filter((path) => !expectedRows.has(path));
  const changed = [...expectedRows.keys()].filter((path) =>
    actualRows.has(path) && actualRows.get(path) !== expectedRows.get(path));
  console.error(`asset manifest drift: ${missing.length} missing, ${extra.length} extra, ${changed.length} hash mismatch`);
  for (const path of missing) console.error(`- missing ${path}`);
  for (const path of extra) console.error(`- extra ${path}`);
  for (const path of changed) console.error(`- changed ${path}`);
  process.exit(1);
}

console.log(`asset manifest verified (${expectedRowsCount(expected)} files)`);

function expectedRowsCount(value) {
  return value.trimEnd() ? value.trimEnd().split("\n").length : 0;
}
