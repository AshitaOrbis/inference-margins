// Robustness suite (Pro review 2026-07-29 rec 2 / findings C-4, C-5 — independently
// re-found as bq-1014, bq-1251, bq-1196, bq-1252). Spawns the REAL entrypoint (dist/http.js,
// same pattern as transports.test.mjs) and drives it with a RAW net.connect socket — fetch()
// cannot send a malformed Host header or a chunked body without Content-Length, and it also
// cannot tell a real 413 response apart from a connection reset, which is exactly the
// false-green this suite exists to close (see the transports.test.mjs fix in the same
// commit).
import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function startServer() {
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
  const parsed = new URL(url);
  return { child, url, port: Number(parsed.port) };
}

/** Sends a raw byte sequence over a fresh TCP connection to the server and collects
    whatever comes back until the socket closes (or a timeout, treated as a hang — not a
    valid response either way). Raw sockets are the point: they are the only way to put a
    syntactically-invalid Host header or a chunked-without-Content-Length body on the wire. */
function rawRequest(port, head, bodyChunks = []) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(head);
      for (const c of bodyChunks) socket.write(c);
    });
    let data = Buffer.alloc(0);
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ data: data.toString("latin1"), timedOut: true });
    }, 5000);
    socket.on("data", (c) => { data = Buffer.concat([data, c]); });
    socket.on("error", (err) => { clearTimeout(timer); reject(err); });
    socket.on("close", () => { clearTimeout(timer); resolve({ data: data.toString("latin1"), timedOut: false }); });
  });
}

function statusLine(raw) {
  return raw.data.split("\r\n")[0] ?? "";
}

/** Encodes `buf` as an HTTP/1.1 chunked-transfer body (used for T5: a body with no
    Content-Length at all, so the ONLY way the server can enforce the cap is by counting
    bytes as they stream in). */
function chunkedBody(buf, chunkSize) {
  const parts = [];
  for (let i = 0; i < buf.length; i += chunkSize) {
    const chunk = buf.subarray(i, Math.min(i + chunkSize, buf.length));
    parts.push(Buffer.from(chunk.length.toString(16) + "\r\n"));
    parts.push(chunk);
    parts.push(Buffer.from("\r\n"));
  }
  parts.push(Buffer.from("0\r\n\r\n"));
  return parts;
}

/** Liveness + functional survival: the child process has not exited, and a brand-new
    client on a brand-new connection still gets a real MCP response. */
async function assertServerSurvives(child, url) {
  assert.equal(child.exitCode, null, "child process must not have exited");
  assert.equal(child.killed, false, "child process must not have been killed");
  const client = new Client({ name: "robustness-liveness-check", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const { tools } = await client.listTools();
  // Eight original tools + U5's seven datacenter tools (dc-map DESIGN §6).
  assert.equal(tools.length, 15, "server must still serve a normal MCP request after the probe");
  await client.close();
}

test("malformed Host headers do not crash the process (C-5)", async () => {
  const { child, url, port } = await startServer();
  try {
    // Each case: a minimal POST /mcp with an empty declared body and a syntactically bad
    // Host value. Pre-fix, `new URL(req.url, \`http://${req.headers.host}\`)` threw
    // synchronously inside the request listener — an uncaught exception that killed the
    // whole process before any response was ever written. Post-fix, Host is never read, so
    // the request is parsed against the fixed base and falls through normally to the empty
    // -body JSON-parse-error path (400) — the point under test is that a RESPONSE comes
    // back at all, and that the process is still standing to give it.
    for (const host of ["a b", "[", "[::1"]) {
      const head = `POST /mcp HTTP/1.1\r\nHost: ${host}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n`;
      const res = await rawRequest(port, head);
      assert.equal(res.timedOut, false, `Host: ${host} — the connection must not just hang`);
      assert.equal(statusLine(res), "HTTP/1.1 400 Bad Request", `Host: ${host}`);
      await assertServerSurvives(child, url);
    }
  } finally {
    child.kill("SIGTERM");
  }
});

test("oversized body with a correct Content-Length gets a real 413, not a reset (C-4)", async () => {
  const { child, url, port } = await startServer();
  try {
    const body = Buffer.alloc(70 * 1024, 0x78);
    const head =
      `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Type: application/json\r\n` +
      `Content-Length: ${body.length}\r\nConnection: close\r\n\r\n`;
    const res = await rawRequest(port, head, [body]);
    assert.equal(res.timedOut, false, "the connection must not just hang");
    assert.equal(statusLine(res), "HTTP/1.1 413 Payload Too Large");
    assert.ok(res.data.includes("Request body exceeds the 64KB cap"));
    await assertServerSurvives(child, url);
  } finally {
    child.kill("SIGTERM");
  }
});

test("oversized chunked body (no Content-Length) gets a real 413, not a reset (C-4)", async () => {
  const { child, url, port } = await startServer();
  try {
    const body = Buffer.alloc(70 * 1024, 0x79);
    const head =
      `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Type: application/json\r\n` +
      `Transfer-Encoding: chunked\r\nConnection: close\r\n\r\n`;
    const res = await rawRequest(port, head, chunkedBody(body, 8 * 1024));
    assert.equal(res.timedOut, false, "the connection must not just hang");
    assert.equal(statusLine(res), "HTTP/1.1 413 Payload Too Large");
    assert.ok(res.data.includes("Request body exceeds the 64KB cap"));
    await assertServerSurvives(child, url);
  } finally {
    child.kill("SIGTERM");
  }
});

test("a client that disconnects mid-body does not crash the server", async () => {
  const { child, url, port } = await startServer();
  try {
    await new Promise((resolve, reject) => {
      const socket = net.connect(port, "127.0.0.1", () => {
        socket.write(
          `POST /mcp HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nContent-Type: application/json\r\n` +
          `Content-Length: 1000\r\n\r\n`,
        );
        socket.write(Buffer.alloc(100, 0x41)); // a fraction of the declared body
        setTimeout(() => { socket.destroy(); resolve(); }, 200); // then vanish
      });
      socket.on("error", reject);
    });
    // Give the server a moment to observe the torn connection before probing it.
    await new Promise((resolve) => setTimeout(resolve, 300));
    await assertServerSurvives(child, url);
  } finally {
    child.kill("SIGTERM");
  }
});
