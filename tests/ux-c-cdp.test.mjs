// b9 UX-C — the claim-bearing tails: typed three-region split, the two-source POPUP-SPLIT
// payload, and the whole-lifecycle close-path redesign, over CDP.
// Design contract: research/b9-ux-memo.md §18 (v6: gate-folded through SIX rounds, §18.9–§18.13).
//
// WHAT THIS FILE IS FOR, AND THE CONTROLS THAT MAKE IT MEAN SOMETHING:
//   * RE-MINTED 2026-09-10 (im-release-edit-r3), owner ruling
//     d-20260910-im-adopt-fleet-rents-and-correct-grok: 20 of 22 states moved, all of them
//     engine-derived readings following the adoption of planning rents for GB200, GB300 and
//     Trainium3 — cost-lens spans 62.9–86.1% -> 68.0–87.2%, the renderable disclosure "5/8 legs,
//     52% of declared weight" -> "7/7 legs, 100%", and each state's own margin. Two states moved
//     BUCKET rather than only digits (modified-from 88.28 -> 91.93 crosses into the cited 90–95%
//     range, and its note says so), which is the classifier following the number as designed. The
//     pre-adoption fixture is archived at
//     archived/fixtures/fixtures-ux-c-tails.pre-rent-adoption-2026-09-10.json. No note changed
//     SHAPE: the same regions, separators and receipt units, which U-C0's structural assertions
//     below check independently of the bytes.
//   * RE-MINTED AGAIN 2026-09-20 (im-vet-six-repairs, program bq-2835): 21 of 22 states moved,
//     all of them engine-derived readings following the two registry repairs — the two Trainium
//     legs WITHDRAWN from the default fleet on evidence grounds (so every renderable disclosure
//     reads "5/5 default member legs" behind the withdrawal clause, and the clause itself now
//     appears in the tail where before there was no exclusion to state) and the TPU v7 decode
//     coefficient corrected onto a decode-only numerator. The pre-repair fixture is archived at
//     archived/fixtures/fixtures-ux-c-tails.pre-vetting-repairs-2026-09-20.json. NO NOTE CHANGED
//     SHAPE for the third time: same regions, same separators, same receipt units, which U-C0's
//     structural assertions below check independently of the bytes and which is the reason a byte
//     re-mint here is a value migration rather than a design change.
//   * U-C0 replays the PRE-implementation fixture (tests/fixtures-ux-c-tails.json, minted at
//     bfd282c) through the SAME drive module the mint used — capture and replay cannot diverge —
//     and pins the tail textContent byte-for-byte. The ONE declared behavioral delta (the
//     incompatible pair-clear) is asserted separately, never silently absorbed.
//   * U-15 is a REAL mutation control: it neutralizes the mandatory region in-page and requires
//     the parity comparison to fail — a control demonstrated firing, not assumed.
//   * U-18 fault-injects the multi-source restore per phase (preflight, execution-throw with
//     rollback, one-of-two in BOTH orders, double failure) and requires transactional
//     all-or-nothing behavior with the COMPLETE plan retained.
//   * The lifecycle rows fault-inject every source-owning mutator the census derives FROM SOURCE
//     (a hand-listed inventory goes stale silently; a derived one cannot drop a site).
//   * The behavioral negative controls run a PATCHED app in a throwaway copy of site/ (shipped
//     files are never edited at test time) and require the row to FAIL under the old design.
// Run: node tests/ux-c-cdp.test.mjs
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DRIVES, CAPTURE, SETTLE_MS } from "./ux-c-states.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + String(detail).slice(0, 300)}`);
  if (!cond) failures++;
};
function findChrome() {
  for (const c of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    try { return execSync(`command -v ${c}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  }
  return null;
}
const HTML = [join(HERE, "..", "site", "index.html"), join(HERE, "..", "index.html")].find(existsSync);
const SITE_DIR = dirname(HTML);
const APP_SRC = readFileSync(join(SITE_DIR, "app.js"), "utf8");
const FIXTURE = JSON.parse(readFileSync(join(HERE, "fixtures-ux-c-tails.json"), "utf8"));
const CHROME = findChrome();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pollActivePort(dir, ms = 15000) {
  const f = join(dir, "DevToolsActivePort");
  for (let t = 0; t < ms; t += 100) { if (existsSync(f)) { const p = readFileSync(f, "utf8").split("\n")[0].trim(); if (p) return p; } await sleep(100); }
  throw new Error("no DevToolsActivePort");
}
async function pageTarget(port, ms = 15000) {
  for (let t = 0; t < ms; t += 150) {
    try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const pg = l.find(x => x.type === "page" && x.webSocketDebuggerUrl); if (pg) return pg.webSocketDebuggerUrl; } catch {}
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
  if (r.exceptionDetails) throw new Error("page eval threw: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return r.result.value;
};

/* One Chrome per page-set; fresh navigation per state. `htmlPath` lets the patched-app
   negative controls point at a throwaway copy of site/ (never the shipped tree). */
async function withPage(fn, { emulate = null, htmlPath = HTML } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "uxc-cdp-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + dir, "about:blank"], { stdio: "ignore" });
  try {
    const port = await pollActivePort(dir);
    const ws = new WebSocket(await pageTarget(port));
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", () => rej(new Error("ws"))); });
    const send = cdpClient(ws);
    await send("Runtime.enable"); await send("Page.enable");
    if (emulate && emulate.device) {   // the ux-b-proven coarse recipe: device metrics + touch emulation
      await send("Emulation.setDeviceMetricsOverride", { ...emulate.device, deviceScaleFactor: 2, mobile: true });
      await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    }
    if (emulate && emulate.media) await send("Emulation.setEmulatedMedia", { media: emulate.media });
    const nav = async (suffix = "") => {
      await send("Page.navigate", { url: "file://" + htmlPath + suffix });
      for (let t = 0; t < 15000; t += 150) {
        try { if (await evalExpr(send, "document.readyState!=='loading' && typeof applyPreset==='function' && !!document.getElementById('out-margin-note')")) break; } catch {}
        await sleep(150);
      }
      await sleep(SETTLE_MS);
    };
    await nav();
    return await fn(send, nav);
  } finally {
    try { proc.kill(); } catch {}
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

/* im-arc T4 fold (2026-08-24): the MINT AID, opt-in and off by every default — the same house
   pattern as DUMP_PARITY_HASHES in the MCP report-parity gate. UX_C_MINT=1 re-captures the
   fixture through the SAME drive module the replay uses, so capture and replay still cannot
   diverge, and prints what moved. It exists because the fold moved the calculator readings these
   tails quote, and a fixture re-typed by hand would be a second source of truth. */
const MINT = process.env.UX_C_MINT === "1";
const minted = {};

async function main() {
  if (!CHROME || !HTML) { console.log("FAIL  harness: chrome/page missing"); process.exit(1); }

  /* ================= U-C0 — fixture replay: byte parity + structure ================= */
  await withPage(async (send, nav) => {
    const declaredDelta = new Set(["incompatible"]); // §18.1 P0-1/§18.10 P0-d: the pair-clear states
    for (const [sid, row] of Object.entries(FIXTURE.states)) {
      await nav(row.permalink ? "?s=" + encodeURIComponent(row.permalink.token) : "");
      if (!row.permalink) { try { await evalExpr(send, DRIVES[row.driveKind](...row.params)); } catch (e) { assert(`U-C0 ${sid}: drive`, false, e.message); continue; } }
      await sleep(SETTLE_MS);
      const cap = JSON.parse(await evalExpr(send, CAPTURE));
      if (MINT) minted[sid] = cap;
      assert(`U-C0 ${sid}: #out-margin-note byte-identical to the pre-implementation fixture`,
        cap.outMarginNote === row.capture.outMarginNote,
        `len ${cap.outMarginNote?.length} vs ${row.capture.outMarginNote?.length}`);
      if (declaredDelta.has(sid)) {
        assert(`U-C0 ${sid}: DECLARED DELTA — the pair clears as a pair (un empty, feas "—", note empty)`,
          cap.outMarginUnanchored === "" && cap.outFeas === "—" && cap.outFeasNote === "",
          JSON.stringify([cap.outMarginUnanchored, cap.outFeas, cap.outFeasNote]).slice(0, 120));
      } else {
        assert(`U-C0 ${sid}: unanchored + feasibility pair byte-identical`,
          cap.outMarginUnanchored === row.capture.outMarginUnanchored
          && cap.outFeasNote === row.capture.outFeasNote && cap.outFeas === row.capture.outFeas,
          "pair moved");
      }
      /* P1-d: ordered receipt-unit structure — spans + text-node separators, concatenation
         equals the region text; a collapsed single-text-node region must fail this shape. */
      const st = JSON.parse(await evalExpr(send, `(() => {
        const rec = document.querySelector("#out-margin-note > .tile-receipts");
        const man = document.querySelector("#out-margin-note > .tile-mandatory");
        const act = document.querySelector("#out-margin-note > .tile-actions");
        if (!rec || !man || !act) return JSON.stringify({ ok: false, why: "wrappers missing" });
        const units = [...rec.children];
        const seps = [...rec.childNodes].filter(n => n.nodeType === 3 && n.textContent === " \\u00b7 ");
        const concat = man.textContent + rec.textContent + act.textContent;
        return JSON.stringify({ ok: true, units: units.length, seps: seps.length,
          unitsAreSpans: units.every(u => u.tagName === "SPAN" && u.className === "tile-receipt-unit" && u.textContent.length > 0),
          concatEq: concat === document.getElementById("out-margin-note").textContent,
          order: [...document.getElementById("out-margin-note").children].map(c => c.className).join(",") });
      })()`));
      assert(`U-C0 ${sid}: three regions in order, atomic receipt units, separators as text nodes`,
        st.ok && st.order === "tile-mandatory,tile-receipts,tile-actions" && st.units === st.seps && st.unitsAreSpans && st.concatEq,
        JSON.stringify(st).slice(0, 200));
      // repeat-render idempotence on the implemented tree
      await evalExpr(send, "(async()=>{ try { renderAll(); } catch {} })()"); await sleep(SETTLE_MS);
      const cap2 = JSON.parse(await evalExpr(send, CAPTURE));
      assert(`U-C0 ${sid}: repeat-render idempotent`, cap.outMarginNote === cap2.outMarginNote, "moved on re-render");
    }
    if (MINT) {
      const next = structuredClone(FIXTURE);
      let moved = 0;
      for (const [sid, cap] of Object.entries(minted)) {
        if (JSON.stringify(next.states[sid].capture) !== JSON.stringify(cap)) moved++;
        next.states[sid].capture = cap;
      }
      /* im-release-edit-r3 (2026-09-10): this label was a HARDCODED CONSTANT naming the im-arc T4
         fold, so every future mint would have stamped the fixture with the wrong provenance — a
         mislabel that is worse than no label, because it reads as deliberate. It now comes from the
         minter, and an unset one says so loudly rather than inheriting somebody else's reason. */
      next.mintedUnder = process.env.UX_C_MINT_LABEL
        || "UNLABELLED MINT — the minter did not set UX_C_MINT_LABEL; provenance unknown";
      writeFileSync(join(HERE, "fixtures-ux-c-tails.json"), JSON.stringify(next, null, 2) + "\n", "utf8");
      console.log(`UX-C MINT: rewrote ${Object.keys(minted).length} states, ${moved} moved`);
      process.exit(0);
    }

    /* normal→each-early-return transitions (P0-1): the NEW cleared state is asserted */
    await nav();
    const inc = FIXTURE.states["incompatible"];
    await evalExpr(send, DRIVES[inc.driveKind](...inc.params)); await sleep(SETTLE_MS);
    const t1 = JSON.parse(await evalExpr(send, CAPTURE));
    assert("transition normal→incompatible clears the disclosure AND the feasibility pair",
      t1.outMarginUnanchored === "" && t1.outFeas === "—" && t1.outFeasNote === "",
      JSON.stringify([t1.outMarginUnanchored, t1.outFeas, t1.outFeasNote]).slice(0, 120));
    await nav();
    await evalExpr(send, "(async()=>{ const orig=appWorkload; appWorkload=(s)=>Object.assign(orig(s),{margin:NaN}); renderAll(); })()"); await sleep(SETTLE_MS);
    const t2 = JSON.parse(await evalExpr(send, CAPTURE));
    assert("transition normal→infeasible: mandatory only + feasibility receipts repopulated",
      /DECLARED FLEET INFEASIBLE/.test(t2.outMarginNote) && t2.outMarginUnanchored === "" && (t2.outFeasNote || "").length > 0,
      (t2.outMarginNote || "").slice(0, 60));

    /* U-15 mutation control — DEMONSTRATED firing: neutralize the mandatory region, parity must break */
    await nav();
    const land = FIXTURE.states["landing"];
    await evalExpr(send, `(async()=>{ const _c = commitTail; window.__origCommit = _c;
      commitTail = function() { TAIL.mandatory = ""; _c(); }; renderAll(); })()`); await sleep(SETTLE_MS);
    const mut = JSON.parse(await evalExpr(send, CAPTURE));
    assert("U-15 mutation control: deleting the mandatory-label write BREAKS byte parity (control fires)",
      mut.outMarginNote !== land.capture.outMarginNote, "control did not fire");
    await evalExpr(send, "(async()=>{ commitTail = window.__origCommit; renderAll(); })()"); await sleep(SETTLE_MS);
    const back = JSON.parse(await evalExpr(send, CAPTURE));
    assert("U-15 …and parity returns when the write is restored", back.outMarginNote === land.capture.outMarginNote, "no return");

    /* U-12 truth table: mandatory non-empty in EVERY state (deliberate clears are un/feas, never mandatory) */
    let mandatoryOk = true, mdetail = "";
    for (const [sid, row] of Object.entries(FIXTURE.states)) {
      if (!(row.capture.outMarginNote || "").length) { mandatoryOk = false; mdetail = sid; break; }
    }
    assert("U-12: the mandatory tail is non-empty in every captured state", mandatoryOk, mdetail);

    /* trigger visibility syncs with isEmpty on every commit (§18.3) */
    await nav();
    await evalExpr(send, DRIVES.pair(...FIXTURE.states["incompatible"].params)); await sleep(SETTLE_MS);
    const trigHidden = await evalExpr(send, "document.getElementById('explain-trigger-tile-tails')?.hidden");
    assert("trigger hides when BOTH sources are deliberately empty (incompatible pair-clear)", trigHidden === true, String(trigHidden));
    await nav();
    const trigShown = await evalExpr(send, "document.getElementById('explain-trigger-tile-tails')?.hidden");
    assert("trigger shows when a source has content (landing: policy-band receipt present)", trigShown === false, String(trigShown));

    /* action-liveness (gate omission 5): text parity cannot prove a handler */
    await nav();
    await evalExpr(send, DRIVES.pair(...FIXTURE.states["incompatible"].params)); await sleep(SETTLE_MS);
    const forced = await evalExpr(send, `(async () => {
      const btn = [...document.querySelectorAll("#out-margin-note button")].find(b => /Compute anyway/.test(b.textContent));
      if (!btn) return "no-btn";
      if (btn.closest(".tile-actions") == null) return "not-in-actions";
      btn.focus(); if (document.activeElement !== btn) return "not-focusable";
      btn.click(); await new Promise(r => setTimeout(r, 150));
      return /⚠ EXPLORATORY/.test(document.getElementById("out-margin-note").textContent) ? "ok" : "no-effect";
    })()`);
    assert("action-liveness: Compute-anyway lives in .tile-actions, takes focus, and its click fires", forced === "ok", forced);
    await nav();
    const me = FIXTURE.states["modified-exploration"];
    await evalExpr(send, DRIVES[me.driveKind](...me.params)); await sleep(SETTLE_MS);
    const crumb = await evalExpr(send, `(async () => {
      const btn = [...document.querySelectorAll("#out-margin-note .tile-actions button")].find(b => /Restore route/.test(b.textContent));
      if (!btn) return "no-btn";
      const before = btn.getBoundingClientRect().top; renderAll(); await new Promise(r => setTimeout(r, 120));
      const btn2 = [...document.querySelectorAll("#out-margin-note .tile-actions button")].find(b => /Restore route/.test(b.textContent));
      if (!btn2 || Math.abs(btn2.getBoundingClientRect().top - before) > 0.5) return "position-moved";
      btn2.click(); await new Promise(r => setTimeout(r, 200));
      return EXPLORATION_ORIGIN === null ? "ok" : "no-restore";
    })()`);
    assert("action-liveness: the restore breadcrumb is position-stable across re-renders and actually restores", crumb === "ok", crumb);

    /* U-23 + U-18 — POPUP-SPLIT relocation, mandatory visibility, exact-position restore */
    await nav();
    const u23 = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      const trig = document.getElementById("explain-trigger-tile-tails"); if (!trig || trig.hidden) return JSON.stringify({ err: "no visible trigger" });
      const recBefore = document.querySelector("#out-margin-note > .tile-receipts");
      const feas = document.getElementById("out-feas-note");
      const feasParent = feas.parentElement.id || feas.parentElement.className;
      trig.click(); await new Promise(r2 => setTimeout(r2, 200));
      const dlg = document.querySelector("dialog[data-explain-dialog]");
      r.open = !!(dlg && dlg.open);
      r.bothInside = !!(dlg && dlg.contains(recBefore) && dlg.contains(feas));
      r.srcOrder = dlg ? [...dlg.querySelectorAll(".tile-receipts")].indexOf(recBefore) === 0 : false; // document order (P0-3)
      const vis = sel => { const el = document.querySelector(sel); return !!(el && el.getClientRects().length && !dlg.contains(el)); };
      r.mandatoryVisible = vis("#out-margin-note > .tile-mandatory") && vis("#out-margin-note > .tile-actions")
        && vis("#out-margin-unanchored") && vis(".identity-strip .id-epistemic");
      r.onlyReceiptsMoved = [...dlg.querySelectorAll(".explain-body > *")].every(n => n.classList.contains("tile-receipts"));
      r.title = dlg ? dlg.querySelector(".fa-explain-title").textContent : "";
      closeActiveExplain(); await new Promise(r2 => setTimeout(r2, 120));
      const recAfter = document.querySelector("#out-margin-note > .tile-receipts");
      r.restored = recAfter === recBefore && feas.parentElement && (feas.parentElement.id || feas.parentElement.className) === feasParent
        && document.getElementById("out-margin-note").children[1] === recAfter;
      r.idle = EXPLAIN.phase === "idle" && document.querySelectorAll("dialog[data-explain-dialog]").length === 0;
      return JSON.stringify(r);
    })()`));
    assert("U-23: tails modal open → every mandatory surface stays in-document, inline, visible; ONLY .tile-receipts nodes moved",
      u23.open && u23.bothInside && u23.mandatoryVisible && u23.onlyReceiptsMoved && u23.srcOrder, JSON.stringify(u23).slice(0, 220));
    assert("gate Q3: the dialog title is the fixed authored copy", u23.title === "Result receipts", u23.title);
    assert("U-18: both sources restore to EXACT positions in their two parents; coordinator returns to idle",
      u23.restored && u23.idle, JSON.stringify(u23).slice(0, 160));

    /* U-18 fault matrix — per phase, one-of-two in BOTH orders, double failure, retry */
    for (const [label, faultIdx] of [["first source", 0], ["second source", 1]]) {
      const fr = JSON.parse(await evalExpr(send, `(async () => {
        const r = {};
        document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
        const dlg = document.querySelector("dialog[data-explain-dialog]");
        const src = EXPLAIN.sources[${faultIdx}];
        const savedParent = src.parent;
        src.placeholder.remove(); src.parent = document.createElement("div");   // kill BOTH preflight routes for this source
        r.closeResult = closeActiveExplain();
        r.stranded = EXPLAIN.phase === "stranded";
        r.dialogKept = EXPLAIN.dialog === dlg && document.contains(dlg);
        r.planComplete = EXPLAIN.sources.length === 2;                            // A-1: the FULL plan stays registered
        r.allStillInside = EXPLAIN.sources.every(s => dlg.contains(s.node));      // preflight fail = NOTHING moved
        r.guardAborts = explainGuardBeforeMutation() === false;
        src.parent = savedParent;                                                 // clear the fault
        r.retry = closeActiveExplain();
        r.idleAfter = EXPLAIN.phase === "idle";
        r.bothBack = !!document.querySelector("#out-margin-note > .tile-receipts") && !!document.getElementById("out-feas-note");
        await new Promise(x => setTimeout(x, 150));
        return JSON.stringify(r);
      })()`));
      assert(`U-18 preflight fault (${label}): all-or-nothing, stranded, full plan kept, guarded mutations abort, retry converges`,
        fr.closeResult === false && fr.stranded && fr.dialogKept && fr.planComplete && fr.allStillInside && fr.guardAborts && fr.retry && fr.idleAfter && fr.bothBack,
        JSON.stringify(fr).slice(0, 220));
    }
    const ex = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const dlg = document.querySelector("dialog[data-explain-dialog]");
      const src0 = EXPLAIN.sources[0];                       // restores LAST (reverse order) — its throw follows source 1's success
      const origRW = src0.placeholder.replaceWith.bind(src0.placeholder);
      src0.placeholder.replaceWith = () => { throw new Error("injected"); };
      const savedParent = src0.parent; src0.parent = document.createElement("div"); // kill the coordinate fallback too
      r.closeResult = closeActiveExplain();
      r.stranded = EXPLAIN.phase === "stranded";
      r.rolledBack = EXPLAIN.sources.every(s => dlg.contains(s.node));  // the restored source rolled BACK into the dialog
      r.planComplete = EXPLAIN.sources.length === 2;
      src0.placeholder.replaceWith = origRW; src0.parent = savedParent;
      r.retry = closeActiveExplain(); r.idle = EXPLAIN.phase === "idle";
      await new Promise(x => setTimeout(x, 150));
      return JSON.stringify(r);
    })()`));
    assert("U-18 execution-throw fault: partial restoration ROLLS BACK into the dialog (no split payload), retry converges",
      ex.closeResult === false && ex.stranded && ex.rolledBack && ex.planComplete && ex.retry && ex.idle,
      JSON.stringify(ex).slice(0, 220));

    /* B-4 native-close: ordinary restore failure → re-show complete payload; fracture → keep-and-mark */
    const nc = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const dlg = document.querySelector("dialog[data-explain-dialog]");
      const src = EXPLAIN.sources[0]; const savedParent = src.parent;
      src.placeholder.remove(); src.parent = document.createElement("div");
      dlg.close();                                   // NATIVE close — the platform closes first, the queued handler recovers
      await new Promise(x => setTimeout(x, 250));
      r.reshown = dlg.open === true;                                              // B-4: re-shown, not torn down
      r.ordered = [...dlg.querySelectorAll(".tile-receipts")].length === 2
        && EXPLAIN.sources.every(s => dlg.contains(s.node));                      // complete ordered payload inside
      r.stranded = EXPLAIN.phase === "stranded";
      src.parent = savedParent;
      r.retry = closeActiveExplain(); r.idle = EXPLAIN.phase === "idle";
      await new Promise(x => setTimeout(x, 150));
      return JSON.stringify(r);
    })()`));
    assert("B-4 native close under restore failure: dialog RE-SHOWN with the complete ordered payload; retry converges",
      nc.reshown && nc.ordered && nc.stranded && nc.retry && nc.idle, JSON.stringify(nc).slice(0, 220));

    /* lifecycle: pending-render replay (OM-a), renderAll-as-retry, per-mutator census aborts */
    const lc = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const src = EXPLAIN.sources[0]; const savedParent = src.parent;
      src.placeholder.remove(); src.parent = document.createElement("div");
      closeActiveExplain();                          // → stranded
      const slider = document.querySelector('input[type="range"]');
      const min = parseFloat(slider.min), max = parseFloat(slider.max), v = parseFloat(slider.value);
      slider.value = String(Math.abs(v - min) > 1e-9 ? min : max);
      slider.dispatchEvent(new Event("input", { bubbles: true }));               // S mutates; debounced render aborts
      await new Promise(x => setTimeout(x, 200));
      r.pendingSet = PENDING_LEVEL !== null;
      r.noteUntouched = EXPLAIN.phase === "stranded";                            // surface held while blocked
      src.parent = savedParent;
      r.close = closeActiveExplain();                                            // success → schedules exactly one replay
      await new Promise(x => setTimeout(x, 250));
      r.converged = PENDING_LEVEL === null;
      const note = document.getElementById("out-margin-note").textContent;
      r.rendered = /MODIFIED|EXPLORATION|within|between|above|at or below|USER-DEFINED|NAMED FLEET/.test(note);
      return JSON.stringify(r);
    })()`));
    assert("OM-a: an edit against a stranded close sets PENDING, the successful close replays EXACTLY ONE convergent render",
      lc.pendingSet && lc.noteUntouched && lc.close && lc.converged && lc.rendered, JSON.stringify(lc).slice(0, 220));

    /* the derived census: every source-owning mutator aborts under a stranded coordinator */
    const censusFns = [...new Set([...APP_SRC.matchAll(/function (\w+)[^\n]*\{\n(?:[^\n]*\n){0,3}[^\n]*explainGuardBeforeMutation/g)].map(m => m[1]))];
    assert("census: the derived guard-site inventory is complete (both downgrades + dossier family + builders + renderers)",
      ["downgradeReplayToModified", "downgradeExplorationToModified", "setModelContextPanel", "renderModelDossier",
       "renderDossier", "renderBoard", "renderFrontDoorDetail", "buildControls", "buildSubControls", "renderAll"]
        .every(f => censusFns.includes(f)), censusFns.join(","));
    const censusProbe = JSON.parse(await evalExpr(send, `(async () => {
      const out = {};
      for (const fn of ${JSON.stringify(["renderDossier", "renderBoard", "renderFrontDoorDetail", "renderModelDossier"])}) {
        document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 150));
        const src = EXPLAIN.sources[0]; const savedParent = src.parent;
        src.placeholder.remove(); src.parent = document.createElement("div");
        closeActiveExplain();                                                    // stranded
        const before = document.getElementById("dossier-body")?.textContent;
        try { window[fn] ? window[fn]() : eval(fn + "(currentModel(), currentPersp())"); } catch (e) {}
        out[fn] = { held: document.getElementById("dossier-body")?.textContent === before, level: PENDING_LEVEL };
        src.parent = savedParent; closeActiveExplain(); await new Promise(x => setTimeout(x, 200));
      }
      return JSON.stringify(out);
    })()`));
    assert("census: representative source-owning mutators ABORT before any DOM write and escalate to full",
      Object.values(censusProbe).every(v => v.held && v.level === "full"), JSON.stringify(censusProbe).slice(0, 220));

    /* B-2/C-1: downgrade abort → continuation replay; preset change discards a stale continuation */
    const dg = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      const replay = PERSPECTIVES.find(p => p.kind === "replay");
      document.getElementById("persp-preset").value = replay.id; applyPreset();
      await new Promise(x => setTimeout(x, 150));
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const src = EXPLAIN.sources[0]; const savedParent = src.parent;
      src.placeholder.remove(); src.parent = document.createElement("div");
      closeActiveExplain();                                                      // stranded
      const slider = document.querySelector('input[type="range"]');
      slider.value = slider.min; slider.dispatchEvent(new Event("input", { bubbles: true }));  // replay-edit → downgrade fires vs stranded
      await new Promise(x => setTimeout(x, 200));
      r.contRecorded = PENDING_DOWNGRADE !== null && PENDING_DOWNGRADE.kind === "replay";
      r.level = PENDING_LEVEL;
      src.parent = savedParent;
      r.close = closeActiveExplain();
      await new Promise(x => setTimeout(x, 300));
      r.converged = MODIFIED_FROM !== null && document.getElementById("persp-preset").value === "__modified"
        && /MODIFIED SCENARIO/.test(document.getElementById("out-margin-note").textContent)
        && /Modified scenario/.test(document.getElementById("dossier-body").textContent)
        && PENDING_DOWNGRADE === null && PENDING_LEVEL === null;
      // stale-continuation discard: strand a downgrade again, then change preset BEFORE the replay
      document.getElementById("persp-preset").value = replay.id; applyPreset(); await new Promise(x => setTimeout(x, 150));
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const s2 = EXPLAIN.sources[0]; const sp2 = s2.parent;
      s2.placeholder.remove(); s2.parent = document.createElement("div");
      closeActiveExplain();
      slider.value = slider.max; slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(x => setTimeout(x, 200));
      r.cont2 = PENDING_DOWNGRADE !== null;
      document.getElementById("persp-preset").value = "median"; applyPreset();   // newer identity transaction
      r.contDiscarded = PENDING_DOWNGRADE === null;                              // C-1: the head-clear IS the invalidation
      s2.parent = sp2; closeActiveExplain(); await new Promise(x => setTimeout(x, 300));
      r.noResurrect = document.getElementById("persp-preset").value === "median" && MODIFIED_FROM === null;
      return JSON.stringify(r);
    })()`));
    assert("B-2: an aborted replay-downgrade records its continuation and the replay converges selector+chip+note+dossier",
      dg.contRecorded && dg.level === "full" && dg.close === true && dg.converged, JSON.stringify(dg).slice(0, 260));
    assert("C-1: a newer preset selection DISCARDS the stale continuation — no obsolete identity resurrects",
      dg.cont2 && dg.contDiscarded && dg.noResurrect, JSON.stringify(dg).slice(0, 200));

    /* C-2: navigation-intent arbitration */
    const ni = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      // load intent survives a stranded tail and wins over close-scroll; preset-only change cancels
      window.scrollTo(0, 0);
      const route = PERSPECTIVES.find(p => p.kind === "exploration");
      loadExploration(route.id); await new Promise(x => setTimeout(x, 400));
      r.loadScrolled = window.scrollY > 0;                                        // normal path: immediate
      window.scrollTo(0, 0);
      NAV_INTENT = { kind: "load-scroll" };                                       // pending intent…
      document.getElementById("persp-preset").value = "median"; applyPreset();    // …preset-only change cancels it
      r.cancelled = NAV_INTENT === null;
      // hashchange outranks a pending load intent (newest explicit navigation wins)
      NAV_INTENT = { kind: "load-scroll" };
      location.hash = "#s3"; await new Promise(x => setTimeout(x, 300));
      r.hashWon = location.hash === "#s3" && (NAV_INTENT === null || NAV_INTENT.kind !== "load-scroll");
      const sec = document.getElementById("s3");
      r.revealed = !!(sec && [...document.querySelectorAll("#report details.report-section")].some(d => d.open));
      history.replaceState(null, "", location.pathname);
      return JSON.stringify(r);
    })()`));
    assert("C-2: load-scroll fires on the normal path; a preset-only change cancels a pending intent; hashchange outranks it",
      ni.loadScrolled && ni.cancelled && ni.hashWon && ni.revealed, JSON.stringify(ni).slice(0, 200));

    /* A-5a: deferred hash intent replays after the fault clears */
    const dh = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.querySelectorAll("#report details.report-section").forEach(d => { d.open = false; });
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const src = EXPLAIN.sources[0]; const savedParent = src.parent;
      src.placeholder.remove(); src.parent = document.createElement("div");
      location.hash = "#s5"; await new Promise(x => setTimeout(x, 250));          // close fails → intent deferred
      r.deferred = EXPLAIN.phase === "stranded" && NAV_INTENT !== null && NAV_INTENT.kind === "hash-reveal";
      r.notOpenYet = ![...document.querySelectorAll("#report details.report-section")].some(d => d.open);
      src.parent = savedParent;
      r.close = closeActiveExplain(); await new Promise(x => setTimeout(x, 300));
      const s5 = document.getElementById("s5");
      r.revealedAfter = !!(s5 && [...document.querySelectorAll("#report details.report-section")].some(d => d.open));
      history.replaceState(null, "", location.pathname);
      return JSON.stringify(r);
    })()`));
    assert("A-5a: a hashchange against a failed close DEFERS, then replays (close → restore → reveal) once the fault clears",
      dh.deferred && dh.notOpenYet && dh.close && dh.revealedAfter, JSON.stringify(dh).slice(0, 200));

    /* pageshow (bfcache) normalization + print-under-failure (P1-a) */
    const ps = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
      await new Promise(x => setTimeout(x, 200));
      r.normalized = EXPLAIN.phase === "idle" && document.querySelectorAll("dialog[data-explain-dialog]").length === 0;
      // print with a FAILED close: the open-all snapshot must be skipped
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const src = EXPLAIN.sources[0]; const savedParent = src.parent;
      src.placeholder.remove(); src.parent = document.createElement("div");
      document.querySelectorAll("#report details.report-section").forEach(d => { d.open = false; });
      window.dispatchEvent(new Event("beforeprint")); await new Promise(x => setTimeout(x, 150));
      r.snapshotSkipped = ![...document.querySelectorAll("#report details.report-section")].some(d => d.open);
      src.parent = savedParent; closeActiveExplain(); await new Promise(x => setTimeout(x, 150));
      // print with the dialog open and a HEALTHY close: receipts restored and printed in order
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      window.dispatchEvent(new Event("beforeprint")); await new Promise(x => setTimeout(x, 150));
      r.printRestored = EXPLAIN.phase === "idle" && !!document.querySelector("#out-margin-note > .tile-receipts");
      window.dispatchEvent(new Event("afterprint")); await new Promise(x => setTimeout(x, 100));
      const trig = document.getElementById("explain-trigger-tile-tails");
      trig.click(); await new Promise(x => setTimeout(x, 200));
      r.operableAfter = !!document.querySelector("dialog[data-explain-dialog]");
      closeActiveExplain(); await new Promise(x => setTimeout(x, 100));
      return JSON.stringify(r);
    })()`));
    assert("A-5c/P1-a: pageshow(persisted) normalizes to idle; a failed close skips the print snapshot; a healthy print restores receipts and stays operable",
      ps.normalized && ps.snapshotSkipped && ps.printRestored && ps.operableAfter, JSON.stringify(ps).slice(0, 200));

    /* typography — U-3/U-3b/U-4 on the EXACT nodes, in page and in dialog */
    const ty = JSON.parse(await evalExpr(send, `(async () => {
      const read = el => { const c = getComputedStyle(el); return { f: c.fontSize, lh: c.lineHeight, col: c.color, w: Math.round(el.getBoundingClientRect().width) }; };
      const r = {};
      const man = document.querySelector("#out-margin-note > .tile-mandatory");
      const rec = document.querySelector("#out-margin-note > .tile-receipts");
      const epi = document.querySelector(".identity-strip .id-epistemic");
      r.man = read(man); r.rec = read(rec); r.epi = { ...read(epi), style: getComputedStyle(epi).fontStyle };
      r.epiVisible = epi.getClientRects().length > 0;
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      r.inDialog = read(document.querySelector("dialog[data-explain-dialog] .tile-receipts"));
      closeActiveExplain(); await new Promise(x => setTimeout(x, 120));
      return JSON.stringify(r);
    })()`));
    const px = v => parseFloat(v.f), lh = v => parseFloat(v.lh) / parseFloat(v.f);
    assert("U-3: wrappers render 13.5px / ≥1.5 line-height / measured width (never an inert token)",
      px(ty.man) === 13.5 && px(ty.rec) === 13.5 && lh(ty.man) > 1.5 && ty.man.w > 0 && ty.man.w < 900,
      JSON.stringify([ty.man, ty.rec]));
    assert("U-3b: in-dialog receipts typography equals in-page", px(ty.inDialog) === px(ty.rec) && ty.inDialog.col === ty.rec.col,
      JSON.stringify([ty.inDialog, ty.rec]));
    assert("U-4: no tail surface renders at --ink-3, and .id-epistemic is promoted in place (12.5px, italic, visible, measured)",
      ty.man.col !== "rgb(136, 136, 136)" && ty.rec.col !== "rgb(136, 136, 136)"
      && px(ty.epi) === 12.5 && ty.epi.style === "italic" && ty.epi.col !== "rgb(136, 136, 136)" && ty.epiVisible,
      JSON.stringify(ty.epi));

    /* aria-live preservation (§18.6): the hero tile stays live-region-free */
    const live = await evalExpr(send, `document.querySelector(".tile-hero [aria-live], #out-margin-note[aria-live]") === null`);
    assert("§18.6: the restructure introduces no live-region semantics on the hero tile", live === true, String(live));
  });

  /* ================= coarse-pointer replacement + combined coarse print ================= */
  await withPage(async (send, nav) => {
    const co = JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      r.isCoarse = matchMedia("(pointer: coarse)").matches;   // the probe must not be vacuous
      const rec = document.querySelector("#out-margin-note > .tile-receipts");
      r.hiddenAtRest = getComputedStyle(rec).display === "none";
      r.mandatoryShown = getComputedStyle(document.querySelector("#out-margin-note > .tile-mandatory")).display !== "none";
      r.feasHidden = getComputedStyle(document.getElementById("out-feas-note")).display === "none";
      // negative control: without the readiness flag NOTHING hides
      document.documentElement.removeAttribute("data-explain-ready");
      r.negControl = getComputedStyle(rec).display !== "none";
      document.documentElement.dataset.explainReady = "1";
      // open under coarse: the display restore must show receipt text inside the dialog
      document.getElementById("explain-trigger-tile-tails").click(); await new Promise(x => setTimeout(x, 200));
      const inDlg = document.querySelector("dialog[data-explain-dialog] .tile-receipts");
      r.visibleInDialog = !!inDlg && getComputedStyle(inDlg).display !== "none" && inDlg.getClientRects().length > 0
        && inDlg.textContent.trim().length > 0;
      closeActiveExplain(); await new Promise(x => setTimeout(x, 120));
      return JSON.stringify(r);
    })()`));
    assert("coarse: receipts hidden at rest ONLY under (pointer:coarse ∧ data-explain-ready); mandatory never hides; visible with text in the open dialog",
      co.isCoarse && co.hiddenAtRest && co.mandatoryShown && co.feasHidden && co.negControl && co.visibleInDialog, JSON.stringify(co).slice(0, 220));
  }, { emulate: { device: { width: 390, height: 844 } } });
  await withPage(async (send) => {
    const isCoarse = await evalExpr(send, `matchMedia("(pointer: coarse)").matches`);
    const pr = await evalExpr(send, `getComputedStyle(document.querySelector("#out-margin-note > .tile-receipts")).display`);
    assert("P1-c combined coarse print: the emulation is real AND the print display restore beats the coarse hide",
      isCoarse === true && pr !== "none", `coarse=${isCoarse} display=${pr}`);
  }, { emulate: { device: { width: 390, height: 844 }, media: "print" } });

  /* ================= permalink ?s= × #hash combined startup (B-6) ================= */
  await withPage(async (send, nav) => {
    const me = FIXTURE.states["permalink-modified-exploration"];
    await nav("?s=" + encodeURIComponent(me.permalink.token) + "#s3");
    const combo = JSON.parse(await evalExpr(send, `(() => JSON.stringify({
      state: document.getElementById("persp-preset").value,
      note: document.getElementById("out-margin-note").textContent.slice(0, 30),
      revealed: [...document.querySelectorAll("#report details.report-section")].some(d => d.open),
    }))()`));
    assert("B-6 combined startup: the ?s= state loads AND the #hash section reveals in one arrival",
      combo.state === "__modified-exploration" && /MODIFIED RANGE EXPLORATION/.test(combo.note) && combo.revealed,
      JSON.stringify(combo));
  });

  /* ================= behavioral negative controls on a PATCHED app (C-3/R6) ================= */
  const patchedRun = async (patch, probe, emulate) => {
    const tmp = mkdtempSync(join(tmpdir(), "uxc-patched-"));
    cpSync(SITE_DIR, join(tmp, "site"), { recursive: true });
    writeFileSync(join(tmp, "site", "app.js"), patch(APP_SRC));
    try { return await withPage(probe, { htmlPath: join(tmp, "site", "index.html"), emulate }); }
    finally { try { rmSync(tmp, { recursive: true, force: true }); } catch {} }
  };
  {
    // startup-reorder mutation: reveal BEFORE the permalink load → the combined row must fail
    const broken = await patchedRun(
      src => {
        const b = 'explainRevealHashTarget(); // b9 UX-B: a deep link arriving on FIRST LOAD, not only on hashchange';
        if (!src.includes(b)) throw new Error("patch anchor missing");
        return src.replace(b, "/* startup reveal wire REMOVED (mutation control) */");
      },
      async (send, nav) => {
        const me = FIXTURE.states["permalink-modified-exploration"];
        await nav("?s=" + encodeURIComponent(me.permalink.token) + "#s3");
        return await evalExpr(send, `[...document.querySelectorAll("#report details.report-section")].some(d => d.open)`);
      });
    assert("C-3 negative control (startup wiring): deleting the first-load reveal wire BREAKS the combined row", broken === false, String(broken));
  }
  {
    // neutralized refreshTrafficDisplay: the live-traffic in-place-update row must fail
    /* the in-place update happens SYNCHRONOUSLY in the input handler; ~30ms later the
       debounced render's guard closes the dialog (shipped semantics). So: read the relocated
       line in the SAME tick as the dispatch, then assert the clean eventual state — closed,
       restored, the new value on the PAGE, never a strand. */
    const probeTraffic = async (send) => JSON.parse(await evalExpr(send, `(async () => {
      const r = {};
      document.getElementById("explain-trigger-dossier")?.click(); await new Promise(x => setTimeout(x, 200));
      const dlg = document.querySelector("dialog[data-explain-dialog]");
      r.open = !!dlg;
      const lineIn = () => dlg ? (dlg.querySelector(".dossier-traffic")?.textContent || "") : "";
      const before = lineIn();
      const sliders = [...document.querySelectorAll('input[type="range"]')];
      const rowText = s => { let el = s, out = ""; for (let i = 0; i < 4 && el; i++) { out = el.textContent || out; el = el.parentElement; if (/[Cc]ache hit|[Cc]ache-hit/.test(out)) break; } return out; };
      const tSlider = sliders.find(s => /[Cc]ache hit|[Cc]ache-hit/.test(rowText(s)));
      if (!tSlider) return JSON.stringify({ open: r.open, updated: false, noTrafficSlider: true });
      tSlider.value = String(Math.abs(parseFloat(tSlider.value) - parseFloat(tSlider.max)) > 1e-9 ? tSlider.max : tSlider.min);
      tSlider.dispatchEvent(new Event("input", { bubbles: true }));
      r.updated = lineIn() !== before && lineIn().length > 0;   // SAME-TICK read: the in-place update, inside the open dialog
      r.dialogStillOpen = !!document.querySelector("dialog[data-explain-dialog]");
      await new Promise(x => setTimeout(x, 300));               // the debounced render's guard-close runs
      r.noStrand = EXPLAIN.phase !== "stranded";
      r.settledIdle = EXPLAIN.phase === "idle";
      const pageLine = document.querySelector("#dossier-body .dossier-traffic");
      r.onPage = !!pageLine && pageLine.textContent === lineInText();
      function lineInText() { return r.updatedText || (r.updatedText = pageLine ? pageLine.textContent : ""); }
      r.cleanClose = r.settledIdle && document.querySelectorAll("dialog[data-explain-dialog]").length === 0;
      return JSON.stringify(r);
    })()`));
    await withPage(async (send) => {
      const ok = await probeTraffic(send);
      assert("B-3 in-place-update row: the traffic edit updates the RELOCATED line in the open dialog, then settles cleanly (no strand, restored to page)",
        ok.open && ok.updated && ok.dialogStillOpen && ok.noStrand && ok.cleanClose, JSON.stringify(ok));
    });
    const broken = await patchedRun(
      src => {
        const anchor = "function refreshTrafficDisplay() {";
        if (!src.includes(anchor)) throw new Error("patch anchor missing");
        return src.replace(anchor, anchor + " if (window.__uxcNeutralized !== false) { onChange(); return; } // NEUTRALIZED");
      },
      async (send) => { const r = await probeTraffic(send); return r.updated; });
    assert("C-3 negative control (neutralized traffic updater): the in-place-update row FAILS under the patch", broken === false, String(broken));
  }
  if (!existsSync(join(HERE, "..", "mcp-server"))) {
    console.log("SKIP  C-3 novel-writer census control (served tree: the release source graph lives in the repo, where sink-coverage runs it)");
  } else {
    // novel-writer census control: an injected writer into a registered-source subtree must be caught
    const { discoverSinks, stableSinkIds, classifySites } = await import("./sink-scanner.mjs");
    const ROOT = join(HERE, "..");
    const inject = (rel, raw) => rel === "site/app.js"
      ? raw.replace("function refreshTrafficDisplay() {",
          'function uxcNovelWriter() { document.querySelector("#dossier-body").textContent = "novel"; }\nfunction refreshTrafficDisplay() {')
      : raw;
    const { sites } = discoverSinks(ROOT, (rel) => inject(rel, readFileSync(join(ROOT, rel), "utf8")));
    const { unmatched } = classifySites(stableSinkIds(sites));
    assert("C-3 novel-writer control: an injected registered-source writer lands UNMATCHED (census fail-closed)",
      unmatched.some(u => u.fn === "uxcNovelWriter"), JSON.stringify(unmatched.slice(0, 2)));
  }

  console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL UX-C TESTS PASS");
  process.exit(failures ? 1 : 0);
}
main().catch(e => { console.log("HARNESS ERROR: " + e.message); process.exit(1); });
