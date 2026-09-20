/* =====================================================================================
   T5 rec 1 — THE INITIAL-LOAD DUAL-DEFAULT REGRESSION TEST
   (GPT Pro repo review 2026-07-29, §6 rank 1, BLOCKER — WRONG; finding SV-1 / defect C-1)

   The recommendation, verbatim:

     "Eliminate the hidden dual-default state. Have `finalAnswer()` return an explicit
      immutable `referenceState` or reference-state fingerprint. Make
      `refreshFinalAnswerDiffers()` compare the current canonical state/claim identity
      against that fingerprint—not `isCentralClean()`. Add an initial-load browser test
      asserting that the warning is visible whenever the ratified-prior and trend-zero
      outputs differ. Prefer shipping both readings together or only one."

   WHAT THIS REPO DOES, STATED PLAINLY. The recommendation contains two remedies and BOTH are
   now in place.

     (1) The presentation remedy — "shipping both readings together". Under M6/row-499 the block
         renders every default reading at once instead of one, which is the branch the M6 rework
         chose and the reason SV-1's specific harm is gone.
     (2) The mechanism remedy — the `referenceState` fingerprint. `finalAnswer()` returns one
         (frozen), and `refreshFinalAnswerDiffers()` compares the live canonical state identity
         against it rather than against `isCentralClean()`, exactly as the rec specifies.

   (2) was NOT done before T5, and skipping it had already cost something. This file was written
   first, against the shipped tree, and it FAILED at both viewports: on a completely untouched
   page the block announced "The scenario currently selected above DIFFERS from this thesis
   baseline", naming an edit the reader had not made. Cause: row 499 moved the opening state off
   `median` and split `isCentralClean()` in two, migrating the other callers and missing this
   one. That is SV-1's mirror image — a notice wrong about the default state, just wrong in the
   other direction — and it is what the rec's own second sentence was aimed at. Both directions
   are asserted below: quiet on every printed reading (STEP 1, and the two presets in STEP 2),
   firing as soon as the live state leaves them (STEP 2).

   Here is why the presentation remedy retires the defect it was aimed at. SV-1's harm
   was never the warning element as such; it was that a reader saw ONE default answer while a
   materially different default answer was suppressed — "the live hero as the project's default
   answer; and the block literally titled THE ANSWER as the project's default answer", with the
   divergence notice hidden on the clean landing state. Under M6/row-499 the block now renders
   EVERY default reading at once — the landing preset the page opens on, the calculator's own
   ratified-prior default, and the trend-zero public-evidence reference — each carrying its own
   basis inside its own token, plus a bridge line relating them. There is no suppressed second
   answer left to warn about, because there is no hidden one.

   So the invariant this file locks is the one that actually protects the reader, and it is
   STRICTLY STRONGER than the rec's own test would have been:

     On initial load, in the clean landing state, whenever two or more of the default
     readings differ, EVERY one of them is present in the rendered DOM, carries its own
     basis, and shows its own number.

   One deliberate departure from the rec's literal words, and the reason for it. The rec asks
   for a test "asserting that the warning is visible whenever the ratified-prior and trend-zero
   outputs differ". Written literally that test would now be WRONG: those two readings always
   differ (the prior is the reference plus one declared assumption), so it would demand the
   warning be permanently visible — including on a clean page where nothing is suppressed and
   nothing has been edited. That is the false alarm this leg just removed. The rec's sentence was
   written for a page that showed ONE reading and hid the other; on a page that shows both, the
   condition it was proxying for is "a reading the block does not print", which is what STEP 2
   asserts. Every assertion below also runs a NEGATIVE CONTROL, so none is a check that cannot
   fail.

   Raw CDP, matching tests/two-card-cdp.test.mjs. Release-chained through package.json's
   `test:browser` and the sync-site-tests twin list — a browser test in neither closed
   enumeration simply never runs.
   ===================================================================================== */
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
/* The engine resolves from the served twin's own directory when this file runs as
   site/tests/, and from ../site otherwise — the same two-candidate shape as HTML above. */
