/* im-arc T4 fold (2026-08-25) — THE RECEIPT-REPRODUCTION GATE.
   Spec: research/im-arc-t4-fold-memo.md §6 [F10, F11], final bullet:
     "The 270-state historical hash must still reproduce through the extended pin bundle;
      the 273-state pre-T4 receipt must reproduce through the same bundle plus the pre-T4
      defaults."

   Before this file the two pre-fold receipts survived only as PROSE inside
   render-parity-r1.test.mjs — every executable constant there was re-minted to a post-fold
   value, so nothing executed reproduced f98b97a1… or 22baff37…. A receipt that is only
   quoted is not a receipt. This gate executes all of the following claims:

     R1  the LIVE (post-fold) engine, fed the generated pre-T4 bundle, reproduces the memo's
         named historical 270-state receipt f98b97a1… byte-for-byte over all 270 records.
     R2  the LIVE engine, fed the same bundle, reproduces BOTH pre-T4 grids exactly — the
         270-state 8c4bdffd… and the full 273-state receipt 22baff37… — with NO residue and
         no bound to argue about, plus an assertion that the stress-fleet pin is load-bearing
         (remove it and reproduction fails, so it can never quietly become decorative).

         HISTORY, because this header was itself a defect. Round 2 of this gate asserted the
         opposite: a "bounded residue" of exactly four stress-public-rate records that the
         live engine supposedly could not reach, on the reasoning that the stress lens selects
         rows through coverageApplicableRowIds and the fold re-pointed that at key-level
         evidence — "that is CODE, not data, and no data pin can restore it". THAT WAS WRONG.
         The selector's INPUT is the pre-fold ledger's own rows/programmes lists, which are
         data and sit in the pinned registry; composeFleetFromDcRows is exported and the fold
         never touched it; and workload/feasibility/blendedCosts already accept a composed
         fleet as an ordinary render input. So the historical fleet IS derivable from pinned
         data by unchanged code. Round 3 replaced the code below accordingly; this comment was
         missed in that sweep and kept describing the design its own code had overturned,
         until the fresh-instance review caught it (P2, 2026-08-25). Rewritten in round 5.
     R3  the pre-fold module BYTES, read from git at the recorded base commit, reproduce all
         three pre-fold receipts independently of R2. R2 proves the live engine reproduces them
         from pinned data; R3 proves the bytes those data came from still say the same thing.
         WHAT THEIR AGREEMENT DOES AND DOES NOT BUY (D-7, corrected 2026-08-27 in the T5 walk;
         raised by the fresh-instance review 2026-08-25 and recorded then rather than fixed,
         because editing this comment would have invalidated a verification three parties had
         just completed on `7f5e322`. That verification has since been superseded by the T5
         re-run and its own independent review, so this is the next touch the note pointed to).
         The retired sentence read: "Either alone could be fooled by a bad oracle; the two
         agreeing cannot be." That is stronger than this code earns. R2 and R3 are independent
         in their INPUTS — a pinned data bundle through the live engine, versus the base
         commit's own bytes — and that independence is real and is the point. But they SHARE
         the grid harness (`registryGrid`, `wideRecord`, `auditStatesFor`), so a fault in the
         harness itself would mislead both and their agreement would not detect it. The honest
         claim is the narrower one: agreement rules out a fault in either input path, not a
         fault in the machinery they both run through.
     R4  those bytes come from git at the manifest's recorded base commit, so they are
         content-addressed and cannot drift; where the leg's archive-first snapshot is still on
         disk, the two are cross-checked, and where it is not, that is reported rather than
         skipped.

   Run: node tests/t4-receipt-reproduction.test.mjs */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { applyPreT4Defaults, withPreT4Registry, loadPreT4Module, preT4PinDigests,
  preT4Overlay, preT4RenderOpts,
  DECLARED_SINKS, PRE_T4_RECEIPT, PRE_T4_STATES } from "./t4-historical-pins.mjs";

