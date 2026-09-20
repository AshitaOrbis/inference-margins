// PERMALINK ACROSS A BASELINE MOVE (row 499) — the test the 5-ter ruling said does not exist.
//
// Why it exists: the permalink codec is RELATIVE by design — `encodeScenario` stores a diff and the
// loader re-resolves that diff against a baseline at load time. The existing suite tests the codec's
// ROUND TRIP (mint → decode → restore under the SAME engine). It has never tested the codec's
// BEHAVIOUR ACROSS A BASELINE MOVE, which is the failure class the project's own IM1 epoch memo
// names first: "Any changed default silently shifts every field a modified link omitted because it
// equalled the old default. Silent, no reject."
//
// Two properties, both executed:
//   A. POSITIVE — moving which preset the page OPENS on (row 499's LANDING_DEFAULT_PERSP_ID) moves
//      NO token: every minted link restores to the same computed margin, to the float. This is the
//      whole reason row 499 implements the owner's page-open-default ruling as a landing-selection
//      change instead of a `DEFAULTS` move.
//   B. NEGATIVE CONTROL — when the baseline genuinely DOES move, the restored margin must not be
//      silently different: either it is unchanged, or `marginDriftNote` fires and names the epoch.
//      A negative control matters here because property A would also "pass" on an engine whose
//      drift machinery was simply broken.
// Run: node site/tests/permalink-defaults-move.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const NATIVE = { mode: "native", profileId: null };
const state = (m, p) => E.applyPresetSettings(m, p, NATIVE);
const marginOf = (s) => E.workload(s, undefined, E.makeScenarioContext(opus,
  { mode: "custom", ioRatio: s.ioRatio, cacheHit: s.cacheHit }, s.customDonor)).margin * 100;

// The reader cases are row 492's own measured table: the four fields a reader actually moves, plus
// a clean link (nothing moved — the case the memo says drifts hardest because it omits everything).
const CASES = [
  { name: "a clean link (nothing moved)", mutate: () => {} },
  { name: "occupancy moved to 60%", mutate: s => { s.util = 60; } },
  { name: "occupancy moved to 75%", mutate: s => { s.util = 75; } },
  { name: "cache hit moved to 40%", mutate: s => { s.cacheHit = 40; } },
  { name: "total params moved to 3.0T", mutate: s => { s.total = 3000; } },
];

const mint = (S, perspId) => E.encodeScenario(S, opus.id, perspId,
  { mode: "custom", ioRatio: S.ioRatio, cacheHit: S.cacheHit }, null,
  { fleet: "custom", totalCase: "custom" });

// The loader's restore, expressed exactly as app.js performs it: resolve the DECLARED identity, then
// overlay the sanitized diff. `__modified` identities resolve from global DEFAULTS instead, which is
// the branch a DEFAULTS move actually reaches.
const restore = (token) => {
  const diff = E.decodeScenario(token);
  if (!diff || diff.__epochDeprecated) return { deprecated: true, meta: (diff || {})._meta || {} };
  const meta = diff._meta || {}; delete diff._meta;
  const declared = { ioRatio: meta.traffic.ioRatio, cacheHit: meta.traffic.cacheHit };
  const persp = E.PERSPECTIVES.find(x => x.id === E.normalizePerspId(meta.persp));
  if (!persp) {
    // the `__modified` branch — the ONE path that resolves against global DEFAULTS, and therefore
    // the one a DEFAULTS move actually re-interprets. The engine's own restore is used, not a
    // hand-rolled merge, so this test exercises the shipped path.
    const clean = E.sanitizeScenarioDiff(diff, { locked: false }, E.DEFAULTS).diff;
    return { state: E.restoreModifiedLinkState(clean, declared, opus), meta };
  }
  const trafficSel = meta.traffic.mode === "custom" || meta.traffic.mode === "legacy-custom"
    ? { mode: "custom", ioRatio: declared.ioRatio, cacheHit: declared.cacheHit }
    : meta.traffic.mode === "explicit" ? { mode: "explicit", profileId: meta.traffic.profileId } : NATIVE;
  const base = E.applyPresetSettings(opus, persp, trafficSel);
  const clean = E.sanitizeScenarioDiff(diff, { locked: false }, base).diff;
  return { state: Object.assign(base, clean), meta };
};

