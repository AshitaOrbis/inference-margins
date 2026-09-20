/* One synthetic, production-shaped dc-map substrate release, and one complete scenario bundle for
   it — shared by BOTH suites that have to agree about it:

     mcp-server/test/dcmap-*.test.mjs   drives it through the registered MCP tools
     dc-map/site/test/calculator-parity.test.ts   drives it through the browser calculator

   That shared authorship is the point. The U5 parity claim is "for the same inputs, the browser
   calculator path and the MCP path produce the same DTO", and two independently written fixtures
   would let the two paths agree about different objects.

   It is a plain .mjs module with no dependencies so `node --test` and vitest can both import it.

   Provenance: the promoted presentation bytes are the producer's own committed
   dc-map/build/fixtures/nonempty snapshot, unmodified except for the two promoted energy atoms and
   the T4 adapter this scenario needs — the same additions dc-map/economics/test/fixture.ts makes,
   because a tariff version and a key-level hardware count are not in the presentation projection.
   NOTHING here is a real-world assertion: every value is synthetic and labelled as such. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
const FIXTURE_DIR = resolve(REPO_ROOT, "dc-map", "build", "fixtures", "nonempty");
const PRESENTATION = ["site-data.json", "sites.geojson", "summary.json"];

export const sha256 = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");

const component = (id, charge, unit, billing_basis) =>
  ({ id, charge, unit, billing_basis, effective_from: "2026-01-01", effective_to: "2027-01-01" });

/** The synthetic promoted tariff version. Complete, effective, and explicitly not a real filing. */
export const tariffValue = () => ({
  schedule: "synthetic-v1", docket: "synthetic", regulatory_status: "effective",
  effective_from: "2026-01-01", effective_to: "2027-01-01", currency: "USD",
  service_class: "large-load", voltage_band: "high",
  energy_components: [component("energy", 0.05, "USD/kWh", "energy")],
  demand_components: [{ ...component("demand", 10, "USD/kW-period", "billing-demand"), ratchet: { fraction: 0.8 } }],
  fixed_fees: [component("fixed", 100, "USD/period", "fixed")],
  riders: [component("rider", 0.01, "USD/kWh", "energy")],
  taxes: [component("tax", 5, "%", "subtotal")],
  minimum_bill: 0, ramp: "none", connection_costs: 0, collateral: 0, exit_terms: "none",
  completeness: "complete", unresolved_components: [], url: "https://example.test/tariff",
});

/** One declared load shape: a 720-hour September cycle annualized to 8760 hours. */
export const loadShape = () => ({
  boundary: "it-input",
  periods: [{
    id: "september", start: "2026-09-01", end: "2026-10-01",
    intervals: [{ hours: 720, kw: 75, tou: "all" }],
    billing_demand_kw: 100, historical_peak_kw: 150, capacity_kw: 100, load_factor: 0.75,
  }],
  annualization: { annual_hours: 8760, assumption_id: "annual" },
  assumption_id: "load",
});

/** The T4 adapter row: a disclosed key-level count whose serving allocation stays unsplit. */
export const adapterRow = () => ({
  company: "anthropic", site: "Synthetic acceptance campus", operator: "Synthetic operator",
  regionRef: "us-industrial", facilityClass: "purpose-built-ai", facilityClassBasis: "analyst-set",
  accelerators: [{
    hwKey: "h100", count: { lo: 100, mid: 100, hi: 100 }, basis: "disclosed installed count",
    observationKind: "point", source: "https://example.test/hardware",
    sourceFile: "mcp-server/test/dcmap-scenario-fixture.mjs", sourceNeedle: "hardware-1", asOf: "2026-09-01",
  }],
  servingEvidence: [{
    company: "anthropic", role: "serving-tenant", presets: ["opus"], allocation: "unsplit",
    asOf: "2026-09-01", source: "https://example.test/serving",
  }],
  electricity: { inherit: "us-industrial", observationKind: "region-fill",
    note: "Synthetic regional fallback; not used for complete site token billing." },
  pue: null, procurement: "mixed", rent: null, tco: {}, coverage: "partial",
  sourceFile: "mcp-server/test/dcmap-scenario-fixture.mjs", sourceNeedle: "identity-1",
  provenance: "Synthetic promoted acceptance fixture only. The per-key physical inventory is disclosed "
    + "in this fixture, while provider allocation stays explicitly unsplit and adds no serving coverage.",
});

/** The fixed comparison profile both paths hold constant. */
export const COMPARISON_PROFILE = {
  workload: { model_id: "opus", traffic: { mode: "native" } },
  hardware_key: "h100", procurement: "owned-strategic-tco", date: "2026-09-05",
  currency: "USD", term_years: 1, perspective: "owner-operator", metric: "cost-per-million-tokens",
};

