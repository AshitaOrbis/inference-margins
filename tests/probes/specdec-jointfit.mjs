/* T-13 evidence probe — that a joint-fit row rides the frozen joint fleet fit and carries NO
 * observation of its own.
 *
 * WHY THIS SHAPE (v16): the earlier pinned expect was `eta=0.36142;qUsed=true;aUsed=true`, which
 * is NOT DERIVABLE — trn2 and trn3 have `calObs: null`, so there is no q or a on those rows to
 * have been used or unused. A probe printing qUsed/aUsed would have been manufacturing its own
 * oracle, the exact defect round-9 Sol banned. What IS derivable, and what the `excluded` status
 * actually rests on, is: the row's η equals the frozen joint fit, and the row carries no anchor
 * observation that could have embedded speculation.
 *
 * Usage: node tests/probes/specdec-jointfit.mjs <rowKey>
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const site = new URL("../../site/", import.meta.url).pathname;
const D = require(site + "engine-data-v22.js");
const row = process.argv[2];
const c = D.CALIBRATION[row];
if (!c) { console.error("unknown row: " + row); process.exit(2); }
process.stdout.write(
  `${row}:etaDec=${c.etaDec};jointEtaDec=${D.JOINT_ETA_DEC};` +
  `matchesJointFit=${c.etaDec === D.JOINT_ETA_DEC};calObs=${c.calObs === null ? "null" : "present"}`
);
