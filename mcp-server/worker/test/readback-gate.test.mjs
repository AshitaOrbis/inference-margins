/* Readback-gate suite — the gate that let a broken Worker reach production.

   2026-08-27, in production: the T5 Worker deployed, `--readback` was run, and every tool that
   COMPUTES returned HTTP 503 / Cloudflare `error code: 1102` ("Worker exceeded resource limits")
   — including `list_scenario_space`, which had worked for months. `tools/list` kept answering
   200, and so did `get_report`. Those two were the only things the gate looked at, so the gate
   could see the SHAPE of the deployment and nothing about whether it worked.

   It also had no retry, so its one observation could not distinguish "the edge has not finished
   propagating" from "the bytes I just uploaded are broken". That ambiguity is what made the
   failure explainable-away, and it was explained away.

   These tests drive the real script as a subprocess against a local fake Worker, because the
   defect is in what the gate OBSERVES, and a unit test of its helpers would not have caught it.

   The first test is the regression: it reproduces the exact production shape — the new build is
   live and listing its new tools, and the compute path 503s. A gate that passes that is not a
   gate. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.resolve(__dirname, "..", "scripts", "release-gate.mjs");

const NEW_TOOLS = ["list_scenario_space", "query_margin_claims", "run_scenario", "explore_range",
  "get_report", "get_dossier", "adjust_rental_rate", "run_fleet_sections",
  /* U5 (dc-map DESIGN §6) */
  "list_datacenters", "get_datacenter", "rank_datacenters", "datacenter_schedule",
  "datacenter_impact", "datacenter_stakeholders", "price_token_from_site"];
const OLD_TOOLS = NEW_TOOLS.slice(0, 6);

/* U5: the gate now also checks that the live connector answers from the substrate release THIS
   TREE embedded, so a healthy fake has to report that same binding — read from the generated
   module, exactly as the gate reads it. There is no canned id that satisfies both sides. */
const EMBEDDED_DCMAP = (() => {
  const gen = path.resolve(__dirname, "..", "src", "gen", "dcmap", "release.gen.ts");
  const source = readFileSync(gen, "utf8");
  const status = /"status":\s*"([^"]+)"/.exec(source)?.[1];
  const id = /"release_id":\s*(null|"[^"]+")/.exec(source)?.[1];
  assert.ok(status && id, "src/gen/dcmap/release.gen.ts carries no embedded dc-map release identity");
  return { status: status === "ok" ? "ok" : "release-unavailable", release_id: id === "null" ? null : JSON.parse(id) };
})();

const EXPECT_BUILT_FROM = "cafe123";

/* A fake Worker. `plan` is consulted per request so a server can change behaviour over time,
   which is how propagation is modelled. */
function fakeWorker(plan) {
  let calls = 0;
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const msg = JSON.parse(body);
      const state = plan(++calls, msg);
      if (state.status && state.status !== 200) {
        /* Cloudflare's 1102 is an HTML error page, not JSON-RPC. */
        res.writeHead(state.status, { "content-type": "text/html" });
        res.end("<html><body>Worker exceeded resource limits<br>error code: 1102</body></html>");
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(state.body));
    });
  });
  return server;
}

const listResult = (tools) => ({ jsonrpc: "2.0", id: 1, result: { tools: tools.map(name => ({ name })) } });

/* ROUND 4b: the gate now reads the analyst-hypothesis entry's KIND and both live entries'
   MACHINE estimands, so a canned get_report reply can no more stand in for a healthy Worker than
   a canned number can for a computing tool — which is this file's own established principle. The
   healthy fixture therefore DELEGATES to the real compiled handler and adds only `release`, which
   is the Worker override's own field and the one thing the Node handler does not emit. A canned
   fixture here would have been a fixture that could not express the defect under test. */
