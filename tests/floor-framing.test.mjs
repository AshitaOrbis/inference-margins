/* THE ≈58% IS A FLOOR, NOT AN ESTIMATE — and the page still opens on ≈82%.
   Owner ruling d-20260926-margins-open-on-82-the-58-is-a-floor-from-public-data-not-an-estimate
   (answer on card q-margins-opening-number-2026-09-25, 2026-09-26T18:52:53Z), verbatim: "B: Keep
   opening on the GPT-5.6 Pro scenario (≈82%), as you ruled — I've said this many times 58% is based
   on public data which we know is wrong, it's a bare minimum which it cannot be under. Nothing like
   a best estimate of real inference margins". Enacted by leg im-legibility-astra-pass-and-remint-0926
   (bq-3520, continuing bq-1141).

   It SUPERSEDES, for this one reading, the 2026-09-08 vocabulary canon's "an assumed baseline is not
   a demonstrated lower bound" (style/VOCABULARY.md carries the dated amendment). The old name
   "planning baseline" is retired on every own-voice surface by tests/vocabulary-consistency.test.mjs;
   this file checks the rest of the ruling:
     F-1  the tile is NAMED a floor and CAPTIONED as the owner framed it (public data known to be
          wrong; a bare minimum real margins cannot be under; not an estimate);
     F-2  the page still OPENS on the GPT-5.6 Pro scenario, ≈82%, and that tile comes first;
     F-3  every other mention of the ≈58% reading on the page and in the report copy carries the same
          framing (the word "floor" in reach of the number), and the glossary defines it that way;
     F-4  the stress control and the calculator's preset carry the name, and the preset notes carry
          no dated engine-history sentences (bq-1141 residual (c), the standing no-version-narration rule);
     NEG  negative controls: each check is shown to fail on a mutated input.
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

/* F-1 — the name and the caption */
const tileRe = /<section class="final-answer" id="final-answer" aria-label="([^"]*)">\s*<div class="tile tile-final-answer">\s*<div class="tile-label">([^<]*)</;
const tileOk = (html) => { const m = html.match(tileRe); return !!m && m[1] === "Public-data floor" && m[2].trim() === "Public-data floor"; };
assert("F-1 the ≈58% tile is named \"Public-data floor\" (label and aria-label)", tileOk(INDEX),
  JSON.stringify((INDEX.match(tileRe) || []).slice(1)));
/* Review r1 finding 10: the crop unit also NAMES the floor, so it survives being quoted alone. */
const CAPTION = [/public-data floor/, /bare minimum/, /public data known to be wrong/, /real margins cannot be lower/, /not an estimate/i];
const captionOk = (tok) => /^≈58% — /.test(tok) && CAPTION.every(re => re.test(tok))
  && !/planning baseline|best estimate|likely actual economics/i.test(tok);
assert("F-1 the tile's caption (the value token's status half) says floor-from-public-data, bare minimum, not an estimate",
  captionOk(fa.tokens.planningPoint), fa.tokens.planningPoint);
assert("F-1 the full-reading token names the floor and says it is not an estimate",
  /public-data floor/.test(fa.tokens.referenceReadingLine) && /not an estimate/.test(fa.tokens.referenceReadingLine),
  fa.tokens.referenceReadingLine);
assert("F-1 the tile's read-in-full control names the floor",
  /data-fa-explain="answer">Read the public-data floor in full<\/button>/.test(INDEX));

/* F-2 — the page still opens on ≈82%, first */
assert("F-2 the built-in opening scenario is the GPT-5.6 Pro estimate's settings (gptpro-r3)",
  E.LANDING_DEFAULT_PERSP_ID === "gptpro-r3", E.LANDING_DEFAULT_PERSP_ID);
assert("F-2 the opening reading is ≈82%",
  Math.round(fa.landingReading.marginPct) === 82, String(fa.landingReading.marginPct));
const heroFirst = (html) => { const h = html.indexOf('id="out-margin"'), f = html.indexOf('id="final-answer"'); return h > 0 && f > 0 && h < f; };
assert("F-2 the ≈82% hero tile comes before the ≈58% floor tile", heroFirst(INDEX));

/* F-3 — every other mention of the ≈58% reading carries the same framing.
   WIDENED after review r1 (finding 12): the list-price twin (≈63%) and decimal forms (58.41%) count too, the scan also
   covers the engine's emitted reader copy for this reading, and a sentence that calls it an estimate AFFIRMATIVELY fails
   even with "floor" nearby ("not an estimate" / "nothing like a best estimate" are the negations that pass). */
