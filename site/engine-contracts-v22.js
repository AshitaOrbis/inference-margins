/* Frontier Inference Margins — R2 PRODUCTION CONTRACTS (engine migration of the pre-R2
   contract harness; feasibility-redesign memo v4.1 §0-quinquies P0-A/P0-B).

   This module IS the shipped form of the council-settled contracts the 9-round contract
   harness proved (harness/{contract-algebra,claim-identity,emission-boundary}.mjs,
   R9 PASS): typed claim-level provenance (unforgeable central capability, WeakSet brand),
   the structure-preserving pointwise result algebra (central metric-descriptor registry,
   injective canonical keys, snapshot trees, typed missing states, policy×lens grids,
   first-class discontinuities), and the closed registered emission boundary (envelopes,
   ONE shared weld formatter enforced AT emit(), content-addressed one-to-one sidecars,
   RFC 6901 pointers). Migration proof: tests/contract-migration-differential.test.mjs
   evaluates the harness fixture families against the reference (harness/) AND this
   module with byte-equal canonical outputs; tests/contract-harness.test.mjs runs
   entirely against this module (no reference import survives the switch).

   Dual-mode like engine.js: node `require`s it; the browser loads it as a classic
   script AFTER engine.js (script order: data -> roofline -> engine -> contracts -> app).
   To avoid top-level lexical collisions across classic scripts, the browser surface is
   ONE namespace const (IM_CONTRACTS); node gets the same object via module.exports.

   Hashing: claim IDs are sha256-content-addressed. Node uses node:crypto; the browser
   uses the pure-JS sha256 below (same hex output — pinned against node:crypto by the
   contract suite's fallback-equality assertions). */

"use strict";

