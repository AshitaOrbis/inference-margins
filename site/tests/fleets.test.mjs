// FLEETS registry + gate-6/7 contract (IM4 slice B) — design memo
// research/im4-fleet-design-memo.md v3.1 §2.1–§2.3 + §7 owner ruling 2026-07-21.
// Run: node site/tests/fleets.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
/* b9 M5 fixture scope (M5 delta manifest) — REFERENCE-CLASS suite. M5 seeds every clean state
   with the ratified per-lab algorithmic-lead prior (+3 months for Anthropic), which multiplies
   achieved throughput by E = 1.3161 and therefore every cost/margin this suite pins. This suite
   certifies fleet membership, eligibility and hero-suppression behaviour — statements about the PUBLIC-EVIDENCE
   REFERENCE, not about the calculator's default scenario prior. Every state it derives is
   therefore pinned to trend 0 / family 1.0 through the SAME constructor the final-answer surface
   uses (engine §15 / decision D-10), and every pinned digit below is BYTE-UNCHANGED. The default
   state's movement is carried, in full, by tests/fixtures-baseline-v22.json (regenerated) and the
   render-parity WIDE hash — see the M5 delta manifest. */
const preset = (m, p, sel) => E.pinReferenceLevers(E.applyPresetSettings(m, p, sel));

