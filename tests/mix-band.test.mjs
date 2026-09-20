// THE FEASIBLE-MIX BAND — max / min / median over provider distributions that sum to 100.
// (owner ruling `q-sliders-fleet-util-point`, 2026-08-09T14:57:56Z)
//
// What is asserted here is the property that makes the feature honest, and it is the same property
// `margin-band.test.mjs` asserts for the box: the band is the ATTAINABLE range over the feasible
// set, not an enclosure of it. The falsifier is dense random FEASIBLE mixes — every one sums to 100
// inside the declared ranges — and none of them may produce a margin outside the reported band.
//
// The other half of the file is the ruling's own two branches, which are testable as written:
// centres that sum to 100 ARE the median; centres that do not get the nearest mix that does.
//
// Run: node tests/mix-band.test.mjs
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

const SEL = { mode: "explicit", profileId: "reference" };
const opus = E.MODELS.find(m => m.id === "opus");
const gptC = E.PERSPECTIVES.find(p => p.id === "gptpro-ctx");
const gptR3 = E.PERSPECTIVES.find(p => p.id === "gptpro-r3");
const gptModel = E.MODELS.find(m => m.id === "gpt");

/* GPT Pro's own blend declaration, which this preset now carries: the numbers its round-2 review
   stated as family constraints. Read from the preset rather than restated, so the test cannot
   silently pass against a declaration that changed. */
const DECLARED = E.mixRangesFromRanges(gptC.set.dialRanges);

const marginAtBlend = (m, p, blend) => {
  const s = E.applyPresetSettings(m, p, SEL);
  s.blend = Object.assign({}, blend);
  const w = E.workload(s, undefined, E.scenarioContext(s));
  return isFinite(w.margin) ? w.margin * 100 : NaN;
};

// ---------------------------------------------------------------- the declaration is carried
assert("gptpro-ctx carries its author's blend declaration as ranges",
  !!DECLARED && Object.keys(DECLARED).length === 3,
  "got " + JSON.stringify(DECLARED));
assert("the declared NVIDIA/TPU/Trainium bands are its author's own numbers",
  DECLARED["blend.fam.nvidia"].lo === 50 && DECLARED["blend.fam.nvidia"].hi === 65
  && DECLARED["blend.fam.tpu"].lo === 35 && DECLARED["blend.fam.tpu"].hi === 50
  && DECLARED["blend.fam.trainium"].lo === 0 && DECLARED["blend.fam.trainium"].hi === 15,
  JSON.stringify(DECLARED));

const band = E.mixBand(opus, gptC, SEL, DECLARED);
assert("the landing subject computes a mix band", band && !band.refused, band && band.refused);

// ---------------------------------------------------------------- 1. THE FALSIFIER
/* Dense random FEASIBLE mixes. Each is drawn by sampling the free blocks inside their ranges and
   solving the last one off the sum constraint, retrying until it lands inside its own range — so
   every sample is a legal mix, which is what makes an escape a refutation rather than a bad draw. */
{
  const blocks = band.blocks;
  const T = band.T;
  let outside = 0, drawn = 0, worst = 0;
  let seed = 20260809;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const legsOf = (b) => b.id.startsWith("blend.fam.") ? E.legsInFamily(b.id.slice(10)) : [b.id.slice(6)];
  const pointBlend = E.applyPresetSettings(opus, gptC, SEL).blend;
  for (let t = 0; t < 4000 && drawn < 1200; t++) {
    const vals = blocks.map(b => b.lo + (b.hi - b.lo) * rnd());
    const last = blocks.length - 1;
    vals[last] = T - vals.slice(0, last).reduce((a, x) => a + x, 0);
    if (vals[last] < blocks[last].lo - 1e-9 || vals[last] > blocks[last].hi + 1e-9) continue;
    drawn++;
    const blend = {};
    for (const k of E.HW_ORDER) blend[k] = 0;
    blocks.forEach((b, i) => {
      const legs = legsOf(b);
      const tot = legs.reduce((a, k) => a + (pointBlend[k] || 0), 0);
      const prop = tot > 0 ? legs.map(k => (pointBlend[k] || 0) / tot)
        : (() => { const d = legs.reduce((a, k) => a + (E.DEFAULTS.blend[k] || 0), 0);
                   return d > 0 ? legs.map(k => (E.DEFAULTS.blend[k] || 0) / d) : legs.map(() => 1 / legs.length); })();
      legs.forEach((k, j) => { blend[k] += vals[i] * prop[j]; });
    });
    const y = marginAtBlend(opus, gptC, blend);
    if (!isFinite(y)) continue;
    if (y < band.lo - 1e-6 || y > band.hi + 1e-6) { outside++; worst = Math.max(worst, Math.max(band.lo - y, y - band.hi)); }
  }
  assert(`no feasible mix escapes the band (${drawn} random legal mixes)`, drawn > 200 && outside === 0,
    `${outside} escaped, worst by ${worst.toFixed(6)} points`);
}

