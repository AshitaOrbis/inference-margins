/* im-arc T4 fold (2026-08-24) — the historical PIN BUNDLE, generated, not hand-listed.
   Spec: research/im-arc-t4-fold-memo.md §6 [F10].

   Memo §6 requires that "any arithmetic sink reachable by a historical state" have a historical
   value, and that the bundle be GENERATED rather than transcribed. This module is the one place
   that turns the declared-delta manifest's recorded `before.defaults` block into a state overlay,
   so every consumer — the T2 electricity gate, the render-parity receipts, any later leg —
   reproduces a pre-fold reading through the SAME bundle. Nothing here restates a value: every
   number is read out of tests/fixtures-t4-declared-delta.json, which the mint writes.

   A pre-fold state is `Object.assign(state, preT4Overlay())`. Every key in the overlay is inert
   at its live default, so applying it to an already-pinned state is idempotent. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
/* The LIVE registry module, held by reference so the pins below reach the same objects the
   roofline captured at load (see withPreT4Registry). */
const ED_LIVE = require("../engine-data-v22.js");

const MANIFEST = JSON.parse(readFileSync(
  new URL("./fixtures-t4-declared-delta.json", import.meta.url), "utf8"));

/* The engine keys a state can carry. `clusterOh` is NOT overlaid as a number: the pre-fold
   semantics are "every row takes the scenario clusterOh", which is what capexScopeMode:
   "legacy-global" restores — writing 1.30 into the state would only reproduce it by accident. */
export function preT4Overlay() {
  const before = MANIFEST.before.defaults;
  return {
    kwh: before.kwh,
    dcPerW: before.dcPerW,
    dcLifeYears: before.dcLifeYears,
    clusterOh: before.clusterOh,
    opexPct: before.opexPct,
    pue: before.pue,
    lifeYears: before.lifeYears,
    capexScopeMode: "legacy-global",
    capitalRecovery: "off",
    capexAbsLeg: { ...before.capex },
    rentRegistryPin: { ...before.rent },
  };
}

/* The registry-level values a pre-fold reading needs that are NOT state keys. Consumers that
   reconstruct a registry-derived number (a region triple, the owned-TCO electricity inheritance)
   read them from here rather than restating them. */
export function preT4Registry() {
  return {
    regions: structuredClone(MANIFEST.before.defaults.regions),
    execSummaryOwnedTcoKwh: MANIFEST.before.defaults.execSummaryOwnedTcoKwh,
  };
}

export const PRE_T4_RECEIPT = MANIFEST.before.receipt;
export const PRE_T4_STATES = MANIFEST.before.states;
export const DECLARED_SINKS = MANIFEST.entries;
export const MANIFEST_REF = "tests/fixtures-t4-declared-delta.json";

/* A pre-fold state, built from a live one. Used by every gate that must still reproduce a
   reading taken before the fold. */
export function asPreT4(state, modelId) {
  /* r2 (2026-08-25): the overlay is applied through the ONE rule in applyPreT4Defaults below,
     so this bundle has a single restoration semantics rather than two that agree by luck. */
  const pinned = applyPreT4Defaults(structuredClone(state), undefined, modelId);
  /* structuredClone loses the SCENARIO_CONTEXT registration keyed on object identity, and a
     pinned state that silently lost its model context would throw at the first roofline call —
     or, worse, resolve against a stale one. Carry the registration across explicitly. */
  let context = null;
  try { context = E.scenarioContext(state); } catch { context = null; }
  if (context) E.registerScenarioContext(pinned, context);
  return pinned;
}

/* ---------------------------------------------------------------------------------------
   im-arc T4 fold, relaunch r2 (2026-08-25) — the bundle's SECOND HALF, added because the
   first half could not satisfy memo §6 on its own.

   §6 asks two different things of a pin bundle and only one of them is a state overlay:

     "The 270-state historical hash must still reproduce through the extended pin bundle;
      the 273-state pre-T4 receipt must reproduce through the same bundle plus the pre-T4
      defaults."

   A historical READING is a state, and `preT4Overlay()` restores it. A historical GRID is a
   state *and* the registry that state resolves against — REGIONS, DATACENTERS, PROGRAMMES and
   the coverage ledger are module data, not scenario keys, so no amount of state pinning moves
   them back. Both halves below are generated: one from the manifest, one from the archived
   pre-fold module bytes under im-arc/bak/. Nothing here restates a number.
   --------------------------------------------------------------------------------------- */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