/* The single key the bundle does not restore, with R5 below carrying the proof that it needs no
   restoring. Listed here rather than buried in the check so the exemption is visible. */
const INERT_AT_PIN = ["costOfCapitalPct"];

import { eligibleFiles } from "./sink-scanner.mjs";
import { preT4HistoryAvailable, PRE_T4_BASE_COMMIT } from "./t4-historical-pins.mjs";
import { MODE as PROVENANCE_MODE } from "./provenance-inputs.mjs";

/* THE HISTORY THIS SUITE REPRODUCES FROM IS PRIVATE (vetting round 2026-09-19, Astra pack E
   P1-1). Every receipt here is reproduced from the pre-fold bytes at private commit
   ad7a214, read with `git show`. The public mirror is a squashed one-commit-per-release
   snapshot and the reconstructed publish stage is not a git repository at all, so the object
   cannot resolve in either — and this file therefore threw during module evaluation, killing
   `npm test` inside publish.sh's own validate_stage and blocking every refresh of the public
   mirror. Fetching more public history cannot recover it; it was never pushed.
   The rule is the provenance doctrine, unchanged: PRIVATE tree with unreachable history is a
   FAILURE, because that means the history really did break; a tree with none of the registered
   private inputs is the public snapshot, where this suite skips loudly and by name. There is
   no environment variable that reaches reduced mode — only the physical absence of every
   registered private input. */
if (!preT4HistoryAvailable()) {
  if (PROVENANCE_MODE === "private") {
    console.log(`FAIL  T4 receipt reproduction: base commit ${PRE_T4_BASE_COMMIT} is UNREACHABLE in a `
      + "PRIVATE tree — the pinned history is missing, which is a regression, never a skip");
    process.exit(1);
  }
  const rule = "=".repeat(78);
  console.log(rule);
  console.log(`REDUCED MODE: private history absent, T4 receipt reproduction skipped in full`);
  console.log(`  The historical receipts are pinned to private commit ${PRE_T4_BASE_COMMIT}, which a`);
  console.log("  squashed public snapshot does not carry. This run did NOT reproduce them. Those");
  console.log("  checks are binding and they run in the private tree, where the history is present.");
  console.log(rule);
  console.log("T4 RECEIPT-REPRODUCTION SKIPPED (private history absent)");
  process.exit(0);
}

const SINK_REGISTRY = JSON.parse(readFileSync(
  new URL("./sink-registry-v22.json", import.meta.url), "utf8"));
const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));

/* The pinned release source graph, and the proof it is the frozen scanner's and not ours. */
function preT4SourceGraph() {
  const scanned = eligibleFiles(REPO_ROOT).slice().sort();
  const pinned = [...SINK_REGISTRY.files].sort();
  return { scanned, pinned, identical: JSON.stringify(scanned) === JSON.stringify(pinned) };
}

/* ARITHMETIC SINKS, discovered — never listed. A scenario key is an arithmetic sink if the
   engine reads it off the state; it is a MOVED sink if its value differs between the live engine
   and the base commit. Both halves are computed, so the set cannot drift out of date and a sink
   the declared delta omits still shows up here. */
function preT4ArithmeticSinks() {
  const graph = preT4SourceGraph();
  const engineFiles = graph.pinned.filter((f) => f.startsWith("site/") && f.endsWith(".js"));
  const read = new Set();
  for (const rel of engineFiles) {
    const text = readFileSync(new URL("../" + rel, import.meta.url), "utf8");
    for (const m of text.matchAll(/\b(?:s|st|state)\.([A-Za-z][A-Za-z0-9]*)\b/g)) read.add(m[1]);
  }
  const live = E.DEFAULTS;
  const base = loadPreT4Module("./engine.js").DEFAULTS;
  const keys = [...new Set([...Object.keys(live), ...Object.keys(base)])].sort();
  return keys.filter((k) => read.has(k)).map((k) => ({
    key: k,
    readByEngine: true,
    moved: JSON.stringify(live[k]) !== JSON.stringify(base[k]),
    live: live[k], base: base[k],
  }));
}

