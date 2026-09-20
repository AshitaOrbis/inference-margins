/* Release-binding suite for the Worker's get_report path.
   Pro review 2026-07-29 rec 6 / finding C-6, re-found 2026-08-16 as bq-1253: the Worker baked
   its report CATALOG at build time but fetched document CONTENT from the live site at call
   time, so a Worker built at one release served another release's prose under the words
   "archived verbatim". Measured live 2026-08-21 against margins-mcp.ashitaorbis.com: the
   deployed Worker's own engine reported v3.0.0-2026-08-13 while get_report("front-page")
   returned bytes stamped release-commit faf6bec (2026-08-18).

   These tests exercise the REAL overrides/reports.ts. Because that module's only non-generated
   import is the engine bridge (a bundler-only CJS interop that Node cannot load), the suite
   compiles src/gen/ into a temp dir with a stub engine and imports the compiled module — the
   archive, the catalog, readArchived and extractSection are all the shipped code. */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.resolve(__dirname, "..");
const GEN = path.join(WORKER, "src", "gen");
const SITE_DIR = path.resolve(WORKER, "..", "..", "site");

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

if (!fs.existsSync(path.join(GEN, "archive.gen.ts"))) {
  throw new Error("src/gen/archive.gen.ts is missing — run `npm run build` in mcp-server/worker first");
}

/* Compile the generated tree + the real reports module with a stub engine bridge. */
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), "im-worker-relbind-"));
const SRC = path.join(OUT, "src");
fs.mkdirSync(SRC, { recursive: true });
for (const f of fs.readdirSync(GEN)) {
  if (f.endsWith(".ts")) fs.copyFileSync(path.join(GEN, f), path.join(SRC, f));
}
fs.writeFileSync(path.join(SRC, "engine.ts"), `
export const E = { ENGINE_REVISION: "stub", DATA_AS_OF: "stub", finalAnswer: () => ({ subject: "s", tokens: {} }) } as any;
export const SITE = { calculator: "https://margins.ashitaorbis.com/", annex: "https://margins.ashitaorbis.com/research/" } as const;
export function engineStamp() { return { revision: E.ENGINE_REVISION, data_as_of: E.DATA_AS_OF }; }
`);
fs.writeFileSync(path.join(OUT, "tsconfig.json"), JSON.stringify({
  compilerOptions: {
    target: "ES2022", module: "ESNext", moduleResolution: "bundler", strict: false,
    esModuleInterop: true, skipLibCheck: true, outDir: "js", lib: ["ES2022", "DOM"],
  },
  include: ["src/reports.ts", "src/catalog.gen.ts", "src/archive.gen.ts", "src/engine.ts"],
}, null, 2));
execFileSync(path.join(WORKER, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.json"], { cwd: OUT, stdio: "pipe" });
fs.writeFileSync(path.join(OUT, "js", "package.json"), JSON.stringify({ type: "module" }));
const JS = path.join(OUT, "js"); // tsc collapses the single rootDir, so the modules land here directly
const reports = await import(pathToFileURL(path.join(JS, "reports.js")).href);
const { CATALOG } = await import(pathToFileURL(path.join(JS, "catalog.gen.js")).href);
const { ARCHIVE, RELEASE } = await import(pathToFileURL(path.join(JS, "archive.gen.js")).href);

test("every catalog path has bundled bytes — no id that lists but cannot be served", () => {
  assert.ok(CATALOG.length >= 40, `catalog looks truncated: ${CATALOG.length} entries`);
  for (const item of CATALOG) {
    assert.ok(ARCHIVE[item.path], `catalog id "${item.id}" names path "${item.path}" with no archived bytes`);
  }
});

test("the archive IS the release's bytes — byte-identical to the site tree, digests agree", () => {
  const paths = Object.keys(ARCHIVE);
  assert.ok(paths.length >= 38, `archive looks truncated: ${paths.length} documents`);
  for (const rel of paths) {
    const onDisk = fs.readFileSync(path.join(SITE_DIR, rel), "utf8");
    assert.equal(ARCHIVE[rel].text, onDisk, `${rel}: bundled bytes differ from the site tree`);
    assert.equal(ARCHIVE[rel].sha256, sha256(onDisk), `${rel}: baked sha256 does not describe the bundled bytes`);
  }
});

test("RELEASE names the release, and the bundled front page carries that same stamp", () => {
  assert.match(RELEASE.built_from, /^[0-9a-f]{7,40}(-dirty)?$|^unknown$/, "built_from is not a commit-shaped identity");
  assert.ok(RELEASE.engine_revision && RELEASE.data_as_of, "release identity is missing engine provenance");
  assert.equal(RELEASE.documents, Object.keys(ARCHIVE).length);
  const front = CATALOG.find((i) => i.kind === "front-page");
  const stamp = ARCHIVE[front.path].text.match(/<span id="release-commit">([^<]*)<\/span>/);
  assert.ok(stamp, "the bundled front page has no release-commit stamp to check against");
  assert.equal(stamp[1].trim(), RELEASE.site_release_commit,
    "the declared site_release_commit disagrees with the stamp inside the bundled front page");
});

test("reading a report is a pure archive read — the served bytes are the release's bytes", async () => {
  const catalog = reports.reportCatalog();
  const front = CATALOG.find((i) => i.kind === "front-page");
  const got = await catalog.get(front.id).read();
  assert.equal(got, fs.readFileSync(path.join(SITE_DIR, front.path), "utf8"));
  assert.equal(catalog.get(front.id).sha256, sha256(got));

  const annex = CATALOG.find((i) => i.kind === "annex-doc");
  const annexText = await catalog.get(annex.id).read();
  assert.equal(annexText, fs.readFileSync(path.join(SITE_DIR, annex.path), "utf8"));

  // a front-page SECTION is a slice of the bundled front page, not of anything fetched
  const sec = CATALOG.find((i) => i.kind === "report-section");
  const secText = await catalog.get(sec.id).read();
  assert.ok(secText.length > 0, "section slice is empty");
  assert.ok(got.includes(secText), "the section was not sliced out of the bundled front page");

  // final-answer stays the ONE live engine render, and is not digest-pinned
  assert.equal(catalog.get("final-answer").sha256, null);
});

test("network-free by construction — the reports path performs no runtime fetch", () => {
  const src = fs.readFileSync(path.join(WORKER, "overrides", "reports.ts"), "utf8");
  assert.equal(/(^|[^.\w])fetch\s*\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), false,
    "overrides/reports.ts still calls fetch() — the live-site read is what rec 6 / C-6 is about");
  assert.ok(!src.includes("cacheEverything"), "a live-fetch cache hint survived the rec 6 fix");
  assert.ok(src.includes("readArchived"), "the bundled-archive read is missing");
});

test("get_report surfaces the provenance of what it served", () => {
  const src = fs.readFileSync(path.join(WORKER, "overrides", "get_report.ts"), "utf8");
  assert.ok(src.includes("live_fetch: false"), "the response no longer declares that this was not a live read");
  assert.ok(src.includes("document_sha256: entry.sha256"), "the per-document digest is not surfaced to callers");
  assert.ok(src.includes("built_from: RELEASE.built_from"), "the response does not name the release it came from");
});

process.on("exit", () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* temp dir */ } });