const IM_CONTRACTS = (() => {

/* ---------- sha256 (node:crypto when present; pure-JS fallback for the browser) ---------- */
const NODE_CRYPTO = (typeof module !== "undefined" && module.exports)
  ? require("node:crypto") : null;

/* Pure-JS SHA-256 over UTF-8 input — standard FIPS 180-4 rounds, hex output. */
function sha256HexJs(str) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const enc = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(str)
    : Uint8Array.from(Buffer.from(str, "utf8"));
  const l = enc.length;
  const withOne = new Uint8Array(((l + 8) >> 6 << 6) + 64);
  withOne.set(enc); withOne[l] = 0x80;
  const bitLenHi = Math.floor(l / 0x20000000), bitLenLo = (l << 3) >>> 0;
  const dv = new DataView(withOne.buffer);
  dv.setUint32(withOne.length - 8, bitLenHi); dv.setUint32(withOne.length - 4, bitLenLo);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Int32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < withOne.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
function sha256Hex(str) {
  if (NODE_CRYPTO) return NODE_CRYPTO.createHash("sha256").update(str, "utf8").digest("hex");
  return sha256HexJs(str);
}

/* ================================================================================
   POINTWISE RESULT ALGEBRA (memo §0-quinquies P0-B; harness contract-algebra.mjs)
   ================================================================================ */

/* ---------- central metric-descriptor registry ---------- */
const METRIC_DESCRIPTORS = Object.freeze({
  "margin.unit-serving": Object.freeze({
    metricId: "margin.unit-serving", unit: "%",
    dimensions: Object.freeze(["model", "perspective", "policyPoint", "lens"]),
    label: "modeled unit direct-serving contribution margin" }),
  "cost.decode": Object.freeze({
    metricId: "cost.decode", unit: "$/Mtok",
    dimensions: Object.freeze(["model", "perspective", "hardware", "policyPoint", "lens"]),
    label: "blended decode cost" }),
  "cost.prefill": Object.freeze({
    metricId: "cost.prefill", unit: "$/Mtok",
    dimensions: Object.freeze(["model", "perspective", "hardware", "policyPoint", "lens"]),
    label: "blended prefill cost" }),
  "cost.mix": Object.freeze({
    metricId: "cost.mix", unit: "$/Mtok",
    dimensions: Object.freeze(["model", "perspective", "policyPoint", "lens"]),
    label: "traffic-mix blended cost" }),
  "price.mix": Object.freeze({
    metricId: "price.mix", unit: "$/Mtok",
    dimensions: Object.freeze(["model", "perspective", "policyPoint", "lens"]),
    label: "traffic-mix blended price" }),
  "fleet.renderableWeightShare": Object.freeze({
    metricId: "fleet.renderableWeightShare", unit: "share",
    dimensions: Object.freeze(["model", "perspective", "fleet", "policyPoint"]),
    label: "renderable weight share of the fleet blend" }),
  "capacity.minWidth": Object.freeze({
    metricId: "capacity.minWidth", unit: "gpus",
    dimensions: Object.freeze(["model", "hardware", "policyPoint"]),
    label: "capacity-minimum width under uniform policy" }),
  "capacity.declaredOpWidth": Object.freeze({
    metricId: "capacity.declaredOpWidth", unit: "gpus",
    dimensions: Object.freeze(["model", "hardware", "policyPoint", "regime"]),
    label: "declared-operating-point width" }),
});

const TYPED_MISSING_STATES = Object.freeze([
  "missing", "infeasible", "suppressed", "unverified",
]);

const POLICY_POINTS = Object.freeze([0.55, 0.65, 1.05]); // SAMPLED, never a band

/* ---------- canonical metric keys (INJECTIVE) ---------- */
function scalarDimension(v) {
  // NaN/Infinity JSON-encode as null and negative zero encodes as "0" — all three
  // would collapse key identity, so all three are REJECTED (harness R2 H-7 + R3 NEW-10).
  if (typeof v === "number") return Number.isFinite(v) && !Object.is(v, -0);
  return (typeof v === "string" || typeof v === "boolean");
}
function metricKey(metricId, scope) {
  const d = METRIC_DESCRIPTORS[metricId];
  if (!d) throw new Error(`unregistered metricId '${metricId}' — descriptors are central, never per-emitter`);
  const missing = d.dimensions.filter((dim) => !(dim in (scope || {})));
  if (missing.length) throw new Error(`metric '${metricId}' scope missing dimension(s): ${missing.join(",")}`);
  const extra = Object.keys(scope).filter((k) => !d.dimensions.includes(k));
  if (extra.length) throw new Error(`metric '${metricId}' scope carries undeclared dimension(s): ${extra.join(",")}`);
  for (const dim of d.dimensions)
    if (!scalarDimension(scope[dim]))
      throw new Error(`metric '${metricId}' dimension '${dim}' must be a scalar (got ${scope[dim] === undefined ? "undefined" : typeof scope[dim]})`);
  // Injective: JSON-encoded values; registry dimension ORDER makes the key
  // insertion-order/spelling independent (harness R1 H-7).
  return `${metricId}|${d.unit}|` + d.dimensions.map((dim) => `${dim}=${JSON.stringify(scope[dim])}`).join("|");
}

/* ---------- node constructors (frozen, fail-closed) ---------- */
/* Signed zero is NORMALIZED to +0 at every numeric constructor door (harness R4 NEW-10);
   raw nodes carrying -0 are rejected at validation as forges. */
const num = (v) => (v === 0 ? 0 : v);
function leaf(metricId, scope, value) {
  const key = metricKey(metricId, scope);
  if (typeof value === "number" && Number.isFinite(value))
    return Object.freeze({ kind: "leaf", key, state: "present", value: num(value) });
  if (value && typeof value === "object" && Number.isFinite(value.lo) && Number.isFinite(value.hi))
    return Object.freeze({ kind: "leaf", key, state: "present", value: Object.freeze({ lo: num(value.lo), hi: num(value.hi) }) });
  throw new Error(`leaf '${key}': value must be a finite number or {lo,hi} span — use stateLeaf() for absent values`);
}

function stateLeaf(metricId, scope, state, reason) {
  const key = metricKey(metricId, scope);
  if (!TYPED_MISSING_STATES.includes(state))
    throw new Error(`leaf '${key}': '${state}' is not a typed missing state (${TYPED_MISSING_STATES.join("/")})`);
  if (typeof reason !== "string" || !reason)
    throw new Error(`leaf '${key}': a typed ${state} state requires a reason`);
  return Object.freeze({ kind: "leaf", key, state, reason }); // NO value field, ever
}

/* Structural scalar for record fields: typed; null is an explicit typed value, undefined is not. */
function scalar(value) {
  const t = value === null ? "null" : typeof value;
  if (!["string", "number", "boolean", "null"].includes(t))
    throw new Error(`scalar: unsupported type '${t}'`);
  if (t === "number" && !Number.isFinite(value)) throw new Error("scalar: non-finite number");
  return Object.freeze({ kind: "scalar", type: t, value: t === "number" ? num(value) : value });
}

/* Record node: fixed named fields, each a node. Field names ARE semantic (the DTO's own
   shape), unlike top-level tree node names. */
function record(fields) {
  const out = {};
  for (const [name, node] of Object.entries(fields)) {
    if (!node || typeof node.kind !== "string") throw new Error(`record field '${name}' is not a node`);
    out[name] = node;
  }
  return Object.freeze({ kind: "record", fields: Object.freeze(out) });
}

function vector(itemIds, itemsById) {
  if (!Array.isArray(itemIds) || !itemIds.every((id) => typeof id === "string"))
    throw new Error("vector: stable string item IDs are required (membership by ID, never by count)");
  if (new Set(itemIds).size !== itemIds.length) throw new Error("vector: item IDs must be unique");
  // An EMPTY vector is honest: e.g. zero renderable legs.
  for (const id of itemIds) if (!itemsById[id]) throw new Error(`vector: item '${id}' has no node`);
  const extra = Object.keys(itemsById || {}).filter((id) => !itemIds.includes(id));
  if (extra.length) throw new Error(`vector: nodes for undeclared item(s): ${extra.join(",")}`);
  return Object.freeze({ kind: "vector", itemIds: Object.freeze([...itemIds]), items: Object.freeze({ ...(itemsById || {}) }) });
}

function policyLensGrid(policyPoints, lenses, cellFn) {
  if (!policyPoints.every((pp) => typeof pp === "number" && Number.isFinite(pp) && !Object.is(pp, -0)))
    throw new Error("policyLensGrid: policy points must be finite numbers (signed zero rejected — R4 NEW-10)");
  const cells = {};
  for (const p of policyPoints) for (const l of lenses) {
    const node = cellFn(p, l);
    if (!node || !["leaf", "vector", "record"].includes(node.kind))
      throw new Error(`grid cell (${p}, ${l}) must be a leaf, vector, or record node`);
    cells[`${p}|${l}`] = node;
  }
  return Object.freeze({ kind: "policy-lens-grid",
    policyPoints: Object.freeze([...policyPoints]), lenses: Object.freeze([...lenses]),
    cells: Object.freeze(cells) });
}

function sampledSummary(grid, lens) {
  const present = grid.policyPoints
    .map((p) => ({ p, node: grid.cells[`${p}|${lens}`] }))
    .filter(({ node }) => node.kind === "leaf" && node.state === "present" && typeof node.value === "number");
  if (!present.length) return Object.freeze({ lens, sampled: true, points: 0 });
  let min = present[0], max = present[0];
  for (const c of present) { if (c.node.value < min.node.value) min = c; if (c.node.value > max.node.value) max = c; }
  return Object.freeze({ lens, sampled: true, points: present.length,
    argMin: min.p, min: min.node.value, argMax: max.p, max: max.node.value,
    label: `${present.length}-point sampled sensitivity (no continuity implied)` });
}

/* ---------- shared plain-data door ----------
   Free-form caller payloads (discontinuity `at`, evidence bases) get the same fail-closed
   discipline as nodes: plain JSON-shaped data only. The terminal form (harness R7):
   validate AND return a fresh canonical deep copy built only from primitives, plain
   arrays, and plain objects — the COPY is what gets stored, so prototype-carried data,
   accessors, and non-enumerable residue cannot exist downstream BY CONSTRUCTION. */
function toPlainData(v, path, opts = {}) {
  assertPlainData(v, path, opts);
  const copy = (x) => {
    if (x === null || typeof x !== "object") return x;
    if (Array.isArray(x)) { // holes are PRESERVED (harness R8 NEW-17) — Array.from would densify,
      const arr = new Array(x.length); // collapsing Array(1) with [undefined]
      for (let i = 0; i < x.length; i++) if (i in x) arr[i] = copy(x[i]);
      return Object.freeze(arr);
    }
    return Object.freeze(Object.fromEntries(Object.keys(x).map((k) => [k, copy(x[k])])));
  };
  return copy(v);
}
function assertPlainData(v, path, opts = {}) {
  if (v === undefined && opts.rejectUndefined)
    throw new Error(`${path}: undefined value — JSON-invisible, canonical-collision REJECTED (R8)`);
  if (v === null || v === undefined) return;
  const t = typeof v;
  if (t === "number") {
    if (opts.rejectMinusZero && Object.is(v, -0))
      throw new Error(`${path}: signed-zero value — canonical-collision REJECTED`);
    if (opts.requireFinite && !Number.isFinite(v))
      throw new Error(`${path}: non-finite value — canonical-alias REJECTED (NaN/Infinity collapse to null in JSON)`);
    return;
  }
  if (t === "string" || t === "boolean") return;
  if (t !== "object") throw new Error(`${path}: non-data value (${t}) REJECTED`);
  if (Object.getOwnPropertySymbols(v).length)
    throw new Error(`${path}: symbol-keyed properties REJECTED`);
  if (Array.isArray(v)) {
    if (Object.getPrototypeOf(v) !== Array.prototype) throw new Error(`${path}: non-plain array REJECTED`);
    const extras = Object.getOwnPropertyNames(v).filter((k) =>
      k !== "length" && !(String(Number(k)) === k && Number.isInteger(Number(k)) && Number(k) >= 0 && Number(k) < v.length)); // "01" AND "0.5" are expandos, not indices
    if (extras.length) throw new Error(`${path}: array expando propert${extras.length > 1 ? "ies" : "y"} ${extras.join(",")} REJECTED`);
    for (let i = 0; i < v.length; i++) if (i in v) assertPlainData(v[i], `${path}[${i}]`, opts);
    return;
  }
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) throw new Error(`${path}: non-plain object REJECTED`);
  const names = Object.getOwnPropertyNames(v);
  if (names.length !== Object.keys(v).length)
    throw new Error(`${path}: non-enumerable propert${names.length - Object.keys(v).length > 1 ? "ies" : "y"} REJECTED (encoder-invisible)`);
  for (const k of names) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (d.get || d.set) throw new Error(`${path}.${k}: accessor property REJECTED (data properties only)`);
    assertPlainData(v[k], `${path}.${k}`, opts);
  }
}

