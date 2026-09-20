// TRAFFIC MIX state-resolution contract (methodology v2.1.2) — written BEFORE implementation
// per the 2026-07-11 plan reviews (GPT Pro P0 #1 / council P0 #1: "failing fixtures first").
// Run: node tests/traffic-contract.test.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { validateTariff, parseIsoDay } from "./tariff-contract.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const BASE = require("./fixtures-baseline-v22.json");
/* The pre-adoption baseline, archived 2026-09-10 so the re-mint invariant below stays checkable. */
const PRE_ADOPTION = require("./fixtures-baseline-v22-pre-rent-adoption.json");
/* im-vet-six-repairs (2026-09-20): the live fixture as it stood at master 6f10192, immediately
   before the Trainium withdrawal and the TPU numerator repair. */
const PRE_VETTING = require("./fixtures-baseline-v22-pre-vetting-repairs.json");
const vettingExposed = (pre) => !!pre && ["tpu7", "trn2", "trn3"].some(k => pre.blend && pre.blend[k] > 0);
const PRE_TARIFF = require("./fixtures-baseline-v22-pre-tariff-correction.json");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const M = id => E.MODELS.find(m => m.id === id);
const P = id => E.PERSPECTIVES.find(p => p.id === id);

// ---------- 1. Structural ownership ----------
assert("TRAFFIC_PROFILES exported", Array.isArray(E.TRAFFIC_PROFILES) && E.TRAFFIC_PROFILES.length >= 6);
for (const t of E.TRAFFIC_PROFILES || []) {
  assert(`profile ${t.id} has provenance`, typeof t.provenance === "string" && t.provenance.length > 20, t.id);
  assert(`profile ${t.id} name carries its numbers`, new RegExp(`${t.ioRatio}\\s*:\\s*1`).test(t.name) && t.name.includes(`${t.cacheHit}%`), t.name);
}
// Provenance-honest naming: no generic archetype labels (unanimous plan-review P0 #2).
for (const t of E.TRAFFIC_PROFILES || [])
  assert(`profile ${t.id} not a generic archetype`, !/^(Agentic|Chat|Coding)\b/i.test(t.name), t.name);

// Models own only a native-profile pointer, never raw traffic numbers.
for (const m of E.MODELS) {
  assert(`model ${m.id} set has no ioRatio/cacheHit`, m.set.ioRatio === undefined && m.set.cacheHit === undefined);
  assert(`model ${m.id} has valid nativeTraffic`, !!(E.TRAFFIC_PROFILES || []).find(t => t.id === m.nativeTraffic), String(m.nativeTraffic));
}
// Pure lenses and exploration routes never write traffic (the analyst kind retired in v2.1.3;
// its numeric-identical successors are the exploration routes, checked in §1b).
for (const p of E.PERSPECTIVES.filter(p => p.kind === "lens" || p.kind === "analyst" || p.kind === "exploration"))
  assert(`${p.kind} ${p.id} writes no traffic`, p.set.ioRatio === undefined && p.set.cacheHit === undefined);
// xAI valuation presets are replays now (atomic composites at the dive operating point), not lenses.
assert("xaicash is a replay", P("xaicash").kind === "replay");
assert("xaiopp is a replay", P("xaiopp").kind === "replay");

// ---------- 1b. Exploration routes (v2.1.3): perspective-space only, resolve like a lens ----------
const EXPLORATIONS = E.PERSPECTIVES.filter(p => p.kind === "exploration");
// 2026-08-16 (owner notes aa315c + c72950): FIVE routes now. x90-v2 adds the mechanism named in
// the 90→95% claim — the batch lever applied alone to the ≥90% route — which the v2.1.3 redesign
// dropped for falling short of the range it was authored for. The count moved because the
// registry moved; the four originals keep their ids, since permalinks bind to them.
assert("the 5 discourse-tied exploration routes ship",
  EXPLORATIONS.length === 5
    && ["x60-v3", "x80-v3", "x80-v4", "x90-v1", "x90-v2"].every(id => EXPLORATIONS.some(p => p.id === id)),
  EXPLORATIONS.map(p => p.id).join(","));
// Attribution may never outrun the record: a route naming a claimant must point at claim ids the
// claims registry actually carries, verbatim quote and source included. This is the guard that
// keeps the 2026-08-16 re-attribution from becoming the misattribution P0-4 removed.
{
  const claimIds = new Set(E.MARGIN_CLAIMS.map(c => c.id));
  for (const p of EXPLORATIONS) {
    assert(`exploration ${p.id} declares a claim anchor`,
      !!(p.claimAnchor && p.claimAnchor.who && Array.isArray(p.claimAnchor.claimIds)
         && p.claimAnchor.claimIds.length));
    assert(`exploration ${p.id}'s claim anchor resolves in MARGIN_CLAIMS`,
      !!p.claimAnchor && p.claimAnchor.claimIds.every(id => claimIds.has(id)),
      JSON.stringify(p.claimAnchor));
    assert(`exploration ${p.id} still states the vector is page-authored`,
      /PAGE-AUTHORED RECONSTRUCTION/.test(p.note) && /no external party selected/i.test(p.note));
  }
}
for (const p of EXPLORATIONS) {
  assert(`exploration ${p.id} writes no ioRatio/cacheHit`, p.set.ioRatio === undefined && p.set.cacheHit === undefined);
  assert(`exploration ${p.id} touches only perspective-space keys`,
    Object.keys(p.set).every(k => E.PERSPECTIVE_SPACE_KEYS.includes(k)), Object.keys(p.set).join(","));
}

// ---------- 2. Resolver behavior ----------
assert("resolveTraffic exported", typeof E.resolveTraffic === "function");
const R = (mid, pid, sel) => E.resolveTraffic(M(mid), P(pid), sel);

// Native mode resolves the model's profile and re-resolves on model change.
{
  const a = R("opus", "median", { mode: "native" });
  assert("opus native = reference 15/60", a.ioRatio === 15 && a.cacheHit === 60 && a.mode === "native");
  const b = R("gpt", "median", { mode: "native" });
  assert("gpt native = 9/78 (model change re-resolves)", b.ioRatio === 9 && b.cacheHit === 78);
}
// Explicit profile survives model change — identical values for every model.
for (const m of E.MODELS) {
  const r = E.resolveTraffic(m, P("median"), { mode: "explicit", profileId: "uncached" });
  assert(`explicit 'uncached' fixed for ${m.id}`, r.ioRatio === 3 && r.cacheHit === 0 && r.mode === "explicit");
}
// Custom survives everything (including under an exploration route).
{
  const r = R("gemini", "x80-v3", { mode: "custom", ioRatio: 42, cacheHit: 7 });
  assert("custom passes through", r.ioRatio === 42 && r.cacheHit === 7 && r.mode === "custom");
}
// Explorations resolve traffic EXACTLY like a lens: native re-resolves on model change,
// explicit/custom selections survive, and an exploration NEVER locks traffic.
{
  const a = R("opus", "x80-v3", { mode: "native" });
  const b = R("gpt", "x80-v3", { mode: "native" });
  assert("exploration native re-resolves on model change (opus 15/60 → gpt 9/78)",
    a.ioRatio === 15 && a.cacheHit === 60 && b.ioRatio === 9 && b.cacheHit === 78 && !a.locked && !b.locked);
  const c = R("opus", "x90-v1", { mode: "explicit", profileId: "uncached" });
  assert("exploration honors an explicit profile", c.ioRatio === 3 && c.cacheHit === 0 && c.mode === "explicit" && !c.locked);
  const d = R("kimi", "x60-v3", { mode: "custom", ioRatio: 42, cacheHit: 7 });
  assert("exploration honors custom traffic", d.ioRatio === 42 && d.cacheHit === 7 && !d.locked);
  for (const m of E.MODELS) for (const sel of [{ mode: "native" }, { mode: "explicit", profileId: "deepseek-disclosure" }]) {
    const lens = E.resolveTraffic(m, P("median"), sel);
    const expl = E.resolveTraffic(m, P("x80-v4"), sel);
    assert(`exploration resolves like a lens on ${m.id} (${sel.mode})`,
      expl.ioRatio === lens.ioRatio && expl.cacheHit === lens.cacheHit && expl.mode === lens.mode && !expl.locked);
  }
}
// Replays lock traffic: an explicit selection cannot move a replay off its operating point.
{
  const r = R("grok", "xaiopp", { mode: "explicit", profileId: "reference" });
  assert("xaiopp locked at 3/0 despite explicit selection", r.ioRatio === 3 && r.cacheHit === 0 && r.locked === true);
  const d = R("dsr1", "deepseek", { mode: "explicit", profileId: "reference" });
  assert("disclosure replay locked at model-native 4/56", d.ioRatio === 4 && d.cacheHit === 56 && d.locked === true);
  const g = R("gpt", "dive", { mode: "explicit", profileId: "uncached" });
  assert("gpt dive replay locked at 9/78", g.ioRatio === 9 && g.cacheHit === 78 && g.locked === true);
  const k = R("kimi", "dive", { mode: "explicit", profileId: "reference" });
  assert("kimi dive replay locked at its dive mix 8/40", k.ioRatio === 8 && k.cacheHit === 40 && k.locked === true);
}
// Dive on a model without a §10 card is the documented median fallback — NOT a locked replay.
{
  const r = R("opus", "dive", { mode: "explicit", profileId: "uncached" });
  assert("dive fallback (no card) honors traffic selection", r.ioRatio === 3 && r.cacheHit === 0 && !r.locked);
}
// legacy-custom (migrated v2 links) overrides even replay locks — link numbers are sacred.
{
  const r = R("gpt", "xaicash", { mode: "legacy-custom", ioRatio: 9, cacheHit: 78 });
  assert("legacy-custom overrides replay lock (v2 numeric identity)", r.ioRatio === 9 && r.cacheHit === 78);
}

