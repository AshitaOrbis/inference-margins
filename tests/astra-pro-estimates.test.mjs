// astra-pro-estimates.test.mjs — the §10 "Astra Pro estimates" category (bq-3351).
//
// What must stay true, and why:
//   R1  every card face in site/index.html is the builder's output for the registry on THIS engine
//       (scripts/build-astra-pro-estimates.mjs --check) — so an engine change that moves a replay
//       cannot leave a stale number on a card: the headline is regenerated, never typed;
//   R2  every face number equals astraProReplay() of its recorded operating point, read back from
//       the page itself (independent of the builder's own writer);
//   R3  every recorded operating point is accepted by the engine whole (no rejected override), at
//       list basis (batchShare 0, discount 0), traffic in custom mode, a rent for every fleet leg;
//   R4  every card links to its own review page, the page exists, names its dive id, and the
//       stored answer hashes to the registry's answer_sha256;
//   R5  the "Reproduce this card" permalink decodes to the central operating point and its
//       displayed margin equals the replay;
//   R6  the dropped "Same-assumption scenario outputs" section stays dropped (no #s10-normalized,
//       no normalized-table, no renderNormalized) and the changelog carries the anchor note;
//   R7  nothing orders the category by value: the registry order is the page order, the chart
//       draws in registry order, and no card face or heading uses rank vocabulary.
//   SECTION10  each §10 provider section opens with a generated hub (2026-10-06): the current
//       model's estimate from this category, the inputs the two estimates set differently, and a
//       label for the July dossier below. Every hub number is canonicalReplay() of its record —
//       the same function the chart reads — and the checks are functions so the negative fixtures
//       at the end of the block can feed them mutated inputs and require the NAMED rule to fire.
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const E = require(join(ROOT, "site", "engine.js"));
const A = require(join(ROOT, "site", "astra-pro-estimates.js"));
const html = readFileSync(join(ROOT, "site", "index.html"), "utf8");
const app = readFileSync(join(ROOT, "site", "app.js"), "utf8");
let failures = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.error("FAIL " + msg); } };

const recs = A.ASTRA_PRO_REGISTRY.estimates;
ok(Array.isArray(recs) && recs.length > 0, "R0 the registry carries at least one estimate");

// R1
try { execFileSync("node", [join(ROOT, "scripts", "build-astra-pro-estimates.mjs"), "--check"], { stdio: "pipe" }); ok(true, "R1"); }
catch (e) { ok(false, "R1 generated outputs are stale: " + String(e.stderr || e.message).trim()); }

// R2/R3/R4/R5 per record
const cardRe = key => new RegExp(`<details class="prov ape-card" id="ape-${key}" data-ape-key="${key}">([\\s\\S]*?)</details>`);
for (const rec of recs) {
  for (const k of A.ASTRA_PRO_SCENARIOS) {
    const ov = rec.scenarios[k].overrides;
    ok(ov.batchShare === 0 && ov.discount === 0, `R3 ${rec.key}/${k}: list basis (batchShare 0, discount 0)`);
    ok(rec.scenarios[k].traffic && rec.scenarios[k].traffic.mode === "custom", `R3 ${rec.key}/${k}: custom traffic`);
    const legs = Object.entries(ov.blend || {}).filter(([, w]) => w > 0);
    ok(legs.length > 0 && Math.abs(legs.reduce((s, [, w]) => s + w, 0) - 100) < 1e-9, `R3 ${rec.key}/${k}: blend sums to 100`);
    ok(legs.every(([h]) => ov.rentAbsLeg && ov.rentAbsLeg[h] > 0), `R3 ${rec.key}/${k}: a rent for every fleet leg`);
    let threw = null; try { A.astraProReplay(rec, k, E); } catch (e) { threw = e.message; }
    ok(!threw, `R3 ${rec.key}/${k}: the engine accepts the operating point whole (${threw})`);
  }
  const m = html.match(cardRe(rec.key));
  ok(!!m, `R2 ${rec.key}: card present`);
  if (!m) continue;
  const body = m[1];
  const r = A.astraProReadings(rec, E);
  const mid = body.match(/<span class="ape-mid">~(-?\d+)%<\/span>/);
  const span = body.match(/<span class="ape-span">(-?\d+)%–(-?\d+)%<\/span>/);
  ok(mid && Number(mid[1]) === Math.round(r.central), `R2 ${rec.key}: face ${mid && mid[1]} == replay ${r.central.toFixed(2)}`);
  ok(span && Number(span[1]) === Math.round(r.low_margin) && Number(span[2]) === Math.round(r.high_margin),
    `R2 ${rec.key}: span ${span && span.slice(1).join("–")} == replay ${r.low_margin.toFixed(2)}–${r.high_margin.toFixed(2)}`);
  ok(body.includes(rec.dive.id) && /GPT-6 Astra Pro/.test(body) && body.includes(rec.dive.date), `R4 ${rec.key}: card names GPT-6 Astra Pro, date and dive id`);
  const rev = body.match(/<a class="ape-review" href="([^"]+)"[^>]*>/);
  ok(rev && rev[1] === rec.review_page, `R4 ${rec.key}: card links its own review page`);
  const page = join(ROOT, "site", rec.review_page);
  ok(existsSync(page) && readFileSync(page, "utf8").includes(rec.dive.id), `R4 ${rec.key}: review page exists and names ${rec.dive.id}`);
  const ans = join(ROOT, "research", "astra-pro-estimates", "answers", rec.key + ".md");
  ok(existsSync(ans) && createHash("sha256").update(readFileSync(ans, "utf8")).digest("hex") === rec.dive.answer_sha256, `R4 ${rec.key}: stored answer matches its sha256`);
  // Each digest identifies a different byte sequence; none describes the HTML wrapper.
  const generated = readFileSync(join(ROOT, "research", "astra-pro-estimates", rec.key + "-astra-pro.md"), "utf8");
  const presented = generated.split("## The answer, verbatim\n\n")[1]?.slice(0, -1);
  const publishedDigest = createHash("sha256").update(presented || "").digest("hex");
  ok(generated.includes(`as-received answer SHA-256 \`${rec.dive.answer_sha256}\``), `R4 ${rec.key}: as-received stamp identifies stored answer`);
  ok(generated.includes(`published text SHA-256 \`${publishedDigest}\``), `R4 ${rec.key}: published stamp hashes the presented answer`);
  ok(readFileSync(page, "utf8").includes(`published text SHA-256 <code>${publishedDigest}</code>`), `R4 ${rec.key}: rendered page preserves published digest`);
  const rep = body.match(/<a class="ape-reproduce" href="\?s=([^"]+)"[^>]*>/);
  ok(!!rep, `R5 ${rec.key}: reproduce link present`);
  if (rep) {
    const d = E.decodeScenario(decodeURIComponent(rep[1]));
    ok(d && d._meta && d._meta.model === rec.carrier && d._meta.persp === "median", `R5 ${rec.key}: permalink resolves to ${rec.carrier} / median`);
    ok(d && d._meta && Math.abs(d._meta.displayedMargin - r.central) < 0.01, `R5 ${rec.key}: permalink margin ${d && d._meta && d._meta.displayedMargin} == replay ${r.central.toFixed(3)}`);
  }
}

