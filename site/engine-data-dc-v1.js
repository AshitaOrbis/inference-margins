/* im-arc T2 region, data-center, programme, and modeled-fleet coverage registry.
   Provenance: research/im-arc-t2-sections-memo.md §§3–4 (v2, 2026-08-22).
   T2 seeds only values already carried by checked-in dives/registries. Programme evidence
   remains programme evidence; an accelerator commitment is never promoted to a facility.

   im-arc T4 fold (2026-08-24), spec research/im-arc-t4-fold-memo.md v2:
   the registry is brought onto the four evidence clusters. Three things changed shape.
   (1) `basis` is a CLOSED enum and a NEW orthogonal `observationKind` says what kind of
       observation a triple is (§0.1) — the pseudo-ranges that encoded a ceiling as
       {0, 1e6, 1e6} or a milestone pair as {500k, 500k, 1M} are gone.
   (2) A facility may carry a `mixedAggregate` — a disclosed installed total with NO public
       per-SKU split — under invariants the validator ENFORCES: it never coexists with
       per-SKU counts for the same observation, never names a hardware key, and can never
       feed per-SKU arithmetic or count-backed coverage (§1.1, review §3.4).
   (3) COVERAGE_LEDGER stores EVIDENCE keyed {company, preset} at the hardware-key level.
       It stores no percentages: those are DERIVED by the one resolver in engine.js from the
       selected modeled blend (§1.5). A hand-stored percentage drifts when a blend changes.
   Everything here is validated at module load by validateDcRegistry() — fail closed. */
"use strict";

const deepFreeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};
const point = value => deepFreeze({ lo: value, mid: value, hi: value });

/* ============================================================================
   The closed schema (im-arc T4 fold 2026-08-24, memo §0.1 and §7).
   ONE schema for UI, engine and MCP (T2 memo §1.1) — every consumer reads THESE lists.
   ============================================================================ */

/* `basis` says what KIND OF EVIDENCE stands behind a value. Closed [F1]: the strings removed
   from it (`disclosed system topology`, `disclosed average-to-peak deployment in a two-day
   historical trace`, `disclosed accelerator count per production decode instance`,
   `dated programme milestones`, `energy-component comparator`, `DERIVED`) described the KIND
   OF OBSERVATION, not the evidence basis — that job now belongs to `observationKind`. */
const BASIS = deepFreeze(["disclosed tariff", "disclosed installed count",
  "measured/credibly-reported", "analyst-set", "provisional"]);

/* `observationKind` says what the three numbers MEAN. Orthogonal to `basis` and required on
   every triple. Only the three SPAN kinds may carry lo !== hi. */
const OBSERVATION_KINDS = deepFreeze(["point", "selected-span", "floor", "ceiling", "milestone",
  "load-state-average-peak", "mixed-installed-aggregate", "region-fill", "tariff-derived-delivered"]);
const POINT_OBSERVATION_KINDS = deepFreeze(["point", "floor", "ceiling", "milestone", "region-fill"]);
const SPAN_OBSERVATION_KINDS = deepFreeze(["selected-span", "load-state-average-peak",
  "tariff-derived-delivered"]);
/* `mixed-installed-aggregate` is neither: it is a disclosed/analyst-set aggregate whose
   endpoints are two public aggregate READINGS, so it is span-shaped but may never be read as
   an uncertainty interval on any single SKU. It is checked by its own invariant block below. */

/* Facility CLASSIFICATION (memo §2, [F4]). A class is a classification of the site, never a
   measurement of it: the PUE band a class implies is resolved in scenario/default logic only,
   and `DATACENTERS[*].pue` stays null until a facility receipt exists. */
const FACILITY_CLASSES = deepFreeze(["hyperscaler-owned", "purpose-built-ai", "neocloud", "legacy"]);
const PUE_CLASS_BANDS = deepFreeze({
  "hyperscaler-owned": { lo: 1.08, mid: 1.12, hi: 1.20 },
  "purpose-built-ai": { lo: 1.10, mid: 1.20, hi: 1.30 },
  neocloud: { lo: 1.15, mid: 1.25, hi: 1.35 },
  legacy: { lo: 1.35, mid: 1.52, hi: 1.60 },
});

/* `capexScope` describes the INPUT SCOPE of an observed capex, never the product form [F5].
   The cluster-overhead multiplier follows from the scope: a finished-system observation
   already contains the overhead, so multiplying it again double-counts. */
const CAPEX_SCOPES = deepFreeze(["bare-card", "base-rack", "installed-system"]);
const CLUSTER_OH_BY_CAPEX_SCOPE = deepFreeze({
  "bare-card": { lo: 1.20, mid: 1.30, hi: 1.35 },
  "base-rack": { lo: 1.15, mid: 1.26, hi: 1.35 },
  "installed-system": { lo: 1.00, mid: 1.00, hi: 1.00 },
});

/* The ACTUAL deal class a rent quote belongs to (memo §4, [F7]). A singular class on one
   planning row could not carry a default and its alternates at once. */
/* Closed source-kind list (rec 14): a relay is not an issuer. */
const SOURCE_KINDS = ["primary-vendor-page", "primary-notice", "secondary-report", "analyst-synthesis"];
const RATE_CLASSES = deepFreeze(["one-year-low-committed", "reserved-1-2yr",
  "monthly-term-bare-metal", "capacity-block", "committed-3yr-list", "on-demand-public-slice",
  "managed-cloud-on-demand", "strategic-estimate", "tender-candidate",
  /* Two further closed classes the memo names directly: §4's GB200 conditional-hold label,
     and a class name for the stress quote that STATES BOTH observations it spans. */
  "reserved-neocloud-estimate", "on-demand-public-slice-and-capacity-block"]);
const PLANNING_POLICIES = deepFreeze(["low-committed"]);
const ALLOCATIONS = deepFreeze(["unsplit", "per-hardware-key"]);

const DC_SCHEMA = deepFreeze({
  BASIS, OBSERVATION_KINDS, POINT_OBSERVATION_KINDS, SPAN_OBSERVATION_KINDS,
  FACILITY_CLASSES, PUE_CLASS_BANDS, CAPEX_SCOPES, CLUSTER_OH_BY_CAPEX_SCOPE,
  RATE_CLASSES, PLANNING_POLICIES, ALLOCATIONS,
});

/* ---------------------------------------------------------------------------
   The validator. It is the ENFORCEMENT, not a description — the module refuses to
   load a registry that fails it, and tests/dc-registry-schema-t4.test.mjs proves it
   bites by feeding it mutations of these very literals.
   --------------------------------------------------------------------------- */
