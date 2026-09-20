/* =====================================================================================
   release-gate.mjs — MAKE THE RELEASE-ARTIFACT CONTRACT EXECUTABLE

   RELEASE-ARTIFACT.md has stated this contract since 2026-07:

     "the deploy leg rebuilds at the tag, asserts sha equality with the digest above
      BEFORE any upload, uploads, then reads back the live Worker version and records it.
      Any inequality at any point = STOP (the artifact is not what was approved)."

   A release-gate review (2026-08-27) found that NEITHER deploy path implemented any of it.
   `npm run deploy` was `build && tsc && test && wrangler deploy` — no dist-release, no digest
   comparison, no readback — and `scripts/weekly-update.sh` calls exactly that. So the tracked
   rollback artifact sat at v3.0.1 while the deployed bytes moved on, and the document describing
   the gate was the only thing enforcing it. A contract nothing executes is a comment.

   Three subcommands, each doing one thing:

     --check    rebuild dist-release from source (wrangler --dry-run, uploads NOTHING), hash it,
                and compare against the digest pinned in RELEASE-ARTIFACT.md. Mismatch exits 1.
                This is the "assert sha equality BEFORE any upload" half, and it is what makes an
                unapproved bundle fail closed rather than ship.

     --repin    the same rebuild, but WRITE the digest into RELEASE-ARTIFACT.md. Deliberately a
                separate verb: re-pinning is an approval, and approving must be something an
                operator does on purpose, never a side effect of deploying.

     --readback fetch the LIVE worker and verify it is serving this build — the tool surface it
                should have, and that the retired T5 wording is absent. Never a status code:
                "a 200 proves the surface answers, it cannot prove what it is answering with".

   Determinism is a precondition, not an aspiration: --check and --repin each build TWICE and
   refuse if the two differ, because a digest over a nondeterministic build authorises nothing.
   ===================================================================================== */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER = join(HERE, "..");
const ARTIFACT_MD = join(WORKER, "RELEASE-ARTIFACT.md");
const DIST = join(WORKER, "dist-release");
const PIN_RE = /^sha256\(dist-release\/index\.js\)\s*=\s*([0-9a-f]{64})\s*$/m;

const die = (msg) => { console.error("release-gate: " + msg); process.exit(1); };

/* THE APPROVAL DIGEST NORMALISES ONE FIELD, AND HERE IS WHY.

   `scripts/build.mjs` embeds `built_from: <git rev-parse --short HEAD>` in the bundle — the
   commit whose tree the bytes were read from. That makes the digest SELF-REFERENTIAL: pin a
   digest, commit the pin, and the commit you just made changes HEAD, so a rebuild no longer
   matches the number you just recorded. The contract in RELEASE-ARTIFACT.md has demanded sha
   equality since July and was executed by nothing until 2026-08-27, which is why nobody had
   discovered that, as written, it is UNSATISFIABLE.

   Measured on the T5 release rather than assumed: the bundle at 09ec15e and the bundle at
   2e9f80f were byte-identical at 4,362,392 bytes with ZERO differing spans once `built_from`
   was normalised — 3f668e4a… both — while their raw digests differed (2a24f4ca vs 7a3d4602).
   One derived provenance token, nothing else.

   So the approval digest is taken over the bundle with that ONE token normalised. Every other
   byte is still compared exactly, which is the whole property the contract exists to give. The
   real value still ships in the deployed bundle, so the live Worker still reports which commit
   it came from — normalising it here changes what is APPROVED, never what is served. */
const BUILT_FROM_RE = /"built_from":\s*"[^"]*"/;
const normalise = (buf) =>
  Buffer.from(buf.toString("utf8").replace(BUILT_FROM_RE, '"built_from":"<NORMALISED-FOR-APPROVAL>"'), "utf8");
const approvalDigest = (p) => createHash("sha256").update(normalise(readFileSync(p))).digest("hex");
const rawDigest = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const builtFromOf = (p) => (BUILT_FROM_RE.exec(readFileSync(p, "utf8")) || ["(none)"])[0];

function buildOnce(outdir) {
  rmSync(outdir, { recursive: true, force: true });
  execFileSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", outdir],
    { cwd: WORKER, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, WRANGLER_SEND_METRICS: "false" } });
  const f = join(outdir, "index.js");
  if (!existsSync(f)) die("dry-run produced no bundle at " + f);
  return { approval: approvalDigest(f), raw: rawDigest(f), builtFrom: builtFromOf(f), file: f };
}

/* Build twice and require agreement. A digest over a build that does not reproduce is a number,
   not an approval — and this bundle embeds a 1.4 MB document archive, which is exactly the kind
   of input that can quietly introduce ordering nondeterminism. */
function buildDeterministic({ write } = { write: false }) {
  execFileSync("npm", ["run", "build"], { cwd: WORKER, stdio: ["ignore", "pipe", "pipe"] });
  /* --check builds into a SCRATCH dir. An earlier cut built into dist-release itself, so a
     FAILED check overwrote the very artifact it was checking and left the tree dirty — a
     verifier must not mutate its subject. Only --repin writes the tracked artifact. */
  const primary = write ? DIST : join(WORKER, ".dist-release-check");
  const a = buildOnce(primary);
  const tmp = join(WORKER, ".dist-release-verify");
  const b = buildOnce(tmp);
  rmSync(tmp, { recursive: true, force: true });
  if (a.approval !== b.approval) die(`build is NOT deterministic — two clean builds hashed ` +
    `${a.approval} and ${b.approval}. Refusing to pin or check a digest that does not reproduce.`);
  if (!write) rmSync(primary, { recursive: true, force: true });
  return a;
}

function readPin() {
  const m = PIN_RE.exec(readFileSync(ARTIFACT_MD, "utf8"));
  if (!m) die("no `sha256(dist-release/index.js) = <64 hex>` line found in RELEASE-ARTIFACT.md");
  return m[1];
}

const cmd = process.argv[2];