/* ---------- discontinuity records ---------- */
const DISCONTINUITY_TYPES = Object.freeze(["width", "feasibility", "membership"]);
function discontinuity(type, at, invalidatedMetricKeys, note) {
  if (!DISCONTINUITY_TYPES.includes(type)) throw new Error(`unknown discontinuity type '${type}'`);
  if (!Array.isArray(invalidatedMetricKeys) || !invalidatedMetricKeys.length)
    throw new Error("a discontinuity must name the metric keys it invalidates (scoped, never global)");
  if (note != null && typeof note !== "string")
    throw new Error("discontinuity: note must be a string or null (closed type)"); // BigInt/objects cannot reach adapters
  // `at` is type-preservingly DEEP-COPIED through the door (no {...spread} array collapse)
  // and must be finite (identity coordinates: NaN would alias null).
  const atCopy = toPlainData(at, "discontinuity.at", { rejectMinusZero: true, requireFinite: true, rejectUndefined: true });
  return Object.freeze({ kind: "discontinuity", type, at: atCopy,
    invalidatedMetricKeys: Object.freeze([...invalidatedMetricKeys]),
    note: note ?? null });
}

// bq-292: a discontinuity must actually SUPPRESS something, or it is a false record.
//
// applyDiscontinuity used to append `disc` to t.discontinuities unconditionally,
// while only suppressing leaves whose key happened to match. A discontinuity naming
// keys that exist nowhere in the tree — a typo, a renamed metric, a key from a
// different tree — therefore recorded "a boundary invalidated metrics X and Y" while
// leaving X and Y displayed as valid. The record and the tree disagreed, and the
// record is what a reader believes.
//
// Guarded here rather than in discontinuity(), because only here is the TREE in
// scope: `discontinuity()` is a standalone constructor and cannot know the key set.
function discontinuityMatchCount(t, disc) {
  const known = new Set(treeLeafKeys(t));
  return disc.invalidatedMetricKeys.filter((k) => known.has(k)).length;
}

function applyDiscontinuity(t, disc) {
  const keys = disc.invalidatedMetricKeys;
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length)
    throw new Error(`discontinuity: duplicate invalidated metric key(s) ${JSON.stringify([...new Set(dupes)])} — a key set, not a list`);
  const known = new Set(treeLeafKeys(t));
  const unknown = keys.filter((k) => !known.has(k));
  if (unknown.length)
    throw new Error(`discontinuity: invalidated metric key(s) ${JSON.stringify(unknown)} match no leaf in this tree — a discontinuity that suppresses nothing is a false record`);

  const invalidated = new Set(keys);
  let matched = 0;
  const mapNode = (node) => {
    if (node.kind === "leaf")
      return invalidated.has(node.key)
        ? (matched++, Object.freeze({ kind: "leaf", key: node.key, state: "suppressed",
            reason: `${disc.type} discontinuity at ${JSON.stringify(disc.at)}` }))
        : node;
    if (node.kind === "vector")
      return vector([...node.itemIds], Object.fromEntries(node.itemIds.map((id) => [id, mapNode(node.items[id])])));
    if (node.kind === "record")
      return record(Object.fromEntries(Object.entries(node.fields).map(([n, f]) => [n, mapNode(f)])));
    if (node.kind === "policy-lens-grid") {
      const cells = {};
      for (const k of Object.keys(node.cells)) cells[k] = mapNode(node.cells[k]);
      return Object.freeze({ ...node, cells: Object.freeze(cells) });
    }
    return node;
  };
  const nodes = Object.fromEntries(Object.entries(t.nodes).map(([name, n]) => [name, mapNode(n)]));
  // Belt and braces: every key was proven present above, so zero matches here means
  // a leaf lives somewhere mapNode does not reach — a traversal gap, not a bad input.
  if (matched === 0)
    throw new Error("discontinuity: applied but suppressed no leaf — the tree traversal and treeLeafKeys() disagree");
  return tree(nodes, [...(t.discontinuities || []), disc]);
}

/* ---------- recursive validation (CLOSED-SHAPE) ----------
   Every node kind has an EXACT own-property set — extra properties are a lossy side
   channel (data riding the live tree, invisible to canonical form and every adapter)
   and are REJECTED. Leaf keys must be descriptor-backed. */
const NODE_SHAPES = Object.freeze({
  scalar: [["kind", "type", "value"]],
  record: [["kind", "fields"]],
  vector: [["kind", "itemIds", "items"]],
  "policy-lens-grid": [["kind", "policyPoints", "lenses", "cells"]],
  discontinuity: [["kind", "type", "at", "invalidatedMetricKeys", "note"]],
  leaf: [["kind", "key", "state", "value"], ["kind", "key", "state", "reason"]],
});
function assertNoSymbols(obj, path) {
  if (obj && typeof obj === "object" && Object.getOwnPropertySymbols(obj).length)
    throw new Error(`${path}: symbol-keyed properties — lossy side-channel REJECTED (R5)`);
}
/* Containers must be PLAIN and fully enumerable — a non-enumerable entry or
   prototype-carried datum is live-but-canonically-invisible, the same lossy class. */
function assertPlainContainer(obj, path) {
  assertNoSymbols(obj, path);
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null)
    throw new Error(`${path}: non-plain container prototype — lossy side-channel REJECTED (R6)`);
  if (Object.getOwnPropertyNames(obj).length !== Object.keys(obj).length)
    throw new Error(`${path}: non-enumerable container entr(y/ies) — lossy side-channel REJECTED (R6)`);
}
function assertShape(node, path) {
  const allowed = NODE_SHAPES[node.kind];
  // getOwnPropertyNames — a NON-ENUMERABLE extra property is the same lossy side channel
  // and is equally rejected; symbol keys likewise; nodes must be PLAIN (no
  // prototype-carried data) and every own property a DATA property (no accessors).
  assertNoSymbols(node, path);
  const nodeProto = Object.getPrototypeOf(node);
  if (nodeProto !== Object.prototype && nodeProto !== null)
    throw new Error(`${path}: non-plain node prototype — lossy side-channel REJECTED (R7)`);
  for (const k of Object.getOwnPropertyNames(node)) {
    const d = Object.getOwnPropertyDescriptor(node, k);
    if (d.get || d.set) throw new Error(`${path}.${k}: accessor node property REJECTED (R7)`);
  }
  const keys = Object.getOwnPropertyNames(node).sort();
  if (!allowed.some((shape) => JSON.stringify(keys) === JSON.stringify([...shape].sort())))
    throw new Error(`${path}: ${node.kind} node property set [${keys.join(",")}] is not the closed shape — lossy side-channel REJECTED`);
}
/* Descriptor-EXACT keys — an anchored full-match regex built from the registry
   (dimension values are JSON scalars). A rogue trailing segment or reordered dimension
   fails; canonical encoding is verified by parse-and-rederive byte equality. */
