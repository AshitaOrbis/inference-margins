// Transport suite — spawn the REAL entrypoints: stdio (dist/stdio.js) and stateless
// streamable HTTP (dist/http.js on an ephemeral port). Handshake, tools/list = 6 read-only
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

async function expectSixReadOnlyTools(client) {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 6);
  for (const t of tools) assert.equal(t.annotations?.readOnlyHint, true, t.name);
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    "explore_range", "get_dossier", "get_report", "list_scenario_space", "query_margin_claims", "run_scenario",
  ]);
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
    await expectSixReadOnlyTools(client);

    const run = await client.callTool({ name: "run_scenario", arguments: { model: "opus" } });
    assert.ok(!run.isError);
    assert.equal(run.structuredContent.selection_receipt.this_result_pct, 77);
    assert.ok(run.content[0].text.includes("≈77% (unit serving, not company GM)"));

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
    await expectSixReadOnlyTools(client);
    const run = await client.callTool({ name: "run_scenario", arguments: { model: "grok", perspective: "xaiopp" } });
    assert.equal(run.structuredContent.selection_receipt.this_result_pct, 27);
    assert.ok(run.content[0].text.includes("Replay of a published operating point"));
    await client.close();

    // statelessness: a brand-new client with no session works identically
    const client2 = new Client({ name: "transport-test-http-2", version: "0.0.0" });
    await client2.connect(new StreamableHTTPClientTransport(new URL(url)));
    const explore = await client2.callTool({ name: "explore_range", arguments: { range: "b90plus" } });
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

    // oversized body → 413
    const big = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: "\"" + "x".repeat(70 * 1024) + "\"",
    }).catch(() => null);
    if (big) assert.equal(big.status, 413);

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
