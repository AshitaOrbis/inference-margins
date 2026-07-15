// Generates research/grounding-ledger.md — the ADOPTED grounding ledger, machine-derived
// from the canonical preset registry (site/engine.js) + dossier annotations.
// Provenance class: RECONSTRUCTION of the adopted values (the original consultation pack's
// full row set lived in expired conversation-sandbox files; see the ledger header).
// Run: node build-grounding-ledger.mjs   (rerun after any preset change)
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("./site/engine.js");

const lines = [];
const push = s => lines.push(s);
const esc = v => typeof v === "object" ? JSON.stringify(v) : String(v);

push(`# Adopted grounding ledger — machine-generated RECONSTRUCTION`);
push(``);
push(`> **What this is:** every parameter the calculator's presets pin, with value, source and evidence label, generated directly from the deployed preset registry (\`engine.js\` ${E.ENGINE_REVISION}) and its dossier annotations — so this page cannot drift from what the calculator actually computes.`);
push(`> **What this is not:** the original "192-row preset grounding pack" consultation artifact. That pack's full row set lived in conversation-sandbox files that expired; its adopted decisions are summarized in the [consultation page](consult-preset-pack.html), and a dated author-model re-emission with delta notes is published as the [preset-pack re-audit](consult-preset-pack-reaudit.html). Where any re-emission differs from this ledger, **this ledger (the adopted values) wins.**`);
push(`> Generated ${E.DATA_AS_OF} · labels: DISCLOSED / CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION (from the on-page dossiers).`);
push(``);

let rows = 0;
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
  if (m.tariff) { push(`| \`tariff.validUntil\` | ${m.tariff.validUntil} → ${esc(m.tariff.flipTo)} | ${m.tariff.note} | DISCLOSED |`); rows++; }
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
push(`| platform | dense FP8 PF | HBM GB | BW TB/s | rent $/hr | capex $ | effDec | effPre | note |`);
push(`|---|---|---|---|---|---|---|---|---|`);
for (const k of E.HW_ORDER) {
  const h = E.HW[k];
  push(`| ${h.name} | ${h.flopsFp8} | ${h.hbm} | ${h.bw} | ${h.rent} | ${h.capex} | ${h.effDec} | ${h.effPre} | ${h.note.replace(/\|/g, "/")} |`); rows++;
}

push(``);
push(`_${rows} parameter rows, regenerated from the registry on every run — \`node build-grounding-ledger.mjs\`._`);
writeFileSync("research/grounding-ledger.md", lines.join("\n") + "\n");
console.log(`written: research/grounding-ledger.md (${rows} rows)`);