/* Review r2 (finding 12, residual): bare "58%" / "63%" forms count too. */
const MENTION = /(?:about|~|≈)\s?(?:58|63)(?:\.\d+)?\s?(?:%|–|-)|\b(?:58|63)(?:\.\d+)?\s?%/gi;
/* The ≈58%/≈63% on the page that are DIFFERENT quantities, licensed by their exact local words. */
const OTHER_QUANTITY = ["accelerators ≈58% of per-prompt energy", "~63% at full-cycle owned cost", "full-cycle TCO at ~63%",
  "Grok 4.5 serving margin ~63% full-cycle-TCO",   // the xAI card's owned-cost lens
  "Its own stated reading: 58.8%",                 // a §10 Astra Pro estimate card: another model's own stated figure
  "accelerators are only 58% of per-prompt energy", // the energy share again, in the methods box's words
  "reads about 91%, 63% or 19%"];                  // the glossary's xAI cost-basis example (cash / owned / customer rent)
/* Review r2: "is a baseline" / "is an estimate" affirmed of the reading fail too; "is not an estimate" does not match. */
const AFFIRMED_ESTIMATE = /\b(?:best|central|likely|verified|our) estimate\b|\bis (?:a|an|the|this page's) (?:answer|estimate|baseline)\b/gi;
const affirmsEstimate = (win) => [...win.matchAll(AFFIRMED_ESTIMATE)]
  .some(m => !/\b(?:not|nothing like|never|no)\b[^.;]{0,12}$/i.test(win.slice(Math.max(0, m.index - 25), m.index)));
const unframed = (html) => {
  const t = plain(html), out = [];
  for (const m of t.matchAll(MENTION)) {
    const local = t.slice(Math.max(0, m.index - 30), m.index + 45);
    if (OTHER_QUANTITY.some(q => local.includes(q))) continue;
    const win = t.slice(Math.max(0, m.index - 260), m.index + 160);
    /* "floor" or the owner's own "bare minimum" in reach of the number; never the retired name beside it, never an
       affirmative estimate. */
    if (!/floor|bare minimum/i.test(win) || /planning baseline/i.test(win) || affirmsEstimate(win))
      out.push(t.slice(Math.max(0, m.index - 80), m.index + 40));
  }
  return out;
};
const stressP = E.PERSPECTIVES.find(p => p.id === "stress-public-rate");
const EMITTED = [fa.tokens.planningPoint, fa.tokens.planningPointLine, fa.tokens.referenceReadingLine,
  fa.tokens.higherJustificationsHeader, fa.tokens.basisDeclarationLine, E.TIPS["final-answer"].b, stressP.note, stressP.basisNote]
  .map(x => "<p>" + x + "</p>").join("\n");
{
  const u = unframed(INDEX);
  assert("F-3 every ≈58% mention on the page and in the report copy is framed as the floor", u.length === 0, JSON.stringify(u));
  const n = [...plain(INDEX).matchAll(MENTION)].length;
  assert("F-3 (scope) the scan actually meets the report's mentions, not just the tile", n >= 12, String(n));
}
{
  const u = unframed(EMITTED);
  assert("F-3 every ≈58% the engine emits for this reading (value token, full-reading tokens, tip, stress preset) is framed as the floor",
    u.length === 0, JSON.stringify(u));
}
{
  const u = unframed(GLOSSARY);
  assert("F-3 every ≈58% mention in the glossary is framed as the floor", u.length === 0, JSON.stringify(u));
}
const glEntry = GLOSSARY.match(/<dt id="public-data-floor">[\s\S]*?<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
assert("F-3 the glossary defines \"public-data floor\" as a bare minimum from public data, not an estimate",
  !!glEntry && /bare minimum/.test(glEntry[1]) && /not an estimate/.test(glEntry[1]) && /public data/.test(glEntry[1]),
  glEntry ? plain(glEntry[1]).slice(0, 300) : "no #public-data-floor entry");
assert("F-3 no page links to the retired #planning-baseline anchor",
  !/#planning-baseline/.test(INDEX) && !/#planning-baseline/.test(GLOSSARY) && /glossary\.html#public-data-floor/.test(INDEX));

/* F-4 — the stress control, the preset, and the notes */
const stress = E.PERSPECTIVES.find(p => p.id === "stress-public-rate");
assert("F-4 the stress preset is named the public-data floor", /Public-data floor/.test(stress.name), stress.name);
assert("F-4 the stress preset's note frames it as a bare minimum, not an estimate",
  /bare minimum/.test(stress.note) && /not an estimate/.test(stress.note), stress.note.slice(0, 200));
assert("F-4 the calculator's scenario switch labels it \"Public-data floor\"",
  /"stress-public-rate": "Public-data floor"/.test(APP) && !/Planning baseline \(conservative\)/.test(APP));
assert("F-4 the stress-test line under the estimates names the floor and says not an estimate",
  /<span class="est-stress-value">~58%<\/span> <span class="est-stress-note">[^<]*public-data floor[^<]*not an estimate/.test(INDEX));
/* Dated ENGINE HISTORY ("since 2026-09-10 …", "after the 2026-09-10 … adoption"), not a source's own date: a
   source date identifies evidence and stays (Astra A3 finding 13 draws the same line). */
const DATED = /\b(?:since|after|before|until)\s+(?:the\s+)?20\d\d-\d\d-\d\d\b/i;
for (const id of ["stress-public-rate", "gptpro-ctx"]) {
  const p = E.PERSPECTIVES.find(x => x.id === id);
  assert(`F-4 the ${id} preset's note and basis carry no dated engine-history clause`,
    !DATED.test(p.note || "") && !DATED.test(p.basisNote || ""), ((p.note || "") + " " + (p.basisNote || "")).match(new RegExp("[^.]*" + DATED.source + "[^.]*", "g")));
}

/* NEG — each check can fail */
assert("NEG a tile still named \"Planning baseline\" fails F-1",
  !tileOk(INDEX.replace(/aria-label="Public-data floor">/, 'aria-label="Planning baseline">')) || !tileRe.test(INDEX));
assert("NEG the old token fails the caption check", !captionOk("≈58% — planning baseline, policy-labeled scenario"));
assert("NEG a caption that calls it an estimate fails", !captionOk(fa.tokens.planningPoint + " — the best estimate"));
assert("NEG an unframed report mention is caught",
  unframed(INDEX + "<p>" + "x ".repeat(200) + "the modeled serving margin is About 58% at effective price.</p>").length === unframed(INDEX).length + 1);
{
  const pad = "<p>" + "x ".repeat(200) + "</p>";
  const base = unframed(INDEX).length;
  assert("NEG (review r1) an AFFIRMATIVE estimate beside the floor is caught: \"The public-data floor is the best estimate: about 58%\"",
    unframed(INDEX + pad + "<p>The public-data floor is the best estimate: about 58%.</p>").length === base + 1);
  assert("NEG (review r1) an unframed decimal form is caught: \"58.41%\"",
    unframed(INDEX + pad + "<p>The modeled margin is 58.41% on these settings.</p>").length === base + 1);
  assert("NEG (review r1) the unframed list-price twin is caught: \"about 63%\"",
    unframed(INDEX + pad + "<p>At list price the reading is about 63%.</p>").length === base + 1);
  assert("NEG (review r2) a bare \"58%\" with no framing is caught", unframed(INDEX + pad + "<p>The page's reading is 58% here.</p>").length === base + 1);
  assert("NEG (review r2) a bare \"63%\" with no framing is caught", unframed(INDEX + pad + "<p>At list price it reads 63% here.</p>").length === base + 1);
  assert("NEG (review r2) \"The public-data floor is a baseline: about 58%\" is caught", unframed(INDEX + pad + "<p>The public-data floor is a baseline: about 58%.</p>").length === base + 1);
  assert("NEG (review r2) \"The public-data floor is an estimate: about 58%\" is caught", unframed(INDEX + pad + "<p>The public-data floor is an estimate: about 58%.</p>").length === base + 1);
  assert("NEG ...and the negated form is NOT caught: \"floor, nothing like a best estimate: about 58%\"",
    unframed(INDEX + pad + "<p>The public-data floor, nothing like a best estimate: about 58%.</p>").length === base);
}
assert("NEG the floor tile placed above the hero fails F-2",
  !heroFirst(INDEX.replace('id="out-margin"', 'id="tmp-hero"') + '<div id="out-margin"></div>'));

console.log(`\n${failures === 0 ? "ALL FLOOR-FRAMING CHECKS PASS" : failures + " FLOOR-FRAMING FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