// ---------------------------------------------------------------- A. the page-open default moved
{
  assert("the page-open default IS a different perspective from the central scenario (otherwise this test proves nothing)",
    E.LANDING_DEFAULT_PERSP_ID !== "median", E.LANDING_DEFAULT_PERSP_ID);
  assert("the page-open default resolves to a real perspective",
    !!E.PERSPECTIVES.find(p => p.id === E.LANDING_DEFAULT_PERSP_ID), E.LANDING_DEFAULT_PERSP_ID);

  let checked = 0;
  for (const c of CASES) {
    const S = state(opus, median);
    c.mutate(S);
    const displayed = marginOf(S);
    const token = mint(S, median.id);
    const r = restore(token);
    const got = marginOf(r.state);
    assert(`A: ${c.name} — restores to the margin its sharer saw, with the page opening on ${E.LANDING_DEFAULT_PERSP_ID}`,
      Math.abs(got - displayed) < 1e-9, `displayed ${displayed}, restored ${got}`);
    assert(`A: ${c.name} — no drift note is warranted (nothing moved)`,
      E.marginDriftNote(displayed, got) === null, JSON.stringify(E.marginDriftNote(displayed, got)));
    checked++;
  }
  assert(`A: all ${CASES.length} reader cases checked`, checked === CASES.length, String(checked));
}

// ------------------------------------------------------- B. the shipped electricity baseline move
{
  /* im-arc T2 (memo §6): this is no longer a synthetic DEFAULTS mutation. Forge the
     metadata of the token that the pre-move engine minted: its TCO state inherited
     kwh=0.07 and therefore omitted kwh from the relative diff. The current decoder
     resolves the same absent field from the adopted 0.0871 registry midpoint. */
  const S = state(opus, median);
  S.hwMode = "tco";
  const oldState = structuredClone(S); oldState.kwh = 0.07;
  const displayed = marginOf(oldState);
  const freshToken = mint(S, "__modified");
  const dot = freshToken.indexOf(".");
  const raw = JSON.parse(Buffer.from(freshToken.slice(dot + 1), "base64").toString("utf8"));
  delete raw.kwh;
  raw._meta.epoch = "v23r499";
  raw._meta.displayedMargin = displayed;
  const oldToken = freshToken.slice(0, dot + 1) + Buffer.from(JSON.stringify(raw), "utf8").toString("base64");
  const r = restore(oldToken);
  const restoredAfter = marginOf(r.state);
  const note = E.marginDriftNote(displayed, restoredAfter);

  assert("B: the real 0.07 → registry-0.0871 move changes an old TCO __modified link",
    Math.abs(restoredAfter - displayed) > 0.05, `displayed ${displayed}, restored ${restoredAfter}`);
  assert("B: and it is NOT silent — the drift machinery fires and states both numbers",
    !!note && typeof note.text === "string" && note.text.includes("originally shared"),
    JSON.stringify(note));
  assert("B: the current generic electricity baseline is the adopted registry midpoint",
    E.DEFAULTS.kwh === 0.0871, String(E.DEFAULTS.kwh));
}

// ------------------------------------------------- the epoch is the label the drift note leans on
{
  const S = state(opus, median);
  const token = mint(S, median.id);
  const meta = E.decodeScenario(token)._meta;
  assert("every minted token carries the defaults epoch it was minted under",
    meta.epoch === E.DEFAULTS_EPOCH, String(meta.epoch));
  assert("every minted token embeds the margin its sharer saw (the drift note's other half)",
    typeof meta.displayedMargin === "number" && isFinite(meta.displayedMargin), String(meta.displayedMargin));
  assert("a pre-v5 token is still refused loudly rather than re-resolved under today's baseline",
    (E.decodeScenario("v4.eyJ1dGlsIjo2MH0=") || {}).__epochDeprecated === true);
}

