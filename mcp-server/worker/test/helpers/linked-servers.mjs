/* Shared harness: build BOTH MCP servers — the Worker's generated entry and the Node server —
   over linked in-memory transports, with the REAL site engine on both sides. No listener,
   Worker runtime, or network socket is involved.

   Extracted verbatim from new-tools-parity.test.mjs (im-arc T3) when a second suite needed the
   same pair of servers. Two copies of a fifty-line tsc bootstrap drift, and a harness that
   drifts silently makes the two suites answer different questions while appearing to answer
   the same one — which is the defect class this repo's guard rounds kept finding. */
import { mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.resolve(__dirname, "..", "..");
const MCP = path.resolve(WORKER, "..");
const outDir = mkdtempSync(path.join(os.tmpdir(), "im-worker-new-tools-"));
const generated = path.join(WORKER, "src", "gen");
const tsFiles = [];
const collect = (dir) => {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) collect(full);
    else if (name.name.endsWith(".ts") && !name.name.endsWith(".d.ts")) tsFiles.push(full);
  }
};
collect(generated);
const program = ts.createProgram(tsFiles, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  rootDir: generated,
  outDir,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmitOnError: false,
});
const emitted = program.emit();
assert.equal(emitted.emitSkipped, false, "Worker generated server did not emit for the in-memory parity test");
/* The emitted tree lives in /tmp, so repair the Worker bridge's repo-relative site
   imports to the same authoritative files without copying or re-declaring them.
   U5 added the T4 registry module beside the engine; both are rewritten here, and a bridge
   import that stops matching is a hard failure rather than a module-not-found at call time. */
const emittedEngine = path.join(outDir, "engine.js");
let engineSource = readFileSync(emittedEngine, "utf8");
for (const name of ["engine.js", "engine-data-dc-v1.js"]) {
  const specifier = `"../../../../site/${name}"`;
  assert.ok(engineSource.includes(specifier), `Worker engine bridge no longer imports ${specifier}`);
  engineSource = engineSource.replace(specifier, JSON.stringify(pathToFileURL(path.join(MCP, "..", "site", name)).href));
}
writeFileSync(emittedEngine, engineSource);
/* Each transport is a separate process in production. Give the in-process Worker
   harness a byte-copy of the stateful contract registry so emitter registration
   cannot collide with the Node harness loaded beside it. */
const workerContracts = path.join(outDir, "engine-contracts-v22.cjs");
writeFileSync(workerContracts, readFileSync(path.join(MCP, "..", "site", "engine-contracts-v22.js"), "utf8"));
const emittedClaims = path.join(outDir, "claims.js");
writeFileSync(emittedClaims, readFileSync(emittedClaims, "utf8").replace(
  '"../../../../site/engine-contracts-v22.js"', JSON.stringify(pathToFileURL(workerContracts).href)));
writeFileSync(path.join(outDir, "package.json"), JSON.stringify({ type: "module" }));
symlinkSync(path.join(WORKER, "node_modules"), path.join(outDir, "node_modules"), "dir");

const { buildServer: buildNodeServer } = await import(pathToFileURL(path.join(MCP, "dist", "server.js")).href);
const { buildServer: buildWorkerServer } = await import(pathToFileURL(path.join(outDir, "server.js")).href);

async function connect(buildServer, name) {
  const server = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name, version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return {
    call: (tool, args) => client.callTool({ name: tool, arguments: args }),
    close: async () => { await client.close(); await server.close(); },
  };
}

/** Build both servers. Call once per test file; close what it returns. */
export async function linkedServers(label) {
  const node = await connect(buildNodeServer, label + "-node");
  const worker = await connect(buildWorkerServer, label + "-worker");
  return { node, worker, close: async () => { await node.close(); await worker.close(); } };
}
