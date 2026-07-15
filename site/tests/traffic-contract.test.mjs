// TRAFFIC MIX state-resolution contract (methodology v2.1.2) — written BEFORE implementation
// per the 2026-07-11 plan reviews (GPT Pro P0 #1 / council P0 #1: "failing fixtures first").
// Run: node tests/traffic-contract.test.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
const BASE = require("./fixtures-baseline-v211.json");

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
assert("the 4 discourse-tied exploration routes ship",
  EXPLORATIONS.length === 4 && ["x60-v3", "x80-v3", "x80-v4", "x90-v1"].every(id => EXPLORATIONS.some(p => p.id === id)),
  EXPLORATIONS.map(p => p.id).join(","));
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

// ---------- 3. Parity vs the frozen v2.1.1 baseline ----------
// Intentional deltas (documented in the migration manifest): hard-gated cross-scope pairs of the
// xAI valuation replays now resolve to the replay's atomic operating point (3/0) instead of
// inheriting the model's traffic. Everything else must match the freeze byte-for-byte.
// v2.1.3: the 60 retired-analyst pairs (teortaxes/zephyr/semi/skeptic × 15 models) no longer
// iterate here — they are checked in §3b through the RETIRED_PERSPECTIVES migration map against
// their numeric-identical successor routes. Surviving fixture pairs: 180 − 60 retired = 120, of
// which 28 are the xAI cross-scope INTENTIONAL deltas ⇒ 92 byte-parity pairs.
{
  const INTENTIONAL = new Set();
  for (const m of E.MODELS) if (m.id !== "grok")
    for (const pid of ["xaicash", "xaiopp"]) INTENTIONAL.add(`${m.id}|${pid}`);
  let checked = 0, deltas = 0;
  for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
    const key = `${m.id}|${p.id}`;
    const frozen = BASE.pairs[key];
    if (!frozen) continue;
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    const marginOk = frozen.margin === null || Math.abs(w.margin * 100 - frozen.margin) < 5e-4; // fixture stores 4 decimals
    const trafficOk = s.ioRatio === frozen.ioRatio && s.cacheHit === frozen.cacheHit;
    if (INTENTIONAL.has(key)) {
      if (!trafficOk) deltas++;
      assert(`delta pair ${key} resolves to the replay's 3/0`, s.ioRatio === 3 && s.cacheHit === 0);
      continue;
    }
    checked++;
    if (!(marginOk && trafficOk)) assert(`parity ${key}`, false, `traffic ${s.ioRatio}/${s.cacheHit} vs ${frozen.ioRatio}/${frozen.cacheHit}; margin ${(w.margin*100).toFixed(4)} vs ${frozen.margin}`);
  }
  assert(`parity holds for all 92 surviving non-delta pairs (got ${checked})`, checked === 92);
  assert("every intentional delta is a hard-gated xAI cross-scope pair", deltas <= INTENTIONAL.size);
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
    const frozen = BASE.pairs[`${m.id}|${oldId}`];
    if (!frozen) continue;
    mchecked++;
    const p = P(E.normalizePerspId(oldId));
    assert(`retired ${oldId} resolves to live successor ${newId}`, !!p && p.id === newId && p.kind === "exploration");
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    const trafficOk = s.ioRatio === frozen.ioRatio && s.cacheHit === frozen.cacheHit;
    if (oldId === "teortaxes") {
      assert(`migrated ${m.id}|teortaxes → x80-v3: remediated rentMult 1.0 + traffic parity`, s.rentMult === 1.0 && trafficOk);
      continue;
    }
    const marginOk = frozen.margin === null || Math.abs(w.margin * 100 - frozen.margin) < 5e-4;
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

