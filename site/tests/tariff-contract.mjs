/* SHARED TARIFF VALIDATOR — one implementation, both test twins.
 *
 * GPT Pro review pr-20260902T175643Z-034d27, findings 4-7. The first cut of the re-pointed
 * stale-loudness alarm had four defects, all of which this closes:
 *   4. Date validation was `length === 10`, so "not-a-date" passed, `new Date()` returned Invalid,
 *      every comparison against it was false, and the alarm FAILED OPEN FOREVER — on exactly the
 *      metadata corruption it exists to make loud.
 *   5. `validUntil || reVerifyAfter` conflated two independent clocks. A tariff's business validity
 *      and the freshness of the evidence for it are orthogonal: a rate valid through December whose
 *      successor is cancelled in October would have slept until December — the very failure that
 *      produced this whole repair.
 *   6. Two incompatible object shapes lived under one `tariff` key, and the "generic" test hard-coded
 *      one model. A consumer could not know what fields a tariff had.
 *   7. The XOR (`dated !== standing`) encoded the wrong ontology — a rate can be the current standard
 *      AND have an announced successor — and NOTHING bound the metadata to `set.priceIn/priceOut`.
 *      The record could say $2/$10 while the calculator computed $3/$15 and the alarm stayed green.
 *
 * The schema is discriminated and answers three separate questions: what is current, is a transition
 * announced, and when was the current claim last verified.
 */

/* The maximum a verification horizon may be set to. See finding 8 in the header. */
export const MAX_VERIFICATION_INTERVAL_DAYS = 31;

/* Strict ISO calendar day -> UTC ms. Rejects normalisation ("2027-99-99" is not a day). */
export function parseIsoDay(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  return new Date(ms).toISOString().slice(0, 10) === s ? ms : null;
}

