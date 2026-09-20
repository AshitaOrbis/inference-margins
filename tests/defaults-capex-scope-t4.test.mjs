/* im-arc T4 fold (2026-08-24) — the generic defaults come onto the TCO evidence.
   Spec: research/im-arc-t4-fold-memo.md §2 (the decision table), §6 (the declared delta).

   The claims this file gates:
   * the hard-coded 12-year facility life becomes a NAMED default with a band;
   * `clusterOh` follows the observed capex SCOPE, so a finished-system observation is never
     multiplied by an overhead it already contains (the H800/H20/TPU double count);
   * PUE class bands are scenario/default fallbacks, never facility values;
   * the two lives carry REVERSED cost corners — a longer life is a lower cost;
   * the owned-TCO perspective inherits its electricity BY REGION ID, carrying no literal.
   Run: node tests/defaults-capex-scope-t4.test.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-dc-v1.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const base = () => structuredClone(E.DEFAULTS);

/* ---------- 1. facility life is a named default, not a literal ---------- */
assert("T4-DEF-1 DEFAULTS.dcLifeYears exists and is the adopted middle assumption",
  E.DEFAULTS.dcLifeYears === 15, String(E.DEFAULTS.dcLifeYears));
assert("T4-DEF-1 dcLifeYears is bounded and reachable through the shared sanitizer",
  Array.isArray(E.SCENARIO_BOUNDS.dcLifeYears)
    && E.sanitizeScenarioDiff({ dcLifeYears: 12 }, { mode: "native" }, base()).diff.dcLifeYears === 12
    && E.sanitizeScenarioDiff({ dcLifeYears: 999 }, { mode: "native" }, base()).rejected.length === 1,
  JSON.stringify(E.SCENARIO_BOUNDS.dcLifeYears));
/* The literal it replaces must be gone from the arithmetic: the facility term now divides by
   the named default, so pinning that default at 12 reproduces the historical number exactly. */
{
  const hw = E.hardwareRow("h100");
  const modern = E.hwHourParts(hw, Object.assign(base(), { hwMode: "tco" }), null);
  const pinned = E.hwHourParts(hw, Object.assign(base(), { hwMode: "tco", dcLifeYears: 12, dcPerW: 12 }), null);
  assert("T4-DEF-1 pinning dcLifeYears 12 + dcPerW 12 reproduces the pre-fold facility term",
    close(pinned.dc, (12 * hw.tdp * 1000) / (12 * 8760))
      && !close(modern.dc, pinned.dc),
    JSON.stringify({ modern: modern.dc, pinned: pinned.dc }));
}

/* ---------- 2. the bands, and their REVERSED cost corners ---------- */
const bands = E.tcoDefaultBands();
assert("T4-DEF-2 the adopted default bands are registered with their basis",
  close(bands.lifeYears.lo, 4) && close(bands.lifeYears.mid, 5) && close(bands.lifeYears.hi, 6)
    && close(bands.dcLifeYears.lo, 10) && close(bands.dcLifeYears.mid, 15) && close(bands.dcLifeYears.hi, 20)
    && close(bands.dcPerW.lo, 9.5) && close(bands.dcPerW.mid, 12.5) && close(bands.dcPerW.hi, 17),
  JSON.stringify(bands));
/* [F5]: a longer life is a LOWER cost, so the cost-bottom corner takes the LONG life. A band
   whose corners are not reversed would report the cheap end as the expensive one. */
assert("T4-DEF-2 both lives declare reversed cost corners (long life = cost bottom)",
  bands.lifeYears.costCorners.bottom === 6 && bands.lifeYears.costCorners.top === 4
    && bands.dcLifeYears.costCorners.bottom === 20 && bands.dcLifeYears.costCorners.top === 10,
  JSON.stringify({ life: bands.lifeYears.costCorners, dc: bands.dcLifeYears.costCorners }));
assert("T4-DEF-2 the middles the page opens on are the band middles",
  E.DEFAULTS.lifeYears === bands.lifeYears.mid && E.DEFAULTS.dcLifeYears === bands.dcLifeYears.mid
    && E.DEFAULTS.dcPerW === bands.dcPerW.mid && E.DEFAULTS.dcPerW === 12.5);
assert("T4-DEF-2 dcPerW carries its per-endpoint source year and scope, not a bare attribution",
  bands.dcPerW.endpoints && bands.dcPerW.endpoints.length === 3
    && bands.dcPerW.endpoints.every((row) => /^20\d\d/.test(row.sourceYear) && row.source.length > 8)
    && /shell \+ MEP per delivered IT watt/i.test(bands.dcPerW.scope)
    && /exclud/i.test(bands.dcPerW.scope)
    && !/SemiAnalysis/i.test(JSON.stringify(bands.dcPerW)),
  JSON.stringify(bands.dcPerW));

/* ---------- 3. capexScope drives clusterOh ---------- */
const scopeOf = { tpu7: "installed-system", h800: "installed-system", h20: "installed-system",
  gb200: "base-rack", h100: "bare-card", h200: "bare-card" };
for (const [key, scope] of Object.entries(scopeOf))
  assert(`T4-DEF-3 ${key} declares capexScope ${scope}`,
    E.hardwareRow(key).capexScope === scope, String(E.hardwareRow(key).capexScope));
assert("T4-DEF-3 an installed-system row takes overhead 1.00 and is never multiplied twice",
  ["tpu7", "h800", "h20"].every((key) => close(E.clusterOverheadFor(key, base()), 1.00)),
  JSON.stringify(["tpu7", "h800", "h20"].map((key) => E.clusterOverheadFor(key, base()))));