// ---------- 3. Parity vs the freshly minted v2.2 baseline ----------
// The v2.1.1 fixture is archived for IM6. This fixture pins all 15 provider rows × all 12 live
// perspectives after the display-path switch, including explicit non-finite zero-renderable cases.
//
// RE-MINTED 2026-09-10 under owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok, and the
// SHAPE of the re-mint is the evidence that it is a procurement change and nothing else:
//   72 of 180 pairs moved; 108 are byte-identical.
//   EVERY moved pair carries at least one of the three adopted legs (gb200, gb300, trn3) — the set
//   of pairs that moved without one is EMPTY.
//   The pairs that carry an adopted leg and did NOT move are exactly the x90-v1 routes, which price
//   from capex under an owned-TCO basis, so a planning RENT cannot reach them.
// Both halves of that are asserted below rather than left as a claim in a comment, because a
// re-minted fixture with no invariant behind it is just a new set of numbers.
{
  let checked = 0;
  for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
    const key = `${m.id}|${p.id}`;
    const frozen = BASE.pairs[key];
    if (!frozen) continue;
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    const marginOk = frozen.margin === null ? !isFinite(w.margin) : Math.abs(w.margin * 100 - frozen.margin) < 5e-4;
    const trafficOk = s.ioRatio === frozen.ioRatio && s.cacheHit === frozen.cacheHit;
    /* im-arc T2 adds a typed section receipt without changing any frozen field.
       Compare the historical projection, then assert the additive contract. */
    const legacyFleet = { ...w.fleetRenderable }; delete legacyFleet.sections;
    const fleetOk = JSON.stringify(legacyFleet) === JSON.stringify(frozen.fleetRenderable);
    const sectionsOk = w.fleetRenderable.sections.length === 1
      && w.composition.length === 1 && w.composition[0].basis !== "inherit";
    checked++;
    if (!(marginOk && trafficOk && fleetOk && sectionsOk)) assert(`v2.2 parity ${key}`, false,
      `traffic ${s.ioRatio}/${s.cacheHit} vs ${frozen.ioRatio}/${frozen.cacheHit}; margin ${isFinite(w.margin) ? (w.margin*100).toFixed(4) : "null"} vs ${frozen.margin}; fleet ${JSON.stringify(w.fleetRenderable)} vs ${JSON.stringify(frozen.fleetRenderable)}`);
  }
  assert(`v2.2 parity holds for all 180 provider/perspective pairs (got ${checked})`, checked === 180);
  /* The re-mint invariant (2026-09-10): a pair may differ from the PRE-ADOPTION baseline only if it
     carries an adopted leg, and an owned-TCO route may not differ at all. Asserted against the
     archived pre-adoption fixture so it keeps meaning after this fixture is re-minted again. */
  {
    const ADOPTED = ["gb200", "gb300", "trn3"];
    /* im-vet-model-estimates (2026-09-19) adds the THIRD admissible cause, and it is a billing one:
       five presets carried a price their vendor no longer charges and were corrected against the
       vendors' own pages (gpt, terra, luna, dsv4, dsv4f). A tariff is a revenue input, so unlike a
       planning rent it reaches EVERY route a model appears on, owned-TCO ones included — which is
       why the owned-route invariant below now excludes it explicitly rather than widening. */
    const TARIFF_CORRECTED = ["gpt", "terra", "luna", "dsv4", "dsv4f"];
    /* …and a FOURTH cause, from the same day and the same owner note, but a different kind of
       change: the two Zhipu rows' DEFAULT TRAFFIC moved from the ncode-informed profile to the
       page's Reference convention. It is a traffic default, not a price and not a rent, so it
       shows up as ioRatio/cacheHit moving alongside margin — which is how the check below tells
       it apart from the other three. */
    const PROFILE_DEFAULT_CHANGED = ["glm", "glm47"];
    let movedWithoutAdoptedLeg = [], ownedRouteMoved = [], moved = 0, unmoved = 0;
    for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
      const pre = PRE_ADOPTION.pairs[`${m.id}|${p.id}`];
      if (!pre) continue;
      const s = E.applyPresetSettings(m, p, { mode: "native" });
      const w = E.workload(s);
      const now = isFinite(w.margin) ? +(w.margin * 100).toFixed(4) : null;
      const didMove = pre.margin === null ? now !== null : Math.abs((now ?? NaN) - pre.margin) >= 5e-4;
      if (didMove) moved += 1; else { unmoved += 1; continue; }
      /* TWO admissible causes, and only two. The rent adoption reaches a pair through an adopted
         leg. The Grok cache-read correction (25% -> the published 15%) reaches a pair through Grok
         WITH CACHE ON — it is a BILLING input, so it moves revenue and only where cached tokens are
         billed. Every published Grok operating point runs at the dive's Uncached 3:1 / 0%
         convention, which is why no published Grok number moved; states like grok|x90-v1 run at
         cacheHit 60 and do move, downward, which is the direction a revenue cut implies. */
      const viaRent = ADOPTED.some(k => (s.blend && s.blend[k] > 0));
      const viaCache = m.id === "grok" && s.cacheHit > 0;
      const viaTariff = TARIFF_CORRECTED.includes(m.id);
      const viaProfile = PROFILE_DEFAULT_CHANGED.includes(m.id);
      /* im-vet-six-repairs (2026-09-20) adds the FIFTH admissible cause, and it is a COST one: the
         two Trainium legs left the default fleet's membership on evidence grounds and the TPU v7
         decode coefficient was corrected onto a decode-only numerator. Both reach a pair through
         its FLEET, so the predicate is exposure to one of the three affected legs in the state the
         pair had BEFORE the repair — read off the archived pre-repair fixture rather than from the
         live blend, which no longer carries the withdrawn legs and would therefore hide exactly the
         pairs this cause is about. */
      const viaVetting = vettingExposed(PRE_VETTING.pairs[`${m.id}|${p.id}`]);
      if (!viaRent && !viaCache && !viaTariff && !viaProfile && !viaVetting) movedWithoutAdoptedLeg.push(`${m.id}|${p.id}`);
      /* im-release-edit-r3 (2026-09-10), fallback-review finding F5. This used to read
         `p.id === "x90-v1" && !viaRent && !viaCache`, which is a STRICT SUBSET of the line above:
         it could not be non-empty unless that assertion had already failed, so it was vacuous as an
         independent check while its message promised a guarantee of its own. The invariant it means
         to state is that CAPEX PRICES AN OWNED-TCO ROUTE, so a planning RENT cannot reach one —
         which is a claim about the rent cause specifically, not about both causes at once. Stated
         that way it is falsifiable and it is not entailed by anything above it. (It also stops the
         changelog citing it for "no owned-TCO route moved at all", which is false: grok|x90-v1
         moved 71.54 -> 69.06 via the CACHE correction, which reaches it because that state runs at
         cacheHit 60.) */
      /* im-vet-model-estimates (2026-09-19): `&& !viaTariff` added, and it is not a loosening.
         The claim this line makes is specifically that CAPEX PRICES AN OWNED-TCO ROUTE, SO A
         PLANNING RENT CANNOT REACH ONE. gpt|x90-v1, terra|x90-v1 and luna|x90-v1 now differ from
         the pre-adoption baseline because their LIST PRICE was corrected, which is a revenue input
         and reaches every route by construction. Without this term the assertion would fire on
         three pairs it was never about, and the only ways to make it pass again would be to delete
         it or to leave a known-wrong price in the engine. */
      if (p.id === "x90-v1" && viaRent && !viaCache && !viaTariff && !viaProfile && !viaVetting) ownedRouteMoved.push(`${m.id}|${p.id}`);
    }
    /* im-release-edit-r3 (2026-09-10): the COUNT is asserted too, not only the two invariants.
       The note above states "72 of 180 pairs moved; 108 are byte-identical" and then says both
       halves are asserted below — which was true of the two invariants and NOT of the count itself.
       A count stated in a comment and checked nowhere is the shape this file exists to refuse, so
       it is checked now. Re-mint it only alongside a declared reason the split changed. */
    /* im-vet-model-estimates (2026-09-19): 72/108 -> 99/81. The 27 additional moved pairs are the
       five tariff-corrected rows on the perspectives whose margins the price reaches. The split is
       re-minted here BECAUSE a declared reason exists, which is the condition the note below sets. */
    /* im-vet-six-repairs (2026-09-20): 119/61 -> 146/34. The 27 additional moved pairs are the
       fleet-exposed rows the Trainium withdrawal and the TPU numerator repair reach, and every one
       of them is accounted for by the fifth cause above. Re-minted BECAUSE a declared reason
       exists, which is the condition this block sets for itself. */
    assert("rent adoption + the 2026-09-19 corrections + the 2026-09-20 vetting repairs: the declared split is 146 moved / 34 byte-identical, and it is COUNTED here rather than only stated above",
      moved === 146 && unmoved === 34, JSON.stringify({ moved, unmoved }));
    assert("rent adoption: every moved pair is explained by an adopted leg, by Grok with cache on, by a 2026-09-19 tariff correction, by the Zhipu traffic-default change, or by the 2026-09-20 fleet repairs",
      movedWithoutAdoptedLeg.length === 0, JSON.stringify(movedWithoutAdoptedLeg));
    assert("rent adoption: no owned-TCO route moved for the RENT — capex prices those, so a planning rent cannot reach one (a cache-driven move is admissible and grok|x90-v1 is one)",
      ownedRouteMoved.length === 0, JSON.stringify(ownedRouteMoved));
  }

  /* ---- The 2026-09-19 tariff correction's own re-mint invariant ----
     Owner note note-20260919T142116Z-6b5c83: "sanity check those numbers (I strongly doubt anyone is
     negative serving margin on API costs)". Five presets carried a price their vendor no longer
     charges; each was verified live on the vendor's own page on 2026-09-19 and corrected. That moves
     published numbers, so the fixture is re-minted — and a re-minted fixture with no invariant behind
     it is just a new set of numbers, which is what this block refuses.

     The shape, asserted key-for-key against tests/fixtures-baseline-v22-pre-tariff-correction.json
     (the live fixture archived at master b64d52c, immediately before the correction):
       72 of 180 pairs differ; 108 are byte-identical.
       60 of them are the FIVE corrected rows on all 12 fixture perspectives, and on those the fields
         that differ are priceIn, priceOut, margin and (dsv4 only) cacheReadMult — nothing else.
       12 of them are grok, where the ONLY differing field is cacheReadMult 25 -> 15. That is not this
         correction: it is the 2026-09-10 Grok cache-read ruling, which moved the engine and never
         reached this fixture, because the parity check above compares margin / traffic / fleet and
         never compared cacheReadMult. Grok's margins are byte-identical here, exactly as they should
         be — every published Grok operating point runs uncached, so a cache PRICE has nothing to
         multiply. It is folded in and declared rather than left to sit as a silent stale input.
       The set of pairs that differ for any other reason is EMPTY, and that is the load-bearing claim. */
  {
    const CORRECTED = ["gpt", "terra", "luna", "dsv4", "dsv4f"];
    const PRICE_FIELDS = ["priceIn", "priceOut", "margin", "cacheReadMult"];
    /* The Zhipu rows moved for a DIFFERENT reason on the same day: their default traffic changed
       from the ncode-informed profile to Reference, under the same owner note. A traffic default
       cannot move a price, so the fields it is allowed to touch are disjoint from the price set,
       and that disjointness is what this block asserts rather than assumes. */
    const PROFILE_CHANGED = ["glm", "glm47"];
    const PROFILE_FIELDS = ["margin", "ioRatio", "cacheHit"];
    /* im-vet-six-repairs (2026-09-20): this block compares against the PRE-TARIFF fixture, so it
       now also sees every pair the 2026-09-20 fleet repairs moved. That is a FIFTH cause with a
       different signature from the four above — a cost-side change, so the only field it may move
       is `margin`, never a price, a traffic dial, utilization or the regime. Counted and
       field-constrained separately rather than folded into the tariff bucket, because conflating a
       cost repair with a price correction is exactly what this block exists to prevent. */
    let moved = 0, unmoved = 0, correctedMoved = 0, grokCacheOnly = 0, profileMoved = 0, vettingMoved = 0;
    const unexplained = [], wrongFields = [];
    for (const key of Object.keys(PRE_TARIFF.pairs)) {
      const [mid, pid] = key.split("|");
      const m = E.MODELS.find(x => x.id === mid), p = E.PERSPECTIVES.find(x => x.id === pid);
      const s = E.applyPresetSettings(m, p, { mode: "native" });
      const w = E.workload(s);
      const pre = PRE_TARIFF.pairs[key];
      const now = {
        priceIn: s.priceIn, priceOut: s.priceOut, cacheReadMult: s.cacheReadMult,
        margin: isFinite(w.margin) ? +(w.margin * 100).toFixed(4) : null,
        ioRatio: s.ioRatio, cacheHit: s.cacheHit, util: s.util, interact: s.interact,
      };
      const differ = Object.keys(now).filter(f => JSON.stringify(now[f]) !== JSON.stringify(pre[f]));
      if (differ.length === 0) { unmoved += 1; continue; }
      moved += 1;
      const viaVetting = vettingExposed(PRE_VETTING.pairs[key]);
      if (CORRECTED.includes(mid)) {
        correctedMoved += 1;
        if (differ.some(f => !PRICE_FIELDS.includes(f))) wrongFields.push(`${key}:${differ.join(",")}`);
      } else if (PROFILE_CHANGED.includes(mid)) {
        profileMoved += 1;
        if (differ.some(f => !PROFILE_FIELDS.includes(f))) wrongFields.push(`${key}:${differ.join(",")}`);
      } else if (mid === "grok" && differ.length === 1 && differ[0] === "cacheReadMult") {
        grokCacheOnly += 1;
      } else if (viaVetting) {
        vettingMoved += 1;
        if (differ.some(f => f !== "margin")) wrongFields.push(`${key}:${differ.join(",")}`);
      } else {
        unexplained.push(`${key}:${differ.join(",")}`);
      }
    }
    assert("2026-09-19 corrections + 2026-09-20 vetting repairs: the declared split is 146 moved / 34 byte-identical",
      moved === 146 && unmoved === 34, JSON.stringify({ moved, unmoved }));
    assert("every moved pair is a tariff-corrected row, a Zhipu row whose traffic default changed, grok's stale cacheReadMult, or a fleet-exposed row the 2026-09-20 repairs reach — and nothing else",
      unexplained.length === 0, JSON.stringify(unexplained));
    assert("2026-09-19 corrections: the price change moved only price/margin/cache-read fields and the traffic change moved only margin/ioRatio/cacheHit — neither leaked into the other's fields, nor into utilization or regime",
      wrongFields.length === 0, JSON.stringify(wrongFields));
    assert("the split is 60 tariff pairs + 20 Zhipu traffic-default pairs + 12 grok cache-read-only pairs + 54 fleet-exposed pairs from the 2026-09-20 repairs",
      correctedMoved === 60 && profileMoved === 20 && grokCacheOnly === 12 && vettingMoved === 54,
      JSON.stringify({ correctedMoved, profileMoved, grokCacheOnly, vettingMoved }));
    /* The 2026-09-20 repairs' OWN invariant, asserted key-for-key against the fixture archived at
       master 6f10192 immediately before them. It is a BICONDITIONAL and that is the load-bearing
       part: a pair moved if and only if its pre-repair blend carried tpu7, trn2 or trn3. Nothing
       outside the three affected legs moved, and nothing exposed to them stayed still — so neither
       an unnoticed side effect nor a repair that silently failed to reach a row can pass here. */
    {
      /* STRENGTHENED 2026-09-20 (Astra xhigh review finding 7). The first version of this
         biconditional called 126 pairs "byte-identical" while comparing ONE rounded field —
         margin, at 4 decimals, with a tolerance. The review demonstrated the hole by moving an
         unaffected pair's cOut from 2.40213 to 125.40213 in memory: the whole suite still passed.
         A tolerance comparison on one field also misclassified a finite -> null transition as
         "unmoved", because Math.abs(NaN - x) >= 5e-4 is false. Both are fixed here: the pair's
         WHOLE recorded projection is compared, exactly, by the same serialization the re-mint
         script writes, and null transitions are decided before any arithmetic. "Byte-identical"
         now means what it says. */
      const keySet = new Set(Object.keys(PRE_VETTING.pairs));
      assert("2026-09-20 vetting repairs: the archive and the live fixture cover the SAME 180 pairs (a key that vanished cannot be silently 'unmoved')",
        keySet.size === 180 && Object.keys(BASE.pairs).length === 180
          && Object.keys(BASE.pairs).every(k => keySet.has(k)),
        JSON.stringify({ archive: keySet.size, live: Object.keys(BASE.pairs).length }));
      const projectionOf = (s2, w2) => {
        const f = { ...w2.fleetRenderable }; delete f.sections;
        const round = (v, d) => Number.isFinite(v) ? Number(v.toFixed(d)) : null;
        return { ioRatio: s2.ioRatio, cacheHit: s2.cacheHit, util: s2.util, precision: s2.precision,
          priceIn: s2.priceIn, priceOut: s2.priceOut, cacheReadMult: s2.cacheReadMult,
          blend: s2.blend, interact: s2.interact, rentMult: s2.rentMult,
          margin: round(w2.margin * 100, 4), cOut: round(w2.cOut, 5), fleetRenderable: f };
      };
      let vMoved = 0, vUnmoved = 0;
      const movedUnexposed = [], exposedUnmoved = [];
      for (const key of Object.keys(PRE_VETTING.pairs)) {
        const [mid, pid] = key.split("|");
        const m = E.MODELS.find(x => x.id === mid), p = E.PERSPECTIVES.find(x => x.id === pid);
        const s2 = E.applyPresetSettings(m, p, { mode: "native" });
        const w2 = E.workload(s2);
        const pre = PRE_VETTING.pairs[key];
        const exposed = vettingExposed(pre);
        const didMove = JSON.stringify(projectionOf(s2, w2)) !== JSON.stringify(pre);
        if (didMove) { vMoved += 1; if (!exposed) movedUnexposed.push(key); }
        else { vUnmoved += 1; if (exposed) exposedUnmoved.push(key); }
      }
      assert("2026-09-20 vetting repairs: the declared split is 54 moved / 126 byte-identical, over the WHOLE recorded projection and not one rounded field",
        vMoved === 54 && vUnmoved === 126, JSON.stringify({ vMoved, vUnmoved }));
      assert("2026-09-20 vetting repairs: no pair moved WITHOUT pre-repair exposure to tpu7/trn2/trn3",
        movedUnexposed.length === 0, JSON.stringify(movedUnexposed));
      assert("2026-09-20 vetting repairs: no pair WITH pre-repair exposure stayed still (the repairs reached every row they had to)",
        exposedUnmoved.length === 0, JSON.stringify(exposedUnmoved));
    }
  }
}

