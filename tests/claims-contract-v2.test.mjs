/* claims-contract-v2 — a central claim carries the evidence it was admitted on, and its content
 * address depends on it.
 *
 * Polaris ruling 2026-09-19 on Astra pack A P1-4. constructCentral() checked the selection
 * receipt, the legs, the clusters and the derivation, then minted a claim carrying none of them:
 * a reader of the artifact could see that a claim was branded central-verified but never on
 * what. And claimIdOf hashed only subject/estimand/role/identity/evidenceBasis/tree, so two
 * claims admitted on materially different provenance collided on ONE content address and
 * emitted byte-identical JSON. Astra's pair — the same claim admitted once on `preset-default`
 * and once on `registry-central` — hashed to f7bc1fe8feb4d32b6ccd5be0 both times.
 *
 * Red on the pre-ruling contract: the ids collide, the receipt is undefined, and neither it nor
 * the evidence basis survives serialization.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const C = require("../site/engine-contracts-v22.js");

let fails = 0, passes = 0;
const check = (name, cond, detail = "") => {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
};

const base = () => ({
  subject: "test", estimand: "margin", role: "comparison",
  tree: C.tree({ value: C.scalar(80) }),
  evidenceBasis: { source: "test" }, requestCentral: true,
  legs: [{ id: "h100", weight: 1, renderableUnderPolicy: true, placementVerified: true }],
  clusters: [{ clusterId: "a", verified: true }, { clusterId: "b", verified: true }],
  derivation: { policyTainted: false },
});
const mint = (over = {}) => C.mintClaim({ ...base(), selectionReceipt: { clean: true, basis: "preset-default" }, ...over });

const a = mint();
const b = mint({ selectionReceipt: { clean: true, basis: "registry-central" } });

check("both claims really are admitted as central (the case is not degenerate)",
  C.isCentral(a) === true && C.isCentral(b) === true);
check("a central claim carries the selection receipt it was admitted on",
  !!a.admissionEvidence && a.admissionEvidence.selectionReceipt
    && a.admissionEvidence.selectionReceipt.basis === "preset-default",
  JSON.stringify(a.admissionEvidence));
check("...and the legs, clusters and derivation",
  !!a.admissionEvidence && Array.isArray(a.admissionEvidence.legs)
    && Array.isArray(a.admissionEvidence.clusters) && !!a.admissionEvidence.derivation,
  JSON.stringify(a.admissionEvidence));
check("the claim states its contract version", a.contractVersion === 2, String(a.contractVersion));

/* THE COLLISION — the defect itself. */
check("two claims admitted on different selection bases have DIFFERENT content addresses",
  C.claimIdOf(a) !== C.claimIdOf(b), `${C.claimIdOf(a)} vs ${C.claimIdOf(b)}`);

const differentLegs = mint({ legs: [{ id: "gb200", weight: 1, renderableUnderPolicy: true, placementVerified: true }] });
check("...and so do two admitted on different hardware legs",
  C.claimIdOf(a) !== C.claimIdOf(differentLegs), `${C.claimIdOf(a)} vs ${C.claimIdOf(differentLegs)}`);

const differentClusters = mint({ clusters: [{ clusterId: "a", verified: true }, { clusterId: "c", verified: true }] });
check("...and two admitted on different clusters",
  C.claimIdOf(a) !== C.claimIdOf(differentClusters), `${C.claimIdOf(a)} vs ${C.claimIdOf(differentClusters)}`);

/* STABILITY — the address must still be a content address, not a nonce. */
check("the same claim minted twice keeps ONE address",
  C.claimIdOf(mint()) === C.claimIdOf(mint()), `${C.claimIdOf(mint())} vs ${C.claimIdOf(mint())}`);
check("the address is still the 24-character digest the registry expects",
  /^[0-9a-f]{24}$/.test(C.claimIdOf(a)), C.claimIdOf(a));

/* SERIALIZATION — the point of carrying it is that the artifact can be audited later. */
const render = (claim) => {
  const out = C.jsonAdapter.render({ claim });
  const doc = typeof out === "string" ? JSON.parse(out) : out;
  return doc.claims ? Object.values(doc.claims)[0] : doc;
};
const ja = render(a), jb = render(b);
check("the emitted artifact carries the selection receipt",
  !!ja.admissionEvidence && ja.admissionEvidence.selectionReceipt
    && ja.admissionEvidence.selectionReceipt.basis === "preset-default",
  JSON.stringify(ja.admissionEvidence));
check("the emitted artifact carries the evidence basis",
  !!ja.evidenceBasis && ja.evidenceBasis.source === "test", JSON.stringify(ja.evidenceBasis));
check("the emitted artifact states the contract version", ja.contractVersion === 2, String(ja.contractVersion));
check("two differently-admitted claims do NOT emit identical artifacts",
  JSON.stringify(ja) !== JSON.stringify(jb));

/* The admission evidence must be a canonical copy, not an alias of the caller's object. */
{
  const receipt = { clean: true, basis: "preset-default" };
  const claim = mint({ selectionReceipt: receipt });
  const before = C.claimIdOf(claim);
  receipt.basis = "registry-central";
  check("mutating the caller's receipt afterwards cannot change the minted claim",
    claim.admissionEvidence.selectionReceipt.basis === "preset-default"
      && C.claimIdOf(claim) === before,
    JSON.stringify(claim.admissionEvidence.selectionReceipt));
}

/* A policy scenario was never admitted, so it carries no admission evidence to speak of. */
{
  const refused = C.mintClaim({ ...base(), selectionReceipt: { clean: false, basis: "preset-default" } });
  check("a refused central request is a policy scenario and says why",
    C.isCentral(refused) === false && Array.isArray(refused.centralRefusals)
      && refused.centralRefusals.length > 0,
    JSON.stringify(refused.centralRefusals));
  check("...and its artifact carries no admission evidence",
    render(refused).admissionEvidence === null, JSON.stringify(render(refused).admissionEvidence));
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log(`\n${fails} CLAIMS-CONTRACT-V2 FAILURE(S)`); process.exit(1); }
console.log("\nALL CLAIMS-CONTRACT-V2 CHECKS PASS");
