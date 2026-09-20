# Synthesis: Adversarial Pre-Publication Review — inference-margins.pages.dev

**Verdict up front: all four agents independently say do not share this with a SemiAnalysis-tier audience in its current form.** Not because the thesis is wrong — three of four put ~80–85% confidence on the directional claim — but because the product's rhetorical confidence exceeds its identification strategy, and because the calculator and Section 10 are demonstrably different models. A hostile reader will find that in about ninety seconds and spend their entire response correcting your presets rather than engaging your argument.

One methodological note before the synthesis: I did not fetch the page. Every quantitative claim below inherits from the agents. Where three or four independently reproduced the same number from `app.js`, I treat it as confirmed; where one agent asserts a fact alone, I flag it as requiring verification.

---

## 1. Consensus

**The directional thesis survives.** List-priced frontier API token contribution margins can plausibly reach the 90–95% region under favorable sparsity, high utilization, optimized batching, and strategic compute pricing. DeepSeek's disclosure makes this impossible to dismiss as fantasy. `[unanimous]` — confidence estimates: Skeptic 85%, Risk Analyst ~80%, Empiricist "survives," Architect "plausible and salvageable."

**The calculator does not reproduce Section 10, and the gap is enormous.** Three agents independently recomputed the deployed `app.js` under each model's default "Evidence median" perspective and got the same table to a tenth of a percentage point; the fourth got the same figures to the nearest point. This is the single strongest empirical finding in the review. `[unanimous]`

| Provider | Calculator (deployed) | §10 headline | Gap |
|---|---:|---:|---:|
| OpenAI | 93.1% | 94% | 0.9 pp |
| Google | 80.2% | 96% | 15.8 pp |
| xAI | 52.7% | 67% | 14.3 pp |
| DeepSeek V4 | 0.6% | 69% | **68.4 pp** |
| Zhipu | 81.9% | 60% | 21.9 pp |
| Moonshot | 82.6% | 81% | 1.6 pp (spurious — see below) |

Two distinct root causes were identified. Skeptic and Architect found **fleet inheritance**: OpenAI and Google have no provider-specific hardware blend and silently inherit Anthropic's TPU/NVIDIA/Trainium mix — meaning the calculator serves GPT-5.6 on Trainium. Risk Analyst and Empiricist found the more precise and more testable bug: a **shallow preset merge** in which the perspective object overwrites model-specific cache-read prices with Anthropic's universal 10%, silently discarding Grok's 25%, Kimi's 20%, GLM's 19%, and DeepSeek V4's ~0.83% — while the explanatory note beneath still displays the intended, now-unused value. Both are real; the merge bug is the one to fix first because it is a one-line class of defect with a mechanical test.

**Section 10's headlines are not the same quantity, so the ranking is partly an artifact of workload choice.** The section states that each headline is the flagship's "blended marginal serving margin at list prices." The Moonshot annex says in its own text that its figure is an output-token margin and that a blended margin cannot be estimated without Moonshot's undisclosed traffic mix. The other five cards each assume a different input:output ratio and cache rate — roughly 7:2:1 for OpenAI, 15:1 with 60% caching for Google, 3:1 for xAI, DeepSeek's historical trace, 8:1 with 41% caching for Zhipu. Since output prices and cache discounts differ sharply across providers, rank order encodes the analyst's workload assumptions as much as the providers' economics. `[unanimous]` The 82.6% ≈ 81% Moonshot "agreement" is therefore coincidence between a blended number and an output-only number.

**The "80% confidence interval" is not a confidence interval.** The annex variously calls the ranges "subjective," "judgmental," "Monte-Carlo-style," or scenario endpoints; no priors, distributions, correlation structure, sampling code, seed, or calibration evidence is published. The homepage upgrades them to "an 80%-confidence band." `[unanimous]`

Risk Analyst pushes this further than the others, and correctly: this is not merely *unjustified* precision, it is *demonstrably wrong* precision. The Google annex concedes that active parameters span roughly 4×, effective MFU another 3–4×, chip-hour cost ~1.8×, plus substantial occupancy uncertainty. Jointly plausible draws from the page's own declared ranges land well below the stated 89% lower bound. An interval that excludes points its own inputs make plausible is not an 80% interval under any procedure. **Weight Risk Analyst heavily here** — the other three say "unreproducible," which is a weaker and more easily deflected charge.

