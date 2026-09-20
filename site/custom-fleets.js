/* =====================================================================================
   custom-fleets.js — b9 M4 custom fleet builder: schema, validation, store, pure state
   (memo research/b9-m45-ui-memo.md v2.1 — design gate closed at 28d4b25; plan §5 M4, D-4)

   Script order: data → roofline → engine → custom-fleets → app (the IM3 slice-4
   reverse-dependency rule). engine.js loads BEFORE this file, so it never references
   these symbols at parse time — it consults the store through the registration hook
   `registerCustomFleetSource()` it defines (call-time binding only). NO DOM in this
   file: app.js owns the modal wiring; everything here is node-importable so the test
   suite exercises schema/validation/state with no browser.

   Identity rules (memo §1): custom-fleet ids carry the reserved prefix "cf:"; ids
   arriving from URLs or storage resolve by OWN-PROPERTY lookup only — never through
   Object.prototype (codec-v5 precedent). Definitions live HERE, never inside the
   scenario state S (the M3 side-registry/state-purity rule: applyPresetSettings copies
   keys into scenario state, and a fleet definition inside S would leak through preset
   application).
   ===================================================================================== */
"use strict";

/* ---------- schema constants (memo §2.2, §6.2 — the ONE closed shape) ---------- */
const CF_PREFIX = "cf:";
const CF_ID_RE = /^cf:[a-z0-9]{4,16}$/;
const CF_MAX_LEGS = 12;
const CF_MAX_SECTIONS = 6;
const CF_NAME_MAX = 60;
/* Closed key sets at every level (memo §6.2: an unknown key at ANY level rejects the
   whole object — builder, store loader, and codec all consume THIS table). */
const CF_FLEET_KEYS = Object.freeze(["id", "name", "epoch", "clonedFrom", "sections", "wireVersion", "wireLegacyBases"]);
const CF_LEGACY_FLEET_KEYS = Object.freeze(["id", "name", "epoch", "clonedFrom", "legs", "wireVersion", "wireLegacyBases"]);
const CF_SECTION_KEYS = Object.freeze(["id", "label", "sharePct", "basis", "rent", "electricity", "pue", "tco", "dcRef", "provenance", "fallbackReceipts", "shareRounding", "legs"]);
const CF_LEG_KEYS = Object.freeze(["donorKey", "label", "sharePct", "overrides", "family"]);
const CF_LEGACY_LEG_KEYS = Object.freeze([...CF_LEG_KEYS, "basisDeclared"]);
/* T5 rec 4 (GPT Pro 2026-07-29 §6, "Make HBM capacity a typed quantity … do not use an
   unqualified `hbmGB` scalar"). The override is now stored in BYTES, the same normative unit
   `engine-data-v22.js` carries per row. `hbmGB` survives ONLY as a read-side alias so every
   saved fleet and every already-shared v6/v7 link keeps its exact previous meaning; the
   validator converts it at ×1e9 — the convention those links were minted under — and emits
   `hbmBytes`. Nothing writes `hbmGB` again. A fleet carrying BOTH keys is rejected whole
   rather than silently preferring one (§6.2 fail-closed). */
const CF_OVERRIDE_KEYS = Object.freeze(["rentPerHr", "capexUsd", "capexScope", "boardPowerW", "kwhPerKwh", "hbmBytes"]);
const CF_OVERRIDE_LEGACY_KEYS = Object.freeze(["hbmGB"]);
const CF_HBM_LEGACY_BYTES_PER_GB = 1e9;
/* Units a reader may DECLARE a capacity in. The stored quantity is always bytes; the unit is a
   property of the entry, never of the stored value, which is the whole point of the rec. */
const CF_HBM_UNITS = Object.freeze({ GB: 1e9, GiB: 1073741824 });
const CF_RENT_MODES = Object.freeze(["flat", "registered", "byHw"]);
const CF_RENT_KEYS = Object.freeze({
  flat: Object.freeze(["mode", "usdPerHr"]),
  registered: Object.freeze(["mode", "mult"]),
  byHw: Object.freeze(["mode", "usdPerHrByHw"]),
});
const CF_ELECTRICITY_KEYS = Object.freeze(["usdPerKwh", "source", "regionRef"]);
const CF_TCO_KEYS = Object.freeze(["capexUsdByHw", "capexScope", "lifeYears", "dcPerW", "clusterOh", "opexPct"]);
const CF_TRIPLE_KEYS = Object.freeze(["lo", "mid", "hi"]);
const CF_FALLBACK_RECEIPT_KEYS = Object.freeze(["field", "value", "source", "reason"]);
const CF_SHARE_ROUNDING_KEYS = Object.freeze(["basis", "changes", "residualKeys"]);
const CF_SHARE_ROUNDING_CHANGE_KEYS = Object.freeze(["scope", "key", "declared", "rounded"]);
/* Typed bounds (memo §2.2). kwhPerKwh deliberately wider than the scenario slider's
   0.03–0.15 — the per-datacenter case spans constrained grids (memo D-11, disclosed in
   the tip copy). */
const CF_BOUNDS = Object.freeze({
  rentPerHr: Object.freeze([0.05, 50]),
  capexUsd: Object.freeze([1000, 200000]),
  boardPowerW: Object.freeze([50, 3000]),
  kwhPerKwh: Object.freeze([0.02, 0.30]),
  /* T5 rec 4: the bound is now stated in the SAME unit the core checks in, so the validator and
     `engine-roofline-v22.js`'s plausibility window are comparable instead of the GB bound
     approximating it. The CEILING is that window's verbatim 1e12 B (unchanged: the old 1000 GB
     was already this number). The FLOOR deliberately stays at the memo's 16 GB, expressed as
     1.6e10 B — the same value it has always been — which keeps the validator strictly inside the
     core's [1e10, 1e12] window rather than widening what a reader may declare. No bound moves. */
  hbmBytes: Object.freeze([1.6e10, 1e12]),
  sharePct: Object.freeze([0, 100]),
});

