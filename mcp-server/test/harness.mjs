// Shared test harness: in-memory client (contract/parity) + numeric-leaf walker + engine access.
// The engine is required the same way the site's own suites require it — single source of truth.
import { createRequire } from "node:module";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const require = createRequire(import.meta.url);
export const engine = require("../../site/engine.js");

export async function connectInMemory() {
  const { buildServer } = await import("../dist/server.js");
  const server = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-harness", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return {
    client,
    async call(name, args = {}) {
      return client.callTool({ name, arguments: args });
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}

/* Walk every leaf of a JSON value; cb(path[], key, value). */
export function walkLeaves(value, cb, path = []) {
  if (value === null || typeof value !== "object") {
    cb(path, path[path.length - 1], value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkLeaves(v, cb, [...path, String(i)]));
    return;
  }
  for (const [k, v] of Object.entries(value)) walkLeaves(v, cb, [...path, k]);
}

/* All numeric leaves whose own key matches re and whose path does NOT pass through
   selection_receipt — the envelope-totality contract's forbidden set. */
export function forbiddenNumericLeaves(structured, re = /margin|estimate|gm/i) {
  const bad = [];
  walkLeaves(structured, (path, key, v) => {
    if (typeof v !== "number") return;
    if (!re.test(String(key ?? ""))) return;
    if (path.includes("selection_receipt")) return;
    bad.push(path.join("."));
  });
  return bad;
}

export function sc(result) {
  if (!result || !result.structuredContent) {
    throw new Error("result has no structuredContent: " + JSON.stringify(result).slice(0, 400));
  }
  return result.structuredContent;
}

export function text(result) {
  const t = (result.content || []).find((c) => c.type === "text");
  return t ? t.text : "";
}