/* The same question for the hardware rows, whose capex and rent are arithmetic sinks but not
   scenario keys. No base-commit diff is needed here and none is faked: the bundle pins capex and
   rent for EVERY donor unconditionally, so the check is whether that cover is total. */
function preT4HardwareSinks() {
  const overlay = preT4Overlay();
  return E.HW_ORDER.map((key) => ({
    key,
    capexPinned: Object.prototype.hasOwnProperty.call(overlay.capexAbsLeg, key),
    rentPinned: Object.prototype.hasOwnProperty.call(overlay.rentRegistryPin, key),
  }));
}



const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

/* The pre-fold receipts, quoted from memo §6. These are the ONLY hashes in this file that are
   hand-written, and that is the point: they are the historical record this gate re-earns. */
const HISTORICAL_270_PROJECTED = "f98b97a11edefb77331356d1c14095af9c9e01688ec6b256bf727ff32970b2df";
const HISTORICAL_270_LIVE = "8c4bdffd683d271d9fc201bbf652c44bef16ce539a7a14d724d30303dd1c6dd8";
const PRE_T4_273 = "22baff3775438ce937d186721f0768e82c5071e4c887ccf985ca521308df5003";
const STRESS_BOUND_PP = 0.005;

let pass = 0, fail = 0;
const assert = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} — ${detail}`); }
};
const sha = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

/* The WIDE record and the audit surface are reproduced here at the shape the PRE-FOLD parity
   test hashed (im-arc/bak/tests/render-parity-r1.test.mjs.bak-2026-08-24-pre-im-arc-t4-fold).
   They are deliberately NOT imported from the live parity test: that file's record shape is
   free to grow with the fold, and a historical receipt must be re-derived at the shape it was
   minted at or it proves nothing. */
const wideRecord = (Engine, m, p, state, ctx, renderOpts) => {
  const w = Engine.workload(state, undefined, ctx, renderOpts);
  const legacyW = { ...w, fleetRenderable: { ...w.fleetRenderable } };
  delete legacyW.composition; delete legacyW.coverage;
  delete legacyW.procurementBasis; delete legacyW.bases;
  delete legacyW.fleetRenderable.sections;
  const f = Engine.feasibility(state, ctx, renderOpts);
  const bc = Engine.blendedCosts(state, undefined, ctx, renderOpts);
  return [m.id, p.id, legacyW, f.legs, f.renderableLegs, bc.cIn, bc.cOut,
    bc.fleetRenderable ? [bc.fleetRenderable.renderableLegs, bc.fleetRenderable.totalLegs,
      bc.fleetRenderable.renderableWeightShare] : null,
    Engine.fleetRenderableClause(bc.fleetRenderable, true),
    Engine.policyCapacityClause(bc.fleetRenderable),
    Engine.fleetRenderableDisclosure ? Engine.fleetRenderableDisclosure(bc.fleetRenderable) : null];
};
const auditSurface = (Engine, { id, state, ctx }) => {
  const w = Engine.workload(state, undefined, ctx);
  const legacyW = { ...w, fleetRenderable: { ...w.fleetRenderable } };
  delete legacyW.composition; delete legacyW.coverage;
  delete legacyW.procurementBasis; delete legacyW.bases;
  delete legacyW.fleetRenderable.sections;
  const f = Engine.feasibility(state, ctx);
  const bc = Engine.blendedCosts(state, undefined, ctx);
  return ["__t2-electricity-audit__", id, legacyW, f.legs, f.renderableLegs, bc.cIn, bc.cOut,
    bc.fleetRenderable ? [bc.fleetRenderable.renderableLegs, bc.fleetRenderable.totalLegs,
      bc.fleetRenderable.renderableWeightShare] : null,
    Engine.fleetRenderableClause(bc.fleetRenderable, true),
    Engine.policyCapacityClause(bc.fleetRenderable),
    Engine.fleetRenderableDisclosure ? Engine.fleetRenderableDisclosure(bc.fleetRenderable) : null];
};

/* The three commissioned T2 generic-owned-TCO audit states, at the pre-fold construction. */
const auditStatesFor = (Engine, mutate = (state) => state) => {
  const opus = Engine.MODELS.find((row) => row.id === "opus");
  const nativeTraffic = { mode: "native", profileId: null };
  const out = [];
  for (const perspectiveId of ["median", "gptpro-r3"]) {
    const perspective = Engine.PERSPECTIVES.find((row) => row.id === perspectiveId);
    const state = mutate(Engine.applyPresetSettings(opus, perspective, nativeTraffic), perspective);
    state.hwMode = "tco";
    out.push({ id: `forced-tco:${perspectiveId}`, state, ctx: Engine.scenarioContext(state) });
  }
  const traffic = Engine.resolveTraffic(opus, null, nativeTraffic);
  const state = mutate(structuredClone(Engine.DEFAULTS));
  Object.assign(state, { ioRatio: traffic.ioRatio, cacheHit: traffic.cacheHit, hwMode: "tco" });
  out.push({ id: "generic-default:opus", state,
    ctx: Engine.makeScenarioContext(opus, traffic, state.customDonor) });
  return out;
};

/* The registry grid at the pre-fold shape. `mutate` is the pin bundle (identity for the
   archived engine, which needs no pinning — its inputs ARE the historical ones). */
const registryGrid = (Engine, mutate = (state) => state, renderOptsFor = () => undefined) => {
  const live = [], projected = [], meta = [];
  for (const m of Engine.MODELS) {
    if (m.id === "custom") continue;
    for (const p of Engine.PERSPECTIVES) {
      const s = mutate(Engine.applyPresetSettings(m, p, { mode: "native" }), p, m.id);
      const ctx = Engine.scenarioContext(s);
      const ro = renderOptsFor(s, p, m.id);
      const projectedState = p.id === "stress-public-rate" ? structuredClone(s) : s;
      projected.push(wideRecord(Engine, m, p, projectedState, ctx, ro));
      live.push(wideRecord(Engine, m, p, s, ctx, ro));
      meta.push(`${m.id}/${p.id}`);
    }
  }
  return { live, projected, meta };
};

/* ---------------- R1 — the live engine reproduces the historical 270 ---------------- */
const pinned = withPreT4Registry(() => registryGrid(E, applyPreT4Defaults));
assert("T4-REPRO-R1 the pin bundle covers the full historical registry grid",
  pinned.live.length === 270, `got ${pinned.live.length}`);
assert("T4-REPRO-R1 the LIVE engine + the pre-T4 pin bundle reproduces the historical 270-state receipt f98b97a1…",
  sha(pinned.projected) === HISTORICAL_270_PROJECTED, sha(pinned.projected));

/* ---------------- R2 — the LIVE engine reproduces BOTH receipts ----------------
   ROUND 3 (2026-08-25, Polaris toss-back #2). Round 2 reported that the pre-T4 273-state receipt
   could not reproduce through the live engine and offered a bounded four-record residue instead.
   THAT WAS WRONG, and the toss-back was right to refuse it. The stress lens's row selection is
   code the fold changed, but the row selection's INPUT — which rows the pre-fold coverage ledger
   listed — is data, and it is in the pinned pre-fold registry; the composition that turns those
   rows into a fleet (composeFleetFromDcRows) is exported and the fold did not touch it; and the
   engine already takes a composed fleet as an ordinary render input. So the bundle derives the
   historical stress fleet from pinned historical DATA through unchanged engine code and hands it
   to the live engine. Both receipts now reproduce exactly, with no residue and no bound to argue
   about. The retraction is recorded in the report rather than quietly dropped. */
const pinnedLive = withPreT4Registry(() => registryGrid(E, applyPreT4Defaults, preT4RenderOpts));
assert("T4-REPRO-R2 the LIVE engine + the pin bundle reproduces the pre-T4 live 270-state grid 8c4bdffd…",
  sha(pinnedLive.live) === HISTORICAL_270_LIVE, sha(pinnedLive.live));
/* im-vet-six-repairs (2026-09-20): the audit tail runs INSIDE the pin, like the grid above it.
   It was outside, which was invisible while no pinned registry value had moved — the three audit
   states then read LIVE calibration, price-evidence classes and fleet membership into a receipt
   that is supposed to be historical. Same repair as R3's. */
const pinned273 = withPreT4Registry(() => [...pinnedLive.live,
  ...auditStatesFor(E, applyPreT4Defaults).map((audit) => auditSurface(E, audit))]);
assert(`T4-REPRO-R2 the LIVE engine + the pin bundle reproduces the pre-T4 ${PRE_T4_STATES}-state receipt 22baff37… — no residue`,
  pinned273.length === PRE_T4_STATES && sha(pinned273) === PRE_T4_273,
  `${pinned273.length} states, ${sha(pinned273)}`);
assert("T4-REPRO-R2 the manifest's recorded before-receipt is the receipt the live engine reproduces",
  PRE_T4_RECEIPT === PRE_T4_273, PRE_T4_RECEIPT);
/* Non-vacuity: the stress pin must be doing real work. Without it the grid does NOT reproduce —
   if this ever starts passing, the pin has become decorative and the gate above proves nothing. */
const withoutStressPin = withPreT4Registry(() => registryGrid(E, applyPreT4Defaults));
assert("T4-REPRO-R2 the stress-fleet pin is load-bearing: WITHOUT it the historical grid does not reproduce",
  sha(withoutStressPin.live) !== HISTORICAL_270_LIVE,
  "the grid reproduced without the pin — the pin is decorative and this gate is vacuous");

/* ---------------- R3 — the archived bytes reproduce all three pre-fold receipts ------------- */
/* R3 runs the base commit's OWN bytes, as a second, independent route to the same receipts: R2
   proves the live engine reproduces them from pinned data, and R3 proves the bytes those data
   were taken from still say the same thing. Either alone could be fooled by a bad oracle; the two
   agreeing cannot be. */
const archived = loadPreT4Module("./engine.js");
/* im-vet-six-repairs (2026-09-20): R3 now runs INSIDE the registry pin, and that is a repair to
   this gate rather than a relaxation of it. R3's claim is that the base commit's own bytes
   reproduce the receipts — but `site/engine-roofline-v22.js` is not an archived module and
   captures `require("./engine-data-v22.js")` at load, so the archived engine's decode path was
   reading LIVE calibration. The claim held only while no calibration value had moved since the
   gate was written; the first one that did (tpu7's numerator repair) exposed it. Running under
   the pin restores the historical calibration on the object the roofline holds, so R3 now really
   is base-commit bytes on base-commit data. R2's independence is unaffected: R2 reaches the same
   receipts through the LIVE engine, which R3 still does not use. */
const oracle = withPreT4Registry(() => registryGrid(archived));
assert("T4-REPRO-R3 the base-commit oracle grid is the same 270 records in the same order",
  oracle.meta.join("|") === pinnedLive.meta.join("|"), "record order diverged");

assert("T4-REPRO-R3 the pre-fold module bytes at the base commit reproduce the historical 270-state receipt f98b97a1…",
  sha(oracle.projected) === HISTORICAL_270_PROJECTED, sha(oracle.projected));
assert("T4-REPRO-R3 the pre-fold module bytes at the base commit reproduce the pre-T4 live 270-state grid 8c4bdffd…",
  sha(oracle.live) === HISTORICAL_270_LIVE, sha(oracle.live));
const oracle273 = withPreT4Registry(() => [...oracle.live, ...auditStatesFor(archived).map((audit) => auditSurface(archived, audit))]);
assert(`T4-REPRO-R3 the pre-fold module bytes at the base commit reproduce the pre-T4 ${PRE_T4_STATES}-state receipt 22baff37… — the "before" of the declared delta`,
  oracle273.length === PRE_T4_STATES && sha(oracle273) === PRE_T4_273, `${oracle273.length} states, ${sha(oracle273)}`);
assert("T4-REPRO-R3 the manifest's recorded before-receipt is the receipt this gate reproduces",
  PRE_T4_RECEIPT === PRE_T4_273, PRE_T4_RECEIPT);

/* ---------------- R4 — the pin's provenance ----------------
   R3's bytes come out of git at the manifest's recorded base commit, so they are content-addressed
   and cannot drift. The leg's archive-first snapshot under im-arc/bak/ is a SECOND copy of the same
   three modules; where it is still on disk this cross-checks the two, which is what proves the
   archive faithful. A clean clone will not have it, and that absence is REPORTED rather than
   skipped past — a check that quietly evaporates is worse than one that is honestly not running. */
const digests = preT4PinDigests();
assert("T4-REPRO-R4 the pin resolves all three pre-fold modules from git at the recorded base commit",
  digests.length === 3 && digests.every((row) => /^[0-9a-f]{64}$/.test(row.git)),
  JSON.stringify(digests.map((row) => row.file)));
const legArchive = digests.filter((row) => row.archivePresent);
if (legArchive.length) {
  assert(`T4-REPRO-R4 the leg's archive-first snapshot matches the git bytes byte-for-byte (${legArchive.length}/3 present)`,
    legArchive.every((row) => row.archive === row.git),
    JSON.stringify(legArchive.filter((row) => row.archive !== row.git)));
} else {
  console.log("NOTE  T4-REPRO-R4 im-arc/bak/ is not present (expected in a clean clone): the pin ran "
    + "on git bytes alone, and R3 above is the integrity proof — a wrong byte cannot reproduce a receipt.");
}