if (cmd === "--check") {
  /* ROUND 8: this rebuilt into a scratch dir, hashed THAT, and never read
     `dist-release/index.js` — the tracked rollback artifact the pin line actually names. The
     reviewer replaced that file with 66 bytes of plain text and `--check` still passed, so the
     approved rollback bundle could be corrupt while the gate certified the release. The pin
     governs BOTH: the bundle this tree builds, and the tracked artifact that carries it. */
  {
    const tracked = join(DIST, "index.js");
    if (!existsSync(tracked)) die(`the tracked release artifact ${tracked} is MISSING — the pin names a file that is not there`);
    const rawLen = readFileSync(tracked).length;
    const trackedApproval = approvalDigest(tracked);
    const pinned = readPin();
    if (trackedApproval !== pinned)
      die(`the TRACKED artifact dist-release/index.js does not match the pin ` +
        `(${trackedApproval} vs ${pinned}). A rollback would restore bytes nobody approved. ` +
        `Re-pin deliberately with --repin, or restore the artifact.`);
    if (rawLen < 100000)
      die(`the tracked artifact is ${rawLen} bytes — far too small to be the Worker bundle; refusing to certify it`);
  }
  const built = buildDeterministic().approval;
  const pinned = readPin();
  if (built !== pinned) {
    die(`ARTIFACT MISMATCH — refusing to upload.\n` +
        `  rebuilt from this tree : ${built}\n` +
        `  pinned as approved     : ${pinned}\n` +
        `The bundle about to ship is not the one that was approved. If the difference is intended,\n` +
        `re-pin it deliberately (\`node scripts/release-gate.mjs --repin\`) and record WHY in\n` +
        `RELEASE-ARTIFACT.md — do not silence this by editing the digest by hand.`);
  }
  console.log(`release-gate: OK — rebuilt bundle matches the approved pin (${built}), deterministic across two builds, built_from normalised for approval`);
  process.exit(0);
}

if (cmd === "--repin") {
  const r = buildDeterministic({ write: true });
  const built = r.approval;
  const before = readPin();
  console.log(`release-gate: raw digest ${r.raw} (${r.builtFrom}) — informational; the pin below is the normalised one`);
  const md = readFileSync(ARTIFACT_MD, "utf8");
  writeFileSync(ARTIFACT_MD, md.replace(PIN_RE, `sha256(dist-release/index.js) = ${built}`));
  console.log(`release-gate: re-pinned ${before} -> ${built}`);
  console.log("release-gate: dist-release/index.js is now the tracked artifact — commit it with the digest.");
  process.exit(0);
}

/* =====================================================================================
   --readback, REBUILT after it failed to stop a broken deploy (2026-08-27).

   What it used to do: fetch `tools/list`, fetch `get_report`, and pass. What that could not
   see: on 2026-08-27 the T5 Worker deployed and every tool that COMPUTES returned HTTP 503 /
   Cloudflare `error code: 1102` ("Worker exceeded resource limits") — including
   `list_scenario_space`, which had worked for months — while `tools/list` and `get_report`
   both kept answering 200. The gate looked at the SHAPE of the deployment and never at whether
   it worked, so it certified a connector on which nothing could be computed.

   It also had no retry, and that is the more corrosive half. With one observation it could not
   tell "the edge has not finished propagating" from "the bytes I just uploaded are broken", so
   its failure was ambiguous — and an ambiguous gate failure is one that gets explained away.
   It was.

   Three properties this version has and the old one did not:

     1. IT EXERCISES THE COMPUTE PATH. `list_scenario_space` (the tool that 1102'd) and
        `run_scenario` (the heaviest path) must return a STRUCTURED result, not a status code.
        A 200 with no computation is a failure here.

     2. IT CHECKS IDENTITY, NOT SHAPE. The live worker must report the `built_from` of the
        bundle we just built. Two tool names and one absent phrase cannot tell you WHICH bundle
        is live; a different build with the same tool surface used to pass.

     3. IT CLASSIFIES BEFORE IT RETRIES, so a retry can never launder a breakage into a pass:
          STALE      — the old build is still answering. Propagation is plausible: retry.
          BROKEN     — the NEW build is provably live and its compute path fails. That is not
                       propagation and no amount of waiting fixes it: fail IMMEDIATELY.
          WRONG-BUILD— a healthy worker reporting a built_from we did not build: fail at once.
          GREEN      — identity matches, every expected tool is listed, both compute probes
                       returned real results, and final-answer carries no external hypothesis.

   Only GREEN exits 0. Everything else exits 1, and says which class it is, because the class
   is the operator's next action.

   U5 adds a FIFTH thing it checks, for the same reason the fourth exists. The Worker now embeds a
   dc-map SUBSTRATE release (scripts/build.mjs), and a datacenter price is computed FROM those
   bytes rather than quoted from them — so "which release is this connector answering from" is a
   release-identity question exactly like `built_from`, and the live worker must report the id this
   tree embedded. When the build embedded no release, the live worker must say so too: agreeing
   about an absence is still agreeing about an identity, and a worker quietly serving SOME release
   where this build has none is the substitution E9 forbids.
   ===================================================================================== */

/* The dc-map substrate release id this tree's Worker build embedded (null when it embedded none).
   Read from the GENERATED module rather than re-resolved from dc-map/releases, so the gate checks
   the identity of the bundle that is about to ship — not of whatever CURRENT points at right now. */
function embeddedDcmapRelease() {
  const gen = join(WORKER, "src", "gen", "dcmap", "release.gen.ts");
  if (!existsSync(gen)) die("src/gen/dcmap/release.gen.ts is missing — run `npm run build` before the release gate");
  const source = readFileSync(gen, "utf8");
  const status = /"status":\s*"([^"]+)"/.exec(source);
  const id = /"release_id":\s*(null|"[^"]+")/.exec(source);
  if (!status || !id) die("src/gen/dcmap/release.gen.ts carries no embedded dc-map release identity");
  return { status: status[1], release_id: id[1] === "null" ? null : JSON.parse(id[1]) };
}

