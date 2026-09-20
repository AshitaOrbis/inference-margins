## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The frozen deployment’s HTML, `engine.js`, `app.js`, grounding ledger, annex index, archived sweep, traffic-contract tests, and snapshot tests were checked against git `9f1fd0f` / engine `v2.1.2-2026-07-11`. Deployed assets byte-match the local frozen revision.

### Stage 1 source ledger

| Claim | Archived record | Source locator |
|---|---|---|
| API keys | `~12000 unique api keys served` | [@_xjdr stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Total tokens | `~300B tokens total` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Output throughput | `232 tok/s/gpu output average`; `431 tok/s/gpu output max sustained` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Lower TTFT statistic | `2.1 sec TTFT overage (1M ctx)` — the record says **overage**, not average | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Tail latency | `61 sec p95 TTFT (1M ctx)` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Input length | `81k tok average input size` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Cache | `41% cache hit rate` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Logging | `0 chat logs kept` | [same stats post](https://x.com/_xjdr/status/2071835604095300079) |
| Hardware family | `gb300NVL72s`, supplied by Prime Intellect | [hardware post](https://x.com/_xjdr/status/2067742918455279934) |
| Hardware count | `15 trays specifically or 60xB300s` | [hardware clarification](https://x.com/_xjdr/status/2071846027917943274) |
| Precision | FP8 applied to experts and KV cache; attention remained BF16; full BF16 was also tested | [precision post](https://x.com/_xjdr/status/2070947967574663249) |
| Speculative decoding | `no mtp and no eagle`; optimized inference plus disaggregation | [configuration post](https://x.com/_xjdr/status/2072059152873210101) |
| Serving stack | In-house nmoe stack, mostly Rust | [stack post](https://x.com/_xjdr/status/2072058942025601533) |
| Cost estimate | `$6 per gpu`, approximately `$0.35 mTok in / $1.50 out` | [@paxaral reply](https://x.com/paxaral/status/2071995188302557585), not an `_xjdr` disclosure |

The canonical deployed archive is [grok-sweep-glm-gb300.html](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300.html). The requested `grok-sweep-glm-gb300-plans` locator does not serve that document.

### Five-class representation matrix

| Deployed representation | Classification | Determination |
|---|---|---|
| [§2c](https://inference-margins.pages.dev/#s2) verbatim statistics block | directly-entailed | All listed numbers, units, `output average/max sustained`, `overage [sic]`, 1M-context qualifiers, p95, cache, and zero-log statement are preserved. |
| §2c hardware, precision, no-MTP/no-Eagle and Rust configuration | directly-entailed | Hardware count and configuration match the cited posts. |
| §2c `$0.35/$1.50 at $6/GPU-hour` | directly-entailed as third-party attribution | The page calls it a “third-party estimate” and links directly to `@paxaral`. It is not presented as `_xjdr`’s estimate. |
| §2c interpretation of `overage` as average | compatible-unsupported | The corpus contains no correction or clarification establishing that `overage` was a typo for average. |
| §2c `~30× the typical case` and `cold-prefill tail` | compatible-unsupported | These require treating 2.1 seconds as an average and assigning a cause to the p95 tail; neither step is established. |
| §2c `the GPUs were mostly doing prefill` | compatible-unsupported | Average input length alone does not identify output length, request rate, phase allocation, or compute-time share. |
| [§3](https://inference-margins.pages.dev/#s3) SGLang GB300 calibration row | directly-entailed, separately attributed | It names DeepSeek-V4 Pro, FP4, MTP, 49B active and `>12,000 tok/s/GPU`; it is not attached to ncode. |
| [§4](https://inference-margins.pages.dev/#s4) GB300/SGLang discussion | directly-entailed, separately attributed | The SGLang/NVIDIA record remains a DeepSeek-V4 result. The official report specifies approximately 2,200→11,200 tok/s/GPU at fixed interactivity. [PyTorch/SGLang/NVIDIA report](https://pytorch.org/blog/serving-deepseek-v4-on-gb300-with-sglang-5x-higher-throughput-at-the-same-interactivity-since-day-0/) |
| §2c Baseten paragraph | directly-entailed, separately attributed | Baseten’s GLM-5.2 deployment is identified as 744B/40B, NVFP4, 280+ TPS and MTP-enabled; it is not merged with ncode’s no-MTP deployment. [Baseten report](https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/) |
| Precision/cache tooltips | directly-entailed | `fp8 experts+KV`, BF16 attention context, and `xjdr GLM week: 41%` match the record. |
| `ncode coding deployment 8:1 / 41%` profile | over-broad | `41%` is directly reported. `8:1` is absent from every `_xjdr` post in the frozen corpus. |
| GLM-5.2 preset reuse of `8:1 / 41%` | labeled-reconstruction, with defective provenance | The dossier says `COMMUNITY ESTIMATE`, but falsely sources `8:1` as the “ncode-week mix.” The underlying Zhipu dive instead labels eight input tokens per output token as `SPECULATION`. |
| GLM-4.7 reuse | labeled-reconstruction | The dossier explicitly says the GLM-5.2 traffic shape is carried over and assumes the same workload. No GLM-4.7 telemetry supports it. |
| [§10](https://inference-margins.pages.dev/#s10) card line `traffic: ncode coding deployment 8:1 / 41%` | over-broad | The standalone card presents the unsupported `8:1` component as deployment telemetry. |

## FINDINGS

### 1. [P0] The specified archived-sweep locator serves the calculator homepage

- **Page anchor/passage:** [`/research/grok-sweep-glm-gb300-plans`](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300-plans) returns HTTP 200 with `<h1>Frontier Inference Margins</h1>`, not the archived sweep.
- **Source locator:** The [research index](https://inference-margins.pages.dev/research/) links the actual artifact as `grok-sweep-glm-gb300.html`.
- **Failure class:** broken behavior; five-class status `contradicted`.
- **Objection:** The Stage 1 audit locator silently falls through to the homepage. A reviewer can mistake calculator prose for the verbatim archive.
- **Exact UI/routing change:** Add a permanent redirect:  
  `/research/grok-sweep-glm-gb300-plans` → `/research/grok-sweep-glm-gb300.html`
- **Deterministic acceptance test:**  
  `curl -Ls https://inference-margins.pages.dev/research/grok-sweep-glm-gb300-plans` must contain `Finding 1.1 — Free GLM 5.2 week + final throughput stats` and must not contain `<h1>Frontier Inference Margins</h1>`.

### 2. [P1] §2c converts an unresolved word into an average and then adds unsupported causal interpretations

- **Page anchor/passage:** [§2c](https://inference-margins.pages.dev/#s2):  
  `The 2.1-second figure ("overage" in the original — read here as the average)`;  
  `the cold-prefill tail at 1M context is ~30× the typical case`;  
  `the GPUs were mostly doing prefill`.
- **Source locator:** [Stats post](https://x.com/_xjdr/status/2071835604095300079), preserved in the [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300.html).
- **Failure class:** compatible-unsupported.
- **Objection:** The post supplies `overage`, 61-second p95, 81k average input, and output tok/s. It does not supply:

  - a correction from `overage` to average;
  - average output length;
  - input/output token totals;
  - request rate;
  - prefill/decode GPU allocation;
  - evidence that the p95 was caused specifically by cold prefill.

  Consequently, neither the 61/2.1 comparison nor “mostly doing prefill” follows deterministically.
- **Exact replacement wording:**  
  `The 232 tok/s/GPU figure is output-only, and the same post reports 81k-token average inputs at a 1M context limit. The post does not report average output length, request rate, phase-level GPU allocation, or an input:output split, so it does not establish that most GPU time was spent in prefill. The original labels the 2.1-second TTFT statistic “overage”; that field remains uninterpreted. The separately reported 61-second p95 TTFT at 1M context documents a long tail, but the corpus does not identify its cause or support a 61/2.1 comparison.`
- **Deterministic acceptance test:** The deployed §2c must contain `that field remains uninterpreted` and must not contain `read here as the average`, `~30× the typical case`, or `the GPUs were mostly doing prefill`.

### 3. [P0] The calculator misattributes a site-authored 8:1 assumption to the ncode deployment

- **Page anchors/passages:**

  - Traffic selector: `ncode coding deployment 8:1 / 41%`
  - Profile provenance: `The @_xjdr GLM 5.2 free-week observation`
  - GLM-5.2 note: `workload set to the ncode-week mix (8:1, 41% cache)`
  - GLM dossier: `ioRatio: ncode-week mix (8:1) — COMMUNITY ESTIMATE`
  - [§10 GLM card](https://inference-margins.pages.dev/#s10): `traffic: ncode coding deployment 8:1 / 41%`
  - [Grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html): the same pair is described as the free-week observation.

- **Source locators:** [Stats post](https://x.com/_xjdr/status/2071835604095300079); [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300.html); [Zhipu provider dive](https://inference-margins.pages.dev/research/zhipu-gptpro.html), which explicitly says `SPECULATION — 8 input tokens per output token` and separately attributes only the 41% cache rate to the event.
- **Failure class:** over-broad plus misattribution; the preset’s reuse is labeled-reconstruction, but its source description is incorrect.
- **Objection:** An 8:1 ratio does not follow from 81k average input length. It would imply approximately 10,125 average output tokens per request, but no output-length statistic, request count, or aggregate input/output split appears in the posts. The 232 tok/s/GPU output rate also cannot establish the ratio without a defined runtime and corresponding input flow. Only 41% is deployment telemetry.
- **Exact replacement/UI changes:**

  - Profile name: `ncode-informed scenario 8:1 / 41%`
  - Profile provenance: `The 41% cache-hit rate and 81k-token average input size are @_xjdr’s free-week observations. The 8:1 input:output ratio is a site-authored Zhipu-dive assumption because the cited posts report no output-length or aggregate input/output split. One event, not a generic coding archetype.`
  - GLM-5.2 note: `Workload scenario uses a site-assumed 8:1 I/O ratio and the ncode week’s reported 41% cache-hit rate; 8:1 is not measured ncode telemetry.`
  - GLM-5.2 dossier `ioRatio`: source `Site-authored Zhipu-dive assumption; @_xjdr reported 81k average input but no output-length or input/output split`; label `SPECULATION`.
  - GLM-5.2 dossier `cacheHit`: source `@_xjdr ncode-week report`; label `CREDIBLY REPORTED`.
  - GLM-4.7 visible note: `This scenario carries over the GLM-5.2 site assumption; no GLM-4.7 traffic telemetry supports 8:1 / 41%.`
  - §10 card: `traffic: site-assumed 8:1 I/O + ncode-week 41% cache observation. Provider-native case — not cross-provider comparable.`

- **Deterministic acceptance test:**

  1. `engine.js` must not contain `ncode coding deployment 8:1 / 41%`.
  2. The GLM `ioRatio` dossier label must equal `SPECULATION`.
  3. The deployed §10 card must contain `site-assumed 8:1 I/O + ncode-week 41% cache observation`.
  4. The resolved numeric state must remain `ioRatio === 8 && cacheHit === 41`.
  5. `node tests/traffic-contract.test.mjs` and `node tests/snapshots.test.mjs` must still pass.

## QT-SCREENSHOT

- **Worst crop:** Desktop viewport around 1280×720, cropped to the [§10 Zhipu/GLM card](https://inference-margins.pages.dev/#s10) from its margin headline through the card metadata line. The crop excludes the expandable preset dossier and research-annex links.
- **Hostile caption:**  
  `This calculator invented an 8:1 production ratio from an 81k input statistic, labeled it “ncode coding deployment,” and used it to produce the GLM margin.`
- **Context lost:** The page elsewhere says cases are not cross-provider comparable, and the dossier calls the mix a community estimate. Neither context repairs the source problem: the archived posts still contain no 8:1 ratio. The underlying provider dive correctly calls 8:1 speculation, but that label is absent from the card.
- **Required text inside the crop:**  
  `Traffic: site-assumed 8:1 I/O ratio; 41% cache hit reported for the ncode free week. No average output length or measured I/O split was published.`

## COMPREHENSION/REPRO NOTES

- The requested archive URL and homepage returned the same SHA-256 body: `46d0bf2e…acb40`.
- Remote `index.html`, `engine.js`, and `app.js` byte-match git `9f1fd0f`.
- Traffic-contract and snapshot suites passed. They confirm that the deployed GLM state mechanically resolves to `8:1 / 41%`; they do not test whether 8:1 has valid provenance.
- The separation between three deployments is explicit and source-consistent:

  - ncode/Noumena: GLM-5.2, 60×B300, BF16 attention plus FP8 experts/KV, no MTP/Eagle;
  - Baseten: GLM-5.2, NVFP4, MTP, 280+ TPS;
  - SGLang/NVIDIA: DeepSeek-V4 Pro, FP4, MTP, approximately 2,200→11,200 tok/s/GPU.

- A live rendered-DOM smoke check was attempted twice. Chrome first encountered a profile lock and then timed out; browser retries stopped under the environment failure circuit breaker. Deployed source assets and executable engine tests supplied the UI-state evidence instead.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.**

Unresolved ambiguities:

- `overage` may be a typo for `average`, but no correction exists in the frozen corpus.
- The original rationale for choosing 8:1 is not stated beyond the Zhipu dive’s explicit speculation.
- The audit is corpus-bounded to the archived sweep and manifest-selected posts; it does not establish completeness against the account’s entire timeline.
- The engine’s `$4–7/GPU-hour early rates` is a general hardware-market input, but its point-of-use source is not visible. The corpus establishes only that `@paxaral` assumed `$6/GPU-hour`; it does not establish the rate actually paid for the ncode deployment.