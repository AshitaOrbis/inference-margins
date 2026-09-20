#!/usr/bin/env node
/* Worker build step — REUSE, don't rewrite.
   Copies the tested shared sources from ../src verbatim into src/gen/ (mcp-server/src stays
   the single source of truth; src/gen is disposable build output, never edited), swaps in the
   three worker-native modules from overrides/ (engine bridge via bundler import, reports read
   from the BUNDLED release archive, async get_report), bakes the fail-closed report catalog
   AND the archive itself from ../../site, and FAILS the build on any parity drift between an
   override and its Node original.
   Release-binding (Pro review 2026-07-29 rec 6 / C-6, re-found as bq-1253): the archive bytes
   are baked here, at the release the Worker is built from, instead of being fetched from the
   live site at call time. Before this, a Worker built at one release served another release's
   prose under the words "archived verbatim" — measured live on 2026-08-21: a Worker whose own
   engine reported v3.0.0-2026-08-13 returned front-page bytes stamped release-commit faf6bec
   (2026-08-18, three releases later). */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.resolve(__dirname, "..");
const MCP = path.resolve(WORKER, "..");           // mcp-server/
const SRC = path.join(MCP, "src");                // shared sources (single source of truth)
const SITE_DIR = path.resolve(MCP, "..", "site"); // the deployed site tree
const GEN = path.join(WORKER, "src", "gen");
const OVERRIDES = path.join(WORKER, "overrides");

const SITE = {
  calculator: "https://margins.ashitaorbis.com/",
  annex: "https://margins.ashitaorbis.com/research/",
};

function fail(msg) {
  console.error(`BUILD FAILED — ${msg}`);
  process.exit(1);
}

/* ---------- 0. the Node package must be built (we reuse its compiled htmlToText for titles,
   and its engine bridge as the numeric ground-truth gate) ---------- */
let nodeReports, nodeEngine;
try {
  nodeReports = await import(pathToFileURL(path.join(MCP, "dist", "reports.js")).href);
  nodeEngine = await import(pathToFileURL(path.join(MCP, "dist", "engine.js")).href);
} catch (e) {
  fail(`could not import mcp-server/dist (run \`npm run build\` in mcp-server first): ${e.message}`);
}
const { htmlToText } = nodeReports;
const E = nodeEngine.E;

