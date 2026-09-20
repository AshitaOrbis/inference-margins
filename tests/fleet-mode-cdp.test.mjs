// im-arc T3 — real-browser fleet mode + basic/advanced responsive contract.
// Same raw-CDP/file:// harness pattern as custom-fleets-cdp.test.mjs; no network.
// Run: node tests/fleet-mode-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
let failures = 0;
const assert = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : " — " + detail}`);
  if (!condition) failures++;
};
function findChrome() {
  for (const command of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${command}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function activePort(directory, timeout = 15000) {
  const file = join(directory, "DevToolsActivePort");
  for (let elapsed = 0; elapsed < timeout; elapsed += 100) {
    if (existsSync(file)) { const port = readFileSync(file, "utf8").split("\n")[0].trim(); if (port) return port; }
    await sleep(100);
  }
  throw new Error("Chrome did not expose DevToolsActivePort");
}
async function pageTarget(port, timeout = 15000) {
  for (let elapsed = 0; elapsed < timeout; elapsed += 150) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("No page target");
}
function client(socket) {
  let id = 0; const pending = new Map();
  socket.addEventListener("message", (event) => {
    let message; try { message = JSON.parse(event.data); } catch { return; }
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, (message) => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result));
    socket.send(JSON.stringify({ id: callId, method, params }));
  });
}
async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error("page eval failed: " + JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

const RESPONSIVE_PROBE = `(() => {
  const sections = [...document.querySelectorAll('.ctl-section')];
  return {
    sectionCount: sections.length,
    everySectionTiered: sections.length === SECTIONS.filter(s => !s.showIf || s.showIf(S)).length
      && sections.every(section => section.querySelector('.ctl-advanced > summary')?.textContent === 'Advanced'),
    basicAtMostFour: SECTIONS.every(section => section.params.filter(p => p.tier === 'basic').length <= 4),
  };
})()`;

const FLEET_PROBE = `(async () => {
  const result = {};
  const callerAuthoredSections = sections => (sections || []).map(section => {
    const { fallbackReceipts, shareRounding, ...authored } = section;
    return authored;
  });
  const buttons = [...document.querySelectorAll('.fleet-mode-button')];
  result.genericDefault = buttons.length === 2 && buttons[0].getAttribute('aria-pressed') === 'true'
    && /everyone pays the US cost/.test(document.querySelector('.fleet-mode-note').textContent);
  buttons[1].click();
  const dialog = document.querySelector('#fleet-dc-composer');
  result.toggleOpened = !!dialog;
  const rows = [...dialog.querySelectorAll('.cf-dc-row input[type="checkbox"]')];
  result.offeredRowIds = rows.map(input => input.value);
  /* im-arc T4 fold (2026-08-24): the offer list gained the Anthropic-wide Trainium2 floor and the
     two TPU component observations, so "the first two rows" is no longer one composing row plus
     one that does not — it is two Trainium rows, neither of which composes on this blend. The pair
     is now selected BY NAME for the property under test: the TPU commitment carries tpu7 (40% of
     the gptpro-r3 blend) and composes; Rainier carries trn2, which the blend does not, so it
     composes nothing and the page must SAY SO rather than drop it silently. */
  const T4_COMPOSING = 'anthropic-tpu-commitment', T4_DROPPED = 'anthropic-rainier-trainium';
  result.selectedRowIds = [T4_COMPOSING, T4_DROPPED];
  rows.filter(input => result.selectedRowIds.includes(input.value)).forEach(input => { input.checked = true; });
  dialog.querySelector('.cf-compose-dc').click();
  const fleet = customFleetSource().resolve(FLEET_ID);
  /* im-arc T3 FIX-3 (2026-08-23), item C3: EXECUTED truth, not the build leg's blind
     expectation. Both offered Anthropic rows are programme rows; only the TPU row's
     accelerator appears in the opus gptpro-r3 blend, so the composer's count partition
     gives the Trainium row an empty allocation and it composes to no section. The page
     must SAY SO rather than drop it silently. */
  result.dcSectionRefs = (fleet?.sections || []).filter(section => section.dcRef).map(section => section.dcRef);
  result.coverage = document.querySelector('#fleet-coverage-line')?.textContent || '';
  const droppedRowId = result.selectedRowIds.find(id => !result.dcSectionRefs.includes(id)) || null;
  result.droppedRowId = droppedRowId;
  result.oneRowComposedAndTheOtherDisclosed = result.dcSectionRefs.length === 1
    && !!droppedRowId && result.coverage.includes(droppedRowId);
  /* The page line must be the pure engine expression, evaluated in-page — not a
     separately formatted copy of it. */
  const engineSentence = coverageSentenceParts(
    coverageForFleetSections(fleet?.sections || [], currentModel().id)).sentence;
  result.engineSentence = engineSentence;
  /* im-arc T4 fold (2026-08-24) [F3]: the partition is named-site serving evidence /
     programme-type evidence / generic fill, and the SKU/workload count-backed share renders as a
     subordinate line that is explicitly NON-ADDITIVE — so the three ADDITIVE parts are what must
     sum to 100, and the band is 0.05 x their count, computed, never the literal 0.15. */
  const printed = [...result.coverage.matchAll(/(\\d+(?:\\.\\d+)?)% (?:named-site serving evidence|programme-type evidence|generic fill)/g)]
    .map(match => Number(match[1]));
  result.printed = printed;
  const subordinateRendered = /SKU\\/workload count-backed: \\d+(\\.\\d)?% \\(non-additive\\)/.test(result.coverage);
  result.subordinateRendered = subordinateRendered;
  result.coverageRendered = result.coverage.replace(/\\s+/g, " ").includes(engineSentence.replace(/\\s+/g, " "))
    && /^\\d+(\\.\\d)?% named-site serving evidence · \\d+(\\.\\d)?% programme-type evidence · \\d+(\\.\\d)?% generic fill — share of the MODELED fleet/.test(result.coverage)
    && printed.length === 3 && subordinateRendered
    && Math.abs(printed.reduce((total, value) => total + value, 0) - 100) <= 0.05 * printed.length;
  const token = encodeScenario(S, currentModel().id, currentPersp().id, resolvedTraffic(), null,
    { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK });
  const decoded = decodeScenario(token);
  result.permalink = token.startsWith('v7.') && decoded?._meta?.fleet?.custom?.sections?.length === fleet.sections.length
    && JSON.stringify(callerAuthoredSections(decoded._meta.fleet.custom.sections))
      === JSON.stringify(callerAuthoredSections(fleet.sections));
  result.advancedPressed = document.querySelectorAll('.fleet-mode-button')[1].getAttribute('aria-pressed') === 'true';
  return result;
})()`;

async function main() {
  const chrome = findChrome();
  if (!HTML) { assert("T3-CDP-0 site index exists", false); return; }
  if (!chrome) { assert("T3-CDP-0 Chrome binary exists", false); return; }
  const directory = mkdtempSync(join(tmpdir(), "im-t3-cdp-"));
  const proc = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + directory, "file://" + HTML],
  { stdio: "ignore" });
  let socket;
  const cleanup = () => { try { socket?.close(); } catch {} try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(directory, { recursive: true, force: true }); } catch {} };
  try {
    const port = await activePort(directory), url = await pageTarget(port);
    socket = new WebSocket(url);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve); socket.addEventListener("error", reject); });
    const send = client(socket); await send("Runtime.enable");
    let ready = false;
    for (let elapsed = 0; elapsed < 15000; elapsed += 150) {
      if (await evaluate(send, "document.readyState !== 'loading' && typeof cfOpenDcComposer === 'function' && !!document.querySelector('.fleet-mode-toggle')")) { ready = true; break; }
      await sleep(150);
    }
    assert("T3-CDP-1 page and fleet-mode app initialize", ready);
    if (!ready) return;
    await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
    const wide = await evaluate(send, RESPONSIVE_PROBE);
    assert("T3-CDP-2 every visible box has Basic controls and an Advanced expander at 1400px",
      wide.everySectionTiered && wide.basicAtMostFour, JSON.stringify(wide));
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const narrow = await evaluate(send, RESPONSIVE_PROBE);
    assert("T3-CDP-3 every visible box has Basic controls and an Advanced expander at 390px",
      narrow.everySectionTiered && narrow.basicAtMostFour, JSON.stringify(narrow));
    const fleet = await evaluate(send, FLEET_PROBE);
    assert("T3-CDP-4 generic mode is the default and states the US-cost shorthand", fleet.genericDefault);
    assert("T3-CDP-5 toggle opens the per-DC composer", fleet.toggleOpened);
    assert("T3-CDP-6 selecting both offered registry rows composes one section and discloses the row that composed none",
      fleet.oneRowComposedAndTheOtherDisclosed,
      JSON.stringify({ offered: fleet.offeredRowIds, composed: fleet.dcSectionRefs,
        dropped: fleet.droppedRowId, coverage: fleet.coverage }));
    assert("T3-CDP-7 the prominent coverage line is the engine's own sentence, one decimal, summing to 100",
      fleet.coverageRendered,
      JSON.stringify({ coverage: fleet.coverage, engineSentence: fleet.engineSentence, printed: fleet.printed }));
    assert("T3-CDP-8 advanced mode is selected after composition", fleet.advancedPressed);
    assert("T3-CDP-9 per-DC v7 permalink round-trips by value", fleet.permalink);
    const nonOpus = await evaluate(send, `(() => {
      const selector = document.querySelector('#model-preset');
      selector.value = 'grok'; selector.dispatchEvent(new Event('input', { bubbles: true }));
      return !!document.querySelector('.fleet-mode-toggle')
        /* im-arc T4 fold (2026-08-24), memo §3: Grok's 95% is withdrawn. The Colossus rows prove
           typed accelerators are PRESENT at a site, not that a share of the modeled Grok blend is
           SERVED there, and the physical inventory now has its own sentence beside the partition. */
        && /0% named-site serving evidence/.test(document.querySelector('#fleet-coverage-line')?.textContent || '')
        && /physical inventory types present: 100% of the modeled blend/.test(document.querySelector('#fleet-coverage-line')?.textContent || '');
    })()`);
    assert("T3-CDP-10 fleet mode and preset coverage render for a model with no named-fleet row", nonOpus);
  } catch (error) {
    assert("T3-CDP harness completes", false, String(error?.message || error));
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
  console.log(failures ? `\n${failures} FLEET-MODE CDP FAILURE(S)` : "\nALL FLEET-MODE CDP TESTS PASS");
  process.exitCode = failures === 0 ? 0 : 1;
}
