/* im-arc T2 (memo research/im-arc-t2-sections-memo.md §4): deterministic,
   generated reader ledger for the region / facility / programme registry.

   im-arc T4 fold (2026-08-24), spec research/im-arc-t4-fold-memo.md §1.5, §4, §6.1:
   the ledger renders the FOLDED registry. Three renderer corrections land here.
   (1) A `load-state-average-peak` observation renders as "average N / peak M" — the T2
       renderer printed only the middle, which silently dropped DeepSeek's peak load state
       (rental-rates synthesis, correction 7).
   (2) A facility whose inventory is a MIXED AGGREGATE renders as an aggregate with the keys
       present and an explicit "no public per-SKU split", never as a per-SKU count.
   (3) The coverage table is DERIVED per {company, preset} by the one resolver in engine.js —
       the ledger stores no percentages, so the generator cannot print a stale one. */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { REGIONS, DATACENTERS, PROGRAMMES, RENT_QUOTES, RENT_POLICY, COVERAGE_LEDGER,
  COVERAGE_WORDING } = require("./site/engine-data-dc-v1.js");
const E = require("./site/engine.js");

const money = value => `$${value.toFixed(4)}`;
const triple = value => value.lo === value.hi
  ? `${money(value.mid)} per kWh (point)`
  : `${money(value.lo)} / ${money(value.mid)} / ${money(value.hi)} per kWh`;
const count = value => value.toLocaleString("en-US");
/* (1) the load-state renderer: two load states are not two uncertainty endpoints. */
const observation = accelerator => {
  const { count: c, observationKind: kind, hwKey } = accelerator;
  if (kind === "load-state-average-peak")
    return `average ${count(c.lo)} / peak ${count(c.hi)} ${hwKey}`;
  if (c.lo === c.hi) return `${count(c.mid)} ${hwKey} (${kind})`;
  return `${count(c.lo)} / ${count(c.mid)} / ${count(c.hi)} ${hwKey} (${kind})`;
};
const inventory = row => {
  const parts = (row.accelerators || []).map(observation);
  /* (2) an unsplit aggregate is stated as one, with the keys present and the reason. */
  if (row.mixedAggregate) {
    const aggregate = row.mixedAggregate;
    parts.push(`mixed installed aggregate ${count(aggregate.count.lo)} / ${count(aggregate.count.mid)}`
      + ` / ${count(aggregate.count.hi)} across ${aggregate.hwKeysPresent.join(", ")}`
      + ` — no public per-SKU split (allocation: ${aggregate.allocation})`);
  }
  for (const milestone of row.milestones || [])
    parts.push(`milestone ${count(milestone.count.mid)} ${milestone.hwKey} (${milestone.asOf})`);
  return parts.length ? parts.join("; ") : "no public count";
};

/* A CITED SOURCE THE PUBLIC TREE DOES NOT CARRY IS LABELLED AS SUCH (Polaris ruling 2026-09-19
   on Astra pack E P1-6). Twenty rows in this generated ledger cite `research/dives/im-arc/*` —
   working dives that scripts/publish.sh deliberately does not ship — so a reader of the public
   repo followed the path to nothing. The dives may become public later; that is the owner's
   call and rides the share card. Until then the ledger says which citations they can open and
   which they cannot, rather than implying every path resolves. The rule is the publish
   allow-list's own shape, stated once here: research/provider-dives ships, research/dives does
   not. */
const PUBLISHED_SOURCE_PREFIXES = ["research/provider-dives/", "site/", "research/changelog.md"];
const sourceCitation = (path) => {
  if (typeof path !== "string" || !path) return "`" + String(path) + "`";
  const published = PUBLISHED_SOURCE_PREFIXES.some((prefix) => path.startsWith(prefix));
  return "`" + path + "`" + (published ? "" : " *(private working note, not published)*");
};

const table = (title, registry, describe, classOf) => {
  const lines = [`## ${title}`, "", "| id | registered content | basis | observation | source | class |",
    "|---|---|---|---|---|---|"];
  for (const [id, row] of Object.entries(registry))
    lines.push(`| \`${id}\` | ${describe(row)} | ${row.basis || "per observation"} `
      + `| ${row.observationKind || "per observation"} | ${sourceCitation(row.sourceFile)} | ${classOf(row)} |`);
  return lines.concat("");
};

