// Transport suite — spawn the REAL entrypoints: stdio (dist/stdio.js) and stateless
// streamable HTTP (dist/http.js on an ephemeral port). Handshake, tools/list = 8 read-only
// tools, example round-trips, malformed input → MCP error not crash, GET /mcp → 405,
// oversized body → 413, statelessness across clients.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* U5 (dc-map DESIGN §6) appended seven datacenter tools to the original eight. Both groups are
   named explicitly so a drift in either is a failure, and the read-only property is asserted over
   the whole surface rather than over a count. */
const ORIGINAL_EIGHT = ["adjust_rental_rate", "explore_range", "get_dossier", "get_report",
  "list_scenario_space", "query_margin_claims", "run_fleet_sections", "run_scenario"];
const DATACENTER_SEVEN = ["datacenter_impact", "datacenter_schedule", "datacenter_stakeholders",
  "get_datacenter", "list_datacenters", "price_token_from_site", "rank_datacenters"];

async function expectReadOnlyToolSurface(client) {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 15);
  for (const t of tools) assert.equal(t.annotations?.readOnlyHint, true, t.name);
  assert.deepEqual(tools.map((t) => t.name).sort(), [...ORIGINAL_EIGHT, ...DATACENTER_SEVEN].sort());
}

test("stdio transport — handshake, tools/list, round-trips, malformed input", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(ROOT, "dist/stdio.js")],
    cwd: ROOT,
    stderr: "ignore",
  });
  const client = new Client({ name: "transport-test-stdio", version: "0.0.0" });
  await client.connect(transport);
  try {
    await expectReadOnlyToolSurface(client);

    const run = await client.callTool({ name: "run_scenario", arguments: { model: "opus" } });
    assert.ok(!run.isError);
    /* im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
       63 -> 68, re-minted from the executed reading. This is the calculator's own default state —
       the reference plus the ratified +3-month closed-lab prior — so it moves with the reference
       (51.1786 -> 57.8814) and the ÷E relationship between them is byte-unchanged, which is the
       evidence the ruling touched procurement and not the lead prior. Both halves are asserted: the
       structured receipt AND the rendered sentence, so a transport that silently stopped rendering
       the figure could not pass this. */
    assert.equal(run.structuredContent.selection_receipt.this_result_pct, 68);
    assert.ok(run.content[0].text.includes("≈68% (policy-labeled scenario output — unit serving, not company GM"));
    assert.ok(run.content[0].text.includes("---MACHINE---"), "stdio artifact carries the machine block (sidecar contract)");
    assert.ok(Array.isArray(run.structuredContent.claims_sidecar) && run.structuredContent.claims_sidecar.length >= 1,
      "content-addressed sidecar on the stdio transport");

    const claims = await client.callTool({ name: "query_margin_claims", arguments: { bucket: "b8090" } });
    assert.ok(!claims.isError);
    assert.ok(claims.structuredContent.groups.length >= 1);

    // malformed: missing required arg → MCP error, transport survives
    let errored = false;
    try {
      const bad = await client.callTool({ name: "run_scenario", arguments: {} });
      errored = bad.isError === true;
    } catch {
      errored = true;
    }
    assert.ok(errored, "missing model must error");
    // still alive after the error
    const again = await client.callTool({ name: "list_scenario_space", arguments: {} });
    assert.ok(!again.isError, "server survives malformed input");
  } finally {
    await client.close();
  }
});

test("streamable HTTP transport — stateless /mcp, GET→405, body cap, cross-client statelessness", async () => {
  const child = spawn(process.execPath, [path.join(ROOT, "dist/http.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("http server did not announce its port")), 10000);
    let buf = "";
    child.stdout.on("data", (c) => {
      buf += c.toString();
      const m = buf.match(/listening on (http:\/\/[^\s]+\/mcp)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    child.on("exit", (code) => { clearTimeout(timer); reject(new Error("http server exited early: " + code)); });
  });

  try {
    const client = new Client({ name: "transport-test-http", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    await expectReadOnlyToolSurface(client);
    const run = await client.callTool({ name: "run_scenario", arguments: { model: "grok", perspective: "xaiopp" } });
    /* im-release-edit-r3 (2026-09-10, same ruling): 12 -> 19, the grok+xaiopp replay, moved by the
       adopted fleet rents and NOT by the Grok cache correction — this replay runs at the dive's
       Uncached 3:1 / 0% convention, so `cacheReadMult` 25 -> 15 cannot reach it. Same value the
       in-memory harness reports, which is the point of asserting it once per transport. */
    assert.equal(run.structuredContent.selection_receipt.this_result_pct, 19);
    assert.ok(run.content[0].text.includes("Replay of a published operating point"));
    assert.ok(run.content[0].text.includes("---MACHINE---"), "HTTP artifact carries the machine block (sidecar contract)");
    assert.ok(Array.isArray(run.structuredContent.claims_sidecar) && run.structuredContent.claims_sidecar.length >= 1,
      "content-addressed sidecar on the HTTP transport");
    await client.close();

    // statelessness: a brand-new client with no session works identically
    const client2 = new Client({ name: "transport-test-http-2", version: "0.0.0" });
    await client2.connect(new StreamableHTTPClientTransport(new URL(url)));
    const explore = await client2.callTool({ name: "explore_range", arguments: { range: "b8090" } });
    assert.ok(explore.structuredContent.routes.length >= 1);
    await client2.close();

    // GET → 405 (no SSE stream in stateless mode)
    const get = await fetch(url, { method: "GET" });
    assert.equal(get.status, 405);

    // DELETE → 405 as well (single POST endpoint)
    const del = await fetch(url, { method: "DELETE" });
    assert.equal(del.status, 405);

    // wrong path → 404
    const notFound = await fetch(url.replace("/mcp", "/other"), { method: "POST", body: "{}" });
    assert.equal(notFound.status, 404);

    // oversized body → 413 (Pro review 2026-07-29 rec 2 / C-4, re-found as bq-1014,
    // bq-1251, bq-1196, bq-1252): this used to be `.catch(() => null)` + `if (big) ...`,
    // which silently passed when the connection was reset instead of answering with the
    // documented 413 — the exact false-green the review flagged. Assert the 413
    // unconditionally now; robustness.test.mjs additionally proves this over a raw socket,
    // including the chunked-transfer-encoding case fetch() cannot construct.
    const big = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: "\"" + "x".repeat(70 * 1024) + "\"",
    });
    assert.equal(big.status, 413);

    // malformed JSON → 400, server keeps serving
    const badJson = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: "{not json",
    });
    assert.equal(badJson.status, 400);
    const client3 = new Client({ name: "transport-test-http-3", version: "0.0.0" });
    await client3.connect(new StreamableHTTPClientTransport(new URL(url)));
    const list = await client3.callTool({ name: "list_scenario_space", arguments: {} });
    assert.ok(!list.isError, "server survives malformed HTTP bodies");
    await client3.close();
  } finally {
    child.kill("SIGTERM");
  }
});
