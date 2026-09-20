/* EVERY PRESET PAIR RENDERS — bq-2196.
 *
 * The owner's instruction, in his own words, was "make sure the calculator's working". im-release-
 * edit-r3 took that literally, drove all 288 model × perspective pairs through the app's own entry
 * point, and found `applyPreset()` throwing `RooflineDataError: row 'rubin' declares no 'batch'
 * regime (absent by design ⇒ hard error, memo §4/§6)` on 132 of them.
 *
 * CORRECTED 2026-09-10 (fallback review F8). This header used to end "the rendered DOM stayed
 * complete and correct, so nothing on the page looked wrong — a latent hazard, not a visible
 * defect". That was the pre-diagnosis sentence and it was FALSE, contradicted by the engine comment
 * in its own change. `renderGenChart()` builds its columns inside a `.map()`, so the throw escaped
 * mid-build: the COST-PER-GENERATION CHART RENDERED AS NOTHING — no SVG, no table — on all 132
 * pairs, with the previous scenario's operating-point note left standing above the hole. Measured
 * with the fix reverted: 132 of 288 pairs leave `#chart-gen` empty; with it in place, 0 of 288.
 * bq-2196's row recorded the DOM as complete on the strength of the hero, cost, feasibility and leg
 * rows. Nobody had looked at `#chart-gen`, which is why this file now asserts on it directly.
 *
 * What this asserts, and why each part is here:
 *   · every pair renders with no exception escaping applyPreset() — the whole grid, because a
 *     harness that shrinks its denominator is how this check would go quietly vacuous;
 *   · no page-level error is logged during any render;
 *   · a sample of pairs still produces the margin the ENGINE computes for them, because a render
 *     that throws nothing and shows the wrong number would satisfy the first two on its own.
 *
 * It writes its record where the completion gate reads it. Run: node tests/preset-pairs-cdp.test.mjs
 */
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = join(HERE, "..", "site", "index.html");
/* THE RECORD IS REPO-LOCAL BY DEFAULT (fallback review F18). It used to resolve three levels ABOVE
   the repository root and `mkdirSync(..., {recursive:true})` there — a test creating directories
   outside its own checkout, in a repo that is published publicly and cloned elsewhere. The
   workspace path is now supplied by the caller, the same way APP_TEST_TMP, DUMP_PARITY_HASHES and
   UX_C_MINT are. */
const RECORD = process.env.PRESET_PAIRS_RECORD
  || join(HERE, "artifacts", "preset-pairs.json");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const CHROME = findChrome();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pollActivePort(dir, ms = 20000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) {
    if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; }
    await sleep(100);
  }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 20000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (m) => (m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
};

/* Drive the grid through the app's own entry point — the same call the preset <select>s make, which
   is also how the CDP suites drive it. Each pair is set, applied inside a try/catch, and the hero
   margin is read back. The first stack of each distinct message is kept: a list of 132 identical
   failures is a worse bug report than one with a call site. */
const GRID = `(() => {
  const $ = (id) => document.getElementById(id);
  const ms = $("model-preset"), ps = $("persp-preset");
  const models = [...ms.options].map((o) => o.value);
  const persps = [...ps.options].map((o) => o.value);
  const out = { models: models.length, persps: persps.length, pairs: 0, clean: 0,
                throwing: [], stacks: {}, margins: {}, emptyChart: [], chartMin: Infinity };
  for (const m of models) {
    for (const p of persps) {
      out.pairs += 1;
      ms.value = m; ps.value = p;
      try {
        applyPreset();
        out.clean += 1;
        out.margins[m + "|" + p] = ($("out-margin")?.textContent || "").trim();
      } catch (e) {
        /* fall through to the chart check below: a throwing render is exactly the case whose
           chart was empty, so the chart must be measured on EVERY pair, not only clean ones */
        const msg = String(e && e.message || e).slice(0, 200);
        out.throwing.push({ model: m, persp: p, message: msg });
        if (!out.stacks[msg]) out.stacks[msg] = String(e && e.stack || "").split("\\n").slice(0, 8).join(" | ");
      }
      /* THE NODE NOBODY LOOKED AT (fallback review F8). This finding exists because four elements
         were checked and the fifth was not; asserting only "no exception escaped" would let a
         future regression empty the chart without throwing and still go green. */
      const g = $("chart-gen");
      const chars = g ? g.innerHTML.length : -1;
      out.chartMin = Math.min(out.chartMin, chars);
      if (chars < 500 || !g.querySelector("svg") || g.querySelectorAll("table tr").length < 2) {
        out.emptyChart.push({ model: m, persp: p, chars, svg: !!(g && g.querySelector("svg")),
                              rows: g ? g.querySelectorAll("table tr").length : -1 });
      }
    }
  }
  return out;
})()`;

