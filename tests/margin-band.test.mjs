// MARGIN BANDS FROM RANGE-VALUED DIALS (row 499, owner note 507081) — the engine half.
//
// What is asserted here is the property that makes the feature honest: the band is the ATTAINABLE
// range, not an enclosure. Concretely — no setting of the dials inside their declared ranges
// produces a margin outside the band (the falsifier), and every band edge is itself reachable.
//
// The design reasoning is in the engine beside `marginBand`; in short: naive interval arithmetic
// inflates on this engine (dependency problem), Monte Carlo would require inventing a distribution
// per dial, and the monotonicity-based extension is exact at the corners when it applies — so
// monotonicity is PROBED, and a dial that fails is swept and reported rather than silently folded.
// Run: node tests/margin-band.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const opus = E.MODELS.find(m => m.id === "opus");
const persp = E.PERSPECTIVES.find(p => p.id === "gptpro-ctx");
const SEL = { mode: "explicit", profileId: "reference" };

// The dials the round-2 external review actually declared as ranges, in its own numbers.
const DIALS = [
  { key: "util", lo: 50, hi: 80 },
  { key: "cacheHit", lo: 40, hi: 80 },
  { leg: "tpu7", lo: 0.30, hi: 0.70 },
  { leg: "h100", lo: 0.90, hi: 1.00 },
];

const marginAt = (assign) => {
  const s = E.applyPresetSettings(opus, persp, SEL);
  assign(s);
  return E.workload(s, undefined, E.scenarioContext(s)).margin * 100;
};

// ---------------------------------------------------------------- the band exists and is ordered
const band = E.marginBand(opus, persp, SEL, DIALS);
assert("a band is returned with lo <= point <= hi", band.lo <= band.point + 1e-9 && band.point <= band.hi + 1e-9,
  JSON.stringify({ lo: band.lo, point: band.point, hi: band.hi }));
assert("every declared dial was monotone here, so the band is EXACT (attainable, not an enclosure)",
  band.exact === true && band.nonMonotone.length === 0, JSON.stringify(band.nonMonotone));
assert("corner count is 2^k over the monotone dials, not a sample count", band.corners === (1 << DIALS.length),
  String(band.corners));
/* AMENDED 2026-09-19 (Polaris ruling on Astra pack A P0-2). This used to require the word
   "attainable", which is a claim of exhaustiveness the search cannot make: corner evaluation
   plus five samples per axis does not prove that nothing inside the box computes outside the
   band, and grok/median over ioRatio 1–100 is a counterexample. The forbidden vocabulary is
   unchanged — no confidence, no probability — and the label must now state the METHOD. */
assert("the label states the search, never a confidence interval",
  /searched range over the declared dial ranges/.test(band.label)
    && /evaluating every corner/.test(band.label)
    && !/confidence|probabilit/i.test(band.label), band.label);
assert("...and it warns where the search can miss, rather than promising it cannot",
  /can fall outside it where the fleet changes shape/.test(band.label), band.label);

// ------------------------------------------------------- THE FALSIFIER: nothing escapes the band
{
  let outside = 0, worst = 0;
  let seed = 20260807;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const N = 300;
  for (let i = 0; i < N; i++) {
    const m = marginAt(s => DIALS.forEach(d => E.applyDial(s, d, d.lo + (d.hi - d.lo) * rnd())));
    if (m < band.lo - 1e-9 || m > band.hi + 1e-9) { outside++; worst = Math.max(worst, Math.max(band.lo - m, m - band.hi)); }
  }
  assert(`falsifier: ${N} interior settings, none produces a margin outside the band`, outside === 0,
    `${outside} escaped, worst ${worst.toFixed(6)}pp`);
}

// ------------------------------------------------- and both edges are REACHED, not merely bounded
{
  const reach = (target) => {
    for (let mask = 0; mask < (1 << DIALS.length); mask++) {
      const m = marginAt(s => DIALS.forEach((d, i) => E.applyDial(s, d, ((mask >> i) & 1) ? d.hi : d.lo)));
      if (Math.abs(m - target) < 1e-9) return true;
    }
    return false;
  };
  assert("the low edge is attained by an actual dial setting", reach(band.lo), String(band.lo));
  assert("the high edge is attained by an actual dial setting", reach(band.hi), String(band.hi));
}

// ------------------------------------------------------------- a one-point dial widens nothing
{
  const none = E.marginBand(opus, persp, SEL, [{ key: "util", lo: 65, hi: 65 }]);
  assert("a dial whose range is a single point yields a zero-width band at the point",
    none.lo === none.hi && Math.abs(none.point - none.lo) < 1e-9, JSON.stringify(none));
}