/* Engine ground truth gate: opus + central lens @ native traffic. TWO pins since b9 M5 — the
   public-evidence REFERENCE reading ≈59.18% and the calculator's ratified-prior DEFAULT ≈68.98%
   — plus the exact relationship between them (see the b9 M5 note at the check itself).
   b9 M1 re-mint (delta manifest research/b9-delta-manifests/b9-m1-delta-manifest.md,
   minted from the FINAL M1-computed headline at assembly — never precommitted): the
   r4 §C1 repaired defaults land the reference blend in the review's repaired band
   55.24–61.25 at its midpoint (all 7 member legs render). The historical chain:
   76.8 (stale pre-IM3) → 57.29 (IM3 switch) → 47.483 (R2 solver widths) → 35.140 (R3)
   → 37.207 (FA J-9 filtered membership) → 59.181 (b9 M1 repaired defaults)
   → 51.179 (im-arc T4 fold, 2026-08-24: gb200/gb300/trn3 carry no admissible public planning
   rate, so the reference prices 4 of 7 legs — tests/fixtures-t4-declared-delta.json)
   → 57.881 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok: those three
   legs are given adopted PROVISIONAL planning rents, so the reference prices 7 of 7 again —
   research/changelog.md, "owner-adopted scenario rents for GB200, GB300 and Trainium3").
   A future move of this value is a SHIP-BLOCKING signal until its own gated delta
   manifest re-mints this pin. This IS that re-mint, and the ruling is the gate it passed. */
{
  const median = E.PERSPECTIVES.find((p) => p.id === "median");
  const opus = E.MODELS.find((m) => m.id === "opus");
  /* b9 M5 (implementation-gate round 5, P1): this gate's 59.181 expectation is the PUBLIC-EVIDENCE
     REFERENCE reading, but the constructor above is the calculator's DEFAULT state — and M5 seeds
     the owner-ratified per-lab algorithmic-lead prior into that default (+3 months for the closed
     labs, plan §3), which divides modeled cost by E = 3^(3/12) and moves the default to ≈68.98%.
     Left as it was, this gate would have failed EVERY fresh Worker build — a build breaker no
     suite in the milestone's matrix covers, since the Worker build runs outside `npm test` and the
     MCP suite. Both readings are now pinned, and the RELATIONSHIP between them is pinned too, so
     the gate keeps its ship-blocking teeth on both bases: a move in either, or a drift in the
     prior that couples them, still fails the build. */
  const pctRef = E.workload(E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" }))).margin * 100;
  /* im-vet-six-repairs (2026-09-20), vetting findings E1 + E2: both expectations re-mint with the
     Trainium withdrawal and the TPU numerator repair. The gate keeps its teeth on both bases and on
     the relationship between them — the ÷E(+3) identity below is asserted at 1e-6 and is what makes
     this a coupled pin rather than two loose numbers. */
  if (Math.abs(pctRef - 58.430) > 0.15) fail(`engine ground truth moved: opus central at the public-evidence reference = ${pctRef} (expected ≈58.430)`);
  const pct = E.workload(E.applyPresetSettings(opus, median, { mode: "native" })).margin * 100;
  if (Math.abs(pct - 68.414) > 0.15) fail(`engine ground truth moved: opus central at the ratified-prior default = ${pct} (expected ≈68.414)`);
  if (Math.abs((100 - pct) * Math.pow(3, 0.25) - (100 - pctRef)) > 1e-6)
    fail(`the ratified-prior default is no longer the reference divided by E(+3 @ 3x/yr) on the cost side: ref ${pctRef}, default ${pct}`);
/* FA transport-parity guard (gate-1 P1-8 — the recorded near-miss was this exact
   surface): the worker-native FA read list must carry every FA token key the Node
   transport renders; a dropped key fails the BUILD, not a reviewer's grep. */
{
  const src = readFileSync(new URL("../overrides/reports.ts", import.meta.url), "utf8");
  for (const key of ["mostPlausibleLine", "decompositionLine", "higherJustificationsHeader", "higherJustificationEntries",
    /* b9 M6: the nine new FA token keys — the D-6 five-part surface and the D-7 exec summary.
       This guard is what turns a dropped key into a BUILD failure instead of a reviewer's grep. */
    "referenceReadingLine", "c2LabelLine", "mustNotBeCalledLine", "convergenceLine",
    "priorReadingLine", "bridgeLine", "basisDeclarationLine", "execSummaryFrameLine",
    "executiveSummaryRows"])
    if (!src.includes("fa.tokens." + key)) fail(`worker overrides/reports.ts dropped FA token key: ${key}`);
}
  console.log(`engine gate: opus central = ${pct.toFixed(4)}% (${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF})`);
}

/* ---------- 1. copy shared sources verbatim ---------- */
rmSync(GEN, { recursive: true, force: true });
mkdirSync(path.join(GEN, "tools"), { recursive: true });

const SHARED_TOP = ["server.ts", "shape.ts", "labels.ts", "engine-types.d.ts", "claims-types.ts"];
const SHARED_TOOLS = ["list_scenario_space.ts", "query_margin_claims.ts", "run_scenario.ts",
  "adjust_rental_rate.ts", "run_fleet_sections.ts", "explore_range.ts", "get_dossier.ts",
  /* U5 (dc-map DESIGN §6): the seven datacenter tools are thin adapters over the shared query
     layer, so they are copied verbatim like every other shared tool. Only the SUBSTRATE loader is
     worker-native, because only it touches a filesystem. */
  "list_datacenters.ts", "get_datacenter.ts", "rank_datacenters.ts", "datacenter_schedule.ts",
  "datacenter_impact.ts", "datacenter_stakeholders.ts", "price_token_from_site.ts"];
for (const f of SHARED_TOP) cpSync(path.join(SRC, f), path.join(GEN, f));
for (const f of SHARED_TOOLS) cpSync(path.join(SRC, "tools", f), path.join(GEN, "tools", f));

/* U5: the dc-map bridge and the vendored U3 economics layer. `src/dcmap/economics` is itself a
   generated verbatim copy of dc-map/economics/src (mcp-server/scripts/sync-economics.mjs), so this
   copies a copy — deliberately, because it means the Worker and the Node server bundle the SAME
   bytes of the shared query/calculation layer rather than two resolutions of a package.
   `economics-node/` is NOT copied: it imports node:fs and there is no filesystem here. */
if (!existsSync(path.join(SRC, "dcmap", "economics", "index.ts")))
  fail("mcp-server/src/dcmap/economics is missing — run `npm run build` in mcp-server first (it vendors dc-map/economics/src)");
mkdirSync(path.join(GEN, "dcmap"), { recursive: true });
for (const f of ["layer.ts", "space.ts"]) cpSync(path.join(SRC, "dcmap", f), path.join(GEN, "dcmap", f));
cpSync(path.join(SRC, "dcmap", "economics"), path.join(GEN, "dcmap", "economics"), { recursive: true });

/* ---------- 2. swap in the worker-native modules ---------- */
cpSync(path.join(OVERRIDES, "engine.ts"), path.join(GEN, "engine.ts"));
cpSync(path.join(OVERRIDES, "claims.ts"), path.join(GEN, "claims.ts")); // R2: contracts bridge (bundler import; interface identical to ../src/claims.ts)
cpSync(path.join(OVERRIDES, "reports.ts"), path.join(GEN, "reports.ts"));
cpSync(path.join(OVERRIDES, "get_report.ts"), path.join(GEN, "tools", "get_report.ts"));
cpSync(path.join(OVERRIDES, "dcmap-substrate.ts"), path.join(GEN, "dcmap", "substrate.ts"));

/* ---------- 3. parity gates — overrides may not drift from their Node originals ---------- */
const nodeReportsSrc = readFileSync(path.join(SRC, "reports.ts"), "utf8");
const workerReportsSrc = readFileSync(path.join(OVERRIDES, "reports.ts"), "utf8");
const nodeGetReportSrc = readFileSync(path.join(SRC, "tools", "get_report.ts"), "utf8");
const workerGetReportSrc = readFileSync(path.join(OVERRIDES, "get_report.ts"), "utf8");

/* extract a block from marker to its closing top-level `}` / `";` line */
function block(src, marker, terminator, what) {
  const i = src.indexOf(marker);
  if (i === -1) fail(`parity extraction: "${what}" marker not found in the Node source`);
  const j = src.indexOf(terminator, i);
  if (j === -1) fail(`parity extraction: "${what}" terminator not found in the Node source`);
  return src.slice(i, j + terminator.length);
}
function assertContains(haystackName, haystack, needle, what) {
  if (!haystack.includes(needle)) fail(`parity drift: ${haystackName} no longer contains the Node original's ${what}. Re-sync overrides/ with ../src.`);
}

/* 3a. reports.ts: pure text helpers + ARCHIVE_NOTE must be byte-identical */
for (const [marker, what] of [
  ["function decodeEntities(s: string): string {", "decodeEntities body"],
  ["export function htmlToText(html: string): string {", "htmlToText body"],
]) {
  assertContains("overrides/reports.ts", workerReportsSrc, block(nodeReportsSrc, marker, "\n}", what), what);
}
assertContains("overrides/reports.ts", workerReportsSrc,
  block(nodeReportsSrc, "export const ARCHIVE_NOTE =", `";`, "ARCHIVE_NOTE"), "ARCHIVE_NOTE");

/* 3b. get_report: every load-bearing string of the original must survive in the variant */
const GET_REPORT_FRAGMENTS = [
  ['description', block(nodeGetReportSrc, '"Fetch a research-annex document', '",')],
  ["fail-closed unknown-id message", 'Unknown report id "${args.id}" — no fuzzy matching (a wrong-doc fetch is a misattribution vector). '],
  ["valid-ids listing", 'Valid ids: ${validReportIds().join(", ")}.'],
  ["offset guard", 'Offset ${offset} is beyond the end of "${entry.id}" (${total} chars).'],
  ["verbatim sentence", "— archived verbatim, characters ${offset}–${offset + slice.length} of ${total}"],
  ["truncation note", "(truncated; continue with offset ${offset + slice.length})"],
  ["receipt origin", "verbatim archive fetch: ${entry.id} — quoted material, no derived estimate"],
  ["max_chars schema", "max_chars: z.number().int().min(200).max(200000).optional()"],
  /* ROUND 4b. The analyst-hypothesis envelope is a THIRD branch, added because tagging that
     entry `final-answer` made get_report call an adopted analyst judgment a live engine-derived
     result surface in the same reply as a title saying it is not a calculator output. The branch
     exists on both transports; without these fragments the parity gate would not notice if one
     side's copy were edited or dropped, and a connector that describes the same entry
     differently from the Node server is the exact contradiction rec 5 is about. */
  ["analyst-hypothesis sentence", "— ADOPTED ANALYST JUDGMENT, live-rendered from engine tokens; this registry's RANKING of external claims, NOT a calculator output"],
  ["analyst-hypothesis note", "Adopted analyst judgment, live-rendered: these bytes come from this server's own engine tokens at call time"],
  ["analyst-hypothesis receipt origin", "live analyst-hypothesis render: ${entry.id} — adopted ranking of external claims, not a calculator output"],
  /* ROUND 4b P1 (machine half): registryEmitMeta bakes its second argument into the emitted
     claim's estimand, and this tool used to pass "verbatim archive fetch" unconditionally — so
     the MACHINE envelope called both live entries archive fetches. The per-kind map and the call
     that reads it are parity-checked on both transports: a drift here would have the connector
     making a different machine claim about the same entry than the Node server does, which is a
     contradiction no reader of either surface alone could see. */
  ["per-kind response map", 'const RESPONSE_KIND: Record<ReportEntry["kind"], string> = {'],
  ["live response kinds", '"final-answer": "live engine-derived result-surface",'],
  ["adopted-judgment response kind", '"analyst-hypothesis": "live adopted-analyst-judgment",'],
  ["emit meta reads the map", "registryEmitMeta(\"get_report\", RESPONSE_KIND[entry.kind])"],
];
for (const [what, fragment] of GET_REPORT_FRAGMENTS) {
  assertContains("../src/tools/get_report.ts", nodeGetReportSrc, fragment, `${what} (fragment list stale?)`);
  assertContains("overrides/get_report.ts", workerGetReportSrc, fragment, what);
}

/* 3c. worker engine bridge must export the same interface and re-declare nothing */
for (const sym of ["export const E", "export const SITE", "export function engineStamp", "export const DC_REGISTRY"]) {
  assertContains("overrides/engine.ts", readFileSync(path.join(OVERRIDES, "engine.ts"), "utf8"), sym, `engine bridge symbol ${sym}`);
}

/* 3d. U5: the worker substrate bridge must export the SAME interface as its Node original, and its
   one shared pure function must be byte-identical to it. A drift here would let the two transports
   answer differently about which release they are pinned to, or publish a server path on one side
   and not the other — the exact class of divergence the parity gates above exist to refuse. */
{
  const nodeSubstrate = readFileSync(path.join(SRC, "dcmap", "substrate.ts"), "utf8");
  const workerSubstrate = readFileSync(path.join(OVERRIDES, "dcmap-substrate.ts"), "utf8");
  for (const sym of ["export interface ReleaseBinding", "export type ActiveRelease",
    "export function releaseRoot", "export function publicReason",
    "export function openActiveRelease", "export function resetActiveRelease"]) {
    assertContains("../src/dcmap/substrate.ts", nodeSubstrate, sym, `substrate symbol ${sym} (list stale?)`);
    assertContains("overrides/dcmap-substrate.ts", workerSubstrate, sym, `substrate symbol ${sym}`);
  }
  assertContains("overrides/dcmap-substrate.ts", workerSubstrate,
    block(nodeSubstrate, "export function publicReason(raw: string): string {", "\n}", "publicReason body"),
    "publicReason body");
}

/* ---------- 4. bake the fail-closed report catalog (same logic as ../src/reports.ts) ---------- */
function decodeEntitiesLocal(s) {
  return htmlToText(`<x>${s}</x>`); // titles only; htmlToText already decodes entities
}
function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntitiesLocal(m[1]).trim() : fallback;
}