const require_ = createRequire(import.meta.url);
const LOCAL_REPORT = require_(path.resolve(__dirname, "..", "..", "dist", "tools", "get_report.js"));
const reportResult = (builtFrom, { hypothesis = false, kind = null, estimand = null } = {}, id = "final-answer") => {
  const out = LOCAL_REPORT.handler({ id });
  const sc = { ...out.structuredContent,
    release: { built_from: builtFrom, site_release_commit: "deadbee", engine_revision: "v3.0.0" } };
  /* the two knobs exist so the NEGATIVE cases can reproduce the real pre-fix bundle exactly */
  if (kind) sc.kind = kind;
  if (estimand) sc.claims = (sc.claims || []).map((c, i) => (i === 0 ? { ...c, estimand } : c));
  const lead = ((out.content || [])[0] || {}).text || "";
  const content = hypothesis && id === "final-answer"
    ? [{ type: "text", text: lead + "; above 80% per the analyst" }]
    : out.content;
  return { jsonrpc: "2.0", id: 2, result: { content, structuredContent: sc } };
};

/* The gate no longer checks SHAPE — two cuts of that were defeated by placeholders. It now
   requires the live Worker to REPRODUCE what this tree's engine computes, and to answer
   differently for different inputs. So a "healthy" fake has to agree with the engine, which is
   the point: there is no canned value that satisfies it. These are read from the engine itself. */
const ENGINE = require_(path.resolve(__dirname, "..", "..", "..", "site", "engine.js"));
const enginePct = (modelId) => {
  const model = ENGINE.MODELS.find(m => m.id === modelId);
  const persp = ENGINE.PERSPECTIVES.find(p => p.id === "median");
  const st = ENGINE.applyPresetSettings(model, persp, { mode: "native" });
  return Math.round(ENGINE.workload(st, undefined, ENGINE.scenarioContext(st)).margin * 100);
};
/* the gate now issues a RANDOM rent challenge, so a HEALTHY fake has to actually answer it from
   the engine — which is the point: there is no canned reply that satisfies it. */
const engineAdjustedPct = (rent) => {
  const model = ENGINE.MODELS.find(m => m.id === "opus");
  const persp = ENGINE.PERSPECTIVES.find(p => p.id === "gptpro-r3");
  const st = ENGINE.applyPresetSettings(model, persp, { mode: "native" });
  st.rentAbsAll = rent;
  return Math.round(ENGINE.workload(st, undefined, ENGINE.scenarioContext(st)).margin * 100);
};
const computeResult = (name, modelId = "opus") => ({
  jsonrpc: "2.0", id: 3,
  result: {
    content: [{ type: "text", text: `${name}: computed` }],
    structuredContent: name === "list_scenario_space"
      ? { models: ["opus"], perspectives: ["median"], fleets: ["preset"], engine: "v3",
          override_bounds: { rentAbsAll: [0.5, 20] }, datacenters: EMBEDDED_DCMAP }
      : name === "list_datacenters"
      ? { tool: "list_datacenters", status: EMBEDDED_DCMAP.status === "ok" ? "ok" : "release-unavailable",
          release_id: EMBEDDED_DCMAP.release_id, sentence: "list_datacenters: computed", data: null }
      : { headline: { value: `≈${enginePct(modelId)}% (policy-labeled scenario output)` },
          costs: { per_mtok: 7.25 }, feasibility: { renderable: 7 }, engine: "v3", claims: [1] },
  },
});
/* route a compute call to the right canned-but-engine-agreeing reply */
/* The gate now compares the FULL structuredContent against this tree's own compiled tool, so a
   HEALTHY fake has to BE that tool. Nothing canned can stand in — which is the property under
   test: reproducing the payload requires running the engine. */
const LOCAL_ADJUST = require_(path.resolve(__dirname, "..", "..", "dist", "tools", "adjust_rental_rate.js"));
const LOCAL_SCENARIO = require_(path.resolve(__dirname, "..", "..", "dist", "tools", "run_scenario.js"));
const realResult = (mod, args, id) => {
  const out = mod.handler({ ...args });
  return { jsonrpc: "2.0", id, result: { content: out.content || [{ type: "text", text: "computed" }],
    structuredContent: out.structuredContent } };
};
const computeFor = (msg) => {
  const n = msg.params?.name;
  if (n === "adjust_rental_rate") return realResult(LOCAL_ADJUST, msg.params.arguments, 5);
  if (n === "run_scenario") return realResult(LOCAL_SCENARIO, msg.params.arguments, 6);
  return computeResult(n, msg.params?.arguments?.model ?? "opus");
};

