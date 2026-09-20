// Minimal ESM loader hook so plain `node --test` can import worker.js's
// `import ADMIN_HTML from "../admin.html"` outside of wrangler's bundler,
// which treats a bare .html import as raw text (matching esbuild's default
// "text" loader for unrecognised extensions — see wrangler's build output).
// Test-only; not part of the deployed Worker bundle.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function load(url, context, nextLoad) {
  if (url.endsWith(".html")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    return {
      format: "module",
      source: `export default ${JSON.stringify(source)};`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
