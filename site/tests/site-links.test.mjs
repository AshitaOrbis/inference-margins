import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
let checked = 0;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

function idsIn(path) {
  const html = readFileSync(path, "utf8");
  return new Set([...html.matchAll(/\b(?:id|name)=["']([^"']+)["']/gi)].map((match) => match[1]));
}

function localReference(raw) {
  const trimmed = raw.trim();
  if (!trimmed || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(trimmed)) return null;
  const hashIndex = trimmed.indexOf("#");
  const queryIndex = trimmed.indexOf("?");
  const cut = [hashIndex, queryIndex].filter((index) => index >= 0).reduce((a, b) => Math.min(a, b), trimmed.length);
  return {
    path: decodeURIComponent(trimmed.slice(0, cut)),
    fragment: hashIndex >= 0 ? decodeURIComponent(trimmed.slice(hashIndex + 1).split("?")[0]) : "",
  };
}

for (const source of walk(SITE)) {
  const html = readFileSync(source, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const ref = localReference(match[1]);
    if (!ref) continue;
    checked++;
    let target = ref.path
      ? (ref.path.startsWith("/") ? join(SITE, ref.path.slice(1)) : resolve(dirname(source), ref.path))
      : source;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!existsSync(target) && !extname(target) && existsSync(`${target}.html`)) target = `${target}.html`;
    if (!existsSync(target)) {
      failures.push(`${relative(SITE, source)}: ${match[1]} -> missing ${relative(SITE, target)}`);
      continue;
    }
    if (ref.fragment && target.endsWith(".html") && !idsIn(target).has(ref.fragment))
      failures.push(`${relative(SITE, source)}: ${match[1]} -> missing fragment #${ref.fragment}`);
  }
}

if (failures.length) {
  console.error(`BROKEN SITE LINKS (${failures.length}/${checked})\n${failures.map((line) => `- ${line}`).join("\n")}`);
  process.exit(1);
}
console.log(`ALL ${checked} LOCAL SITE LINKS RESOLVE`);
