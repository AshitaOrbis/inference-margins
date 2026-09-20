/* rejected-link-and-store-cdp — a link the page REFUSES must say so, and a save that did not
 * happen must not report success.
 *
 * Mutation control for the im-vet-0919 fold (Astra pack B P0-1, P0-2, P0-5, P1-1). Four client
 * defects, all reproduced in a real browser here:
 *   P0-1  `?s=v6.bad`, or a well-formed token naming an id that does not resolve, rendered the
 *         page's OWN opening scenario with no notice of any kind, under normal shared-scenario
 *         styling. The reader believes the number came from the sharer.
 *   P1-1  the receiving side had no size bound while the sharing side refuses to emit a link
 *         over 4,000 characters: a 1.3-million-character token was accepted.
 *   P0-2  `_meta.dataAsOf` went straight into a rendered sentence, so `{"toString": null}` threw
 *         during initialisation and the interactive result never rendered at all.
 *   P0-5  saving a scenario named `__proto__` reported success while nothing was stored; a store
 *         holding `[]` reported success and stayed `[]`.
 *
 * Raw CDP, file:// only, for the reasons set out at the top of tests/localstorage-epoch.test.mjs.
 * Run: node tests/rejected-link-and-store-cdp.test.mjs
 */
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

// Resolve chrome and the served HTML (works from tests/ source AND from the served site/tests/ copy).
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


const b64url = (s) => Buffer.from(s, "utf8").toString("base64");

/* The page is loaded once per case, because the defect being pinned is what INITIALISATION does
   with the query string. */
async function loadAndProbe(send, query, probe) {
  await send("Page.navigate", { url: "file://" + HTML + query });
  let ready = false;
  for (let t = 0; t < 20000; t += 150) {
    let ok = false;
    try {
      ok = await evalExpr(send, "(document.readyState!=='loading' && typeof applyPreset==='function' "
        + "&& !!document.getElementById('epoch-deprecation-notice') && !!document.getElementById('preset-note'))");
    } catch { ok = false; }
    if (ok) { ready = true; break; }
    await sleep(150);
  }
  if (!ready) return { __notReady: true };
  return JSON.parse(await evalExpr(send, probe));
}

const NOTICE_PROBE = `(() => {
  const n = document.getElementById('epoch-deprecation-notice');
  const hero = document.getElementById('preset-note');
  return JSON.stringify({
    noticeShown: !!n && !n.hidden && n.textContent.trim().length > 0,
    noticeText: n ? n.textContent.slice(0, 160) : "",
    saysCouldNotBeRead: !!n && /could not be read/.test(n.textContent),
    saysOwnNumber: !!n && /this page's own/.test(n.textContent),
    presetNote: hero ? hero.textContent.slice(0, 120) : "",
    marginRendered: typeof S === 'object' && Number.isFinite(workload(S).margin),
  });
})()`;

const STORE_PROBE = (storeSeed, name) => `(() => {
  localStorage.setItem('im_presets_v1', ${JSON.stringify(storeSeed)});
  const inp = document.getElementById('scenario-name');
  if (inp) { inp.value = ${JSON.stringify(name)}; }
  let threw = null;
  try { document.getElementById('save-preset').click(); } catch (e) { threw = String(e && e.message); }
  const note = (document.getElementById('preset-note') || {}).textContent || "";
  let stored = null, ownProperty = false;
  try {
    const raw = localStorage.getItem('im_presets_v1');
    stored = raw;
    const parsed = JSON.parse(raw);
    ownProperty = !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      && Object.prototype.hasOwnProperty.call(parsed, ${JSON.stringify(name)});
  } catch (e) { stored = 'UNPARSEABLE'; }
  return JSON.stringify({
    threw,
    claimsSaved: /^Saved “/.test(note.trim()),
    saysCouldNot: /Could not save/.test(note),
    ownProperty,
    storedHead: (stored || "").slice(0, 60),
  });
})()`;

