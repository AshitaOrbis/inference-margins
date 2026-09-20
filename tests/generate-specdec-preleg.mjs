/* T-1 PRE-LEG ORACLE generator — b9 spec-decode LEVER leg.
 *
 * Captures the engine's decode/prefill throughput and cost surface BEFORE the spec-decode
 * lever exists, so T-1 can prove the DEFAULT path is byte-identical after it lands.
 *
 * DETERMINISTIC BY CONSTRUCTION: no timestamps, no Math.random, no Date.now, and no key
 * sorting — insertion order IS the contract. The construction algorithm is pinned in
 * research/b9-spec-decode-lever-memo.md §13 and this file is its executable form; if the
 * two ever disagree, the memo's kernel governs and this file is the defect.
 *
 * Usage:  node tests/generate-specdec-preleg.mjs           # print digest to stdout
 *         node tests/generate-specdec-preleg.mjs --write   # also (re)write the fixture
 */
import { createRequire } from "module";
import { createHash } from "crypto";
import { writeFileSync } from "fs";

const require = createRequire(import.meta.url);
const site = new URL("../site/", import.meta.url).pathname;

const D = require(site + "engine-data-v22.js");
const R = require(site + "engine-roofline-v22.js");
globalThis.EngineDataV22 = D;
globalThis.RooflineV22 = R;
const E = require(site + "engine.js");

// CALL SHAPE, pinned (memo §13): applyPresetSettings with an explicit profileId. Mutating
// ioRatio/cacheHit directly leaves a stale WeakMap profileId and yields 9,920 bytes and a
// WRONG digest — that is a real reproduction trap, not a hypothetical.
export function buildPreLegOracle() {
  const m = E.MODELS.find(x => x.id === E.FLAGSHIP_SCOPE.modelId);
  const median = E.PERSPECTIVES.find(p => p.id === "median");

  const out = { scope: { model: m.id, perspective: median.id }, legs: {}, blended: {} };

  const scopes = [
    { key: "__flagship__", sel: E.FLAGSHIP_SCOPE.traffic },
    ...D.TRAFFIC_PROFILES.map(p => ({ key: p.id, sel: { mode: "explicit", profileId: p.id } })),
  ];

  for (const { key, sel } of scopes) {
    const s = E.pinReferenceLevers(E.applyPresetSettings(m, median, sel));
    const ctx = E.scenarioContext(s);
    const per = {};
    for (const hwKey of E.HW_ORDER) {
      const hw = E.HW[hwKey];
      if (!hw) continue;
      const fin = v => (Number.isFinite(v) ? v : null);   // raw double, or null. NO rounding.
      per[hwKey] = {                                       // THIS key order is the contract
        decodeTokPerS:  fin(E.tokPerS(hw, s, "out", undefined, ctx)),
        prefillTokPerS: fin(E.tokPerS(hw, s, "in",  undefined, ctx)),
        costOut:        fin(E.costPerMtok(hw, s, "out", undefined, ctx)),
        costIn:         fin(E.costPerMtok(hw, s, "in",  undefined, ctx)),
      };
    }
    out.legs[key] = per;
    out.blended[key] = { margin: E.workload(s, undefined, ctx).margin };
  }
  return out;
}

// UTF-8, no spacing argument, no trailing newline.
export function serialize(oracle) { return JSON.stringify(oracle); }
export function digest(payload) { return createHash("sha256").update(payload, "utf8").digest("hex"); }

const oracle = buildPreLegOracle();
const payload = serialize(oracle);
const sha = digest(payload);
const report = {
  sha256: sha,
  bytes: Buffer.byteLength(payload, "utf8"),
  scopeCount: Object.keys(oracle.legs).length,          // SCOPES, not legs — see note below
  legCount: Object.keys(oracle.legs.__flagship__).length,
  scopes: Object.keys(oracle.legs),
  flagshipMargin: oracle.blended.__flagship__.margin,
};
// NOTE: the draft generator reported the scope count under the label `legCount`. That is the
// exact conflation the memo records at v7 ("v6 said all 7 HW_ORDER legs, conflating the leg
// count with the scope count"). Both are reported here, separately named.
console.log(JSON.stringify(report, null, 2));

if (process.argv.includes("--write")) {
  const path = new URL("./fixtures/specdec-preleg-3f89695.json", import.meta.url).pathname;
  writeFileSync(path, payload, "utf8");
  console.error("wrote " + path);
}
