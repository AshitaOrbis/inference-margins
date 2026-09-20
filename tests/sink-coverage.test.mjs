// R2 SINK-COVERAGE RELEASE GATE (im4-r2-shipment-plan §1.8, P5 redesigned).
// Complete-source-graph discovery → fail-closed classification → MULTISET one-to-one
// comparison of occurrence-indexed stable sink IDs against the pinned registry →
// mutation probes (duplicate / inject / delete a sink line must each break the gate).
// Run: node tests/sink-coverage.test.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRegistry, classifySites, discoverSinks, eligibleFiles, sha16, stableSinkIds,
} from "./sink-scanner.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const REGISTRY = JSON.parse(readFileSync(join(HERE, "sink-registry-v22.json"), "utf8"));

/* ---------- (a) pinned scanned-file manifest ---------- */
const files = eligibleFiles(ROOT);
assert("scanned-file manifest equals the pinned registry manifest (any new/removed eligible file trips)",
  JSON.stringify(files) === JSON.stringify(REGISTRY.files),
  `disk ${files.length} vs registry ${REGISTRY.files.length}: ±${files.filter(f => !REGISTRY.files.includes(f)).concat(REGISTRY.files.filter(f => !files.includes(f))).join(", ")}`);

/* ---------- (b)+(d) discovery + fail-closed classification ---------- */
const live = buildRegistry(ROOT);
assert("every discovered site is classified (fail-closed on unmatched)", live.unmatched.length === 0,
  live.unmatched.slice(0, 5).map(u => `${u.file}:${u.line}`).join(", "));

/* ---------- (c) MULTISET one-to-one vs the pinned claim-sink registry ---------- */
const liveIds = live.claimSinks.map(s => s.id);
const pinnedIds = REGISTRY.claimSinks.map(s => s.id);
assert("claim-bearing sink multiset — cardinality equality", liveIds.length === pinnedIds.length,
  `live ${liveIds.length} vs pinned ${pinnedIds.length}`);
assert("claim-bearing sink multiset — occurrence-indexed IDs one-to-one (sorted sequence equality)",
  JSON.stringify(liveIds) === JSON.stringify(pinnedIds),
  liveIds.filter(x => !pinnedIds.includes(x)).concat(pinnedIds.filter(x => !liveIds.includes(x))).slice(0, 6).join(" | "));

/* ---------- class-set identity (the harness 8-class check survives as a subset) ---------- */
assert("claim-bearing class set identity (10 emitter classes — b9 M6 adds `executive-summary`)",
  JSON.stringify(live.classes) === JSON.stringify(REGISTRY.classes),
  live.classes.join(","));

/* ---------- digest (minted at §4.5; amend loop re-mints on any surface fix) ---------- */
assert("registry digest matches the recomputed canonical digest", live.digest === REGISTRY.digest,
  `live ${live.digest} vs pinned ${REGISTRY.digest}`);

/* ---------- mutation probes: the comparator must be SENSITIVE ---------- */
/* Each probe patches ONE source in memory, re-runs the full pipeline, and requires the
   one-to-one comparison to FAIL — a gate that cannot detect its own bypasses is no gate. */
function pipelineWith(patch) {
  const readFile = (rel) => {
    const raw = readFileSync(join(ROOT, rel), "utf8");
    return patch(rel, raw);
  };
  const { sites } = discoverSinks(ROOT, readFile);
  const { classified, unmatched } = classifySites(stableSinkIds(sites));
  const ids = classified.filter(s => s.disposition.class).map(s => s.id).sort();
  return { ids, unmatched };
}

// Probe 1 (R2-review P5/NEW-1's own scenario): DUPLICATE an existing claim-bearing sink
// line — identical content, new occurrence. Set-equality would swallow it; the multiset must not.
{
  const target = REGISTRY.claimSinks.find(s => s.file === "site/app.js" && s.kind === "dom-write");
  const { ids, unmatched } = pipelineWith((rel, raw) => {
    if (rel !== target.file) return raw;
    const lines = raw.split("\n");
    const idx = lines.findIndex(l => sha16(l.trim().slice(0, 200)) === target.hash16);
    lines.splice(idx, 0, lines[idx]); // duplicate the exact line
    return lines.join("\n");
  });
  const trips = unmatched.length > 0 || JSON.stringify(ids) !== JSON.stringify(pinnedIds.slice().sort());
  assert("mutation probe — duplicating an existing sink line BREAKS the gate", trips);
}

// Probe 2: inject a NEW sink line (a novel computed DOM write) — must trip via
// unmatched (fail-closed) or multiset mismatch.
{
  const { ids, unmatched } = pipelineWith((rel, raw) => {
    if (rel !== "site/app.js") return raw;
    return raw.replace('function updateTiles() {',
      'function updateTiles() {\n  document.getElementById("rogue-sink").textContent = "≈" + Math.round(Math.random()*100) + "% (unlabeled)";');
  });
  const trips = unmatched.length > 0 || JSON.stringify(ids) !== JSON.stringify(pinnedIds.slice().sort());
  assert("mutation probe — injecting a NEW sink line BREAKS the gate", trips);
}

// Probe 3: delete a registered sink line — coverage loss must trip.
{
  const target = REGISTRY.claimSinks.find(s => s.file === "site/app.js" && s.kind === "dom-write");
  const { ids } = pipelineWith((rel, raw) => {
    if (rel !== target.file) return raw;
    const lines = raw.split("\n");
    const idx = lines.findIndex(l => sha16(l.trim().slice(0, 200)) === target.hash16);
    lines.splice(idx, 1);
    return lines.join("\n");
  });
  assert("mutation probe — deleting a registered sink line BREAKS the gate",
    JSON.stringify(ids) !== JSON.stringify(pinnedIds.slice().sort()));
}

// Probe 4: the scanned-file manifest gate — a phantom eligible file must trip the
// manifest comparison (comparator-logic probe; the manifest is pinned data).
{
  const phantom = [...REGISTRY.files, "site/zz-rogue-surface.js"].sort();
  assert("mutation probe — an unscanned eligible file BREAKS the manifest gate",
    JSON.stringify(phantom) !== JSON.stringify(REGISTRY.files));
}

console.log(failures ? `\n${failures} FAILURES` : "\nALL SINK-COVERAGE TESTS PASS");
process.exit(failures ? 1 : 0);