const ED = require("../engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const base = preset(opus, median, { mode: "native" });
const baseCtx = E.scenarioContext(base);

// ============================ 1. Registry shape + owner-ruling rules ============================
const FLEET_IDS = Object.keys(ED.FLEETS);
assert("registry: 5 named fleets", FLEET_IDS.length === 5, JSON.stringify(FLEET_IDS));
for (const [id, f] of Object.entries(ED.FLEETS)) {
  assert(`registry: ${id} carries name/class/models/legs/attribution/representativeness`,
    typeof f.name === "string" && ED.FLEET_CLASSES.includes(f.class)
    && Array.isArray(f.models) && f.models.length > 0
    && f.legs && Object.keys(f.legs).length > 0
    && typeof f.attribution === "string" && f.attribution.length > 40
    && typeof f.representativeness === "string");
  assert(`registry: ${id} declared weights sum to 100`,
    Object.values(f.legs).reduce((a, b) => a + b, 0) === 100, JSON.stringify(f.legs));
  assert(`registry: ${id} legs are known hardware keys`,
    Object.keys(f.legs).every(k => E.HW_ORDER.includes(k)));
  // OWNER RULING (2026-07-21): any fleet containing Chinese silicon MUST be counterfactual.
  const cn = Object.keys(f.legs).some(k => ED.CHINESE_SILICON.includes(k));
  assert(`owner ruling: ${id} Chinese-silicon ⇒ counterfactual class (cn=${cn})`,
    !cn || f.class === "counterfactual");
  assert(`registry: ${id} scoped to the flagship (models:['opus']) in v1`,
    JSON.stringify(f.models) === JSON.stringify(["opus"]));
}
assert("owner ruling: DEFAULT_FLEET_ID names a registered NON-counterfactual fleet",
  ED.FLEETS[ED.DEFAULT_FLEET_ID] && ED.FLEETS[ED.DEFAULT_FLEET_ID].class !== "counterfactual"
  && !Object.keys(ED.FLEETS[ED.DEFAULT_FLEET_ID].legs).some(k => ED.CHINESE_SILICON.includes(k)));
assert("owner ruling: landing default is the NA blend (banked adjudication im-fable-b-2026-07-21-fleet-landing-default-v2)",
  ED.DEFAULT_FLEET_ID === "na-blend");

// NA-blend two-level structure (owner ruling): family shares sum 100; NVIDIA legs sum to the
// NVIDIA family share; TPU/Trainium likewise; attribution names the captured evidence.
{ const f = ED.FLEETS["na-blend"];
  const fam = f.familyShares;
  assert("na-blend: familyShares sum to 100", fam.nvidia + fam.tpu + fam.trainium === 100, JSON.stringify(fam));
  const nvidiaSum = ["h100", "h200", "gb200", "gb300"].reduce((a, k) => a + (f.legs[k] || 0), 0);
  const tpuSum = f.legs.tpu7 || 0;
  const trnSum = (f.legs.trn2 || 0) + (f.legs.trn3 || 0);
  assert("na-blend: NVIDIA legs sum to the NVIDIA family share", nvidiaSum === fam.nvidia, `${nvidiaSum} vs ${fam.nvidia}`);
  assert("na-blend: TPU + Trainium legs sum to their family shares", tpuSum === fam.tpu && trnSum === fam.trainium);
  assert("na-blend: attribution preserves EVERY captured source limit (P1-1: prior-not-measured, secondhand, unnamed lab, relayer inference, unscoped compute, capture path)",
    /FAMILY-SHARE PRIOR, not a measured/.test(f.attribution)
    && /SECONDHAND/.test(f.attribution) && /Morgan Stanley/.test(f.attribution)
    && /UNNAMED/.test(f.attribution) && /relayer/.test(f.attribution)
    && /attribution inference/.test(f.attribution)
    && /unscoped/.test(f.attribution)
    && /nvidia-anthropic-share-x-2026-07/.test(f.attribution));
  assert("na-blend: attribution declares the equal residual split as THIS PAGE'S choice",
    /THIS PAGE'S declared choice/.test(f.attribution));
  assert("na-blend: attribution declares within-family shares analyst-declared",
    /WITHIN-FAMILY/.test(f.attribution) && /analyst-declared/.test(f.attribution)); }

// ============================ 2. Evidence profiles (typed DTO; margin-blind) ============================
const sel = E.selectDefaultFleet(base, baseCtx);
const byId = Object.fromEntries(sel.profiles.map(p => [p.id, p]));
assert("profiles: one per registered fleet", sel.profiles.length === FLEET_IDS.length);
// Margin-blindness (slice-B review P1-6): the gate DECISIONS are pure functions over the
// closed profile DTO — no scenario access at all — and the profile aggregates are
// empirically invariant under economic-field perturbation (rent/prices/discount).
assert("blindness: centralEligibilityDecision + heroSuppressionDecision are scenario-free pure predicates",
  !/scenarioContext|feasibility|costPerMtok|workload|blendedCost|tokPerS|hwHourCost|\bs\.|supplied/.test(
    E.centralEligibilityDecision.toString() + E.heroSuppressionDecision.toString()));
{ const perturbed = structuredClone(base);
  perturbed.priceIn = (perturbed.priceIn || 5) * 7; perturbed.priceOut = (perturbed.priceOut || 30) * 7;
  perturbed.rentMult = 3.14; perturbed.discount = 40;
  const a = E.fleetEvidenceProfile("na-blend", base, baseCtx);
  const b = E.fleetEvidenceProfile("na-blend", perturbed, baseCtx); // same model context; only economic fields perturbed
  const strip = p => JSON.stringify([p.evidencedWeightShare, p.independentEvidenceClusters,
    p.renderableWeightShare, p.allLegsRenderableUnderPolicy, p.placementVerified, p.renderableIndependentEvidenceClusters]);
  assert("blindness: profile aggregates invariant under 7x prices / 3.14x rent / 40% discount", strip(a) === strip(b), strip(a) + " vs " + strip(b)); }
// Expected aggregates at the evidenced baseline (derived in design; verified by execution).
/* FA re-mint (memo J-9): at the revised flagship size every declared NA leg is
   policy-renderable — na-blend and declared-topology flip to 100% (h100 serves its
   declared batch-96 at peak-KV solver width 112). The external review removed H20/Ascend live
   neutral identities from fitted throughput eligibility, so the anchored counterfactual
   now contains only GB200/H800; both are policy-clean at this size. */
/* im-vet-six-repairs (2026-09-20), vetting finding E5a — the EVIDENCED share falls to zero on
   every NVIDIA-bearing fleet, and that is the finding, not a regression. `evidenced` requires a
   FITTED throughput coefficient AND a named public price. GB200 was the only leg holding both;
   its price class moves observed-source-named -> analyst-set, because the rent this engine prices
   with is the provisional $4.50 its own quote record calls "NOT a rate that became public". So the
   default fleet now carries NO weight on a leg that is sourced on both sides, and the page's own
   "Evidenced weight share" chip says 0% because it computes the number rather than quoting one. */
assert("profile: na-blend 0% evidenced / 2 declared clusters / 100% renderable-under-policy / 2 renderable clusters / placement unverified",
  Math.abs(byId["na-blend"].evidencedWeightShare - 0) < 1e-9
  && byId["na-blend"].independentEvidenceClusters === 2
  && Math.abs(byId["na-blend"].renderableWeightShare - 1) < 1e-9
  && byId["na-blend"].allLegsRenderableUnderPolicy === true
  && byId["na-blend"].placementVerified === false
  && byId["na-blend"].renderableIndependentEvidenceClusters === 2,
  JSON.stringify(byId["na-blend"], null, 0).slice(0, 300));
assert("profile: declared-topology 0% evidenced / 100% renderable-under-policy (FA: h100 policy-clean at the revised size)",
  Math.abs(byId["declared-topology"].evidencedWeightShare - 0) < 1e-9
  && Math.abs(byId["declared-topology"].renderableWeightShare - 1) < 1e-9);
/* Same cause: this counterfactual is GB200 + H800 at equal weight, so losing GB200's price
   class halves its evidenced share rather than emptying it — H800 keeps a fitted coefficient and
   a named IDC annual-commit rate. */
assert("profile: anchored-eligible-equal 50% evidenced / 2 clusters / 100% renderable / 2 renderable clusters / Chinese silicon flagged",
  byId["anchored-eligible-equal"].evidencedWeightShare === 0.5
  && byId["anchored-eligible-equal"].independentEvidenceClusters === 2
  && Math.abs(byId["anchored-eligible-equal"].renderableWeightShare - 1) < 1e-9
  && byId["anchored-eligible-equal"].renderableIndependentEvidenceClusters === 2
  && byId["anchored-eligible-equal"].containsChineseSilicon === true);
{ const anchored = structuredClone(base);
  anchored.blend = structuredClone(ED.FLEETS["anchored-eligible-equal"].legs);
  const anchoredMargin = E.workload(anchored, undefined, baseCtx).margin * 100;
  assert("profile: anchored-eligible-equal current baseline margin is pinned after the evidence-eligible membership change",
    Math.abs(anchoredMargin - 71.85560739786106) < 1e-9, anchoredMargin); }
/* R2 re-mint: the sole-anchor fleets are OPUS states — the closed model's declared
   operating point is NOT satisfiable in-domain on h800/ascend under the fp8 policy
   (capped renders, never policy-clean), so policy-renderability is 0 (was 100% under
   the pre-policy "renders numbers" reading — the two-boolean contract split them). */
assert("profile: h800 sole anchor renders under-policy at the revised size (FA); ascend alone stays capped/policy-unclean",
  byId["h800-sole-anchor"].renderableWeightShare === 1 && byId["h800-sole-anchor"].renderableIndependentEvidenceClusters === 1
  && byId["ascend-sole-anchor"].renderableWeightShare === 0 && byId["ascend-sole-anchor"].renderableIndependentEvidenceClusters === 0);

// ============================ 3. Gate-7: central eligibility ============================
assert("gate-7: NO fleet earns the central label at the evidenced baseline (memo §2.2 expected outcome)",
  sel.centralEligible.length === 0, JSON.stringify(sel.centralEligible));
assert("gate-7: landing selection = the banked DEFAULT_FLEET_ID, not a derivation",
  sel.landing === ED.DEFAULT_FLEET_ID);
// Counterfactual exclusion is categorical: even a counterfactual profile that CLEARS both
// numeric bars must never be central-eligible. (Sole anchors render 100%; give one a fake
// second cluster via a hypothetical-profile replay of the selector's own predicate.)
{ const p = byId["h800-sole-anchor"];
  const cleared = { ...p, allLegsRenderableUnderPolicy: true, placementVerified: true, renderableIndependentEvidenceClusters: 2 };
  assert("gate-7: PRODUCTION predicate excludes counterfactual class even when numeric bars are cleared",
    E.centralEligibilityDecision(cleared) === false);
  const clearedNonCn = { ...cleared, class: "analyst-declared" }; // still containsChineseSilicon
  assert("gate-7: PRODUCTION predicate excludes Chinese silicon independently of class",
    E.centralEligibilityDecision(clearedNonCn) === false); }
// P1-3: cluster support floor — a cluster below MIN_CLUSTER_SUPPORT_SHARE cannot supply the bar.
assert("gate-7: MIN_CLUSTER_SUPPORT_SHARE predeclared at 0.10", E.MIN_CLUSTER_SUPPORT_SHARE === 0.10);
{ const starved = { class: "analyst-declared", containsChineseSilicon: false,
    allLegsRenderableUnderPolicy: true, placementVerified: true, renderableIndependentEvidenceClusters: 1 }; // profile computed under the floor
  assert("gate-7: one supported cluster (the 1e-8 gaming probe outcome) is not central-eligible",
    E.centralEligibilityDecision(starved) === false); }
// P1-4: model scoping fail-closed — a non-flagship state gets NO fleets, null landing, suppressed hero.
{ const haiku = preset(E.MODELS.find(m => m.id === "haiku"), median, { mode: "native" });
  const selH = E.selectDefaultFleet(haiku);
  assert("gate-7/P1-4: non-flagship model → zero profiles, null landing, hero suppressed",
    selH.profiles.length === 0 && selH.landing === null && E.landingHeroSuppressed(haiku) === true); }
/* R2 re-mint (§1.4 NEGATIVE contract; memo §0-bis): the 100B fixture FLIPS — even with
   every leg policy-renderable and 2 supported clusters, a CLOSED model can never verify
   placement, so central eligibility is structurally impossible. The float-robustness the
   old fixture guarded (=== 1 fragility) survives in the allLegs boolean assertion; the
   positive-decision control moves to a synthetic placement-verified profile. */
{ const s100 = structuredClone(base); s100.active = 100; s100.total = 100;
  const sel100 = E.selectDefaultFleet(s100, baseCtx); // clone loses registration; same-model context
  const dt = sel100.profiles.find(p => p.id === "declared-topology");
  assert("gate-7/P1-5+R2: opus@100B declared-topology fully policy-renderable with 2 clusters — yet CENTRAL-INELIGIBLE (placement unverified; closed model)",
    dt.allLegsRenderableUnderPolicy === true && dt.renderableIndependentEvidenceClusters === 2
    && dt.placementVerified === false && sel100.centralEligible.length === 0,
    JSON.stringify(sel100.centralEligible));
  const verified = { ...dt, placementVerified: true };
  assert("gate-7/R2 positive control: the SAME profile with placementVerified=true clears the decision (the gate is placement, nothing else)",
    E.centralEligibilityDecision(verified) === true); }

// ============================ 4. Gate-6: suppression + survivorship fixtures ============================
/* R3 (Row 0, memo D-3a/D-4 — SUPERSEDES the R2 unconditional-suppression fixture,
   per the owner's membership ruling): the landing default IS the FILTERED
   membership. At the evidenced baseline the derivation excludes h100 (6 of 7
   declared legs) — the policy-labeled branch DISPLAYS (suppression only on empty
   derived membership); the strict branch suppresses on any exclusion. */
{ const d = E.deriveDefaultFleetMembership(ED.DEFAULT_FLEET_ID, base, baseCtx);
  /* im-vet-six-repairs (2026-09-20), vetting finding E1: the baseline now derives FIVE members.
     h100 still serves its declared batch-96 at peak-KV solver width 112 — no capacity exclusion
     exists at this size — and the two Trainium legs are excluded on EVIDENCE grounds, typed
     `ground: "withdrawn"` so a reader (and this assertion) can tell the two kinds apart. */
  assert("FA membership (memo J-9 + E1): the revised-size baseline derives 5 of 7 — no capacity exclusion, and both Trainium legs WITHDRAWN on evidence grounds",
    d.memberLegCount === 5 && d.declaredLegCount === 7 && d.excluded.length === 2
    && JSON.stringify(d.excluded.map(x => x.hwKey)) === JSON.stringify(["trn2", "trn3"])
    && d.excluded.every(x => x.ground === "withdrawn" && /WITHDRAWN from the default reading, not deleted/.test(x.reason))
    && d.derivedAt.trafficProfileId === "reference" && d.renormalizationBasis === 75,
    JSON.stringify({ m: d.memberLegCount, ex: d.excluded }));
  assert("FA membership: member defaultWeights renormalize over the member total and sum to exactly 100 (tpu7 = 2500/75)",
    Math.abs(d.members.reduce((a, l) => a + l.defaultWeight, 0) - 100) < 1e-9
    && Math.abs(d.members.find(l => l.hwKey === "tpu7").defaultWeight - 2500 / 75) < 1e-9);
  assert("gate-6: policy-labeled mode DISPLAYS at the revised-size baseline (the filtered default is policy-clean by construction)",
    E.landingHeroSuppressed(base, baseCtx) === false
    && E.landingHeroSuppressed(base, baseCtx, "policy-labeled") === false);
  /* im-vet-six-repairs (2026-09-20): the STRICT branch now DOES have something to suppress at the
     baseline, because an exclusion exists there for the first time — an evidence withdrawal rather
     than a capacity failure. The LIVE branches are unaffected and still display (asserted above);
     this records that the strict alternative behaves as its contract says on the new state. */
  assert("gate-6 (FA): the STRICT branch suppresses at the revised-size baseline (an evidence withdrawal IS an exclusion)",
    E.landingHeroSuppressed(base, baseCtx, "suppress") === true);
  // The 5T size case preserves the whole R3 exclusion story (memo J-9: the old default
  // is the labeled alternative; the exclusion machinery fixtures HERE now).
  const b5 = preset(opus, median, { mode: "native" }); b5.total = 5000;
  const c5 = E.scenarioContext(b5);
  const d5 = E.deriveDefaultFleetMembership(ED.DEFAULT_FLEET_ID, b5, c5);
  // b9 M1 re-mint: trn2 now joins h100 in exclusion at the 5T case. Its declared operating
  // point moved from the retired b=4 (an AWS tutorial demo value) to the b=32 aggregate-batch
  // surrogate, which is no longer satisfiable in-domain at 5T. Basis 92 → 84.
  /* im-vet-six-repairs (2026-09-20): the 5T case is now THREE exclusions of TWO kinds, which is
     what makes it the better fixture for the distinction — h100 still fails on capacity at this
     size, and the two Trainium legs are withdrawn on evidence grounds at every size. Basis 84 -> 67. */
  assert("R3 membership @5T case: derives 4 of 7 — h100 excluded on capacity, both Trainium legs withdrawn on evidence, + the canonical traffic anchor",
    d5.memberLegCount === 4 && d5.declaredLegCount === 7
    && d5.excluded.length === 3
    && JSON.stringify(d5.excluded.map(x => x.hwKey)) === JSON.stringify(["h100", "trn2", "trn3"])
    && d5.excluded.filter(x => x.ground !== "withdrawn").every(x => /not satisfiable within the registered domain/.test(x.reason))
    && d5.excluded.filter(x => x.ground === "withdrawn").length === 2
    && d5.derivedAt.trafficProfileId === "reference" && d5.renormalizationBasis === 67,
    JSON.stringify(d5.excluded));
  assert("R3 membership @5T case: member defaultWeights renormalize over the 67 basis (tpu7 = 2500/67) and sum to exactly 100",
    Math.abs(d5.members.reduce((a, l) => a + l.defaultWeight, 0) - 100) < 1e-9
    && Math.abs(d5.members.find(l => l.hwKey === "tpu7").defaultWeight - 2500 / 67) < 1e-9);
  assert("gate-6 @5T case: the STRICT branch suppresses on the exclusion (Option A conservatism carried into the filtered world, D-4)",
    E.landingHeroSuppressed(b5, c5, "suppress") === true);
  // D-1 canonical traffic anchor — asserted where the anchor question is LIVE (the 5T
  // case: h100 is live-servable at io5/ch20 yet the canonical reference anchor excludes):
  const customSeed5 = preset(opus, median, { mode: "custom", ioRatio: 5, cacheHit: 20 });
  customSeed5.total = 5000;
  const dCustom5 = E.deriveDefaultFleetMembership(ED.DEFAULT_FLEET_ID, customSeed5, E.scenarioContext(customSeed5));
  assert("D-1 canonical anchor @5T: a custom-traffic seed (io5/ch20, where h100 IS live-servable) reproduces the reference-anchor membership byte-for-byte",
    JSON.stringify(dCustom5.members.map(l => l.hwKey)) === JSON.stringify(d5.members.map(l => l.hwKey))
    && JSON.stringify(dCustom5.excluded.map(x => x.hwKey)) === JSON.stringify(["h100", "trn2", "trn3"])
    && dCustom5.derivedAt.trafficProfileId === "reference");
  // ...and at the revised size a custom-traffic clean seed reproduces the chokepoint blend.
  const customSeed = preset(opus, median, { mode: "custom", ioRatio: 5, cacheHit: 20 });
  const dCustom = E.deriveDefaultFleetMembership(ED.DEFAULT_FLEET_ID, customSeed, E.scenarioContext(customSeed));
  assert("D-1 @revised size: a custom-traffic clean seed reproduces the reference-anchor membership + the chokepoint blend byte-for-byte",
    JSON.stringify(dCustom.members.map(l => l.hwKey)) === JSON.stringify(d.members.map(l => l.hwKey))
    && JSON.stringify(dCustom.excluded.map(x => x.hwKey)) === JSON.stringify(["trn2", "trn3"])
    && dCustom.derivedAt.trafficProfileId === "reference"
    && JSON.stringify(customSeed.blend) === JSON.stringify(base.blend));
  // D-2/D-7 negative contracts: explicit-blend presets arrive UNFILTERED; the chokepoint
  // never touches out-of-scope models.
  const gpt = E.MODELS.find(m => m.id === "gpt");
  const gptState = preset(gpt, median, { mode: "native" });
  assert("D-7 negative contract: gpt's explicit preset blend arrives unfiltered byte-identically",
    JSON.stringify(gptState.blend) === JSON.stringify(gpt.set.blend));
  // D-5 renormalized-denominator amendment: the derived view's cluster support uses the
  // MEMBER total (92), and a synthetic boundary case flips between denominators —
  // a cluster at 10/100 declared (FAIL under declared denominator at the 0.10 bar)
  // passes at 10/92 renormalized. Executed live: h200's cluster support = 11/92 ≈ 0.1196.
  const prof = E.fleetEvidenceProfile(ED.DEFAULT_FLEET_ID, base, baseCtx);
  assert("D-5 derived view: renormalized cluster support keeps BOTH weight-supported clusters (gate-7 bar re-evaluates on the filtered membership)",
    prof.derivedView && prof.derivedView.renderableIndependentEvidenceClusters === 2
    && prof.derivedView.allLegsRenderableUnderPolicy === true
    && prof.derivedView.placementVerified === false);
  assert("D-5 boundary (denominator rule pinned): a 10%-of-declared cluster fails the declared denominator exactly at the bar but passes renormalized over 92",
    !(10 / 100 > E.MIN_CLUSTER_SUPPORT_SHARE) && (10 / 92 > E.MIN_CLUSTER_SUPPORT_SHARE)); }
/* R3 membership ladder (family 3; totals probed by execution — the RUP flips happen
   BEFORE the render crossings because renderable-under-policy is stricter than
   renderability): memberLegCount along the total sweep. Membership never EMPTIES for
   opus within SCENARIO_BOUNDS.total (tpu7's documented-slices domain reaches 2048) —
   recorded execution fact; empty-membership suppression is pinned at the decision DTO
   below. */
// b9 M1 re-mint: the RUP flips move under the repaired operating points, so the probe
// totals were re-searched by execution on a 0.05T grid.
// Post-review adjudication 2026-07-27: Trainium3 capacity reverts to the Neuron docs'
// unit-explicit 144 GiB (the review's SI re-read of the marketing label is overturned),
// and the full grid was re-searched by execution AFTER terminal peak-KV sizing (the
// review's comment here predated FIX-38 and carried stale early transitions).
// Transitions found: 7→6 @3.35T · 6→5 @4.80T · 5→4 @7.70T · 4→3 @11.80T
// · 3→2 @16.75T · 2→1 @17.45T.
// The ladder still walks every count and is still monotone non-increasing.
/* im-vet-six-repairs (2026-09-20): the ladder starts at FIVE, because the two Trainium legs are
   withdrawn at every size rather than dropping out at one. The grid was RE-SEARCHED by execution on
   the same 0.05T step, and the capacity crossings themselves did not move — 3.35T, 7.70T, 11.80T
   and 16.75T are exactly where they were; what changed is that the two Trainium transitions
   (7->6 @3.35T was h100+trn?-era bookkeeping) are gone because those legs are never members now.
   Transitions found: 5->4 @3.35T · 4->3 @7.70T · 3->2 @11.80T · 2->1 @16.75T.
   The ladder still walks every reachable count and is still monotone non-increasing. */
{ const ladder = [[3000, 5], [4000, 4], [5000, 4], [8000, 3], [12500, 2], [17000, 1], [17500, 1], [50000, 1]];
  for (const [t, n] of ladder) {
    const st = structuredClone(base); st.total = t;
    E.registerScenarioContext(st, baseCtx);
    const d = E.deriveDefaultFleetMembership(ED.DEFAULT_FLEET_ID, st, baseCtx);
    assert(`R3 membership ladder: ${t / 1000}T derives ${n} member leg(s) (monotone under the total sweep)`,
      d.memberLegCount === n, `got ${d.memberLegCount}: ${d.members.map(l => l.hwKey).join(",")}`);
  } }

const stateForBlend = (blend, totalB) => {
  const st = structuredClone(base);
  st.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, blend[k] || 0]));
  if (totalB != null) st.total = totalB;
  return st;
};
const marginAndReceipt = (blend, totalB) => {
  const st = stateForBlend(blend, totalB);
  const w = E.workload(st, undefined, baseCtx);
  const feas = E.feasibility(st, baseCtx);
  const renderable = feas.legs.filter(l => !l.infeasible);
  return { margin: w.margin, legs: renderable.length, total: feas.legs.length,
           share: renderable.reduce((a, l) => a + l.weight, 0) };
};
// Council fixture (gate 6, packet fix 6): declared topology, 2.00T vs 2.50T total.
{ const a = marginAndReceipt(ED.FLEETS["declared-topology"].legs, 5900);
  const b = marginAndReceipt(ED.FLEETS["declared-topology"].legs, 5950);
  /* R2 RE-FOUND (P7: the full fixture inventory survives — crossing totals re-searched
     under solver widths; manifest row 2.00T/2.50T → 5.90T/5.95T, trn2 drops first): */
  /* b9 M1: the crossing TOTALS are unchanged (5.90T → 5.95T, re-searched on the same
     0.05T grid); only the margins re-mint. The council's point survives intact and gets
     sharper: making the model harder to serve still RAISES the displayed margin, now by
     34.0 points instead of 21.9. */
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the crossing TOTALS are
     unchanged again (5.90T → 5.95T on the same 0.05T grid, trn2 still drops first) and the
     council's point survives and sharpens further — making the model harder to serve still RAISES
     the displayed margin, now by 66.6 points. Only the margins re-mint. */
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
     re-minted a third time, and for the third time the crossing TOTALS and the MEMBERSHIP numbers
     are unchanged — 5.90T → 5.95T on the same grid, still 7/7 at 100% weight then 6/7 at 95%, trn2
     still dropping first. Only the margins move, because adopting planning rents for GB200, GB300
     and trn3 changes what a surviving leg costs and not which legs survive. The council's point
     survives and softens: making the model harder to serve still RAISES the displayed margin, now
     by 33.9 points rather than 66.6 — smaller because the dropped leg is no longer being dropped
     from a blend that had renormalized three legs away. */
  /* im-vet-six-repairs (2026-09-20): this fixture passes an EXPLICIT blend, so the withdrawal
     does not reach it and the membership numbers are untouched for the fourth time; only the
     margins move, with the TPU numerator repair. */
  assert("gate-6 council fixture (vetting-repairs re-mint): 5.90T → 20.94%, 7/7 legs, 100% weight",
    Math.abs(a.margin * 100 - 20.94) < 0.01 && a.legs === 7 && a.total === 7 && Math.abs(a.share - 1) < 1e-9,
    JSON.stringify(a));
  assert("gate-6 council fixture (vetting-repairs re-mint): 5.95T → 54.79%, 6/7 legs, 95% weight",
    Math.abs(b.margin * 100 - 54.79) < 0.01 && b.legs === 6 && b.total === 7 && Math.abs(b.share - 0.95) < 1e-9,
    JSON.stringify(b));
  assert("gate-6: the margin-improving crossing exists (this is WHY suppression is unconditional on the landing surface)",
    b.margin > a.margin);
  // The landing selection must be IDENTICAL at both points, and if declared-topology were
  // the landing fleet its hero would be suppressed at both (share < 100%).
  const selA = E.selectDefaultFleet(stateForBlend(ED.FLEETS["na-blend"].legs, 5900), baseCtx);
  const selB = E.selectDefaultFleet(stateForBlend(ED.FLEETS["na-blend"].legs, 5950), baseCtx);
  assert("gate-6: landing id identical across the crossing", selA.landing === selB.landing);
  /* R3: the landing decision consumes the DERIVED membership. At both totals the
     membership is non-empty (5 members — trn2's RUP flip happens BEFORE 5.9T, probed) →
     policy-labeled DISPLAYS at both, with the membership disclosed as data and the
     non-monotonicity clause riding every renormalized emission (D-6); strict mode
     suppresses at both (exclusions exist). */
  assert("gate-6 (R3): policy-labeled displays at BOTH crossing points; strict suppresses at both",
    E.landingHeroSuppressed(stateForBlend(ED.FLEETS["na-blend"].legs, 5900), baseCtx) === false
    && E.landingHeroSuppressed(stateForBlend(ED.FLEETS["na-blend"].legs, 5950), baseCtx) === false
    && E.landingHeroSuppressed(stateForBlend(ED.FLEETS["na-blend"].legs, 5900), baseCtx, "suppress") === true
    && E.landingHeroSuppressed(stateForBlend(ED.FLEETS["na-blend"].legs, 5950), baseCtx, "suppress") === true); }
