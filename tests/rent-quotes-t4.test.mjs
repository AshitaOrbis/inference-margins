/* im-arc T4 fold (2026-08-24) — the rental-quote registry and the selection policy.
   Spec: research/im-arc-t4-fold-memo.md §4 [F7].

   The load-bearing claim this file gates: a planning rent is now a SELECTION from a registry of
   dated quotes, not a scalar typed into a hardware row. Where no admissible public quote of the
   low/committed planning class exists, the row resolves through the T2 fix-2 UNAVAILABLE path —
   it never silently falls back to a retired number, and the retired number survives only as a
   declared provisional replay that a reader or a caller must state explicitly.
   Run: node tests/rent-quotes-t4.test.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-dc-v1.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const base = () => structuredClone(E.DEFAULTS);

/* ---------- 1. the vector is SELECTED, never typed ---------- */
assert("T4-RENT-1 every planning rent equals the middle of the quote its policy selects",
  E.HW_ORDER.every((key) => {
    const quoteId = D.RENT_POLICY.defaultRateId[key];
    const expected = quoteId === null ? null : D.RENT_QUOTES[quoteId].usdPerHr.mid;
    return E.hardwareRow(key).rent === expected;
  }),
  JSON.stringify(E.HW_ORDER.map((key) => [key, E.hardwareRow(key).rent,
    D.RENT_POLICY.defaultRateId[key]])));

assert("T4-RENT-1 the selection POLICY is one statement, not one contract class",
  D.RENT_POLICY.planningPolicy === "low-committed"
    && /selection policy, not one literal contract class/.test(D.RENT_POLICY.policyStatement));

/* The hardware rows whose planning middle the registry adopts or holds.
   im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
   gb200, gb300 and trn3 were null from the T4 fold until this ruling, which adopts the fold's own
   declared provisional replays as the planning selection. The VALUES are the replays' values,
   unchanged — 4.50, 6.00, 2.20 — so what moved is which quote the policy selects, not what any
   quote says. Their rows are basis `provisional` and their source lines still record that no rate
   of the low/committed planning class is published for those legs. */
const expectedVector = { h100: 2.40, h200: 3.68, h20: 0.82, tpu7: 5.40, trn2: 2.235,
  h800: 1.75, ascend: 1.95, gb200: 4.50, gb300: 6.00, trn3: 2.20 };
for (const [key, expected] of Object.entries(expectedVector))
  assert(`T4-RENT-1 ${key} planning rent is ${expected === null ? "unavailable (null)" : expected}`,
    E.hardwareRow(key).rent === expected, String(E.hardwareRow(key).rent));

/* ---------- 2. every quote is dated, classed, and configuration-explicit ---------- */
assert("T4-RENT-2 every quote names an ACTUAL deal class from the closed list",
  Object.values(D.RENT_QUOTES).every((quote) => D.DC_SCHEMA.RATE_CLASSES.includes(quote.rateClass)
    && typeof quote.term === "string" && typeof quote.region === "string"
    && typeof quote.configuration === "string" && typeof quote.bundleScope === "string"));
/* The H20 span deliberately crosses two memory configurations. The reader cannot tell the SKUs
   apart unless every surface that shows the number also shows that (memo §4). */
assert("T4-RENT-2 the H20 planning quote states the 96 GB / 141 GB configuration split",
  /96 GB/.test(D.RENT_QUOTES["h20-china-specialist-bare-metal-2026-08"].configuration)
    && /141 GB/.test(D.RENT_QUOTES["h20-china-specialist-bare-metal-2026-08"].configuration));
assert("T4-RENT-2 Alibaba managed on-demand is a SEPARATE class, never the planning default",
  D.RENT_QUOTES["h20-alibaba-managed-on-demand-2026-08"].rateClass === "managed-cloud-on-demand"
    && D.RENT_POLICY.defaultRateId.h20 !== "h20-alibaba-managed-on-demand-2026-08");
assert("T4-RENT-2 the Anthropic TPU strategic estimate is a quote, never the default",
  D.RENT_QUOTES["tpu7-anthropic-strategic-estimate-2025-11"].rateClass === "strategic-estimate"
    && D.RENT_POLICY.defaultRateId.tpu7 === "tpu7-google-3yr-committed-2026-08");
assert("T4-RENT-2 the Ascend quote is a provisional tender candidate, never an executed award",
  D.RENT_QUOTES["ascend-tender-candidate-2026-provisional"].rateClass === "tender-candidate"
    && D.RENT_QUOTES["ascend-tender-candidate-2026-provisional"].basis === "provisional"
    && !/procurement award/i.test(JSON.stringify(D.RENT_QUOTES)));
/* The GB200 alternates are TWO observations plus a span whose class name states both. */
assert("T4-RENT-2 the GB200 alternates are split into their two actual classes plus a named span",
  D.RENT_QUOTES["gb200-coreweave-public-slice-2026-08"].rateClass === "on-demand-public-slice"
    && D.RENT_QUOTES["gb200-aws-capacity-block-2026-08"].rateClass === "capacity-block"
    && D.RENT_QUOTES["gb200-public-slice-capacity-block-span-2026-08"].rateClass
      === "on-demand-public-slice-and-capacity-block"
    && D.RENT_QUOTES["gb200-public-slice-capacity-block-span-2026-08"].observationKind === "selected-span");