/* ---- the state half: restore the pre-fold DEFAULT wherever the state took the default ----
   A blanket Object.assign is wrong for preset-derived states and quietly so: the x90-v1 and
   x90-v2 routes pin their own kwh, capex and rent as published historical readings, and
   overwriting those with the generic pre-fold defaults corrupts thirty records while looking
   like a restoration. The rule is narrower and is the honest one — a key that came from the
   defaults goes back to the pre-fold defaults; a key a preset pinned is already history and is
   left exactly as the preset states it. */
export function applyPreT4Defaults(state, _perspective, modelId) {
  const overlay = preT4Overlay();
  for (const [key, value] of Object.entries(overlay)) {
    if (JSON.stringify(state[key]) === JSON.stringify(E.DEFAULTS[key]))
      state[key] = structuredClone(value);
  }
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
     A MODEL TARIFF is an input too, and until now the bundle did not restore one — it had never
     needed to, because no fold had moved a published price. This one does: Grok's cacheReadMult
     goes from the 2026-07-08 launch rate (25%) to the published 15%, and `applyPresetSettings`
     copies model-owned keys onto every state, so a historical grid computed at 25 cannot reproduce
     through a live engine carrying 15.

     The restoration follows the SAME rule as the defaults above and for the same reason — a key the
     state took from the live model goes back to the pre-fold model's value; a key a preset pinned
     is already history and is left exactly as the preset states it. The pre-fold values are read
     out of the archived module bytes at the manifest's base commit, never transcribed, so this pin
     cannot drift away from the history it claims to restore. */
  if (modelId) {
    const baseModel = loadPreT4Module("./engine.js").MODELS.find((m) => m.id === modelId);
    const liveModel = E.MODELS.find((m) => m.id === modelId);
    if (baseModel && liveModel) {
      for (const key of E.MODEL_OWNED_KEYS) {
        const live = liveModel[key] !== undefined ? liveModel[key] : (liveModel.set || {})[key];
        const base = baseModel[key] !== undefined ? baseModel[key] : (baseModel.set || {})[key];
        if (base === undefined || JSON.stringify(live) === JSON.stringify(base)) continue;
        if (JSON.stringify(state[key]) === JSON.stringify(live))
          state[key] = structuredClone(base);
      }
    }
  }
  return state;
}

/* ---- the registry half: the pre-fold module bytes, read out of GIT, never transcribed ----
   r2b (2026-08-25, at landing): these bytes were first read from im-arc/bak/. That made `npm test`
   depend on an UNTRACKED sibling directory — fine on the machine the leg ran on, absent from a
   clean clone, which would have turned this gate into a confusing ENOENT rather than a check.
   The project already states its own position on that, in .gitignore: pre-edit archives are
   "redundant with git history once the edit lands". So the bundle reads the pre-fold bytes from
   git at the manifest's recorded base commit. Git is content-addressed, so this pin cannot drift,
   and it costs the repository nothing to store twice. im-arc/bak/ remains the leg's archive-first
   record and is cross-checked against these bytes below when it is present. */
const BASE_COMMIT = MANIFEST.before.baseCommit;
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
/* The three site modules the fold edited. Everything else the engine pulls in is BYTE-IDENTICAL
   to its pre-fold self, so the pre-fold engine is loaded against the LIVE copies of those — which
   is not a shortcut but the sharper test: if one of them had moved, the receipts stop reproducing. */
const ARCHIVED_MODULES = ["engine.js", "engine-data-v22.js", "engine-data-dc-v1.js"];