function validateDcRegistry(registry) {
  const errors = [];
  const push = message => { errors.push(message); };
  const isTriple = value => value && typeof value === "object"
    && [value.lo, value.mid, value.hi].every(x => typeof x === "number" && Number.isFinite(x));

  const checkBasis = (path, basis) => {
    if (typeof basis !== "string" || !BASIS.includes(basis))
      push(path + ": basis " + JSON.stringify(basis) + " is outside the closed basis enum");
  };
  const checkObservation = (path, triple, kind, { allowMixedAggregate = false } = {}) => {
    if (!isTriple(triple)) { push(path + ": expected a finite {lo, mid, hi} triple"); return; }
    if (!(triple.lo <= triple.mid && triple.mid <= triple.hi))
      push(path + ": triple is not ordered lo <= mid <= hi");
    if (typeof kind !== "string" || !OBSERVATION_KINDS.includes(kind)) {
      push(path + ": observationKind " + JSON.stringify(kind) + " is missing or outside the closed enum");
      return;
    }
    if (kind === "mixed-installed-aggregate" && !allowMixedAggregate) {
      push(path + ": observationKind 'mixed-installed-aggregate' may only sit on a mixedAggregate object");
      return;
    }
    if (POINT_OBSERVATION_KINDS.includes(kind) && !(triple.lo === triple.mid && triple.mid === triple.hi))
      push(path + ": observationKind '" + kind + "' is a point kind — lo, mid and hi must be equal"
        + " (the pseudo-range ban, memo §0.1)");
    if (kind === "load-state-average-peak" && triple.mid !== triple.lo)
      push(path + ": load-state-average-peak carries lo = average as the middle assumption"
        + " and hi = peak — mid must equal lo (two load states, not uncertainty endpoints)");
  };
  const checkProvenance = (path, row, { needAsOf = true, needSource = true } = {}) => {
    for (const key of (needSource ? ["source", "sourceFile", "sourceNeedle"] : ["sourceFile", "sourceNeedle"]))
      if (typeof row[key] !== "string" || !row[key].length)
        push(path + ": missing " + key + " (a figure without resolving provenance does not enter a row)");
    if (typeof row.sourceNeedle === "string" && row.sourceNeedle.length > 80)
      push(path + ": sourceNeedle exceeds 80 characters");
    if (needAsOf && !/^20\d\d-\d\d-\d\d$/.test(row.asOf))
      push(path + ": missing or malformed asOf");
  };

  /* ---- REGIONS ---- */
  for (const [id, row] of Object.entries(registry.REGIONS || {})) {
    const path = "REGIONS." + id;
    checkObservation(path + ".usdPerKwh", row.usdPerKwh, row.observationKind);
    checkBasis(path, row.basis);
    checkProvenance(path, row);
    for (const [index, observation] of (row.provisionalObservations || []).entries()) {
      const notePath = path + ".provisionalObservations[" + index + "]";
      checkObservation(notePath + ".usdPerKwh", observation.usdPerKwh, observation.observationKind);
      if (observation.basis !== "provisional")
        push(notePath + ": a structured note observation must carry basis 'provisional'");
    }
  }

  /* ---- DATACENTERS ---- */
  for (const [id, row] of Object.entries(registry.DATACENTERS || {})) {
    const path = "DATACENTERS." + id;
    if (!Object.prototype.hasOwnProperty.call(registry.REGIONS || {}, row.regionRef))
      push(path + ": regionRef " + JSON.stringify(row.regionRef) + " names no registered region");
    if (typeof row.facilityClass !== "string" || !FACILITY_CLASSES.includes(row.facilityClass))
      push(path + ": facilityClass " + JSON.stringify(row.facilityClass) + " is outside the four closed classes");
    checkBasis(path + ".facilityClassBasis", row.facilityClassBasis);
    /* A class BAND is a scenario fallback. Writing one into a facility row would present an
       analyst-set class as though the site had disclosed it (memo §2, review fold F4). */
    if (row.pue !== null)
      push(path + ": pue must stay null — a facility row may not carry a PUE class band as though measured");
    /* A DATACENTERS row's narrative lives in `provenance`; the closed T2 key set has no
       row-level `source`, so provenance is checked in its place. */
    checkProvenance(path, row, { needAsOf: false, needSource: false });
    if (typeof row.provenance !== "string" || row.provenance.length < 40)
      push(path + ": missing the one dated sourced provenance paragraph");

    for (const [index, accelerator] of (row.accelerators || []).entries()) {
      const accPath = path + ".accelerators[" + index + "]";
      checkObservation(accPath + ".count", accelerator.count, accelerator.observationKind);
      checkBasis(accPath, accelerator.basis);
    }

    const aggregate = row.mixedAggregate;
    if (aggregate) {
      const aggPath = path + ".mixedAggregate";
      /* The non-allocation invariants (memo §1.1, review §3.4) — these are the reason the
         aggregate is allowed to exist at all instead of a bare count-empty note. */
      if ((row.accelerators || []).length)
        push(aggPath + ": a mixedAggregate may never coexist with per-SKU accelerator counts"
          + " for the same observation — the split is not public and is never fabricated");
      if (Object.prototype.hasOwnProperty.call(aggregate, "hwKey"))
        push(aggPath + ": a mixedAggregate may not name a hardware key — that is the per-SKU"
          + " arithmetic hook the invariants exist to close");
      if (aggregate.observationKind !== "mixed-installed-aggregate")
        push(aggPath + ": observationKind must be 'mixed-installed-aggregate'");
      if (!Array.isArray(aggregate.hwKeysPresent) || !aggregate.hwKeysPresent.length)
        push(aggPath + ": hwKeysPresent must be a non-empty list of modeled hardware keys"
          + " (keys present, never family shares)");
      if (aggregate.allocation !== "unsplit")
        push(aggPath + ": allocation must be 'unsplit' — " + JSON.stringify(aggregate.allocation)
          + " would claim a split the public record does not carry");
      checkObservation(aggPath + ".count", aggregate.count, aggregate.observationKind,
        { allowMixedAggregate: true });
      checkBasis(aggPath, aggregate.basis);
      checkProvenance(aggPath, aggregate);
    }

    for (const [index, milestone] of (row.milestones || []).entries()) {
      const msPath = path + ".milestones[" + index + "]";
      checkObservation(msPath + ".count", milestone.count, milestone.observationKind);
      checkBasis(msPath, milestone.basis);
      checkProvenance(msPath, milestone);
    }
    for (const [index, evidence] of (row.servingEvidence || []).entries()) {
      const sePath = path + ".servingEvidence[" + index + "]";
      if (!ALLOCATIONS.includes(evidence.allocation))
        push(sePath + ": allocation " + JSON.stringify(evidence.allocation) + " is outside the closed list");
      if (!/^20\d\d-\d\d-\d\d$/.test(evidence.asOf)) push(sePath + ": missing or malformed asOf");
      if (typeof evidence.source !== "string" || !evidence.source.length) push(sePath + ": missing source");
    }

    const electricity = row.electricity;
    if (electricity && Object.prototype.hasOwnProperty.call(electricity, "inherit")) {
      if (!Object.prototype.hasOwnProperty.call(registry.REGIONS || {}, electricity.inherit))
        push(path + ".electricity: inherit names no registered region");
    } else if (electricity) {
      checkObservation(path + ".electricity.usdPerKwh", electricity.usdPerKwh, electricity.observationKind);
      checkBasis(path + ".electricity", electricity.basis);
    } else {
      push(path + ": electricity must be an explicit sourced observation or a typed region inheritance");
    }
  }

  /* ---- PROGRAMMES ---- */
  for (const [id, row] of Object.entries(registry.PROGRAMMES || {})) {
    const path = "PROGRAMMES." + id;
    if (row.coverage !== "programme") push(path + ": programme rows carry coverage 'programme'");
    checkProvenance(path, row);
    for (const [index, accelerator] of (row.accelerators || []).entries()) {
      const accPath = path + ".accelerators[" + index + "]";
      checkObservation(accPath + ".count", accelerator.count, accelerator.observationKind);
      checkBasis(accPath, accelerator.basis);
    }
  }

  /* ---- RENT_QUOTES / RENT_POLICY ---- */
  const quotes = registry.RENT_QUOTES || {};
  for (const [quoteId, quote] of Object.entries(quotes)) {
    const path = "RENT_QUOTES." + quoteId;
    if (typeof quote.rateClass !== "string" || !RATE_CLASSES.includes(quote.rateClass))
      push(path + ": rateClass " + JSON.stringify(quote.rateClass) + " is outside the closed class list");
    checkObservation(path + ".usdPerHr", quote.usdPerHr, quote.observationKind);
    checkBasis(path, quote.basis);
    checkProvenance(path, quote);
    if (typeof quote.hwKey !== "string" || !quote.hwKey.length) push(path + ": missing hwKey");
    /* FX PROVENANCE INVARIANT (GPT Pro 2026-07-29 rec 14; enforced 2026-09-02 after review
       pr-20260902T173936Z-a81123 observed that the first attempt added honest PROSE no validator,
       selector or renderer consumed — so deleting the flag, flipping it to true, changing the CNY
       values without the USD, or attaching the provenance to an unrelated USD figure would all have
       passed). A converted USD tariff must never be able to read as a first-party disclosed USD
       price, and a USD figure that does NOT derive from the source beside it must say so in a form
       something checks. */
    if (quote.sourceCurrency) {
      const sc = quote.sourceCurrency, sp = path + ".sourceCurrency";
      if (typeof sc.currency !== "string" || sc.currency === "USD")
        push(sp + ".currency must name the NON-USD source currency (a USD source needs no conversion record)");
      if (!sc.values || typeof sc.values !== "object")
        push(sp + ".values must carry the first-party source figures");
      if (typeof sc.unit !== "string" || !sc.unit) push(sp + ".unit must state what the source figures are per");
      if (typeof sc.derivation !== "string" || !sc.derivation) push(sp + ".derivation must show the arithmetic");
      if (!/^https?:\/\/\S+$/.test(String(sc.sourceUrl || "")))
        push(sp + ".sourceUrl must be a RAW url (a consumer cannot follow a markdown literal)");
      if (!SOURCE_KINDS.includes(sc.sourceKind))
        push(sp + ".sourceKind must be one of " + JSON.stringify(SOURCE_KINDS)
          + " — calling a self-media relay a first-party notice is the overclaim this record exists to prevent");
      if (!sc.rate || typeof sc.rate !== "object") push(sp + ".rate must record the conversion rate or its absence");
      else {
        if (sc.rate.statedAtSource !== true && sc.rate.statedAtSource !== false)
          push(sp + ".rate.statedAtSource must say whether the rate was published or back-computed");
        if (sc.rate.statedAtSource === false && !Array.isArray(sc.rate.impliedRange))
          push(sp + ".rate.impliedRange is required when the rate is back-computed rather than sourced");
        if (Array.isArray(sc.rate.impliedRange) && typeof sc.rate.impliedRangeBasis !== "string")
          push(sp + ".rate.impliedRangeBasis must say what the range was computed FROM (a widened range with no source is a guess wearing a number)");
      }
      if (sc.derivesShippedValue !== true && sc.derivesShippedValue !== false)
        push(sp + ".derivesShippedValue must state, as a boolean, whether the shipped USD figure comes from this source");
      if (sc.derivesShippedValue === false && (typeof sc.shippedValueBasis !== "string" || !sc.shippedValueBasis))
        push(sp + ": a USD figure that does NOT derive from the adjacent source must carry shippedValueBasis saying where it DOES come from — otherwise the provenance sits beside a number it does not explain");
      /* `derivesShippedValue: true` must be PROVEN, not asserted. Without this, the honest claim and
         the dishonest one are indistinguishable to every consumer — which is what made the first cut
         of this record decoration rather than a data model. Recompute the endpoints from the source
         figures through the recorded rate and require the shipped triple to reproduce them. */
      if (sc.derivesShippedValue === true) {
        const rate = sc.rate && (typeof sc.rate.value === "number" ? [sc.rate.value, sc.rate.value]
          : Array.isArray(sc.rate.impliedRange) ? sc.rate.impliedRange : null);
        const div = typeof sc.perUnitDivisor === "number" ? sc.perUnitDivisor : 1;
        const tol = typeof sc.roundingTolerance === "number" ? sc.roundingTolerance : 0.01;
        if (!rate) push(sp + ": derivesShippedValue=true needs a rate (value or impliedRange) to recompute from");
        else if (!sc.values || typeof sc.values.lo !== "number" || typeof sc.values.hi !== "number")
          push(sp + ": derivesShippedValue=true needs numeric source values.lo/hi to recompute from");
        else {
          const band = (src) => [src / div / rate[1], src / div / rate[0]].sort((a, b) => a - b);
          for (const [end, srcV] of [["lo", sc.values.lo], ["hi", sc.values.hi]]) {
            const got = quote.usdPerHr && typeof quote.usdPerHr[end] === "number" ? quote.usdPerHr[end] : null;
            if (got === null) { push(sp + ": derivesShippedValue=true but usdPerHr." + end + " is not a number to check"); continue; }
            const [b0, b1] = band(srcV);
            if (got < b0 - tol || got > b1 + tol)
              push(sp + ": derivesShippedValue=true is FALSE by recomputation — " + srcV + " " + sc.currency
                + " at the recorded rate gives " + b0.toFixed(4) + "…" + b1.toFixed(4)
                + " but usdPerHr." + end + " is " + got + " (tolerance " + tol + ")");
          }
        }
      }
    }
  }
  const policy = registry.RENT_POLICY;
  if (!policy) push("RENT_POLICY: missing");
  else {
    if (!PLANNING_POLICIES.includes(policy.planningPolicy))
      push("RENT_POLICY: planningPolicy " + JSON.stringify(policy.planningPolicy)
        + " is outside the closed policy list");
    for (const [hwKey, quoteId] of Object.entries(policy.defaultRateId || {}))
      if (quoteId !== null && !Object.prototype.hasOwnProperty.call(quotes, quoteId))
        push("RENT_POLICY: defaultRateId." + hwKey + " names unknown quote " + JSON.stringify(quoteId));
    for (const [hwKey, replay] of Object.entries(policy.provisionalReplays || {})) {
      const path = "RENT_POLICY.provisionalReplays." + hwKey;
      checkObservation(path + ".usdPerHr", replay.usdPerHr, replay.observationKind);
      if (replay.basis !== "provisional")
        push(path + ": a declared replay is provisional by construction");
      if (!RATE_CLASSES.includes(replay.rateClass))
        push(path + ": rateClass " + JSON.stringify(replay.rateClass) + " is outside the closed class list");
    }
  }

  return { ok: errors.length === 0, errors };
}