/** Build the release bytes. `change(site, tariffAtom, adapter)` may mutate before hashing. */
export function buildSyntheticRelease(change) {
  const manifest = JSON.parse(readFileSync(resolve(FIXTURE_DIR, "manifest.json"), "utf8"));
  const artifacts = Object.fromEntries(PRESENTATION.map((n) => [n, readFileSync(resolve(FIXTURE_DIR, n), "utf8")]));
  for (const n of PRESENTATION) {
    if (sha256(artifacts[n]) !== manifest.artifacts[n]) throw new Error(`producer fixture digest mismatch: ${n}`);
  }
  const data = JSON.parse(artifacts["site-data.json"]);
  const site = data.sites.find((s) => s.slug === "test-alpha");
  if (!site) throw new Error("producer fixture no longer carries test-alpha");
  const atom = (evidence_id, field, value) => ({
    ...site.coordinates, evidence_id, field, value, unit: null, measurement_boundary: null,
    capacity_state: null, quantity_kind: null, quantity_basis: null, coverage_entity_ids: null,
    phase_id: null, service_boundary_id: "meter-1",
  });
  const tariff = atom("tariff-1", "energy.tariff", tariffValue());
  tariff.entity_id = "utility";
  site.tariff.push(tariff);
  site.tariff_applicability.push(atom("app-1", "energy.tariff_applicability", {
    tariff_ref: "tariff-1", state: "confirmed", service_class: "large-load", voltage: "high",
    demand_mw: 1, eligibility_date: "2026-01-01", evidence: "synthetic promoted application",
  }));
  const adapter = {
    release_id: manifest.release_id, schema_version: 1, contract_version: "dc-map/v0.3",
    assessment_as_of: data.assessment_as_of, DATACENTERS: { "test-alpha": adapterRow() },
    excluded: [], fallback_receipts: [], validation: { ok: true, errors: [] },
  };
  change?.(site, tariff, adapter);
  artifacts["site-data.json"] = JSON.stringify(data);
  artifacts["t4-adapter.json"] = JSON.stringify(adapter);

  /* PRODUCTION-shaped, not fixture-shaped: the MCP server opens the active release in production
     mode, which requires an immutable identity (registry hash, engine version, batch id) and a T4
     adapter. A synthetic release still mints its own exact id from its own bytes — it never
     impersonates a substrate release built by the producer. */
  const release_id = "rel-" + sha256(JSON.stringify(artifacts)).slice(7, 31);
  const out = { ...manifest, release_id, artifacts: {} };
  delete out.fixture_only; delete out.fixture_format; delete out.fixture_name;
  out.registry_hash = sha256("dc-map/u5 synthetic parity registry");
  out.engine_version = "synthetic-u5";
  out.batch_id = "batch-u5-synthetic";
  for (const n of [...PRESENTATION, "t4-adapter.json"]) {
    const parsed = JSON.parse(artifacts[n]);
    parsed.release_id = release_id;
    artifacts[n] = JSON.stringify(parsed);
    out.artifacts[n] = sha256(artifacts[n]);
  }
  return { manifest: JSON.stringify(out), artifacts, release_id };
}

/** A complete cost pool for test-alpha on that release: every material component covered. */
export function scenarioBundle(release_id) {
  const assumptions = ["load", "annual", "operating", "class-pue", "capital", "zero"].map((id) => ({
    id, description: `Synthetic U5 parity assumption for ${id}; no real-world disclosure implied.`,
    scope: "modeled", evidence_ids: [],
  }));
  const cost = (id, scopes, amount) => ({
    id, kind: "capital", scopes, amount: { lo: amount, mid: amount, hi: amount },
    currency: "USD", price_year: 2026, service_boundary_id: "meter-1", life_years: 5,
    residual_fraction: 0, capital_rate: 0, provenance: { kind: "assumption", assumption_id: "capital" },
  });
  return {
    version: "dc-map/economics/v1", release_id, id: "u5-parity-scenario",
    comparison: { parameters: COMPARISON_PROFILE }, assumptions,
    pool: {
      id: "pool-1", site_id: "test-alpha", phase_ids: [], service_boundary_id: "meter-1",
      coverage_entity_ids: ["test-alpha"], mode: "scenario",
      hardware_allocation_assumption_id: "operating",
      hardware: [{ kind: "disclosed", hw_key: "h100", count: 100, evidence_id: "hardware-1" }],
      pue: { value: 1.2, basis: "class", provenance: { kind: "assumption", assumption_id: "class-pue" },
        numerator: "facility-input", denominator: "it-input" },
      utilization: 0.5, occupancy: 1, operating_assumption_id: "operating",
      load_shape: loadShape(),
      electricity: { tariff_ref: "tariff-1", applicability_ref: "app-1", bounded_components: [] },
      costs: [cost("hardware", ["installed-it"], 1000000), cost("facility", ["land", "shell", "electrical-cooling-fitout"], 100000)],
      rent: null,
      verified_zero_components: ["network", "support", "cooling", "water", "taxes"]
        .map((c) => ({ component: c, provenance: { kind: "assumption", assumption_id: "zero" } })),
    },
  };
}

/** A second pool at the same site with a larger hardware capital cost — the replacement side of
 *  impact, and a ranking entry whose band is disjoint from the first, so the groups are two. */
