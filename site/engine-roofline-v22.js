/* IM3 slice-1b — roofline core (no DOM). Originated as a PARALLEL PATH (no display wiring, this
   header un-updated since) — IM3 exit-gate fix 5 (P2, skeptic + risk-analyst): that description
   is stale and is corrected here. Slice 3 (commit a996f54) ACTIVATED this module as the live
   display path: engine.js's tokPerS/rooflinePoint delegate to renderPoint()/decodeRoofline()/
   prefillRoofline() below for every rendered decode and prefill number, and slice 4 removed this
   file's own last outward dependency (engine.js's TRAFFIC_PROFILES) so it now depends on ONLY
   engine-data-v22.js. It is no longer a diagnostic running alongside a separate scalar path; it
   IS the compute path. (roofline-parallel-diff.mjs still exists as a switched-vs-parallel identity
   harness/regression gate — that is a TEST tool re-deriving the same numbers a second way, not
   evidence this module is unwired.)
   Implements the cycle-2 decode/prefill roofline per research/im3-integration-design.md v3.1
   (§1a core equations, §4 operating points, §5 feasibility, §7 stackMult, §8 prefill, §3 traffic
   fixed-OSL rule + customDonor codec delta), transcribed from the FROZEN
   research/d2-equation-set-v2.md §1–§2 (read-only; this file edits nothing frozen).

   DATA SOURCES (hard rule): every model-defining value comes from the slice-1a reviewed
   registries in engine-data-v22.js (as amended by the slice-1b review R5 fix pass: nShard
   deployment widths + per-row hbmBytes, and the slice-4 cleanup: TRAFFIC_PROFILES moved in from
   engine.js). As of slice 4 this file has NO remaining reference to engine.js at all — the one
   such dependency (TRAFFIC_PROFILES) is what forced the old data -> engine -> roofline -> app
   script order; removing it enables data -> roofline -> engine -> app (external harness/test
   code, e.g. roofline-parallel-diff.mjs, still separately combines this file's exports with
   engine.js's MODELS array for composing test scenarios — that is a caller concern, not a
   dependency of this file). No model-defining numeric literal appears in this file. Literal numerics below are exclusively: equation-structure constants of the
   frozen forms (the 2s/4s of §1.1, the C8 10% workspace), the 1e9 params/B-param unit
   conversion, and dimensional-validation scale bounds.

   RENDER RULE (memo §2, verification-R2 fix): q = 1, a = 1 on every path — no q/a parameter
   exists in any public API. t_cc comes ONLY from TCC_CONSTANTS (τ is not a function parameter;
   the exploratory τ band is unreachable from this module by construction).

   Product extension (marked, memo §1a): stackMult enters ONLY as η_eff = η × stackMult inside
   t_roof (and η_pre_eff = η_pre × stackMult in prefill). t_cc is NEVER scaled (§7).

   Loads in plain node (require) and, later, the browser (classic script AFTER
   engine-data-v22.js ONLY, as of the slice-4 script-order cleanup — this file no longer needs
   engine.js loaded first or at all; the RD_* bindings below resolve their top-level consts
   against engine-data-v22.js's already-loaded globals). */

"use strict";

/* ---------- module plumbing (node require / browser globals) ---------- */
const RD_IS_NODE = (typeof module !== "undefined" && !!module.exports);
const RD_DATA = RD_IS_NODE ? require("./engine-data-v22.js") : null;
/* Slice-4 cleanup (memo §13 backlog): this file used to also require("./engine.js") (RD_ENGINE)
   for TRAFFIC_PROFILES alone — the one roofline->engine reverse dependency, and the reason the
   script tags could not previously load as data -> roofline -> engine -> app (TRAFFIC_PROFILES
   moved into engine-data-v22.js precisely so this file never needs to reach into engine.js).
   Browser branch: bare identifiers resolve against the top-level consts of the previously
   loaded classic scripts; a missing script fails LOUD at load (ReferenceError), never silent. */
const RD_MODEL_ARCH = RD_IS_NODE ? RD_DATA.MODEL_ARCH : MODEL_ARCH;
const RD_ARCH_DONORS = RD_IS_NODE ? RD_DATA.ARCH_DONORS : ARCH_DONORS;
const RD_CUSTOM_DONOR_ENUM = RD_IS_NODE ? RD_DATA.CUSTOM_DONOR_ENUM : CUSTOM_DONOR_ENUM;
const RD_HW_ROOFLINE = RD_IS_NODE ? RD_DATA.HW_ROOFLINE : HW_ROOFLINE;
const RD_PRECISION_TUPLES = RD_IS_NODE ? RD_DATA.PRECISION_TUPLES : PRECISION_TUPLES;
const RD_CALIBRATION = RD_IS_NODE ? RD_DATA.CALIBRATION : CALIBRATION;
const RD_PREFILL_CAL = RD_IS_NODE ? RD_DATA.PREFILL_CAL : PREFILL_CAL;
const RD_TCC = RD_IS_NODE ? RD_DATA.TCC_CONSTANTS : TCC_CONSTANTS;
const RD_OPERATING_POINTS = RD_IS_NODE ? RD_DATA.OPERATING_POINTS : OPERATING_POINTS;
const RD_TRAFFIC_OSL = RD_IS_NODE ? RD_DATA.TRAFFIC_OSL : TRAFFIC_OSL;
const RD_TRAFFIC_PROFILES = RD_IS_NODE ? RD_DATA.TRAFFIC_PROFILES : TRAFFIC_PROFILES;
const RD_TOPOLOGY_DIMENSIONS = RD_IS_NODE ? RD_DATA.TOPOLOGY_DIMENSIONS : TOPOLOGY_DIMENSIONS;
const RD_TOPOLOGY_EVIDENCE_CLASSES = RD_IS_NODE ? RD_DATA.TOPOLOGY_EVIDENCE_CLASSES : TOPOLOGY_EVIDENCE_CLASSES;
const RD_HW_DOMAINS = RD_IS_NODE ? RD_DATA.HW_DOMAINS : HW_DOMAINS; // R2: the live render path solves widths in the browser too
const RD_DECODE_TRAFFIC_BASES = RD_IS_NODE ? RD_DATA.DECODE_TRAFFIC_BASES : DECODE_TRAFFIC_BASES; // b9 M1
const RD_BATCH_QUANTITIES = RD_IS_NODE ? RD_DATA.BATCH_QUANTITIES : BATCH_QUANTITIES; // b9 M2
const RD_WEIGHT_PLACEMENT = RD_IS_NODE ? RD_DATA.WEIGHT_PLACEMENT : WEIGHT_PLACEMENT;
const RD_PRECISION_TIER_MAP = RD_IS_NODE ? RD_DATA.PRECISION_TIER_MAP : PRECISION_TIER_MAP;
// Capacity feasibility may enter the renderer only from this module's own solver. The
// WeakMap is an unforgeable, non-exported brand plus an immutable input binding: callers
// cannot buy batch by supplying an arbitrary bFeas object, and a genuine solve cannot be
// replayed against different model geometry, precision, traffic length, or hardware.
const RD_CAPACITY_SOLVE_META = new WeakMap();
/* The SAME brand, applied to the solve's per-width rows, so the binding above can be a record
   of SCALARS instead of a second strong reference to the rows themselves. This is not a cache:
   nothing is reused across calls, no key is composed, and the map holds its key weakly.
   Why it matters, measured: one adjust_rental_rate call performs 8,867 solves, so it wrote
   8,867 brand entries whose VALUES each held a strong reference to a frozen 36-row perWidth
   graph. A WeakMap entry's value is released by the MAJOR collector, never by a scavenge, so
   every one of those graphs survived its scavenge and was promoted -- 15.9 MB of
   old-generation growth per invocation, which is what makes a workerd isolate's committed
   heap ratchet from 25 MB and never come back down. Branding the rows themselves, and
   comparing brand identity, retains nothing beyond the scalars.
   The door is not weakened. Before, a caller who swapped `result.perWidth` for foreign rows
   had the substitution silently ignored (the rows were read off the trusted record); now the
   caller's rows are read but must BE the rows this exact solve produced, or the call is
   refused. `meta` is a fresh frozen object per solve, so rows from any other solve carry a
   different brand and a solve still cannot be replayed against other geometry. */
const RD_CAPACITY_SOLVE_ROWS = new WeakMap();

/* ---------- typed errors (absent ⇒ hard error, memo §6 — never a silent default) ---------- */
class RooflineDataError extends Error {
  constructor(msg) { super(msg); this.name = "RooflineDataError"; }
}
class RooflineUnitError extends Error {
  constructor(msg) { super(msg); this.name = "RooflineUnitError"; }
}

const rdCount = (value) => value.toLocaleString("en-US", { maximumFractionDigits: 6 });