/* Route a JSON-RPC message to the right canned reply for a HEALTHY worker at `builtFrom`. */
function healthy(msg, tools, builtFrom) {
  if (msg.method === "tools/list") return { body: listResult(tools) };
  const name = msg.params?.name;
  if (name === "get_report") return { body: reportResult(builtFrom, {}, msg.params?.arguments?.id) };
  return { body: computeFor(msg) };
}

async function runGate(server, { deadlineMs = 1500, expect = EXPECT_BUILT_FROM } = {}) {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    return await new Promise(resolve => {
      execFile(process.execPath, [GATE, "--readback", "--expect-built-from", expect], {
        env: { ...process.env, IM_MCP_URL: url, IM_READBACK_DEADLINE_MS: String(deadlineMs) },
        timeout: 30_000,
      }, (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr }));
    });
  } finally {
    await new Promise(r => server.close(r));
  }
}

test("REGRESSION 2026-08-27: the new build is live and every COMPUTING tool 503s — the gate must FAIL", async () => {
  /* Exactly what production looked like: tools/list and get_report answer 200 with the new
     build's identity, and the compute path returns Cloudflare 1102. The old gate passed this. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    return { status: 503 };
  });
  const r = await runGate(server);
  assert.notEqual(r.code, 0, "gate passed a deployment whose compute tools all 503 — this is the production defect");
  assert.match(r.stderr, /1102|compute|503/i, r.stderr);
  /* And it must NOT have burned the deadline retrying: the new build is provably live, so a
     compute failure is breakage, not propagation. */
  assert.match(r.stderr, /BROKEN|not propagation/i, r.stderr);
});

test("propagation lag is tolerated: the old build answers first, the new one arrives, gate PASSES", async () => {
  /* Flip on the SECOND tools/list, i.e. between the gate's first and second attempt, so the
     scenario is "attempt 1 saw the old build, attempt 2 sees the new one" regardless of how
     many probes an attempt makes. */
  let lists = 0;
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") lists++;
    const live = lists <= 1 ? { tools: OLD_TOOLS, from: "0ldbuil" } : { tools: NEW_TOOLS, from: EXPECT_BUILT_FROM };
    return healthy(msg, live.tools, live.from);
  });
  const r = await runGate(server, { deadlineMs: 8000 });
  assert.equal(r.code, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /readback OK/i, r.stdout);
});

test("a healthy deployment of the expected build PASSES", async () => {
  const server = fakeWorker((_n, msg) => healthy(msg, NEW_TOOLS, EXPECT_BUILT_FROM));
  const r = await runGate(server);
  assert.equal(r.code, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /readback OK/i, r.stdout);
});

test("the WRONG build serving healthily FAILS — identity, not just shape", async () => {
  /* Round 5's P2: two tool names and one semantic exclusion cannot tell you WHICH bundle is
     live. A different build with the same tool surface must not pass. */
  const server = fakeWorker((_n, msg) => healthy(msg, NEW_TOOLS, "0therbd"));
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate accepted a worker reporting a different built_from");
  assert.match(r.stderr, /built_from|identity/i, r.stderr);
});

test("a stale build that never propagates FAILS at the deadline rather than hanging or passing", async () => {
  const server = fakeWorker((_n, msg) => healthy(msg, OLD_TOOLS, "0ldbuil"));
  const t0 = Date.now();
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, r.stdout);
  assert.ok(Date.now() - t0 < 25_000, "gate did not terminate near its deadline");
  assert.match(r.stderr, /STALE|did not propagate|deadline/i, r.stderr);
});