if (cmd === "--readback") {
  const base = process.env.IM_MCP_URL || "https://margins-mcp.ashitaorbis.com";
  const DEADLINE_MS = Number(process.env.IM_READBACK_DEADLINE_MS || 180_000);

  /* What we expect to be live: the bundle this tree builds. Explicit flag wins so an operator
     can read back a specific release without rebuilding. */
  const flagIdx = process.argv.indexOf("--expect-built-from");
  const expected = flagIdx > -1 ? process.argv[flagIdx + 1] : (() => {
    const gen = join(WORKER, "src", "gen", "archive.gen.ts");
    if (!existsSync(gen)) die("src/gen/archive.gen.ts is missing — run `npm run build` before readback");
    const m = /"built_from"\s*:\s*"([^"]+)"/.exec(readFileSync(gen, "utf8"));
    if (!m) die("no built_from in src/gen/archive.gen.ts — cannot verify live artifact identity");
    /* ROUND 8: this file is GENERATED and `--readback` never rebuilds, so a stale copy made the
       gate certify a Worker built from a PREVIOUS commit as green — the exact state it exists to
       refuse. It must agree with HEAD, or the identity it checks is the wrong identity. */
    let head = null;
    try { head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: WORKER, encoding: "utf8" }).trim(); } catch {}
    if (head && m[1] !== head && m[1] !== head + "-dirty")
      die(`src/gen/archive.gen.ts is STALE — it reports built_from ${m[1]} while HEAD is ${head}. ` +
        `Run the build before readback; otherwise this gate checks the identity of the previous commit.`);
    return m[1];
  })();

  const post = async (body) => {
    try {
      const r = await fetch(base + "/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      if (!r.ok) return { ok: false, why: `HTTP ${r.status}` + (/1102/.test(text) ? " / Cloudflare error code: 1102 (Worker exceeded resource limits)" : ""), status: r.status };
      try { return { ok: true, json: JSON.parse(text) }; }
      catch { return { ok: false, why: `non-JSON body (${text.slice(0, 120).replace(/\s+/g, " ")})`, status: r.status }; }
    } catch (e) { return { ok: false, why: `transport: ${e.message}` }; }
  };

  /* The two probes that actually compute. list_scenario_space is the one that 1102'd in
     production; run_scenario is the heaviest path and the one a reader's question runs on. */
  /* ROUND 8 (Opus adversarial review) got a placeholder past the ROUND 7 cut as well, and the
     round-7 comment below was simply wrong: "a constant cannot satisfy `headline` carrying a
     numeric margin without doing the arithmetic" — it can, because the check accepted ANY finite
     non-zero number anywhere in headline/costs, and `hasOwnProperty` accepts `null` for every
     named field. A ~60-line stub with no engine and hard-coded literals was certified GREEN,
     printing "returned computed results" while doing it.

     Two cuts of key-shape checking have now failed for the same reason: SHAPE IS NOT EVIDENCE OF
     COMPUTATION. The only thing that is, is the ANSWER. `--readback` now requires the live Worker
     to REPRODUCE THE VALUE THIS TREE'S ENGINE COMPUTES for the same inputs, and to produce
     DIFFERENT answers for different inputs. A constant satisfies neither. */
  /* ROUND 7 got a placeholder past the previous cut: `structuredContent: {placeholder:true}` is
     a non-empty object, so "structured output is present" passed while nothing had been computed.
     Presence is not a schema. Each probe now names the typed fields the REAL tool emits, and the
     numeric one names a field that must actually be a finite number — a constant cannot satisfy
     `headline` carrying a numeric margin without doing the arithmetic that produces it. */
  /* the oracle: this tree's own engine, the same module the Worker bundles */
  const localEngine = (() => {
    try {
      const req = createRequire(import.meta.url);
      return req(join(WORKER, "..", "..", "site", "engine.js"));
    } catch (e) { return { _err: e.message }; }
  })();
  /* the headline `value` string carries the rounded margin, e.g. "≈63% (policy-labeled …)" */
  const headlinePct = (sc) => {
    const v = sc && sc.headline && typeof sc.headline.value === "string" ? sc.headline.value : "";
    const m = /(-?\d+(?:\.\d+)?)\s*%/.exec(v);
    return m ? Number(m[1]) : null;
  };
  /* the challenge oracle: the same override path adjust_rental_rate applies */
  const localAdjustedPct = (rent) => {
    if (localEngine._err) return null;
    const E = localEngine;
    const model = E.MODELS.find((r) => r.id === "opus");
    const persp = E.PERSPECTIVES.find((r) => r.id === "gptpro-r3");
    if (!model || !persp) return null;
    const st = E.applyPresetSettings(model, persp, { mode: "native" });
    st.rentAbsAll = rent;
    return Math.round(E.workload(st, undefined, E.scenarioContext(st)).margin * 100);
  };
  const localHeadlinePct = (modelId) => {
    if (localEngine._err) return null;
    const E = localEngine;
    const model = E.MODELS.find((r) => r.id === modelId);
    const persp = E.PERSPECTIVES.find((r) => r.id === "median");
    if (!model || !persp) return null;
    const st = E.applyPresetSettings(model, persp, { mode: "native" });
    return Math.round(E.workload(st, undefined, E.scenarioContext(st)).margin * 100);
  };

  const COMPUTE = [
    /* `datacenters` is U5's additive discovery block. Requiring it here means a Worker built
       before the dc-map tools existed cannot be certified as this release. */
    { name: "list_scenario_space", arguments: {},
      requireKeys: ["models", "perspectives", "fleets", "engine", "override_bounds", "datacenters"] },
    { name: "run_scenario", arguments: { model: "opus" },
      requireKeys: ["headline", "costs", "feasibility", "engine", "claims"] },
  ];

  const call = (name, args, id) => post({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } });

  /* A tool result counts as a COMPUTATION only if it carries STRUCTURED output and is not an
     error. "A 200 proves the surface answers, it cannot prove what it is answering with."

     Round 6 found this predicate contradicting its own comment: it accepted `structuredContent
     OR any non-empty text content`, so a degraded Worker returning
     `{content:[{type:"text",text:"placeholder only; no computation happened"}]}` was certified
     as having computed. The comment was the specification and the code was weaker than it — the
     same shape of defect as the gate this file exists to replace. `structuredContent` is now
     REQUIRED, because it is the part a placeholder cannot fake: the compute tools emit typed
     fields, and prose alone proves only that something answered.

     `get_report` is checked with `requireStructured: false` — it is an archive read, and its
     structured block is provenance rather than a computation. */
  const computed = (res, { requireStructured = true } = {}) => {
    if (!res.ok) return { ok: false, why: res.why };
    const j = res.json;
    if (j?.error) return { ok: false, why: `JSON-RPC error ${j.error.code}: ${j.error.message}` };
    const r = j?.result;
    if (!r) return { ok: false, why: "no result member" };
    if (r.isError) return { ok: false, why: "tool reported isError" };
    if (!(r.content || []).length && !r.structuredContent) return { ok: false, why: "empty result — a 200 is not a computation" };
    if (requireStructured && (r.structuredContent === undefined || r.structuredContent === null))
      return { ok: false, why: "no structuredContent — the tool answered in prose only, which does not prove it computed" };
    if (requireStructured && typeof r.structuredContent === "object" && !Array.isArray(r.structuredContent)
        && Object.keys(r.structuredContent).length === 0)
      return { ok: false, why: "structuredContent is an empty object — nothing was computed" };
    return { ok: true };
  };

  const attempt = async () => {
    const listed = await post({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    if (!listed.ok) return { cls: "STALE", why: `tools/list unavailable — ${listed.why}` };
    const tools = (listed.json?.result?.tools || []).map(t => t.name);
    if (!tools.length) return { cls: "STALE", why: "live worker returned an empty tool list" };
    const want = ["adjust_rental_rate", "run_fleet_sections"];
    const missing = want.filter(w => !tools.includes(w));

    const rep = await call("get_report", { id: "final-answer" }, 2);
    const repOk = computed(rep, { requireStructured: false });
    const identity = rep.ok ? rep.json?.result?.structuredContent?.release?.built_from : undefined;

    /* Is the build we just shipped the one answering? */
    const isExpected = identity === expected;
    const surfaceIsNew = missing.length === 0;

    if (!isExpected) {
      /* A healthy worker with the NEW tool surface but a foreign built_from is not lag —
         nothing is going to turn it into our build. */
      if (surfaceIsNew && repOk.ok && identity) {
        return { cls: "WRONG-BUILD", why: `live worker reports built_from ${identity}; this tree built ${expected}. ` +
          `The tool surface matches, so identity is the only thing that caught it.` };
      }
      return { cls: "STALE", why: identity
        ? `live worker still reports built_from ${identity} (expected ${expected})` +
          (missing.length ? `; missing ${missing.join(", ")}` : "")
        : `live worker reports no build identity` + (missing.length ? `; missing ${missing.join(", ")}` : "") };
    }

    /* From here the NEW build is provably live. Every failure below is BROKEN, never lag. */
    if (!repOk.ok) return { cls: "BROKEN", why: `get_report failed on the deployed build — ${repOk.why}. This is NOT propagation: the live worker already reports built_from ${expected}.` };

    for (const probe of COMPUTE) {
      const res = await call(probe.name, probe.arguments, 3);
      let c = computed(res);
      if (c.ok) {
        const sc = res.json?.result?.structuredContent;
        /* review defeated the previous cut with five EMPTY containers — `[]`/`{}`/`""` satisfied
           "has a value". An empty collection is not a computation either. */
        const empty = (v) => v === undefined || v === null || v === ""
          || (Array.isArray(v) && v.length === 0)
          || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
        const missing = (probe.requireKeys || []).filter(k => sc == null || empty(sc[k]));
        if (missing.length) c = { ok: false, why: `structuredContent has no value for the fields this tool emits (${missing.join(", ")}) — null is not a computation, and a placeholder object is not one either` };
      }
      if (!c.ok) {
        return { cls: "BROKEN", why: `COMPUTING tool \`${probe.name}\` failed on the deployed build — ${c.why}. ` +
          `This is NOT propagation: the live worker already reports built_from ${expected}. ` +
          `A 503 with Cloudflare 1102 here means the uploaded bundle cannot run; roll back.` };
      }
    }

    /* U5: SUBSTRATE RELEASE IDENTITY. The connector's datacenter tools compute prices FROM the
       embedded release, so the live worker must be answering from the release this tree embedded —
       and when this tree embedded none, the live worker must refuse rather than serve one. By this
       point built_from already matches, so a disagreement is BROKEN, never propagation. */
    {
      const wanted = embeddedDcmapRelease();
      const space = await call("list_scenario_space", {}, 60);
      const spaceOk = computed(space);
      if (!spaceOk.ok) return { cls: "BROKEN", why: `list_scenario_space failed while checking the dc-map release binding — ${spaceOk.why}` };
      const dc = space.json?.result?.structuredContent?.datacenters;
      if (!dc) return { cls: "BROKEN", why: "the live connector publishes no `datacenters` discovery block — " +
        "it predates the U5 dc-map tools, so its substrate binding cannot be checked at all" };
      if (dc.status !== (wanted.status === "ok" ? "ok" : "release-unavailable") || dc.release_id !== wanted.release_id) {
        return { cls: "BROKEN", why: `dc-map SUBSTRATE MISMATCH — this tree embedded ` +
          `${wanted.status === "ok" ? wanted.release_id : "no release"}, but the live connector reports ` +
          `${dc.status} ${JSON.stringify(dc.release_id)}. A datacenter price is computed from those bytes; ` +
          `serving a different release under this build's identity is exactly what exact-release pinning forbids.` };
      }
      if (wanted.status === "ok") {
        const listed = await call("list_datacenters", {}, 61);
        const listedOk = computed(listed);
        if (!listedOk.ok) return { cls: "BROKEN", why: `list_datacenters failed on the deployed build — ${listedOk.why}` };
        const named = listed.json?.result?.structuredContent?.release_id;
        if (named !== wanted.release_id)
          return { cls: "BROKEN", why: `list_datacenters names release ${JSON.stringify(named)} while discovery ` +
            `reports ${wanted.release_id} — the connector's own responses disagree about which release they came from` };
      }
      console.log(`release-gate: dc-map substrate binding OK — ${wanted.status === "ok" ? wanted.release_id : "no release embedded, and the connector says so"}`);
    }

    /* THE PROOF OF COMPUTATION: the live Worker must reproduce what this tree's engine computes,
       and must answer DIFFERENTLY for different inputs. Shape checks were defeated twice; a
       hard-coded literal cannot pass either of these. */
    if (localEngine._err) die(`cannot load the local engine to verify the live answers — ${localEngine._err}`);

    /* A RANDOM CHALLENGE OVER THE WHOLE ANSWER, not one rounded number.

       Third defeat, and the reason is worth writing down. The previous cut drew a random rent and
       compared ONE rounded integer. Review pointed out that margin is EXACTLY LINEAR in rent —
       rent enters cost linearly and price is fixed — so a single fitted constant reproduces the
       oracle for every rent the gate can invent (max error 1e-13 over 2000 draws, zero rounding
       disagreements). A 25-line stub with no engine passed, and served a fabricated
       `run_scenario` headline of 92% alongside it, because that tool had lost its value check
       entirely when this replaced it.

       "Unpredictable input" was the wrong property to reach for. A scalar challenge with a
       closed-form answer is learnable no matter how it is drawn. What is not learnable is the
       WHOLE derived payload: `adjust_rental_rate` returns nine provenance-rich uncertainty
       triples, per-donor rent receipts and their sources, feasibility and lens spans — all
       engine-derived, none of them a straight line in the input.

       So the gate now compares the live Worker's ENTIRE structuredContent, at full precision,
       against what this tree's OWN compiled tool computes for the same randomized arguments.
       Byte equality between the two is an existing, separately tested property of this repo
       ("Worker adjust_rental_rate is byte-for-byte equal to the Node tool result"), so anything
       less than equality means the deployed bundle is not this release. Reproducing it requires
       running the engine, which is the only thing that was ever being asked. */
    if (localEngine._err) die(`cannot load the local engine to verify the live answers — ${localEngine._err}`);
    const localTools = (() => {
      try {
        const req = createRequire(import.meta.url);
        return {
          adjust: req(join(WORKER, "..", "dist", "tools", "adjust_rental_rate.js")),
          scenario: req(join(WORKER, "..", "dist", "tools", "run_scenario.js")),
        };
      } catch (e) { return { _err: e.message }; }
    })();
    if (localTools._err)
      die(`cannot load this tree's compiled tools to verify the live answers — ${localTools._err}. ` +
        `Run \`npm --prefix mcp-server run build\` before readback.`);

    const bounds = (localEngine.SCENARIO_BOUNDS && localEngine.SCENARIO_BOUNDS.rentAbsAll) || [0.5, 20];
    const PERSPS = ["gptpro-r3", "fable-r3", "stress-public-rate", "median"];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const seen = new Set();
    for (let i = 0; i < 3; i++) {
      const span = bounds[1] - bounds[0];
      /* randomised across FOUR axes, not one: the rent, the perspective, the capital-recovery
         basis and its cost of capital. */
      const args = {
        company: "anthropic",
        rent_usd_per_hr: Math.round((bounds[0] + span * 0.05 + Math.random() * span * 0.6) * 1e6) / 1e6,
        perspective: pick(PERSPS),
        capital_recovery: pick(["off", "on"]),
      };
      if (args.capital_recovery === "on") args.cost_of_capital_pct = pick([6, 8.5, 13]);
      const r = await call("adjust_rental_rate", args, 40 + i);
      const cc = computed(r);
      if (!cc.ok) return { cls: "BROKEN", why: `adjust_rental_rate(${JSON.stringify(args)}) failed on the deployed build — ${cc.why}` };
      let local;
      try { local = localTools.adjust.handler({ ...args }); }
      catch (e) { die(`this tree's own adjust_rental_rate threw on ${JSON.stringify(args)} — ${e.message}`); }
      if (local && local.isError)
        die(`this tree's own adjust_rental_rate refused ${JSON.stringify(args)}; cannot use it as an oracle`);
      const liveSc = JSON.stringify(r.json && r.json.result && r.json.result.structuredContent);
      const localSc = JSON.stringify(local && local.structuredContent);
      if (!localSc || localSc === "null") die("the local oracle produced no structuredContent to compare against");
      if (liveSc !== localSc)
        return { cls: "BROKEN", why: `RANDOM CHALLENGE FAILED — adjust_rental_rate(${JSON.stringify(args)}) ` +
          `returned ${liveSc ? liveSc.length : 0} bytes that do not match the ${localSc.length} bytes this tree computes. ` +
          `The deployed bundle is not running this release's engine (a closed-form stub cannot reproduce the full ` +
          `provenance payload — nine uncertainty triples, per-donor receipts, feasibility and lens spans).` };
      seen.add(liveSc);
    }
    if (seen.size < 3)
      return { cls: "BROKEN", why: `adjust_rental_rate returned identical payloads for three different randomized ` +
        `argument sets — that surface is not computing` };

    /* THE EXACT PRODUCTION CHALLENGE, PINNED, SIX SEQUENTIAL TIMES.

       2026-08-28: this gate returned `readback OK` on a deployment that was still broken. The
       randomised challenge above draws a perspective and a capital-recovery basis at random, and
       the failure lived on ONE expensive corner of that space — so three random draws usually miss
       it. The only reason the failure was caught at all is that a reviewer said, in words, to
       issue the known-heavy request by hand afterwards and roll back on a 1102. A release gate
       must not depend on a reviewer remembering to say that.

       Both properties are needed and the gate previously had only one. The RANDOM challenge
       defends against a pre-tabulated answer — a fixed probe can be learned, which is why
       randomisation was introduced in guard round 2. The PINNED challenge defends against a
       parameterisation that is far more expensive than the rest of the space and is therefore
       almost never drawn. Neither subsumes the other, so the gate now runs both, and this one is
       the release bar: SIX sequential calls, all of which must compute.

       Six, sequentially, on one connection, deliberately: every `exceededResources` bucket
       Cloudflare recorded for this worker was a burst of 3-5 calls, and the isolate's committed
       heap ratchets upward across consecutive invocations, so the SECOND and later calls are the
       ones at risk. A single call proves nothing about this failure mode. */
    const EXACT_CHALLENGE = Object.freeze({
      company: "anthropic", rent_usd_per_hr: 6.281173, perspective: "gptpro-r3",
      capital_recovery: "on", cost_of_capital_pct: 8.5,
    });
    const EXACT_CHALLENGE_CALLS = 6;
    {
      let localExact;
      try { localExact = localTools.adjust.handler({ ...EXACT_CHALLENGE }); }
      catch (e) { die(`this tree's own adjust_rental_rate threw on the pinned production challenge — ${e.message}`); }
      if (!localExact || localExact.isError)
        die(`this tree's own adjust_rental_rate refused the pinned production challenge; cannot use it as an oracle`);
      const wantSc = JSON.stringify(localExact.structuredContent);
      if (!wantSc || wantSc === "null")
        die("the local oracle produced no structuredContent for the pinned production challenge");
      for (let i = 0; i < EXACT_CHALLENGE_CALLS; i++) {
        const r = await call("adjust_rental_rate", { ...EXACT_CHALLENGE }, 70 + i);
        const cc = computed(r);
        if (!cc.ok)
          return { cls: "BROKEN", why: `PINNED PRODUCTION CHALLENGE FAILED on call ${i + 1} of ` +
            `${EXACT_CHALLENGE_CALLS} — ${cc.why}. Arguments: ${JSON.stringify(EXACT_CHALLENGE)}. ` +
            `A 503 with Cloudflare 1102 here is the known failure mode of this tool: roll back. ` +
            `The randomised challenge above passed, which is exactly why this one exists.` };
        const liveSc = JSON.stringify(r.json?.result?.structuredContent);
        if (liveSc !== wantSc)
          return { cls: "BROKEN", why: `PINNED PRODUCTION CHALLENGE MISMATCH on call ${i + 1} of ` +
            `${EXACT_CHALLENGE_CALLS} — the live worker returned ${liveSc ? liveSc.length : 0} bytes ` +
            `that do not match the ${wantSc.length} bytes this tree computes for the same arguments.` };
      }
    }

    /* H3: run_scenario had lost its value check when the rent challenge replaced it, and a stub
       served a fabricated 92% headline through it. It gets the same full-payload comparison. */
    {
      const args = { model: pick(["opus", "sonnet", "haiku"]), perspective: pick(["median", "stress-public-rate"]) };
      const r = await call("run_scenario", args, 50);
      const cc = computed(r);
      if (!cc.ok) return { cls: "BROKEN", why: `run_scenario(${JSON.stringify(args)}) failed on the deployed build — ${cc.why}` };
      let local;
      try { local = localTools.scenario.handler({ ...args }); }
      catch (e) { die(`this tree's own run_scenario threw on ${JSON.stringify(args)} — ${e.message}`); }
      if (local && local.isError) die(`this tree's own run_scenario refused ${JSON.stringify(args)}; cannot use it as an oracle`);
      const liveSc = JSON.stringify(r.json && r.json.result && r.json.result.structuredContent);
      const localSc = JSON.stringify(local && local.structuredContent);
      if (liveSc !== localSc)
        return { cls: "BROKEN", why: `RANDOM CHALLENGE FAILED — run_scenario(${JSON.stringify(args)}) does not match ` +
          `what this tree computes. The deployed bundle is not running this release's engine.` };
    }

    /* The T5 rec-5 property, checked against the surface a consumer actually receives.

       ROUND 4b — THIS WAS A PHRASE BLACKLIST AND IT FALSE-POSITIVED ON A HEALTHY BUILD.
       It scanned the whole response for /above[\s-]?80/ and eight siblings. The current
       final-answer entry's `identityLine` legitimately contains "…the above-80 reading is a
       separately labeled adopted analyst judgment, not a calculator output…" — the sentence that
       PERFORMS the separation rec 5 asks for. So the gate classified an honest deployment of this
       very release as terminal BROKEN. Round 7 established that a blacklist over natural language
       cannot be completed; this is the same lesson in the other direction, and a false positive in
       a release gate is the more dangerous one — a gate that fires on a healthy deploy is a gate
       someone learns to explain away, which is precisely what happened on 2026-08-27.

       Replaced by the PROPERTY, not the wording: the evidence-ranking TOKENS are minted by this
       tree's own engine, so the gate can ask whether the live final-answer entry carries them
       instead of guessing at phrasings. Non-vacuity is asserted the only way it can be — the same
       tokens MUST appear in the sibling entry that is supposed to carry them. */
    const engineForRanking = (() => {
      try { return createRequire(import.meta.url)(join(WORKER, "..", "..", "site", "engine.js")); }
      catch { return null; }
    })();
    if (!engineForRanking)
      return { cls: "BROKEN", why: "could not load this tree's engine to derive the rec-5 ranking tokens — " +
        "the separation property cannot be checked, and an uncheckable release property is not a passing one" };
    const faTokens = engineForRanking.finalAnswer().tokens;
    const RANKING_TOKENS = [faTokens.mostPlausibleLine, faTokens.decompositionLine,
      faTokens.higherJustificationsHeader, ...(faTokens.higherJustificationEntries || [])].filter(Boolean);
    if (RANKING_TOKENS.length < 4)
      return { cls: "BROKEN", why: `only ${RANKING_TOKENS.length} evidence-ranking tokens could be derived — ` +
        `the rec-5 check would be vacuous` };
    /* Every string the response carries, at its real value. NOT JSON.stringify: that escapes
       quotes, newlines and non-ASCII, so a token containing any of them would never match and the
       absence check would quietly pass on a response that DID carry the ranking — a false
       negative in the direction the gate exists to prevent. Found by this gate's own test. */
    const allStrings = (v, out = []) => {
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) for (const x of v) allStrings(x, out);
      else if (v && typeof v === "object") for (const x of Object.values(v)) allStrings(x, out);
      return out;
    };
    const textOf = (resp) => allStrings(resp && resp.json).join("\n\u0000\n");
    const repText = textOf(rep);
    const leaked = RANKING_TOKENS.filter(tok => repText.includes(tok));
    if (leaked.length) {
      return { cls: "BROKEN", why: `live get_report('final-answer') carries ${leaked.length} of the ` +
        `${RANKING_TOKENS.length} evidence-ranking tokens — the T5 rec-5 separation did not reach the deployed worker` };
    }
    /* ROUND 4b: the SIBLING entry, and its MACHINE block. The check above reads only the entry
       the ranking was moved OUT of. Round 4b found the defect in the one it was moved INTO —
       `analyst-hypothesis` was tagged `kind: "final-answer"`, so get_report's envelope called an
       adopted analyst judgment a live engine-derived result surface; and `registryEmitMeta` was
       called with a hardcoded "verbatim archive fetch", so the emitted claim's ESTIMAND called
       both live entries archive fetches. A unit test caught neither on the deployed bundle,
       because nothing here ever fetched that id. By this point built_from already matches, so
       the live worker IS this build — a mismatch is BROKEN, not propagation. */
    const ah = await call("get_report", { id: "analyst-hypothesis", max_chars: 200000 }, 2);
    if (!ah.ok) return { cls: "BROKEN", why: `live get_report('analyst-hypothesis') failed — ${ah.why}` };
    const ahSc = ah.json?.result?.structuredContent;
    if (!ahSc) return { cls: "BROKEN", why: "live get_report('analyst-hypothesis') returned no structuredContent" };
    if (ahSc.kind !== "analyst-hypothesis")
      return { cls: "BROKEN", why: `live get_report('analyst-hypothesis') reports kind ${JSON.stringify(ahSc.kind)} — ` +
        `the deployed bundle still presents this registry's RANKING of external claims under the calculator's answer class` };
    const ahSentence = (ah.json?.result?.content || []).map(c => c && c.text).join(" ");
    if (/LIVE engine-derived result surface/i.test(ahSentence) || /archived verbatim/i.test(ahSentence))
      return { cls: "BROKEN", why: "the live analyst-hypothesis envelope still calls an adopted judgment either " +
        "a live engine-derived result surface or an archived document — it is neither" };
    /* …and token absence is still only an ABSENCE check: it cannot see hand-written ranking prose
       that is not one of the engine's tokens, which is the gap a phrase list was there to cover
       and could not cover without false positives. The way out is the one this gate already takes
       for the computing tools: require the live Worker to REPRODUCE what this tree produces. Both
       live entries are rendered from the one formatter and are byte-identical across the two
       transports by construction (asserted in mcp-server's own suite), so any divergence at all —
       an injected sentence, a retagged kind, an edited token — fails here. Positive identity,
       not a guess at what a violation might look like. */
    const LOCAL_GET_REPORT = (() => {
      try { return createRequire(import.meta.url)(join(WORKER, "..", "dist", "tools", "get_report.js")); }
      catch { return null; }
    })();
    if (!LOCAL_GET_REPORT)
      return { cls: "BROKEN", why: "could not load this tree's compiled get_report to reproduce the live entries — " +
        "run `npm run build` in mcp-server; an uncheckable release property is not a passing one" };
    for (const [id, live] of [["final-answer", rep], ["analyst-hypothesis", ah]]) {
      const local = LOCAL_GET_REPORT.handler({ id, max_chars: 200000 });
      const liveSc = live.json?.result?.structuredContent || {};
      const localSc = local.structuredContent || {};
      if (liveSc.content !== localSc.content)
        return { cls: "BROKEN", why: `live get_report('${id}') does not reproduce what this tree renders ` +
          `(${(liveSc.content || "").length} chars live vs ${(localSc.content || "").length} local). ` +
          `The deployed bundle is not serving this release's ${id} entry.` };
      const liveLead = (live.json?.result?.content || []).map(c => c && c.text).join("");
      const localLead = (local.content || []).map(c => c && c.text).join("");
      if (liveLead !== localLead)
        return { cls: "BROKEN", why: `live get_report('${id}') returns a different lead sentence than this tree ` +
          `renders — the envelope a consumer reads first is not this release's.` };
    }

    /* the machine layer, both live entries, both directions */
    for (const [id, sc] of [["analyst-hypothesis", ahSc], ["final-answer", rep.json?.result?.structuredContent]]) {
      const estimand = (sc?.claims || [])[0]?.estimand;
      if (typeof estimand !== "string" || !estimand)
        return { cls: "BROKEN", why: `live get_report('${id}') carries no machine claim estimand to check` };
      if (/verbatim archive fetch/i.test(estimand))
        return { cls: "BROKEN", why: `live get_report('${id}') emits a machine claim whose estimand calls this LIVE ` +
          `entry a verbatim archive fetch: ${JSON.stringify(estimand)}. The deployed bundle predates the round-4b fix.` };
    }
    /* rec-5 non-vacuity, live: the tokens the final-answer entry must NOT carry are the ones the
       analyst-hypothesis entry MUST. Without this, a Worker that had simply stopped emitting them
       anywhere at all would sail through the absence check above. */
    const ahText = textOf(ah);
    const carried = RANKING_TOKENS.filter(tok => ahText.includes(tok));
    if (carried.length !== RANKING_TOKENS.length)
      return { cls: "BROKEN", why: `the live analyst-hypothesis entry carries only ${carried.length} of the ` +
        `${RANKING_TOKENS.length} evidence-ranking tokens — the ranking did not survive the move, so the ` +
        `absence check on final-answer proves nothing` };

    /* non-vacuity: an ARCHIVED entry must still say it, or the two checks above would pass on a
       worker that had simply stopped emitting the phrase anywhere. */
    const annex = await call("get_report", { id: "analyst-divergence", max_chars: 200000 }, 2);
    const annexEstimand = (annex.json?.result?.structuredContent?.claims || [])[0]?.estimand;
    if (!/verbatim archive fetch/i.test(annexEstimand || ""))
      return { cls: "BROKEN", why: "an ARCHIVED entry's machine estimand no longer says 'verbatim archive fetch' — " +
        `the live-entry checks above cannot be trusted (got ${JSON.stringify(annexEstimand)})` };

    return { cls: "GREEN", tools };
  };

  const t0 = Date.now();
  let waited = 0, backoff = 2000, last = null;
  for (;;) {
    last = await attempt();
    if (last.cls === "GREEN") {
      console.log(`release-gate: readback OK — built_from ${expected} live; ${last.tools.length} tools ` +
        `including adjust_rental_rate + run_fleet_sections; ${COMPUTE.map(c => c.name).join(" + ")} returned computed ` +
        `results; final-answer carries no external-hypothesis claim` + (waited ? ` (after ${(waited / 1000).toFixed(0)}s of propagation)` : ""));
      process.exit(0);
    }
    /* BROKEN and WRONG-BUILD are terminal by construction — retrying them is how a gate
       launders a breakage into a pass, which is exactly what happened on 2026-08-27. */
    if (last.cls !== "STALE") die(`${last.cls} — ${last.why}`);
    const left = DEADLINE_MS - (Date.now() - t0);
    if (left <= 0) break;
    const nap = Math.min(backoff, left);
    console.log(`release-gate: STALE (${last.why}) — waiting ${(nap / 1000).toFixed(0)}s for propagation`);
    await new Promise(r => setTimeout(r, nap));
    waited += nap; backoff = Math.min(Math.round(backoff * 1.6), 30_000);
  }
  die(`STALE at the deadline — the deployment did not propagate within ${(DEADLINE_MS / 1000).toFixed(0)}s. ${last.why}`);
}

