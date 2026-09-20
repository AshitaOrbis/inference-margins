import { z } from 'zod';
import { ScenarioBundleSchema, ComparisonPathSchema, id, nonnegative, COMPONENTS, type Band, type ComparisonProfile, type Cost, type Pool, type Provenance, type Receipt } from './types.js';
import { assertRelease, type Release } from './release.js';
import { evidenceIndex, calculatorEligibility, currentEvidence, objectValue } from './evidence.js';
import { validateComparison, annualize, addBands, mapBand, inclusionMatrix, canonical } from './validate.js';
import { billTariff } from './tariff.js';
import { validatedAdapter, priceWithLegacy, legacyState, type EconomicsContext, type RunScenarioEnvelope } from './legacy.js';
import type { Json } from './presentation.js';

export interface ModeledValue {
  band: Band; unit: string; status_fused: string;
  scope: {result: 'modeled'; inputs: Array<'modeled' | 'disclosed' | 'forecast'>};
}
export interface ScenarioResult {
  status: 'modeled' | 'insufficient-evidence'; sentence: string; release_id: string;
  scenario_id: string | null; site_id: string | null; pool_id: string | null;
  profile_hash: string | null; value: ModeledValue | null; annual_cost: Band | null;
  cost_breakdown: Array<{component: string; annual: Band}>;
  missing: string[]; receipts: Receipt[]; margin: string | null;
  selection_receipt: Record<string, Json>; engine: {revision: string; data_as_of: string};
  coverage: {hardware: 'disclosed-key-count' | 'hypothetical' | 'unsplit' | 'unresolved'; provider_allocation: 'unresolved'; factual_coverage_increased: false};
  throughput: {input_tokens_per_second: number; output_tokens_per_second: number} | null;
  /** DESIGN §6: price_token_from_site IS the run_scenario envelope with site/pool evidence. */
  run_scenario: RunScenarioEnvelope | null;
}
const scopeToComponents: Record<string, Array<typeof COMPONENTS[number]>> = {
  land: ['facility-recovery'], shell: ['facility-recovery'], 'electrical-cooling-fitout': ['facility-recovery'],
  'installed-it': ['hardware'], networking: ['network'], support: ['support'], water: ['water'], taxes: ['taxes'],
  'total-project': ['facility-recovery', 'hardware', 'network'], unresolved: [],
};
/** A `total-project` scope covers each constituent scope, so it holds them all against the overlap check. */
const TOTAL_PROJECT = ['land', 'shell', 'electrical-cooling-fitout', 'installed-it', 'networking'];
/** A cost's evidence must carry a FIELD that can support the charge, not merely the same number.
 * The capital side declares its capex fields; the operating side needs the same expectation, keyed
 * by cost scope over field-contract v0.3's closed list. `contract` is the only closed field that
 * states an absolute recurring amount (inside its structured payload): a `capex.*` disclosure is a
 * one-time capital observation, and a `*_per_*` field is a rate that needs a declared quantity
 * conversion this layer does not carry for pool costs. */
const CAPITAL_FIELDS = ['capex.total_usd', 'capex.facility_usd', 'capex.it_usd'];
const RECURRING_FIELDS: Record<string, string[]> = {
  land: ['contract'], shell: ['contract'], 'electrical-cooling-fitout': ['contract'],
  'installed-it': ['contract'], networking: ['contract'], 'total-project': ['contract'],
  support: ['contract'], water: ['contract'], taxes: ['contract'], unresolved: [],
};
const costFields = (cost: Cost): string[] => cost.kind === 'capital' ? CAPITAL_FIELDS
  : [...new Set(cost.scopes.flatMap(scope => RECURRING_FIELDS[scope] ?? []))];
/** The rate shape is tested FIRST: `capex.usd_per_mw_it` is a closed-list capex rate, and under a
 * capital cost the capital-branch reason would state the opposite of the truth. */
const unsupportedCostField = (cost: Cost, field: string): string | null =>
  /_per_/.test(field) ? `cost ${cost.id} states an absolute ${cost.currency} amount, and ${field} is a rate that needs a declared quantity conversion`
  : field.startsWith('capex.') ? `cost ${cost.id} is ${cost.kind}, and ${field} is a one-time capital observation that cannot fund an operating charge`
  : null;
/** field-contract v0.3 closes `contract.kind` at six values, and `equipment-purchase` is the one
 * one-time purchase among them: only the other five are recurring commitments that can fund an
 * annual operating charge. An absent or unrecognized kind is refused too. */
const RECURRING_CONTRACT_KINDS = ['land-lease', 'powered-shell', 'hosting', 'compute-rental', 'energy-supply'];
const unsupportedContractKind = (cost: Cost, ref: string, kind: unknown): string | null =>
  typeof kind === 'string' && RECURRING_CONTRACT_KINDS.includes(kind) ? null
  : kind === 'equipment-purchase' ? `cost ${cost.id} is ${cost.kind}, and contract evidence ${ref} is an equipment-purchase — a one-time capital purchase that can never be annualized as an operating charge`
  : `cost ${cost.id} is ${cost.kind}, and contract evidence ${ref} states no recurring contract kind`;
const minted = new WeakSet<ScenarioResult>();
function finish(result: ScenarioResult): ScenarioResult {
  const freeze = (v: unknown): void => { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.values(v).forEach(freeze); Object.freeze(v); } };
  freeze(result); minted.add(result); return result;
}
function civilTermEnd(start: string, years: number): string {
  const [y, m, d] = start.split('-').map(Number);
  const months = Math.round(years * 12);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last)); return target.toISOString().slice(0, 10);
}
function numericBand(value: unknown): Band | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return {lo: value, mid: value, hi: value};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (['lo','mid','hi'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]))) return v as unknown as Band;
  }
  return null;
}
export const notApplicable = (reason: string): Record<string, Json> => ({state: 'not-applicable', reason});
/** The `run_scenario` envelope belongs to the single priced result. A comparison asks for bands and
 * overlap groups, so it opts out and neither builds nor carries one per scenario. */