test("the rec-5 separation is still enforced on the live surface", async () => {
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, { hypothesis: true }, msg.params?.arguments?.id) };
    return { body: computeFor(msg) };
  });
  const r = await runGate(server);
  assert.notEqual(r.code, 0, "gate accepted a live final-answer carrying the above-80 hypothesis");
  /* ROUND 4b: this used to assert the message said "above 80", because the detector was a phrase
     list. That list has been removed — it false-positived on `identityLine`, which legitimately
     contains "...the above-80 reading is a separately labeled adopted analyst judgment, not a
     calculator output...", i.e. the sentence that PERFORMS the separation. A gate that terminal-
     BROKENs an honest deployment is a gate someone learns to explain away.
     What catches this injection now is the stronger property: the live entry must REPRODUCE what
     this tree renders. So the assertion is on the gate's verdict and on it naming the entry,
     not on it guessing the same words the injector used. */
  assert.match(r.stderr, /final-answer/i, r.stderr);
  assert.match(r.stderr, /lead sentence|does not reproduce|evidence-ranking tokens/i, r.stderr);
});

test("ROUND 4b: the real evidence-ranking TOKENS reappearing in final-answer FAIL — the round-4 defect itself", async () => {
  /* The reproduce check above catches ANY divergence, so it would catch this too. This case
     exists to prove the rec-5 token detector fires on its own, on the actual defect shape:
     the engine's own ranking tokens back inside the entry titled THE FINAL ANSWER. It runs
     before the reproduce check, so its message is the one that surfaces. */
  const RANKING = ENGINE.finalAnswer().tokens.mostPlausibleLine;
  assert.ok(RANKING && RANKING.length > 20, "no ranking token to inject — this test would be vacuous");
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") {
      const real = reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id).result;
      if (msg.params?.arguments?.id === "final-answer")
        real.structuredContent = { ...real.structuredContent,
          content: real.structuredContent.content + "\n\n" + RANKING };
      return { body: { jsonrpc: "2.0", id: 2, result: real } };
    }
    return { body: computeFor(msg) };
  });
  const r = await runGate(server);
  assert.notEqual(r.code, 0, "gate accepted a live final-answer carrying the evidence-ranking tokens");
  assert.match(r.stderr, /evidence-ranking tokens/i, r.stderr);
});

