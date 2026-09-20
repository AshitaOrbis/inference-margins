/* margin-band-searched-label — a band may not claim more than it searched.
 *
 * Polaris ruling 2026-09-19 on Astra pack A P0-2 and P0-3: change the LABEL, not the extrema
 * search. `marginBand` used to set `exact: true` whenever a five-sample-per-axis monotonicity
 * probe saw no reversal, and then label the result "attainable range over the declared dial
 * ranges — every point inside is reachable by some setting, and no setting reaches outside it".
 * That is a claim of exhaustiveness resting on sampling, and it is false across a capacity,
 * width or membership transition: grok/median over ioRatio 1–100 reported −42.396…–36.972… while
 * the legal interior setting ioRatio = 86 computes −42.585…, below its own stated minimum.
 * `sectionBand` made the matching mistake in the other direction, reporting an "exact" band
 * around a midpoint that lay outside it.
 *
 * Red on the pre-ruling engine: the retired phrase is present, the escaping section band is
 * `exact: true`, and the label is withheld from exactly the case that claimed the most.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const F = require("../site/custom-fleets.js");

let fails = 0, passes = 0;
const check = (name, cond, detail = "") => {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
};

const RETIRED = "no setting reaches outside it";
const model = id => E.MODELS.find(m => m.id === id);
const persp = id => E.PERSPECTIVES.find(p => p.id === id);

/* ---- 1. the retired phrase is gone from every surface that could render it ---- */
for (const file of ["site/engine.js", "site/app.js", "site/index.html", "site/glossary.html"]) {
  const body = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  check(`${file} no longer carries the retired exhaustiveness claim`,
    !body.includes(RETIRED), `"${RETIRED}" is still present`);
}

/* ---- 2. every band the shipped catalogue can produce says it SEARCHED ---- */
let bands = 0, claimedAttainable = 0, missingBasis = 0;
for (const m of E.MODELS) {
  for (const p of E.PERSPECTIVES) {
    let band;
    try {
      band = E.marginBand(m, p, { mode: "native" }, [{ key: "util", lo: 40, hi: 90 }]);
    } catch { continue; }
    if (!band || band.refused) continue;
    bands++;
    if (typeof band.label === "string") {
      if (band.label.includes(RETIRED) || /attainable range/.test(band.label)) claimedAttainable++;
      if (!/searched|found by sweeping|OUTSIDE|lies outside this range|corners describe/.test(band.label)) missingBasis++;
    }
  }
}
check("the sweep produced bands to inspect (this check is not vacuous)", bands >= 100, String(bands));
/* A point outside the band is only an inconsistency when the point's own settings are inside the
   declared box. Bounding utilization 40–90 on a replay pinned at 100 is a legitimate request for
   a range that excludes the current reading — 66 of 288 shipped pairs are that case — so the
   escape is keyed on containment of the SETTINGS, not of the value. */
{
  const dive = E.marginBand(model("dsv4"), persp("dive"), { mode: "native" },
    [{ key: "util", lo: 40, hi: 90 }]);
  check("a range that excludes the preset's own setting is not called an inconsistency",
    dive && dive.pointInsideDeclaredBox === false && dive.pointOutsideBand === false,
    JSON.stringify({ inBox: dive && dive.pointInsideDeclaredBox, out: dive && dive.pointOutsideBand }));
}
check("no band claims an attainable range", claimedAttainable === 0, `${claimedAttainable} of ${bands}`);
check("every band states the basis it was found on", missingBasis === 0, `${missingBasis} of ${bands}`);

/* ---- 3. the falsifier: a sampled setting outside the band drops the exactness claim ---- */
{
  /* Synthetic, because the engine's own discontinuities are not guaranteed to sit on a probe
     point — which is exactly why the LABEL had to change rather than the search. This proves the
     guard fires when the evidence IS in hand. */
  const m = model("opus"), p = persp("median");
  const band = E.marginBand(m, p, { mode: "native" }, [{ key: "util", lo: 40, hi: 90 }], {
    cornerEval: (state) => {
      const u = Number(state.util);
      // Monotone at the probe points, with one probe value pushed far below both endpoints.
      return Math.abs(u - 52.5) < 1e-9 ? -5 : u / 100;
    },
  });
  check("a probe sample outside the searched range drops the exactness claim",
    band && band.exact === false && band.searchEscapes > 0,
    JSON.stringify({ exact: band && band.exact, escapes: band && band.searchEscapes,
      lo: band && band.lo, hi: band && band.hi }));
  check("...and the label says which way it failed",
    band && /fall OUTSIDE this range/.test(band.label || ""), band && band.label);
}

/* ---- 4. a clean band still reports exact, so the guard is not blanket-denying ---- */
{
  const band = E.marginBand(model("opus"), persp("median"), { mode: "native" },
    [{ key: "util", lo: 45, hi: 55 }]);
  check("an ordinary band still reports exact when nothing escaped",
    band && band.exact === true && band.searchEscapes === 0 && band.pointOutsideBand === false,
    JSON.stringify({ exact: band && band.exact, escapes: band && band.searchEscapes }));
}

/* ---- 5. sectionBand: a midpoint outside its own band is not exact ---- */
{
  const fleet = F.makeBlankFleet();
  fleet.sections[0].sharePct = { lo: 10, mid: 20, hi: 20 };
  fleet.sections.push(F.makeBlankSection("s2", { lo: 10, mid: 10, hi: 90 }));
  fleet.sections[1].legs = [F.makeLegFromDonor("gb200", 100)];
  check("the escaping fleet really does validate (so the case is reachable, not malformed)",
    F.validateCustomFleet(fleet, { requireId: false }).ok === true);
  const band = E.sectionBand(E.applyPresetSettings(model("dsv4"), persp("dive")), { customFleet: fleet });
  check("a section band whose midpoint lies outside it is NOT exact",
    band && band.exact === false && band.midOutsideBand === true,
    JSON.stringify({ exact: band && band.exact, mid: band && band.mid, lo: band && band.lo, hi: band && band.hi }));
  check("...and its basis says the two do not describe the same feasible set",
    band && /OUTSIDE the searched range/.test(band.basis || ""), band && band.basis);

  const clean = F.makeBlankFleet();
  const cleanBand = E.sectionBand(E.applyPresetSettings(model("dsv4"), persp("dive")), { customFleet: clean });
  check("an ordinary section band is still exact (positive control)",
    !cleanBand || cleanBand.refused || cleanBand.exact === true,
    JSON.stringify({ exact: cleanBand && cleanBand.exact, refused: cleanBand && cleanBand.refused }));
}

/* ---- 6. the glossary carries the method the label points at ---- */
{
  const glossary = readFileSync(new URL("../site/glossary.html", import.meta.url), "utf8");
  check("the glossary defines the searched range",
    /id="searched-range"/.test(glossary) && /That is a <em>search<\/em>, not a proof/.test(glossary));
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log(`\n${fails} MARGIN-BAND SEARCHED-LABEL FAILURE(S)`); process.exit(1); }
console.log("\nALL MARGIN-BAND SEARCHED-LABEL CHECKS PASS");
