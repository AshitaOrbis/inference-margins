/* NAME-CONSISTENCY CHECK — one name per idea, on the surfaces the page speaks in its own voice.
   im-vet-six-repairs (2026-09-20), program bq-2835; the reader's reading of 2026-09-19 found
   35 ideas carrying two or more names, starting with the metric on the answer tile. Term
   authority: style/VOCABULARY.md (v2, ruling d-20260908-im-language-rationalized-with-glossary).

   WHAT THIS CHECKS, and the scope is the point rather than a hedge: the surfaces a reader meets
   in the PAGE'S OWN VOICE — site/index.html, the generated glossary, and the reader-facing copy
   the engine and the app emit (which is also what the MCP connector's report text is extracted
   from, so the connector moves with the page by construction). It does NOT check the 39 archived
   research annexes: those are PRESERVED verbatim originals carrying their own "In today's words"
   bridge, and rewriting a source's wording inside a preserved artifact is the one thing the
   project's own rules forbid.

   HOW A LICENSED OCCURRENCE WORKS: every one is enumerated below with a reason. Nothing is
   discharged by a pattern, so a NEW occurrence of a retired variant fails even where an old one
   is licensed — the same discipline tests/fa-justifications.test.mjs applies to figures.

   Run: node tests/vocabulary-consistency.test.mjs */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

/* The engine surface is scanned as RENDERED READER COPY, not as source. Scanning engine.js as a
   file would count its own design comments — which discuss the retired names on purpose, because
   that is where the reasons for retiring them are written — and a checker that cannot tell a
   comment from a sentence a reader meets would force those reasons to be deleted to go green.
   So every string below is one the engine EMITS: tips, the final-answer tokens, the clause
   functions, and every preset/model note and dossier field the grounding ledger publishes. */
const require_ = createRequire(import.meta.url);
const E = require_("../site/engine.js");
function engineReaderCopy() {
  const out = [];
  const push = (v) => { if (typeof v === "string" && v.length) out.push(v); };
  const walk = (v, depth = 0) => {
    if (depth > 6 || v == null) return;
    if (typeof v === "string") return push(v);
    if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
    if (typeof v === "object") for (const k of Object.keys(v)) walk(v[k], depth + 1);
  };
  for (const t of Object.values(E.TIPS)) walk(t);
  for (const m of E.MODELS) { push(m.name); push(m.note); }
  for (const p of E.PERSPECTIVES) { push(p.name); push(p.subtitle); push(p.note); push(p.basisNote); walk(p.statedReading); walk(p.claimAnchor); }
  walk(E.DOSSIERS);
  walk(E.SECTIONS);
  const opus = E.MODELS.find((m) => m.id === "opus");
  const land = E.PERSPECTIVES.find((p) => p.id === E.LANDING_DEFAULT_PERSP_ID);
  const s = E.applyPresetSettings(opus, land);
  walk(E.finalAnswer(s));
  push(E.bandLeadBasisClause({ trendMonths: 0 }, []));
  push(E.bandLeadBasisClause({ trendMonths: 3 }, []));
  for (const p of E.PERSPECTIVES) { const c = E.statedReadingClause(p, 80); if (c) walk(c); }
  for (const p of E.PERSPECTIVES) push(E.pairingWarning(opus, p) || "");
  return out.join("\n");
}

/* SCOPE WIDENED 2026-09-20 (im-vet-six-repairs, Astra xhigh review finding 6). The first version
   scanned the two HTML pages and the engine's rendered strings, and called N1 closed. It was not:
   the browser app and the connector emit reader prose of their own, and four retired variants
   were alive there the whole time (app.js's "modeled unit serving margin" and "modeled effective
   billings", run_scenario's "compatible cost lenses"). A checker whose scope excludes the
   surfaces where duplicates actually survive does not measure zero, it measures its own scope. */
