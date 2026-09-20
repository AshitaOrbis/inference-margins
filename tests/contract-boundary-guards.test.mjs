// R2 MIGRATION BOUNDARY GUARDS (im4-r2-shipment-plan §1.1 P2c/P2d) — release test.
// After the engine migration: (a) NO production source imports/references harness/
// (the reference implementation is migration evidence only — nothing shipped depends
// on it); (b) the production contract suite exercises NO reference-only module (its
// imports resolve to site/engine-contracts-v22.js + the production scanner, never
// harness/); (c) no migration shim survives (P2c: none was ever created — the
// production module is name-compatible; this guard proves the tree agrees).
// Run: node tests/contract-boundary-guards.test.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const root = new URL("../", import.meta.url).pathname;

/* (a) production sources are harness-free */
const prodFiles = ["build-grounding-ledger.mjs", "build-research-html.mjs", "deploy.sh"];
for (const f of readdirSync(join(root, "site")))
  if (/\.(js|html)$/.test(f)) prodFiles.push("site/" + f);
const walk = (dir) => { for (const f of readdirSync(join(root, dir))) {
  const rel = dir + "/" + f; const st = statSync(join(root, rel));
  if (st.isDirectory()) { if (!/node_modules|dist/.test(rel)) walk(rel); }
  else if (/\.(ts|js|mjs|json|toml)$/.test(f)) prodFiles.push(rel); } };
walk("mcp-server/src");
walk("mcp-server/worker/overrides");
walk("mcp-server/worker/src");
walk("mcp-server/worker/scripts");
/* An IMPORT of harness/ is `require("…harness/…")` or `import … from "…harness/…"` —
   prose mentions in comments (migration provenance) are not dependencies. */
const HARNESS_IMPORT_RE = /(?:require\s*\(\s*|from\s+)["'][^"']*harness\/[^"']*["']/;
const harnessHits = prodFiles.filter((f) => {
  try { return HARNESS_IMPORT_RE.test(readFileSync(join(root, f), "utf8")); } catch (e) { return false; }
});
assert("P2d guard: NO production source (site, MCP, worker, build scripts) imports harness/",
  harnessHits.length === 0, JSON.stringify(harnessHits));

/* (b) the production contract suite exercises no reference-only module */
const suiteSrc = readFileSync(join(root, "tests/contract-harness.test.mjs"), "utf8");
assert("P2d guard: the contract suite imports NO harness/ module (production exports only)",
  !HARNESS_IMPORT_RE.test(suiteSrc));
assert("P2d guard: the contract suite runs against site/engine-contracts-v22.js",
  /engine-contracts-v22\.js/.test(suiteSrc));

/* (c) no migration shim survives (P2c) */
assert("P2c guard: no shim file exists (production module is name-compatible; migration used none)",
  !existsSync(join(root, "harness/production-shim.mjs")) && !existsSync(join(root, "site/contracts-shim.js")));

console.log(`\n${failures === 0 ? "ALL CONTRACT-BOUNDARY GUARDS PASS" : failures + " CONTRACT-BOUNDARY GUARD FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
