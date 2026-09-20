/* T-13 evidence probe — numeric CONSISTENCY of the h800 lineage rows.
 *
 * SCOPE, stated because v13 got this wrong: this probe proves NUMERIC EQUALITY, which is a
 * CONSEQUENCE of inheritance, not evidence of it. The typed lineage edge is the evidence and is
 * pinned separately in BASIS_MANIFEST as a {kind:"quote"} on each row's sourceRefs. Do not name
 * this probe's output after the thing you wish it proved.
 *
 * Usage: node tests/probes/specdec-eta-consistency.mjs <rowKey>
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const site = new URL("../../site/", import.meta.url).pathname;
const D = require(site + "engine-data-v22.js");

const row = process.argv[2];
if (!row) { console.error("usage: specdec-eta-consistency.mjs <rowKey>"); process.exit(2); }
const child = D.CALIBRATION[row], parent = D.CALIBRATION.h800;
if (!child) { console.error("unknown row: " + row); process.exit(2); }
const equal = child.etaDec === parent.etaDec;
process.stdout.write(`${row}:${child.etaDec};h800:${parent.etaDec};equal=${equal}`);