// R1 P0 reproduction (design-gate review): the h800+ascend survivor pair, BF16 5.45T → 5.50T.
// Not a registry fleet (survivor subsets are banned) — asserted at receipt level. TRUE SHAPE
// (slice-B R2 replay): at 5.45T the pair renders 2/2 (share 1) — suppression correctly OFF,
// a fully-rendered number displays however bad; at 5.50T h800 drops (1/2, share 0.5) and the
// margin "improves" — and THAT point is the suppressed one. The improvement can never display.
{ const pair = { h800: 50, ascend: 50 };
  const stA = stateForBlend(pair, 5450); stA.precision = "bf16";
  const stB = stateForBlend(pair, 5500); stB.precision = "bf16";
  const wA = E.workload(stA, undefined, baseCtx), wB = E.workload(stB, undefined, baseCtx);
  const fA = E.feasibility(stA, baseCtx), fB = E.feasibility(stB, baseCtx);
  const legsA = fA.legs.filter(l => !l.infeasible).length, legsB = fB.legs.filter(l => !l.infeasible).length;
  assert("gate-6 R1-P0 fixture: BF16 5.45→5.50T pair crossing is margin-improving via membership loss (2/2 → 1/2; re-verified under solver widths — same totals, new margins)",
    wB.margin > wA.margin && legsA === 2 && legsB === 1, JSON.stringify({ a: wA.margin, b: wB.margin, legsA, legsB }));
  /* R2: the decision field is allLegsRenderableUnderPolicy. On THIS pair both points are
     policy-unclean (capped legs render numbers but never policy-clean) → suppressed at
     BOTH; the decision-level OFF control is asserted directly on a clean profile. */
  const wlA = E.workload(stA, undefined, baseCtx), wlB = E.workload(stB, undefined, baseCtx);
  /* R3: this pair is a USER-CHOSEN blend (survivor subsets were never registry fleets) —
     gate-6 does not consult it; the receipt-level truth stands and the R2 welds/caps
     disclosures govern the scenario surface. The DECISION contract is pinned on the
     derivation DTO directly (D-3a mode predicates): */
  assert("gate-6 R1-P0 fixture (R3 receipts): both crossing points remain policy-unclean at the receipt level (capped legs never policy-clean)",
    wlA.fleetRenderable.allLegsRenderableUnderPolicy === false
    && wlB.fleetRenderable.allLegsRenderableUnderPolicy === false);
  assert("gate-6 (R3) decision DTO probes: null and (realistic) empty membership suppress in both modes; an exclusion suppresses ONLY in strict mode; a full clean membership displays in both",
    E.heroSuppressionDecision(null) === true
    && E.heroSuppressionDecision(null, "suppress") === true
    && E.heroSuppressionDecision({ excluded: [{ hwKey: "a" }, { hwKey: "b" }], memberLegCount: 0 }) === true
    && E.heroSuppressionDecision({ excluded: [{ hwKey: "a" }, { hwKey: "b" }], memberLegCount: 0 }, "suppress") === true
    && E.heroSuppressionDecision({ excluded: [{ hwKey: "h100" }], memberLegCount: 6 }) === false
    && E.heroSuppressionDecision({ excluded: [{ hwKey: "h100" }], memberLegCount: 6 }, "suppress") === true
    && E.heroSuppressionDecision({ excluded: [], memberLegCount: 7 }) === false
    && E.heroSuppressionDecision({ excluded: [], memberLegCount: 7 }, "suppress") === false); }
