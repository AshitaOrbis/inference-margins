import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-v22.js");

const ledger = readFileSync(new URL("../research/grounding-ledger.md", import.meta.url), "utf8");
/* ADVERSARIAL REVIEW, 2026-08-27: this validated the .md SOURCE and never the SERVED HTML that a
   reader actually fetches — the build script itself calls that file "the authoritative parameter
   record". `npm run build` does regenerate it from the registry, so a tampered value does not
   survive the release path (measured: the edit is reverted by the build, and a post-build
   hand-edit trips the asset-manifest hash). But "the values are checked" and "the served
   document is checked" were two different claims, and only the first was true. Both files are
   validated against the live engine now, and the served one is validated in the shape a reader
   receives it. */
const servedUrl = new URL("../site/research/grounding-ledger.html", import.meta.url);
let served = "";
try { served = readFileSync(servedUrl, "utf8"); } catch { /* reported below */ }
/* the HTML escapes backticks-as-<code> and pipes-as-cells; compare on visible text */
const servedText = served.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const failures = [];
if (!served) failures.push("the SERVED grounding ledger is missing — nothing validates what a reader fetches");
for (const key of E.HW_ORDER) {
  const name = E.HW[key].name;
  const eta = D.CALIBRATION[key].etaDec;
  const hbm = D.HW_ROOFLINE[key].hbmBytes;
  if (!ledger.includes(`| ${name} | \`etaDec\` | ${eta}`))
    failures.push(`${key}: missing live etaDec ${eta}`);
  if (!ledger.includes(`| ${name} | \`hbmBytes\` | ${hbm} B`))
    failures.push(`${key}: missing live hbmBytes ${hbm}`);
  /* the same two parameters, in the SERVED document */
  if (served && !servedText.includes(`${name} etaDec ${eta}`))
    failures.push(`${key}: the SERVED ledger does not publish the live etaDec ${eta}`);
  if (served && !servedText.includes(`${name} hbmBytes ${hbm} B`))
    failures.push(`${key}: the SERVED ledger does not publish the live hbmBytes ${hbm}`);
}
if (ledger.includes("| platform | dense FP8 PF | HBM GB | BW TB/s | rent $/hr | capex $ | effDec | effPre | note |"))
  failures.push("retired effDec/effPre hardware table remains in the adopted ledger");

if (failures.length) {
  console.error(`GROUNDING LEDGER DRIFT (${failures.length})\n${failures.map((x) => `- ${x}`).join("\n")}`);
  process.exit(1);
}
console.log(`GROUNDING LEDGER MATCHES ${E.HW_ORDER.length} LIVE ROOFLINE/CALIBRATION ROWS`);