// ------------------------------------------ a non-monotone dial is DETECTED, never mis-bounded
{
  /* Synthetic by construction: `active` is not monotone in margin across a wide range on this
     engine (capacity/feasibility branches turn over), which is exactly the case the probe exists
     for. What is asserted is the CONTRACT, not that any particular dial misbehaves: if the probe
     finds a turn, the band must stop claiming exactness and must name the dial it swept. */
  const wide = E.marginBand(opus, persp, SEL, [{ key: "active", lo: 20, hi: 900 }]);
  if (wide.nonMonotone.length) {
    assert("a non-monotone dial is named, and the band drops its exactness claim",
      wide.exact === false && /not monotone here/.test(wide.label), JSON.stringify(wide.nonMonotone));
  } else {
    assert("the probe ran on a wide dial and found it monotone (contract still holds: exact ⇒ named-empty)",
      wide.exact === true && wide.nonMonotone.length === 0, JSON.stringify(wide));
  }
}

// ------------------------------------------------------- refuses rather than hanging on too many
{
  const many = Array.from({ length: E.BAND_MAX_CORNER_DIALS + 1 }, (_, i) => ({ key: "util", lo: 50 + i * 0, hi: 80 }));
  const r = E.marginBand(opus, persp, SEL, many);
  assert("more range-valued dials than the corner budget REFUSES with a stated reason",
    !!r.refused && !isFinite(r.lo), JSON.stringify({ refused: r.refused }).slice(0, 120));
}

// --------------------------------------------------- no distribution is invented anywhere in it
{
  const keys = Object.keys(band).sort().join(",");
  assert("the band object carries no mean, no percentile and no probability field",
    !/mean|expected|percentile|p10|p50|p90|sigma|stdev/i.test(keys), keys);
}

// ------------------------------------------------ step 2: ranges carried in STATE, and the codec
{
  const ranges = { "util": { lo: 50, mid: 65, hi: 80 }, "rentMultLeg.tpu7": { lo: 0.30, mid: 0.50, hi: 0.70 } };
  const viaState = E.marginBand(opus, persp, SEL, E.dialsFromRanges(ranges));
  assert("declared ranges in state produce the same band as hand-built dials",
    viaState.exact && viaState.hi > viaState.lo, JSON.stringify({ lo: viaState.lo, hi: viaState.hi }));

  assert("a 1-point range contributes nothing (that is what '1 point' means)",
    E.dialsFromRanges({ "util": { lo: 65, mid: 65, hi: 65 } }).length === 0);
  assert("a 2-point range needs no mid", E.dialsFromRanges({ "util": { lo: 50, hi: 80 } }).length === 1);

  assert("dialBounds knows scalar dials, leg dials and family dials — and refuses unknown ids",
    Array.isArray(E.dialBounds("util")) && Array.isArray(E.dialBounds("rentMultLeg.tpu7"))
    && Array.isArray(E.dialBounds("rentMultFam.tpu")) && E.dialBounds("rentMultLeg.notachip") === null
    && E.dialBounds("nope") === null);

  const sane = (dr) => E.sanitizeScenarioDiff({ dialRanges: dr }, { locked: false }, E.DEFAULTS);
  assert("a well-formed range survives the sanitizer",
    sane({ "util": { lo: 50, mid: 65, hi: 80 } }).rejected.length === 0);
  assert("an end outside the dial's own domain rejects the key (never clamped into plausibility)",
    sane({ "util": { lo: 50, hi: 200 } }).rejected.length === 1);
  assert("an inverted range rejects", sane({ "util": { lo: 80, hi: 50 } }).rejected.length === 1);
  assert("a median outside its own ends rejects", sane({ "util": { lo: 50, mid: 95, hi: 80 } }).rejected.length === 1);
  assert("an unknown dial id rejects", sane({ "notadial": { lo: 1, hi: 2 } }).rejected.length === 1);
  assert("a stray field inside a range rejects (the shape is closed)",
    sane({ "util": { lo: 50, hi: 80, p90: 78 } }).rejected.length === 1);

  /* The inertness property that makes this safe to ship before any UI exists. */
  assert("DEFAULTS.dialRanges is null, so no existing scenario carries a range",
    E.DEFAULTS.dialRanges === null);
  assert("dialRanges is perspective-space (declaring a range is a claim, and exits a config identity)",
    E.PERSPECTIVE_SPACE_KEYS.includes("dialRanges"));
}

// ---------------- REGRESSION (review finding 4/5): refusal beats crashing, and beats over-claiming
{
  /* A range every per-dial bound accepts can still describe an impossible corner, because the
     engine also enforces cross-field constraints (activeB <= totalB). That used to THROW out of
     marginBand and take the caller with it. */
  const impossible = E.dialsFromRanges({ "active": { lo: 100, hi: 3000 } });
  let threw = false, band2 = null;
  try { band2 = E.marginBand(opus, persp, SEL, impossible); } catch { threw = true; }
  assert("a box containing engine-refused corners does not throw", !threw);
  assert("...and it does NOT claim exactness over a box it could not fully evaluate",
    band2 && band2.exact === false && band2.unevaluable > 0,
    JSON.stringify({ exact: band2 && band2.exact, unevaluable: band2 && band2.unevaluable }));
  assert("...and its label says which part of the box it actually covered",
    /corners describe scenarios this engine refuses/.test(band2.label), band2.label);

  /* And the budget must bound the WORK, not the dial count: a swept (non-monotone) dial multiplies
     by the sweep resolution, so a small number of dials can still be millions of evaluations. */
  const bandFn = E.marginBand;
  assert("the corner budget is expressed as a work product, not a dial count",
    /workEstimate|steps each/.test(bandFn.toString()), "guard still counts dials only");
}