/* ---------- T5 rec 4: the legacy HBM fold (one place, pure, fail-closed) ----------
   Every ingest path — store load, v6/v7 codec decode, builder working copy — reaches the
   override bag through validateCustomFleet, so this is the single point where a pre-T5
   `hbmGB` scalar becomes the typed byte quantity it always meant. Returns a NEW object; the
   caller's input is never mutated. Returns null when the fold is refused, which is the one
   ambiguous case: a bag carrying BOTH keys has two capacities and no rule for picking, so it
   is rejected whole rather than resolved by key order.

   The ×1e9 conversion is the convention the old links were minted under, quoted from the
   retired field's own UI label ("binds feasibility at 1e9 B/GB"). It is deliberately NOT the
   registry's own GiB-based reading: re-reading an existing share link at 2^30 would silently
   change the capacity somebody already shared, which is the same class of harm as the defect. */
function foldLegacyHbm(overrides, at, err) {
  const hasLegacy = Object.prototype.hasOwnProperty.call(overrides, "hbmGB") && overrides.hbmGB != null;
  const hasTyped = Object.prototype.hasOwnProperty.call(overrides, "hbmBytes") && overrides.hbmBytes != null;
  if (hasLegacy && hasTyped) {
    err(at + ": carries both the deprecated 'hbmGB' and 'hbmBytes' — one capacity per leg; drop 'hbmGB'");
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(overrides, "hbmGB")) return { ...overrides };
  const { hbmGB, ...rest } = overrides;
  if (hbmGB == null) return rest; /* an explicit null legacy key carries no capacity at all */
  const scale = v => (typeof v === "number" && isFinite(v) ? v * CF_HBM_LEGACY_BYTES_PER_GB : v);
  rest.hbmBytes = isTriple(hbmGB)
    ? { lo: scale(hbmGB.lo), mid: scale(hbmGB.mid), hi: scale(hbmGB.hi) }
    : scale(hbmGB);
  return rest;
}

/* ---------- dual-mode registry access (browser globals / node require) ---------- */
function cfData() {
  if (typeof module !== "undefined" && module.exports) {
    const d = require("./engine-data-v22.js");
    return { HW_ROOFLINE: d.HW_ROOFLINE, FLEETS: d.FLEETS };
  }
  return { HW_ROOFLINE, FLEETS };
}
function cfHwOrder() {
  if (typeof module !== "undefined" && module.exports) return require("./engine.js").HW_ORDER;
  return HW_ORDER;
}
function cfBases() {
  if (typeof module !== "undefined" && module.exports) return require("./engine.js").PROCUREMENT_BASES;
  return PROCUREMENT_BASES;
}
function cfDcData() {
  if (typeof module !== "undefined" && module.exports) return require("./engine-data-dc-v1.js");
  /* im-arc T4 fold ROUND 6 (2026-08-25): DC_SCHEMA was missing from this branch while being a
     perfectly ordinary browser global (engine-data-dc-v1.js). Every Node consumer got the schema
     and every BROWSER consumer silently did not, which is how the reader-capex scope requirement
     came to be enforced on one surface and not the other. The omission was invisible to the whole
     Node suite by construction. */
  return { REGIONS, DATACENTERS, PROGRAMMES, DC_SCHEMA };
}
/* Donor family from the M3 registry field; "unclassified" is the only permitted
   reassignment (memo §2.6 — never a DIFFERENT family: a Trainium-calibrated leg tagged
   nvidia would silently ride the wrong M5 family multiplier). */
function donorFamily(donorKey) {
  const row = cfData().HW_ROOFLINE[donorKey];
  return row && typeof row.family === "string" ? row.family : "unclassified";
}

/* ---------- the ONE validator (memo §2.2/§6.2/§6.3 — fail-closed, reject-whole) ----------
   Returns { ok: true, fleet } with a normalized deep copy, or { ok: false, errors: [...] }.
   Never clamps, never repairs, never resolves through prototypes. `opts.requireId`
   distinguishes store/codec shapes (id required) from builder working copies (id absent
   until first save). */