// ---------------------------------------------------------------- 2. REACHABILITY
/* A band edge that no mix reaches is not an attainable range. Both edges are re-evaluated from the
   mixes the band says produce them, through the ordinary engine path. */
{
  const loY = marginAtBlend(opus, gptC, band.loMix);
  const hiY = marginAtBlend(opus, gptC, band.hiMix);
  assert("the reported minimum is reached by the mix that claims it", Math.abs(loY - band.lo) < 1e-9,
    `${loY} vs ${band.lo}`);
  assert("the reported maximum is reached by the mix that claims it", Math.abs(hiY - band.hi) < 1e-9,
    `${hiY} vs ${band.hi}`);
  assert("the band brackets its own point", band.lo <= band.point + 1e-9 && band.point <= band.hi + 1e-9,
    `point ${band.point} outside ${band.lo}–${band.hi}`);
}

// ---------------------------------------------------------------- 3. MEMBERSHIP: every mix sums to 100
{
  const sums = [band.loMix, band.midMix, band.hiMix].map(b => E.HW_ORDER.reduce((a, k) => a + (b[k] || 0), 0));
  assert("min, median and max mixes each sum to exactly 100 %", sums.every(s => Math.abs(s - 100) < 1e-9),
    JSON.stringify(sums));
  const famTotal = (b, fam) => E.legsInFamily(fam).reduce((a, k) => a + (b[k] || 0), 0);
  const inside = (b) => Object.entries(DECLARED).every(([id, r]) => {
    const t = id.startsWith("blend.fam.") ? famTotal(b, id.slice(10)) : (b[id.slice(6)] || 0);
    return t >= r.lo - 1e-9 && t <= r.hi + 1e-9;
  });
  assert("every reported mix respects every declared range",
    [band.loMix, band.midMix, band.hiMix].every(inside));
}

// ---------------------------------------------------------------- 4. THE RULING'S FIXED BRANCH
/* "If they use three points, the median should be summing to 100%." GPT Pro's declared shares are
   60 / 40 / 0, which do. So the median must be its own mix, not something this page computed. */
{
  assert("centres that already sum to 100 ARE the median (the owner's fixed case)",
    band.medianIsDeclared === true && Math.abs(band.mid - band.point) < 1e-9,
    `medianIsDeclared=${band.medianIsDeclared} mid=${band.mid} point=${band.point}`);
  const pointBlend = E.applyPresetSettings(opus, gptC, SEL).blend;
  assert("the median mix IS the preset's declared mix, leg for leg",
    E.HW_ORDER.every(k => Math.abs((band.midMix[k] || 0) - (pointBlend[k] || 0)) < 1e-9),
    JSON.stringify(band.midMix));
  assert("the median does not introduce the Trainium share its author excluded from the point",
    (band.midMix.trn2 || 0) === 0 && (band.midMix.trn3 || 0) === 0,
    JSON.stringify({ trn2: band.midMix.trn2, trn3: band.midMix.trn3 }));
}

// ---------------------------------------------------------------- 5. THE RULING'S OPEN BRANCH
/* "if they just use two points or the median doesn't sum to 100%, then max, min and medium can be
   calculated based on the options that reach 100%." Forced by declaring explicit centres that do
   not sum to 100 — GPT Pro's own range midpoints, 57.5 / 42.5 / 7.5 = 107.5. */
{
  const skewed = {
    "blend.fam.nvidia":   { lo: 50, mid: 57.5, hi: 65 },
    "blend.fam.tpu":      { lo: 35, mid: 42.5, hi: 50 },
    "blend.fam.trainium": { lo: 0,  mid: 7.5,  hi: 15 },
  };
  const b2 = E.mixBand(opus, gptC, SEL, skewed);
  assert("centres summing to 107.5 still produce a median", b2 && !b2.refused, b2 && b2.refused);
  assert("that median is COMPUTED, not declared", b2.medianIsDeclared === false);
  const sum = E.HW_ORDER.reduce((a, k) => a + (b2.midMix[k] || 0), 0);
  assert("the computed median mix sums to exactly 100 %", Math.abs(sum - 100) < 1e-9, String(sum));
  assert("the computed median is the NEAREST feasible mix to the declared centres",
    Math.abs(b2.medianBlocks[0] - 55) < 1e-6 && Math.abs(b2.medianBlocks[1] - 40) < 1e-6
    && Math.abs(b2.medianBlocks[2] - 5) < 1e-6, JSON.stringify(b2.medianBlocks));
  assert("the computed median lies inside the band", b2.mid >= b2.lo - 1e-9 && b2.mid <= b2.hi + 1e-9);
}

// ---------------------------------------------------------------- 6. THE POINT-CONTAINMENT GUARD
/* Mix ranges hang off a PERSPECTIVE but a MODEL preset can override the blend. GPT Pro's reading of
   Anthropic's fleet must not be used to bracket OpenAI's — un-guarded it returned a band that did
   not contain its own point. */
{
  const b3 = E.mixBand(gptModel, gptC, SEL, DECLARED);
  assert("a scenario whose own mix is outside the declared ranges REFUSES",
    b3 && !!b3.refused && /outside the declared ranges/.test(b3.refused), b3 && JSON.stringify(b3).slice(0, 200));
  assert("the refusal names which provider and by how much", /NVIDIA is 100%/.test(b3.refused), b3.refused);
}

