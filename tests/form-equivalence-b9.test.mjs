/* b9 M2 — form-equivalence suite (memo `research/b9-m2-form-memo.md` v5 §10).
   Proves the topology-aware form ships WITHOUT moving a number, and that every guard the
   milestone adds actually fires. Run: node tests/form-equivalence-b9.test.mjs */
import { createRequire } from "module";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-v22.js");
const R = require("../site/engine-roofline-v22.js");

let pass = 0, fail = 0;
const assert = (name, ok, detail = "") => {
  if (ok) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
};
const throws = (name, fn, re) => {
  try { fn(); assert(name, false, "did NOT throw"); }
  catch (e) { assert(name, re.test(e.message), e.message); }
};

/* b9 M5 fixture scope (M5 delta manifest): this suite certifies the M2 EQUATION FORM against its
   pre-M2 calibrated operating points. M5 adds a post-roofline scenario-prior multiplier whose
   default is nonzero for Anthropic (+3 months), which would scale every pin here by E = 1.3161
   and mask the very identity under test. The shared state is therefore pinned to the trend-0 /
   family-1.0 REFERENCE — the same constructor the FA uses (engine §15 pin). Every M1_TOKPERS and
   M1_MARGIN pin below is byte-unchanged; only the state the form is exercised at is stated
   explicitly. The lever's own exactness is asserted in tests/trendline-interlock-b9.test.mjs. */
const s = E.pinReferenceLevers(E.applyPresetSettings(E.MODELS.find(x => x.id === "opus"),
  E.PERSPECTIVES.find(x => x.id === "median"), { mode: "native" }));
const LEGS = Object.keys(s.blend).filter(k => s.blend[k] > 0);

/* ---------- 1. Form equivalence: BYTE-identical, not merely close (memo §10.1) ----------
   Six legs keep `active-parameter-surrogate` and tpu7 keeps `replica-resident-distinct`, so
   M2 must reproduce M1 EXACTLY. Tolerance language is reserved for the anchor replays below.
   These values are M1's, engine-derived and gate-verified across five review rounds. */
// FULL DOUBLES, captured by executing the engine at the pre-M2 commit 716bf66 in a throwaway
// worktree and diffing against the working tree — NOT transcribed from printed output. (An
// earlier cut of this suite pinned hand-typed digits and failed against the very code it was
// meant to certify; the pins below are byte-equal at both commits.)
/* im-vet-six-repairs (2026-09-20), vetting findings E1 + E2. TWO changes reach this table and
   NEITHER is a form change, which is what this file certifies:
     - tpu7 393.15309363037676 -> 370.9935556257555, because its decode coefficient was corrected
       onto ONE STATED TIMING CONVENTION (0.55 -> 0.519; it passed through 0.521 for part of the
       day and the completion gate refused that, see engine-data-v22.js). Throughput scales with
       η exactly: 370.9935556257555 / 393.15309363037676 = 0.519/0.55 to the bit.
     - trn2 and trn3 leave the table entirely, because both legs are WITHDRAWN from the default
       fleet on evidence grounds, so `LEGS` (which reads the state's live blend) no longer
       contains them. Their doubles are kept below as the record of what they were, unpinned:
       trn2 105.66123177448141, trn3 178.53104679136516. The five surviving doubles are
       byte-identical, which is the evidence this leg touched a coefficient and a membership and
       nothing about the model's form. */
const M1_TOKPERS = {
  h100: 286.1872031018027, h200: 410.0592760861651, gb200: 875.2294556284228,
  gb300: 394.9383307836918, tpu7: 370.9935556257555,
};
/* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
   M1_MARGIN is the value the M2 form-equivalence property holds AT, not the property itself. The
   property — re-expressing the blend must not move the number by one bit — is unchanged and every
   assertion below still demands byte-equality. The rent adoption prices GB200, GB300 and trn3, so
   the value moves 0.5117863577679238 → 0.5841067415764696. NOTE WHAT DID NOT MOVE: every one of the
   seven M1_TOKPERS throughput doubles above is byte-identical, which is the evidence this ruling
   touched procurement and nothing about the model's form. */
const M1_MARGIN = 0.5841067415764696;  // im-vet-six-repairs (2026-09-20): the value the property holds AT moves with the two repairs, and again when E2 was put on a consistent basis; the byte-equality property below is unchanged
for (const k of LEGS) {
  const got = E.tokPerS(E.HW[k], s, "out");
  assert(`form equivalence: ${k} decode throughput BYTE-identical to pre-M2`, got === M1_TOKPERS[k],
    `got ${got} want ${M1_TOKPERS[k]}`);
}
assert("form equivalence: the blended margin is BYTE-identical to pre-M2",
  E.workload(s).margin === M1_MARGIN, String(E.workload(s).margin));

/* ---------- 1b. ABSOLUTE GOLDENS ON THE DECLARED FLEET (bq-2894) ----------
   RESTORED 2026-09-20 (im-vet-six-repairs), after the Astra xhigh review measured what the E1
   re-scope had cost and the completion gate ruled it back in. The loop above reads `LEGS`, which
   is the LIVE blend, so when trn2 and trn3 were withdrawn from the default fleet they simply left
   the table — and with them went the only absolute pin on a Trainium throughput. The review
   demonstrated the hole rather than asserting it: raising the Trainium2 decode coefficient by 10%
   passed all 154 checks in this file.

   The fix is to pin the DECLARED fleet, not the rendered one. A withdrawal is a statement about
   which legs enter a reading; it is not a statement that the page no longer computes a throughput
   for those legs, and it must not be able to silence a guard. These goldens therefore name every
   declared leg explicitly and are independent of membership: a future withdrawal, or a future
   re-admission, changes nothing here. */
