// IM3 slice-1b invariant/golden tests for the live roofline path (engine-roofline-v22.js).
// Covers the memo §12 "Slice 1b" bullets INCLUDING the "Slice 1b also owns" list and the
// slice-1a spec item (non-compute-bound guard). Run: node site/tests/roofline-core.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
// Golden constants below are hand-computed from the FROZEN research/d2-equation-set-v2.md
// (§1 forms, §5 recipes) and research/im3-slice1a-derivations.md — each carries its citation.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const R = require("../engine-roofline-v22.js");
const E = require("../engine.js");
const D = require("../engine-data-v22.js");
const ROOFLINE_SOURCE = readFileSync(new URL("../engine-roofline-v22.js", import.meta.url), "utf8");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const rel = (got, want) => Math.abs(got - want) / Math.abs(want);
const near = (name, got, want, tol, detail = "") =>
  assert(name, typeof got === "number" && isFinite(got) && rel(got, want) <= tol,
    `got ${got}, want ${want} (rel ${typeof got === "number" ? rel(got, want).toExponential(2) : "n/a"} > ${tol})${detail ? " — " + detail : ""}`);
const throwsAs = (name, fn, errName) => {
  try { fn(); assert(name, false, "did not throw"); }
  catch (e) { assert(name, e.name === errName, `threw ${e.name}: ${e.message}`); }
};

const HW_KEYS = [...E.HW_ORDER, "rubin"];
const PRECISIONS = ["bf16", "fp8", "fp4"];
const dsr1 = R.resolveArch("dsr1");
const qwen3c = R.resolveArch("custom", "qwen3c");
const llama70 = R.resolveArch("custom", "llama70");

/* ================= 0. cross-registry coverage (load-check guards) ================= */
for (const m of E.MODELS) assert(`MODEL_ARCH covers engine model '${m.id}'`, !!D.MODEL_ARCH[m.id]);
for (const t of E.TRAFFIC_PROFILES) assert(`TRAFFIC_OSL covers profile '${t.id}'`, !!D.TRAFFIC_OSL[t.id]);
for (const k of HW_KEYS) {
  assert(`HW_ROOFLINE covers '${k}'`, !!D.HW_ROOFLINE[k]);
  assert(`PRECISION_TUPLES covers '${k}'`, !!D.PRECISION_TUPLES[k]);
  assert(`CALIBRATION covers '${k}'`, !!D.CALIBRATION[k] && typeof D.CALIBRATION[k].etaDec === "number");
  assert(`OPERATING_POINTS covers '${k}'`, !!D.OPERATING_POINTS[k]);
}

/* ================= 1. term-level goldens (hand-computed from frozen constants) =================
   (a) tpu7 recipe — frozen d2 §5 recipe 5 / CL-5: Qwen3-Coder-480B-A35B (62L/6144h/96q/8kv/128hd,
       moeLayers 62, topK 8), A=35e9, FP8 (s_w 1, s_KV 1, s_act 2), FLOPS 4.614e15, HBM 7.37e12,
       ICI 1.2e12, MoE-EP, b=16/chip, L=5,000 (C5).
       Hand arithmetic (frozen §1.1):
         F_attn = 2·62·96·2·128·5000 = 15,237,120,000 ⇒ Φ = 2·35e9 + F_attn = 85,237,120,000
         K(L)  = 2·62·8·128·1·5000  = 634,880,000     W_iter = 35e9·1 = 3.5e10
         D     = 2·62·8·6144·2      = 12,189,696
         t_C = 16·Φ/4.614e15 = 2.955773558734287e-4 s
         t_H = (3.0e10 + 16·K)/7.37e12 = 5.448857530529172e-3 s  (binds)   [b9 M1/M2 re-mint]
         t_N = 16·D/1.2e12 = 1.6252928e-4 s
         T̂(joint η 0.36142, MoE t_cc≡0) = 16/(t_H/0.36142) = 943.7656871151297 tok/s/chip */
{
  const g = R.decodeRoofline({ arch: qwen3c, activeB: 35, totalB: 480, hwKey: "tpu7", b: 16, L: 5000, precision: "fp8" });
  near("tpu7 golden t_C", g.tC, 2.955773558734287e-4, 1e-9);
  near("tpu7 golden t_H", g.tH, 5.448857530529172e-3, 1e-9);
  near("tpu7 golden t_N", g.tN, 1.6252928e-4, 1e-9);
  // b9 M1 re-mint (unmanifested at M1; recorded in the b9 M2 manifest, family 7): this row left
  // the frozen recipe's active-parameter surrogate for the replica-resident-distinct basis, so
  // W_iter = Total·s_W / nPhysDeclared = 480e9 × 1 / 16 = 3.0e10, NOT the recipe's A_m·s_w = 35 GB.
  // The frozen recipe itself is untouched — it governs the frozen protocol's own engine copy.
  assert("tpu7 W_iter = Total·s_W/N_phys = 30 GB (b9 M1 replica-resident-distinct)", g.wIterBytes === 3.0e10, String(g.wIterBytes));
  assert("tpu7 golden binds on t_H", g.bindingTerm === "t_H", g.bindingTerm);
  assert("tpu7 MoE-EP t_cc ≡ 0", g.tCc === 0, String(g.tCc));
  /* im-vet-six-repairs (2026-09-20), vetting finding E2: η 0.55 -> 0.521 after the numerator
     repair, and throughput scales with η exactly — 1529.8619854335666 / 1615.0174510335157 =
     0.521/0.55 to the bit, which is the property this golden exists to hold. The three golden
     TERMS above (t_C, t_H, t_N) are η-independent and are byte-identical, which is the evidence
     that this moved a coefficient and nothing about the roofline. */
  near("tpu7 golden T̂(b=16) at the platform-native η 0.521", g.tokPerS, 1529.8619854335666, 1e-9);
  near("tpu7 golden T̂ scales EXACTLY with η (0.521/0.55) — the repair is a coefficient move, not a roofline move",
    g.tokPerS / 1615.0174510335157, 0.521 / 0.55, 1e-12);
  // b9 M1 rejected the joint fit for this row (zero TPU observations in it) — see CALIBRATION.tpu7.
  assert("tpu7 η is the platform-native aggregate bridge, NOT the joint fit",
    g.etaDec === D.CALIBRATION.tpu7.etaDec && g.etaDec !== D.JOINT_ETA_DEC, String(g.etaDec));
}
/* (b) trn2-70b recipe — frozen d2 §5 recipe 6 / CL-6: llama70 (80L/8192h/64q/8kv/128hd) dense
       TP16, BF16 (s_w 2, s_KV 2, s_act 2, C10 FLOPS 0.65e15/chip), HBM 2.9e12, NeuronLink 1.024e12,
       b=1, L=10,750 (C5).
       Hand arithmetic:
         F_attn = 2·80·64·2·128·10750 = 28,180,480,000 ⇒ Φ = 2·70e9 + F_attn = 168,180,480,000
         Φ_dev = Φ/16 = 10,511,280,000
         K(L) = 2·80·8·128·2·10750 = 3,522,560,000 ⇒ K_dev = K/16 = 220,160,000
         W_iter = 70e9·2/16 = 8.75e9  (frozen: "70B ⇒ 8.75 GB/chip")
         D = 4·80·8192·2·(15/16) = 4,915,200
         t_C = Φ_dev/0.65e15 = 1.61712e-5 s
         t_H = (8.75e9 + 2.2016e8)/2.9e12 = 3.093158620689655e-3 s  (binds)
         t_N = D/1.28e12 = 3.84e-6 s   [b9 M1 cell 10: AWS published NeuronLink 1.28e12]
         t_cc = 2·80·18e-6 = 2.88e-3 s  (frozen §1.5: "t_cc(70B) = 2.88 ms")
         T̂(joint η) = 1/(t_H/0.36142 + t_cc) = 87.4252018133709 tok/s */
{
  const g = R.decodeRoofline({ arch: llama70, activeB: 70, totalB: 70, hwKey: "trn2", b: 1, L: 10750, precision: "bf16" });
  near("trn2-70b golden t_C", g.tC, 1.61712e-5, 1e-9);
  near("trn2-70b golden t_H", g.tH, 3.093158620689655e-3, 1e-9);
  near("trn2-70b golden t_N", g.tN, 3.84e-6, 1e-9);
  assert("trn2-70b golden t_cc = 2.88 ms exactly (frozen §1.5)", g.tCc === 2.88e-3, String(g.tCc));
  assert("trn2-70b golden W_iter = 8.75 GB/chip (frozen recipe 6)", g.wIterBytes === 8.75e9, String(g.wIterBytes));
  assert("trn2-70b binds on t_H", g.bindingTerm === "t_H", g.bindingTerm);
  near("trn2-70b golden T̂(b=1) at joint η + t_cc", g.tokPerS, 87.4252018133709, 1e-9);
}
/* (c) h800 F1 decomposition — im3-slice1a-derivations §2 (b=96, L=4,989, FP8 tuple, dsr1):
       t_C 4.796637 ms · t_H 16.068112 ms (binds) · t_N 3.192914 ms; T̂ at deployed η 0.313491
       = 1,872.973 tok/s (the snapshot-pin basis). */
{
  const g = R.decodeRoofline({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "h800", b: 96, L: 4989, precision: "fp8" });
  near("h800 F1 golden t_C = 4.796637 ms (derivations)", g.tC, 4.796637e-3, 1e-6);
  near("h800 F1 golden t_H = 16.068112 ms (derivations)", g.tH, 1.6068112e-2, 1e-6);
  near("h800 F1 golden t_N = 3.192914 ms (derivations)", g.tN, 3.192914e-3, 1e-6);
  assert("h800 F1 binds on t_H", g.bindingTerm === "t_H", g.bindingTerm);
  near("h800 F1 T̂ = 1,872.973 at deployed η (derivations)", g.tokPerS, 1872.973, 1e-6);
  assert("h800 deployed η comes from CALIBRATION", g.etaDec === D.CALIBRATION.h800.etaDec);
}
/* (d) h800 F7 prefill identity — frozen §2/§3.1: η_pre 0.17581 reproduces ~4,026 tok/s/GPU at
       L_in = 4,989 FP8. Hand: Φ_pre = 2·37e9 + 2·61·128·(192+128)·(4989/2) = 86,465,315,840;
       compute term Φ_pre/1.98e15 = 4.366935e-5 s binds over fabric D/400e9 = 3.325952e-5 s;
       T̂_pre = 0.17581/4.366935143434344e-5 = 4,025.935678580642. */
{
  const g = R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: "h800", precision: "fp8", LIn: 4989 });
  near("h800 F7 prefill golden T̂_pre ≈ 4,026", g.tokPerS, 4025.935678580642, 1e-9);
  assert("h800 F7 prefill binds on compute", g.bindingTerm === "compute", g.bindingTerm);
  assert("h800 prefill status is FITTED identity", /FITTED/.test(g.status), String(g.status));
}
/* (e) Rubin BF16 primary-source pin — NVIDIA's current NVL72 table publishes 4 PFLOPS
       dense FP16/BF16 per GPU. The prior generic fp8/2 fallback (8.75 PF) overstated
       compute-bound BF16 prefill by exactly 2.1875×. Rubin remains projection-only:
       this corrects one published shape constant, not its evidence class. */
{
  assert("Rubin dense BF16 = NVIDIA-published 4 PFLOPS/GPU",
    D.HW_ROOFLINE.rubin.flops.bf16 === 4e15, String(D.HW_ROOFLINE.rubin.flops.bf16));
  assert("Rubin BF16 provenance names the NVIDIA primary specification",
    /PUBLISHED/.test(D.HW_ROOFLINE.rubin.prov["flops.bf16"])
    && /nvidia\.com\/en-us\/data-center\/vera-rubin-nvl72/.test(D.HW_ROOFLINE.rubin.prov["flops.bf16"]),
    D.HW_ROOFLINE.rubin.prov["flops.bf16"]);
  const g = R.prefillRoofline({
    arch: R.resolveArch("opus"), activeB: 300, hwKey: "rubin",
    precision: "bf16", LIn: 15000,
  });
  near("Rubin BF16 prefill uses the 4 PFLOPS/GPU primary value",
    g.tokPerS, 1103.1589462482177, 1e-12);
  assert("Rubin BF16 prefill remains explicitly projection-labeled",
    /projection/.test(g.status), String(g.status));
}
/* (f) Trainium3 capacity primary-source pin — post-review adjudication 2026-07-27:
       the AWS Neuron architecture docs are unit-explicit ('HBM Capacity (GiB): 144';
       '144 GiB of device memory'), overriding the marketing page's loose '144 GB'
       label the external review had re-read as SI. 144 GiB = 154,618,822,656 B. */
{
  assert("Trainium3 HBM capacity uses the Neuron docs' unit-explicit 144 GiB",
    D.HW_ROOFLINE.trn3.hbmBytes === 154618822656, String(D.HW_ROOFLINE.trn3.hbmBytes));
  assert("Trainium3 capacity provenance cites the unit-explicit Neuron docs GiB statement",
    /144 GiB/.test(D.HW_ROOFLINE.trn3.prov.hbmBytes)
    && /awsdocs-neuron/.test(D.HW_ROOFLINE.trn3.prov.hbmBytes),
    D.HW_ROOFLINE.trn3.prov.hbmBytes);
  const op = R.resolveOperatingPoint({
    arch: R.resolveArch("kimi"), totalB: 1000, precision: "fp8",
    L: 15500, LPeak: 15500, hwKey: "trn3", regime: "batch",
  });
  // Post-review adjudication 2026-07-27: under the Neuron docs' unit-explicit 144 GiB
  // the Kimi declared batch fits (bFeas 140 ≥ 128, uncapped); the review's SI reading
  // had capped it to 123. The pin keeps the boundary honest in BOTH directions.
  assert("Trainium3 144 GiB capacity leaves Kimi batch b=128 uncapped (bFeas 140)",
    op.capped === false && op.bDeclared === 128 && op.b === 128 && op.bFeas === 140,
    JSON.stringify(op));
}