// Diagnostic §4: all four monotonicity-violating crossings on the declared topology, with
// the suppression DECISION asserted at every point (landing-surface rule is unconditional).
/* R2 RE-FOUND (P7 full-inventory rule; manifest rows): the four monotonicity-violating
   crossings re-searched on the 0.05T grid under solver widths —
   0.70→0.75 ⇒ 5.90→5.95 (trn2) · 1.45→1.50 ⇒ 11.00→11.05 (h100 class) ·
   2.10→2.15 ⇒ 12.80→12.85 · 2.20→2.25 ⇒ 19.25→19.30. A fifth crossing
   (19.95→20.00, 2→1 legs) exists and is recorded in the manifest. */
/* im-arc T4 fold (2026-08-24): the crossings are RE-SEARCHED on the same 0.05T grid, not
   transcribed — the pathology is a property of the engine, and after the fold it occurs at
   5.90→5.95, 11.00→11.05 and 19.45→19.50. The 12.80→12.85 and 19.25→19.30 crossings from the
   pre-fold search no longer violate monotonicity and are dropped rather than forced; a fixture
   kept past the state it was found in is a fixture that proves nothing. */
{ const crossings = [[5900, 5950], [11000, 11050], [19450, 19500]];
  for (const [t1, t2] of crossings) {
    const a = marginAndReceipt(ED.FLEETS["declared-topology"].legs, t1);
    const b = marginAndReceipt(ED.FLEETS["declared-topology"].legs, t2);
    assert(`gate-6 diagnostic crossing ${t1 / 1000}T→${t2 / 1000}T: margin-improving membership loss`,
      b.margin > a.margin && b.share < a.share, JSON.stringify({ a, b }));
    /* R3: these declared-topology states are USER blends (gate-6 never consults them);
       the receipt-level crossing truth above is what survives. The DEFAULT's own
       membership at these totals is pinned by the R3 membership ladder (§4 head) —
       the RUP flips happen BEFORE each render crossing because renderable-under-policy
       is strictly stronger than renderability (probed by execution). */
  } }