// R3b (review r2 N6): the connector's traffic bounds and key placement are refused by the replay too
{
  const base = recs[0];
  const bad = (mut, label) => { const r = JSON.parse(JSON.stringify(base)); mut(r.scenarios.central);
    let threw = false; try { A.astraProReplay(r, "central", E); } catch { threw = true; }
    ok(threw, "R3b the replay refuses " + label); };
  bad(s => { s.traffic.cache_hit = 99; }, "cache_hit above the connector's bound");
  bad(s => { s.traffic.io_ratio = 0.5; }, "io_ratio below the connector's bound");
  bad(s => { s.overrides.ioRatio = 12; }, "ioRatio inside overrides");
}

// R6
ok(!/id="s10-normalized"/.test(html) && !/id="normalized-table"/.test(html) && !html.includes("Same-assumption scenario outputs"), "R6 the normalized section is gone from index.html");
ok(!/function renderNormalized\b|renderNormalized\(\);/.test(app), "R6 the normalized-table builder is gone from app.js");
const changelog = readFileSync(join(ROOT, "site", "research", "changelog.html"), "utf8");
ok(changelog.includes("s10-normalized"), "R6 the changelog carries the #s10-normalized anchor note");
ok(/<h4 id="s10-astra-pro">Astra Pro estimates<\/h4>/.test(html), "R6 the category heading is present");