function validateCustomFleet(input, opts) {
  const errors = [];
  const requireId = !opts || opts.requireId !== false;
  const err = (m) => { errors.push(m); };
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["fleet: not an object"] };
  }
  const legacyV1 = Array.isArray(input.legs) && !("sections" in input);
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): wire provenance
     survives normalization. It is not a pricing input; it only decides whether
     a semantically legacy fleet re-serializes through the v6 or v7 envelope. */
  const wireVersion = opts && opts.wireVersion !== undefined ? opts.wireVersion : input.wireVersion;
  const wireLegacyBases = wireVersion === "v6"
    ? (legacyV1 && Array.isArray(input.legs)
      ? input.legs.map(leg => leg && leg.basisDeclared || "inherit")
      : input.wireLegacyBases)
    : undefined;
  if (wireVersion !== undefined && wireVersion !== "v6" && wireVersion !== "v7")
    err("fleet.wireVersion: v6 or v7 required when present");
  if (wireVersion === "v7" && legacyV1) err("fleet.wireVersion: v7 requires explicit sections");
  const fleetKeys = legacyV1 ? CF_LEGACY_FLEET_KEYS : CF_FLEET_KEYS;
  for (const k of Object.keys(input)) if (!fleetKeys.includes(k)) err("fleet: unknown key '" + k + "'");
  if (requireId) {
    if (typeof input.id !== "string" || !CF_ID_RE.test(input.id)) err("fleet.id: not a cf: id");
  } else if ("id" in input && (typeof input.id !== "string" || !CF_ID_RE.test(input.id))) {
    err("fleet.id: present but malformed");
  }
  if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > CF_NAME_MAX) {
    err("fleet.name: string 1–" + CF_NAME_MAX + " required");
  }
  /* impl-gate P1-2: stored/token shapes REQUIRE the epoch stamp (the builder's working
     copy — requireId:false — may omit it; Save stamps it). A fleet with no epoch can
     never surface the §7.3 stale-defaults notice, so absence is a schema violation. */
  if (requireId) {
    if (typeof input.epoch !== "string" || !input.epoch.length) err("fleet.epoch: non-empty string required");
  } else if ("epoch" in input && typeof input.epoch !== "string") err("fleet.epoch: string required when present");
  const FLEETS_REG = cfData().FLEETS;
  if (!(input.clonedFrom === null || (typeof input.clonedFrom === "string"
      && Object.prototype.hasOwnProperty.call(FLEETS_REG, input.clonedFrom)))) {
    err("fleet.clonedFrom: null or a registry fleet id (own-property) required");
  }
  const HWO = cfHwOrder(), BASES = cfBases();
  if (input.wireLegacyBases !== undefined && wireVersion !== "v6")
    err("fleet.wireLegacyBases: allowed only with wireVersion v6");
  if (wireLegacyBases !== undefined && (!Array.isArray(wireLegacyBases)
      || !wireLegacyBases.every(basis => basis === "inherit" || BASES.includes(basis))))
    err("fleet.wireLegacyBases: array of inherit or named procurement bases required");
  const point = v => isTriple(v) ? v.mid : v;
  const decimalShare = (value, at) => {
    const members = isTriple(value) ? [value.lo, value.mid, value.hi] : [value];
    if (!members.every(v => typeof v === "number" && isFinite(v)
        && v >= CF_BOUNDS.sharePct[0] && v <= CF_BOUNDS.sharePct[1])) {
      err(at + ": finite number or ordered triple in [0,100] required"); return;
    }
    if (!members.every(v => Math.abs(v * 10 - Math.round(v * 10)) <= 1e-9))
      err(at + ": at most one decimal place required");
  };
  const bounded = (value, bounds, at) => {
    if (!(isPoint(value) || isTriple(value))) { err(at + ": finite number or {lo,mid,hi} required"); return; }
    const values = isTriple(value) ? [value.lo, value.mid, value.hi] : [value];
    if (!values.every(v => v >= bounds[0] && v <= bounds[1]))
      err(at + ": every value must be in [" + bounds[0] + "," + bounds[1] + "]");
  };
  const validateLegs = (legs, atRoot, legacy) => {
    if (!Array.isArray(legs) || legs.length < 1) { err(atRoot + ": non-empty array required"); return; }
    legs.forEach((leg, i) => {
      const at = atRoot + "[" + i + "]";
      if (typeof leg !== "object" || leg === null || Array.isArray(leg)) { err(at + ": not an object"); return; }
      for (const k of Object.keys(leg)) {
        if (!(legacy ? CF_LEGACY_LEG_KEYS : CF_LEG_KEYS).includes(k)) err(at + ": unknown key '" + k + "'");
      }
      if (!HWO.includes(leg.donorKey)) err(at + ".donorKey: not a registered accelerator");
      if (typeof leg.label !== "string" || leg.label.length < 1 || leg.label.length > CF_NAME_MAX) {
        err(at + ".label: string 1–" + CF_NAME_MAX + " required");
      }
      decimalShare(leg.sharePct, at + ".sharePct");
      if (typeof leg.overrides !== "object" || leg.overrides === null || Array.isArray(leg.overrides)) {
        err(at + ".overrides: object required");
      } else {
        /* T5 rec 4: fold the deprecated `hbmGB` alias into typed bytes BEFORE bounds are checked,
           so an old saved fleet is bounds-checked as the quantity it actually means. The fold is
           PURE — it returns a new object and never touches the caller's input, because a
           validator that silently rewrites what it was handed is its own defect class. The same
           pure fold runs again in normalizeLeg, so the shape that validates is the shape that
           ships. `ok:false` here means the fold itself was rejected (both keys present); the
           returned object is then unusable and the remaining per-key checks are skipped. */
        const folded = foldLegacyHbm(leg.overrides, at + ".overrides", err);
        if (folded) {
          for (const k of Object.keys(folded)) {
            if (!CF_OVERRIDE_KEYS.includes(k)) { err(at + ".overrides: unknown key '" + k + "'"); continue; }
            const v = folded[k];
            if (v === null) continue;
            if (k === "capexScope") continue; /* not numeric; checked by the shared scope rule below */
            const [lo, hi] = CF_BOUNDS[k];
            bounded(v, [lo, hi], at + ".overrides." + k);
          }
          validateCapexScope(folded, folded.capexUsd !== undefined && folded.capexUsd !== null,
            at + ".overrides", err);
        }
      }
      if (legacy && !(leg.basisDeclared === "inherit" || BASES.includes(leg.basisDeclared))) {
        err(at + ".basisDeclared: 'inherit' or a named procurement basis required");
      }
      if (HWO.includes(leg.donorKey)) {
        const fam = donorFamily(leg.donorKey);
        if (!(leg.family === fam || leg.family === "unclassified")) {
          err(at + ".family: must be the donor's family ('" + fam + "') or 'unclassified'");
        }
      }
    });
    /* Sum only the STRUCTURALLY VALID legs (vetting round 2026-09-19, Astra pack A P1-2). The
       forEach above returns early for a leg that is not an object, having recorded the error —
       but this reduce then dereferenced that same leg, so `{legs:[null]}` threw
       "Cannot read properties of null (reading 'sharePct')" out of a function whose whole
       contract is to RETURN {ok:false}. A hand-edited localStorage row was enough to reach it:
       loadCustomFleetStore() calls this per row, so one malformed row took the page down with
       it instead of being skipped. Guard: tests/custom-fleet-malformed-rows.test.mjs. */
    const sum = legs.reduce((a, l) => {
      if (typeof l !== "object" || l === null || Array.isArray(l)) return a;
      return a + (isPoint(point(l.sharePct)) ? point(l.sharePct) : 0);
    }, 0);
    if (!(sum > 0)) err(atRoot + ": share sum must be > 0");
  };
  let sections;
  if (legacyV1) {
    if (!Array.isArray(input.legs) || input.legs.length > CF_MAX_LEGS) err("fleet.legs: array of 1–" + CF_MAX_LEGS + " required");
    validateLegs(input.legs, "fleet.legs", true);
    sections = [{ id: "s1", label: "(whole fleet)", sharePct: 100, basis: "inherit",
      rent: null, electricity: null, pue: null, tco: null, dcRef: null, provenance: null,
      legs: Array.isArray(input.legs) ? input.legs.map(dropLegacyBasis) : [] }];
  } else if (!Array.isArray(input.sections) || input.sections.length < 1 || input.sections.length > CF_MAX_SECTIONS) {
    err("fleet.sections: array of 1–" + CF_MAX_SECTIONS + " required"); sections = [];
  } else {
    sections = input.sections;
    const ids = new Set(); let totalLegs = 0;
    input.sections.forEach((section, si) => {
      const at = "section[" + si + "]";
      if (typeof section !== "object" || section === null || Array.isArray(section)) { err(at + ": not an object"); return; }
      for (const k of Object.keys(section)) if (!CF_SECTION_KEYS.includes(k)) err(at + ": unknown key '" + k + "'");
      if (typeof section.id !== "string" || !/^s(?:[1-9]|1[0-2])$/.test(section.id)) err(at + ".id: s1–s12 required");
      else if (ids.has(section.id)) err(at + ".id: duplicate"); else ids.add(section.id);
      if (typeof section.label !== "string" || section.label.length < 1 || section.label.length > CF_NAME_MAX)
        err(at + ".label: string 1–" + CF_NAME_MAX + " required");
      decimalShare(section.sharePct, at + ".sharePct");
      if (!(section.basis === "inherit" || BASES.includes(section.basis))) err(at + ".basis: inherit or named basis required");
      validateRent(section.rent, at + ".rent", bounded, HWO, err, section.legs);
      validateElectricity(section.electricity, at + ".electricity", bounded, err);
      if (section.pue !== null) bounded(section.pue, [1, 3], at + ".pue");
      validateTco(section.tco, at + ".tco", bounded, HWO, err);
      validateFallbackReceipts(section.fallbackReceipts, at + ".fallbackReceipts", err);
      validateShareRounding(section.shareRounding, at + ".shareRounding", err);
      /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
         dcRef is the shared registry-row reference. Programme rows retain their
         programme coverage class; allowing them here does not relabel them as sites. */
      const dcData = cfDcData();
      const dcs = { ...dcData.DATACENTERS, ...dcData.PROGRAMMES };
      if (!(section.dcRef === null || (typeof section.dcRef === "string"
          && Object.prototype.hasOwnProperty.call(dcs, section.dcRef)))) err(at + ".dcRef: null or registered facility/programme row id required");
      if (!(section.provenance === null || (typeof section.provenance === "string" && section.provenance.length > 0)))
        err(at + ".provenance: null or non-empty string required");
      if ((section.dcRef !== null || (section.electricity && section.electricity.source)) && !section.provenance)
        err(at + ".provenance: required for dcRef or sourced electricity");
      validateLegs(section.legs, at + ".legs", false);
      totalLegs += Array.isArray(section.legs) ? section.legs.length : 0;
    });
    const sum = input.sections.reduce((a, s) => a + (isPoint(point(s && s.sharePct)) ? point(s.sharePct) : 0), 0);
    if (!(sum > 0)) err("fleet.sections: share sum must be > 0");
    if (totalLegs > CF_MAX_LEGS) err("fleet.sections: at most " + CF_MAX_LEGS + " legs across the fleet");
  }
  if (errors.length) return { ok: false, errors };
  /* Normalized deep copy — nothing from the input object graph escapes into the store
     (prototype-free rebuild; the codec/store never hold caller references). */
  const fleet = {
    id: requireId || "id" in input ? input.id : undefined,
    name: input.name,
    epoch: typeof input.epoch === "string" ? input.epoch : undefined,
    clonedFrom: input.clonedFrom,
    sections: sections.map(normalizeSection),
    ...(wireVersion ? { wireVersion } : {}),
    ...(wireVersion === "v6" && Array.isArray(wireLegacyBases)
      ? { wireLegacyBases: wireLegacyBases.slice() } : {}),
  };
  if (fleet.id === undefined) delete fleet.id;
  if (fleet.epoch === undefined) delete fleet.epoch;
  return { ok: true, fleet };
}