const DECLARED_LEGS = Object.keys(D.FLEETS[D.DEFAULT_FLEET_ID].legs);
const DECLARED_TOKPERS = {
  ...M1_TOKPERS,
  /* withdrawn from the default reading, still computed, still pinned */
  trn2: 105.66123177448141, trn3: 178.53104679136516,
};
assert("declared-fleet goldens: every DECLARED leg has an absolute pin, membership notwithstanding",
  DECLARED_LEGS.every(k => typeof DECLARED_TOKPERS[k] === "number"),
  JSON.stringify(DECLARED_LEGS.filter(k => typeof DECLARED_TOKPERS[k] !== "number")));
assert("declared-fleet goldens: the withdrawn legs are IN this table (that is the point of it)",
  DECLARED_LEGS.includes("trn2") && DECLARED_LEGS.includes("trn3"),
  JSON.stringify(DECLARED_LEGS));
for (const k of DECLARED_LEGS) {
  const got = E.tokPerS(E.HW[k], s, "out");
  assert(`declared-fleet golden: ${k} decode throughput is byte-identical`, got === DECLARED_TOKPERS[k],
    `got ${got} want ${DECLARED_TOKPERS[k]}`);
}
/* THE MUTATION PROOF, executed rather than promised. The review's exact probe: move the Trainium2
   decode coefficient 10% and require this table to go RED. A restored golden that cannot fail
   under the mutation that exposed its absence would be theatre. */
{
  const before = D.CALIBRATION.trn2.etaDec;
  D.CALIBRATION.trn2.etaDec = before * 1.10;
  const mutated = E.tokPerS(E.HW.trn2, s, "out");
  D.CALIBRATION.trn2.etaDec = before;
  const restored = E.tokPerS(E.HW.trn2, s, "out");
  assert("declared-fleet goldens MUTATION PROOF: a 10% Trainium2 coefficient move BREAKS the golden",
    mutated !== DECLARED_TOKPERS.trn2, `mutated ${mutated} vs golden ${DECLARED_TOKPERS.trn2}`);
  assert("declared-fleet goldens MUTATION PROOF: ...and the probe leaves the registry exactly as it found it",
    restored === DECLARED_TOKPERS.trn2 && D.CALIBRATION.trn2.etaDec === before,
    `restored ${restored}`);
}
/* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
   the milestone's acceptance figure was 51.1786% for a reference computed over the four legs that
   priced. Adopting planning rents for GB200, GB300 and trn3 prices all seven and the reference is
   58.4305%. The M2 form-equivalence PROPERTY this file exists for is untouched — re-expressing the
   blend must not move the number — and it is still asserted byte-identically below; what moved is
   the number the property holds AT. */
assert("form equivalence: reference blend still 58.4107% (the milestone's acceptance, re-minted at the 2026-09-20 vetting repairs)",
  Math.abs(E.workload(s).margin * 100 - 58.4107) < 5e-5, String(E.workload(s).margin * 100));
/* im-arc T2 (memo §2): named/ordinary states now travel through one resolved
   section, while the flattened view remains the byte-exact legacy consumer input. */
{ const flat = E.resolveFleetLegs(s), sections = E.resolveFleetSections(s);
  const weights = E.blendWeights(s);
  assert("form equivalence: one-section migration preserves every flattened leg weight and row identity",
    sections.length === 1 && sections[0].section.basis !== "inherit"
      && flat.length === Object.keys(weights).length
      && flat.every(row => row.wt === weights[row.k] && row.hw === E.HW[row.k] && row.cfLeg === null));
  assert("form equivalence: ordinary workload carries one typed composition entry without moving margin",
    E.workload(s).composition.length === 1 && E.workload(s).margin === M1_MARGIN); }

/* ---------- 2. The typed trio is REQUIRED on every row — no implementer default ---------- */
for (const [k, cal] of Object.entries(D.CALIBRATION)) {
  assert(`typing: CALIBRATION.${k} declares decodeTrafficBasis`,
    D.DECODE_TRAFFIC_BASES.includes(cal.decodeTrafficBasis), String(cal.decodeTrafficBasis));
  assert(`typing: CALIBRATION.${k} declares etaRepresentation matching its basis (run B §A4)`,
    cal.etaRepresentation === cal.decodeTrafficBasis,
    `${cal.etaRepresentation} vs ${cal.decodeTrafficBasis}`);
  assert(`typing: CALIBRATION.${k} declares a finite nPhysDeclared (registry constant, §4)`,
    Number.isFinite(cal.nPhysDeclared) && cal.nPhysDeclared >= 1, String(cal.nPhysDeclared));
}
assert("typing: the retired M1 field `declaredReplicaWidth` is gone (one width field per row)",
  Object.values(D.CALIBRATION).every(c => c.declaredReplicaWidth === undefined));
assert("typing: DECODE_TRAFFIC_BASES is the 3-member closed set (M1's 2 + expert-coverage)",
  D.DECODE_TRAFFIC_BASES.length === 3 && D.DECODE_TRAFFIC_BASES.includes("expert-coverage"),
  D.DECODE_TRAFFIC_BASES.join(","));
assert("typing: BATCH_QUANTITIES carries run B §A1's three quantities + the declared surrogate",
  D.BATCH_QUANTITIES.length === 4 && D.BATCH_QUANTITIES.includes("B_rep") &&
  D.BATCH_QUANTITIES.includes("B_rep_consumed_as_B_out_per_chip"), D.BATCH_QUANTITIES.join(","));