/* ---------------- R5 — bundle COMPLETENESS, generated from the FROZEN sink registry ----------
   ROUND 3. Round 2 substituted the declared-delta manifest for the sink registry memo §6 names,
   reasoning that the registry enumerates output channels ("a channel names HOW content leaves the
   program", sink-scanner.mjs:70) and carries no scenario arithmetic. That reading of the file is
   correct — and it was still the wrong move, because the registry's authority here is not its
   channel list but its pinned `files` array: the release source graph, computed by the frozen
   scanner. So the arithmetic sinks are discovered over THAT graph, and which of them MOVED is
   found by differencing the live engine against the base commit — not by reading anyone's list.
   The declared-delta manifest is then checked AGAINST that machine-derived set rather than
   standing in for it, so a sink the manifest forgot fails here instead of passing quietly. */
const graph = preT4SourceGraph();
/* The magnitude pin moved 38 -> 39 on 2026-08-27 (T5 round 4): ONE genuinely new eligible source
   file, mcp-server/worker/scripts/release-gate.mjs — the executable release-artifact gate, added
   after a release-gate review found that contract enforced by nothing. The load-bearing half of
   this assertion is `graph.identical` (the scanner's graph and the registry's agree); the count
   is the magnitude tripwire beside it, and it is re-pinned here rather than removed, because a
   graph that silently shrinks is exactly what it exists to catch. */