const JSON_SCALAR_RE = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false)`;
const reEscape = (s2) => s2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const KEY_RE_CACHE = new Map();
function descriptorKeyRe(mid) {
  if (!KEY_RE_CACHE.has(mid)) {
    const d = METRIC_DESCRIPTORS[mid];
    KEY_RE_CACHE.set(mid, new RegExp("^" + reEscape(mid) + "\\|" + reEscape(d.unit) + "\\|"
      + d.dimensions.map((dim) => reEscape(dim) + "=(" + JSON_SCALAR_RE + ")").join("\\|") + "$"));
  }
  return KEY_RE_CACHE.get(mid);
}
function assertDescriptorKey(key, path) {
  const mid = key.split("|", 1)[0];
  const d = METRIC_DESCRIPTORS[mid];
  if (!d) throw new Error(`${path}: leaf key '${key}' is not descriptor-backed (unregistered metric)`);
  const m = descriptorKeyRe(mid).exec(key);
  if (!m)
    throw new Error(`${path}: leaf key '${key}' is not descriptor-EXACT (unit/dimension order/rogue segment)`);
  // CANONICAL-encoding check by reconstruction — parse every captured dimension value and
  // re-derive the key through metricKey; noncanonical aliases like "x" for "x" fail.
  const scope = {};
  d.dimensions.forEach((dim, i) => { scope[dim] = JSON.parse(m[i + 1]); });
  if (metricKey(mid, scope) !== key)
    throw new Error(`${path}: leaf key '${key}' is not CANONICALLY encoded (alias encoding REJECTED)`);
}
function validateNode(node, path = "$") {
  if (!node || typeof node !== "object") throw new Error(`${path}: not a node`);
  if (node.kind in NODE_SHAPES) assertShape(node, path);
  switch (node.kind) {
    case "leaf": {
      if (typeof node.key !== "string" || !node.key) throw new Error(`${path}: leaf without a metric key`);
      assertDescriptorKey(node.key, path);
      if (node.state === "present") {
        const ok = (typeof node.value === "number" && Number.isFinite(node.value))
          || (node.value && typeof node.value === "object" && Number.isFinite(node.value.lo) && Number.isFinite(node.value.hi));
        if (!ok) throw new Error(`${path}: present leaf without a finite value/span`);
        // The constructors normalize -0, so a raw node carrying it is a forge.
        const nums = typeof node.value === "number" ? [node.value] : [node.value.lo, node.value.hi];
        if (nums.some((v) => Object.is(v, -0)))
          throw new Error(`${path}: signed-zero leaf value — canonical-collision forge REJECTED`);
        // Span objects are CLOSED — exactly a plain {lo,hi} of ENUMERABLE DATA properties.
        if (typeof node.value === "object") {
          assertNoSymbols(node.value, `${path}.value`);
          const vKeys = Object.getOwnPropertyNames(node.value).sort();
          if (JSON.stringify(vKeys) !== '["hi","lo"]' || Object.getPrototypeOf(node.value) !== Object.prototype
            || Object.keys(node.value).length !== 2
            || ["lo", "hi"].some((k) => { const d = Object.getOwnPropertyDescriptor(node.value, k); return d.get || d.set; }))
            throw new Error(`${path}: leaf span must be exactly a plain enumerable {lo,hi} — lossy side-channel REJECTED (R6/R7)`);
        }
        if ("reason" in node) throw new Error(`${path}: present leaf must not carry a reason`);
        return;
      }
      if (!TYPED_MISSING_STATES.includes(node.state)) throw new Error(`${path}: unknown leaf state '${node.state}'`);
      if ("value" in node) throw new Error(`${path}: ${node.state} leaf carries a value — zero-coercion channel REJECTED`);
      if (typeof node.reason !== "string" || !node.reason) throw new Error(`${path}: ${node.state} leaf without a reason`);
      return;
    }
    case "scalar": {
      const t = node.value === null ? "null" : typeof node.value;
      if (!["string", "number", "boolean", "null"].includes(t))
        throw new Error(`${path}: scalar type '${t}' outside the closed set (forged-node channel REJECTED)`);
      if (node.type !== t) throw new Error(`${path}: scalar type mismatch (${node.type} vs ${t})`);
      if (t === "number" && !Number.isFinite(node.value)) throw new Error(`${path}: non-finite scalar`);
      if (Object.is(node.value, -0)) throw new Error(`${path}: signed-zero scalar — canonical-collision forge REJECTED`);
      return;
    }
    case "record":
      assertPlainContainer(node.fields, `${path}.fields`);
      for (const [n, f] of Object.entries(node.fields)) validateNode(f, `${path}.${n}`);
      return;
    case "vector": {
      if (!Array.isArray(node.itemIds) || !node.itemIds.every((id) => typeof id === "string"))
        throw new Error(`${path}: vector itemIds must be an ARRAY of strings (string-valued itemIds forge REJECTED)`);
      if (new Set(node.itemIds).size !== node.itemIds.length) throw new Error(`${path}: duplicate vector IDs`);
      assertPlainContainer(node.items, `${path}.items`);
      const undeclared = Object.keys(node.items || {}).filter((id) => !node.itemIds.includes(id));
      if (undeclared.length)
        throw new Error(`${path}: vector carries UNDECLARED item(s) ${undeclared.join(",")} — lossy forged-node channel REJECTED`);
      for (const id of node.itemIds) validateNode(node.items[id], `${path}[${id}]`);
      return;
    }
    case "policy-lens-grid": {
      const expected = [];
      for (const pp of node.policyPoints) for (const l of node.lenses) expected.push(`${pp}|${l}`);
      assertPlainContainer(node.cells, `${path}.cells`);
      if (!Array.isArray(node.policyPoints) || !node.policyPoints.every((pp) => typeof pp === "number" && Number.isFinite(pp)))
        throw new Error(`${path}: grid policyPoints must be finite numbers (R7)`);
      if (!Array.isArray(node.lenses) || !node.lenses.every((l) => typeof l === "string"))
        throw new Error(`${path}: grid lenses must be strings (R7)`);
      if (node.policyPoints.some((pp) => Object.is(pp, -0)))
        throw new Error(`${path}: signed-zero grid policy point — canonical-collision forge REJECTED`);
      const cellKeys = Object.keys(node.cells).sort();
      if (JSON.stringify(cellKeys) !== JSON.stringify([...expected].sort()))
        throw new Error(`${path}: grid cells must be EXACTLY policyPoints × lenses (missing or extra cells REJECTED)`);
      for (const [c, n] of Object.entries(node.cells)) validateNode(n, `${path}{${c}}`);
      return;
    }
    case "discontinuity":
      if (!DISCONTINUITY_TYPES.includes(node.type)) throw new Error(`${path}: unknown discontinuity type`);
      if (!Array.isArray(node.invalidatedMetricKeys) || !node.invalidatedMetricKeys.every((k) => typeof k === "string"))
        throw new Error(`${path}: discontinuity invalidatedMetricKeys must be a string array`);
      assertPlainData(node.at, `${path}.at`, { rejectMinusZero: true, requireFinite: true, rejectUndefined: true }); // raw nodes get the same door
      if (node.note != null && typeof node.note !== "string") throw new Error(`${path}: note must be a string or null`);
      return;
    default:
      throw new Error(`${path}: unknown node kind '${String(node.kind)}'`);
  }
}

function leafMetricKeys(node, acc = []) {
  if (node.kind === "leaf") acc.push(node.key);
  else if (node.kind === "vector") for (const id of node.itemIds) leafMetricKeys(node.items[id], acc);
  else if (node.kind === "record") for (const f of Object.values(node.fields)) leafMetricKeys(f, acc);
  else if (node.kind === "policy-lens-grid") for (const n of Object.values(node.cells)) leafMetricKeys(n, acc);
  return acc;
}

/* The stored tree is a SNAPSHOT (harness R8 NEW-19) — after validation, every node is
   rebuilt as a frozen plain object with each property read exactly once. A TOCTOU getter
   (validated value, different stored value) is impossible by construction. */
function copyNode(node) {
  switch (node.kind) {
    case "leaf":
      return node.state === "present"
        ? Object.freeze({ kind: "leaf", key: node.key, state: "present",
            value: typeof node.value === "number" ? node.value
              : Object.freeze({ lo: node.value.lo, hi: node.value.hi }) })
        : Object.freeze({ kind: "leaf", key: node.key, state: node.state, reason: node.reason });
    case "scalar":
      return Object.freeze({ kind: "scalar", type: node.type, value: node.value });
    case "record":
      return Object.freeze({ kind: "record",
        fields: Object.freeze(Object.fromEntries(Object.keys(node.fields).map((k) => [k, copyNode(node.fields[k])]))) });
    case "vector":
      return Object.freeze({ kind: "vector", itemIds: Object.freeze([...node.itemIds]),
        items: Object.freeze(Object.fromEntries(node.itemIds.map((id) => [id, copyNode(node.items[id])]))) });
    case "policy-lens-grid":
      return Object.freeze({ kind: "policy-lens-grid",
        policyPoints: Object.freeze([...node.policyPoints]), lenses: Object.freeze([...node.lenses]),
        cells: Object.freeze(Object.fromEntries(Object.keys(node.cells).map((c) => [c, copyNode(node.cells[c])]))) });
    case "discontinuity":
      return Object.freeze({ kind: "discontinuity", type: node.type,
        at: toPlainData(node.at, "snapshot.at", { rejectMinusZero: true, requireFinite: true, rejectUndefined: true }),
        invalidatedMetricKeys: Object.freeze([...node.invalidatedMetricKeys]), note: node.note ?? null });
    default:
      throw new Error(`copyNode: unknown kind '${node.kind}'`);
  }
}
function tree(nodes, discontinuities) {
  assertPlainContainer(nodes, "$.nodes"); // the root container gets the same door
  const all = [];
  const snapNodes = {};
  for (const [name, n] of Object.entries(nodes)) {
    validateNode(n, `$.${name}`);
    const snap = copyNode(n);            // snapshot AFTER validation, reads once
    validateNode(snap, `$.${name}#snap`); // and the snapshot must itself validate —
    leafMetricKeys(snap, all);            // a TOCTOU getter that changed its answer dies here
    snapNodes[name] = snap;
  }
  const dup = all.filter((k, i) => all.indexOf(k) !== i);
  if (dup.length) throw new Error(`tree: duplicate leaf metric identities: ${[...new Set(dup)].join(" ; ")}`);
  const snapDiscs = [];
  for (const [i, disc] of (discontinuities || []).entries()) {
    validateNode(disc, `$.discontinuities[${i}]`);
    const snap = copyNode(disc);
    validateNode(snap, `$.discontinuities[${i}]#snap`);
    snapDiscs.push(snap);
  }
  return Object.freeze({ nodes: Object.freeze(snapNodes), discontinuities: Object.freeze(snapDiscs) });
}