/* ================= 2. dimensional/unit rejects (SI B/s / FLOP/s / B-capacity only) ================= */
for (const k of HW_KEYS) assert(`units: real row '${k}' passes SI scale checks`, R.assertHwRowUnits(k, D.HW_ROOFLINE[k]) === true);
const okRow = { fabric: 400e9, bwHBM: 3.35e12, hbmBytes: 85520809984, nShard: 8, nShardDimension: "N_shard", flops: { fp8: 1.98e15 } };
assert("units: okRow control passes (non-vacuity baseline)", R.assertHwRowUnits("doct", okRow) === true);
throwsAs("units: TB/s-scale bwHBM (3.35) in a B/s field fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, bwHBM: 3.35 }), "RooflineUnitError");
throwsAs("units: GB/s-count fabric (400) in a B/s field fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, fabric: 400 }), "RooflineUnitError");
throwsAs("units: PFLOPS-scale flops (1.98) in a FLOP/s field fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, flops: { fp8: 1.98 } }), "RooflineUnitError");
throwsAs("units: GB-count hbmBytes (96) in a B capacity field fails loudly (R5 fix 4a — real injection, not vacuous)",
  () => R.assertHwRowUnits("doct", { ...okRow, hbmBytes: 96 }), "RooflineUnitError");
throwsAs("units: TB-scale hbmBytes (96e12) fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, hbmBytes: 96e12 }), "RooflineUnitError");
throwsAs("units: implausible nShard (0) fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, nShard: 0 }), "RooflineUnitError");
throwsAs("units: absent flops map fails loudly", () => R.assertHwRowUnits("doct", { ...okRow, flops: {} }), "RooflineDataError");

/* ================= 3. branch tests — MLA vs GQA vs out-of-model ================= */
{
  const f = R.archFormsUsed(dsr1);
  assert("dsr1 uses stated MLA branches", f.fAttnForm === "mla" && f.kvForm === "mla");
  const g = R.archFormsUsed(R.resolveArch("glm47"));
  assert("glm47 uses stated GQA branches", g.fAttnForm === "gqa" && g.kvForm === "gqa");
  const l = R.archFormsUsed(llama70);
  assert("llama70 (gqa-dense) uses GQA forms in dense-tp mode", l.fAttnForm === "gqa" && l.kvForm === "gqa" && l.mode === "dense-tp");
  for (const id of ["dsv4", "dsv4f"]) {
    const a = R.resolveArch(id);
    const o = R.archFormsUsed(a);
    assert(`${id} NEVER enters stated branches (declared forms only)`, o.fAttnForm === "gqa-upper-bound" && o.kvForm === "compressed-single-head",
      JSON.stringify(o));
    assert(`${id} status is analyst-approx, never stated`, /analyst-approx/.test(a.status), String(a.status));
    // Numeric distinctness of the compressed-KV reading (memo §3): layers·kvHeads(1)·headDim(512)·sKV
    const kv = R.kvBytesPerToken(a, 1);
    const mlaReading = a.layers * 576 * 1;              // what the MLA branch would give with dsr1-family kvDim
    const gqaReading = 2 * a.layers * a.kvHeads * a.headDim * 1; // what the stated GQA form would give
    assert(`${id} KV/token = compressed single-head (${a.layers}·1·512)`, kv === a.layers * a.kvHeads * a.headDim, String(kv));
    assert(`${id} KV/token ≠ MLA reading and ≠ GQA ×2 reading`, kv !== mlaReading && kv !== gqaReading, `${kv} vs ${mlaReading}/${gqaReading}`);
    // F_attn is the GQA formula on declared qHeads/headDim (upper bound, disclosed)
    assert(`${id} F_attn = GQA formula on declared dims`, R.fAttnPerPos(a, 1000) === 2 * a.layers * a.qHeads * 2 * a.headDim * 1000);
  }
  throwsAs("malformed out-of-model row (no declared forms) hard-errors", () =>
    R.kvBytesPerToken({ attnClass: "out-of-model", layers: 10, kvHeads: 1, headDim: 512, mode: "moe-ep" }, 1), "RooflineDataError");
}

/* ================= 4. precision resolution — every enum×row (33 cells) ================= */
for (const k of HW_KEYS) for (const p of PRECISIONS) {
  const t = R.resolvePrecisionTuple(k, p);
  assert(`tuple ${k}×${p} resolves to a reviewed tuple`,
    typeof t.flops === "number" && t.flops === D.HW_ROOFLINE[k].flops[t.flopsBasis] &&
    [t.sW, t.sKV, t.sAct].every(v => typeof v === "number" && v > 0),
    JSON.stringify(t));
}
// fallback/ineligibility cells are EXPLICIT, never silent (memo §6)
// b9 M1 cell 13 removed trn3 from this list: AWS publishes 2.517 PF MXFP4, so the row carries a
// NATIVE tuple. CAPACITY-SIDE ONLY — run B leaves throughput uncredited until a serving anchor
// exists, which is why the fp8 default path is unaffected and asserted separately below.
for (const k of ["h100", "h200", "h800", "h20", "tpu7", "trn2"]) {
  const t = R.resolvePrecisionTuple(k, "fp4");
  assert(`${k}×fp4 = explicit non-capable fallback on the 8-bit basis`,
    t.fallback === "fp4-not-capable" && t.flopsBasis === "fp8" && t.sW === 0.5 && t.sAct === 2, JSON.stringify(t));
}
{
  const t = R.resolvePrecisionTuple("trn3", "fp4");
  assert("trn3×fp4 = NATIVE MXFP4 tuple, no fallback (b9 M1 cell 13)",
    t.fallback === null && t.flopsBasis === "fp4" && t.sW === 0.5, JSON.stringify(t));
}
{
  const a8 = R.resolvePrecisionTuple("ascend", "fp8");
  assert("ascend 8-bit resolves to INT8 basis (structural naming, memo §6)",
    a8.flopsBasis === "int8" && a8.naming === "int8" && a8.flops === D.HW_ROOFLINE.ascend.flops.int8 && a8.sKV === 2, JSON.stringify(a8));
  const a4 = R.resolvePrecisionTuple("ascend", "fp4");
  assert("ascend fp4 falls back to INT8 basis, KV BF16 (C1)", a4.flopsBasis === "int8" && a4.fallback === "fp4-not-capable" && a4.sKV === 2);
  const r4 = R.resolvePrecisionTuple("rubin", "fp4");
  assert("rubin fp4 = explicit fp8-basis fallback (dense NVFP4 unpublished)",
    r4.flopsBasis === "fp8" && r4.fallback === "fp4-dense-flops-unpublished" && r4.sW === 0.5 && r4.sAct === 0.5, JSON.stringify(r4));
  const g4 = R.resolvePrecisionTuple("gb200", "fp4");
  assert("gb200 fp4 = frozen C2/F4 path (10e15, s_act 0.5, no fallback)",
    g4.flops === D.HW_ROOFLINE.gb200.flops.fp4 && g4.sAct === 0.5 && g4.fallback === null);
  const g3 = R.resolvePrecisionTuple("gb300", "fp4");
  assert("gb300 fp4 = frozen C2 (15e15 dense NVFP4)", g3.flops === D.HW_ROOFLINE.gb300.flops.fp4 && g3.fallback === null);
  for (const k of HW_KEYS) {
    const b = R.resolvePrecisionTuple(k, "bf16");
    assert(`${k}×bf16 = whole-stack BF16 (2/2/2, decision-log e)`, b.sW === 2 && b.sKV === 2 && b.sAct === 2);
  }
}
throwsAs("unknown precision enum hard-errors (never a default)", () => R.resolvePrecisionTuple("h800", "int4"), "RooflineDataError");
throwsAs("unknown HW row hard-errors", () => R.resolvePrecisionTuple("nonesuch", "fp8"), "RooflineDataError");
throwsAs("unknown model hard-errors", () => R.resolveArch("nonesuch"), "RooflineDataError");

/* ================= 5. stackMult on both paths (memo §7) ================= */
{
  const base = { arch: dsr1, activeB: 37, totalB: 671, hwKey: "h800", b: 96, L: 4989, precision: "fp8" };
  const s1 = R.decodeRoofline(base), s2 = R.decodeRoofline({ ...base, stackMult: 2 });
  near("MoE path (t_cc≡0): stackMult 2 ⇒ exactly 2× throughput", s2.tokPerS / s1.tokPerS, 2, 1e-12);
  assert("MoE path: η_eff = η_dec × stackMult", s2.etaEff === s1.etaDec * 2);
  const d1 = R.decodeRoofline({ arch: llama70, activeB: 70, totalB: 70, hwKey: "trn2", b: 1, L: 10750, precision: "bf16" });
  const d2 = R.decodeRoofline({ arch: llama70, activeB: 70, totalB: 70, hwKey: "trn2", b: 1, L: 10750, precision: "bf16", stackMult: 2 });
  assert("dense path: t_cc UNSCALED by stackMult", d1.tCc === d2.tCc && d2.tCc === 2.88e-3, `${d1.tCc} vs ${d2.tCc}`);
  near("dense path: t_iter(sm2) = t_roof(sm1)/2 + t_cc (η-only composition)", d2.tIter, d1.tRoof / 2 + d1.tCc, 1e-12);
  assert("dense path: throughput gain < 2× (latency floor persists)", d2.tokPerS / d1.tokPerS < 2 && d2.tokPerS > d1.tokPerS,
    String(d2.tokPerS / d1.tokPerS));
  const p1 = R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: "h800", precision: "fp8", LIn: 4989 });
  const p2 = R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: "h800", precision: "fp8", LIn: 4989, stackMult: 2 });
  near("prefill: stackMult multiplies η_pre identically (2× exactly)", p2.tokPerS / p1.tokPerS, 2, 1e-12);
  throwsAs("decode rejects a stack multiplier that makes efficiency exceed one",
    () => R.decodeRoofline({ arch: qwen3c, activeB: 35, totalB: 480, hwKey: "tpu7",
      b: 16, L: 5000, precision: "fp8", stackMult: 2 }), "RooflineUnitError");
  throwsAs("prefill rejects a stack multiplier that makes efficiency exceed one",
    () => R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: "h800",
      precision: "fp8", LIn: 4989, stackMult: 6 }), "RooflineUnitError");
  throwsAs("decode rejects active parameters greater than total parameters",
    () => R.decodeRoofline({ arch: dsr1, activeB: 672, totalB: 671, hwKey: "h800",
      b: 96, L: 4989, precision: "fp8" }), "RooflineUnitError");
}