/* The magnitude pin moved 39 -> 52 on 2026-09-09 (im-release-edit): THIRTEEN genuinely new
   eligible source files, all of them the dc-map stage-3 integration's (commit b216807) — three
   dcmap modules, seven datacenter tools, the worker substrate override, the worker deploy gate and
   the worker globals. They landed without a re-pin, so this tripwire was ALREADY red on master
   before the language edition touched anything, which is the tripwire doing its job. The graph
   GREW by exactly the files that commit added and shrank by none. Beside it, tests/sink-scanner.mjs
   stopped counting the vendored economics/ and economics-node/ directories: they are gitignored
   build output, and counting them made this same commit scan 52 files before an MCP build and 64
   after — a magnitude pin cannot be right in both states, so the scan is now build-state
   independent and 52 is the number in either. */
/* The magnitude pin moved 52 -> 53 on 2026-09-25 (bq-3351, Astra Pro estimates): ONE genuinely new
   eligible source file, site/astra-pro-estimates.js — the category's registry of recorded operating
   points and its replay. The graph grew by exactly that file and shrank by none; the sink registry
   was re-minted in the same commit. */
assert("T4-REPRO-R5 the source graph is the frozen scanner's and the pinned registry's, and they agree",
  graph.identical && graph.pinned.length === 53,
  JSON.stringify({ scanned: graph.scanned.length, pinned: graph.pinned.length }));

