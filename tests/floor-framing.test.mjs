/* THE ≈58% IS A PUBLIC-DATA SCENARIO, NOT A GUARANTEED MINIMUM — and the page still opens on ≈82%.
   Owner ruling d-20260930-inference-margins-floor-tile-becomes-a-public-data-scenario (answer B on card
   q-im-floor-wording-2026-09-28, 2026-09-30T03:06:25Z), verbatim: "recommended accepted — B: Call ≈58% a
   public-data scenario, not a guaranteed minimum". The card's block B is the exact copy: ten places on the
   page plus the rename of "public-data floor" to "public-data scenario", aria-labels included; the ≈82%
   opening and its order unchanged. Polaris ruling
   p-20260930-im-floor-release-carries-block-b-phrases-into-the-four-places-the-count-missed carries block
   B's approved sentences into the places block B's count missed (the tile's tooltip, the stress-case note,
   its attribution line, the glossary entry) so that no guarantee survives on the page, in the glossary or in
   the connector's engine text. Enacted by leg im-floor-scenario-release-bq3933-0930 (bq-3933).

   This file guarded the SUPERSEDED framing of d-20260926 (the ≈58% as "a bare minimum from public data known
   to be wrong; real margins cannot be lower") from bq-3520 until bq-3933; its structure is kept and its
   direction inverted (style/VOCABULARY.md carries both dated amendments):
     F-1  the tile is NAMED the public-data scenario and CAPTIONED with block B's exact body;
     F-2  the page still OPENS on the GPT-5.6 Pro scenario, ≈82%, and that tile comes first;
     F-3  every other mention of the ≈58% reading on the page, in the engine's emitted copy for it and in the
          glossary is framed as the public-data scenario, and NO guarantee wording is left anywhere on them;
     F-4  the stress control and the calculator's preset carry the name, and the preset notes carry no dated
          engine-history sentences (bq-1141 residual (c), the standing no-version-narration rule);
     NEG  negative controls: each check is shown to fail on a mutated input, including the superseded wording.
   Run: node tests/floor-framing.test.mjs */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const require_ = createRequire(import.meta.url);
const E = require_("../site/engine.js");
const INDEX = readFileSync("site/index.html", "utf8");
const GLOSSARY = readFileSync("site/glossary.html", "utf8");
const APP = readFileSync("site/app.js", "utf8");
const fa = E.finalAnswer();

const plain = (html) => html
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\s+/g, " ");

/* The guarantee the owner ruled out, in every wording this site has used for it. "not a guaranteed minimum"
   is the ruled NEGATION and is not in this list. */
const GUARANTEE = /bare minimum|cannot be (?:lower|under)|below which real margins|real (?:inference )?margins cannot|known to be wrong|known to understate|floor, not an estimate|floor in a second sense/i;
const guaranteeHits = (text) => [...text.matchAll(new RegExp(GUARANTEE.source, "gi"))]
  .map(m => text.slice(Math.max(0, m.index - 60), m.index + 40));