/* ================= 6. t_cc gating — dense-only, outside η, τ-band unreachable ================= */
{
  // dense-TP only: every MoE-mode render carries t_cc ≡ 0; dense rows carry 2·layers·τ_cc
  for (const k of HW_KEYS) {
    const g = R.decodeRoofline({ arch: dsr1, activeB: 37, totalB: 671, hwKey: k, b: 8, L: 4096, precision: "fp8" });
    assert(`t_cc ≡ 0 for MoE-EP on ${k}`, g.tCc === 0, String(g.tCc));
  }
  const dg = R.decodeRoofline({ arch: llama70, activeB: 70, totalB: 70, hwKey: "trn3", b: 1, L: 10750, precision: "bf16" });
  assert("dense t_cc = collectivesPerLayer·layers·τ_cc from TCC_CONSTANTS",
    dg.tCc === D.TCC_CONSTANTS.collectivesPerLayer * llama70.layers * D.TCC_CONSTANTS.tauCc, String(dg.tCc));
  near("dense t_cc added OUTSIDE η: t_iter = max/η_eff + t_cc", dg.tIter, Math.max(dg.tC, dg.tH, dg.tN) / dg.etaEff + dg.tCc, 1e-12);
  // τ-band unreachable: τ is not a parameter of any exported API; injected fields are ignored
  const base = { arch: llama70, activeB: 70, totalB: 70, hwKey: "trn2", b: 1, L: 10750, precision: "bf16" };
  const a = R.decodeRoofline(base);
  const b = R.decodeRoofline({ ...base, tauCc: 5e-6, tCc: 1, tau: 104e-6, q: 3, a: 1.85, kvScans: 3, osl: 5 });
  assert("injected τ/q/a/kvScans/osl fields are structurally ignored (identical result)",
    JSON.stringify(a) === JSON.stringify(b));
  assert("TCC_CONSTANTS carries the declared point ONLY (no exploratory band field)",
    Object.keys(D.TCC_CONSTANTS).every(k => ["tauCc", "collectivesPerLayer", "mode", "prov"].includes(k)),
    Object.keys(D.TCC_CONSTANTS).join(","));
  assert("τ_cc = 18 µs (frozen §1.5 declared scenario constant)", D.TCC_CONSTANTS.tauCc === 18e-6);
  assert("no exported name offers τ/band access", Object.keys(R).every(k => !/tau|band|tcc/i.test(k)), Object.keys(R).join(","));
}