export interface PricingOptions {run_scenario_envelope?: boolean}

async function calculateSite(release: Release, input: unknown, context: EconomicsContext, options?: PricingOptions): Promise<ScenarioResult> {
  assertRelease(release);
  const receipts: Receipt[] = [], missing: string[] = [];
  let scenarioId: string | null = null, siteId: string | null = null, poolId: string | null = null, profileHash: string | null = null;
  const coverage: ScenarioResult['coverage'] = {hardware: 'unresolved', provider_allocation: 'unresolved', factual_coverage_increased: false};
  const common = () => ({release_id: release.manifest.release_id, scenario_id: scenarioId, site_id: siteId, pool_id: poolId,
    profile_hash: profileHash, receipts, coverage, engine: {revision: context.engine.ENGINE_REVISION, data_as_of: context.engine.DATA_AS_OF}});
  const fail = (): ScenarioResult => finish({...common(), status: 'insufficient-evidence',
    sentence: `Insufficient evidence to model an all-in token cost${siteId ? ` at ${siteId}` : ''}: ${missing.join('; ')}.`,
    value: null, annual_cost: null, cost_breakdown: [], missing, margin: null,
    selection_receipt: notApplicable('no margin scenario was computed'), throughput: null, run_scenario: null});
  const unresolved = (detail: string, component = 'scenario', refs: string[] = []) => {
    missing.push(detail); receipts.push({kind: 'unresolved-dependency', component, refs, detail, scope: 'modeled'});
  };
  const parsed = ScenarioBundleSchema.safeParse(input);
  if (!parsed.success) { unresolved(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); return fail(); }
  const s = parsed.data, pool = s.pool;
  scenarioId = s.id; siteId = pool.site_id; poolId = pool.id;
  if (s.release_id !== release.manifest.release_id) unresolved('scenario release does not match the exact loaded release');
  const comparison = await validateComparison(s.comparison, context.profiles);
  if (!comparison.ok) { comparison.reasons.forEach(x => unresolved(x, 'comparison')); return fail(); }
  const profile = comparison.profile; profileHash = comparison.profile_hash;
  const site = release.siteData.sites.find(x => x.slug === pool.site_id);
  if (!site?.identity_resolved) unresolved('resolved physical site required');
  if (site && pool.phase_ids.some(p => p !== site.slug && !site.phase_ids.includes(p))) unresolved('pool phase is not contained in this site');
  if (pool.coverage_entity_ids.some(p => p !== site?.slug && !site?.phase_ids.includes(p))) unresolved('pool coverage is outside the resolved site');
  if (new Set(pool.coverage_entity_ids).size !== pool.coverage_entity_ids.length || new Set(pool.phase_ids).size !== pool.phase_ids.length) unresolved('duplicate phase or coverage entity');
  const assumptions = new Map(s.assumptions.map(a => [a.id, a]));
  if (assumptions.size !== s.assumptions.length) unresolved('duplicate assumption IDs');
  const index = evidenceIndex(release);
  const eligibility = calculatorEligibility(release);
  /** The producer's `calculator` verdict is authoritative here: a recorded exclusion is relayed
   * with its own reason and never re-adjudicated by this layer. */
  const producerExcluded = (evidenceId: string, component: string): boolean => {
    const verdict = eligibility.get(evidenceId);
    if (verdict === undefined || verdict === 'eligible') return false;
    const detail = `producer calculator eligibility excludes evidence ${evidenceId}: ${verdict}`;
    missing.push(detail);
    receipts.push({kind: 'exclusion', component, refs: [evidenceId], detail, scope: 'modeled'});
    return true;
  };
  const provenance = (p: Provenance, component: string, expectedFields?: string[], expectedValue?: unknown): boolean => {
    if (p.kind === 'assumption') {
      const a = assumptions.get(p.assumption_id);
      if (!a) { unresolved(`missing named assumption ${p.assumption_id}`, component); return false; }
      receipts.push({kind: 'assumption', component, refs: [a.id, ...a.evidence_ids], detail: a.description, scope: a.scope}); return true;
    }
    if (producerExcluded(p.evidence_id, component)) return false;
    const row = index.get(p.evidence_id);
    // An EMPTY expectation means "any promoted compatible field" — only a non-empty list constrains it.
    if (!row || !currentEvidence(row, profile.date) || (!!expectedFields?.length && !expectedFields.includes(row.field))) {
      unresolved(`missing compatible promoted evidence ${p.evidence_id}`, component); return false;
    }
    if ((row.phase_id !== null && !pool.phase_ids.includes(row.phase_id)) || row.entity_id !== siteId || (row.service_boundary_id !== null && row.service_boundary_id !== pool.service_boundary_id)) {
      unresolved(`evidence ${p.evidence_id} is outside this site/service boundary`, component); return false;
    }
    if (expectedValue !== undefined && canonical(numericBand(row.value) ?? row.value) !== canonical(numericBand(expectedValue) ?? expectedValue)) {
      unresolved(`stated ${component} does not match evidence ${p.evidence_id}`, component); return false;
    }
    const scope = row.claim_nature === 'declared-plan' ? 'forecast' : ['literal-disclosure', 'dated-observation'].includes(row.claim_nature) ? 'disclosed' : 'modeled';
    receipts.push({kind: 'evidence', component, refs: [row.evidence_id], detail: `${row.field}; ${row.scope}; as of ${row.as_of}; ${row.claim_nature}`, scope}); return true;
  };
  provenance({kind: 'assumption', assumption_id: pool.operating_assumption_id}, 'operating-parameters');
  let hardwareCount = 0;
  let adapter: Record<string, any> | null = null;
  try { adapter = validatedAdapter(release, context); } catch (e) {
    if (pool.hardware.some(h => h.kind !== 'hypothetical')) unresolved(e instanceof Error ? e.message : 'T4 adapter unavailable', 'hardware');
  }
  const keys = new Set<string>();
  for (const h of pool.hardware) {
    if (h.kind === 'unsplit') { coverage.hardware = 'unsplit'; unresolved('unsplit mixed inventory cannot be assigned a key-level count or priced as one accelerator', 'hardware', [h.evidence_id]); continue; }
    if (keys.has(h.hw_key)) unresolved('duplicate hardware key would double-count inventory', 'hardware');
    keys.add(h.hw_key);
    if (h.hw_key !== profile.hardware_key) unresolved('hardware differs from the fixed comparison profile; no default cross-accelerator all-in metric', 'hardware');
    hardwareCount += h.count;
    if (h.kind === 'hypothetical') {
      coverage.hardware = 'hypothetical';
      if (pool.mode !== 'scenario') unresolved('hypothetical hardware is allowed only in scenario mode', 'hardware');
      provenance({kind: 'assumption', assumption_id: h.assumption_id}, 'hardware');
    } else {
      if (!pool.hardware_allocation_assumption_id) unresolved('campus hardware requires an explicit named allocation to the phase/service cost pool', 'hardware');
      else provenance({kind: 'assumption', assumption_id: pool.hardware_allocation_assumption_id}, 'hardware-pool-allocation');
      // The count is the denominator of every number this layer emits, so the producer's own
      // calculator verdict is read here too, before the atom reaches the T4 adapter match.
      if (producerExcluded(h.evidence_id, 'hardware')) continue;
      const row = adapter?.[pool.site_id];
      const candidates = (row?.accelerators ?? []).filter((a: any) => a.hwKey === h.hw_key && a.sourceNeedle === h.evidence_id);
      const acc = candidates[0];
      if (candidates.length !== 1 || acc.observationKind !== 'point' || acc.basis !== 'disclosed installed count'
        || !acc.asOf || acc.asOf > profile.date || !acc.count || acc.count.lo !== h.count || acc.count.mid !== h.count || acc.count.hi !== h.count) {
        unresolved(`disclosed key-level count ${h.evidence_id} does not match the promoted T4 adapter`, 'hardware', [h.evidence_id]);
      } else {
        coverage.hardware = 'disclosed-key-count';
        receipts.push({kind: 'evidence', component: 'hardware', refs: [h.evidence_id], scope: 'disclosed',
          detail: `${h.count} ${h.hw_key} at ${pool.site_id}; adapter as of ${acc.asOf}; serving allocation remains separate`});
      }
    }
  }
  const breakdown: ScenarioResult['cost_breakdown'] = [];
  const suppressed = new Set<string>();
  const covered = new Set<string>();
  if (pool.rent) {
    if (profile.perspective === 'owner-operator') unresolved('owner-operator perspective cannot use a tenant rental contract');
    const matrix = inclusionMatrix({includes: pool.rent.includes, excludes: pool.rent.excludes}, COMPONENTS);
    matrix.reasons.forEach(x => unresolved(x, 'rent'));
    matrix.suppressed.forEach(x => {suppressed.add(x); covered.add(x);});
    if (pool.rent.currency !== profile.currency || pool.rent.price_year !== Number(profile.date.slice(0, 4))) unresolved('rent currency/price year requires an explicit conversion', 'rent');
    if (pool.rent.commencement > profile.date) unresolved('rent has not commenced on the scenario date', 'rent');
    if (civilTermEnd(pool.rent.commencement, pool.rent.term_years) < civilTermEnd(profile.date, profile.term_years)) unresolved('remaining rent term does not cover the scenario term', 'rent');
    if (pool.rent.state !== 'executed' && pool.rent.provenance.kind !== 'assumption') unresolved('unexecuted contract requires a named hypothetical assumption', 'rent');
    provenance(pool.rent.provenance, 'rent', ['contract']);
    if (pool.rent.provenance.kind === 'evidence') {
      const evidence = index.get(pool.rent.provenance.evidence_id);
      const contract = evidence ? objectValue(evidence.value) : null;
      if (!contract) unresolved('contract evidence lacks a structured value', 'rent');
      else {
        for (const key of ['kind', 'state', 'commencement', 'term_years', 'currency', 'price_year'] as const)
          if (contract[key] !== pool.rent[key]) unresolved(`stated contract ${key} differs from promoted evidence`, 'rent');
        for (const key of ['includes', 'excludes'] as const) {
          const left = contract[key], right = pool.rent[key];
          if (canonical(Array.isArray(left) ? [...left].sort() : left ?? null) !== canonical(Array.isArray(right) ? [...right].sort() : right))
            unresolved('contract inclusions differ from promoted evidence', 'rent');
        }
        const source = numericBand(contract.value);
        if (!pool.rent.source_amount || !source || canonical(source) !== canonical(pool.rent.source_amount)) unresolved('rent source amount does not match evidence', 'rent');
        if (!pool.rent.quote_basis || !pool.rent.pricing_assumption_id) unresolved('evidential rent needs a named quote-basis and annualization interpretation', 'rent');
        else {
          provenance({kind:'assumption',assumption_id:pool.rent.pricing_assumption_id}, 'rent-interpretation');
          if (source) {
            const annual = mapBand(source, v => pool.rent!.quote_basis === 'term-total' ? v / pool.rent!.term_years : v);
            if (canonical(annual) !== canonical(pool.rent.annual_amount)) unresolved('rent annual amount does not match the declared source conversion', 'rent');
          }
        }
      }
    }
    provenance({kind: 'assumption', assumption_id: pool.rent.escalation.assumption_id}, 'rent-escalation');
    // Average recurring expense over the declared term, including fractional final years.
    let escalated = 0, remaining = profile.term_years, year = 0;
    while (remaining > 0) { const fraction = Math.min(1, remaining); escalated += fraction * (1 + pool.rent.escalation.annual_fraction) ** year; remaining -= fraction; year++; }
    breakdown.push({component: 'rent', annual: mapBand(pool.rent.annual_amount, v => v * escalated / profile.term_years)});
    receipts.push({kind:'calculation',component:'rent',refs:[pool.rent.escalation.assumption_id],scope:'modeled',detail:'annual_amount is the scenario-date annual quote in the declared price year; the named escalation model steps at scenario anniversaries and averages the declared remaining term.'});
  } else if (profile.perspective !== 'owner-operator') unresolved('tenant or compute-customer perspective requires a scoped contract', 'rent');
  for (const c of suppressed) receipts.push({kind: 'exclusion', component: c, refs: [], detail: 'Included in rent; separate recovery suppressed by the inclusion matrix', scope: 'modeled'});

  const usedScopes = new Set<string>();
  // The rent contract is already charged, so its atom cannot also fund a cost line.
  const usedCostEvidence = new Set<string>(pool.rent && pool.rent.provenance.kind === 'evidence' ? [pool.rent.provenance.evidence_id] : []);
  if (new Set(pool.costs.map(c => c.id)).size !== pool.costs.length) unresolved('duplicate cost IDs');
  for (const cost of pool.costs) {
    if (cost.kind === 'financing') { receipts.push({kind: 'exclusion', component: cost.id, refs: [], detail: 'Financing commitments are capital structure, never capex or operating expense.', scope: 'modeled'}); continue; }
    if (cost.scopes.includes('unresolved')) { unresolved(`cost ${cost.id} declares an unresolved cost scope, which can never be charged`, 'cost-scopes'); continue; }
    if(cost.provenance.kind === 'evidence') {
      if(usedCostEvidence.has(cost.provenance.evidence_id)) unresolved('the same cost evidence cannot fund multiple charged costs without a disjoint allocation', 'cost-scopes');
      usedCostEvidence.add(cost.provenance.evidence_id);
    }
    const components = [...new Set(cost.scopes.flatMap(x => scopeToComponents[x]))];
    if (components.every(x => suppressed.has(x))) continue;
    if (components.some(x => suppressed.has(x))) { unresolved(`unsplit bundled cost ${cost.id} spans included and excluded contract components`, 'cost-scopes'); continue; }
    if (cost.service_boundary_id !== pool.service_boundary_id) unresolved(`cost ${cost.id} service boundary mismatch`);
    if (cost.currency !== profile.currency || cost.price_year !== Number(profile.date.slice(0, 4))) unresolved(`cost ${cost.id} currency/price year requires a declared conversion`);
    for (const scope of cost.scopes.flatMap(x => x === 'total-project' ? [x, ...TOTAL_PROJECT] : [x])) { if (usedScopes.has(scope)) unresolved(`cost scope overlap: ${scope}`, 'cost-scopes'); usedScopes.add(scope); }
    const atom = cost.provenance.kind === 'evidence' ? index.get(cost.provenance.evidence_id) : undefined;
    // A contract states its amount, currency and price year inside its structured payload, so the
    // scalar value/unit comparison below is replaced by a payload comparison for that field.
    const structured = cost.kind !== 'capital' && atom?.field === 'contract';
    const contract = structured && atom ? objectValue(atom.value) : null;
    const unsupported = atom && !costFields(cost).includes(atom.field) ? unsupportedCostField(cost, atom.field)
      : contract && cost.provenance.kind === 'evidence' ? unsupportedContractKind(cost, cost.provenance.evidence_id, contract.kind) : null;
    if (unsupported && cost.provenance.kind === 'evidence') {
      missing.push(unsupported);
      receipts.push({kind: 'exclusion', component: cost.id, refs: [cost.provenance.evidence_id], detail: unsupported, scope: 'modeled'});
    } else provenance(cost.provenance, cost.id, costFields(cost), structured ? undefined : cost.amount);
    if (cost.provenance.kind === 'evidence') {
      if (structured) {
        const stated = contract ? numericBand(contract.value) : null;
        if (!contract || !stated || canonical(stated) !== canonical(cost.amount) || contract.currency !== cost.currency || contract.price_year !== cost.price_year)
          unresolved(`cost ${cost.id} does not match the promoted contract amount, currency and price year`, 'cost-scopes');
        // The rent path checks its own contract's state, commencement and remaining term before it
        // charges one; a contract funding a cost line is checked the same way, off the same payload.
        if (contract) {
          const commencement = typeof contract.commencement === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(contract.commencement) ? contract.commencement : null;
          const term = typeof contract.term_years === 'number' && Number.isFinite(contract.term_years) ? contract.term_years : null;
          if (contract.state !== 'executed') unresolved(`cost ${cost.id} is bound to an unexecuted contract; an unexecuted contract requires a named hypothetical assumption`, 'cost-scopes');
          if (!commencement || commencement > profile.date) unresolved(`cost ${cost.id} contract has not commenced on the scenario date`, 'cost-scopes');
          else if (term === null || civilTermEnd(commencement, term) < civilTermEnd(profile.date, profile.term_years))
            unresolved(`cost ${cost.id} remaining contract term does not cover the scenario term`, 'cost-scopes');
        }
      } else if (atom?.unit !== profile.currency) unresolved(`cost ${cost.id} evidence unit does not match currency`, 'cost-scopes');
      if (!cost.interpretation_assumption_id) unresolved(`cost ${cost.id} needs a named scope/currency/price-year interpretation because the presentation projection omits those capex metadata`, 'cost-scopes');
      else provenance({kind:'assumption',assumption_id:cost.interpretation_assumption_id}, 'cost-interpretation');
    }
    const annual = cost.kind === 'capital' ? annualize(cost) : cost.amount;
    breakdown.push({component: components.join('+'), annual}); components.forEach(x => covered.add(x));
    receipts.push({kind: 'calculation', component: cost.id, refs: [], detail: `${cost.kind}; scopes ${cost.scopes.join(', ')}; life ${cost.life_years} years; residual ${cost.residual_fraction}; capital rate ${cost.capital_rate}`, scope: 'modeled'});
  }
  if (!suppressed.has('electricity')) {
    provenance(pool.pue.provenance, 'pue', ['power.pue'], pool.pue.provenance.kind === 'evidence' ? pool.pue.value : undefined);
    if (pool.pue.basis === 'measured' && (pool.pue.provenance.kind !== 'evidence' || !['literal-disclosure','dated-observation'].includes(index.get(pool.pue.provenance.evidence_id)?.claim_nature ?? ''))) unresolved('measured PUE requires a disclosed or observed facility receipt');
    let load = structuredClone(pool.load_shape);
    let onsiteAnnual: Band = {lo: 0, mid: 0, hi: 0};
    const onsite = pool.electricity.onsite;
    const cycleHours = load.periods.reduce((a, p) => a + p.intervals.reduce((b, i) => b + i.hours, 0), 0);
    const factor = load.annualization.annual_hours / cycleHours;
    const grossEnergy = load.periods.reduce((a, p) => a + p.intervals.reduce((b, i) => b + i.hours * i.kw, 0), 0) * (load.boundary === 'it-input' ? pool.pue.value : 1);
    if (onsite) {
      provenance({kind: 'assumption', assumption_id: onsite.assumption_id}, 'onsite-generation');
      if (load.boundary === 'grid-import') unresolved('onsite share requires facility/IT load boundary and a supply balance; grid import cannot be reinterpreted');
      const fuel = grossEnergy * onsite.share * factor * onsite.fuel_cost_per_kwh / onsite.efficiency;
      onsiteAnnual = addBands(onsite.annual_fixed_cost, {lo: fuel, mid: fuel, hi: fuel});
      // Named uniform supply-share model connects onsite production with grid energy and demand.
      const gridFraction = 1 - onsite.share;
      if (gridFraction === 0) unresolved('fully onsite supply needs explicit grid-disconnection and residual demand assumptions');
      else for (const p of load.periods) {
        p.intervals = p.intervals.map(i => ({...i, kw: i.kw * gridFraction}));
        p.billing_demand_kw *= gridFraction; p.historical_peak_kw *= gridFraction; p.capacity_kw *= gridFraction;
      }
      receipts.push({kind: 'calculation', component: 'onsite-generation', refs: [onsite.assumption_id], scope: 'modeled', detail: 'Declared uniform onsite share reduces grid energy, capacity, current and historical demand; onsite fuel uses explicit efficiency, certificates remain separate.'});
    }
    const bill = billTariff(release, {site_id: pool.site_id, service_boundary_id: pool.service_boundary_id,
      date: profile.date, currency: profile.currency, tariff_ref: pool.electricity.tariff_ref, applicability_ref: pool.electricity.applicability_ref,
      load_shape: load, pue: pool.pue.value, hypothetical_applicability_assumption: pool.electricity.hypothetical_applicability_assumption,
      bounded_components: pool.electricity.bounded_components, assumptions: s.assumptions});
    receipts.push(...bill.receipts);
    if (bill.status !== 'modeled') missing.push(...bill.missing);
    else {
      let annual = addBands(mapBand(bill.recurring_total!, v => v * factor), mapBand(bill.connection_cost!, v => v / profile.term_years), onsiteAnnual);
      if (pool.electricity.certificates) {
        const cert = pool.electricity.certificates;
        provenance({kind: 'assumption', assumption_id: cert.assumption_id}, 'certificates');
        const cost = grossEnergy * factor * cert.cost_per_kwh;
        annual = addBands(annual, {lo: cost, mid: cost, hi: cost});
        receipts.push({kind: 'calculation', component: 'certificates', refs: [cert.assumption_id], detail: `${grossEnergy * factor} annual facility kWh × ${cert.cost_per_kwh}; no physical supply or emissions inference`, scope: 'modeled'});
      }
      breakdown.push({component: 'electricity', annual}); covered.add('electricity');
      receipts.push({kind: 'calculation', component: 'annualization', refs: [load.annualization.assumption_id], detail: `Recurring ${cycleHours}-hour cycle repeated to ${load.annualization.annual_hours} annual hours; connection cost spread over ${profile.term_years} years`, scope: 'modeled'});
    }
  }
  // Runs AFTER the electricity block: a charged bill must be visible to the contradiction check,
  // or a verified-zero electricity declaration and a priced electricity component both stand.
  for (const zero of pool.verified_zero_components) {
    if (suppressed.has(zero.component)) continue;
    if (covered.has(zero.component)) { unresolved(`zero declaration contradicts priced component ${zero.component}`); continue; }
    if (zero.provenance.kind === 'evidence') {
      const fields: Record<string,string[]> = {electricity:['energy.contracted_usd_per_kwh'],hardware:['capex.it_usd'],'facility-recovery':['capex.facility_usd']};
      if (!fields[zero.component]) unresolved(`zero component ${zero.component} has no compatible typed zero observation; use a named assumption`, 'cost-scopes');
      else provenance(zero.provenance, zero.component, fields[zero.component], 0);
    } else provenance(zero.provenance, zero.component);
    covered.add(zero.component);
  }
  for (const component of COMPONENTS) if (!covered.has(component)) unresolved(`missing material cost component ${component}`, 'cost-scopes');
  if (missing.length) return fail();
  try {
    const total = addBands(...breakdown.map(x => x.annual));
    const legacy = priceWithLegacy(profile, context, total, hardwareCount, pool.load_shape.annualization.annual_hours, pool.occupancy, pool.utilization);
    const inputs = [...new Set(receipts.map(r => r.scope))];
    const label = `Modeled ${profile.currency} ${legacy.costs.lo.toFixed(4)}–${legacy.costs.hi.toFixed(4)} per million workload-mix tokens${inputs.includes('forecast') ? ' (forecast inputs)' : ''}`;
    const margin = profile.currency === 'USD' && Number.isFinite(legacy.margins.mid)
      ? `${Math.round(legacy.margins.mid * 100)}% (modeled unit direct-serving contribution margin; ${legacy.disclosure || 'policy scenario'})` : null;
    receipts.push({kind: 'calculation', component: 'throughput', refs: [context.engine.ENGINE_REVISION], scope: 'modeled',
      detail: `site/engine.js tokPerS + computeMix; ${hardwareCount} accelerators; utilization ${pool.utilization} and occupancy ${pool.occupancy} are independent of the declared electricity shape. ${legacy.disclosure}`});
    const sentence = `${label} at ${pool.site_id} under the declared ${profile.perspective} scenario. ${legacy.disclosure}`;
    const selection_receipt = margin ? legacy.selection_receipt : notApplicable('no same-currency margin scenario; legacy revenue is denominated in USD');
    return finish({...common(), status: 'modeled', sentence,
      value: {band: legacy.costs, unit: `${profile.currency}/million-tokens`, status_fused: label, scope: {result: 'modeled', inputs}},
      annual_cost: total, cost_breakdown: breakdown, missing: [], margin, selection_receipt,
      throughput: legacy.throughput,
      run_scenario: options?.run_scenario_envelope === false ? null : legacy.envelope({sentence, margin, selection_receipt})});
  } catch (e) { unresolved(e instanceof Error ? e.message : 'legacy computation failed', 'throughput'); return fail(); }
}

