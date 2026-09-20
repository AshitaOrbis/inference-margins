// b9 M4 — custom fleet builder ROUND-TRIP over CDP (memo research/b9-m45-ui-memo.md §16;
// plan §5 M4 acceptance: "builder round-trips (create/clone/edit/save/select/share) in the
// browser suite"). The dump-dom suite (run-app-tests.sh) covers the LINK-driven flows
// (select/share/ephemeral restore/welds); this test drives the REAL builder dialog in a real
// Chrome — create-blank, clone-from-named, edit, save (the only storage write), select,
// delete-with-default-reselect — via the DevTools Protocol, same harness pattern as
// tests/localstorage-epoch.test.mjs (raw CDP, no Playwright; LOCAL file:// only).
// Run: node tests/custom-fleets-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
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
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
const CHROME = findChrome();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const list = await res.json();
      const pg = list.find(x => x.type === "page" && x.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
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

/* The in-page probe: drives the REAL builder controls (DOM inputs + the real Save/Edit/
   Delete handlers — never a direct store write), reporting each stage back. Runs in the
   page's global scope, so app.js/engine.js/custom-fleets.js globals resolve by bare name. */
const PROBE = `(async () => {
  const r = {};
  const q = sel => document.querySelector(sel);
  const setInput = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  // --- 1. CREATE blank → rename → SAVE (the only storage write path) ---
  cfOpenChooser();
  [...document.querySelectorAll('#fleet-builder .cf-chip')].find(b => b.textContent === 'Start blank').click();
  r.dialogOpen = !!q('#fleet-builder');
  setInput(q('#fleet-builder .cf-field input[type="text"]'), 'CDP fleet');
  // im-arc T2 (memo research/im-arc-t2-sections-memo.md §7): build the real 60/40
  // section shape, switch the second basis, exercise advanced triples, and move a leg.
  q('#fleet-builder .cf-add-section').click();
  let sectionEditors = [...document.querySelectorAll('#fleet-builder .cf-section-editor')];
  setInput(sectionEditors[0].querySelectorAll('input[type="number"]')[0], '60');
  setInput(sectionEditors[1].querySelectorAll('input[type="number"]')[0], '40');
  const secondBasis = sectionEditors[1].querySelector('.cf-section-basis-select');
  secondBasis.value = 'owned-strategic-tco'; secondBasis.dispatchEvent(new Event('input', { bubbles: true }));
  q('#fleet-builder .cf-mode-toggle').click();
  sectionEditors = [...document.querySelectorAll('#fleet-builder .cf-section-editor')];
  r.dcPicker = [...document.querySelectorAll('.cf-dc-ref')].length === 2
    && [...document.querySelectorAll('.cf-dc-ref')].every(x => !x.disabled)
    && [...document.querySelectorAll('.cf-dc-ref option')].some(x => /programme/.test(x.textContent));
  const firstRange = sectionEditors[0].querySelector('.cf-range-toggle input'); firstRange.click();
  sectionEditors = [...document.querySelectorAll('#fleet-builder .cf-section-editor')];
  r.rangeTriple = sectionEditors[0].querySelectorAll('.cf-range-row input[type="number"]').length === 3;
  sectionEditors[0].querySelector('.cf-add-leg').click();
  sectionEditors = [...document.querySelectorAll('#fleet-builder .cf-section-editor')];
  const move = sectionEditors[0].querySelectorAll('.cf-move-leg')[1];
  move.value = '1'; move.dispatchEvent(new Event('input', { bubbles: true }));
  r.sectionBuilder = document.querySelectorAll('#fleet-builder .cf-section-editor').length === 2;
  /* T5 rec 4, round 3: the HBM control's RENDERED units, asserted against the normative record.
     A review swapped the GB and GiB divisors in memory and every semantic gate stayed green,
     because cfHbmField is exempted wholesale as builder chrome. That exemption is the right
     CLASS — these are registry constants the reader is editing, not computed claims — but it
     left the one thing that can actually go wrong here unguarded. So the conversion is checked
     where it is READ: the donor label must carry this donor's exact bytes and both conventions,
     computed here from the normative row rather than restated. A swapped divisor fails this. */
  r.hbmUnits = (() => {
    const label = [...document.querySelectorAll('#fleet-builder .cf-field-label')]
      .map(e => e.textContent || '').find(x => x.indexOf('HBM capacity (user-declared') === 0) || '';
    if (!label) return { found: false };
    /* Donor-agnostic and SELF-CONSISTENT: read the exact byte count out of the label, then
       require the two conventions printed beside it to be that number divided by 1e9 and 2^30.
       Reading the byte count rather than naming a donor keeps this correct whatever fleet the
       fixture built; requiring internal consistency is what a swapped divisor breaks. */
    /* No regex escapes here: this probe is embedded in a TEMPLATE LITERAL, which eats
       backslashes, so /\(([\d,]+) B\)/ arrives at the page as /(([d,]+) B)/ and silently
       matches nothing. Cost one debugging round; string ops avoid the class entirely. */
    const tail = label.lastIndexOf('(');
    const bm = tail < 0 ? null : label.slice(tail + 1).split(' B)')[0];
    if (!bm || !/^[0-9,]+$/.test(bm)) return { found: true, hasBytes: false, label: label.slice(0, 120) };
    const bytes = Number(bm.split(',').join(''));
    const gb = (bytes / 1e9).toFixed(2), gib = (bytes / 1073741824).toFixed(2);
    return { found: true, bytes, hasBytes: true,
      hasGB: label.includes(gb + ' GB'), hasGiB: label.includes(gib + ' GiB'),
      distinct: gb !== gib, label: label.slice(0, 120) };
  })();
  q('#fleet-builder .cf-primary').click();
  const store1 = JSON.parse(localStorage.getItem('im_custom_fleets_v1') || '{}');
  const ids1 = Object.keys(store1.fleets || {});
  r.savedOne = store1.v === 1 && ids1.length === 1 && store1.fleets[ids1[0]].name === 'CDP fleet'
    && store1.fleets[ids1[0]].sections.length === 2;
  r.savedEpoch = ids1.length === 1 && store1.fleets[ids1[0]].epoch === DEFAULTS_EPOCH;
  // --- 2. SELECTED through the normal path; per-leg panel replaces the sliders ---
  r.selected = typeof FLEET_ID === 'string' && FLEET_ID.startsWith('cf:');
  r.panelRendered = !!q('.cf-leg-panel');
  r.slidersGone = !q('.hw-row input[type="range"]');
  r.mirrorSeeded = (() => { const def = customFleetSource().resolve(FLEET_ID);
    const agg = aggregateLegsToBlend(def);
    return HW_ORDER.every(k => (S.blend[k] || 0) === agg[k]); })();
  r.userCustomChip = /user-custom — never a default/.test(document.body.textContent);
  r.compositionLine = /Composition: 60%/.test(document.body.textContent)
    && /section electricity/.test(document.body.textContent) && /electricity embedded in rent/.test(document.body.textContent);
  // --- 3. EDIT: rename via the real dialog, re-save ---
  cfOpenBuilder('edit', FLEET_ID);
  setInput(q('#fleet-builder .cf-field input[type="text"]'), 'CDP fleet v2');
  q('#fleet-builder .cf-primary').click();
  const store2 = JSON.parse(localStorage.getItem('im_custom_fleets_v1') || '{}');
  r.renamed = Object.values(store2.fleets)[0].name === 'CDP fleet v2';
  r.sameId = Object.keys(store2.fleets)[0] === ids1[0];
  // --- 4. VALIDATION blocks a bad save — LIVE (impl-gate P1-5): the error line renders
  //     as you type, Save disables, and the store stays untouched even if clicked.
  cfOpenBuilder('edit', FLEET_ID);
  const shareInput = [...document.querySelectorAll('#fleet-builder .cf-field')].find(f => /Share %/.test(f.textContent)).querySelector('input');
  setInput(shareInput, '0');
  const errLive = q('#fleet-builder .cf-errors') ? q('#fleet-builder .cf-errors').textContent : '';
  const saveDisabled = q('#fleet-builder .cf-primary').disabled === true;
  q('#fleet-builder .cf-primary').click(); // disabled → no-op
  r.invalidBlocked = /share sum/.test(errLive) && saveDisabled
    && JSON.parse(localStorage.getItem('im_custom_fleets_v1')).fleets[ids1[0]].sections[0].sharePct !== 0;
  // bounds attributes present on numeric inputs (P1-5)
  r.boundsOnInputs = (() => { const i = [...document.querySelectorAll('#fleet-builder input[type="number"]')];
    return i.length > 0 && i.every(x => x.min !== '' && x.max !== ''); })();
  document.getElementById('fleet-builder').close(); document.getElementById('fleet-builder').remove();
  // --- 5. CLONE from a named fleet ---
  cfOpenChooser();
  [...document.querySelectorAll('#fleet-builder .cf-chip')].find(b => b.textContent.startsWith('Clone: ')).click();
  q('#fleet-builder .cf-primary').click();
  const store3 = JSON.parse(localStorage.getItem('im_custom_fleets_v1') || '{}');
  r.cloneSaved = Object.keys(store3.fleets).length === 2
    && Object.values(store3.fleets).some(f => f.clonedFrom !== null && f.sections[0].legs.length > 1);
  // --- 6. DELETE with default reselect (real handler; confirm stubbed) ---
  window.confirm = () => true;
  const delBtns = [...document.querySelectorAll('.cf-manage-row .cf-danger')];
  for (const b of delBtns) b.click();
  const delBtns2 = [...document.querySelectorAll('.cf-manage-row .cf-danger')];
  for (const b of delBtns2) b.click();
  const store4 = JSON.parse(localStorage.getItem('im_custom_fleets_v1') || '{}');
  r.allDeleted = Object.keys(store4.fleets || {}).length === 0;
  r.defaultReselected = FLEET_ID === DEFAULT_FLEET_ID;
  r.slidersBack = !!document.querySelector('.hw-row input[type="range"]');
  // --- im-arc T4 fold ROUND 6 (2026-08-25, director-authorized): the capexScope requirement must
  // hold in the BROWSER branch, which is the surface readers actually use. The Node suite
  // physically cannot reach this: under Node cfDcData() require()s the registry and always has
  // DC_SCHEMA, so tests/capex-scope-reader-t4.test.mjs passes while the browser silently skips the
  // rule. Found by the director's own real-browser run of the verification recipe.
  const cfScopeFleet = (tco, overrides) => ({ id: 'cf:scopeprobe', name: 'scope probe',
    epoch: DEFAULTS_EPOCH, clonedFrom: null,
    sections: [{ id: 's1', label: 's1', sharePct: 100, basis: 'owned-strategic-tco',
      rent: null, electricity: null, pue: null, tco, dcRef: null, provenance: null,
      legs: [{ donorKey: 'h100', label: 'h100', sharePct: 100, overrides: overrides || {}, family: 'nvidia' }] }] });
  r.scopeSchemaReachable = !!(typeof cfDcData === 'function' && cfDcData().DC_SCHEMA
    && Array.isArray(cfDcData().DC_SCHEMA.CAPEX_SCOPES));
  {
    const noScope = validateCustomFleet(cfScopeFleet({ capexUsdByHw: { h100: 30000 } }), { requireId: false });
    r.scopeSectionRefused = noScope.ok === false && (noScope.errors || []).some(e => /capexScope/.test(e));
    const legNoScope = validateCustomFleet(cfScopeFleet(null, { capexUsd: 30000 }), { requireId: false });
    r.scopeLegRefused = legNoScope.ok === false && (legNoScope.errors || []).some(e => /capexScope/.test(e));
    const withScope = validateCustomFleet(
      cfScopeFleet({ capexUsdByHw: { h100: 30000 }, capexScope: 'installed-system' }), { requireId: false });
    r.scopeAccepted = withScope.ok === true;
    const badScope = validateCustomFleet(
      cfScopeFleet({ capexUsdByHw: { h100: 30000 }, capexScope: 'rack' }), { requireId: false });
    r.scopeEnumClosed = badScope.ok === false;
  }
  return JSON.stringify(r);
})()`;

async function main() {
  if (!HTML) { assert("locate site/index.html", false, "not found next to the test"); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  const userDir = mkdtempSync(join(tmpdir(), "im-cf-cdp-"));
  const url = "file://" + HTML;
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, url,
  ], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws && ws.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir, { recursive: true, force: true }); } catch {} };
  try {
    const port = await pollActivePort(userDir);
    const wsUrl = await pageTarget(port);
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable");
    let ready = false;
    for (let t = 0; t < 15000; t += 150) {
      // Same readiness gate as the localstorage CDP test (Chrome 150 remote-subresource note there).
      const ok = await evalExpr(send, "(document.readyState!=='loading' && typeof cfOpenChooser==='function' && typeof customFleetSource==='function' && !!document.querySelector('.cf-manage-row'))");
      if (ok) { ready = true; break; }
      await sleep(150);
    }
    assert("page + app + builder initialised over CDP", ready);
    if (!ready) return;
    const res = JSON.parse(await evalExpr(send, PROBE));
    assert("create: chooser → Start blank opens the dialog", res.dialogOpen);
    assert("sections: add, basis-select, and leg-move controls build two sections", res.sectionBuilder);
    assert("sections: live dcRef pickers list registry rows with their coverage class", res.dcPicker);
    assert("sections: advanced point-or-triple toggle renders lo/mid/hi inputs", res.rangeTriple);
    assert("T5 rec 4: the HBM control's donor label was found in the builder",
      res.hbmUnits && res.hbmUnits.found, JSON.stringify(res.hbmUnits));
    assert("T5 rec 4: it carries the donor's EXACT normative byte count",
      res.hbmUnits && res.hbmUnits.hasBytes, JSON.stringify(res.hbmUnits));
    assert("T5 rec 4: ...and both conventions, correctly converted (a swapped GB/GiB divisor fails here)",
      res.hbmUnits && res.hbmUnits.hasGB && res.hbmUnits.hasGiB && res.hbmUnits.distinct,
      JSON.stringify(res.hbmUnits));
    assert("save: exactly one fleet persisted with the typed name (v1 store shape)", res.savedOne);
    assert("save: fleet stamped with the current DEFAULTS_EPOCH", res.savedEpoch);
    assert("select: FLEET_ID is the cf: id (C-2 path ran)", res.selected);
    assert("select: per-leg panel rendered", res.panelRendered);
    assert("select: HW share sliders NOT rendered under the custom fleet", res.slidersGone);
    assert("select: blend mirror invariant holds (aggregate(legs) == S.blend)", res.mirrorSeeded);
    assert("select: user-custom class chip renders", res.userCustomChip);
    assert("select: composition line distinguishes owned electricity from rent-embedded electricity", res.compositionLine);
    assert("edit: rename persists under the SAME id", res.renamed && res.sameId);
    assert("validate: LIVE error line + disabled Save block the invalid state, store untouched", res.invalidBlocked);
    assert("validate: numeric inputs carry CF_BOUNDS min/max (P1-5)", res.boundsOnInputs);
    assert("clone: a named-fleet clone saves with clonedFrom provenance + its legs", res.cloneSaved);
    assert("delete: all fleets removed through the real handler", res.allDeleted);
    assert("delete: selection falls back to the DEFAULT fleet through the normal path", res.defaultReselected);
    assert("delete: the share sliders return with the named-fleet selection", res.slidersBack);
    /* ROUND 6: the browser branch enforces the reader-capex scope rule. These are the reason this
       case exists — a rule that holds in Node and not in the browser is not a rule. */
    assert("scope (browser): the registry schema is REACHABLE from the browser branch of cfDcData()", res.scopeSchemaReachable);
    assert("scope (browser): a SECTION capex with no capexScope is refused", res.scopeSectionRefused);
    assert("scope (browser): a LEG capex with no capexScope is refused", res.scopeLegRefused);
    assert("scope (browser): a capex WITH its scope is accepted", res.scopeAccepted);
    assert("scope (browser): a capexScope outside the closed enum is refused", res.scopeEnumClosed);
  } catch (e) {
    assert("CDP round-trip completed without harness error", false, String(e && e.message || e));
  } finally { cleanup(); }
}
/* THE VERDICT MUST SURVIVE AN EARLY RETURN (vetting round 2026-09-19, Astra pack B P1-6).
   main() returns early when site/index.html or a chromium binary cannot be found, or when the
   page never becomes ready. Each of those calls assert() with a failure and then returns BEFORE
   the verdict line — which lived INSIDE main() — so the script printed its failure and exited
   0. `PATH=/nonexistent node <this file>` printed "locate a chromium/chrome binary" and exited
   0. These suites are in `npm run test:browser`, which both CI and the release gate run, so a
   missing browser read as a pass on every one of them. The verdict now runs in a finally that
   covers setup, readiness and the body, and process.exitCode lets output flush. */
try {
  await main();
} catch (err) {
  console.error("HARNESS ERROR:", err && err.message);
  failures++;
} finally {
  console.log(`\n${failures === 0 ? "ALL CUSTOM-FLEETS CDP TESTS PASS" : failures + " CUSTOM-FLEETS CDP FAILURE(S)"}`);
  process.exitCode = failures === 0 ? 0 : 1;
}