/* Returns [] when the record is sound, else a list of human-readable defects. */
export function validateTariff(model, now = Date.now()) {
  const e = [];
  const t = model.tariff;
  const id = model.id;
  if (!t || typeof t !== "object") return [`${id}: tariff must be an object`];

  /* ---- current: what the calculator is entitled to compute with ---- */
  const c = t.current;
  if (!c || typeof c !== "object") e.push(`${id}.tariff.current is required (what is the rate NOW)`);
  else {
    if (typeof c.priceIn !== "number" || typeof c.priceOut !== "number")
      e.push(`${id}.tariff.current must carry numeric priceIn/priceOut`);
    /* THE BINDING. Metadata that cannot disagree with the engine is the whole point: without this a
       record could say $2/$10 while set computed $3/$15 and every alarm stayed green. */
    else if (c.priceIn !== model.set.priceIn || c.priceOut !== model.set.priceOut)
      e.push(`${id}: tariff.current ${c.priceIn}/${c.priceOut} does not match the value the engine computes with `
        + `(set ${model.set.priceIn}/${model.set.priceOut}) — the record and the calculator have drifted apart`);
    if (!parseIsoDay(c.effectiveFrom)) e.push(`${id}.tariff.current.effectiveFrom must be a real YYYY-MM-DD day`);
    if (!["standard", "introductory", "promotional"].includes(c.status))
      e.push(`${id}.tariff.current.status must be one of standard/introductory/promotional`);
    if (!Array.isArray(c.sources) || c.sources.length === 0)
      e.push(`${id}.tariff.current.sources must carry at least one primary observation`);
    else for (const [i, srcRow] of c.sources.entries()) {
      if (!/^https?:\/\/\S+$/.test(String(srcRow.url || ""))) e.push(`${id}.tariff.current.sources[${i}].url must be a raw url`);
      if (!parseIsoDay(srcRow.observedAt)) e.push(`${id}.tariff.current.sources[${i}].observedAt must be a real day`);
      if (typeof srcRow.quote !== "string" || !srcRow.quote) e.push(`${id}.tariff.current.sources[${i}].quote must carry what the source SAYS`);
    }
  }

  /* ---- scheduled: announced transitions, orthogonal to "is it current" ---- */
  if (!Array.isArray(t.scheduled)) e.push(`${id}.tariff.scheduled must be an array (empty when none is announced)`);
  else for (const [i, s] of t.scheduled.entries()) {
    if (!parseIsoDay(s.effectiveFrom)) e.push(`${id}.tariff.scheduled[${i}].effectiveFrom must be a real day`);
    if (typeof s.priceIn !== "number" || typeof s.priceOut !== "number")
      e.push(`${id}.tariff.scheduled[${i}] must state the prices it would introduce`);
  }

  /* ---- verification: an INDEPENDENT clock. Never derived from business validity. ---- */
  const v = t.verification;
  if (!v || typeof v !== "object") e.push(`${id}.tariff.verification is required — evidence freshness is not implied by a rate being current`);
  else {
    const at = parseIsoDay(v.verifiedAt), by = parseIsoDay(v.reverifyBy);
    if (at === null) e.push(`${id}.tariff.verification.verifiedAt must be a real YYYY-MM-DD day`);
    if (by === null) e.push(`${id}.tariff.verification.reverifyBy must be a real YYYY-MM-DD day (a malformed one used to make this alarm fail open forever)`);
    if (at !== null && by !== null && by <= at)
      e.push(`${id}.tariff.verification.reverifyBy must be AFTER verifiedAt`);
    /* MAXIMUM CADENCE, ENFORCED (GPT Pro pr-20260902T175643Z-034d27 finding 8). Without this the
       alarm is clearable by editing ONE date and never looking at the vendor: the long comments told
       the next editor not to do that, and comments do not enforce. 30 days is deliberate rather than
       cautious — the reviewer's reasoning is that a longer horizon is decorative in the CURRENT
       control environment, where one detector is blind by design, the detector that works feeds a
       queue with no aging enforcement, and a MATERIAL item sat 21 days untouched (bq-1873). It may
       relax to ~90 once that intake gap is closed, and not before. */
    if (at !== null && by !== null && by - at > MAX_VERIFICATION_INTERVAL_DAYS * 86400000)
      e.push(`${id}.tariff.verification: reverifyBy is ${Math.round((by - at) / 86400000)} days after verifiedAt, over the ${MAX_VERIFICATION_INTERVAL_DAYS}-day maximum. Shorten it, or close bq-1873 first and raise the maximum deliberately — a horizon longer than the intake can detect within is decorative.`);
    /* Evidence must MOVE for the clock to move: verifiedAt has to be backed by a source observed on
       or after it, so editing the date alone cannot clear the alarm. */
    if (at !== null && t.current && Array.isArray(t.current.sources)) {
      const freshest = t.current.sources.map(x => parseIsoDay(x.observedAt)).filter(x => x !== null).sort().pop();
      if (freshest === undefined || freshest < at)
        e.push(`${id}.tariff.verification.verifiedAt ${v.verifiedAt} is not backed by any source observed on or after it — advancing the date without re-reading the vendor is exactly what this alarm exists to prevent`);
    }
    if (typeof v.owner !== "string" || !v.owner) e.push(`${id}.tariff.verification.owner must name who is accountable for the re-check`);
    if (typeof v.procedure !== "string" || !v.procedure) e.push(`${id}.tariff.verification.procedure must name the procedure to run, so the failure is actionable without baking in a remedy`);
    /* THE STALE-LOUD CONDITION, remedy-free but PROCEDURE-bound. */
    if (by !== null && now >= by + 86400000)
      e.push(`${id}: TARIFF VERIFICATION OVERDUE (reverifyBy ${v.reverifyBy}). Run ${v.procedure || "the tariff-verification procedure"}: record current prices, any announced transition or cancellation, primary-source evidence, verifiedAt, reviewer and queue disposition. CHANGING reverifyBy ALONE IS INVALID — the source observation must move with it. Do not apply any remedy recorded here; a scheduled change can be cancelled while this record sleeps, and one was, on 2026-08-10.`);
  }

  /* ---- history: superseded facts stay dated rather than deleted ---- */
  if (t.history !== undefined) {
    if (!Array.isArray(t.history)) e.push(`${id}.tariff.history must be an array`);
    else for (const [i, h] of t.history.entries()) {
      if (!["cancelled-transition", "superseded-rate"].includes(h.kind))
        e.push(`${id}.tariff.history[${i}].kind must be cancelled-transition or superseded-rate`);
      if (h.kind === "cancelled-transition" && !parseIsoDay(h.cancelledAt))
        e.push(`${id}.tariff.history[${i}].cancelledAt must be a real day`);
    }
  }
  return e;
}