function isPoint(value) { return typeof value === "number" && isFinite(value); }
function isTriple(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === CF_TRIPLE_KEYS.slice().sort().join(",")
    && [value.lo, value.mid, value.hi].every(isPoint) && value.lo <= value.mid && value.mid <= value.hi;
}
function copyValue(value) { return isTriple(value) ? { lo: value.lo, mid: value.mid, hi: value.hi } : value; }
function dropLegacyBasis(leg) {
  return { donorKey: leg.donorKey, label: leg.label, sharePct: copyValue(leg.sharePct),
    overrides: { ...(leg.overrides || {}) }, family: leg.family };
}
function normalizeLeg(leg) {
  /* T5 rec 4: the SAME pure fold the validator ran. Normalization is what reaches the store and
     the codec, so a legacy `hbmGB` leg re-serializes as typed bytes and the deprecated key dies
     on first save. The fold cannot fail here — validation already refused the both-keys case —
     but it is called through the same function so the two can never drift apart. */
  const folded = foldLegacyHbm(leg.overrides || {}, "", () => {}) || {};
  return { donorKey: leg.donorKey, label: leg.label, sharePct: copyValue(leg.sharePct),
    overrides: Object.fromEntries(CF_OVERRIDE_KEYS.filter(k => k in folded && folded[k] !== null)
      .map(k => [k, copyValue(folded[k])])), family: leg.family };
}
function normalizeSection(section) {
  const out = { id: section.id, label: section.label, sharePct: copyValue(section.sharePct), basis: section.basis,
    rent: section.rent ? structuredClone(section.rent) : null,
    electricity: section.electricity ? structuredClone(section.electricity) : null,
    pue: section.pue === null ? null : copyValue(section.pue),
    tco: section.tco ? structuredClone(section.tco) : null,
    dcRef: section.dcRef, provenance: section.provenance,
    fallbackReceipts: Array.isArray(section.fallbackReceipts)
      ? structuredClone(section.fallbackReceipts) : [],
    ...(section.shareRounding ? { shareRounding: structuredClone(section.shareRounding) } : {}),
    legs: section.legs.map(normalizeLeg) };
  return out;
}
/* im-arc T3 FIX-2 B1 (2026-08-23): permalink sections intentionally omit
   runtime-derived fallback/rounding receipts, and validation adds wire-version
   migration metadata. Neither class is caller authority. Use an explicit-key
   projection for same-id collision checks so key insertion order cannot create a
   false "different fleet" result. */