/* ---------- semantic identity (the contract pass bar) ----------
   Top-level node NAMES are dropped (presentation labels): the canonical node set is a
   SORTED multiset of canonical node forms. Record field names, vector item IDs, grid
   coordinates, and metric keys remain semantic. */
function canonicalize(node) {
  if (node.kind === "leaf")
    return node.state === "present"
      ? { k: "leaf", key: node.key, state: "present", value: node.value }
      : { k: "leaf", key: node.key, state: node.state, reason: node.reason };
  if (node.kind === "scalar") return { k: "scalar", type: node.type, value: node.value };
  if (node.kind === "record")
    return { k: "record", fields: Object.fromEntries(Object.keys(node.fields).sort().map((n) => [n, canonicalize(node.fields[n])])) };
  if (node.kind === "vector")
    return { k: "vector", itemIds: [...node.itemIds].sort(),
      items: Object.fromEntries([...node.itemIds].sort().map((id) => [id, canonicalize(node.items[id])])) };
  if (node.kind === "policy-lens-grid")
    return { k: "grid", policyPoints: [...node.policyPoints], lenses: [...node.lenses].sort(),
      cells: Object.fromEntries(Object.keys(node.cells).sort().map((c) => [c, canonicalize(node.cells[c])])) };
  if (node.kind === "discontinuity")
    return { k: "disc", type: node.type, at: node.at,
      invalidatedMetricKeys: [...node.invalidatedMetricKeys].sort(), note: node.note };
  throw new Error(`canonicalize: unknown node kind '${node.kind}'`);
}

function canonicalTree(t) {
  const forms = Object.values(t.nodes).map(canonicalize).map((c) => JSON.stringify(c)).sort();
  return {
    nodes: forms.map((s) => JSON.parse(s)), // sorted multiset — top-level names carry no identity
    discontinuities: t.discontinuities.map(canonicalize),
  };
}

function treesSemanticallyEqual(a, b) {
  return JSON.stringify(canonicalTree(a)) === JSON.stringify(canonicalTree(b));
}

function treeLeafKeys(t) {
  const acc = [];
  for (const n of Object.values(t.nodes)) leafMetricKeys(n, acc);
  return acc.sort();
}

/* ================================================================================
   TYPED CLAIM-LEVEL PROVENANCE (memo §0-quinquies P0-A; harness claim-identity.mjs)
   ================================================================================ */

const CLAIM_ROLES = Object.freeze(["result", "comparison"]);
const IDENTITIES = Object.freeze(["central-verified", "policy-scenario"]);

/* The capability brand. Module-private: nothing outside this module can add to it,
   so an object literal that SAYS identity:"central-verified" still fails isCentral. */
const CENTRAL_BRAND = new WeakSet();

function checkLegs(legs) {
  const positive = (legs || []).filter((l) => l.weight > 0);
  if (!positive.length) return "no positive-weight legs";
  for (const l of positive) {
    if (l.renderableUnderPolicy !== true) return `leg '${l.id}' not renderableUnderPolicy`;
    if (l.placementVerified !== true) return `leg '${l.id}' not placementVerified`;
  }
  return null;
}