test("ROUND 4b: a live analyst-hypothesis still tagged as the calculator's answer FAILS", async () => {
  /* The round-4b defect exactly: kind "final-answer" on the entry that carries the ranking. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report")
      return { body: reportResult(EXPECT_BUILT_FROM,
        msg.params?.arguments?.id === "analyst-hypothesis" ? { kind: "final-answer" } : {},
        msg.params?.arguments?.id) };
    return { body: computeFor(msg) };
  });
  const r = await runGate(server);
  assert.notEqual(r.code, 0, "gate accepted a live analyst-hypothesis tagged as the calculator's answer");
  assert.match(r.stderr, /reports kind|calculator's answer class/i, r.stderr);
});

test("ROUND 4b: a live entry whose MACHINE estimand calls it a verbatim archive fetch FAILS", async () => {
  /* The other half of the round-4b finding: prose corrected, machine block not. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") {
      const id = msg.params?.arguments?.id;
      const live = id === "final-answer" || id === "analyst-hypothesis";
      return { body: reportResult(EXPECT_BUILT_FROM,
        live ? { estimand: "modeled unit direct-serving contribution margin (flagship baseline carried by a verbatim archive fetch response)" } : {},
        id) };
    }
    return { body: computeFor(msg) };
  });
  const r = await runGate(server);
  assert.notEqual(r.code, 0, "gate accepted a live entry whose machine claim calls it an archive fetch");
  assert.match(r.stderr, /verbatim archive fetch/i, r.stderr);
});

test("ROUND 6: a compute tool answering in PROSE ONLY fails — structuredContent is required, as the comment always said", async () => {
  /* Round 6 defeated the first cut of this predicate with exactly this payload: it accepted
     `structuredContent OR any non-empty text`, so a degraded Worker could be certified as having
     computed while returning a placeholder sentence. The comment specified structured output and
     the code did not enforce it. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    return { body: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "placeholder only; no computation happened" }] } } };
  });
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate certified a prose-only response as a computation");
  assert.match(r.stderr, /structuredContent|prose only/i, r.stderr);
});

test("ROUND 6: an EMPTY structuredContent object is not a computation either", async () => {
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    return { body: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "ok" }], structuredContent: {} } } };
  });
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate accepted an empty structuredContent object");
});

test("ROUND 6/7 control: get_report may answer with PROVENANCE ONLY — no computed fields — and still pass", async () => {
  /* Round 7 P2: the first name of this test claimed get_report could answer with NO
     structuredContent at all, while the fixture supplied `structuredContent.release`. It had to:
     without it the gate cannot read the build identity and fails for a different reason, so the
     test never demonstrated what its name said.

     What it actually establishes — and what matters — is that the COMPUTE schema requirement is
     NOT applied to the archive read: get_report carries provenance, not computed fields, and a
     healthy Worker must still pass. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") {
      /* ROUND 4b: still the point of this control — get_report is held to NO computed-field
         requirement. What it IS held to is provenance and entry identity: the release block, the
         kind, the machine claim, and the rendered entry itself. Those are not computation, and
         stripping them would turn this control into an assertion that a Worker may misdescribe
         what an entry is — which is the defect round 4b found, not a property worth protecting.
         So the fixture drops every COMPUTE field the compute gate demands (headline, costs,
         feasibility) and keeps exactly what get_report legitimately emits. */
      const real = reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id).result;
      const { headline, costs, feasibility, ...provenanceOnly } = real.structuredContent;
      return { body: { jsonrpc: "2.0", id: 2, result: {
        content: real.content,
        structuredContent: { ...provenanceOnly, release: { built_from: EXPECT_BUILT_FROM } } } } };
    }
    return { body: computeFor(msg) };
  });
  const r = await runGate(server);
  assert.equal(r.code, 0, r.stderr || r.stdout);
});

test("a compute tool that answers 200 with NO computed result FAILS — a 200 is not a computation", async () => {
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    return { body: { jsonrpc: "2.0", id: 3, result: { content: [], isError: true } } };
  });
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate accepted an isError compute response");
});

/* ---------------------------------------------------------------------------------------
   --parity (round-6 P1-5). index.html's footer promises the connector serves "the same engine
   and claims registry"; deploy.sh deploys Pages only, so that promise goes false the moment
   Pages lands and stays false until the Worker deploy does too. Nothing in the release path
   noticed. These drive the real verb against a fake site + fake connector. */
async function runParity(server, siteStamp) {
  const site = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(`<html><body><span id="release-commit">${siteStamp}</span></body></html>`);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  await new Promise(r => site.listen(0, "127.0.0.1", r));
  try {
    return await new Promise(resolve => {
      execFile(process.execPath, [GATE, "--parity"], {
        env: { ...process.env,
          IM_MCP_URL: `http://127.0.0.1:${server.address().port}`,
          IM_SITE_URL: `http://127.0.0.1:${site.address().port}` },
        timeout: 30_000,
      }, (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr }));
    });
  } finally {
    await new Promise(r => server.close(r));
    await new Promise(r => site.close(r));
  }
}
const reportWithSiteStamp = (stamp) => ({
  jsonrpc: "2.0", id: 1,
  result: { content: [{ type: "text", text: "THE FINAL ANSWER" }],
    structuredContent: { release: { built_from: "cafe123", site_release_commit: stamp } } },
});

test("parity: connector built against the live site release PASSES", async () => {
  const server = fakeWorker(() => ({ body: reportWithSiteStamp("abc1234") }));
  const r = await runParity(server, "abc1234");
  assert.equal(r.code, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /parity OK/i, r.stdout);
});