/* Family 3 (Polaris adjudication 2026-07-27, option 3): every cell states its quantity, and the
   trn2/trn3 cells whose own basis prose calls them replica-global are TYPED as the cross-quantity
   surrogate rather than silently read as per-chip. `fast` (b=1) is genuinely the per-chip share of
   the online recipe (16/16), so it is NOT tagged as the surrogate — the tag tracks evidence, not
   convenience. This suite is what stops a later edit from quietly widening or narrowing it. */
{
  const cells = Object.entries(D.OPERATING_POINTS).flatMap(([hw, regimes]) =>
    Object.entries(regimes).filter(([, c]) => c && typeof c === "object").map(([r, c]) => [`${hw}.${r}`, c]));
  assert("family 3: EVERY operating-point cell declares a valid batchQuantity",
    cells.length === 31 && cells.every(([, c]) => D.BATCH_QUANTITIES.includes(c.batchQuantity)),
    cells.filter(([, c]) => !D.BATCH_QUANTITIES.includes(c.batchQuantity)).map(([k]) => k).join(","));
  const SURR = "B_rep_consumed_as_B_out_per_chip";
  const surrogates = cells.filter(([, c]) => c.batchQuantity === SURR).map(([k]) => k).sort();
  assert("family 3: the declared surrogate is scoped to EXACTLY trn2/trn3 balanced+batch",
    JSON.stringify(surrogates) === JSON.stringify(["trn2.balanced", "trn2.batch", "trn3.balanced", "trn3.batch"]),
    surrogates.join(","));
  assert("family 3: trn2/trn3 `fast` stays a TRUE per-chip share (b=1 = online 16/16), not the surrogate",
    D.OPERATING_POINTS.trn2.fast.batchQuantity === "B_out_per_chip" &&
    D.OPERATING_POINTS.trn3.fast.batchQuantity === "B_out_per_chip");
  // The adjudication REQUIRES the surrogate to carry its exposure and its retirement path. Assert
  // that against the registry SOURCE, so deleting the disclosure is a test failure rather than a
  // silent downgrade of a stated-and-typed conflation back into an invisible one.
  const src = readFileSync(new URL("../site/engine-data-v22.js", import.meta.url), "utf8");
  const member = src.slice(src.indexOf("B_rep_consumed_as_B_out_per_chip"));
  assert("family 3: the surrogate documents its measured exposure (105.6612 vs 6.9622, 15.2x)",
    /105\.6612/.test(src) && /6\.9622/.test(src) && /15\.2x/.test(src));
  assert("family 3: the surrogate names run B's self-contradiction (§A3 vs §C1) as its reason",
    /§A3/.test(src) && /§C1/.test(src));
  assert("family 3: the surrogate carries its family-9 disclosure duty and a retirement path",
    /debt-disclosure/.test(src) && /RETIRES this member/.test(src));
}

/* ---------- 3. Fail-closed guards actually FIRE (memo §10.6) ----------
   Four separate mutation probes. Each restores the row in `finally` so the suite cannot
   leave the registry poisoned for a later assertion. */
const arch = R.resolveArch("opus", undefined);
const call = (hwKey, extra = {}) => R.decodeRoofline({
  arch, activeB: s.active, totalB: s.total, hwKey, b: 16, L: 15500, precision: "fp8", ...extra });
const mutate = (hwKey, patch, fn) => {
  const cal = D.CALIBRATION[hwKey], saved = { ...cal };
  Object.assign(cal, patch);
  try { fn(); } finally { for (const key of Object.keys(cal)) delete cal[key]; Object.assign(cal, saved); }
};
mutate("tpu7", { decodeTrafficBasis: undefined }, () =>
  throws("guard: absent decodeTrafficBasis is a typed error, NOT a silent surrogate fallback",
    () => call("tpu7"), /no decodeTrafficBasis — REQUIRED since b9 M2/));
mutate("tpu7", { etaRepresentation: undefined }, () =>
  throws("guard: absent etaRepresentation is a typed error",
    () => call("tpu7"), /no etaRepresentation — REQUIRED since b9 M2/));
mutate("tpu7", { etaRepresentation: "active-parameter-surrogate" }, () =>
  throws("guard: reading an η outside its declared representation is FORBIDDEN (run B §A4)",
    () => call("tpu7"), /FORBIDDEN \(run B §A4\)/));
mutate("tpu7", { nPhysDeclared: undefined }, () =>
  throws("guard: a topology-aware basis without nPhysDeclared is a typed error",
    () => call("tpu7"), /no finite nPhysDeclared — REQUIRED since b9 M2/));
mutate("tpu7", { decodeTrafficBasis: "expert-coverage", etaRepresentation: "expert-coverage" }, () =>
  throws("guard: expert-coverage without a placement record refuses (no default geometry)",
    () => call("tpu7"), /without a placement record/));
mutate("tpu7", { decodeTrafficBasis: "not-a-basis", etaRepresentation: "not-a-basis" }, () =>
  throws("guard: an unknown basis is rejected against the closed set",
    () => call("tpu7"), /unknown decodeTrafficBasis/));
assert("guard probes restored the registry (tpu7 basis intact after mutation)",
  D.CALIBRATION.tpu7.decodeTrafficBasis === "replica-resident-distinct" &&
  D.CALIBRATION.tpu7.nPhysDeclared === 16);

/* ---------- 4. N-independence under ideal sharding (memo §1.3/§10.2) ----------
   Holding B_rep fixed and varying N_phys must leave per-chip throughput byte-identical.
   This is M1's proven guarantee (393.153094 across widths 4/16/32/64/256) re-asserted
   through the general form: b = B_rep/N_phys, so b and N_phys move together. */
{
  const B_REP = 256, base = D.CALIBRATION.tpu7.nPhysDeclared;
  const vals = [];
  for (const N of [4, 16, 32, 64, 256]) {
    const cal = D.CALIBRATION.tpu7, saved = cal.nPhysDeclared;
    cal.nPhysDeclared = N;
    try { vals.push(call("tpu7", { b: B_REP / N }).tokPerS); } finally { cal.nPhysDeclared = saved; }
  }
  assert("N-independence: T_chip byte-identical across N_phys 4/16/32/64/256 at fixed B_rep",
    vals.every(v => v === vals[0]), vals.join(" | "));
  assert("N-independence: the swept row was restored", D.CALIBRATION.tpu7.nPhysDeclared === base);
}

