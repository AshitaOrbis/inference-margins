#!/usr/bin/env node
/* stdio entrypoint — Claude Code / Codex (`claude mcp add`, config.toml). */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";
import { E } from "./engine.js";

const server = buildServer();
await server.connect(new StdioServerTransport());
// stderr only — stdout belongs to the protocol
console.error(`inference-margins MCP server on stdio (engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF})`);