function callerAuthoredFleetDefinition(fleet) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet)) return null;
  const out = { id: fleet.id, name: fleet.name, epoch: fleet.epoch, clonedFrom: fleet.clonedFrom };
  if (Array.isArray(fleet.sections)) {
    out.sections = fleet.sections.map(section => ({
      id: section.id, label: section.label, sharePct: structuredClone(section.sharePct),
      basis: section.basis, rent: structuredClone(section.rent),
      electricity: structuredClone(section.electricity), pue: structuredClone(section.pue),
      tco: structuredClone(section.tco), dcRef: section.dcRef, provenance: section.provenance,
      legs: (section.legs || []).map(leg => ({ donorKey: leg.donorKey, label: leg.label,
        sharePct: structuredClone(leg.sharePct), overrides: structuredClone(leg.overrides),
        family: leg.family })),
    }));
  } else if (Array.isArray(fleet.legs)) {
    out.legs = fleet.legs.map(leg => ({ donorKey: leg.donorKey, label: leg.label,
      sharePct: structuredClone(leg.sharePct), overrides: structuredClone(leg.overrides),
      basisDeclared: leg.basisDeclared, family: leg.family }));
  }
  return out;
}
function callerAuthoredFleetEqual(left, right) {
  return JSON.stringify(callerAuthoredFleetDefinition(left))
    === JSON.stringify(callerAuthoredFleetDefinition(right));
}
function validateRent(rent, at, bounded, HWO, err, legs) {
  if (rent === null) return;
  if (typeof rent !== "object" || Array.isArray(rent) || !CF_RENT_MODES.includes(rent.mode)) { err(at + ": null or typed rent object required"); return; }
  const expected = CF_RENT_KEYS[rent.mode];
  for (const k of Object.keys(rent)) if (!expected.includes(k)) err(at + ": unknown key '" + k + "'");
  for (const k of expected) if (!(k in rent)) err(at + ": missing key '" + k + "'");
  if (rent.mode === "flat") bounded(rent.usdPerHr, CF_BOUNDS.rentPerHr, at + ".usdPerHr");
  if (rent.mode === "registered") bounded(rent.mult, [0.02, 20], at + ".mult");
  if (rent.mode === "byHw") {
    if (typeof rent.usdPerHrByHw !== "object" || rent.usdPerHrByHw === null || Array.isArray(rent.usdPerHrByHw)) err(at + ".usdPerHrByHw: object required");
    else for (const [key, value] of Object.entries(rent.usdPerHrByHw)) {
      if (!HWO.includes(key)) err(at + ".usdPerHrByHw: unknown hardware '" + key + "'");
      bounded(value, CF_BOUNDS.rentPerHr, at + ".usdPerHrByHw." + key);
    }
    /* im-arc T2 fix (Sol review 2026-08-23, finding P1-7): the map is
       total over the section's donor set. Missing is invalid, never NaN later. */
    if (rent.usdPerHrByHw && typeof rent.usdPerHrByHw === "object" && !Array.isArray(rent.usdPerHrByHw))
      for (const key of [...new Set((Array.isArray(legs) ? legs : []).map(leg => leg && leg.donorKey).filter(Boolean))])
        if (!Object.prototype.hasOwnProperty.call(rent.usdPerHrByHw, key))
          err(at + ".usdPerHrByHw." + key + ": finite price required for section donor " + key);
  }
}
function validateElectricity(electricity, at, bounded, err) {
  if (electricity === null) return;
  if (typeof electricity !== "object" || Array.isArray(electricity)) { err(at + ": null or object required"); return; }
  for (const k of Object.keys(electricity)) if (!CF_ELECTRICITY_KEYS.includes(k)) err(at + ": unknown key '" + k + "'");
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-5): region-only
     electricity inherits the registry triple; an explicit value is an override
     and may retain regionRef only as informational context. */
  if (!("usdPerKwh" in electricity) && !("regionRef" in electricity))
    err(at + ": usdPerKwh or regionRef required");
  else if ("usdPerKwh" in electricity)
    bounded(electricity.usdPerKwh, CF_BOUNDS.kwhPerKwh, at + ".usdPerKwh");
  if ("source" in electricity && typeof electricity.source !== "string") err(at + ".source: string required");
  if ("regionRef" in electricity && !(typeof electricity.regionRef === "string"
      && Object.prototype.hasOwnProperty.call(cfDcData().REGIONS, electricity.regionRef))) err(at + ".regionRef: registered region required");
}
/* im-arc T4 fold round 4 (2026-08-25): the ONE place the reader-capex scope rule lives, so the
   section path and the leg-override path cannot drift apart. `stated` is whether this object
   actually carries a capex of the reader's own. */