/* ============================================================================
   REGIONS — im-arc T4 fold (2026-08-24): cluster 2 (electricity synthesis) §5.
   ============================================================================ */
const REGIONS = deepFreeze({
  "us-industrial": {
    usdPerKwh: { lo: 0.0617, mid: 0.0871, hi: 0.1053 },
    basis: "analyst-set", observationKind: "selected-span",
    source: "EIA Electric Power Monthly Tables 5.3 and 5.6.A, May-2026 data released 2026-07-23: Oklahoma 6.17c / US-weighted industrial average 8.71c / Virginia 10.53c selected as observed AI-host-state anchors.",
    sourceFile: "research/dives/im-arc/electricity-gptpro-2026-08-23.md",
    sourceNeedle: "Oklahoma 6.17¢",
    asOf: "2026-07-23",
    /* im-arc T4 fold (2026-08-24): the endpoints are a DECLARED HOST-STATE SELECTION, not a
       hyperscale contract and not a national percentile. The Fable arm's wider
       {0.050, ..., 0.115} (ERCOT all-in low, PJM capacity-step high) is held as a note. */
    note: "Observed state-anchor selected span; the middle assumption is the US-weighted May-2026 industrial average. Held and not adopted: the Fable arm's wider {0.050, 0.0871, 0.115} envelope (ERCOT all-in low, PJM capacity-step high).",
  },
  "cn-coastal": {
    usdPerKwh: { lo: 0.089, mid: 0.098, hi: 0.110 },
    basis: "measured/credibly-reported", observationKind: "tariff-derived-delivered",
    source: "State Grid/NDRC June-August 2026 coastal two-part industrial tariff components and OIES February-2026 delivered-cost ceiling; 24x7 TOU plus demand at 0.90 load factor, 657 kWh per kW-month; August conversion at 6.7817 CNY/USD.",
    sourceFile: "research/dives/im-arc/electricity-fable-2026-08-23.md",
    sourceNeedle: "`cn-coastal` → {0.089, 0.098, 0.110}",
    asOf: "2026-08-01",
    note: "Jiangsu 220 kV low, Jiangsu 110 kV TOU-weighted middle assumption, Pearl-Delta/Guangdong summer and OIES ceiling high. Nominal 2026 values; tariff month and FX date are explicit.",
  },
  "cn-western": {
    usdPerKwh: { lo: 0.060, mid: 0.071, hi: 0.087 },
    basis: "measured/credibly-reported", observationKind: "tariff-derived-delivered",
    source: "June-August 2026 standard delivered transmission-class grid tariffs: Gansu 0.0596, Ningxia 0.0685, western Inner Mongolia 0.0737, Guizhou 0.0871 per kWh, including demand at 0.90 load factor.",
    sourceFile: "research/dives/im-arc/electricity-gptpro-2026-08-23.md",
    sourceNeedle: "cn-western = { 0.060, 0.071, 0.087 } $/kWh",
    asOf: "2026-08-01",
    note: "ONE standard-grid region row (memo §5, review §6.5). Data-centre package prices are recorded below as structured provisional observations, never as a second peer generic row.",
    /* im-arc T4 fold (2026-08-24): the Ulanqab / Zhongwei / Qingyang data-centre package
       quotes are official-media figures whose demand-charge treatment is undisclosed, so they
       are structured observations on this row rather than a competing region. */
    provisionalObservations: [{
      label: "Western data-centre package prices (Ulanqab / Zhongwei / Qingyang)",
      usdPerKwh: { lo: 0.0442, mid: 0.0511, hi: 0.0587 },
      basis: "provisional", observationKind: "selected-span",
      source: "Official-media quoted data-centre package prices of CNY 0.30-0.398 per kWh converted at 6.7817 CNY/USD; the demand-charge treatment inside the package is not disclosed. The needle anchors the LOW endpoint (Ulanqab, quoted 2026-08-13); the high endpoint is carried in the same file by the Qingyang quote \"电价降至0.398元/千瓦时\" (Sina 2026-01-05) and the Xinhua Gansu 2026-04-29 restatement. im-arc T4 fold r2 (2026-08-25): the previous needle \"0.30\" resolved nowhere - the file writes the figure as 0.3, never 0.30.",
      sourceFile: "research/dives/im-arc/electricity-subagent-china-tariffs-2026-08-23.md",
      sourceNeedle: "乌兰察布的电价大约在0.3元/千瓦时",
      asOf: "2026-08-01",
    }],
  },
});

/* ============================================================================
   DATACENTERS — named facilities only. im-arc T4 fold: cluster 1 §1 and cluster 2 §5.
   ============================================================================ */
const DATACENTERS = deepFreeze({
  "xai-colossus-c1": {
    operator: "xAI", company: "xai",
    site: "Colossus C1, Memphis, Tennessee", region: "Memphis, Tennessee, US",
    regionRef: "us-industrial",
    facilityClass: "purpose-built-ai", facilityClassBasis: "analyst-set",
    /* im-arc T4 fold (2026-08-24), memo §1.1 [F2]: the live point(200000) H100 row is
       contradicted by BOTH arms. No per-SKU count is public, so the accelerator list is
       deliberately empty and the aggregate below carries the site's inventory in ONE
       unambiguous shape. Never fabricate a split to satisfy a count-shaped consumer. */
    accelerators: [],
    mixedAggregate: {
      count: { lo: 220000, mid: 225000, hi: 230000 },
      basis: "analyst-set", observationKind: "mixed-installed-aggregate",
      hwKeysPresent: ["h100", "h200", "gb200"], allocation: "unsplit",
      source: "Analyst-set selected span between two public aggregate readings: the 2026-05-06 xAI/Anthropic disclosure of more than 220,000 mixed NVIDIA GPUs (Pro arm top open) and the 230,000 July-2025 operational snapshot the Fable arm takes as its top assumption. Not a disclosed bounded interval.",
      sourceFile: "research/dives/im-arc/fleet-composition-synthesis-2026-08-23.md",
      sourceNeedle: "Mixed H100/H200/GB200 `{220,000, 230,000, open}`",
      asOf: "2026-05-06",
      note: "Held as a reading, not registered as counts: the Mirae Asset composition of about 150,000 H100 / 50,000 H200 / 20,000-30,000 GB200 (2026-05-08). The arms do not converge on it and the live schema will not carry an invented split.",
    },
    /* Named-site SERVING evidence replaces T2's singular `servesCompany`: xAI stays the
       operator/owner while Anthropic's Claude-serving capacity is the evidence that
       Anthropic's coverage consumes. Historical Grok TRAINING use is a dated note, not
       a current serving allocation. */
    servingEvidence: [
      { company: "anthropic", presets: ["opus", "sonnet", "haiku"], role: "serving-tenant",
        allocation: "unsplit", asOf: "2026-05-06",
        source: "SpaceX-Anthropic capacity announcement, 2026-05-06: more than 300 MW and over 220,000 NVIDIA GPUs of Colossus 1 capacity to improve Claude Pro and Max capacity." },
      { company: "xai", presets: [], role: "operator", allocation: "unsplit", asOf: "2026-05-06",
        source: "xAI operates and owns the site. Public statements place Grok TRAINING at Colossus and said in July 2025 that Grok inference was handled by cloud providers; no current site-level Grok serving allocation is disclosed." },
    ],
    /* A dated INITIAL-GENERATION milestone, kept separate from current inventory (review §1.1).
       It is not a competing estimate of the aggregate above. */
    milestones: [{
      hwKey: "h100", count: point(100000),
      basis: "disclosed installed count", observationKind: "milestone",
      source: "SpaceXAI prospectus approved 2026-06-05: the initial cluster of approximately 100,000 H100 processors.",
      sourceFile: "research/dives/im-arc/tco-inputs-gptpro-2026-08-23.md",
      sourceNeedle: "approximately **100,000 H100 processors**",
      asOf: "2026-06-05",
    }],
    /* im-arc T4 fold (2026-08-24), memo §5 [F8] — the ONE Memphis instruction. The live GSA
       energy-charge triple is withdrawn: GSA applies at <=5 MW contract demand and omits the
       fuel-cost adjustment and demand charges, and neither arm's Memphis envelope is xAI's
       bill. What stands is a Tennessee industrial REGION FILL, explicitly labeled as one. */
    electricity: {
      usdPerKwh: point(0.0645),
      tariffClass: "Tennessee May-2026 industrial average — region fill only",
      basis: "measured/credibly-reported", observationKind: "region-fill",
      source: "EIA Table 5.6.A May-2026 Tennessee industrial average 6.45c/kWh; the actual xAI MLGW/TVA contract bill is undisclosed.",
      asOf: "2026-07-23",
      note: "Both public Memphis envelopes are held as notes, not adopted: the Pro arm's {0.0757, 0.0804, 0.0974} and the Fable arm's {0.0645, 0.080, 0.117}. Neither is xAI's bill.",
    },
    pue: null, procurement: "mixed", rent: null, tco: {}, coverage: "partial",
    sourceFile: "research/dives/im-arc/electricity-fable-2026-08-23.md",
    sourceNeedle: "Tennessee industrial average **6.45 ¢ (May 2026)**",
    provenance: "As of 2026-08-24 the site carries a mixed installed aggregate of 220,000-230,000 H100/H200/GB200 with no public per-SKU split, a dated 100,000-H100 initial milestone, and named-site serving evidence that Anthropic runs Claude capacity here. Electricity is deliberately a Tennessee region fill, not a facility tariff: the prior MLGW GSA energy charge omits fuel and demand components and applies below 5 MW. PUE, grid/onsite share, contract terms and hardware-specific rent remain unregistered, so this row is partial. The mixed aggregate cannot feed per-SKU cost, fleet weights, procurement split, or the count-backed evidence share.",
  },
  "xai-colossus-ii": {
    operator: "xAI", company: "xai",
    /* Precise Tennessee compute site. Southaven, Mississippi holds power assets and the
       separate MACROHARDRR project — never a facility count for this row (memo §1.2). */
    site: "Colossus 2, South Memphis/Whitehaven, Tennessee", region: "Memphis, Tennessee, US",
    regionRef: "us-industrial",
    facilityClass: "purpose-built-ai", facilityClassBasis: "analyst-set",
    accelerators: [
      { hwKey: "gb200", count: point(110000), basis: "disclosed installed count",
        observationKind: "point",
        source: "SpaceXAI prospectus approved 2026-06-05: first cluster, approximately 110,000 GB200 processors, about 210 MW compute power.",
        asOf: "2026-06-05" },
      { hwKey: "gb300", count: point(110000), basis: "disclosed installed count",
        observationKind: "point",
        source: "SpaceXAI prospectus approved 2026-06-05: second cluster, approximately 110,000 GB300 processors, about 220 MW compute power.",
        asOf: "2026-06-05" },
    ],
    /* im-arc T4 fold (2026-08-24), memo §5: MLGW does not supply Colossus 2 and the onsite
       gas cost and dispatch share are not public, so no gas figure is registered and the row
       takes a TYPED generic-US inheritance — an explicit fallback, never a facility claim. */
    electricity: { inherit: "us-industrial" },
    pue: null, procurement: "mixed", rent: null, tco: {}, coverage: "partial",
    sourceFile: "research/dives/im-arc/electricity-subagent-named-facilities-2026-08-23.md",
    sourceNeedle: "MLGW is not supplying power to their supercomputer, Colossus 2",
    provenance: "As of 2026-06-05 the June-2026 prospectus supports two installed clusters of approximately 110,000 GB200 and 110,000 GB300; the later expansion of at least 220,000 further GB300 is planned, not installed, and stays out of inventory. The Memphis GSA claim is removed: the named-facilities report states MLGW is not supplying Colossus 2, and the onsite gas cost and share are undisclosed. These counts are valid PHYSICAL INVENTORY and are reported as such; by themselves they do not evidence a Grok inference allocation. The Anthropic allocation of the GB200 cluster by subtraction remains a note, not a count.",
    note: "Physical inventory types present at this site are reported separately from any serving-evidence claim (memo §1.5).",
  },
});