**"Calibration, not vibes" describes in-sample parameter assignment, not validation.** Each accelerator carries its own separately fitted effective MFU chosen so that it reproduces its corresponding benchmark: H20 at 18% reproduces the Ant/SGLang H20 result, Ascend at 9.5% reproduces CloudMatrix, GB300 at 17% reproduces the NVIDIA figure. Reproducing the datum used to select the coefficient is an identity. There is no out-of-sample test. `[unanimous]`

**The DeepSeek prefill calibration is wrong.** DeepSeek's disclosure states explicitly that its 73.7k input-tokens/second/node figure is "including cache hits," and separately reports a 56.3% cache-hit rate. The calculator divides 73.7k by 8 to get 9,212 fresh-prefill tok/s/GPU, derives a 34% prefill MFU from it, and then *separately* prices cache reads at 5% of fresh-prefill cost. The cache benefit is counted twice. `[unanimous]` The output anchor (14.8k/node, 1,850/GPU) is legitimate and undisputed.

**Several load-bearing sentences exceed their sources.**

- *"DeepSeek proved ~85% serving margins"* — the disclosure gives an **84.5% theoretical margin if all observed traffic had been billed at R1 list prices**, and DeepSeek expressly states that actual revenue was materially lower. `[unanimous]`
- *"prices 10–45× below Anthropic's list"* — Skeptic and Risk Analyst independently recomputed like-for-like token classes and both got **3.6× (cached input), 9.1× (fresh input), 11.4× (output)**. Two independent derivations returning identical ratios; treat as confirmed. `[skeptic, risk-analyst]`
- *"Every load-bearing claim links to a primary source"* — false. Decisive inputs route to paywalled reporting, proprietary SemiAnalysis transfer-price estimates, X posts, community parameter estimates, and unedited LLM annex synthesis. `[unanimous]`
- *"Everyone agrees on the token math; the argument is about the invoice"* — contradicted by the page itself, which elsewhere names active parameters as the dominant unknown and discusses latency, batching, precision, and utilization. `[unanimous]`

**Evidence badges grade the wrong object.** DeepSeek and Zhipu both receive "evidence: high" — DeepSeek because its *historical V3/R1* architecture and disclosure are excellent (current V4 fleet and production throughput are unknown), Zhipu because its accounts are *audited* (an 18.9% segment gross margin spanning multiple models, subscriptions, and capacity commitments is not GLM-5.2 marginal-serving evidence). A single badge collapses architecture, pricing, production throughput, fleet cost, utilization, workload realization, and revenue realization — and a SemiAnalysis reader cares mostly about the last four. All four agents propose replacing the badge with a dimension-level matrix. `[unanimous]`

**"Marginal" changes meaning across the product.** The headline defines the object as one token "on a warm GPU, at scale," but the calculator divides by fleet utilization (allocation), xAI's central case uses full-cycle owned TCO, its alternative uses contract opportunity cost, Google uses estimated internal resource cost, and §7 bridges to accounting gross margin. Empiricist supplies the decisive illustration: **xAI moves from ~92% to 67% to 29% depending purely on cost-basis choice.** When the definitional knob has three times the leverage of every physical parameter combined, it belongs above the headline number, not in a collapsed card. `[unanimous]`

**The xAI $5.27/GPU-hour is a bundled-service price, not a GPU-hour opportunity cost.** The underlying $1.25B/month contract covers CPUs, exabyte-scale storage, networking, and interconnect alongside the ~325k GPUs. Empiricist confirmed this language at the prospectus. `[unanimous]`

**Presentation invites dismissal.** No accountable human author, no public repository, no versioned assumption manifest, no changelog on highly perishable prices, no test suite. Raw unedited LLM outputs published as "research artifacts" with duplicated headings and DOM artifacts. "Pro-verified" verifies that a model run occurred, not that its claims are true. Two models reading overlapping public sources are computationally separate, not epistemically independent. And all four agents — independently, unprompted — flagged the reproduced ableist quotation and the "reply-guy"/"fleecing"/"estimation toy" register as a credibility cost that buys no analytical value. Four-for-four unanimity on a *tone* item is itself signal. `[unanimous]`

---

## 2. Disagreements

### D1. Does the DeepSeek calibration error bias margins upward, or do the errors cancel?

**The disagreement:** Skeptic and Risk Analyst say the double-counted cache discount understates input cost and therefore biases margins upward; Architect and Empiricist say the cache error and a second, opposite error approximately cancel.