// ---------- 3b. Retired-analyst migration parity (v2.1.3 P0-6) ----------
// Every one of the 60 frozen retired-analyst pairs must reproduce IDENTICAL numbers through the
// migration map (a shipped link's numbers are its identity). Exception, already shipped in
// v2.1.2b BEFORE the redesign: the teortaxes vector was remediated (rentMult 0.85 → 1.0, the
// source-faithfulness fix), so its successor x80-v3 carries the REMEDIATED vector — margins for
// those 15 pairs sit off the v2.1.1 freeze by exactly that shipped remediation, nothing else.
{
  assert("RETIRED_PERSPECTIVES carries the four-id migration map",
    E.RETIRED_PERSPECTIVES && E.RETIRED_PERSPECTIVES.teortaxes === "x80-v3" && E.RETIRED_PERSPECTIVES.zephyr === "x80-v4"
    && E.RETIRED_PERSPECTIVES.semi === "x90-v1" && E.RETIRED_PERSPECTIVES.skeptic === "x60-v3");
  assert("normalizePerspId maps retired → successor and passes live ids through",
    E.normalizePerspId("teortaxes") === "x80-v3" && E.normalizePerspId("zephyr") === "x80-v4"
    && E.normalizePerspId("semi") === "x90-v1" && E.normalizePerspId("skeptic") === "x60-v3"
    && E.normalizePerspId("median") === "median" && E.normalizePerspId("x80-v3") === "x80-v3");
  assert("normalizePerspId never resolves through Object.prototype", E.normalizePerspId("constructor") === "constructor");
  let mchecked = 0;
  for (const m of E.MODELS) for (const [oldId, newId] of Object.entries(E.RETIRED_PERSPECTIVES)) {
    const frozen = BASE.pairs[`${m.id}|${newId}`];
    if (!frozen) continue;
    mchecked++;
    const p = P(E.normalizePerspId(oldId));
    assert(`retired ${oldId} resolves to live successor ${newId}`, !!p && p.id === newId && p.kind === "exploration");
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    const trafficOk = s.ioRatio === frozen.ioRatio && s.cacheHit === frozen.cacheHit;
    const marginOk = frozen.margin === null ? !isFinite(w.margin) : Math.abs(w.margin * 100 - frozen.margin) < 5e-4;
    if (oldId === "teortaxes")
      assert(`migrated ${m.id}|teortaxes → x80-v3 retains the shipped rentMult 1.0 remediation`, s.rentMult === 1.0);
    if (!(marginOk && trafficOk)) assert(`migration parity ${m.id}|${oldId}→${newId}`, false,
      `traffic ${s.ioRatio}/${s.cacheHit} vs ${frozen.ioRatio}/${frozen.cacheHit}; margin ${(w.margin*100).toFixed(4)} vs ${frozen.margin}`);
  }
  assert(`all 60 retired pairs checked through the migration map (got ${mchecked})`, mchecked === 60);
}

// ---------- 4. Anti-lens-shopping span: byte-identical traffic for every contributor ----------
assert("lensSpan exported", typeof E.lensSpan === "function");
for (const m of E.MODELS) {
  const span = E.lensSpan(m, { mode: "native" });
  if (!span) continue;
  assert(`lensSpan(${m.id}) contributors share exact traffic`, span.contributors.every(c => c.ioRatio === span.ioRatio && c.cacheHit === span.cacheHit),
    JSON.stringify(span.contributors));
  assert(`lensSpan(${m.id}) has profile label`, typeof span.label === "string" && span.label.length > 0);
  assert(`lensSpan(${m.id}) excludes replays/analysts`, span.contributors.every(c => E.PERSPECTIVES.find(p => p.id === c.id).kind === "lens"));
  // v2.1.3: explorations are excluded by the same kind filter — page-authored counterfactual
  // routes may never widen or narrow the anti-shopping span.
  assert(`lensSpan(${m.id}) excludes exploration routes (kind filter)`,
    span.contributors.every(c => !EXPLORATIONS.some(p => p.id === c.id)), JSON.stringify(span.contributors.map(c => c.id)));
}
// The span must move when the traffic selection moves (it is conditional on traffic — stated, not hidden).
{
  const a = E.lensSpan(M("opus"), { mode: "native" });
  const b = E.lensSpan(M("opus"), { mode: "explicit", profileId: "uncached" });
  assert("span is traffic-conditional", !!a && !!b && (a.lo !== b.lo || a.hi !== b.hi));
}