function checkClusters(clusters) {
  const verified = (clusters || []).filter((c) => c.verified === true);
  const ids = new Set(verified.map((c) => c.clusterId));
  if (ids.size < 2) return `${ids.size} independent verified cluster(s) < 2 (predeclared bar)`;
  return null;
}

function checkTaint(derivation) {
  if (!derivation || derivation.policyTainted !== false)
    return "derivation does not affirmatively declare zero policy taint";
  return null;
}

/* Selection cleanliness is a CLOSED discriminator, never prose scanning — every basis
   outside the clean enum is rejected structurally. */
/* THE CLAIMS CONTRACT IS VERSIONED (Polaris ruling 2026-09-19 on Astra pack A P1-4). v2 is the
   first version in which a central claim carries the evidence it was admitted on and in which
   that evidence is part of the content address. A consumer that compares claim ids across
   versions is comparing two different functions, and the version says so on the claim itself
   rather than being inferred from whether a field happens to be present. */
const CLAIM_CONTRACT_VERSION = 2;
const CLEAN_SELECTION_BASES = Object.freeze(["preset-default", "registry-central"]);
function checkSelection(selectionReceipt) {
  if (!selectionReceipt || selectionReceipt.clean !== true)
    return "no clean central-selection receipt";
  if (!CLEAN_SELECTION_BASES.includes(selectionReceipt.basis))
    return `selection basis '${String(selectionReceipt.basis)}' is not in the clean enum (${CLEAN_SELECTION_BASES.join("/")})`;
  return null;
}

/* The ONE private constructor. Not exported — mintClaim below is the only door. */
function constructCentral(spec, evidence) {
  const failures = [
    spec.role !== "comparison" ? `role '${spec.role}' may not claim central (result-role prohibition)` : null,
    checkLegs(spec.legs),
    checkClusters(spec.clusters),
    checkTaint(spec.derivation),
    checkSelection(spec.selectionReceipt),
  ].filter(Boolean);
  if (failures.length) return { central: null, refusals: failures };
  /* THE ADMISSION EVIDENCE TRAVELS WITH THE CLAIM (Polaris ruling 2026-09-19 on Astra pack A
     P1-4). Every field above is CHECKED here and then thrown away: the minted claim carried
     neither the selection receipt, nor the legs, nor the clusters, nor the derivation, so a
     reader of the artifact could see that a claim was branded central-verified but never on
     what. Worse, claimIdOf hashed only subject/estimand/role/identity/evidenceBasis/tree, so two
     claims admitted on materially different provenance — a different selection basis, different
     hardware legs, different clusters — collided on ONE content address and emitted identical
     JSON. A content address that cannot tell two different claims apart is not an identity.
     The bundle is a canonical deep copy through the same door the evidence basis uses, so
     nothing aliases the caller's objects, and it is part of the address (see claimIdOf). */
  const admission = toPlainData({
    selectionReceipt: spec.selectionReceipt ?? null,
    legs: spec.legs ?? null,
    clusters: spec.clusters ?? null,
    derivation: spec.derivation ?? null,
  }, "admissionEvidence");
  const claim = Object.freeze({
    subject: spec.subject, estimand: spec.estimand,
    evidenceBasis: evidence,
    admissionEvidence: admission,
    contractVersion: CLAIM_CONTRACT_VERSION,
    role: spec.role, identity: "central-verified",
    tree: spec.tree,
  });
  CENTRAL_BRAND.add(claim);
  return { central: claim, refusals: [] };
}

/* Public door: mints a claim; identity is decided HERE and only here. The evidence basis
   is RESTRICTED to plain JSON-shaped data at the mint door via the SHARED door and stored
   as the canonical deep COPY — loss/aliasing is impossible downstream by construction. */
function mintClaim(spec) {
  for (const f of ["subject", "estimand", "evidenceBasis", "role", "tree"])
    if (!spec[f]) throw new Error(`mintClaim: '${f}' is required — identity attaches to the full claim`);
  const evidence = toPlainData(spec.evidenceBasis, "evidenceBasis");
  if (!CLAIM_ROLES.includes(spec.role)) throw new Error(`mintClaim: unknown role '${spec.role}'`);
  if (spec.requestCentral) {
    const { central, refusals } = constructCentral(spec, evidence);
    if (central) return central;
    return Object.freeze({
      subject: spec.subject, estimand: spec.estimand,
      evidenceBasis: evidence,
      role: spec.role, identity: "policy-scenario",
      centralRefusals: Object.freeze(refusals),
      tree: spec.tree,
    });
  }
  return Object.freeze({
    subject: spec.subject, estimand: spec.estimand,
    evidenceBasis: evidence,
    role: spec.role, identity: "policy-scenario",
    tree: spec.tree,
  });
}

/* The ONLY trustworthy central check — brand membership, never the string. */
function isCentral(claim) {
  return CENTRAL_BRAND.has(claim);
}

/* Monotone fail-closed aggregation: any non-central positive-weight input poisons the
   aggregate; the aggregate can NEVER out-rank its inputs. */
function aggregateClaims(claims, spec) {
  if (!Array.isArray(claims) || !claims.length) throw new Error("aggregateClaims: no inputs");
  const poisoned = claims.filter((c) => !isCentral(c));
  return mintClaim({
    ...spec,
    requestCentral: poisoned.length === 0 && spec.requestCentral === true,
  });
}

/* Numeric coincidence probe: confirms the two trees are semantically equal — identities
   are asserted SEPARATELY (equal values must carry zero identity force). */
function treesCoincide(a, b) {
  return treesSemanticallyEqual(a.tree, b.tree);
}

/* The honest empty-comparison slot (owner Q1 default). */
function emptyComparisonSlot(subject) {
  return Object.freeze({
    subject, role: "comparison", identity: "policy-scenario",
    empty: true,
    statement: "no verified central comparator exists for this subject (no placement-verified public serving map)",
  });
}

/* ================================================================================
   CLOSED REGISTERED EMISSION BOUNDARY (memo §0-quinquies P0-A; harness
   emission-boundary.mjs). Presentation travels in an EMISSION ENVELOPE around the
   UNCHANGED branded claim; the weld is ENFORCED AT THE BOUNDARY for weld-required
   classes; sidecar claim IDs are CONTENT-ADDRESSED; pointers are RFC 6901 and RESOLVE
   into the actual emitted artifact.
   ================================================================================ */

/* R3 (design memo D-9): ONE deliberate closed-set amendment — the `final-answer`
   emitter class (the owner's Row-1 result surface). A new class rather than a
   hero-tile alias: the two surfaces move independently, so their pins must never
   alias. It is WELD-REQUIRED (the shareable unit carries its identity inside the
   value tokens — the screenshot-crop bar). The contract harness carries one real
   instance per class, this one included (§0-quinquies rule, mechanical). */