function rdNum(v, what) {
  if (typeof v !== "number" || !isFinite(v) || v <= 0)
    throw new RooflineDataError(what + " must be a finite positive number (got " + String(v) + ")");
  return v;
}

/* im-t5 MERGE (2026-08-29), grafted from the `maximal` candidate. `what` was the message PREFIX
   and it used to be built EAGERLY by the caller -- `hwKey + ".topologySensitivity.cases[" + index
   + "]"` -- at 279,632 calls per adjust_rental_rate invocation, for a string that is only ever
   read when the assertion throws. It is now the two PARTS, joined at throw time by rdCaseWhat
   below, so the non-throwing path allocates nothing and a failing path produces the identical
   message (rdCaseWhat guards on `caseIndex == null`, so index 0 still yields `...cases[0]` and
   the nShardCase caller still yields the bare owner). The evidence-class predicate is hoisted for
   the same reason: it captured nothing, so an identical module-scope function receives the
   identical (element, index, array) arguments from .some() and one closure per call stops being
   allocated. assertTopologyCase is module-internal -- it is not in the sealed roofline export pin
   -- so this signature change has no public surface. */
function rdCaseWhat(owner, caseIndex) {
  return caseIndex == null ? owner : owner + ".topologySensitivity.cases[" + caseIndex + "]";
}
function rdUnregisteredEvidenceClass(evidenceClass) {
  return !Object.prototype.hasOwnProperty.call(RD_TOPOLOGY_EVIDENCE_CLASSES, evidenceClass);
}
function assertTopologyCase(topologyCase, owner, caseIndex) {
  // B\u20321: a superseded (archived) case remains registered for provenance but must never be
  // selectable as a live width input; the default resolver never targets one either.

  if (!topologyCase || typeof topologyCase !== "object" || Array.isArray(topologyCase))
    throw new RooflineDataError(rdCaseWhat(owner, caseIndex) + " must be a source-cited topology case object; raw numeric widths are forbidden");
  if (!topologyCase.id || typeof topologyCase.id !== "string")
    throw new RooflineDataError(rdCaseWhat(owner, caseIndex) + ".id missing");
  if (!Number.isInteger(topologyCase.value) || topologyCase.value < 1 || topologyCase.value > 1024)
    throw new RooflineUnitError(rdCaseWhat(owner, caseIndex) + ".value = " + String(topologyCase.value) + " is not a plausible topology count");
  if (!RD_TOPOLOGY_DIMENSIONS.includes(topologyCase.topologyDimension))
    throw new RooflineDataError(rdCaseWhat(owner, caseIndex) + ".topologyDimension = " + String(topologyCase.topologyDimension) + " is not in the five-quantity taxonomy");
  if (!Array.isArray(topologyCase.evidenceClasses) || topologyCase.evidenceClasses.length === 0 ||
      topologyCase.evidenceClasses.some(rdUnregisteredEvidenceClass))
    throw new RooflineDataError(rdCaseWhat(owner, caseIndex) + ".evidenceClasses must be a non-empty subset of the registered evidence classes (GPT Pro A\u2013F + ANALYST)");
  if (typeof topologyCase.citation !== "string" || !topologyCase.citation.trim())
    throw new RooflineDataError(rdCaseWhat(owner, caseIndex) + ".citation missing/blank — no number without provenance");
  return true;
}

/* The single gate into every N-based divisor. A live row must explicitly classify its default as
   N_shard. A sensitivity input must be a complete, registered N_shard case from that row's list;
   N_domain/N_world/N_role/N_replicas and raw numbers hard-error before any arithmetic. */
function resolveNShardValue(hwKey, row, nShardCase) {
  // R2 (memo §0 P1-7): the caller-supplied sensitivity-case channel is RETIRED — the
  // render path consumes solver capacity widths; topology cases are EVIDENCE
  // ANNOTATIONS. An explicit case is rejected LOUDLY (never silently ignored).
  if (nShardCase !== undefined)
    throw new RooflineDataError(hwKey + ".nShardCase: the width-sensitivity case channel is RETIRED (R2) — widths come from the capacity solver's declared-operating-point output; topology cases survive as evidence annotations only");
  if (nShardCase === undefined) {
    if (row.nShardDimension !== "N_shard")
      throw new RooflineDataError(hwKey + ".nShardDimension = " + String(row.nShardDimension) + "; only N_shard may feed a weight/compute divisor");
    return { nShard: row.nShard, topologyDimension: row.nShardDimension,
      caseId: row.topologySensitivity ? row.topologySensitivity.defaultCaseId : null };
  }
  assertTopologyCase(nShardCase, hwKey + ".nShardCase", null);
  if (nShardCase.topologyDimension !== "N_shard")
    throw new RooflineDataError(hwKey + ".nShardCase '" + nShardCase.id + "' is classified " +
      nShardCase.topologyDimension + "; only N_shard may feed a weight/compute divisor");
  const sensitivity = row.topologySensitivity;
  const registered = sensitivity && Array.isArray(sensitivity.cases)
    ? sensitivity.cases.find(candidate => candidate.id === nShardCase.id) : null;
  if (!registered || registered.value !== nShardCase.value || registered.topologyDimension !== nShardCase.topologyDimension)
    throw new RooflineDataError(hwKey + ".nShardCase '" + nShardCase.id + "' is not a registered declared analyst sensitivity case for this row");
  if (registered.superseded)
    throw new RooflineDataError(hwKey + ".nShardCase '" + registered.id + "' is RETIRED (superseded by '" + registered.superseded + "') — archived for provenance, never selectable (B\u20321)");
  return { nShard: registered.value, topologyDimension: registered.topologyDimension, caseId: registered.id };
}

/* ---------- dimensional/unit validation (engine-data header: SI absolute B/s and FLOP/s,
   NOT the TB/s / PFLOPS conventions of engine.js HW). The bounds are SCALE-PLAUSIBILITY
   guards, not model values: a TB/s-convention scalar (3.35) or a GB/s count (400, 900) in a
   B/s field, or a PFLOPS scalar (1.98) in a FLOP/s field, fails LOUDLY. ---------- */
/* im-t5 MERGE (2026-08-29), grafted from the `maximal` candidate: the scale check was an arrow
   function allocated fresh on every one of ~17,700 calls per invocation purely to close over
   `hwKey`. Hoisted to module scope with `hwKey` as an argument -- same checks, same messages,
   same order, no closure. assertHwRowUnits' own exported signature is unchanged. */
function rdScaleCheck(hwKey, field, v, lo, hi, unit) {
  if (typeof v !== "number" || !isFinite(v) || v < lo || v >= hi)
    throw new RooflineUnitError(hwKey + "." + field + " = " + String(v) + " fails the SI " + unit +
      " scale check [" + lo + ", " + hi + ") — a " + field + " value in TB/s / GB/s / PFLOPS convention must be rejected, never rescaled");
}
function assertHwRowUnits(hwKey, row) {
  if (!row || typeof row !== "object") throw new RooflineDataError("HW_ROOFLINE row absent: " + hwKey);
  rdScaleCheck(hwKey, "fabric", row.fabric, 1e10, 1e14, "B/s");
  rdScaleCheck(hwKey, "bwHBM", row.bwHBM, 1e11, 1e14, "B/s");
  rdScaleCheck(hwKey, "hbmBytes", row.hbmBytes, 1e10, 1e12, "B (capacity)");     // a GB-count (80, 96, 288) or a TB-scale typo must fail, never rescale
  if (!row.flops || typeof row.flops !== "object" || Object.keys(row.flops).length === 0)
    throw new RooflineDataError(hwKey + ".flops map absent");
  /* Object.keys, not Object.entries: entries allocated one two-element array PER FLOPS BASIS per
     call on top of the outer array. Same keys, same order, same checks. */
  const flopsKeys = Object.keys(row.flops);
  for (let i = 0; i < flopsKeys.length; i++)
    rdScaleCheck(hwKey, "flops." + flopsKeys[i], row.flops[flopsKeys[i]], 1e13, 1e17, "FLOP/s");
  if (!Number.isInteger(row.nShard) || row.nShard < 1 || row.nShard > 1024)
    throw new RooflineUnitError(hwKey + ".nShard = " + String(row.nShard) + " is not a plausible replica width");
  if (row.nShardDimension !== "N_shard")
    throw new RooflineDataError(hwKey + ".nShardDimension must be N_shard before nShard can enter a divisor");
  if (row.topologySensitivity !== undefined) {
    const sensitivity = row.topologySensitivity;
    if (!sensitivity || sensitivity.kind !== "declared-analyst-sensitivity" ||
        !Array.isArray(sensitivity.cases) || sensitivity.cases.length === 0)
      throw new RooflineDataError(hwKey + ".topologySensitivity malformed");
    /* a plain loop, not forEach: the callback was one closure allocation per row validation, and
       the index-interpolated prefix is now deferred into assertTopologyCase's throws. */
    /* A plain loop rather than `.forEach`, to stop allocating a closure per registered case
       at ~279,632 assertion calls per adjust_rental_rate invocation. ONE behaviour difference,
       stated rather than glossed: `.forEach` SKIPS array holes and this visits them as
       `undefined`, so a SPARSE `cases` array now fails at the case assertion ("must be a
       source-cited topology case object") instead of later at the defaultCaseId resolution.
       Both are refusals of the same malformed registry and neither is reachable through the
       public connector — the registry is authored, not caller-supplied, and no registered row
       has a hole. Refusing earlier and more specifically is the better of the two. */
    for (let index = 0; index < sensitivity.cases.length; index++)
      assertTopologyCase(sensitivity.cases[index], hwKey, index);
    const defaultCase = sensitivity.cases.find(topologyCase => topologyCase.id === sensitivity.defaultCaseId);
    if (!defaultCase || defaultCase.topologyDimension !== "N_shard" || defaultCase.value !== row.nShard)
      throw new RooflineDataError(hwKey + ".topologySensitivity.defaultCaseId must resolve to the live N_shard value");
  }
  return true;
}