test("parity: a SKEWED pair FAILS and names both stamps — the footer's promise is false meanwhile", async () => {
  const server = fakeWorker(() => ({ body: reportWithSiteStamp("0dd9999") }));
  const r = await runParity(server, "abc1234");
  assert.notEqual(r.code, 0, "the gate accepted two public surfaces built from different releases");
  assert.match(r.stderr, /SKEWED/, r.stderr);
  assert.match(r.stderr, /abc1234/, r.stderr);
  assert.match(r.stderr, /0dd9999/, r.stderr);
});

test("parity: a connector too old to state its binding is UNKNOWN, and UNKNOWN is not a pass", async () => {
  /* the real 2026-08-13 connector behaves exactly like this — it predates the release block. An
     unanswerable parity question must not read as an answered one. */
  const server = fakeWorker(() => ({ body: { jsonrpc: "2.0", id: 1,
    result: { content: [{ type: "text", text: "THE FINAL ANSWER" }] } } }));
  const r = await runParity(server, "abc1234");
  assert.notEqual(r.code, 0, "an unreportable binding was treated as parity");
  assert.match(r.stderr, /UNKNOWN/, r.stderr);
});

test("parity: an unreachable connector FAILS rather than passing by silence", async () => {
  const server = fakeWorker(() => ({ status: 503 }));
  const r = await runParity(server, "abc1234");
  assert.notEqual(r.code, 0, r.stdout);
});

test("ROUND 7: a placeholder OBJECT is not a computation — presence is not a schema", async () => {
  /* Round 7 got exactly this past the previous cut: `{placeholder:true}` is a non-empty object,
     so "structuredContent is present" passed while nothing had been computed. */
  for (const sc of [{ placeholder: true }, { note: "ok" }, { models: [] }]) {
    const server = fakeWorker((_n, msg) => {
      if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
      if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
      return { body: { jsonrpc: "2.0", id: 3, result: {
        content: [{ type: "text", text: "placeholder only; no computation happened" }], structuredContent: sc } } };
    });
    const r = await runGate(server, { deadlineMs: 1200 });
    assert.notEqual(r.code, 0, `gate accepted structuredContent ${JSON.stringify(sc)} as a computation`);
  }
});

test("ROUND 8: a schema-shaped answer that does not MATCH the engine FAILS", async () => {
  let mutatedServed = false;
  /* Round 8 defeated shape checking outright: right key names, plausible values, a real-looking
     headline, no arithmetic. The gate no longer asks what the response LOOKS like — it asks
     whether the live Worker reproduces what this tree's engine computes. A wrong-but-plausible
     number is the case that must fail. */
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    if (msg.params?.name === "list_scenario_space") return { body: computeFor(msg) };
    /* bq-2188: and `list_datacenters`, for the same reason `list_scenario_space` is here. The U5
       substrate check runs BEFORE the challenge, and it only runs at all once a dc-map release
       exists to embed — which `b216807` made true. A fake that answers discovery but not
       `list_datacenters` is stopped at that earlier check, so this test USED to pass on a message
       about release identity while its own assertion — that a wrong-but-plausible headline fails
       for the VALUE — was never reached. Answering it lets the case fail for the reason it names. */
    if (msg.params?.name === "list_datacenters") return { body: computeFor(msg) };
    if (msg.params?.name === "adjust_rental_rate") return { body: computeFor(msg) };
    /* ISOLATED TO THE VALUE (Astra xhigh review, 2026-09-10, finding B1). The old fixture returned
       a hand-written five-field object, so the gate rejected a payload that differed from the real
       one in dozens of places and the assertion below was satisfied whether or not the HEADLINE was
       wrong — the one thing the case is named for. Now the fake answers with THIS TREE'S OWN
       run_scenario payload and perturbs exactly one string inside it: the headline value. Every
       other byte is correct, so a pass here would mean the gate cannot see a wrong number, which is
       precisely round 8's original defeat. */
    if (msg.params?.name === "run_scenario") {
      mutatedServed = true;
      const real = realResult(LOCAL_SCENARIO, msg.params.arguments, 6);
      const sc = JSON.parse(JSON.stringify(real.result.structuredContent));
      sc.headline.value = String(sc.headline.value).replace(/≈\d+%/, "≈77%");
      assert.notEqual(sc.headline.value, real.result.structuredContent.headline.value,
        "the fixture failed to perturb the headline, so this case is no longer testing a wrong value");
      return { body: { ...real, result: { ...real.result, structuredContent: sc } } };
    }
    return { body: computeFor(msg) };
  });
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate accepted a headline the engine does not compute");
  /* GPT Pro session 1 round 3, finding N5: the earlier alternation also accepted
     "transport timeout while calling run_scenario" — naming the tool is not proving the COMPARISON
     rejected a wrong value. Require the gate's own comparison-failure wording, and require the
     fixture to have actually been reached, so a case that never got as far as run_scenario fails
     here instead of passing on someone else's rejection. */
  assert.equal(mutatedServed, true, "the gate never called run_scenario, so this case proved nothing");
  assert.match(r.stderr, /RANDOM CHALLENGE FAILED|do not match|does not match|bytes that do not match/i, r.stderr);
});