const sinks = preT4ArithmeticSinks();
const movedSinks = sinks.filter((row) => row.moved);
const overlayKeys = new Set(Object.keys(preT4Overlay()));
const uncoveredMoved = movedSinks.filter((row) => !overlayKeys.has(row.key) && !INERT_AT_PIN.includes(row.key));
assert(`T4-REPRO-R5 every MOVED arithmetic sink the scanner's graph turns up is restorable by the bundle (${movedSinks.length} moved of ${sinks.length} discovered)`,
  uncoveredMoved.length === 0, JSON.stringify(uncoveredMoved.map((row) => row.key)));
assert("T4-REPRO-R5 the discovery is non-vacuous: it finds arithmetic sinks, and finds that some moved",
  sinks.length >= 20 && movedSinks.length > 0,
  JSON.stringify({ discovered: sinks.length, moved: movedSinks.length }));
/* The cross-check that makes the machine-derived set worth having: anything the engine moved must
   also be declared. A sink that moved silently is the failure the declared delta exists to stop. */
const declaredText = JSON.stringify(DECLARED_SINKS);
const undeclaredMoved = movedSinks.filter((row) => !declaredText.includes(row.key));
assert("T4-REPRO-R5 every moved arithmetic sink is also NAMED in the declared-delta manifest — none moved silently",
  undeclaredMoved.length === 0, JSON.stringify(undeclaredMoved.map((row) => row.key)));