// ---------------- row 499 follow-on: THE FAMILY DIAL IS INERT, AND THE BAND MUST NOT BE
{
  /* The spike's first finding, now a gate. `gptpro-ctx` prices PER LEG, and a per-leg value always
     beats the family control — correctly, for a control. For a BAND that resolution order is a trap:
     the reader bounds the axis the two adjudicators disagree about most, and the page reports zero
     uncertainty on it. The negative control is the whole assertion: the plain family-key assignment
     IS inert here, and the shipped path is not. If the first of these ever stops being inert this
     test is no longer proving anything, so it is asserted rather than assumed. */
  const declared = { "rentMultFam.tpu": { lo: 0.30, mid: 0.50, hi: 0.70 } };
  const naive = E.marginBand(opus, persp, SEL, [{ family: "tpu", lo: 0.30, hi: 0.70 }]);
  const shipped = E.marginBand(opus, persp, SEL, E.dialsFromRanges(declared));
  assert("NEGATIVE CONTROL: a family-KEY range is inert on a preset that prices per leg",
    Math.abs(naive.hi - naive.lo) < 1e-6, `width ${(naive.hi - naive.lo).toFixed(6)}`);
  assert("...and the shipped derivation is not — a declared family range moves the margin",
    (shipped.hi - shipped.lo) > 1.0, `width ${(shipped.hi - shipped.lo).toFixed(4)}`);
  assert("...and the band NAMES the legs it had to reach past, rather than doing it silently",
    shipped.familyGroups.length === 1 && shipped.familyGroups[0].legs.includes("tpu7"),
    JSON.stringify(shipped.familyGroups));
  assert("...and it still contains its own point",
    shipped.lo <= shipped.point && shipped.point <= shipped.hi);

  /* Group scope is opt-in at the DIAL, not global: nothing else in the engine changes meaning. */
  const s1 = structuredClone(E.DEFAULTS); s1.rentMultLeg = { tpu7: 0.50 };
  E.applyDial(s1, { family: "tpu" }, 0.30);
  assert("applyDial default scope still writes the family key ONLY (the control's own semantics)",
    s1.rentMultLeg.tpu7 === 0.50 && s1.rentMultFam.tpu === 0.30);
  const s2 = structuredClone(E.DEFAULTS); s2.rentMultLeg = { tpu7: 0.50 };
  E.applyDial(s2, { family: "tpu", scope: "group" }, 0.30);
  assert("...and group scope moves the family AND its legs together",
    s2.rentMultLeg.tpu7 === 0.30 && s2.rentMultFam.tpu === 0.30);
  assert("legsInFamily is computed from the registry, not listed",
    E.legsInFamily("tpu").includes("tpu7") && E.legsInFamily("trainium").includes("trn2")
    && !E.legsInFamily("tpu").includes("h100"));
}