/* F-1 — the name and the caption */
const tileRe = /<section class="final-answer" id="final-answer" aria-label="([^"]*)">\s*<div class="tile tile-final-answer">\s*<div class="tile-label">([^<]*)<button class="info" data-tip="final-answer" aria-haspopup="dialog" aria-label="([^"]*)">/;
const tileOk = (html) => { const m = html.match(tileRe);
  return !!m && m[1] === "Public-data scenario" && m[2].trim() === "Public-data scenario" && m[3] === "Explanation: Public-data scenario"; };
assert("F-1 the ≈58% tile is named \"Public-data scenario\" (label, section aria-label and its ⓘ aria-label)", tileOk(INDEX),
  JSON.stringify((INDEX.match(tileRe) || []).slice(1)));
/* Block B place 4, exactly: the body under the ≈58% value. The value token keeps its crop unit ("<n> — <name>, <body>"),
   and the tile drops the name because the title above already says it (app.js FA_TILE_NAME_PREFIX). */
const BODY = (v) => v + " using the public-data assumptions shown. This is a model result, not a guaranteed minimum for actual margins.";
const captionOk = (tok) => { const v = tok.split(" — ")[0];
  return /^≈58%$/.test(v) && tok === v + " — public-data scenario, policy-labeled: " + BODY(v) && !GUARANTEE.test(tok); };
assert("F-1 the tile's caption (the value token's status half) is block B's body exactly",
  captionOk(fa.tokens.planningPoint), fa.tokens.planningPoint);
assert("F-1 the tile drops exactly the name prefix the token carries, so its status reads block B's body",
  /const FA_TILE_NAME_PREFIX = "public-data scenario, policy-labeled: ";/.test(APP));
assert("F-1 the full-reading token names the scenario and says it is not a guaranteed minimum or an estimate",
  /public-data scenario, policy-labeled: a model result under public-data assumptions, not a guaranteed minimum or an estimate\./.test(fa.tokens.referenceReadingLine)
  && !GUARANTEE.test(fa.tokens.referenceReadingLine), fa.tokens.referenceReadingLine);
assert("F-1 the tile's read-in-full control names the scenario",
  /data-fa-explain="answer">Read the public-data scenario in full<\/button>/.test(INDEX));
assert("F-1 the tile's ⓘ tooltip is titled the public-data scenario and states no guarantee",
  E.TIPS["final-answer"].t === "The public-data scenario"
  && E.TIPS["final-answer"].b.startsWith("This page's reading at low/committed planning rates: a model result under public-data assumptions, not a guaranteed minimum for actual margins, and not an estimate of them.")
  && !GUARANTEE.test(E.TIPS["final-answer"].b), E.TIPS["final-answer"].b.slice(0, 200));

/* F-2 — the page still opens on ≈82%, first */
assert("F-2 the built-in opening scenario is the GPT-5.6 Pro estimate's settings (gptpro-r3)",
  E.LANDING_DEFAULT_PERSP_ID === "gptpro-r3", E.LANDING_DEFAULT_PERSP_ID);
assert("F-2 the opening reading is ≈82%",
  Math.round(fa.landingReading.marginPct) === 82, String(fa.landingReading.marginPct));
const heroFirst = (html) => { const h = html.indexOf('id="out-margin"'), f = html.indexOf('id="final-answer"'); return h > 0 && f > 0 && h < f; };
assert("F-2 the ≈82% hero tile comes before the ≈58% scenario tile", heroFirst(INDEX));

/* F-3 — every other mention of the ≈58% reading carries the same framing, and no guarantee survives.
   Kept from bq-3520's review r1/r2: the list-price twin (≈63%), decimal and bare forms count too; the scan covers the
   engine's emitted reader copy for this reading; a sentence that calls it an estimate AFFIRMATIVELY fails. */
const MENTION = /(?:about|~|≈)\s?(?:58|63)(?:\.\d+)?\s?(?:%|–|-)|\b(?:58|63)(?:\.\d+)?\s?%/gi;
/* The ≈58%/≈63% on the page that are DIFFERENT quantities, licensed by their exact local words. */
const OTHER_QUANTITY = ["accelerators ≈58% of per-prompt energy", "~63% at full-cycle owned cost", "full-cycle TCO at ~63%",
  "Grok 4.5 serving margin ~63% full-cycle-TCO",   // the xAI card's owned-cost lens
  "Its own stated reading: 58.8%",                 // a §10 Astra Pro estimate card: another model's own stated figure
  "accelerators are only 58% of per-prompt energy", // the energy share again, in the methods box's words
  "reads about 91%, 63% or 19%"];                  // the glossary's xAI cost-basis example (cash / owned / customer rent)
/* OCCURRENCE-EXACT licenses (bq-3800 review r1 finding R2): an entry exempts ONLY the one number at its own position. */
const EXACT_OTHER = [
  "high-margin scenarios: 58%–92%",   // a §10 Astra Pro estimate card: GPT-6 Sol's own low-to-high-margin scenario span
];
/* GPT Pro checkpoint r2 (pr-20260930T043117Z-c53794) P1: a licence applies to the ONE number occurrence inside its phrase,
   never to a window or a sentence that merely contains the phrase ("about 58% is a floor and accelerators are only 58% of
   per-prompt energy" escaped through the second, licensed number). OTHER_QUANTITY is now occurrence-exact like EXACT_OTHER. */
const licensedOccurrence = (t, m) => [...OTHER_QUANTITY, ...EXACT_OTHER].some(q => { const k = q.indexOf(m[0]);
  return k >= 0 && t.slice(m.index - k, m.index - k + q.length) === q; });
const AFFIRMED_ESTIMATE = /\b(?:best|central|likely|verified|our) estimate\b|\bis (?:a|an|the|this page's) (?:answer|estimate|baseline)\b/gi;
const affirmsEstimate = (win) => [...win.matchAll(AFFIRMED_ESTIMATE)]
  .some(m => !/\b(?:not|nothing like|never|no)\b[^.;]{0,12}$/i.test(win.slice(Math.max(0, m.index - 25), m.index)));
/* The framing words of the ruling: the reading's one name, or block B's own "public-data assumptions" / "model result",
   or one of block B's place-10 references, which the owner approved word for word. The bare word "scenario" is NOT a
   framing (every preset is a scenario), so only those exact phrases are licensed. */
const BLOCK_B_REFERENCES = ["the scenario's settings span", "the calculator's reconstruction of this scenario",
  "which moved the reading from about 51% to about 58%", "(the scenario reads about 58%",
  "exceeding a scenario is not a disagreement with it", "which that scenario allows"];
/* Block B's new copy, place by place, verbatim from the card (ruling d-20260930-…): the positive control for F-3's rules. */
const BLOCK_B_NEW = [
  "reads about 58% at effective price: a model result under public-data assumptions, not a guaranteed minimum for actual margins, and not an estimate of them.",
  "a model result under public-data assumptions, not a guaranteed minimum or an estimate",
  "and every judgment dial sits at its unmoved value. So this reading is a public-data scenario: a model result under those assumptions, not a guaranteed minimum for real inference margins, and nothing like a best estimate of them.",
  "Public-data scenario", "≈58% using the public-data assumptions shown. This is a model result, not a guaranteed minimum for actual margins.",
  "a model result under public-data assumptions, not a guaranteed minimum for actual margins and not an estimate.",
  "It is a public-data scenario, not an estimate",
  "public-data scenario, policy-labeled: a model result under public-data assumptions, not a guaranteed minimum or an estimate.",
  "≈58% at the public-evidence reference — a model result, not a guaranteed minimum or an estimate;",
  "is a public-data scenario — a reproducible model result, not a guaranteed minimum, and not an estimate of any provider's actual margin;",
  ...BLOCK_B_REFERENCES];
const FRAMED = new RegExp("public-data scenario|public-data assumptions|model result|"
  + BLOCK_B_REFERENCES.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const unframed = (html) => {
  const t = plain(html), out = [];
  for (const m of t.matchAll(MENTION)) {
    if (licensedOccurrence(t, m)) continue;   // r2: occurrence-exact (was: any licensed phrase within the local window)
    const win = t.slice(Math.max(0, m.index - 260), m.index + 160);
    /* the ruled framing in reach of the number; never a retired name beside it, never a guarantee, never an affirmative
       estimate. */
    if (!FRAMED.test(win) || /planning baseline|public-data floor/i.test(win) || GUARANTEE.test(win) || affirmsEstimate(win))
      out.push(t.slice(Math.max(0, m.index - 80), m.index + 40));
  }
  return out;
};
const stressP = E.PERSPECTIVES.find(p => p.id === "stress-public-rate");
const stressDossier = (E.DOSSIERS.perspectives || {})["stress-public-rate"] || {};
const EMITTED = [fa.tokens.planningPoint, fa.tokens.planningPointLine, fa.tokens.referenceReadingLine,
  fa.tokens.higherJustificationsHeader, fa.tokens.basisDeclarationLine, E.TIPS["final-answer"].b, stressP.note, stressP.basisNote]
  .map(x => "<p>" + x + "</p>").join("\n");
{
  const u = unframed(INDEX);
  assert("F-3 every ≈58% mention on the page and in the report copy is framed as the public-data scenario", u.length === 0, JSON.stringify(u));
  const n = [...plain(INDEX).matchAll(MENTION)].length;
  assert("F-3 (scope) the scan actually meets the report's mentions, not just the tile", n >= 12, String(n));
}
{
  const u = unframed(EMITTED);
  assert("F-3 every ≈58% the engine emits for this reading (value token, full-reading tokens, tip, stress preset) is framed as the public-data scenario",
    u.length === 0, JSON.stringify(u));
}
{
  const u = unframed(GLOSSARY);
  assert("F-3 every ≈58% mention in the glossary is framed as the public-data scenario", u.length === 0, JSON.stringify(u));
}
/* The page-wide half of the Polaris ruling: no guarantee wording survives anywhere, after a click included — the
   tooltip, the stress preset's note, basis and attribution, the higher-justification entries and every token. */
{
  const tokens = Object.values(fa.tokens).filter(x => typeof x === "string").join("\n");
  const entries = JSON.stringify(fa.tokens.higherJustificationEntries || []) + JSON.stringify(fa.higherJustifications || []);
  const engineCopy = [tokens, entries, JSON.stringify(E.TIPS), stressP.name, stressP.note, stressP.basisNote, JSON.stringify(stressDossier)].join("\n");
  assert("F-3 no guarantee wording on the page (plain text and attributes)",
    guaranteeHits(plain(INDEX)).length === 0 && guaranteeHits(INDEX.replace(/<!--[\s\S]*?-->/g, " ")).length === 0,
    JSON.stringify(guaranteeHits(plain(INDEX)).concat(guaranteeHits(INDEX.replace(/<!--[\s\S]*?-->/g, " ")))));
  assert("F-3 no guarantee wording in the glossary", guaranteeHits(plain(GLOSSARY)).length === 0, JSON.stringify(guaranteeHits(plain(GLOSSARY))));
  assert("F-3 no guarantee wording in the engine copy a click or the MCP connector reaches (tokens, entries, tooltips, the stress preset and its dossier)",
    guaranteeHits(engineCopy).length === 0, JSON.stringify(guaranteeHits(engineCopy)));
  assert("F-3 the retired name \"public-data floor\" is gone from the page, the glossary and that engine copy",
    !/public-data floor/i.test(plain(INDEX)) && !/public-data floor/i.test(INDEX.replace(/<!--[\s\S]*?-->/g, " "))
    && !/public-data floor/i.test(plain(GLOSSARY)) && !/public-data floor/i.test(engineCopy));
  assert("F-3 the stress preset's attribution line carries block B's words",
    stressDossier.who === "This page's public-data scenario: the registered planning settings with no judgment dial moved — a model result under public-data assumptions, not a guaranteed minimum or an estimate.",
    String(stressDossier.who));
}
/* GPT Pro checkpoint r1 (pr-20260930T040255Z-60b6cb) P1: the phrase list above cannot see a guarantee restated in
   other words — "The public-data scenario is a floor: about 58%." passed it, and so did place 1 with its "not " deleted.
   Two sentence-scoped rules close that class:
     (1) no "floor" in any sentence that names THIS reading (its name, a ≈58/≈63 mention that is not a licensed other
         quantity, or one of block B's place-10 phrases);
     (2) every "guaranteed minimum" is the ruled negation, "not a guaranteed minimum".
   The unrelated floors block B keeps (analysts' above-80 floors, the 50% utilization floor, rental and decode cost floors,
   the Huatai entry's "floor's numeric neighborhood") sit in sentences that do not name this reading; the positive
   controls below pin that they are still on the page and still pass. */
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NAMES_READING = new RegExp("public-data scenario|≈58\\b|" + BLOCK_B_REFERENCES.map(escRe).join("|"), "i");
/* GPT Pro checkpoint r2 (pr-20260930T043117Z-c53794) P1, scope: a sentence ends at . ! ? (never at a semicolon), also where
   a full stop meets a capital with no space between; and a sentence that opens by referring back ("It …", "This reading …")
   inherits the previous sentence's reading. "The public-data scenario reads about 58%; it is a floor." and "…58%. It is a
   floor." escaped the r1 rule, whose scope ended at the semicolon or the full stop. */
const sentencesOf = (text) => text.split(/(?<=[.!?])\s+|(?<=[.!?])(?=[A-Z★≈])|\n/);
const BACKREF = /^\s*(?:it|this|that|the reading|this reading|that reading|the scenario|this scenario|that scenario|the figure|this figure|the number|this number)\b/i;
const namesReadingOwn = (s) => NAMES_READING.test(s) || [...s.matchAll(MENTION)].some(m => !licensedOccurrence(s, m));
const readingSentences = (text) => { const out = []; let prev = false;
  for (const s of sentencesOf(text)) { const on = namesReadingOwn(s) || (prev && BACKREF.test(s)); if (on) out.push(s); prev = on; }
  return out; };
/* Block B's own "Unchanged" list keeps "the floor's numeric neighborhood" in the Huatai entry (Patel's and Huatai's
   above-80 floor, not this reading); that entry's sentence also carries the label that names this reading. The licence is
   occurrence-exact: only a "floor" INSIDE that exact phrase is exempt, never the sentence. */
const FLOOR_LICENSED = ["the floor's numeric neighborhood"];
const floorWords = (s) => [...s.matchAll(/\bfloors?\b/gi)].filter(m => !FLOOR_LICENSED.some(q => { const k = q.indexOf("floor");
  return k >= 0 && s.slice(m.index - k, m.index - k + q.length) === q; }));
const floorOfReading = (text) => readingSentences(text).filter(s => floorWords(s).length > 0).map(s => s.slice(0, 160));
const affirmedGuarantee = (text) => [...text.matchAll(/guaranteed minimum/gi)]
  .filter(m => !/not a $/i.test(text.slice(Math.max(0, m.index - 6), m.index))).map(m => text.slice(Math.max(0, m.index - 80), m.index + 40));
/* GPT Pro checkpoint r2 P1, reach: ONE reader-copy collection for every rule — the page's text AND its reader-facing
   attribute values (aria-label, title, alt, placeholder), the glossary's likewise, and every emitted STRING LEAF of the
   engine's answer (fa.tokens incl. the higherJustificationEntries and executiveSummaryRows arrays), the justification
   records, every tooltip, the stress preset and its dossier. The r1 collector skipped the emitted entries and every
   attribute. */
const leaves = (x) => typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(leaves) : (x && typeof x === "object") ? Object.values(x).flatMap(leaves) : [];
const decodeAttr = (v) => v.replace(/&quot;/g, "\"").replace(/&#0*39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attrText = (html) => [...html.replace(/<!--[\s\S]*?-->/g, " ").matchAll(/\s(?:aria-label|aria-description|title|alt|placeholder)="([^"]*)"/g)]
  .map(m => decodeAttr(m[1]).trim()).filter(Boolean).join("\n");
const readerCopy = ({ index = INDEX, glossary = GLOSSARY, faObj = fa, tips = E.TIPS, stress = stressP, dossier = stressDossier } = {}) => ({
  "the page": plain(index) + "\n" + attrText(index),
  "the glossary": plain(glossary) + "\n" + attrText(glossary),
  "the engine copy": [...leaves(faObj.tokens), ...leaves(faObj.higherJustifications || []), ...leaves(tips), stress.name, stress.note,
    stress.basisNote, ...leaves(dossier)].join("\n"),
});
const RC = readerCopy();
for (const [where, text] of Object.entries(RC)) {
  assert(`F-3 no guarantee wording (${where}, text and reader-facing attributes)`, guaranteeHits(text).length === 0, JSON.stringify(guaranteeHits(text)));
  assert(`F-3 the retired name is gone (${where})`, !/public-data floor/i.test(text));
  assert(`F-3 no sentence that names the reading calls it a floor (${where})`, floorOfReading(text).length === 0, JSON.stringify(floorOfReading(text)));
  assert(`F-3 every "guaranteed minimum" is the ruled negation "not a guaranteed minimum" (${where})`,
    affirmedGuarantee(text).length === 0, JSON.stringify(affirmedGuarantee(text)));
}
{
  const P = RC["the page"], ENG = RC["the engine copy"];
  assert("F-3 (scope) the collection reaches the emitted justification entries, the attributes and the tooltip",
    (fa.tokens.higherJustificationEntries || []).length >= 5 && fa.tokens.higherJustificationEntries.every(e => ENG.includes(e))
    && P.includes("Explanation: Public-data scenario") && ENG.includes(E.TIPS["final-answer"].b));
  assert("F-3 (positive) block B's sixteen new sentences pass both rules",
    floorOfReading(BLOCK_B_NEW.join(" ")).length === 0 && affirmedGuarantee(BLOCK_B_NEW.join(" ")).length === 0);
  /* the static page carries three of them; the Huatai and analyst-floor wording is rendered from the engine's
     justification entries, so those two are looked for in the engine copy the page renders */
  const KEPT_ON_PAGE = ["50% utilization floor", "decode floor", "rental floor"], KEPT_IN_ENGINE = ["the floor's numeric neighborhood", "above-80 floor"];
  assert("F-3 (positive) the unrelated floors block B keeps are still there, and pass",
    KEPT_ON_PAGE.every(q => P.includes(q)) && KEPT_IN_ENGINE.every(q => ENG.includes(q)),
    JSON.stringify(KEPT_ON_PAGE.filter(q => !P.includes(q)).concat(KEPT_IN_ENGINE.filter(q => !ENG.includes(q)))));
  assert("F-3 (positive) a licensed other quantity alone does not name the reading: \"accelerators are only 58% of per-prompt energy, a floor on nothing.\"",
    floorOfReading("The energy note says accelerators are only 58% of per-prompt energy, a floor on nothing.").length === 0);
  const pad = "\n" + "x ".repeat(80) + ".\n";
  const caught = (text, n = 1) => floorOfReading(P + pad + text).length === floorOfReading(P).length + n;
  assert("NEG (Pro r1) \"The public-data scenario is a floor: about 58%.\" is caught", caught("The public-data scenario is a floor: about 58%."));
  assert("NEG (Pro r1) a floor asserted through a place-10 phrase is caught: \"…which that scenario allows, as a floor.\"",
    caught("It sits above the ≈58 public-data reading, which that scenario allows, as a floor."));
  assert("NEG (Pro r2) across a semicolon: \"The public-data scenario reads about 58%; it is a floor.\"", caught("The public-data scenario reads about 58%; it is a floor."));
  assert("NEG (Pro r2) into the next sentence: \"The public-data scenario reads about 58%. It is a floor.\"", caught("The public-data scenario reads about 58%. It is a floor."));
  assert("NEG (Pro r2) past a licensed number in the same sentence: \"Under public-data assumptions, about 58% is a floor and accelerators are only 58% of per-prompt energy.\"",
    caught("Under public-data assumptions, about 58% is a floor and accelerators are only 58% of per-prompt energy."));
  assert("NEG ...and a following sentence that does NOT refer back is not dragged in: \"…58%. Rental prices have a floor.\"",
    caught("The public-data scenario reads about 58%. Rental prices have a floor.", 0));
  const unnegated = P.replace("not a guaranteed minimum for actual margins, and not an estimate of them.", "a guaranteed minimum for actual margins, and not an estimate of them.");
  assert("NEG the Huatai licence is occurrence-exact: a second floor in that same sentence is caught",
    floorOfReading("· Why the public-data scenario differs: the floor's numeric neighborhood is reachable; it is a floor.").length === 1
    && floorOfReading("· Why the public-data scenario differs: the floor's numeric neighborhood is reachable.").length === 0);
  assert("NEG (Pro r1) place 1 with its \"not \" deleted is caught",
    unnegated !== P && affirmedGuarantee(unnegated).length === 1, String(affirmedGuarantee(unnegated).length));
  /* Pro r2 reach: each mutation touches ONE surface only, is shown to reach the collection, and is rejected. */
  const CLAIM = "The public-data scenario is a guaranteed minimum.";
  const faMut = { ...fa, tokens: { ...fa.tokens, higherJustificationEntries: [...fa.tokens.higherJustificationEntries.slice(0, -1),
    fa.tokens.higherJustificationEntries.at(-1) + " " + CLAIM] } };
  const engMut = readerCopy({ faObj: faMut })["the engine copy"];
  assert("NEG (Pro r2) a guarantee placed ONLY in an emitted justification entry reaches the collection and is caught",
    engMut.includes(CLAIM) && affirmedGuarantee(engMut).length === 1);
  const firstOtherLabel = INDEX.indexOf('aria-label="', INDEX.indexOf("</section>", INDEX.indexOf('id="final-answer"')));
  const labelEnd = INDEX.indexOf('"', firstOtherLabel + 12);
  const idxMut = INDEX.slice(0, firstOtherLabel + 12) + CLAIM + INDEX.slice(labelEnd);
  const pageMut = readerCopy({ index: idxMut })["the page"];
  assert("NEG (Pro r2) a guarantee placed ONLY in a non-tile aria-label reaches the collection and is caught",
    firstOtherLabel > 0 && pageMut.includes(CLAIM) && !plain(idxMut).includes(CLAIM) && affirmedGuarantee(pageMut).length === 1);
  assert("NEG an affirmed guarantee in engine copy is caught",
    affirmedGuarantee(fa.tokens.planningPoint.replace("not a guaranteed minimum", "a guaranteed minimum")).length === 1);
}
const glEntry = GLOSSARY.match(/<dt id="public-data-scenario">[\s\S]*?<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
assert("F-3 the glossary defines \"public-data scenario\" as a model result, not a guaranteed minimum, not an estimate",
  !!glEntry && /model result under those assumptions, not a guaranteed minimum for real inference margins/.test(plain(glEntry[1]))
  && /not an estimate/.test(glEntry[1]) && !GUARANTEE.test(plain(glEntry[1])),
  glEntry ? plain(glEntry[1]).slice(0, 300) : "no #public-data-scenario entry");
assert("F-3 no page links to a retired anchor (#planning-baseline, #public-data-floor), and the page links the new entry",
  !/#planning-baseline/.test(INDEX) && !/#planning-baseline/.test(GLOSSARY)
  && !/#public-data-floor/.test(INDEX) && !/#public-data-floor/.test(GLOSSARY)
  && /glossary\.html#public-data-scenario/.test(INDEX));

/* F-4 — the stress control, the preset, and the notes */
const stress = E.PERSPECTIVES.find(p => p.id === "stress-public-rate");
assert("F-4 the stress preset is named the public-data scenario", /Public-data scenario/.test(stress.name) && !/floor/i.test(stress.name), stress.name);
assert("F-4 the stress preset's note frames it as a model result, not a guaranteed minimum, not an estimate",
  /model result/.test(stress.note) && /not a guaranteed minimum/.test(stress.note) && /NOT AN ESTIMATE/.test(stress.note)
  && !GUARANTEE.test(stress.note), stress.note.slice(0, 200));
assert("F-4 the calculator's scenario switch labels it \"Public-data scenario\"",
  /"stress-public-rate": "Public-data scenario"/.test(APP) && !/Planning baseline \(conservative\)/.test(APP));
assert("F-4 the stress-test line under the estimates names the scenario and says not a guaranteed minimum or an estimate",
  /<span class="est-stress-value">~58%<\/span> <span class="est-stress-note">[^<]*public-data scenario[^<]*not a guaranteed minimum or an estimate/.test(INDEX));
/* Dated ENGINE HISTORY ("since 2026-09-10 …"), not a source's own date: a source date identifies evidence and stays. */
const DATED = /\b(?:since|after|before|until)\s+(?:the\s+)?20\d\d-\d\d-\d\d\b/i;
for (const id of ["stress-public-rate", "gptpro-ctx"]) {
  const p = E.PERSPECTIVES.find(x => x.id === id);
  assert(`F-4 the ${id} preset's note and basis carry no dated engine-history clause`,
    !DATED.test(p.note || "") && !DATED.test(p.basisNote || ""), ((p.note || "") + " " + (p.basisNote || "")).match(new RegExp("[^.]*" + DATED.source + "[^.]*", "g")));
}

/* NEG — each check can fail */
assert("NEG a tile still named \"Public-data floor\" (the superseded name) fails F-1",
  !tileOk(INDEX.replace(/aria-label="Public-data scenario">/, 'aria-label="Public-data floor">')));
assert("NEG the superseded 2026-09-26 token fails the caption check",
  !captionOk("≈58% — public-data floor, policy-labeled scenario: a bare minimum from public data known to be wrong; real margins cannot be lower. Not an estimate."));
assert("NEG a caption with the ≈58% duplicated away (body without its number) fails the exact-body check",
  !captionOk("≈58% — public-data scenario, policy-labeled: using the public-data assumptions shown. This is a model result, not a guaranteed minimum for actual margins."));
assert("NEG a caption that adds a guarantee fails", !captionOk(fa.tokens.planningPoint + " Real margins cannot be lower."));
assert("NEG the superseded tooltip wording is caught by GUARANTEE",
  GUARANTEE.test("This page's reading from public data known to be wrong, at low/committed planning rates: a bare minimum real inference margins cannot be under"));
assert("NEG the ruled negation is NOT caught by GUARANTEE: \"not a guaranteed minimum for actual margins\"",
  !GUARANTEE.test("a model result under public-data assumptions, not a guaranteed minimum for actual margins"));
assert("NEG an unframed report mention is caught",
  unframed(INDEX + "<p>" + "x ".repeat(200) + "the modeled serving margin is About 58% at effective price.</p>").length === unframed(INDEX).length + 1);
{
  const pad = "<p>" + "x ".repeat(200) + "</p>";
  const base = unframed(INDEX).length;
  assert("NEG a guarantee beside the scenario is caught: \"The public-data scenario is a bare minimum: about 58%\"",
    unframed(INDEX + pad + "<p>The public-data scenario is a bare minimum: about 58%.</p>").length === base + 1);
  assert("NEG the superseded name beside a mention is caught: \"The public-data floor reads about 58%\"",
    unframed(INDEX + pad + "<p>The public-data floor reads about 58%.</p>").length === base + 1);
  assert("NEG an AFFIRMATIVE estimate beside the scenario is caught: \"The public-data scenario is the best estimate: about 58%\"",
    unframed(INDEX + pad + "<p>The public-data scenario is the best estimate: about 58%.</p>").length === base + 1);
  assert("NEG an unframed decimal form is caught: \"58.41%\"",
    unframed(INDEX + pad + "<p>The modeled margin is 58.41% on these settings.</p>").length === base + 1);
  assert("NEG the unframed list-price twin is caught: \"about 63%\"",
    unframed(INDEX + pad + "<p>At list price the reading is about 63%.</p>").length === base + 1);
  assert("NEG a bare \"58%\" with no framing is caught", unframed(INDEX + pad + "<p>The page's reading is 58% here.</p>").length === base + 1);
  assert("NEG \"The public-data scenario is a baseline: about 58%\" is caught", unframed(INDEX + pad + "<p>The public-data scenario is a baseline: about 58%.</p>").length === base + 1);
  assert("NEG an unframed \"58%\" beside an occurrence-exact licensed span is still caught",
    unframed(INDEX + pad + "<p>The page's estimate: 58%. Low- and high-margin scenarios: 58%–92%.</p>").length === base + 1);
  assert("NEG ...and the ruled negation is NOT caught: \"the public-data scenario, not a guaranteed minimum or an estimate: about 58%\"",
    unframed(INDEX + pad + "<p>The public-data scenario, not a guaranteed minimum or an estimate: about 58%.</p>").length === base);
  assert("NEG a guarantee sentence planted on the page is caught page-wide",
    guaranteeHits(plain(INDEX + "<p>Real margins cannot be lower than this.</p>")).length === guaranteeHits(plain(INDEX)).length + 1);
}
assert("NEG the scenario tile placed above the hero fails F-2",
  !heroFirst(INDEX.replace('id="out-margin"', 'id="tmp-hero"') + '<div id="out-margin"></div>'));

console.log(`\n${failures === 0 ? "ALL SCENARIO-FRAMING CHECKS PASS" : failures + " SCENARIO-FRAMING FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