**Skeptic / Risk Analyst's strongest argument:** Cached tokens inflate the calibration throughput *and* are discounted again in the workload calculation. Both distortions push cost down and margin up. Until fresh-prefill throughput is reconstructed independently, the input-cost leg — and therefore every cache-heavy blended margin, which is most of them — is biased upward. Risk Analyst adds that the replay also applies an ~81% utilization factor even though DeepSeek's disclosed $87,072 already uses *average occupied* nodes rather than peak.

**Architect / Empiricist's strongest argument:** Architect notices something sharp that no one else did. Take the disclosure's own numbers: 608B ÷ 73.7k plus 168B ÷ 14.8k ≈ **226.9 node-days**, which almost exactly reproduces DeepSeek's reported **226.75 average deployed nodes**. The published throughput figures therefore *already* reconcile the reported average deployment — meaning the 80% utilization divisor is not an independent adjustment at all, it is a re-application of information already baked into the anchors. It inflates cost, offsetting the cache double-discount, which deflates it. Empiricist independently quantifies the residual: direct reconstruction from the disclosure gives ~$0.112/M blended serving cost, the deployed replay gives ~$0.102/M, and the replay's 85.2% lands near the disclosed 84.5% *because the two errors partially cancel*.

**Adjudication: both are right about different things, and the reconciliation is the important finding.** Empiricist and Architect have the stronger case *in-sample* — the arithmetic is explicit and the 226.9 ≈ 226.75 coincidence is hard to argue with. Net residual is a ~9% cost understatement, roughly 0.7 pp of margin. That is small.

But **the errors only cancel inside the DeepSeek replay**. The 34% prefill MFU that the cache error produces is not confined to that replay — it is a fitted coefficient that gets transplanted into every other provider estimate, where no offsetting utilization divisor exists to cancel it. Skeptic's "biased upward" is therefore correct about the *downstream* estimates even though Architect and Empiricist are correct about the *anchor*. The synthesis conclusion is worse than either finding alone: the page's headline validation ("reproduces the disclosure within a few percent") is an artifact of error cancellation, and the errors that cancel there propagate uncancelled into the six numbers the page most wants you to trust.

### D2. Repair the provider leaderboard, or demote it?

**The disagreement:** Skeptic, Risk Analyst, and Empiricist want the leaderboard fixed (canonical §10 presets, snapshot tests, common workload row + provider-native row). Architect wants it structurally demoted — an Anthropic-first report with providers relegated to an evidence matrix and scenario appendix.

**The repair camp's strongest argument (Risk Analyst):** Keep two modes. A locked "Reproduce report" mode where every card has a canonical preset that regenerates its headline within one percentage point, and a free-form "Explore" mode with incompatibility warnings for nonsensical model/perspective combinations. Publish two rows per provider — one common reference workload and cost taxonomy, one provider-native scenario. This preserves the product's actual value (a scenario explorer with real anchors) without the false comparability.

**Architect's strongest argument:** The evidence density is not uniform across providers, and no amount of preset engineering changes that. You have a genuine production trace for one provider (historical DeepSeek), audited financials measuring the wrong quantity for another (Zhipu), and conjectured active-parameter counts for the rest. A ranked list implies commensurability the underlying evidence cannot supply. The product is currently trying to be three things — exploratory calculator, Anthropic estimate, comparative dataset — and the evidence supports the first, supports a conditional version of the second, and does not yet support the third.

**Adjudication: Architect has the stronger case, and Risk Analyst half-concedes it.** Risk Analyst's own second-order risk section states: *"Fixing the intervals honestly may make the provider ranking disappear. That is not a reason to retain false precision."* That is Architect's argument in Risk Analyst's own words. Once the intervals become honest scenario envelopes — Google's realistically spanning something like 70s to high-90s given its declared 4× parameter and 4× MFU uncertainty — the six providers' ranges overlap so heavily that a rank order is not a claim the data supports.

The cleanest reconciliation, and the one I'd recommend: **keep the provider cards, delete the ranking.** Present each as an evidence matrix plus a scenario envelope plus break-even thresholds ("Google falls below 90% if the product of active-parameter count and per-token throughput cost exceeds X"). Break-even framing is more useful to a SemiAnalysis reader than a point estimate anyway, because it tells them *what to go find out* rather than what to believe. This satisfies Architect's honesty constraint and preserves the repair camp's utility. Architect's own stated condition for retaining the leaderboard — every headline generated by a versioned provider configuration under a common workload and cost definition with reproducible uncertainty propagation — is the right gate; it is just several weeks of work away, not several hours.