/* ================= 7. traffic fixed-OSL rule (memo §3; all 6 profiles) =================
   Expected (registry OSL × authored ratio; C5 representative decode L = ISL + OSL/2,
   peak live KV length LPeak = ISL + OSL, L_in = ISL):
     reference 15×1000 ⇒ ISL 15,000, L 15,500, LPeak 16,000
     openai-dive 9×1000 ⇒ 9,000/9,500/10,000
     deepseek-disclosure 4×1109 ⇒ 4,436/4,990.5/5,545
     ncode 8×10,125 ⇒ 81,000/86,062.5/91,125
     kimi-dive 8×1000 ⇒ 8,000/8,500/9,000 · uncached 3×1000 ⇒ 3,000/3,500/4,000 */
{
  const want = {
    reference: [15000, 15500, 16000], "openai-dive": [9000, 9500, 10000],
    "deepseek-disclosure": [4436, 4990.5, 5545], ncode: [81000, 86062.5, 91125],
    "kimi-dive": [8000, 8500, 9000], uncached: [3000, 3500, 4000],
  };
  for (const t of E.TRAFFIC_PROFILES) {
    const g = R.resolveTrafficLengths({ profileId: t.id });
    assert(`traffic ${t.id}: ISL ${want[t.id][0]} / L ${want[t.id][1]} / LPeak ${want[t.id][2]} / L_in = ISL`,
      g.isl === want[t.id][0] && g.L === want[t.id][1]
      && g.LPeak === want[t.id][2] && g.LIn === g.isl, JSON.stringify(g));
  }
  const n = R.resolveTrafficLengths({ profileId: "ncode" });
  assert("ncode amended registry: OSL 10,125 ⇒ L = 86,062.5 (memo §3 as amended, 7d65239)",
    n.osl === 10125 && n.L === 86062.5, JSON.stringify(n));
  // edited-ratio determinism: fixed-OSL — editing ioRatio moves ISL only
  const e1 = R.resolveTrafficLengths({ profileId: "ncode", ioRatio: 4 });
  const e2 = R.resolveTrafficLengths({ profileId: "ncode", ioRatio: 4 });
  assert("edited ratio keeps the profile-family OSL (ISL moves only)", e1.osl === 10125 && e1.isl === 40500 && e1.L === 45562.5);
  assert("edited-ratio resolution is deterministic (pure function)", JSON.stringify(e1) === JSON.stringify(e2));
  // legacy/custom states with NO named family: ROOFLINE COMPLETION through TRAFFIC_PROFILES[0]
  // (R5 fix 4c relabel: ANALOGOUS to engine.js's unresolvable-profile-ID fallback — engine.js
  // does NOT itself apply it to custom/legacy null states; the null origin is preserved on the
  // result via nullFamilyCompletion).
  const leg = R.resolveTrafficLengths({ ioRatio: 42 });
  assert("null-family state completes via TRAFFIC_PROFILES[0] OSL, deterministically",
    leg.profileId === E.TRAFFIC_PROFILES[0].id && leg.osl === D.TRAFFIC_OSL[E.TRAFFIC_PROFILES[0].id].osl && leg.isl === 42 * leg.osl,
    JSON.stringify(leg));
  assert("null-family completion preserves the null origin (nullFamilyCompletion flag)",
    leg.nullFamilyCompletion === true && R.resolveTrafficLengths({ profileId: "ncode" }).nullFamilyCompletion === false);
  // OSL is derived data, never an input: injected osl is ignored; unknown family hard-errors
  const inj = R.resolveTrafficLengths({ profileId: "ncode", osl: 5 });
  assert("OSL is not encodable/injectable (registry value wins)", inj.osl === 10125);
  throwsAs("unknown traffic family hard-errors", () => R.resolveTrafficLengths({ profileId: "nonesuch" }), "RooflineDataError");
  throwsAs("non-numeric ioRatio hard-errors", () => R.resolveTrafficLengths({ profileId: "ncode", ioRatio: "8" }), "RooflineDataError");
  throwsAs("capacity feasibility requires explicit LPeak and cannot silently reuse representative L", () =>
    R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "h100", precision: "fp8", L: 15500 }),
  "RooflineDataError");
}

/* ================= 7a. registered context-window bound =================
   A model's registered maxPos constrains the full request lifetime, ISL + OSL.
   The representative decode position L and prefill length LIn can each sit below
   maxPos while terminal live KV exceeds it, so neither is a valid substitute. */
{
  const atLimit = R.resolveTrafficLengths({ profileId: "reference", ioRatio: 162.84 });
  const overLimit = R.resolveTrafficLengths({ profileId: "reference", ioRatio: 162.841 });
  const statusAt = typeof R.contextWindowStatus === "function"
    ? R.contextWindowStatus(dsr1, atLimit, "MODEL_ARCH.dsr1") : null;
  const statusOver = typeof R.contextWindowStatus === "function"
    ? R.contextWindowStatus(dsr1, overLimit, "MODEL_ARCH.dsr1") : null;
  assert("context bound: exact ISL + OSL = maxPos remains valid",
    statusAt && statusAt.state === "within-registered-limit"
      && statusAt.combinedTokens === 163840 && statusAt.maxPos === 163840,
    JSON.stringify(statusAt));
  assert("context bound: one token over maxPos is rejected even though L and LIn are each below maxPos",
    statusOver && statusOver.state === "exceeded-registered-limit"
      && statusOver.combinedTokens === 163841
      && overLimit.L < dsr1.maxPos && overLimit.LIn < dsr1.maxPos,
    JSON.stringify({ statusOver, overLimit }));
  const invalid = R.renderPoint({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "h800",
    regime: "balanced", precision: "fp8", profileId: "reference", ioRatio: 162.841,
    contextLimitSource: "MODEL_ARCH.dsr1" });
  assert("context bound: renderPoint returns a typed no-number state beyond maxPos",
    invalid.infeasible === true && invalid.opBasis === "context-window-exceeded"
      && !("tokPerS" in invalid) && !("decode" in invalid)
      && invalid.contextWindow && invalid.contextWindow.state === "exceeded-registered-limit",
    JSON.stringify(invalid));
  const unregistered = typeof R.contextWindowStatus === "function"
    ? R.contextWindowStatus(R.resolveArch("opus"), atLimit, "MODEL_ARCH.opus") : null;
  assert("context bound: absent maxPos is explicit unregistered evidence, not an invented limit",
    unregistered && unregistered.state === "unregistered" && unregistered.maxPos === null,
    JSON.stringify(unregistered));
  if (typeof R.contextWindowStatus === "function") {
    throwsAs("context bound: a malformed registered maxPos hard-errors", () =>
      R.contextWindowStatus({ ...dsr1, maxPos: 0 }, atLimit, "test-malformed"), "RooflineDataError");
  } else {
    assert("context bound helper is exported", false, "contextWindowStatus missing");
  }
}