/* b9 M6 (FA memo §5.4, D-6m/D-6u): the SECOND deliberate closed-set amendment —
   `executive-summary`, the analyst-gap bridge block. A new class rather than a
   `final-answer` alias for the same reason `final-answer` was not a `hero-tile`
   alias: the two surfaces move independently, so their pins must never alias. It is
   WELD-REQUIRED — its four numeric rows are margins on the default fleet, each
   carrying the fleet-renderability clause derived from that row's OWN state. It is
   registered exactly where `final-answer` is registered (the contract harness, and
   nowhere else — D-6u-bis); there is NO production `executive-summary` emission. */
const EMITTER_CLASSES = Object.freeze([
  "hero-tile", "hardware-lens-tile", "identity-strip", "evidence-board",
  "share-string", "mcp-json", "mcp-text", "report-dossier", "final-answer",
  "executive-summary",
]);
const WELD_REQUIRED_CLASSES = Object.freeze(["hero-tile", "mcp-text", "final-answer", "executive-summary"]);

/* ---------- the closed registry ---------- */
const REGISTERED = new Map(); // id -> { emitterClass, adapter }
const ATTEMPTED = new Set();  // every emission ATTEMPT, registered or not
const EMITTED = new Set();    // successful emissions

function registerEmitter(id, emitterClass, adapter) {
  if (!EMITTER_CLASSES.includes(emitterClass)) throw new Error(`unknown emitter class '${emitterClass}'`);
  if (REGISTERED.has(id)) throw new Error(`emitter '${id}' already registered`);
  REGISTERED.set(id, { emitterClass, adapter });
}

/* Envelope: { claim, visibleText?, leadSentence?, weld?, display?, envelopeFields? } */
function emit(id, envelope, sidecarStore) {
  ATTEMPTED.add(id); // recorded BEFORE the registry gate
  const reg = REGISTERED.get(id);
  if (!reg) throw new Error(`emit('${id}'): UNREGISTERED emitter — the boundary is closed`);
  const { claim } = envelope;
  if (!claim || !claim.tree || !claim.identity) throw new Error(`emit('${id}'): envelope carries no minted claim`);
  // A claim whose identity STRING asserts central-verified without the brand is a
  // forgery — refused at the boundary, never silently downgraded.
  if (claim.identity === "central-verified" && !isCentral(claim))
    throw new Error(`emit('${id}'): claim carries a FORGED central-verified label without the capability brand — REJECTED`);
  if (WELD_REQUIRED_CLASSES.includes(reg.emitterClass)) {
    const inline = reg.emitterClass === "mcp-text" ? envelope.leadSentence : envelope.visibleText;
    if (typeof envelope.weld !== "string" || !envelope.weld.startsWith("[weld "))
      throw new Error(`emit('${id}'): class '${reg.emitterClass}' requires the shared weld token in the envelope`);
    // Weld TRUTH is enforced, not caller convention — the token must be DERIVED from
    // this envelope's own fields by the one shared formatter, so a fabricated weld or a
    // weld contradicting the envelope cannot be emitted.
    if (envelope.weld !== weldClause(envelope.envelopeFields))
      throw new Error(`emit('${id}'): weld token does not derive from the envelope's fields via the shared formatter (fabricated/contradictory weld REJECTED)`);
    if (typeof inline !== "string" || !inline.includes(envelope.weld))
      throw new Error(`emit('${id}'): class '${reg.emitterClass}' requires the weld INLINE in the ${reg.emitterClass === "mcp-text" ? "lead sentence" : "visible text"} — a sibling receipt/tooltip does not satisfy the weld`);
  }
  EMITTED.add(id);
  const artifact = reg.adapter.render(envelope);
  if (sidecarStore) sidecarStore.record(id, envelope, artifact);
  return artifact;
}

function coverageReport() {
  const registered = [...REGISTERED.keys()].sort();
  const emitted = [...EMITTED].sort();
  return Object.freeze({
    registered, emitted,
    attempted: [...ATTEMPTED].sort(),
    complete: JSON.stringify(registered) === JSON.stringify(emitted),
    missing: registered.filter((id) => !EMITTED.has(id)),
    unregisteredAttempts: [...ATTEMPTED].filter((id) => !REGISTERED.has(id)).sort(),
  });
}

function registeredClasses() {
  return [...new Set([...REGISTERED.values()].map((r) => r.emitterClass))].sort();
}

function resetBoundaryForTest() { REGISTERED.clear(); ATTEMPTED.clear(); EMITTED.clear(); }

/* ---------- ONE shared weld formatter (v4.1(i)) ---------- */
function weldClause(fleetRenderable) {
  if (!fleetRenderable) return "";
  const { renderableLegs, totalLegs, renderableWeightShare } = fleetRenderable;
  return `[weld ${renderableLegs}/${totalLegs} legs renderable, ${Math.round(renderableWeightShare * 100)}% of blend weight; non-monotonic in scale]`;
}

/* ---------- unrounded canonical values (Risk-Analyst) ---------- */
function displayValue(canonical, decimals = 1) {
  const displayed = Number(canonical.toFixed(decimals));
  return Object.freeze({
    displayed, canonical,
    precisionNote: displayed === canonical ? null
      : `changes within displayed precision possible (canonical ${canonical})`,
  });
}

/* ---------- content-addressed claim IDs + RFC 6901 pointers ----------
   The content address covers the FULL provenance identity — subject, estimand, role,
   TRUSTED identity (brand membership, never the forgeable string), stably-serialized
   evidence basis, and the canonical tree. */