const items = [];
const RESEARCH = path.join(SITE_DIR, "research");
for (const f of readdirSync(RESEARCH).sort()) {
  if (!f.endsWith(".html")) continue;
  const full = path.join(RESEARCH, f);
  if (!statSync(full).isFile()) continue;
  const stem = f.replace(/\.html$/, "");
  const id = stem === "index" ? "research-index" : stem;
  const head = readFileSync(full, "utf8").slice(0, 4096);
  items.push({ id, title: titleOf(head, stem), kind: "annex-doc", source_url: SITE.annex + f, path: `research/${f}`, section: null });
}
const index = readFileSync(path.join(SITE_DIR, "index.html"), "utf8");
items.push({ id: "front-page", title: titleOf(index, "Frontier Inference Margins"), kind: "front-page", source_url: SITE.calculator, path: "index.html", section: null });
const heads = [...index.matchAll(/<h3 id="s(\d+)">([\s\S]*?)<\/h3>/g)];
for (const h of heads) {
  const n = h[1];
  items.push({
    id: `report-s${n}`,
    title: htmlToText(h[2]).replace(/\s+/g, " ").trim(),
    kind: "report-section",
    source_url: `${SITE.calculator}#s${n}`,
    path: "index.html",
    section: n,
  });
}
if (items.filter((i) => i.kind === "annex-doc").length < 20) fail(`suspiciously few annex docs (${items.length}) — wrong site dir?`);
if (heads.length < 5) fail(`suspiciously few report sections (${heads.length}) — front page changed?`);