/* ---------- 5. The §0-bis firewall, extended to every representation (memo §10.3) ----------
   The guarantee is that the capacity-only loadedWeightBytesPerParam policy has NO route into a
   calibrated throughput term. It is NOT that cost is invariant — the solved WIDTH moving is the
   disclosed economic channel (calibration-invariant-r1 pins that separately as capacity 12/14/20).
   The M2-specific property is therefore: the MoE weight-traffic term does not depend on the width
   the solver hands the roofline, under EITHER representation. Under the surrogate that holds
   because W_iter is width-independent; under the topology-aware bases it holds because N_phys is a
   DECLARED registry constant. If a future edit divided by the solved width instead, this fails. */
for (const k of LEGS) {
  const dom = D.HW_DOMAINS[k];                                   // the row's REGISTERED shape set
  const legal = dom ? E.enumerateLegalWidths(dom.scaleUp.hardwareLegalShapes) : [];
  const probe = legal.filter((w, i) => i === 0 || i === Math.floor(legal.length / 2) || i === legal.length - 1);
  const traffic = probe.map(w => call(k, { b: 16, declaredOperatingWidth: w }).wIterBytes);
  assert(`firewall: ${k} MoE weight traffic independent of the solver-supplied width (${probe.join("/")})`,
    probe.length >= 2 && traffic.every(v => v === traffic[0]),
    probe.length < 2 ? "NOT EXERCISED — fewer than 2 legal widths (vacuous, treat as FAIL)" : traffic.join(" | "));
}

/* ---------- 6. Coverage-term correctness + its DIRECTION (memo §3.2/§10.7) ---------- */
{
  const Ee = 256, k = 8;
  // Top-k routing chooses k DISTINCT experts per token. The probability that a
  // particular expert is missed by one token is therefore 1-k/E, not
  // (1-1/E)^k (which incorrectly models k draws with replacement).
  const cov = (B, q = 1) => 1 - Math.pow(1 - k / Ee, B * q);
  const table = { 1: 0.03125, 8: 0.22430, 16: 0.39829, 32: 0.63794, 64: 0.86892, 96: 0.95254, 128: 0.98282 };
  for (const [B, want] of Object.entries(table))
    assert(`coverage: B_rep=${B} at E=256,k=8,q=1 → ${want}`,
      Math.abs(cov(Number(B)) - want) < 5e-5, cov(Number(B)).toFixed(6));
  const saturationGroups = Math.ceil(Math.log(1e-9) / Math.log(1 - k / Ee));
  assert("coverage: exact top-k residual first reaches ≤1e-9 at 653 token groups",
    saturationGroups === 653
      && Math.pow(1 - k / Ee, saturationGroups) <= 1e-9
      && Math.pow(1 - k / Ee, saturationGroups - 1) > 1e-9,
    `${saturationGroups}: ${Math.pow(1 - k / Ee, saturationGroups).toExponential(3)}`);
  // Design gate R5: uniform is the coverage MAXIMUM (concavity + Jensen), not a favourable
  // lower bound. Concentrating the same routing mass on fewer experts LOWERS coverage.
  const fleetCov = (spread) => spread * (1 - Math.pow(1 - k / spread, 64)) / Ee;
  assert("coverage DIRECTION: uniform (256) ≥ concentrated (128) ≥ concentrated (64)",
    fleetCov(256) > fleetCov(128) && fleetCov(128) > fleetCov(64),
    [fleetCov(256), fleetCov(128), fleetCov(64)].map(v => v.toFixed(5)).join(" > "));
  assert("coverage DIRECTION: the corrected without-replacement counterexample reproduces (uniform .86892, 128-spread .49196)",
    Math.abs(fleetCov(256) - 0.86892) < 5e-5 && Math.abs(fleetCov(128) - 0.49196) < 5e-5,
    `${fleetCov(256).toFixed(5)} / ${fleetCov(128).toFixed(5)}`);
}

/* ---------- 7. q/a and the MTP double-count guard (memo §7, run B §B10) ---------- */
{
  const g = call("tpu7");
  assert("q/a: exposed explicitly on the decode surface (run B §B10 replacement fields)",
    g.q === 1 && g.a === 1, `q=${g.q} a=${g.a}`);
  const cells = Object.entries(D.OPERATING_POINTS).flatMap(([hw, regimes]) =>
    Object.entries(regimes).filter(([, c]) => c && c.b !== undefined).map(([r, c]) => [`${hw}.${r}`, c]));
  assert("q/a: DECLARED on every operating-point cell, not hardcoded in the roofline",
    cells.length === 21 && cells.every(([, c]) => c.q === 1 && c.a === 1),
    `${cells.filter(([, c]) => c.q === 1 && c.a === 1).length}/${cells.length}`);
  assert("q/a: the declared floor reproduces pre-M2 exactly (fields added, no behaviour bought)",
    E.tokPerS(E.HW.tpu7, s, "out") === M1_TOKPERS.tpu7);

  // Run B §B10's closing instruction as a GUARD, not a comment: "Do not apply one universal
  // multiplier." Some anchors already contain MTP (their η absorbed it); crediting `a` on top of
  // those double-counts. Every anchor record must therefore STATE whether MTP is inside it, and
  // ignorance must be null-with-a-basis rather than a convenient false.
  const anchors = Object.entries(D.CALIBRATION).filter(([, c]) => c.calObs);
  for (const [k, c] of anchors) {
    const v = c.calObs.anchorAlreadyIncludesMTP;
    assert(`MTP: ${k} anchor states anchorAlreadyIncludesMTP (true|false|null)`,
      v === true || v === false || v === null, String(v));
    if (v === null)
      assert(`MTP: ${k} declares WHY it is unknown (ignorance is first-class, never a default false)`,
        typeof c.calObs.anchorAlreadyIncludesMTPBasis === "string" && c.calObs.anchorAlreadyIncludesMTPBasis.length > 20);
  }
  assert("MTP: the flag is DERIVED from each anchor's own obsQ/obsA, not asserted",
    anchors.every(([, c]) => {
      const o = c.calObs, v = o.anchorAlreadyIncludesMTP;
      if (o.obsQ == null || o.obsA == null) return v === null;   // no q/a recorded ⇒ must be unknown
      return v === (o.obsQ > 1 || o.obsA > 1);                   // speculation present ⇒ true
    }), anchors.map(([k, c]) => `${k}:${c.calObs.anchorAlreadyIncludesMTP}`).join(" "));
  assert("MTP: no row credits a > 1 while its anchor already contains MTP (double-count guard)",
    Object.entries(D.OPERATING_POINTS).every(([hw, regimes]) => {
      const c = D.CALIBRATION[hw];
      if (!c || !c.calObs || c.calObs.anchorAlreadyIncludesMTP !== true) return true;
      return Object.values(regimes).every(cell => !cell || cell.a === undefined || cell.a === 1);
    }));
}