export function replacementBundle(release_id) {
  const bundle = scenarioBundle(release_id);
  bundle.id = "u5-parity-replacement";
  bundle.pool = { ...bundle.pool, id: "pool-2" };
  bundle.pool.costs = bundle.pool.costs.map((c) =>
    c.id === "hardware" ? { ...c, amount: { lo: 2000000, mid: 2000000, hi: 2000000 } } : c);
  return bundle;
}

/** A third entry whose declared cost band STRADDLES the first scenario's point, so ranking has to
 *  answer with a connected overlap group rather than an order. This is the ambiguity case: the two
 *  cannot be ranked against each other on this evidence, and the response must say so. */
export function overlappingBundle(release_id) {
  const bundle = scenarioBundle(release_id);
  bundle.id = "u5-parity-overlapping";
  bundle.pool = { ...bundle.pool, id: "pool-3" };
  bundle.pool.costs = bundle.pool.costs.map((c) =>
    c.id === "hardware" ? { ...c, amount: { lo: 800000, mid: 1000000, hi: 1400000 } } : c);
  return bundle;
}

/** A fourth entry that CANNOT be ranked: its hardware is a different accelerator from the fixed
 *  comparison profile, and there is no default all-in cross-accelerator metric to convert it with.
 *  It must appear under `excluded` with that reason, never silently dropped. */
export function ineligibleBundle(release_id) {
  const bundle = scenarioBundle(release_id);
  bundle.id = "u5-parity-ineligible";
  bundle.pool = { ...bundle.pool, id: "pool-4" };
  bundle.pool.hardware = [{ kind: "hypothetical", hw_key: "h200", count: 100, assumption_id: "operating" }];
  return bundle;
}

/* The four schedule tokens U5 has to prove are RELAYED and never fabricated. They are written into
   the promoted bytes as the PRODUCER's derived assessments — the tool's job is to hand them back
   with their formula and their as-of date, not to re-derive them from a clock, and not to soften
   `overdue-unverified` into "delayed". `no-baseline` is here for the same reason: it is a decision
   the producer recorded, and it must never be inferred from an empty export. */
export const RELAYED_ASSESSMENTS = ["timing-indeterminate", "target-window-open", "overdue-unverified", "no-baseline"];

/** Append one schedule comparison per relayed token to `site`, modelled on the producer's shape. */
export function withScheduleWindows(site) {
  const template = site.schedule?.[0];
  if (!template) throw new Error("producer fixture no longer carries a schedule comparison to model on");
  site.schedule = [...site.schedule, ...RELAYED_ASSESSMENTS.map((assessment, index) => {
    const key = `u5-${assessment}`;
    const baseline = assessment === "no-baseline" ? null : {
      ...structuredClone(template.baseline),
      evidence_id: `ev-u5-${index}`,
      value: { ...structuredClone(template.baseline.value), target_id: key, milestone: "grid-energized" },
    };
    return {
      key, milestone: "grid-energized", phase: null,
      baseline, latest_target: null, event: null,
      baseline_assessment: {
        assessment, assessment_as_of: template.baseline_assessment.assessment_as_of,
        baseline_target_id: assessment === "no-baseline" ? null : key,
        formula: "decision-table@v2", revised: false, timing_difference_days: null,
      },
      latest_assessment: null,
    };
  })];
}

/** Mark the promoted tenant record prospective, so the stakeholder sentence has to say so. */
export function withProspectiveTenant(site) {
  const tenant = site.tenants?.[0];
  if (!tenant) throw new Error("producer fixture no longer carries a tenant record");
  tenant.value = { ...(tenant.value && typeof tenant.value === "object" ? tenant.value : {}), role: "prospective" };
}

/** Write the release into `dir` and activate it, exactly as the producer's layout expects. */
export function materializeRelease(dir, built = buildSyntheticRelease()) {
  rmSync(dir, { recursive: true, force: true });
  const releaseDir = resolve(dir, built.release_id);
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(resolve(releaseDir, "manifest.json"), built.manifest);
  for (const [name, bytes] of Object.entries(built.artifacts)) writeFileSync(resolve(releaseDir, name), bytes);
  writeFileSync(resolve(dir, "CURRENT"), built.release_id + "\n");
  return built;
}

/** The committed cross-suite parity vector: the projection both paths must reproduce. */
export const PARITY_VECTOR_PATH = resolve(HERE, "dcmap-parity-vector.json");

/** The comparable projection of a priced scenario DTO — profile hash, bands, receipts (U5 §4). */
export function parityProjection(result) {
  return {
    status: result.status,
    sentence: result.sentence,
    site_id: result.site_id,
    pool_id: result.pool_id,
    scenario_id: result.scenario_id,
    profile_hash: result.profile_hash,
    value: result.value,
    annual_cost: result.annual_cost,
    cost_breakdown: result.cost_breakdown,
    missing: result.missing,
    margin: result.margin,
    coverage: result.coverage,
    throughput: result.throughput,
    receipts: result.receipts,
    engine: result.engine,
  };
}
