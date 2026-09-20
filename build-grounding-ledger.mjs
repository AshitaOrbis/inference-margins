// Generates research/grounding-ledger.md — the ADOPTED grounding ledger, machine-derived
// from the canonical preset registry (site/engine.js) + dossier annotations.
// Provenance class: RECONSTRUCTION of the adopted values (the original consultation pack's
// full row set lived in expired conversation-sandbox files; see the ledger header).
// Run: node build-grounding-ledger.mjs   (rerun after any preset change)
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("./site/engine.js");
const D = require("./site/engine-data-v22.js");

const lines = [];
const push = s => lines.push(s);
const esc = v => typeof v === "object" ? JSON.stringify(v) : String(v);

push(`# Adopted grounding ledger — machine-generated RECONSTRUCTION`);
push(``);
push(`> **What this is:** every parameter the calculator's presets pin, with value, source and evidence label, generated directly from the deployed preset registry (\`engine.js\` ${E.ENGINE_REVISION}), the live roofline/data registry (\`engine-data-v22.js\`), and their dossier annotations — so this page cannot drift from what the calculator actually computes.`);
push(`> **What this is not:** the original "192-row preset grounding pack" consultation artifact. That pack's full row set lived in conversation-sandbox files that expired; its adopted decisions are summarized in the [consultation page](https://margins.ashitaorbis.com/research/consult-preset-pack.html), and a dated author-model re-emission with delta notes is published as the [preset-pack re-audit](https://margins.ashitaorbis.com/research/consult-preset-pack-reaudit.html). Where any re-emission differs from this ledger, **this ledger (the adopted values) wins.**`);
push(`> Generated ${E.DATA_AS_OF} · labels: DISCLOSED / CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION (from the on-page dossiers).`);
push(``);

let rows = 0;
push(`
## How to read this page

Every row is one setting the calculator pins, and the name in the first column is the engine's own
field name — the same string the MCP connector returns — so this page can be checked against the
code rather than against prose. The translation:

| you will see | it means |
|---|---|
| \`active\` / \`total\` | active and total parameters, in billions. Active is what a token actually touches; total is what has to fit in memory |
| \`precision\` | the number format weights and activations are served in (FP8, FP4, BF16) — it fixes how many bytes and operations each token costs |
| \`priceIn\` / \`priceOut\` | published list price per million input / output tokens |
| \`cacheReadMult\` / \`cacheWriteShare\` | what a cached input token bills, as a percentage of the fresh input price / how much traffic pays a cache-write premium |
| \`nativeTraffic\` | the traffic mix held fixed for this preset: input:output ratio and cache-hit share |
| \`ioRatio\` / \`cacheHit\` / \`billCacheHit\` | that mix, dial by dial. \`billCacheHit\` is the share of ALL input tokens billed as cached, not the share of cached ones |
| \`hwMode\` | \`rent\` values an accelerator-hour at a rental rate; \`tco\` builds it from purchase price, power, datacenter and operations |
| \`rentMult\` / \`rentMultLeg\` / \`rentMultFam\` | procurement: a multiplier on the registered accelerator-hour price, applied to everything, to one accelerator, or to a hardware family |
| \`util\` | paid-capacity utilization, in percent. It is a divisor on every cost, so paid idle time lands on the tokens actually served |
| \`stackMult\` | serving-stack efficiency against published open practice; 1.0 is open-source-level |
| \`trendMonths\` / \`trendRate\` | the assumed algorithmic lead in months, and the yearly efficiency rate it converts through. 0 months means no lead assumed |
| \`blend\` | the fleet: each accelerator's share of served tokens, summing to 100 |
| \`specDec\` | a speculative-decoding throughput multiplier |
| \`effDec\` / \`effPre\` | **retired legacy fields.** They are not what the live model uses. The deployed decode efficiency is \`etaDec\` in the calibration registry, with a stated calibration class per accelerator, and prefill uses one shared fitted value transferred to every leg. The two are far apart — the H100's retired \`effDec\` reads 0.07 where its deployed \`etaDec\` is 0.313491 — so a row quoting the retired field describes nothing the calculator computes |
| \`etaDec\` / \`etaStatus\` | the **efficiency factor (η)** for decode and the calibration class that says how it was set: fitted, borrowed, analyst-set or projection. η is the fraction of the accelerator's *active roofline limit* actually reached, and it is not MFU, which is compute-only |
| \`rent\` / \`capex\` | the registered accelerator-hour rental rate / purchase price |
| \`hbm\` / \`bw\` / \`flopsFp8\` / \`tdp\` | accelerator memory in GB, memory bandwidth in TB/s, FP8 compute, thermal design power |

**The labels in the last column grade the SOURCE of the value, not its truth**: DISCLOSED (a
party stated it), CREDIBLY REPORTED (reputable reporting or a measured benchmark), COMMUNITY
ESTIMATE (a public technical estimate with a stated method), SPECULATION (this page's own
assumption). A DISCLOSED price is a fact about a price list; a SPECULATION parameter is this
page's declared guess, and the calculator exists so you can disagree with it.
`);
push(`## Model presets`);
for (const m of E.MODELS) {
  const d = E.DOSSIERS.models[m.id] || { params: {} };
  push(``);
  push(`### ${m.name}${m.scenario ? " — TARIFF SCENARIO" : ""}${m.spec ? " (speculative sizes)" : ""}`);
  push(``);
  push(`| parameter | adopted value | source | label |`);
  push(`|---|---|---|---|`);
  for (const [k, v] of Object.entries(m.set)) {
    const a = (d.params || {})[k] || {};
    push(`| \`${k}\` | ${esc(v)} | ${a.src || "—"} | ${a.label || "—"} |`); rows++;
  }
  const prof = E.TRAFFIC_PROFILES.find(t => t.id === m.nativeTraffic);
  if (prof) {
    // Native-profile row carries ONLY the profile's own provenance; dive traffic (which can
    // differ, e.g. Grok native 15:1/60 vs dive 3:1/0) appears solely in the dive.* rows below —
    // appending dossier dive annotations here produced contradictory adjacent rows (final gate).
    const aIo = m.nativeTrafficWasExplicit ? ((d.params || {}).ioRatio || {}) : {};
    push(`| \`nativeTraffic\` | ${prof.name} (${prof.ioRatio}:1 / ${prof.cacheHit}%) | ${prof.provenance}${aIo.src ? " · " + aIo.src : ""} | ${aIo.label || (m.nativeTrafficWasExplicit ? "COMMUNITY ESTIMATE" : "calculator default")} |`); rows++;
  }
  if (m.dive) {
    for (const [k, v] of Object.entries(m.dive)) {
      push(`| \`dive.${k}\` | ${esc(v)} | §10 dive replay (see the provider dive in this annex) | dive assumption |`); rows++;
    }
  }
  /* A preset can carry a tariff object whose scheduled change has since been CANCELLED, leaving
     validUntil and flipTo undefined. Emitting the row anyway printed
     "| `tariff.validUntil` | undefined → undefined | undefined |", which tells a reader nothing and
     reads as a defect in the registry. Emit the row only when there is a change to state. */
  if (m.tariff && m.tariff.validUntil !== undefined && m.tariff.flipTo !== undefined) {
    push(`| \`tariff.validUntil\` | ${m.tariff.validUntil} → ${esc(m.tariff.flipTo)} | ${m.tariff.note} | DISCLOSED |`); rows++;
  }
}