// ---------------------------------------------------------------- 7. NO SILENT RENORMALIZATION
/* A declaration that cannot hold the scenario is REPORTED, never rescaled to fit — rescaling would
   rewrite an adjudicator's claim to suit this page's arithmetic, which is the silent renormalization
   the commission forbids. Ranges too narrow to contain the point are the reachable form of that.
   The unreachable form is asserted directly below: containment makes an empty feasible set
   impossible, so the point is ALWAYS a member and the band can never fail to bracket it. */
{
  const tooNarrow = { "blend.fam.nvidia": { lo: 10, hi: 20 }, "blend.fam.tpu": { lo: 10, hi: 20 } };
  const b4 = E.mixBand(opus, gptC, SEL, tooNarrow);
  assert("ranges too narrow to hold the scenario refuse rather than renormalize",
    b4 && !!b4.refused && /outside the declared ranges/.test(b4.refused),
    b4 && (b4.refused || JSON.stringify(b4).slice(0, 160)));
  assert("nothing in the refusal path rewrites the declared ends",
    tooNarrow["blend.fam.nvidia"].lo === 10 && tooNarrow["blend.fam.nvidia"].hi === 20
    && tooNarrow["blend.fam.tpu"].lo === 10 && tooNarrow["blend.fam.tpu"].hi === 20);

  /* THE STRUCTURAL INVARIANT, over every declaration that survives containment: Σlo ≤ T ≤ Σhi, so
     the feasible set always contains the scenario's own mix. Swept over a grid of widths around
     each declared band rather than argued once. */
  let checked = 0, broken = 0;
  for (const dn of [0, 2, 5, 10]) for (const dt of [0, 2, 5, 10]) for (const dr of [0, 5, 15]) {
    const r = {
      "blend.fam.nvidia":   { lo: 60 - dn, hi: 60 + dn },
      "blend.fam.tpu":      { lo: 40 - dt, hi: 40 + dt },
      "blend.fam.trainium": { lo: 0,       hi: dr },
    };
    const b = E.mixBand(opus, gptC, SEL, r);
    if (!b || b.refused) continue;
    checked++;
    if (!(b.lo <= b.point + 1e-9 && b.point <= b.hi + 1e-9)) broken++;
  }
  assert(`the point is a member of every feasible set that computes (${checked} declarations swept)`,
    checked > 20 && broken === 0, `${broken} bands failed to bracket their own point`);
}

// ---------------------------------------------------------------- 7b. SHARES THAT DO NOT TOTAL 100
/* Shares are relative weights and a reader can leave them totalling anything; the engine normalizes.
   The constraint still binds — the bounded providers keep the total they carry — and the readout
   says so in the reader's numbers instead of quietly restating them as 100. */
{
  const base = Object.assign({}, E.applyPresetSettings(opus, gptC, SEL).blend);
  for (const k of Object.keys(base)) base[k] = base[k] * 1.2;      // totals 120, same composition
  const b4b = E.mixBand(opus, gptC, SEL,
    { "blend.fam.nvidia": { lo: 60, hi: 78 }, "blend.fam.tpu": { lo: 42, hi: 60 } }, { base: { blend: base } });
  assert("a scenario whose shares total 120 still computes a band", b4b && !b4b.refused,
    b4b && b4b.refused);
  assert("and it says so rather than claiming the shares sum to 100",
    /your shares total 120/.test(b4b.label), b4b.label);
  assert("the bounded providers are held to the total they actually carry",
    Math.abs(b4b.T - 120) < 1e-9, String(b4b.T));
}

// ---------------------------------------------------------------- 8. OVERLAPPING BLOCKS REFUSE
{
  const overlap = { "blend.fam.tpu": { lo: 30, hi: 50 }, "blend.tpu7": { lo: 30, hi: 50 } };
  const b5 = E.mixBand(opus, gptC, SEL, overlap);
  assert("a provider range and a leg range inside it refuse (one claim, counted twice)",
    b5 && !!b5.refused && /overlaps a range already declared/.test(b5.refused),
    b5 && (b5.refused || JSON.stringify(b5).slice(0, 160)));
}

// ---------------------------------------------------------------- 9. ONE BOUNDED PROVIDER IS PINNED
/* Σ = 100 fixes the last free block. Not a defect — the owner's own rule — but the readout has to
   name the mechanism instead of showing a zero-width range a reader would read as broken. */
{
  const one = { "blend.fam.tpu": { lo: 35, hi: 50 } };
  const b6 = E.mixBand(opus, gptC, SEL, one);
  assert("bounding one provider alone pins the mix", b6 && !b6.refused && b6.singleBlockPinned === true,
    b6 && (b6.refused || String(b6.singleBlockPinned)));
  assert("a pinned mix reports a zero-width band at its own point",
    Math.abs(b6.hi - b6.lo) < 1e-9 && Math.abs(b6.lo - b6.point) < 1e-9,
    `${b6.lo}–${b6.hi} vs point ${b6.point}`);
  assert("and the label explains why rather than leaving the reader to guess",
    /Bound a second provider/.test(b6.label), b6.label);
}