// ---------- 5. Permalinks: v5 schema (live) + pre-v5 DEPRECATION (IM1 / v2.2) ----------
// The live codec is v5 (successor to v4): same relative diff + identity structure, additionally
// embedding a defaults-epoch and the displayed headline margin. Pre-v5 tokens (v2/v3/v4) are
// deprecated wholesale on this branch (see §5d and tests/epoch-deprecation.test.mjs).
assert("encodeScenario exported (pure)", typeof E.encodeScenario === "function");
assert("decodeScenario exported (pure)", typeof E.decodeScenario === "function");
{
  // v5 round-trip preserves resolved traffic + preset identity, and stamps epoch + displayed margin.
  const sel = { mode: "explicit", profileId: "ncode" };
  const s = E.applyPresetSettings(M("glm"), P("median"), sel);
  const link = E.encodeScenario(s, "glm", "median", E.resolveTraffic(M("glm"), P("median"), sel), null, { fleet: "preset", totalCase: "preset" });
  assert("v6 prefix (b9 M4 schema bump)", link.startsWith("v6."));
  const dec = E.decodeScenario(link);
  assert("v5 meta carries traffic identity", dec && dec._meta.traffic.profileId === "ncode" && dec._meta.traffic.ioRatio === 8 && dec._meta.traffic.cacheHit === 41);
  assert("v5 meta carries engine revision + preset ids", dec._meta.model === "glm" && dec._meta.persp === "median" && dec._meta.engine === "v3.0.0-2026-08-13");
  /* im-arc T4 fold (2026-08-24): the epoch bumps because the generic defaults moved
     (tests/fixtures-t4-declared-delta.json enumerates every moved sink). The property is
     unchanged — a token carries the epoch it was minted under. */
  assert("codec metadata carries the im-arc T4 fold epoch",
    dec._meta.epoch === E.DEFAULTS_EPOCH && E.DEFAULTS_EPOCH === "v25-im-arc-t4-fold-20260824");
  assert("v5 meta embeds the displayed margin (3dp)", typeof dec._meta.displayedMargin === "number"
    && Math.abs(dec._meta.displayedMargin - E.workload(s).margin * 100) < 5e-4);
  assert("v5 non-exploration link carries no explore block", dec._meta.explore === undefined);
}
{
  // v5 exploration links: route identity travels redundantly and round-trips atomically.
  const sel = { mode: "explicit", profileId: "reference" };
  const s = E.applyPresetSettings(M("opus"), P("x90-v1"), sel);
  const link = E.encodeScenario(s, "opus", "x90-v1", E.resolveTraffic(M("opus"), P("x90-v1"), sel), null, { fleet: "custom", totalCase: "custom" });
  const dec = E.decodeScenario(link);
  /* im-arc T4 fold (2026-08-24): x90-v1 is an ARCHIVED reading and carries the memo §6 pin
     bundle, so its computed bucket is UNMOVED at b8090 — the pin is what keeps it reproducing. */
  assert("v5 exploration route identity round-trips (persp + explore{rangeId,configId})",
    !!dec && dec._meta.persp === "x90-v1" && !!dec._meta.explore
    && dec._meta.explore.configId === "x90-v1" && dec._meta.explore.rangeId === "b8090");

  // Internally-contradictory v5 links are REJECTED whole (decode → null → default state renders,
  // never a mislabeled render). The forged tokens below each disagree with themselves. vm() supplies
  // the now-REQUIRED epoch/displayedMargin so each token reaches its INTENDED rejection (the identity/
  // explore conflict), not the required-field gate; the missing-field cases below omit them on purpose.
  const forge = obj => "v5." + Buffer.from(JSON.stringify(obj)).toString("base64");
  const vm = extra => ({ schema: "v5", epoch: E.DEFAULTS_EPOCH, displayedMargin: null, fleet: { id: "custom" }, totalCase: "custom", ...extra }); // im-arc T2: current epoch keeps each forgery reaching its INTENDED rejection, not a missing-identity reject
  const T = { mode: "explicit", profileId: "reference", ioRatio: 15, cacheHit: 60 };
  assert("v5 persp/configId conflict rejected",
    E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "x90-v1", traffic: T, explore: { rangeId: "b8090", configId: "x80-v3" } }) })) === null);
  assert("v5 rangeId conflict rejected (declared range ≠ computed range of the route)",
    E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "x90-v1", traffic: T, explore: { rangeId: "b90plus", configId: "x90-v1" } }) })) === null);
  assert("v5 explore block on a non-exploration persp rejected",
    E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "median", traffic: T, explore: { rangeId: "b90plus", configId: "x90-v1" } }) })) === null);
  assert("v5 exploration persp WITHOUT its explore block rejected (atomic identity)",
    E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "x90-v1", traffic: T }) })) === null);
  assert("v5 without a full traffic identity rejected",
    E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "median" }) })) === null);
  assert("v5 token with inner v4 schema rejected (token prefix is the schema authority)",
    E.decodeScenario(forge({ _meta: { schema: "v4", epoch: "v22", displayedMargin: null, model: "opus", persp: "median", traffic: T } })) === null);
  // Required-field strictness (fail-closed, consistent with the identity gates): a v5 token MUST carry
  // BOTH provenance fields, well-typed — the shipped encoder always embeds them.
  assert("v5 token MISSING epoch rejected",
    E.decodeScenario(forge({ _meta: { schema: "v5", displayedMargin: null, model: "opus", persp: "median", traffic: T } })) === null);
  assert("v5 token MISSING displayedMargin rejected",
    E.decodeScenario(forge({ _meta: { schema: "v5", epoch: "v22", model: "opus", persp: "median", traffic: T } })) === null);
  assert("v5 token with a malformed displayedMargin rejected (forged embedded field)",
    E.decodeScenario(forge({ _meta: vm({ displayedMargin: "lots", model: "opus", persp: "median", traffic: T }) })) === null);
  assert("v5 token with a non-string epoch rejected",
    E.decodeScenario(forge({ _meta: { schema: "v5", epoch: 22, displayedMargin: null, model: "opus", persp: "median", traffic: T } })) === null);
  assert("v5 displayedMargin=null accepted (infeasible-scenario embed is valid)",
    !!E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "median", traffic: T }) })));
  // A retired id inside a v5 explore block normalizes before the consistency check — a v5 link
  // hand-carrying the retired spelling still cross-checks against the successor route.
  const decR = E.decodeScenario(forge({ _meta: vm({ model: "opus", persp: "semi", traffic: T, explore: { rangeId: "b8090", configId: "semi" } }) }));
  assert("v5 retired-id spelling normalizes consistently (semi ≡ x90-v1)", !!decR);

  // Forward boundary: an unknown FUTURE prefix (v6) is disregarded whole — null → default renders,
  // never a half-read. (The pre-v5 boundary is the deprecation marker, asserted below.)
  assert("unknown future prefix rejected (forward-boundary rule)", E.decodeScenario("v6." + Buffer.from("{}").toString("base64")) === null);
}
{
  // v5 embedded margin + drift display (IM1 item 3): a v5 token records the margin the sharer saw;
  // when a later table moves it, the drift note surfaces both rather than pretending continuity.
  assert("DEFAULTS_EPOCH exported", E.DEFAULTS_EPOCH === "v25-im-arc-t4-fold-20260824");
  assert("marginDriftNote exported (pure)", typeof E.marginDriftNote === "function");
  const sel = { mode: "native" };
  const s = E.applyPresetSettings(M("opus"), P("median"), sel);
  const dec = E.decodeScenario(E.encodeScenario(s, "opus", "median", E.resolveTraffic(M("opus"), P("median"), sel), null, { fleet: "custom", totalCase: "custom" }));
  const embedded = dec._meta.displayedMargin;
  const fresh = E.workload(s).margin * 100;
  assert("embedded margin matches recompute on the SAME engine (no false drift)",
    E.marginDriftNote(embedded, fresh) === null, `${embedded} vs ${fresh}`);
  // Simulate a v2.2 table change: the Opus preset's active param moves 300→105. The SAME shared
  // input vector now recomputes a different margin; the drift note must show BOTH values.
  const s2 = structuredClone(s); s2.active = 105;
  const drifted = E.workload(s2, undefined, E.scenarioContext(s)).margin * 100;
  const note = E.marginDriftNote(embedded, drifted);
  assert("table change ⇒ drift detected with both values",
    !!note && Math.abs(note.sharedPct - embedded) < 1e-9 && Math.abs(note.currentPct - drifted) < 1e-9, JSON.stringify(note));
  assert("drift note text shows originally-shared and current-engine in the hero's ≈whole-percent form",
    !!note && /originally shared: ≈\d+% — current engine: ≈\d+%/.test(note.text)
    && !/\.\d/.test(note.text), note && note.text); // whole percent only; precise values live on the object
  assert("drift note keeps precise 3dp values on the object (for tolerance)",
    !!note && Math.abs(note.sharedPct - embedded) < 1e-9 && note.sharedPct !== Math.round(note.sharedPct));
  assert("within-tolerance recompute is NOT flagged as drift", E.marginDriftNote(77.878, 77.9) === null);
  assert("non-finite margin never drifts (infeasible scenario)", E.marginDriftNote(NaN, 80) === null && E.marginDriftNote(80, Infinity) === null);
}
{
  // v5 round-trip MATRIX (IM1 item 5b): mint fresh v5 tokens across the corpus category matrix and
  // assert BOTH the input vector and the headline margin round-trip. A pure port of the loader's
  // restore (applyPresetSettings + sanitizeScenarioDiff overlay), no DOM.
  const NUMKEYS = Object.keys(E.DEFAULTS).filter(k => typeof E.DEFAULTS[k] === "number");
  const restoreClean = (m, p, sel, dec) => {
    const S2 = E.applyPresetSettings(m, p, sel);
    const sane = E.sanitizeScenarioDiff(dec, E.resolveTraffic(m, p, sel));
    for (const [k, v] of Object.entries(sane.diff)) S2[k] = v;
    return S2;
  };
  const rtClean = (label, m, p, sel, mutate) => {
    const s = E.applyPresetSettings(m, p, sel);
    if (mutate) mutate(s);
    const dec = E.decodeScenario(E.encodeScenario(s, m.id, p.id, E.resolveTraffic(m, p, sel), null, { fleet: "custom", totalCase: "custom" }));
    assert(`v5 round-trip ${label}: decodes`, !!dec && !dec.__epochDeprecated);
    if (!dec || dec.__epochDeprecated) return;
    const s2 = restoreClean(m, p, sel, dec);
    const vecOk = NUMKEYS.every(k => Math.abs((s2[k] ?? NaN) - (s[k] ?? NaN)) < 1e-9 || JSON.stringify(s2[k]) === JSON.stringify(s[k]));
    assert(`v5 round-trip ${label}: input vector preserved`, vecOk);
    assert(`v5 round-trip ${label}: blend preserved`, JSON.stringify(s2.blend) === JSON.stringify(s.blend));
    const m1 = E.workload(s).margin, m2 = E.workload(s2).margin;
    assert(`v5 round-trip ${label}: margin preserved`,
      (!isFinite(m1) && !isFinite(m2)) || Math.abs(m2 - m1) < 1e-9, `${m1} vs ${m2}`);
  };
  // clean-native (every model) + clean-explicit + clean-dive/replay.
  for (const m of E.MODELS) rtClean(`clean-native ${m.id}`, m, P("median"), { mode: "native" });
  for (const pid of ["reference", "openai-dive", "uncached"]) rtClean(`clean-explicit opus/${pid}`, M("opus"), P("median"), { mode: "explicit", profileId: pid });
  rtClean("clean-custom opus 300:1/95%", M("opus"), P("median"), { mode: "custom", ioRatio: 300, cacheHit: 95 });
  for (const m of E.MODELS) if (m.dive) rtClean(`clean-dive ${m.id}`, m, P("dive"), { mode: "native" });
  // exploration routes (flagship + native + a drift model).
  for (const cfg of ["x90-v1", "x80-v3", "x80-v4", "x60-v3"]) {
    rtClean(`exploration ${cfg} @flagship`, M("opus"), P(cfg), { mode: "explicit", profileId: "reference" });
    rtClean(`exploration ${cfg} @native`, M("opus"), P(cfg), { mode: "native" });
  }
  // edge: the 2026-07-15 P0 class — a field set TO its global-default value that differs from the
  // preset's own (GPT active 105→300). Survives only because the encoder diffs the preset baseline.
  rtClean("edge gpt active→global-default(300)", M("gpt"), P("median"), { mode: "native" }, s => { s.active = E.DEFAULTS.active; });
  // edge: billCacheHit crossing its null default; blend override.
  rtClean("edge billCacheHit=20", M("dsv4"), P("median"), { mode: "native" }, s => { s.billCacheHit = 20; });
  rtClean("edge blend override", M("opus"), P("median"), { mode: "native" }, s => { s.blend = { h100: 50, h200: 50 }; });
  // modified identity: minted from a synthetic [modified scenario]; restores off global DEFAULTS.
  {
    const s = E.applyPresetSettings(M("opus"), P("median"), { mode: "native" }); s.rentMult = 1.37;
    const dec = E.decodeScenario(E.encodeScenario(s, "opus", "__modified", E.resolveTraffic(M("opus"), P("median"), { mode: "native" }), "a shared scenario", { fleet: "custom", totalCase: "custom" }));
    assert("v5 round-trip modified: decodes with modified identity", !!dec && dec._meta.modified && dec._meta.persp === null);
    const sane = E.sanitizeScenarioDiff(dec, null);
    const s2 = Object.assign(structuredClone(E.DEFAULTS), sane.diff);
    s2.ioRatio = dec._meta.traffic.ioRatio; s2.cacheHit = dec._meta.traffic.cacheHit;
    assert("v5 round-trip modified: margin preserved",
      Math.abs(E.workload(s2, undefined, E.makeScenarioContext(M("opus"), dec._meta.traffic)).margin - E.workload(s).margin) < 1e-9);
  }
}
{
  // DEPRECATION (IM1 / v2.2): v2/v3/v4 links no longer decode to a resolved object — each returns the
  // deprecation marker, so the loader shows the LOUD notice and renders the central scenario. The
  // marker is a fresh object with no _meta (nothing of the old token leaks). The full 84-token
  // real-corpus proof lives in tests/epoch-deprecation.test.mjs.
  const v3link = "v3." + Buffer.from(JSON.stringify({ _meta: { schema: "v3", model: "glm", persp: "median", traffic: { mode: "explicit", profileId: "ncode", ioRatio: 8, cacheHit: 41 } } })).toString("base64");
  const d3 = E.decodeScenario(v3link);
  assert("v3 link is deprecated (marker, not a resolved object)", !!d3 && d3.__epochDeprecated === true && d3.schema === "v3" && d3._meta === undefined);
  const v2link = "v2." + Buffer.from(JSON.stringify({ _meta: { schema: "v2", model: "glm", persp: "median" } })).toString("base64");
  const d2 = E.decodeScenario(v2link);
  assert("v2 link is deprecated (marker, not a resolved object)", !!d2 && d2.__epochDeprecated === true && d2.schema === "v2");
  const v4link = "v4." + Buffer.from(JSON.stringify({ _meta: { schema: "v4", model: "opus", persp: "median", traffic: { mode: "native", profileId: "reference", ioRatio: 15, cacheHit: 60 } } })).toString("base64");
  const d4 = E.decodeScenario(v4link);
  assert("v4 link is deprecated (marker, not a resolved object)", !!d4 && d4.__epochDeprecated === true && d4.schema === "v4");
}
{
  // Retired-id numeric-identity invariant (P0-6) survives the epoch change at the RESOLUTION layer:
  // normalizePerspId still maps a retired analyst id to its byte-identical successor route, so the
  // saved-preset migration path (still live) and any future re-mint reproduce identical numbers.
  // (Retired-id PERMALINKS themselves now deprecate — asserted above — so this exercises the pure
  // normalization + successor-vector equality, not decodeScenario.)
  const succ = E.applyPresetSettings(M("opus"), P("x80-v3"), { mode: "native" });
  const pid = E.normalizePerspId("teortaxes");
  assert("retired id normalizes to the successor route", pid === "x80-v3" && !!P(pid));
  const restored = E.applyPresetSettings(M("opus"), P(pid), { mode: "native" });
  assert("successor vector is byte-identical (retired ≡ successor)",
    Object.keys(E.DEFAULTS).every(k => JSON.stringify(restored[k]) === JSON.stringify(succ[k])));
  assert("successor route margin is identical", E.workload(restored).margin === E.workload(succ).margin);
}
{
  // migrateV2Traffic is retained as a PURE utility (still exported), though the loader no longer
  // calls it — v2 links deprecate before reaching any migration path (IM1). These assertions pin
  // the pure function's behaviour so the numeric-migration logic stays correct if ever re-used.
  assert("migrateV2Traffic exported", typeof E.migrateV2Traffic === "function");
  // (a) plain v2 link, model that owned its traffic: gpt|median → 9/78, mode legacy-custom
  const a = E.migrateV2Traffic(M("gpt"), P("median"), {});
  assert("v2 gpt|median migrates to 9/78 with recovered profile identity", a.ioRatio === 9 && a.cacheHit === 78 && a.mode === "explicit" && a.profileId === "openai-dive");
  // (b) v2 link with explicit diff wins
  const b = E.migrateV2Traffic(M("gpt"), P("median"), { ioRatio: 33 });
  assert("v2 explicit diff preserved", b.ioRatio === 33 && b.cacheHit === 78);
  // (c) silent model under an xAI lens kept the lens's 3/0 in v2
  const c = E.migrateV2Traffic(M("opus"), P("xaicash"), {});
  assert("v2 opus|xaicash migrates to 3/0", c.ioRatio === 3 && c.cacheHit === 0);
  // (d) the codec ambiguity (values equal to defaults were never encoded) resolves to old semantics
  const d = E.migrateV2Traffic(M("grok"), P("median"), {});
  assert("v2 grok|median migrates to 15/60 (old silent-model semantics)", d.ioRatio === 15 && d.cacheHit === 60);
}

