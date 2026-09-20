/* =====================================================================================
   provenance-inputs.mjs — the ONE registry of PRIVATE inputs the release gates read at
   TEST TIME, and the two-mode discipline that governs them.
   Owner ruling q-row441-publish-fork, 2026-08-06: option C.

   THE PROBLEM. Several release assertions prove that shipped bytes ARE the bytes their
   private design memo pins — the discipline that caught real drift during the b9 arc. Those
   memos are deliberately absent from the public snapshot (publish.sh's allow-list states the
   doctrine: design docs never ship), so those same assertions cannot run inside the
   reconstructed public stage, nor in the public repo's CI. Before this module they died on
   ENOENT and the whole publish was blocked.

   THE RULE. An assertion whose private input is ABSENT skips — and says so loudly, by count,
   under a labeled REDUCED MODE banner. An assertion whose private input is PRESENT always
   runs. PARTIAL PRESENCE IS A FAILURE, never a skip: the moment any registered input exists,
   this is the private tree and every registered input must be there. That hard guard is the
   entire safety property. Without it, option C degrades into "the private gate quietly
   stopped checking" the first time a memo is moved or renamed.

   THERE IS DELIBERATELY NO WAY TO TURN THE PRIVATE GATE OFF. IM_PRIVATE_TREE=1 can only
   TIGHTEN (force private mode where the guard demands all inputs); no environment variable,
   flag or marker file can force reduced mode. Reduced mode is reachable only by the physical
   absence of EVERY registered input — which is exactly what a reconstructed public stage is,
   and is not a state any private checkout can be talked into.

   WHAT MAY LIVE HERE: paths, reasons, counts. NOT the bytes being skipped. A skip must never
   embed what it skips, or the mechanism that keeps the memos private becomes the mechanism
   that publishes them.

   REGISTRY MEMBERSHIP IS EMPIRICAL. This is the set of tracked, non-allow-listed files that
   an fs-level trace of the FULL gate chain (npm test · test:served-node · test:browser ·
   test:served-browser · mcp-server test · npm run build) actually opened, measured
   2026-08-06 at 5dc0501. read()/has()/gate() throw on an unregistered path, so a new
   private read cannot join the gates without joining this list, and snapshots.test.mjs
   asserts the converse — that no row here is an orphan.
   ===================================================================================== */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
/* The repo root is found by walking up to package.json rather than by counting "..", so this
   module resolves identically from the source tests directory and from its served twin
   (the served tree has no package.json, so the walk is unambiguous). */
const ROOT = (() => {
  let d = HERE;
  while (!existsSync(join(d, "package.json"))) {
    const up = dirname(d);
    if (up === d) throw new Error("repo root not found");
    d = up;
  }
  return d;
})();