/* IS THE PINNED HISTORY REACHABLE AT ALL? (vetting round 2026-09-19, Astra pack E P1-1.)
   The bundle reads its pre-fold bytes from git at MANIFEST.before.baseCommit, which is a commit
   in the PRIVATE repository. The public mirror is a squashed one-commit-per-release snapshot
   and the reconstructed publish stage is not a git repository at all, so in both of those
   places `git show ad7a214:...` cannot resolve — and, until this was added, the reproduction
   suite died on it, taking `npm test` with it inside publish.sh's own validate_stage. Fetching
   more public history cannot recover the object; it was never pushed there.
   This is exactly the shape provenance-inputs.mjs governs for private FILES, so it follows the
   same rule: reachable ⇒ the receipts reproduce and are binding; unreachable ⇒ the consumer
   skips loudly, by count. The consumer is responsible for FAILING rather than skipping when
   the private tree is present, so a genuinely broken history is never silently tolerated. */
let historyProbe = null;
export function preT4HistoryAvailable() {
  if (historyProbe === null) {
    try {
      execFileSync("git", ["cat-file", "-e", BASE_COMMIT + ":site/engine.js"],
        { cwd: REPO_ROOT, stdio: "ignore" });
      historyProbe = true;
    } catch { historyProbe = false; }
  }
  return historyProbe;
}
export const PRE_T4_BASE_COMMIT = BASE_COMMIT;