/* ---------- 8. The topology surface is DERIVED, not stored (memo §6.1) ---------- */
{
  const g = call("tpu7", { b: 16 });
  assert("topology: B_rep is derived as b × N_phys (16 × 16 = 256), never read off an untyped cell",
    g.bRep === 256, String(g.bRep));
  assert("topology: nPhysDeclared surfaces on the decode result", g.nPhysDeclared === 16, String(g.nPhysDeclared));
  assert("topology: a surrogate row reports no N_phys-derived batch (the term does not apply)",
    call("h100", { b: 96 }).bRep === null);
}

/* ---------- 9. Prefill surface hooks (family 6; memo §8, run B §B3) ---------- */
{
  const P = D.PREFILL_CAL, rows = Object.keys(D.CALIBRATION);
  assert("prefill: EVERY calibration row declares a prefillProvenance",
    rows.every(k => P.prefillProvenance[k] !== undefined),
    rows.filter(k => P.prefillProvenance[k] === undefined).join(","));
  assert("prefill: every row is still `universal-transfer` — M2 ships the hook, not a re-calibration",
    Object.values(P.prefillProvenance).every(v => v === "universal-transfer"));
  const base = E.workload(s);
  const lo = E.computeMix(base.cIn * P.sensitivityBand.lo, base.cOut, s);
  const hi = E.computeMix(base.cIn * P.sensitivityBand.hi, base.cOut, s);
  const prefillShare = (base.costMix - E.computeMix(0, base.cOut, s).costMix) / base.costMix;
  const sensitivityPp = (lo.margin - base.margin) * 100;
  /* im-vet-six-repairs (2026-09-20), vetting finding E3: the share re-derives to 72.42% and the
     one-page reconstruction annex publishes it component by component with its sources, labels and
     the cache-work boundary the fresh-prefill anchor assumes
     (research/input-cost-reconstruction.md). The carry disclosure moves with it, and also loses
     "flagship default" to the vocabulary release edit. */
  assert("prefill: the planning baseline's input share re-derives to 72.42% of direct cost",
    Math.abs(prefillShare - 0.7241832261755355) < 1e-12, String(prefillShare));
  assert("prefill: the ±50% carry re-derives symmetrically to ±15.059 pp",
    Math.abs(sensitivityPp - 15.059146081490393) < 1e-12
      && Math.abs((base.margin - hi.margin) * 100 - sensitivityPp) < 1e-12
      && /the planning baseline/.test(P.carryDisclosure) && /15\.1pp/.test(P.carryDisclosure),
    `${sensitivityPp} / ${P.carryDisclosure}`);
  assert("prefill: the MANDATORY 0.5–1.5× sensitivity band is declared (run B §B3 item 3)",
    P.sensitivityBand.lo === 0.5 && P.sensitivityBand.hi === 1.5
      && Math.abs(P.sensitivityBand.headlinePpAtHalfBand - sensitivityPp) < 0.005);
  // The one platform-native prefill datum that exists is RECORDED and NOT adopted. Adopting it
  // would re-fit against a non-matched workload — the §2.4 pathology. This asserts the debt stays
  // visible: deleting the record, or silently promoting the row, both fail.
  const ca = P.candidateAnchors.find(a => a.hwKey === "tpu7");
  assert("prefill: the Ironwood datum is RECORDED (3,707 tok/s/chip) so the debt is visible",
    ca && ca.value === 3707, JSON.stringify(ca || null));
  assert("prefill: and it states WHY it is not adopted (non-matched workload, memo §2.4)",
    ca && /does not establish Opus traffic performance/.test(ca.whyNotAdopted));
  assert("prefill: recording a candidate anchor did NOT promote the row off universal-transfer",
    P.prefillProvenance.tpu7 === "universal-transfer");
}

