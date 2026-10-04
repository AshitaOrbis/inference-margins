// The declared public-field lists (scripts/public-fields): they are consistent with one another, and every declared
// name and namespace id is one the served page itself shows (and, where the engine has a registry for it, resolves
// there). These lists are declarations. Nothing in this release scans served values against them, so a pass here
// says the lists resolve, not that a served field conforms to them.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SITE = join(ROOT, "site");
const DECLARED = join(ROOT, "scripts", "public-fields");
const require = createRequire(import.meta.url);
const failures = [];
let n = 0;
const check = (label, ok, detail = "") => { n++; if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ""}`); };

// ---- the declared lists ----
const inventory = JSON.parse(readFileSync(join(DECLARED, "inventory.json"), "utf8"));
const ns = JSON.parse(readFileSync(join(DECLARED, "namespaces.json"), "utf8"));
const names = readFileSync(join(DECLARED, "names.txt"), "utf8").split("\n").map(line => line.replace(/#.*/, "").trim()).filter(Boolean);
const classOf = new Map();
let twice = 0;
for (const [cls, fields] of Object.entries(inventory.classes))
  for (const field of fields) { if (classOf.has(field)) twice++; classOf.set(field, cls); }
check("the inventory holds 24 fields, each in one class", classOf.size === 24 && twice === 0, `${classOf.size} fields, ${twice} declared twice`);
for (const field of inventory.classes.pointer) check(`pointer field ${field} has a resolution rule`, typeof inventory.pointers[field] === "string");
for (const [field, rule] of Object.entries(inventory.pointers)) {
  const [kind, list] = rule.split(":");
  check(`pointer rule for ${field} names a pointer field`, classOf.get(field) === "pointer");
  if (kind === "namespace") check(`pointer rule for ${field} names a declared namespace`, Array.isArray(ns.namespaces[list]));
  if (kind === "vocabulary") check(`pointer rule for ${field} names a declared vocabulary`, Array.isArray(ns.vocabularies[list]));
}
for (const fixture of inventory.fixtures) check(`declared fixture ${fixture} is served`, existsSync(join(SITE, fixture)));
check("every namespace says what it is", JSON.stringify(Object.keys(ns.namespaces).sort()) === JSON.stringify(Object.keys(ns.describe).sort()));
const servedText = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walk(join(dir, entry.name));
    else if (/\.(?:m?js|json|html)$/.test(entry.name)) servedText.push(readFileSync(join(dir, entry.name), "utf8"));
  }
})(SITE);
const all = servedText.join("\n");
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const shown = s => new RegExp(`(?<![\\w-])${escape(s)}(?![\\w-])`, "i").test(all);
for (const name of names) check(`declared name ${name} is shown by the served page`, shown(name));
for (const [space, ids] of Object.entries(ns.namespaces))
  for (const id of ids) check(`namespace ${space}: ${id} is shown by the served page`, shown(id));
const ED = require("../site/engine-data-v22.js");
const E = require("../site/engine.js");
const DC = require("../site/engine-data-dc-v1.js");
const EI = JSON.parse(readFileSync(join(SITE, "tests/evidence-instances-v22.json"), "utf8"));
const caseIds = new Set(Object.keys(ED.WORKER_CANDIDATE_SOURCES));
for (const key of Object.keys(ED)) if (/_TOPOLOGY_SENSITIVITY$/.test(key)) for (const c of ED[key].cases) caseIds.add(c.id);
for (const id of ns.namespaces.caseIds) check(`case id ${id} resolves to a width or topology case`, caseIds.has(id));
const registry = ref => { const [name, key] = ref.split("."); const reg = ED[name] ?? E[name]; return key ? !!(reg && reg[key]) : !!reg; };
for (const ref of [...ns.namespaces.calibrationRefs, ...ns.namespaces.registryRefs]) check(`registry ref ${ref} resolves`, registry(ref));
for (const ref of ns.namespaces.blendRefs)
  check(`blend ref ${ref} resolves`, ref === "state:blend" || (ref.startsWith("fleet:") && !!E.FLEETS[ref.slice(6)]));
for (const id of ns.namespaces.perspectiveIds) check(`perspective ${id} is an exploration id`, E.PERSPECTIVES.some(p => p.id === id));
const engineData = readFileSync(join(SITE, "engine-data-v22.js"), "utf8");
for (const id of ns.namespaces.calibrationObservations)
  check(`calibration observation ${id} is a fitted operating point`, new RegExp(`\\bF\\d+ ${escape(id)}\\b`).test(engineData));
const anchors = EI.anchors.map(a => a.id);
for (const id of ns.namespaces.evidenceKeys) check(`evidence key ${id} is a served anchor`, anchors.includes(id));
for (const family of ns.namespaces.evidenceFamilies)
  check(`evidence family ${family} prefixes two served anchors`, anchors.filter(a => a.startsWith(family + "-") || new RegExp(`^${escape(family)}\\d`).test(a)).length >= 2);
for (const id of ns.namespaces.dcIds) check(`DC id ${id} is a registry row`, [DC.REGIONS, DC.DATACENTERS, DC.PROGRAMMES].some(rows => rows && rows[id]));
const changelog = readFileSync(join(SITE, "research/changelog.html"), "utf8");
for (const id of ns.namespaces.evidenceTasks) check(`evidence task ${id} is named in the served changelog`, changelog.includes(id));
check("the evidence-class vocabulary is the engine's", JSON.stringify([...ns.vocabularies.evidenceClass].sort()) === JSON.stringify(Object.keys(ED.TOPOLOGY_EVIDENCE_CLASSES).sort()));
for (const word of ns.compoundWords) check(`compound word ${word} is a lowercase word`, /^[a-z]+$/.test(word));
if (failures.length) {
  console.error(`PUBLIC-FIELD LIST FAILURES (${failures.length}/${n})\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`ALL ${n} PUBLIC-FIELD LIST CASES PASS`);
