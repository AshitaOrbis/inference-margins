#!/usr/bin/env node
// Every regular served file is scanned as bytes, including comments and binary metadata.
// Symlinks are never followed. Diagnostics name shapes, never their private values.
// Exit 0 clean, 1 references found, 2 nothing could be scanned.
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SHAPES = [
  ["backlog row id", /(?<![\w-])bq-\d+\b/gi],
  ["escalation or note id", /(?<![\w-])(?:esc|note)-\d{8}T\d{6}Z-[a-zA-Z0-9]+\b/gi],
  ["broker request id", /(?<![\w-])pr-\d{8}T\d{6}Z-[a-zA-Z0-9]+\b/gi],
  // Dated identifiers and project-scoped cards; public evidence keys and vocabulary stay clean.
  ["decision or card id", /(?<![\w-])[dqp]-(?:\d{8}\b(?:-[a-z0-9]+)*|(?:[a-z][a-z0-9]*-){2,}[a-z0-9]+|(?:im|margins|sliders|row\d+)-[a-z0-9]+(?:-[a-z0-9]+)*)\b/gi],
  ["owner provenance", /(?<![\w/-])owner[\s-]+(?:(?:voice|mean)\s+)?(?:rulings?|rules?|ruled|notes?|answers?|asks?|ratified|amendments?|annotations?|requirements?|corrections?|clarifications?|commissions?|approved|adopted|adjudicated|sourced|spec|attribution|court|verbatim|call|inputs?|edits?)\b/gi],
  ["dated owner commissioning", /\bby\s+owner(?=\s+\d{4}-\d{2}-\d{2}\b)/gi],
  ["owner possessive provenance", /\bowner['’]s\s+(?:declared|standing|design|doctrine|max-granularity|fixed\s+case|membership\s+ruling|rent\s+adoption|page-open-default\s+ruling)\b/gi],
  ["owner example provenance", /\bowner\s+(?:case|pick)\b|\bpage['’]s\s+owner\s+set\b/gi],
  ["private memo citation", /\b(?:(?:design|decision|feasibility-redesign)\s+memo|the\s+memo(?:['’]s)?|memo\s*(?:§+|:\d|\[N-|v\d+|im[34]-|[DCFGJ]-\d+|the\s+design\s+analysis|revised\s+to)|memo[- ](?:measured|replication)|shared\s+memo\s+(?:<code>)?research\/(?:b9|im[34])[-/][a-z0-9.-]+)\b/gi],
  ["internal court reference", /\b(?:the\s+court(?:['’]s)?|court\s*(?::\s*the\s+review|\s+(?:record|note|for\s+the\s+bytes)))\b/gi],
  // Keep functional paths and longer protocol identities out of prose-label matches; a label that
  // ends a sentence ("im4-x.") still matches, a file name ("im4-x.mjs") does not.
  ["internal program label", /(?<![\w/-])(?:im-arc|im[34]-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w/-]|\.[\w/-])/gi],
  ["internal program phase", /\bIM[345](?=\s+(?:program(?:me)?|phase|design|integration|revision|roofline|exit-gate|slice)\b)/gi],
  ["internal phase label", /(?<![^\s("'`])b9(?=$|[\s,:;)"'`]|\.(?![\w/-]))/gi],
  ["internal milestone label", /\b(?:M\d+(?:['’]s|\s+(?:phase|gate|wiring|contract|rule|defaults|release|delta|side-registry|registry|family|shipped|whitelist|wording|surface|reconciliation|decision|fix|moved|moves|fixes|replaces|let|ADDS))|(?:pre-|post-)M\d+|(?:phase|milestone)\s+M\d+|M\d+[–-]M\d+\s+milestones)\b/g],
  ["internal fold label", /\bT\d+\s+fold\b/gi],
  ["review-process jargon", /\b(?:toss-back|fold\s+round|Sol\s+rounds|lens-runs)\b/gi],
  ["editorial process label", /(?<![\w/-])(?:ruling\s+im-[a-z0-9-]+|r\d+\s+run\s+[a-z]|im-arc(?![/-])|memo\s*§+\s*[0-9]+|T\d+\s+fold|r\d+\s*§+\s*[a-z]?\d+|design\s+analysis\s*§+\s*\d+|b\d+\s+(?:M\d+|UX-[ABC]|spec-decode|arc))\b/gi],
  ["internal row number", /\brows?\s+\d+(?:\s*(?:,|and|&)\s*\d+)*/gi],
  ["internal row label", /(?<![\w-])rows?[-_]\d{3,4}\b|(?<![\w-])row\d{3,4}-[a-z]/gi],
  ["note or annotation id", /\b(?:notes?|annotations?)\b(?:\s+n?(?=[0-9]*[a-f])[0-9a-f]{6}\b|[^\n.;]{0,24}?[+&]\s*n?(?=[0-9]*[a-f])[0-9a-f]{6}\b)/gi],
  ["annotation id", /(?<![\w/#.+=-])n(?=[0-9]*[a-f])[0-9a-f]{6}(?![\w-])/gi],
  ["private record citation", /\bburn[- ]queue\b|\bprivate\s+plan\b|\bwork\s+folder\b|\(private\s+workspace\)|\bcourt[- ](?:answer|intake)\b/gi],
  ["private file citation", /(?<![\w/.-])(?:PLAN|VISUAL-REVIEW|FOLD|HANDOFF|ORCHESTRATION-BRIEF|REVIEW-FINDINGS)(?:-[\w.-]+)?\.md\b|\bworkspace\s+run\b|(?<![\w.-])(?:reports|logs)\/[\w.-]+\//g],
  ["run identifier", /\b20\d{6}T\d{6}Z\b/g],
  ["labelled run id", /\bIM\d(?:\.\d)?-[a-z0-9]+(?:-[a-z0-9]+)+/g],
  ["orchestrator name", /\bPolaris\b(?:\s+gen\d+)?/gi],
  ["worker session name", /(?<![\w-])(?:im|inference-margins)-(?:[a-zA-Z0-9]+-)+(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?![\w-])/gi],
  // An undated work label ("im-release-edit", "a-im-legibility"); the dated research ids and paths stay clean.
  ["worker label", /(?<![\w/.#-])(?:a-im-[a-z]+(?:-[a-z0-9]+)*|im-(?!research-\d)[a-z]+(?:-[a-z0-9]+)+|im-(?:finalize|desktop|annotations|legibility|tile))(?![\w-]|\.[\w/-])/gi],
  // A research document named in prose or a comment where the release does not publish it. A path that is
  // the whole value of a quoted string ("sourceFile": "research/x.md") is a functional pointer and stays
  // clean; a backtick span is markup, not a string value, so it does not exempt a path. A path the annex
  // publishes, or a file the site itself serves, is not a leak (see isPublishedResearch below).
  ["unpublished research citation", /(?<!["'\w./-])research\/[\w./-]+\.md(?![\w./-])|(?<![\w./-])research\/[\w./-]+\.md(?![\w./"'-])/g],
];

export function decodeSlashes(s) {
  return s.replace(/\\u002[fF]|\\x2[fF]|\\\//g, "/")
    .replace(/&#0*47;|&#[xX]0*2[fF];|&sol;/g, "/")
    .replace(/%2[fF]/g, "/");
}
// Every decoded character retains its offset in the raw file, including decoded newlines.
// Strip only inline markup; block boundaries cannot join an identifier across paragraphs. The phrasing
// view also removes formatting tags (<code>, <strong>, <a> …) WITHOUT inserting spaces, so <code>b9</code>
// or owner <strong>ruling</strong> reads as text while <code>b9</code><em>.json</em> stays a file name; the
// other views keep those tags, so a reference inside one of their attributes is still decoded and seen.
// The phrasing view runs twice, like the others: a <br> between two formatted words still separates them.
function decodedView(raw, inlineSpace = false, phrasing = false) {
  let text = raw, offsets = Array.from({ length: raw.length }, (_, i) => i);
  const replace = (pattern, decode) => {
    let next = "", map = [], end = 0;
    for (const m of text.matchAll(pattern)) {
      next += text.slice(end, m.index);
      for (const offset of offsets.slice(end, m.index)) map.push(offset);
      const value = decode(m);
      next += value;
      for (let i = 0; i < value.length; i++) map.push(offsets[m.index]);
      end = m.index + m[0].length;
    }
    next += text.slice(end); for (const offset of offsets.slice(end)) map.push(offset);
    text = next; offsets = map;
  };
  replace(/\\(?:u([0-9a-f]{4})|x([0-9a-f]{2})|([nt/]))/gi, m =>
    m[1] || m[2] ? String.fromCharCode(parseInt(m[1] || m[2], 16)) : ({ n: "\n", t: "\t", "/": "/" })[m[3].toLowerCase()]);
  replace(/&(?:#([0-9]+)|#x([0-9a-f]+)|(nbsp|ndash|hyphen|sol));/gi, m => {
    if (m[3]) return ({ nbsp: " ", ndash: "-", hyphen: "-", sol: "/" })[m[3].toLowerCase()];
    const n = parseInt(m[1] || m[2], m[1] ? 10 : 16);
    return n <= 0x10ffff ? String.fromCodePoint(n) : m[0];
  });
  replace(/<\/?(?:br|wbr|span)\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*>/gi, () => inlineSpace ? " " : "");
  if (phrasing) replace(/<\/?(?:code|strong|em|b|i|u|s|a|abbr|cite|dfn|kbd|mark|q|samp|small|sub|sup|time|var|data)\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*>/gi, () => "");
  replace(/%2f/gi, () => "/");
  replace(/[\u00a0\u2010\u2013]/g, m => m[0] === "\u00a0" ? " " : "-");
  return { text, offsets };
}
export function findInternalRefs(bytes) {
  const raw = Buffer.isBuffer(bytes) ? bytes.toString("utf8") : bytes;
  const views = [{ text: raw, offsets: null }, decodedView(raw), decodedView(raw, true),
    decodedView(raw, false, true), decodedView(raw, true, true)];
  const hits = [], seen = new Set();
  for (const { text, offsets } of views) for (const [shape, pattern] of SHAPES) {
    for (const match of text.matchAll(pattern)) {
      if (shape === "decision or card id" && /^(?:p-values?|q-factors?|q-learning|p-type|d-wave|d-sd-\d+)$/i.test(match[0])) continue;
      if (shape === "unpublished research citation" && isPublishedResearch(match[0])) continue;
      const index = offsets ? offsets[match.index] : match.index;
      const key = `${shape}:${index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const last = match.index + match[0].length - 1;
      const length = offsets ? offsets[last] + 1 - index : match[0].length;
      hits.push({ shape, line: raw.slice(0, index).split("\n").length, index, length });
    }
  }
  return hits.sort((a, b) => a.index - b.index || a.shape.localeCompare(b.shape));
}

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
// Generated build output, skipped by the walk: mcp-server/worker/scripts/build.mjs regenerates this directory on
// every build, it is gitignored (mcp-server/worker/.gitignore), and so it is never a source and never ships.
const BUILD_OUTPUT = new Set(["mcp-server/worker/src/gen"]);
// The research documents the release publishes: every `md:` entry of the annex build's publish list, and every
// file the site serves. With no publish list beside the guard, nothing counts as published (fail closed).
let publishedResearch;
function isPublishedResearch(path) {
  if (path.split("/").includes("..")) return false;
  if (!publishedResearch) {
    publishedResearch = new Set();
    try {
      for (const m of readFileSync(join(PROJECT_ROOT, "build-research-html.mjs"), "utf8").matchAll(/\bmd:\s*"([^"]+)"/g))
        publishedResearch.add(m[1]);
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return publishedResearch.has(path) || existsSync(join(PROJECT_ROOT, "site", path));
}
function loadHeldLines() {
  try { return JSON.parse(readFileSync(join(PROJECT_ROOT, "scripts/internal-refs-held.json"), "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}
function heldLineKey(path, line, sha256) { return `${path}:${line}:${sha256}`; }
function hashLineBytes(bytes) {
  const hashes = [];
  let start = 0;
  for (let end = 0; end <= bytes.length; end++) {
    if (end !== bytes.length && bytes[end] !== 10) continue;
    hashes.push(createHash("sha256").update(bytes.subarray(start, end)).digest("hex"));
    start = end + 1;
  }
  return hashes;
}
export function scanInternalRefTree(directory, options = {}) {
  const root = resolve(directory);
  let scanned = 0;
  const hits = [], held = [];
  let exemptions;
  try {
    const entries = options.heldLines ?? loadHeldLines();
    if (!Array.isArray(entries) || entries.some(entry => !entry || typeof entry.path !== "string"
      || entry.path.startsWith("/") || entry.path.split("/").includes("..")
      || !Number.isSafeInteger(entry.line) || entry.line < 1
      || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.reason !== "held for the author's decision"))
      throw new Error("invalid held-lines manifest");
    exemptions = new Set(entries.map(entry => heldLineKey(entry.path, entry.line, entry.sha256)));
  } catch {
    return { status: 2, stdout: "", stderr: "check-no-internal-refs: cannot read a valid held-lines manifest" };
  }
  const pathRoot = resolve(options.pathRoot ?? PROJECT_ROOT);
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const st = lstatSync(path);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (BUILD_OUTPUT.has(relative(pathRoot, path).split("\\").join("/"))) continue;
        walk(path); continue;
      }
      if (!st.isFile()) continue;
      scanned++;
      const bytes = readFileSync(path), hashes = hashLineBytes(bytes), raw = bytes.toString("utf8");
      const servedPath = relative(pathRoot, path).split("\\").join("/");
      for (const hit of findInternalRefs(bytes)) {
        const diagnostic = `${relative(root, path)}:${hit.line}: ${hit.shape}`;
        // A multiline reference is held only while every line it consumes is unchanged.
        const lineCount = raw.slice(hit.index, hit.index + hit.length).split("\n").length;
        const isHeld = Array.from({ length: lineCount }, (_, offset) => hit.line + offset)
          .every(line => exemptions.has(heldLineKey(servedPath, line, hashes[line - 1])));
        if (isHeld)
          held.push(`${diagnostic} (held for the author's decision)`);
        else hits.push(diagnostic);
      }
    }
  }
  try {
    const rootStat = lstatSync(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      return { status: 2, stdout: "", stderr: "check-no-internal-refs: no directory — nothing was checked" };
    }
    walk(root);
  } catch {
    return { status: 2, stdout: "", stderr: "check-no-internal-refs: cannot scan the requested tree" };
  }
  if (!scanned) {
    return { status: 2, stdout: "", stderr: "check-no-internal-refs: no file — nothing was checked" };
  }
  return { status: hits.length ? 1 : 0, stderr: hits.join("\n"),
    stdout: [`check-no-internal-refs: scanned ${scanned} files under ${relative(process.cwd(), root) || "."}; ${hits.length} internal reference(s); ${held.length} held reference(s)`, ...held].join("\n") };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = scanInternalRefTree(process.argv[2] || "site");
  if (result.stderr) console.error(result.stderr);
  if (result.stdout) console.log(result.stdout);
  process.exitCode = result.status;
}