/* =====================================================================================
   --parity — the surfaces must not silently disagree.

   Round 6, P1-5: `site/index.html` promises in its footer that "the same engine and claims
   registry are served as a read-only MCP connector". `deploy.sh` deploys Pages ONLY; the Worker
   is a separate, later step. So a Pages release makes that promise false until the Worker
   deploy also lands — and nothing in the release path noticed. On 2026-08-27 the two surfaces
   sat 9 days apart for hours and the only reason no reader was misled is that someone checked
   by hand.

   The Worker bundles `site_release_commit` — the site stamp its bytes were built against — so
   the connector can state its own binding. This compares that against the stamp the site is
   actually serving.

     ALIGNED  the connector names the site release that is live. exit 0.
     SKEWED   it names a different one — the footer's promise is false right now. exit 1.
     UNKNOWN  the live connector is too old to report a binding at all. exit 1, because an
              unanswerable parity question is not a passing one.
   ===================================================================================== */
if (cmd === "--parity") {
  const base = process.env.IM_MCP_URL || "https://margins-mcp.ashitaorbis.com";
  const site = process.env.IM_SITE_URL || "https://margins.ashitaorbis.com";
  const bust = `cb=${process.argv.includes("--no-bust") ? "0" : Date.now()}`;

  let siteStamp = null;
  try {
    const r = await fetch(`${site}/?${bust}`, { headers: { "cache-control": "no-cache" } });
    const html = await r.text();
    siteStamp = (/<span id="release-commit">([^<]*)<\/span>/.exec(html) || [])[1] || null;
  } catch (e) { die(`could not read the live site stamp — ${e.message}`); }
  if (!siteStamp) die("the live site served no release-commit span — cannot judge parity");

  let connStamp = null, why = "";
  try {
    const r = await fetch(base + "/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "get_report", arguments: { id: "final-answer" } } }),
    });
    if (!r.ok) { why = `HTTP ${r.status}`; }
    else {
      const j = JSON.parse(await r.text());
      connStamp = j?.result?.structuredContent?.release?.site_release_commit ?? null;
      if (!connStamp) why = "the live connector reports no site_release_commit (build predates the release block)";
    }
  } catch (e) { why = `transport: ${e.message}`; }

  if (!connStamp) die(`UNKNOWN — site is serving ${siteStamp}; ${why}. ` +
    `The footer promises the connector serves the same engine and claims registry, and nothing can currently confirm that.`);
  /* ROUND 8: two surfaces that cannot say what they were built from were certified as ALIGNED,
     because "unknown" === "unknown". `--repin` itself emits "unknown" when git metadata is
     unavailable, so this is a state the tooling actually produces. An unidentifiable stamp is the
     UNKNOWN case the doc above already says must fail, whichever side it appears on. */
  /* ROUND 2 of the guard review: admitting `-dirty` reopened the hole one level in. A `-dirty`
     stamp names a commit PLUS an unrecorded set of uncommitted edits, so two surfaces carrying
     the SAME `-dirty` stamp can hold arbitrarily different bytes. That is the UNKNOWN case this
     verb already refuses, wearing a commit id. A release must be identified by a commit alone. */
  const identifiable = (v) => typeof v === "string" && /^[0-9a-f]{7,40}$/i.test(v.trim());
  const dirty = (v) => typeof v === "string" && /-dirty$/i.test(v.trim());
  if (dirty(siteStamp) || dirty(connStamp))
    die(`UNKNOWN — a surface reported a DIRTY build stamp (site ${JSON.stringify(siteStamp)}, ` +
      `connector ${JSON.stringify(connStamp)}). "<commit>-dirty" names a commit plus uncommitted edits ` +
      `nobody recorded, so two surfaces carrying the same dirty stamp can hold different bytes. ` +
      `Release from a clean tree.`);
  if (!identifiable(siteStamp) || !identifiable(connStamp))
    die(`UNKNOWN — a surface reported an unidentifiable release stamp (site ${JSON.stringify(siteStamp)}, ` +
      `connector ${JSON.stringify(connStamp)}). Two surfaces that cannot say what they were built from ` +
      `cannot be certified as carrying the same engine.`);
  if (connStamp !== siteStamp) die(`SKEWED — the site serves ${siteStamp} but the connector reports it was built against ${connStamp}. ` +
    `The footer's "same engine and claims registry" promise is FALSE until the Worker deploy lands.`);
  console.log(`release-gate: parity OK — site ${siteStamp}; connector built against ${connStamp}`);
  process.exit(0);
}