const SURFACES = {
  "site/index.html": readFileSync("site/index.html", "utf8"),
  "site/glossary.html": readFileSync("site/glossary.html", "utf8"),
  "engine reader copy (rendered)": engineReaderCopy(),
  "site/app.js (reader strings)": readFileSync("site/app.js", "utf8"),
  "connector reader strings": [
    "mcp-server/src/labels.ts",
    "mcp-server/src/tools/run_scenario.ts",
    "mcp-server/src/tools/explore_range.ts",
    "mcp-server/src/tools/list_scenario_space.ts",
    "mcp-server/src/tools/run_fleet_sections.ts",
  ].map(f => readFileSync(f, "utf8")).join("\n"),
};
/* A JS/TS source is quoted end to end — every string literal wears the same quotes a citation
   does — so the HTML quote rule cannot apply to it. Those surfaces are scanned RAW, and anything
   they legitimately quote has to be licensed by occurrence instead. */
const HTML_LIKE = new Set(["site/index.html", "site/glossary.html", "engine reader copy (rendered)"]);

/* The ideas this release edit unified, each with the canonical term and the variants retired from
   the page's own voice. Sourced row for row from style/VOCABULARY.md §1. */
const IDEAS = [
  { idea: "the page's metric", canonical: "serving margin",
    retired: ["serving contribution margin", "unit serving margin", "unit direct-serving margin", "marginal serving margin", "unit CM"] },
  { idea: "the modeled token-price denominator", canonical: "effective price",
    retired: ["effective billings", "blended effective price"] },
  { idea: "the published per-token price", canonical: "list price",
    retired: ["list tariff", "published tariff", "undiscounted list tariff", "cache tariff", "cache-read billing tariff"] },
  { idea: "paid capacity actually used", canonical: "utilization",
    retired: ["paid-capacity occupancy", "fleet occupancy", "occupancy slack"] },
  { idea: "the assumed hardware mix", canonical: "default fleet",
    retired: ["NA-blend fleet", "the NA-blend default", "memory-feasibility-filtered"] },
  { idea: "which hardware actually serves the model", canonical: "serving deployment",
    retired: ["production placement", "model-to-fleet routing"] },
  { idea: "the standard traffic mix", canonical: "Reference mix",
    retired: ["Reference traffic convention", "Reference profile"] },
  { idea: "the share billed at the cache rate", canonical: "billable cached share",
    retired: ["billable-share"] },
  { idea: "a complete named settings package", canonical: "scenario preset",
    retired: ["cost lens", "cost-lens"] },
  { idea: "a set of settings", canonical: "settings",
    retired: ["own vector", "declared vector", "declared dials"] },
  { idea: "what the stress control loads", canonical: "planning baseline",
    retired: ["public-rate reproducibility floor", "reproducibility floor"] },
  { idea: "what loads first", canonical: "opening scenario",
    retired: ["activated default", "deployed defaults", "flagship default"] },
];

/* LICENSED OCCURRENCES — each is a quotation, a definition of the retired term, or a place the
   page is deliberately naming what someone else called it. Keyed by surface + variant, with the
   count, so a SECOND occurrence of a licensed variant still fails. */
const LICENSED = [
  { file: "site/index.html", variant: "serving contribution margin", count: 2,
    why: "the full technical name, stated once in the methods box and once in the tile explanation that points at the methods box \u2014 style/VOCABULARY.md \u00a71.1 licenses the full name exactly where the metric is defined, and a definition that could not state it would not be one" },
  { file: "site/glossary.html", variant: "serving contribution margin", count: 1,
    why: "the glossary entry that DEFINES the metric under its full name and lists the variants it retires \u2014 a glossary that could not name a retired term could not retire it" },
  { file: "engine reader copy (rendered)", variant: "serving contribution margin", count: 1,
    why: "the tip that DEFINES the metric: `TIPS.margin.t` is the \u24d8 explanation behind the answer tile, the same license \u00a71.1 gives the methods box" },
];
/* CARRIED OCCURRENCES — the live surfaces where a CARRIED phrase (below) actually appears. They
   are allowed at an EXACT count, never blanket, so a new occurrence of a carried phrase still
   fails; and they are reported in their own column rather than folded into "licensed", because a
   reader of this output has to be able to tell a deliberate definition apart from a rename this
   release could not finish. Added 2026-09-20 (Astra xhigh finding 6). */
