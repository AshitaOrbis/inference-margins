#!/usr/bin/env node
/* assert-suite-nonempty — refuse to report success for a suite that ran nothing.
 *
 * Vetting round 2026-09-19, Astra pack E P1-4. `node --test "test/*.test.mjs"` exits 0 when the
 * glob matches nothing: on Node 24 the probe returned exit 0, tests 0, suites 0. The Worker
 * package's test script is exactly that command, and mcp-server/worker/test was not in
 * publish.sh's allow-list, so the public snapshot's Worker job reported a green tick having
 * executed zero assertions. A green tick that attests nothing is worse than a red one.
 *
 * Usage: node <this> <glob-dir> <minimum> — e.g. `node ../../tests/assert-suite-nonempty.mjs test 3`
 * Resolved relative to the current working directory, so each package can point it at its own
 * suite directory before running it.
 */
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const [dir = "test", minimum = "1"] = process.argv.slice(2);
const want = Number(minimum);
const abs = resolve(process.cwd(), dir);

if (!Number.isInteger(want) || want < 1) {
  console.error(`assert-suite-nonempty: minimum must be a positive integer (got "${minimum}")`);
  process.exit(2);
}
if (!existsSync(abs)) {
  console.error(`assert-suite-nonempty: ${dir}/ does not exist — the suite cannot have run. `
    + "If this is a published snapshot, the directory is missing from the publish allow-list.");
  process.exit(1);
}
const found = readdirSync(abs).filter((name) => name.endsWith(".test.mjs")).sort();
if (found.length < want) {
  console.error(`assert-suite-nonempty: ${dir}/ holds ${found.length} *.test.mjs file(s), `
    + `expected at least ${want}. A test runner exits 0 when its glob matches nothing, so this `
    + "check exists to turn that silent pass into a failure.");
  if (found.length) console.error("  found: " + found.join(", "));
  process.exit(1);
}
console.log(`assert-suite-nonempty: ${found.length} test file(s) in ${dir}/ (minimum ${want})`);