/* ============================================================================
   PROGRAMMES — programme evidence stays programme evidence. A multi-data-center
   programme milestone is NOT a named site (review fold F3).
   ============================================================================ */
const PROGRAMMES = deepFreeze({
  "deepseek-h800-serving-2025": {
    operator: "DeepSeek", company: "deepseek", programme: "Disclosed V3/R1 production serving trace",
    /* im-arc T4 fold (2026-08-24) [F9]: the 24-hour window is corrected (the live basis said
       "two-day") and the average/peak pair is TYPED as two load states rather than
       uncertainty endpoints. 226.75 x 8 = 1,814 average; 278 x 8 = 2,224 peak. */
    accelerators: [{ hwKey: "h800", count: { lo: 1814, mid: 1814, hi: 2224 },
      basis: "measured/credibly-reported", observationKind: "load-state-average-peak",
      source: "DeepSeek Open Infra Index 24-hour production trace, 2025-02-27 12:00 to 2025-02-28 12:00 UTC+8: 226.75 average and 278 peak eight-H800 nodes.",
      asOf: "2025-02-28" }],
    source: "DeepSeek 2025 production serving trace; no facility, title, or 2026 fleet total is disclosed.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "226.75 average and 278 peak eight-H800 nodes",
    asOf: "2025-02-28", coverage: "programme",
    provenance: "Historical programme evidence only, and only for the historical V3/R1 preset. The middle value is the disclosed average load state, not a current-fleet estimate, and it is never carried onto the V4 or V4-Flash fleets.",
  },
  "anthropic-rainier-trainium": {
    operator: "AWS/Anthropic", company: "anthropic", programme: "Project Rainier completed Trainium2 milestone",
    accelerators: [{ hwKey: "trn2", count: point(500000),
      basis: "disclosed installed count", observationKind: "milestone",
      source: "AWS Project Rainier page, 2025-10-29: nearly 500,000 Trainium2 chips across multiple US data centers.",
      asOf: "2025-10-29" }],
    source: "AWS Project Rainier public milestone; training and inference are programme-confirmed, but no per-site count or workload split is disclosed.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "Rainier: nearly 500,000 Trn2 across multiple data centers.",
    asOf: "2025-10-29", coverage: "programme",
    provenance: "A dated programme milestone across MULTIPLE data centers — which is why it is programme evidence and not named-site evidence (memo §1.3, review fold F3). It is not a facility inventory and not an uncertainty endpoint for Anthropic's later company-wide Trainium2 use.",
  },
  "anthropic-trn2-in-use-2026": {
    operator: "AWS/Anthropic", company: "anthropic", programme: "Anthropic-wide Trainium2 in-use floor",
    accelerators: [{ hwKey: "trn2", count: point(1000000),
      basis: "disclosed installed count", observationKind: "floor",
      source: "Anthropic, 2026-04-20: more than one million Trainium2 chips in use to train and serve Claude.",
      asOf: "2026-04-20" }],
    source: "Anthropic public AWS-compute update; company-wide AWS use, not Project Rainier alone and not a named facility.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "Anthropic aggregate: more than one million Trn2 in use by April 2026.",
    asOf: "2026-04-20", coverage: "programme",
    provenance: "A disclosed FLOOR, typed as one: the observation is 'more than one million', not 'exactly one million'. It must never be added to the Rainier milestone — the scopes overlap.",
  },
  "anthropic-tpu-commitment": {
    operator: "Anthropic/Google", company: "anthropic", programme: "TPU v7 capacity commitment",
    /* im-arc T4 fold (2026-08-24) [F9]: a CEILING typed as one. The live row rendered an
       up-to commitment as point(1000000) while its own basis said "not deployed", and v1's
       {0, 1e6, 1e6} pseudo-range read a ceiling as a selected span. Date corrected from the
       live month-end placeholder 2025-10-31 to the announcement date. */
    accelerators: [{ hwKey: "tpu7", count: point(1000000),
      basis: "disclosed installed count", observationKind: "ceiling",
      source: "Anthropic, 2025-10-23: up to approximately one million TPU v7 systems.",
      asOf: "2025-10-23" }],
    source: "Anthropic commitment ceiling. No site allocation and no deployed floor is public.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "first 400,000 TPUv7 systems are direct purchases",
    asOf: "2025-10-23", coverage: "programme",
    provenance: "The ceiling records the reported programme upper bound only. It is not an assertion that one million chips were deployed or co-located. The analyst component estimates below are components OF this ceiling, never additional to it.",
  },
  "anthropic-tpu7-direct-purchase-estimate": {
    operator: "Anthropic/Google/Broadcom", company: "anthropic",
    programme: "Estimated direct-purchase component of the TPU v7 commitment",
    accelerators: [{ hwKey: "tpu7", count: point(400000),
      basis: "analyst-set", observationKind: "point",
      source: "SemiAnalysis, 2025-11-28: the first 400,000 TPU v7 systems estimated as direct purchases.",
      asOf: "2025-11-28" }],
    source: "Named-analyst estimate carried independently by both arms; a component of, not additional to, the one-million ceiling.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "first 400,000 TPUv7 systems are direct purchases",
    asOf: "2025-11-28", coverage: "programme",
    componentOf: "anthropic-tpu-commitment",
    provenance: "A non-installed, non-facility COMPONENT observation. It is not an installed count and supplies no facility allocation. The finished-rack arithmetic it supports ($10bn / 400,000 = $25,000 per chip) attaches to the TPU v7 CAPEX row, not to a second evidence row (memo §1.3, fold F5.4).",
  },
  "anthropic-tpu7-gcp-rented-estimate": {
    operator: "Anthropic/Google Cloud", company: "anthropic",
    programme: "Estimated GCP-rented component of the TPU v7 commitment",
    accelerators: [{ hwKey: "tpu7", count: point(600000),
      basis: "analyst-set", observationKind: "point",
      source: "SemiAnalysis, 2025-11-28: the remaining 600,000 TPU v7 systems estimated as rented through GCP.",
      asOf: "2025-11-28" }],
    source: "Named-analyst estimate carried independently by both arms; a component of, not additional to, the one-million ceiling.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "remaining 600,000 are rented through GCP",
    asOf: "2025-11-28", coverage: "programme",
    componentOf: "anthropic-tpu-commitment",
    provenance: "A non-installed, non-facility COMPONENT observation. It is not an installed count and supplies no facility allocation.",
  },
  "anthropic-colossus-c1-capacity": {
    operator: "Anthropic/xAI", company: "anthropic", programme: "Claude capacity at Colossus C1",
    accelerators: [],
    source: "Anthropic announcement dated 2026-05-06: more than 300 MW and over 220,000 NVIDIA GPUs of Colossus 1 capacity for Claude; no tracked hardware-key split or modeled-fleet share is disclosed.",
    sourceFile: "research/dives/im-arc/electricity-fable-2026-08-23.md",
    sourceNeedle: ">300 megawatts … over 220,000 NVIDIA GPUs",
    asOf: "2026-05-06", coverage: "programme",
    provenance: "Named-site programme evidence, and it is the SAME evidence the xai-colossus-c1 servingEvidence entry carries — the one evidence resolver consumes it once, through the named-site channel, and this row never double-counts it. The empty accelerator list is deliberate: the statement gives an NVIDIA-family capacity total but allocates none of it across h100, h200, gb200 or gb300.",
  },
  "anthropic-spacexai-capacity-contract": {
    operator: "SpaceXAI/Anthropic", company: "anthropic",
    programme: "Colossus mixed-NVIDIA reserved-capacity contract",
    accelerators: [],
    source: "SpaceXAI SEC-filed materials, 2026-06-05: approximately 325,000 mixed NVIDIA GPUs across C1/C2 and $1.25 billion per month through May 2029.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "325,000 NVIDIA GPUs and $1.25 billion per month",
    asOf: "2026-06-05", coverage: "programme",
    /* im-arc T4 fold (2026-08-24), memo §1.3: the implied all-in rate is recorded here and
       kept OUTSIDE the planning-rent vector. It is reserved-capacity economics bundling CPUs,
       storage, networking, facility power and operations across two sites — not bare
       accelerator rent, and it can never be duplicated under a hardware key. */
    impliedAllInRate: { usdPerGpuHr: 5.27, basis: "measured/credibly-reported",
      note: "$1.25e9 / (325,000 x 730 h) = $5.27 per GPU-hour, all-in and multi-site. Deliberately outside the planning-rent vector." },
    provenance: "A measured/credibly-reported contract fact with an empty accelerator list: the mixed aggregate cannot be encoded per SKU without inventing a split. It awards no modeled-key evidence share and does not change the planning-rent vector.",
  },
  "google-spacexai-capacity-contract": {
    operator: "SpaceXAI/Google", company: "google",
    programme: "Future mixed-NVIDIA reserved-capacity contract",
    accelerators: [],
    source: "SpaceX SEC-filed materials, 2026-06-05: approximately 110,000 NVIDIA GPUs and $920 million per month from October 2026 through June 2029.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "110,000 NVIDIA GPUs and $920 million per month",
    asOf: "2026-06-05", coverage: "programme",
    impliedAllInRate: { usdPerGpuHr: 11.46, basis: "measured/credibly-reported",
      note: "$920e6 / (110,000 x 730 h) = $11.46 per GPU-hour, all-in. The exact SKU, site and workload allocation are undisclosed. Deliberately outside the planning-rent vector." },
    provenance: "A measured/credibly-reported future contract. It is an all-in reserved-capacity rate, not a bare hardware rent, and the accelerator list is deliberately empty. No TPU7 or NVIDIA modeled-key evidence share is awarded.",
  },
  "google-ironwood-ga": {
    operator: "Google", company: "google", programme: "Ironwood / TPU v7 Gemini serving platform",
    accelerators: [],
    source: "Google Cloud, 2025-11-06: Ironwood is generally available and purpose-built for high-volume, low-latency inference; Gemini trains and serves on TPUs.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "Ironwood/TPU v7 is directly linked to Gemini training and serving",
    asOf: "2025-11-06", coverage: "programme",
    provenance: "Platform and workload evidence only. The public 9,216-chip figure is a maximum superpod topology, not a deployed Gemini count; no internal Gemini facility or current TPU7 fleet allocation is disclosed. The empty accelerator list is deliberate: T2/T4 do not invent a count where the checked-in dives provide none.",
  },
  "ant-h20-production-node": {
    operator: "Ant Group", company: "ant", programme: "SGLang/Ant DeepSeek-R1 production node",
    accelerators: [{ hwKey: "h20", count: point(16),
      basis: "disclosed installed count", observationKind: "point",
      source: "LMSYS/Ant Attention-DP16 plus MoE-EP16 production decode instance: 16 H20 accelerators per instance.",
      asOf: "2025-09-26" }],
    source: "Existing hardware registry source note carries the 16-H20 production instance; it is not a fleet total or a named facility.",
    sourceFile: "site/engine-data-v22.js",
    sourceNeedle: "LMSYS/Ant 16×H20 Attention-DP16 + MoE-EP16 decode instance",
    asOf: "2025-09-26", coverage: "programme",
    provenance: "Instance-topology evidence only; no facility allocation or fleet count is inferred. im-arc T4 fold (2026-08-24): the ad-hoc basis 'disclosed accelerator count per production decode instance' migrates to the closed basis plus an explicit point observationKind.",
  },
  "huawei-cloudmatrix-384": {
    operator: "Huawei/SiliconFlow", company: "huawei", programme: "CloudMatrix 384 DeepSeek-R1 demonstration",
    accelerators: [{ hwKey: "ascend", count: point(384),
      basis: "disclosed installed count", observationKind: "point",
      source: "CloudMatrix-Infer system-level disclosure: a 384-NPU system demonstration.",
      asOf: "2025-06-18" }],
    source: "Existing DeepSeek/Ascend dives record a 384-NPU system demonstration; DeepSeek procurement is explicitly not established.",
    sourceFile: "research/provider-dives/deepseek-gptpro.md",
    sourceNeedle: "Huawei/SiliconFlow demonstrated DeepSeek-R1 inference on CloudMatrix 384",
    asOf: "2025-06-18", coverage: "programme",
    provenance: "Demonstration evidence only. It must not be represented as a DeepSeek facility or fleet allocation. im-arc T4 fold (2026-08-24): the ad-hoc basis 'disclosed system topology' migrates to the closed basis plus an explicit point observationKind.",
  },
  "deepseek-v4-ascend950-serving": {
    operator: "Huawei/cloud operators", company: "deepseek",
    programme: "DeepSeek V4 support on Ascend 950-series supernodes",
    accelerators: [],
    source: "Reuters reports dated 2026-04-24 and 2026-05-23: Ascend 950-series support for DeepSeek V4; no DeepSeek-owned count or site.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "V4 production support on Ascend 950-series supernodes",
    asOf: "2026-05-23", coverage: "programme",
    provenance: "Platform-support evidence, count unknown. Ascend 950-series is materially different from the live `ascend` key, which is the 910C; the accelerator list is empty precisely so no 910C proxy evidence share is created.",
  },
  "zai-third-party-cloud-inference": {
    operator: "Third-party Chinese cloud providers/Z.ai", company: "zhipu",
    programme: "Cloud-hosted GLM training, hosting, and inference",
    accelerators: [],
    source: "Knowledge Atlas Technology prospectus, 2025-12-30: trusted cloud-provider servers dispersed across China support training, hosting, and inference.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "operates on servers geographically dispersed across China",
    asOf: "2025-12-30", coverage: "programme",
    provenance: "A disclosed hosting model with no named provider, facility, accelerator type, production count, or own-versus-cloud share. It receives no modeled-key evidence share.",
  },
  "moonshot-kimi-k2-h800-training": {
    operator: "Moonshot", company: "moonshot", programme: "Kimi K2 H800 training topology",
    accelerators: [],
    source: "Kimi K2 Technical Report v2, 2026-02-03: H800 nodes with eight GPUs each; no node count or site.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "Kimi K2 was trained on H800 nodes with eight GPUs each",
    asOf: "2026-02-03", coverage: "programme",
    provenance: "Disclosed TRAINING hardware and node topology only. No inference allocation, node count, or facility is public, so the accelerator list is empty and the row earns no modeled-fleet evidence share.",
  },
  "moonshot-alibaba-hopper-2026": {
    operator: "Alibaba/Moonshot", company: "moonshot",
    programme: "Reported Alibaba Hopper-generation compute arrangement",
    accelerators: [],
    source: "Reuters relaying Bloomberg, 2026-07-31: a reported 20,000-chip arrangement; the exact Hopper SKU is disputed and the workload split is undisclosed.",
    sourceFile: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    sourceNeedle: "reported 20,000-chip Alibaba arrangement",
    asOf: "2026-07-31", coverage: "programme",
    provenance: "An aggregate-level contract claim whose exact SKU, site and training-versus-inference share are absent. No h800/h20 split is inferred, so the accelerator list is empty.",
  },
  "alibaba-ulanqab-m890": {
    operator: "Alibaba Cloud", company: "moonshot",
    programme: "Kimi K3 production service on Ulanqab M890 instances",
    accelerators: [],
    source: "Alibaba M890 launch reporting dated 2026-08-12/13 states that Kimi K3 and Qwen3.8-Max were already providing external service from Ulanqab; no mapped accelerator count is public.",
    sourceFile: "research/dives/im-arc/electricity-subagent-china-tariffs-2026-08-23.md",
    sourceNeedle: "Kimi K3 和 Qwen3.8-Max 均已通过该实例对外提供服务",
    asOf: "2026-08-13", coverage: "programme",
    provenance: "Programme and location evidence only. It establishes that some production-token service runs in a named western hub, but supplies neither a tracked hardware key nor a fleet count, so it does not move Moonshot's modeled-fleet percentage and does not make the western tariff its generic default.",
  },
});