/* (3) the derived coverage rows, per {company, preset}, from the ONE resolver. */
const coverageRows = [];
for (const [company, ledger] of Object.entries(COVERAGE_LEDGER))
  for (const presetId of Object.keys(ledger.presets || {})) {
    const derived = E.coverageForPreset(presetId);
    if (!derived) continue;
    const rendered = E.coverageSentenceParts(derived);
    const cell = key => rendered.parts.find(part => part.key === key).display + "%";
    coverageRows.push(`| ${company} | \`${presetId}\` | ${cell("named_site_serving_evidence_pct")} `
      + `| ${cell("programme_type_evidence_pct")} | ${cell("generic_fill_pct")} `
      + `| ${rendered.subordinate.display}% | ${ledger.rows.map(id => `\`${id}\``).join(", ") || "none"} `
      + `| ${ledger.programmes.map(id => `\`${id}\``).join(", ") || "none"} |`);
  }

const quoteRows = Object.entries(RENT_QUOTES).map(([quoteId, quote]) => {
  const isDefault = RENT_POLICY.defaultRateId[quote.hwKey] === quoteId;
  const span = quote.usdPerHr.lo === quote.usdPerHr.hi
    ? `$${quote.usdPerHr.mid}`
    : `$${quote.usdPerHr.lo} / $${quote.usdPerHr.mid} / $${quote.usdPerHr.hi}`;
  return `| \`${quoteId}\` | ${quote.hwKey} | ${span} | ${quote.rateClass} | ${quote.term} `
    + `| ${quote.asOf} | ${isDefault ? "**planning default**" : "alternate"} |`;
});
const unavailableRows = Object.entries(RENT_POLICY.defaultRateId)
  .filter(([, quoteId]) => quoteId === null)
  .map(([hwKey]) => `| \`${hwKey}\` | ${RENT_POLICY.unavailableReason[hwKey]} `
    + `| declared provisional replay $${RENT_POLICY.provisionalReplays[hwKey].usdPerHr.mid} |`);

const out = [
  "# Data-center and electricity registry",
  "",
  "<!-- GENERATED by build-dc-ledger.mjs; edit site/engine-data-dc-v1.js instead. -->",
  "",
  "Built from checked-in evidence only. Programme rows remain programme rows and do not identify a facility.",
  "",
  "Every triple carries two orthogonal labels: a closed `basis` (what kind of evidence stands behind it)",
  "and an `observationKind` (what the three numbers mean). Only a selected span, a tariff-derived",
  "delivered span and a two-load-state average/peak may carry different endpoints; a point, a floor, a",
  "ceiling, a milestone and a region fill are single values by construction.",
  "",
  ...table("Regions", REGIONS, row => triple(row.usdPerKwh), row => row.basis),
  ...table("Named facilities", DATACENTERS,
    row => `${row.site}; ${inventory(row)}`, row => `${row.coverage} / ${row.facilityClass}`),
  ...table("Programmes (not facilities)", PROGRAMMES,
    row => `${row.programme}; ${inventory(row)}`, row => row.coverage),
  "## Planning-rent quotes and the selection policy",
  "",
  `Selection policy: **${RENT_POLICY.planningPolicy}** — ${RENT_POLICY.policyStatement}.`,
  "",
  "| quote id | hardware | $/hr (lo / mid / hi) | rate class | term | as of | role |",
  "|---|---|---|---|---|---|---|",
  ...quoteRows,
  "",
  "### Hardware with no admissible public planning quote",
  "",
  "These rows resolve through the unavailable-row path and price nothing unless a reader or a caller",
  "states the replay explicitly. There is no silent fallback to a retired value.",
  "",
  "| hardware | why no default | declared replay |",
  "|---|---|---|",
  ...unavailableRows,
  "",
  "## Coverage accounting",
  "",
  `Denominator: **${COVERAGE_WORDING}**.`,
  "",
  "The three named-site / programme-type / generic-fill parts partition the modeled blend and sum to 100.",
  "The SKU/workload count-backed share is **non-additive**: it says how much of the same blend rests on a",
  "disclosed count for the exact key at the relevant workload and date, and it is never added to the three.",
  "Percentages are DERIVED from the stored key-level evidence and the selected modeled blend; the registry",
  "stores none of them.",
  "",
  "| company | preset | named-site serving | programme-type | generic fill | SKU/workload count-backed (non-additive) | facility rows | programme rows |",
  "|---|---|---:|---:|---:|---:|---|---|",
  ...coverageRows,
  "",
].join("\n");

writeFileSync(new URL("./research/dc-registry.md", import.meta.url), out, "utf8");