const catalogTs = `/* GENERATED by scripts/build.mjs from ../../site — DO NOT EDIT.
   Fail-closed id catalog for get_report: only these ids are servable. Content comes from
   archive.gen.ts, baked from the SAME site tree in the SAME build (rec 6 / C-6 release
   binding) — not from a runtime fetch. Regenerated on every build. */
export interface CatalogItem {
  id: string;
  title: string;
  kind: "annex-doc" | "report-section" | "front-page";
  source_url: string;
  path: string;          // path under the site origin — the archive key, and the live doc's path
  section: string | null; // h3 section number for report-sN, else null
}

export const CATALOG: CatalogItem[] = ${JSON.stringify(items, null, 2)};
`;
writeFileSync(path.join(GEN, "catalog.gen.ts"), catalogTs);

/* ---------- 5. bake the ARCHIVE itself, release-bound (rec 6 / C-6, bq-1253) ----------
   Every distinct path the catalog names is read from the local site tree and embedded, with
   its sha256, so the Worker serves the bytes of the release it was BUILT from. This is the
   review's own first-choice fix ("bundle normalized text into the Worker at build time"),
   taken one step further: the RAW markup is bundled, so `format:"html"` keeps its fidelity
   contract and htmlToText still produces the text form from the same bytes. It also removes
   the runtime fetch entirely, which is what finding S-5 (unbounded live fetch: no timeout,
   no size cap, no content-type check) was about — there is now nothing to bound. */