/* ============================================================================
   RENT_QUOTES — the quote registry (memo §4, [F7]).
   A quote is an OBSERVATION of a named deal class. Selection is a separate statement:
   RENT_POLICY says which observation the planning vector takes and why.
   ============================================================================ */
const RENT_QUOTES = deepFreeze({
  /* ============================================================================
     OWNER-ADOPTED SCENARIO RENTS (2026-09-10), decision
     `d-20260910-im-adopt-fleet-rents-and-correct-grok`, answering card
     `q-im-unpriced-legs-and-grok-cache`.

     READ THE BASIS BEFORE THE NUMBER. These three rows are `provisional`, and that word is
     load-bearing: nobody publishes a GB200, GB300 or Trainium3 hour of the low/committed planning
     class, and both blind research arms said so. The T4 fold of 2026-08-24 therefore set the
     planning selection to `null` for all three and kept the retired points as declared replays a
     scenario had to name explicitly — which is why the published headline was computed on 52% of
     the declared fleet, renormalized, for the sixteen days since.

     The owner ruled that the disclosure was not enough and the fleet should be priced. That is a
     JUDGMENT ABOUT THE WORLD, not a measurement that arrived, and the row says so in the only place
     that matters — its `basis` and its `source`. The numbers themselves are unchanged from the
     replays they promote: the point is the selection, not a new estimate.

     Note what is NOT claimed: the Pro arm's recommendation of `null` over $4.50 stands as a
     recommendation, and `unavailableReason` below is kept verbatim rather than deleted, because the
     reason those rows had no public rate did not stop being true when the page decided to price
     them anyway. A reader who wants the pre-adoption reading can still reach it — the legs are
     priced by a named selection, so unselecting them is a scenario move like any other.
     ============================================================================ */
  "gb200-owner-adopted-scenario-2026-09": {
    hwKey: "gb200", usdPerHr: point(4.50),
    rateClass: "reserved-neocloud-estimate", term: "unspecified", region: "US, unspecified",
    configuration: "GB200 NVL72 accelerator-hour", bundleScope: "bare accelerator hour",
    basis: "provisional", observationKind: "point",
    source: "Owner ruling of 2026-09-10 on card q-im-unpriced-legs-and-grok-cache, adopting the T4 fold's declared provisional replay as the planning selection so the declared fleet is priced rather than renormalized away. NOT a rate that became public: no GB200 hour of the low/committed planning class is published, which is why this row is basis `provisional`.",
    sourceFile: "research/changelog.md",
    sourceNeedle: "owner-adopted scenario rents for GB200, GB300 and Trainium3",
    asOf: "2026-09-10",
    note: "Promotes provisionalReplays.gb200 unchanged at $4.50. The Pro arm's recommendation of null over $4.50 is not withdrawn; it is overridden by a stated judgment, and unavailableReason.gb200 is kept so the ground for it stays readable.",
  },
  "gb300-owner-adopted-scenario-2026-09": {
    hwKey: "gb300", usdPerHr: point(6.00),
    rateClass: "reserved-neocloud-estimate", term: "unspecified", region: "US, unspecified",
    configuration: "GB300 NVL72 accelerator-hour", bundleScope: "bare accelerator hour",
    basis: "provisional", observationKind: "point",
    source: "Owner ruling of 2026-09-10 on card q-im-unpriced-legs-and-grok-cache. NOT a published rate: no GB300 NVL72 rack rental is published by any provider the arms checked, and the one relayed list price conflicts with the other arm — which is what `provisional` records.",
    sourceFile: "research/changelog.md",
    sourceNeedle: "owner-adopted scenario rents for GB200, GB300 and Trainium3",
    asOf: "2026-09-10",
    note: "Promotes provisionalReplays.gb300 unchanged at $6.00. The GB300 row renders worse per token than GB200 at these pins, from its lower analyst-set decode efficiency against the higher pin; that ordering is inherited, not tuned here, and the round-4 estimate flagged doubting it.",
  },
  "trn3-owner-adopted-scenario-2026-09": {
    hwKey: "trn3", usdPerHr: point(2.20),
    rateClass: "reserved-neocloud-estimate", term: "unspecified", region: "US, unspecified",
    configuration: "Trainium3 accelerator-hour", bundleScope: "bare accelerator hour",
    basis: "provisional", observationKind: "point",
    source: "Owner ruling of 2026-09-10 on card q-im-unpriced-legs-and-grok-cache. NOT a published rate: both arms agree no public Trainium3 instance or UltraServer price exists, so neither side of the $/token identity is public for this row.",
    sourceFile: "research/changelog.md",
    sourceNeedle: "owner-adopted scenario rents for GB200, GB300 and Trainium3",
    asOf: "2026-09-10",
    note: "Promotes provisionalReplays.trn3 unchanged at $2.20.",
  },
  "h100-oneyear-lowcommitted-2026-08": {
    hwKey: "h100", usdPerHr: { lo: 2.35, mid: 2.40, hi: 3.19 },
    rateClass: "one-year-low-committed", term: "about one year", region: "US public neocloud",
    configuration: "H100 SXM, 8-GPU node", bundleScope: "bare accelerator hour",
    basis: "analyst-set", observationKind: "selected-span",
    source: "Both arms converge on a dated one-year / low-committed planning band: the SemiAnalysis one-year index point $2.35 with public reserved comparators to $3.19.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "the dated `{2.35, 2.40, 3.19}` planning band",
    asOf: "2026-08-22",
    note: "A one-year / low-committed PLANNING span, not a generic market rent. The middle assumption is unchanged from the live registry.",
  },
  "h200-reserved-neocloud-2026-08": {
    hwKey: "h200", usdPerHr: { lo: 3.00, mid: 3.68, hi: 3.99 },
    rateClass: "reserved-1-2yr", term: "about one to two years", region: "US public neocloud",
    configuration: "H200 SXM 141 GB", bundleScope: "bare accelerator hour",
    basis: "analyst-set", observationKind: "selected-span",
    source: "Pro arm primary derivation from Verda two-year/one-year discounts and Together 91-180 day cards, accessed 2026-08-22; the Fable arm's comparable public points do not contradict it.",
    sourceFile: "research/dives/im-arc/rental-rates-gptpro-2026-08-23.md",
    sourceNeedle: "**{3.00, 3.68, 3.99}**",
    asOf: "2026-08-22",
    note: "Public neocloud reserved, roughly one to two years. The middle assumption moves from the live $2.90 to $3.68 — a declared delta.",
  },
  "gb200-coreweave-public-slice-2026-08": {
    hwKey: "gb200", usdPerHr: point(10.50),
    rateClass: "on-demand-public-slice", term: "on demand", region: "US",
    configuration: "CoreWeave four-GPU GB200 NVL72 slice at $42.00/hour, including 144 vCPU, 960 GB RAM and 30.72 TB local storage",
    bundleScope: "slice including host CPU, RAM and local NVMe",
    basis: "measured/credibly-reported", observationKind: "point",
    source: "CoreWeave live price card accessed 2026-08-22: a four-GPU GB200 NVL72 instance at $42.00 per hour = $10.50 per GPU-hour.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "CoreWeave public four-GPU slice, $/GPU-h",
    asOf: "2026-08-22",
  },
  "gb200-aws-capacity-block-2026-08": {
    hwKey: "gb200", usdPerHr: point(10.582),
    rateClass: "capacity-block", term: "capacity block reservation", region: "US",
    configuration: "AWS 72-GPU GB200 UltraServer at $761.904 per rack-hour",
    bundleScope: "reserved full-rack system",
    basis: "measured/credibly-reported", observationKind: "point",
    source: "AWS Capacity Blocks price card accessed 2026-08-22: $761.904 per 72-GPU rack-hour = $10.582 per GPU-hour.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "AWS 72-GPU reservation / Capacity Block, $/GPU-h",
    asOf: "2026-08-22",
  },
  "gb200-public-slice-capacity-block-span-2026-08": {
    hwKey: "gb200", usdPerHr: { lo: 10.50, mid: 10.54, hi: 10.582 },
    rateClass: "on-demand-public-slice-and-capacity-block",
    term: "on demand and capacity block", region: "US",
    configuration: "spans the CoreWeave public NVL72 slice and the AWS 72-GPU Capacity Block",
    bundleScope: "mixed — slice with host resources at the low end, reserved full rack at the high end",
    basis: "measured/credibly-reported", observationKind: "selected-span",
    source: "Both arms converge on the narrow public slice / Capacity Block object; the class name states both observations it spans, and it is never the committed default.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "public CoreWeave/AWS planning band, $/GPU-h",
    asOf: "2026-08-22",
    note: "The stress / on-demand perspective consumes this alternate. It is not a confidential long-term contract and never becomes the planning default.",
  },
  "h20-china-specialist-bare-metal-2026-08": {
    hwKey: "h20", usdPerHr: { lo: 0.71, mid: 0.82, hi: 1.02 },
    rateClass: "monthly-term-bare-metal", term: "monthly / annual term", region: "China domestic specialists",
    /* The span deliberately crosses two configurations — stated here, on the hardware row,
       and in the tooltip, because the reader cannot otherwise tell the SKUs apart. */
    configuration: "crosses the 96 GB and the 141 GB H20 configurations: 96 GB on-demand at the low end, a 141 GB annual point at the high end",
    bundleScope: "bare metal",
    basis: "analyst-set", observationKind: "selected-span",
    source: "Both arms overlap once configuration and term are named; the Pro arm's primary specialist listings supply the middle.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "usable planning span `{0.71, 0.82, 1.02}`",
    asOf: "2026-08-22",
  },
  "h20-alibaba-managed-on-demand-2026-08": {
    hwKey: "h20", usdPerHr: { lo: 7.43, mid: 9.04, hi: 10.66 },
    rateClass: "managed-cloud-on-demand", term: "on demand", region: "China",
    configuration: "Alibaba managed public-cloud H20 instance", bundleScope: "managed cloud product",
    basis: "analyst-set", observationKind: "selected-span",
    source: "Pro arm names Alibaba's primary live specifications and unit conversion; the Fable arm supplies no contrary rate and says the prior $7+ top needed an attached URL.",
    /* FX PROVENANCE (GPT Pro 2026-07-29 rec 14, applied 2026-09-02): "A converted USD tariff should
       never appear to be a first-party disclosed USD price when the first-party source is
       denominated in CNY." It applied here — this row's own source line says "unit conversion" while
       the record carried only USD. The first-party quotes are CNY; the USD endpoints below are
       DERIVED. No number moves: this records what was already true. */
    sourceCurrency: {
      currency: "CNY", accessedAt: "2026-08-22",
      values: { lo: 50.32, hi: 72.24 }, unit: "CNY per accelerator-hour",
      configurations: { lo: "H20 96 GB", hi: "H20 141 GB" },
      derivation: "usdPerHr lo/hi are these quotes converted; mid is the arithmetic midpoint of the converted endpoints, not a separately quoted price.",
      /* `rateBasis`, not `basis`: the registry's `basis` is an ENUM the T4 schema guard scans for
         ad-hoc strings, and free text under that key would have poisoned the scan. The guard caught
         it; the field is renamed rather than the guard widened. */
      sourceKind: "primary-vendor-page",
      rate: { value: null, statedAtSource: false, impliedRange: [6.7726, 6.7767],
              impliedRangeBasis: "back-computed from the two published CNY/USD pairs on this row: 50.32/7.43 = 6.7726 and 72.24/10.66 = 6.7767",
              rateBasis: "IMPLIED from the published CNY/USD pairs (50.32→7.43, 72.24→10.66) — the dive does not state the rate it used, so this is back-computed and labelled rather than asserted. NOTE it differs from the 6.7817 CNY/USD recorded on the electricity row: same period, different day's spot.", statedAtSource: false },
      sourceUrl: "https://www.alibabacloud.com/help/en/rds/custom-ai/feature-overview/supported-specifications",
      derivesShippedValue: true,
    },
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "Alibaba managed public-cloud on-demand, $/accelerator-h",
    asOf: "2026-08-22",
    note: "A separate managed-product class. It is never blended with China specialist bare metal and it replaces the vague '$7+ hyperscaler on-demand' label the engine note carried.",
  },
  "tpu7-google-3yr-committed-2026-08": {
    hwKey: "tpu7", usdPerHr: { lo: 5.40, mid: 5.40, hi: 5.94 },
    rateClass: "committed-3yr-list", term: "three-year committed", region: "Iowa (middle) to London (high)",
    configuration: "TPU v7 Ironwood chip-hour", bundleScope: "published list tariff",
    basis: "disclosed tariff", observationKind: "selected-span",
    source: "Google published three-year committed TPU v7 regional list tariff; both arms carry it.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "Fold disclosed regional span; the present `$5.40` is specifically Iowa.",
    asOf: "2026-08-22",
    note: "The middle DELIBERATELY selects Iowa; it is not a distribution statistic across regions.",
  },
  "tpu7-anthropic-strategic-estimate-2025-11": {
    hwKey: "tpu7", usdPerHr: point(1.60),
    rateClass: "strategic-estimate", term: "multi-year strategic", region: "GCP",
    configuration: "Anthropic-scale rented TPU v7 tranche", bundleScope: "strategic contract estimate",
    basis: "analyst-set", observationKind: "point",
    source: "SemiAnalysis, 2025-11-28: approximately $1.60 per TPU-hour from GCP for Anthropic's rented tranche.",
    sourceFile: "research/dives/im-arc/rental-rates-fable-2026-08-23.md",
    sourceNeedle: "~$1.60 per TPU-hour from GCP",
    asOf: "2025-11-28",
    note: "Held out of the planning vector by BOTH the fleet and TCO syntheses. Recorded as a separate strategic-estimate observation; never the default.",
  },
  "trn2-aws-capacity-block-2026-08": {
    hwKey: "trn2", usdPerHr: point(2.235),
    rateClass: "capacity-block", term: "capacity block reservation", region: "US",
    configuration: "Trainium2 chip-hour", bundleScope: "published AWS Capacity Blocks rate",
    basis: "disclosed tariff", observationKind: "point",
    source: "AWS published Capacity Blocks rate for Trainium2, $2.235 per chip-hour; unchanged by this fold and carried by both arms.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "Both arms, AWS Capacity Blocks.",
    asOf: "2026-08-22",
  },
  "h800-china-annual-commit-2026-provisional": {
    hwKey: "h800", usdPerHr: point(1.75),
    rateClass: "one-year-low-committed", term: "annual commit", region: "China domestic",
    configuration: "H800 SXM 80 GB", bundleScope: "bare accelerator hour",
    basis: "provisional", observationKind: "point",
    source: "HELD at the live provisional point: the arms disagree materially — the Pro arm derives {1.05, 1.24, 1.49} and the Fable arm {1.61, 1.85, 2.16} over different populations, dates, packages and FX.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "Pro `{1.05,1.24,1.49}` versus Fable `{1.61,1.85,2.16}`",
    asOf: "2026-08-22",
    note: "Provisional and explicitly held pending a class-matched rerun. Not a folded market band.",
  },
  "ascend-tender-candidate-2026-provisional": {
    hwKey: "ascend", usdPerHr: point(1.95),
    rateClass: "tender-candidate", term: "tender candidate", region: "China domestic",
    configuration: "Ascend 910C NPU-hour", bundleScope: "quoted tender candidate",
    basis: "provisional", observationKind: "point",
    source: "RELABELLED: the Pro arm reports tender-candidate quotes and the Fable arm could not verify the procurement notice at all (the page renders blank without JS). This is not a final executed award.",
    sourceFile: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    sourceNeedle: "provisional tender-candidate quote",
    asOf: "2026-08-22",
    note: "The prior label claiming a final executed Huatai award is withdrawn. Value held; the label is downgraded to a provisional tender-candidate quote.",
    /* FX PROVENANCE (GPT Pro 2026-07-29 rec 14, applied 2026-09-02), and it turned up something
       sharper than the recommendation asked for. The first-party quotes behind this row are CNY per
       instance-MONTH. Converted the way the dive does them (÷730 h/month, ~6.77–6.79 CNY/USD) they
       imply roughly $1.72–$2.26 per NPU-hour. THE SHIPPED $1.95 IS NOT THAT CONVERSION: it is the
       PRIOR value, deliberately HELD when this row was relabelled from "final executed award" to
       "provisional tender candidate" (see `note`). So a USD point that does not derive from the CNY
       evidence was sitting beside it with nothing saying so — exactly the "converted USD tariff
       appearing to be a first-party disclosed USD price" hazard the recommendation names, in its
       sharper form. Recorded, not silently reconciled: changing 1.95 would move a displayed number
       and belongs to a data gate, not to a provenance repair. */
    sourceCurrency: {
      currency: "CNY", accessedAt: "2026-03-25", quotedAt: "2026-03-23",
      /* NOT first-party. The linked page is a Sina self-media relay of the tender figures, not the
         procurement issuer's notice — the review was right to flag "first-party quotes" as too
         strong, and sourceKind now says so in a form the validator reads. */
      values: { lo: 8500, hi: 11200 }, unit: "CNY per 910C instance-month",
      /* The source is per MONTH and the shipped figure is per HOUR, so a recomputation check must
         divide before converting — twice-derived, currency AND denominator. Recorded so the
         validator's arithmetic (and its error message) is right even though this row's flag is
         false; a future reconciliation flipping it to true then gets a real check, not a
         nonsense one. */
      perUnitDivisor: 730,
      derivation: "8,500/730 = 11.6438 CNY/h and 11,200/730 = 15.3425 CNY/h; at ~6.77–6.79 CNY/USD that is ~$1.72–$2.26 per NPU-hour. The reported framework total does not reconcile to simple unit-price multiplication, so only the published unit quotes are used.",
      /* The range is the SIBLING row's measured range, not a widened one. The first cut wrote
         [6.77, 6.79] with no source for the extra upper bound — a guess wearing a number, which the
         review caught. */
      sourceKind: "secondary-report",
      rate: { value: null, statedAtSource: false, impliedRange: [6.7726, 6.7767],
              impliedRangeBasis: "carried from the sibling Alibaba row, whose range IS measured from its own published CNY/USD pairs; no independent FX observation exists for the March quote, and none is invented here",
              rateBasis: "Period spot, back-computed from the sibling Alibaba row rather than stated at either source." },
      derivesShippedValue: false,
      shippedValueBasis: "$1.95 is a HELD PRIOR, carried through the 2026-08 relabelling; it is NOT the conversion above and sits ~$0.04 below its midpoint. Reconciling it is a data change, not a provenance change.",
      sourceUrl: "https://finance.sina.com.cn/wm/2026-03-25/doc-inhsfvzk6478059.shtml",
    },
  },
});

