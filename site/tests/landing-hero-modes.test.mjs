// R2 RELEASE TEST (assembly-notes R-4b: BOTH landing-hero branches implemented and
// tested): drives the real app over CDP — branch B (policy-labeled, the SHIPPED
// default per the owner pick 2026-07-23 q-im-landing-hero-pick) asserted live;
// branch A (suppress) via the window.__LANDING_HERO_MODE_TEST__ hook (console/
// tests only, never link-encoded). Also covers scenario-surface behavior +
// identity-strip gating.
// Run: node site/tests/landing-hero-modes.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "index.html");
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("no DevToolsActivePort");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = list.find(x => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => {
    let msg; try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

async function runPage(chrome, url, probeExpr, preScript) {
  const userDir = mkdtempSync(join(tmpdir(), "im-hero-cdp-"));
  const proc = spawn(chrome, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank",
  ], { stdio: "ignore" });
  let ws;
  try {
    const port = await pollActivePort(userDir);
    ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
    const send = cdpClient(ws);
    await send("Page.enable");
    if (preScript) await send("Page.addScriptToEvaluateOnNewDocument", { source: preScript });
    await send("Page.navigate", { url });
    for (let t = 0; t < 15000; t += 200) {
      const ready = await evalExpr(send, "typeof updateTiles === 'function' && !!document.getElementById('out-margin')").catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(700); // let the debounced first render settle
    return JSON.parse(await evalExpr(send, probeExpr));
  } finally {
    try { ws && ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

const PROBE_A = `(() => {
  const r = {};
  const note = () => document.getElementById('out-margin-note').textContent;
  r.mode = LANDING_HERO_MODE;
  r.margin = document.getElementById('out-margin').textContent;
  r.cost = document.getElementById('out-cost').textContent;
  r.price = document.getElementById('out-price').textContent;
  r.suppressed = /HERO SUPPRESSED/.test(note());
  r.bandInNote = /sampled 3-point loaded-bytes policy sensitivity/.test(note());
  const chip = document.getElementById('out-fleet-renderable').textContent;
  r.statusVector = /fleet status — weightCapacity:/.test(chip) && /placementVerified: false/.test(chip);
  r.policyClauseInChip = /loaded-bytes planning policy/.test(chip);
  const strip = document.getElementById('identity-strip').textContent;
  r.stripPolicyLabeled = /policy-labeled scenario output/.test(strip);
  r.stripNotBareCentral = !/central scenario — clean default/.test(strip);
  r.feasWidths = /@ solved width/.test(document.getElementById('out-feas-note').textContent);
  // scenario surface: nudge a field off the preset -> number must render, welded.
  // row 499: the page now OPENS on a named estimate preset, so this half of the probe selects the
  // central scenario first — from here down it runs on exactly the state it ran on before row 499
  // (central + one nudged field, then the 5T derivation). The landing-state assertions above are
  // unchanged and now describe the new opening state, which is the point of the ruling.
  document.getElementById('persp-preset').value = 'median'; applyPreset();
  /* ...and the declared default-fleet identity with it. The page now opens on a preset that OWNS
     its blend, so the app's fleet identity at page open is "preset" (correct for that preset), and
     the existing non-resetting rule in applyIdentitiesAfterPresetApplication does not restore the
     named default when a later selection stops owning the blend. The state this half of the probe
     is about is "central scenario, declared default fleet", so the probe restores that identity
     explicitly — the same state a visitor reaches by picking the default fleet in its selector.
     The rule itself is PRE-EXISTING (it behaves identically on master when a reader selects the
     strategic-partner lens and then returns to the central scenario) and is flagged to the review
     path in the row-499 delta manifest rather than changed here. */
  FLEET_ID = DEFAULT_FLEET_ID;
  S.util = S.util + 1; renderAll();
  r.afterEditMargin = document.getElementById('out-margin').textContent;
  r.afterEditShows = /≈\\d+%/.test(r.afterEditMargin);
  r.afterEditBand = /sampled 3-point loaded-bytes policy sensitivity/.test(note());
  r.afterEditModified = /MODIFIED/.test(note());
  // FA (memo J-9): the strict branch is UNREACHABLE on the clean landing at the revised
  // size (nothing is excluded), so the suppressed-hero DOM formatter is probed DIRECTLY
  // against a 5T-derived state — real derivation, real formatter, no reachability claim.
  /* row 499: the page now OPENS on a named estimate preset whose fleet is the preset's own explicit
     blend, so the derived-default membership is not what renders there and the exclusion clause is
     not applicable — welding it anyway would ship a false explanation. The property under test is
     about the DERIVED DEFAULT fleet, so the probe selects the central scenario first and then does
     the 5T derivation exactly as before. Everything after this line is unchanged. */
  S.total = 5000; afterScenarioAxisEdit("precision");
  renderSuppressedHero(appWorkload(S));
  r.suppressed5T = /HERO SUPPRESSED/.test(note());
  r.failingLegNamed5T = /H100/.test(note());
  r.exclusionClause5T = /excluded from the default/.test(note());
  r.margin5TSuppressed = document.getElementById('out-margin').textContent;
  return JSON.stringify(r);
})()`;

const PROBE_B = `(() => {
  const r = {};
  const note = () => document.getElementById('out-margin-note').textContent;
  r.mode = LANDING_HERO_MODE;
  r.margin = document.getElementById('out-margin').textContent;
  /* bq-3316 M2: the identity now sits in the status label IMMEDIATELY after the value node, inside the
     same tile — the crop unit is the value + its label, not the value node alone. */
  { const v = document.getElementById('out-margin'), st = document.getElementById('out-margin-status');
    r.marginStatus = st ? st.textContent : null;
    r.statusAdjacent = !!(v && st && v.nextElementSibling === st && v.closest('.tile') === st.closest('.tile')); }
  r.policyLabeled = /POLICY-LABELED SCENARIO OUTPUT/.test(note());
  r.exclusionAbsent = !/excluded from the default/.test(note());
  r.neverCentral = /never|central/.test(note());
  r.bandInNote = /sampled 3-point loaded-bytes policy sensitivity/.test(note());
  r.costShown = document.getElementById('out-cost').textContent !== '—';
  return JSON.stringify(r);
})()`;

const chrome = findChrome();
if (!chrome) { console.log("FAIL no chrome"); process.exit(1); }
const url = "file://" + SITE;

const a = await runPage(chrome, url, PROBE_A, "window.__LANDING_HERO_MODE_TEST__ = 'suppress';");
assert("A: suppress branch active via the test hook", a.mode === "suppress", a.mode);
// FA (memo J-9): at the revised flagship size the derivation excludes nothing, so the
// strict branch has nothing to suppress — the clean landing RENDERS under mode A too.
assert("A (FA): clean landing RENDERS at the revised size (no exclusion to suppress on)", /≈\d+%/.test(a.margin), a.margin);
assert("A (FA): no HERO SUPPRESSED lead on the clean landing", !a.suppressed);
assert("A (FA): cost/price render on the clean landing", a.cost !== "—" && a.price !== "—", a.cost + "/" + a.price);
assert("A: 3-point band receipt present", a.bandInNote);
assert("A: five-status vector emitted on fleet chip", a.statusVector);
assert("A: policy clause welded in fleet chip", a.policyClauseInChip);
assert("A: identity strip policy-labeled epistemic chip", a.stripPolicyLabeled);
assert("A: strip does not claim bare central", a.stripNotBareCentral);
assert("A: feasibility tile carries solved widths", a.feasWidths);
assert("A: edited scenario shows the number", a.afterEditShows, a.afterEditMargin);
assert("A: edited scenario keeps the band receipt", a.afterEditBand);
assert("A: edited scenario labeled MODIFIED", a.afterEditModified);
assert("A @5T (formatter probe): HERO SUPPRESSED lead renders", a.suppressed5T);
assert("A @5T (formatter probe): failing leg named from engine output", a.failingLegNamed5T);
assert("A @5T (formatter probe): the membership exclusion clause is the cause line", a.exclusionClause5T);
assert("A @5T (formatter probe): margin suppressed to —", a.margin5TSuppressed === "—", a.margin5TSuppressed);

const b = await runPage(chrome, url, PROBE_B);
assert("B: policy-labeled is the SHIPPED default (owner pick)", b.mode === "policy-labeled", b.mode);
assert("B: landing margin displays", /≈\d+%/.test(b.margin), b.margin);
assert("B: POLICY-LABELED identity inline", b.policyLabeled);
assert("B (FA): NO exclusion clause on the revised-size clean landing (the membership is complete; the 5T exclusion story lives on the size case)", b.exclusionAbsent);
/* bq-3316 (2026-09-25; GPT Pro 09-12 finding 1, accepted: the qualifier "becomes a conspicuous normal-sized
   status label"). The D-3b crop bar is kept at the level it exists for — a crop of the number carries the
   identity — by requiring the label to be the value's NEXT SIBLING in the same tile, and the value to be the
   number alone. A missing, emptied, detached or relocated label fails; so does a qualifier left in the value. */
assert("B (R3/bq-3316): the value token's own status label carries the policy-labeled identity, directly under the number (crop bar, memo D-3b)",
  /policy-labeled scenario/.test(b.marginStatus || "") && b.statusAdjacent, JSON.stringify({ status: b.marginStatus, adjacent: b.statusAdjacent }));
assert("B (bq-3316): the value node is the number alone", /^≈\d+%$/.test(b.margin), b.margin);
assert("B: band receipt present", b.bandInNote);
assert("B: cost/price render", b.costShown);

console.log(failures ? `\n${failures} FAILURES` : "\nALL HERO-BRANCH PROBES PASS");
process.exit(failures ? 1 : 0);