/* ---------- registry resolvers ---------- */
function resolveArch(modelId, customDonor) {
  const rec = Object.prototype.hasOwnProperty.call(RD_MODEL_ARCH, modelId) ? RD_MODEL_ARCH[modelId] : undefined;
  if (!rec) throw new RooflineDataError("no MODEL_ARCH row for model '" + String(modelId) + "'");
  if (modelId === "custom") {
    const donor = (customDonor === undefined || customDonor === null) ? RD_CUSTOM_DONOR_ENUM.default : customDonor;
    if (!RD_CUSTOM_DONOR_ENUM.values.includes(donor))
      throw new RooflineDataError("customDonor '" + String(donor) + "' is not in the bounded enum {" + RD_CUSTOM_DONOR_ENUM.values.join(", ") + "}");
    return RD_ARCH_DONORS[donor];
  }
  return rec;
}

/* Which frozen forms an arch row's terms use — the branch authority (memo §3: out-of-model
   rows resolve through their DECLARED fAttnForm/kvForm, never the stated MLA/GQA branches). */
function archFormsUsed(arch) {
  if (!arch || typeof arch !== "object" || !arch.attnClass) throw new RooflineDataError("arch record absent/malformed");
  switch (arch.attnClass) {
    case "mla": return { fAttnForm: "mla", kvForm: "mla", mode: arch.mode };
    case "gqa": case "gqa-dense": return { fAttnForm: "gqa", kvForm: "gqa", mode: arch.mode };
    case "out-of-model": {
      if (!arch.fAttnForm || !arch.kvForm)
        throw new RooflineDataError("out-of-model arch lacks declared fAttnForm/kvForm");
      return { fAttnForm: arch.fAttnForm, kvForm: arch.kvForm, mode: arch.mode };
    }
    default: throw new RooflineDataError("unknown attnClass '" + String(arch.attnClass) + "'");
  }
}

function resolveHwRoofline(hwKey) {
  const row = Object.prototype.hasOwnProperty.call(RD_HW_ROOFLINE, hwKey) ? RD_HW_ROOFLINE[hwKey] : undefined;
  if (!row) throw new RooflineDataError("no HW_ROOFLINE row for '" + String(hwKey) + "'");
  assertHwRowUnits(hwKey, row);
  /* HBM capacity comes from the registry's per-row hbmBytes (review R5 fix: the blanket
     engine.js `hbm GB × 1e9` conversion undercounted real framebuffer ~6.9% and was ruled
     unsupported; per-row bytes now carry their own provenance). engine.js's hbm field stays
     display-only and is not read here. */
  return { row, hbmBytes: row.hbmBytes };
}

/* Precision resolution — via PRECISION_TUPLES ONLY (memo §6). Absent/ineligible ⇒ typed
   error; NEVER an implementer default. Returns the reviewed tuple + the resolved FLOP/s. */
function resolvePrecisionTuple(hwKey, precision) {
  const rowTuples = Object.prototype.hasOwnProperty.call(RD_PRECISION_TUPLES, hwKey) ? RD_PRECISION_TUPLES[hwKey] : undefined;
  if (!rowTuples) throw new RooflineDataError("no PRECISION_TUPLES row for '" + String(hwKey) + "'");
  const tuple = Object.prototype.hasOwnProperty.call(rowTuples, precision) ? rowTuples[precision] : undefined;
  if (!tuple) throw new RooflineDataError("precision '" + String(precision) + "' has no reviewed tuple on row '" + hwKey + "' — explicit ineligibility, not a default");
  const { row } = resolveHwRoofline(hwKey);
  const flops = Object.prototype.hasOwnProperty.call(row.flops, tuple.flopsBasis) ? row.flops[tuple.flopsBasis] : undefined;
  if (flops === undefined)
    throw new RooflineDataError(hwKey + " tuple '" + precision + "' names flopsBasis '" + tuple.flopsBasis + "' absent from the row's flops map");
  rdNum(tuple.sW, hwKey + "." + precision + ".sW"); rdNum(tuple.sKV, hwKey + "." + precision + ".sKV"); rdNum(tuple.sAct, hwKey + "." + precision + ".sAct");
  return { flopsBasis: tuple.flopsBasis, flops, sW: tuple.sW, sKV: tuple.sKV, sAct: tuple.sAct,
           fallback: tuple.fallback ?? null, naming: tuple.naming ?? null };
}

/* ---------- frozen §1.1 term forms ---------- */
function fAttnPerPos(arch, L) {                                    // FLOPs of attention per target position
  const f = archFormsUsed(arch);
  if (f.fAttnForm === "mla")
    return 2 * arch.layers * arch.qHeads * (arch.qkDim + arch.vDim) * L;
  if (f.fAttnForm === "gqa" || f.fAttnForm === "gqa-upper-bound")  // out-of-model rows: GQA formula on declared qHeads/headDim (upper bound, disclosed)
    return 2 * arch.layers * arch.qHeads * 2 * arch.headDim * L;
  throw new RooflineDataError("no F_attn form for declared fAttnForm '" + f.fAttnForm + "'");
}
function kvBytesPerToken(arch, sKV) {                              // KV bytes per token per sequence (unsharded)
  const f = archFormsUsed(arch);
  if (f.kvForm === "mla") return arch.layers * arch.kvDim * sKV;
  if (f.kvForm === "gqa") return 2 * arch.layers * arch.kvHeads * arch.headDim * sKV;
  if (f.kvForm === "compressed-single-head")                       // V4 family: layers × kvHeads(1) × headDim × sKV — NOT the GQA ×2 form
    return arch.layers * arch.kvHeads * arch.headDim * sKV;
  throw new RooflineDataError("no KV form for declared kvForm '" + f.kvForm + "'");
}
function fabricBytesPerPos(arch, sAct, N) {                        // §1.1 fabric payload per target position, per device
  if (arch.mode === "moe-ep") {
    rdNum(arch.moeLayers, "arch.moeLayers (MoE fabric term)"); rdNum(arch.topK, "arch.topK (MoE fabric term)");
    return 2 * arch.moeLayers * arch.topK * arch.hidden * sAct;    // dispatch+combine, local 1 / remote 0, α_rtt 0
  }
  if (arch.mode === "dense-tp")
    return 4 * arch.layers * arch.hidden * sAct * (N - 1) / N;     // two ring allreduces/layer
  throw new RooflineDataError("unknown arch mode '" + String(arch.mode) + "'");
}

/* ---------- decode weight-traffic basis (b9 M1, decision M1-D1) ----------
   A CLOSED typed enum declared per CALIBRATION row (set lives in engine-data-v22.js
   beside the rows it types). Absent ⇒ the historical default, so every unmigrated row
   behaves byte-identically. An unknown value is a hard error (fail-closed): a mistyped
   basis must never silently fall back to the surrogate, because the row's η is only
   valid in its declared representation (run B §A4).

   FIREWALL (feasibility-redesign memo §0-bis): the replica-resident basis divides the
   replica's distinct weight traffic by the row's DECLARED replica width — never by the
   solved capacity width. Decode throughput therefore stays independent of the capacity
   solver and of `loadedWeightBytesPerParam`, exactly as under the surrogate basis. Using
   the solved width here would give the capacity-only planning policy a route into a
   calibrated throughput term, which the memo forbids in every phase. */
