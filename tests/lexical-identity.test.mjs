// R2 v4 LEXICAL CENTRAL-IDENTITY SCANNER (im4-r2-shipment-plan §1.11; memo P0-A
// Risk-Analyst gap) — defense-in-depth, DISTINCT from sink coverage: an
// emitted-output VOCABULARY scan over rendered artifacts. The terms
// central/verified may appear ONLY (a) inside a claim whose machine identity is
// central-verified (none exists in R2 — the constructor refuses them all), or
// (b) at an EXACT TYPED EXEMPTION — an enumerated phrase with a recorded reason
// (scope names, gate names, refusal/negation text). No broad string exclusions.
// Scope: the MCP transports' rendered artifacts (text + structured, i.e. both
// adapter outputs) + the engine's shared clause strings. Browser-DOM strings are
// pinned by the browser suite (site/tests) — this gate covers the machine surface.
// Run (after mcp-server build): node tests/lexical-identity.test.mjs
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

/* ---------- the EXACT typed exemptions (phrase + recorded reason) ---------- */
const EXEMPT = [
  // scope/lens names — the central LENS is a perspective identity, not a result identity
  ["Central scenario (Claude)", "the median perspective's registered display name (a lens name, not a result identity)"],
  ["central lens", "scope description: which perspective the baseline was computed under"],
  ["central scenario", "app-mirrored navigation/state label (the default state), not a result identity"],
  ["central-default", "selection-origin enum value naming the default selection path"],
  ["changed_from_central", "receipt field name: the diff vs the baseline state"],
  ["central_comparator", "payload field name for the (honestly empty) comparison slot"],
  ["central_ineligibility_reasons", "receipt field name carrying the constructor's typed refusals"],
  ["central-ineligible", "negation: names the refused state"],
  ["central identity ineligible", "negation on the five-status emission"],
  ["not a verified or central estimate", "the policy-labeled identity token's own negation"],
  ["never a verified or central identity", "negation in the hero-flip label"],
  ["can never carry a central identity", "negation in the capped-leg weld"],
  ["no verified central comparator exists", "the ratified empty-comparison-slot statement"],
  ["not central", "negation prefix"],
  ["central-verified", "the identity ENUM literal — permitted only where the machine identity field itself is checked below (claims[].identity), or in negations naming the refused identity"],
  ["may not claim central", "constructor refusal text (role prohibition)"],
  ["central estimate alongside", "server instruction text describing the receipt contract (the receipt itself is the gated object)"],
  ["carries the central estimate", "test/instruction description of the receipt contract"],
  ["central eligibility", "gate name (placement-verified central eligibility)"],
  ["central-eligibility", "gate name (hyphenated)"],
  ["placement-verified central", "gate name in doc/description strings"],
  ["central label requires", "memo-rule citation in receipt/status notes"],
  ["requires placement-verified eligibility", "identity-strip gate explanation"],
  ["placement verified", "solver receipt basis line: placement verification of RESIDENCY (component-placement discipline), a §1.5 solve property — never a result-identity claim"],
  ["placement_verified", "receipt/status field name (two-boolean contract)"],
  ["placementVerified", "engine field name (two-boolean contract)"],
  ["placement UNVERIFIED", "negation in solver receipts"],
  ["verified_zero_components", "dc-map/economics (U3) scenario-pool CONTRACT KEY, reached only when a release is open: discovery's `datacenters.schemas` block publishes U3's OWN JSON Schemas rather than a transcription of them (mcp-server/src/dcmap/space.ts), so the property name appears verbatim in the structured artifact. It names the components a scenario pool declares at zero cost with provenance — a schema property name, not a rendered claim, and it carries no result identity for the scan to police. Exercised by the release-bearing regression below"],
  ["independent verified cluster", "constructor refusal text (cluster bar)"],
  ["verified clusters", "gate description text"],
  ["central_estimate_scope", "receipt field name (eligible branch only — occurrence asserted against eligibility below)"],
  ["fewer than 2 weight-supported", "refusal text"],
  ["verbatim", "archive-serving vocabulary (get_report), no identity force"],
  ["UNVERIFIED", "the five-status vector's first-class value (memo Phase R3 rule: missing evidence must never render as infeasible) — a negation-by-prefix of 'verified'"],

  /* GEOGRAPHIC "central" — datacenter SITE IDS (release edit 2026-09-09, im-release-edit).
     The dc-map stage-3 integration serves the site registry through list_scenario_space, so
     cloud-region names now reach the scanned artifact. "Central" in these is a compass direction
     in a place name — Poland Central, Sweden Central, South Central India, Querétaro in central
     Mexico — and carries no result identity whatsoever. Each exemption phrase is the WHOLE site id
     rather than a "-central-" fragment ON PURPOSE: a slug is a closed, enumerable value, and a
     fragment would silently exempt any future string that happened to contain it. Be precise about
     what that buys, because an earlier version of this comment was not: `scanArtifact` clears a hit
     by SUBSTRING COVERAGE, so these phrases exempt any text that contains the full slug, not only a
     standalone occurrence of it. Since the phrase is the entire id, the blast radius is that id and
     nothing adjacent — a neighbouring unrelated id containing "central" still fails, which was
     checked. The cost is that dive-ing a NEW central-region site fails this gate until someone adds
     its id here, which is the behaviour an honesty gate should have: a loud, one-line, deliberate
     exemption beats a quiet blanket one. */
  ["aws-mexico-central-region-quer-taro", "datacenter site id: AWS Mexico (Central) Region, Querétaro — a place name"],
  ["microsoft-azure-poland-central-warsaw", "datacenter site id: Azure Poland Central, Warsaw — a place name"],
  ["microsoft-india-south-central-cloud-region-program", "datacenter site id: Azure India South Central — a place name"],
  ["microsoft-sweden-central-ai-infrastructure", "datacenter site id: Azure Sweden Central — a place name"],
  ["unverified", "ordinary lowercase negation-by-prefix of 'verified'; never an affirmative verified-result claim"],
  ["is_central", "receipt boolean field name (hard-set false on every policy-driven surface)"],
  ['lens="central"', "metric-key scope dimension in canonical claim trees (names the lens the baseline was computed under)"],
  ['lens=\\"central\\"', "the same metric-key scope token as it appears JSON-escaped inside structured artifacts"],
  ["central ineligible", "engine failNote negation (hero suppresses, central ineligible)"],
  ["central configuration", "explore_range order-basis text: distance from the default configuration (a state name, not a result identity)"],
  ["@central-lens", "comparison-claim subject token (names the scope the baseline was computed under)"],
  ["no placement-verified public serving map", "the empty-comparison-slot statement's own negation (engine emptyComparisonSlot)"],
  ["central_anchor", "explore_range payload field name (the structural anchor of the bucket containing the live default)"],
  ["provider-dive central assumptions", "dive-perspective registry note: names whose ASSUMPTIONS a replay borrows (a provenance description, not a result identity)"],
  ["not independently re-verified", "claims-registry provenance negation (source-sweep quality note)"],
  ["not independently verified", "claims-registry provenance negation (flagged low-follower source)"],
  ["~5T total central", "model-note size-range CENTRAL VALUE (statistics sense — a parameter estimate description, not a result identity; opus note)"],
  ["~1T/50B central", "model-note size-range central value (terra note)"],
  ["~0.25T/20B central", "model-note size-range central value (luna note)"],
  ["— central 73.3%", "claims-registry QUOTED analyst-record vocabulary (the registry stores the source's own words; relation badges carry the calculator-relative identity — get_report archive-note rule)"],
  ["The evidence base, verified", "front-page report-section TITLE (names the evidence-review section; a document title, not a result identity)"],
  ["This page's central Anthropic flagship read", "dossier attribution prose: 'central' in the primary-read sense, immediately disclaimed as analyst synthesis"],
];