assert("T4-DEF-3 a base-rack row takes the rack-scale middle and a bare-card row the card middle",
  close(E.clusterOverheadFor("gb200", base()), 1.26)
    && close(E.clusterOverheadFor("h100", base()), 1.30),
  JSON.stringify([E.clusterOverheadFor("gb200", base()), E.clusterOverheadFor("h100", base())]));
/* The double count the TCO synthesis named: H800 $40,000 all-in was rendering as $52,000. */
{
  const state = Object.assign(base(), { hwMode: "tco" });
  const hw = E.hardwareRow("h800");
  assert("T4-DEF-3 the H800 installed capex is no longer inflated by the generic overhead",
    close(E.hwHourParts(hw, state, null).capex, hw.capex / (state.lifeYears * 8760)),
    JSON.stringify({ capex: hw.capex, hourly: E.hwHourParts(hw, state, null).capex }));
}
assert("T4-DEF-3 the scope enum is the registry's, shared by UI, engine and MCP",
  JSON.stringify(D.DC_SCHEMA.CAPEX_SCOPES) === JSON.stringify(["bare-card", "base-rack", "installed-system"])
    && E.HW_ORDER.every((key) => E.hardwareRow(key).capexScope === null
      || D.DC_SCHEMA.CAPEX_SCOPES.includes(E.hardwareRow(key).capexScope)));

/* ---------- 4. the adopted capex spans ---------- */
const capexNow = { h100: 23750, h200: 36000, gb200: 43056, tpu7: 25000 };
for (const [key, expected] of Object.entries(capexNow))
  assert(`T4-DEF-4 ${key} capex middle is the adopted ${expected}`,
    E.hardwareRow(key).capex === expected, String(E.hardwareRow(key).capex));
assert("T4-DEF-4 held rows keep their provisional points",
  E.hardwareRow("gb300").capex === 55000 && E.hardwareRow("trn2").capex === 15000
    && E.hardwareRow("trn3").capex === 20000 && E.hardwareRow("ascend").capex === 23000
    && E.hardwareRow("h800").capex === 40000 && E.hardwareRow("h20").capex === 20000);
/* [F5.4]: the $10bn / 400,000 finished-rack arithmetic is what JUSTIFIES the 1.00 overhead,
   so it lives on the capex row and nowhere else. */
assert("T4-DEF-4 the TPU v7 finished-rack provenance sits ON the capex row",
  /400,?000/.test(E.capexProvenanceFor("tpu7")) && /\$10\s?b/i.test(E.capexProvenanceFor("tpu7"))
    && /installed-system|finished rack/i.test(E.capexProvenanceFor("tpu7")),
  E.capexProvenanceFor("tpu7"));
assert("T4-DEF-4 every moved capex row carries dated nominal provenance",
  Object.keys(capexNow).every((key) => /20\d\d/.test(E.capexProvenanceFor(key))));

/* ---------- 5. PUE class bands are FALLBACKS, never facility values ---------- */
assert("T4-DEF-5 the global PUE default is held at 1.25 (neocloud middle, historical parity)",
  E.DEFAULTS.pue === 1.25);
assert("T4-DEF-5 all four class bands resolve through scenario/default logic",
  D.DC_SCHEMA.FACILITY_CLASSES.every((cls) => {
    const band = E.pueBandForClass(cls);
    return band && band.lo <= band.mid && band.mid <= band.hi;
  }) && close(E.pueBandForClass("purpose-built-ai").mid, 1.20)
    && close(E.pueBandForClass("hyperscaler-owned").mid, 1.12)
    && close(E.pueBandForClass("legacy").mid, 1.52)
    && close(E.pueBandForClass("neocloud").mid, E.DEFAULTS.pue),
  JSON.stringify(D.DC_SCHEMA.FACILITY_CLASSES.map((cls) => [cls, E.pueBandForClass(cls)])));
assert("T4-DEF-5 no facility row carries a PUE value",
  Object.values(D.DATACENTERS).every((row) => row.pue === null));

/* ---------- 6. owned-TCO inherits BY REGION ID, carrying no literal ---------- */
{
  const row = E.EXEC_SUMMARY_ROWS.find((entry) => entry.id === "owned-tco");
  const text = JSON.stringify(row);
  assert("T4-DEF-6 the owned-TCO row references the region, and pins no electricity literal",
    !!row && !/"kwh":\s*[\d.]/.test(text) && /us-industrial/.test(text),
    text);
  assert("T4-DEF-6 the owned-TCO reading resolves to the registered region middle",
    close(E.execSummaryRowState("owned-tco").kwh, D.REGIONS["us-industrial"].usdPerKwh.mid),
    String(E.execSummaryRowState("owned-tco").kwh));
}

/* ---------- 7. opexPct is a RELABEL only — the band is held ---------- */
assert("T4-DEF-7 opexPct keeps its numeric semantics and its band is held",
  E.DEFAULTS.opexPct === 8);
assert("T4-DEF-7 the opexPct tooltip states the per-year equivalent AND its life dependence",
  /2\.0\s?%/.test(E.TIPS.opexPct.b) && /1\.6\s?%/.test(E.TIPS.opexPct.b)
    && /1\.33\s?%/.test(E.TIPS.opexPct.b) && /\b4\b/.test(E.TIPS.opexPct.b)
    && /\b6\b/.test(E.TIPS.opexPct.b) && /per year|\/yr|annual/i.test(E.TIPS.opexPct.b),
  E.TIPS.opexPct.b);

console.log(failures ? `\n${failures} DEFAULTS/CAPEX-SCOPE T4 FAILURE(S)` : "\nALL DEFAULTS/CAPEX-SCOPE T4 TESTS PASS");
process.exit(failures ? 1 : 0);