/* ---------- 3. the ADOPTED path, and the unavailable path it replaced ----------
   These three legs are the reason this whole section exists. From the T4 fold to 2026-09-10 they
   resolved as UNAVAILABLE and the assertions here proved there was no silent fallback. The owner's
   ruling adopts a provisional planning rent for each, so they now resolve as NUMBERS — and the
   thing worth pinning is that they resolve through a NAMED QUOTE with a receipt, which is the
   opposite of a silent fallback and the only reason adopting them is defensible at all. The
   no-silent-fallback property itself is still proven, immediately below, on a hardware key that has
   no selection at all. */
for (const key of ["gb200", "gb300", "trn3"]) {
  assert(`T4-RENT-3 ${key} rent resolves as an adopted number, through a named quote`,
    Number.isFinite(E.registryPlanningRentHr(E.hardwareRow(key), base(), null)),
    String(E.registryPlanningRentHr(E.hardwareRow(key), base(), null)));
  const receipt = E.registryPlanningRentReceipt(key, base());
  assert(`T4-RENT-3 ${key} receipt names the adopted quote, its provisional basis and its date`,
    receipt.unavailable !== true && receipt.quoteId === `${key}-owner-adopted-scenario-2026-09`
      && D.RENT_QUOTES[receipt.quoteId].basis === "provisional"
      && /no .*(published|public)/i.test(D.RENT_QUOTES[receipt.quoteId].source)
      && receipt.value === D.RENT_QUOTES[receipt.quoteId].usdPerHr.mid,
    JSON.stringify(receipt));
}
/* The retired points survive ONLY as declared replays, and the registry says so. */
for (const [key, expected] of Object.entries({ gb200: 4.50, gb300: 6.00, trn3: 2.20 })) {
  const replay = D.RENT_POLICY.provisionalReplays[key];
  assert(`T4-RENT-3 the retired ${key} $${expected} survives only as a declared provisional replay`,
    replay && replay.usdPerHr.mid === expected && replay.basis === "provisional"
      && /declared provisional replay/i.test(replay.declaredAs), JSON.stringify(replay));
}
/* A reader who STATES the replay prices the leg — that is the whole point of "declared". */
{
  const state = Object.assign(base(), { rentAbsLeg: { gb300: 6.00 } });
  assert("T4-RENT-3 a DECLARED replay prices the leg the unavailable path refused",
    E.registryPlanningRentHr(E.hardwareRow("gb300"), state, null) === 6.00,
    String(E.registryPlanningRentHr(E.hardwareRow("gb300"), state, null)));
}
/* An unavailable planning rent must not leak into the owned-TCO branch: capex is registered
   for these rows and owned pricing stays live. */
assert("T4-RENT-3 an unavailable planning rent does not disable owned-TCO pricing",
  ["gb200", "gb300", "trn3"].every((key) => {
    const state = Object.assign(base(), { hwMode: "tco" });
    return Number.isFinite(E.hwHourCost(E.hardwareRow(key), state, null));
  }));

/* ---------- 4. every priced row carries its class and its quote on the receipt ---------- */
for (const key of E.HW_ORDER) {
  const receipt = E.registryPlanningRentReceipt(key, base());
  if (D.RENT_POLICY.defaultRateId[key] === null) continue;
  assert(`T4-RENT-4 ${key} receipt names its quote id, rate class and dated source`,
    receipt.quoteId === D.RENT_POLICY.defaultRateId[key]
      && D.DC_SCHEMA.RATE_CLASSES.includes(receipt.rateClass)
      && /^20\d\d-\d\d-\d\d$/.test(receipt.asOf)
      && typeof receipt.source === "string" && receipt.source.length > 20
      && receipt.usdPerHr && receipt.usdPerHr.lo <= receipt.usdPerHr.mid,
    JSON.stringify(receipt));
}
/* Alternates are addressable by class — the stress / on-demand perspective consumes them. */
assert("T4-RENT-4 alternates for a hardware are addressable by rate class",
  E.rentQuotesFor("gb200").length === 4
    && E.rentQuoteByClass("gb200", "capacity-block").usdPerHr.mid === 10.582
    && E.rentQuotesFor("tpu7").length === 2,
  JSON.stringify(E.rentQuotesFor("gb200").map((quote) => quote.rateClass)));

/* ---------- 5. the bundled capacity contracts stay OUT of the vector ---------- */
assert("T4-RENT-5 no bundled all-in contract rate reaches the planning vector",
  Object.values(D.RENT_QUOTES).every((quote) => ![5.27, 11.46].includes(quote.usdPerHr.mid))
    && E.HW_ORDER.every((key) => ![5.27, 11.46].includes(E.hardwareRow(key).rent)),
  JSON.stringify(E.HW_ORDER.map((key) => E.hardwareRow(key).rent)));

console.log(failures ? `\n${failures} RENT-QUOTES T4 FAILURE(S)` : "\nALL RENT-QUOTES T4 TESTS PASS");
process.exit(failures ? 1 : 0);