const archivePaths = [...new Set(items.map((i) => i.path))].sort();
const archive = {};
let archiveBytes = 0;
for (const rel of archivePaths) {
  const full = path.join(SITE_DIR, rel);
  const text = readFileSync(full, "utf8");
  archive[rel] = { sha256: createHash("sha256").update(text, "utf8").digest("hex"), text };
  archiveBytes += Buffer.byteLength(text, "utf8");
}

/* Release identity of the bundled bytes. TWO independent facts, because they answer different
   questions: `site_release_commit` is the stamp the site itself carries and a reader can see in
   the served HTML, while `built_from` is the commit of the tree these bytes were actually read
   from. A dirty tree is recorded as such rather than silently claiming a commit. */
function git(args, fallback) {
  try { return execFileSync("git", args, { cwd: SITE_DIR, encoding: "utf8" }).trim(); }
  catch { return fallback; }
}
const builtFrom = git(["rev-parse", "--short", "HEAD"], "unknown");
const dirty = git(["status", "--porcelain", "--", "."], "") !== "";
const stampMatch = index.match(/<span id="release-commit">([^<]*)<\/span>/);
const RELEASE = {
  built_from: builtFrom + (dirty ? "-dirty" : ""),
  site_release_commit: stampMatch ? stampMatch[1].trim() : "unstamped",
  engine_revision: E.ENGINE_REVISION,
  data_as_of: E.DATA_AS_OF,
  documents: archivePaths.length,
  bytes: archiveBytes,
};