// ---------- 6. Tariff records: coherence, binding, and stale-loudness ----------
/* RE-POINTED 2026-09-02 (owner note d85f73), then REWRITTEN the same day after GPT Pro review
   pr-20260902T175643Z-034d27 found four defects in the re-point itself. The story is the point:
   this alarm was built so the Sep-1-2026 Sonnet flip "cannot be forgotten". It fired on schedule —
   and the flip had been CANCELLED three weeks earlier, so its own assertion name ("flip preset to
   $3/$15") was instructing its reader to make the page wrong. The first repair removed the remedy
   but kept four holes: a length-10 date check that let "not-a-date" through and made the alarm FAIL
   OPEN FOREVER; `validUntil || reVerifyAfter`, which conflated business validity with evidence
   freshness so a rate valid through December would sleep past an October cancellation; two
   incompatible shapes under one `tariff` key; and an XOR that treated "is current" and "has an
   announced successor" as alternatives while binding nothing to the prices that actually compute.
   All four are closed in tests/tariff-contract.mjs, which is SHARED by both twins rather than
   duplicated, iterates EVERY model carrying a tariff, and — the part that matters most — asserts
   tariff.current equals set.priceIn/priceOut, so the record can never quietly drift from the
   calculator. */
{
  const withTariff = E.MODELS.filter(m => m.tariff);
  assert("at least one model carries a tariff record (else this contract is vacuous)", withTariff.length > 0);
  for (const m of withTariff) {
    const defects = validateTariff(m);
    assert(`tariff contract: ${m.id}`, defects.length === 0, defects.join(" | "));
  }
  /* The strict date parser is the fix for the fail-open hole, so prove it rejects what the old
     length check accepted. */
  for (const bad of ["not-a-date", "2027-99-99", "2026-02-30", "26-01-01", ""])
    assert(`tariff dates: ${JSON.stringify(bad)} is rejected (the old length-10 check let it through and the alarm failed open)`,
      parseIsoDay(bad) === null);
  assert("tariff dates: a real day parses", parseIsoDay("2026-09-02") !== null);
  /* NEGATIVE CONTROLS — a contract nobody has made fail is a contract nobody has tested. */
  { const drifted = structuredClone(withTariff[0]);
    drifted.set = { ...drifted.set, priceIn: drifted.set.priceIn + 1 };
    assert("tariff NEGATIVE CONTROL: metadata that drifts from set.priceIn is REJECTED",
      validateTariff(drifted).some(x => /drifted apart/.test(x))); }
  { const rotten = structuredClone(withTariff[0]);
    rotten.tariff.verification.reverifyBy = "2027-99-99";
    assert("tariff NEGATIVE CONTROL: a malformed re-verification date is REJECTED, not silently passed",
      validateTariff(rotten).some(x => /reverifyBy must be a real/.test(x))); }
  { /* A passed horizon must go loud, name the PROCEDURE, and name no price. Set verifiedAt back
       with it so this control tests staleness rather than tripping the max-cadence rule. */
    const overdue = structuredClone(withTariff[0]);
    overdue.tariff.verification.verifiedAt = "2026-01-01";
    overdue.tariff.verification.reverifyBy = "2026-01-15";
    assert("tariff NEGATIVE CONTROL: a passed horizon goes LOUD, names the procedure, and names no remedy",
      validateTariff(overdue).some(x => /VERIFICATION OVERDUE/.test(x) && /procedure|BACKLOG/.test(x) && !/\$3\/\$15/.test(x))); }
  { /* The cadence ceiling is enforced, not advisory. */
    const slack = structuredClone(withTariff[0]);
    slack.tariff.verification.reverifyBy = "2027-09-01";
    assert("tariff NEGATIVE CONTROL: a horizon beyond the maximum cadence is REJECTED",
      validateTariff(slack).some(x => /over the .*-day maximum/.test(x))); }
  { /* And the clock cannot be advanced without the evidence moving with it — the "edit one date
       and never look at the vendor" hole. */
    const dateOnly = structuredClone(withTariff[0]);
    dateOnly.tariff.verification.verifiedAt = "2026-09-20";
    dateOnly.tariff.verification.reverifyBy = "2026-10-15";
    assert("tariff NEGATIVE CONTROL: advancing verifiedAt without a fresher source observation is REJECTED",
      validateTariff(dateOnly).some(x => /not backed by any source observed on or after it/.test(x))); }
}

// ---------- 7. Scenario-link sanitizer (forged-permalink hardening, reception audit P0) ----------
{
  assert("sanitizeScenarioDiff exported", typeof E.sanitizeScenarioDiff === "function");
  const grok = M("grok"), xaiopp = P("xaiopp");
  const locked = E.resolveTraffic(grok, xaiopp, { mode: "native" });
  const forged = { ioRatio: 300, cacheHit: 95, rentMult: 1.37, evilKey: 1, priceOut: "not-a-number" };
  const out = E.sanitizeScenarioDiff(forged, locked);
  assert("forged traffic overlay rejected under replay lock", out.diff.ioRatio === undefined && out.diff.cacheHit === undefined);
  assert("unknown keys rejected", out.diff.evilKey === undefined);
  assert("type-mismatched values rejected", out.diff.priceOut === undefined);
  assert("legit fields survive", out.diff.rentMult === 1.37);
  assert("rejections reported", out.rejected.length >= 4, JSON.stringify(out.rejected));
  const open = E.resolveTraffic(M("opus"), P("median"), { mode: "native" });
  const ok = E.sanitizeScenarioDiff({ ioRatio: 42 }, open);
  assert("traffic overlay allowed when not locked", ok.diff.ioRatio === 42);
}

// ---------- 7b. Traffic state-consistency invariant (v2.1.3 M4; plan P0-B) ----------
// Displayed traffic identity == resolveTraffic() output == the ioRatio/cacheHit the margin
// computation reads. reconcileLinkTraffic is the single decision point the loader applies to
// every share-link diff: traffic values that disagree with the link's declared identity must
// flow through the traffic axis as an explicit Custom selection — never sit in the working
// state behind a still-displayed named profile.
{
  assert("reconcileLinkTraffic exported", typeof E.reconcileLinkTraffic === "function");
  const declared = E.resolveTraffic(M("opus"), P("median"), { mode: "explicit", profileId: "reference" });
  const r1 = E.reconcileLinkTraffic(declared, { ioRatio: 99, cacheHit: 1 });
  assert("conflicting diff traffic routes through the axis as Custom",
    r1.action === "custom" && r1.ioRatio === 99 && r1.cacheHit === 1);
  assert("agreeing diff traffic keeps the declared identity",
    E.reconcileLinkTraffic(declared, { ioRatio: 15, cacheHit: 60 }).action === "consistent");
  assert("no traffic keys in the diff → nothing to reconcile",
    E.reconcileLinkTraffic(declared, { util: 70, rentMult: 1.3 }).action === "none");
  const r4 = E.reconcileLinkTraffic(declared, { ioRatio: 99 }); // partial smuggle
  assert("partial traffic diff fills from the declared identity and still flips Custom",
    r4.action === "custom" && r4.ioRatio === 99 && r4.cacheHit === 60);
  const locked = E.resolveTraffic(M("grok"), P("xaiopp"), { mode: "native" });
  assert("locked replay: locked traffic wins (sanitizer strips the keys; nothing routes around the lock)",
    E.reconcileLinkTraffic(locked, { ioRatio: 300 }).action === "locked");
  // Under an exploration route the declared resolution is lens-like; a conflicting diff still
  // routes to Custom (the loader additionally exits route identity — DOM-asserted in the app suite).
  const exDecl = E.resolveTraffic(M("opus"), P("x90-v1"), { mode: "explicit", profileId: "reference" });
  const r5 = E.reconcileLinkTraffic(exDecl, { ioRatio: 300, cacheHit: 95 });
  assert("exploration + conflicting traffic diff → Custom routing, never a hidden mismatch",
    r5.action === "custom" && r5.ioRatio === 300 && r5.cacheHit === 95);
  // No identity restored at all (unknown model/persp in the link): diff traffic must still land
  // as Custom rather than under the default model's still-displayed native profile.
  const r6 = E.reconcileLinkTraffic(E.resolveTraffic(M("opus"), P("median"), { mode: "native" }), { ioRatio: 300, cacheHit: 95 });
  assert("unrestored identity + diff traffic → Custom routing", r6.action === "custom" && r6.ioRatio === 300);
}