// ---------- 5. Permalinks: v4 schema + v3/v2 numeric-identity migration ----------
assert("encodeScenario exported (pure)", typeof E.encodeScenario === "function");
assert("decodeScenario exported (pure)", typeof E.decodeScenario === "function");
{
  // v4 round-trip preserves resolved traffic + preset identity.
  const sel = { mode: "explicit", profileId: "ncode" };
  const s = E.applyPresetSettings(M("glm"), P("median"), sel);
  const link = E.encodeScenario(s, "glm", "median", E.resolveTraffic(M("glm"), P("median"), sel));
  assert("v4 prefix (schema bump)", link.startsWith("v4."));
  const dec = E.decodeScenario(link);
  assert("v4 meta carries traffic identity", dec && dec._meta.traffic.profileId === "ncode" && dec._meta.traffic.ioRatio === 8 && dec._meta.traffic.cacheHit === 41);
  assert("v4 meta carries engine revision + preset ids", dec._meta.model === "glm" && dec._meta.persp === "median" && /^v2\.1\./.test(dec._meta.engine));
  assert("v4 non-exploration link carries no explore block", dec._meta.explore === undefined);
}
{
  // v4 exploration links: route identity travels redundantly and round-trips atomically.
  const sel = { mode: "explicit", profileId: "reference" };
  const s = E.applyPresetSettings(M("opus"), P("x90-v1"), sel);
  const link = E.encodeScenario(s, "opus", "x90-v1", E.resolveTraffic(M("opus"), P("x90-v1"), sel));
  const dec = E.decodeScenario(link);
  assert("v4 exploration route identity round-trips (persp + explore{rangeId,configId})",
    !!dec && dec._meta.persp === "x90-v1" && !!dec._meta.explore
    && dec._meta.explore.configId === "x90-v1" && dec._meta.explore.rangeId === "b90plus");

  // Internally-contradictory v4 links are REJECTED whole (decode → null → default state renders,
  // never a mislabeled render). The forged tokens below each disagree with themselves.
  const forge = obj => "v4." + Buffer.from(JSON.stringify(obj)).toString("base64");
  const T = { mode: "explicit", profileId: "reference", ioRatio: 15, cacheHit: 60 };
  assert("v4 persp/configId conflict rejected",
    E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "x90-v1", traffic: T, explore: { rangeId: "b90plus", configId: "x80-v3" } } })) === null);
  assert("v4 rangeId conflict rejected (declared range ≠ computed range of the route)",
    E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "x90-v1", traffic: T, explore: { rangeId: "b6080", configId: "x90-v1" } } })) === null);
  assert("v4 explore block on a non-exploration persp rejected",
    E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "median", traffic: T, explore: { rangeId: "b90plus", configId: "x90-v1" } } })) === null);
  assert("v4 exploration persp WITHOUT its explore block rejected (atomic identity)",
    E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "x90-v1", traffic: T } })) === null);
  assert("v4 without a full traffic identity rejected",
    E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "median" } })) === null);
  assert("v4 token with inner v3 schema rejected (token prefix is the schema authority)",
    E.decodeScenario(forge({ _meta: { schema: "v3", model: "opus", persp: "median", traffic: T } })) === null);
  // A retired id inside a v4 explore block normalizes before the consistency check — a v4 link
  // hand-carrying the retired spelling still cross-checks against the successor route.
  const decR = E.decodeScenario(forge({ _meta: { schema: "v4", model: "opus", persp: "semi", traffic: T, explore: { rangeId: "b90plus", configId: "semi" } } }));
  assert("v4 retired-id spelling normalizes consistently (semi ≡ x90-v1)", !!decR);

  // The v4 boundary in the OTHER direction: unknown prefixes are disregarded whole — this is the
  // exact rule by which the shipped v3 decoder (which accepted only "v3."/"v2.") cleanly ignores
  // a v4 link: null → link disregarded, default state renders, never a half-read.
  assert("unknown prefix rejected (forward-boundary rule)", E.decodeScenario("v5." + Buffer.from("{}").toString("base64")) === null);
}
{
  // v3 and v2 links still decode (backward compatibility — shipped links keep working).
  const v3link = "v3." + Buffer.from(JSON.stringify({ _meta: { schema: "v3", model: "glm", persp: "median", traffic: { mode: "explicit", profileId: "ncode", ioRatio: 8, cacheHit: 41 } } })).toString("base64");
  const d3 = E.decodeScenario(v3link);
  assert("v3 link still decodes with its schema", !!d3 && d3._meta.schema === "v3" && d3._meta.traffic.profileId === "ncode");
  const v2link = "v2." + Buffer.from(JSON.stringify({ _meta: { schema: "v2", model: "glm", persp: "median" } })).toString("base64");
  assert("v2 link still decodes", !!E.decodeScenario(v2link));
}
{
  // Migrated retired-id link reproduces IDENTICAL numbers (P0-6): a shipped v3 link minted under
  // the retired analyst id restores — via normalizePerspId BEFORE the PERSPECTIVES.find() — onto
  // the byte-identical successor vector; the overlay is then a numeric no-op.
  const succ = E.applyPresetSettings(M("opus"), P("x80-v3"), { mode: "native" });
  const diff = {};
  for (const [k, v] of Object.entries(succ)) if (JSON.stringify(v) !== JSON.stringify(E.DEFAULTS[k])) diff[k] = v;
  diff._meta = { dataAsOf: "2026-07-11", schema: "v3", engine: "v2.1.2b-2026-07-11", model: "opus", persp: "teortaxes",
                 traffic: { mode: "native", profileId: "reference", ioRatio: 15, cacheHit: 60 } };
  const link = "v3." + Buffer.from(JSON.stringify(diff)).toString("base64");
  const dec = E.decodeScenario(link);
  assert("retired-id v3 link decodes", !!dec && dec._meta.persp === "teortaxes");
  const pid = E.normalizePerspId(dec._meta.persp);
  assert("retired id normalizes to the successor BEFORE lookup", pid === "x80-v3" && !!P(pid));
  const restored = E.applyPresetSettings(M(dec._meta.model), P(pid), { mode: "native" });
  const clean = E.sanitizeScenarioDiff(dec, E.resolveTraffic(M(dec._meta.model), P(pid), { mode: "native" })).diff;
  assert("migrated link overlay is a numeric no-op on the successor vector",
    Object.keys(clean).every(k => JSON.stringify(restored[k]) === JSON.stringify(succ[k])), JSON.stringify(clean));
  Object.assign(restored, structuredClone(clean));
  assert("migrated link margin is IDENTICAL to the successor route's",
    E.workload(restored).margin === E.workload(succ).margin,
    `${E.workload(restored).margin} vs ${E.workload(succ).margin}`);
}
{
  // v2 links still decode, and migration reproduces the OLD effective traffic.
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

// ---------- 6. Dated-tariff stale-loudness (Sep-1 Sonnet flip cannot be forgotten) ----------
{
  const sonnet = M("sonnet");
  assert("sonnet carries tariff validity metadata", !!(sonnet.tariff && sonnet.tariff.validUntil === "2026-08-31" && sonnet.tariff.flipTo));
  const expired = new Date() > new Date((sonnet.tariff && sonnet.tariff.validUntil) + "T23:59:59Z");
  assert("SONNET INTRO TARIFF EXPIRED — flip preset to $3/$15 and update §5 (this failure is the alarm)", !expired);
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

// ---------- 8. Interactivity is decode-only (§3 prose contract) ----------
{
  const s = E.applyPresetSettings(M("opus"), P("median"), { mode: "native" });
  const fast = structuredClone(s); fast.interact = "fast";
  const outRatio = E.tokPerS(E.HW.gb200, fast, "out") / E.tokPerS(E.HW.gb200, s, "out");
  const inRatio = E.tokPerS(E.HW.gb200, fast, "in") / E.tokPerS(E.HW.gb200, s, "in");
  assert("interactivity scales decode (0.35/0.70 = 0.5 from balanced)", Math.abs(outRatio - 0.5) < 1e-9, outRatio);
  assert("interactivity leaves prefill unchanged", Math.abs(inRatio - 1.0) < 1e-12, inRatio);
}

// ---------- 9. §10 dive replays are genuinely list-price (batch/discount = 0) ----------
for (const m of E.MODELS) if (m.dive)
  assert(`dive ${m.id} is list-price (batchShare 0, discount 0)`, m.dive.batchShare === 0 && m.dive.discount === 0);

// ---------- 10. §7 prose dollar pins (stale-arithmetic alarm) ----------
{
  const w = E.workload(E.applyPresetSettings(M("opus"), P("median"), { mode: "native" }));
  assert("§7 pin: list $3.71875", Math.abs(w.priceMixList - 3.71875) < 1e-9, w.priceMixList);
  assert("§7 pin: realized $3.26785", Math.abs(w.priceMix - 3.26785156) < 1e-6, w.priceMix);
  assert("§7 pin: cost $0.75885", Math.abs(w.costMix - 0.75884898) < 1e-6, w.costMix);
}

// ---------- 11. Final-gate round 2: schema authority, bounds, identity migration, billing split ----------
{
  const forgedInner = "v3." + Buffer.from(JSON.stringify({ ioRatio: 300, _meta: { schema: "v2", model: "grok", persp: "xaiopp" } })).toString("base64");
  assert("v3 token with inner v2 schema is REJECTED (downgrade forgery)", E.decodeScenario(forgedInner) === null);
  const ok = E.decodeScenario("v3." + Buffer.from(JSON.stringify({ _meta: { schema: "v3" } })).toString("base64"));
  assert("prefix-consistent token decodes", !!ok && ok._meta.schema === "v3");

  const locked = E.resolveTraffic(M("grok"), P("xaiopp"), { mode: "native" });
  const out = E.sanitizeScenarioDiff({ util: 0, precision: "bogus", rentMult: 999999, blend: { h100: -5 }, active: -1 }, locked);
  assert("bounds: util 0 rejected", out.diff.util === undefined);
  assert("bounds: bogus precision rejected", out.diff.precision === undefined);
  assert("bounds: rentMult 999999 rejected", out.diff.rentMult === undefined);
  assert("bounds: negative blend rejected", out.diff.blend === undefined);
  assert("bounds: negative active rejected", out.diff.active === undefined);

  assert("overlayDivergesFromReplay flags active change", E.overlayDivergesFromReplay(M("grok"), P("xaiopp"), { active: 15 }) === true);
  assert("overlayDivergesFromReplay ignores no-op", E.overlayDivergesFromReplay(M("grok"), P("xaiopp"), {}) === false);

  const mig = E.migrateV2Traffic(M("glm"), P("median"), {});
  assert("v2 exact-match migrates to the named profile", mig.mode === "explicit" && mig.profileId === "ncode" && mig.migratedToProfile === true);
  const mig2 = E.migrateV2Traffic(M("gpt"), P("median"), { ioRatio: 33 });
  assert("v2 unmatched pair stays legacy-custom", mig2.mode === "legacy-custom" && mig2.ioRatio === 33);

  const s = E.applyPresetSettings(M("dsv4"), P("median"), { mode: "native" });
  const w0 = E.workload(s);
  const s1 = structuredClone(s); s1.billCacheHit = 0;
  const w1 = E.workload(s1);
  assert("billable-share split: revenue moves, cost does not", Math.abs(w1.costMix - w0.costMix) < 1e-12 && w1.priceMix !== w0.priceMix);
  const s2 = structuredClone(s); s2.cacheHit = 10; s2.billCacheHit = s.cacheHit;
  const w2 = E.workload(s2);
  assert("serving-reuse change with pinned billable share: cost moves, revenue does not", Math.abs(w2.priceMix - w0.priceMix) < 1e-12 && w2.costMix !== w0.costMix);
  assert("default is the labeled assumed-equal coupling", E.DEFAULTS.billCacheHit === null);
}

console.log(failures === 0 ? "\nALL CONTRACT TESTS PASS" : `\n${failures} CONTRACT FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