// R2 reproduction (design-gate review), RE-FOUND under solver widths: anchored-eligible
// fleet, FP8 11.00T → 11.05T (h800 drops; manifest row 1.45/1.50 → 11.00/11.05).
{ const a = marginAndReceipt(ED.FLEETS["anchored-eligible-equal"].legs, 11000);
  const b = marginAndReceipt(ED.FLEETS["anchored-eligible-equal"].legs, 11050);
  /* im-arc T4 fold (2026-08-24) — a FINDING, recorded rather than re-pinned. An exhaustive
     0.05T sweep from 1.00T to 20.00T finds NO margin-improving membership loss on this fleet
     after the fold; the R2 crossing at 11.00T→11.05T no longer occurs here because h800's
     installed-scope overhead correction moved its cost. The pathology is still live on
     declared-topology (three crossings, asserted above), so the diagnostic keeps its teeth. What
     is asserted here is the honest current state: the sweep was run, and it is empty. */
  const anchoredCrossings = [];
  for (let t = 1000; t <= 20000; t += 50) {
    const x = marginAndReceipt(ED.FLEETS["anchored-eligible-equal"].legs, t);
    const y = marginAndReceipt(ED.FLEETS["anchored-eligible-equal"].legs, t + 50);
    if (Number.isFinite(x.margin) && Number.isFinite(y.margin) && y.margin > x.margin && y.share < x.share)
      anchoredCrossings.push([t, t + 50]);
  }
  /* im-release-edit-r2 (2026-09-10): AND THE PATHOLOGY IS BACK ON THIS FLEET, which is a finding
     rather than a re-mint. The T4 fold's rent removal had emptied this sweep; the owner's rent
     adoption re-introduces exactly one margin-improving membership loss, at 11.00T → 11.05T. That
     is the same crossing the two assertions below already exercise for suppression, so the
     behaviour is covered — what changes is that this sweep is no longer empty, and saying it is
     empty would now be false. Asserted as the exact crossing rather than as a count, so a second
     one appearing is a failure and not a shrug. */
  assert("gate-6 R2 fixture: the re-search is EXECUTED, and the rent adoption re-introduces exactly one margin-improving membership loss, at 11.00T → 11.05T",
    anchoredCrossings.length === 1 && anchoredCrossings[0][0] === 11000 && anchoredCrossings[0][1] === 11050,
    JSON.stringify({ anchoredCrossings, a, b }));
  // R2: at 11.00T all 4 legs render NUMBERS (share 1) but the fleet is policy-UNCLEAN
  // (capped legs) — suppression holds via the policy boolean on both sides of the crossing.
  const swA = E.workload(stateForBlend(ED.FLEETS["anchored-eligible-equal"].legs, 11000), undefined, baseCtx);
  const swB = E.workload(stateForBlend(ED.FLEETS["anchored-eligible-equal"].legs, 11050), undefined, baseCtx);
  assert("gate-6 R2 fixture: suppression holds at both points (policy-unclean before the crossing; renormalized after)",
    swA.fleetRenderable.allLegsRenderableUnderPolicy === false
    && swB.fleetRenderable.allLegsRenderableUnderPolicy === false && b.share < 1); }