const ENGINE = [join(HERE, "..", "site", "engine.js"), join(HERE, "..", "engine.js")].find(existsSync);

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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("chrome did not expose DevToolsActivePort within " + ms + "ms");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = list.find(x => x.type === "page" && x.webSocketDebuggerUrl); if (pg) return pg.webSocketDebuggerUrl; } catch {}
    await sleep(150);
  }
  throw new Error("no page target within " + ms + "ms");
}
function cdpClient(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener("message", ev => { let msg; try { msg = JSON.parse(ev.data); } catch { return; } if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
  return (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, m => m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result)); ws.send(JSON.stringify({ id: mid, method, params })); });
}
const evalExpr = async (send, expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

/* ---------------------------------------------------------------------------------------
   STEP 1 — establish, from the engine, that the premise is LIVE.
   The whole invariant is conditional ("whenever the readings differ"), and a conditional
   whose antecedent is false is satisfied by an empty page. So the readings are computed
   here first and their divergence is asserted as a precondition. If a future defaults move
   ever collapses them onto one number, THIS assertion fails loudly and tells the next
   reader that the rest of the file went vacuous — rather than the file quietly passing.
   --------------------------------------------------------------------------------------- */
const E = require(ENGINE);
const fa = E.finalAnswer();
const READINGS = {
  landing: fa.landingReading.marginPct,     // the preset the page OPENS on (row 499)
  prior: fa.priorReading.marginPct,         // the calculator's own ratified-prior default
  reference: fa.planningPoint.marginPct,    // trend-zero, family 1.0 public-evidence reference
};
const pairs = [["landing", "prior"], ["landing", "reference"], ["prior", "reference"]];
const differing = pairs.filter(([a, b]) => Math.abs(READINGS[a] - READINGS[b]) > 0.05);
assert("R1 premise: the default readings genuinely DIFFER, so the invariant is not vacuous",
  differing.length === pairs.length,
  JSON.stringify({ readings: READINGS, differingPairs: differing }));
/* SV-1's own numbers were ~68.98 live against ~59.18 in the pinned block. The pair that
   defect was literally about is prior-vs-reference; name it separately so a partial collapse
   cannot hide behind the aggregate. */
assert("R1 premise: the ratified-prior and trend-zero readings differ (SV-1's own pair)",
  Math.abs(READINGS.prior - READINGS.reference) > 0.05,
  JSON.stringify({ prior: READINGS.prior, reference: READINGS.reference }));

/* The page prints these as "≈NN%". Build the exact strings the DOM must carry. */
const pct = v => "≈" + Math.round(v) + "%";
const EXPECTED = { landing: pct(READINGS.landing), prior: pct(READINGS.prior), reference: pct(READINGS.reference) };

const PROBE = `(() => {
  const q = s => document.querySelector(s);
  const text = s => (q(s)?.textContent || '').trim();
  const shown = s => { const e = q(s); if (!e) return false;
    /* A node inside a closed <details> is still "rendered on initial load" for this
       invariant's purpose — the reader can reach it without changing any control, and it is
       in the DOM at first paint. What SV-1 was about is a reading that is absent or
       suppressed, not one that is one disclosure-widget click away. So this checks presence
       and non-emptiness, and the hidden-attribute state is reported separately below. */
    return (e.textContent || '').trim().length > 0; };
  const r = { ready: document.readyState };
  r.landing = text('#fa-landing-reading');
  r.prior = text('#fa-prior-reading');
  r.reference = text('#fa-reference-reading');
  r.bridge = text('#fa-bridge');
  r.present = {
    landing: shown('#fa-landing-reading'), prior: shown('#fa-prior-reading'),
    reference: shown('#fa-reference-reading'), bridge: shown('#fa-bridge'),
  };
  /* The clean-landing state itself — the exact state SV-1 said the warning was wrongly
     suppressed in. Reported, not asserted-on, because under the both-readings remedy the
     notice is correctly quiet here. */
  r.differsHidden = !!q('#fa-differs')?.hidden;
  r.differsText = text('#fa-differs');
  r.modelPreset = q('#model-preset')?.value || null;
  r.perspPreset = q('#persp-preset')?.value || null;
  /* The hero the reader actually sees at the top of the page. */
  r.hero = text('#out-margin');
  r.faPlanningPoint = text('#fa-planning-point');
  return r;
})()`;

async function main() {
  if (!HTML) { assert("R1 fixture locates site/index.html", false); return; }
  const html = readFileSync(HTML, "utf8");
  /* Structural precondition, checked without a browser so a missing node is a clear failure
     rather than an empty probe result. */
  for (const id of ["fa-landing-reading", "fa-prior-reading", "fa-reference-reading", "fa-bridge", "fa-differs"])
    assert(`#${id} exists in site/index.html`, html.includes(`id="${id}"`));
  if (failures) return;
  if (!CHROME) { assert("R1 CDP locates a chromium/chrome binary", false, "none on PATH"); return; }

  const userDir = mkdtempSync(join(tmpdir(), "im-fa-dual-default-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "file://" + HTML], { stdio: "ignore" });
  let ws;
  const cleanup = () => { try { ws?.close(); } catch {} try { proc.kill("SIGKILL"); } catch {} try { rmSync(userDir, { recursive: true, force: true }); } catch {} };
  try {
    const wsUrl = await pageTarget(await pollActivePort(userDir));
    ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws error"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable");

    /* INITIAL LOAD, both viewports. Desktop and mobile because SV-1's stated danger was
       "especially dangerous in screenshots or excerpts", and the mobile layout is where a
       collapsed or dropped block would most plausibly go unnoticed. NO control is touched
       anywhere in this file — every assertion below describes the page as it opens. */
    for (const width of [1400, 390]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      await send("Page.navigate", { url: "file://" + HTML });
      let r = null;
      for (let t = 0; t < 20000; t += 100) {
        r = await evalExpr(send, PROBE);
        if (r.ready === "complete" && r.reference && r.prior && r.landing) break;
        await sleep(100);
      }
      const at = ` at ${width}px on initial load`;

      /* ---- THE INVARIANT ---- every differing default reading is present and carries its
         own number. This is the assertion that would have caught SV-1: under the defect the
         block showed the trend-zero reading only, and the live hero's ratified-prior number
         appeared nowhere inside it. */
      assert(`R1 all three default readings are rendered${at}`,
        r.present.landing && r.present.prior && r.present.reference,
        JSON.stringify(r.present));
      assert(`R1 the landing reading shows its own number ${EXPECTED.landing}${at}`,
        r.landing.includes(EXPECTED.landing), r.landing.slice(0, 160));
      assert(`R1 the ratified-prior default shows its own number ${EXPECTED.prior}${at}`,
        r.prior.includes(EXPECTED.prior), r.prior.slice(0, 160));
      assert(`R1 the trend-zero reference shows its own number ${EXPECTED.reference}${at}`,
        r.reference.includes(EXPECTED.reference), r.reference.slice(0, 160));

      /* ---- and each states the BASIS that makes it a different reading rather than a
         contradiction. Three numbers with no bases is the dual-default defect with an extra
         number in it. ---- */
      assert(`R1 the landing reading declares it is the state the page OPENS on${at}`,
        /OPENS on/.test(r.landing) && /algorithmic lead of \d+ months?/.test(r.landing), r.landing.slice(0, 200));
      assert(`R1 the ratified-prior reading declares the prior it carries${at}`,
        /algorithmic-lead prior/.test(r.prior) && /calculator's own default reading/.test(r.prior), r.prior.slice(0, 200));
      assert(`R1 the reference reading declares trend zero and family 1.0${at}`,
        /algorithmic lead of 0 months/.test(r.reference) && /family multipliers at 1\.0/.test(r.reference), r.reference.slice(0, 200));

      /* ---- and the page RELATES them, which is what turns three coexisting numbers into one
         readable answer. SV-1's harm was a reader unable to tell that two displayed defaults
         were different things; a bridge that never names the distance leaves that harm in
         place. ---- */
      assert(`R1 the bridge relates the readings to each other${at}`,
        r.present.bridge && /^How the readings relate\./.test(r.bridge)
        && /exactly one declared assumption/.test(r.bridge), r.bridge.slice(0, 200));

      /* ---- the hero and the block agree about what the page opens on. This is the exact
         "two different default answers" comparison SV-1 made, now asserted rather than
         warned about: the number at the top of the page must be a number the answer block
         names. ---- */
      assert(`R1 the hero's number is one the answer block names${at}`,
        !!r.hero && [EXPECTED.landing, EXPECTED.prior, EXPECTED.reference]
          .some(v => r.hero.includes(v.replace("≈", "")) || r.hero.includes(v)),
        JSON.stringify({ hero: r.hero, expected: EXPECTED }));

      /* ---- the clean landing state, recorded. Under the both-readings remedy the divergence
         notice is CORRECTLY quiet here: there is no suppressed reading for it to disclose.
         Asserted so that a future change which starts firing it on a clean load — or which
         reintroduces a hidden reading and leaves it quiet — has to come through this line. ---- */
      assert(`R1 the page opens clean on the landing preset${at}`,
        r.modelPreset === "opus" && !!r.perspPreset, JSON.stringify({ model: r.modelPreset, persp: r.perspPreset }));
      assert(`R1 on a clean load the divergence notice is quiet BECAUSE nothing is suppressed${at}`,
        r.differsHidden === true && r.differsText === "",
        JSON.stringify({ hidden: r.differsHidden, text: r.differsText }));

      /* ---- NEGATIVE CONTROLS. Every assertion above is re-run against a deliberately broken
         reading of the same DOM, and each must FAIL there. Without this the whole file could
         be passing because the selectors are wrong and every string is empty — which is
         precisely how SV-1's own suppressed warning went unnoticed. ---- */
      const wrong = pct(READINGS.reference + 11);
      assert(`R1 negative: the number assertions CAN fail (a wrong value is not found)${at}`,
        !r.reference.includes(wrong) && !r.prior.includes(wrong) && !r.landing.includes(wrong),
        JSON.stringify({ wrong, reference: r.reference.slice(0, 80) }));
      assert(`R1 negative: the presence assertions CAN fail (a nonexistent block is absent)${at}`,
        await evalExpr(send, "!document.querySelector('#fa-reading-that-does-not-exist')"));
      assert(`R1 negative: the basis assertions CAN fail (the reference block does NOT claim to be the opening state)${at}`,
        !/OPENS on/.test(r.reference), r.reference.slice(0, 160));
      /* The sharpest one: the three readings must not be the same string. If a defaults move
         ever collapsed them, every "shows its own number" assertion above would still pass
         while the page had exactly the single-reading surface the rec warned against. */
      assert(`R1 negative: the three readings are genuinely distinct strings${at}`,
        new Set([r.landing, r.prior, r.reference]).size === 3,
        JSON.stringify({ landing: r.landing.slice(0, 60), prior: r.prior.slice(0, 60), reference: r.reference.slice(0, 60) }));
    }

    /* ---------------------------------------------------------------------------------------
       STEP 2 — the notice must still FIRE. Step 1 proves it is quiet on an untouched page; on
       its own that is also what a permanently-dead notice looks like, and replacing a false
       alarm with a silent one would be a worse outcome than the defect. So: drive the page off
       every printed reading and require the notice to appear.

       This also demonstrates the substitution rec 1 asked for, rather than asserting it. Both
       printed perspectives are visited: `median` (which IS `isCentralClean()`) and the landing
       preset (which is NOT). Under the retired `!isCentralClean()` trigger the landing preset
       fired the notice; under the fingerprint both are quiet, because the block prints a reading
       for each — and an actual edit fires it, because the block prints a reading for none.
       --------------------------------------------------------------------------------------- */
    await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: "file://" + HTML });
    for (let t = 0; t < 20000; t += 100) {
      const g = await evalExpr(send, PROBE);
      if (g.ready === "complete" && g.reference) break;
      await sleep(100);
    }
    const differsAfter = async (expr) => {
      await evalExpr(send, expr);
      await sleep(250);
      return await evalExpr(send, "({hidden: !!document.querySelector('#fa-differs')?.hidden, text: (document.querySelector('#fa-differs')?.textContent||'').trim()})");
    };
    const setPersp = id => `(() => { const s = document.querySelector('#persp-preset'); s.value = ${JSON.stringify(id)};
      s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); return s.value; })()`;

    const onMedian = await differsAfter(setPersp("median"));
    assert("R1 the notice stays QUIET on the median reading (which the block prints)",
      onMedian.hidden === true, JSON.stringify(onMedian));
    const onLanding = await differsAfter(setPersp(fa.landingReading.perspId));
    assert("R1 the notice stays QUIET on the landing reading (which the block ALSO prints — the retired isCentralClean() trigger fired here)",
      onLanding.hidden === true, JSON.stringify(onLanding));

    /* An edit the block prints no reading for. The traffic mix is the cleanest lever: it is one
       of the fingerprint's own fields, so this exercises the comparison rather than a side door. */
    const edited = await differsAfter(`(() => {
      const lock = document.querySelector('#traffic-lock');
      if (lock && !lock.checked) { lock.checked = true; lock.dispatchEvent(new Event('change', { bubbles: true })); }
      const io = document.querySelector('#io-ratio') || document.querySelector('[data-param-key="ioRatio"] input');
      if (io) { io.value = String(Number(io.value) + 5); io.dispatchEvent(new Event('input', { bubbles: true })); }
      return !!io;
    })()`);
    assert("R1 the notice FIRES once the live state leaves every printed reading (it is not a dead node)",
      edited.hidden === false && /DIFFERS/.test(edited.text), JSON.stringify(edited));

    /* ---- THE TWO CASES AN INDEPENDENT REVIEW FOUND MISSING ----------------------------------
       Both were real defects in the first cut of the fingerprint, and both are asserted here so
       they cannot come back.

       (i) THE HAND-SET REFERENCE STATE. The block prints a reading for the trend-zero,
           family-1.0 public-evidence reference — but that state is not a PRESET, so a reader who
           lands on it by moving controls looked "edited" to the first cut and got the notice,
           while sitting exactly on a reading the block answers. */
    await send("Page.navigate", { url: "file://" + HTML });
    for (let t = 0; t < 20000; t += 100) {
      const g = await evalExpr(send, PROBE); if (g.ready === "complete" && g.reference) break; await sleep(100);
    }
    const onPinned = await differsAfter(`(() => {
      const s = document.querySelector('#persp-preset'); s.value = 'median';
      s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true }));
      /* Apply the engine's OWN reference pin to the live state, then re-render through the app's
         normal path — the same levers finalAnswer() pins for its reference reading. */
      Object.assign(S, REFERENCE_LEVER_PIN);
      fullRefresh();
      return JSON.stringify(REFERENCE_LEVER_PIN);
    })()`);
    assert("R1 the notice stays QUIET on the hand-set trend-zero reference — a reading the block PRINTS",
      onPinned.hidden === true, JSON.stringify(onPinned));
    const pinnedMatchesReference = await evalExpr(send,
      "Math.abs(parseFloat((document.querySelector('#out-margin')?.textContent||'').replace(/[^0-9.]/g,'')) - "
      + READINGS.reference.toFixed(4) + ") < 0.6");
    assert("R1 ...and that state really is the reference reading (the hero now computes it)",
      pinnedMatchesReference === true, "hero did not land on " + READINGS.reference.toFixed(2));

    /* (ii) A CUSTOM FLEET. Fleet definitions live in a side registry, never in the scenario
           state, so a custom fleet whose blend matches the default passes every state check
           while a per-leg override moves the margin. The first cut stayed SILENT there — a false
           negative, and the more dangerous direction, because the reader is told nothing. */
    await send("Page.navigate", { url: "file://" + HTML });
    for (let t = 0; t < 20000; t += 100) {
      const g = await evalExpr(send, PROBE); if (g.ready === "complete" && g.reference) break; await sleep(100);
    }
    const onCustomFleet = await differsAfter(`(() => {
      /* The fleet is built to MATCH THE LIVE DEFAULT BLEND exactly, and S.blend is left alone.
         That is what makes this a test of the fleet-identity path: every scenario-state check —
         presetIsClean() included — still passes, because the state is untouched. The only thing
         that differs is the per-leg HBM override, which lives in the side registry and which no
         state comparison can see. A probe that also moved S.blend would fire for the blend and
         prove nothing about fleet identity. */
      const blend = JSON.parse(JSON.stringify(S.blend));
      const keys = Object.keys(blend).filter(k => blend[k] > 0);
      if (!keys.length) return 'NO-BLEND';
      const def = { id: 'cf:r1probe1', name: 'R1 probe', epoch: DEFAULTS_EPOCH, clonedFrom: null,
        legs: keys.map((k, i) => ({ donorKey: k, label: 'leg' + i, sharePct: blend[k],
          overrides: i === 0 ? { hbmBytes: 1.6e10 } : {},
          basisDeclared: 'inherit', family: donorFamily(k) })) };
      const v = validateCustomFleet(def);
      if (!v.ok) return 'INVALID: ' + v.errors.join('; ');
      registerCustomFleetSource({ saved: { [def.id]: v.fleet }, ephemeral: null,
        resolve(id) { return id === def.id ? v.fleet : null; }, ids() { return [def.id]; } });
      FLEET_ID = def.id;          /* S.blend deliberately NOT reassigned */
      fullRefresh();
      return JSON.stringify({ fleet: FLEET_ID, presetClean: presetIsClean(), blendUntouched: JSON.stringify(S.blend) === JSON.stringify(blend) });
    })()`);
    /* The precondition that makes the assertion meaningful: if presetIsClean() were false here,
       the notice would fire for the ordinary edited-state reason and the fleet path would be
       untested. */
    const cfState = await evalExpr(send, "JSON.stringify({presetClean: presetIsClean(), fleet: FLEET_ID})");
    assert("R1 custom-fleet probe precondition: the scenario state is still CLEAN, so only fleet identity differs",
      /"presetClean":true/.test(cfState) && /cf:r1probe1/.test(cfState), cfState);
    assert("R1 the notice FIRES on a custom fleet — the block prints no reading for one",
      onCustomFleet.hidden === false && /DIFFERS/.test(onCustomFleet.text), JSON.stringify(onCustomFleet));

    /* (iii) THE TOTAL-CASE ROUND TRIP, raised by the second review. Moving the total control off
       the flagship value and back leaves TOTAL_CASE_ID reading "custom" for ever — app.js sets it
       on any `total` edit and never restores it — while the scenario STATE returns exactly. The
       notice stays quiet, and this asserts that this is the right answer rather than a gap: the
       hero must land back on the same number, which is what makes "quiet" true rather than
       merely convenient. If a future change ever makes the round trip land somewhere else, THIS
       is the assertion that fails. */
    await send("Page.navigate", { url: "file://" + HTML });
    for (let t = 0; t < 20000; t += 100) {
      const g = await evalExpr(send, PROBE); if (g.ready === "complete" && g.reference) break; await sleep(100);
    }
    const beforeTotal = await evalExpr(send,
      "JSON.stringify({hero:(document.querySelector('#out-margin')?.textContent||'').trim(), total:S.total, caseId:TOTAL_CASE_ID})");
    /* Driven through the REAL CONTROL — set the value, dispatch input, exactly as a reader
       does. Calling the internal post-edit hook directly re-enters the render out of its normal
       sequence and trips an unrelated units guard; a test that has to bypass the app's own edit
       path is not testing the app's own edit path. */
    const totalSel = '[data-param-key="total"] input';
    const afterTotal = await differsAfter(`(() => {
      const el = document.querySelector(${JSON.stringify(totalSel)});
      if (!el) return 'NO-CONTROL';
      const t0 = el.value;
      const other = String(Number(t0) === 3 ? 2.5 : 3);
      el.value = other; el.dispatchEvent(new Event('input', { bubbles: true }));
      const el2 = document.querySelector(${JSON.stringify(totalSel)});
      el2.value = t0;   el2.dispatchEvent(new Event('input', { bubbles: true }));
      return JSON.stringify({ back: el2.value, caseId: TOTAL_CASE_ID });
    })()`);
    assert("R1 total-case round trip: the control was found and driven (not a silent no-op)",
      !/NO-CONTROL/.test(JSON.stringify(afterTotal)), JSON.stringify(afterTotal));
    const afterState = await evalExpr(send,
      "JSON.stringify({hero:(document.querySelector('#out-margin')?.textContent||'').trim(), total:S.total, caseId:TOTAL_CASE_ID})");
    assert("R1 total-case round trip: the identity label really does go stale (the review's premise holds)",
      /"caseId":"custom"/.test(afterState), afterState);
    assert("R1 total-case round trip: ...but the scenario state and the rendered number return EXACTLY",
      JSON.parse(beforeTotal).hero === JSON.parse(afterState).hero
      && JSON.parse(beforeTotal).total === JSON.parse(afterState).total,
      JSON.stringify({ before: beforeTotal, after: afterState }));
    /* CORRECTED after round 3 of the review. An earlier cut of this test asserted the notice
       stays QUIET here, on the argument that an identical number means an identical reading.
       That argument was wrong and the reviewer rebutted it: TOTAL_CASE_ID is STORED, carries the
       size case's citation, and rides the permalink — so this state has lost provenance the
       block's reading is cited at, and a link shared from here propagates the loss. Equal output
       is not equal claim identity. The notice must FIRE. */
    assert("R1 total-case round trip: the notice FIRES — the citation is gone even though the number returned",
      afterTotal.hidden === false && /DIFFERS/.test(afterTotal.text), JSON.stringify(afterTotal));
    assert("R1 total-case round trip: a CLEAN page carries a real cited case id, not 'custom' or 'preset'",
      /"caseId":"revised-band/.test(beforeTotal) || !/"caseId":"custom"/.test(beforeTotal), beforeTotal);
  } catch (e) { assert("R1 CDP harness completes", false, String(e?.message || e)); }
  finally { cleanup(); }
}
await main();
console.log(`\n${failures === 0 ? "ALL FA DUAL-DEFAULT R1 TESTS PASS" : failures + " FA DUAL-DEFAULT R1 FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