// R7
const order = [...html.matchAll(/data-ape-key="([^"]+)"/g)].map(x => x[1]);
ok(JSON.stringify(order) === JSON.stringify(recs.map(r => r.key)), "R7 page order == registry order");
const section = html.slice(html.indexOf('<h4 id="s10-astra-pro">'), html.indexOf("<!-- END astra-pro-cards -->"));
ok(!/\b(rank(ed|ing)?|leaderboard|top-ranked|#1|best margin|highest margin)\b/i.test(section.replace(/not a ranking|not ranked|they are not a ranking/gi, "")), "R7 no rank vocabulary in the category");
/* review r1 F2: the readings render only on the review pages, so they are scanned here too — a
   superlative across the category ("the lowest reading", "on this list") ranks as surely as a sort */
const RANK_WORDS = /\b(rank(ed|ing)?|leaderboard|lowest|highest|cheapest|priciest|largest|smallest|widest|narrowest|best|worst)\b|\b(on|for|in) (this|the) list\b|\bof the (models|cards) here\b/i;
for (const rec of recs) ok(!RANK_WORDS.test(String(rec.reading || "").replace(/not a ranking|not ranked/gi, "")),
  `R7 ${rec.key}: the reading uses no rank vocabulary (${(String(rec.reading || "").match(RANK_WORDS) || [])[0]})`);
const chartFn = app.slice(app.indexOf("function renderAstraProChart"), app.indexOf("/* ---------- margin-range evidence board"));
ok(chartFn.length > 0 && !/\.sort\(/.test(chartFn), "R7 the chart draws in registry order (no sort)");

// SECTION10 — the §10 provider hubs
{
  const P10 = A.SECTION10_PROVIDERS || {};
  const ready = !!A.SECTION10_PROVIDERS && typeof A.canonicalReplay === "function" && typeof A.assumptionDiffs === "function";
  ok(ready, "SECTION10 astra-pro-estimates.js exports SECTION10_PROVIDERS, canonicalReplay and assumptionDiffs");
  const escH = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const count = (s, sub) => s.split(sub).length - 1;
  const BEGIN10 = key => `<!-- BEGIN s10-hub:${key} (generated by scripts/build-astra-pro-estimates.mjs — do not edit by hand) -->`;
  const END10 = key => `<!-- END s10-hub:${key} -->`;
  const attr = (tag, name) => { const m = tag && tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };
  const deepFrozen = v => v === null || typeof v !== "object" || (Object.isFrozen(v) && Object.values(v).every(deepFrozen));

  /* The page's own July cards are the membership the hubs must match: one hub per
     <details class="prov" id="prov-<key>"> card, in page order. */
  const pageProviderKeys = h => [...h.matchAll(/<details class="prov" id="prov-([a-z]+)">/g)].map(m => m[1]);

  /* One record's canonical replay against what the card face is built from (astraProReadings,
     the builder's path), compared before rounding. Returns named problems. */
  function checkRecordCanonical(rec, E) {
    const out = [];
    let c;
    try { c = A.canonicalReplay(rec, E); } catch (e) { out.push({ rule: /metric/.test(e.message) ? "metric" : "canonical", msg: e.message }); return out; }
    if (c.metric !== "blended") out.push({ rule: "metric", msg: `${rec.key}: canonical metric ${c.metric}` });
    if ((rec.metric ?? "blended") !== c.metric) out.push({ rule: "metric", msg: `${rec.key}: record declares ${rec.metric}, canonical replay is ${c.metric}` });
    const r = A.astraProReadings(rec, E);
    if (c.central !== r.central || c.low !== r.low_margin || c.high !== r.high_margin)
      out.push({ rule: "central", msg: `${rec.key}: canonical ${c.central}/${c.low}/${c.high} != face path ${r.central}/${r.low_margin}/${r.high_margin}` });
    for (const h of ["resolvedInputsHash", "registryHash", "engineHash"])
      if (!/^[0-9a-f]{8}$/.test(c[h] || "")) out.push({ rule: "hash", msg: `${rec.key}: ${h} ${c[h]} is not 8 hex digits` });
    return out;
  }

  /* One provider hub on a page, against the registry it is fed. Returns named problems. */
  function checkHub(h, key, recs, E) {
    const out = [], prov = P10[key];
    const bad = (rule, msg) => out.push({ rule, msg: `${key}: ${msg}` });
    if (!prov) { bad("membership", "no SECTION10_PROVIDERS entry"); return out; }
    const b = BEGIN10(key), e = END10(key);
    if (count(h, b) !== 1 || count(h, e) !== 1 || h.indexOf(e) < h.indexOf(b)) {
      bad("marker", `expected exactly one BEGIN/END pair in order, found ${count(h, b)} BEGIN and ${count(h, e)} END`);
      return out;
    }
    const body = h.slice(h.indexOf(b) + b.length, h.indexOf(e));
    if (!h.slice(h.indexOf(e) + e.length).trimStart().startsWith(`<details class="prov" id="prov-${key}">`))
      bad("placement", "the hub region is not immediately before its own July card");
    if (!body.includes(`<div class="s10-hub" data-s10-hub="${key}" id="s10-hub-${key}">`)) bad("structure", "hub container missing");
    if (!body.includes(`id="s10-dossier-${key}"`) || !body.includes("July 2026 dossier")) bad("dossier", "July dossier label missing");
    const jo = prov.julyOriginal;
    if (!body.includes(`${jo.central}% (${jo.band[0]}–${jo.band[1]}%)`) || !body.includes(escH(jo.model)))
      bad("dossier", `the dossier label does not carry the dive's original ${jo.central}% (${jo.band[0]}–${jo.band[1]}%) for ${jo.model}`);
    const cur = body.match(/<p class="s10-hub-current"[^>]*>/);
    if (!cur) { bad("structure", "current-estimate element missing"); return out; }
    const curTag = cur[0];
    if (prov.headlineSource === "none") {
      if (attr(curTag, "data-headline") !== "none") bad("headline-none", "no data-headline=\"none\"");
      if (attr(curTag, "data-estimate") !== null || attr(curTag, "data-central") !== null) bad("headline-none", "an unmatched hub carries an estimate");
      if (!body.includes(escH(prov.tierNote))) bad("headline-none", "the tier note is missing");
      /* No number from this provider's other-tier estimate(s): neither the engine's readings (whole
         or to one decimal) nor the run's own stated figures. Numbers inside words (s10, V4) are not
         numbers a reader reads, so only free-standing numerals are scanned. */
      const ints = new Set(), decs = new Set();
      for (const r of recs.filter(x => x.provider === prov.label)) {
        const vals = [r.stated.headline_pct, r.stated.low_pct, r.stated.high_pct];
        try { const c = A.canonicalReplay(r, E); vals.push(c.central, c.low, c.high); } catch { /* the stated figures still bind */ }
        for (const v of vals) { ints.add(Math.round(v)); decs.add(Number(Number(v).toFixed(1))); }
      }
      const hit = [...body.matchAll(/(?<![\w.])\d+(?:\.\d+)?/g)].map(m => m[0])
        .filter(t => (t.includes(".") ? decs.has(Number(t)) : ints.has(Number(t))));
      if (!ints.size) bad("headline-none", `no other-tier estimate found for ${prov.label} — the scan would be vacuous`);
      if (hit.length) bad("headline-none", `carries a number from the other-tier estimate: ${hit.join(", ")}`);
      return out;
    }
    const rec = recs.find(r => r.key === prov.estimateKey);
    if (!rec) { bad("membership", `estimate ${prov.estimateKey} is not in the registry`); return out; }
    if (attr(curTag, "data-estimate") !== rec.key) bad("estimate", `data-estimate ${attr(curTag, "data-estimate")} != ${rec.key}`);
    const recProblems = checkRecordCanonical(rec, E);
    for (const p of recProblems) out.push(p);
    if (recProblems.some(p => p.rule === "metric" || p.rule === "canonical")) return out;
    const c = A.canonicalReplay(rec, E);
    if (attr(curTag, "data-metric") !== c.metric) bad("metric", `data-metric ${attr(curTag, "data-metric")} != canonical ${c.metric}`);
    if (attr(curTag, "data-central") !== c.central.toFixed(4)) bad("central", `data-central ${attr(curTag, "data-central")} != canonicalReplay ${c.central.toFixed(4)}`);
    if (attr(curTag, "data-hash") !== c.resolvedInputsHash) bad("hash", `data-hash ${attr(curTag, "data-hash")} != resolvedInputsHash ${c.resolvedInputsHash}`);
    const mid = body.match(/<span class="s10-hub-mid">~(-?\d+)%<\/span>/);
    if (!mid || Number(mid[1]) !== Math.round(c.central)) bad("face", `printed ~${mid && mid[1]}% != round(${c.central.toFixed(2)})`);
    const span = body.match(/<span class="s10-hub-span">~(-?\d+)%–~(-?\d+)%<\/span>/);
    if (!span || Number(span[1]) !== Math.round(c.low) || Number(span[2]) !== Math.round(c.high))
      bad("face", `printed span ${span && span.slice(1).join("–")} != ${c.low.toFixed(2)}–${c.high.toFixed(2)}`);
    if (!body.includes(escH(rec.name)) || !body.includes(escH(rec.dive.date))) bad("face", "the hub does not name its model and run date");
    /* the assumption list is assumptionDiffs, item for item, in order */
    let want = [];
    try { want = A.assumptionDiffs(key, E).map(d => `${d.input}: July ${d.july} · now ${d.current}`).map(escH); } catch (err) { bad("diffs", "assumptionDiffs threw: " + err.message); }
    const ul = body.match(/<ul class="s10-hub-diffs">([\s\S]*?)<\/ul>/);
    const got = ul ? [...ul[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]) : [];
    if (JSON.stringify(got) !== JSON.stringify(want)) bad("diffs", `listed ${JSON.stringify(got)} != assumptionDiffs ${JSON.stringify(want)}`);
    if (!body.includes("These are the inputs the two estimates set differently; the two numbers are not a like-for-like comparison."))
      bad("diffs", "the non-comparability sentence is missing");
    /* Reproduce: the same link the estimate's own card carries, and it loads the canonical central */
    const rep = body.match(/<a class="ape-reproduce" href="\?s=([^"]+)"[^>]*>/);
    const cardRep = (h.match(cardRe(rec.key)) || [, ""])[1].match(/<a class="ape-reproduce" href="\?s=([^"]+)"[^>]*>/);
    if (!rep) bad("reproduce", "no Reproduce link");
    else {
      if (!cardRep || cardRep[1] !== rep[1]) bad("reproduce", "the hub's Reproduce link differs from its estimate card's");
      const d = E.decodeScenario(decodeURIComponent(rep[1]));
      if (!d || !d._meta || d._meta.model !== rec.carrier || d._meta.persp !== "median" || Math.abs(d._meta.displayedMargin - c.central) >= 0.01)
        bad("reproduce", `the link decodes to ${d && d._meta && d._meta.model}/${d && d._meta && d._meta.persp} at ${d && d._meta && d._meta.displayedMargin}, not ${rec.carrier}/median at ${c.central.toFixed(3)}`);
    }
    if (!body.includes(`href="#ape-${rec.key}"`)) bad("links", "no link to the estimate's card in Astra Pro estimates");
    if (!body.includes(`href="${escH(rec.review_page)}"`)) bad("links", "no link to the estimate's review page");
    return out;
  }

  /* The chart path: renderAstraProChart reads canonicalReplay, and no parallel replay path. */
  function checkChartPath(appText) {
    const fn = appText.slice(appText.indexOf("function renderAstraProChart"), appText.indexOf("/* ---------- margin-range evidence board"));
    const out = [];
    if (!fn.length) out.push({ rule: "chart-path", msg: "renderAstraProChart not found" });
    else {
      if (!/\bcanonicalReplay\(rec\)/.test(fn)) out.push({ rule: "chart-path", msg: "the chart does not call canonicalReplay(rec)" });
      if (/\bastraProReadings\(|\bastraProReplay\(/.test(fn)) out.push({ rule: "chart-path", msg: "the chart keeps a parallel replay path" });
      if (!/"data-central":\s*[\w.]+\.central\.toFixed\(4\)/.test(fn)) out.push({ rule: "chart-path", msg: "the chart's marks do not carry the canonical central as data-central" });
    }
    return out;
  }

  const noProblems = (label, problems) => ok(problems.length === 0, `${label}${problems.length ? ": " + problems.map(p => `[${p.rule}] ${p.msg}`).join("; ") : ""}`);

  // membership — from the registry and the page, never a fixed count
  ok(deepFrozen(A.SECTION10_PROVIDERS || {}) && !!A.SECTION10_PROVIDERS, "SECTION10 SECTION10_PROVIDERS is deep-frozen");
  ok(JSON.stringify(Object.keys(P10)) === JSON.stringify(pageProviderKeys(html)),
    `SECTION10 one provider entry per §10 July card, in page order (${Object.keys(P10).join(",")} vs ${pageProviderKeys(html).join(",")})`);
  for (const [key, prov] of Object.entries(P10)) {
    ok((prov.headlineSource === "astra_estimate") === (prov.estimateKey !== null) && ["astra_estimate", "none"].includes(prov.headlineSource),
      `SECTION10 ${key}: headlineSource ${prov.headlineSource} agrees with estimateKey ${prov.estimateKey}`);
    if (prov.estimateKey !== null) ok(recs.some(r => r.key === prov.estimateKey), `SECTION10 ${key}: estimateKey ${prov.estimateKey} exists in the registry`);
    const jm = E.MODELS.find(m => m.id === prov.julyModelId);
    ok(!!jm && !!jm.dive, `SECTION10 ${key}: julyModelId ${prov.julyModelId} is a model with a dive replay`);
    const jo = prov.julyOriginal || {};
    ok(jo.author === "GPT-5.6 Pro" && jo.date === "2026-07-09" && jo.source === `research/provider-dives/${key}-gptpro.md` && existsSync(join(ROOT, jo.source)),
      `SECTION10 ${key}: the July original names its author, date and an existing dive source`);
    ok(Array.isArray(jo.band) && jo.band.length === 2 && jo.band[0] <= jo.central && jo.central <= jo.band[1],
      `SECTION10 ${key}: the July original stores the dive's own central inside its own band`);
  }
  const matched = Object.values(P10).filter(p => p.headlineSource === "astra_estimate").length;
  const unmatched = Object.values(P10).filter(p => p.headlineSource === "none").length;
  ok(matched > 0 && matched + unmatched === Object.keys(P10).length && count(html, 'data-headline="none"') === unmatched && count(html, 'class="s10-hub-current" id="s10-current-') === matched + unmatched,
    `SECTION10 the page shows ${matched} matched headlines and ${unmatched} explicitly unmatched`);
  if (ready) {
    for (const rec of recs) noProblems(`SECTION10 ${rec.key}: canonicalReplay equals the card face's path, before rounding`, checkRecordCanonical(rec, E));
    for (const key of Object.keys(P10)) {
      noProblems(`SECTION10 hub ${key}: markers, placement, canonical face, data attributes, assumption list, Reproduce`, checkHub(html, key, recs, E));
      if (P10[key].headlineSource === "none") ok(A.assumptionDiffs(key, E).length === 0, `SECTION10 ${key}: no current estimate, so no assumption list`);
      else {
        const d = A.assumptionDiffs(key, E);
        ok(d.length > 0 && d.every(x => x.july !== x.current && typeof x.input === "string"), `SECTION10 ${key}: assumptionDiffs lists only inputs that differ (${d.length})`);
      }
    }
    for (const key of ["google", "zhipu"]) {
      const s = A.assumptionDiffs(key, E).find(x => x.input === "serving-stack efficiency");
      ok(!!s && s.july.endsWith("— no recorded source"), `SECTION10 ${key}: the July stack value is marked as having no recorded source`);
    }
    /* Moonshot's metric notice: both July numbers from the engine's kimi dive replay */
    const kimi = E.MODELS.find(m => m.id === "kimi");
    const ks = E.pinReferenceLevers(E.applyPresetSettings(kimi, E.PERSPECTIVES.find(p => p.id === "dive")));
    const kw = E.workload(ks);
    const outTok = Math.round((1 - kw.cOut / ks.priceOut) * 100), blended = Math.round(kw.margin * 100);
    const moon = html.slice(html.indexOf(BEGIN10("moonshot")), html.indexOf(END10("moonshot")));
    ok(moon.includes(`output-token margin for Kimi K2.7 Code (~${outTok}%)`) && moon.includes(`the same replay computes ~${blended}%`) && moon.includes("not a change in Moonshot's margin"),
      `SECTION10 moonshot: the transition notice carries the replay's output-token ~${outTok}% and blended ~${blended}%`);
    ok(html.includes('<details class="prov" id="prov-moonshot">') && /data-model="kimi" data-persp="dive">Reproduce this card ↑ \(output-token dive replay\)/.test(html),
      "SECTION10 moonshot: the July card keeps its own anchor and output-token Reproduce link");
    /* The historical-band sentence appears exactly where today's July replay — on the metric its card
       shows — falls outside the dive's own band, and nowhere else. Recomputed here from the engine,
       independently of julyReplay, which must agree. */
    {
      const HIST = "The dive's band is historical and is not an interval around either number.";
      const want = [], got = [], disagree = [];
      for (const [key, prov] of Object.entries(P10)) {
        const m = E.MODELS.find(x => x.id === prov.julyModelId);
        const s = E.pinReferenceLevers(E.applyPresetSettings(m, E.PERSPECTIVES.find(p => p.id === "dive")));
        const w = E.workload(s);
        const v = (prov.julyMetric === "output-token" ? 1 - w.cOut / s.priceOut : w.margin) * 100;
        const outside = v < prov.julyOriginal.band[0] || v > prov.julyOriginal.band[1];
        if (outside) want.push(key);
        const jr = A.julyReplay(key, E);
        if (jr.outsideBand !== outside || Math.abs(jr.value - v) > 1e-9) disagree.push(key);
        const region = html.slice(html.indexOf(BEGIN10(key)), html.indexOf(END10(key)));
        if (region.includes(HIST)) got.push(key);
      }
      ok(want.length > 0 && JSON.stringify(got) === JSON.stringify(want) && count(html, HIST) === want.length && disagree.length === 0,
        `SECTION10 the historical-band sentence appears exactly where the July replay is outside the dive's band (want ${want.join(",")}; page ${got.join(",")}; page count ${count(html, HIST)}; julyReplay disagrees on ${disagree.join(",") || "none"})`);
    }
    /* A July claim today's replay contradicts (DeepSeek: "one of the lower provider-native estimates").
       The July card keeps its words; the dossier label carries the engine's current reading and says
       the claim no longer holds — and this check also requires the claim to be contradicted, i.e. the
       replay sits in the upper half of the six July replays, so the sentence cannot outlive its truth. */
    {
      const faces = {};
      for (const [key, prov] of Object.entries(P10)) {
        const m = E.MODELS.find(x => x.id === prov.julyModelId);
        const s = E.pinReferenceLevers(E.applyPresetSettings(m, E.PERSPECTIVES.find(p => p.id === "dive")));
        const w = E.workload(s);
        faces[key] = (prov.julyMetric === "output-token" ? 1 - w.cOut / s.priceOut : w.margin) * 100;
      }
      const sorted = Object.values(faces).sort((a, b) => a - b), median = (sorted[2] + sorted[3]) / 2;
      const noted = Object.entries(P10).filter(([, p]) => p.julyTextNote);
      ok(noted.length > 0, "SECTION10 at least one provider carries a July-text note (the check below is not vacuous)");
      for (const [key, prov] of noted) {
        const region = html.slice(html.indexOf(BEGIN10(key)), html.indexOf(END10(key)));
        const sentence = `Since ${prov.julyTextNote.since} this replay reads ~${Math.round(faces[key])}%, so the July text below ${prov.julyTextNote.claim} no longer holds.`;
        const card = (html.match(new RegExp(`<details class="prov" id="prov-${key}">[\\s\\S]*?</details>`)) || [""])[0];
        ok(region.includes(sentence) && count(html, sentence) === 1 && faces[key] > median
          && (key !== "deepseek" || card.includes("one of the <em>lower</em> provider-native estimates")),
          `SECTION10 ${key}: the dossier label says the replay now reads ~${Math.round(faces[key])}% (engine) and the July claim no longer holds; the replay is above the July median (${median.toFixed(1)}) and the July card's own words are kept`);
      }
    }
    /* The §10 intro describes the hubs as they are: it names every provider whose section has no current
       estimate, and every provider whose July dossier keeps a different metric from its hub. */
    {
      const intro = (html.match(/<p>Each provider below[^\n]*<\/p>/) || [""])[0];
      const none = Object.values(P10).filter(p => p.headlineSource === "none").map(p => p.label);
      const metric = Object.values(P10).filter(p => p.headlineSource === "astra_estimate" && p.julyMetric !== "blended");
      ok(intro.length > 0 && none.every(l => intro.includes(`except ${l}`) && intro.includes(`no current estimate covers ${l}'s`))
        && metric.every(p => intro.includes(`${p.label}'s current estimate is a blended margin, while its July dossier below stays an ${p.julyMetric} margin`))
        && intro.includes("The paragraph above describes those July dossiers"),
        `SECTION10 the §10 intro names the provider(s) without a current estimate (${none.join(",")}) and the metric split (${metric.map(p => p.label).join(",")}), and says the paragraph above describes the July dossiers`);
    }
  }
  noProblems("SECTION10 app.js's chart path calls canonicalReplay", checkChartPath(app));

  /* review r1 P1: the connector's run_scenario must reproduce canonicalReplay for every record and
     scenario, unrounded. That suite needs the COMPILED connector, which `npm test` runs before (the
     gate and CI build mcp-server afterwards), so it lives in mcp-server/test where the package's
     own test script builds first. This guard fails if it is removed, renamed out of the package's
     test glob, or stops covering every scenario. */
  {
    const f = join(ROOT, "mcp-server", "test", "astra-pro-connector-parity.test.mjs");
    const src = existsSync(f) ? readFileSync(f, "utf8") : "";
    const mcpPkg = JSON.parse(readFileSync(join(ROOT, "mcp-server", "package.json"), "utf8"));
    ok(src.length > 0 && /node --test "test\/\*\.test\.mjs"/.test(mcpPkg.scripts.test || "")
      && /h\.call\("run_scenario"/.test(src) && /canonicalReplay\(/.test(src) && /for \(const k of A\.ASTRA_PRO_SCENARIOS\)/.test(src)
      && /for \(const rec of recs\)/.test(src) && /negative fixture/.test(src),
      "SECTION10 the connector parity suite (mcp-server/test/astra-pro-connector-parity.test.mjs) exists, runs in the package's built test glob, and covers every record and scenario");
  }

  // the generator is idempotent: on a temp copy with every hub region removed, run 1 rebuilds the
  // committed page byte for byte, and run 2 changes nothing
  {
    const tmp = mkdtempSync(join(tmpdir(), "s10-hub-idem-"));
    try {
      mkdirSync(join(tmp, "site"), { recursive: true }); mkdirSync(join(tmp, "scripts"), { recursive: true });
      for (const f of readdirSync(join(ROOT, "site"))) if (f.endsWith(".js")) cpSync(join(ROOT, "site", f), join(tmp, "site", f));
      cpSync(join(ROOT, "scripts", "build-astra-pro-estimates.mjs"), join(tmp, "scripts", "build-astra-pro-estimates.mjs"));
      cpSync(join(ROOT, "research", "astra-pro-estimates"), join(tmp, "research", "astra-pro-estimates"), { recursive: true });
      const stripped = html.replace(/ *<!-- BEGIN s10-hub:([a-z]+) [^\n]*-->\n[\s\S]*?<!-- END s10-hub:\1 -->\n/g, "");
      writeFileSync(join(tmp, "site", "index.html"), stripped);
      const run = () => execFileSync("node", [join(tmp, "scripts", "build-astra-pro-estimates.mjs")], { stdio: "pipe" }).toString();
      const outFiles = () => [join(tmp, "site", "index.html"), ...readdirSync(join(tmp, "research", "astra-pro-estimates")).filter(f => f.endsWith(".md") || f.endsWith(".json")).map(f => join(tmp, "research", "astra-pro-estimates", f))]
        .map(p => [p, readFileSync(p, "utf8")]);
      ok(stripped !== html, "SECTION10 idempotence fixture: the temp copy starts with no hub regions (non-vacuous)");
      run(); const first = outFiles();
      ok(first[0][1] === html, "SECTION10 the generator rebuilds the committed hub regions byte for byte from a page without them");
      const log2 = run(); const second = outFiles();
      ok(JSON.stringify(first) === JSON.stringify(second) && /0 output\(s\) written/.test(log2), "SECTION10 the generator is idempotent (a second run changes nothing)");
      /* review r1 P2 — negative fixture: a hub container left on the page after its marker pair was
         removed must make the generator REFUSE, never insert a second hub beside the stale one. */
      const firstKey = Object.keys(P10)[0];
      const orphaned = html.replace(`  ${BEGIN10(firstKey)}\n`, "").replace(`  ${END10(firstKey)}\n`, "");
      writeFileSync(join(tmp, "site", "index.html"), orphaned);
      let refused = null;
      try { run(); } catch (e) { refused = String(e.stderr || e.message); }
      ok(orphaned !== html && orphaned.includes(`data-s10-hub="${firstKey}"`) && refused !== null && /without its BEGIN\/END marker pair/.test(refused)
        && readFileSync(join(tmp, "site", "index.html"), "utf8") === orphaned,
        "SECTION10 negative fixture (f): a hub container without its marker pair makes the generator refuse, and the page is left unwritten [orphaned-container]");
    } catch (e) { ok(false, "SECTION10 idempotence harness ran: " + e.message); }
    finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // NEGATIVE FIXTURES — each must trip its NAMED rule, not merely go red
  const fired = (problems, rule) => problems.some(p => p.rule === rule);
  const firstEst = Object.keys(P10).find(k => P10[k].headlineSource === "astra_estimate");
  const swapRec = (key, mutate) => recs.map(r => { if (r.key !== key) return r; const c = JSON.parse(JSON.stringify(r)); mutate(c); return c; });
  {
    const stale = app.replace(/\bcanonicalReplay\(rec\)/g, "astraProReadings(rec)");
    ok(stale !== app && fired(checkChartPath(stale), "chart-path"), "SECTION10 negative fixture (a): a stale chart path without the canonicalReplay call is rejected [chart-path]");
  }
  if (ready && firstEst) {
    const estKey = P10[firstEst].estimateKey;
    const metricOnly = swapRec(estKey, c => { c.metric = "output-token"; });
    ok(fired(checkHub(html, firstEst, metricOnly, E), "metric") && fired(checkRecordCanonical(metricOnly.find(r => r.key === estKey), E), "metric"),
      "SECTION10 negative fixture (b): a metric-only change in a record is rejected [metric]");
    const noEnd = html.replace(END10(firstEst), "");
    ok(noEnd !== html && fired(checkHub(noEnd, firstEst, recs, E), "marker"), "SECTION10 negative fixture (c): a missing marker is rejected [marker]");
    const region = html.slice(html.indexOf(BEGIN10(firstEst)), html.indexOf(END10(firstEst)) + END10(firstEst).length);
    const dup = html.replace(region, region + "\n  " + region);
    ok(region.length > 0 && dup !== html && fired(checkHub(dup, firstEst, recs, E), "marker"), "SECTION10 negative fixture (d): a duplicate marker is rejected [marker]");
    const mutated = swapRec(estKey, c => { c.scenarios.central.overrides.util += 5; });
    const mp = checkHub(html, firstEst, mutated, E);
    ok(fired(mp, "central") && fired(mp, "hash"), "SECTION10 negative fixture (e): one mutated override in a cloned record makes the face check fail [central, hash]");
  } else {
    for (const f of ["(b) metric-only change", "(c) missing marker", "(d) duplicate marker", "(e) mutated override"])
      ok(false, `SECTION10 negative fixture ${f}: could not run — the SECTION10 exports or a matched hub are missing`);
  }
}

// DOTA — a reader's pass over §10 on Chrome (2026-10-06, Dot A, at 1405 and 400 CSS px) found presentation
// defects with every number agreeing. The text half of the repairs is held here; the browser half (the
// Reproduce identity, the chart tooltip, the review pages' width) is tests/s10-dota-cdp.test.mjs.
{
  const reading = key => (recs.find(r => r.key === key) || {}).reading || "";
  const SIGN = "a negative figure is part of why the July card reads lower";
  for (const key of ["gemini-3-1-pro", "grok-4-6", "glm-5-3"])
    ok(reading(key).split("\n\n").slice(1).join(" ").includes(SIGN), `DOTA (c) ${key}: the attribution paragraph says which way its signed figures run`);
  const cl = readFileSync(join(ROOT, "research", "changelog.md"), "utf8");
  const oct6 = cl.slice(cl.indexOf("## §10: each provider now opens"), cl.indexOf("## Corrections — 2026-10-04")).replace(/\s+/g, " ");
  ok(oct6.length > 0 && oct6.includes(SIGN), "DOTA (c) the 2026-10-06 changelog entry says which way its signed figures run");
  const glm = reading("glm-5-3");
  ok(!/differ mainly in rent/.test(glm) && /serving-stack efficiency moves the margin most/.test(glm), "DOTA (d) the GLM-5.3 reading names one ranking of what differs, not two");
  const grok = reading("grok-4-6");
  ok(!/owning its Colossus fleet/.test(grok) && /finance-leased/.test(grok) && /not a claim of legal ownership/.test(grok), "DOTA (e) the Grok 4.6 reading keeps the owner's-cost assumption apart from legal ownership");
  const body10 = html.slice(html.indexOf('id="rs-body-10"'), html.indexOf('<div id="provider-cards">'));
  const para = (body10.match(/<p>[^]*?<\/p>/g) || []).find(p => p.includes("output-token margin only")) || "";
  ok(para && para.indexOf("July 2026") >= 0 && para.indexOf("July 2026") < para.indexOf("Moonshot"), "DOTA (g) the §10 intro puts the July scope before Moonshot's output-token sentence");
  const zb = html.indexOf("<!-- BEGIN s10-hub:zhipu"), ze = html.indexOf("<!-- END s10-hub:zhipu -->");
  const zhub = zb >= 0 && ze > zb ? html.slice(zb, ze) : "";
  ok(/did not change/.test(zhub) && /traffic profile/.test(zhub) && /corrected 2026-10-06/i.test(zhub), "DOTA (h) the Zhipu hub flags the card's corrected tariff sentence before a reader reaches it");
  for (const page of ["gemini-3-1-pro", "grok-4-6", "glm-5-3"]) {
    const f = join(ROOT, "site", "research", `${page}-astra-pro.html`);
    const t = existsSync(f) ? readFileSync(f, "utf8") : "";
    ok(/\.report pre \{[^}]*overflow-x: auto/.test(t), `DOTA (b) ${page} review page gives its code blocks their own horizontal scroll`);
  }
}

console.log(`astra-pro-estimates: ${checks - failures}/${checks} checks, ${recs.length} estimate(s)`);
if (failures) process.exit(1);
