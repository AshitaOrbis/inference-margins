// EPOCH DEPRECATION contract (IM1 / v2.2) — governing plan
// `orchestration/plans/im-reengineer-defaults-2026-07-16.md` §4 risk 1 (owner-RULED: DEPRECATION),
// memo `research/im1-permalink-epoch-memo.md`, fixture README `tests/fixtures-minted-tokens-README.md`.
// Run: node tests/epoch-deprecation.test.mjs
//
// The acceptance property (plan §6, "permalink epoch corpus green"): EVERY real pre-v5 token minted
// by the shipped v2.1.11 encoder must, under the v2.2 engine, DETERMINISTICALLY hit the deprecation
// path — decodeScenario returns the deprecation marker, NEVER a resolved object, NEVER null-with-a-
// silent-default, and NO field of the old token leaks through. All testing here is against LOCAL
// fixture strings only; no network, no production URLs.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CORPUS = require("./fixtures-minted-tokens-v211.json");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

// The complete minted corpus: 68 v4 + 8 v2 + 8 v3 = 84 real tokens (fixture README).
const tokens = [
  ...CORPUS.v4.map(r => ({ token: r.token, kind: "v4", id: r.id })),
  ...CORPUS.historical.map(r => ({ token: r.token, kind: r.encoderVersion, id: r.id })),
];
assert(`corpus loaded: 84 real minted tokens (${tokens.length})`, tokens.length === 84, String(tokens.length));
assert("corpus counts: 68 v4 + 16 historical (8 v2 + 8 v3)",
  CORPUS.v4.length === 68 && CORPUS.historical.length === 16
  && CORPUS.historical.filter(r => r.encoderVersion === "v2").length === 8
  && CORPUS.historical.filter(r => r.encoderVersion === "v3").length === 8);

// Every pre-v5 token deprecates deterministically, and the marker carries ONLY the deprecation flag
// + the schema tier — no numeric/identity field of the old token survives (the marker is a fresh
// object; decodeScenario never parses a deprecated token's body).
const MARKER_KEYS = ["__epochDeprecated", "schema"].sort().join(",");
let deprecated = 0, leaks = 0;
for (const { token, kind, id } of tokens) {
  const r = E.decodeScenario(token);
  const isMarker = !!r && r.__epochDeprecated === true && r.schema === kind;
  if (!isMarker) { assert(`token ${id} (${kind}) hits the deprecation marker`, false, JSON.stringify(r)); continue; }
  deprecated++;
  // No leaked fields: the marker's own-property set is EXACTLY {__epochDeprecated, schema}.
  const keys = Object.keys(r).sort().join(",");
  if (keys !== MARKER_KEYS) { leaks++; assert(`token ${id} (${kind}) marker leaks no old-token field`, false, keys); }
}
assert(`ALL 84 pre-v5 tokens deterministically deprecate (${deprecated}/84)`, deprecated === 84, String(deprecated));
assert(`NO deprecation marker leaks a field from the old token (${leaks} leaks)`, leaks === 0, String(leaks));

// The forbidden behaviour is a SILENT default (decode → null → default renders, no notice). Prove
// the deprecation marker is distinct from both the null case and a resolved v5 object.
assert("deprecation marker is NOT null (would be a silent default — forbidden)",
  E.decodeScenario(CORPUS.v4[0].token) !== null);
assert("a genuinely unknown/garbage token still returns null (no false deprecation notice)",
  E.decodeScenario("not-a-token") === null && E.decodeScenario("v6." + Buffer.from("{}").toString("base64")) === null);
// A live token resolves normally — it is NOT deprecated. b9 M4: the live codec is v6.
{
  const sel = { mode: "native" };
  const S = E.applyPresetSettings(E.MODELS.find(m => m.id === "opus"), E.PERSPECTIVES.find(p => p.id === "median"), sel);
  const live = E.encodeScenario(S, "opus", "median", E.resolveTraffic(E.MODELS.find(m => m.id === "opus"), E.PERSPECTIVES.find(p => p.id === "median"), sel), null, { fleet: "custom", totalCase: "custom" });
  const d = E.decodeScenario(live);
  assert("a current v6 token resolves (not deprecated)", !!d && !d.__epochDeprecated && d._meta.schema === "v6");
}
// b9 M4 (memo D-4, plan D-8): a v5 token — the pre-M4 shipped shape, schema "v5",
// fleet {id}, NO interlock — still RESOLVES (drift-warning path), never deprecated.
{
  const sel = { mode: "native" };
  const tr = E.resolveTraffic(E.MODELS.find(m => m.id === "opus"), E.PERSPECTIVES.find(p => p.id === "median"), sel);
  const v5diff = { _meta: { dataAsOf: E.DATA_AS_OF, schema: "v5", engine: E.ENGINE_REVISION,
    epoch: E.DEFAULTS_EPOCH, displayedMargin: 59.2, model: "opus", persp: "median",
    fleet: { id: "custom" }, totalCase: "custom",
    traffic: { mode: tr.mode, profileId: tr.profileId ?? null, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit } } };
  const v5tok = "v5." + Buffer.from(JSON.stringify(v5diff), "utf8").toString("base64");
  const d5 = E.decodeScenario(v5tok);
  assert("a v5 token still resolves under the v6 decoder (D-8 drift path, not deprecated)",
    !!d5 && !d5.__epochDeprecated && d5._meta.schema === "v5");
}

console.log(`\n${failures === 0 ? "ALL EPOCH-DEPRECATION TESTS PASS" : failures + " EPOCH-DEPRECATION FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