/** Public fail-closed boundary: malformed arithmetic never leaks a partial all-in number. */
export async function priceTokenHere(release: Release, input: unknown, context: EconomicsContext, options?: PricingOptions): Promise<ScenarioResult> {
  assertRelease(release);
  try { return await calculateSite(release, input, context, options); }
  catch (e) {
    const detail = e instanceof Error ? e.message : 'invalid economic arithmetic';
    return finish({status:'insufficient-evidence',sentence:`Insufficient evidence to model a finite all-in token cost: ${detail}.`,release_id:release.manifest.release_id,
      scenario_id:null,site_id:null,pool_id:null,profile_hash:null,value:null,annual_cost:null,cost_breakdown:[],missing:[detail],
      receipts:[{kind:'unresolved-dependency',component:'scenario',refs:[],detail,scope:'modeled'}],margin:null,
      selection_receipt:notApplicable('no margin scenario was computed'),engine:{revision:context.engine.ENGINE_REVISION,data_as_of:context.engine.DATA_AS_OF},
      coverage:{hardware:'unresolved',provider_allocation:'unresolved',factual_coverage_increased:false},throughput:null,run_scenario:null});
  }
}

export const ComparisonRequestSchema = z.object({comparison: ComparisonPathSchema,
  scenarios: z.array(z.unknown()).min(1).max(100), sort: z.enum(['overlap-groups', 'midpoint']).default('overlap-groups')}).strict();