function decodeTrafficBasis(cal, hwKey) {
  const v = cal && cal.decodeTrafficBasis;
  // b9 M2 (memo §3.1.1): the field NO LONGER DEFAULTS. M1 let it default so unmigrated rows
  // stayed byte-identical; that kindness expires here. An implementer default is exactly how a
  // unit conflation gets re-introduced silently, so absence is a typed error.
  if (v === undefined || v === null)
    throw new RooflineDataError("CALIBRATION." + String(hwKey) + " has no decodeTrafficBasis — REQUIRED since b9 M2 (closed set {" + RD_DECODE_TRAFFIC_BASES.join(", ") + "}); there is no implementer default");
  if (!RD_DECODE_TRAFFIC_BASES.includes(v))
    throw new RooflineDataError("unknown decodeTrafficBasis '" + String(v) + "' (closed set {" + RD_DECODE_TRAFFIC_BASES.join(", ") + "})");
  // b9 M2 (memo §3.1.2): run B §A4 promoted from prose to a type — an η may not be read in any
  // representation other than the one it was derived in. The two are a matched pair.
  const rep = cal.etaRepresentation;
  if (rep === undefined || rep === null)
    throw new RooflineDataError("CALIBRATION." + String(hwKey) + " has no etaRepresentation — REQUIRED since b9 M2 (run B §A4: the coefficient and the representation are a matched pair)");
  if (rep !== v)
    throw new RooflineDataError("CALIBRATION." + String(hwKey) + " reads η calibrated in '" + String(rep) + "' under decodeTrafficBasis '" + v + "' — FORBIDDEN (run B §A4). Re-derive the coefficient or restore the basis; never transplant.");
  return v;
}
/* b9 M2 (memo §4, decision M2-D2): N_phys is a DECLARED registry constant, never the solved
   capacity width. Generalises M1's `declaredReplicaWidth`. The firewall matters MORE under the
   topology-aware bases than it did at M1: under the surrogate W_iter is width-independent so the
   guarantee holds trivially, but here N_phys divides the traffic term directly, so a solved width
   would hand the capacity-only loadedWeightBytesPerParam policy a route into a calibrated
   throughput term. §2.1 measures this parameter at ±5.9pp on the headline — it is the most
   sensitive un-evidenced quantity in the new form. */
function nPhysDeclared(cal, hwKey) {
  const n = cal && cal.nPhysDeclared;
  if (!Number.isFinite(n) || n < 1)
    throw new RooflineDataError("CALIBRATION." + String(hwKey) + " has no finite nPhysDeclared — REQUIRED since b9 M2 (declared registry replica width; NEVER the solved capacity width)");
  return n;
}
/* b9 M2 — run B §C4's distinct-expert traffic term, per replica:
     W_distinct(B) = W_shared + Σ_e W_e·[1 − (1 − p_e)^{B_rep·q}]
   where p_e is the probability that expert e appears in one token's top-k set.
   Uniform top-k routing gives p_e = k/E and is the coverage-MAXIMISING setting
   (concavity + Jensen; design gate R5), so
   this is an upper bound on MODELLED traffic and NO bound on actual traffic. Callers must supply
   a placement record explicitly — there is no fallback, because a silently-defaulted placement is
   how an unevidenced expert geometry would reach a headline. */
function wDistinctReplicaBytes(placement, bRep, q, hwKey) {
  if (!placement || typeof placement !== "object")
    throw new RooflineDataError("CALIBRATION." + String(hwKey) + " declares decodeTrafficBasis 'expert-coverage' without a placement record (memo §6.2); no default exists");
  const { wSharedBytes, wExpertBytes, expertsPerLayer, moeLayers, topK } = placement;
  rdNum(wSharedBytes, hwKey + ".placement.wSharedBytes"); rdNum(wExpertBytes, hwKey + ".placement.wExpertBytes");
  rdNum(expertsPerLayer, hwKey + ".placement.expertsPerLayer"); rdNum(moeLayers, hwKey + ".placement.moeLayers");
  rdNum(topK, hwKey + ".placement.topK"); rdNum(bRep, hwKey + ".B_rep"); rdNum(q, hwKey + ".q");
  if (!Number.isInteger(expertsPerLayer))
    throw new RooflineDataError(hwKey + ".placement.expertsPerLayer must be an integer");
  if (!Number.isInteger(moeLayers))
    throw new RooflineDataError(hwKey + ".placement.moeLayers must be an integer");
  if (!Number.isInteger(topK) || topK > expertsPerLayer)
    throw new RooflineDataError(hwKey + ".placement.topK must be an integer no greater than expertsPerLayer");
  const tokenGroups = bRep * q;
  const draws = tokenGroups * topK;                                // token→expert selections per replica step
  const coverage = 1 - Math.pow(1 - topK / expertsPerLayer, tokenGroups);
  return { bytes: wSharedBytes + moeLayers * expertsPerLayer * wExpertBytes * coverage, coverage, draws };
}

/* ---------- decode core (frozen §1.1–§1.2 + §1.5; memo §1a/§7) ----------
   q = 1 / a = 1 FIXED (memo §2 render rule): kvScans = q = 1, T̂ = b·a/t_iter = b/t_iter.
   Unknown option fields (q, a, tauCc, osl, …) are structurally IGNORED — only the
   destructured names below ever enter the computation. */
function decodeRoofline(opts) {
  const { arch, activeB, totalB, hwKey, b, L, precision, stackMult = 1, declaredOperatingWidth } = opts;
  rdNum(activeB, "activeB"); rdNum(totalB, "totalB"); rdNum(b, "b"); rdNum(L, "L"); rdNum(stackMult, "stackMult");
  if (activeB > totalB)
    throw new RooflineUnitError("activeB cannot exceed totalB (got " + activeB + " > " + totalB + ")");
  const { row } = resolveHwRoofline(hwKey);
  const tup = resolvePrecisionTuple(hwKey, precision);
  const cal = Object.prototype.hasOwnProperty.call(RD_CALIBRATION, hwKey) ? RD_CALIBRATION[hwKey] : undefined;
  if (!cal || typeof cal.etaDec !== "number") throw new RooflineDataError("no CALIBRATION.etaDec for '" + String(hwKey) + "'");
  const forms = archFormsUsed(arch);
  // R2: width from the capacity solver's declared-operating-point output (sealed door)
  // wherever a domain is registered; the registry row path survives ONLY for no-domain
  // rows (rubin) — the legacy sensitivity-case channel is RETIRED (memo §0 P1-7).
  const resolvedNShard = declaredOperatingWidth != null
    ? { nShard: assertDeclaredOperatingWidth(hwKey, declaredOperatingWidth),
        topologyDimension: "N_shard", caseId: null, widthSource: "declared-operating-point" }
    : { ...resolveNShardValue(hwKey, row, undefined), widthSource: "registry-row" };
  const N = resolvedNShard.nShard;
  const A = activeB * 1e9, Total = totalB * 1e9;                   // B-params → params

  const phi = 2 * A + fAttnPerPos(arch, L);                        // Φ(m, L)
  const kvSeq = kvBytesPerToken(arch, tup.sKV) * L;                // K(L), per sequence, unsharded
  const dense = arch.mode === "dense-tp";
  const phiDev = dense ? phi / N : phi;                            // §1.2 shares
  const kDevSeq = dense ? kvSeq / N : kvSeq;
  // §1.1 weight reads. Dense-TP has always read the replica's resident share (Total·s_W/N).
  // For MoE-EP the basis is a TYPED per-row declaration (b9 M1 / decision M1-D1, memo §2):
  //   "active-parameter-surrogate"  — the historical default: the full active-parameter
  //                                   read charged to every device, width-independent.
  //   "replica-resident-distinct"   — the local-device form of run B §A1: the replica's
  //                                   distinct weight traffic shared across its N devices,
  //                                   paired with b = B_rep/N (the per-chip output share).
  // The two forms are algebraically equivalent to run B's aggregate form; the basis is
  // matched to the row's η by construction (§A4: the aggregate coefficient is valid ONLY
  // in the topology-aware representation). M2 replaces the enum with W_distinct(B).
  // b9 M2: N_phys is the DECLARED registry width (memo §4). B_rep is DERIVED from the cell's
  // typed batch quantity rather than read off an untyped `b` — that derivation is the structural
  // kill for defect D1 (run B §A3: B_rep, N_phys, D_attn, EP and TP must be retained separately).
  const basis = decodeTrafficBasis(cal, hwKey);
  const nPhys = basis === "active-parameter-surrogate" ? null : nPhysDeclared(cal, hwKey);
  const bRep = nPhys != null ? b * nPhys : null;                   // b is the per-chip output share
  let coverageInfo = null;
  // NOTE (memo §10.1): each branch must evaluate through the SAME floating-point expression it
  // used before M2 — byte-identity is the acceptance and IEEE-754 is not associative, so an
  // algebraically-equal rearrangement here is a defect, not a simplification.
  let wIter;
  if (dense) wIter = Total * tup.sW / N;
  else if (basis === "replica-resident-distinct") wIter = Total * tup.sW / nPhys;
  else if (basis === "expert-coverage") {
    coverageInfo = wDistinctReplicaBytes(opts.placement, bRep, 1, hwKey); // draws = B_rep·q·k at q = 1
    wIter = coverageInfo.bytes / nPhys;
  } else wIter = A * tup.sW;
  const dBytes = fabricBytesPerPos(arch, tup.sAct, N);

  const tC = b * phiDev / tup.flops;                               // q = 1 (declared floor)
  const tH = (wIter + b * kDevSeq) / row.bwHBM;                    // kvScans = q = 1
  const tN = b * dBytes / row.fabric;
  const bindingTerm = (tH >= tC && tH >= tN) ? "t_H" : (tC >= tN) ? "t_C" : "t_N";
  const etaEff = cal.etaDec * stackMult;                           // product extension (memo §1a/§7): η_eff = η_dec × stackMult
  if (!isFinite(etaEff) || etaEff <= 0 || etaEff > 1)
    throw new RooflineUnitError("effective decode efficiency must be in (0, 1] (got " + etaEff + ")");
  const tRoof = Math.max(tC, tH, tN) / etaEff;
  const tCc = dense ? RD_TCC.collectivesPerLayer * arch.layers * RD_TCC.tauCc : 0; // §1.5: dense-TP only; τ from declared constants, NEVER a parameter
  const tIter = tRoof + tCc;                                       // frozen form verbatim; t_cc OUTSIDE η, unscaled by stackMult
  return {
    tokPerS: b / tIter,                                            // T̂ = b·a/t_iter, a = 1
    tpot: tIter,                                                   // predicted TPOT = t_iter/a — an OUTPUT, never an input
    tC, tH, tN, tRoof, tCc, tIter, bindingTerm,
    mode: arch.mode, nShard: N, topologyDimension: resolvedNShard.topologyDimension,
    nShardCaseId: resolvedNShard.caseId, widthSource: resolvedNShard.widthSource,
    etaDec: cal.etaDec, etaEff, decodeTrafficBasis: basis,
    // b9 M2 topology surface (memo §6.1) — DERIVED, not stored: B_rep = b x N_phys.
    etaRepresentation: cal.etaRepresentation, nPhysDeclared: nPhys, bRep,
    expertCoverage: coverageInfo ? coverageInfo.coverage : null,
    expertDraws: coverageInfo ? coverageInfo.draws : null,
    // b9 M2 (memo §7): q/a are now DECLARED in the operating-point registry (all cells 1/1, the
    // "explicitly conservative floor" of run B §B10) and REPORTED here. They are deliberately NOT
    // read from caller opts: the standing anti-injection guard requires that injected q/a/kvScans
    // be structurally ignored, so that a caller can never buy throughput by asserting speculation.
    // A future milestone moving a row off 1/1 must route through the registry, never through opts,
    // and must consult that row's anchorAlreadyIncludesMTP or it will double-count.
    q: 1, a: 1,

    phi, phiDev, kvSeqBytes: kvSeq, kvSeqBytesDev: kDevSeq, wIterBytes: wIter, fabricBytesPerPosDev: dBytes,
    flopsBasis: tup.flopsBasis, precisionFallback: tup.fallback,
  };
}