const CARRIED_OCCURRENCES = [
  { file: "connector reader strings", variant: "serving contribution margin", count: 7,
    why: "every one is inside run_scenario's or run_fleet_sections' `estimand` WIRE VALUE, a typed identifier the connector contract pins and stored responses compare against — see CARRIED below" },
  { file: "engine reader copy (rendered)", variant: "paid-capacity occupancy", count: 1,
    why: "the r4 run B §C2 label, quoted VERBATIM and attributed in the same sentence. The N1 pass had silently replaced this word inside the quotation; the Astra review of 2026-09-20 caught it, the quoted bytes were restored, and the occurrence is licensed HERE by name rather than by a blanket quote rule that would exempt anything in quotes" },
];
const licenseKey = (f, v) => f + "|" + v;
const licensed = new Map(LICENSED.map(l => [licenseKey(l.file, l.variant), l]));
const carriedOcc = new Map(CARRIED_OCCURRENCES.map(l => [licenseKey(l.file, l.variant), l]));

/* Occurrences inside a preserved quotation do not count as the page's own voice. TIGHTENED
   2026-09-20 (Astra xhigh finding 6): the first version stripped EVERY quoted span, which is an
   exemption granted to punctuation rather than to provenance — and it is what let this release
   edit change a word INSIDE a verbatim quotation without the checker noticing (the r4 run B §C2
   label, where "paid-capacity occupancy" had been silently replaced by "utilization"; restored in
   the same fold). A quoted span is now exempt only if an attribution marker sits within 300
   characters before it. An unattributed quoted span counts as the page's own voice, which is the
   safe direction: it can only ever ADD findings. */
const ATTRIBUTION = /(quoted from|its own words|verbatim|adjudication|as they put it|writes|stated|verdict|source:|\u00a7C2)/i;
const stripAttributedQuotes = (text) => {
  const out = text.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ");
  const strip = (re) => (match, offset, whole) =>
    ATTRIBUTION.test(whole.slice(Math.max(0, offset - 300), offset)) ? " " : match;
  return out
    .replace(/"[^"]{0,400}"/g, strip())
    .replace(/\u201c[^\u201d]{0,400}\u201d/g, strip());
};
/* A JS/TS COMMENT is not a reader surface: nothing a visitor or a connector consumer receives
   comes from it, and this project's comments deliberately quote the retired terms they retired.
   Stripping them is a scope statement, not an exemption — every string literal still counts. */
const stripCode = (src) => src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1 ");
const stripQuoted = (text, file) => HTML_LIKE.has(file) ? stripAttributedQuotes(text) : stripCode(text);

const countIn = (text, variant) => {
  const re = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(re) || []).length;
};

const rows = [];
for (const [file, raw] of Object.entries(SURFACES)) {
  const text = stripQuoted(raw, file);
  for (const { idea, canonical, retired } of IDEAS)
    for (const variant of retired) {
      const n = countIn(text, variant);
      if (n === 0) continue;
      const lic = licensed.get(licenseKey(file, variant));
      const car = carriedOcc.get(licenseKey(file, variant));
      rows.push({ file, idea, canonical, variant, found: n,
        allowed: lic ? lic.count : 0, carried: car ? car.count : 0 });
    }
}
const unlicensed = rows.filter(r => r.found > r.allowed + r.carried);

for (const r of rows)
  console.log(`      ${r.file}: "${r.variant}" x${r.found} (licensed ${r.allowed}, carried ${r.carried}) — ${r.idea} → ${r.canonical}`);

assert("name consistency: ZERO unlicensed retired variants on the page's own-voice surfaces",
  unlicensed.length === 0, JSON.stringify(unlicensed));
assert("name consistency: every licensed occurrence is still present (a license with nothing behind it is dead weight)",
  LICENSED.every(l => rows.some(r => r.file === l.file && r.variant === l.variant && r.found === l.count)),
  JSON.stringify(LICENSED.filter(l => !rows.some(r => r.file === l.file && r.variant === l.variant && r.found === l.count))));