export interface ComparisonResult {
  status: 'modeled' | 'insufficient-evidence'; sentence: string; release_id: string; profile_hash: string | null;
  metric_definition: string; ordering_basis: string; eligible: ScenarioResult[];
  groups: Array<{group: number; scenario_ids: string[]; bounds: {lo: number; hi: number}; interpretation: string}>;
  excluded: Array<{scenario_id: string | null; site_id: string | null; reasons: string[]}>;
  receipts: Receipt[]; selection_receipt: Record<string, Json>;
}
/** Recompute from validated bundles. Caller-supplied values/receipts are never ranked. */
export async function compareScenarios(release: Release, input: unknown, context: EconomicsContext): Promise<ComparisonResult> {
  assertRelease(release);
  const out: ComparisonResult = {status: 'insufficient-evidence', sentence: 'Insufficient evidence to compare the requested scenarios.',
    release_id: release.manifest.release_id, profile_hash: null,
    metric_definition: 'Modeled native-currency cost per million workload-mix tokens under fixed workload, hardware, procurement, date, currency and term. Bands reflect declared cost assumptions, not statistical confidence intervals.',
    ordering_basis: 'overlap groups ordered by lower bound; overlapping bands do not establish a tie or internal ordering',
    eligible: [], groups: [], excluded: [], receipts: [], selection_receipt: notApplicable('cost comparison has no single margin selection')};
  const parsed = ComparisonRequestSchema.safeParse(input);
  if (!parsed.success) { out.excluded.push({scenario_id: null, site_id: null, reasons: parsed.error.issues.map(i => i.message)}); return out; }
  const comparison = await validateComparison(parsed.data.comparison, context.profiles);
  if (!comparison.ok) { out.excluded.push({scenario_id: null, site_id: null, reasons: comparison.reasons}); return out; }
  out.profile_hash = comparison.profile_hash;
  const seen = new Set<string>();
  for (const bundle of parsed.data.scenarios) {
    const result = await priceTokenHere(release, bundle, context, {run_scenario_envelope: false});
    if (result.scenario_id && seen.has(result.scenario_id)) {
      out.excluded.push({scenario_id: result.scenario_id, site_id: result.site_id, reasons: ['duplicate scenario ID']}); continue;
    }
    if (result.scenario_id) seen.add(result.scenario_id);
    if (result.status !== 'modeled' || result.profile_hash !== comparison.profile_hash) {
      out.excluded.push({scenario_id: result.scenario_id, site_id: result.site_id,
        reasons: [...result.missing, ...(result.profile_hash !== comparison.profile_hash ? ['fixed comparison profile mismatch'] : [])]});
      out.receipts.push(...result.receipts); continue;
    }
    out.eligible.push(result); out.receipts.push(...result.receipts);
  }
  const ordered = [...out.eligible].sort((a,b) => a.value!.band.lo - b.value!.band.lo || compareIds(a.scenario_id!, b.scenario_id!));
  for (const result of ordered) {
    const b = result.value!.band, previous = out.groups.at(-1);
    if (previous && b.lo <= previous.bounds.hi) {
      previous.scenario_ids.push(result.scenario_id!); previous.bounds.hi = Math.max(previous.bounds.hi, b.hi);
      previous.scenario_ids.sort(compareIds);
    } else out.groups.push({group: out.groups.length + 1, scenario_ids: [result.scenario_id!], bounds: {lo: b.lo, hi: b.hi},
      interpretation: 'Connected overlap group; not a proven tie and no supported internal rank.'});
  }
  if (parsed.data.sort === 'midpoint') {
    out.ordering_basis = 'labelled midpoint sort of modeled middle assumptions; overlap groups remain and do not establish internal ordering';
    out.eligible.sort((a,b) => a.value!.band.mid - b.value!.band.mid || compareIds(a.scenario_id!, b.scenario_id!));
  } else out.eligible = ordered;
  if (out.eligible.length) {
    out.status = 'modeled';
    out.sentence = `Modeled costs form ${out.groups.length} overlap group${out.groups.length === 1 ? '' : 's'} among these eligible scenarios (${out.eligible.length} eligible; ${out.excluded.length} excluded)${parsed.data.sort === 'midpoint' ? ', with a labelled midpoint sort' : ''}.`;
  }
  out.receipts.push({kind:'calculation',component:'comparison',refs:[comparison.profile_hash],detail:out.ordering_basis,scope:'modeled'});
  return out;
}
function compareIds(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

export const FleetRequestSchema = z.object({comparison:ComparisonPathSchema,row_ids:z.array(id).max(100),
  fill:z.enum(['generic-us','generic-cn']),hardware_mix:z.record(nonnegative).optional()}).strict();
export interface FleetResult {
  status:'modeled'|'insufficient-evidence'; sentence:string; release_id:string; profile_hash:string|null;
  fleet:Record<string, any>|null; composition:unknown; procurement_basis:string|null; bases:unknown; source_rows:Array<Record<string,unknown>>;
  excluded:Array<{row_id:string;reasons:string[]}>; generic_fill_share:number;
  coverage:{factual_coverage_increased:false;provider_allocation:'unresolved'};
  receipts:Receipt[];selection_receipt:Record<string,Json>;
}
/** Count-backed proposed sections, with explicit generic fill for unallocated donor shares.
 * New sidecar IDs stay in provenance; dcRef is reserved for the legacy registry's own IDs. */
export async function composeFleet(release:Release,input:unknown,context:EconomicsContext):Promise<FleetResult>{
  assertRelease(release);
  const out:FleetResult={status:'insufficient-evidence',sentence:'Insufficient evidence to compose a fleet scenario.',release_id:release.manifest.release_id,
    profile_hash:null,fleet:null,composition:[],procurement_basis:null,bases:[],source_rows:[],excluded:[],generic_fill_share:0,
    coverage:{factual_coverage_increased:false,provider_allocation:'unresolved'},receipts:[],selection_receipt:notApplicable('fleet composition does not compute a margin')};
  try {
    const r=FleetRequestSchema.parse(input);const comparison=await validateComparison(r.comparison,context.profiles);
    if(!comparison.ok)throw new TypeError(comparison.reasons.join('; '));out.profile_hash=comparison.profile_hash;
    const profile=comparison.profile, e=context.engine, state=legacyState(profile,context), rows=validatedAdapter(release,context);
    // Built once: the priced path reads the producer's calculator verdict on a disclosed count, and
    // a count-weighted fleet share reads the same channel, so it honours the same verdict.
    const eligibility=calculatorEligibility(release);
    if(profile.procurement==='public-capacity-rent')throw new TypeError('public-capacity procurement needs explicit matching quotes; generic registered planning rent cannot supply them');
    state.hwMode=profile.procurement==='owned-strategic-tco'?'tco':'rent';
    const ids=[...new Set(r.row_ids)].sort(compareIds);
    const selected=ids.filter(rowId=>{
      const row=rows[rowId];
      const company=e.MODELS.find(m=>m.id===profile.workload.model_id)?.lab;
      if(!row){out.excluded.push({row_id:rowId,reasons:['row absent from this exact T4 adapter']});return false;}
      if(row.company!==company){out.excluded.push({row_id:rowId,reasons:['adapter consumer company differs from workload provider']});return false;}
      const site=release.siteData.sites.find(s=>s.slug===rowId);
      if(site?.presentation_campus_id && site.presentation_campus_id!==rowId && ids.includes(site.presentation_campus_id)){
        out.excluded.push({row_id:rowId,reasons:['parent/child coverage overlap; covered descendant is not added to campus inventory']});return false;
      }
      const inventory=row.accelerators??[];
      if(new Set(inventory.map((a:any)=>a.hwKey)).size!==inventory.length){out.excluded.push({row_id:rowId,reasons:['ambiguous duplicate key-level inventory; source coverage cannot be proven disjoint']});return false;}
      if([...inventory,...(row.servingEvidence??[]),row.mixedAggregate,row.electricity].some((a:any)=>a?.asOf && a.asOf>profile.date)){out.excluded.push({row_id:rowId,reasons:['adapter observation is after the scenario date']});return false;}
      out.source_rows.push({row_id:rowId,servingEvidence:structuredClone(row.servingEvidence),mixedAggregate:row.mixedAggregate??null});
      return true;
    });
    const blend=r.hardware_mix??e.blendWeights(state);
    const positive=Object.entries(blend).filter(([,v])=>v>0);
    if(!positive.length || positive.some(([k])=>!Object.prototype.hasOwnProperty.call(e.HW,k)))throw new TypeError('hardware mix needs positive registered donor weights');
    const sum=positive.reduce((a,[,v])=>a+v,0);if(!Number.isFinite(sum))throw new TypeError('nonfinite hardware share sum');
    if(r.hardware_mix)state.blend=Object.fromEntries(positive.map(([k,v])=>[k,100*v/sum]));
    // Existing rows take the unchanged composer, retaining its precise normalization and coverage semantics.
    const own=e.registryRows();
    if(selected.length===ids.length && selected.every(k=>own[k]&&canonical(own[k])===canonical(rows[k])&&(rows[k].accelerators??[]).every((a:any)=>a.basis==='disclosed installed count'&&a.observationKind==='point'))){
      out.fleet=e.composeFleetFromDcRows(state,{dcRows:selected,modelId:profile.workload.model_id,fill:r.fill});
      out.generic_fill_share=(out.fleet.sections as any[]).filter(s=>s.provenance==='generic-fill').reduce((a,s)=>a+s.sharePct/100,0);
    }else{
      const allocated:Record<string,Record<string,number>>=Object.fromEntries(selected.map(k=>[k,{}]));
      const uncovered:Record<string,number>={};
      for(const [key,weight] of positive){
        const candidates=selected.flatMap(rowId=>(rows[rowId].accelerators??[]).filter((a:any)=>a.hwKey===key&&a.basis==='disclosed installed count'&&a.observationKind==='point'
          && a.asOf && a.asOf<=profile.date && a.count?.lo===a.count?.mid && a.count?.hi===a.count?.mid && a.count.mid>0)
          .filter((a:any)=>{
            const verdict=eligibility.get(a.sourceNeedle);
            if(verdict===undefined||verdict==='eligible')return true;
            const detail=`producer calculator eligibility excludes evidence ${a.sourceNeedle}: ${verdict}`;
            out.receipts.push({kind:'exclusion',component:'hardware',refs:[a.sourceNeedle],detail,scope:'modeled'});
            return false;
          })
          .map((a:any)=>({rowId,count:a.count.mid,ref:a.sourceNeedle})));
        const total=candidates.reduce((n,c)=>n+c.count,0),share=100*weight/sum;
        if(!total)uncovered[key]=share;
        else for(const c of candidates){allocated[c.rowId][key]=share*c.count/total;out.receipts.push({kind:'calculation',component:'fleet-share',refs:[c.ref],scope:'modeled',detail:`Proposed ${key} share weighted by disclosed key-level counts; does not establish provider allocation.`});}
      }
      const sections:any[]=[];
      const legs=(allocation:Record<string,number>)=>{
        const total=Object.values(allocation).reduce((a,b)=>a+b,0);
        return roundShares(Object.entries(allocation).filter(([,v])=>v>0).map(([key,value])=>({donorKey:key,label:String(e.HW[key].name),sharePct:100*value/total,overrides:{},family:e.familyOf(e.HW[key])})),100,'donorKey');
      };
      for(const rowId of selected){
        const a=allocated[rowId],share=Object.values(a).reduce((x,y)=>x+y,0),row=rows[rowId];
        if(!share){out.excluded.push({row_id:rowId,reasons:['no compatible disclosed key-level count for the requested donors; unsplit inventory remains unsplit']});continue;}
        const electricity=row.electricity?.usdPerKwh?{usdPerKwh:row.electricity.usdPerKwh,source:row.electricity.source,regionRef:row.regionRef}:{regionRef:row.electricity?.inherit??row.regionRef};
        sections.push({id:`s${sections.length+1}`,label:String(row.site??rowId).slice(0,60),sharePct:share,basis:profile.procurement,
          rent:profile.procurement==='owned-strategic-tco'?null:row.rent??{mode:'registered',mult:1},electricity,pue:row.pue??null,tco:null,dcRef:null,
          provenance:`${release.manifest.release_id} / ${rowId}: ${row.provenance}`,legs:legs(a)});
        out.receipts.push({kind:'exclusion',component:'fleet-evidence',refs:[rowId],scope:'modeled',detail:'Sidecar row retained in source_rows; dcRef is null because the immutable legacy registry is not modified. Missing cost inputs retain legacy scenario defaults, never a complete site bill.'});
      }
      const genericShare=Object.values(uncovered).reduce((a,b)=>a+b,0);out.generic_fill_share=genericShare/100;
      if(genericShare>0)sections.push({id:`s${sections.length+1}`,label:r.fill==='generic-us'?'Generic US fill':'Generic coastal-China fill',sharePct:genericShare,basis:profile.procurement,
        rent:profile.procurement==='owned-strategic-tco'?null:{mode:'registered',mult:1},electricity:{regionRef:r.fill==='generic-us'?'us-industrial':'cn-coastal'},pue:null,tco:null,dcRef:null,provenance:'generic-fill',legs:legs(uncovered)});
      const fleet={id:'cf:dcmapu3',name:'Modeled datacenter fleet',epoch:e.DEFAULTS_EPOCH,clonedFrom:null,sections:roundShares(sections,100,'id')};
      const validated=e.validateFleetSections(fleet);if(!validated.ok||!validated.fleet)throw new TypeError((validated.errors??['legacy section validation failed']).join('; '));out.fleet=validated.fleet;
    }
    const composed=e.composeSections(e.resolveFleetSections(state,{customFleet:out.fleet}));
    out.composition=composed.composition;out.procurement_basis=composed.procurementBasis;out.bases=composed.bases;
    out.status='modeled';out.sentence=`Modeled fleet composition uses ${out.fleet!.sections.length} sections with ${(100*out.generic_fill_share).toFixed(1)}% explicitly generic fill; physical inventory does not establish provider serving allocation.`;
    out.receipts.push({kind:'calculation',component:'fleet-composition',refs:[release.manifest.release_id,comparison.profile_hash],scope:'modeled',detail:'Sections pass the unchanged legacy validator and resolver; no global registry mutation.'});
  }catch(e){out.excluded.push({row_id:'request',reasons:[e instanceof Error?e.message:'invalid fleet request']});}
  return out;
}
/** Largest remainder to tenths, the legacy section share precision; never independently round totals. */
function roundShares<T extends {sharePct:number}>(rows:T[],target:number,key:keyof T):T[]{
  const sum=rows.reduce((a,b)=>a+b.sharePct,0);if(!(sum>0))return rows;
  const ticks=rows.map(r=>r.sharePct/sum*target*10),whole=ticks.map(Math.floor);
  const order=rows.map((r,i)=>({i,remainder:ticks[i]-whole[i],key:String(r[key])})).sort((a,b)=>b.remainder-a.remainder||compareIds(a.key,b.key));
  const remaining=Math.round(target*10)-whole.reduce((a,b)=>a+b,0);
  for(let n=0;n<remaining;n++)whole[order[n%order.length].i]++;
  return rows.map((r,i)=>({...r,sharePct:whole[i]/10}));
}