function stableStringify(v) {
  // Index-explicit iteration — Array.map skips holes, so a sparse Array(1) would collide
  // with []; holes get their own token.
  if (Array.isArray(v)) return "[" + Array.from({ length: v.length },
    (_, i) => (i in v ? stableStringify(v[i]) : "#hole")).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") + "}";
  // JSON.stringify collapses NaN/±Infinity to null and -0 to 0 — encode them injectively
  // so distinct evidence bases never share an address.
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "#NaN";
    if (v === Infinity) return "#+Inf";
    if (v === -Infinity) return "#-Inf";
    if (Object.is(v, -0)) return "#-0";
  }
  if (v === undefined) return "#undef";
  return JSON.stringify(v);
}
function claimIdOf(claim) {
  /* Receipt-inclusive since contract v2: two claims that differ only in the provenance they
     were admitted on are DIFFERENT claims and must not share an address. The version is in the
     preimage too, so a v1 and a v2 id are never accidentally equal. */
  return sha256Hex(JSON.stringify([claim.subject, claim.estimand, claim.role,
    isCentral(claim) ? "central-verified" : "policy-scenario",
    stableStringify(claim.evidenceBasis ?? null), canonicalTree(claim.tree),
    claim.contractVersion ?? 1,
    stableStringify(claim.admissionEvidence ?? null)])).slice(0, 24);
}
function escapePointerSegment(seg) {
  return String(seg).replace(/~/g, "~0").replace(/\//g, "~1");
}
function resolvePointer(doc, pointer) {
  if (pointer === "") return doc;
  return pointer.split("/").slice(1).reduce((acc, seg) => {
    if (acc === undefined || acc === null) return undefined;
    const key = seg.replace(/~1/g, "/").replace(/~0/g, "~");
    return Array.isArray(acc) ? acc[Number(key)] : acc[key];
  }, doc);
}

/* ---------- adapters ----------
   Every artifact carries a `claims` container so sidecar pointers RESOLVE into the
   emitted artifact itself. Payloads embed identity label, canonical tree, and the
   presentation projection (weld + display + envelope fields) so their transport
   survival is testable post-recovery. */

function payloadOf(envelope) {
  const { claim } = envelope;
  return {
    claimId: claimIdOf(claim),
    contractVersion: claim.contractVersion ?? 1,
    identity: isCentral(claim) ? "central-verified" : "policy-scenario",
    role: claim.role, subject: claim.subject, estimand: claim.estimand,
    evidenceBasis: claim.evidenceBasis ?? null,
    /* The evidence a central claim was admitted on, emitted so the artifact can be audited
       without the minting session. Absent on a policy scenario, which was not admitted. */
    admissionEvidence: claim.admissionEvidence ?? null,
    tree: canonicalTree(claim.tree),
    presentation: {
      visibleText: envelope.visibleText ?? null,
      leadSentence: envelope.leadSentence ?? null,
      weld: envelope.weld ?? null,
      display: envelope.display ?? null,           // { displayed, canonical, precisionNote }
      envelopeFields: envelope.envelopeFields ?? null, // e.g. fleetRenderable {legs, total, share}
    },
  };
}

function recoverPayload(p) {
  return {
    claimId: p.claimId, identityLabel: p.identity, role: p.role,
    subject: p.subject, estimand: p.estimand,
    tree: { nodes: p.tree.nodes, discontinuities: p.tree.discontinuities || [] },
    presentation: p.presentation,
  };
}

const jsonAdapter = Object.freeze({
  render(envelope) { return JSON.stringify({ claims: [payloadOf(envelope)] }); },
  recover(artifact) {
    const doc = JSON.parse(artifact);
    return recoverPayload(doc.claims[0]);
  },
});

const mcpTextAdapter = Object.freeze({
  render(envelope) {
    return `${envelope.leadSentence || ""}\n---MACHINE---\n${JSON.stringify({ claims: [payloadOf(envelope)] })}`;
  },
  recover(artifact) {
    const [lead, machine] = artifact.split("\n---MACHINE---\n");
    const doc = JSON.parse(machine);
    return { ...recoverPayload(doc.claims[0]), leadSentence: lead };
  },
});

const domAdapter = Object.freeze({
  render(envelope) {
    const payload = JSON.stringify({ claims: [payloadOf(envelope)] })
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return `<div class="im-claim" data-claim="${payload}">${envelope.visibleText || ""}</div>`;
  },
  recover(artifact) {
    const m = artifact.match(/data-claim="([^"]*)"/);
    if (!m) return { identityLabel: null, tree: null, mutated: true };
    const doc = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&amp;/g, "&"));
    return { ...recoverPayload(doc.claims[0]),
      visibleText: (artifact.match(/>([^<]*)<\/div>$/) || [])[1] ?? null };
  },
});

/* Machine-doc extraction per artifact form (for pointer resolution). */
function machineDocOf(artifact) {
  if (artifact.startsWith("<div")) {
    const m = artifact.match(/data-claim="([^"]*)"/);
    return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&amp;/g, "&")) : null;
  }
  if (artifact.includes("\n---MACHINE---\n")) return JSON.parse(artifact.split("\n---MACHINE---\n")[1]);
  return JSON.parse(artifact);
}

/* ---------- one-to-one JSON-pointer provenance sidecar (v4.1(iii)) ---------- */
function makeSidecarStore() {
  const entries = new Map(); // claimId -> entry
  return Object.freeze({
    record(emitterId, envelope, artifact) {
      const { claim } = envelope;
      const claimId = claimIdOf(claim);
      const doc = machineDocOf(artifact);
      const idx = (doc.claims || []).findIndex((c) => c.claimId === claimId);
      if (idx < 0) throw new Error(`sidecar: claim '${claimId}' not found in the emitted artifact`);
      const entry = Object.freeze({
        claimId, emitterId,
        pointer: `/claims/${escapePointerSegment(idx)}`,
        identity: isCentral(claim) ? "central-verified" : "policy-scenario",
        metricKeys: Object.freeze(treeLeafKeys(claim.tree)), // recursive LEAF keys
      });
      const prior = entries.get(claimId);
      if (prior && JSON.stringify({ ...prior, emitterId: null }) !== JSON.stringify({ ...entry, emitterId: null }))
        throw new Error(`sidecar: conflicting duplicate for claim '${claimId}'`);
      if (!prior) entries.set(claimId, entry);
    },
    entries() { return [...entries.values()]; },
  });
}

/* Recovered trees are ALREADY canonical; a live tree canonicalizes for comparison. */
function recoveredEqualsLive(recoveredTree, liveTree) {
  const liveCanon = canonicalTree(liveTree);
  return JSON.stringify({ nodes: recoveredTree.nodes, discontinuities: recoveredTree.discontinuities || [] })
    === JSON.stringify({ nodes: liveCanon.nodes, discontinuities: liveCanon.discontinuities });
}

/* Post-render DOM-mutation audit (Risk-Analyst). */
function domMutationAudit(artifact, expectedClaim) {
  const rec = domAdapter.recover(artifact);
  if (!rec.tree) return Object.freeze({ clean: false, drift: "machine payload missing (mutated)" });
  const expectedIdentity = isCentral(expectedClaim) ? "central-verified" : "policy-scenario";
  if (rec.identityLabel !== expectedIdentity)
    return Object.freeze({ clean: false, drift: `identity drift: ${rec.identityLabel} != ${expectedIdentity}` });
  if (!recoveredEqualsLive(rec.tree, expectedClaim.tree))
    return Object.freeze({ clean: false, drift: "metric-tree drift" });
  return Object.freeze({ clean: true, drift: null });
}

/* ---------- namespace export ---------- */
return Object.freeze({
  sha256Hex, sha256HexJs,
  METRIC_DESCRIPTORS, TYPED_MISSING_STATES, POLICY_POINTS,
  metricKey, leaf, stateLeaf, scalar, record, vector, policyLensGrid, sampledSummary,
  toPlainData, assertPlainData,
  DISCONTINUITY_TYPES, discontinuity, applyDiscontinuity, discontinuityMatchCount,
  validateNode, leafMetricKeys, tree,
  canonicalize, canonicalTree, treesSemanticallyEqual, treeLeafKeys,
  CLAIM_ROLES, IDENTITIES, CLEAN_SELECTION_BASES,
  mintClaim, isCentral, aggregateClaims, treesCoincide, emptyComparisonSlot,
  EMITTER_CLASSES, WELD_REQUIRED_CLASSES,
  registerEmitter, emit, coverageReport, registeredClasses, resetBoundaryForTest,
  weldClause, displayValue,
  claimIdOf, escapePointerSegment, resolvePointer,
  jsonAdapter, mcpTextAdapter, domAdapter, machineDocOf,
  makeSidecarStore, recoveredEqualsLive, domMutationAudit,
});

})();

if (typeof module !== "undefined" && module.exports) module.exports = IM_CONTRACTS;