/* The ONE way to opt out of the capex-scope rule: a historical replay must SAY it is one.
   im-arc T4 fold ROUND 6 (2026-08-25). Round 4 keyed this escape on DC_SCHEMA being ABSENT, which
   made "the schema is missing" and "the caller is deliberately replaying history" the same
   condition — so a plain wiring omission in the browser branch of cfDcData() disabled the rule
   everywhere, silently, and the comment claiming the branch was unreachable outside a replay was
   false. An escape must be an assertion by the caller, never an inference from missing data:
   tests/t4-historical-pins.mjs sets this flag when it swaps the registry for its pre-fold self,
   and nothing else in the tree sets it. A missing schema is now an ERROR, not a licence. */
const CF_PRE_T4_PIN_FLAG = "__preT4RegistryPin";
function validateCapexScope(holder, stated, at, err) {
  const data = cfDcData();
  if (data && data[CF_PRE_T4_PIN_FLAG] === true) return; // deliberate historical replay
  const schema = data && data.DC_SCHEMA;
  if (!schema || !Array.isArray(schema.CAPEX_SCOPES)) {
    err(at + ".capexScope: the registry schema is unreachable, so a stated capex cannot be "
      + "validated against its input scope. This is a wiring fault, not a licence to skip the "
      + "check — a historical replay must set " + CF_PRE_T4_PIN_FLAG + " to opt out explicitly.");
    return;
  }
  const SCOPES = schema.CAPEX_SCOPES;
  const has = holder.capexScope !== undefined && holder.capexScope !== null;
  if (stated && !has) {
    err(at + ".capexScope: REQUIRED when you state a capex — name the INPUT SCOPE of that "
      + "observation (" + SCOPES.join(" | ") + "); it selects the cluster overhead and is never assumed");
    return;
  }
  if (!stated && has) {
    err(at + ".capexScope: supplied without a stated capex. It describes the scope of a capex YOU "
      + "state; every registry row already carries its own");
    return;
  }
  if (has && !SCOPES.includes(holder.capexScope))
    err(at + ".capexScope: one of " + SCOPES.join(" | ") + " required");
}
function validateTco(tco, at, bounded, HWO, err) {
  if (tco === null) return;
  if (typeof tco !== "object" || Array.isArray(tco)) { err(at + ": null or object required"); return; }
  for (const k of Object.keys(tco)) if (!CF_TCO_KEYS.includes(k)) err(at + ": unknown key '" + k + "'");
  if (tco.capexUsdByHw !== undefined) {
    if (typeof tco.capexUsdByHw !== "object" || tco.capexUsdByHw === null || Array.isArray(tco.capexUsdByHw)) err(at + ".capexUsdByHw: object required");
    else for (const [key, value] of Object.entries(tco.capexUsdByHw)) {
      if (!HWO.includes(key)) err(at + ".capexUsdByHw: unknown hardware '" + key + "'");
      bounded(value, CF_BOUNDS.capexUsd, at + ".capexUsdByHw." + key);
    }
  }
  /* im-arc T4 fold round 4 (2026-08-25), memo :41/:123: a stated capex is MEANINGLESS without the
     input scope of the observation, and assuming one is the specific harm the memo names — an
     installed-system price silently multiplied by the bare-card overhead invents a cluster cost
     the observation already contains. Required WITH capex, refused WITHOUT it. */
  validateCapexScope(tco, tco.capexUsdByHw !== undefined && tco.capexUsdByHw !== null, at, err);
  for (const [key, bounds] of Object.entries({ lifeYears: [1, 15], dcPerW: [1, 50], clusterOh: [1, 3], opexPct: [0, 50] }))
    if (tco[key] !== undefined) bounded(tco[key], bounds, at + "." + key);
}
function validateFallbackReceipts(receipts, at, err) {
  if (receipts === undefined) return;
  if (!Array.isArray(receipts)) { err(at + ": array required when present"); return; }
  const fields = new Set();
  const validValue = value => typeof value === "string" || typeof value === "boolean"
    || (typeof value === "number" && isFinite(value))
    || (value && typeof value === "object" && !Array.isArray(value)
      && Object.values(value).every(child => typeof child === "string"
        || (typeof child === "number" && isFinite(child))));
  receipts.forEach((receipt, index) => {
    const rowAt = at + "[" + index + "]";
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
      err(rowAt + ": object required"); return;
    }
    for (const key of Object.keys(receipt))
      if (!CF_FALLBACK_RECEIPT_KEYS.includes(key)) err(rowAt + ": unknown key '" + key + "'");
    if (!["rent", "pue", "electricity", "procurement"].includes(receipt.field))
      err(rowAt + ".field: rent, pue, electricity, or procurement required");
    else if (fields.has(receipt.field)) err(rowAt + ".field: duplicate " + receipt.field);
    else fields.add(receipt.field);
    if (!validValue(receipt.value)) err(rowAt + ".value: finite scalar or scalar map required");
    if (typeof receipt.source !== "string" || !receipt.source.length) err(rowAt + ".source: non-empty string required");
    if (typeof receipt.reason !== "string" || !receipt.reason.length) err(rowAt + ".reason: non-empty string required");
  });
}
function validateShareRounding(receipt, at, err) {
  if (receipt === undefined || receipt === null) return;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    err(at + ": object required when present"); return;
  }
  for (const key of Object.keys(receipt))
    if (!CF_SHARE_ROUNDING_KEYS.includes(key)) err(at + ": unknown key '" + key + "'");
  if (typeof receipt.basis !== "string" || !receipt.basis.length) err(at + ".basis: non-empty string required");
  if (!Array.isArray(receipt.residualKeys) || !receipt.residualKeys.every(key => typeof key === "string" && key.length))
    err(at + ".residualKeys: non-empty string array required");
  if (!Array.isArray(receipt.changes) || !receipt.changes.length) {
    err(at + ".changes: non-empty array required"); return;
  }
  receipt.changes.forEach((change, index) => {
    const rowAt = at + ".changes[" + index + "]";
    if (!change || typeof change !== "object" || Array.isArray(change)) {
      err(rowAt + ": object required"); return;
    }
    for (const key of Object.keys(change))
      if (!CF_SHARE_ROUNDING_CHANGE_KEYS.includes(key)) err(rowAt + ": unknown key '" + key + "'");
    if (change.scope !== "section" && change.scope !== "leg") err(rowAt + ".scope: section or leg required");
    if (typeof change.key !== "string" || !change.key.length) err(rowAt + ".key: non-empty string required");
    if (![change.declared, change.rounded].every(value => typeof value === "number" && isFinite(value)))
      err(rowAt + ": finite declared and rounded values required");
  });
}