### D3. Is replacing the effective-MFU abstraction a P0 or a P1?

**The disagreement:** Risk Analyst puts it at P0 (with an escape hatch: "either model context/latency/cache lifecycle **or** state a much narrower domain of validity"). Skeptic and Architect put the roofline rebuild at P1. Empiricist puts neither — Empiricist proposes a test.

**The P0 argument (Risk Analyst):** The abstraction has no context length, no TTFT/TPOT target, no batch/concurrency, no KV-cache size, no expert-parallel topology, no speculative-decoding acceptance rate. Input:output ratio is not a substitute for sequence length. NVIDIA's own GB300 claims are conditioned on ISL 32K / OSL 8K and a specific serving configuration; CloudMatrix drops from 1,943 to 538 tokens/NPU when TPOT tightens from ~50 ms to 15 ms; MLPerf warns latency-constrained server QPS can fall below half of offline QPS. The calculator compresses all of this into "batch/balanced/fast" multipliers of 1.0/0.70/0.35. If only the token ratio moves cost, the model is missing essential physics.

**The P1 argument (Skeptic, Architect):** A fitted interpolation model over three real anchors is a legitimate and useful object. It just must not be *called* first-principles calibration. Architect's phrasing is the honest version: "replace with at least a simple compute/HBM/network/latency roofline, **or** explicitly call the calculator an empirical interpolation model." Relabeling is a P0-cost fix; rebuilding is a P1-cost fix.

**Adjudication: Empiricist dissolves this, and Empiricist should win.** The question of whether a scalar effective MFU transfers across architectures, precisions, batch regimes, and latency targets is *empirically decidable with data you already have*, at zero marginal cost. Fit one model with no hardware-specific fitted coefficient on a single matched DeepSeek anchor; predict H20, GB200, and CloudMatrix throughput at their published context, precision, batch, and TPOT constraints; publish the predictions before looking; require central error below ~25%.

If it passes, the abstraction is defensible, the relabel is sufficient, and the rebuild is a genuine P1. If it fails, no amount of preset engineering saves the provider estimates and Architect's demotion becomes mandatory. **This is the load-bearing experiment for the entire product, it costs one afternoon, and no hardware is required.** It is a P0 *decision procedure* that determines whether the rebuild is P0 or P1 — which is a better answer than either camp's prior.

Empiricist supplies a hint about which way it will go: the GB200 anchor doesn't even reproduce internally. 4.5 PF × 15% ÷ 74B FLOP/token ≈ 9.1k, not the stated 10.14k. And the cited 10.1k vLLM result uses NVFP4 while the model describes it as an FP8-MFU calibration *and separately exposes an FP4 multiplier* — a double count sitting inside one of the three anchors the "calibration, not vibes" claim rests on.

### D4. Is the subscription section an arithmetic contradiction or an identification failure?

**The disagreement:** Architect calls it a plain arithmetic contradiction and makes it P0 #9. Skeptic, Risk Analyst, and Empiricist attack it as tail-selection — inferring the median from whale anecdotes.

**Architect's argument:** The page says *"$3,200 of API-equivalent usage costs perhaps $300–900 to serve … so the median subscriber is comfortably profitable."* A $200 subscription is not profitable if its serving cost is $300–900.

**The identification camp's argument:** The cited investigations establish that *extreme* users can extract enormous API-equivalent value. They are selected precisely because they are unusually large. No representative usage distribution, mean, median, or top-decile threshold is presented anywhere. Plans can also be loss leaders, retention devices, or cross-subsidized bundles; their existence is not clean evidence about token margin either way.

**Adjudication: the identification camp is right; Architect has likely misread the referent, but the sentence is broken anyway.** The $300–900 almost certainly describes the cost of serving the *whale's* $3,200 of usage, not the median subscriber's — and Empiricist quotes the page as separately saying "the top decile is genuinely underwater," which is *consistent* with a whale costing $300–900 on a $200 plan. So there is probably no arithmetic contradiction of the kind Architect alleges.

But the "so" connective is a non-sequitur regardless of which reading is right. Nothing about the median follows from a fact about the tail, and if the $300–900 *were* meant to characterize typical usage, then Architect's contradiction is real and fatal. Both readings condemn the sentence. **Fix by deletion**, not repair: remove both "the median subscriber is comfortably profitable" and "the top decile is genuinely underwater." Neither is supported by anything on the page.