async function main() {
  assert("the preset-pair harness locates site/index.html", existsSync(PAGE));
  if (!CHROME) { assert("a chromium/chrome binary is on PATH", false, "none found"); return; }
  const userDir = mkdtempSync(join(tmpdir(), "im-preset-pairs-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "file://" + PAGE], { stdio: "ignore" });
  let ws, result = null, consoleErrors = [];
  try {
    const wsUrl = await pageTarget(await pollActivePort(userDir));
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res);
      ws.addEventListener("error", () => rej(new Error("ws error")));
    });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    ws.addEventListener("message", (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.method === "Runtime.exceptionThrown") {
        consoleErrors.push(String(m.params?.exceptionDetails?.exception?.description || "").slice(0, 200));
      }
    });
    await send("Page.enable");
    await send("Page.navigate", { url: "file://" + PAGE });
    for (let t = 0; t < 25000; t += 150) {
      const st = await evalExpr(send, "({ready:document.readyState,margin:(document.getElementById('out-margin')?.textContent||'').trim(),fn:typeof applyPreset})");
      if (st.ready === "complete" && st.fn === "function" && st.margin) break;
      await sleep(150);
    }
    result = await evalExpr(send, GRID);
  } catch (e) {
    assert("the harness drove the grid", false, String(e.message).slice(0, 300));
  } finally {
    try { ws?.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
  if (!result) return;

  assert(`the grid is the whole grid — ${result.models} models × ${result.persps} perspectives`,
    result.pairs === result.models * result.persps && result.pairs >= 288,
    `${result.pairs} pairs from ${result.models}×${result.persps}`);
  /* A ZERO-PAIR GRID MUST NOT SATISFY THESE. Found while proving the chart assertion non-vacuous:
     a broken engine made applyPreset unavailable, the grid returned 0 pairs, and both assertions
     below passed over an empty set. The whole-grid assertion above does catch it, but an assertion
     that is vacuously true on the failure it exists to detect is the pattern this leg is about. */
  assert(`every preset pair renders without an exception escaping applyPreset() (${result.clean}/${result.pairs})`,
    result.pairs >= 288 && result.throwing.length === 0,
    result.throwing.length
      ? `${result.throwing.length} throw; first: ${JSON.stringify(result.throwing[0])}; ` +
        `stack: ${Object.values(result.stacks)[0] || "(none)"}`
      : "");
  assert("no page-level exception was logged during the sweep", consoleErrors.length === 0,
    JSON.stringify(consoleErrors.slice(0, 2)));
  assert(`#chart-gen renders a full cost-per-generation chart on EVERY pair (smallest ${result.chartMin} chars)`,
    result.pairs >= 288 && Number.isFinite(result.chartMin) && result.emptyChart.length === 0,
    `${result.emptyChart.length} pair(s) render an empty or partial chart: ` +
    JSON.stringify(result.emptyChart.slice(0, 5)));

  /* ENGINE GROUND TRUTH. These five pairs were spot-checked by hand in bq-2196's own repro, against
     the engine rather than against a previous render, and they are re-checked here so that "renders
     clean" cannot come to mean "renders clean and wrong". */
  /* im-vet-model-estimates (2026-09-19): gpt/gptpro-r3 95 -> 92, and ONLY that entry. GPT-5.6 Sol's
     list price was corrected from $5/$30 to the $4/$20 OpenAI charges, so this pair's engine value
     moved with it. Re-checked against the ENGINE the way the original five were, not against a
     render: opus/median 67.9968, sonnet/median 65.0735, grok/xaiopp 18.6704, gpt/gptpro-r3
     92.4960, opus/x90-v1 91.6949 — four unchanged, one moved, and the page renders 92 for it too,
     so page and engine agree and it is the pin that was stale. */
  const SPOT = [["opus", "median", 68], ["sonnet", "median", 65], ["grok", "xaiopp", 19],
                ["gpt", "gptpro-r3", 92], ["opus", "x90-v1", 92]];
  const spot_checks = [];
  for (const [m, p, expected] of SPOT) {
    const shown = result.margins[m + "|" + p];
    const rendered = shown === undefined ? null : Number((/-?\d+(?:\.\d+)?/.exec(shown) || [])[0]);
    spot_checks.push({ model: m, persp: p, expected, rendered, shown: shown ?? null });
    assert(`${m}/${p} renders the engine's margin (${expected}%)`, rendered === expected,
      `page shows ${JSON.stringify(shown)}`);
  }

  mkdirSync(dirname(RECORD), { recursive: true });
  writeFileSync(RECORD, JSON.stringify({
    ran_at: new Date().toISOString(),
    bq: "bq-2196",
    pairs: result.pairs, clean: result.clean, throws: result.throwing.length,
    models: result.models, perspectives: result.persps,
    throwing: result.throwing.slice(0, 12), stacks: result.stacks,
    console_errors: consoleErrors.slice(0, 5),
    spot_checks,
  }, null, 2) + "\n");
  console.log(`  · record written to ${RECORD}`);
}
await main();
console.log(failures ? `\n${failures} PRESET-PAIR FAILURE(S)` : "\nALL PRESET PAIRS RENDER CLEAN");
process.exit(failures ? 1 : 0);
