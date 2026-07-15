## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The deployed `index.html`, `app.js`, `engine.js`, styles, LOAO methods note, and both release suites were byte-matched against git `9f1fd0f`. The audit covered:

- §3 equations, MFU fits, defaults, and unanchored platforms.
- DeepSeek, H20, Ascend, GB200, and GB300 calibration arithmetic.
- Traffic-profile provenance and cache semantics.
- Cache-read/write economics and interactivity multipliers.
- Lens selection, replay mutation, custom traffic, and forged permalinks.
- Executability and assertion coverage of the published tests.
- Hero-tile screenshot safety and scenario attribution.

The repository suites emitted 668 passing assertions. Separately downloaded published suites failed before running.

## FINDINGS

### 1. [P0] A forged permalink bypasses replay-traffic locking

- **Anchor/passage:** `#traffic-preset`, `#out-margin`, and `loadScenarioFromURL()`: `Object.assign(S, structuredClone(diff));`
- **Source locator:** [`app.js`, permalink loader](https://inference-margins.pages.dev/app.js); [`engine.js`, `resolveTraffic()`](https://inference-margins.pages.dev/engine.js); [traffic-contract suite](https://inference-margins.pages.dev/tests/traffic-contract.test.mjs).
- **Failure class:** Broken behavior / scenario-integrity failure.
- **Objection:** The loader first resolves the xAI opportunity-cost replay to locked traffic `3:1 / 0%`, then blindly overlays decoded fields. A forged link containing `ioRatio:300, cacheHit:95` therefore computes a **71.6%** margin while the selector and dossier still describe locked `3:1 / 0%` traffic. The authentic replay is **26.9%**. The pure resolver tests never exercise this post-resolution overlay.
- **Exact replacement/UI change:** Reject non-whitelisted keys, invalid types, out-of-range values, and any `ioRatio`/`cacheHit` overlay conflicting with a locked replay. Display exactly:  
  **“Invalid scenario link — state failed schema or replay-integrity validation; preset defaults restored.”**
- **Acceptance test:** Load a v3 scenario with:
  ```json
  {
    "ioRatio": 300,
    "cacheHit": 95,
    "_meta": {
      "model": "grok",
      "persp": "xaiopp",
      "traffic": {"mode": "replay-locked", "ioRatio": 3, "cacheHit": 0}
    }
  }
  ```
  The page must either show the exact rejection string or retain `3:1 / 0%` and `#out-margin = 26.9%`; `71.6%` must never render.

### 2. [P0] The published §3 equation does not describe the implemented engine

- **Anchor/passage:** [`#s3`](https://inference-margins.pages.dev/#s3):  
  `tokens/s/GPU = (dense FP8 FLOPS × precision factor × effective-MFU × interactivity) ÷ (2 × active params)` followed by “Prefill (input) uses the same form at higher MFU.”
- **Source locator:** [`engine.js`, `tokPerS()` and `INTERACT_MULT`](https://inference-margins.pages.dev/engine.js).
- **Failure class:** Factual implementation/documentation mismatch.
- **Objection:** The engine applies interactivity only to decode. Changing Throughput to Low-latency multiplies decode throughput by `0.35` but leaves fresh-prefill throughput exactly unchanged. The published equation and “same form” sentence imply that the factor applies to both.
- **Exact replacement wording:**  
  **“Decode tokens/s/GPU = (dense 8-bit FLOPS × precision factor × decode effective-MFU × interactivity factor) ÷ (2 × active parameters). Fresh-prefill tokens/s/GPU uses the same compute form but this engine does not apply the interactivity factor to prefill.”**
- **Acceptance test:** Add assertions that `out_fast / out_throughput = 0.35` and `in_fast / in_throughput = 1.0`, then verify that §3 contains the exact phrase **“does not apply the interactivity factor to prefill.”**

### 3. [P0] The tests published as runnable release suites do not execute from the published tree

- **Anchor/passage:** Footer: “release suites published at `/tests/`”; test header: `Run: node tests/snapshots.test.mjs`.
- **Source locator:** [snapshot suite](https://inference-margins.pages.dev/tests/snapshots.test.mjs), [traffic suite](https://inference-margins.pages.dev/tests/traffic-contract.test.mjs), [deployed engine](https://inference-margins.pages.dev/engine.js).
- **Failure class:** Broken reproducibility entry point.
- **Objection:** Both deployed suites require `../site/engine.js`. From `/tests/`, that resolves to `/site/engine.js` beneath a nonexistent nested `site` directory. Downloading the published tree and running the documented command exits with `MODULE_NOT_FOUND`.
- **Exact replacement change:** Generate deployed test copies with:
  ```js
  const E = require("../engine.js");
  ```
  Alternatively, publish the complete repository layout and link that artifact rather than calling the static `/tests/` copies runnable.
- **Acceptance test:** In an empty directory, download `/engine.js`, `/tests/snapshots.test.mjs`, `/tests/traffic-contract.test.mjs`, and the fixture; both documented `node tests/...` commands must exit `0` and end with `ALL TESTS PASS` / `ALL CONTRACT TESTS PASS`.

### 4. [P1] The calibration test claims broader coverage than it provides

- **Anchor/passage:** Snapshot suite comment: “Calibration anchors reproduce as the §3 table claims.”
- **Source locator:** [§3 calibration table](https://inference-margins.pages.dev/#s3); [snapshot assertions 55–64](https://inference-margins.pages.dev/tests/snapshots.test.mjs).
- **Failure class:** Validation-coverage overstatement.
- **Objection:** The suite checks H800 decode/prefill and GB200, but it never checks the GB300 anchor. Its H20 and Ascend assertions check the neutral defaults—17% and 7%—rather than the table’s published-anchor claims at 18% and 9.5%. A regression in those three table claims can therefore pass all 668 assertions.
- **Exact replacement change:** Add assertions named exactly:
  - `GB300 published anchor >12,000 at 12.7% × 1.85`
  - `H20 published anchor 714 at 18%`
  - `Ascend published anchor 1,943 at 9.5%`
- **Acceptance test:** Each exact `PASS` string must appear in suite output. Temporarily changing GB300 `effDec`, H20’s tested anchor coefficient, or Ascend’s tested anchor coefficient must independently make the suite fail.

### 5. [P1] One `cacheHit` value controls two observables that the cited disclosure does not equate

- **Anchor/passage:** Collapsed scope note: “cacheHit is used as BOTH the serving-side reuse share and the billable cached-input share.”
- **Source locator:** [`engine.js`, `TRAFFIC_PROFILES` and `workload()`](https://inference-margins.pages.dev/engine.js); [DeepSeek primary disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md); [annex plan review](https://inference-margins.pages.dev/research/plan-review-v212-gptpro.html).
- **Failure class:** Materially misleading variable conflation.
- **Objection:** The label acknowledges the simplification, but acknowledgment does not make the two quantities interchangeable. DeepSeek disclosed a serving-side disk-cache-hit share. The engine uses that same number both to avoid prefill cost and to apply the discounted billing tariff. This couples cost and revenue without evidence that every server hit was classified identically for billing.
- **Exact replacement/UI change:** Replace the single control with:
  - **“Serving-side prefix reuse share”**
  - **“Billable cached-input share”**
  
  The DeepSeek profile must populate the first as **“56.3% — disclosed disk-cache share”** and the second as **“Unknown — scenario input required.”**
- **Acceptance test:** Changing serving reuse must change `costMix` but not `priceMix`; changing billable cache share must change `priceMix` but not `costMix`. No engine field named `cacheHit` may feed both equations.

### 6. [P1] The subtitle overstates the empirical basis of the default hero result

- **Anchor/passage:** Masthead: “Defaults are per-platform anchor fits to public measurements.”
- **Source locator:** [masthead and collapsed scope note](https://inference-margins.pages.dev/); [LOAO methods note](https://inference-margins.pages.dev/research/methods-loao.html); [`engine.js`, default blend](https://inference-margins.pages.dev/engine.js).
- **Failure class:** Materially misleading scope statement.
- **Objection:** The default Opus blend assigns 35% of traffic weight to TPU v7 and Trainium 2/3, whose MFUs have no published serving anchors. The methods note correctly says transfer failed and these values are analyst estimates, but that caveat is collapsed below the hero result.
- **Exact replacement wording:**  
  **“Anchored platforms use per-platform fits to public measurements. TPU v7, Trainium 2/3, and Rubin use analyst-estimated MFUs because no comparable public serving anchors were found.”**
  
  Add inside the hero tile: **“Unanchored-MFU traffic share: 35%”** for the default Opus scenario.
- **Acceptance test:** The replacement sentence must appear in the masthead. Default Opus + Evidence median must display the exact `35%` hero qualifier.

### 7. [P1] Universal interactivity multipliers look more calibrated than they are

- **Anchor/passage:** Controls: “Throughput / Balanced / Low-latency.”
- **Source locator:** [`engine.js`, `INTERACT_MULT = 1.0 / 0.70 / 0.35`](https://inference-margins.pages.dev/engine.js); [methods note](https://inference-margins.pages.dev/research/methods-loao.html).
- **Failure class:** Missing caveat at point of use.
- **Objection:** The methods note calls these factors a coarse stand-in for hardware- and SLO-specific latency curves. The control omits both the exact factors and the absence of any TTFT/TPOT guarantee. The same multipliers are applied across H800, H20, Blackwell, TPU, Trainium, and Ascend despite the documented failure of cross-platform transfer.
- **Exact replacement UI labels:**
  - **“Throughput (1.00× decode; no SLO guarantee)”**
  - **“Balanced scenario (0.70× decode; uncalibrated)”**
  - **“Low-latency scenario (0.35× decode; uncalibrated)”**
  
  Add: **“Decode only; prefill and TTFT are unchanged by this control.”**
- **Acceptance test:** All four exact strings must appear beside the control without requiring a tooltip or expanded methods note.

### 8. [P1] Edited replays remain visually attributed as published operating points

- **Anchor/passage:** Lock note: “locked by the selected replay — its traffic mix is part of the published operating point.”
- **Source locator:** [`app.js`, control mutations and `onChange()`](https://inference-margins.pages.dev/app.js).
- **Failure class:** State-provenance failure.
- **Objection:** Only traffic is locked. Active parameters, fleet, utilization, efficiency, prices, and discounts remain editable, yet no dirty-state marker appears after mutation. A replay can therefore retain its published label and locked-traffic language after its operating point has been materially changed.
- **Exact replacement UI change:** On the first mutation of any replay-derived value, display inside the hero tile:  
  **“Modified replay — no longer the published operating point.”**
- **Acceptance test:** Select Grok + xAI opportunity-cost replay, change active parameters from `200B` to `15B`, and verify that the exact warning appears before the margin updates.

### 9. [P1] Cache-write completeness is caveated away from the tile that claims a realized price

- **Anchor/passage:** Scope note: “storage epsilon unmodeled”; hero subtitle: “per 1M tokens billed (after cache mix).”
- **Source locator:** [calculator scope and hero tiles](https://inference-margins.pages.dev/); [`engine.js`, cache-write calculation](https://inference-margins.pages.dev/engine.js); [cache-design consultation](https://inference-margins.pages.dev/research/consult-council-design.html).
- **Failure class:** Missing point-of-use caveat / unsupported materiality claim.
- **Objection:** Cache-write billing defaults to zero even when billable cache reads are modeled. Storage, retention, replication, eviction, and reads-per-write are omitted. Calling the missing storage term “epsilon” asserts immateriality that the engine does not establish.
- **Exact replacement wording:** Replace “storage epsilon unmodeled” with:  
  **“cache storage, transfer, retention, replication, and reads-per-write are unmodeled and may be material.”**
  
  When `cacheHit > 0 && cacheWriteShare === 0`, add beneath realized price:  
  **“Cache reads are modeled, but cache-write billing is 0%; realized price may be incomplete.”**
- **Acceptance test:** Select OpenAI dive traffic with cache-write share `0%`; the exact warning must appear inside the realized-price tile.

## QT-SCREENSHOT

- **Worst tile:** The forged xAI opportunity-cost replay from Finding 1.
- **Viewport/crop:** Desktop viewport `1440×900`; crop approximately `240×190` around only the leftmost `.tile-hero`, excluding the preset bar, dossier, and collapsed scope note.
- **Visible content:** `Serving contribution margin — 71.6%`, with ordinary zone/range prose.
- **Hostile caption:**  
  **“A ‘locked’ opportunity-cost replay says xAI keeps 72%. The reproducibility controls are decorative.”**
- **Context lost:** The authentic replay is 26.9%; the URL injected `300:1 / 95%` traffic after the resolver locked the UI at `3:1 / 0%`; the controls and computed state disagree.
- **Required content inside the crop:**  
  **“Grok 4.5 · xAI opportunity-cost replay · effective traffic 3:1 / 0% · scenario integrity: valid”**  
  Any failed validation must replace the number with **“Invalid shared scenario.”**

## COMPREHENSION/REPRO NOTES

- Deployed source hashes matched local git `9f1fd0f`.
- Repository suites: 496 snapshot passes + 172 traffic-contract passes.
- Downloaded published snapshot suite: exit `1`, `Cannot find module '../site/engine.js'`.
- Authentic Grok opportunity replay: `26.948%`; forged post-overlay state: `71.574%`.
- Interactivity reproduction: Low-latency/Throughput ratio is `0.35` for decode and `1.0` for prefill.
- H20/Ascend central defaults: no contradiction found in this corpus. The `17%` and `7%` values match the archived neutral recommendations; the optimized `18%` and `9.5%` anchors are separately described.
- Visual browser capture was unavailable after two headless-Chrome attempts returned no DOM. The screenshot test therefore uses the deployed DOM structure, CSS dimensions, exact render path, and reproduced engine values rather than a captured bitmap.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.**

Unresolved ambiguities:

- The economic magnitude of separating server cache reuse from billable cache classification cannot be determined without provider trace data.
- Cache storage and write economics cannot be signed without TTL, retention, replication, and reads-per-write distributions.
- The `4,026 tok/s/GPU` DeepSeek fresh-prefill reconstruction assumes negligible compute for disk-cache hits; the page’s separate 5% cache-read cost makes the reconstruction conservative but not independently measured.
- The H20 and Ascend optimized-anchor tolerances are approximate: the literal engine arithmetic produces roughly `720` and `1,931`, versus table labels `714` and `1,943`.
