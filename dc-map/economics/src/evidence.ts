import type { Evidence, Json } from './presentation.js';
import { assertRelease, type Release } from './release.js';
/** Index only atoms inside a verified release. Duplicate projections of one atom stay one input. */
export function evidenceIndex(release: Release): Map<string, Evidence> {
  assertRelease(release);
  const result = new Map<string, Evidence>();
  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const row = value as Record<string, unknown>;
    if (typeof row.evidence_id === 'string' && typeof row.field === 'string' && 'value' in row) {
      result.set(row.evidence_id, row as unknown as Evidence);
      return;
    }
    Object.values(row).forEach(visit);
  }
  visit(release.siteData);
  return result;
}
/** The producer's own derived eligibility verdict for the CALCULATOR context, by evidence id.
 * An omitted context has no decision recorded; only a recorded non-`eligible` value excludes. */
export function calculatorEligibility(release: Release): Map<string, string> {
  assertRelease(release);
  const result = new Map<string, string>();
  for (const site of release.siteData.sites)
    for (const receipt of site.eligibility_receipts ?? [])
      if (typeof receipt.calculator === 'string') result.set(receipt.evidence_id, receipt.calculator);
  return result;
}
export function currentEvidence(row: Evidence, at: string): boolean {
  return row.record_kind === 'adjudicated' && row.as_of !== null && row.as_of <= at
    && (row.valid_from === null || row.valid_from <= at)
    && (row.valid_to === null || at < row.valid_to);
}
export function objectValue(value: Json): Record<string, Json> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