async function main() {
  if (!HTML) { assert("locate site/index.html", false, "not found next to the test"); return; }
  if (!CHROME) { assert("locate a chromium/chrome binary (release gate)", false, "none on PATH"); return; }
  const userDir = mkdtempSync(join(tmpdir(), "im-rej-cdp-"));
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", "--user-data-dir=" + userDir, "about:blank",
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
    await send("Page.enable");

    /* --- POSITIVE CONTROL: no link at all raises NO notice. Without this the three cases below
       would pass on a page that shouted at everyone. --- */
    const plain = await loadAndProbe(send, "", NOTICE_PROBE);
    assert("the page initialises with no query string", !plain.__notReady);
    assert("no shared link ⇒ no rejection notice (the guard is not blanket-warning)",
      plain.noticeShown === false, plain.noticeText);
    assert("...and a margin still renders", plain.marginRendered === true);

    /* --- P0-1: a damaged token --- */
    const bad = await loadAndProbe(send, "?s=v6.bad", NOTICE_PROBE);
    assert("a damaged shared link initialises the page", !bad.__notReady);
    assert("a damaged shared link RAISES a visible notice instead of substituting silently",
      bad.noticeShown === true && bad.saysCouldNotBeRead === true, bad.noticeText);
    assert("...and the notice says the figure on screen is the page's own",
      bad.saysOwnNumber === true, bad.noticeText);
    assert("...and the page still renders a number rather than breaking", bad.marginRendered === true);

    /* --- P0-1: a well-formed token naming an id that does not resolve --- */
    const missingModel = b64url(JSON.stringify({ _meta: { schema: "v6", model: "missing",
      persp: "gptpro-r3", traffic: { mode: "native" } } }));
    const missing = await loadAndProbe(send, "?s=v6." + encodeURIComponent(missingModel), NOTICE_PROBE);
    assert("a token naming a model that does not exist RAISES the notice too",
      missing.noticeShown === true && missing.saysCouldNotBeRead === true, missing.noticeText);

    /* --- P1-1: an oversized token --- */
    const huge = "v6." + "A".repeat(20000);
    const big = await loadAndProbe(send, "?s=" + huge, NOTICE_PROBE);
    assert("an oversized token is refused with the same visible notice",
      big.noticeShown === true && big.saysCouldNotBeRead === true, big.noticeText);
    assert("...and the refusal names the length rather than being generic",
      /characters long/.test(big.noticeText), big.noticeText);

    /* --- P0-2: untyped link metadata must not abort initialisation ---
       THE TOKEN IS MINTED BY THE PAGE'S OWN ENCODER and then tampered, so it really does
       decode. The first cut hand-wrote a `_meta` that `decodeScenario` rejected outright on
       BOTH the pre-fix and the fixed engine — Astra's gate adjudication caught it: the
       assertions passed without ever reaching the metadata path they claim to protect, which is
       a regression test that establishes nothing. */
    await loadAndProbe(send, "", NOTICE_PROBE);
    const minted = JSON.parse(await evalExpr(send, `(() => {
      const model = MODELS.find(r => r.id === 'opus');
      const persp = PERSPECTIVES.find(r => r.id === 'median');
      const state = applyPresetSettings(model, persp, { mode: 'native' });
      state.discount = 7;
      const traffic = resolveTraffic(model, persp, { mode: 'native' });
      const tok = encodeScenario(state, model.id, persp.id, traffic, null,
        { fleet: 'custom', totalCase: 'custom' });
      const parts = String(tok).split('.');
      const json = decodeURIComponent(escape(atob(parts.slice(1).join('.').replace(/-/g,'+').replace(/_/g,'/'))));
      const payload = JSON.parse(json);
      // EVERY rendered metadata field, not just the date: Astra named the engine identifier in
      // the same finding, and the gate found it still throwing after the first fix.
      payload._meta.dataAsOf = { toString: null };
      payload._meta.engine = { toString: null };
      // NOT the epoch: the decoder validates it, so tampering it makes the token fail to decode
      // and the fixture stops reaching the rendering path at all — which is the exact way the
      // first cut of this test was vacuous.
      const bytes = unescape(encodeURIComponent(JSON.stringify(payload)));
      const bad = parts[0] + '.' + btoa(bytes).split('+').join('-').split('/').join('_').split('=').join('');
      return JSON.stringify({ clean: tok, hostile: bad,
        cleanDecodes: !!decodeScenario(tok), hostileDecodes: !!decodeScenario(bad) });
    })()`));
    assert("the fixture token is minted by the page's own encoder and decodes",
      minted.cleanDecodes === true, JSON.stringify({ head: String(minted.clean).slice(0, 40) }));
    assert("...and the tampered one STILL decodes, so it reaches the metadata path",
      minted.hostileDecodes === true,
      "a token the decoder rejects outright cannot establish this regression");
    const meta = await loadAndProbe(send, "?s=" + encodeURIComponent(minted.hostile), NOTICE_PROBE);
    assert("a link whose metadata is an object still reaches an initialised page",
      !meta.__notReady, "initialisation never completed");
    assert("...and still renders a margin", meta.marginRendered === true);
    assert("...and the loaded-scenario note is BUILT, not left empty by a throw",
      /shared scenario/i.test(meta.presetNote || ""), JSON.stringify(meta.presetNote));
    assert("...and does NOT present any of the objects as text",
      !/\[object|toString/.test(meta.presetNote || ""), meta.presetNote);

    /* --- P0-5: a save that did not happen must not report success --- */
    await loadAndProbe(send, "", NOTICE_PROBE);
    const proto = JSON.parse(await evalExpr(send, STORE_PROBE("{}", "__proto__")));
    assert("saving a scenario named __proto__ either stores it or says it could not",
      proto.threw === null && (proto.ownProperty === true || proto.saysCouldNot === true)
        && !(proto.claimsSaved && !proto.ownProperty),
      JSON.stringify(proto));

    const arrayStore = JSON.parse(await evalExpr(send, STORE_PROBE("[]", "Review")));
    assert("saving into a store holding [] either stores it or says it could not",
      arrayStore.threw === null && (arrayStore.ownProperty === true || arrayStore.saysCouldNot === true)
        && !(arrayStore.claimsSaved && !arrayStore.ownProperty),
      JSON.stringify(arrayStore));

    const stringStore = JSON.parse(await evalExpr(send, STORE_PROBE('"hello"', "Review")));
    assert("saving into a store holding a string does not throw",
      stringStore.threw === null, String(stringStore.threw));
    assert("...and does not claim success unless the record is really there",
      !(stringStore.claimsSaved && !stringStore.ownProperty), JSON.stringify(stringStore));

    /* --- B P0-4 (Polaris ruling): a saved record carries model + fleet identity, and one written
     before this round loads with a visible notice instead of being silently re-interpreted. --- */
  await loadAndProbe(send, "", NOTICE_PROBE);
  const identity = JSON.parse(await evalExpr(send, `(() => {
    const r = {};
    localStorage.setItem('im_presets_v1', JSON.stringify({}));
    // Select a model, save under it, then select a DIFFERENT one and reload the save.
    const pick = id => { const sel = document.getElementById('model-preset'); sel.value = id; applyPreset(); };
    pick('kimi');
    document.getElementById('scenario-name').value = 'Kimi save';
    document.getElementById('save-preset').click();
    const stored = JSON.parse(localStorage.getItem('im_presets_v1'))['Kimi save'] || {};
    r.recordsModel = stored.__model === 'kimi';
    r.recordsFleet = !!stored.__fleet && typeof stored.__fleet.id === 'string';
    const savedMargin = workload(S).margin;
    pick('opus');
    loadSavedPreset('Kimi save');
    r.restoredUnderSavedModel = currentModel().id === 'kimi';
    r.marginMatches = Math.abs(workload(S).margin - savedMargin) < 1e-9;
    r.noGapNotice = document.getElementById('epoch-deprecation-notice').hidden === true;
    // A record written before this round: same numbers, no identity fields.
    const legacy = JSON.parse(JSON.stringify(stored));
    delete legacy.__model; delete legacy.__fleet;
    localStorage.setItem('im_presets_v1', JSON.stringify({ 'Legacy save': legacy }));
    pick('opus');
    loadSavedPreset('Legacy save');
    const notice = document.getElementById('epoch-deprecation-notice');
    r.legacyRaisesNotice = !notice.hidden && /stored before this page recorded/.test(notice.textContent);
    r.legacyNamesWhatIsMissing = /model and fleet/.test(notice.textContent);
    r.legacyNoteInPresetNote = /Saved before v3\.x/.test(document.getElementById('preset-note').textContent);
    r.legacyKept = !!JSON.parse(localStorage.getItem('im_presets_v1'))['Legacy save'];
    return JSON.stringify(r);
  })()`));
  assert("a saved record now carries the model it was saved under",
    identity.recordsModel === true, JSON.stringify(identity));
  assert("...and the fleet identity", identity.recordsFleet === true, JSON.stringify(identity));
  assert("reloading it under a different model restores the SAVED model, not the selected one",
    identity.restoredUnderSavedModel === true, JSON.stringify(identity));
  assert("...and reproduces the number it was saved at", identity.marginMatches === true, JSON.stringify(identity));
  assert("a complete record raises no gap notice (the guard is not blanket-warning)",
    identity.noGapNotice === true, JSON.stringify(identity));
  assert("a record written before this round raises a VISIBLE notice instead of silent reuse",
    identity.legacyRaisesNotice === true, JSON.stringify(identity));
  assert("...naming exactly what was not recorded",
    identity.legacyNamesWhatIsMissing === true && identity.legacyNoteInPresetNote === true,
    JSON.stringify(identity));
  assert("...and the old record is KEPT, not migrated or discarded",
    identity.legacyKept === true, JSON.stringify(identity));

  /* --- B P0-3 (Polaris ruling): the displayed ranges are computed on the state that is on
     screen, so an edited input cannot put the headline outside its own range. --- */
  await loadAndProbe(send, "", NOTICE_PROBE);
  const ranges = JSON.parse(await evalExpr(send, `(() => {
    const m = currentModel(), p = currentPersp(), sel = currentTrafficSel();
    const read = () => {
      const dials = dialsFromRanges(S.dialRanges || {});
      const live = { ...S };
      const point = workload(S).margin * 100;
      const bands = marginBandsPerDial(m, p, sel, dials, { base: live })
        .filter(b => !b.refused && isFinite(b.lo) && isFinite(b.hi));
      // A dial whose CURRENT setting is inside its declared bounds must not put the point
      // outside the range drawn over those bounds.
      const containing = bands.filter(b => {
        const d = dials.find(x => (x.key || x.leg || x.family) === b.id || x.key === b.id);
        const v = d ? Number(S[d.key]) : NaN;
        if (!d || !Number.isFinite(v) || v < d.lo || v > d.hi) return true; // not applicable
        return point >= b.lo - 1e-6 && point <= b.hi + 1e-6;
      });
      return { dials: dials.length, bands: bands.length,
        allContain: containing.length === bands.length,
        worst: bands.map(b => ({ id: b.id, lo: b.lo, hi: b.hi })).slice(0, 3), point };
    };
    const before = read();
    // The reader edits an input none of the declared ranges sweeps.
    S.priceOut = 50;
    fullRefresh();
    const after = read();
    return JSON.stringify({ before, after });
  })()`));
  assert("the page opens with declared ranges to check (not vacuous)",
    ranges.before.dials > 0 && ranges.before.bands > 0, JSON.stringify(ranges.before));
  assert("every displayed range contains the headline at the page-open state",
    ranges.before.allContain === true, JSON.stringify(ranges.before));
  assert("...and still does after an input none of those ranges sweeps is edited",
    ranges.after.allContain === true, JSON.stringify(ranges.after));
  assert("the edit really did move the headline (so the check above meant something)",
    Math.abs(ranges.after.point - ranges.before.point) > 0.5,
    JSON.stringify({ before: ranges.before.point, after: ranges.after.point }));

  await loadAndProbe(send, "", NOTICE_PROBE);
  const ordinary = JSON.parse(await evalExpr(send, STORE_PROBE("{}", "An ordinary name")));
    assert("an ordinary save still works and still reports success (positive control)",
      ordinary.claimsSaved === true && ordinary.ownProperty === true, JSON.stringify(ordinary));
  } catch (e) {
    assert("CDP rejected-link harness ran", false, e.message);
  } finally { cleanup(); }
}

/* The verdict runs whatever main() did — see tests/browser-suite-exit-status.test.mjs. */
try {
  await main();
} catch (err) {
  console.error("HARNESS ERROR:", err && err.message);
  failures++;
} finally {
  console.log(`\n${failures === 0 ? "ALL REJECTED-LINK AND STORE CDP TESTS PASS" : failures + " REJECTED-LINK AND STORE CDP FAILURE(S)"}`);
  process.exitCode = failures === 0 ? 0 : 1;
}