/* Selection is a POLICY statement, separate from the quotes it selects (memo §4).
   "One" is the policy — the low/committed planning observation for each hardware — not one
   literal contract class: H100 is about one-year/low-committed, H200 one-to-two-year reserved,
   H20 monthly/term bare metal, TPU v7 three-year committed, Trn2 Capacity Blocks. */
const RENT_POLICY = deepFreeze({
  planningPolicy: "low-committed",
  policyStatement: "the low/committed planning observation for each hardware — a selection policy, not one literal contract class",
  defaultRateId: {
    h100: "h100-oneyear-lowcommitted-2026-08",
    h200: "h200-reserved-neocloud-2026-08",
    /* im-arc T4 fold (2026-08-24), memo §4 GB200 CONDITIONAL, branch B.
       The condition was: keep point(4.50) ONLY if a sourceFile + sourceNeedle resolves to a
       checked-in dive or registry carrying the dated Jul-2026 neocloud range ($3.50-6/hr) the
       live row note cites. NONE resolves. Both blind arms failed to reproduce that range: the
       Pro arm carries no $3.50 figure at all and says outright that if the intended class is a
       confidential strategic deal the registry should hold `null`, not $4.50; the Fable arm's
       GB200 section carries {8.00, 10.50, 27.04} on demand, {10.58} capacity block and a
       one-arm committed {2.80, 4.20-4.50, 10.58} the synthesis holds out of registry rows. The
       only carriers of "$3.50-6/hr (Jul 2026)" are this project's OWN restatements of the same
       authored note (site/engine.js, site/engine-data-v22.js, site/index.html,
       research/grounding-ledger.md) — citing the note as its own source is circular, not
       provenance. So the default takes the unavailable-row path and $4.50 survives only as the
       declared provisional replay below. */
    /* 2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok: these three were
       null from the T4 fold to 2026-09-10, which is what made the published headline a reading over
       52% of the declared fleet. They now select the owner-adopted scenario rows above. The rows are
       `provisional` by basis and say why in their own source lines. */
    gb200: "gb200-owner-adopted-scenario-2026-09",
    gb300: "gb300-owner-adopted-scenario-2026-09",
    h800: "h800-china-annual-commit-2026-provisional",
    h20: "h20-china-specialist-bare-metal-2026-08",
    tpu7: "tpu7-google-3yr-committed-2026-08",
    trn2: "trn2-aws-capacity-block-2026-08",
    trn3: "trn3-owner-adopted-scenario-2026-09",
    ascend: "ascend-tender-candidate-2026-provisional",
  },
  /* A hardware with no admissible planning quote resolves through the T2 fix-2 unavailable-row
     path — the leg drops out of the renderable set with a stated reason. It NEVER silently
     falls back. These declared replays are the only way the retired points can price anything,
     and every one of them is explicit in the scenario, the share link and the MCP argument. */
  provisionalReplays: {
    gb200: { usdPerHr: point(4.50), basis: "provisional", observationKind: "point",
      rateClass: "reserved-neocloud-estimate",
      reason: "The retired live default. No checked-in dive carries the dated Jul-2026 neocloud $3.50-6/hr range it rested on; the Pro arm recommends null over $4.50.",
      declaredAs: "im-arc T4 fold declared provisional replay (2026-08-24)" },
    gb300: { usdPerHr: point(6.00), basis: "provisional", observationKind: "point",
      rateClass: "reserved-neocloud-estimate",
      reason: "The retired live default. The arms conflict directly — a one-arm Oracle $18 PAYG list against the Pro arm's finding that no NVL72 GB300 rack rate is published.",
      declaredAs: "im-arc T4 fold declared provisional replay (2026-08-24)" },
    trn3: { usdPerHr: point(2.20), basis: "provisional", observationKind: "point",
      rateClass: "reserved-neocloud-estimate",
      reason: "The retired live default. Both arms agree there is no public Trainium3 instance or UltraServer price.",
      declaredAs: "im-arc T4 fold declared provisional replay (2026-08-24)" },
  },
  unavailableReason: {
    gb200: "No public GB200 rate of the low/committed planning class resolves to a checked-in dive. The public slice and Capacity Block observations are a different, on-demand class and are registered as alternates, not as the planning default.",
    gb300: "No public GB300 NVL72 rack rental rate is published by any major provider the arms checked, and the one relayed list price directly conflicts with the other arm.",
    trn3: "No public Trainium3 instance or UltraServer price exists; neither side of the $/token identity is public for this row.",
  },
});