function gitBytes(repoRelPath) {
  try {
    return execFileSync("git", ["show", BASE_COMMIT + ":" + repoRelPath],
      { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (cause) {
    throw new Error("the T4 pin bundle could not read " + repoRelPath + " at base commit "
      + BASE_COMMIT + ". The historical receipts are pinned to that commit's bytes "
      + "(tests/fixtures-t4-declared-delta.json -> before.baseCommit), so this gate needs git "
      + "history to be present. Original error: " + cause.message);
  }
}

const archiveCache = new Map();
export function loadPreT4Module(spec, fromDir = new URL("../", import.meta.url).pathname) {
  const abs = resolve(fromDir, spec);
  const file = basename(abs);
  if (!ARCHIVED_MODULES.includes(file)) return require(abs);
  if (archiveCache.has(abs)) return archiveCache.get(abs).exports;
  const source = gitBytes("site/" + file);
  const mod = { exports: {} };
  archiveCache.set(abs, mod);
  vm.runInNewContext(source, {
    module: mod, exports: mod.exports, console, process, Buffer, structuredClone,
    URL, TextEncoder, TextDecoder, __dirname: dirname(abs), __filename: abs,
    require: (request) => request.startsWith(".")
      ? loadPreT4Module(request, dirname(abs)) : require(request),
  }, { filename: abs });
  return mod.exports;
}

/* Swap the live registry module for its pre-fold self for the duration of `fn`.
   dcRegistry() resolves through require() on every call, so replacing the cached exports is
   enough — no engine hook exists for this and none is added: a production surface that lets
   callers substitute the registry is exactly the kind of thing a fold like this must not grow. */
export function withPreT4Registry(fn) {
  const path = require.resolve("../engine-data-dc-v1.js");
  const entry = require.cache[path];
  const liveExports = entry.exports;
  /* ROUND 6 (2026-08-25): the pin now DECLARES itself. The capex-scope rule's historical escape
     used to be inferred from DC_SCHEMA being absent, which silently disabled it in the browser;
     it is keyed on this explicit flag instead, so an opt-out is always something a caller said,
     never something the validator guessed from missing data. */
  entry.exports = { ...loadPreT4Module("./engine-data-dc-v1.js"), __preT4RegistryPin: true };
  /* im-vet-model-estimates (2026-09-19). A model's DEFAULT TRAFFIC PROFILE is pinned here rather
     than in applyPreT4Defaults, because it is not a state key: `scenarioContext` resolves the
     profile id from the MODEL, and the roofline reads its absolute lengths from that id
     (TRAFFIC_OSL) — so restoring ioRatio/cacheHit onto the state leaves the context, and therefore
     K(L) and every decode cost, on the live profile. Scoped and reverted exactly like the registry
     swap above, read from the archived module bytes at the manifest's base commit and never
     transcribed. The two Zhipu rows moved ncode -> reference on 2026-09-19; with this pin the
     historical receipts f98b97a1…, 8c4bdffd… and 22baff37… stay the record this gate re-earns
     instead of being re-minted to match a new number. */
  const baseModels = loadPreT4Module("./engine.js").MODELS;
  const swapped = [];
  for (const live of E.MODELS) {
    const base = baseModels.find((m) => m.id === live.id);
    if (!base || !base.nativeTraffic || base.nativeTraffic === live.nativeTraffic) continue;
    swapped.push([live, live.nativeTraffic]);
    live.nativeTraffic = base.nativeTraffic;
  }
  try { return withPreVettingRegistry(fn); } finally {
    entry.exports = liveExports;
    for (const [live, was] of swapped) live.nativeTraffic = was;
  }
}

/* THE 2026-09-20 REGISTRY PIN, on its own so it can be used WITHOUT the pre-T4 state bundle.
   im-vet-six-repairs, and the SAME argument the nativeTraffic pin in withPreT4Registry makes:
     a historical receipt is re-earned, not re-minted to match a new number.

     TWO registry values moved on 2026-09-20 and both reach these grids:
       (1) CALIBRATION.tpu7.etaDec 0.55 -> 0.521, the numerator repair (vetting finding E2). This
           one also closes a SEAM the gate had: site/engine-roofline-v22.js is not an archived
           module and captures `require("./engine-data-v22.js")` at load, so the ARCHIVED engine's
           decode path was reading LIVE calibration. The R3 route therefore was not running on
           base-commit bytes alone, and nothing noticed because no calibration value had moved
           since the gate was written. Pinning the value in place reaches the live object the
           roofline holds, so both routes now run on the historical coefficient.
       (2) FLEETS["na-blend"].withdrawn, the declared Trainium withdrawal (vetting finding E1).
           The base commit has no such key, so the historical pin is its ABSENCE.
     Every value is read from the archived module bytes and never transcribed. */
export function withPreVettingRegistry(fn) {
  const baseData = loadPreT4Module("./engine-data-v22.js");
  const calibPins = [];
  for (const key of Object.keys(ED_LIVE.CALIBRATION)) {
    const base = baseData.CALIBRATION[key];
    const live = ED_LIVE.CALIBRATION[key];
    if (!base || !live || base.etaDec === live.etaDec) continue;
    calibPins.push([live, live.etaDec]);
    live.etaDec = base.etaDec;
  }
  /* (3) PRICE_EVIDENCE.gb200 observed-source-named -> analyst-set (vetting finding E5a). It is a
         LABEL and moves no number, but it lands inside every leg's `economics` evidence-quality
         string, which these receipts serialize — so the historical grids carry the historical
         label, exactly as they carry the historical coefficient. */
  const pricePins = [];
  for (const key of Object.keys(ED_LIVE.PRICE_EVIDENCE)) {
    const base = baseData.PRICE_EVIDENCE[key];
    if (base === undefined || base === ED_LIVE.PRICE_EVIDENCE[key]) continue;
    pricePins.push([key, ED_LIVE.PRICE_EVIDENCE[key]]);
    ED_LIVE.PRICE_EVIDENCE[key] = base;
  }
  const fleetPins = [];
  for (const id of Object.keys(ED_LIVE.FLEETS)) {
    const live = ED_LIVE.FLEETS[id];
    const base = baseData.FLEETS[id];
    if (!live || live.withdrawn === undefined) continue;
    if (base && base.withdrawn !== undefined) continue; // the base commit already had it
    fleetPins.push([live, live.withdrawn]);
    delete live.withdrawn;
  }
  try { return fn(); } finally {
    for (const [row, was] of calibPins) row.etaDec = was;
    for (const [key, was] of pricePins) ED_LIVE.PRICE_EVIDENCE[key] = was;
    for (const [fleet, was] of fleetPins) fleet.withdrawn = was;
  }
}

/* The pin's provenance, reported rather than assumed: the git bytes this bundle executes, and —
   when the leg's archive-first snapshot is still on disk — proof that the two agree. The archive
   is leg provenance and a clean clone will not have it, so its ABSENCE is reported as a fact
   instead of quietly skipping a check. The load-bearing integrity proof is not either digest: it
   is that these bytes reproduce the pre-fold receipts, which no wrong byte can do. */
const LEG_ARCHIVE_SUFFIX = ".bak-2026-08-24-pre-im-arc-t4-fold";
const LEG_ARCHIVE_DIR = new URL("../im-arc/bak/site/", import.meta.url);
export function preT4PinDigests() {
  const digest = (text) => createHash("sha256").update(text, "utf8").digest("hex");
  return ARCHIVED_MODULES.map((file) => {
    const url = new URL(file + LEG_ARCHIVE_SUFFIX, LEG_ARCHIVE_DIR);
    const archivePresent = existsSync(url);
    return {
      file,
      git: digest(gitBytes("site/" + file)),
      archivePresent,
      archive: archivePresent ? digest(readFileSync(url, "utf8")) : null,
    };
  });
}

/* ---------------------------------------------------------------------------------------
   ROUND 3 (2026-08-25) — the two things Polaris's second toss-back was right about.

   (a) THE STRESS FLEET IS PINNABLE AS DATA. Round 2 reported the pre-T4 273-state receipt as
   unreproducible through the live engine and offered a bounded residue instead. That was wrong.
   The stress lens picks its registry rows through coverageApplicableRowIds, which the fold
   re-pointed at key-level evidence — code. But what that selector CONSUMES is the pre-fold
   coverage ledger's own `rows` and `programmes` lists, which are data and sit in the pinned
   pre-fold registry; composeFleetFromDcRows, which turns rows into a fleet, is exported and the
   fold did not touch it; and workload/feasibility/blendedCosts already accept a composed fleet as
   an ordinary render input. So the historical fleet is DERIVED from pinned historical data by
   unchanged engine code and handed back to the live engine — a data pin, exactly like
   capexAbsLeg, not a hand-fed answer. Both receipts reproduce with no residue.

   (b) THE BUNDLE IS GENERATED FROM THE FROZEN SINK REGISTRY. Round 2 substituted the declared
   -delta manifest for the sink registry the memo names, on the grounds that the registry
   enumerates output channels rather than scenario arithmetic. That reading of the file is
   correct and it is still not a licence to swap the instrument. The registry's pinned `files`
   array IS the authoritative release source graph, and the frozen scanner computes it — so the
   arithmetic sinks are discovered over THAT graph, and the moved ones are found by differencing
   the live engine against the base commit rather than by reading anyone's list. A sink the
   declared delta forgot is now caught by machine.
   --------------------------------------------------------------------------------------- */

/* NOTE (r3): the sink-registry-derived completeness discovery deliberately does NOT live here.
   This module has a served twin under site/tests/, and the scanner it would import is repo
   provenance that the served tree has no business carrying. The discovery lives beside the gate
   that consumes it, in tests/t4-receipt-reproduction.test.mjs, which is repo-only by design. */

/* (a) — the historical stress fleet, composed from pinned data by unchanged engine code. */
export function preT4StressFleet(state, modelId) {
  const ledger = (loadPreT4Module("./engine-data-dc-v1.js").COVERAGE_LEDGER || {})[
    E.companyForModel(modelId)];
  if (!ledger) return null;
  const dcRows = [...new Set([...(ledger.rows || []), ...(ledger.programmes || [])])];
  const fill = ["deepseek", "zhipu", "moonshot"].includes(E.companyForModel(modelId))
    ? "generic-cn" : "generic-us";
  try {
    return E.composeFleetFromDcRows(state, { modelId, dcRows, fill,
      id: "cf:stress01", name: "Public-rate registry stress fleet" });
  } catch { return null; }
}

/* The render input a historical reading needs. Only the stress lens composes from the registry,
   so only it needs one; every other perspective reproduces on the state overlay alone. */
export function preT4RenderOpts(state, perspective, modelId) {
  if (!perspective || perspective.id !== "stress-public-rate") return undefined;
  const customFleet = preT4StressFleet(state, modelId);
  return customFleet ? { customFleet } : undefined;
}
