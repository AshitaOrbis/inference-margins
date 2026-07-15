## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The frozen homepage, `engine.js`, and `app.js` were fetched from deploy `201b22a7`. The deployed scripts byte-match the local release, and the footer identifies engine `v2.1.2-2026-07-11`.

Stage 1 separated the evidence into:

- **Quoted-secondary claim:** the July 1 [PodcastAlphaX post](https://x.com/PodcastAlphaX/status/2072119494563262697) features Dylan Patel but is not from his or SemiAnalysis’s account. It reports an **Opus 4.8 API-token margin above 80%**, with a further claim that doubling compute cost would still leave margin above 50%. It does not state a company-wide Anthropic gross margin. The annex correctly records the author as PodcastAlphaX. [Annex locator](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html)

- **SemiAnalysis primary X corpus:** the seven posts cover the February InferenceX v2 launch; March’s qualitative FP4/FP8 comparison; Anthropic’s **−94% 2024 company gross margin**; workload-sensitive subscription economics; the **$0.99/Mtok Opus 4.7 agentic-workload estimate**; the June 27 InferenceX 14×/17×/32× results; and the July 8 cache analysis over 1.5M requests. [Performance and token-economics annex](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300.html)

- **Published SemiAnalysis material:** [InferenceX](https://inferencex.semianalysis.com/), the [InferenceX v2 article](https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs), [AI Value Capture](https://newsletter.semianalysis.com/p/ai-value-capture-the-shift-to-model), the [TPU v7 analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the), and the Vera Rubin and Trainium3 deep-dives listed in [§9](https://inference-margins.pages.dev/#s9).

Classification matrix:

| Deployed representation | Classification | Corpus-bounded result |
|---|---|---|
| [§1](https://inference-margins.pages.dev/#s1): Opus API-token margin “north of 80%” | **Directly entailed** | Claim content matches the PodcastAlphaX post, but its quoted-secondary source class is not disclosed at the point of use. |
| Expanded SemiAnalysis/Dylan preset dossier | **Labeled-reconstruction** | The expanded dossier explicitly says the site translated the quote into parameters the source never selected. |
| Preset name and [§6](https://inference-margins.pages.dev/#s6) statement that the named preset “reproduce[s]” ~93% | **Over-broad** | The surrounding wording collapses the distinction between the direct >80% claim and the site-authored 55% utilization/TCO parameter vector. |
| [§4](https://inference-margins.pages.dev/#s4): 14× software, 17× FP8, 32× FP4 | **Directly entailed** | The June 27 post specifies DeepSeek R1 on B300/GB300: ~1k→8k→14k tok/s/GPU, then GB300 versus the best H100 configuration. Model, precision and date are present. |
| [§7](https://inference-margins.pages.dev/#s7): “$0.99 observed” | **Over-broad** | The source describes an Opus 4.7 agentic workload with roughly 300:1 I/O and >90% cache hits, not Anthropic-wide realized revenue per token. |
| [§7](https://inference-margins.pages.dev/#s7): −94% in 2024 | **Directly entailed** | The year, company-level accounting scope and negative sign match the archived SemiAnalysis post. |
| [§6](https://inference-margins.pages.dev/#s6): TPU v7 ≈$1.60/hour | **Directly entailed at the raw-datapoint level** | SemiAnalysis published this as an estimate for Anthropic’s 600,000 GCP-rented TPUs, inclusive of Google’s margin—not as disclosed contract pricing. |
| [Grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html): `$1.60` extended fleet-wide | **Over-broad** | The heterogeneous-fleet scalar is a site-authored extrapolation but carries a `CREDIBLY REPORTED` label. |
| Remaining site-authored parameters where explicitly marked `SPECULATION` | **Labeled-reconstruction** | No separate `compatible-unsupported` finding is required where the reconstruction and speculation labels remain visible. |
| 14×/17×/32×, −94%, and the raw $1.60 estimate | **Not contradicted** | No contradiction found in this corpus. |

## FINDINGS

### 1. **[P1] Quoted-secondary source class is absent at both attribution points**

- **Page anchor / passage:** [§1](https://inference-margins.pages.dev/#s1), beginning “And in the middle…”; the preset dossier’s anchor link displays only `[source]`.
- **Source locator:** [PodcastAlphaX post](https://x.com/PodcastAlphaX/status/2072119494563262697); [annex row identifying `@PodcastAlphaX` as author](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html).
- **Failure class:** Source-class omission.
- **Severity:** P1.
- **Objection:** The claim’s substance is represented accurately, but the page presents it grammatically as Patel’s direct statement while disclosing only through the URL hostname that the evidence is a clip-account post featuring him. This conflicts with the page’s claim that load-bearing evidence is labeled by source class.
- **Exact replacement wording for §1:**

  > And in the middle, a July 1, 2026 PodcastAlphaX clip-account post featuring Dylan Patel of SemiAnalysis quotes him as saying that Anthropic’s margin on an Opus 4.8 API token is “north of 80%.” This is quoted-secondary evidence, not a post from Patel’s or SemiAnalysis’s account.

- **Exact UI change:** For this dossier anchor, replace `[source]` with `[quoted-secondary clip post]`.
- **Deterministic acceptance test:**
  1. `#s1` contains `PodcastAlphaX clip-account post featuring Dylan Patel`.
  2. `#s1` contains `quoted-secondary evidence`.
  3. Selecting perspective `semi` produces an anchor link whose text is exactly `[quoted-secondary clip post]`.

### 2. **[P1] The collapsed preset and §6 reattribute a site-authored reconstruction**

- **Page anchor / passage:** [§6](https://inference-margins.pages.dev/#s6), containing “the two models converge at ~93%” and naming the SemiAnalysis/Dylan preset; dropdown label `[analyst] SemiAnalysis / Dylan Patel`.
- **Source locator:** [Grounding ledger, “[analyst] SemiAnalysis / Dylan Patel”](https://inference-margins.pages.dev/research/grounding-ledger.html); the ledger marks utilization, stack multiplier, interactivity, batch share and discount as `SPECULATION`. The deployed expanded dossier says the source never chose those values.
- **Failure class:** Attribution-boundary collapse.
- **Severity:** P1.
- **Objection:** The expanded dossier supplies the necessary reconstruction warning, but the dropdown and §6 are independently screenshotable surfaces. Both make the site-authored 93% operating point sound like a SemiAnalysis model rather than one possible translation around a single >80% quote.
- **Exact replacement dropdown label:**

  > [analyst reconstruction] Dylan Patel quote anchor / site-owned-TCO vector

- **Exact replacement dossier description:**

  > Site-authored owned-TCO reconstruction anchored to a quoted-secondary report that Dylan Patel put Opus 4.8 API-token margin north of 80%; Patel and SemiAnalysis did not select this parameter vector.

- **Exact replacement wording for the §6 sentence:**

  > Under the site’s owned-TCO reconstruction, the calculator lands near 93%; this is a site-authored translation anchored to the quoted >80% Opus claim, not a SemiAnalysis or Dylan Patel model. The separate GPT-5.6 Pro fleet preset also lands near 93%.

- **Deterministic acceptance test:**
  1. No visible option contains the exact string `[analyst] SemiAnalysis / Dylan Patel`.
  2. The replacement option contains `site-owned-TCO vector`.
  3. `#s6` contains `not a SemiAnalysis or Dylan Patel model`.
  4. The selected dossier still contains `Attribution: Reconstruction`.

### 3. **[P1] The $0.99 figure loses its workload and model scope**

- **Page anchor / passage:** [§7, “Discounts & mix” row](https://inference-margins.pages.dev/#s7), specifically “$0.99 observed”.
- **Source locator:** [SemiAnalysis X post archived in the annex](https://inference-margins.pages.dev/research/grok-sweep-glm-gb300.html); [AI Value Capture article](https://newsletter.semianalysis.com/p/ai-value-capture-the-shift-to-model).
- **Failure class:** Scope overreach.
- **Severity:** P1.
- **Objection:** The source estimates a blended billed price for **Opus 4.7 agentic tasks**, using SemiAnalysis’s approximately 300:1 input/output mix and >90% cache-hit rate. Placement inside a general enterprise-discount bridge permits the number to be read as observed Anthropic-wide price realization.
- **Exact replacement wording for the bridge cell:**

  > Enterprise/committed-use discounts, 50%-off batch pricing, and cache-heavy traffic. SemiAnalysis estimated ~$0.99/Mtok for its Opus 4.7 agentic workload at ~300:1 input:output and >90% cache hits; this is a workload-specific blended billed price, not Anthropic-wide realized revenue per token.

- **Deterministic acceptance test:**
  1. The `Discounts & mix` row contains `Opus 4.7`.
  2. It contains `300:1 input:output`.
  3. It contains `>90% cache hits`.
  4. It contains `not Anthropic-wide realized revenue per token`.
  5. The standalone string `$0.99 observed` no longer appears.

### 4. **[P1] The $1.60 TPU estimate is extrapolated fleet-wide under a reported-evidence label**

- **Page anchor / passage:** [§6 procurement row](https://inference-margins.pages.dev/#s6), “TPU v7 ≈ $1.60/hr per SemiAnalysis”; [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html), `rentMult = 0.7`, “extended fleet-wide”, label `CREDIBLY REPORTED`.
- **Source locator:** [SemiAnalysis TPU v7 analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the). The article estimates $1.60 per TPU-hour for the 600,000 rented TPUs and expressly includes Google’s margin.
- **Failure class:** Scope transference and evidence-label mismatch.
- **Severity:** P1.
- **Objection:** The TPU datapoint is published at the stated value, but it is an estimate—not a disclosed contract price—and applies to one deal tranche. Applying it as a scalar across TPU, GB300, GB200, Trainium2 and H200 is a separate modeling decision. The source text acknowledges that extension, while the evidence label still classifies the resulting row as reported evidence.
- **Exact replacement wording for the §6 procurement cell:**

  > SemiAnalysis’s Nov. 28, 2025 estimate for the 600,000 GCP-rented TPU v7 chips: ≈$1.60 per TPU-hour, inclusive of Google’s margin; not a disclosed contract price.

- **Exact replacement grounding-ledger source text:**

  > Site applies SemiAnalysis’s ~$1.60/TPU-hour estimate for the rented TPU tranche as a 0.7× scalar across the modeled heterogeneous fleet.

- **Exact replacement grounding-ledger evidence label:**

  > SPECULATION derived from CREDIBLY REPORTED evidence

- **Deterministic acceptance test:**
  1. The §6 procurement cell contains `600,000 GCP-rented`.
  2. It contains `not a disclosed contract price`.
  3. The `rentMult = 0.7` ledger row contains `Site applies`.
  4. That row’s evidence cell contains `SPECULATION`.
  5. That row’s evidence cell is not exactly `CREDIBLY REPORTED`.

## QT-SCREENSHOT

- **Worst standalone passage:** the [§6 paragraph](https://inference-margins.pages.dev/#s6) stating that the named SemiAnalysis/Dylan and GPT-5.6 Pro presets “reproduce” ~93%.
- **Viewport/crop:** desktop viewport approximately 1200×700; crop approximately 1050×260, beginning immediately below the §6 assumption table and ending before the attribution-divergence paragraph. The crop would contain the 93% convergence sentence but not the expanded preset dossier.
- **Hostile quote-tweet caption:**

  > The calculator invented Patel’s assumptions, named the preset after him, and then called its own 93% result a reproduction.

- **Context lost:** the expanded dossier’s reconstruction warning; the `SPECULATION` labels for 55% utilization, 1.1× stack efficiency, balanced interactivity, 15% batch share and 5% discount; and the fact that the citation is a PodcastAlphaX clip post rather than a Patel/SemiAnalysis post.
- **Required text inside the crop:**

  > SITE-AUTHORED RECONSTRUCTION — only the quoted >80% Opus 4.8 claim is attributed to Patel. The owned-TCO mode, 55% utilization, 1.1× stack, balanced interactivity, 15% batch share and 5% discount are site-selected assumptions. Source class: PodcastAlphaX clip post, quoted-secondary.

## COMPREHENSION/REPRO NOTES

- The reconstruction boundary appears only after expanding the dossier. The selector label, preset note and §6 paragraph remain understandable without expanding it and therefore must carry their own boundary language.
- The June 27 InferenceX figures are faithfully scoped on the main page: **DeepSeek R1**, B300/GB300, FP8 and FP4, dated June 27, 2026. No contradiction found in this corpus.
- The annex also contains older February InferenceX v2 figures of 65× same-precision and up to 100× cross-precision. Those are not contradictions to the June 17×/32× snapshot because the baselines, configurations and publication dates differ. A benchmark-run or recipe identifier would make that distinction reproducible without relying on chronology.
- The −94% figure is correctly presented as Anthropic’s **2024 company/accounting gross margin**, separate from the Opus API-token claim. No contradiction found in this corpus.
- The §9 descriptions of InferenceX, the Vera Rubin and Trainium3 hardware analyses, and AI Value Capture are within the subjects of the linked publications. No contradiction found in this corpus.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.**

Unresolved ambiguities:

- The PodcastAlphaX post text is archived, but the full underlying podcast exchange was not available as a complete transcript. The exact definition Patel attached orally to “margin” therefore remains unresolved beyond “Opus 4.8 API token.”
- The June 27 InferenceX post supplies the checked numbers, but the page does not preserve a benchmark run ID, database snapshot or exact recipe. InferenceX is continuously updated, so current-dashboard reproduction may drift.
- The TPU article’s $1.60 estimate is clear, but its underlying private deal inputs are not independently inspectable.
- No contradiction found in this corpus does not establish completeness against the full SemiAnalysis or Dylan Patel publication history.