const WORDING = "share of the MODELED fleet resting on DC-specific public evidence — not how much of the real fleet is known";
/* im-arc T3 fix A1 (director reproduction, 2026-08-23): one lexical name is
   consumed by engine.js in the browser and exported unchanged in Node. */
const COVERAGE_WORDING = WORDING;

/* ============================================================================
   COVERAGE_LEDGER — im-arc T4 fold [F3]: EVIDENCE, keyed {company, preset}, at the
   hardware-key level. It stores NO percentages. The three-part partition and the
   non-additive SKU/workload count-backed share are DERIVED by the one resolver in
   engine.js (coverageForPreset) from the selected modeled blend, because a hand-stored
   percentage drifts the moment a blend changes — which is exactly what the T3 fix-3
   diagnostic showed for the static Anthropic 33/67.
   Resolver precedence, set-subtractive:
     (1) exact modeled keys with dated NAMED-SITE serving evidence;
     (2) exact modeled keys with qualifying PROGRAMME / type-and-quantity evidence,
         EXCLUDING keys already counted at (1);
     (3) all remaining keys are generic fill;
     (4) separately and NON-ADDITIVELY, the SKU/workload count-backed subset.
   ============================================================================ */
const COVERAGE_LEDGER = deepFreeze({
  anthropic: {
    company: "anthropic", asOf: "2026-08-24", wording: WORDING,
    rows: ["xai-colossus-c1"],
    programmes: ["anthropic-rainier-trainium", "anthropic-trn2-in-use-2026",
      "anthropic-tpu-commitment", "anthropic-tpu7-direct-purchase-estimate",
      "anthropic-tpu7-gcp-rented-estimate", "anthropic-colossus-c1-capacity",
      "anthropic-spacexai-capacity-contract"],
    presets: {
      opus: {
        preset: "opus", blendRef: "fleet:na-blend",
        namedSite: [{ rowId: "xai-colossus-c1", hwKeys: ["h100", "h200", "gb200"],
          allocation: "unsplit", asOf: "2026-05-06",
          evidence: "dated named-site serving evidence: Claude capacity at Colossus C1" }],
        programme: [{ rowId: "anthropic-tpu-commitment", hwKeys: ["tpu7"], asOf: "2025-10-23" },
          { rowId: "anthropic-rainier-trainium", hwKeys: ["trn2"], asOf: "2025-10-29" },
          { rowId: "anthropic-trn2-in-use-2026", hwKeys: ["trn2"], asOf: "2026-04-20" }],
        countBacked: [],
        notes: ["Rainier is a MULTI-data-center programme milestone and is counted as programme evidence, never as a named site (review fold F3).",
          "No count-backed share: the C1 per-SKU split and the St. Joseph site count are not public."],
      },
      sonnet: {
        preset: "sonnet", blendRef: "state:blend",
        namedSite: [{ rowId: "xai-colossus-c1", hwKeys: ["h100", "h200", "gb200"],
          allocation: "unsplit", asOf: "2026-05-06",
          evidence: "dated named-site serving evidence: Claude capacity at Colossus C1" }],
        programme: [{ rowId: "anthropic-tpu-commitment", hwKeys: ["tpu7"], asOf: "2025-10-23" },
          { rowId: "anthropic-rainier-trainium", hwKeys: ["trn2"], asOf: "2025-10-29" },
          { rowId: "anthropic-trn2-in-use-2026", hwKeys: ["trn2"], asOf: "2026-04-20" }],
        countBacked: [],
        notes: ["The same evidence set mapped onto the alternate modeled blend."],
      },
      haiku: {
        preset: "haiku", blendRef: "state:blend",
        namedSite: [{ rowId: "xai-colossus-c1", hwKeys: ["h100", "h200", "gb200"],
          allocation: "unsplit", asOf: "2026-05-06",
          evidence: "dated named-site serving evidence: Claude capacity at Colossus C1" }],
        programme: [{ rowId: "anthropic-tpu-commitment", hwKeys: ["tpu7"], asOf: "2025-10-23" },
          { rowId: "anthropic-rainier-trainium", hwKeys: ["trn2"], asOf: "2025-10-29" },
          { rowId: "anthropic-trn2-in-use-2026", hwKeys: ["trn2"], asOf: "2026-04-20" }],
        countBacked: [],
        notes: ["The same evidence set mapped onto the alternate modeled blend."],
      },
    },
  },
  openai: {
    company: "openai", asOf: "2026-08-24", wording: WORDING, rows: [], programmes: [],
    presets: {
      gpt: { preset: "gpt", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["The arms conflict on Abilene's workload and on strict programme treatment; no typed facility or programme accelerator key covers the modeled blend."] },
      terra: { preset: "terra", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [], notes: [] },
      luna: { preset: "luna", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [], notes: [] },
    },
  },
  google: {
    company: "google", asOf: "2026-08-24", wording: WORDING,
    rows: [], programmes: ["google-ironwood-ga", "google-spacexai-capacity-contract"],
    presets: {
      gemini: { preset: "gemini", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["TPU-family serving is public; current TPU7 count and internal site allocation are not disclosed.",
          "Platform and programme existence only — an empty programme accelerator list allocates none of the model."] },
      gemflash: { preset: "gemflash", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["TPU-family serving is public; current TPU7 count and internal site allocation are not disclosed."] },
    },
  },
  xai: {
    company: "xai", asOf: "2026-08-24", wording: WORDING,
    rows: ["xai-colossus-c1", "xai-colossus-ii"], programmes: [],
    presets: {
      grok: {
        preset: "grok", blendRef: "state:blend",
        /* im-arc T4 fold (2026-08-24), memo §3: the live 95% is withdrawn. The Colossus rows
           answer "do typed accelerator keys appear at a facility?", not "what share of the
           modeled Grok blend rests on site-specific SERVING evidence?" — and no current
           site/SKU Grok serving allocation is disclosed. Physical inventory is reported
           separately, in its own sentence, and never as coverage. */
        namedSite: [], programme: [], countBacked: [],
        physicalInventoryRows: [
          { rowId: "xai-colossus-c1", hwKeys: ["h100", "h200", "gb200"], asOf: "2026-05-06" },
          { rowId: "xai-colossus-ii", hwKeys: ["gb200", "gb300"], asOf: "2026-06-05" },
        ],
        physicalInventorySentence: "physical inventory types present: 100% of the modeled blend; current Grok inference allocation is not disclosed",
        notes: ["xAI's public physical inventory is unusually strong, and the modeled Grok SERVING coverage is nevertheless zero. The two statements are about different things."],
      },
    },
  },
  deepseek: {
    company: "deepseek", asOf: "2026-08-24", wording: WORDING,
    rows: [], programmes: ["deepseek-h800-serving-2025", "deepseek-v4-ascend950-serving"],
    presets: {
      dsr1: {
        preset: "dsr1", blendRef: "state:blend", namedSite: [],
        programme: [{ rowId: "deepseek-h800-serving-2025", hwKeys: ["h800"], asOf: "2025-02-28" }],
        countBacked: [{ rowId: "deepseek-h800-serving-2025", hwKeys: ["h800"], asOf: "2025-02-28",
          scope: "the disclosed 24-hour V3/R1 production serving trace" }],
        notes: ["The 2025 trace covers the modeled H800 leg for THIS historical preset only."],
      },
      dsv4: { preset: "dsv4", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["Ascend 950-series support cannot be credited to the 910C key, and the 2025 H800 trace is not a V4 allocation."] },
      dsv4f: { preset: "dsv4f", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["Ascend 950-series support cannot be credited to the 910C key, and the 2025 H800 trace is not a V4 allocation."] },
    },
  },
  zhipu: {
    company: "zhipu", asOf: "2026-08-24", wording: WORDING,
    rows: [], programmes: ["zai-third-party-cloud-inference"],
    presets: {
      glm: { preset: "glm", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["Domestic-platform and cloud-hosting presence has no exact modeled-SKU production allocation."] },
      glm47: { preset: "glm47", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["Domestic-platform and cloud-hosting presence has no exact modeled-SKU production allocation."] },
    },
  },
  moonshot: {
    company: "moonshot", asOf: "2026-08-24", wording: WORDING,
    rows: [], programmes: ["moonshot-kimi-k2-h800-training", "moonshot-alibaba-hopper-2026",
      "alibaba-ulanqab-m890"],
    presets: {
      kimi: { preset: "kimi", blendRef: "state:blend", namedSite: [], programme: [], countBacked: [],
        notes: ["H800 TRAINING topology and a reported Alibaba arrangement do not allocate the serving fleet.",
          "Ulanqab serving is programme and location evidence only; no typed h800/h20 allocation or count covers the modeled blend."] },
    },
  },
});

/* Fail closed at load: a registry that does not satisfy its own schema never reaches a
   consumer. This is the enforcement the memo's invariants rest on (§1.1, review §3.4). */
{
  const result = validateDcRegistry({ REGIONS, DATACENTERS, PROGRAMMES, RENT_QUOTES,
    RENT_POLICY, COVERAGE_LEDGER });
  if (!result.ok)
    throw new Error("engine-data-dc-v1.js failed its own registry schema:\n  "
      + result.errors.join("\n  "));
}

if (typeof module !== "undefined" && module.exports)
  module.exports = { REGIONS, DATACENTERS, PROGRAMMES, RENT_QUOTES, RENT_POLICY,
    COVERAGE_LEDGER, COVERAGE_WORDING, DC_SCHEMA, validateDcRegistry };