Risk Analyst independently found a mechanical bug in this section that no one else did, and it is the most damning thing about it: the card converts claimed list-price usage into tokens using **the calculator's discounted realized price**, so moving the *enterprise discount slider* changes the inferred number of tokens a subscriber consumed. Usage a person actually generated cannot depend on an unrelated pricing assumption. That is a clean, demonstrable defect and a perfect regression test.

---

## 3. Open questions

**Which counterparty is on the $1.25B/month compute contract, and does the page's own xAI card contain the answer to its Anthropic question?** *(synthesis-emergent, from an Empiricist detail the other three didn't report.)* Empiricist reports the prospectus discloses "approximately 325k GPUs and a $1.25B/month **Anthropic** agreement." The arithmetic confirms the derivation: $1.25B ÷ 325,000 ÷ 730 h = $5.269/GPU-hour. Skeptic, Architect, and Risk Analyst all discuss the same $5.27 figure without naming the buyer.

If Empiricist has the counterparty right, this is more interesting than the bundling caveat everyone flagged. It means the page is sitting on **an observed, arm's-length, dated price for capacity that Anthropic actually buys** — and the page's central thesis is that the Anthropic disagreement "is about the invoice." A real transaction price for Anthropic-consumed compute constrains the invoice question directly, and the page uses it only as a proxy for xAI's opportunity cost. Two caveats before anyone gets excited: it is bundled (CPU, storage, network), and contracted capacity need not price the marginal fleet. But this deserves a section, not a footnote. **Verify the counterparty first** — if Empiricist transposed it, the xAI opportunity-cost argument is not merely imprecise, it is built on the wrong company's contract.

**Is Google closer to 80% or 96%?** The calculator says 80.2%, §10 says 96%, and no agent adjudicated. The gap is 16 points and the page offers no way to tell which of its own two artifacts to believe. *(synthesis-emergent.)*

**What is the actual fresh-prefill throughput of the DeepSeek fleet?** Every agent says the current anchor is wrong; none reconstructed the correct one. Risk Analyst specifies the required inputs — total cache-hit tokens, cache-miss tokens, output tokens, average node-hours, and separate prefill/decode pool sizes — all of which are in the disclosure. Someone has to actually do it. *(risk-analyst, empiricist)*

**Does the scalar effective-MFU survive leave-one-anchor-out?** Unanswerable without running Empiricist's test. It determines whether §10 is salvageable. *(empiricist)*

**Are the Sonnet and fast-mode pricing corrections current as of publication date?** Architect says live Sonnet 5 is $2/$10 (through Aug 31) against the page's modeled $3/$15; Architect *and* Empiricist independently say Opus 4.8 fast mode is $10/$50 against the page's cited $30/$150. Two independent hits on fast-mode raise confidence there. But these are dated, perishable facts asserted by agents I cannot audit — **verify against the pricing pages before editing.** The deeper point stands regardless: a page dated July 9 carrying a retired tariff is a version-control failure, and version-control failure is what a SemiAnalysis reader uses to decide whether to keep reading. *(architect, empiricist)*

**Is Grok's 1.5T parameter count labeled DISCLOSED?** Architect says the official Grok 4.5 disclosure confirms price and 80 TPS but *not* 1.5T, and that the figure depends on mapping an executive's "V9 foundation" remark onto the shipped product. No other agent checked this label. *(architect)*

**Is there a human author?** Architect and Risk Analyst both note there is no accountable byline, no repository, no commit hash, no correction log. Nobody could determine who is responsible for the claims. For a product asking a specialist audience to trust its numbers, this is not a nice-to-have. *(architect, risk-analyst)*

---

## 4. Final recommendation

**Pause sharing to specialist readers. Do not abort — the product is worth salvaging, and its strongest insight is genuinely good.** That insight, which all four agents endorse and which no critic on X seems to have articulated, is the distinction between *unit serving economics at list price* and *reported company gross margin*. Those diverge by forty points or more and the "90-95% margins" debate is largely people talking past each other across that gap. Keep that. It is the paper.

What you cannot keep is the claim to have *measured* where any specific provider sits. The product currently presents a scenario generator as a calibrated measurement system, and the four independent reproductions of `app.js` mean a hostile reader will demonstrate that in one click.

