// build-research-html.mjs — regenerate site/research/*.html from the research markdown.
// Authoring-time tool (node build-research-html.mjs); the deployed site stays build-free.
// Every manifest entry is required: a missing source must fail instead of retaining stale HTML.
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "site", "research");
mkdirSync(OUT, { recursive: true });

const REPORTS = [
  { md: "research/gpt-pro-full-response.md", slug: "anthropic-gptpro", title: "Anthropic — GPT-5.6 Pro independent consult", desc: "The original 54-minute Pro research run behind report §6: Opus 92–94% / Sonnet 94–96% at strategic rates." },
  { md: "research/provider-dives/openai-gptpro.md", slug: "openai-gptpro", title: "OpenAI — GPT-5.6 Pro deep dive", desc: "GPT-5.6 family serving economics: Azure/OCI/CoreWeave fleet, pricing, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/google-gptpro.md", slug: "google-gptpro", title: "Google (Gemini) — GPT-5.6 Pro deep dive", desc: "TPU vertical integration, Ironwood internal TCO, Gemini pricing, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/deepseek-gptpro.md", slug: "deepseek-gptpro", title: "DeepSeek — GPT-5.6 Pro deep dive", desc: "V4/V4 Pro economics, post-disclosure margin evidence, China fleet reality, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/zhipu-gptpro.md", slug: "zhipu-gptpro", title: "Zhipu / Z.ai (GLM) — GPT-5.6 Pro deep dive", desc: "GLM-5.2 economics, HK IPO financial disclosures, domestic fleet, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/moonshot-gptpro.md", slug: "moonshot-gptpro", title: "Moonshot (Kimi) — GPT-5.6 Pro deep dive", desc: "K2.x economics, reseller price floors, fleet evidence, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/xai-gptpro.md", slug: "xai-gptpro", title: "xAI (Grok) — GPT-5.6 Pro deep dive", desc: "Grok 4.x economics on the owned Colossus fleet, pricing, margin verdict with a judgmental uncertainty range." },
  { md: "research/provider-dives/chinese-accel-gptpro.md", slug: "chinese-accel-gptpro", title: "Chinese accelerators — GPT-5.6 Pro deep dive", desc: "Ascend 910C/950, H20/H800, CloudMatrix: specs, costs, throughput anchors, export-control state." },
  { md: "research/provider-dives/chinese-accel-ascend-websweep.md", slug: "chinese-accel-ascend-websweep", title: "Huawei Ascend — web sweep", desc: "Cross-check sweep: 910B/910C/950 specs, CloudMatrix 384 pricing, MFU anchors, who serves on Ascend." },
  { md: "research/provider-dives/chinese-accel-h800-h20-websweep.md", slug: "chinese-accel-h800-h20-websweep", title: "H800 / H20 / export controls — web sweep", desc: "Cross-check sweep: specs, China pricing, the 2025–26 export-control timeline, fleet reality, H20 throughput anchors." },
  { md: "research/grok-sweep-margin-claims.md", slug: "grok-sweep-margin-claims", title: "X-sphere margin claims — Grok 4.5 sweep", desc: "The primary-post hunt behind §1–2: TeorTaxes, Zephyr, Jukan, fleetingbits, DeepSeek disclosure threads." },
  { md: "research/grok-sweep-glm-gb300-plans.md", slug: "grok-sweep-glm-gb300", title: "GLM-on-GB300 & subscription plans — Grok 4.5 sweep", desc: "The ncode/Noumena GB300 deployment posts and the Claude plan-tokenomics investigations." },
  /* im-vet-six-repairs (2026-09-20), vetting finding E3: the dominant input-side cost was not
     reconstructible in one place and the reconstruction boundary was unstated. This page is both. */
  { md: "research/input-cost-reconstruction.md", slug: "input-cost-reconstruction", title: "Where the input-side cost comes from", desc: "One reconstruction, in one place: the three cost components of a modeled token bundle with their sources and labels, the cache-work boundary the fresh-prefill anchor assumes, and the two sensitivities the methods box collapses into one." },
  { md: "research/final-answer-rationale.md", slug: "final-answer-rationale", title: "The final answer — rationale and evidence chain", desc: "The load-bearing rationale behind the landing FINAL-ANSWER block: the estimand, every evidence link in the chain, the policy identities, and what disclosure would move the answer." },
  { md: "research/methods-loao.md", slug: "methods-loao", title: "Methods: the cross-platform transfer test", desc: "The falsification test behind methodology v2: one efficiency number does not transfer between accelerators (mean error 37%), and the roofline follow-up's negative result. The file keeps its original slug; \"leave-one-anchor-out\" was a misnomer and the note says why." },
  { md: "research/reviews-2026-07-10-council-synthesis.md", slug: "review-council", title: "External review #1 — four-persona council (Opus synthesis)", desc: "Unedited adversarial pre-publication review: skeptic, architect, risk analyst, empiricist + synthesis. Drove methodology v2." },
  { md: "research/reviews-2026-07-10-gptpro-review.md", slug: "review-gptpro", title: "External review #2 — GPT-5.6 Pro", desc: "Independent adversarial review with exact replacement wording; confirmed the six §10 numbers transferred faithfully. Drove methodology v2." },
  { md: "research/consultation-2026-07-10-council-design.md", slug: "consult-council-design", title: "Design consultation — four-persona council (Opus synthesis)", desc: "The typed-ontology, attribution-honesty and ship-list adjudications behind methodology v2.1's preset expansion." },
  { md: "research/consultation-2026-07-10-preset-pack.md", slug: "consult-preset-pack", title: "Preset grounding pack — GPT-5.6 Pro", desc: "First-party tariff verifications and locked parameter decisions for the v2.1 presets." },
  { md: "research/consultation-2026-07-10-roofline.md", slug: "consult-roofline", title: "Roofline model consultation — GPT-5.6 Pro", desc: "The negative result that keeps anchor fits: a physically-informed roofline fails the whole-platform gate and the preregistered test is formally unrunnable on public data." },
  { md: "research/reviews-2026-07-10-council-final-v21.md", slug: "review-council-final", title: "Final review — four-persona council on v2.1 (Opus synthesis)", desc: "The NO-SHIP gate that produced v2.1.1: lens-range membership, xAI operating-point, attribution and permalink-identity repairs." },
  { md: "research/reviews-2026-07-10-gptpro-final.md", slug: "review-gptpro-final", title: "Final review — GPT-5.6 Pro on v2.1", desc: "Independent final gate on the finished product." },
  { md: "research/consultation-2026-07-11-plan-review-council.md", slug: "plan-review-v212-council", title: "v2.1.2 plan review — four-persona council (Opus synthesis)", desc: "Pre-implementation review of the traffic-mix/reception-audit plan: seven P0 conditions, the xAI 26.95/36.52 conflict proof, and two live attribution defects found." },
  { md: "research/consultation-2026-07-11-plan-review-gptpro.md", slug: "plan-review-v212-gptpro", title: "v2.1.2 plan review — GPT-5.6 Pro", desc: "Pre-implementation review: traffic-mix state contract, provenance rules for regenerated artifacts, and the redesign of named-person reception testing into corpus-bounded source audits." },
  { md: "research/changelog.md", slug: "changelog", title: "Changelog", desc: "Dated revision history — what changed in each methodology revision and why." },
  { md: "research/gptpro-consult-anthropic-verbatim.md", slug: "gptpro-consult-anthropic-verbatim", title: "Anthropic consult — verbatim original (recovered)", desc: "The complete 54-minute GPT-5.6 Pro response, original bytes recovered from the receiving session transcript, SHA-256-stamped." },
  { md: "research/consultation-2026-07-10-roofline-verbatim.md", slug: "consult-roofline-verbatim", title: "Roofline consultation — verbatim full derivation (recovered)", desc: "The complete roofline derivation behind the adopted negative result — original bytes, SHA-256-stamped." },
  { md: "research/grounding-ledger.md", slug: "grounding-ledger", title: "Adopted grounding ledger (machine-generated)", desc: "Every preset parameter with value, source and evidence label, generated from the deployed registry — the authoritative parameter record." },
  // im-arc T2 (memo research/im-arc-t2-sections-memo.md §4, 2026-08-22): publish the generated
  // region / facility / programme registry and its explicit modeled-fleet coverage accounting.
  { md: "research/dc-registry.md", slug: "dc-registry", title: "Data-center and electricity registry (machine-generated)", desc: "Typed region, facility and programme evidence plus explicit modeled-fleet coverage accounting; programme-level evidence is not promoted to a facility." },
  // im-arc T4 (brought forward 2026-08-23; plan §7): the analyst-divergence reconciliation — which
  // margin object each cited source speaks of, verified by two blind research arms.
  { md: "research/analyst-divergence.md", slug: "analyst-divergence", title: "Why analyst margin figures diverge — which margin each source is talking about", desc: "Rental-inclusive unit serving, owned/TCO unit serving, cohort contribution and company gross margin are four objects; every cited analyst claim attributed to its stated basis by two independent research arms, with the rent/own identity re-derived." },
  { md: "research/consultation-2026-07-11-preset-pack-reaudit.md", slug: "consult-preset-pack-reaudit", title: "Preset pack re-audit — GPT-5.6 Pro re-emission + delta", desc: "Dated author-model re-emission of the expired 192-row pack, with a checked delta table against the adopted values (the ledger wins)." },
  { md: "research/reception-2026-07-11-synthesis.md", slug: "reception-synthesis", title: "Reception phase — synthesis & resolution ledger", desc: "Nine simulated-reader audits (five corpus-bounded source-faithfulness, four audience archetypes) against the frozen v2.1.2 preview: 16 P0s and ~26 P1s found, dispositioned finding-by-finding. A simulated-reader exercise, not validation." },
  { md: "research/reception/corpus-manifest.md", slug: "reception-corpus-manifest", title: "Reception phase — corpus manifest", desc: "The fixed source corpus behind the faithfulness audits, with its stated circularity limit." },
  { md: "research/gptpro-reports/dive-tpu-2026-07-15.md", slug: "dive-tpu", title: "Google TPU inference economics — GPT-5.6 Pro deep dive", desc: "Recovered Targeted-4 dive: named-model, named-precision serving anchors for TPU v5e/v6e/v7 (Ironwood), paired with current GCP rental prices — plus the rigorous negative that no public path exists from TPU rental prices to Gemini's internal margin." },
  { md: "research/gptpro-reports/dive-trainium-2026-07-15.md", slug: "dive-trainium", title: "AWS Trainium inference economics — GPT-5.6 Pro deep dive", desc: "Recovered Targeted-4 dive: a narrow engineering-only Trainium2 $/token anchor from two AWS Neuron tutorials, plus rigorous negatives for Trainium3 and Project Rainier (500K+ Trn2 chips confirmed running Claude inference, zero economics disclosed)." },
  { md: "research/gptpro-reports/dive-replication-blinded-2026-07-15.md", slug: "dive-replication-blinded", title: "Blinded unit-margin cross-check — GPT-5.6 Pro deep dive", desc: "A from-scratch bottom-up unit-serving-margin estimate built under an explicit instruction not to consult this site or its repository; disclosed blind held. A robustness comparison, not an independent empirical measurement or matched-estimand validation. Central 73.3%, cross-model median 71.8%, range 47–89%." },
  { md: "research/gptpro-reports/dive-amd-2026-07-15.md", slug: "dive-amd", title: "AMD Instinct inference economics — GPT-5.6 Pro deep dive (partial, 120-min timeout)", desc: "Recovered reasoning-summary only (the MCP's 120-minute hard timeout hit before a full report was emitted): refines the DigitalOcean/RadixArk MI350X claim to MI355X and a total-vs-generated-throughput caveat; AMD anchor-quality negatives (MLPerf, Azure, Oracle)." },
  { md: "research/gptpro-reports/dive-nvidia-forward-2026-07-15.md", slug: "dive-nvidia-forward", title: "NVIDIA forward (GB300/Rubin) inference economics — GPT-5.6 Pro deep dive", desc: "Round-2 dive: MLPerf v6.0 audited GB300 NVL72 generated-throughput anchors, a clean B300 $/token pair, a GB200 rack-price bridge — and a rigorous negative that Rubin's economics remain fully unanchored." },
  { md: "research/gptpro-reports/dive-ascend-2026-07-15.md", slug: "dive-ascend", title: "Huawei Ascend / CloudMatrix 384 inference economics — GPT-5.6 Pro deep dive", desc: "Round-2 dive: a full-system CM384 generated-throughput anchor and a cross-source 910B $/token proxy — plus rigorous negatives on CM384 cost, the 6,688-tok/s prefill/decode conflation, and the nonexistent Ascend 920." },
];

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Skin-boot script, extracted VERBATIM from site/index.html at build time so annex pages run the
   exact same skin/theme resolution as the main page (single source of truth — the flagged
   ashitaorbis-integration follow-up). Fail closed: if the block moves or is renamed the build
   must break, never silently ship unskinned annexes on the OS-theme fallback. */