const archiveTs = `/* GENERATED by scripts/build.mjs from ../../site — DO NOT EDIT.
   The RELEASE ARCHIVE: the exact document bytes of the release this Worker was built from,
   with a sha256 per document. get_report serves these — it does NOT fetch the live site
   (Pro review 2026-07-29 rec 6 / C-6; burn-queue bq-1253). Regenerated on every build. */
export interface ArchiveEntry { sha256: string; text: string }

export const RELEASE = ${JSON.stringify(RELEASE, null, 2)} as const;

export const ARCHIVE: Record<string, ArchiveEntry> = ${JSON.stringify(archive, null, 2)};
`;
writeFileSync(path.join(GEN, "archive.gen.ts"), archiveTs);

/* Fail-closed coupling gate: every catalog path must exist in the archive. A catalog entry with
   no bytes would be an id that lists but cannot be served — the failure mode this whole
   fail-closed catalog exists to prevent, reintroduced through the back door. */
for (const it of items) if (!archive[it.path]) fail(`catalog entry "${it.id}" names path "${it.path}", which is not in the baked archive`);

/* ---------- 6. U5: embed the ACTIVE dc-map SUBSTRATE release (DESIGN §1.7 E9) ----------
   Same doctrine as the document archive above, one step stricter, because these bytes are what a
   price is computed FROM rather than quoted from. dc-map/releases/CURRENT is resolved once, every
   artifact named by the manifest is read and its sha256 compared against the manifest, every
   artifact's own embedded release_id is compared against the manifest's, and ANY disagreement
   FAILS THE BUILD. A Worker that shipped a release whose bytes are not the release it names would
   compute modeled prices and stamp them with a release id that does not describe them.

   An ABSENT release is a different thing from a WRONG one, and it is not a build failure by
   default: the substrate release artifacts are regenerable producer output and are git-ignored, so
   a fresh checkout has none, and refusing to build there would take the eight existing tools down
   with the seven new ones. The build embeds a typed `unavailable` record instead, the Worker
   answers `release-unavailable` honestly, and nothing is substituted. Set DCMAP_REQUIRE_RELEASE=1
   — as the U6 staged-release gate will — to turn absence into a build failure too. */
const DCMAP_ARTIFACTS = ["site-data.json", "sites.geojson", "summary.json", "t4-adapter.json"];
const dcmapReleases = process.env.DCMAP_RELEASES ?? path.resolve(MCP, "..", "dc-map", "releases");
const requireRelease = process.env.DCMAP_REQUIRE_RELEASE === "1";
const dcmapNote = "Substrate release bytes embedded by mcp-server/worker/scripts/build.mjs at the "
  + "release this Worker was built from, digest-verified at build time and re-verified against the "
  + "manifest at runtime. The Worker never fetches a release.";