// ---------------------------------------------------------------- 10. BUDGET
{
  const many = {};
  for (const k of E.HW_ORDER) many["blend." + k] = { lo: 0, hi: 100 };
  const b7 = E.mixBand(opus, gptC, SEL, many);
  assert(`${E.HW_ORDER.length} leg ranges is at the cap and still computes`, b7 && !b7.refused,
    b7 && b7.refused);
  assert("a full-freedom mix band is wider than the declared-provider one",
    b7 && !b7.refused && (b7.hi - b7.lo) > (band.hi - band.lo),
    b7 && !b7.refused ? `${(b7.hi - b7.lo).toFixed(2)} vs ${(band.hi - band.lo).toFixed(2)}` : "");
}

// ---------------------------------------------------------------- 11. THE NO-OP PROOF
/* A scenario that declares no mix range must be untouched by every line of this feature — the same
   bit-identity standard the per-leg multipliers and the spec-decode lever were held to. */
{
  /* gptR3 DECLARED its blend ranges in the 2026-08-10 consult, so the no-op example moved to a
     preset that still declares none. `fable-ctx` is round 2: one range, on occupancy, and nothing
     compositional — exactly the pre-feature shape this assertion exists to protect. */
  const fableCtx = E.PERSPECTIVES.find(x => x.id === "fable-ctx");
  assert("a preset with no declared mix range yields no mix band at all",
    E.mixRangesFromRanges(fableCtx.set.dialRanges) === null
    && E.mixBand(opus, fableCtx, SEL, E.mixRangesFromRanges(fableCtx.set.dialRanges)) === null);
  assert("blend ids never reach the box-dial derivation",
    E.dialsFromRanges(gptC.set.dialRanges).every(d => !(d.key || "").startsWith("blend.")));
  assert("the round-3 preset's declared box dials are unchanged in count",
    E.dialsFromRanges(gptR3.set.dialRanges).length === 10,
    String(E.dialsFromRanges(gptR3.set.dialRanges).length));
}

// ---------------------------------------------------------------- 12. THE CODEC CARRIES A MIX RANGE
/* A declared range that dies silently in a share link is a claim the reader cannot pass on. Blend
   ids go through `dialBounds` like every other dial id, so the sanitizer accepts them and an
   unregistered one still fails closed. */
{
  assert("a provider range id has a declared domain", JSON.stringify(E.dialBounds("blend.fam.nvidia")) === "[0,100]");
  assert("a leg range id has a declared domain", JSON.stringify(E.dialBounds("blend.tpu7")) === "[0,100]");
  assert("an unregistered provider fails closed", E.dialBounds("blend.fam.nosuch") === null);
  assert("an unregistered leg fails closed", E.dialBounds("blend.nosuch") === null);
  const clean = E.sanitizeScenarioDiff({ dialRanges: { "blend.fam.tpu": { lo: 35, mid: 40, hi: 50 } } });
  assert("a well-formed mix range survives the share-link sanitizer",
    !!(clean.diff && clean.diff.dialRanges && clean.diff.dialRanges["blend.fam.tpu"]),
    JSON.stringify(clean).slice(0, 200));
  const forged = E.sanitizeScenarioDiff({ dialRanges: { "blend.fam.tpu": { lo: -5, hi: 400 } } });
  assert("an out-of-domain mix range is rejected whole, never repaired",
    !(forged.diff && forged.diff.dialRanges), JSON.stringify(forged).slice(0, 200));
}

// ---------------------------------------------------------------- 12b. THE OTHER RENORMALIZATION, AT THE EDGES
/* The engine drops legs that cannot serve the model and renormalizes the survivors, with a standing
   disclosure — but that disclosure describes the scenario ON SCREEN, which is the band's centre. A
   band EDGE is a different mix, and one that moves weight onto an unservable leg is renormalized
   where no existing surface reaches. This is the exact "silent renormalization" the commission
   forbids, so the band measures it at every reported mix. Forced here by inflating the model past
   what the smaller legs can hold, because on today's presets nothing is infeasible (0 of 272). */
{
  /* im-arc T4 fold (2026-08-24), memo §4: "every leg servable" is the PREMISE of this case, and
     under the default rent basis it is no longer true — gb200, gb300 and trn3 have no admissible
     public planning rate. The premise is restored on the OWNED basis, where every registered row
     is priced, so the case still tests what it was written to test: with nothing renormalizing,
     the band claims no edge renormalization. The strained case below is unchanged and still
     forces the renormalization it detects. */
  const clean = E.mixBand(opus, gptC, SEL, DECLARED, { base: { hwMode: "tco" } });
  assert("with every leg servable, no edge-renormalization is claimed",
    clean.pointRenderableShare === 1 && clean.renormalizedEdges.length === 0,
    JSON.stringify(clean.renormalizedEdges));
  assert("...and the label says nothing about unservable legs",
    !/cannot serve/.test(clean.label), clean.label);

  const strained = E.mixBand(opus, gptC, SEL, DECLARED, { base: { total: 12000 } });
  assert("a mix whose edge lands weight on unservable legs is DETECTED",
    strained && !strained.refused && strained.renormalizedEdges.length > 0,
    strained && (strained.refused || JSON.stringify(strained.renormalizedEdges)));
  assert("...the edge is named, with both weight shares, in the band's own label",
    /cannot serve/.test(strained.label) && /at the centre/.test(strained.label), strained.label);
  assert("...and the edge share is genuinely lower than the centre's",
    strained.renormalizedEdges.every(x => x.share < strained.pointRenderableShare),
    JSON.stringify({ edges: strained.renormalizedEdges, point: strained.pointRenderableShare }));
}