const hw = preT4HardwareSinks();
assert(`T4-REPRO-R5 the bundle pins capex and rent for every hardware row (${hw.length} rows)`,
  hw.length > 0 && hw.every((row) => row.capexPinned && row.rentPinned),
  JSON.stringify(hw.filter((row) => !row.capexPinned || !row.rentPinned)));

/* The one key the overlay deliberately does not carry, and the proof that it may not: with
   capitalRecovery pinned off, the cost of capital reaches no arithmetic, so there is nothing
   historical to restore. Asserted by moving it across its whole declared band. */
for (const rate of [6, 8.5, 13]) {
  const opus = E.MODELS.find((row) => row.id === "opus");
  const median = E.PERSPECTIVES.find((row) => row.id === "median");
  const base = applyPreT4Defaults(E.applyPresetSettings(opus, median, { mode: "native" }));
  base.hwMode = "tco";
  const ctx = E.scenarioContext(base);
  const reference = E.workload(base, undefined, ctx).margin;
  const moved = { ...base, costOfCapitalPct: rate };
  E.registerScenarioContext(moved, ctx);
  assert(`T4-REPRO-R5 costOfCapitalPct is provably inert at the pinned capitalRecovery: off (r = ${rate}%)`,
    E.workload(moved, undefined, ctx).margin === reference,
    `${E.workload(moved, undefined, ctx).margin} !== ${reference}`);
}

/* ---------------- negative control — the gate can actually fail ---------------- */
const mutated = structuredClone(oracle.live);
mutated[0][2].margin += 1e-12;
assert("T4-REPRO-NEG a one-bit change to a historical record does NOT reproduce the receipt",
  sha(mutated) !== HISTORICAL_270_LIVE, "the receipt survived a mutated grid — this gate is vacuous");

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (fail) process.exit(1);
console.log("ALL T4 RECEIPT-REPRODUCTION TESTS PASS");