export const PRIVATE_INPUTS = [
  { path: "research/b9-m6-fa-memo.md",
    why: "M6 §2.9 / §17.2 / §17.4 hold the normative bytes of the FINAL-ANSWER copy the page ships" },
  { path: "research/b9-spec-decode-lever-memo.md",
    why: "the two narrative exceptions registered in [N-BASIS] carry their oracles in the memo itself" },
  { path: "research/im3-integration-design.md",
    why: "T-13 basis-manifest quote citations for the h20 / ascend / trn2 / trn3 rows" },
  { path: "deploy.sh",
    why: "release-entrypoint ordering gates; the master-only deploy path is private by design" },
  { path: "scripts/publish.sh",
    why: "publisher structural and safety gates, incl. allow-list coverage; it carries mutation policy and privacy-pattern bytes and is private by design" },
  /* The ten im-arc working dives the DC registry cites as `sourceFile`, at every depth. T2-DC-5
     and T4-SCHEMA-NEEDLE open each cited source and look for that object's exact needle; the
     allow-list does not ship these, so on the reconstructed public stage those checks failed —
     35 of 40 sourced objects unresolved — and took validate_stage with them (vetting round
     2026-09-19, Astra pack E, found while clearing P1-1..P1-5). Registering them keeps every
     needle binding in the private tree and skips it, by count, where the file is absent by
     design. The list is explicit rather than derived, per this module's own rule: paths,
     reasons, counts — never the bytes.
     SEPARATELY CARDED: research/dc-registry.md and site/research/dc-registry.html — both of
     which DO ship — cite these paths, so a public reader follows them to nothing. Whether the
     dives should become public, or the citations should name something else, is a
     publication-scope question for the owner, not a test-wiring one. */
  { path: "research/dives/im-arc/electricity-gptpro-2026-08-23.md",
    why: "registry cited source for the us-industrial and cn-western electricity rows" },
  { path: "research/dives/im-arc/electricity-fable-2026-08-23.md",
    why: "registry cited source for the cn-coastal electricity row and two named-facility rows" },
  { path: "research/dives/im-arc/electricity-subagent-china-tariffs-2026-08-23.md",
    why: "registry cited source for the China provincial tariff observations" },
  { path: "research/dives/im-arc/electricity-subagent-named-facilities-2026-08-23.md",
    why: "registry cited source for the named-facility electricity rows" },
  { path: "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md",
    why: "registry cited source for thirteen facility and programme fleet-composition rows" },
  { path: "research/dives/im-arc/fleet-composition-synthesis-2026-08-23.md",
    why: "registry cited source for the xai-colossus-c1 mixed-aggregate row" },
  { path: "research/dives/im-arc/tco-inputs-gptpro-2026-08-23.md",
    why: "registry cited source for the xai-colossus-c1 milestone rows" },
  { path: "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md",
    why: "registry cited source for nine RENT_QUOTES planning bands" },
  { path: "research/dives/im-arc/rental-rates-gptpro-2026-08-23.md",
    why: "registry cited source for the h200 reserved-neocloud quote" },
  { path: "research/dives/im-arc/rental-rates-fable-2026-08-23.md",
    why: "registry cited source for the tpu7 Anthropic strategic-estimate quote" },
];

/* Paths cited BY SHIPPED DATA rather than named in a test source. The DC registry's rows carry
   a `sourceFile`, and T2-DC-5 opens each one looking for that row's exact needle — so a
   registered input can be genuinely consumed without its string ever appearing in a .mjs file.
   This set is derived FROM THE REGISTRY, not from a path prefix, so the orphan check below
   stays a real both-directions guarantee: a row here that no registry row cites and no test
   source names is still an orphan. */
const registryCitedSources = () => {
  try {
    const D = createRequire(import.meta.url)(join(ROOT, "site", "engine-data-dc-v1.js"));
    /* Walk at ANY depth, the same way the T4 needle check does: sourced objects are nested
       inside provisionalObservations, mixedAggregate, milestones and the rent-quote rows, so a
       top-level-only scan would call a genuinely consumed input an orphan. */
    const out = new Set();
    const seen = new Set();
    (function walk(node) {
      if (!node || typeof node !== "object" || seen.has(node)) return;
      seen.add(node);
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (typeof node.sourceFile === "string") out.add(node.sourceFile);
      for (const value of Object.values(node)) walk(value);
    })(D);
    return out;
  } catch { return new Set(); }
};
export const CITED_PRIVATE_SOURCES = (() => {
  const cited = registryCitedSources();
  return new Set(PRIVATE_INPUTS.map((input) => input.path).filter((path) => cited.has(path)));
})();

/* Repository-root-relative resolution, identical from the source tests directory and from the
   served twin — callers never count "..". */
export const repoPath = (rel) => join(ROOT, rel);
const abs = (path) => join(ROOT, path);
const registered = (path) => {
  const row = PRIVATE_INPUTS.find((input) => input.path === path);
  if (!row) {
    throw new Error(`provenance: "${path}" is not a registered private input — `
      + "add it to PRIVATE_INPUTS in the provenance-inputs module before any gate reads it");
  }
  return row;
};

export const presentInputs = () => PRIVATE_INPUTS.filter((input) => existsSync(abs(input.path)));
export const missingInputs = () => PRIVATE_INPUTS.filter((input) => !existsSync(abs(input.path)));

/* Tighten-only: forcing PRIVATE makes the guard demand every input. There is no inverse. */
export const MODE = (process.env.IM_PRIVATE_TREE === "1" || presentInputs().length > 0)
  ? "private"
  : "reduced";

