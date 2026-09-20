/* Inline-element tag balance in the shipped HTML surfaces.
 *
 * WHY THIS EXISTS (im-release-edit-r3, 2026-09-10, bq-2195). The owner-ruled number sweep 8db1a85
 * rewrote a sentence in report section 4 and lost its closing </strong>. Nothing static noticed:
 * the file still reads as ten well-formed <details> blocks, and a strict HTML parser walking the
 * FILE reports all ten as direct children of #report at every revision. Only a real browser
 * reproduces what actually happens — the parser nests every following element inside the unclosed
 * <strong>, so sections 5 through 10 and their <h3> anchors stopped being children of #report and
 * six of the report's ten sections became unreachable by deep link.
 *
 * test:browser did catch it (ux-b-cdp U-1/U-2), and that is the right last line of defence. But it
 * catches it by consequence, minutes into a chromium run, and reports it as "4 sections instead of
 * 10" — a symptom two inferences away from the cause. This check names the cause in a second, with
 * the offending tag and 200 characters of context, and it runs in `npm test` where an editor sees
 * it before the browser suite is ever reached.
 *
 * Scope is deliberately narrow: INLINE formatting elements whose imbalance silently restructures
 * a document. Block elements are already covered structurally elsewhere, and a self-closing or
 * optional-end-tag element (<p>, <li>, <br>) would produce false positives, so none is listed.
 *
 * WHAT THIS CHECK DOES NOT DO (fallback review, F9 — the header claimed narrowness of SCOPE and
 * said nothing about narrowness of METHOD, which is the more useful admission):
 *   * it counts depth per file per tag, with no nesting context. A dropped `</strong>` in one
 *     section plus a stray `</strong>` elsewhere in the same file CANCELS to zero and passes —
 *     bq-2195's own class, arriving in pairs. Mis-nesting (`<strong><em></strong></em>`) also
 *     passes, because both tags balance.
 *   * it still reads ATTRIBUTE VALUES as markup, so a literal `title="<em>"` would trip it. None
 *     exists in these files today. Comment, <script> and <style> spans ARE now skipped (F10).
 *   * a stray close and an unclosed open are now counted SEPARATELY (F10) — they used to cancel to
 *     depth zero, which would have hidden bq-2195's own shape in any file that also had a stray.
 * The browser suite (ux-b-cdp U-1/U-2) remains the authority on what a parser actually does; this
 * check exists to name the CAUSE in a second rather than to replace that.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = (() => { let d = HERE; while (!existsSync(join(d, "package.json"))) { const up = dirname(d); if (up === d) throw new Error("repo root not found"); d = up; } return d; })();

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const INLINE = ["strong", "em", "b", "i", "code", "abbr", "span", "sup", "sub", "mark", "small"];
/* EVERY shipped HTML surface, not three named ones (fallback review, F11 — the original list
   covered 3 of 42, leaving every research/dive-*.html uncovered: the same <strong>-dense prose and
   the same deep links that bq-2195 broke). All 42 are clean today, so widening cost nothing but
   removes the way this check could go quietly narrow when a file is renamed. */
const FILES = (function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith(".html")) out.push(relative(ROOT, full));
  }
  return out;
})(join(ROOT, "site")).sort();

/* F11/F9: a floor, not just non-emptiness — a walk that silently stops finding files is the way
   this check goes quiet without going red. 42 surfaces exist today; 30 is a deliberate floor that
   tolerates ordinary churn and refuses a collapse. */
assert(`tag-balance: the walk found the shipped HTML surfaces (${FILES.length} found)`,
  FILES.length >= 30, JSON.stringify(FILES.slice(0, 5)) + ` … ${FILES.length} total`);

/* THE SCAN ITSELF, extracted so the negative control at the bottom can CALL it. It used to
   reimplement the counting in three lines of its own, which meant a broken scan here would still
   report "detected by this same logic" — which it would not have been (fallback review, F8). */
/* Comment, <script> and <style> spans, computed once per source. Tags inside them are TEXT, not
   markup (fallback review, F10 — site/index.html already carries the literal string "<script>"
   inside a comment, so this channel is live, and a JS string holding "<strong>" would have been
   counted as an open tag). */