// ---------------------------------------------------------------- 12c. BUDGET IS ACTUALLY BOUNDED
/* The cap is a promise about wall time, not just about a count: every candidate vertex runs a full
   workload evaluation. Asserted as a measurement so a future change that makes evaluation expensive
   trips here rather than in a reader's browser. */
{
  const many = {};
  for (const k of E.HW_ORDER) many["blend." + k] = { lo: 0, hi: 100 };
  const t0 = Date.now();
  const b8 = E.mixBand(opus, gptC, SEL, many);
  const ms = Date.now() - t0;
  assert(`the ${E.HW_ORDER.length}-block cap computes in bounded time (${ms} ms)`, !b8.refused && ms < 3000,
    b8.refused || `${ms} ms`);
}

// ---------------------------------------------------------------- 13. AFFINENESS IS PROBED, NOT ASSUMED
{
  /* im-arc T4 fold (2026-08-24), memo §4: affineness in the shares is a property of a band whose
     legs are ALL priced — the mix is affine only where every vertex evaluates. Under the default
     rent basis three legs now have no admissible public planning rate, so vertices that move
     weight onto them renormalize and the measured deviation is no longer float noise. Both facts
     are asserted: the probe still reports float noise where every leg is priced, and where legs
     are unpriced the band REFUSES to claim exactness rather than claiming it anyway. */
  const affineBand = E.mixBand(opus, gptC, SEL, DECLARED, { base: { hwMode: "tco" } });
  assert("the band reports the affineness deviation it measured", typeof band.affineDev === "number");
  /* The engine's rule, stated exactly: a band is exact when the survivor regime is constant and
     every vertex evaluated. Where the affineness probe ALSO lands at float noise the path is
     affine; where it does not, and the regime is still constant, the path is LINEAR-FRACTIONAL —
     the extremes are still at vertices, so the band is still exact and the label must say which
     of the two it is. Before the fold the second branch was unreachable, which is why this
     assertion could once be written as a plain equality with the probe. */
  assert("and claims exactness only when the regime probe passed",
    affineBand.exact === (affineBand.regimeConstant && affineBand.unevaluable === 0)
    && band.exact === (band.regimeConstant && band.unevaluable === 0));
  assert("on this engine the measured deviation is at floating-point noise where every leg is priced",
    affineBand.affineDev < 1e-6 && affineBand.linearFractional === false, String(affineBand.affineDev));
  assert("...and where a renormalizing edge breaks affineness the band says LINEAR-FRACTIONAL, never affine",
    band.affineDev > 1e-6 ? (band.linearFractional === true && /ratio of two straight lines/i.test(band.label)) : true,
    JSON.stringify({ dev: band.affineDev, lf: band.linearFractional }));
}


