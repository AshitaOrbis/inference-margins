// build-research-html.mjs — regenerate site/research/*.html from the research markdown.
// Authoring-time tool (node build-research-html.mjs); the deployed site stays build-free.
// Skips manifest entries whose markdown doesn't exist yet, so it can run before all dives land.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  { md: "research/methods-loao.md", slug: "methods-loao", title: "Methods: leave-one-anchor-out validation", desc: "The falsification test behind methodology v2: a single scalar MFU fails to transfer across platforms (mean error 37%), and the roofline follow-up's negative result." },
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
  { md: "research/consultation-2026-07-11-preset-pack-reaudit.md", slug: "consult-preset-pack-reaudit", title: "Preset pack re-audit — GPT-5.6 Pro re-emission + delta", desc: "Dated author-model re-emission of the expired 192-row pack, with a checked delta table against the adopted values (the ledger wins)." },
  { md: "research/reception-2026-07-11-synthesis.md", slug: "reception-synthesis", title: "Reception phase — synthesis & resolution ledger", desc: "Nine simulated-reader audits (five corpus-bounded source-faithfulness, four audience archetypes) against the frozen v2.1.2 preview: 16 P0s and ~26 P1s found, dispositioned finding-by-finding. A simulated-reader exercise, not validation." },
  { md: "research/reception/corpus-manifest.md", slug: "reception-corpus-manifest", title: "Reception phase — corpus manifest", desc: "The fixed source corpus behind the faithfulness audits, with its stated circularity limit." },
  { md: "research/gptpro-reports/dive-tpu-2026-07-15.md", slug: "dive-tpu", title: "Google TPU inference economics — GPT-5.6 Pro deep dive", desc: "Recovered Targeted-4 dive: named-model, named-precision serving anchors for TPU v5e/v6e/v7 (Ironwood), paired with current GCP rental prices — plus the rigorous negative that no public path exists from TPU rental prices to Gemini's internal margin." },
  { md: "research/gptpro-reports/dive-trainium-2026-07-15.md", slug: "dive-trainium", title: "AWS Trainium inference economics — GPT-5.6 Pro deep dive", desc: "Recovered Targeted-4 dive: a narrow engineering-only Trainium2 $/token anchor from two AWS Neuron tutorials, plus rigorous negatives for Trainium3 and Project Rainier (500K+ Trn2 chips confirmed running Claude inference, zero economics disclosed)." },
  { md: "research/gptpro-reports/dive-replication-blinded-2026-07-15.md", slug: "dive-replication-blinded", title: "Independent blinded unit-margin replication — GPT-5.6 Pro deep dive", desc: "A from-scratch bottom-up unit-serving-margin estimate built under an explicit instruction not to consult this site or its repository; disclosed blind held. Central 73.3%, cross-model median 71.8%, range 47–89%." },
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

function page(title, bodyHtml, { backdepth = 1, canonical = null } = {}) {
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
<p class="crumb"><a href="${up}index.html">← Frontier Inference Margins</a> · <a href="index.html">all research reports</a></p>
<section class="report">
${bodyHtml}
</section>
<footer class="footer"><p>Reference material for <a href="${up}index.html">margins.ashitaorbis.com</a>. Reports are archived as produced (typos and all); confidence labels are the authoring engine's own.</p></footer>
</div>
</body>
</html>`;
}

const published = [];
const CI_BANNER_SLUGS = new Set(["openai-gptpro", "google-gptpro", "xai-gptpro", "deepseek-gptpro", "zhipu-gptpro", "moonshot-gptpro"]);
for (const r of REPORTS) {
  const src = join(ROOT, r.md);
  if (!existsSync(src)) { console.log(`skip (missing): ${r.md}`); continue; }
  // Escape tildes before rendering: marked's GFM mode eats single-tilde pairs as <del>,
  // silently striking through money figures like "~¥50B (~$7.4B)" (Pro review #15). No annex
  // source uses intentional ~~strikethrough~~ or tildes in code spans, so a blanket escape is
  // safe and keeps the PRESERVED source documents byte-identical (the fix lives in the
  // renderer, not the records).
  const mdRaw = readFileSync(src, "utf8").replace(/~/g, "\\~");
  const html = execFileSync("npx", ["-y", "marked", "--gfm"], { encoding: "utf8", input: mdRaw, maxBuffer: 32 * 1024 * 1024 });
  const ciBanner = CI_BANNER_SLUGS.has(r.slug) ? `<div class="raw-note"><strong>Probability-label note</strong> — this artifact preserves the authoring engine\'s original labels: any "CI" below is verbatim model-output terminology, not a statistically calibrated interval and not the site\'s current terminology. The main report treats these as uncalibrated scenario ranges.</div>` : "";
  const note = ciBanner + `<div class="raw-note"><strong>Research artifact</strong> — each page states its own provenance class in its header: verbatim originals carry SHA-256 stamps; adopted-findings summaries and reconstructions say so explicitly. Conclusions are synthesized (and where needed corrected) in the <a href="../index.html#report">main report</a>; each page carries its own run date.</div>`;
  writeFileSync(join(OUT, r.slug + ".html"), page(r.title, note + html, { canonical: `https://margins.ashitaorbis.com/research/${r.slug}` }));
  published.push(r);
  console.log(`built: site/research/${r.slug}.html`);
}

const list = published.map(r => `  <li><a href="${r.slug}.html">${esc(r.title)}</a> — ${esc(r.desc)}</li>`).join("\n");
const idxBody = `<h2>Research reports</h2>
<p>The full, unedited research artifacts behind <a href="../index.html">Frontier Inference Margins</a>: one GPT-5.6 Pro deep dive per provider, hardware sweeps, and the X-post hunts. Bulky by design — they carry the citations.</p>
<ul>
${list}
</ul>`;
writeFileSync(join(OUT, "index.html"), page("Research reports", idxBody, { canonical: "https://margins.ashitaorbis.com/research/" }));
console.log(`built: site/research/index.html (${published.length} reports)`);