/* ---------- feasibility (memo §5; frozen §1.3/§1.4) ----------
   W_resident + b·LPeak·kvTok_basis + 0.10·HBM ≤ HBM (C8 workspace),
   W_resident = Total·s_w/N_shard. Capacity reserves terminal live KV at
   LPeak = ISL + OSL; decode performance separately uses representative L.
   KV basis = the SCAN basis: MoE-EP unsharded per-sequence; dense-TP ÷N. */
function feasibilityRoofline(opts) {
  const { arch, totalB, hwKey, precision, L, LPeak, declaredOperatingWidth, capacitySolve } = opts;
  if (opts.nShardCase !== undefined) throw new RooflineDataError("feasibilityRoofline: the nShardCase channel is RETIRED (R2) — never silently ignored");
  rdNum(totalB, "totalB"); rdNum(L, "L"); rdNum(LPeak, "LPeak");
  const { row, hbmBytes: hbmRegistry } = resolveHwRoofline(hwKey);
  /* b9 M4 (memo §2.9): a custom-fleet leg's user-declared HBM capacity threads through
     this ONE options channel to the single registry consumption point — a declared
     capacity number, not a calibration transfer. Same plausibility window the registry
     rows pass (1e10–1e12 B), fail-closed. Never a default: undefined = registered value. */
  const hbmBytes = opts.hbmBytesOverride != null
    ? (() => { const v = opts.hbmBytesOverride;
        if (typeof v !== "number" || !isFinite(v) || v < 1e10 || v > 1e12)
          throw new RooflineUnitError("hbmBytesOverride " + String(v) + " outside the plausibility window [1e10,1e12] B");
        return v; })()
    : hbmRegistry;
  const tup = resolvePrecisionTuple(hwKey, precision);
  const resolvedNShard = declaredOperatingWidth != null
    ? { nShard: assertDeclaredOperatingWidth(hwKey, declaredOperatingWidth),
        topologyDimension: "N_shard", caseId: null, widthSource: "declared-operating-point" }
    : { ...resolveNShardValue(hwKey, row, undefined), widthSource: "registry-row" };
  const nShard = resolvedNShard.nShard;
  const dense = arch.mode === "dense-tp";
  const kvTok = kvBytesPerToken(arch, tup.sKV) * (dense ? 1 / nShard : 1);
  const workspace = 0.10 * hbmBytes;                               // C8
  if (capacitySolve !== undefined) {
    const trusted = capacitySolve && RD_CAPACITY_SOLVE_META.get(capacitySolve);
    if (!trusted)
      throw new RooflineDataError("feasibilityRoofline: capacitySolve is not a trusted capacity solve result");
    if (trusted.arch !== arch || trusted.totalB !== totalB || trusted.hwKey !== hwKey ||
        trusted.precision !== precision || trusted.LPeak !== LPeak
        || (trusted.hbmBytesOverride ?? null) !== (opts.hbmBytesOverride ?? null))
      throw new RooflineDataError("feasibilityRoofline: trusted capacity solve inputs do not match this render (incl. hbmBytesOverride identity — b9 M4)");
    if (declaredOperatingWidth == null)
      throw new RooflineDataError("feasibilityRoofline: trusted capacity solve requires its declared operating width");
    /* The rows must carry THIS solve's brand -- not merely be some solve's rows, and not a
       caller's substitute. Identity of the brand record is the binding, so a solve still
       cannot be replayed against different geometry, precision, traffic length or hardware. */
    const perWidth = capacitySolve.perWidth;
    if (!perWidth || RD_CAPACITY_SOLVE_ROWS.get(perWidth) !== trusted)
      throw new RooflineDataError("feasibilityRoofline: capacity solve rows are not the ones this solve produced");
    const selected = perWidth.find(row => row.width === nShard);
    if (!selected)
      throw new RooflineDataError("feasibilityRoofline: trusted capacity solve has no row for declared width " + String(nShard));
    return { bFeas: selected.bFeas, wResidentBytes: selected.wResidentBytes,
             kvTokBytesBasis: kvTok, kvSeqBytesBasis: kvTok * LPeak,
             decodeRepresentativeTokens: L, peakKvTokens: LPeak,
             workspaceBytes: workspace, hbmBytes, nShard,
             topologyDimension: resolvedNShard.topologyDimension, nShardCaseId: resolvedNShard.caseId,
             mode: arch.mode, capacitySolveApplied: true };
  }
  const wResident = totalB * 1e9 * tup.sW / nShard;
  const room = hbmBytes - workspace - wResident;
  const bFeas = room <= 0 ? 0 : Math.floor(room / (LPeak * kvTok));
  return { bFeas, wResidentBytes: wResident, kvTokBytesBasis: kvTok, kvSeqBytesBasis: kvTok * LPeak,
           decodeRepresentativeTokens: L, peakKvTokens: LPeak,
           workspaceBytes: workspace, hbmBytes, nShard,
           topologyDimension: resolvedNShard.topologyDimension, nShardCaseId: resolvedNShard.caseId,
           mode: arch.mode, capacitySolveApplied: false };
}

/* ---------- capacity-width solver (feasibility-redesign memo v4.1; live since R2) ----------
   LIVE since R2: the render path calls this solver and passes its trusted result into
   feasibility/rendering. Reuses the EXACT feasibility terms
   above (same kvTok basis, same C8 workspace, same floor) with two deliberate deltas:
   (1) width comes from an explicit caller-supplied legal list (domain enumerator), never
   from resolveNShardValue/registry cases; (2) the WEIGHT term may use the capacity-only
   loadedWeightBytesPerParam policy (memo §0-bis) — the performance tuple sW is never
   touched (calibration-invariant guard enforces). Returns BOTH solves (memo §0-ter):
   capacityMinimumUnderUniformPolicy (min width with bFeas >= 1) and
   declaredOperatingPointWidth (min width with bFeas >= bDeclared). */