// ---------------------------------------------------------------- 14. THE CONSULT'S DECLARATIONS
/* Both arms answered the same brief without sight of each other and DECLARED blend ranges, which
   discharges the round-3 gap in their own words. These assertions pin the declarations as their
   authors gave them — the same discipline the five-box-ranges guard applies to gptpro-ctx. */
{
  const fableR3 = E.PERSPECTIVES.find(x => x.id === "fable-r3");
  const proMix = E.mixRangesFromRanges(gptR3.set.dialRanges);
  const fabMix = E.mixRangesFromRanges(fableR3.set.dialRanges);

  assert("GPT Pro's round-3 blend declaration is carried in its own numbers",
    proMix["blend.fam.nvidia"].lo === 50 && proMix["blend.fam.nvidia"].hi === 65
    && proMix["blend.fam.tpu"].lo === 35 && proMix["blend.fam.tpu"].hi === 50
    && proMix["blend.fam.trainium"].lo === 0 && proMix["blend.fam.trainium"].hi === 15,
    JSON.stringify(proMix));
  assert("...with its trn2-ONLY Trainium rule declared rather than left to this page's default",
    proMix["blend.fam.trainium"].split && proMix["blend.fam.trainium"].split.trn2 > 0
    && proMix["blend.fam.trainium"].split.trn3 === 0,
    JSON.stringify(proMix["blend.fam.trainium"]));

  const pb = E.mixBand(opus, gptR3, SEL, proMix);
  /* im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     the POINT moves with the adopted planning rents, 83.75 -> 82.42. The property this assertion is
     named for is untouched and is the second half of it: the declared reference IS the point, so the
     author's own median was not displaced by a computed midpoint. */
  /* im-vet-six-repairs (2026-09-20): 82.42 -> 82.33 with the TPU numerator repair. This preset
     declares its own blend (NVIDIA + TPU, Trainium at zero weight by its author's own choice), so
     the Trainium withdrawal does not reach it and only the coefficient does. The property this
     assertion is named for is untouched. */
  assert("...and its declared reference survives: the point moves only with the defaults and IS the reference",
    !pb.refused && pb.medianIsDeclared === true && Math.abs(pb.point - 82.3332) < 0.01
    && Math.abs(pb.mid - pb.point) < 1e-9,
    pb.refused || `${pb.point} / ${pb.mid}`);
  assert("...the trn2-only rule REACHES the mixes: no Trainium3 anywhere in the envelope",
    (pb.loMix.trn3 || 0) === 0 && (pb.midMix.trn3 || 0) === 0 && (pb.hiMix.trn3 || 0) === 0
    && (pb.loMix.trn2 || 0) > 0,
    JSON.stringify({ lo: pb.loMix.trn2, trn3: pb.loMix.trn3 }));

  assert("Fable's round-3 blend declaration is carried in its own numbers",
    fabMix["blend.fam.nvidia"].lo === 35 && fabMix["blend.fam.nvidia"].hi === 65
    && fabMix["blend.fam.tpu"].lo === 15 && fabMix["blend.fam.tpu"].hi === 40
    && fabMix["blend.fam.trainium"].lo === 5 && fabMix["blend.fam.trainium"].hi === 35,
    JSON.stringify(fabMix));
  assert("...with NO invented midpoints, on its own stated ground",
    Object.values(fabMix).every(r => r.mid === undefined), JSON.stringify(fabMix));

  const fb = E.mixBand(opus, fableR3, SEL, fabMix);
  /* im-arc T4 fold (2026-08-24, declared delta): the author's DECLARED ranges are byte-untouched;
     what moved is the arithmetic the engine measures them through.
     im-release-edit-r2 (2026-09-10): same again under the rent adoption — the declared ranges are
     byte-untouched for the second time, and only the arithmetic they are measured through moves. */
  /* im-vet-six-repairs (2026-09-20) — A DESIGNED REFUSAL NOW FIRES, and it is a real consequence
     of the repair rather than a test artefact, so it is asserted rather than worked around.
     This preset declares NO blend of its own, so it seeds from the default fleet; the default
     withdrew both Trainium legs on evidence grounds, and its author declared a Trainium share of
     5-35%. The scenario on screen therefore sits OUTSIDE the author's own declared blend range,
     and `mixBand` refuses to draw an envelope over ranges that describe a different fleet from the
     one rendered. The page says exactly that (site/app.js band-refused: "No mix envelope computed
     — …"), which is the honest outcome: an envelope computed anyway would be an envelope over a
     composition this page no longer renders.
     WHAT IT USED TO REPRODUCE, kept so the loss is legible rather than silent: 73.93-79.41 with a
     point of 76.33, the figures its author measured before declaring. The point itself still
     computes (76.28 today) and is published; it is the ENVELOPE that is withheld.
     The reason string is asserted, not just the refusal, so a DIFFERENT refusal cannot pass here. */
  assert("...and the declared-mix envelope is REFUSED, naming the Trainium withdrawal as the reason",
    typeof fb.refused === "string"
    && /Trainium is 0%, declared 5\u201335%/.test(fb.refused)
    && /describe a different fleet than the one on screen/.test(fb.refused)
    && Array.isArray(fb.outside) && fb.outside.join(",") === "blend.fam.trainium"
    && Math.abs(fb.point - 76.2833) < 0.01,
    JSON.stringify({ refused: fb.refused, outside: fb.outside, point: fb.point }));
}

// ---------------------------------------------------------------- 15. THE SURVIVOR-SET REGIME CHECK
/* What licenses exactness is a CONSTANT survivor set, not affineness (GPT Pro, dual consult). With
   the renderable set fixed, renormalizing makes the objective linear-fractional, and that still
   attains its extrema at vertices — so a band can read non-affine and still be exact. Verified
   against a dense grid in the consult; asserted here so the distinction cannot rot back. */
{
  /* im-arc T4 fold (2026-08-24), memo §4: "nothing renormalizing" is this case's PREMISE, and it
     needs a basis on which every registered leg is priced — three now have no admissible public
     planning rate under a rent basis. The distinction the case exists to protect (a band may read
     non-affine and still be exact, because a constant survivor set makes the objective
     linear-fractional and its extrema still sit at vertices) is untouched, and the renormalizing
     counterpart is asserted immediately below it. */
  const clean = E.mixBand(opus, gptC, SEL, DECLARED, { base: { hwMode: "tco" } });
  assert("with nothing renormalizing, the band is exact and reads affine",
    clean.exact === true && clean.regimeConstant === true && clean.linearFractional === false
    && clean.affineDev < 1e-6, JSON.stringify({ e: clean.exact, r: clean.regimeConstant, a: clean.affineDev }));

  const strained = E.mixBand(opus, gptC, SEL, DECLARED, { base: { total: 12000 } });
  assert("under live renormalization the band reads NON-affine...",
    strained.affineDev > 1e-6, String(strained.affineDev));
  assert("...and is STILL exact, because the survivor set is constant (linear-fractional)",
    strained.exact === true && strained.regimeConstant === true && strained.linearFractional === true,
    JSON.stringify({ e: strained.exact, r: strained.regimeConstant, lf: strained.linearFractional }));
  assert("...and says so in its own label rather than leaving the reader to infer it",
    /ratio of two straight lines/.test(strained.label), strained.label);
  /* centroid-gate R1 P0-2: with renormalization live the denominator moves with the shares, so
     the margin AT the centroid is NOT the expected margin (measured 0.0034 pp apart by
     quadrature) even though the regime is constant. The gate must say no here. */
  assert("mean mix: live renormalization DENIES the expected-margin claim (margin-at-mean only)",
    strained.mean !== null && strained.meanIsExpected === false,
    JSON.stringify({ mean: strained.mean, gate: strained.meanIsExpected }));
  /* centroid-gate R1 P2: the old form of this row ended in `|| true` and could never fail.
     mixLabelParts is not exported, so the honest lexical check reads the engine source bytes. */
  {
    const { readFileSync } = require("node:fs");
    const engineSrc = readFileSync(require.resolve("../site/engine.js"), "utf8");
    assert("a regime conflict would be NAMED, not silently folded",
      engineSrc.includes("can serve the model at some mixes in this range and not at others"));
  }
}

