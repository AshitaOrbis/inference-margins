/* sweep-date-label — a provenance label names the sweep that surfaced ITS row.
 *
 * bq-3150 (review finding F13 of dozen-04-inverted-exverted): SWEEP_DISCLAIMER and the
 * reported-unverified branch of provenanceTierLabel() hard-coded "2026-07-12", so every row
 * carrying a sweep field read as surfaced by the 2026-07-12 sweep — including the two Patel rows
 * whose sweep is 2026-07-26 (they take the default branch, tier analyst-characterization).
 *
 * Red on the pre-fix engine: both Patel labels name 2026-07-12, and a synthetic 2026-07-26 row
 * on any tier that carries the disclaimer does too.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let fails = 0, passes = 0;
const check = (name, cond, detail = "") => {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
};

const DATE = /\d{4}-\d{2}-\d{2}/g;
const sweepDates = label => (label.match(/surfaced by a (\d{4}-\d{2}-\d{2})/g) || [])
  .map(s => s.match(DATE)[0]);

// Every registry row with a sweep date names that date, and only that date, as its sweep.
const swept = E.MARGIN_CLAIMS.filter(c => c.sweep);
check("registry has rows on more than one sweep date",
  new Set(swept.map(c => c.sweep)).size > 1, [...new Set(swept.map(c => c.sweep))].join(", "));
for (const c of swept) {
  const label = E.provenanceTierLabel(c);
  const named = sweepDates(label);
  if (c.provenanceTier === "primary-post" || c.provenanceTier === "model-generated") {
    check(c.id + ": " + c.provenanceTier + " carries no sweep disclaimer", named.length === 0, label);
  } else {
    check(c.id + ": label names its own sweep " + c.sweep,
      named.length === 1 && named[0] === c.sweep, label);
  }
}

// The named 2026-07-26 rows from the finding.
for (const id of ["patel-anthropic-first-gp-2626", "patel-openai-margin-trajectory-2626"]) {
  const c = E.MARGIN_CLAIMS.find(x => x.id === id);
  check(id + " present with sweep 2026-07-26", c && c.sweep === "2026-07-26");
  if (c) check(id + " does not say 2026-07-12 sweep",
    !/2026-07-12[^;]*sweep/.test(E.provenanceTierLabel(c)), E.provenanceTierLabel(c));
}

// Every tier that carries a disclaimer, on a synthetic 2026-07-26 row.
const tiers = ["audited", "reported-unverified", "clip-mediated", "analyst-assumption",
  "aggregator", "analyst-characterization"];
for (const t of tiers) {
  const label = E.provenanceTierLabel({ provenanceTier: t, who: "X", sweep: "2026-07-26" });
  check("synthetic " + t + " row with sweep 2026-07-26 renders that date",
    label.includes("surfaced by a 2026-07-26") && !label.includes("2026-07-12"), label);
}
// No sweep field → no sweep disclaimer on any tier.
for (const t of tiers) {
  const label = E.provenanceTierLabel({ provenanceTier: t, who: "X" });
  check("synthetic " + t + " row without sweep carries no disclaimer",
    !label.includes("surfaced by"), label);
}
// The exported constant keeps its 2026-07-12 wording for existing consumers.
check("SWEEP_DISCLAIMER keeps its 2026-07-12 wording",
  E.SWEEP_DISCLAIMER === "surfaced by a 2026-07-12 reputable-source sweep; not independently re-verified here");

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log("SWEEP-DATE-LABEL CHECKS FAIL"); process.exit(1); }
console.log("ALL SWEEP-DATE-LABEL CHECKS PASS");
