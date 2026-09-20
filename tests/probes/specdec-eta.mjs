/* T-13 evidence probe — a row's deployed decode efficiency, read from the live registry.
 * Usage: node tests/probes/specdec-eta.mjs <rowKey>
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const site = new URL("../../site/", import.meta.url).pathname;
const D = require(site + "engine-data-v22.js");
const row = process.argv[2];
const c = D.CALIBRATION[row];
if (!c) { console.error("unknown row: " + row); process.exit(2); }
process.stdout.write(`${row}:${c.etaDec}`);