/* ---------- 10. Placement resolution + the opus declared surrogate (family 4; memo §6.2/§6.3) ---------- */
{
  assert("placement: PLACEMENT_PROVENANCES is the 2-member closed set",
    D.PLACEMENT_PROVENANCES.length === 2 && D.PLACEMENT_PROVENANCES.includes("declared-surrogate"));
  for (const m of ["dsr1", "kimi", "dsv4"]) {
    const r = D.resolveDecodePlacement(m, D.WEIGHT_PLACEMENT[m].engineTotalB, 1, 8, 58);
    assert(`placement: ${m} resolves as PUBLISHED with a component source`,
      r.placementProvenance === "published-placement" && typeof r.componentSource === "string" &&
      r.expertsPerLayer === D.WEIGHT_PLACEMENT[m].routedExpertsPerLayer, r.placementProvenance);
    assert(`placement: ${m} carries no surrogate note (it is a measurement, not an assumption)`,
      r.surrogateNote === null);
    assert(`placement: ${m} DTO carries per-token uniform top-k inclusion probability k/E`,
      r.pUniformPerToken === r.topK / r.expertsPerLayer
        && !Object.prototype.hasOwnProperty.call(r, "pUniform"));
  }
  // opus has no record and MUST NOT silently inherit dsr1's — WEIGHT_PLACEMENT's own rule.
  const o = D.resolveDecodePlacement("opus", 2500, 1, 8, 58);
  assert("placement: opus resolves as a DECLARED SURROGATE, never as published",
    o.placementProvenance === "declared-surrogate", o.placementProvenance);
  assert("placement: opus carries a surrogate note naming the geometry as assumed",
    /UNPUBLISHED/.test(o.surrogateNote) && /assumed, not measured/.test(o.surrogateNote));
  assert("placement: opus reproduces memo §6.3 exactly (W_shared 63.68 GB, W_e 164.08 MB)",
    Math.abs(o.wSharedBytes / 1e9 - 63.68) < 0.01 && Math.abs(o.wExpertBytes / 1e6 - 164.08) < 0.01,
    `${(o.wSharedBytes / 1e9).toFixed(2)}GB / ${(o.wExpertBytes / 1e6).toFixed(2)}MB`);
  assert("placement: opus carries the donor's SPLIT as a ratio, not the donor's byte counts",
    o.wSharedBytes !== D.WEIGHT_PLACEMENT.dsr1.replicatedParams * 1.0);
  // The surface must actually WORK, not merely exist: drive the coverage term with the resolved
  // record and confirm it reproduces the hand-computed coverage at the memo's operating point.
  const cal = D.CALIBRATION.tpu7, saved = { b: cal.decodeTrafficBasis, r: cal.etaRepresentation };
  cal.decodeTrafficBasis = "expert-coverage"; cal.etaRepresentation = "expert-coverage";
  try {
    const g = call("tpu7", { b: 16, placement: o });
    assert("placement: the resolved surrogate DRIVES the without-replacement coverage term end-to-end (B_rep 256 ⇒ 0.999705)",
      Math.abs(g.expertCoverage - 0.9997047437009647) < 1e-12 && g.bRep === 256, String(g.expertCoverage));
    const low = call("tpu7", { b: 1, placement: o });
    assert("placement: top-k choices are distinct within each token (B_rep 16 ⇒ 0.398290)",
      Math.abs(low.expertCoverage - 0.3982896965679277) < 1e-12, String(low.expertCoverage));
    throws("placement: topK greater than expertsPerLayer rejects",
      () => call("tpu7", { b: 1, placement: { ...o, topK: o.expertsPerLayer + 1 } }),
      /topK must be an integer no greater than expertsPerLayer/);
    assert("placement: at ~full coverage the coverage form ≈ the replica-resident charge (memo §3.2)",
      Math.abs(g.wIterBytes - 2500e9 / 16) / (2500e9 / 16) < 1e-3,
      `${(g.wIterBytes / 1e9).toFixed(3)} GB vs ${(2500 / 16).toFixed(3)} GB`);
  } finally { cal.decodeTrafficBasis = saved.b; cal.etaRepresentation = saved.r; }
  assert("placement: the probe restored tpu7's shipped basis",
    D.CALIBRATION.tpu7.decodeTrafficBasis === "replica-resident-distinct");
  assert("placement: NO shipped calibration row selects expert-coverage (memo §2.3 — not identified)",
    Object.values(D.CALIBRATION).every(c => c.decodeTrafficBasis !== "expert-coverage"));
}