function rdEnumerateLegalWidths(shapes) {
  switch (shapes.kind) {
    case "range-step": { const out = []; for (let w = shapes.min; w <= shapes.max; w += shapes.step) out.push(w); return out; }
    case "node-multiple": { const out = []; for (let w = shapes.nodeWidth; w <= shapes.max; w += shapes.nodeWidth) out.push(w); return out; }
    case "explicit-set": return [...shapes.widths];
    case "documented-slices": { const out = []; for (let w = shapes.min; w <= shapes.max; w *= 2) out.push(w); return out; }
    case "multi-rack": return [];
    default: throw new RooflineDataError("unknown hardwareLegalShapes kind '" + String(shapes.kind) + "'");
  }
}
/* R2 (im4-r2-shipment-plan §1.2; memo §0-bis): the LIVE render path consumes the
   capacity solver's declared-operating-point width. This is the sealed door those
   widths re-enter the roofline through — the width must be a member of the REGISTERED
   domain enumeration for its hardware (the domain enumerator remains the only source
   of legal widths; raw caller numbers are still forbidden, exactly as they are for
   sensitivity cases). No-domain rows (rubin) never reach this door — they keep the
   registry shape-only path through resolveNShardValue. */
function assertDeclaredOperatingWidth(hwKey, width) {
  const dom = RD_HW_DOMAINS ? RD_HW_DOMAINS[hwKey] : undefined;
  if (!dom) throw new RooflineDataError("declaredOperatingWidth for '" + String(hwKey) + "': no registered domain (no-domain rows keep the registry path)");
  const legal = rdEnumerateLegalWidths(dom.scaleUp.hardwareLegalShapes);
  if (!Number.isInteger(width) || !legal.includes(width))
    throw new RooflineDataError("declaredOperatingWidth " + String(width) + " is not in '" + hwKey + "' registered legal shape set (sealed door)");
  return width;
}

function capacityWidthSolve(opts) {
  const { arch, totalB, hwKey, precision, LPeak, widths, loadedWeightBytesPerParam, bDeclared,
          placementModelId, hbmBytesOverride } = opts;
  if (Object.prototype.hasOwnProperty.call(opts, "L"))
    throw new RooflineDataError("capacityWidthSolve: L is the representative decode position; capacity requires explicit LPeak");
  if (Object.prototype.hasOwnProperty.call(opts, "componentResidency"))
    throw new RooflineDataError("capacityWidthSolve: raw componentResidency is forbidden; registered placement is derived internally");
  rdNum(totalB, "totalB"); rdNum(LPeak, "LPeak");
  if (!Array.isArray(widths) || !widths.length || !widths.every(w => Number.isInteger(w) && w >= 1 && w <= 4096))
    throw new RooflineDataError("capacityWidthSolve requires an explicit non-empty legal width list (domain enumerator output)");
  // R1-impl review P1-3 (sealing): widths MUST be a subset of the registered domain
  // enumeration for this hardware — arbitrary caller widths (e.g. [19]) are a bypass.
  const rdDomain = RD_HW_DOMAINS && RD_HW_DOMAINS[hwKey];
  if (!rdDomain) throw new RooflineDataError("capacityWidthSolve: no registered domain for '" + String(hwKey) + "'");
  const legalList = rdEnumerateLegalWidths(rdDomain.scaleUp.hardwareLegalShapes);
  // R1-impl R2 F3: FULL-SET equality — a caller may only ever solve over the complete
  // registered enumeration (subset shopping like [72] is a bypass; the wrapper always
  // passes the full set).
  /* Both sides are ordered ONCE. The registered side was previously re-sorted INSIDE the
     .some() callback -- i.e. once per element of the array being compared against it -- and the
     caller's side was sorted here and then sorted again to build perWidth below. Same predicate,
     same error, same corners; the ascending copy is reused by the per-width solve. */
  const widthsAscending = widths.slice().sort((a, b) => a - b);
  const legalAscending = legalList.slice().sort((a, b) => a - b);
  if (widths.length !== legalList.length || widthsAscending.some((w, i) => w !== legalAscending[i]))
    throw new RooflineDataError("capacityWidthSolve: widths must EQUAL '" + hwKey + "' complete registered legal shape set (sealed; R1-impl R2 F3)");
  // R1-impl R4 NEW-P1 residual: a declared operating point must be a REAL serving batch —
  // fail-closed input rejection, never a vacuously-satisfiable b<=0 (bFeas >= 0 is true at
  // any width, which would mint declaredOperatingPointSatisfiable=true from nonsense).
  if (bDeclared != null && (typeof bDeclared !== "number" || !Number.isFinite(bDeclared) || bDeclared < 1))
    throw new RooflineDataError("capacityWidthSolve: bDeclared must be a finite batch >= 1 (declared operating point; fail-closed)");
  const { hbmBytes: hbmRegistry } = resolveHwRoofline(hwKey);
  /* b9 M4 (memo §2.9): same ONE-channel override as feasibilityRoofline, same
     plausibility window, and it JOINS the trusted-solve identity below — a solve
     without the override can never be paired with a render that carries it. */
  const hbmBytes = hbmBytesOverride != null
    ? (() => { if (typeof hbmBytesOverride !== "number" || !isFinite(hbmBytesOverride)
          || hbmBytesOverride < 1e10 || hbmBytesOverride > 1e12)
          throw new RooflineUnitError("hbmBytesOverride " + String(hbmBytesOverride) + " outside the plausibility window [1e10,1e12] B");
        return hbmBytesOverride; })()
    : hbmRegistry;
  const tup = resolvePrecisionTuple(hwKey, precision);
  const bytesPerParam = loadedWeightBytesPerParam != null ? loadedWeightBytesPerParam : tup.sW;
  if (typeof bytesPerParam !== "number" || !(bytesPerParam > 0.1 && bytesPerParam <= 4))
    throw new RooflineUnitError("loadedWeightBytesPerParam " + String(bytesPerParam) + " implausible");
  const dense = arch.mode === "dense-tp";
  const workspace = 0.10 * hbmBytes;                                // C8, identical to live
  /* R2 §1.5 (placement registry): placement residency is derived HERE from a registered
     model row. A raw per-width byte map is deliberately not an input: now that capacity
     feasibility caps the live batch, accepting one would be a direct throughput-injection
     channel. Exact checkpoint identity and precision tier are revalidated at this boundary. */
  let placementRow = null;
  if (placementModelId != null) {
    placementRow = Object.prototype.hasOwnProperty.call(RD_WEIGHT_PLACEMENT, placementModelId)
      ? RD_WEIGHT_PLACEMENT[placementModelId] : null;
    if (!placementRow)
      throw new RooflineDataError("capacityWidthSolve: no registered placement for model '" + String(placementModelId) + "'");
    if (loadedWeightBytesPerParam != null)
      throw new RooflineDataError("capacityWidthSolve: registered placement and a loaded-bytes policy override are mutually exclusive");
    if (totalB !== placementRow.engineTotalB ||
        RD_PRECISION_TIER_MAP[precision] !== placementRow.precisionTier ||
        arch !== resolveArch(placementModelId))
      throw new RooflineDataError("capacityWidthSolve: placement model does not match the exact registered checkpoint geometry and precision");
  }
  /* Loop-invariant: the unsharded per-token KV basis is a function of the arch record and the
     precision tuple, on neither of which the width can bear -- it was re-derived at every width.
     The caller's width list is also ordered ONCE here rather than inside the map's argument. */
  const kvTokUnsharded = kvBytesPerToken(arch, tup.sKV);
  const perWidth = Object.freeze(widthsAscending.map(w => {
    const wResident = placementRow
      ? placementRow.replicatedParams * placementRow.replicatedBytesPerParam
        + placementRow.moeLayers
          * Math.ceil((placementRow.routedExpertsPerLayer + placementRow.redundantExperts) / w)
          * placementRow.expertParams * placementRow.expertBytesPerParam
      : totalB * 1e9 * bytesPerParam / w;
    const kvTok = kvTokUnsharded * (dense ? 1 / w : 1);              // same basis rule as live
    const room = hbmBytes - workspace - wResident;
    const bFeas = room <= 0 ? 0 : Math.floor(room / (LPeak * kvTok));
    return Object.freeze({ width: w, wResidentBytes: wResident, bFeas });
  }));
  const capRow = perWidth.find(p => p.bFeas >= 1) || null;
  const opRow = (typeof bDeclared === "number")
    ? (perWidth.find(p => p.bFeas >= bDeclared) || null) : undefined;
  const result = {
    capacityMinimumUnderUniformPolicy: capRow ? capRow.width : null,   // null = no legal width fits (honest infeasible)
    declaredOperatingPointWidth: opRow === undefined ? null : (opRow ? opRow.width : null),
    declaredOperatingPointSatisfiable: opRow === undefined ? null : !!opRow,
    perWidth,
    bytesPerParamUsed: bytesPerParam, policyApplied: loadedWeightBytesPerParam != null,
    placementApplied: placementRow != null,
  };
  /* The binding record is SCALARS ONLY (plus `arch`, which is the registry's own arch record and
     is retained by the registry regardless). It must not also be a strong reference to the rows:
     a WeakMap VALUE is released by the major collector, so holding the 36-row graph here carried
     it into old space on every one of the ~8,867 solves an invocation performs. The rows carry
     the same record as their own brand instead -- see RD_CAPACITY_SOLVE_ROWS above. */
  const meta = Object.freeze({
    arch, totalB, hwKey, precision, LPeak,
    hbmBytesOverride: hbmBytesOverride != null ? hbmBytesOverride : null, // b9 M4: part of the solve identity
  });
  RD_CAPACITY_SOLVE_META.set(result, meta);
  RD_CAPACITY_SOLVE_ROWS.set(perWidth, meta);
  return result;
}