/* ================= 8. customDonor codec delta (memo §3 R2 contract) ================= */
{
  assert("bounds enum matches the reviewed CUSTOM_DONOR_ENUM", JSON.stringify(R.CUSTOM_DONOR_BOUNDS) === JSON.stringify(D.CUSTOM_DONOR_ENUM.values));
  // round-trip: non-default on custom encodes and decodes back
  for (const v of D.CUSTOM_DONOR_ENUM.values.filter(v => v !== D.CUSTOM_DONOR_ENUM.default)) {
    const enc = R.encodeCustomDonor("custom", v);
    assert(`round-trip custom+${v}`, enc === v && R.decodeCustomDonor({ customDonor: enc }) === v);
  }
  assert("default value is NEVER encoded", R.encodeCustomDonor("custom", D.CUSTOM_DONOR_ENUM.default) === undefined);
  assert("unset value is not encoded", R.encodeCustomDonor("custom", null) === undefined && R.encodeCustomDonor("custom", undefined) === undefined);
  assert("non-custom model NEVER encodes the axis", R.encodeCustomDonor("opus", "qwen3c") === undefined && R.encodeCustomDonor("dsr1", "llama70") === undefined);
  throwsAs("out-of-enum donor is unrepresentable (encode throws)", () => R.encodeCustomDonor("custom", "llama405"), "RooflineDataError");
  // legacy decode: a token lacking the field resolves to the default (every legacy custom link unchanged)
  assert("legacy token (absent field) decodes to default dsr1", R.decodeCustomDonor({}) === "dsr1" && R.decodeCustomDonor(null) === "dsr1"
    && R.decodeCustomDonor({ active: 100 }) === "dsr1");
  assert("invalid donor value rejects (fail closed), never guesses", R.decodeCustomDonor({ customDonor: "bogus" }) === null
    && R.decodeCustomDonor({ customDonor: 7 }) === null);
  // resolution: custom resolves geometry through the donor registry
  assert("custom default geometry = dsr1 donor record", R.resolveArch("custom") === D.ARCH_DONORS.dsr1);
  assert("custom qwen3c geometry = qwen3c donor record", R.resolveArch("custom", "qwen3c") === D.ARCH_DONORS.qwen3c);
  throwsAs("custom with out-of-enum donor hard-errors", () => R.resolveArch("custom", "grok"), "RooflineDataError");
}

/* ================= 9. N_shard values (frozen §1.3 + memo §5) + KV-basis consistency ================= */
{
  const want = { gb300: 8, tpu7: 4, trn2: 16,                       // frozen d2 §1.3 replica widths
                 h800: 144,                                          // PUBLISHED (R5 amendment): DeepSeek Day-6 decode unit EP144/DP144, 18 nodes × 8
                 h20: 16,                                            // PUBLISHED (R5 amendment): LMSYS/Ant decode instance 16× H20, Attention-DP16 + MoE-EP16
                 gb200: 8, h100: 144, h200: 144,                     // analyst family-carry of sourced h800 deployment width (slice 2)
                 ascend: 128,                                        // cm384 co-location instance width (memo §5)
                 trn3: 16, rubin: 8 };                               // trn2 carry / projection (memo §5)
  for (const [k, n] of Object.entries(want))
    assert(`N_shard ${k} = ${n}`, D.HW_ROOFLINE[k].nShard === n, String(D.HW_ROOFLINE[k].nShard));
  const h100FamilyFeas = R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "h100", precision: "fp8", L: 4989, LPeak: 4989 });
  const h200FamilyFeas = R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "h200", precision: "fp8", L: 4989, LPeak: 4989 });
  assert("h100 family-carry feasibility: F1 conditions yield b_feas = 412", h100FamilyFeas.bFeas === 412, String(h100FamilyFeas.bFeas));
  assert("h200 family-carry feasibility: F1 conditions yield b_feas = 747", h200FamilyFeas.bFeas === 747, String(h200FamilyFeas.bFeas));
  // KV basis: feasibility basis ALWAYS equals the scan basis (frozen §1.4 rule)
  const moeD = R.decodeRoofline({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "gb200", b: 128, L: 3000, precision: "fp8" });
  const moeF = R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "gb200", precision: "fp8", L: 3000, LPeak: 3000 });
  assert("MoE-EP: scan KV is UNSHARDED per sequence", moeD.kvSeqBytesDev === R.kvBytesPerToken(dsr1, 1) * 3000);
  assert("MoE-EP: feasibility KV basis = scan basis (unsharded)", moeF.kvSeqBytesBasis === moeD.kvSeqBytesDev);
  const tpD = R.decodeRoofline({ arch: llama70, activeB: 70, totalB: 70, hwKey: "trn2", b: 1, L: 10750, precision: "bf16" });
  const tpF = R.feasibilityRoofline({ arch: llama70, totalB: 70, hwKey: "trn2", precision: "bf16", L: 10750, LPeak: 10750 });
  assert("dense-TP: scan KV is ÷N", tpD.kvSeqBytesDev === R.kvBytesPerToken(llama70, 2) * 10750 / 16);
  assert("dense-TP: feasibility KV basis = scan basis (÷N)", tpF.kvSeqBytesBasis === tpD.kvSeqBytesDev);
  assert("bases differ across modes exactly by the sharding treatment",
    moeF.kvSeqBytesBasis === R.kvBytesPerToken(dsr1, 1) * 3000 && tpF.kvSeqBytesBasis * 16 === R.kvBytesPerToken(llama70, 2) * 10750);
}

/* ================= 10. declared-batch cap + infeasible-state core behavior (memo §5) =================
   Expectations re-derived at the R5-amended widths + framebuffer bytes (review R5 fix 4b — the
   original h800-infeasible / h20-b_feas-17 claims were artifacts of stale nShard 8 + GB×1e9). */
{
  /* h800 × dsr1 (671B, fp8, L=4,989) at N_shard 144 / hbmBytes 85,520,809,984:
     W_res = 671e9/144 = 4,659,722,222.2 B (4.66 GB); b_feas = floor((0.9·85,520,809,984 −
     4,659,722,222.2)/(4989·35,136)) = floor(72,309,006,763.4/1.75293504e8) = floor(412.5) = 412.
     The F1 calibration operating point (b=96) sits INSIDE feasibility — the slice-1b
     "weights exceed HBM" finding is closed by the amendment. */
  const h800Feas = R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "h800", precision: "fp8", L: 4989, LPeak: 4989 });
  near("h800×dsr1: W_resident = 4.66 GB at the published EP144 width", h800Feas.wResidentBytes, 671e9 / 144, 1e-12);
  assert("h800×dsr1: b_feas = 412 (derivation in comment)", h800Feas.bFeas === 412, String(h800Feas.bFeas));
  const h800Bal = R.resolveOperatingPoint({ hwKey: "h800", regime: "balanced", arch: dsr1, totalB: 671, precision: "fp8", L: 4989, LPeak: 4989 });
  assert("h800×dsr1 balanced: F1 calibration b=96 UNCAPPED and feasible", !h800Bal.infeasible && h800Bal.b === 96 && !h800Bal.capped);
  /* h20 × dsr1 (671B, fp8, L=4,096) at N_shard 16 / hbmBytes 102,625,181,696:
     W_res = 671e9/16 = 41.9375e9; b_feas = floor((0.9·102,625,181,696 − 41,937,500,000)
     /(4096·35,136)) = floor(50,425,163,526.4/1.43917056e8) = floor(350.4) = 350. */
  const h20Feas = R.feasibilityRoofline({ arch: dsr1, totalB: 671, hwKey: "h20", precision: "fp8", L: 4096, LPeak: 4096 });
  assert("h20×dsr1: b_feas = 350 at the published DP16/EP16 width", h20Feas.bFeas === 350, String(h20Feas.bFeas));
  const h20Bal = R.resolveOperatingPoint({ hwKey: "h20", regime: "balanced", arch: dsr1, totalB: 671, precision: "fp8", L: 4096, LPeak: 4096 });
  const h20Batch = R.resolveOperatingPoint({ hwKey: "h20", regime: "batch", arch: dsr1, totalB: 671, precision: "fp8", L: 4096, LPeak: 4096 });
  assert("h20×dsr1: F3 calibration b=48 and batch 96 both inside feasibility (uncapped)",
    h20Bal.b === 48 && !h20Bal.capped && h20Batch.b === 96 && !h20Batch.capped);
  /* CAP case — gb200 × 1,000B-total MoE (kimi-class magnitudes on the dsr1 geometry), fp8,
     reference L=15,500: W_res = 1000e9/8 = 125e9; b_feas = floor((0.9·198,674,743,296 −
     125e9)/(15,500·35,136)) = floor(53,807,268,966.4/5.44608e8) = floor(98.8) = 98. */
  const capBal = R.resolveOperatingPoint({ hwKey: "gb200", regime: "balanced", arch: dsr1, totalB: 1000, precision: "fp8", L: 15500, LPeak: 15500 });
  assert("gb200×1T balanced: b_feas = 98 caps declared 128", !capBal.infeasible && capBal.bFeas === 98 && capBal.b === 98 && capBal.bDeclared === 128);
  assert("capped point carries opBasis 'capped' + declared basis/citation alongside",
    capBal.capped === true && capBal.opBasis === "capped" && capBal.declaredOpBasis === "anchor-stated"
    && typeof capBal.opCitation === "string" && /F4 gb200-vllm/.test(capBal.opCitation)
    && capBal.declaredOpCitation === capBal.opCitation);
  const capBatch = R.resolveOperatingPoint({ hwKey: "gb200", regime: "batch", arch: dsr1, totalB: 1000, precision: "fp8", L: 15500, LPeak: 15500 });
  assert("gb200×1T batch rule: min(2×128, b_feas) = 98", capBatch.b === 98 && capBatch.bDeclared === 256 && capBatch.capped);
  const capFast = R.resolveOperatingPoint({ hwKey: "gb200", regime: "fast", arch: dsr1, totalB: 1000, precision: "fp8", L: 15500, LPeak: 15500 });
  assert("gb200×1T fast: 8 < b_feas ⇒ uncapped, registry basis kept", capFast.b === 8 && !capFast.capped && capFast.opBasis === "analyst-declared");
  /* INFEASIBLE case — gb200 × 5,000B-total (opus-class): W_res = 625e9 > 0.9·198.67e9 ⇒
     b_feas < 1 ⇒ EXPLICIT infeasible state (no numbers). */
  const inf = R.feasibilityRoofline({ arch: dsr1, totalB: 5000, hwKey: "gb200", precision: "fp8", L: 15500, LPeak: 15500 });
  assert("gb200×5T: b_feas < 1 (weights alone exceed 90% framebuffer)", inf.bFeas < 1, String(inf.bFeas));
  const opInf = R.resolveOperatingPoint({ hwKey: "gb200", regime: "balanced", arch: dsr1, totalB: 5000, precision: "fp8", L: 15500, LPeak: 15500 });
  assert("infeasible op point is an explicit typed state", opInf.infeasible === true && opInf.bFeas < 1);
  const rp = R.renderPoint({ arch: dsr1, activeB: 300, totalB: 5000, hwKey: "gb200", regime: "balanced", precision: "fp8", profileId: "reference" });
  assert("renderPoint infeasible state carries NO numbers", rp.infeasible === true && !("tokPerS" in rp) && !("decode" in rp),
    Object.keys(rp).join(","));
  assert("renderPoint infeasible state surfaces infeasible opBasis provenance structurally",
    rp.opBasis === "infeasible" && rp.op.opBasis === "infeasible"
    && rp.op.declaredOpBasis === "anchor-stated" && typeof rp.opCitation === "string"
    && rp.opCitation === rp.op.opCitation, JSON.stringify(rp));
}