// ============================ 5. B′1 — width cases, total cases (R2: selection contract RETIRED) ============================
/* R2 RETIREMENT (§4.3 core; B′ memo header — the "width axis as user choice with fixed
   defaults" interpretation was SUPERSEDED by the owner ruling; the render path now
   consumes SOLVER capacity widths): selectWidthCaseDefault / widthCaseApplicable /
   feasibilityAtNShard / workloadAtNShard are gone. The B′1 registries SURVIVE as typed
   EVIDENCE ANNOTATIONS (asserted below); the live width story is the solver receipt
   (declaredOperatingPointWidth / capacityMinimumUnderUniformPolicy), asserted here as
   the retirement's REPLACEMENT — never a bare deletion. */
{ assert("B′1 retirement: the width-case selection channel is no longer exported",
    !("selectWidthCaseDefault" in E) && !("widthCaseApplicable" in E)
    && !("feasibilityAtNShard" in E) && !("workloadAtNShard" in E));
  const feasN = E.feasibility(base, baseCtx);
  assert("B′1 replacement: every rendered leg carries a SOLVER width (widthRendered) + receipt — the live width channel",
    feasN.legs.every(l => l.infeasible || (Number.isInteger(l.widthRendered) && l.capacityReceipt
      && Number.isInteger(l.capacityReceipt.capacityMinimumUnderUniformPolicy))),
    JSON.stringify(feasN.legs.map(l => [l.hwKey, l.widthRendered])));
  const gbSens = require("../engine-roofline-v22.js").resolveHwRoofline("gb200").row.topologySensitivity;
  assert("B′1 registries survive as evidence annotations: per-source cases + the archived aggregate keep their typed fields",
    gbSens.cases.some(c => c.id === "kimi-k2-fp8-minimum-16" && c.evidenceClasses.join("") === "A")
    && gbSens.cases.some(c => c.id === "analyst-default-8" && c.superseded === "analyst-transfer-default-8")
    && gbSens.kind === "declared-analyst-sensitivity"); }