export function opaqueSpans(src) {
  const spans = [];
  let k = 0;
  while (k < src.length) {
    const c = src.indexOf("<!--", k);
    const rt = /<(script|style|textarea|title)(?:"[^"]*"|'[^']*'|[^>])*>/i.exec(src.slice(k));
    const rtAt = rt ? k + rt.index : -1;
    if (c === -1 && rtAt === -1) break;
    if (c !== -1 && (rtAt === -1 || c < rtAt)) {
      const e = src.indexOf("-->", c + 4);
      const end = e === -1 ? src.length : e + 3;
      spans.push([c, end]); k = end;
    } else {
      const close = new RegExp("</" + rt[1] + "\\s*>", "i");
      const rest = src.slice(rtAt + rt[0].length);
      const m2 = close.exec(rest);
      const end = m2 ? rtAt + rt[0].length + m2.index + m2[0].length : src.length;
      spans.push([rtAt, end]); k = end;
    }
  }
  return spans;
}

export function scanTag(src, tag, spans = opaqueSpans(src)) {
  const re = new RegExp(`<${tag}(?=[\\s/>])[^>]*>|</${tag}\\s*>`, "gi");
  const opens = [];
  /* F10: collect EVERY stray close rather than `break`ing on the first. Breaking meant a file with
     both defects reported only one of them, and — worse — whole-file depth counting let a dropped
     close and a stray close CANCEL. Tracking them separately is what makes the bq-2195 shape still
     visible when the file also contains a stray close somewhere else. */
  const strays = [];
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (spans.some(([a, b]) => m.index >= a && m.index < b)) continue;   // inside a comment/script
    const isClose = m[0].startsWith("</");
    if (!isClose && /\/>$/.test(m[0])) continue;                         // explicitly self-closing
    if (isClose) {
      if (opens.length === 0) { strays.push(m.index); continue; }
      opens.pop();
    } else opens.push(m.index);
  }
  return { stray: strays.length ? strays[0] : null, strays, opens };
}

for (const rel of FILES) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  const spans = opaqueSpans(src);
  for (const tag of INLINE) {
    /* One pass per tag, tracking depth, so the report can point at the OFFENDING tag rather than
       just reporting that two totals differ. A negative depth (a close with no open) is reported
       at the close; a positive final depth is reported at the last unmatched open. */
    const { stray, strays, opens } = scanTag(src, tag, spans);
    const where = opens.length ? opens[opens.length - 1] : stray;
    const context = where === null ? "" :
      JSON.stringify(src.slice(Math.max(0, where - 120), where + 200));
    assert(`tag-balance: <${tag}> is balanced in ${rel}`,
      strays.length === 0 && opens.length === 0,
      (opens.length
        ? `${opens.length} unclosed <${tag}>; the last opens at offset ${where}. An unclosed inline `
          + `element silently REPARENTS everything after it — that is bq-2195, where six report `
          + `sections ended up inside a <strong>. `
        : "")
      + (strays.length ? `${strays.length} stray </${tag}> closing nothing, first at ${strays[0]}. ` : "")
      + `Context: ${context}`);
  }
}

/* NEGATIVE CONTROL, and it CALLS THE REAL SCAN (fallback review, F8 — it used to reimplement the
   counting, so a broken scan above would still have reported itself detected). */
{
  const broken = `<div id="report"><strong>unclosed<p>after</p></div>`;
  const r1 = scanTag(broken, "strong");
  assert("tag-balance NEGATIVE CONTROL: the REAL scan detects an unclosed <strong> (bq-2195's exact shape)",
    r1.stray === null && r1.opens.length === 1, JSON.stringify(r1));
  const r2 = scanTag(`<p>fine <strong>bold</strong> text</p>`, "strong");
  assert("tag-balance NEGATIVE CONTROL: ...and does NOT fire on balanced markup",
    r2.stray === null && r2.opens.length === 0, JSON.stringify(r2));
  const r3 = scanTag(`<p>text</strong></p>`, "strong");
  assert("tag-balance NEGATIVE CONTROL: ...and catches a stray close with no open",
    r3.stray !== null, JSON.stringify(r3));
}

console.log(`\n${failures === 0 ? "ALL TAG-BALANCE CHECKS PASS" : failures + " TAG-BALANCE FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