/* ================= 11. no-argmax — closed API surface, no capacity inversion ================= */
{
  const wantSurface = [
    "CUSTOM_DONOR_BOUNDS", "RooflineDataError", "RooflineUnitError",
    "archFormsUsed", "assertHwRowUnits",
    "decodeCustomDonor", "decodeRoofline", "encodeCustomDonor",
    "fAttnPerPos", "fabricBytesPerPos", "feasibilityRoofline", "kvBytesPerToken",
    "prefillRoofline", "renderPoint",
    // R1/R2 sealed-door capacity-WIDTH solver (pre-existing drift, never re-minted until b9 M2).
    "assertDeclaredOperatingWidth", "capacityWidthSolve", "rdEnumerateLegalWidths",
    "contextWindowStatus",
    "resolveArch", "resolveHwRoofline", "resolveOperatingPoint", "resolvePrecisionTuple",
    "resolveTrafficLengths",
  ].sort();
  assert("API surface is CLOSED (exact export list — additions must consciously edit this test)",
    JSON.stringify(Object.keys(R).sort()) === JSON.stringify(wantSurface), Object.keys(R).sort().join(","));
  // The guard's target is BATCH-argmax capacity INVERSION (solving for the largest admissible b).
  // R2 deliberately introduced a capacity-WIDTH solver through a sealed door, so a blanket /capacit/
  // ban now flags a sanctioned export. Narrowed to the inversion vocabulary, with `capacityWidthSolve`
  // allow-listed by exact name so any OTHER capacity-named export still trips it.
  const SANCTIONED = new Set(["capacityWidthSolve"]);
  assert("no export name suggests capacity inversion",
    Object.keys(R).every(k => SANCTIONED.has(k) || !/argmax|invert|capacit|ceiling|maxB|bestB|findB/i.test(k)),
    Object.keys(R).filter(k => !SANCTIONED.has(k) && /argmax|invert|capacit|ceiling|maxB|bestB|findB/i.test(k)).join(","));
  const scalarLeaves = (value, path = "", out = {}) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) scalarLeaves(child, path ? `${path}.${key}` : key, out);
    } else out[path] = value;
    return out;
  };
  const shapePaths = value => Object.keys(scalarLeaves(value)).sort();
  const forbiddenClassKey = /(?:closure|classif|observation.?class|eligibility.?class|scoring.?treatment)/i;
  const forbiddenClassValue = /(?:\bclass\s*[-:]?\s*[1-5]\b|stated delivered batch|independently established binding constraint|demand-censored|ceiling-only bound|closure-ineligible|cap-equality closure|ceiling-equality closure|two-sided point target|one-sided feasibility)/i;
  const forbiddenClassLeaks = value => {
    const leaks = [];
    const walk = (node, path = "") => {
      if (!node || typeof node !== "object") return;
      for (const [key, child] of Object.entries(node)) {
        const childPath = path ? `${path}.${key}` : key;
        if (forbiddenClassKey.test(key)) leaks.push(`${childPath} (key)`);
        if (typeof child === "string" && forbiddenClassValue.test(child)) leaks.push(`${childPath}=${JSON.stringify(child)}`);
        else walk(child, childPath);
      }
    };
    walk(value);
    return leaks;
  };
  const equivalent = { arch: dsr1, activeB: 37, totalB: 100, regime: "balanced", precision: "fp8" };
  const opOutputs = [], renderOutputs = [];
  for (const hwKey of HW_KEYS) {
    const op = R.resolveOperatingPoint({ ...equivalent, hwKey, L: 4990.5, LPeak: 4990.5 });
    const rendered = R.renderPoint({ ...equivalent, hwKey, profileId: "deepseek-disclosure" });
    opOutputs.push({ hwKey, value: op });
    renderOutputs.push({ hwKey, value: rendered });
    const leaks = [...forbiddenClassLeaks(op), ...forbiddenClassLeaks(rendered)];
    assert(`EXECUTABLE: ${hwKey} render path emits no frozen observation closure/classification`,
      leaks.length === 0, leaks.join("; "));
    assert(`EXECUTABLE: ${hwKey} equivalent case is feasible at the requested L`,
      !op.infeasible && !rendered.infeasible && rendered.lengths.L === 4990.5,
      JSON.stringify({ op, renderedL: rendered.lengths.L }));
  }
  const assertPlatformOutputs = (name, outputs) => {
    const expectedShape = JSON.stringify(shapePaths(outputs[0].value));
    assert(`EXECUTABLE: ${name} output shape is platform-invariant across all HW_ROOFLINE keys`,
      outputs.every(({ value }) => JSON.stringify(shapePaths(value)) === expectedShape),
      outputs.filter(({ value }) => JSON.stringify(shapePaths(value)) !== expectedShape).map(x => x.hwKey).join(","));
    const leaves = outputs.map(({ value }) => scalarLeaves(value));
    const varyingPaths = Object.keys(leaves[0]).filter(path => new Set(leaves.map(x => JSON.stringify(x[path]))).size > 1);
    const legitimatePlatformVariation = path => /^(?:opBasis|opCitation|tokPerS|decode\.|hwKey$|b$|bDeclared$|bFeas$|declaredOpBasis$|declaredOpCitation$|feasibility\.|op\.(?:opBasis|opCitation|tokPerS|decode\.|hwKey$|b$|bDeclared$|bFeas$|declaredOpBasis$|declaredOpCitation$|feasibility\.))/.test(path);
    assert(`EXECUTABLE: ${name} platform variation is confined to provenance, operating/feasibility, and physical roofline outputs`,
      varyingPaths.every(legitimatePlatformVariation), varyingPaths.filter(path => !legitimatePlatformVariation(path)).join(","));
  };
  assertPlatformOutputs("resolveOperatingPoint", opOutputs);
  assertPlatformOutputs("renderPoint", renderOutputs);
  // Secondary belt-and-suspenders source scan; executable output invariants above are the gate.
  const scrubCommentsAndStrings = (source) => source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`\\])*`/g, "")
    .replace(/"(?:\\.|[^"\\])*"/g, "")
    .replace(/'(?:\\.|[^'\\])*'/g, "");
  const executableSource = scrubCommentsAndStrings(ROOFLINE_SOURCE);
  assert("SECONDARY: source scan has no platform-name branch selecting closure/class values",
    !/(?:if|switch)[^\n{]*(?:hwKey|platform)[^\n{]*(?:closure|classif|class)/i.test(executableSource)
    && !/(?:closure|classif(?:ication)?)[^\n;=]*(?:=|:)[^\n;]*(?:hwKey|platform)/i.test(executableSource),
    "platform identity must never select an observation closure/class in executable code");
  // Operating-point resolution only ever moves b DOWNWARD from the declared registry value
  for (const k of HW_KEYS) for (const regime of ["balanced", "batch", "fast"]) {
    if (!D.OPERATING_POINTS[k][regime]) continue;
    const op = R.resolveOperatingPoint({ hwKey: k, regime, arch: dsr1, totalB: 671, precision: "fp8", L: 4990.5, LPeak: 4990.5 });
    if (!op.infeasible) assert(`b ≤ declared on ${k}/${regime} (never raised toward capacity)`, op.b <= op.bDeclared,
      `${op.b} > ${op.bDeclared}`);
  }
}

/* ================= 12. NON-COMPUTE-BOUND GUARD (slice-1a spec item, derivations finding 3) =================
   Every CURRENT model×regime render point on gb200/gb300 must stay HBM-bound (t_H binds).
   The t_C = t_H crossover sits at b = 312.5 (gb200, 10e15) / 468.75 (gb300, 15e15) at L = 0 and
   only RISES with L; max declared batch is 256 before feasibility lowers it. If this test fails,
   a registry/codec change has crossed that boundary — the fp4-vs-fp8 FLOPS basis becomes LIVE
   and the gb200/gb300 deployed-η carry (which embeds the retired 1.85 scalar) must be re-reviewed. */
{
  let feasiblePoints = 0, infeasiblePoints = 0;
  for (const hwKey of ["gb200", "gb300"]) {
    for (const m of E.MODELS) {
      const arch = R.resolveArch(m.id);
      for (const regime of ["balanced", "batch", "fast"]) {
        const rp = R.renderPoint({ arch, activeB: m.set.active, totalB: m.set.total, hwKey, regime,
                                   precision: m.set.precision, profileId: m.nativeTraffic });
        if (rp.infeasible) { infeasiblePoints++; continue; }
        feasiblePoints++;
        assert(`GUARD ${hwKey}×${m.id}×${regime} is HBM-bound (t_H)`,
          rp.decode.bindingTerm === "t_H",
          `binding=${rp.decode.bindingTerm} at b=${rp.op.b} — a data change crossed the b=312.5 (gb200) / 468.75 (gb300) t_C=t_H ` +
          `crossover class; the NVFP4 FLOPS basis is now LIVE and the η carry embedding the retired 1.85 scalar needs re-review ` +
          `(derivations finding 3 / review R4)`);
      }
    }
  }
  assert("guard exercised a non-vacuous feasible set", feasiblePoints >= 30, `${feasiblePoints} feasible / ${infeasiblePoints} infeasible`);
  console.log(`      (guard swept ${feasiblePoints} feasible + ${infeasiblePoints} infeasible gb200/gb300 render points)`);
}

/* ================= 13. regime b values match the §4 registry ================= */
{
  // b9 M1 re-mint (manifest family 7): gb300 128→64 (declared workload midpoint; 128 was never an
  // anchor), trn2/trn3 4→32 (the 16–64 aggregate-batch surrogate replacing an AWS tutorial demo).
  const wantB = { h800: [96, 8], h20: [48, 8], gb200: [128, 8], gb300: [64, 8], ascend: [96, 8],
                  h100: [96, 8], h200: [96, 8], tpu7: [16, 4], trn2: [32, 1], trn3: [32, 1] }; // [balanced, fast]
  const wantMult = { trn2: 4, trn3: 4 };                                                     // batch rule mult (all others 2)
  for (const [k, [bal, fast]] of Object.entries(wantB)) {
    // small synthetic total (100B) + short L keeps b_feas above every declared b — regime values read PURE
    const args = { arch: dsr1, totalB: 100, precision: "fp8", L: 4990.5, LPeak: 4990.5, hwKey: k };
    const ob = R.resolveOperatingPoint({ ...args, regime: "balanced" });
    const of = R.resolveOperatingPoint({ ...args, regime: "fast" });
    const ot = R.resolveOperatingPoint({ ...args, regime: "batch" });
    assert(`§4 registry ${k}: balanced ${bal} / fast ${fast} / batch ${(wantMult[k] ?? 2)}×`,
      ob.b === bal && !ob.capped && of.b === fast && !of.capped && ot.bDeclared === (wantMult[k] ?? 2) * bal && ot.b === ot.bDeclared,
      JSON.stringify({ bal: ob.b, fast: of.b, batchDecl: ot.bDeclared, batch: ot.b }));
    assert(`§4 opBasis/citation carried on ${k} balanced`,
      typeof ob.opBasis === "string" && ob.opBasis !== "capped"
      && (ob.opBasis === "anchor-stated"
        ? typeof ob.opCitation === "string" && ob.opCitation.length > 0
        : ob.opCitation === null));
  }
  const rb = R.resolveOperatingPoint({ arch: dsr1, totalB: 100, precision: "fp8", L: 4990.5, LPeak: 4990.5, hwKey: "rubin", regime: "balanced" });
  assert("rubin balanced = 128 (shape-only projection)", rb.b === 128 && !rb.capped);
  const h800Render = R.renderPoint({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "h800", regime: "balanced",
    precision: "fp8", profileId: "deepseek-disclosure" });
  assert("renderPoint surfaces anchor-stated opBasis + citation at top level",
    h800Render.opBasis === "anchor-stated" && /F1 h800-prod-dec/.test(h800Render.opCitation)
    && h800Render.opBasis === h800Render.op.opBasis && h800Render.opCitation === h800Render.op.opCitation,
    JSON.stringify(h800Render));
  const h100Render = R.renderPoint({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "h100", regime: "balanced",
    precision: "fp8", profileId: "deepseek-disclosure" });
  assert("renderPoint surfaces analyst-declared opBasis with null citation",
    h100Render.opBasis === "analyst-declared" && h100Render.opCitation === null,
    JSON.stringify(h100Render));
  const tpuRender = R.renderPoint({ arch: dsr1, activeB: 37, totalB: 671, hwKey: "tpu7", regime: "balanced",
    precision: "fp8", profileId: "deepseek-disclosure" });
  assert("TPU balanced point labels the width-scaled per-chip load as analyst-declared, not anchor-stated",
    tpuRender.opBasis === "analyst-declared" && tpuRender.opCitation === null,
    JSON.stringify({ opBasis: tpuRender.opBasis, opCitation: tpuRender.opCitation }));
  throwsAs("rubin has NO batch regime (absent by design ⇒ hard error)", () =>
    R.resolveOperatingPoint({ arch: dsr1, totalB: 100, precision: "fp8", L: 4990.5, LPeak: 4990.5, hwKey: "rubin", regime: "batch" }), "RooflineDataError");
  throwsAs("rubin has NO fast regime", () =>
    R.resolveOperatingPoint({ arch: dsr1, totalB: 100, precision: "fp8", L: 4990.5, LPeak: 4990.5, hwKey: "rubin", regime: "fast" }), "RooflineDataError");
  throwsAs("unknown regime hard-errors", () =>
    R.resolveOperatingPoint({ arch: dsr1, totalB: 100, precision: "fp8", L: 4990.5, LPeak: 4990.5, hwKey: "h800", regime: "turbo" }), "RooflineDataError");
}

/* ================= 14. prefill transfer values per §8 ================= */
{
  assert("η_pre = frozen F7 identity 0.17581", D.PREFILL_CAL.etaPre === 0.17581 && D.ETA_PRE === 0.17581);
  for (const k of HW_KEYS) {
    const g = R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: k, precision: "fp8", LIn: 4989 });
    assert(`prefill ${k} uses the single frozen η_pre (universal transfer)`, g.etaPre === D.PREFILL_CAL.etaPre);
    assert(`prefill ${k} status labeled per §8`, k === "h800" ? /FITTED/.test(g.status) : /extrapolated \(single-anchor transfer/.test(g.status),
      String(g.status));
    assert(`prefill ${k} has NO t_cc (frozen §2: amortized, stated)`, !("tCc" in g));
  }
  /* dense-TP prefill branch (frozen §2 verbatim, restored per verification R2): Φ_pre_dev = Φ_pre/N.
     trn2-70b golden: Φ_pre = 2·70e9 + 2·80·64·2·128·(10000/2) = 153,107,200,000; Φ_pre/16 = 9,569,200,000;
     compute term binds over fabric (4.8e-6); T̂_pre = 0.17581/(9.5692e9/0.65e15) = 11,942.116373364544. */
  const tp = R.prefillRoofline({ arch: llama70, activeB: 70, hwKey: "trn2", precision: "bf16", LIn: 10000 });
  assert("dense prefill: Φ_pre_dev = Φ_pre/N (frozen branch verbatim)", tp.phiPreDev === tp.phiPre / 16);
  near("trn2-70b prefill golden T̂_pre (frozen §2 recipe inputs)", tp.tokPerS, 11942.116373364544, 1e-9);
  const mp = R.prefillRoofline({ arch: dsr1, activeB: 37, hwKey: "gb200", precision: "fp4", LIn: 9000 });
  assert("MoE prefill: Φ_pre_dev = Φ_pre (unsharded)", mp.phiPreDev === mp.phiPre);
  // t_tok composition exact: max(compute, fabric)/η_pre_eff with NO additive floor
  const comp = mp.phiPreDev / R.resolvePrecisionTuple("gb200", "fp4").flops;
  const fab = mp.fabricBytesPerPosDev / D.HW_ROOFLINE.gb200.fabric;
  near("prefill t_tok = max(compute, fabric)/η_pre exactly", mp.tTok, Math.max(comp, fab) / mp.etaPre, 1e-12);
}