// ------------------------------------------------- TITLED LINKS (row 499, option B: title-in-token)
{
  const S = state(opus, median);
  const mkT = (title) => E.encodeScenario(S, opus.id, median.id,
    { mode: "custom", ioRatio: S.ioRatio, cacheHit: S.cacheHit }, null,
    { fleet: "custom", totalCase: "custom" }, title === undefined ? undefined : { title });

  assert("an untitled link carries no title key at all (byte-compatible with pre-feature tokens)",
    !("title" in E.decodeScenario(mkT(undefined))._meta));
  assert("a titled link round-trips its title",
    E.decodeScenario(mkT("my agentic-traffic case"))._meta.title === "my agentic-traffic case");
  assert("a title longer than the cap is truncated AT MINT, so what is carried is what renders",
    E.decodeScenario(mkT("x".repeat(200)))._meta.title.length === E.TITLE_MAX_CHARS);
  assert("a whitespace-only title is dropped rather than carried as an empty label",
    !("title" in E.decodeScenario(mkT("   "))._meta));
  assert("control characters are stripped, not rejected (a pasted newline is an accident, not a forgery)",
    E.decodeScenario(mkT("line\u0001break"))._meta.title === "line break");

  /* The security property, stated as the codec's job: a title is attacker-controlled text. It is
     carried VERBATIM (never sanitized into something else, which would render a lie) and the caller
     renders it as text. Markup in a title must survive as characters. */
  const evil = "<img src=x onerror=alert(1)>";
  assert("markup in a title survives as literal characters, unaltered",
    E.decodeScenario(mkT(evil))._meta.title === evil);

  /* Forged tokens: a hand-built token whose title violates the contract rejects WHOLE. */
  const forge = (metaPatch) => {
    const raw = JSON.parse(Buffer.from(mkT("ok").slice(3), "base64").toString("utf8"));
    Object.assign(raw._meta, metaPatch);
    return "v6." + Buffer.from(JSON.stringify(raw), "utf8").toString("base64");
  };
  assert("a non-string title rejects the token whole", E.decodeScenario(forge({ title: 42 })) === null);
  assert("an over-cap title rejects the token whole (never silently truncated on the way in)",
    E.decodeScenario(forge({ title: "y".repeat(E.TITLE_MAX_CHARS + 1) })) === null);
  assert("a title carrying control characters rejects the token whole (mint normalizes; decode does not)",
    E.decodeScenario(forge({ title: "bad\u0000title" })) === null);
  assert("an untrimmed title rejects the token whole", E.decodeScenario(forge({ title: "  padded  " })) === null);

  /* REGRESSION (review finding 2): `normalizeLinkTitle` must be IDEMPOTENT. It trimmed before
     capping, so a title whose 80th character was whitespace normalized to something ending in a
     space — and since decode requires normalize(t) === t, the encoder's own self-decode assertion
     threw and the reader's "copy scenario link" silently did nothing at all. */
  const boundary = "a".repeat(79) + " bcdef";
  assert("a title whose cap lands on whitespace still mints (normalize is idempotent)",
    typeof mkT(boundary) === "string");
  assert("...and what it carries is trimmed, so decode accepts its own mint",
    E.decodeScenario(mkT(boundary))._meta.title === "a".repeat(79));
  {
    let stable = true;
    for (const probe of [boundary, " x ".repeat(40), "b".repeat(E.TITLE_MAX_CHARS + 5), "  spaced  "]) {
      const once = E.normalizeLinkTitle(probe);
      if (once !== null && E.normalizeLinkTitle(once) !== once) stable = false;
    }
    assert("normalizeLinkTitle(normalizeLinkTitle(t)) === normalizeLinkTitle(t) for every probe", stable);
  }
}

console.log(failures === 0 ? "\nALL PERMALINK-BASELINE-MOVE CHECKS PASS" : `\n${failures} PERMALINK-BASELINE-MOVE FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