/* ---------- operating points (memo §4 registry + §5 cap semantics) ----------
   opBasis ∈ {anchor-stated, analyst-declared, capped, infeasible}.
   regime ∈ {balanced, batch, fast}; b_declared per the reviewed registry (batch = rule cell
   mult × balanced); b_render = min(b_declared, b_feas); capped ⇒ opBasis "capped" (declared
   basis kept alongside); anchor-stated cells surface their registry basis as opCitation.
   b_feas < 1 ⇒ opBasis "infeasible" and explicit no-render result (NO numbers). No argmax, no
   ceiling inversion — resolution only ever moves b DOWNWARD from the declared value. */
function resolveOperatingPoint(opts) {
  const { hwKey, regime, arch, totalB, precision, L, LPeak, declaredOperatingWidth, capacitySolve,
          hbmBytesOverride } = opts; // b9 M4: forwarded to feasibility (memo §2.9 channel)
  const reg = Object.prototype.hasOwnProperty.call(RD_OPERATING_POINTS, hwKey) ? RD_OPERATING_POINTS[hwKey] : undefined;
  if (!reg) throw new RooflineDataError("no OPERATING_POINTS row for '" + String(hwKey) + "'");
  const cell = Object.prototype.hasOwnProperty.call(reg, regime) ? reg[regime] : undefined;
  if (!cell) throw new RooflineDataError("row '" + hwKey + "' declares no '" + String(regime) + "' regime (absent by design ⇒ hard error, memo §4/§6)");
  // b9 M2 (memo §6.1, run B §A3): every cell must state WHICH batch quantity it carries. An untyped
  // `b` that silently means different quantities in different terms IS defect class D1.
  if (!RD_BATCH_QUANTITIES.includes(cell.batchQuantity))
    throw new RooflineDataError("OPERATING_POINTS." + String(hwKey) + "." + String(regime) +
      " has no valid batchQuantity — REQUIRED since b9 M2 (closed set {" + RD_BATCH_QUANTITIES.join(", ") + "})");
  let bDeclared;
  if (typeof cell.b === "number") bDeclared = cell.b;
  else if (cell.rule && typeof cell.mult === "number" && reg.balanced && typeof reg.balanced.b === "number")
    bDeclared = cell.mult * reg.balanced.b;                        // §4 rule cell: min(mult×balanced, b_feas) — the min happens below
  else throw new RooflineDataError("operating-point cell " + hwKey + "." + regime + " is neither a declared b nor a well-formed rule cell");
  const feas = feasibilityRoofline({ arch, totalB, hwKey, precision, L, LPeak, declaredOperatingWidth, capacitySolve, hbmBytesOverride });
  const declaredOpCitation = cell.opBasis === "anchor-stated" ? cell.basis : null;
  if (feas.bFeas < 1)
    return { infeasible: true, bFeas: feas.bFeas, bDeclared, regime, hwKey,
             opBasis: "infeasible", opCitation: declaredOpCitation,
             declaredOpBasis: cell.opBasis, declaredOpCitation, feasibility: feas };
  const b = Math.min(bDeclared, feas.bFeas);
  const capped = b < bDeclared;
  return { infeasible: false, b, bDeclared, bFeas: feas.bFeas, capped,
           opBasis: capped ? "capped" : cell.opBasis, opCitation: declaredOpCitation,
           declaredOpBasis: cell.opBasis, declaredOpCitation,
           regime, hwKey, feasibility: feas };
}
/* ---------- traffic → context (memo §3 fixed-OSL rule) ----------
   OSL is registry data per profile FAMILY (never encoded, never a parameter);
   ISL = ioRatio × OSL; representative decode L = ISL + OSL/2 (C5);
   peak live KV LPeak = ISL + OSL; prefill L_in = ISL.
   custom/edited/legacy/replay states use the SAME rule with the profile-family OSL —
   editing ioRatio moves ISL only. A state with NO named family (profileId null:
   custom-from-scratch / legacy-custom) resolves through TRAFFIC_PROFILES[0] as a ROOFLINE
   COMPLETION (reviewer wording, R5): engine.js applies `|| TRAFFIC_PROFILES[0]` to
   unresolvable profile IDs but NOT to custom/legacy null states — this module's rule is
   ANALOGOUS to that convention, not a claim about engine.js behavior, and it preserves the
   null origin (the returned profileId names the completion family; the caller's state keeps
   its null identity). Deterministic, documented, flagged for slice-2 review. */
function resolveTrafficLengths(opts) {
  const { profileId = null, ioRatio = null } = opts || {};
  const nullFamily = (profileId === null || profileId === undefined);
  const familyId = nullFamily ? RD_TRAFFIC_PROFILES[0].id : profileId;
  const entry = Object.prototype.hasOwnProperty.call(RD_TRAFFIC_OSL, familyId) ? RD_TRAFFIC_OSL[familyId] : undefined;
  if (!entry) throw new RooflineDataError("no TRAFFIC_OSL entry for profile '" + String(familyId) + "'");
  let ratio = ioRatio;
  if (ratio === null || ratio === undefined) {
    const prof = RD_TRAFFIC_PROFILES.find(t => t.id === familyId);
    if (!prof) throw new RooflineDataError("no TRAFFIC_PROFILES row for '" + familyId + "' (authored ratio unavailable)");
    ratio = prof.ioRatio;
  }
  rdNum(ratio, "ioRatio");
  /* The label is only ever read on the throw path, so it is composed there rather than on every
     resolution the invocation makes. rdNum's accept condition is inlined
     verbatim; anything it would reject still goes through rdNum and throws the same error.
     26,601 resolutions per adjust_rental_rate invocation, none of which read the label. */
  const osl = typeof entry.osl === "number" && isFinite(entry.osl) && entry.osl > 0
    ? entry.osl : rdNum(entry.osl, "TRAFFIC_OSL." + familyId + ".osl");
  const isl = ratio * osl;
  return { profileId: familyId, nullFamilyCompletion: nullFamily, ioRatio: ratio, osl, isl,
           L: isl + osl / 2, LPeak: isl + osl, LIn: isl, oslBasis: entry.oslBasis };
}

/* ---------- registered context-window bound ----------
   maxPos is model/architecture evidence, not a universal engine constant. Where a
   row registers it, the claim-bearing render path enforces the complete request
   lifetime ISL + OSL (also terminal live KV), not representative decode L or
   prefill-only LIn. An absent field remains explicit unregistered evidence: the
   engine does not invent a bound for closed/archetype rows. */
function contextWindowStatus(arch, lengths, limitSource = null) {
  if (!arch || typeof arch !== "object" || Array.isArray(arch))
    throw new RooflineDataError("context window: arch record absent/malformed");
  if (!lengths || typeof lengths !== "object" || Array.isArray(lengths))
    throw new RooflineDataError("context window: resolved traffic lengths absent/malformed");
  const isl = rdNum(lengths.isl, "context window ISL");
  const osl = rdNum(lengths.osl, "context window OSL");
  const representativeDecodeTokens = rdNum(lengths.L, "context window representative decode L");
  const prefillTokens = rdNum(lengths.LIn, "context window prefill LIn");
  const peakKvTokens = rdNum(lengths.LPeak, "context window peak-KV LPeak");
  const combinedTokens = isl + osl;
  if (prefillTokens !== isl || peakKvTokens !== combinedTokens)
    throw new RooflineDataError("context window: traffic receipt is internally inconsistent (requires LIn=ISL and LPeak=ISL+OSL)");
  const source = typeof limitSource === "string" && limitSource
    ? limitSource : "architecture registry (caller did not supply row identity)";
  /* The shared fields are written into the returned record directly. They used to be built as
     their own object and then SPREAD into it -- a full copy of a record this function had just
     allocated, on every one of the 26,601 calls an adjust_rental_rate invocation makes. The key
     order below is byte-for-byte what the spread produced, in both branches. */
  const DEFINITION = "ISL + OSL (complete request lifetime; terminal live KV)";
  if (!Object.prototype.hasOwnProperty.call(arch, "maxPos"))
    return { state: "unregistered", maxPos: null,
      islTokens: isl, oslTokens: osl, representativeDecodeTokens, prefillTokens,
      peakKvTokens, combinedTokens,
      definition: DEFINITION,
      source,
      reason: "no maxPos is registered for this architecture; no context limit was invented" };
  if (!Number.isInteger(arch.maxPos) || arch.maxPos <= 0)
    throw new RooflineDataError("context window: registered maxPos must be a positive integer (got " + String(arch.maxPos) + ")");
  const exceeded = combinedTokens > arch.maxPos;
  return {
    state: exceeded ? "exceeded-registered-limit" : "within-registered-limit",
    maxPos: arch.maxPos,
    islTokens: isl, oslTokens: osl, representativeDecodeTokens, prefillTokens,
    peakKvTokens, combinedTokens,
    definition: DEFINITION,
    source,
    /* The refusal sentence is formatted only where it is used. It went through a closure that
       was allocated on every call, including the overwhelming majority that are within the
       limit and return `reason: null`. */
    reason: exceeded
      ? "requested context window " + rdCount(combinedTokens) + " tokens (ISL " + rdCount(isl)
        + " + OSL " + rdCount(osl) + ") exceeds registered maxPos " + rdCount(arch.maxPos)
        + "; no numeric result"
      : null,
  };
}

