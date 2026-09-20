/* im-arc T4 fold (2026-08-24) — the declared-delta MINT.
   Spec: research/im-arc-t4-fold-memo.md §6 [F10, F11].

   The T4 delta is a MACHINE-READABLE MANIFEST, not a prose paragraph: one
   { sink, old, new, cluster, evidence } entry per moved sink, plus the per-pair contract
   movement it authorizes. The parity and contract tests CONSUME it, so a number can only move
   here if this file says it moved and why.

   Run with no argument to REPORT the movement; run with --write to re-mint
   tests/fixtures-t4-declared-delta.json and tests/fixtures-baseline-v22.json together.
   The two are minted in one operation on purpose: a re-minted baseline whose authorization
   was written separately is a baseline nobody authorized.

   Usage: node tests/mint-t4-declared-delta.mjs [--write] */
import { createRequire } from "node:module";
import { writeFileSync, readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const DC = require("../site/engine-data-dc-v1.js");
const WRITE = process.argv.includes("--write");

/* ---------- 1. the moved SINKS, hand-declared with their evidence ---------- */
/* Every entry names the cluster whose synthesis moved it and the evidence that admitted it.
   `old` is the pre-T4 value on merged master ad7a214; `new` is what this fold registers. */
const SINKS = [
  /* ---- cluster 4 — TCO inputs (research/dives/im-arc/tco-inputs-synthesis-2026-08-23.md) ---- */
  { sink: "DEFAULTS.dcPerW", old: 12, new: 12.5, cluster: "tco-inputs",
    evidence: "analyst-set {9.5, 12.5, 17} frontier liquid-ready shell + MEP per delivered IT watt over dated JLL / Turner & Townsend / Epoch / Abilene anchors; both arms. The prior tooltip attribution could not be attributed to a public statement by either arm." },
  { sink: "DEFAULTS.dcLifeYears", old: 12, new: 15, cluster: "tco-inputs",
    evidence: "The facility life was a hard-coded literal 12 inside the shell term. It becomes a named default with an analyst-set {10, 15, 20} band from dated audited asset lives; 12 was a short-M&E case, not a defensible universal middle. Cost corners reversed." },
  { sink: "DEFAULTS.lifeYears band", old: "point 5", new: "{4, 5, 6}, cost corners {6, 5, 4}", cluster: "tco-inputs",
    evidence: "Audited issuer accounting policies (Nebius 4 -> 5 on 2026-01-01; MSFT/GOOG/ORCL/CRWV 6; Amazon AI subset 5). The MIDDLE is unchanged at 5; the band and its reversed cost corners are new." },
  { sink: "HW.h100.capex", old: 25000, new: 23750, cluster: "tco-inputs",
    evidence: "analyst-set {22000, 23750, 28000} per GPU, one eighth of a dated public analyst model's base 8-GPU server; both arms." },
  { sink: "HW.h200.capex", old: 32000, new: 36000, cluster: "tco-inputs",
    evidence: "analyst-set {32000, 36000, 40000} per GPU, module/base-system allocation over the dated public market range both arms carry." },
  { sink: "HW.gb200.capex", old: 45000, new: 43056, cluster: "tco-inputs",
    evidence: "analyst-set {41667, 43056, 47222} per GPU = one seventy-second of a $3.0m/$3.1m/$3.4m NVL72 BASE rack; both arms share the $3.1m base middle." },
  { sink: "HW.tpu7.capex", old: 35000, new: 25000, cluster: "tco-inputs",
    evidence: "$10bn / 400,000 finished racks = $25,000 per chip (SemiAnalysis 2025-11-28), carried by both arms. Already at installed-system scope." },
  { sink: "clusterOh(tpu7)", old: 1.30, new: 1.00, cluster: "tco-inputs",
    evidence: "capexScope installed-system: the finished-rack observation already contains its overhead, so multiplying it again double-counts." },
  { sink: "clusterOh(h800)", old: 1.30, new: 1.00, cluster: "tco-inputs",
    evidence: "capexScope installed-system: the registered $40,000 is an installed/all-in observation and was rendering as $52.0k." },
  { sink: "clusterOh(h20)", old: 1.30, new: 1.00, cluster: "tco-inputs",
    evidence: "capexScope installed-system: the registered $20,000 is an installed/all-in observation and was rendering as $26.0k." },
  { sink: "clusterOh(gb200)", old: 1.30, new: 1.26, cluster: "tco-inputs",
    evidence: "capexScope base-rack: the directly derived middle is $3.9m all-in / $3.1m base = 1.2581; both arms." },
  { sink: "EXEC_SUMMARY_ROWS.owned-tco.override.kwh", old: 0.07,
    new: "inherit REGIONS['us-industrial'] by id (0.0871)", cluster: "tco-inputs",
    evidence: "The 0.07 override has no dated source in any arm; both arms compute US rows at the registered EIA middle. The row now references the region BY ID so no literal can go stale." },
  { sink: "DEFAULTS.capitalRecovery", old: "absent", new: "\"off\"", cluster: "tco-inputs",
    evidence: "A new named basis with ONE canonical default, off, identical in the basic UI, the advanced UI, the codec and MCP. Inert at the default: the increment is zero at a zero rate." },
  /* r3 (2026-08-25): the three scenario fields below were added by this fold and were NOT named
     here until the round-3 completeness check — which derives the moved set by differencing the
     live engine's DEFAULTS against the base commit — caught them. Two are inert at their default
     and one is not; all three are declared now, because "it does not move the page-open number"
     is a reason to state a sink plainly, not a reason to omit it. */
  { sink: "DEFAULTS.capexScopeMode", old: "absent", new: '"scoped"', cluster: "tco-inputs",
    evidence: "The switch that selects capexScope-derived clustering overhead over the single global multiplier. This is the MECHANISM behind the four clusterOh(...) entries above: at \"scoped\" each hardware row takes the overhead its capex scope implies, at \"legacy-global\" every row takes the scenario value, which is how a pre-fold reading is restored. An arithmetic move in its own right." },
  { sink: "DEFAULTS.capexAbsLeg", old: "absent", new: null, cluster: "tco-inputs",
    evidence: "A donor-keyed absolute capex pin, the exact mirror of the existing rentAbsLeg. INERT at its null default: it prices nothing unless a state sets it. It exists so a published historical reading can pin the pre-fold capex points it was taken at, which is what the x90-v1/x90-v2 routes now do." },
  { sink: "DEFAULTS.rentRegistryPin", old: "absent", new: null, cluster: "rental-rates",
    evidence: "A donor-keyed pin of the REGISTERED planning-rent vector, applied below the reader controls so a route's own multipliers still apply. INERT at its null default. It exists because two rent middles moved and three rows lost their default to the unavailable-rate path, and a historical permalink must still resolve the vector it was taken at." },
  { sink: "DEFAULTS.costOfCapitalPct", old: "absent", new: 8.5, cluster: "tco-inputs",
    evidence: "analyst-set {6, 8.5, 13} %; both arms converge on the endpoints and bracket the middle. Consumed ONLY when capitalRecovery is on." },
  /* ---- cluster 3 — rental rates (research/dives/im-arc/rental-rates-synthesis-2026-08-23.md) ---- */
  { sink: "HW.h200.rent", old: 2.90, new: 3.68, cluster: "rental-rates",
    evidence: "Public neocloud reserved, roughly one to two years: {3.00, 3.68, 3.99} from the Pro arm's primary Verda/Together derivation, not contradicted by the Fable arm's comparables." },
  { sink: "HW.h20.rent", old: 1.00, new: 0.82, cluster: "rental-rates",
    evidence: "China specialist monthly/term bare metal {0.71, 0.82, 1.02}; both arms overlap once the 96 GB / 141 GB configuration and term are named. Alibaba managed on-demand is a separate class." },
  { sink: "HW.gb200.rent", old: 4.50, new: null, cluster: "rental-rates",
    evidence: "GB200 CONDITIONAL, branch B. No checked-in dive resolves the dated Jul-2026 neocloud $3.50-6/hr range the live note cited: the Pro arm carries no $3.50 figure at all and recommends registering null over $4.50; the Fable arm's GB200 section carries on-demand {8.00, 10.50, 27.04}, capacity block {10.58} and a one-arm committed band the synthesis holds out of registry rows. The only carriers of the cited range are this project's own restatements of the same authored note. The row takes the unavailable path; $4.50 survives as a declared provisional replay." },
  { sink: "HW.gb300.rent", old: 6.00, new: null, cluster: "rental-rates",
    evidence: "The arms conflict directly (a one-arm Oracle $18 PAYG list against the Pro arm's finding that no NVL72 GB300 rack rate is published). $6 survives only as a declared provisional replay." },
  { sink: "HW.trn3.rent", old: 2.20, new: null, cluster: "rental-rates",
    evidence: "Both arms agree no public Trainium3 instance or UltraServer price exists. $2.20 survives only as a declared provisional replay." },
  { sink: "HW.h100.rent band", old: "point 2.40", new: "{2.35, 2.40, 3.19}", cluster: "rental-rates",
    evidence: "One-year / low-committed planning span; both arms. The MIDDLE is unchanged." },
  { sink: "HW.tpu7.rent band", old: "point 5.40", new: "{5.40, 5.40, 5.94}", cluster: "rental-rates",
    evidence: "Google published three-year committed regional list tariff; the middle deliberately selects Iowa. The MIDDLE is unchanged." },
  { sink: "HW.ascend.rent label", old: "procurement-award class", new: "provisional tender-candidate quote", cluster: "rental-rates",
    evidence: "The Pro arm reports tender candidates, not a final executed award; the Fable arm could not verify the notice at all. Value HELD, label downgraded." },
  /* ---- cluster 2 — electricity (research/dives/im-arc/electricity-synthesis-2026-08-23.md) ---- */
  { sink: "REGIONS.us-industrial.usdPerKwh", old: { lo: 0.06, mid: 0.0871, hi: 0.12 },
    new: { lo: 0.0617, mid: 0.0871, hi: 0.1053 }, cluster: "electricity",
    evidence: "EIA Electric Power Monthly Tables 5.3/5.6.A, May-2026 data released 2026-07-23: a declared host-state selection (Oklahoma 6.17c to Virginia 10.53c) around the unchanged US-weighted middle. The MIDDLE does not move, so the page-open scalar is unchanged — but every advanced-band and region-selected state moves." },
  { sink: "REGIONS.cn-coastal.usdPerKwh", old: { lo: 0.083, mid: 0.097, hi: 0.108 },
    new: { lo: 0.089, mid: 0.098, hi: 0.110 }, cluster: "electricity",
    evidence: "August-2026 grid tables + TOU calendar at 0.90 load factor, 657 kWh per kW-month, FX stated; both arms and the China source report's primary tables." },
  { sink: "REGIONS.cn-western.usdPerKwh", old: { lo: 0.050, mid: 0.056, hi: 0.064 },
    new: { lo: 0.060, mid: 0.071, hi: 0.087 }, cluster: "electricity",
    evidence: "Standard 110 kV delivered grid tariffs (Gansu 0.0596, Ningxia 0.0685, western Inner Mongolia 0.0737, Guizhou 0.0871). The cheaper data-centre PACKAGE quotes are structured provisional notes, never a second peer region." },
  { sink: "DATACENTERS.xai-colossus-c1.electricity", old: { lo: 0.060, mid: 0.0625, hi: 0.065 },
    new: "point(0.0645), region-fill", cluster: "electricity",
    evidence: "The MLGW GSA energy charge applies below 5 MW and omits fuel and demand components; neither arm's Memphis envelope is xAI's bill. The row takes an explicitly labelled Tennessee industrial region fill." },
  { sink: "DATACENTERS.xai-colossus-ii.electricity", old: { lo: 0.060, mid: 0.0625, hi: 0.065 },
    new: "inherit us-industrial (0.0871)", cluster: "electricity",
    evidence: "MLGW does not supply Colossus 2 and the onsite gas cost and dispatch share are not public, so the row takes a typed generic-US inheritance — an explicit fallback, never a facility claim." },
  /* ---- cluster 1 — fleet composition (research/dives/im-arc/fleet-composition-synthesis-2026-08-23.md) ---- */
  { sink: "DATACENTERS.xai-colossus-c1.accelerators", old: "[{ h100, point(200000) }]",
    new: "[] + mixedAggregate {220000, 225000, 230000} across h100/h200/gb200, unsplit", cluster: "fleet-composition",
    evidence: "Both arms contradict the 200,000-H100 point: it was a historical H100-focused marketing snapshot, and later public statements describe a mixed site. No per-SKU split is public, so none is fabricated — which also means the row allocates NO fleet weights and composes no section." },
  { sink: "coverage(xai/grok)", old: "95 / 0 / 5", new: "0 / 0 / 100 + a separate physical-inventory sentence",
    cluster: "fleet-composition",
    evidence: "The Colossus rows answer 'do typed accelerator keys appear at a facility?', not 'what share of the modeled Grok blend rests on site-specific SERVING evidence?'. No current site/SKU Grok serving allocation is disclosed. Physical inventory is reported separately and is not coverage." },
  { sink: "coverage(anthropic/opus)", old: "0 / 33 / 67 (company-keyed)", new: "38 / 33 / 29, count-backed 0 (preset-keyed, derived)",
    cluster: "fleet-composition",
    evidence: "Named-site serving evidence at Colossus C1 covers h100+h200+gb200 of the na-blend; Rainier and the TPU commitment stay PROGRAMME evidence (a multi-data-center milestone is not a named site). Percentages are derived, never stored." },
  { sink: "PROGRAMMES.anthropic-rainier-trainium.count", old: { lo: 500000, mid: 500000, hi: 1000000 },
    new: "point(500000), milestone; the 1M floor becomes its own row", cluster: "fleet-composition",
    evidence: "Two dated milestones were encoded as one uncertainty interval. They are separate observations with different scopes and must never be added." },
  { sink: "PROGRAMMES.anthropic-tpu-commitment.asOf", old: "2025-10-31", new: "2025-10-23", cluster: "fleet-composition",
    evidence: "The live date was a month-end placeholder; the announcement date is authoritative." },
  { sink: "PROGRAMMES.deepseek-h800-serving-2025.basis", old: "disclosed average-to-peak deployment in a two-day historical trace",
    new: "measured/credibly-reported + observationKind load-state-average-peak, 24-hour window", cluster: "fleet-composition",
    evidence: "The trace runs 2025-02-27 12:00 to 2025-02-28 12:00 UTC+8 — 24 hours, not two days. Average and peak are two LOAD STATES, not uncertainty endpoints." },
];

/* Changes that carry NO arithmetic — listed separately so the delta above stays a list of
   moved numbers (memo §6). */
const EVIDENCE_ONLY = [
  "Coverage prose is now derived per {company, preset} and renders a three-part partition plus a subordinate non-additive SKU/workload count-backed line.",
  "Programme notes added with no accelerator counts: anthropic-colossus-c1-capacity, anthropic-spacexai-capacity-contract, google-spacexai-capacity-contract, deepseek-v4-ascend950-serving, zai-third-party-cloud-inference, moonshot-kimi-k2-h800-training, moonshot-alibaba-hopper-2026, alibaba-ulanqab-m890, anthropic-trn2-in-use-2026, anthropic-tpu7-direct-purchase-estimate, anthropic-tpu7-gcp-rented-estimate.",
  "The two bundled capacity contracts record their implied all-in rates ($5.27 and $11.46 per GPU-hour) OUTSIDE the planning-rent vector.",
  "The Colossus 2 site label distinguishes the Tennessee compute site from the Southaven, Mississippi power assets and the separate MACROHARDRR project.",
  "The three ad-hoc registry basis strings are migrated to the closed enum plus an explicit observationKind.",
  "opexPct is relabelled only: the numeric semantics and the band are HELD, and the tooltip now states 2.0 %/yr at 4 years, 1.6 % at 5 and about 1.33 % at 6.",
];

/* ---------- 2. the per-pair contract movement this manifest authorizes ---------- */
const BASELINE_PATH = new URL("./fixtures-baseline-v22.json", import.meta.url);
/* The OLD side is read from the archived pre-fold snapshot, never from the live file: minting
   twice against a file this script has already written would silently shrink the recorded
   movement to nothing, which is exactly the failure a declared delta exists to prevent. */
const PRE_FOLD_PATH = new URL("../im-arc/bak/tests/fixtures-baseline-v22.json.bak-2026-08-24-pre-im-arc-t4-fold", import.meta.url);
const baseline = JSON.parse(readFileSync(PRE_FOLD_PATH, "utf8"));
const pairMoves = [];
const nextPairs = {};
for (const [key, frozen] of Object.entries(baseline.pairs)) {
  const [modelId, perspId] = key.split("|");
  const model = E.MODELS.find(row => row.id === modelId);
  const perspective = E.PERSPECTIVES.find(row => row.id === perspId);
  if (!model || !perspective) { nextPairs[key] = frozen; continue; }
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const workload = E.workload(state);
  const fleet = { ...workload.fleetRenderable }; delete fleet.sections;
  const margin = isFinite(workload.margin) ? +(workload.margin * 100).toFixed(4) : null;
  const cOut = isFinite(workload.cOut) ? +workload.cOut.toFixed(5) : null;
  const moved = margin !== frozen.margin || cOut !== frozen.cOut
    || JSON.stringify(fleet) !== JSON.stringify(frozen.fleetRenderable);
  if (moved) pairMoves.push({ pair: key,
    old: { margin: frozen.margin, cOut: frozen.cOut,
      renderableLegs: frozen.fleetRenderable.renderableLegs },
    new: { margin, cOut, renderableLegs: fleet.renderableLegs },
    deltaPp: margin !== null && frozen.margin !== null ? +(margin - frozen.margin).toFixed(4) : null });
  nextPairs[key] = { ...frozen, margin, cOut, fleetRenderable: fleet };
}

const manifest = {
  migration: "im-arc T4 fold — the registry and the generic defaults come onto the four evidence clusters",
  commission: "im-arc-t4-fold-20260824",
  spec: "research/im-arc-t4-fold-memo.md",
  asOf: "2026-08-24",
  before: {
    receipt: "22baff3775438ce937d186721f0768e82c5071e4c887ccf985ca521308df5003",
    states: 273,
    ref: "merged master ad7a214 (TRANCHE-3 DONE)",
    /* r2 (2026-08-25): the base commit as a FIELD, not prose. tests/t4-historical-pins.mjs reads
       the pre-fold module bytes out of git at this commit rather than out of im-arc/bak/, because
       .gitignore states the project's own position on pre-edit archives — "redundant with git
       history once the edit lands". Git is content-addressed, so a pin that resolves through it
       cannot drift, and the receipt-reproduction gate stops depending on untracked provenance
       that a clean clone would not have. */
    baseCommit: "ad7a214",
    defaults: { kwh: 0.0871, pue: 1.25, dcPerW: 12, dcLifeYears: 12, lifeYears: 5,
      clusterOh: 1.30, opexPct: 8, capitalRecovery: "absent",
      rent: { h100: 2.40, h200: 2.90, gb200: 4.50, gb300: 6.00, h800: 1.75, h20: 1.00,
        tpu7: 5.40, trn2: 2.235, trn3: 2.20, ascend: 1.95 },
      capex: { h100: 25000, h200: 32000, gb200: 45000, gb300: 55000, h800: 40000, h20: 20000,
        tpu7: 35000, trn2: 15000, trn3: 20000, ascend: 23000 },
      regions: { "us-industrial": { lo: 0.06, mid: 0.0871, hi: 0.12 },
        "cn-coastal": { lo: 0.083, mid: 0.097, hi: 0.108 },
        "cn-western": { lo: 0.050, mid: 0.056, hi: 0.064 } },
      execSummaryOwnedTcoKwh: 0.07,
    },
  },
  entries: SINKS,
  evidenceOnly: EVIDENCE_ONLY,
  contractPairsMoved: pairMoves.length,
  contractPairs: pairMoves,
};

if (WRITE) {
  writeFileSync(new URL("./fixtures-t4-declared-delta.json", import.meta.url),
    JSON.stringify(manifest, null, 2) + "\n", "utf8");
  baseline.pairs = nextPairs;
  baseline.note = (baseline.note || "") +
    " RE-MINTED by the im-arc T4 fold (2026-08-24) under tests/fixtures-t4-declared-delta.json:" +
    ` ${pairMoves.length} of ${Object.keys(nextPairs).length} pairs moved. Every moved pair is` +
    " enumerated in that manifest with the sink and the evidence that moved it.";
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
  console.log(`wrote tests/fixtures-t4-declared-delta.json (${SINKS.length} sinks, ${pairMoves.length} moved pairs)`);
  console.log("re-minted tests/fixtures-baseline-v22.json");
} else {
  console.log(`${SINKS.length} declared sinks; ${pairMoves.length} of ${Object.keys(nextPairs).length} contract pairs moved`);
  for (const move of pairMoves.slice(0, 12))
    console.log(`  ${move.pair}: ${move.old.margin} -> ${move.new.margin} (${move.deltaPp} pp), legs ${move.old.renderableLegs} -> ${move.new.renderableLegs}`);
  if (pairMoves.length > 12) console.log(`  … and ${pairMoves.length - 12} more`);
}
