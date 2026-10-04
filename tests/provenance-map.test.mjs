// The private-input registry's three modes around its unserved path map (tests/provenance-private-paths.json), each in a
// tree of its own built under the system temporary directory from this checkout's registry module: (1) no map and no
// private input, the shape of a public stage that lost the map: PRIVATE mode, the hard guard fails, and naming an input
// by path says the map is absent; (2) the map present and no private input, the reconstructed public stage: REDUCED mode,
// keyed inputs skip by count; (3) the map present and one input present: PRIVATE mode, and the hard guard fails on the
// rest (partial presence). Fixture paths are synthetic.
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE = fileURLToPath(new URL("./provenance-inputs.mjs", import.meta.url));
const KEYS = Object.keys(JSON.parse(readFileSync(fileURLToPath(new URL("./provenance-private-paths.json", import.meta.url)), "utf8")).paths);
const scratch = mkdtempSync(join(tmpdir(), "im-provenance-map-"));
const failures = [];
let n = 0;
const check = (label, ok, detail = "") => { n++; if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ""}`); };

async function tree(name, { map, present = [] }) {
  const root = join(scratch, name);
  mkdirSync(join(root, "tests"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}\n");
  copyFileSync(SOURCE, join(root, "tests", "provenance-inputs.mjs"));
  const paths = Object.fromEntries(KEYS.map((key) => [key, `zz-private/${key}.md`]));
  if (map) writeFileSync(join(root, "tests", "provenance-private-paths.json"), JSON.stringify({ paths }));
  for (const key of present) {
    mkdirSync(join(root, "zz-private"), { recursive: true });
    writeFileSync(join(root, paths[key]), "stub\n");
  }
  const R = await import(pathToFileURL(join(root, "tests", "provenance-inputs.mjs")).href);
  const asserts = [];
  const P = R.provenance(name, (label, ok) => asserts.push([label, ok]));
  return { R, P, hardGuardFailed: asserts.some(([label, ok]) => label.includes("HARD GUARD") && !ok) };
}

try {
  const lost = await tree("map-lost", { map: false });
  check("no map: private mode", lost.R.MODE === "private", lost.R.MODE);
  check("no map: the hard guard fails", lost.hardGuardFailed);
  let said = "";
  try { lost.P.has("research/some-memo.md"); } catch (e) { said = e.message; }
  check("no map: a path names the absent map", said.includes("private path map") && said.includes("absent"), said);

  const stage = await tree("public-stage", { map: true });
  check("map, no input: reduced mode", stage.R.MODE === "reduced", stage.R.MODE);
  check("map, no input: no hard guard", !stage.hardGuardFailed);
  let ran = false;
  stage.P.gate(KEYS[0], 3, () => { ran = true; });
  check("map, no input: a keyed gate skips without running", !ran && stage.P.has(KEYS[0]) === false);

  const partial = await tree("partial", { map: true, present: [KEYS[0]] });
  check("map, one input: private mode", partial.R.MODE === "private", partial.R.MODE);
  check("map, one input: the hard guard fails on the rest", partial.hardGuardFailed);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
if (failures.length) {
  console.error(`PROVENANCE MAP FAILURES (${failures.length}/${n})\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`ALL ${n} PROVENANCE MAP CASES PASS`);