/* ---------- prefill (frozen §2 verbatim; memo §8 universal transfer) ----------
   t_tok = max(Φ_pre_dev/FLOPS, D/B_fabric)/η_pre_eff; Φ_pre = 2·A + F_attn(m, L_in/2);
   Φ_pre_dev = Φ_pre (MoE-EP) | Φ_pre/N (dense-TP); NO t_cc (amortized, stated);
   η_pre = the single frozen F7 value for EVERY row (h800 FITTED identity, all others
   `extrapolated (single-anchor transfer)` — status strings live on PREFILL_CAL). */
function prefillRoofline(opts) {
  const { arch, activeB, hwKey, precision, stackMult = 1, LIn, declaredOperatingWidth } = opts;
  rdNum(activeB, "activeB"); rdNum(LIn, "LIn"); rdNum(stackMult, "stackMult");
  const { row } = resolveHwRoofline(hwKey);
  const tup = resolvePrecisionTuple(hwKey, precision);
  const etaPre = RD_PREFILL_CAL.etaPre;
  if (typeof etaPre !== "number") throw new RooflineDataError("PREFILL_CAL.etaPre absent");
  const resolvedNShard = declaredOperatingWidth != null
    ? { nShard: assertDeclaredOperatingWidth(hwKey, declaredOperatingWidth),
        topologyDimension: "N_shard", caseId: null, widthSource: "declared-operating-point" }
    : { ...resolveNShardValue(hwKey, row, undefined), widthSource: "registry-row" };
  const N = resolvedNShard.nShard;
  const A = activeB * 1e9;
  const dense = arch.mode === "dense-tp";
  const phiPre = 2 * A + fAttnPerPos(arch, LIn / 2);               // causal-average attention
  const phiPreDev = dense ? phiPre / N : phiPre;                   // frozen branch, restored verbatim (memo §1a)
  const dBytes = fabricBytesPerPos(arch, tup.sAct, N);
  const tCompute = phiPreDev / tup.flops, tFabric = dBytes / row.fabric;
  const etaPreEff = etaPre * stackMult;                            // memo §7: stackMult multiplies η_pre identically
  if (!isFinite(etaPreEff) || etaPreEff <= 0 || etaPreEff > 1)
    throw new RooflineUnitError("effective prefill efficiency must be in (0, 1] (got " + etaPreEff + ")");
  const tTok = Math.max(tCompute, tFabric) / etaPreEff;
  return { tokPerS: 1 / tTok, tTok, bindingTerm: tCompute >= tFabric ? "compute" : "fabric",
           phiPre, phiPreDev, fabricBytesPerPosDev: dBytes, etaPre, etaPreEff,
           status: RD_PREFILL_CAL.status[hwKey] ?? null, mode: arch.mode, nShard: N,
           topologyDimension: resolvedNShard.topologyDimension, nShardCaseId: resolvedNShard.caseId };
}

/* ---------- full render composition (IM3 exit-gate fix 5, P2: was "slice 3 will wire the
   display path through this shape" -- slice 3 did, in engine.js's rooflinePoint(); this IS the
   live display-path shape now, plus still used by the diff harness and the slice-1b guard
   tests) ---------- */
function renderPoint(opts) {
  const { arch, activeB, totalB, hwKey, regime, precision, stackMult = 1, profileId = null, ioRatio = null,
          declaredOperatingWidth, capacitySolve, contextLimitSource = null,
          hbmBytesOverride } = opts; // b9 M4: forwarded through resolveOperatingPoint → feasibility
  const lengths = resolveTrafficLengths({ profileId, ioRatio });
  const contextWindow = contextWindowStatus(arch, lengths, contextLimitSource);
  if (contextWindow.state === "exceeded-registered-limit") {
    const op = {
      infeasible: true, b: null, bDeclared: null, bFeas: null, capped: false,
      regime, hwKey, opBasis: "context-window-exceeded", opCitation: null,
      declaredOpBasis: null, declaredOpCitation: null, reason: contextWindow.reason,
    };
    return {
      infeasible: true, opBasis: "context-window-exceeded", opCitation: null,
      reason: contextWindow.reason, contextWindow, op, lengths,
    };
  }
  const op = resolveOperatingPoint({
    hwKey, regime, arch, totalB, precision, L: lengths.L, LPeak: lengths.LPeak,
    declaredOperatingWidth, capacitySolve, hbmBytesOverride,
  });
  const provenance = { opBasis: op.opBasis, opCitation: op.opCitation };
  if (op.infeasible) return { infeasible: true, ...provenance, op, lengths }; // explicit infeasible state — NO numbers
  // b9 M2 (memo §7): op.q / op.a are declared in the registry and validated by the b9 suite; they
  // are NOT forwarded here, because caller-supplied q/a must stay structurally ignored (the
  // anti-injection guard). The declared floor is 1/1 on every cell, so the compute is unchanged.
  const decode = decodeRoofline({ arch, activeB, totalB, hwKey, b: op.b, L: lengths.L, precision, stackMult, declaredOperatingWidth });
  return { infeasible: false, ...provenance, tokPerS: decode.tokPerS, decode, op, lengths };
}

/* ---------- customDonor codec DELTA (memo §3 R2 contract) ----------
   Standalone functions — engine.js's live codec is NOT touched here; slice 3 wires them.
   Axis: customDonor ∈ CUSTOM_DONOR_ENUM.values, default CUSTOM_DONOR_ENUM.default;
   encoded ONLY when model === "custom" AND value ≠ default; a token lacking the field
   decodes to the default (every legacy custom link resolves unchanged). */
const CUSTOM_DONOR_BOUNDS = Object.freeze([...(RD_CUSTOM_DONOR_ENUM.values)]); // the future SCENARIO_BOUNDS enum entry
function encodeCustomDonor(modelId, customDonor) {
  if (modelId !== "custom") return undefined;                      // never encoded off the custom model
  if (customDonor === undefined || customDonor === null) return undefined; // default state: absent
  if (!RD_CUSTOM_DONOR_ENUM.values.includes(customDonor))
    throw new RooflineDataError("customDonor '" + String(customDonor) + "' is unrepresentable (enum {" + RD_CUSTOM_DONOR_ENUM.values.join(", ") + "})");
  if (customDonor === RD_CUSTOM_DONOR_ENUM.default) return undefined; // default is never encoded
  return customDonor;
}
function decodeCustomDonor(diff) {
  const v = diff ? diff.customDonor : undefined;
  if (v === undefined || v === null) return RD_CUSTOM_DONOR_ENUM.default; // absent field ⇒ default (legacy decode)
  if (typeof v !== "string" || !RD_CUSTOM_DONOR_ENUM.values.includes(v)) return null; // invalid ⇒ reject signal (fail closed)
  return v;
}

/* ---------- node export (mirrors engine.js) ----------
   CLOSED API SURFACE — the slice-1b no-argmax test pins this exact list. No exported
   function performs capacity inversion, accepts q/a, or accepts a τ_cc value. */
if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    RooflineDataError, RooflineUnitError,
    assertHwRowUnits,
    resolveArch, archFormsUsed,
    resolveHwRoofline, resolvePrecisionTuple,
    fAttnPerPos, kvBytesPerToken, fabricBytesPerPos,
    decodeRoofline, feasibilityRoofline, resolveOperatingPoint, capacityWidthSolve, rdEnumerateLegalWidths,
    assertDeclaredOperatingWidth,
    resolveTrafficLengths, contextWindowStatus, prefillRoofline, renderPoint,
    encodeCustomDonor, decodeCustomDonor, CUSTOM_DONOR_BOUNDS,
  });
}