/* ---------- 11. The form-correction debt (family 9, engine half; memo §3.5) ---------- */
{
  const d = E.formCorrectionDebt(s);
  assert("debt: computed from the DECLARED surrogate placement, and says so",
    d.placementProvenance === "declared-surrogate" && /UNPUBLISHED/.test(d.surrogateNote));
  // Amendment 3 (plan §0): the span is ENGINE-COMPUTED under the distinct-selection coverage
  // form. The 4-dp values are probe8's independent shorthand re-derivation
  // (b9-m2-probes/probe8-amendment3-coverage.mjs); the superseded with-replacement figures
  // were 53.2909 / 64.1688 / 10.88.
  /* im-release-edit-r2 (2026-09-10): the debt span narrows from 17.68 pp to 10.93 pp under the rent
     adoption — the three legs it used to exclude now price, so re-expressing the traffic assumption
     has less room to move the answer. The Amendment-3 FORM is unchanged; the endpoints are re-minted
     from the engine. */
  /* im-vet-six-repairs (2026-09-20): the span WIDENS from 10.93 pp to 13.74 pp. The Amendment-3
     FORM is unchanged and the endpoints are re-minted from the engine; the widening is the honest
     consequence of the Trainium withdrawal — the form axis now swings over five legs instead of
     seven, and the two it lost were the ones whose declared N_phys moved it least. */
  assert("debt: carries the §2.2 un-identified span, Amendment-3 form (47.5399–61.2784, 13.74 pp)",
    d.identifiedSpan.lo === 47.5399 && d.identifiedSpan.hi === 61.2784 && d.identifiedSpan.spanPp === 13.74,
    JSON.stringify(d.identifiedSpan));
  assert("debt: identified span declares its flagship Opus scope",
    d.identifiedSpan.scope === "flagship-opus-baseline-at-public-evidence-reference", String(d.identifiedSpan.scope)); // b9 M5 gate P2: the scope names the reference it is pinned to
  assert("debt: the span's basis states BOTH ends fall outside the tripwire",
    /outside the plan's 55\.24–61\.25/.test(d.identifiedSpan.basis));
  assert("debt: the span's basis names the Amendment-3 coverage form and the live derivation",
    /Amendment 3/.test(d.identifiedSpan.basis) && /computed at the flagship baseline/.test(d.identifiedSpan.basis));
  // COMPUTED, not pinned (plan §6 invariant 1): perturb an input the span depends on and it moves.
  // (tpu7's HBM bandwidth feeds the §C4 counterfactual's t_H directly; nShard cannot be the probe —
  // the registry welds it to topologySensitivity.defaultCaseId and the mutation trips that guard.)
  {
    const saved = D.HW_ROOFLINE.tpu7.bwHBM;
    let perturbed;
    try { D.HW_ROOFLINE.tpu7.bwHBM = saved / 2; perturbed = E.formCorrectionDebt(s).identifiedSpan; }
    finally { D.HW_ROOFLINE.tpu7.bwHBM = saved; }
    assert("debt: the span is DERIVED — perturbing tpu7's HBM bandwidth moves it",
      perturbed.lo !== d.identifiedSpan.lo, JSON.stringify({ base: d.identifiedSpan.lo, perturbed: perturbed.lo }));
    assert("debt: the perturbation probe restored state (span byte-identical after restore)",
      E.formCorrectionDebt(s).identifiedSpan.lo === d.identifiedSpan.lo);
  }
  // Memo §5: the replication residual is a typed disclosure on topology-aware rows ONLY.
  assert("debt: tpu7 (replica-resident-distinct) carries the §C4 replication-residual disclosure",
    /replicated components are charged at the replica's shared rate/.test(
      d.legs.find(r => r.hwKey === "tpu7").replicationResidual || "") &&
    /an open form residual, not a modeled effect/.test(
      d.legs.find(r => r.hwKey === "tpu7").replicationResidual || ""));
  assert("debt: no legacy-representation leg carries the replication residual",
    d.legs.filter(r => r.representation === "active-parameter-surrogate")
      .every(r => r.replicationResidual === undefined));
  assert("debt: every legacy-representation leg is sized; the topology-aware leg is not",
    d.legs.filter(r => r.representation === "active-parameter-surrogate").every(r => r.ratio > 0) &&
    d.legs.find(r => r.hwKey === "tpu7").ratio === null);
  /* Reproduces the memo §2.1(b) declared-width ratios — the same numbers probe5 derives
     independently. im-vet-six-repairs (2026-09-20): the two Trainium ratios move to the DECLARED
     TOPOLOGY state, because the default fleet no longer contains those legs — they are withdrawn
     on evidence grounds, and the very ~15.2× exposure asserted below is the reason. The ratios
     themselves are unchanged and are still executed; what changed is which state carries them. */
  const sDeclared = E.applyPresetSettings(E.MODELS.find(x => x.id === "opus"),
    E.PERSPECTIVES.find(x => x.id === "median"), { mode: "native" });
  sDeclared.blend = { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 };
  const dDeclared = E.formCorrectionDebt(sDeclared);
  const want = { h100: 3.202, h200: 2.234, gb200: 0.967, gb300: 0.964 };
  const wantDeclaredOnly = { trn2: 1.828, trn3: 1.828 };
  for (const [k, r] of Object.entries(want)) {
    const leg = d.legs.find(x => x.hwKey === k);
    assert(`debt: ${k} sizes at ${r}× (memo §2.1b, declared N_phys, η held)`,
      Math.abs(leg.ratio - r) < 5e-4, String(leg.ratio));
  }
  for (const [k, r] of Object.entries(wantDeclaredOnly)) {
    const leg = dDeclared.legs.find(x => x.hwKey === k);
    assert(`debt: ${k} sizes at ${r}× on the DECLARED topology (withdrawn from the default, so it sizes where it still renders)`,
      Math.abs(leg.ratio - r) < 5e-4, String(leg.ratio));
  }
  assert("debt: the DEFAULT carries no Trainium leg at all — the withdrawal is why, not an omission",
    d.legs.every(r => r.hwKey !== "trn2" && r.hwKey !== "trn3")
      && dDeclared.legs.some(r => r.hwKey === "trn2"),
    d.legs.map(r => r.hwKey).join(","));
  assert("debt: every leg is labeled NOT a repaired estimate",
    d.notAResult === E.FORM_DEBT_NOT_A_RESULT && d.legs.every(r => r.notAResult === E.FORM_DEBT_NOT_A_RESULT) &&
    /open calibration debt/.test(d.notAResult));
  // The family-3 adjudication: the cross-quantity exposure MUST be stated on those legs.
  /* The exposure statement itself is NOT lost by the withdrawal — it moves from a caveat inside
     the default reading to the stated reason the leg is outside it, and it is still executed here
     on the state that still renders those legs. */
  for (const k of ["trn2", "trn3"]) {
    const leg = dDeclared.legs.find(x => x.hwKey === k);
    assert(`debt: ${k} states its cross-quantity exposure at ~15.2×`,
      leg.crossQuantityExposure && Math.abs(leg.crossQuantityExposure.ratio - 15.2) < 0.1,
      String(leg.crossQuantityExposure && leg.crossQuantityExposure.ratio));
    assert(`debt: ${k} carries the ratified "may be ~15× wrong" statement`,
      /may be ~15× wrong/.test(leg.crossQuantityNote), leg.crossQuantityNote);
    assert(`debt: ${k} names run B's self-contradiction as the reason it is unsettled`,
      /§C1's own prescription, which §A3 contradicts/.test(leg.crossQuantityNote));
  }
  assert("debt: legs NOT carrying the surrogate batch tag have no cross-quantity exposure",
    d.legs.filter(r => r.batchQuantity !== "B_rep_consumed_as_B_out_per_chip")
      .every(r => r.crossQuantityExposure === undefined));
  assert("debt: computing it does not perturb the shipped blend",
    E.workload(s).margin === M1_MARGIN);
  // Regression for the published diagnostic's duplicate expert-coverage calculation. Each token's
  // top-k experts are distinct, so the fast-regime coverage probability must use B_rep token groups,
  // not B_rep×k independent with-replacement draws. Balanced coverage is nearly saturated and would
  // not expose this error; the Trainium fast point does.
  const fast = E.applyPresetSettings(E.MODELS.find(x => x.id === "opus"),
    E.PERSPECTIVES.find(x => x.id === "median"), { mode: "native" });
  fast.interact = "fast";
  fast.blend = { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 };
  const fastTrn2 = E.formCorrectionDebt(fast).legs.find(r => r.hwKey === "trn2");
  assert("debt: fast Trainium uses without-replacement top-k expert coverage",
    Math.abs(fastTrn2.ratio - 4.611552) < 5e-6, String(fastTrn2.ratio));
  const custom = E.MODELS.find(x => x.id === "custom");
  const median = E.PERSPECTIVES.find(x => x.id === "median");
  const dense = E.applyPresetSettings(custom, median, { mode: "native" });
  dense.customDonor = "llama70";
  const denseTraffic = E.resolveTraffic(custom, median, { mode: "native" });
  const denseDebt = E.formCorrectionDebt(dense, E.makeScenarioContext(custom, denseTraffic, "llama70"));
  assert("debt: dense-TP donor marks expert-coverage correction not applicable",
    denseDebt.placementProvenance === "not-applicable-dense-tp"
      && denseDebt.legs.every(r => r.ratio === null && r.counterfactualTokPerS === null),
    JSON.stringify(denseDebt));
  assert("debt: every emitted numeric is finite for the dense-TP donor",
    denseDebt.legs.every(r => Object.values(r).every(v => typeof v !== "number" || Number.isFinite(v))),
    JSON.stringify(denseDebt));
  const dsv4Model = E.MODELS.find(x => x.id === "dsv4");
  const dsv4Traffic = E.resolveTraffic(dsv4Model, median, { mode: "native" });
  const dsv4Ctx = E.makeScenarioContext(dsv4Model, dsv4Traffic);
  const dsv4Native = E.applyPresetSettings(dsv4Model, median, { mode: "native" });
  assert("debt: published placement engages only at the checkpoint identity",
    E.formCorrectionDebt(dsv4Native, dsv4Ctx).placementProvenance === "published-placement");
  const dsv4EditedTotal = E.applyPresetSettings(dsv4Model, median, { mode: "native" });
  dsv4EditedTotal.total = 3000;
  const editedTotalDebt = E.formCorrectionDebt(dsv4EditedTotal, dsv4Ctx);
  assert("debt: edited total disengages checkpoint placement and labels a surrogate",
    editedTotalDebt.placementProvenance === "declared-surrogate"
      && /total edited off/.test(editedTotalDebt.surrogateNote), JSON.stringify(editedTotalDebt));
  const forcedPlacement = D.resolveDecodePlacement("dsv4", dsv4EditedTotal.total, 1,
    R.resolveArch("dsv4").topK, R.resolveArch("dsv4").moeLayers, { forceSurrogate: true });
  assert("debt: a disengaged registered placement does not falsely claim that no record exists",
    /record exists[\s\S]*DISENGAGED/.test(forcedPlacement.basis)
      && !/no WEIGHT_PLACEMENT record exists/.test(forcedPlacement.basis),
    forcedPlacement.basis);
  const dsv4EditedPrecision = E.applyPresetSettings(dsv4Model, median, { mode: "native" });
  dsv4EditedPrecision.precision = "bf16";
  dsv4EditedPrecision.blend = { h100: 100 };
  dsv4EditedPrecision.interact = "fast";
  const editedPrecisionDebt = E.formCorrectionDebt(dsv4EditedPrecision, dsv4Ctx);
  assert("debt: edited precision disengages checkpoint placement and labels a surrogate",
    editedPrecisionDebt.placementProvenance === "declared-surrogate"
      && /does not map/.test(editedPrecisionDebt.surrogateNote), JSON.stringify(editedPrecisionDebt));
  {
    const arch = R.resolveArch(dsv4Ctx.modelId, dsv4Ctx.customDonor);
    const solved = E.solveCapacityWidth("h100", dsv4EditedPrecision, { ctx: dsv4Ctx });
    const width = solved.declaredOperatingPointWidth;
    const point = R.renderPoint({
      arch, activeB: dsv4EditedPrecision.active, totalB: dsv4EditedPrecision.total,
      hwKey: "h100", regime: dsv4EditedPrecision.interact,
      precision: dsv4EditedPrecision.precision, stackMult: dsv4EditedPrecision.stackMult,
      profileId: dsv4Ctx.profileId, ioRatio: dsv4EditedPrecision.ioRatio,
      declaredOperatingWidth: width, capacitySolve: solved,
    });
    const dec = point.decode, b = point.op.b, cal = D.CALIBRATION.h100;
    const tuple = R.resolvePrecisionTuple("h100", dsv4EditedPrecision.precision);
    const p = D.resolveDecodePlacement("dsv4", dsv4EditedPrecision.total, tuple.sW,
      arch.topK, arch.moeLayers, { forceSurrogate: true });
    const coverage = 1 - Math.pow(1 - p.topK / p.expertsPerLayer, b * cal.nPhysDeclared);
    const wDev = (p.wSharedBytes + p.moeLayers * p.expertsPerLayer * p.wExpertBytes * coverage)
      / cal.nPhysDeclared;
    const tH = (wDev + b * dec.kvSeqBytesDev) / D.HW_ROOFLINE.h100.bwHBM;
    const expectedRatio = (b / (Math.max(dec.tC, tH, dec.tN) / dec.etaEff + dec.tCc))
      / dec.tokPerS;
    const h100Debt = editedPrecisionDebt.legs.find(row => row.hwKey === "h100");
    assert("debt: BF16 surrogate uses the live H100 precision tuple's 2-byte weights",
      Math.abs(h100Debt.ratio - expectedRatio) < 1e-12,
      JSON.stringify({ got: h100Debt.ratio, expected: expectedRatio, sW: tuple.sW }));
  }
  const policyDebt = E.formCorrectionDebt(dsv4Native, dsv4Ctx,
    { loadedWeightBytesPerParam: 0.55 });
  assert("debt: a loaded-bytes policy override disengages the published checkpoint placement",
    policyDebt.placementProvenance === "declared-surrogate"
      && /policy-sensitivity/.test(policyDebt.surrogateNote), JSON.stringify(policyDebt));
  const appSource = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const indexSource = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  assert("debt: the published calculator consumes the engine disclosure",
    /formCorrectionDebt\(S,\s*appEngineContext\(\)\)/.test(appSource));
  assert("debt: the published result surface has a dedicated disclosure target",
    /id="form-debt-disclosure"/.test(indexSource));
}

console.log(`\nform-equivalence-b9: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