function embedDcmapRelease() {
  const absent = (reason) => {
    if (requireRelease) fail(`DCMAP_REQUIRE_RELEASE=1 and no active dc-map substrate release could be embedded: ${reason}`);
    console.log(`dc-map release: NONE embedded (${reason}) — the connector will answer release-unavailable`);
    return { status: "unavailable", release_id: null, manifest: null, artifacts: {}, reasons: [reason], note: dcmapNote };
  };
  const currentPath = path.join(dcmapReleases, "CURRENT");
  if (!existsSync(currentPath)) return absent("dc-map/releases/CURRENT is not present in this tree");
  const id = readFileSync(currentPath, "utf8").trim();
  if (!/^rel-[a-f0-9]{24}$/.test(id)) fail(`dc-map/releases/CURRENT names a malformed release id: ${JSON.stringify(id.slice(0, 60))}`);
  const dir = path.join(dcmapReleases, id);
  if (existsSync(path.join(dir, "FAILED.json"))) fail(`dc-map release ${id} is marked FAILED and must never be embedded`);
  const manifestPath = path.join(dir, "manifest.json");
  if (!existsSync(manifestPath)) return absent(`dc-map release ${id} is active but its manifest is not materialised in this tree`);
  const manifest = readFileSync(manifestPath, "utf8");
  let m;
  try { m = JSON.parse(manifest); } catch (e) { fail(`dc-map release ${id} manifest is not JSON: ${e.message}`); }
  if (m.release_id !== id) fail(`dc-map release ${id} manifest names a different release (${m.release_id})`);
  if (m.fixture_only) fail(`dc-map release ${id} is a presentation FIXTURE; a Worker never serves one as a substrate release`);
  for (const name of DCMAP_ARTIFACTS)
    if (!m.artifacts?.[name]) fail(`dc-map release ${id} manifest omits the required artifact ${name}`);

  const artifacts = {};
  for (const [name, expected] of Object.entries(m.artifacts)) {
    if (path.isAbsolute(name) || name.split(/[\\/]/).some((part) => !part || part === "." || part === ".."))
      fail(`dc-map release ${id} names an unsafe artifact path: ${name}`);
    const file = path.join(dir, name);
    if (!existsSync(file)) return absent(`dc-map release ${id} is active but ${name} is not materialised in this tree`);
    const bytes = readFileSync(file, "utf8");
    const actual = "sha256:" + createHash("sha256").update(bytes, "utf8").digest("hex");
    /* THE REFUSAL. Present-but-wrong is never downgraded to absent: a release whose bytes do not
       match its manifest is exactly what E9's digest check exists to stop reaching a consumer. */
    if (actual !== expected)
      fail(`dc-map release ${id}: ${name} does not match the manifest digest (${actual} vs ${expected}). Refusing to embed bytes the release does not describe.`);
    artifacts[name] = bytes;
  }
  for (const name of DCMAP_ARTIFACTS) {
    let embedded;
    try { embedded = JSON.parse(artifacts[name]).release_id; }
    catch (e) { fail(`dc-map release ${id}: ${name} is not JSON: ${e.message}`); }
    if (embedded !== id) fail(`dc-map release ${id}: ${name} carries release_id ${JSON.stringify(embedded)}`);
  }
  const bytes = Object.values(artifacts).reduce((n, v) => n + Buffer.byteLength(v, "utf8"), 0);
  console.log(`dc-map release: ${id} embedded — ${Object.keys(artifacts).length} artifacts, `
    + `${(bytes / 1024).toFixed(1)} KiB, contract ${m.contract_version}, assessed ${m.assessment_as_of}`);
  return { status: "ok", release_id: id, manifest, artifacts, reasons: [], note: dcmapNote };
}

const embedded = embedDcmapRelease();
writeFileSync(path.join(GEN, "dcmap", "release.gen.ts"), `/* GENERATED by scripts/build.mjs from dc-map/releases — DO NOT EDIT.
   The ACTIVE substrate release this Worker was built from, digest-verified against its manifest at
   build time and re-verified by the shared openRelease() at runtime (U5 / DESIGN §1.7 E9).
   Regenerated on every build. */
export interface EmbeddedRelease {
  status: "ok" | "unavailable";
  release_id: string | null;
  manifest: string | null;
  artifacts: Record<string, string>;
  reasons: string[];
  note: string;
}

export const EMBEDDED_RELEASE: EmbeddedRelease = ${JSON.stringify(embedded, null, 2)};
`);

console.log(`copied ${SHARED_TOP.length + SHARED_TOOLS.length} shared sources verbatim, 5 worker-native overrides; parity gates green`);
console.log(`catalog: ${items.length} entries (${items.filter((i) => i.kind === "annex-doc").length} annex docs, ${heads.length} report sections, 1 front page)`);
console.log(`archive: ${RELEASE.documents} documents, ${(RELEASE.bytes / 1024).toFixed(0)} KiB, release-bound to ${RELEASE.built_from} (site stamp ${RELEASE.site_release_commit}, engine ${RELEASE.engine_revision})`);