/* ---------- pure state helpers ---------- */
/* The §1.3 blend-mirror aggregation: per-donorKey sums over HW_ORDER shape. Suite
   invariant: aggregate(legs) == S.blend after every builder commit / cf: selection. */
function aggregateLegsToBlend(fleet) {
  const HWO = cfHwOrder();
  const blend = Object.fromEntries(HWO.map((k) => [k, 0]));
  const sections = Array.isArray(fleet.sections) ? fleet.sections : [{ sharePct: 100, legs: fleet.legs || [] }];
  const activeSections = sections.filter(section => midpoint(section.sharePct) > 0);
  const sectionTotal = activeSections.reduce((sum, section) => sum + midpoint(section.sharePct), 0);
  for (const section of activeSections) {
    const activeLegs = section.legs.filter(leg => midpoint(leg.sharePct) > 0);
    const legTotal = activeLegs.reduce((sum, leg) => sum + midpoint(leg.sharePct), 0);
    if (!(legTotal > 0) || !(sectionTotal > 0)) continue;
    for (const leg of activeLegs)
      blend[leg.donorKey] += 100 * (midpoint(section.sharePct) / sectionTotal) * (midpoint(leg.sharePct) / legTotal);
  }
  return blend;
}
function newCustomFleetId(existingIds, seed) {
  /* base36 slug; `seed` lets tests mint deterministically. Collision-checked against
     the caller-supplied id set (own list, not the store — codec restores are ephemeral). */
  let n = typeof seed === "number" ? seed : Math.floor(Math.random() * 36 ** 8);
  for (let i = 0; i < 64; i++) {
    const id = CF_PREFIX + (n % 36 ** 8).toString(36).padStart(6, "0");
    if (!existingIds || !existingIds.includes(id)) return id;
    n = n + 1;
  }
  throw new Error("newCustomFleetId: could not mint a free id");
}
function makeBlankFleet() {
  return { name: "My fleet", clonedFrom: null,
    sections: [makeBlankSection("s1", 100)] };
}
function makeLegFromDonor(donorKey, sharePct) {
  const hwName = (typeof module !== "undefined" && module.exports)
    ? require("./engine.js").HW[donorKey].name : HW[donorKey].name;
  return { donorKey, label: hwName, sharePct,
    overrides: {}, family: donorFamily(donorKey) };
}
function makeBlankSection(id, sharePct) {
  return { id, label: id === "s1" ? "Primary section" : "Section " + id.slice(1), sharePct,
    /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §1.2): new sections are
       explicitly typed. `inherit` remains accepted solely for v1 store/token migration. */
    basis: "committed-planning-rent", rent: { mode: "registered", mult: 1 },
    electricity: null, pue: null, tco: null,
    dcRef: null, provenance: null, legs: [makeLegFromDonor("h100", 100)] };
}
function cloneFromNamedFleet(fleetId) {
  const { FLEETS: REG } = cfData();
  if (!Object.prototype.hasOwnProperty.call(REG, fleetId)) return null;
  const src = REG[fleetId];
  const legs = Object.entries(src.legs).filter(([, pct]) => pct > 0)
    .map(([k, pct]) => makeLegFromDonor(k, pct));
  return { name: src.name.slice(0, CF_NAME_MAX - 7) + " (copy)", clonedFrom: fleetId,
    sections: [{ ...makeBlankSection("s1", 100), label: "(whole fleet)", legs }] };
}
function normalizeShares(rows) {
  const sum = rows.reduce((a, row) => a + midpoint(row.sharePct), 0);
  if (!(sum > 0)) return rows;
  return rows.map(row => ({ ...row, sharePct: Math.round((midpoint(row.sharePct) / sum) * 1000) / 10 }));
}
function midpoint(value) { return isTriple(value) ? value.mid : Number(value); }