**Confidence:** High confidence the directional thesis is right (four independent agents, 80–85%). **Very high confidence the calculator/§10 divergence is publication-blocking** — three agents reproduced identical figures to a tenth of a point and a fourth to the nearest point; a 68-point gap on DeepSeek is not a rounding dispute. **High confidence the "80% CI" cannot survive** — this is not a labeling preference, Risk Analyst showed the page's own declared input ranges generate points outside its own stated bands. **Medium-high confidence on the DeepSeek prefill error** — unanimous, and the disclosure's "including cache hits" language was verified at the primary source, though nobody has reconstructed the corrected number. **Low confidence in the specific live-pricing corrections** — dated, perishable, asserted by one or two agents each; verify before editing. **Low confidence in the six provider point estimates and their intervals as comparable quantities** — this is the agents' consensus and mine.

**Conditions that would change this recommendation:** If (a) leave-one-anchor-out holdout error comes in under ~25%, (b) every §10 headline is regenerated by a named, versioned, locked preset reproducing within one percentage point, (c) all provider headlines use one estimand and one cost scope, and (d) the intervals are either replaced by scenario envelopes or made reproducible with published distributions and sampling code — then the leaderboard can stay and this becomes a SemiAnalysis-grade artifact. That is Architect's stated gate and I endorse it unchanged.

**Cheapest next actions, in order.** Two experiments, both cheap, both decisive, and they answer different questions:

1. **The snapshot test (hours, deterministic).** Write an automated assertion that each §10 card's headline equals its canonical preset's calculator output within one percentage point. This either produces the presets — which forces you to confront that OpenAI has no fleet, Google has no fleet, and the perspective object is stomping cache prices — or it proves §10 is not the calculator's output, in which case §10 comes down. This is the publication blocker; do it first. Risk Analyst's six detection signals make an excellent test suite as written, particularly *"changing the enterprise-discount slider changes inferred subscription token consumption."*

2. **Leave-one-anchor-out validation (one afternoon, no new data).** Empiricist's design, quoted: fit a single model with no hardware-specific coefficient on one matched DeepSeek anchor; predict H20, GB200, and CloudMatrix at their published context, precision, batch, and TPOT constraints; **publish the predictions before looking at the held-out results**; require central error below ~25%. This decides whether the scalar effective-MFU abstraction extrapolates or merely interpolates — and therefore whether §10 is repairable at all or must become an appendix.

Run these before touching prose. Every writing fix below is downstream of what they return.

### Merged fix list

**P0 — must fix before sharing**