// ---------- 8. Serving-regime registry replaces the retired decode multipliers ----------
{
  const s = E.applyPresetSettings(M("opus"), P("median"), { mode: "native" });
  const fast = structuredClone(s); fast.interact = "fast";
  const ctx = E.scenarioContext(s);
  const balancedOut = E.tokPerS(E.HW.h200, s, "out"), fastOut = E.tokPerS(E.HW.h200, fast, "out", undefined, ctx);
  assert("balanced/fast resolve distinct declared batches (h200 b=96 vs b=8)", balancedOut !== fastOut);
  const balancedIn = E.tokPerS(E.HW.h200, s, "in"), fastIn = E.tokPerS(E.HW.h200, fast, "in", undefined, ctx);
  assert("prefill remains a separately resolved leg at fixed traffic", Math.abs(fastIn - balancedIn) < 1e-12, `${fastIn} vs ${balancedIn}`);
}

// ---------- 9. §10 dive replays are genuinely list-price (batch/discount = 0) ----------
for (const m of E.MODELS) if (m.dive)
  assert(`dive ${m.id} is list-price (batchShare 0, discount 0)`, m.dive.batchShare === 0 && m.dive.discount === 0);

// ---------- 10. §7 prose dollar pins (stale-arithmetic alarm) ----------
{
  const w = E.workload(E.applyPresetSettings(M("opus"), P("median"), { mode: "native" }));
  assert("§7 pin: list $3.71875", Math.abs(w.priceMixList - 3.71875) < 1e-9, w.priceMixList);
  assert("§7 pin: realized $3.26785", Math.abs(w.priceMix - 3.26785156) < 1e-6, w.priceMix);
  // b9 M1 re-mint (manifest family 1): the blended cost re-derives on the FILTERED
  // na-blend default — $1.71618 → $2.11951 (R3, 6 members) → $2.05199 (FA J-9: 7 members
  // at the revised flagship size) → $1.33392 (b9 M1: the §C1 repaired defaults —
  // the Trainium legs stop costing $60/$52 per Mtok and the Blackwell η values stop
  // double-crediting FP4 precision).
  /* b9 M5: §7's prose now states BOTH readings, so the alarm pins both. The reference reading is
     computed at the trend-0 / family-1.0 pin (the same constructor the FA uses) and is
     BYTE-UNCHANGED; the ratified-prior reading is the live default, exactly the reference divided
     by E(+3 @ 3×/yr) on the cost side. Both are stale-loud against the prose. */
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): both readings move with
     the folded defaults — capex and cluster-overhead scope on the cost side, and three planning
     rents resolving as unavailable so the priced blend is a different, more expensive mix. The
     §7 prose is re-stated to these live values in the same commit; these pins are what keep the
     two from drifting apart again. */
  const wRef = E.workload(E.pinReferenceLevers(E.applyPresetSettings(M("opus"), P("median"), { mode: "native" })));
  /* im-vet-six-repairs (2026-09-20): both pins move with the Trainium withdrawal and the TPU
     numerator repair, and the §7 dollar walk on the page moves with them (asserted in
     tests/snapshots.test.mjs, which recomputes the sentence rather than pinning it).
     RE-MINTED AGAIN the same day when the completion gate ruled that DISCLOSING E2's basis
     inconsistency is neither repairing it nor withdrawing the contribution: the coefficient went
     from the mixed 0.521 to 0.519, both endpoints on one stated timing convention, and these two
     dollar pins moved the last fraction of a cent with it. */
  assert("§7 pin: cost $1.35908 at the public-evidence reference", Math.abs(wRef.costMix - 1.35907743437255) < 1e-6, wRef.costMix);
  assert("§7 pin: cost $1.03268 under the ratified-prior default", Math.abs(w.costMix - 1.0326755342000742) < 1e-6, w.costMix);
  assert("§7 pin: the two readings differ by EXACTLY E(+3 @ 3×/yr) on the cost side",
    Math.abs(wRef.costMix / w.costMix - Math.pow(3, 0.25)) < 1e-12, String(wRef.costMix / w.costMix));
}

// ---------- 11. Final-gate round 2: schema authority, bounds, identity migration, billing split ----------
{
  // Schema authority under v5 + deprecation: an inner-schema downgrade forgery on the LIVE (v5) codec
  // is rejected whole; a pre-v5 downgrade forgery deprecates by prefix (never parsed, never resolved).
  const forgedInnerV5 = "v5." + Buffer.from(JSON.stringify({ ioRatio: 300, _meta: { schema: "v2", model: "grok", persp: "xaiopp", traffic: { mode: "replay-locked", ioRatio: 3, cacheHit: 0 } } })).toString("base64");
  assert("v5 token with inner v2 schema is REJECTED (downgrade forgery)", E.decodeScenario(forgedInnerV5) === null);
  const forgedInnerV3 = "v3." + Buffer.from(JSON.stringify({ ioRatio: 300, _meta: { schema: "v2", model: "grok", persp: "xaiopp" } })).toString("base64");
  const df = E.decodeScenario(forgedInnerV3);
  assert("pre-v5 downgrade-forgery token is deprecated by prefix (never resolved)", !!df && df.__epochDeprecated === true && df.schema === "v3");

  const locked = E.resolveTraffic(M("grok"), P("xaiopp"), { mode: "native" });
  const out = E.sanitizeScenarioDiff({ util: 0, precision: "bogus", rentMult: 999999, blend: { h100: -5 }, active: -1 }, locked);
  assert("bounds: util 0 rejected", out.diff.util === undefined);
  assert("bounds: bogus precision rejected", out.diff.precision === undefined);
  assert("bounds: rentMult 999999 rejected", out.diff.rentMult === undefined);
  assert("bounds: negative blend rejected", out.diff.blend === undefined);
  assert("bounds: negative active rejected", out.diff.active === undefined);
  const impossible = E.sanitizeScenarioDiff({ active: 500, total: 200, stackMult: 2 }, null);
  assert("bounds: active parameters cannot exceed total parameters",
    impossible.diff.active === undefined && impossible.diff.total === undefined
    && impossible.rejected.some(x => /active exceeds total/.test(x)), JSON.stringify(impossible));
  assert("bounds: shared-link stack multiplier cannot exceed the visible reviewed range",
    impossible.diff.stackMult === undefined, JSON.stringify(impossible));
  const activeOnly = E.sanitizeScenarioDiff({ active: 500 }, null, { ...E.DEFAULTS, total: 200 });
  assert("bounds: an active-only overlay is checked against its resolved base total",
    activeOnly.diff.active === undefined && activeOnly.rejected.some(x => /active exceeds total/.test(x)),
    JSON.stringify(activeOnly));
  const totalOnly = E.sanitizeScenarioDiff({ total: 200 }, null, { ...E.DEFAULTS, active: 300 });
  assert("bounds: a total-only overlay is checked against its resolved base active size",
    totalOnly.diff.total === undefined && totalOnly.rejected.some(x => /active exceeds total/.test(x)),
    JSON.stringify(totalOnly));
  const appSource = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  assert("browser sliders clamp model-size edits before storing state",
    /clampModelSizeAxis\(p\.k,\s*v\)/.test(appSource));
  assert("browser tick buttons clamp model-size edits before storing state",
    /const bounded = Math\.min\(p\.max, Math\.max\(p\.min, tk\.v\)\)/.test(appSource)
      && /const next = clampModelSizeAxis\(p\.k, bounded\)/.test(appSource)
      && /S\[p\.k\] = next/.test(appSource));

  assert("overlayDivergesFromReplay flags active change", E.overlayDivergesFromReplay(M("grok"), P("xaiopp"), { active: 15 }) === true);
  assert("overlayDivergesFromReplay ignores no-op", E.overlayDivergesFromReplay(M("grok"), P("xaiopp"), {}) === false);

  /* im-vet-model-estimates (2026-09-19). This read glm -> "ncode", which was a good test BECAUSE
     ncode is not the page default: it could tell "migrated to the model's own named profile" apart
     from "fell back to the global default". glm's default is now Reference, so that discrimination
     is gone if the line simply follows it. The assertion therefore MOVES to a row that still has a
     non-default named profile (dsr1 -> deepseek-disclosure) and keeps the glm case beside it, so
     both the discriminating property and the changed row are covered. */
  const migDs = E.migrateV2Traffic(M("dsr1"), P("median"), {});
  assert("v2 exact-match migrates to the named profile (non-default profile, the discriminating case)",
    migDs.mode === "explicit" && migDs.profileId === "deepseek-disclosure" && migDs.migratedToProfile === true);
  const mig = E.migrateV2Traffic(M("glm"), P("median"), {});
  assert("v2 exact-match migrates to the named profile (glm, whose named profile is now Reference)",
    mig.mode === "explicit" && mig.profileId === "reference" && mig.migratedToProfile === true);
  const mig2 = E.migrateV2Traffic(M("gpt"), P("median"), { ioRatio: 33 });
  assert("v2 unmatched pair stays legacy-custom", mig2.mode === "legacy-custom" && mig2.ioRatio === 33);

  const s = E.applyPresetSettings(M("dsv4"), P("median"), { mode: "native" });
  const w0 = E.workload(s);
  const s1 = structuredClone(s); s1.billCacheHit = 0;
  const w1 = E.workload(s1, undefined, E.scenarioContext(s));
  assert("billable-share split: revenue moves, cost does not", Math.abs(w1.costMix - w0.costMix) < 1e-12 && w1.priceMix !== w0.priceMix);
  const s2 = structuredClone(s); s2.cacheHit = 10; s2.billCacheHit = s.cacheHit;
  const w2 = E.workload(s2, undefined, E.scenarioContext(s));
  assert("serving-reuse change with pinned billable share: cost moves, revenue does not", Math.abs(w2.priceMix - w0.priceMix) < 1e-12 && w2.costMix !== w0.costMix);
  assert("default is the labeled assumed-equal coupling", E.DEFAULTS.billCacheHit === null);
}