// ---------------- row 499 follow-on: PER-DIAL BANDS ARE FIRST-CLASS, COMPOUNDED IS NOT THE DEFAULT
{
  const dials = E.dialsFromRanges(persp.set.dialRanges);
  const per = E.marginBandsPerDial(opus, persp, SEL, dials);
  const whole = E.marginBand(opus, persp, SEL, dials);
  assert("one per-dial band per bounded dial", per.length === dials.length, `${per.length} vs ${dials.length}`);
  assert("every per-dial band sits inside the compounded band",
    per.every(b => b.lo >= whole.lo - 1e-6 && b.hi <= whole.hi + 1e-6),
    per.map(b => `${b.id} ${b.lo.toFixed(2)}..${b.hi.toFixed(2)}`).join(" | "));
  assert("the per-dial bands are NARROWER than the compounded one — the compounding is real and is why it is opt-in",
    Math.max(...per.map(b => b.hi - b.lo)) < (whole.hi - whole.lo) - 1.0,
    `widest single ${Math.max(...per.map(b => b.hi - b.lo)).toFixed(2)} vs compounded ${(whole.hi - whole.lo).toFixed(2)}`);
  assert("a per-dial band comes from the SAME derivation, so it cannot disagree about method",
    /marginBand\(/.test(E.marginBandsPerDial.toString()));
  assert("still no mean, percentile or probability anywhere in a per-dial result",
    per.every(b => !("mean" in b) && !("p50" in b) && !("probability" in b)));
}

// ---------------- row 499 follow-on: THE PRESETS CARRY THEIR AUTHORS' OWN DECLARED RANGES
{
  const want = { "util": [50, 65, 80], "cacheHit": [40, 60, 80], "rentMultFam.nvidia": [0.90, 0.95, 1.00],
                 "rentMultFam.tpu": [0.30, 0.50, 0.70], "rentMultFam.trainium": [0.70, 0.85, 1.00] };
  /* THE BLEND DECLARATION JOINED THEM on 2026-08-09 (owner ruling q-sliders-fleet-util-point), and
     this assertion is deliberately split rather than loosened. Its job is to stop anyone quietly
     adding a range to an adjudicator's preset, so "five became eight" has to be stated as what it
     is: the same author's blend constraints — carried verbatim in this preset's provenance as
     "50-65% NVIDIA, 35-50% TPU, 0-15% Trainium" — moved out of prose now that the engine has a
     compositional range that preserves a 100 % simplex. The BOX dials are still exactly the five,
     which is what the compounded band below is about; the three new ones are a different geometry
     and leave through `mixRangesFromRanges`. No authored number changed. */
  const got = persp.set.dialRanges;
  const wantMix = { "blend.fam.nvidia": [50, 65], "blend.fam.tpu": [35, 50], "blend.fam.trainium": [0, 15] };
  assert("gptpro-ctx declares exactly the five BOX ranges its round-2 loadable vector states",
    Object.keys(E.dialsFromRanges(got).reduce((a, d) => (a[E.dialId(d)] = 1, a), {})).sort().join(",")
      === Object.keys(want).sort().join(","),
    E.dialsFromRanges(got).map(E.dialId).join(","));
  assert("...plus the three PROVIDER-SHARE ranges the same author declared, and nothing else",
    Object.keys(E.mixRangesFromRanges(got)).sort().join(",") === Object.keys(wantMix).sort().join(","),
    Object.keys(got).join(","));
  assert("...the provider shares in its own numbers, with NO invented midpoint",
    Object.entries(wantMix).every(([id, [lo, hi]]) =>
      Math.abs(got[id].lo - lo) < 1e-9 && Math.abs(got[id].hi - hi) < 1e-9 && got[id].mid === undefined),
    JSON.stringify(E.mixRangesFromRanges(got)));
  assert("...in its own numbers, with the stated MEDIAN as the middle point",
    Object.entries(want).every(([id, [lo, mid, hi]]) =>
      Math.abs(got[id].lo - lo) < 1e-9 && Math.abs(got[id].mid - mid) < 1e-9 && Math.abs(got[id].hi - hi) < 1e-9),
    JSON.stringify(got));

  /* THE REPRODUCE-GAP FIX, and the shape of it matters as much as the result: the author's stated
     84.0 % at list is reachable inside its OWN declared ranges, and the preset's point is exactly
     where it was. A range was authored; no midpoint was tuned toward a target. */
  const s = E.applyPresetSettings(opus, persp, SEL);
  const point = E.workload(s, undefined, E.scenarioContext(s)).margin * 100;
  const band = E.marginBand(opus, persp, SEL, E.dialsFromRanges(got));
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the point moves with the folded defaults. What the assertion
     PROTECTS is unchanged — nothing was tuned toward the stated 84, and the gap between the
     computed point and the author's stated central is still disclosed rather than closed.
     im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     the point moves again with the adopted planning rents, and AWAY from the author's stated 84 —
     80.48 to 78.89. That direction is worth noticing: a change that raised the page's own headline
     widened this estimator's honest gap rather than closing it, which is what a procurement change
     applied without regard to any target looks like. Nothing was tuned. */
  /* im-vet-six-repairs (2026-09-20): the point moves again, and again AWAY from the author's
     stated 84 — 78.89 to 78.78 — with the Trainium withdrawal and the TPU numerator repair. Two
     coefficient repairs made without regard to any target widened this estimator's honest gap for
     the second release running. Nothing was tuned. */
  assert("the preset POINT moves only with the defaults, to 78.78 — nothing was tuned toward 84",
    Math.abs(point - 78.7832) < 0.05, point.toFixed(4));
  assert("its author's stated 84.0 % at list is INSIDE its own declared band",
    band.hi >= 84.0 && band.lo <= 84.0, `${band.lo.toFixed(2)}..${band.hi.toFixed(2)}`);
  assert("...and the band is exact, not an enclosure",
    band.exact === true && band.nonMonotone.length === 0);

  const fable = E.PERSPECTIVES.find(p => p.id === "fable-ctx");
  assert("fable-ctx carries ONLY the band axis its author stated in numbers (occupancy 50-70)",
    Object.keys(fable.set.dialRanges).join(",") === "util"
    && fable.set.dialRanges.util.lo === 50 && fable.set.dialRanges.util.mid === 60 && fable.set.dialRanges.util.hi === 70,
    JSON.stringify(fable.set.dialRanges));
  assert("...and NOT a rate range invented out of its qualitative phrase, nor a lead range it forbade",
    !("rentMultFam.tpu" in fable.set.dialRanges) && !("trendMonths" in fable.set.dialRanges));
  assert("the stress case declares no range at all — a reproducibility floor is a point, not a band",
    E.PERSPECTIVES.find(p => p.id === "stress-public-rate").set.dialRanges === undefined);
}

// ---------------- row 499 follow-on: A BAND IS A BRACKET, SO IT DECLARES ITS LEAD BASIS
{
  /* The binding this pins: the two estimates were once quoted 0.7 pp apart across a MIXED lead
     treatment, and on a like-for-like basis they are 5-7 points apart. Nothing on this page may
     draw a bracket without saying which basis it is on, and the +3 prior is never applied on top of
     a band that already contains one. */
  const off = E.bandLeadBasisClause({ trendMonths: 0 }, []);
  const on = E.bandLeadBasisClause({ trendMonths: 3 }, []);
  const moved = E.bandLeadBasisClause({ trendMonths: 0 }, [{ key: "trendMonths", lo: 0, hi: 6 }]);
  /* im-vet-six-repairs (2026-09-20), vetting finding E4: "like-for-like" was asserting that BOTH
     estimate presets RUN at lead 0, which stopped being true when both round-3 revisions moved
     their dials off zero (0/2/4 midpoint 2, and 0/1/2 midpoint 1). What survives, and what the
     clause now says, is that zero is the basis their authors DECLARE for a cross-arm comparison —
     and the clause is required to say plainly that neither runs at it, so the old reading cannot
     come back by omission. */
  assert("the lead basis is DECLARED on a band computed at lead 0, named as the estimates' common comparison basis, and says neither RUNS at it",
    /Lead basis: no algorithmic-lead prior \(0 months\)/.test(off)
    && /common basis both estimate presets declare/.test(off)
    && /neither RUNS at it/.test(off) && /2 and 1 months/.test(off), off);
  assert("a nonzero lead basis names its months AND refuses a second application of the prior",
    /3 months/.test(on) && /not applied again on top/.test(on), on);
  /* OWNER RULING 2026-08-08: the "cannot be compared" framing is dropped — the headline compares
     the calculators' end results, and two calculators run to their ends ARE comparable. What the
     clause must still carry is the double-count guard, which is a different claim and was tangled
     with it in the same sentence. */
  assert("a band that moves the lead says the prior is part of its width",
    /the algorithmic-lead prior itself is part of this range/.test(moved), moved);
  assert("...and STILL refuses a second application of the prior (the double-count guard survives)",
    /not applied again on top/.test(moved), moved);
  assert("...and no longer tells the reader the readings cannot be compared",
    !/not comparable/.test(moved) && !/cannot be compared/.test(moved), moved);
  assert("...and it does not claim like-for-like while the lead itself is moving",
    !/like-for-like/.test(moved));
  assert("the lead basis declaration is engine-side and its prefix is a named constant, so a test and the MCP can point at the same bytes",
    typeof E.bandLeadBasisClause === "function" && E.BAND_LEAD_BASIS === "Lead basis: " && off.startsWith(E.BAND_LEAD_BASIS));
}

// ---------------- OWNER RULING 2026-08-07 18:55Z: A MODE CHANGE MUST NOT MOVE A HANDLE
{
  /* "You just get two buttons stacked on the slider instead of one button going anywhere else."
     1 -> 2 stacks the second on the first; 2 -> 3 puts the third at the MIDPOINT of the two, which is
     the symmetric default a reader means before they say otherwise. Anything already placed is
     returned untouched — that is the ruling, and it is the first thing asserted. */
  const D = E.bandHandleDefaults;

  const fresh = D({}, 65, 1, 100, 1);
  assert("1 -> 2 points: both handles appear STACKED at the reader's current value",
    fresh.lo === 65 && fresh.hi === 65, JSON.stringify(fresh));
  assert("...and the median of a stacked pair is that same value, so 1 -> 3 does not scatter either",
    fresh.mid === 65, JSON.stringify(fresh));

  const two = D({ lo: 50, hi: 70 }, 65, 1, 100, 1);
  assert("2 -> 3 points: the third handle appears at the MIDPOINT of the two bounds",
    two.mid === 60, JSON.stringify(two));
  assert("...and it does NOT jump to the point value, which is where it used to land",
    two.mid !== 65);
  assert("...and neither bound moves", two.lo === 50 && two.hi === 70);

  /* The midpoint has to sit on a value the control can actually hold, or it visibly jumps the first
     time the reader touches it — which is the thing this ruling exists to prevent. */
  const odd = D({ lo: 0.30, hi: 0.65 }, 0.5, 0.2, 1.5, 0.05);
  assert("the midpoint is snapped to the control's own step, so the handle does not jump on first touch",
    odd.mid === 0.45, JSON.stringify(odd));

  /* A range someone DECLARED — an adjudicator's, or the reader's own from a moment ago — is never
     recomputed. This is the part of the ruling that a midpoint rule could quietly break. */
  const authored = D({ lo: 50, mid: 65, hi: 80 }, 65, 1, 100, 1);
  assert("a stated median survives untouched even where it is not the midpoint",
    authored.mid === 65 && authored.lo === 50 && authored.hi === 80, JSON.stringify(authored));
  const skewed = D({ lo: 0.30, mid: 0.35, hi: 0.70 }, 0.5, 0.2, 1.5, 0.05);
  assert("...including a deliberately SKEWED one, which is the whole reason the third point exists",
    skewed.mid === 0.35, JSON.stringify(skewed));

  /* Exhaustive: over every declared range on both estimate presets, and over a grid of reader-placed
     pairs, no default ever lands outside its own bounds and no placed value is ever altered. */
  let checked = 0, moved = 0, escaped = 0;
  for (const persp of [E.PERSPECTIVES.find(x => x.id === "gptpro-ctx"), E.PERSPECTIVES.find(x => x.id === "fable-ctx")])
    for (const [id, r] of Object.entries(persp.set.dialRanges)) {
      const b = E.dialBounds(id); if (!b) continue;
      const step = id.startsWith("rentMultFam.") ? 0.05 : 1;
      for (let lo = r.lo; lo <= r.hi; lo += (r.hi - r.lo) / 4)
        for (let hi = lo; hi <= r.hi; hi += (r.hi - r.lo) / 4) {
          const g = D({ lo, hi }, r.mid, b[0], b[1], step);
          checked++;
          if (g.lo !== lo || g.hi !== hi) moved++;
          if (g.mid < lo - 1e-9 || g.mid > hi + 1e-9) escaped++;
        }
    }
  assert(`no placed bound is ever moved by the default rule (${checked} combinations)`, moved === 0, `${moved} moved`);
  assert("no derived median ever lands outside the bounds it sits between", escaped === 0, `${escaped} escaped`);
}

// ---------------- OWNER RULING 2026-08-07: THE BAND COPY STATES, IT DOES NOT DISCLAIM
{
  /* The earlier wording said "not a probability interval" and "no distribution is assumed". Both are
     true and both are the wrong instrument: a denial hands the reader the term. Every string this
     feature can render is checked, not just the two constants — the refusal strings and the
     per-dial labels are rendered copy too. */
  const m2 = E.MODELS.find(x => x.id === "opus"), p2 = E.PERSPECTIVES.find(x => x.id === "gptpro-ctx");
  const dials2 = E.dialsFromRanges(p2.set.dialRanges);
  const rendered = [
    E.marginBand(m2, p2, SEL, dials2).label,
    ...E.marginBandsPerDial(m2, p2, SEL, dials2).map(b => b.label),
    E.bandLeadBasisClause({ trendMonths: 0 }, []),
    E.bandLeadBasisClause({ trendMonths: 3 }, []),
    E.bandLeadBasisClause({ trendMonths: 0 }, [{ key: "trendMonths", lo: 0, hi: 6 }]),
    E.marginBand(m2, p2, SEL, E.dialsFromRanges({ "active": { lo: 100, hi: 3000 } })).refused,
  ].filter(Boolean);
  const BANNED = /probabilit|distribution|confidence|percentile|\bmean\b|\baverage\b|\blikel/i;
  const offenders = rendered.filter(s => BANNED.test(s));
  assert(`no engine-side band string uses probability or distribution vocabulary, even to deny it (${rendered.length} strings)`,
    offenders.length === 0, offenders.map(s => s.slice(0, 90)).join(" | "));
  /* AMENDED 2026-09-19 (Polaris ruling on Astra pack A P0-2). The owner rule this pins — SAY
     WHAT THE RANGE IS, never what it is not — is unchanged; "reachable by some setting" is not,
     because it asserts exhaustiveness the search cannot prove. The positive statement is now the
     METHOD: what was evaluated, and where it can miss. Both are statements about what the page
     did, not denials of what it did not do, so the rule is satisfied by a true sentence. */
  assert("...and the claim itself is still stated positively, as the search that was performed",
    rendered.some(s => /searched range over the declared dial ranges/.test(s)
      && /evaluating every corner/.test(s)),
    rendered.slice(0, 3).map(s => s.slice(0, 80)).join(" | "));
}

// ---------------- THE QUOTED ADJUDICATOR PAIR (owner ruling 19:02Z, adjudicated 2026-08-08)
{
  /* "Displayable the same way they have been framing it": the author's stated median over the
     author's stated range. The thing this must never become is a second output of this page dressed
     as a quotation, so every assertion below is about keeping the quoted object and the derived one
     apart. */
  const gp = E.PERSPECTIVES.find(x => x.id === "gptpro-ctx");
  const fb = E.PERSPECTIVES.find(x => x.id === "fable-ctx");
  const stress = E.PERSPECTIVES.find(x => x.id === "stress-public-rate");

  assert("gptpro-ctx quotes its author's stated pair, in its author's numbers",
    gp.statedReading.central === 84.0 && gp.statedReading.lo === 68 && gp.statedReading.hi === 92,
    JSON.stringify(gp.statedReading));
  assert("fable-ctx quotes ITS author's pair, on the basis that preset actually bills on",
    fb.statedReading.central === 77 && fb.statedReading.lo === 70 && fb.statedReading.hi === 84
    && /15 % Batch/.test(fb.statedReading.basis), JSON.stringify(fb.statedReading));
  assert("the reproducibility floor states NOTHING and therefore displays nothing",
    stress.statedReading === undefined && E.statedReadingClause(stress, 59.18) === null);

  /* THE STATED PAIR AND THE DERIVED BAND ARE DIFFERENT OBJECTS and must not be confused: the stated
     central is not the computed point, and the stated band is not the computed band. */
  const s = E.applyPresetSettings(opus, gp, SEL);
  const computed = E.workload(s, undefined, E.scenarioContext(s)).margin * 100;
  const derived = E.marginBand(opus, gp, SEL, E.dialsFromRanges(gp.set.dialRanges));
  /* THE GAP IS NOT A CONSTANT AND THIS NOTE STOPS PRETENDING IT IS. It has been three values:
     84 vs 79.65 (4.35 pp) at the im-arc T4 fold of 2026-08-24, 84 vs 80.48 (3.52 pp) after it,
     and 84 vs 78.8931 (5.11 pp) today under d-20260910-im-adopt-fleet-rents-and-correct-grok —
     measured, not recalled. Every move came from a default changing; the author's vector is
     byte-untouched throughout, which is why the distance wanders in both directions rather than
     shrinking toward the stated value.
     WHAT THE ASSERTION PROTECTS is that the stated central and the computed point are DIFFERENT
     NUMBERS and the difference is disclosed rather than tuned away. The 3-point threshold was set
     at the 3.52 pp distance to keep that meaningful; at 5.11 pp it carries more slack than it was
     cut for. Left at 3 deliberately — raising it to track the current distance would make the
     threshold a function of the very number it is supposed to be independent of, and the next
     default move would strand it again. Recorded so the sentence is true at any distance instead
     of being re-cut every time one moves. (Found by the round-10 fallback review while checking a
     different change; the stale rationale predates that change.) */
  assert("the STATED central is not the computed point — the gap is the finding, not a defect",
    Math.abs(gp.statedReading.central - computed) > 3, `${gp.statedReading.central} vs ${computed.toFixed(2)}`);
  assert("...and the STATED band is not the derived band either",
    gp.statedReading.lo !== Math.round(derived.lo) || gp.statedReading.hi !== Math.round(derived.hi),
    `stated ${gp.statedReading.lo}-${gp.statedReading.hi} vs derived ${derived.lo.toFixed(1)}-${derived.hi.toFixed(1)}`);

  const c = E.statedReadingClause(gp, computed);
  assert("the rendered sentence says QUOTED, not computed here", /QUOTED, not computed here/.test(c.basis), c.basis);
  assert("...names whose figures they are", /GPT-5.6 Pro/.test(c.basis));
  // im-vet-six-repairs (2026-09-20), the vocabulary release edit: "tariff" -> "list price".
  assert("...names the basis they were stated on", /undiscounted list price/.test(c.basis));
  /* The clause DERIVES the gap from the live computation, so this pin follows it: 4.3 -> 3.5 -> 5.1
     -> 5.2. The 2026-09-10 rent adoption WIDENED it and the 2026-09-20 vetting repairs widened it
     again, which is the honest direction for changes made without regard to this estimator's
     stated figure. */
  assert("...states the gap in THIS page's own arithmetic rather than leaving two numbers to disagree",
    /5\.2 points below what they state/.test(c.basis), c.basis);
  assert("...and carries the author's own instruction not to tune toward it",
    /NOT be tuned until it reproduces this number/.test(c.basis));
  assert("the headline is the stated median over the stated range",
    /stated reading: ≈84 % \(68–92 %\)/.test(c.headline), c.headline);

  /* The gap is COMPUTED, so it cannot go stale when either side moves. */
  const moved = E.statedReadingClause(gp, 84.0);
  assert("the gap is derived, not typed — quoting the computed value makes it vanish",
    !/points below/.test(moved.basis) && /0 points/.test(moved.basis), moved.basis);
}

/* owner voice note note-20260912T180812Z-c9eaac (2026-09-12): WHERE THE 83.1-vs-82.4 GAP COMES FROM.
   The stated reading records what this calculator computed when the figure was stated, at the scope it was
   stated on (model, traffic profile, the preset's own settings), and the clause renders the comparison AT
   THAT SCOPE, so the page explains the gap instead of leaving two numbers to disagree. Every value compared
   against is EXECUTED here from the live engine, except the dated reading itself, which is the record:
   executed from site/engine.js at c45c2c3 and re-executed at that commit by the leg's verifier
   (reports/im-default-window-2026-09-12/verify-discrepancy-answer.py).
   Astra round 1 F1: the first version compared the dated figure with WHATEVER the caller computed, so on
   Sonnet it attributed Sonnet's own difference to "later calculator changes". The scope rows below pin
   that the sentence is independent of the caller's reading. */
{
  const opus = E.MODELS.find(m => m.id === "opus");
  const other = E.MODELS.find(m => m.id !== "opus" && m.id !== "custom" && m.lab === opus.lab) || E.MODELS.find(m => m.id !== "opus" && m.id !== "custom");
  for (const [id, then] of [["gptpro-r3", 83.0561], ["fable-r3", 77.3145]]) {
    const p = E.PERSPECTIVES.find(x => x.id === id);
    const aa = p && p.statedReading && p.statedReading.authoredAgainst;
    assert(id + " records what the calculator read when it was stated, and where",
      !!aa && aa.computed === then && aa.engine === "c45c2c3" && aa.date === "2026-08-07" && aa.model === "opus" && aa.profileId === "reference" && /Opus/.test(aa.scopeLabel || ""),
      JSON.stringify(aa));
    const now = E.workload(E.applyPresetSettings(opus, p, { mode: "explicit", profileId: "reference" })).margin * 100;
    const moved = "moved that reading " + (now < then ? "down" : "up") + " by " + Math.abs(then - now).toFixed(2) + " points";
    const c = E.statedReadingClause(p, now);
    assert(id + ": the clause names the dated reading and its scope",
      c.basis.includes("At its authored settings (" + aa.scopeLabel + "), this calculator computed " + then.toFixed(2) + " % when the figure was stated (2026-08-07"), c.basis);
    assert(id + ": ...today's reading at that scope, and the calculator's own move since, from the live computation",
      c.basis.includes("computes " + now.toFixed(2) + " % there today") && c.basis.includes(moved), c.basis);
    /* F1 SCOPE: the caller's reading on ANOTHER model must not change the dated sentence at all. */
    const otherPct = E.workload(E.applyPresetSettings(other, p, { mode: "explicit", profileId: "reference" })).margin * 100;
    const onOther = E.statedReadingClause(p, otherPct);
    assert(id + ": F1 scope — on " + other.id + " the dated sentence still states the authored-scope move",
      onOther.basis.includes(moved), onOther.basis);
    assert(id + ": F1 scope — ...and never attributes " + other.id + "'s own difference to calculator changes",
      Math.abs(Math.abs(then - otherPct) - Math.abs(then - now)) < 0.005 || !onOther.basis.includes("by " + Math.abs(then - otherPct).toFixed(2) + " points"), onOther.basis);
    /* NEGATIVE CONTROL: when the dated reading equals today's authored-scope reading there is nothing to explain. */
    const unchanged = { ...p, statedReading: { ...p.statedReading, authoredAgainst: { ...aa, computed: now } } };
    assert(id + ": negative control — no dated-reading sentence when the calculator has not moved at the authored scope",
      !E.statedReadingClause(unchanged, now).basis.includes("At its authored settings"), E.statedReadingClause(unchanged, now).basis);
  }
  /* Astra round 2 F2: the OLDER gap clause beside the dated sentence. Called with the on-screen reading AND the
     reading at the estimate's own settings, a different on-screen object is named as such and the gap to the
     author's figure is stated at the estimate's own settings. The two-argument pins above stay exactly as they
     were: that call still derives the gap from the value it is handed. */
  for (const id of ["gptpro-r3", "fable-r3", "gptpro-ctx"]) {
    const p = E.PERSPECTIVES.find(x => x.id === id);
    const r1 = x => (Math.round(x * 10) / 10).toString();
    const atScope = E.workload(E.applyPresetSettings(opus, p, { mode: "explicit", profileId: "reference" })).margin * 100;
    const onOtherPct = E.workload(E.applyPresetSettings(other, p, { mode: "explicit", profileId: "reference" })).margin * 100;
    const label = (p.statedReading.authoredAgainst && p.statedReading.authoredAgainst.scopeLabel) || "Claude Opus 4.x, Reference traffic mix, this estimate's own settings";
    const gapAtScope = Math.abs(p.statedReading.central - atScope);
    const off = E.statedReadingClause(p, onOtherPct, { atScope });
    assert(id + ": F2 — on " + other.id + " the gap is stated at the estimate's own settings",
      off.basis.includes("This page computes ≈" + r1(atScope) + " % from their vector at its own settings (" + label + "), " + r1(gapAtScope) + " points"), off.basis);
    assert(id + ": F2 — ...and the on-screen reading is named as a different object, not a disagreement",
      off.basis.includes("Applied unedited to the model and traffic mix selected now, these settings read ≈" + r1(onOtherPct) + " %; that difference is not a disagreement with this estimate."), off.basis);
    /* NEGATIVE CONTROL: when the on-screen object IS the estimate's own settings nothing is re-scoped. */
    const same = E.statedReadingClause(p, atScope, { atScope });
    assert(id + ": F2 negative control — at the estimate's own settings the clause reads exactly as the two-argument call",
      same.basis === E.statedReadingClause(p, atScope).basis && !same.basis.includes("Applied unedited"), same.basis);
  }
  const g3 = E.PERSPECTIVES.find(x => x.id === "gptpro-r3");
  assert("gptpro-r3: the clause says the stated figure did not come through the MCP",
    /not through the MCP/.test(E.statedReadingClause(g3, 82.4246).basis));
  const ctx = E.PERSPECTIVES.find(x => x.id === "gptpro-ctx");
  const ctxNow = E.workload(E.applyPresetSettings(opus, ctx, { mode: "explicit", profileId: "reference" })).margin * 100;
  assert("an estimate with no dated reading (gptpro-ctx) renders no dated-reading sentence",
    !E.statedReadingClause(ctx, ctxNow).basis.includes("At its authored settings"), E.statedReadingClause(ctx, ctxNow).basis);
}

console.log(failures === 0 ? "\nALL MARGIN-BAND CHECKS PASS" : `\n${failures} MARGIN-BAND FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
