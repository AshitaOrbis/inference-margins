/* public-links-resolve — a link in a published file must resolve in the published tree.
 *
 * Polaris ruling 2026-09-19 on Astra pack E P1-6. The shipped research Markdown carried 21
 * relative `.html` links written for the generated website — `](consult-roofline.html)` and the
 * like — which resolve on margins.ashitaorbis.com and to nothing at all on GitHub, where the
 * reader is looking at the Markdown source. Nine more pointed at `research/reception/*.md`
 * working notes that never ship, and the generated DC ledger cited ten
 * `research/dives/im-arc/*` paths the same way.
 *
 * Two fixes, and this pins both: an annex link is an absolute public-site URL, so it resolves
 * from either surface; and a citation to something the public tree does not carry SAYS SO
 * rather than implying it resolves.
 *
 * Red on the pre-ruling tree: 11 relative annex links and 10 silent unshipped citations.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { provenance } from "./provenance-inputs.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
let fails = 0, passes = 0;
const check = (name, cond, detail = "") => {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
};

/* The allow-list is read from the publisher, so this test follows the publish decision rather
   than a second copy of it — and the read goes through the PROVENANCE GATE, because
   scripts/publish.sh is a registered private input and reading one directly is the defect this
   round has now fixed in four other files. Astra round 3 caught this file reintroducing the same
   dependency class. In the private tree the allow-list decides; in the public stage the
   publisher is absent by design, the gate says so by count, and presence becomes the ships-test
   — which is the right test there, since everything present IS the published tree. */
const prov = provenance("public-links-resolve", check);
let publisher = "";
prov.gate("scripts/publish.sh", 1, (body) => {
  publisher = body;
  prov.assert("the publisher's allow-list was readable and is non-trivial",
    /^ALLOW=\(/m.test(publisher), `${publisher.length} bytes`);
});
const allowed = (publisher.match(/^ALLOW=\(\n([\s\S]*?)^\)$/m)?.[1] || "")
  .split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
/* IN THE PRIVATE TREE the allow-list decides what ships. IN THE RECONSTRUCTED PUBLIC STAGE the
   publisher is absent by design — and everything present IS the published tree, so presence is
   the right test there. The first cut enumerated files with `git ls-files`, which made this
   suite the FOURTH thing in the gate to die on the stage not being a git repository; the walk
   below needs no history and gives the same answer in both trees. */
const ships = (p) => (allowed.length
  ? allowed.some(a => p === a || p.startsWith(a + "/"))
  : existsSync(join(ROOT, p)));

const walk = (rel) => {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const child = rel + "/" + entry.name;
    if (entry.isDirectory()) return walk(child);
    return entry.isFile() && entry.name.endsWith(".md") ? [child] : [];
  });
};
const shippedMarkdown = walk("research").filter(ships).sort();

check(`the research Markdown set was enumerated (${allowed.length ? "allow-list" : "published tree"} mode)`,
  shippedMarkdown.length >= 20,
  `${allowed.length} allow entries, ${shippedMarkdown.length} research .md files`);
prov.summary();

const broken = [];
const relativeHtml = [];
for (const rel of shippedMarkdown) {
  const body = readFileSync(join(ROOT, rel), "utf8").replace(/`[^`\n]*`/g, "");
  for (const m of body.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)) {
    const target = m[1].split("#")[0];
    if (!target) continue;
    if (/\.html$/.test(target)) relativeHtml.push(`${rel} -> ${target}`);
    const resolved = normalize(join(dirname(rel), target));
    if (!existsSync(join(ROOT, resolved)) || !ships(resolved)) broken.push(`${rel} -> ${target}`);
  }
}
check(`no shipped research Markdown link resolves outside the published tree (${shippedMarkdown.length} files)`,
  broken.length === 0, broken.slice(0, 8).join("; "));
check("no shipped research Markdown uses a RELATIVE .html link (it resolves only on the website)",
  relativeHtml.length === 0, relativeHtml.slice(0, 8).join("; "));

/* The generated ledger's citations: every path the public tree does not carry must say so. */
for (const artifact of ["research/dc-registry.md", "site/research/dc-registry.html"]) {
  if (!existsSync(join(ROOT, artifact))) { check(`${artifact} exists`, false); continue; }
  const body = readFileSync(join(ROOT, artifact), "utf8");
  const cited = [...body.matchAll(/research\/dives\/[A-Za-z0-9._/-]+\.md/g)].map(m => m[0]);
  const unique = [...new Set(cited)];
  check(`${artifact} cites the unshipped dives at all (this check is not vacuous)`,
    unique.length > 0, `${unique.length} distinct`);
  /* The Markdown emphasis renders as <em> in the annex HTML, so the label is matched by its
     WORDS following the path, whatever markup carries them. */
  const annotated = [...body.matchAll(/research\/dives\/[A-Za-z0-9._/-]+\.md[^|\n]{0,40}?private working note, not published/g)];
  check(`${artifact} labels every unshipped dive citation as a private working note`,
    annotated.length === cited.length, `${annotated.length} annotated of ${cited.length} citations`);
}

/* A published citation must never be annotated: the label has to mean something. */
{
  const body = readFileSync(join(ROOT, "research/dc-registry.md"), "utf8");
  const mislabelled = [...body.matchAll(/(research\/provider-dives\/[A-Za-z0-9._/-]+)`? ?\*?\(private working note/g)];
  check("a citation the public tree DOES carry is not labelled private",
    mislabelled.length === 0, mislabelled.map(m => m[1]).join("; "));
}


/* ---------------------------------------------------------------------------
 * Two README/citation claims that a first reader checks (Astra pack E P2-1, P2-2).
 * Both were stale rather than wrong-in-kind, and both are cheap to keep true.
 * ------------------------------------------------------------------------- */
{
  const require2 = (await import("node:module")).createRequire(import.meta.url);
  const engine = require2(join(ROOT, "site/engine.js"));
  const cff = readFileSync(join(ROOT, "CITATION.cff"), "utf8");
  const cited = (cff.match(/^version:\s*"?([^"\n]+)"?/m) || [])[1];
  check("CITATION.cff names the engine revision the tree actually exports",
    cited && cited.trim() === engine.ENGINE_REVISION,
    `CITATION.cff says ${cited}, engine exports ${engine.ENGINE_REVISION}`);

  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const claimed = readme.match(/flagship scenarios assume (\d+)[–-](\d+)B active/);
  check("the README states a flagship active-parameter range", !!claimed, "claim not found");
  if (claimed) {
    const actives = engine.MODELS.filter(m => m.id !== "custom" && m.set && m.set.active)
      .map(m => m.set.active).filter(a => a >= Number(claimed[1]) - 0.5);
    const floor = Math.min(...engine.MODELS.filter(m => m.id !== "custom" && m.set && m.set.active
      && m.set.active >= 100).map(m => m.set.active));
    const ceiling = Math.max(...engine.MODELS.filter(m => m.id !== "custom" && m.set && m.set.active)
      .map(m => m.set.active));
    check("...and no shipped flagship preset falls below its stated floor",
      Number(claimed[1]) <= floor, `README floor ${claimed[1]}B, smallest flagship preset ${floor}B`);
    check("...and none exceeds its stated ceiling",
      Number(claimed[2]) >= ceiling, `README ceiling ${claimed[2]}B, largest preset ${ceiling}B`);
    check("the range is not vacuously wide", actives.length >= 3, `${actives.length} presets inside it`);
  }
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log(`\n${fails} PUBLIC-LINK FAILURE(S)`); process.exit(1); }
console.log("\nALL PUBLIC-LINK CHECKS PASS");