test("ROUND 8: a CONSTANT answer FAILS — the same headline for every model is not a computation", async () => {
  const server = fakeWorker((_n, msg) => {
    if (msg.method === "tools/list") return { body: listResult(NEW_TOOLS) };
    if (msg.params?.name === "get_report") return { body: reportResult(EXPECT_BUILT_FROM, {}, msg.params?.arguments?.id) };
    if (msg.params?.name === "list_scenario_space") return { body: computeFor(msg) };
    /* bq-2188: same gap as the case above, and this one was worse because it asserts only that the
       gate refused, not why — so once a release existed it went on passing while never reaching
       any computation check at all. */
    if (msg.params?.name === "list_datacenters") return { body: computeFor(msg) };
    /* THE HARDEST CONSTANT SURFACE, not the laziest (Astra xhigh review, 2026-09-10, finding B1).
       The old fixture answered `adjust_rental_rate` with a run_scenario-shaped object, which the
       gate rejects on shape long before it can judge whether the surface VARIES. This one answers
       with a real, this-tree-computed `adjust_rental_rate` payload — but always the payload for ONE
       FIXED argument set, whatever was asked for. That is what a hard-coded surface actually looks
       like: individually plausible, collectively constant. */
    if (msg.params?.name === "adjust_rental_rate")
      return { body: realResult(LOCAL_ADJUST, { company: "anthropic", rent_usd_per_hr: 2.4 }, 5) };
    /* And the same for run_scenario, for the same reason (Astra xhigh round 2, finding B1): the old
       fixture answered it with a hand-written object, which gives the gate a SHAPE to reject, so the
       case could pass without any check about variation ever running. Every tool this surface serves
       is now a real, this-tree-computed payload for ONE FIXED input. Nothing here is malformed;
       the only thing wrong with it is that it does not move. */
    if (msg.params?.name === "run_scenario")
      return { body: realResult(LOCAL_SCENARIO, { model: "opus" }, 6) };
    return { body: computeFor(msg) };
  });
  const r = await runGate(server, { deadlineMs: 1200 });
  assert.notEqual(r.code, 0, "gate accepted a surface that answers identically regardless of input");
  /* ASSERT THE REASON, not just the refusal. A test that only checks a non-zero exit passes on any
     rejection, including one from a check it never meant to exercise — which is how this case went
     on passing for sixteen days on a message about release identity. Note what the reason turns out
     to BE: today's gate catches a constant surface at the RANDOM CHALLENGE, because a payload that
     does not move with its arguments stops matching the local oracle on the first draw whose
     arguments differ. The `seen.size < 3` detector below it is a backstop for the case where the
     draws collide, not the first line of defence. Pinning the reason is what makes that visible
     instead of assumed. */
  assert.match(r.stderr, /RANDOM CHALLENGE FAILED|identical payloads/i, r.stderr);
  /* Name the TOOL as well as the check. Astra round 2, B1: an assertion that accepts any
     computation failure cannot tell the constant-adjust_rental_rate surface this fixture builds
     from an unrelated rejection somewhere else in the chain. */
  assert.match(r.stderr, /adjust_rental_rate/, r.stderr);
});