/* =====================================================================================
   SLICE C (design memo im4-sliceC-design-memo v9, GATE CLOSED): the wire-identity
   contract — C-7 fleet rows, C-8 decode table, the fleet-conditional encode baseline,
   the NORMATIVE restore order (hazard pair pinned by BLEND VECTOR + margin), and the
   named round-trips. Every row of the memo's two decode tables is a fixture here.
   ===================================================================================== */
{
  const M2 = id => E.MODELS.find(x => x.id === id), P2 = id => E.PERSPECTIVES.find(x => x.id === id);
  const sel = { mode: "native" };
  const opus = M2("opus"), median = P2("median");
  const tr = E.resolveTraffic(opus, median, sel);
  const trafficArg = { mode: "native", profileId: null, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit };
  const enc = (s, ids) => E.encodeScenario(s, "opus", "median", trafficArg, null, ids);
  const payloadOf = tok => JSON.parse(Buffer.from(tok.slice(3), "base64").toString("utf8"));
  const forge2 = obj => "v6." + Buffer.from(JSON.stringify(obj)).toString("base64"); // b9 M4: live codec prefix (prefix must agree with the copied payload's schema)
  const base = E.applyPresetSettings(opus, median, sel);

  // ---- encode: REQUIRED identities parameter (fail loud, never guess) ----
  assert("slice-C encode: missing identities THROWS",
    (() => { try { E.encodeScenario(base, "opus", "median", trafficArg, null); return false; } catch { return true; } })());

  // ---- fleetBaselineBlend: the chokepoint mirror ----
  assert("fleetBaselineBlend exported (pure)", typeof E.fleetBaselineBlend === "function");
  { const fb = E.fleetBaselineBlend(E.DEFAULT_FLEET_ID, base, { modelId: "opus", customDonor: base.customDonor });
    assert("baseline(default) === the chokepoint seed (clean state)", JSON.stringify(fb) === JSON.stringify(base.blend));
    const fbDT = E.fleetBaselineBlend("declared-topology", base, { modelId: "opus", customDonor: base.customDonor });
    assert("baseline(named non-default) === DECLARED registry weights (no filtering — D-5/D-7)",
      fbDT.h100 === 10 && fbDT.h200 === 15 && fbDT.gb200 === 25 && fbDT.gb300 === 15 && fbDT.tpu7 === 20 && fbDT.trn2 === 5 && fbDT.trn3 === 10);
    assert("baseline: custom/preset → null (identity-branch base stands)",
      E.fleetBaselineBlend("custom", base) === null && E.fleetBaselineBlend("preset", base) === null);
    assert("baseline: out-of-scope model → null (fail-closed)",
      E.fleetBaselineBlend(E.DEFAULT_FLEET_ID, E.applyPresetSettings(M2("gpt"), median, sel), { modelId: "gpt" }) === null); }

  // ---- named round-trips: every registry fleet, clean AND edited total AND edited precision — NO blend key ----
  for (const fid of Object.keys(E.FLEETS)) {
    for (const [label, mut] of [["clean", null], ["edited-total 10T", s => { s.total = 10000; }], ["edited-precision bf16", s => { s.precision = "bf16"; }]]) {
      const s = structuredClone(base); if (mut) mut(s);
      const fb = E.fleetBaselineBlend(fid, s, { modelId: "opus", customDonor: s.customDonor });
      if (fb) s.blend = fb;
      const ids = { fleet: fid, totalCase: mut ? "custom" : "revised-band-central-2.5" };
      const tok = enc(s, ids);
      const pay = payloadOf(tok);
      assert(`slice-C round-trip ${fid} ${label}: NO blend key in the token`, !("blend" in pay));
      const dec = E.decodeScenario(tok);
      assert(`slice-C round-trip ${fid} ${label}: decodes`, !!dec);
      assert(`slice-C round-trip ${fid} ${label}: identities preserved`, dec._meta.fleet.id === fid && dec._meta.totalCase === ids.totalCase);
      // NORMATIVE restore: base → non-blend diff → fleetBaselineBlend at the POST-diff state
      const restored = E.applyPresetSettings(opus, median, sel);
      for (const [k, v] of Object.entries(dec)) if (k !== "_meta" && k !== "blend") restored[k] = structuredClone(v);
      const fb2 = E.fleetBaselineBlend(fid, restored, { modelId: "opus", customDonor: restored.customDonor });
      if (fb2) restored.blend = fb2;
      assert(`slice-C round-trip ${fid} ${label}: restored blend VECTOR byte-identical`, JSON.stringify(restored.blend) === JSON.stringify(s.blend));
      const mA = E.workload(s, undefined, E.makeScenarioContext(opus, tr, s.customDonor)).margin;
      const mB = E.workload(restored, undefined, E.makeScenarioContext(opus, tr, restored.customDonor)).margin;
      assert(`slice-C round-trip ${fid} ${label}: margin preserved`, (!isFinite(mA) && !isFinite(mB)) || Math.abs(mA - mB) < 1e-9);
    }
  }

  // ---- THE HAZARD PAIR (R3/R4 rounds, twice-executed): default token + total:10000 ----
  { const sHaz = structuredClone(base); sHaz.total = 10000;
    const fbHaz = E.fleetBaselineBlend(E.DEFAULT_FLEET_ID, sHaz, { modelId: "opus", customDonor: sHaz.customDonor });
    sHaz.blend = fbHaz;
    const mNormative = E.workload(sHaz, undefined, E.makeScenarioContext(opus, tr, sHaz.customDonor)).margin * 100;
    const sStale = structuredClone(base); // seed@5T THEN apply the diff — the WRONG order
    sStale.blend = E.fleetBaselineBlend(E.DEFAULT_FLEET_ID, sStale, { modelId: "opus", customDonor: sStale.customDonor });
    sStale.total = 10000;
    const mStale = E.workload(sStale, undefined, E.makeScenarioContext(opus, tr, sStale.customDonor)).margin * 100;
    /* b9 M5 re-mint (default-state class): both orders now run at the ratified-prior default, so
       both move by exactly ÷E on the cost side. What this pair TESTS is the SEPARATION — the
       forbidden seed-then-diff order still lands somewhere else — and the gap is asserted
       explicitly below so a future re-mint cannot quietly collapse it.
       im-arc T4 fold (2026-08-24, declared delta): re-minted for the folded defaults. The
       SEPARATION is the property, and it survives — the two orders still land apart, and the gap
       assertion below is what proves this re-mint did not collapse it.
       im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
       re-minted again for the adopted planning rents, and the SEPARATION survives again — 2.6 points
       apart here against 1.6 before, so the hazard is if anything more visible. The gap assertion
       below is still what proves it. */
    /* im-vet-six-repairs (2026-09-20): re-minted for the Trainium withdrawal and the TPU numerator
       repair, and the SEPARATION is again what the re-mint has to preserve — it does, and it WIDENS
       to 6.1 points against 2.6 before, because the withdrawal removes the two legs the 10 T
       membership was going to drop anyway and leaves the stale seed holding h100 and gb200, which
       the normative order correctly drops at that size. The hazard is more visible, not less. */
    assert("hazard pair: NORMATIVE order margin 46.5443 (vetting-repairs re-mint)", Math.abs(mNormative - 46.5443) < 5e-4, String(mNormative));
    assert("hazard pair: stale seed-then-diff margin 52.6565 (the forbidden order, vetting-repairs re-mint)", Math.abs(mStale - 52.6565) < 5e-4, String(mStale));
    assert("hazard pair: the two orders stay SEPARATED — the decode-order hazard remains detectable",
      Math.abs(mStale - mNormative) > 1, String(mStale - mNormative));
    /* The retention evidence moves with the membership: at 2.5 T the default now holds h100 and
       gb200 (the two Trainium legs are withdrawn at every size), and the 10 T membership drops both
       on capacity — so those two weights surviving in the stale vector are exactly what proves the
       forbidden order kept a 2.5 T seed. trn2 is no longer evidence of anything here, because it is
       zero in both vectors. */
    assert("hazard pair: the two orders restore DIFFERENT blend VECTORS (stale retains the 2.5 T h100/gb200 weights the 10 T membership drops)",
      JSON.stringify(sHaz.blend) !== JSON.stringify(sStale.blend)
      && sStale.blend.h100 === 8 && sStale.blend.gb200 === 19
      && sHaz.blend.h100 === 0 && sHaz.blend.gb200 === 0); }

  // ---- C-7 fleet decode rows (every row a fixture) ----
  const cleanTok = enc(base, { fleet: "na-blend", totalCase: "revised-band-central-2.5" });
  const cleanPay = payloadOf(cleanTok);
  const mut = f => { const q = JSON.parse(JSON.stringify(cleanPay)); f(q); return forge2(q); };
  assert("C-7: clean na-blend token ACCEPTS", E.decodeScenario(cleanTok) !== null);
  assert("C-7: absent fleet REJECTS whole", E.decodeScenario(mut(q => { delete q._meta.fleet; })) === null);
  assert("C-7: mistyped fleet REJECTS whole", E.decodeScenario(mut(q => { q._meta.fleet = "na-blend"; })) === null);
  assert("C-7: unknown fleet id REJECTS whole", E.decodeScenario(mut(q => { q._meta.fleet = { id: "bogus" }; })) === null);
  assert("C-7: named id + blend diff REJECTS whole (fleet-vs-blend contradiction)",
    E.decodeScenario(mut(q => { q.blend = { h100: 50, h200: 50 }; })) === null);
  assert("C-7: preset + blend diff REJECTS whole", E.decodeScenario(mut(q => { q._meta.fleet = { id: "preset" }; q._meta.totalCase = "custom"; q.blend = { h100: 50, h200: 50 }; })) === null);
  /* M8 reconciliation fix (2026-08-12): the preset+blend contradiction is CLEAN-identity-scoped.
     A MODIFIED identity restores off DEFAULTS with no perspective to derive a preset blend from
     (fleetBaselineBlend("preset") === null), so its diff's blend key is the only carrier of the
     sharer's on-screen blend — e.g. any exploration route whose authored blend differs from
     DEFAULTS, after one dial edit. Before the fix encodeScenario minted this token and its own
     decoder refused it: assertSelfDecodable threw on every such Share click (live at ec7f360). */
  {
    const route = E.PERSPECTIVES.find(p => p.kind === "exploration");
    assert("C-7 modified-blend precondition: an exploration route exists", !!route);
    const sx = E.applyPresetSettings(M("opus"), route, { mode: "native" }); sx.active = sx.active + 1; // one dial edit → modified
    assert("C-7 modified-blend precondition: route blend differs from DEFAULTS (else this row is vacuous)",
      JSON.stringify(sx.blend) !== JSON.stringify(E.DEFAULTS.blend));
    let tokX = null, threwX = null;
    try {
      tokX = E.encodeScenario(sx, "opus", "__modified-exploration",
        E.resolveTraffic(M("opus"), route, { mode: "native" }), route.id, { fleet: "preset", totalCase: "custom" });
    } catch (e) { threwX = e.message; }
    assert("C-7: modified-exploration + preset fleet MINTS (encoder no longer refused by its own decoder)", threwX === null, threwX);
    const decX = E.decodeScenario(tokX);
    assert("C-7: modified + preset + blend diff ACCEPTS (the modified carve-out)", decX !== null);
    assert("C-7: modified + preset carve-out round-trips the blend",
      !!decX && JSON.stringify(Object.assign(structuredClone(E.DEFAULTS), E.sanitizeScenarioDiff(decX, null).diff).blend) === JSON.stringify(sx.blend));
    assert("C-7: the carve-out keeps the modified identity and preset fleet",
      !!decX && decX._meta.modified && decX._meta.modified.kind === "exploration" && decX._meta.fleet.id === "preset" && decX._meta.persp === null);
  }
  /* M8 gate-R1 fold (finding M8-R1-01, 2026-08-12): the SAME asymmetry existed one row down —
     totalCase "preset" + explicit total. Every model outside TOTAL_CASE_SCOPE carries
     totalCase "preset" with a preset total ≠ DEFAULTS.total, so a modified state of such a
     model made encodeScenario refuse its own token (Share threw). The C-7 row above could not
     see it: it uses opus (in scope) and totalCase "custom". This block pins the out-of-scope
     model case; the clean preset+total rejection stays fixtured at the C-8 row below. */
  {
    const route = E.PERSPECTIVES.find(p => p.kind === "exploration");
    const oos = E.MODELS.find(m => !m.scenario && m.id !== "custom" && !E.TOTAL_CASE_SCOPE.includes(m.id));
    assert("C-7 modified-total precondition: an out-of-TOTAL_CASE_SCOPE model exists", !!oos);
    const sy = E.applyPresetSettings(oos, route, { mode: "native" }); sy.active = sy.active + 1;
    assert("C-7 modified-total precondition: preset total differs from DEFAULTS (else vacuous)",
      sy.total !== E.DEFAULTS.total);
    let tokY = null, threwY = null;
    try {
      tokY = E.encodeScenario(sy, oos.id, "__modified-exploration",
        E.resolveTraffic(oos, route, { mode: "native" }), route.id, { fleet: "preset", totalCase: "preset" });
    } catch (e) { threwY = e.message; }
    assert("C-7: modified out-of-scope model + preset totalCase MINTS", threwY === null, threwY);
    const decY = E.decodeScenario(tokY);
    assert("C-7: modified + preset totalCase + total diff ACCEPTS (the modified carve-out)", decY !== null);
    assert("C-7: the total carve-out round-trips the sharer's total",
      !!decY && Object.assign(structuredClone(E.DEFAULTS), E.sanitizeScenarioDiff(decY, null).diff).total === sy.total);
  }
  /* Council F3 (2026-08-13): the staleness rule is ONE exported pure function shared by the
     encoder and the sender UI — pinned here so the two surfaces cannot diverge again. */
  {
    const oosM = E.MODELS.find(m => !m.scenario && m.id !== "custom" && !E.TOTAL_CASE_SCOPE.includes(m.id));
    const inM = E.MODELS.find(m => E.TOTAL_CASE_SCOPE.includes(m.id));
    const named = Object.keys(E.FLEETS).find(fid => !E.FLEETS[fid].models.includes(oosM.id));
    const caseId = Object.keys(E.TOTAL_CASES)[0];
    const n1 = E.normalizeModifiedIdentities(named, "custom", oosM.id);
    assert("F3 helper: stale named fleet downgrades to custom", n1.fleet === "custom" && n1.changed === true);
    const n2 = E.normalizeModifiedIdentities("preset", caseId, oosM.id);
    assert("F3 helper: out-of-scope case id downgrades to custom", n2.totalCase === "custom" && n2.changed === true);
    const n3 = E.normalizeModifiedIdentities("preset", "preset", inM.id);
    assert("F3 helper: impossible in-scope 'preset' downgrades to custom", n3.totalCase === "custom" && n3.changed === true);
    const n4 = E.normalizeModifiedIdentities("preset", "custom", oosM.id);
    assert("F3 helper: non-stale labels pass through untouched", n4.changed === false && n4.fleet === "preset" && n4.totalCase === "custom");
    const cf = "cf:abcd1234";
    assert("F3 helper: cf: ids are model-agnostic and never normalized",
      E.normalizeModifiedIdentities(cf, "custom", oosM.id).fleet === cf);
  }

  /* M8 gate-R2 fold (finding M8-R2-01, 2026-08-12): a model switch WHILE modified carries
     FLEET_ID / TOTAL_CASE_ID unchanged (refreshModifiedState freezes model-owned fields), so
     the mint can receive identity labels that no longer apply to the current model. The
     encoder now NORMALIZES stale labels to "custom" at the modified mint — values ride the
     diff — instead of writing a label the decode contract can never accept. Three shapes,
     all app-reachable via the switch matrix R2 measured (252 scope-crossing failures): */
  {
    const route = E.PERSPECTIVES.find(p => p.kind === "exploration");
    const inScope = E.MODELS.find(m => E.TOTAL_CASE_SCOPE.includes(m.id));
    const oos = E.MODELS.find(m => !m.scenario && m.id !== "custom" && !E.TOTAL_CASE_SCOPE.includes(m.id));
    // shape 1: modified state carrying a NAMED fleet whose models list excludes the current model
    const staleFleetId = Object.keys(E.FLEETS).find(fid => !E.FLEETS[fid].models.includes(oos.id));
    assert("C-7 R2 precondition: a named fleet excluding the OOS model exists", !!staleFleetId);
    const s1 = E.applyPresetSettings(oos, route, { mode: "native" }); s1.active = s1.active + 1;
    /* M8-R3-01 fold: the route's blend can EQUAL DEFAULTS.blend, making the round-trip row
       vacuous (R3 measured exactly that). Force a non-default on-screen blend so the blend
       carrier is exercised, and assert the token actually carries it. */
    s1.blend = { ...s1.blend, h100: (s1.blend.h100 || 0) + 7 };
    assert("C-7 R2 shape-1 precondition: blend differs from DEFAULTS (else the carrier row is vacuous)",
      JSON.stringify(s1.blend) !== JSON.stringify(E.DEFAULTS.blend));
    let tok1 = null, threw1 = null;
    try { tok1 = E.encodeScenario(s1, oos.id, "__modified-exploration",
      E.resolveTraffic(oos, route, { mode: "native" }), route.id, { fleet: staleFleetId, totalCase: "custom" });
    } catch (e) { threw1 = e.message; }
    assert("C-7 R2: stale named fleet at the modified mint MINTS", threw1 === null, threw1);
    const dec1 = E.decodeScenario(tok1);
    assert("C-7 R2: the stale named label was normalized to custom and the token ACCEPTS",
      dec1 !== null && dec1._meta.fleet.id === "custom");
    assert("C-7 R2: the on-screen blend still round-trips under the normalized label",
      !!dec1 && JSON.stringify(Object.assign(structuredClone(E.DEFAULTS), E.sanitizeScenarioDiff(dec1, null).diff).blend) === JSON.stringify(s1.blend));
    // shape 2: modified state carrying an out-of-scope total-case id (the citation-borrowing shape)
    const caseId = Object.keys(E.TOTAL_CASES)[0];
    const s2 = E.applyPresetSettings(oos, route, { mode: "native" }); s2.active = s2.active + 1;
    let tok2 = null, threw2 = null;
    try { tok2 = E.encodeScenario(s2, oos.id, "__modified-exploration",
      E.resolveTraffic(oos, route, { mode: "native" }), route.id, { fleet: "preset", totalCase: caseId });
    } catch (e) { threw2 = e.message; }
    assert("C-7 R2: stale OOS case id at the modified mint MINTS", threw2 === null, threw2);
    const dec2 = E.decodeScenario(tok2);
    assert("C-7 R2: the stale case label was normalized to custom and the token ACCEPTS",
      dec2 !== null && dec2._meta.totalCase === "custom");
    /* M8-R3-01 fold: the label row alone proved nothing about the VALUE. */
    assert("C-7 R2 shape-2 precondition: total differs from DEFAULTS (else the carrier row is vacuous)",
      s2.total !== E.DEFAULTS.total);
    assert("C-7 R2: shape-2 restored total equals the sharer's",
      !!dec2 && Object.assign(structuredClone(E.DEFAULTS), E.sanitizeScenarioDiff(dec2, null).diff).total === s2.total);
    // shape 3: modified state carrying totalCase "preset" while the current model is IN scope
    // (the sonnet-modified → switch-to-opus cell that opened R2's matrix)
    const s3 = E.applyPresetSettings(inScope, route, { mode: "native" }); s3.active = s3.active + 1;
    /* M8-R3-01 fold: the in-scope model's total can EQUAL DEFAULTS.total (2500), making the
       shape-3 total row vacuous. Force a non-default total — a modified state's total is a
       free-form edit, exactly the on-screen shape after a dial change. */
    s3.total = s3.total + 500;
    assert("C-7 R2 shape-3 precondition: total differs from DEFAULTS (else the carrier row is vacuous)",
      s3.total !== E.DEFAULTS.total);
    let tok3 = null, threw3 = null;
    try { tok3 = E.encodeScenario(s3, inScope.id, "__modified-exploration",
      E.resolveTraffic(inScope, route, { mode: "native" }), route.id, { fleet: "preset", totalCase: "preset" });
    } catch (e) { threw3 = e.message; }
    assert("C-7 R2: in-scope model wearing 'preset' at the modified mint MINTS", threw3 === null, threw3);
    const dec3 = E.decodeScenario(tok3);
    assert("C-7 R2: the impossible 'preset' label was normalized to custom and the token ACCEPTS",
      dec3 !== null && dec3._meta.totalCase === "custom");
    assert("C-7 R2: shape-3 total round-trips",
      !!dec3 && Object.assign(structuredClone(E.DEFAULTS), E.sanitizeScenarioDiff(dec3, null).diff).total === s3.total);
  }
  assert("C-7: out-of-scope named id REJECTS whole", E.decodeScenario(mut(q => { q._meta.model = "gpt"; q._meta.totalCase = "preset"; })) === null);
  assert("C-7: custom + blend diff ACCEPTS (the custom row)",
    E.decodeScenario(mut(q => { q._meta.fleet = { id: "custom" }; q._meta.totalCase = "custom"; q.blend = { h100: 50, h200: 50 }; })) !== null);

  // ---- C-8 decode table (all 8 rows) ----
  assert("C-8: case id, in scope, totalB matches → ACCEPT", E.decodeScenario(cleanTok) !== null);
  assert("C-8: case id OUT of scope → REJECT (citation-borrowing bar)",
    E.decodeScenario(forge2({ _meta: { ...cleanPay._meta, model: "gpt", persp: "median" } })) === null);
  assert("C-8: case id, totalB mismatch → REJECT (consistency)",
    E.decodeScenario(mut(q => { q._meta.totalCase = "stress-10"; })) === null);
  assert("C-8: in-scope 'preset' → REJECT (unreachable second clean encoding)",
    E.decodeScenario(mut(q => { q._meta.totalCase = "preset"; })) === null);
  { const glm = M2("glm");
    const sG = E.applyPresetSettings(glm, median, sel);
    const trG = E.resolveTraffic(glm, median, sel);
    const tokG = E.encodeScenario(sG, "glm", "median", { mode: "native", profileId: null, ioRatio: trG.ioRatio, cacheHit: trG.cacheHit }, null, { fleet: "preset", totalCase: "preset" });
    assert("C-8: out-of-scope 'preset', no total diff → ACCEPT (the OOS clean value)", E.decodeScenario(tokG) !== null);
    const payG = payloadOf(tokG);
    assert("C-8: 'preset' + explicit total diff → REJECT (contradiction)",
      E.decodeScenario(forge2({ ...payG, total: 4000 })) === null); }
  assert("C-8: 'custom' → ACCEPT, no constraint",
    E.decodeScenario(mut(q => { q._meta.totalCase = "custom"; })) !== null);
  assert("C-8: unknown totalCase value → REJECT whole", E.decodeScenario(mut(q => { q._meta.totalCase = "receipt-edge-9.9"; })) === null);
  assert("C-8: absent totalCase → REJECT whole", E.decodeScenario(mut(q => { delete q._meta.totalCase; })) === null);

  // ---- modified × named fleet (C-7 modified branch; base = DEFAULTS) ----
  { const sM = structuredClone(base); sM.rentMult = 1.4;
    const fbM = E.fleetBaselineBlend("declared-topology", sM, { modelId: "opus", customDonor: sM.customDonor });
    sM.blend = fbM;
    const tokM = E.encodeScenario(sM, "opus", "__modified", { mode: "custom", profileId: null, ioRatio: sM.ioRatio, cacheHit: sM.cacheHit }, "a shared scenario", { fleet: "declared-topology", totalCase: "custom" });
    const payM = payloadOf(tokM);
    assert("modified×named: NO blend key (fleet-conditional baseline on the modified branch too)", !("blend" in payM));
    const decM = E.decodeScenario(tokM);
    assert("modified×named: decodes with both identities", !!decM && decM._meta.modified && decM._meta.fleet.id === "declared-topology");
    // consistency guard on the modified branch: a case id must match against the DEFAULTS base
    assert("modified×named: case id inconsistent with DEFAULTS-base total REJECTS",
      E.decodeScenario(forge2({ ...payM, _meta: { ...payM._meta, totalCase: "stress-10" } })) === null); }

  // ---- scenario-key firewall: fleet/totalCase are _meta/tool-input ONLY ----
  { const { rejected } = E.sanitizeScenarioDiff({ fleet: "na-blend", totalCase: "stress-10", widthCases: {}, nShard: 8 }, null);
    assert("scenario-key firewall: top-level fleet/totalCase/widthCases/nShard all REJECTED by the sanitizer", rejected.length === 4); }
}

console.log(failures === 0 ? "\nALL CONTRACT TESTS PASS" : `\n${failures} CONTRACT FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
