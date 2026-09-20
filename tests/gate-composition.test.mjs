// CANONICAL-GATE COMPOSITION CONTRACT.
//
// WHY THIS EXISTS. GPT Pro review pr-20260902T173936Z-a81123 opened with a BLOCKER: the first cut
// of `npm run gate` called `npm --prefix mcp-server test` from a CI job that installs only the ROOT
// dependency tree. mcp-server and mcp-server/worker carry their own lockfiles and their own
// node_modules, so a FRESH CHECKOUT would have failed there — and it passed locally only because a
// developed tree already has those directories. A gate whose green depends on the developer's disk
// is not a gate. It is exactly the class of defect CI exists to catch, hidden by the environment
// that runs it.
//
// Rather than delete node_modules in CI to prove the failure (slow, and it only proves it once),
// this asserts the CONTRACT structurally: every package boundary the canonical gate crosses must be
// installed in the same CI job, before the gate runs; and the canonical gate must actually be
// canonical — the publication path has to call it rather than enumerate a parallel chain, which was
// the second half of the same finding.
// Run: node tests/gate-composition.test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { provenance } from "./provenance-inputs.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
/* deploy.sh IS ALREADY a registered private input (provenance-inputs.mjs: "release-entrypoint
   ordering gates; the master-only deploy path is private by design"), and publish.sh's
   allow-list deliberately leaves it out of the public snapshot. This file read it directly
   anyway, so on the reconstructed public stage — and therefore in the public repo's CI, and
   therefore inside publish.sh's own validate_stage — `npm test` died here on ENOENT and the
   publish was blocked. Reproduced 2026-09-19 against a stage built from the live allow-list:
   "ENOENT: no such file or directory, open '<stage>/deploy.sh'". The seven deploy-dependent
   assertions now go through the provenance gate, which runs them in the private tree and skips
   them loudly, by count, under the REDUCED MODE banner where the file is absent by design. */
const prov = provenance("gate-composition", assert);

/* Expand `gate` through the scripts map so the contract is checked on what actually RUNS, not on
   the one line someone happened to write. */
function expand(name, seen = new Set()) {
  if (seen.has(name)) return "";
  seen.add(name);
  const body = pkg.scripts?.[name];
  if (!body) return "";
  return body.replace(/npm run ([a-z0-9:_-]+)/g, (m, sub) => " " + expand(sub, seen) + " ");
}
const gateBody = expand("gate");
assert("package.json defines a canonical `gate` script", !!pkg.scripts?.gate);

/* (a) every package boundary the gate crosses is installed in the same CI job, BEFORE the gate */
const prefixes = [...new Set([...gateBody.matchAll(/--prefix\s+(\S+)/g)].map(m => m[1]))].sort();
assert("the canonical gate crosses at least one package boundary (else this contract is vacuous)",
  prefixes.length > 0, JSON.stringify(prefixes));
const siteJob = ci.slice(ci.indexOf("\n  site:"), ci.indexOf("\n  mcp:") >= 0 ? ci.indexOf("\n  mcp:") : ci.length);
const gateStepAt = siteJob.indexOf("run: pnpm run gate");
assert("the CI site job runs the canonical gate", gateStepAt > 0);
for (const pre of prefixes) {
  const installAt = siteJob.indexOf(`--prefix ${pre} ci`);
  assert(`CI installs '${pre}' dependencies in the same job (a fresh checkout has no ${pre}/node_modules)`,
    installAt > 0, `no \`npm --prefix ${pre} ci\` step in the site job`);
  assert(`...and installs '${pre}' BEFORE the gate step, not after`,
    installAt > 0 && installAt < gateStepAt, `install at ${installAt}, gate at ${gateStepAt}`);
}

/* (b) the canonical gate is canonical: the publication path calls it instead of a parallel chain */
prov.gate("deploy.sh", 8, (deploy) => {
    prov.assert("deploy.sh --prepare runs the canonical gate rather than enumerating its own chain",
    /\n\s*npm run gate\b/.test(deploy), "deploy.sh does not call `npm run gate`");
  /* The old parallel chain must be GONE, not merely joined — otherwise both exist and can diverge,
     which is the drift this whole finding is about. */
  for (const stale of ["npm run test:served-node", "npm run test:browser", "npm run test:served-browser", "npm --prefix mcp-server test"]) {
    prov.assert(`deploy.sh no longer enumerates '${stale}' beside the canonical gate`,
      !deploy.includes(stale), "a second chain still exists and can drift from the gate");
  }
  /* test:ops is the ONE deliberate exception and it must stay visible, not silently dropped. */
  prov.assert("deploy.sh still runs the local-only ops regressions the public gate structurally cannot",
    deploy.includes("npm run test:ops"));

  /* (c) THE GATE MUST BE ABLE TO PASS WHERE IT RUNS — bq-2197, im-release-edit-r3 2026-09-10.
     `gate:artifacts` ends in `git diff --exit-code`, which compares the WORKING TREE TO THE INDEX.
     `--prepare` stamps site/index.html and rewrites the asset manifest ON PURPOSE and then runs the
     gate, so unless those intended changes are STAGED FIRST the check compares the release against a
     tree that predates it and can never pass. That is not a hypothetical: it was the actual state of
     this file from 21f437a (which put gate:artifacts into the canonical gate) until it was found —
     deploy.sh had not run in between, so nothing exercised it, and three legs were stopped earlier in
     the chain before reaching it.
     Asserted structurally rather than by running a deploy: `git add -A` must appear BEFORE
     `npm run gate` in prepare(). A composition test that checks the gate is called but not that it
     can pass is only half the contract. */
  {
    const prep = deploy.slice(deploy.indexOf("prepare() {"), deploy.indexOf("publish() {"));
    const addAt = prep.indexOf("git add -A");
    const gateAt = prep.search(/\n\s*npm run gate\b/);
    prov.assert("deploy.sh --prepare stages its intended release changes BEFORE the gate that inspects the tree (bq-2197)",
      addAt > 0 && gateAt > 0 && addAt < gateAt,
      `git add -A at ${addAt}, npm run gate at ${gateAt} — gate:artifacts' \`git diff --exit-code\` `
      + "compares the working tree to the INDEX, so a prepare that stamps and regenerates without "
      + "staging first can never pass its own gate");
    prov.assert("...and an aborted prepare unstages, so a failed gate leaves the tree as it was found",
      /git reset -q/.test(prep), "no `git reset -q` on the prepare failure path");
  }
});
prov.summary();

console.log(failures === 0 ? "\nALL GATE-COMPOSITION TESTS PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
