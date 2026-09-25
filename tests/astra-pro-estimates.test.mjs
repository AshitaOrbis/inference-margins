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
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
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

console.log(`astra-pro-estimates: ${checks - failures}/${checks} checks, ${recs.length} estimate(s)`);
if (failures) process.exit(1);