/* ================= 15. NVL72 topology sensitivities (GPT Pro correction, 2026-07-20) ================= */
{
  const gb200Sensitivity = D.HW_ROOFLINE.gb200.topologySensitivity;
  const gb300Sensitivity = D.HW_ROOFLINE.gb300.topologySensitivity;
  const cases = gb200Sensitivity && Array.isArray(gb200Sensitivity.cases)
    ? gb200Sensitivity.cases : [];
  const byId = id => cases.find(candidate => candidate.id === id);
  assert("topology taxonomy: all five non-interchangeable quantities are encoded",
    JSON.stringify(D.TOPOLOGY_DIMENSIONS) === JSON.stringify(["N_world", "N_shard", "N_domain", "N_role", "N_replicas"]),
    JSON.stringify(D.TOPOLOGY_DIMENSIONS));
  assert("NVL72 sensitivities: gb200/gb300 share one declared analyst case registry (B\u20321: default = the explicit analyst-transfer case)",
    gb200Sensitivity === gb300Sensitivity && gb200Sensitivity &&
    gb200Sensitivity.kind === "declared-analyst-sensitivity" &&
    gb200Sensitivity.defaultCaseId === "analyst-transfer-default-8");
  assert("NVL72 sensitivities: scalar nShardRange/publishedMax shape is retired",
    !("nShardRange" in D.HW_ROOFLINE.gb200) && !("nShardRange" in D.HW_ROOFLINE.gb300));
  assert("NVL72 sensitivities: live defaults are explicitly N_shard-classified and remain 8",
    D.HW_ROOFLINE.gb200.nShard === 8 && D.HW_ROOFLINE.gb300.nShard === 8 &&
    D.HW_ROOFLINE.gb200.nShardDimension === "N_shard" &&
    D.HW_ROOFLINE.gb300.nShardDimension === "N_shard");
  assert("NVL72 sensitivities: exact evidence-classed topology case set is present (B\u20321 per-source split; delta manifest in the slice packet)",
    JSON.stringify(cases.map(candidate =>
      `${candidate.value}:${candidate.topologyDimension}:${candidate.evidenceClasses.join("/")}`)) ===
      JSON.stringify(["4:N_shard:D", "8:N_shard:C/D/E", "8:N_shard:C", "8:N_shard:D", "8:N_shard:E", "8:N_shard:ANALYST", "16:N_shard:A", "32:N_shard:B", "48:N_shard:B", "32:N_role:E", "64:N_domain:F"]),
    JSON.stringify(cases.map(c => `${c.value}:${c.topologyDimension}:${c.evidenceClasses.join("/")}`)));
  assert("NVL72 sensitivities: the retired aggregate is archived (superseded), and ONLY it",
    cases.filter(c => c.superseded).length === 1 && byId("analyst-default-8").superseded === "analyst-transfer-default-8");
  assert("NVL72 sensitivities: every SOURCE case carries a GPT Pro consult citation; analyst cases cite the B\u2032 memo contract",
    cases.length === 11 && cases.every(candidate => typeof candidate.citation === "string" &&
      (candidate.evidenceClasses.includes("ANALYST")
        ? candidate.citation.includes("research/im4-sliceBprime-design-memo.md")
        : candidate.citation.includes("research/gptpro-reports/2026-07-20-replica-width-consult.md"))));
  assert("B\u20321: every non-archived case carries typed applicability + precisionTier",
    cases.filter(c => !c.superseded).every(c => c.precisionTier && c.applicability !== undefined
      && (c.applicability.modelTotalB === null || Array.isArray(c.applicability.modelTotalB))));
  const k3Domain = byId("kimi-k3-domain-64-plus");
  assert("K3 record: 64+ is N_domain while N_shard and N_world remain unknown",
    k3Domain && k3Domain.value === 64 && k3Domain.topologyDimension === "N_domain" &&
    k3Domain.topologyRecord.N_domain_recommended === "64+" &&
    k3Domain.topologyRecord.N_shard === "unknown" && k3Domain.topologyRecord.N_world === "unknown");

  const baseOpts = { arch: dsr1, totalB: 5000, hwKey: "gb200", precision: "fp8", L: 15500, LPeak: 15500 };
  const baseline = R.feasibilityRoofline(baseOpts);
  const case32 = byId("ling-2-5-bf16-example-32");
  const case48 = byId("yuan-3-bf16-example-48");
  // R2 RETIRED the caller-supplied sensitivity-case channel: widths now arrive only through the
  // solver's sealed door. This block used to pass cases straight in and has thrown ever since —
  // repaired at b9 M2 (manifest family 7) to assert the retirement is LOUD rather than silent.
  const rejects = (c) => { try { R.feasibilityRoofline({ ...baseOpts, nShardCase: c }); return false; }
                           catch (e) { return /nShardCase channel is RETIRED/.test(e.message); } };
  assert("nShard sensitivity: the retired nShardCase channel is rejected LOUDLY, never ignored",
    rejects(case32) && rejects(case48));
  const at32 = null, at48 = null;
  assert("nShard sensitivity: omitted case is byte-compatible baseline N_shard=8 and infeasible",
    baseline.nShard === 8 && baseline.bFeas === 0);
  // The two assertions that stood here consumed the retired channel's return value. What they were
  // really checking — that a WIDER replica opens feasibility monotonically — survives, so it is
  // re-expressed through the sealed door (an explicit declaredOperatingWidth from the registered
  // legal set) instead of through the retired case channel. Same property, supported route.
  {
    const legal = R.rdEnumerateLegalWidths(D.HW_DOMAINS.gb200.scaleUp.hardwareLegalShapes);
    const widths = [8, 32, 48].filter(w => legal.includes(w));
    const feas = widths.map(w => R.feasibilityRoofline({ ...baseOpts, declaredOperatingWidth: w }));
    assert("nShard sensitivity: wider registered replicas open gb200 feasibility monotonically",
      widths.length >= 2 && feas.every((f, i) => f.nShard === widths[i] && f.topologyDimension === "N_shard")
      && feas.every((f, i) => i === 0 || f.bFeas >= feas[i - 1].bFeas),
      JSON.stringify({ widths, bFeas: feas.map(f => f.bFeas) }));
    assert("nShard sensitivity: the widest registered replica is actually feasible (bFeas > 0)",
      feas.length > 0 && feas[feas.length - 1].bFeas > 0, JSON.stringify(feas.map(f => f.bFeas)));
  }
  throwsAs("nShard sensitivity: raw unclassified numeric override fails loudly", () =>
    R.feasibilityRoofline({ ...baseOpts, nShardCase: 32 }), "RooflineDataError");
  throwsAs("nShard sensitivity: K3 N_domain=64 is rejected before the divisor", () =>
    R.feasibilityRoofline({ ...baseOpts, nShardCase: k3Domain }), "RooflineDataError");
  throwsAs("nShard sensitivity: InferenceX decode-role N_role=32 is rejected before the divisor", () =>
    R.feasibilityRoofline({ ...baseOpts, nShardCase: byId("v4-pro-inferencex-decode-role-32") }), "RooflineDataError");
}

/* ================= wrap ================= */
console.log(failures === 0 ? "\nALL ROOFLINE-CORE TESTS PASS" : `\n${failures} ROOFLINE-CORE FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