assert("name consistency: every license carries a reason",
  LICENSED.every(l => typeof l.why === "string" && l.why.length > 40));
assert("name consistency: every CARRIED occurrence is still present at its exact count (an allowance with nothing behind it is dead weight, and a NEW one must fail)",
  CARRIED_OCCURRENCES.every(l => rows.some(r => r.file === l.file && r.variant === l.variant && r.found === l.count)),
  JSON.stringify(CARRIED_OCCURRENCES.filter(l => !rows.some(r => r.file === l.file && r.variant === l.variant && r.found === l.count))));
assert("name consistency: every CARRIED occurrence carries a reason",
  CARRIED_OCCURRENCES.every(l => typeof l.why === "string" && l.why.length > 60));

/* NEGATIVE CONTROL. A check that cannot fail proves nothing: injecting one more occurrence of a
   retired variant into a surface must be caught, INCLUDING on a variant that is licensed
   elsewhere in the same file. */
{
  const forged = SURFACES["site/index.html"] + "<p>The blended effective price of a serving contribution margin at 50% paid-capacity occupancy.</p>";
  const t = stripQuoted(forged, "site/index.html");
  const caught = ["blended effective price", "serving contribution margin", "paid-capacity occupancy"]
    .filter(v => countIn(t, v) > (licensed.get(licenseKey("site/index.html", v))?.count ?? 0));
  /* "serving contribution margin" is LICENSED twice in this file, so the injected third occurrence
     is what has to be caught \u2014 which is the case the per-file count exists for. */
  assert("name consistency NEGATIVE CONTROL: an injected retired variant IS caught, licensed-elsewhere included",
    caught.length === 3, JSON.stringify(caught));
}
{
  const clean = stripQuoted(SURFACES["site/index.html"], "site/index.html");
  assert("name consistency NEGATIVE CONTROL: ...and the unmutated page does NOT trip it",
    countIn(clean, "blended effective price") === 0);
}

/* WHAT IS CARRIED, stated rather than omitted. These are ideas style/VOCABULARY.md §1 also
   retires and this release edit did NOT close. Each is a TYPED IDENTIFIER, not prose: the phrase
   is a basis name the engine emits, the MCP connector returns, and dozens of tests bind to, so
   moving it is an engine/connector/test operation rather than a copy edit. Listed here so the
   remaining count is visible in the suite rather than only in a report. */
const CARRIED = [
  { phrase: "modeled unit direct-serving contribution margin (connector `estimand`, incl. the fleet-sections variant)",
    canonical: "modeled serving margin",
    why: "the WIRE VALUE of run_scenario's `estimand` field, returned on five response paths and pinned by the connector contract test and by shipped permalink receipts. A consumer that stored a response and compares the field would see a silent identity change, so renaming it is a connector release with its own fixture re-mint, not a copy edit. Added 2026-09-20 after the Astra xhigh review found it live." },
  { phrase: "public-evidence reference", canonical: "planning baseline — no assumed efficiency lead",
    why: "the basis identifier the engine emits (bandLeadBasisClause, finalAnswer's basisDeclarationLine), the MCP returns, and tests/fa-justifications.test.mjs uses as its class-A canonical phrase. Renaming it is a coordinated engine + connector + fixture move." },
  { phrase: "policy-labeled scenario", canonical: "planning baseline",
    why: "same class: a typed label the engine emits on the landing surface and the gate-6 decision path reads." },
];
assert("name consistency: the carried items are enumerated with reasons, not left silent",
  CARRIED.length === 3 && CARRIED.every(c => c.why.length > 60));
console.log(`\n      CARRIED (not closed by this release edit): ${CARRIED.length} — ` +
  CARRIED.map(c => `"${c.phrase}" → ${c.canonical}`).join("; "));

console.log(`\n${failures === 0 ? "ALL VOCABULARY-CONSISTENCY CHECKS PASS" : failures + " VOCABULARY-CONSISTENCY FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
