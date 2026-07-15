// Contrast gate for the skin system (2026-07-13): every skin×theme combo must keep the
// honesty-critical text ≥ 4.5:1 (WCAG AA) against its real composited background stack —
// body text, evidence labels (DISCLOSED/CREDIBLE/COMMUNITY/SPECULATION + badges), the
// state-identity strip, the "Not a company gross margin" hero line, and the PAGE-AUTHORED
// banners. Reads the token blocks straight from site/styles.css so drift fails the gate.
// Run: node tests/contrast-check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "site", "styles.css"), "utf8");

/* ---------- extract the four combo token blocks ---------- */
function block(selectorRe) {
  const m = css.match(selectorRe);
  if (!m) throw new Error("token block not found: " + selectorRe);
  // capture to the matching closing brace of the block that starts at the selector
  let i = css.indexOf("{", m.index), depth = 0, start = i;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) break;
  }
  return css.slice(start + 1, i);
}
function tokens(body) {
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const combos = {
  "app/dark": tokens(block(/^:root\s*\{/m)),
  "app/light": tokens(block(/^:root\[data-theme="light"\]\s*\{/m)),
  "editorial/light": tokens(block(/^:root\[data-skin="editorial"\]\[data-theme="light"\]\s*\{/m)),
  "editorial/dark": tokens(block(/^:root\[data-skin="editorial"\]\[data-theme="dark"\]\s*\{/m)),
};

/* ---------- color math (WCAG 2.x) ---------- */
function parse(c) {
  c = c.trim();
  let m;
  if ((m = c.match(/^#([0-9a-f]{6})$/i))) {
    return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  }
  if ((m = c.match(/^#([0-9a-f]{3})$/i))) {
    const h = m[1];
    return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 };
  }
  if ((m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i))) {
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  throw new Error("unparseable color: " + c);
}
const over = (top, bot) => ({
  r: top.a * top.r + (1 - top.a) * bot.r,
  g: top.a * top.g + (1 - top.a) * bot.g,
  b: top.a * top.b + (1 - top.a) * bot.b,
  a: 1,
});
function luminance({ r, g, b }) {
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ---------- gated pairs: [name, fg token, bg token stack (bottom → top)] ----------
   Stacks mirror the real DOM: e.g. evidence labels sit in .dossier (--tile) directly on the
   page; badges sit in .prov (--tile) inside .report (--surface-1); the hero tile is --wash
   straight over the page (tile-hero replaces the surface); id-modified strips are --wash. */
const PAIRS = [
  ["body text (.report p)",           "ink-2",      ["page", "surface-1"]],
  ["body strong",                     "ink-1",      ["page", "surface-1"]],
  ["hints/captions (ink-3)",          "ink-3",      ["page", "surface-1"]],
  ["ev label DISCLOSED",              "good",       ["page", "tile"]],
  ["ev label CREDIBLE",               "accent-ink", ["page", "tile"]],
  ["ev label COMMUNITY",              "warn",       ["page", "tile"]],
  ["ev label SPECULATION",            "ink-3",      ["page", "tile"]],
  ["badge evidence:high",             "good",       ["page", "surface-1", "tile"]],
  ["badge evidence:medium",           "warn",       ["page", "surface-1", "tile"]],
  ["badge evidence:low",              "ink-3",      ["page", "surface-1", "tile"]],
  ["badge evidence:mixed",            "series-5",   ["page", "surface-1", "tile"]],
  ["identity strip chips",            "ink-2",      ["page", "surface-1"]],
  ["identity strip lead-in",          "ink-3",      ["page", "surface-1"]],
  ["identity strip model name",       "ink-1",      ["page", "surface-1"]],
  ["strip state: central",            "good",       ["page", "surface-1"]],
  ["strip state: custom",             "series-5",   ["page", "surface-1"]],
  ["strip state: counterfactual",     "warn",       ["page", "surface-1"]],
  ["strip state: modified (on wash)", "series-6",   ["page", "wash"]],
  ["hero 'not company GM' line",      "ink-2",      ["page", "wash"]],
  ["hero 'not company GM' strong",    "ink-1",      ["page", "wash"]],
  ["hero PAGE-AUTHORED banner",       "ink-2",      ["page", "wash"]],
  ["dossier PAGE-AUTHORED note",      "ink-2",      ["page", "tile"]],
  ["link on page",                    "accent-ink", ["page"]],
  ["link on card",                    "accent-ink", ["page", "surface-1"]],
  ["link in washed quote (worst)",    "accent-ink", ["page", "surface-1", "tile", "wash"]],
  ["verdict box text",                "ink-2",      ["page", "surface-1", "wash"]],
  ["range chip 'currently here'",     "accent-ink", ["page", "surface-1", "tile"]],
  ["tooltip text",                    "ink-1",      ["overlay"]],
  ["tooltip source line",             "ink-3",      ["overlay"]],
  ["sub-card verdict (good)",         "good",       ["page", "surface-1"]],
  ["sub-card verdict (underwater)",   "series-6",   ["page", "surface-1"]],
  ["feedback submit button",          "on-accent",  ["accent"]],
];

let fails = 0;
for (const [combo, tok] of Object.entries(combos)) {
  console.log(`\n=== ${combo} ===`);
  for (const [name, fgTok, stack] of PAIRS) {
    if (!tok[fgTok]) { console.log(`FAIL  ${name} — missing token --${fgTok}`); fails++; continue; }
    let bg = null;
    for (const layerTok of stack) {
      if (!tok[layerTok]) { bg = null; console.log(`FAIL  ${name} — missing bg token --${layerTok}`); fails++; break; }
      const c = parse(tok[layerTok]);
      bg = bg === null ? c : over(c, bg);
    }
    if (bg === null) continue;
    const fg = parse(tok[fgTok]);
    const fgc = fg.a < 1 ? over(fg, bg) : fg;
    const r = ratio(fgc, bg);
    const ok = r >= 4.5;
    if (!ok) fails++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${r.toFixed(2)}:1  (--${fgTok} on ${stack.join("→")})`);
  }
}
console.log(fails === 0 ? "\nALL CONTRAST CHECKS PASS (4 combos)" : `\n${fails} CONTRAST FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