const SKIN_BOOT = (() => {
  const idx = readFileSync(join(ROOT, "site", "index.html"), "utf8");
  const ms = idx.match(/<script>\s*\/\* Skin\/theme resolution[\s\S]*?<\/script>/g) || [];
  if (ms.length !== 1) throw new Error(`skin-boot extraction: expected exactly 1 marked script in site/index.html, found ${ms.length} — annex pages would ship wrong/unskinned boot code`);
  // Lazy match ends at the FIRST </script> after the marker; if the marked block lost its own
  // closer it would swallow through an unrelated script's closer. Refuse any block that opens
  // a second script tag — matched WITHOUT the closing ">" so attribute-bearing tags
  // (<script src=... async defer>) are caught too (round-2 verification finding).
  if (ms[0].indexOf("<script", 1) !== -1) throw new Error("skin-boot extraction overmatched into a second <script> block — marked script is unterminated in site/index.html");
  return ms[0];
})();

function page(title, bodyHtml, { backdepth = 1, canonical = null, crumb = null } = {}) {
  const up = "../".repeat(backdepth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Frontier Inference Margins</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">${canonical ? `\n<link rel="canonical" href="${canonical}">` : ""}
${SKIN_BOOT}
<link rel="stylesheet" href="${up}styles.css">
<style>
  .page { max-width: 880px; }
  .report table { display: block; overflow-x: auto; }
  .crumb { font-size: 13px; margin: 4px 0 14px; }
  .raw-note { border: 1px dashed var(--ink-3); background: var(--wash); border-radius: 10px; padding: 8px 12px; font-size: 13px; color: var(--ink-2); margin: 10px 0 16px; }
</style>
</head>
<body>
<div class="page">
<p class="crumb">${crumb === null ? `<a href="${up}index.html">← Frontier Inference Margins</a> · <a href="index.html">all research reports</a>` : crumb}</p>
<section class="report">
${bodyHtml}
</section>
<footer class="footer"><p>Reference material for <a href="${up}index.html">margins.ashitaorbis.com</a>. Selected public artifacts, lightly edited for release (provenance headers condensed — conversation IDs and raw interface markers removed; conclusions unchanged); each file states its own provenance class. Confidence labels are the authoring engine's own.</p></footer>
</div>
</body>
</html>`;
}


/* ---------- current-language wrappers on the annex (release edit 2026-09-09) ----------
   GPT Pro session 3 (the enthusiast reader, pr-20260908T151150Z-7018e3) reported that learning
   the main page's vocabulary does not prepare a reader for the annex: "serving contribution
   margin" becomes "marginal serving gross margin" becomes "central COGS" across three pages, and
   "judgment range" becomes "80% CI" in the provider reports. Its ask was a short current-language
   wrapper on each archived page saying what the archived quantity MEANS and what the present site
   ADOPTED. These pages are preserved records and their words are not edited; the wrapper is the
   translation, and it sits ABOVE the collection metadata so the reader meets the answer first. */
const ADOPTED = {
  "openai-gptpro": "Its <em>marginal serving gross margin</em> is what this site now calls the <strong>serving margin</strong>, and its <em>80% CI</em> is a judgment range, not a calibrated interval. The site adopted its ~94% as this estimator's own stated central; the OpenAI card's ~92% is this site's replay of the same vector through its own engine.",
  "google-gptpro": "Its margin figure is what this site now calls the <strong>serving margin</strong>, on an internal-cost basis — in this site's terms an <strong>owned cost</strong> reading, not a rented one. Its uncertainty spans are judgment ranges.",
  "xai-gptpro": "This dive prices the same accelerator-hour three ways. In this site's terms those are three <strong>cost bases</strong>: short-run cash cost, owned cost (TCO), and what a customer pays for that hour. The xAI card carries all three rather than choosing one.",
  "deepseek-gptpro": "Its margin figure is what this site now calls the <strong>serving margin</strong>. Its cost figures are on a rented basis at Chinese rates — in this site's terms a <strong>price preset</strong>, not a measurement of DeepSeek's own invoices.",
  "zhipu-gptpro": "Its margin figure is what this site now calls the <strong>serving margin</strong>. Note the object changes inside the source: Zhipu's audited filings report a <strong>company gross margin</strong> for a business segment, which is a different quantity from the per-token figure the calculator computes.",
  "moonshot-gptpro": "Its headline is an <strong>output-token margin</strong> — the serving margin on output tokens alone — because Moonshot's traffic mix is not public. It is not comparable with the blended figures on the other cards.",
  "anthropic-gptpro": "Its <em>marginal serving margin</em> is what this site now calls the <strong>serving margin</strong>. This is the July 2026 consult, at 92–94% on a mature-fleet strategic-contract reading; it is NOT the same object as the estimate card at the top of the report, which carries this estimator's later round-3 self-authored revision.",
  "gptpro-consult-anthropic-verbatim": "The verbatim original of the July 2026 consult. Its <em>marginal serving margin</em> is this site's <strong>serving margin</strong>; its confidence language is the authoring model's own and is not a calibrated interval.",
  "grounding-ledger": "Generated from the deployed registry. Field names are the engine's, not the reader's — the key at the top of the page translates them.",
  "analyst-divergence": "The labels on this page grade the ATTRIBUTION — which margin an analyst is talking about — not whether the analyst's number is true. They were renamed STATED / IMPLIED / OUR READING in this release for exactly that reason.",
  "methods-loao": "The quantity this note calls a <em>roof-utilization residual</em> is what the site now calls the <strong>efficiency factor (η)</strong>: the fraction of an accelerator's active roofline limit actually reached. It is not MFU, which is compute-only.",
  "changelog": "The changelog keeps the internal program codes (b9, r4, T5 and the rest) that the report's body copy no longer uses.",
};
const ADOPTED_DEFAULT = "This is an archived research artifact. Where it says <em>marginal serving gross margin</em>, <em>unit CM</em> or <em>serving contribution margin</em>, the site now says <strong>serving margin</strong>; where it states a confidence interval, the site treats it as a judgment range, not a calibrated one. What the site adopted from any artifact is stated in the <a href=\"../index.html#report\">main report</a>, which is authoritative where the two differ.";
function adoptedNote(slug) {
  return `<div class="raw-note"><strong>In today's words</strong> — ${ADOPTED[slug] || ADOPTED_DEFAULT}</div>`;
}

const published = [];
const builtPages = [];
const CI_BANNER_SLUGS = new Set(["openai-gptpro", "google-gptpro", "xai-gptpro", "deepseek-gptpro", "zhipu-gptpro", "moonshot-gptpro"]);
for (const r of REPORTS) {
  const src = join(ROOT, r.md);
  if (!existsSync(src)) throw new Error(`required research source missing: ${r.md}`);
  // Escape tildes before rendering: marked's GFM mode eats single-tilde pairs as <del>,
  // silently striking through money figures like "~¥50B (~$7.4B)" (Pro review #15). No annex
  // source uses intentional ~~strikethrough~~ or tildes in code spans, so a blanket escape is
  // safe and keeps the PRESERVED source documents byte-identical (the fix lives in the
  // renderer, not the records).
  const mdRaw = readFileSync(src, "utf8").replace(/~/g, "\\~");
  const html = marked.parse(mdRaw, { gfm: true });
  const ciBanner = CI_BANNER_SLUGS.has(r.slug) ? `<div class="raw-note"><strong>Probability-label note</strong> — this artifact preserves the authoring engine\'s original labels: any "CI" below is verbatim model-output terminology, not a statistically calibrated interval and not the site\'s current terminology. The main report treats these as uncalibrated scenario ranges.</div>` : "";
  const note = adoptedNote(r.slug) + ciBanner + `<div class="raw-note"><strong>Research artifact</strong> — each page states its own provenance class in its header: verbatim originals carry SHA-256 stamps; adopted-findings summaries and reconstructions say so explicitly. Conclusions are synthesized (and where needed corrected) in the <a href="../index.html#report">main report</a>; each page carries its own run date.</div>`;
  builtPages.push([r.slug + ".html", page(r.title, note + html, { canonical: `https://margins.ashitaorbis.com/research/${r.slug}` })]);
  published.push(r);
}

const list = published.map(r => `  <li><a href="${r.slug}.html">${esc(r.title)}</a> — ${esc(r.desc)}</li>`).join("\n");
const idxBody = `<h2>Research reports</h2>
<p>The full public research artifacts behind <a href="../index.html">Frontier Inference Margins</a>: one GPT-5.6 Pro deep dive per provider, hardware sweeps, and the X-post hunts. Bulky by design — they carry the citations. Provenance headers were condensed for public release (conversation IDs and raw interface citation markers removed); conclusions are unchanged and pre-edit copies are archived.</p>
<ul>
${list}
</ul>`;
const expectedHtml = new Set(["index.html", ...builtPages.map(([name]) => name)]);
for (const name of readdirSync(OUT)) {
  if (name.endsWith(".html") && !expectedHtml.has(name)) unlinkSync(join(OUT, name));
}
for (const [name, html] of builtPages) {
  writeFileSync(join(OUT, name), html);
  console.log(`built: site/research/${name}`);
}
writeFileSync(join(OUT, "index.html"), page("Research reports", idxBody, { canonical: "https://margins.ashitaorbis.com/research/" }));
console.log(`built: site/research/index.html (${published.length} reports)`);

/* ---------- the /glossary page (release edit, 2026-09-09) ----------
   Built from style/GLOSSARY.md so the glossary a reader sees and the glossary the vocabulary
   work maintains are one file. The release edit links in-copy terms here at first use per
   top-level section (the link rule is stated in GLOSSARY.md's own header), so the ANCHORS ARE
   THE CONTRACT: every anchor is slugified from the canonical term itself and a term that loses
   its anchor breaks a link the suite checks. Entries are `**term** — definition`; group headings
   are `## <letter>. "<the question a reader is asking>"`; the abbreviation group is a table and
   is carried through as one.
   The page is served at /glossary (Cloudflare Pages resolves the extensionless path). */
const GLOSSARY_SRC = join(ROOT, "style", "GLOSSARY.md");
const glossarySlug = (term) => term
  .toLowerCase()
  .replace(/\(([^)]*)\)/g, " $1 ")      // "efficiency factor (η)" -> "efficiency factor η"
  .replace(/[^a-z0-9ηµ]+/g, "-")
  .replace(/^-+|-+$/g, "");