/* ---------- localStorage store: im_custom_fleets_v1 (memo §7) ----------
   Fail-closed, non-destructive: an unparseable/mis-shaped store yields an EMPTY
   in-memory map and storage is left untouched; individually invalid rows are skipped
   on load but PRESERVED in storage. Writes only on explicit save/delete, rewriting
   only this key. */
const CF_STORE_KEY = "im_custom_fleets_v1";
/* impl-gate P1-1: the loader returns BOTH maps — `valid` (what the app offers) and `raw`
   (every stored row verbatim, including rejected ones). Persistence writes RAW with only
   the touched key changed, so an invalid row survives every unrelated Save/Delete
   byte-for-byte (memo §7.2 non-destructive, now actually true rather than
   true-until-the-next-write). */
function loadCustomFleetStore() {
  if (typeof localStorage === "undefined") return { valid: Object.create(null), raw: Object.create(null) };
  let parsed;
  try { parsed = JSON.parse(localStorage.getItem(CF_STORE_KEY)); } catch { return { valid: Object.create(null), raw: Object.create(null) }; }
  if (typeof parsed !== "object" || parsed === null || parsed.v !== 1
      || typeof parsed.fleets !== "object" || parsed.fleets === null || Array.isArray(parsed.fleets)) {
    return { valid: Object.create(null), raw: Object.create(null) };
  }
  /* fix-verify P1-1 residual: NULL-PROTOTYPE maps — a stored row keyed "__proto__"
     must round-trip as an own property, not vanish into the prototype slot. */
  const valid = Object.create(null), raw = Object.create(null);
  for (const id of Object.keys(parsed.fleets)) {
    const row = parsed.fleets[id];
    raw[id] = row; // preserved verbatim, valid or not
    if (typeof row === "object" && row !== null && row.id !== id) continue; // key/id mismatch = never offered
    const v = validateCustomFleet(row, { requireId: true });
    if (v.ok) valid[id] = v.fleet;
  }
  return { valid, raw };
}
function persistCustomFleetStore(raw) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CF_STORE_KEY, JSON.stringify({ v: 1, fleets: raw }));
}

/* ---------- runtime source (registered into the engine) ----------
   The engine resolves cf: identities exclusively through this source (memo §3.1). The
   ephemeral slot carries a link-restored by-value fleet (memo §6.5): loading a link
   NEVER writes localStorage — "Save a copy" is the only write path. */
const CF_RUNTIME = {
  saved: {},          // id -> VALIDATED fleet (what the app offers)
  rawStore: {},       // id -> stored row VERBATIM incl. invalid ones (P1-1: the persistence source)
  ephemeral: null,    // validated fleet from a v6 token, or null
  resolve(id) {
    if (typeof id !== "string" || !id.startsWith(CF_PREFIX)) return null;
    if (this.ephemeral && this.ephemeral.id === id) return this.ephemeral;
    return Object.prototype.hasOwnProperty.call(this.saved, id) ? this.saved[id] : null;
  },
  ids() { return Object.keys(this.saved); },
  isCustomFleetId(id) { return typeof id === "string" && CF_ID_RE.test(id) && this.resolve(id) !== null; },
  save(fleet) { this.saved[fleet.id] = fleet; this.rawStore[fleet.id] = fleet; persistCustomFleetStore(this.rawStore); },
  remove(id) { delete this.saved[id]; delete this.rawStore[id]; persistCustomFleetStore(this.rawStore); },
  setEphemeral(fleet) { this.ephemeral = fleet; },
};
{ const loaded = loadCustomFleetStore(); CF_RUNTIME.saved = loaded.valid; CF_RUNTIME.rawStore = loaded.raw; }
/* Late-bound engine hook (engine.js loads first and defines the registration point). */
if (typeof registerCustomFleetSource === "function") registerCustomFleetSource(CF_RUNTIME);

/* ---------- node exports ---------- */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CF_PREFIX, CF_ID_RE, CF_MAX_LEGS, CF_MAX_SECTIONS, CF_NAME_MAX,
    CF_FLEET_KEYS, CF_LEGACY_FLEET_KEYS, CF_SECTION_KEYS, CF_LEG_KEYS, CF_LEGACY_LEG_KEYS,
    CF_OVERRIDE_KEYS, CF_RENT_MODES, CF_RENT_KEYS, CF_ELECTRICITY_KEYS, CF_TCO_KEYS, CF_TRIPLE_KEYS,
    /* T5 rec 4: the deprecated read-side alias and the declaration units are exported so the
       invariant suite and the MCP discovery surface name them from ONE place. */
    CF_OVERRIDE_LEGACY_KEYS, CF_HBM_UNITS, CF_HBM_LEGACY_BYTES_PER_GB, foldLegacyHbm,
    CF_BOUNDS, CF_FALLBACK_RECEIPT_KEYS, CF_SHARE_ROUNDING_KEYS,
    CF_SHARE_ROUNDING_CHANGE_KEYS, CF_STORE_KEY,
    validateCustomFleet, aggregateLegsToBlend, newCustomFleetId,
    callerAuthoredFleetDefinition, callerAuthoredFleetEqual,
    makeBlankFleet, makeBlankSection, makeLegFromDonor, cloneFromNamedFleet, normalizeShares, midpoint, isTriple,
    loadCustomFleetStore, CF_RUNTIME, donorFamily,
  };
}