/* ---------------------------------------------------------------- THE MEAN MIX (M8 wiring, bq-231)
   Owner MEAN ruling (2026-08-11); decision memo research/three-point-middle-point-decision-2026-08-11.md.
   The stat is the margin AT the exact centroid of P = box ∩ {Σ = T}. These rows are the memo's own
   §3 trap table — the midpoint-projection shortcut and the unweighted vertex average BOTH pass the
   symmetric GPT-Pro case and are silently wrong elsewhere, so the asymmetric rows are the
   load-bearing ones. Expected values are the memo's measured numbers, external to this code. */
{
  // (1) the symmetric reference case: centroid = 55/40/5, agreeing with both consult arms
  const mb = E.mixBand(opus, gptC, SEL, DECLARED);
  assert("mean mix: the band carries the exact centroid for GPT Pro's declaration (55/40/5)",
    !!mb.meanBlocks && Math.abs(mb.meanBlocks[0] - 55) < 1e-6
    && Math.abs(mb.meanBlocks[1] - 40) < 1e-6 && Math.abs(mb.meanBlocks[2] - 5) < 1e-6,
    JSON.stringify(mb.meanBlocks));
  assert("mean mix: the margin at the mean is finite and inside the band's own envelope",
    mb.mean !== null && mb.mean >= mb.lo - 1e-9 && mb.mean <= mb.hi + 1e-9,
    "mean=" + mb.mean + " lo=" + mb.lo + " hi=" + mb.hi);
  assert("mean mix: the expected-margin gate is the regime signature (boolean present, true here)",
    mb.meanIsExpected === true, String(mb.meanIsExpected));
  assert("mean mix: the mean mix sums to the band's own T",
    Math.abs(mb.meanBlocks.reduce((a, b) => a + b, 0) - mb.T) < 1e-9);

  // (2) the asymmetric case — Fable r3's declaration; memo-measured 50.922/28.156/20.921
  const fable = E.centroidOnSum([35, 15, 5], [65, 40, 35], 100);
  assert("mean mix: Fable-r3 ranges give the memo's measured centroid (50.922/28.156/20.921)",
    !!fable && Math.abs(fable[0] - 50.922) < 2e-3 && Math.abs(fable[1] - 28.156) < 2e-3
    && Math.abs(fable[2] - 20.921) < 2e-3, JSON.stringify(fable));
  // the TRAP row: the midpoint projection gives 50.833/28.333/20.833 here — an implementation
  // that shortcuts the mean to the projection passes case (1) and fails THIS row.
  assert("mean mix TRAP: the centroid is NOT the midpoint projection on the asymmetric case",
    !!fable && Math.abs(fable[0] - 50.8333) > 0.05, JSON.stringify(fable));

  // (3) the skewed case — unconstrained box, so the centroid must be 85/7.5/7.5 (5 pp from the
  // projection's 80/10/10; hand-provable per the memo)
  const skew = E.centroidOnSum([0, 5, 5], [90, 10, 10], 100);
  assert("mean mix: the skewed case lands on the hand-provable 85/7.5/7.5",
    !!skew && Math.abs(skew[0] - 85) < 1e-9 && Math.abs(skew[1] - 7.5) < 1e-9
    && Math.abs(skew[2] - 7.5) < 1e-9, JSON.stringify(skew));

  // (3b) the high-k upper SLIVER that broke the unreduced inclusion–exclusion (centroid-gate
  // R1 P0-1): complement symmetry proves the centroid is [9,19,...,99]; before the reduction
  // the alternating sums cancelled catastrophically and returned coordinates summing to 4,116.
  const sliver = E.centroidOnSum([0,0,0,0,0,0,0,0,0,0], [10,20,30,40,50,60,70,80,90,100], 540);
  assert("mean mix: the 10-block upper sliver lands exactly on its symmetry-provable centroid",
    !!sliver && sliver.every((x, i) => Math.abs(x - (10 * (i + 1) - 1)) < 1e-6),
    JSON.stringify(sliver));

  // (3c) a T ≠ 100 declaration: the mean must live on the reader's own composition budget.
  {
    const wide = E.mixBand(opus, gptC, SEL,
      { "blend.fam.nvidia": { lo: 58, hi: 80 }, "blend.fam.tpu": { lo: 30, hi: 62 } },
      { base: { blend: { h100: 30, h200: 40, tpu7: 50 } } });
    if (wide && !wide.refused && wide.meanBlocks) {
      assert("mean mix: at a non-100 total the mean sums to the band's own T, not to 100",
        Math.abs(wide.meanBlocks.reduce((a, b) => a + b, 0) - wide.T) < 1e-9
        && Math.abs(wide.T - 100) > 0.5,
        JSON.stringify({ T: wide.T, blocks: wide.meanBlocks }));
    } else {
      assert("mean mix: T≠100 probe produced a usable band (constructional precondition)", false,
        JSON.stringify(wide && (wide.refused || "no meanBlocks")));
    }
  }

  // (3d) centroid-gate R2 P0: the FLIP-BOUNDARY mixed-magnitude case. T = Σw/2, so central
  // symmetry proves the centroid is exactly hi/2 — the float inclusion–exclusion returned
  // 50.0017 on the dominant coordinate and the postcondition certified it. The exact integer
  // core must land within terminal-rounding distance of hi/2 on EVERY coordinate.
  {
    const fbHi = [0.47, 22.9, 21.03, 3.59, 4.96, 0.1, 0.57, 0.34, 0.4, 100];
    const fbLo = fbHi.map(() => 0);
    const fbT = fbHi.reduce((a, b) => a + b, 0) / 2;
    const fb2 = E.centroidOnSum(fbLo, fbHi, fbT);
    assert("mean mix: the flip-boundary mixed-magnitude case lands on its symmetry-provable hi/2",
      !!fb2 && fb2.every((x, i) => Math.abs(x - fbHi[i] / 2) < 1e-12), JSON.stringify(fb2));
  }
  // (3e) centroid-gate R2 P1: a legal ZERO-WIDTH block pins and reduces instead of collapsing
  // the volume — NVIDIA 60–60 / TPU 30–50 / Trainium 0–10 has the exact centroid [60,35,5].
  {
    const zw = E.centroidOnSum([60, 30, 0], [60, 50, 10], 100);
    assert("mean mix: a zero-width block pins its coordinate and the rest still averages ([60,35,5])",
      !!zw && Math.abs(zw[0] - 60) < 1e-9 && Math.abs(zw[1] - 35) < 1e-9 && Math.abs(zw[2] - 5) < 1e-9,
      JSON.stringify(zw));
    const zwBand = E.mixBand(opus, gptC, SEL,
      { "blend.fam.nvidia": { lo: 60, hi: 60 }, "blend.fam.tpu": { lo: 30, hi: 50 }, "blend.fam.trainium": { lo: 0, hi: 10 } });
    assert("mean mix: the zero-width band still carries a mean (no over-suppression)",
      !!zwBand && !zwBand.refused && zwBand.mean !== null && !!zwBand.meanBlocks,
      JSON.stringify(zwBand && (zwBand.refused || zwBand.meanBlocks)));
  }

  // (3f) centroid-gate R3 residue rows: the k=1 clamp now refuses an infeasible T, and the
  // all-pinned branch answers only when the pins actually meet T.
  assert("mean mix: k=1 with an infeasible T refuses instead of clamping",
    E.centroidOnSum([0], [10], 20) === null);
  assert("mean mix: k=1 with a feasible T answers",
    JSON.stringify(E.centroidOnSum([0], [10], 7)) === "[7]");
  assert("mean mix: all-pinned blocks inconsistent with T refuse",
    E.centroidOnSum([60, 30, 10], [60, 30, 10], 61) === null);

  // (3g) council F2 detection: at a non-100 bounded total, NO clause of the label may still
  // say "100 %" — the exact contradiction the T=120 probe rendered before the fix.
  {
    const wide = E.mixBand(opus, gptC, SEL,
      { "blend.fam.nvidia": { lo: 58, hi: 80 }, "blend.fam.tpu": { lo: 30, hi: 62 } },
      { base: { blend: { h100: 30, h200: 40, tpu7: 50 } } });
    if (wide && !wide.refused && Math.abs(wide.T - 100) > 0.5) {
      assert("mix label: a non-100 bounded total never renders a '100 %' sum claim",
        !/sums? to 100 %/.test(wide.label), wide.label);
      assert("mix label: the non-100 label speaks the bounded providers' own total",
        wide.label.includes(String(Math.round(wide.T))), wide.label);
    } else {
      assert("mix label: T≠100 label probe produced a usable band", false, JSON.stringify(wide && wide.refused));
    }
  }

  // (4) k=2 reduces to the midpoint of the feasible interval (hand-provable)
  const k2 = E.centroidOnSum([0, 20], [80, 60], 100);
  // feasible x0 ∈ [max(0,100−60), min(80,100−20)] = [40, 80] → mean 60; x1 = 100 − x0 → 40
  assert("mean mix: k=2 collapses to the feasible-interval midpoint (60/40)",
    !!k2 && Math.abs(k2[0] - 60) < 1e-9 && Math.abs(k2[1] - 40) < 1e-9, JSON.stringify(k2));
}

console.log(failures ? `\n${failures} FAILED` : "\nall mix-band assertions green");
process.exit(failures ? 1 : 0);