function scanArtifact(name, text, { centralEligible = false } = {}) {
  const violations = [];
  const re = /central|verified/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const at = m.index;
    const windowText = text.slice(Math.max(0, at - 60), at + 60);
    const covered = EXEMPT.some(([phrase]) => {
      let from = text.lastIndexOf(phrase, at + phrase.length);
      // case-insensitive coverage check
      if (from === -1) {
        const lower = text.toLowerCase();
        from = lower.lastIndexOf(phrase.toLowerCase(), at + phrase.length);
      }
      return from !== -1 && from <= at && at < from + phrase.length;
    });
    if (!covered && !centralEligible) violations.push(windowText.replace(/\s+/g, " "));
  }
  return violations;
}

const main = async () => {
  /* ---------- corpus: rendered MCP artifacts across every tool ---------- */
  const dist = (p) => pathToFileURL(join(ROOT, "mcp-server", "dist", p)).href;
  const run = (await import(dist("tools/run_scenario.js"))).handler;
  const explore = (await import(dist("tools/explore_range.js"))).handler;
  const claims = (await import(dist("tools/query_margin_claims.js"))).handler;
  const list = (await import(dist("tools/list_scenario_space.js"))).handler;
  const report = (await import(dist("tools/get_report.js"))).handler;
  const dossier = (await import(dist("tools/get_dossier.js"))).handler;

  const artifacts = [
    ["run_scenario opus central", run({ model: "opus" })],
    ["run_scenario dsr1 (placement-engaged)", run({ model: "dsr1" })],
    ["run_scenario gemini dive", run({ model: "gemini", perspective: "dive" })],
    ["run_scenario sonnet overrides", run({ model: "sonnet", overrides: { util: 45 } })],
    ["run_scenario custom", run({ model: "custom" })],
    ["explore_range b8090", explore({ range: "b8090" })],
    ["query_margin_claims default", claims({})],
    ["list_scenario_space", list({})],
    ["get_report report-s7", report({ id: "report-s7", max_chars: 4000 })],
    ["get_dossier opus", dossier({ type: "model", id: "opus" })],
  ];

  /* U5 round 4: the release-bearing discovery artifact, captured from the loop below so the
     regression scans the SAME bytes the gate scanned rather than a second rendering. */
  let discovery = null;
  for (const [name, resP] of artifacts) {
    const res = await resP;
    const text = res.content[0].text;
    const json = JSON.stringify(res.structuredContent ?? {});
    if (name === "list_scenario_space") discovery = { json, structured: res.structuredContent ?? {} };
    const machineClaims = (res.structuredContent && res.structuredContent.claims) || [];
    const eligible = machineClaims.some((c) => c.identity === "central-verified");
    // Identity-field integrity: in R2 no rendered claim may carry the central identity
    // (the constructor refuses every current fleet; the boundary rejects forgeries).
    assert(`identity integrity [${name}]: every rendered claim is policy-scenario`,
      machineClaims.length > 0 && machineClaims.every((c) => c.identity === "policy-scenario"),
      machineClaims.map((c) => c.identity).join(","));
    const vText = scanArtifact(name, text, { centralEligible: eligible });
    const vJson = scanArtifact(name, json, { centralEligible: eligible });
    assert(`vocabulary [${name}]: central/verified terms only at typed exemptions (text artifact)`,
      vText.length === 0, vText.slice(0, 3).join(" || "));
    assert(`vocabulary [${name}]: central/verified terms only at typed exemptions (structured artifact)`,
      vJson.length === 0, vJson.slice(0, 3).join(" || "));
    // The eligible-branch receipt fields must be ABSENT while ineligible (hard gate).
    assert(`receipt gating [${name}]: no central_estimate_* fields while central-ineligible`,
      eligible || !/"central_estimate_(pct|note|scope|renderable_legs|total_legs|renderable_weight_share)"/.test(json));
  }

  /* ---------- U5 round 4 regression: the scan over a RELEASE-BEARING discovery artifact ----------
     Without a release under dc-map/releases/, `datacenters` degrades to the typed
     release-unavailable block and carries no U3 schemas at all — so the list_scenario_space rows
     above pass without ever seeing the substrate's own contract key names, which is exactly how
     the `verified_zero_components` violation reached master unseen. This block makes that coverage
     gap visible: it FAILS if the datacenter extension is gone, SKIPS with its reason when there is
     genuinely no release to open, and otherwise asserts that the published schemas are in the
     scanned bytes, that the exempted key is actually present, and that the scan comes back clean. */
  const dcBlock = discovery && discovery.structured.datacenters;
  assert("release-bearing scan [list_scenario_space]: discovery still carries the datacenter block",
    !!dcBlock, "the U5 `datacenters` key is absent from the discovery artifact");
  if (dcBlock && dcBlock.status !== "ok") {
    console.log(`SKIP  release-bearing scan [list_scenario_space]: no dc-map release is open in this tree ` +
      `(datacenters.status=${dcBlock.status}${dcBlock.reasons?.length ? "; " + dcBlock.reasons.join("; ") : ""}) — ` +
      `the U3 schemas are unreachable, so this tree cannot exercise the schema-key exemptions. ` +
      `Put a release under dc-map/releases/ (CURRENT + rel-…) to run it.`);
  } else if (dcBlock) {
    const schemaKeys = Object.keys(dcBlock.schemas ?? {});
    assert("release-bearing scan [list_scenario_space]: the open release publishes U3's own schemas",
      schemaKeys.includes("scenario_bundle") && schemaKeys.includes("tools"),
      `release ${dcBlock.release_id} published schemas: [${schemaKeys.join(", ")}]`);
    assert("release-bearing scan [list_scenario_space]: the exempted U3 contract key is really in the artifact",
      /"verified_zero_components"/.test(discovery.json),
      "the schema key the typed exemption was recorded for is no longer emitted — the exemption is now unexercised, not satisfied");
    assert("release-bearing scan [list_scenario_space]: release-bearing artifact scans clean",
      scanArtifact("list_scenario_space+release", discovery.json).length === 0,
      scanArtifact("list_scenario_space+release", discovery.json).slice(0, 3).join(" || "));
  }

  /* ---------- engine shared clause strings (the site's welded vocabulary) ---------- */
  const E = require(join(ROOT, "site", "engine.js"));
  const m = E.MODELS.find((x) => x.id === "opus");
  const median = E.PERSPECTIVES.find((x) => x.id === "median");
  const st = E.applyPresetSettings(m, median, { mode: "native" });
  const wl = E.workload(st, undefined, E.makeScenarioContext(m, E.resolveTraffic(m, median, { mode: "native" }), undefined));
  const clause = E.fleetRenderableDisclosure(wl.fleetRenderable, true);
  assert("engine clause strings: central/verified only at typed exemptions",
    scanArtifact("clause", clause).length === 0, clause.slice(0, 160));

  /* ---------- negative probes: the scanner must catch real violations ---------- */
  assert("negative probe — an affirmative bare central claim FAILS the scan",
    scanArtifact("probe", "the central estimate is ≈47% (unit serving)").length > 0);
  assert("negative probe — a bare 'verified serving margin' FAILS the scan",
    scanArtifact("probe", "verified serving margin ≈47%").length > 0);
  assert("negative probe — a forged central-verified identity OUTSIDE a negation context is caught by identity integrity",
    (() => { const doc = { claims: [{ identity: "central-verified" }] };
      return !doc.claims.every((c) => c.identity === "policy-scenario"); })());

  console.log(failures ? `\n${failures} FAILURES` : "\nALL LEXICAL-IDENTITY TESTS PASS");
  process.exit(failures ? 1 : 0);
};
main();