push(``);
push(`## Perspective presets`);
for (const p of E.PERSPECTIVES) {
  const d = E.DOSSIERS.perspectives[p.id] || { params: {} };
  push(``);
  push(`### ${p.name}`);
  push(``);
  if (!Object.keys(p.set).length) { push(`_Sets nothing — replays the model's own §10 dive fields (see each model's \`dive.*\` rows)._`); continue; }
  push(`| parameter | adopted value | source | label |`);
  push(`|---|---|---|---|`);
  for (const [k, v] of Object.entries(p.set)) {
    const a = (d.params || {})[k] || {};
    push(`| \`${k}\` | ${esc(v)} | ${a.src || "—"} | ${a.label || "—"} |`); rows++;
  }
}

push(``);
push(`## Traffic-mix profiles (v2.1.2 axis)`);
push(``);
push(`| profile | I/O | cache hit | provenance |`);
push(`|---|---|---|---|`);
for (const t of E.TRAFFIC_PROFILES) { push(`| ${t.name} | ${t.ioRatio}:1 | ${t.cacheHit}% | ${t.provenance} |`); rows++; }

push(``);
push(`## Hardware table (per-platform adopted values)`);
push(``);
push(`The numerical roofline path reads \`HW_ROOFLINE\`, \`CALIBRATION\`, and \`PREFILL_CAL\`; the retired \`HW.*.effDec/effPre\` compatibility fields are deliberately absent.`);
push(``);
push(`| platform | parameter | adopted value | provenance / status |`);
push(`|---|---|---|---|`);
for (const k of E.HW_ORDER) {
  const h = E.HW[k];
  const roof = D.HW_ROOFLINE[k];
  const cal = D.CALIBRATION[k];
  const safe = value => String(value ?? "—").replace(/\|/g, "/");
  const add = (parameter, value, provenance) => {
    push(`| ${h.name} | \`${parameter}\` | ${safe(value)} | ${safe(provenance)} |`);
    rows++;
  };
  for (const precision of ["bf16", "fp8", "fp4"]) {
    if (roof.flops[precision] != null)
      add(`flops.${precision}`, `${roof.flops[precision]} FLOP/s`,
        roof.prov[`flops.${precision}`] || "registered derived/fallback precision cell");
  }
  add("hbmBytes", `${roof.hbmBytes} B (${(roof.hbmBytes / 1e9).toFixed(3)} decimal GB)`, roof.prov.hbmBytes);
  add("bwHBM", `${roof.bwHBM} B/s`, roof.prov.bwHBM);
  add("fabric", `${roof.fabric} B/s`, roof.prov.fabric);
  add("nShard", roof.nShard, `${roof.nShardDimension}; ${roof.prov.nShard}`);
  add("etaDec", cal.etaDec, `${cal.etaStatus}; evidence=${cal.throughputEvidenceClass}; ${cal.deployedBasis}`);
  add("decodeTrafficBasis", cal.decodeTrafficBasis,
    `paired eta representation=${cal.etaRepresentation}; nPhysDeclared=${cal.nPhysDeclared}; sources=${cal.sourceRefs.join("; ")}`);
  add("etaPre", D.PREFILL_CAL.etaPre, `${D.PREFILL_CAL.status[k]}; ${D.PREFILL_CAL.prov}`);
  add("rent", `$${h.rent}/hr`, `price evidence=${D.PRICE_EVIDENCE[k]}; economic basis note below`);
  add("capex", `$${h.capex}`, "engine.js HW economic input; economic basis note below");
  add("tdp", `${h.tdp} kW`, "engine.js HW economic input; economic basis note below");
  add("economicBasisNote", "—", h.note);
}

push(``);
push(`_${rows} parameter rows, regenerated from the registry on every run — \`node build-grounding-ledger.mjs\`._`);
writeFileSync("research/grounding-ledger.md", lines.join("\n") + "\n");
console.log(`written: research/grounding-ledger.md (${rows} rows)`);