1. **Rebuild the DeepSeek calibration from the raw disclosure accounting.** Remove the 9,212 fresh-prefill tok/s/GPU and the 34% prefill MFU derived from a cache-inclusive figure. Do not re-apply an 80% utilization divisor to a $87,072 cost that already uses average occupied nodes — Architect showed 608B÷73.7k + 168B÷14.8k ≈ 226.9 ≈ the disclosed 226.75, so the throughputs already encode average deployment.
2. **Make every §10 headline reproducible from a named public preset**, with a regression test asserting agreement within one point. Fix the shallow preset merge (provider cache-read prices are being overwritten with Anthropic's 10%) and give OpenAI and Google their own fleets. Deep-merge; separate immutable disclosed facts from perspective assumptions; display any overridden field explicitly.
3. **Delete "80% CI."** Replace with "analyst-elicited scenario range" or publish distributions, correlations, sampling code, seed, and calibration evidence. If you keep the band, run Risk Analyst's falsification test first: perturb all inputs across their declared ranges and check whether plausible combinations fall outside it. Google's currently do.
4. **Unify the estimand.** Moonshot cannot appear in a blended-margin ranking while its own card says *"this is an output-token margin; a blended margin needs Moonshot's undisclosed traffic mix."* Publish one common-reference-workload row and one provider-native row per provider, with output-only estimates in a separate column. Prefer "N/A" to a silently changed estimand.
5. **Define the cost taxonomy above the first number.** Short-run incremental cash, long-run incremental serving cost, and fully allocated / capacity-opportunity cost are three different questions. xAI moves 92% → 67% → 29% across them. Never rank providers across mixed lenses.
6. **Condition the verdict.** Replace *"the 90–95% claim is approximately right for what it actually claims"* with the conditional the page's own §5 and §6 already contain — roughly high-70s to mid-80s under market-rate compute and moderate utilization, roughly 90–95% under strategic partner rates, high utilization, and favorable architecture. The quoted claim in §1 names Opus specifically; §5's own evidence-median for Opus is ~80% and the deployed calculator's default Opus result is 78.6%. You cannot rescue an Opus claim with a Sonnet number.
7. **Delete** *"Everyone agrees on the token math; the argument is about the invoice."* The page itself names active parameters as the dominant unknown. Suggested replacement (Risk Analyst): *"Procurement explains much of the divergence between Anthropic models, while architecture, workload, and latency remain first-order unknowns."* If you want to keep the original, decompose variance in the final estimate and show procurement explains ≥70%.
8. **Correct the load-bearing prose.** *"DeepSeek proved ~85% serving margins"* → *"DeepSeek's disclosure implies an 84.5% theoretical margin had all observed traffic been billed at R1 list; actual realized revenue was materially lower."* *"prices 10–45× below Anthropic's list"* → the actual like-for-like ratios, 3.6× / 9.1× / 11.4×.
9. **Retract the source guarantee.** *"Every load-bearing claim links to a primary source"* → *"Every load-bearing claim is linked; source quality is labeled"* — plus a claim-level ledger distinguishing primary disclosure, audited financials, vendor benchmark, independent measurement, secondary reporting, community estimate, and author assumption.
10. **Fix the internal contradiction where the page calls DeepSeek "the lowest estimated margin"** while its own §10 table puts Zhipu at 60% below DeepSeek's 69%. *(Empiricist alone caught this; it is trivially checkable and maximally embarrassing.)*
11. **Delete the subscription median/decile claims** — *"the median subscriber is comfortably profitable"* and *"the top decile is genuinely underwater."* No representative usage distribution exists on the page. Separately, fix the token conversion so it does not run subscription usage through the enterprise-discount slider.
12. **Either model context length, latency SLO, and cache lifecycle, or state a much narrower domain of validity** — e.g. "short-context, throughput-saturated approximation." Pending the LOAO result, the honest interim move is the narrowing.

**P1 — should fix**

Replace the single evidence badge with a dimension matrix (architecture / pricing / production throughput / fleet & TCO / workload realization / overall margin identifiability). Downgrade "Calibration, not vibes" to "anchor fit" until holdout validation passes; verify the GB200 anchor's internal arithmetic (4.5 PF × 15% ÷ 74B ≈ 9.1k, not 10.14k) and resolve the NVFP4-anchor-described-as-FP8-MFU double count. Add numeric ISL, OSL, TTFT, TPOT, concurrency, and cache reuse/TTL controls. Model cache *writes* (OpenAI 1.25× input), cache storage (Google charges separately), and Anthropic's 5-minute vs 1-hour write tiers — a one-read cache entry should not look as profitable as one reused hundreds of times. Reframe xAI's $5.27 as bundled capacity revenue per nominal GPU-hour. Rebuild the §7 company-margin bridge in dollars per million tokens rather than additive margin points, and check for double-counted utilization. Correct the live pricing (Sonnet, fast mode, Ironwood GA date, Trainium count) *after verifying at source*. Mark Opus and Sonnet parameter counts speculative in the UI — they currently escape the warning applied to other closed models. Publish a repository, commit hash, assumptions JSON, derivation notebook, tests, and a dated changelog. Curate the annex into audited claim/source tables and archive raw model runs separately; stop presenting a second model's read of overlapping public sources as independent verification. Add a named human author. **Remove the reproduced slur and the "reply-guy"/"fleecing" register** — four independent reviewers flagged it unprompted, it costs nothing to fix, and it is the difference between reading as an analyst and reading as a combatant.

**P2 — nice to have**

Permalinkable scenario URLs and CSV/JSON export. Tornado charts over all dominant inputs, not active parameters alone. Cost intervals displayed alongside margin intervals (percentages near 100% visually compress enormous cost uncertainty — a 90% and a 96% margin differ by 2.5× in cost). Benchmark cards recording context, I/O ratio, TPOT, TTFT, batch, precision, and topology for every anchor. Incompatibility warnings on nonsensical model/perspective combinations. A short executive methods box above the calculator stating exactly what is and is not included. Move the strongest limitations beside the headline numbers rather than inside collapsed cards. Rename "72-rack" to "NVL72 rack."

---

## 5. Attribution map

| Claim | Contributing agent(s) |
|---|---|
| Directional thesis survives (~80–85%) | unanimous |
| Calculator ≠ §10; reproduced figures from `app.js` | skeptic, architect, empiricist (identical); risk-analyst (to nearest point) |
| Root cause: OpenAI/Google inherit Anthropic's fleet | skeptic, architect |
| Root cause: shallow preset merge overwrites cache-read prices with Anthropic's 10% | risk-analyst, empiricist |
| DeepSeek 73.7k figure is cache-inclusive; cache discounted twice | unanimous |
| 608B÷73.7k + 168B÷14.8k ≈ 226.9 ≈ disclosed 226.75 avg nodes → utilization divisor is not independent | **architect** (sole) |
| Corrected reconstruction ≈ $0.112/M vs replay's ≈ $0.102/M; errors partially cancel | **empiricist** (sole, quantified) |
| Fitted MFU propagates uncancelled into other providers | synthesis-emergent (from skeptic's bias claim + architect/empiricist's cancellation finding) |
| "80% CI" is not reproducible | unanimous |
| Google's declared input ranges generate points *outside* its stated 89–98% band | **risk-analyst** (strongest form) |
| "Calibration, not vibes" is in-sample fitting | unanimous |
| GB200 anchor arithmetic: 4.5 PF × 15% ÷ 74B ≈ 9.1k ≠ 10.14k; NVFP4 anchor labeled FP8-MFU | **empiricist** (sole) |
| "10–45×" wrong; actual 3.6× / 9.1× / 11.4× | skeptic, risk-analyst (independent, identical) |
| "DeepSeek proved ~85%" → theoretical-if-billed-at-list; realized revenue much lower | unanimous |
| "Every load-bearing claim links to a primary source" is false | unanimous |
| "Everyone agrees on the token math" contradicted by the page itself | unanimous |
| Verdict picks favorable branch: §1 claim names Opus; §5 median ≈ 80%; calculator default 78.6% | **skeptic** (sharpest); architect, empiricist concur |
| Moonshot is output-only inside a "blended" ranking | unanimous |
| Workload mixes differ across cards (7:2:1 / 15:1 / 3:1 / 4:1 / 8:1 / output-only) → ranking encodes assumptions | empiricist, risk-analyst (enumerated); skeptic, architect (noted) |
| xAI swings 92% → 67% → 29% on cost-basis choice alone | **empiricist** (sole, quantified) |
| $5.27/GPU-hr is a bundled service price (CPU/storage/network) | unanimous; empiricist verified at prospectus |
| Counterparty on $1.25B/month contract may be Anthropic → possible direct evidence on the invoice question | **empiricist** (sole datum) → **synthesis-emergent** implication |
| Evidence badges grade the surrounding evidence base, not the margin estimate | unanimous |
| Subscription: enterprise-discount slider changes inferred subscriber token count | **risk-analyst** (sole) |
| Subscription: median/decile claims are tail-selection | skeptic, risk-analyst, empiricist |
| Subscription: arithmetic contradiction ($200 plan, $300–900 cost) | **architect** — *likely misread referent; sentence broken regardless* |
| "DeepSeek has the lowest estimated margin" contradicted by §10's own Zhipu 60% | **empiricist** (sole) |
| Ironwood GA (Mar 2026, not Nov 2025); ~500k Trainium stale (>1M as of Apr 2026) | **empiricist** (sole) |
| Sonnet $3/$15 vs live $2/$10; Grok 1.5T not actually DISCLOSED | **architect** (sole) |
| Fast mode $30/$150 → $10/$50 | architect, empiricist (independent) |
| Cache writes (1.25×), Google cache storage, Anthropic 5min/1hr tiers unmodeled | **risk-analyst** (sole) |
| No human author, repo, changelog, or test suite | architect, risk-analyst |
| "Independent" LLM cross-consultation is computational, not epistemic, independence | architect, skeptic |
| Slur + "reply-guy" register lowers perceived seriousness | unanimous (four independent, unprompted) |
| Leave-one-anchor-out validation as the decisive cheap experiment | **empiricist** |
| Snapshot test: every card reproduces within 1pp; six detection signals | **risk-analyst** |
| Keep-and-fix vs demote-the-leaderboard | risk-analyst/skeptic/empiricist vs **architect**; adjudicated toward architect, reconciled as "keep cards, delete ranking" |
| Fixing intervals honestly may erase the ranking | **risk-analyst** (conceding architect's point in his own words) |