/* =====================================================================================
   --dcmap-parity — the SUBSTRATE half of the same question (U5).

   `--parity` asks whether the connector and the margins site were built from the same commit. The
   dc-map surfaces need the same question asked about DATA rather than code: the evidence atlas at
   datacenters.ashitaorbis.com serves one exact substrate release (its dist/release.json names it),
   and this connector computes datacenter prices from one exact substrate release (embedded at
   build time). If those differ, a reader can open a site page and an MCP client and get two
   different answers about the same site, both correctly labelled, both pinned — to different
   releases. That is precisely the state exact-release pinning exists to make visible.

   It is a SEPARATE verb rather than a leg of `--parity` deliberately: the atlas is a separate
   Pages project on its own gate (DESIGN §4), so a margins Worker deploy must not be blocked by
   whether the atlas has shipped yet. Run this one when both surfaces are live.

     ALIGNED  connector and atlas name the same rel-… release. exit 0.
     SKEWED   they name different ones. exit 1.
     UNKNOWN  either side cannot say. exit 1 — an unanswerable parity question is not a passing one.
   ===================================================================================== */
if (cmd === "--dcmap-parity") {
  const base = process.env.IM_MCP_URL || "https://margins-mcp.ashitaorbis.com";
  const atlas = process.env.DCMAP_SITE_URL || "https://datacenters.ashitaorbis.com";
  const bust = `cb=${process.argv.includes("--no-bust") ? "0" : Date.now()}`;

  let atlasRelease = null;
  try {
    const r = await fetch(`${atlas}/release.json?${bust}`, { headers: { "cache-control": "no-cache" } });
    if (!r.ok) die(`UNKNOWN — the evidence atlas returned HTTP ${r.status} for /release.json`);
    atlasRelease = JSON.parse(await r.text()).release_id ?? null;
  } catch (e) { die(`UNKNOWN — could not read the evidence atlas release — ${e.message}`); }
  if (!atlasRelease) die("UNKNOWN — the evidence atlas served no release_id; it cannot say which release it is showing");

  let connectorRelease = null, why = "";
  try {
    const r = await fetch(base + "/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "list_scenario_space", arguments: {} } }),
    });
    if (!r.ok) why = `HTTP ${r.status}`;
    else {
      const dc = JSON.parse(await r.text())?.result?.structuredContent?.datacenters;
      if (!dc) why = "the live connector publishes no `datacenters` discovery block (build predates U5)";
      else if (dc.status !== "ok") why = `the live connector reports its substrate release as ${dc.status}: ${(dc.reasons || []).join("; ")}`;
      else connectorRelease = dc.release_id;
    }
  } catch (e) { why = `transport: ${e.message}`; }

  if (!connectorRelease) die(`UNKNOWN — the atlas is serving ${atlasRelease}; ${why}. ` +
    `Two surfaces that cannot both name their substrate release cannot be certified as showing the same evidence.`);
  const wellFormed = (v) => typeof v === "string" && /^rel-[a-f0-9]{24}$/.test(v);
  if (!wellFormed(atlasRelease) || !wellFormed(connectorRelease))
    die(`UNKNOWN — a surface reported a malformed substrate release id (atlas ${JSON.stringify(atlasRelease)}, ` +
      `connector ${JSON.stringify(connectorRelease)}).`);
  if (atlasRelease !== connectorRelease)
    die(`SKEWED — the evidence atlas serves ${atlasRelease} but the connector computes from ${connectorRelease}. ` +
      `The same site can answer differently on the two surfaces until one of them is redeployed.`);
  console.log(`release-gate: dc-map parity OK — atlas and connector both on ${atlasRelease}`);
  process.exit(0);
}

die("usage: release-gate.mjs --check | --repin | --readback | --parity | --dcmap-parity");
