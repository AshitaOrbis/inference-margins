import { z } from 'zod';
import { assertRelease, type Release } from './release.js';
import { evidenceIndex, calculatorEligibility, currentEvidence, objectValue } from './evidence.js';
import { AssumptionSchema, BandSchema, LoadShapeSchema, MissingComponentSchema, date, id, nonnegative, positive,
  type Band, type Receipt, type LoadShape } from './types.js';
import { addBands, mapBand } from './validate.js';

const amount = z.union([nonnegative, BandSchema]);
const component = z.object({
  id, charge: amount, unit: id, billing_basis: z.enum(['energy', 'billing-demand', 'fixed', 'subtotal']),
  effective_from: date, effective_to: date.nullable(), tou: id.optional(),
  ratchet: z.object({ fraction: nonnegative.max(1) }).strict().optional(),
  applies_to: z.array(id).min(1).optional(),
}).strict();
export const TariffVersionSchema = z.object({
  schedule: id, docket: z.string(), regulatory_status: z.enum(['filed', 'approved', 'effective', 'superseded']),
  effective_from: date, effective_to: date.nullable(), currency: z.string().regex(/^[A-Z]{3}$/),
  service_class: id, voltage_band: id,
  energy_components: z.array(component).nullable(), demand_components: z.array(component).nullable(),
  fixed_fees: z.array(component).nullable(), riders: z.array(component).nullable(), taxes: z.array(component).nullable(),
  minimum_bill: amount.nullable(), ramp: z.string().nullable(), connection_costs: amount.nullable(),
  collateral: nonnegative.nullable(), exit_terms: z.string().nullable(),
  completeness: z.enum(['complete', 'incomplete', 'unknown']), unresolved_components: z.array(id), url: z.string().url(),
}).strict();
export const TariffRequestSchema = z.object({
  site_id: id, service_boundary_id: id, date, currency: z.string().regex(/^[A-Z]{3}$/),
  tariff_ref: id.nullable(), applicability_ref: id.nullable(),
  load_shape: LoadShapeSchema, pue: positive.min(1).max(5),
  hypothetical_applicability_assumption: id.optional(),
  bounded_components: z.array(MissingComponentSchema), assumptions: z.array(AssumptionSchema),
}).strict();
export type TariffRequest = z.infer<typeof TariffRequestSchema>;
export interface BillPeriod { id: string; hours: number; energy_kwh: number; billing_demand_kw: number; total: Band }
export interface TariffBill {
  status: 'modeled' | 'insufficient-evidence'; sentence: string; release_id: string;
  total: Band | null; recurring_total: Band | null; connection_cost: Band | null;
  periods: BillPeriod[]; pue_applications: number; hypothetical: boolean;
  missing: string[]; receipts: Receipt[];
}
const band = (v: number | Band): Band => typeof v === 'number' ? { lo: v, mid: v, hi: v } : v;
const zero = (): Band => band(0);
const calendarHours = (a: string, b: string) => (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 3600000;

/** Positive components only. Unsupported sheets/terms fail closed with a named dependency. */
export function billTariff(release: Release, input: unknown): TariffBill {
  assertRelease(release);
  const receipts: Receipt[] = [];
  const missing: string[] = [];
  const fail = (): TariffBill => ({
    status: 'insufficient-evidence', sentence: `Insufficient evidence to model a complete electricity bill: ${missing.join('; ')}.`,
    release_id: release.manifest.release_id, total: null, recurring_total: null, connection_cost: null,
    periods: [], pue_applications: 0, hypothetical: false, missing, receipts,
  });
  const unresolved = (message: string, refs: string[] = []) => {
    missing.push(message);
    receipts.push({ kind: 'unresolved-dependency', component: 'electricity', refs, detail: message, scope: 'modeled' });
  };
  const parsed = TariffRequestSchema.safeParse(input);
  if (!parsed.success) { unresolved(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); return fail(); }
  const r = parsed.data;
  const assumptions = new Map(r.assumptions.map(a => [a.id, a]));
  if (assumptions.size !== r.assumptions.length) unresolved('duplicate assumption IDs');
  const useAssumption = (key: string, field: string): boolean => {
    const a = assumptions.get(key);
    if (!a) { unresolved(`missing named assumption ${key}`, [key]); return false; }
    receipts.push({ kind: 'assumption', component: field, refs: [key, ...a.evidence_ids], detail: a.description, scope: a.scope });
    return true;
  };
  useAssumption(r.load_shape.assumption_id, 'load-shape');
  useAssumption(r.load_shape.annualization.assumption_id, 'annualization');
  const site = release.siteData.sites.find(s => s.slug === r.site_id);
  if (!site?.identity_resolved) unresolved('resolved physical site is required');
  const index = evidenceIndex(release);
  const eligibility = calculatorEligibility(release);
  /** The producer's `calculator` verdict is authoritative here; its own reason is relayed. */
  const producerExcluded = (evidenceId: string): boolean => {
    const verdict = eligibility.get(evidenceId);
    if (verdict === undefined || verdict === 'eligible') return false;
    const detail = `producer calculator eligibility excludes evidence ${evidenceId}: ${verdict}`;
    missing.push(detail);
    receipts.push({ kind: 'exclusion', component: 'electricity', refs: [evidenceId], detail, scope: 'modeled' });
    return true;
  };
  const atom = r.tariff_ref && !producerExcluded(r.tariff_ref) ? index.get(r.tariff_ref) : undefined;
  const application = r.applicability_ref && !producerExcluded(r.applicability_ref) ? index.get(r.applicability_ref) : undefined;
  if (!atom || atom.field !== 'energy.tariff' || !currentEvidence(atom, r.date)) {
    unresolved('promoted current tariff version is required; queue position does not satisfy the dependency', r.tariff_ref ? [r.tariff_ref] : []);
    return fail();
  }
  if (!['literal-disclosure', 'dated-observation'].includes(atom.claim_nature)) unresolved('tariff version must carry a disclosed or observed regulatory sheet');
  const tariff = TariffVersionSchema.safeParse(atom.value);
  if (!tariff.success) { unresolved(`unsupported or incomplete tariff component schema: ${tariff.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')}`, [atom.evidence_id]); return fail(); }
  const t = tariff.data;
  if (t.completeness === 'incomplete') unresolved('incomplete tariff excluded from site-applicable billing', [atom.evidence_id]);
  if (!['effective', 'approved'].includes(t.regulatory_status)) unresolved(`tariff regulatory status ${t.regulatory_status} is not operative`);
  if (t.currency !== r.currency) unresolved('tariff and scenario currency mismatch; explicit FX conversion is required');
  if (r.date < t.effective_from || (t.effective_to !== null && r.date >= t.effective_to)) unresolved('tariff is not effective on the scenario date');
  let hypothetical = false;
  const app = application ? objectValue(application.value) : null;
  if (!application || application.field !== 'energy.tariff_applicability' || !currentEvidence(application, r.date)
    || application.entity_id !== r.site_id || application.service_boundary_id !== r.service_boundary_id
    || !app || app.tariff_ref !== atom.evidence_id) {
    unresolved('promoted tariff applicability for this exact site and service boundary is required', r.applicability_ref ? [r.applicability_ref] : []);
  } else {
    if (app.state === 'confirmed' && !['literal-disclosure', 'dated-observation'].includes(application.claim_nature)) unresolved('confirmed applicability requires disclosed or observed evidence');
    if (app.state === 'contradicted') unresolved('contradicted tariff applicability is excluded', [application.evidence_id]);
    else if (app.state === 'candidate' || app.state === 'unknown') {
      if (!r.hypothetical_applicability_assumption) unresolved('candidate or unknown applicability requires a named hypothetical assumption');
      else { hypothetical = true; useAssumption(r.hypothetical_applicability_assumption, 'tariff-applicability'); }
    } else if (app.state !== 'confirmed') unresolved('unknown applicability state');
    if (app.service_class !== t.service_class || app.voltage !== t.voltage_band) unresolved('applicability class or voltage does not match the tariff');
    if (typeof app.eligibility_date !== 'string' || app.eligibility_date > r.date) unresolved('tariff eligibility date is missing or in the future');
    receipts.push({ kind: 'evidence', component: 'tariff-applicability', refs: [application.evidence_id], detail: `${app.state} for ${r.service_boundary_id}`, scope: 'disclosed' });
  }
  receipts.push({ kind: 'evidence', component: 'tariff-version', refs: [atom.evidence_id], detail: `${t.schedule}; ${t.currency}; ${t.effective_from} to ${t.effective_to ?? 'unspecified'}`, scope: 'disclosed' });
  if (missing.length) return fail();

  const groups = ['energy_components', 'demand_components', 'fixed_fees', 'riders', 'taxes'] as const;
  const allComponents = groups.flatMap(g => t[g] ?? []);
  if (new Set(allComponents.map(c => c.id)).size !== allComponents.length) unresolved('duplicate tariff component IDs');
  const multiplier = r.load_shape.boundary === 'it-input' ? r.pue : 1;
  receipts.push({ kind: 'calculation', component: 'pue', refs: [], scope: 'modeled',
    detail: multiplier === 1 ? `load boundary ${r.load_shape.boundary}; no additional PUE multiplier` : `IT load, capacity and demand multiplied once by PUE ${r.pue}` });
  const seenPeriods = new Set<string>();
  const usedBounds = new Set<string>();
  let lastEnd = '';
  const periods: BillPeriod[] = [];
  for (const p of r.load_shape.periods) {
    if (seenPeriods.has(p.id)) unresolved(`duplicate billing period ${p.id}`);
    seenPeriods.add(p.id);
    if (application && ((application.valid_from !== null && p.start < application.valid_from) || (application.valid_to !== null && p.end > application.valid_to))) unresolved(`applicability does not cover the billing interval ${p.id}`);
    if (atom.valid_from !== null && p.start < atom.valid_from || atom.valid_to !== null && p.end > atom.valid_to) unresolved(`promoted tariff evidence does not cover billing interval ${p.id}`);
    const hours = p.intervals.reduce((a, x) => a + x.hours, 0);
    const rawEnergy = p.intervals.reduce((a, x) => a + x.hours * x.kw, 0);
    const expectedHours = calendarHours(p.start, p.end);
    if (!(expectedHours > 0) || Math.abs(hours - expectedHours) > 1e-6) unresolved(`period ${p.id} hours do not match its civil-date interval`);
    if (lastEnd && p.start < lastEnd) unresolved('billing periods overlap or are out of order');
    lastEnd = p.end;
    if (Math.abs(rawEnergy / (p.capacity_kw * hours) - p.load_factor) > 1e-8) unresolved(`period ${p.id} load factor does not match declared shape and capacity`);
    if (p.intervals.some(x => x.kw > p.capacity_kw)) unresolved(`period ${p.id} load exceeds declared capacity`);
    if (p.billing_demand_kw < Math.max(...p.intervals.map(x => x.kw))) unresolved(`period ${p.id} billing demand is below observed interval demand`);
    if (p.start < t.effective_from || (t.effective_to !== null && p.end > t.effective_to)) unresolved(`period ${p.id} extends outside tariff effective interval`);
    const energy = rawEnergy * multiplier;
    const demand = p.billing_demand_kw * multiplier;
    const charges = new Map<string, Band>();
    const bounded = (key: string): Band => {
      const candidates = r.bounded_components.filter(b => b.component === key && b.period_id === p.id);
      if (candidates.length !== 1) { unresolved(`missing material component ${key} in ${p.id} requires exactly one bounded assumption`); return zero(); }
      const b = candidates[0]; useAssumption(b.assumption_id, key); usedBounds.add(`${p.id}/${key}`); hypothetical = true;
      return b.amount;
    };
    const addComponent = (c: z.infer<typeof component>, group: typeof groups[number]) => {
      if (p.start < c.effective_from || (c.effective_to !== null && p.end > c.effective_to)) { unresolved(`component ${c.id} effective interval does not cover ${p.id}`); return; }
      let quantity = 0;
      const expectedUnit = c.billing_basis === 'energy' ? `${t.currency}/kWh` : c.billing_basis === 'billing-demand' ? `${t.currency}/kW-period` : c.billing_basis === 'fixed' ? `${t.currency}/period` : '%';
      if (c.unit !== expectedUnit) { unresolved(`component ${c.id} unit does not match billing basis`); return; }
      if (c.ratchet && c.billing_basis !== 'billing-demand') { unresolved(`ratchet on non-demand component ${c.id}`); return; }
      if (c.tou && c.billing_basis !== 'energy') { unresolved(`TOU on non-energy component ${c.id}`); return; }
      if (c.billing_basis === 'energy') {
        if (c.tou && !p.intervals.some(x => x.tou === c.tou)) { unresolved(`TOU ${c.tou} has no load-shape interval`); return; }
        quantity = p.intervals.filter(x => !c.tou || x.tou === c.tou).reduce((a, x) => a + x.kw * x.hours, 0) * multiplier;
      } else if (c.billing_basis === 'billing-demand') quantity = Math.max(demand, p.historical_peak_kw * multiplier * (c.ratchet?.fraction ?? 0));
      else if (c.billing_basis === 'fixed') quantity = 1;
      else {
        if (group !== 'taxes') { unresolved(`percentage component ${c.id} requires an explicit tax calculation order`); return; }
        const bases = c.applies_to ?? [...charges.keys()].filter(key => !(t.taxes ?? []).some(tax => tax.id === key));
        if (new Set(bases).size !== bases.length) { unresolved(`duplicate tax base for ${c.id}`); return; }
        if (bases.some(key => !charges.has(key))) { unresolved(`unknown or forward tax base for ${c.id}`); return; }
        const base = addBands(...bases.map(key => charges.get(key)!));
        const rate = band(c.charge);
        charges.set(c.id, { lo: base.lo * rate.lo / 100, mid: base.mid * rate.mid / 100, hi: base.hi * rate.hi / 100 });
        receipts.push({ kind: 'calculation', component: c.id, refs: [atom.evidence_id, ...bases], detail: `${p.id}: percentage tax applied to declared pre-tax components`, scope: 'modeled' });
        return;
      }
      charges.set(c.id, mapBand(band(c.charge), x => x * quantity));
      receipts.push({ kind: 'calculation', component: c.id, refs: [atom.evidence_id],
        detail: `${p.id}: ${quantity} × ${JSON.stringify(c.charge)} ${c.unit}${c.ratchet ? `; ratchet fraction ${c.ratchet.fraction} of declared historical peak` : ''}`, scope: 'modeled' });
    };
    const unresolvedGroups = new Set<string>();
    for (const gap of t.unresolved_components) {
      const bounds = r.bounded_components.filter(b => b.period_id === p.id && (b.gap_refs.includes(gap) || b.component === gap));
      if (bounds.length !== 1) { unresolved(`gap ${gap} requires one explicit gap-to-component bounded assumption in ${p.id}`); continue; }
      const key = bounds[0].component;
      if (![...groups, 'ramp', 'collateral', 'exit_terms', 'minimum_bill'].includes(key as typeof groups[number])) unresolved(`unsupported gap component mapping ${key}`);
      unresolvedGroups.add(key);
    }
    if (t.energy_components !== null && t.energy_components.length > 0 && !unresolvedGroups.has('energy_components')) {
      for (const interval of p.intervals) if (interval.kw > 0 && !t.energy_components.some(c => c.billing_basis === 'energy' && (!c.tou || c.tou === interval.tou)))
        unresolved(`positive consumption in TOU ${interval.tou} has no energy component`);
    }
    for (const group of groups) {
      if (t[group] !== null) for (const c of t[group]!) addComponent(c, group);
      if (t[group] === null || unresolvedGroups.has(group)) charges.set(group, bounded(group));
    }
    if ((t.ramp !== 'none' || unresolvedGroups.has('ramp')) && !charges.has('ramp')) charges.set('ramp', bounded('ramp'));
    if ((t.collateral !== 0 || unresolvedGroups.has('collateral')) && !charges.has('collateral')) charges.set('collateral', bounded('collateral'));
    if ((t.exit_terms !== 'none' || unresolvedGroups.has('exit_terms')) && !charges.has('exit_terms')) charges.set('exit_terms', bounded('exit_terms'));
    const subtotal = addBands(...charges.values());
    const minimum = t.minimum_bill === null || unresolvedGroups.has('minimum_bill') ? bounded('minimum_bill') : band(t.minimum_bill);
    const total = { lo: Math.max(subtotal.lo, minimum.lo), mid: Math.max(subtotal.mid, minimum.mid), hi: Math.max(subtotal.hi, minimum.hi) };
    periods.push({ id: p.id, hours, energy_kwh: energy, billing_demand_kw: demand, total });
  }
  for (const b of r.bounded_components) if (!usedBounds.has(`${b.period_id}/${b.component}`)) unresolved(`unused bounded assumption ${b.period_id}/${b.component}`);
  if (t.connection_costs === null) unresolved('connection costs are unverified; supply a typed tariff version with a bounded connection cost');
  if (missing.length) return fail();
  const recurring = addBands(...periods.map(p => p.total));
  const connection = band(t.connection_costs!);
  const total = addBands(recurring, connection);
  receipts.push({ kind: 'calculation', component: 'connection-cost', refs: [atom.evidence_id], detail: 'Connection costs occur once; separate from recurring cycle charges and refundable collateral principal.', scope: 'modeled' });
  return { status: 'modeled', sentence: `Modeled electricity bill of ${total.lo.toFixed(2)}–${total.hi.toFixed(2)} ${t.currency} for the declared load shape${hypothetical ? ' under named hypothetical assumptions' : ''}.`,
    release_id: release.manifest.release_id, total, recurring_total: recurring, connection_cost: connection, periods,
    pue_applications: r.load_shape.boundary === 'it-input' ? 1 : 0, hypothetical, missing: [], receipts };
}

/** Illustrative flat shapes; each point is an explicit model, not an observed site bill. */
export function illustrativeBills(release: Release, input: TariffRequest) {
  return [0.5, 0.75, 0.9].map(loadFactor => {
    const assumptionId = `illustrative-load-factor-${loadFactor}`;
    const load: LoadShape = structuredClone(input.load_shape);
    load.assumption_id = assumptionId;
    for (const p of load.periods) {
      p.load_factor = loadFactor;
      p.intervals = p.intervals.map(x => ({ ...x, kw: p.capacity_kw * loadFactor }));
    }
    return { load_factor: loadFactor, result: billTariff(release, { ...input, load_shape: load,
      assumptions: [...input.assumptions, { id: assumptionId, description: `Illustrative constant load at ${100 * loadFactor}% of declared capacity; billing demand and historical peak held independently.`, scope: 'modeled', evidence_ids: [] }] }) };
  });
}