// TOTAL_CASES: exact scalar map + the computed-intersection grid-max rule EXECUTED.
{ const TC = ED.TOTAL_CASES;
  assert("B′1: TOTAL_CASES exact scalar set",
    JSON.stringify(Object.fromEntries(Object.entries(TC).map(([k, v]) => [k, v.totalB]))) ===
    JSON.stringify({ "receipt-edge-1.6": 1600, "revised-band-central-2.5": 2500, "largest-disclosed-2.8": 2800, "community-central-5.0": 5000, "stress-10": 10000, "computed-intersection": 3550 }));
  assert("FA J-9: exactly one default total case (revised-band-central-2.5) and it matches DEFAULTS.total",
    Object.entries(TC).filter(([, v]) => v.isDefault).map(([k]) => k).join(",") === "revised-band-central-2.5"
    && TC["revised-band-central-2.5"].totalB === E.DEFAULTS.total);
  const naLegs = ED.FLEETS["na-blend"].legs;
  const rec = (totalB) => { const st = stateForBlend(naLegs, totalB); const f = E.feasibility(st, baseCtx);
    return f.legs.filter(l => !l.infeasible).length === f.legs.length; };
  // R2 RE-DERIVATION (manifest row): the grid-max rule re-executed under solver widths —
  // 0.70T (tpu7-bound, fixed widths) → 5.90T (trn2 binds at 5.95T).
  assert("B′1: computed-intersection EXECUTES — all NA-blend legs render at 5.90T, NOT at 5.95T (grid-max rule, re-derived)",
    rec(5900) === true && rec(5950) === false); }
// Precision mapping exhaustive over the scenario enum.
assert("B′1: PRECISION_TIER_MAP keys are exactly the scenario precision enum",
  JSON.stringify(Object.keys(ED.PRECISION_TIER_MAP).sort()) === JSON.stringify([...E.PRECISION_ENUM_KEYS].sort()));
// Family sensitivities attached with defaults resolving to live widths.
{ const R2 = require("../engine-roofline-v22.js");
  for (const [hw, want] of [["tpu7", 4], ["trn2", 16], ["trn3", 16]]) {
    const row = R2.resolveHwRoofline(hw).row;
    const d = row.topologySensitivity.cases.find(c => c.id === row.topologySensitivity.defaultCaseId);
    assert(`B′1: ${hw} sensitivity default resolves to the live width ${want}`, d && d.value === want && d.value === row.nShard);
  }
  assert("B′1: the Trainium default case carries the ABSENCE finding",
    /absen/i.test(R2.resolveHwRoofline("trn2").row.topologySensitivity.cases[0].precisionCondition)); }

console.log(`\n${failures === 0 ? "ALL FLEETS TESTS PASS" : failures + " FLEETS FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