/* ── The 2026-08-28 defect: the gate returned `readback OK` on a still-broken deployment ──
   The randomised challenge draws a perspective and a capital-recovery basis at random, and the
   failure lives on ONE expensive corner of that space, so three random draws usually miss it.
   The gate now also issues the exact production challenge six times, sequentially. These three
   tests pin that: it must fire when only the pinned corner fails, it must fire on a LATER call
   rather than only the first, and it must not fire on a healthy build. */

const EXACT_CHALLENGE = { company: "anthropic", rent_usd_per_hr: 6.281173,
  perspective: "gptpro-r3", capital_recovery: "on", cost_of_capital_pct: 8.5 };
const isExactChallenge = (msg) => {
  const a = msg.params?.arguments;
  return msg.params?.name === "adjust_rental_rate" && a
    && a.rent_usd_per_hr === EXACT_CHALLENGE.rent_usd_per_hr
    && a.perspective === EXACT_CHALLENGE.perspective
    && a.capital_recovery === EXACT_CHALLENGE.capital_recovery
    && a.cost_of_capital_pct === EXACT_CHALLENGE.cost_of_capital_pct;
};

test("2026-08-28 REGRESSION: healthy on every RANDOM draw, 1102 on the pinned production challenge — the gate must FAIL", async () => {
  /* This is the deployment that shipped on 2026-08-28 and was certified `readback OK`. Every
     randomised challenge computes correctly; only the known-heavy parameterisation 503s. */
  const server = fakeWorker((_n, msg) => {
    if (isExactChallenge(msg)) return { status: 503 };
    return healthy(msg, NEW_TOOLS, EXPECT_BUILT_FROM);
  });
  const r = await runGate(server, { deadlineMs: 1500 });
  assert.notEqual(r.code, 0, "the gate passed the exact deployment that failed in production on 2026-08-28");
  assert.match(r.stderr, /PINNED PRODUCTION CHALLENGE FAILED/i, r.stderr);
  assert.match(r.stderr, /6\.281173/, "the failure must quote the arguments that failed");
});

test("2026-08-28 REGRESSION: the pinned challenge fails on the FOURTH call — the gate must still FAIL", async () => {
  /* The observed production shape was 200, 200, 200, 503, 200: the isolate's committed heap
     ratchets across consecutive invocations, so it is the later calls that die. A gate that
     issued the pinned challenge ONCE would have passed this. */
  let exact = 0;
  const server = fakeWorker((_n, msg) => {
    if (isExactChallenge(msg) && ++exact === 4) return { status: 503 };
    return healthy(msg, NEW_TOOLS, EXPECT_BUILT_FROM);
  });
  const r = await runGate(server, { deadlineMs: 1500 });
  assert.notEqual(r.code, 0, "a failure on the fourth identical call was not caught — one call is not the gate");
  assert.match(r.stderr, /PINNED PRODUCTION CHALLENGE FAILED on call 4 of 6/i, r.stderr);
});

test("NON-VACUITY: the pinned challenge really is issued six times against a healthy build, and PASSES", async () => {
  /* Both directions. A check that never runs cannot fail, and a check that fires on an honest
     deployment is worse than none — this gate has already false-positived once, in round 4b. */
  let exact = 0;
  const server = fakeWorker((_n, msg) => {
    if (isExactChallenge(msg)) exact++;
    return healthy(msg, NEW_TOOLS, EXPECT_BUILT_FROM);
  });
  const r = await runGate(server, { deadlineMs: 1500 });
  assert.equal(r.code, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /readback OK/i, r.stdout);
  assert.equal(exact, 6, `the pinned challenge was issued ${exact} times, expected exactly 6`);
});