function buildGlossary() {
  const raw = readFileSync(GLOSSARY_SRC, "utf8");
  const lines = raw.split("\n");
  const groups = [];
  let group = null;
  let buf = [];
  const flush = () => {
    if (!group || !buf.length) { buf = []; return; }
    const block = buf.join("\n").trim();
    buf = [];
    if (!block) return;
    /* An entry header may carry an ALIAS before the dash — "**fleet leg** (or **leg**) — …".
       The stricter form dropped those into `loose`, which renders the text but gives it no anchor,
       so a term with an alias could not be linked from copy. Found by an Astra review; one entry
       was affected. The alias is kept in the visible term and the anchor is slugified from the
       canonical name alone, so `#fleet-leg` is stable whatever the alias says. */
    const m = block.match(/^\*\*([^*]+)\*\*((?:\s*\([^)]*\))?)\s+—\s+([\s\S]*)$/);
    if (m) group.entries.push({ term: m[1].trim(), alias: (m[2] || "").trim(), body: m[3].trim() });
    else group.loose.push(block);
  };
  for (const line of lines) {
    const g = line.match(/^##\s+([A-Z])\.\s+(.*)$/);
    if (g) { flush(); group = { key: g[1], title: g[2].replace(/^"|"$/g, ""), entries: [], loose: [] }; groups.push(group); continue; }
    if (!group) continue;                       // the file's own staging header is not reader copy
    if (/^\s*$/.test(line)) { flush(); continue; }
    buf.push(line);
  }
  flush();

  // Every entry's canonical anchor, so **bold** cross-references inside a definition can link.
  const anchorOf = new Map();
  for (const gr of groups) for (const e of gr.entries) {
    const slug = glossarySlug(e.term);
    if (!anchorOf.has(e.term.toLowerCase())) anchorOf.set(e.term.toLowerCase(), slug);
    e.slug = slug;
  }
  const inline = (text, selfTerm) => {
    // marked() would turn **x** into <strong>; do the cross-link first, then hand the rest over.
    let out = esc(text).replace(/\n/g, " ");
    out = out.replace(/\*\*([^*]+)\*\*/g, (whole, term) => {
      const t = term.trim().toLowerCase();
      const slug = anchorOf.get(t);
      if (!slug || (selfTerm && t === selfTerm.toLowerCase())) return `<strong>${term}</strong>`;
      return `<a href="#${slug}"><strong>${term}</strong></a>`;
    });
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    return out;
  };

  const nav = groups.map(gr => `<li><a href="#g-${gr.key}">${esc(gr.title)}</a></li>`).join("\n");
  const body = groups.map(gr => {
    const entries = gr.entries.map(e =>
      `<dt id="${e.slug}"><a class="gl-self" href="#${e.slug}">${esc(e.term)}</a>${e.alias ? " " + inline(e.alias, e.term) : ""}</dt>\n<dd>${inline(e.body, e.term)}</dd>`
    ).join("\n");
    // The abbreviation group is a markdown table; render it as written rather than as entries.
    const loose = gr.loose.map(b => marked.parse(b.replace(/~/g, "\\~"), { gfm: true })).join("\n");
    return `<h3 id="g-${gr.key}">${esc(gr.title)}</h3>\n${entries ? `<dl class="gl">\n${entries}\n</dl>` : ""}${loose}`;
  }).join("\n\n");

  const count = groups.reduce((n, gr) => n + gr.entries.length, 0);
  const intro = `<h2>Glossary</h2>
<p class="gl-lede">Every term this site uses for its own ideas, in one place, grouped by the question you are asking.
One plain definition each, then the technical detail only where the numbers need it. ${count} entries.
Terms in <strong>bold</strong> inside a definition are entries of their own.</p>
<p class="gl-lede"><strong>If you read one entry, read <a href="#serving-margin">serving margin</a></strong> — it is the
one number this site computes, and it is not a <a href="#company-gross-margin">company gross margin</a>.</p>
<nav class="gl-nav"><ul>
${nav}
</ul></nav>`;

  writeFileSync(join(ROOT, "site", "glossary.html"),
    page("Glossary", intro + "\n\n" + body, {
      backdepth: 0,
      canonical: "https://margins.ashitaorbis.com/glossary",
      crumb: `<a href="index.html">← Frontier Inference Margins</a> · <a href="research/index.html">research reports</a>`,
    }));
  console.log(`built: site/glossary.html (${count} entries, ${groups.length} groups)`);
  return count;
}
buildGlossary();