/* The registry is enforced in BOTH directions. read()/has()/gate() throw on a path that is not
   registered, which stops a private read from joining the gates unregistered; this closes the
   converse — a row here that nothing consumes would inflate the hard guard with a file no gate
   needs, and the guard would then block the private tree over an input that proves nothing. The
   scan is over the test sources, which are public bytes, so it runs in either mode. */
export function assertNoOrphanRegistrations(assert) {
  const dir = repoPath("tests");
  const sources = readdirSync(dir)
    .filter((name) => name.endsWith(".mjs") && name !== "provenance-inputs.mjs")
    .map((name) => readFileSync(join(dir, name), "utf8"))
    .join("\n");
  const orphans = PRIVATE_INPUTS
    .filter((input) => !sources.includes(`"${input.path}"`) && !CITED_PRIVATE_SOURCES.has(input.path))
    .map((input) => input.path);
  assert("provenance registry: every registered private input is consumed by a gate — no orphan rows",
    orphans.length === 0, `orphans: ${orphans.join(", ")}`);
}

/* One provenance ledger per suite. `assert` is the suite's own assert, so every guard failure
   is an ordinary failing assertion in that suite's output and exit code. */
export function provenance(suite, assert) {
  let executed = 0;
  let skipped = 0;
  const skippedInputs = new Set();

  /* THE HARD GUARD — fires at construction, so a suite cannot use this module without it. */
  if (MODE === "private") {
    const missing = missingInputs().map((input) => input.path);
    assert(`provenance HARD GUARD [${suite}]: the PRIVATE tree carries every registered provenance `
      + "input — a missing one is a FAILURE, never a skip",
      missing.length === 0, `missing ${missing.length}: ${missing.join(", ")}`);
  }

  const api = {
    mode: MODE,
    /* Registry-checked existence, for gates that decide entry-by-entry inside a loop. */
    has(path) { registered(path); return existsSync(abs(path)); },
    read(path) { registered(path); return readFileSync(abs(path), "utf8"); },
    /* A provenance assertion: counted, then delegated to the suite's own assert. */
    assert(name, cond, detail) { executed += 1; assert(name, cond, detail); },
    /* n assertions could not run because their input is absent. `note` names the input, never
       its contents. */
    skip(n, path) { skipped += n; skippedInputs.add(path); },
    /* The common shape: run `fn(...contents)` only when every named input is present, else
       skip the declared number of assertions. The declared number is not taken on trust — in
       the private tree, where the body always runs, it is checked against the assertions that
       actually ran, so a stale count fails the private gate rather than under-reporting a
       public skip. */
    gate(paths, assertions, fn) {
      const list = Array.isArray(paths) ? paths : [paths];
      list.forEach(registered);
      const missing = list.filter((path) => !existsSync(abs(path)));
      if (missing.length) {
        skipped += assertions;
        missing.forEach((path) => skippedInputs.add(path));
        return;
      }
      const before = executed;
      fn(...list.map((path) => api.read(path)));
      const ran = executed - before;
      assert(`provenance [${suite}]: the declared skip count for ${list.join(" + ")} equals the `
        + "assertions that actually ran", ran === assertions, `declared ${assertions}, ran ${ran}`);
    },
    summary() {
      const attempted = executed + skipped;
      if (MODE === "private") {
        assert(`provenance [${suite}]: PRIVATE tree — every memo-backed assertion executed`,
          skipped === 0, `${skipped} skipped: ${[...skippedInputs].join(", ")}`);
        console.log(`provenance: PRIVATE tree — ${presentInputs().length}/${PRIVATE_INPUTS.length} `
          + `registered inputs present; ${executed}/${attempted} memo-backed assertions executed, `
          + `${skipped} skipped [${suite}]`);
        return;
      }
      const rule = "=".repeat(78);
      console.log(rule);
      console.log(`REDUCED MODE: provenance memos absent, ${skipped} assertions skipped [${suite}]`);
      console.log(`  ${executed}/${attempted} memo-backed assertions executed. This run did NOT check`);
      console.log("  shipped bytes against the private design memos that pin them. Those checks are");
      console.log(`  binding, and they run in the private tree, where all ${PRIVATE_INPUTS.length} `
        + "registered inputs must be present.");
      if (skippedInputs.size) console.log(`  absent: ${[...skippedInputs].sort().join(", ")}`);
      console.log(rule);
    },
  };
  return api;
}
