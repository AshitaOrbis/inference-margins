# Changelog

## Astra Pro estimates — 2026-09-25 (one research run per model; the one-lens comparison table removed)

**Added — §10 "Astra Pro estimates".** A new category in §10: one GPT-6 Astra Pro research run per
contemporary model, each given this calculator's input contract and asked to set every input from
public evidence, each with its own review page. The number on each card is this calculator's result on
the run's recorded inputs — regenerated from them, never typed — with the run's own stated figure beside
it; the category has its own chart, drawn from the same function. The cards are grouped by provider in a
fixed order and are not a ranking. The first release carries fourteen models: Anthropic Claude Fable 5.1, Anthropic Claude Opus 5.5, Anthropic Claude Sonnet 5, Anthropic Claude Haiku 4.5, OpenAI GPT-6 Astra, OpenAI GPT-5.6 Terra, OpenAI GPT-5.6 Luna, Google Gemini 3.8 Flash, Google Gemini 3.1 Pro, xAI Grok 4.6, DeepSeek V4.1-Flash, Alibaba Qwen3.8-Max, Moonshot AI Kimi K3 and Zhipu GLM-5.3. GPT-6 Astra Pro itself has no card: it has no API tariff, so it has no API serving margin to estimate.

**Removed — the §10 table "Same-assumption scenario outputs — one normalized lens (not a ranking)".** The owner judged it the first place a reader sees models side by
side, screenshottable, and speculation not directly relevant to anything in reality: it priced every
provider through one page-authored lens (one procurement vector, 50% utilization, the Reference traffic)
while keeping each row's own lead prior, so its row order encoded this page's assumptions more than any
provider's economics. The table and its builder are gone. **The anchor `#s10-normalized` no longer
exists**: a link to it now opens the page at its top. The nearest successor is
[`#s10-astra-pro`](https://margins.ashitaorbis.com/#s10-astra-pro); the per-provider operating points remain on the §10
cards, and any single lens can still be applied to any model in the calculator itself. The section's
text, verbatim as it last stood:

> **Same-assumption scenario outputs — one normalized lens (not a ranking)**
>
> **Read this as scenario outputs, not estimates or a leaderboard: these are deterministic results of one arbitrary shared lens, they propagate no input uncertainty, and they replace each provider's own assumptions — so the row order encodes this page's chosen lens, not the providers' relative economics.** For readers who want one comparable row per provider anyway, this table is computed live by the calculator with the lens held fixed (the registered low/committed planning-rate vector, 50% utilization, balanced latency — this page's central read) and the traffic mix pinned to the Reference mix (15:1 input:output, 60% cache hits — regardless of the interactive traffic selector above), while keeping each provider's own list prices, cache-read price and fleet. **One assumption is NOT held equal, and the heading above overstates the normalization by not saying so: each row retains its own adopted algorithmic-lead prior** — +3 months for Anthropic, OpenAI and Google, +1 for DeepSeek, 0 for the other Chinese labs and for xAI. That is a deliberate scenario prior rather than an oversight, but it is a real difference between rows: holding the lead at 0 months for every row instead moves Google's figure from **45.58% to 28.38%**. So the row order encodes the lens *and* those priors, not the lens alone. This is deliberately *not* each provider's operating point — it prices everyone through one page-authored procurement vector — and DeepSeek V4's negative number is the honest consequence of its post-price-war list price under those scenario economics (its own operating point is the ~86% card above). Margins are rounded to whole points. These are deterministic outputs of one normalized scenario; the provider-native §10 ranges do NOT apply after changing the lens and traffic mix, and this table does not propagate input uncertainty. Excluded price-only scenarios with unidentified architecture: GPT-5.6 Terra, GPT-5.6 Luna, Gemini 3.5 Flash.

## Legibility release — 2026-09-25 (the page opens on one sentence; history moved here)

A presentation release: **no computed number moved.** Three model families' legibility reviews
agreed on what made a first reading hard (the long scenario note above the calculator, the qualifier
typeset as part of the headline number, two tiles competing to be "the answer", version history in
the reader's path). This release fixes those without changing any figure. The owner's standing rule
is that version history belongs in a changelog, so the passages below moved here **verbatim**.

- The one-paragraph standfirst replaces three; its figures and its data-date paragraph now open the
  methods box, which is renamed **Methods, assumptions and limitations** and opens on the metric.
- The ≈58% reading is called the **planning baseline** on the tile, the stress-test line and every final-answer sentence that called it the "public-evidence reference reading" (it was also called the
  "public-evidence reference reading" and "this page's own conservative policy-labeled
  low/committed-rate planning scenario"). The tile that carried it is titled *Planning baseline*
  instead of *The answer*. Which number the page opens on is unchanged.
- Each headline number is set on its own line, with its identity as a label directly under it.
- Every "Deeper explanation" button now says where it goes. Report prose is set at the body size.
  Chart captions and fleet clauses say "fit their declared serving setup" and name the capacity
  planning default in words instead of its code identifier. "not company GM" reads "not a company
  gross margin"; the two estimates' ranges are called *stated ranges*; the estimators are
  *estimators*.
- The build, manifest and connector notes in the footer sit behind one summary line.

### Moved verbatim from the methods box

Superseded readings (history). Before the August 2026 repair this page's evidence-informed blend read ≈37% and its declared-topology blend ≈48%, on defaults the fourth adversarial review found defective (per-device batch/weight identity, b = 4 Trainium operating points, cross-platform throughput coefficients, no explicit multi-token prediction (MTP), several low or analyst-set rents). Those readings are superseded by the repair and are preserved in git history. They are not selectable, and this page does not present them as a coherent public-market-rent case or as a central estimate of any provider's economics.

### Moved verbatim from the GPT-5.6 Pro estimate card

Its round-2 assumptions, kept as history (2026-08-06). The three paragraphs below describe the round-2 contextual review. Its vector is a different object from the face above and is preserved rather than harmonized: 65% occupancy, list-only billing, the same per-leg procurement declared on the FAMILY axis instead, and the algorithmic-lead prior held at zero — the reading the round-3 revision replaced when its author moved the lead off zero to 0/2/4.

The round-2 honest gap (historical). That round-2 vector computes about 79% at list and about 76% on the illustrative mix in this engine — roughly four points below what its author states, because the midpoints above are the middles of ranges it declined to collapse. It asks explicitly that the vector not be tuned until it reproduces the number, so it is not. Its downside reproduced when this reading was installed: its public-rate stress case (this page's own rents, 50% occupancy, list-only billing) computed 64.13% here against the 64.1% it states, and it computes 62.99% on this engine today.

Not the same object as §6. §6 below is this adjudicator's July 2026 independent consult, at 92–94% list on a mature-fleet strategic-contract reading; the face figures on this card are its round-3 self-authored revision (83.1% at list), made with the findings that postdated that consult and on the estimand stated above; the round-2 re-run of 2026-08-06 is the reading the analysis paragraphs above narrate. All three are preserved rather than harmonized.

Which vintage is where. The face figures and the page's built-in opening state are the same round-3 self-authored vector, but they are not the same number: the face carries what this estimator states for it, 83.1% at list, and the calculator computes about 82% at that vector today. That gap is not the one the paragraph above describes. Its author worked 83.1% on 2026-08-07 from this calculator's own 79.65% no-lead reading, and that day's engine computed 83.06% for the same settings; the settings have not changed since, but the calculator has (a generic-defaults move on 2026-08-24, then the fleet-rent adoption on 2026-09-10), and that moved this reading down by 0.73 points (83.06% to 82.33%; the separate 0.77-point gap is the author's stated 83.1% against today's 82.33%). The two stay labelled separately rather than merged. The assumption, gap and divergence paragraphs above are the fuller published reasoning from this adjudicator's contextual review of 2026-08-06.

### Moved verbatim from the Fable 5 estimate card

Its round-2 assumptions, kept as history (2026-08-06). The two paragraphs below describe the round-2 independent estimate, a different object from the face above: same occupancy and per-leg procurement, but with the algorithmic-lead prior off and the serving-stack credit stated as a separate +2.0-point increment beside the vector. Round 3 replaced that arrangement by putting the credit inside the dial, which is why the instruction not to switch the lead on belongs to the round-2 reading and not to the one the face quotes.

The round-2 honest gap (historical). This engine, at those settings with the lead at zero, computes 74.01% at the effective price / 77.16% at list; the round-2 stated central was that reading plus a +2.0 credit declared beside it. That credit was bounded by two first-party anchors — a 1.15× decode-only speculative-decoding gain and a 20% all-in serving-cost reduction — and in round 2 it had no legal dial on this engine, which is precisely the defect round 3 repaired by putting it inside the lead dial. So the round-2 estimate shipped as vector plus declared increment, and its author's instruction that the lead must not be switched on to reach the headline belongs to that arrangement, not to the one the face quotes.

Produced without sight of the other. A Fable 5 session derived the round-2 estimate from this page's own numbers and hash-committed it before any GPT-Pro round-2 output existed. The face carries its later round-3 self-authored reading. The assumption and gap paragraphs above are the fuller published reasoning from its independent estimate of 2026-08-06.

### Condensed from the estimate cards (not history — the full wording as it stood)

The cards now state each estimate's settings in one paragraph; the fuller wording they replaced is kept here.

The face carries the round-3 self-authored revision — 83.1% at the undiscounted list price, span 68–92%, with a lead-only diagnostic of 78.89–85.37% across 0–4 months. Its author stated round 3 at list only, which is why this face's basis line differs from the card beside it. The two bases differ only in the denominator — the effective price is this page's own illustrative mix (15% Batch share, 5% negotiated discount) applied to the published $5/$25 list price with cache reads at 10%; list is that price undiscounted.

The vector that actually runs — round 3, the one the face quotes. Its algorithmic lead is a RANGE, not zero: 0 / 2 / 4 months, midpoint 2, and its author says in terms why — 0 because published open practice may already absorb the portable advantage, 2 as a discounted transfer sitting deliberately below the 2.44 months a 1.25× efficiency multiplier implies, 4 as the ratified upper scenario. The rest of it: 65% utilization (band 50–80, its own judgment and not a source); list-only billing (0% batch, 0% discount), with this page's 15/5 mix asked for as a companion denominator; per-leg strategic procurement with every FAMILY multiplier pinned at 1.0 so one discount can never be counted twice — NVIDIA ×0.95 (0.90–1.00), TPU ×0.50 (0.30–0.70), Trainium ×0.85 (0.70–1.00) at zero weight, Trainium excluded from the point until the per-chip-versus-replica form defect is repaired; and no fleet-wide speculative-decoding credit. On this engine today that vector computes 82.33% at the undiscounted list price, against the 83.1% its author states, and the lead-only diagnostic across 0–4 months runs 78.78–85.29%. There is no separate judgment increment beside it: the residual prior lives in the lead dial and nowhere else.

Where it diverges from the Fable estimate: occupancy (65 vs 60 — worth about 1.8 points at the other settings), and a more strategic fleet and serving-form synthesis: its $0.595/M judgment cost sits below anything this engine computes at the default fleet without either the lead prior or near-owned-TCO economics. Neither round-3 vector holds the lead at zero, and they hold it for different reasons: this estimate's dial carries a residual efficiency prior at a midpoint of 2 months; the Fable estimate's carries its declared serving-stack credit, re-expressed in months, at a midpoint of 1 month. Their common basis for any cross-arm comparison is lead 0, where they read 78.78% and 77.16% at list. The page does not adjudicate between them.

The vector that actually runs — round 3, the one the face quotes. Its serving-stack credit is not a figure beside the vector: it is carried IN the calculator, re-expressed in months on the lead dial, which its author states is what makes double-counting structurally impossible rather than a caveat to observe. The dial is 0 / 1 / 2 months, midpoint 1 — at the midpoint it carries the CREDIT (0.92 months at the ratified 3×/yr, rounded to the nearest whole month, which is one — the floor would be zero), at the top it carries the OpenAI-anchored bound (−20% end-to-end serving cost = 2.44 months, rounded to the nearest whole month, which is two) instead of the credit and never on top of it. The rest: 60% utilization (band 50–70), held deliberately unmoved rather than raised to preserve altitude; procurement per leg — TPU ×0.30, Trainium ×0.70, and NVIDIA at no discount, one it explicitly declined to claim; 2.5T total / ~300B active; stackMult held at 1.0 and speculative decoding off at every point, so the mechanism is counted exactly once. On this engine today that vector computes 76.28% at the effective price and 79.16% at list, against the ≈77% its author states at the effective price.

Where it diverges from the GPT-5.6 Pro estimate: occupancy 60 against 65 — and it holds that 65 is exactly as unmeasured as its own 60, since the public-evidence sweep returned a rigorous negative for both — plus the rate treatment above and the declared credit in place of a lead prior.

### The Fable 5 scenario's note, as it read before this release

Fable 5's self-authored reading of this page, measured through the calculator before it was declared: 77.31 % on the engine of 2026-08-07, where every value its author declared reproduced to the decimal. The calculator has changed since (the generic-defaults move of 2026-08-24, then the fleet-rent adoption of 2026-09-10) while this vector has not, and it computes 76.33 % here today; the stated ≈77 % is its author's and is not re-tuned toward the engine. THE HEADLINE WAS COMPUTED rather than computed-and-then-annotated — the serving-stack credit that supports it is carried IN the calculator rather than riding beside the vector as prose: its exact months-equivalence at the ratified 3×/yr is 0.9159 months, and because the lead dial is integer-only the preset represents it with a one-month midpoint (the 77.31 % of 2026-08-07 and today's 76.33 % are both computed at one month). WHAT THE DIAL CARRIES, which is the double-count question and the author's own answer to it: at mid it carries the CREDIT re-expressed in months, not a lead prior; at hi it carries the OpenAI-anchored lead bound INSTEAD of the credit, never on top of it — stackMult stays 1.0 and speculative decoding stays off at every point, so the mechanism is counted exactly once. THE UPPER BOUND is anchored to the strongest first-party quantified datapoint (OpenAI 2026-07-29, agent-written kernels, '-20% end-to-end serving costs' = 2.437 months at 3×/yr) and then INTEGER-FLOORED to 2 rather than rounded, on the author's stated ground that the evidence is OpenAI's while this page's subject is Anthropic, that it is a rate-of-improvement datapoint rather than a standing gap, and that transfer to the serving layer is well under 1. THE BAND IS 65–82, whose floor prices the rates downside explicitly (64.67 measured on the engine of 2026-08-07 at half-strategic, util 50, lead 0). The author's declared common basis for any cross-arm comparison is lead 0. Method and derivation: reports/im-round3-2026-08-08.md; how this reading arrived at its current form is in the changelog.

### The GPT-5.6 Pro scenario's note, as it read before this release

GPT-5.6 Pro's self-authored reading of this page: a headline of 83.06 % on the engine of 2026-08-07, worked by its author from the calculator's own 79.65 % no-lead reading (the connector it could reach did not yet carry this preset, so the figure did not come through the MCP; that day's engine computed 83.0561 % for the same settings). The calculator has changed since (the generic-defaults move of 2026-08-24, then the fleet-rent adoption of 2026-09-10) while these settings have not, and they compute 82.42 % here today; the stated 83.1 % is its author's and is not re-tuned toward the engine. The author declines to pin its headline, letting the median fall where the arithmetic puts it rather than to a chosen figure — in its own words, it has 'no independent reason to select 2.6269 months; choosing it would be precisely the target tuning this commission prohibits.' THE LEAD IS A RANGE, not a point, because a point would have to assert something the evidence does not: 0 because published open practice may already absorb the portable advantage; 2 as a discounted, not one-for-one, transfer sitting deliberately BELOW the 2.4374 months a 1.25× efficiency multiplier implies; 4 as the ratified upper scenario, explicitly WITHOUT importing the rejected anonymous >2× claim. PROCUREMENT IS COUNTED ONCE: family-level and leg-level discounts describe one claim and multiplying them would count it twice, so every family multiplier is pinned at 1.0 and the widths live on the legs, margin-neutral at the medians. THE STATED SPAN IS 68–92 %, and it is the author's SELECTED span, not a live-engine corner band — the engine's own compounded band over these ranges is a different object and is derived, never quoted. Method and derivation: reports/im-round3-2026-08-08.md; how this reading arrived at its current form is in the changelog.

## Follow-up release — 2026-09-20 (five tariffs corrected to what the vendors now charge, an accelerator withdrawn from the default fleet, and one name per idea)

The largest single revision this page has had since it went public, and almost all of it makes the
numbers **smaller**. Three separate pieces of work land together.

### 1 — Five presets were priced on tariffs their vendors no longer charge

Re-read from each vendor's own live pricing page on 19 September and corrected. Three readings
that showed a **negative** serving margin are positive once the price is right: **DeepSeek V4 Pro**
−9.1 % → **+43.8 %**; **DeepSeek V4-Flash**, which is a different model and not a replay of
the first, −11.5 % → **+31.8 %**, with its own provider-card replay −22.2 % → **+25.3 %**; and
GLM −36.5 % → **+63.0 %**, which moves the Zhipu card in §10
off **−153 %** to **+31.3 %**. One row ran the other way: OpenAI's cheapest tier was carrying five
times the live tariff and overstated its headline by **48 points**. The §10 OpenAI card's own
"known knowns" list was still quoting the superseded $5/$30, $2.50/$15 and $1/$6; it now quotes
$4/$20, $2/$12 and $0.20/$1.20 and says what it used to say.

**No input was adjusted to move any of these numbers.** The prices were wrong and the prices were
fixed. Two Zhipu rows that opened on an 81,000-token average-input profile belonging to a
different deployment now open on the profile their card describes. Two rows the page's shared cost
lens cannot price — it values an owned fleet at a Western tenant's rent — stopped reading as
provider claims and carry a **LENS SCENARIO — not a provider claim** label; they are the only
readings on the page that remain negative, and nothing was tuned to move them. The published
ledger and the research annex were regenerated, because they had drifted and were still quoting
prices the engine no longer used.

### 2 — Six things three outside readings found, repaired or withdrawn

Before sharing this page more widely it was given to three readings commissioned to attack it: an
expert reading, a first-time reader's reading, and an internal reading working from the published
repository. They raised six findings. All six are addressed here, and **withdrawn never means
deleted** — a contribution whose support does not hold stops carrying a headline and stops sitting
inside a blended default, while staying selectable and staying in the record with its reason.

- **Trainium is withdrawn from the default fleet** rather than repaired. No source resolves
  whether its operating-point batch figure is per chip or per replica — a factor of about 15 — and
  this page's own hardware ledger already said the coefficient *cannot support a central Trainium
  margin*. The default now declares **five of seven legs** instead of silently renormalizing over
  seven. Both rows stay, labelled SPECULATION.
- **The TPU throughput numerator was repaired against its own source**: 0.55 → **0.519**. Its two
  same-platform diagnostics had been read on two different clocks — one of them treating Google's
  *combined* input-plus-output figure as though it were a decode rate. Both now sit on one declared
  convention: output tokens per second per chip over total serving wall time, at a 1K-in/8K-out
  workload. **Only the rental anchor publishes in that convention.** Google publishes a combined
  rate, and the conversion to it is this page's own arithmetic, not something either source did —
  which the calibration record now says in terms. That gives 0.528 and 0.510, midpoint **0.519**,
  band 0.510–0.528. A decode-stage pair was available and is **declined on a checkable ground**:
  fitted on two of the rental anchor's three published rows it predicts about 468 tokens per second
  per chip for the third, against a published 499. The repair **raises** modeled TPU cost, so every
  MARGIN it feeds falls or stays put — measured across 288 model/perspective combinations: 100
  lower, 188 unchanged, none higher. Quantities that track COST rise with it, as they should: the
  calibration-debt width, reference serving energy, the rent/TCO ratio and the direct-serving dollar
  costs. That direction is the evidence it is a unit repair and not a tuning: a choice of basis that
  flattered the page would have gone the other way. The GB200 precision identity, where the
  calibration registry and the explanatory note disagreed, now says what the registry says.
- **The input side is reconstructible in one place**: a new annex, *Where the input-side cost
  comes from*, with every component's source and label, the cache-work boundary the fresh-prefill
  anchor assumes, the two sensitivities the methods box had collapsed into one, and a snippet that
  reproduces it. Building it moved the share itself: **72.42 %**, not the ~70.5 % the finding cited.
- **Both estimate cards now lead with the calculation the engine actually runs.** Their round-2
  reasoning is kept below as labelled history rather than presented as current.
- **Evidence labels were re-graded to what their sources support** — a rent labelled
  *observed, source named* against a row whose own quote says the figure never became public, and
  two traffic conventions labelled *credibly reported* when what was disclosed was narrower.
- **One name per idea.** The glossary had shipped under a revised vocabulary and the page it
  explains had not, so about 35 ideas carried two or more names — starting with the headline
  metric, which the answer tile and the glossary called different things. Page, glossary, the
  calculator's own reader copy and the connector's text were brought into line in one operation,
  with a test that reports zero unlicensed variants and names the exceptions and their reasons.

**Three consequences are disclosed rather than tuned away.** One scenario leaves the band its
author declared for it (80.01 → 79.54, computed, not enforced). One estimate's fleet-mix envelope
is now **refused**, because its author declared 5–35 % Trainium and the default carries 0 — and
the page says exactly that instead of quietly rendering it. And the default fleet's
**evidenced weight share falls from 19 % to 0 %**, because the withdrawn leg was the only one
holding both a fitted coefficient and a named public price. That last number is uncomfortable and
it is the honest one.

### 3 — Six sentences of the page's own explanatory text

The prose here is frozen behind two gates so that it cannot drift silently, so each of these is a
declared change:

- the methods box said *"idle accelerators do not draw board power"*. **That is wrong**, and this
  page's own Google annex refutes it. Idle boards do draw power; this page does not model that
  draw, so the watt-hour figure is an operating-point intensity and not a fleet average — which is
  what it now says;
- *"The page never mixes bases inside one number"* promised more than the suite enforces. It now
  says it never *silently substitutes* one basis for another, and names the mixed-fleet and
  valuation-replay cases that are allowed and declared;
- *"Which kind of price you assume moves the answer more than any slider"* was an unscoped
  superlative the page's own data contradicts. **Scoping it was not enough** — a review executed the
  comparison and it is false even on the one card it was narrowed to, so the ranking claim is gone
  rather than narrowed: on that card, sweeping utilization across the range this page offers moves
  the reading **99 points** against the valuation choice's **72**, and the sentence now says so;
- *"realized"* in §7 became **"as the modeled effective price"** — the glossary reserves *realized*
  for source-reported revenue;
- the ~1–5 %-of-prefill cache-read serving cost is now stated as the analyst-set, unobserved
  figure the methods box already called it;
- the claim that training compute sits below gross margin in R&D is now attributed to the
  accounting policies these providers report, because the classification is the filer's and varies.

### What did not change

**The engine revision is still `v3.0.0-2026-08-13`.** No engine *logic* moved this round — what
moved is five prices, a decode coefficient, the default fleet's membership, two traffic defaults,
two scenario labels, a vocabulary and six sentences. If you kept a copy of the 12 August public
release, it carries the same revision string and different numbers; this entry, and the private
source commit named in the publish, are what distinguish them.

## Follow-up release — 2026-09-12 (every scenario can be your default on every model, the Custom model included)

Owner voice note `note-20260912T180812Z-c9eaac` asked for a set-as-default button on every assumption. The
release below left gaps. With the Custom model selected, the window offered every scenario without that
button, and the scenario on screen had no button of its own while a different traffic mix was selected or
its settings were edited. Every scenario the window names now carries one, on every model. The one exception
is the scenario your browser already opens on, which is named instead.

A default is a model and a scenario, and it reopens that scenario's own settings; for the Custom model those
are its starting settings. It does not keep the other choices a screen can hold: slider edits, a fleet you
picked, a parameter-count case, the trend-interlock choice, a forced calculation of an incompatible pairing,
a traffic selection, or a scenario name you typed. It opens with the scenario's own traffic mix and with the
fleet a fresh visit assigns. When the
screen holds such a choice, the button for the scenario on screen names it before you press it, and every
confirmation names it. The window also does not mark that state as your default. Notices and view options,
such as a note about a corrected link, are not part of a default.

No number on the page changes.

## Follow-up release — 2026-09-12 (one window, a default you can choose, and the headline shows its working)

Owner voice note `note-20260912T180812Z-c9eaac` and burn-queue rows `bq-2345` and `bq-2334`.

**The headline tile is now the one window.** It names the scenario it is showing, marks it when that
scenario is the default, and swaps scenario in place. The page still opens on the GPT-5.6 Pro
estimate's own settings. Any scenario can be made the default for your browser from the window's
list or from the estimate cards; that choice is stored in this browser only, and a shared link still
opens exactly what it names.

**The calculation sits on the face.** The tile shows the serving cost and the modeled billings for the
same million mixed tokens, the division that produces the result, and the engine's own result to one
decimal. The decimal matters here: at the page default the rounded dollar amounts ($0.65 and $3.72)
give 82.53 %, which rounds to 83, while the engine computes 82.42 %, which rounds to 82. The tile says
the dollar amounts are rounded rather than leaving the two to disagree.

**Why the GPT-5.6 Pro card's 83.1 % and the calculator's ≈82 % differ, now stated where both appear.**
Its author stated 83.1 % on 2026-08-07, working it by hand from this calculator's own 79.65 % no-lead
reading; the engine of that day computed 83.06 % for the same settings. Those settings have not changed.
The calculator has, twice: the generic-defaults move of 2026-08-24 took the same settings to 83.75 %,
and the fleet-rent adoption of 2026-09-10 took them to 82.42 %. The stated figure is its author's and is
not re-tuned. Fable 5's round-3 figure carries the same record: 77.31 % on the engine of 2026-08-07,
76.33 % today.

**One figure on the GPT-5.6 Pro card moves: its public-rate stress case, 72.19 % → 62.99 %.** The
round-2 proposal of 2026-08-06 defined that stress case as this page's own rents, 50 % occupancy,
list-only billing and the full declared blend; it computed 64.13 % then, against the 64.1 % its author
stated. The 2026-09-10 recompute measured a different object (the estimate's own vector at public rents,
65 % occupancy), which gave 72.19 %. The defined object computes 62.99 % on today's engine.

**Preset and model notes that still described earlier computations as current now say what the
calculator computes today:** the Grok cache-read rate (15 % since 2026-09-10), the stress case (rebuildable
from this page's declared planning assumptions, three of them provisional rents, not from public rate
cards alone), the archived Fable 5 contextual estimate (about 74 %, about 3 points below its stated 77 %),
and the archived GPT-5.6 Pro contextual estimate (about 79 % at list and 76 % on the illustrative mix).

## Follow-up release — 2026-09-10 (the r3 lead-only diagnostic is recomputed, and this entry exists because the last move of it was not recorded)

Owner ruling `d-20260910-im-r3-lead-diagnostic-recompute`, answering card
`q-im-r3-lead-diagnostic-designation`: **A — recompute on all three surfaces and keep it
recomputed.**

**The GPT-5.6 Pro round-3 lead-only diagnostic moves 80.48–86.47 % → 78.89–85.37 %** across 0–4
months of algorithmic lead. It is the engine's own sweep of that preset at the current defaults,
executed rather than quoted: 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653 at lead 0/1/2/3/4, at
the undiscounted list tariff. The value moves for the same cause as everything else on v3.2.0 — the
adopted fleet rents — and it moves late only because nothing on record said whether this field was a
maintained engine figure or a preserved quotation.

**What settled that is the installing commit's own body, not the synchronisation.** A provisional
GPT council reviewing the line audit refused to treat "the string tracks the engine" as proof of
authorisation, and it was right to: synchronisation proves synchronisation. What decides it is that
the author declared a lead range **in months** — 0/2/4, a dial range — and never stated a percentage
range at all, describing 79.65 as a point the engine computes and explicitly declining to tune
toward 84.0. The percentages then track that dial exactly at two independent engine states.

**The card's own stated readings do not move and did not move here:** 83.1 % central and the
68–92 % span are its author's, the span explicitly its own selected span rather than a live-engine
corner band. Only the field the author never wrote is recomputed.

Three surfaces published two different values before this entry — the card face and the registry at
80.48–86.47 %, and the paragraph below at 79.65–85.89 %, false since the 2026-08-24 fold. All three
now read 78.89–85.37 %. The `2026-08-17` entry below carries the corrected figure inline rather than
a second copy, so this page states the diagnostic once.

**This entry is the actual remedy.** The defect that produced the question was not a wrong number:
it was a sweep on 2026-08-24 that moved a published figure and left nothing behind saying it had.
A recompute rule with no record of its recomputes reproduces that in a year. The rule is now
written down, and so is this instance of it.

## v3.2.0 — 2026-09-10 (the declared fleet is priced, and the Grok cache-read rate is corrected)

Owner ruling `d-20260910-im-adopt-fleet-rents-and-correct-grok`, answering card
`q-im-unpriced-legs-and-grok-cache`. Two changes, both of which move published numbers, and both
declared here rather than folded quietly into a release that had promised not to move any.

**The owner-adopted scenario rents for GB200, GB300 and Trainium3.** From the im-arc T4 fold of
2026-08-24 until today, those three legs carried no admissible public planning rate. The engine
renormalized them out and computed the headline over the remaining **52% of declared fleet weight**,
disclosing that it did so. The owner ruled that disclosure was not enough and the declared fleet
should be priced. The three rows the fold had kept as declared provisional replays — GB200 $4.50,
GB300 $6.00, Trainium3 $2.20 per accelerator-hour — are now registered quotes and are what
`RENT_POLICY` selects. **The numbers are unchanged from those replays; the selection is the change.**

Read the basis before the number. All three are registered `provisional`, and each says in its own
source line that no rate of the low/committed planning class is published for that leg — because
none is. `unavailableReason` is kept rather than deleted: the ground for excluding them did not stop
being true when the page decided to price them anyway. This is a change of **judgment**, not of
evidence, and the page says so where the figure is published.

The planning baseline moves **51.18% → 57.88%** at effective price (**57.10% → 62.99%** at list) and
the lead-adjusted baseline **62.90% → 68.00%**. Every engine-derived figure on the page, in the
annex chain and in the MCP surface moves with it; the two QUOTED estimate-card readings do not, and
a gate now recomputes each published card face against the registry to keep it that way.

**The Grok 4.5 cache-read multiplier, 25% → 15%.** The registry had recorded the correct value since
2026-09-02 (`knownStaleInputs`: computed 25, verified 15, sourced to docs.x.ai) and gated the change
as its own data milestone. It is adopted now. **No published Grok reading moves because of it** —
every published Grok operating point runs at the dive's Uncached 3:1 / 0% convention, so a
cache-read price has nothing to multiply there. It does move states that run with cache on,
downward, because it is a **billing** input rather than a cost one. Published Grok readings do move
elsewhere on this release, for the fleet rents; that is a different cause and is declared as one.

Two authored reconstructions that had fallen outside their 80–90% band when the three legs lost
their rates re-enter it (x80-v3 81.0, x80-v4 80.0). That is the assumption returning, not evidence
arriving, and the disclosure says so.

### Declared owner-ruled exceptions

Everything in this release that departs from a standing rule is listed here with the arithmetic it
changed and the ruling that authorised it. Ruling id for all of them:
`d-20260910-im-adopt-fleet-rents-and-correct-grok` (owner, 2026-09-10T05:50Z / 22:50 MST
2026-09-09), answering card `q-im-unpriced-legs-and-grok-cache`.

**Exception 1 — a provisional rate is selected as a planning default.** The standing rule is that
`RENT_POLICY` selects a rate of the low/committed planning class. No such rate is published for
GB200, GB300 or Trainium3, and the page had excluded them for that reason since 2026-08-24. The
owner ruled that the declared fleet should be priced anyway. The three rows are registered
`basis: provisional`, `unavailableReason` is kept rather than deleted, and each source line says
plainly that no rate of the planning class exists for that leg.
Arithmetic: reference reading **51.1786 → 57.8814** at effective price and **57.0982 → 62.9883** at
list; lead-adjusted baseline **62.9038 → 67.9968**; `renderableWeightShare` **0.52 → 1** and
`renderableLegs` **4 of 7 → 7 of 7**.

**Exception 2 — a data milestone is adopted ahead of its own gate.** Grok's `cacheReadMult` was
recorded correct-but-unadopted on 2026-09-02 under `knownStaleInputs`, gated as its own milestone.
The ruling adopts it now. Arithmetic: **25 → 15**, and **no published Grok reading moves because of
this correction**, because every published Grok operating point runs at the dive's Uncached
3:1 / 0% convention, so a cache-read price has nothing to multiply there. Read that scope
carefully: published Grok readings *did* move on this release — the xAI card's
Anthropic-contract opportunity value goes ~12% → ~19% — but they moved for the **fleet rents**,
not for this. States that run with cache on do move for this, downward, because it is a **billing**
input rather than a cost one. The `knownStaleInputs` row is kept with a `resolvedAt` rather than
deleted.

**Exception 3 — byte-frozen surfaces are re-minted.** Each carries its own declared note naming
what changed and why, and each moved set is bounded by an assertion rather than by a claim:

- **six of eleven MCP report-text slices** (report-s4, s5, s6, s7, s10 and the front page); the
  other five are byte-identical, which is what makes the moved set meaningful;
- **two R1 freezes** — the concatenated MCP TypeScript hash, and `site/index.html`, the latter for a
  one-character repair described in exception 5 below;
- **the 180-pair v2.2 traffic-contract baseline**, whose re-mint shape is itself the evidence that
  this was a procurement change: of 180 provider/perspective pairs **72 moved and 108 are
  byte-identical**, and the set of pairs that moved without carrying an adopted leg or being
  Grok-with-cache is **empty**. One owned-TCO route did move — `grok|x90-v1`, 71.54% → 69.06% — and
  it moved for the second admissible cause rather than the first: a planning rent cannot reach a
  route that prices from capex, but that state runs with cache on, so the cache-read correction
  reaches it, downward, which is the direction a revenue cut implies;
- **20 of 22 UX-C rendered-tail fixture states**, with the pre-adoption fixture archived;
- **seventeen pinned figures in the application-level release tests** and **two rendered-answer
  digests**, every one of them re-derived from the rendered DOM rather than from arithmetic. One of
  those is not a digit swap: the gap against an analyst's stated figure was *0.6 points above what
  they state* and is now *0.7 points below* — the page used to compute slightly more than the claim
  it cites and now computes slightly less;
- **thirteen connector assertions**, listed individually in the release record with what each pinned
  and what it computes now.

Every **WIDE render-parity constant is unchanged** and was re-executed, including the historical
`pre-move` and `pre-stress` surfaces whose whole job is to hold a state the code has since left.

**Exception 4 — one correctness fix rides a release that had promised to move only what the ruling
moved.** The published proportion of declared fleet weight that renders began returning
**1.0000000000000002** once all seven legs priced — a proportion above 1, against a connector schema
that types the field `nonnegative.max(1)`. It could not have been reached before this release: while
three legs were excluded the value sat near 0.52 and never approached its own upper bound.

It is corrected **at the publication boundary**, in the connector, and deliberately **not** in the
engine. The engine's value is the divisor of its own blend renormalization and an input to
byte-frozen historical receipt reproductions; correcting it there was measured to move five WIDE
parity constants, two source freezes, the 180-pair baseline and three historical receipt
reproductions — for a field both publication surfaces already round to "100%" when they display it.
Destroying a reproduction proof of what the engine used to compute, to remove one ulp from a number
no reader sees at full precision, is the wrong trade. **No published figure changes either way.**
The engine-internal identity, and a sibling of the same defect on the per-section share, are filed
as `bq-2194` for a release that is not already carrying a number move.

**Exception 5 — a one-character repair to the served page, on a release that changes no prose.** The
number sweep left an unclosed `<strong>` in §4. A browser's parser nests everything after such a tag
inside it, so report sections 5–10 and their headings stopped being children of the report container
and **six of the ten sections became unreachable by deep link**. No static check saw it — a strict
parser reading the file reports all ten correctly, and the byte freeze was green because the bytes
were exactly what the sweep wrote. The repair is the missing `</strong>` and nothing else; no text a
reader sees changes. A tag-balance check now runs in the test suite. Filed as `bq-2195`.

## v3.1.0-dev — 2026-08-22 (section-scoped fleet procurement and the named generic-electricity migration)

The im-arc T2 build (`research/im-arc-t2-sections-memo.md`) makes procurement and electricity
properties of explicit fleet sections. Mixed rented/owned fleets now retain an executable
`composition[]` basis map; section electricity affects owned/TCO pricing only; legacy flat fleets
load through a one-section migration shim; and codec v7 carries sections by value. The hardware
registry now has an explicitly null `kwhPerKwh` evidence hook on every row, while the new region,
facility and programme registries keep facility-specific and programme-level evidence distinct.

The generic-fleet electricity default moved from **$0.07/kWh** to the EIA May-2026 US industrial
average, **$0.0871/kWh**, read directly from `REGIONS["us-industrial"]`. Its **$0.06–$0.12** page span
is rendered explicitly as provisional. Historical owned-TCO readings are enumerated and pinned at
$0.07/kWh so archived outputs reproduce; old unpinned TCO permalinks surface the existing drift note.
The migration characterization proves all 240 rent-basis model/perspective states byte-identical and
measures the largest affected generic owned-TCO movement at **0.210 percentage points**. The ordinary
WIDE registry grid remains unchanged because its only owned-TCO perspectives are historical and
therefore pinned; generic/forced-owned evaluations carry the characterized movement instead.

## Research-annex correction — 2026-08-21 (the China dossier's electricity central: western hub → coastal serving)

The Chinese-accelerator GPT Pro dive (run 2026-07-09) sets Chinese datacenter electricity at
**¥0.38/kWh central**, derived from western-hub tariffs (Ulanqab ~¥0.35, Zhongwei ~¥0.36, Qingyang
≤¥0.40). Those western figures are not disputed. What was wrong is that the **western** case was made
the **central** one on a page about latency-bound inference *serving*, which is the workload class
that stays coastal.

**The refuting evidence, all dated primaries.** OIES (Hove, *The China data centre advantage: hype
versus reality*, Feb 2026) reports the IEA finding Chinese industrial customers pay electricity prices
"comparable or higher" than US ones, and puts a high-load-factor coastal datacenter at **¥0.6–0.75/kWh
delivered**. State Grid Jiangsu's official tariff table (issued 2026-05-28, effective 2026-06) gives
**¥0.5842/kWh** energy at 110 kV plus a **¥44.8/kW·month** demand charge — **¥0.6524/kWh delivered** at
a 0.90 load factor, **$0.097/kWh** at the 2026-08-20 mid-market rate. EIA's US industrial average is
**$0.0871/kWh** (Electric Power Monthly Table 5.3, data May 2026, released 2026-07-23). China's
East-Data-West-Computing programme moves only 4–12% of energy use and cannot move the ~60% of load that
is latency-bound. The dive's own coastal *scenario* (¥0.70) was close to the measured figure; the
defect is which case is central.

**What changed.** `research/provider-dives/chinese-accel-gptpro.md` carries a dated correction block at
the top and three dated inline markers at the points where ¥0.38 is stated as the central figure
(§2.3 twice, and the "Other owned-TCO defaults" line in §5). The archived dive text is otherwise
preserved — the page is a verbatim archive and corrections are annotations on it, following the
2026-07-10 precedent on the Ascend web sweep.

**What did NOT change: any engine value.** Nothing in the engine, the data layer or the memos consumes
¥0.38 (grepped). The calculator's global electricity default stays at **$0.07/kWh**, whose label "US
industrial ≈$0.06–0.09" spans the EIA figure. Whether that default should move to $0.0871 is an open
owner decision and is deliberately not settled here.

**Size of the correction, stated.** Raising the electricity term from ¥0.38 to the coastal ¥0.65
is **+72%** on that term ($0.0494 → $0.0849 per accelerator-hour at PUE 1.25), **+2.5%** on H800
owned-TCO hourly cost and **−0.64 pp** on its margin — and the identical −0.64 pp on the H100, so the
H800-vs-H100 differential is unchanged to four decimals across the whole $0.045–0.150/kWh range. Under
the page's default **rental** basis the effect is **0.00 pp**, because electricity is not decomposable
on that path. Electricity is 4.3% of the H800's owned-TCO hour and 6.5% of the H100's; the dive's own
sentence — "depreciation and utilization dominate, not power" — was right.

## Engine lever — 2026-08-18 (the H800/H100 differential becomes a named, adjustable assumption: `nvlinkCapMinRatio`)

Owner voice note aca09d (2026-08-18): the H800's difference from the H100 must be modeled somewhere —
he believes it matters mostly for training and less for inference, "but there is no way that it doesn't
matter at all"; whichever assumption the model adopts must be explicit and adjustable, so a reader who
disagrees in either direction can play with it and see the consequence. A GPT-5.6 Pro pre-decision
review (2026-08-18) was folded before shipping: the first design's unconditional multiplier was rejected
as double counting and replaced by the matched-counterfactual floor below; the copy moved from "uplift"
to "fit-transfer assumption"; the bounds were tightened; H200 got its own lineage value.

**The grounded delta** (primary sources, captured 2026-08-18): the H800 SXM differs from the H100 SXM
in NVLink (400 vs 900 GB/s aggregate bidirectional) and FP64 (1 vs 34 TF) only — FP8/BF16 tensor rate,
80 GB HBM3, 3.35 TB/s and 700 W are identical (NVIDIA H800 datasheet 2631447 Feb-2023 vs the H100 SXM
datasheet; Lenovo Press LP1814: "the differences between the H100 and H800 are the NVLink interface
speed and the FP64 performance"; Tencent Cloud HCCPNV5; Reuters 2023-03-21). DeepSeek-V3's report
(arXiv 2412.19437 §3.2.2/§3.4) states NVLink 160 GB/s vs IB 50 GB/s in their H800 nodes and that the
decode all-to-all runs "via direct point-to-point transfers over IB" — a fabric identical on both parts.

**Correction to the 2026-08-16 row note.** That note said the cap is "modelled nowhere" and that the
engine "has no fabric term on these rows at all". False of the compute path: `HW_ROOFLINE` carries
400e9 on h800 and 900e9 on h100/h200, and the live roofline consumes both (decode `t_N = b·D/fabric`,
prefill `t_fabric`). What is true: at every expert-parallel operating point the page ships the fabric
term is SLACK under the frozen max() form (≈3.0% of the binding memory term on the H800 at the page
default, ≈13% on kimi), so the two rows render identical throughput; and h100/h200 wear the η FITTED on
the capped part (F1 — DeepSeek's production disclosure ran on H800s) — a fit that may include
cap-related effects which cannot be separately identified. The H800 is therefore the measured part; the
borrowing rows are where the assumption lives; and the page's implicit assumption has been "the cap
costs nothing". On the dense tensor-parallel donor the fabric term already BINDS prefill and the H100
renders ≈2.25× the H800's prefill throughput with no lever at all.

**What ships.** A typed per-row lineage `CALIBRATION.<row>.nvlinkCapLineage` (closed set:
`capped-anchor` = h800; `uncapped-borrows-capped-fit` = h100 — identical constants;
`uncapped-family-borrows-capped-fit` = h200 — the provenance-distinct family transfer;
`not-applicable` = the rest, eligibility following provenance, never the nominal fabric); a SPECIFIED
lever `nvlinkCapMinRatio` ∈ [1.00, 1.25] step 0.01, default **1.00 = the historical model,
byte-identical, and the neutral key is never encoded into a link** — the assumed MINIMUM ratio of a
borrowing row's throughput over the SAME row's capped counterfactual (its own constants with the
anchor's 400 GB/s fabric), per phase: `T = max(T_raw, r × T_capped-counterfactual)`. Where the roofline
already renders the uncapped part faster (the fabric term binds — dense-TP prefill at 2.25×) that
advantage counts toward the ratio and the control adds nothing (`already-modeled`); where the two tie
(every shipped MoE-EP point) the factor is the ratio itself (`floor-applied`); it never touches the H800
and never rows with their own anchor. Per-leg lineage/disposition lines through one engine-owned
formatter, both phase factors and both roofline ratios printed. A COMPUTED readout
(`nvlinkCapReadout`) — the fabric-term share of the binding term on both parts, each borrowing row's
roofline ratio over its capped counterfactual, the engine's serial-exposure counterfactual (h100/h800
≈ 1.005× at the page default: `t_iter,800 ÷ (t_iter,800 − t_N,800 + t_N,100)`, a bracket on the
model's overlap formulation, not an empirical bound), and the blend and stand-alone margins at neutral
versus the current setting plus a neutral slope per +0.05 — rendered beside the control and under the
per-accelerator chart. Nothing numeric is authored in a renderer.

**No computed value moves at the default**: the WIDE 270-state render parity re-mint is purely additive
(stripping the one new typed leg field reproduces the prior baseline hash exactly), both tripwires
re-derive exact, the default-state permalink bytes are unchanged, and the all-H800 DeepSeek replays are
invariant under any value by construction. The sensitivity is real when moved: at ×1.10 the H100
stand-alone margin rises 70.3% → 73.0% and the default blend 68.98% → 69.53%. Evidence task
E-2026-08-16-c (a matched capped-vs-uncapped serving observation) stays open — none is public; the
setting is a declared belief about a fit-transfer effect, not a measurement.

## Page revision — 2026-08-17 (the estimate cards' round-2 readings move here, where version history belongs)

Owner standing rule, 2026-08-16: *"do not give any info about changes from previous versions on the
page, a change log buried where someone looking can find it is plenty, otherwise quite confusing to
users who have no idea what the old systems were."* The 2026-08-16 sweep applied that rule across
the page, and then the cards-vintage rebuild later the same day put round-over-round comparison back
into the two estimate expanders — the faces moved to the round-3 readings (owner ruling
`q-margins-cards-vintage`, 2026-08-16T14:17Z) and the expanders narrated the move. The faces stay
where that ruling put them; the narration moves here, in full, so nothing published is lost:

**GPT-5.6 Pro card.** The round-2 pair the estimates rebuild was ruled on: **81.8 % effective
billings / 84 % at list, bands 64–91 % / 68–92 %.** The face now carries the round-3 self-authored
revision — 83.1 % at the undiscounted list tariff, span 68–92 %, with a lead-only diagnostic of
78.89–85.37 % across 0–4 months. Its author stated round 3 at list only, which is why that face's
basis line differs from the card beside it.

**Fable 5 card.** The round-2 reading: **≈77 % effective billings over 70–84 %, ≈80 % at list with
band 74–86 %.** The face now carries the round-3 self-authored reading — central unchanged at ≈77 %,
span widened to 65–82 %, ≈80 % at list.

No computed value moves with this entry: it is prose relocation only, and the page's own render
parity over all 270 states is byte-identical across it. The expanders keep every provenance line
naming which authored statement each face quotes and which contextual review the analysis beneath it
came from — that is citation, not version history, and the rule is about the latter.

## Engine v3.0.0 — 2026-08-13 (the b9 arc complete: claim-bearing tails, the range calculator's mean mix, and three Share crashes fixed)

The version badge moves 2.2 → 3.0 (plan D-10, ruled at M8): since 2.1 this line rebuilt the entire
form (M1–M6), repaired the published numbers under adversarial review, added the two-reading
FINAL-ANSWER surface, and now ships the last two development lines together. New in this release:
the UX-C claim-bearing tails (typed tail commits, relocatable receipts, an honest close path); the
M7 citation repairs; the provider-range calculator's derived-fleets statistic as the margin at the
EXACT mean mix — the centroid of every distribution summing to 100 % inside the declared ranges,
computed in exact integer arithmetic after float cancellation was twice shown to certify wrong
answers — with the expected-margin claim rendered only when the serving regime and renormalization
structure license it; and fixes for three user-reachable Share-link crashes (minting from modified
states and after scope-crossing model switches). Honesty repairs: the FINAL-ANSWER landing-lead
sentence now derives from the landing state instead of a hardcoded clause that had gone stale; mix
labels speak the bounded providers' own total; and this changelog's earlier affineness claim carries
its dated correction below. No computed reading moved: 255/255 production states verified
byte-identical against v2.2.0 (research annex: headline-invariance evidence).

## Engine v2.3.1-r499 — 2026-08-09 (a fleet mix is a range too: max/min/median over the distributions that sum to 100 %)

Owner ruling `q-sliders-fleet-util-point`, answering a question about whether fleet occupancy should
become a POINT. It reverses that and generalises it: *"if there's a range for providers, then there
should just be an algorithm to sample the max and min based on those ranges … anything that doesn't
sum to 100 is going to be not included in the calculator because you need 100%."* Single points, in
his words, *"imply a level of confidence that nobody really has."*

**No declared range is deleted, and one is recovered.** GPT Pro's round-2 blend declaration — 50-65 %
NVIDIA, 35-50 % TPU, 0-15 % Trainium — was carried verbatim in this page's provenance as PROSE and
was not expressible, because until now the engine had no compositional range that preserves a 100 %
simplex. Its round-3 self-review said exactly that in its own words, declining to declare blend
ranges because *"the calculator has no compositional range that preserves a 100 % simplex"* and
logging the gap rather than faking it. The gap is closed, so the declaration ships where the
calculator can read it. No authored number changed; the rendered point is still NVIDIA 60 / TPU 40 /
Trainium 0.

**A different geometry from the compounded band, deliberately kept apart.** The existing band
corner-enumerates INDEPENDENT dials over a box. Shares are coupled by `Σ = 100`, so their feasible
set is a box sliced by a hyperplane — a polytope whose extremes sit at vertices.

*Correction (2026-08-13, M8 exit gate).* This entry originally claimed margin is AFFINE in the
shares and that measured affineness is what licenses the exactness. The dual consult of
2026-08-10 sharpened that argument and the engine has carried the sharper form since: with the
renderable set fixed, renormalization makes cost a ratio of two affine functions —
LINEAR-FRACTIONAL, not affine — and a linear-fractional objective over a polytope still attains
its extrema at vertices. What licenses exactness is a CONSTANT SURVIVOR-SET REGIME across the
envelope, checked at every reported mix; affineness is a reported diagnostic, never the
criterion. The affine measurement quoted here (272 pairs, worst deviation 6.8e-13) was real but
described the unrenormalized case only.

**The median follows his rule.** Where the declared shares already sum to 100 they ARE the median —
GPT Pro's 60/40/0 do, so the page shows that author's own mix rather than an average it invented.
Where they do not, the median is the nearest distribution that does.

**What it refuses.** Ranges that do not contain the scenario's own mix (GPT Pro's reading of
Anthropic's fleet is not used to bracket OpenAI's — 12 of 16 model states refuse, each naming the
provider). A provider range and a leg range inside it, which would state one claim twice. And it
never rescales a declared range to make it fit.

No computed value moved: 255 of 255 render states byte-identical, 255 of 255 saved links resolve to
the same margin (`worstDelta: 0`), no `DEFAULTS` move and no epoch bump.

## b9 M7 citation-debt leg — 2026-08-09 (primary pinned; axes corrected; quote-dated)

**What.** The three pre-public citation-verification debts are resolved as attribution and
scope-label repairs only. The Amodei "compute multipliers" term is pinned to the 2023-08-08
Dwarkesh Patel transcript and moves SOURCE ESTIMATE → CONFIRMED-primary for the term's existence
and wording; its evidentiary axis is narrowed to a training-side security/secrecy posture, not
unpublished inference efficiency, while heise remains the dated relay. The Information item
remains CONFIRMED-secondary: its exact *AI Agenda* metadata is pinned, the paywall was re-tested,
and **the 13 captures in Wayback's digest-collapsed listing (2026-06-30 → 2026-07-23) were each
fetched** — none contains the article body — so the "more than half" and "a few hundred GPUs"
figures remain relay-only. That finding is bounded to those 13 captures: it establishes nothing
about captures outside the listing, or about other archives.

**Epoch.** The trends-page row is quote-dated to its 2026-08-09 re-fetch and "Updated Feb. 5,
2026" page stamp; the 3.0×/year software-progress statement is now explicitly pre-training,
while the confirmed +37–40%/year hardware line remains. The attributed 10–50×/year
inference-price band could not be re-confirmed at that URL on 2026-08-09. That is a failure to
re-confirm, not evidence Epoch removed it; the inference-price class remains carried by Epoch's
dedicated data insight in §2.3. **No computed value moved.** Resolution ledger:
`research/b9-m7-citation-debts.md`.

**Two further corrections, folded from the leg's own documentation gate (round 1, HOLD).** The
OpenAI row said the "few hundred GPUs" figure covered **free-tier** ChatGPT. It does not: the
confirmed segment is the **logged-out guest/visitor tier**, explicitly outside the free
*registered* tier — a scope this repository's own x-sources record already called "the
load-bearing finding", and which the row had been contradicting. Separately, two propagated
status notes said "the quantitative figures above remain relay-only", sweeping in numbers that
reach the repository by other routes; the relay-only status is now stated for **The Information's
own two figures** and no others — an overclaim in the opposite direction from the usual one, and
no more true.

**A third round was needed, and the record says why.** Gate round 2 confirmed both folds above and
then caught two claims the fold itself had introduced: an archive conclusion drawn from **two**
inspected captures while asserting coverage of all thirteen, and a gross-margin figure whose
provenance had been silently upgraded to "audited-document reporting" by sitting next to a figure
that genuinely carries that attribution. The first was answered by **fetching all 13 listed captures**
rather than softening the sentence (none contains the article body; one lacks the gate string the
other twelve carry, and the ledger says so instead of smoothing it); the second by separating the
figures and their routes. The resolution ledger keeps all three passes visible, because a citation
milestone that hid its own three-attempt convergence would be the wrong kind of document.

## Engine v2.3.0-r499 — 2026-08-09 (declared ranges become the page's first language; the page opens on the round-3 Pro estimate)

**What ships.** Every estimate preset now carries the RANGES its author declared, rendered as
per-dial bands under the hero at page open, with the compounded whole-box range behind an explicit
opt-in — never the headline. Both round-3 self-authored presets land (GPT-5.6 Pro and Fable 5, each
authored through the calculator itself), and the page-open default moves from the round-2 contextual
Pro preset to **the round-3 self-authored Pro preset** (owner-accepted 2026-08-08): the first number
a visitor sees is now ≈83% at the author's own +2-month lead, beside the author's own stated
≈83.1% (68–92%) and a derived gap line reading 0 points. The author's six identical NVIDIA leg
ranges are carried as one family-scoped range (values unchanged), so the landing default's
compounded band computes — 10 bounded assumptions, point 83.0561 unmoved to four decimals.
**No saved link moves** (measured: 180/180 minted-on-master tokens resolve byte-identically;
`DEFAULTS` untouched; the encoder epoch advances to `v23r499` with this release, its first serving).
This release also puts the corrected +2.4-months stack-multiplier equivalence on the served page —
the v2.2.0 hotfix below was published to the mirror on 2026-08-07 but not deployed until now.

## b9 UX-C — 2026-08-09 (the claim-bearing tails: typed split, relocatable receipts, honest close path)

**What.** The hero tile's tail — every state-identity label, supplemental receipt and trailing
affordance under the headline margin — is now composed as a TYPED three-region structure
(`.tile-mandatory` / `.tile-receipts` / `.tile-actions`) committed atomically per render, in
place of one accumulated string. Receipts (and only receipts) can relocate into a "Result
receipts" popup on the shared dialog coordinator; on coarse pointers they are replaced by that
popup once JS readiness is proven, and restored for print. The incompatible-pair early return
now clears the analyst-share disclosure and the feasibility pair instead of leaving a previous
state's receipts under an "n/a" tile — the leg's one behavioral delta. The dialog close path
now REPORTS restoration failure instead of declaring success: a failed restore keeps the modal
(with the complete relocation plan registered for retry), every mutation that could destroy a
relocated source aborts while it stands, and pending work replays through one level-aware
dispatcher once the close succeeds. `.id-epistemic` (the anti-conclusion-shopping label) is
promoted in place. **No computed value moved**; the tail's fresh-state text is byte-identical
across a 21-state pre/post fixture; sinks 390→389 with zero class moves; index.html untouched.
Spec: `research/b9-ux-memo.md` §18 v6 (six adversarial design-gate rounds, P0 funnel
7→5→3→2→1→0). Manifest: `research/b9-delta-manifests/b9-ux-c-delta-manifest.md`. Implementation
`047428e`.
## Engine v2.2.0 hotfix — 2026-08-07 (one wrong number, in the page's own arithmetic)

**A figure this page stated about itself was wrong, and it was wrong on this page's own formula.**
The serving-stack efficiency tooltip, its 1.25× tick label, the §"interlock" bullet in the report and
the v2.2.0 changelog entry below all said that a 1.25× stack multiplier is *"≈ +2.9 months at 3×/yr"*
of algorithmic lead. It is not. On the trend model this calculator actually implements —
`months = 12 · ln(E) / ln(rate)` — a 1.25× factor is **+2.4374 months**, which the page now states as
**≈ +2.4 months**. The +2.9 figure is the months-equivalent of **1.30×**, not 1.25×: the two were
transposed when the copy was written, and nothing ever checked the sentence against the function
sitting a few hundred lines away from it.

**Nothing computed changes.** This was never an input to any number — no margin, cost, span or
scenario reading moves, and no saved link is affected. What moves is a claim the page made about the
size of an assumption it had *retired*, in the sentence explaining why it retired it.

**What changed structurally, so this class of error is caught next time.** The months-equivalent is
now derived from the engine's own trend function inside the release test chain and asserted against
the shipped copy, rather than being a number someone typed into a tooltip. A test did pin that tick
label before today — and pinned the typo with it, asserting the literal string as though a
hard-coded number could verify itself. A future edit that moves the trend model, the default rate,
or the sentence will now fail the chain instead of shipping.

Found by the row-499 algorithmic-lead investigation while re-deriving every months-equivalent this
project quotes.

## Engine v2.2.0 — 2026-08-06 (the b9 arc goes public: the landing headline moves ≈77% → ≈69%)

**The headline number changed, and this entry exists to say so plainly.** Until today this page's
landing default — the number a first-time visitor sees before touching a control, `opus` at the
`median` perspective — read **≈77%**. It now reads **≈69%**, with **≈59%** carried beside it as a
second, labeled *public-evidence reference* reading. Both are scenario readings of this calculator.
Neither is a measurement of anyone's margin, and neither has become "more correct" than the other:
they differ by exactly one declared assumption, the owner-ratified algorithmic-lead prior, and by
nothing else.

**Why it moved — three mechanisms, not one, and they run in opposite directions.** Each delta below
was measured by executing that revision's own engine at the landing default, not inferred:

| # | what landed | when | landing default | move |
|---|---|---|---|---|
| 0 | the previously published engine (v2.1.x) | — | 76.7784% | — |
| 1 | **serving-model re-engineering** — the activated roofline display path, the parallel capacity-width solver, and serve-feasibility-filtered default fleet membership | 2026-07-19 → 07-23 | 35.1404% | **−41.64** |
| 2 | **the model-size revision** — the current flagship adopting the 2–3 T community band at a 2.5 T scalar, in place of the earlier 5 T Musk-relative reading | 2026-07-24 | 37.2066% | **+2.07** |
| 3 | **the margin-evidence adjudication** — the r4 run B §C1 repaired defaults | 2026-07-26 | 59.1806% | **+21.97** |
| 4 | the owner-ratified algorithmic-lead prior (b9 M5) — the one assumption separating the two published readings | 2026-07-28 | 68.9840% | **+9.80** |

The rebuild of how this page models serving is what moved the number most, and it moved it *down*;
the two adjudications that followed moved it back *up*. The FA arc's own acceptance rows asked only
for the size revision and the margin-evidence adjudication to be separated (G1A-1, G1A-3) — the
measurement found a third and larger mechanism, so the on-page bridge names three. That bridge is
the fifth block of the FINAL-ANSWER surface and names the ≈77% predecessor directly.

**Old links keep telling the truth, in two different ways** — both verified against the deployed
page, not assumed. A share link in the **pre-v5 format** (everything the ≈77% page itself minted)
no longer resolves under this engine at all: it raises the epoch-deprecation notice — *"This shared
link predates the v2.2 engine (v4 format) and can no longer be resolved. Showing the current central
scenario instead. Your data was not changed."* — rather than re-interpreting an old relative token
against moved tables. A **v5-or-later** link, which carries the margin its sharer saw, restores and
renders the drift notice on the whole-percent hero convention: *"originally shared: ≈77% — current
engine: ≈69%"*. Neither path silently re-renders an old link at the new number.

**What else this release makes public for the first time** (the whole b9 arc, previously development-
only): the b9 M6 two-reading FINAL-ANSWER surface and its analyst-gap executive summary; the b9 M1
repaired defaults; the b9 M2 form-correction debt disclosure; the b9 M3 energy/procurement-basis
dimension; the b9 M4 custom fleet builder and permalink codec v6; the b9 M5 family sliders and
algorithmic-lead prior; the user-tunable speculative-decoding lever (default 1.00×, no credit); the
IM3 roofline display path and the IM4 fleet/capacity solver behind mechanism 1 above; and the UX-A
and UX-B legs. Several §10 provider cards move with them — most loudly Zhipu/GLM's dive replay to
≈−166% (policy-unclean, labeled as such on the card) and Google/Gemini's to ~84%.

**Carried forward unchanged:** v2.1.12's two owner-approved RAISE Summit podcast claims and their
`analyst-characterization` provenance tier. **Version identity:** `ENGINE_REVISION`, the footer
release manifest and `package.json` all read v2.2.0; `DATA_AS_OF` stays at 2026-07-26, the date of
the newest evidence incorporated.

## Engine v2.1.12 — 2026-08-05 (weekly update: two owner-approved RAISE Summit podcast claims)

**Why.** The 2026-07-27 owner ruling on `q-im-podcast-candidates` approved two claims for inclusion, both from Dylan Patel's (SemiAnalysis) on-stage remarks at the RAISE Summit 2026 (Paris; recorded 2026-07-09, published 2026-07-16) — surfaced by this project's podcast-mining pipeline on 2026-07-26. This is the first release to carry a podcast-transcript-sourced claim in the MARGIN_CLAIMS registry.

**New provenance label: ANALYST-CHARACTERIZATION.** Both claims are Patel's own account of pre-IPO/private financials he says he has reviewed, not a company disclosure or filing — the owner ruling required this be carried explicitly, so a new `provenanceTier: "analyst-characterization"` value is introduced (free-text field, no enum to extend) alongside a `tierNote` on each record spelling out the caveat.

**Anthropic — first realized-profit claim.** Patel said Anthropic turned its first gross profit in Q2 (June 2026) and will book slightly over $1B of operating profit in Q3, describing these as the financials Anthropic is preparing to disclose in its IPO. Added as a new `patel-anthropic-first-gp-2626` MARGIN_CLAIMS record (`binnable: false` — a profit-milestone/dollar claim, not a percentage margin, so it cannot sit on the margin-% axis; carries its own `reason` per the registry's binnable:false convention) and as a dated paragraph in §7's reported-margin narrative, distinguishing it from every other figure in that section (all projections or modeled estimates, never a claimed realized profit).

**OpenAI — a later, differently-cut margin trajectory.** Patel said OpenAI's company-wide gross margin moved from ~30% (late 2025) to ~55% today, and — stripping away free users — from ~50% to ~65%. Added as a new `patel-openai-margin-trajectory-2626` MARGIN_CLAIMS record (`binnable: true`, point at the current 55% company-wide figure, `relation: "different-metric"`, matching the existing `openai-33-company-gm` record's pattern) and as a dated paragraph in the §10 OpenAI card, placed alongside the existing 33%/39% Information/Reuters figures it updates without replacing.

**No preset, parameter, MFU, price, tariff or architecture number changed** — both additions are evidence-board/narrative only, following the same pattern as the DeepSeek TI addition in v2.1.6. `ENGINE_REVISION` and `DATA_AS_OF` (now 2026-07-26, the date of the newest evidence incorporated) bumped accordingly; the footer release manifest and `package.json` version aligned.

## Engine b9 spec-decode LEVER — 2026-08-02 (a user-tunable speculative-decoding credit)

**What.** The calculator gains a `specDec` scenario lever: a post-roofline, **decode-only**
throughput credit, default **1.00× (no credit)**, domain [1.00, 1.60]. It is available ONLY from the
"no MTP/disagg" stack setting (0.7) — a mutual-exclusion gate, because the stack slider's own
1.0 baseline is defined partly by the same MTP evidence the lever would credit, and crediting both
would count one improvement twice. It is inert under every published-operating-point replay, and it
is **structurally exempt** on any leg whose deployed efficiency already absorbs speculation
(h20, ascend) or whose speculative status this page cannot establish (gb300, tpu7) — so 37% of the
default fleet by weight never receives the credit, and every leg says on itself what it received.

**The page's own reading does not move.** The default is 1.00× and `x * 1.0 === x` exactly, so the
gate-shut path is bit-identical to the pre-leg engine: reference blend `0.5918058739356502`,
ratified default `68.98395363429421`, membership 7/0/100, and a 10-leg × 7-scope identity fixture
minted before the lever existed reproducing byte-for-byte afterwards. The exec-summary row stays
`computed: false`. Turning the lever up declares **your** scenario, not this page's finding.

**Design first, then code, then a court for the bytes.** The design was pre-registered as
`research/b9-spec-decode-lever-memo.md` and gated through **thirteen rounds / 26 lens-runs** before
any implementation existed, then frozen by adjudication once findings had been off-mechanism for
eight consecutive rounds — the stopping rule being that a review loop converges only when the
reviewed artifact is shrinking or the defect class is closed under review, and a whole memo under
adversarial review is neither. Every byte of reader-facing copy this leg ships or changes was
**ratified by the court, not authored on the leg's own authority** — 26 enumerated spans, each
pinned as the RUNTIME STRING a reader receives rather than as source bytes, because these constants
are built by concatenation and a source-level grep proving absence proves nothing.

**Four live defects in already-shipped copy were found and corrected on the way.** The most
instructive: the page claimed acceptance figures for speculative decoding are unpublished "for any
lab", which is false against its own registry — two non-flagship anchors carry them. The true claim
is a frontier-fleet absence, and it is now what the page says, in both files that made it.

Full record: `research/b9-delta-manifests/b9-specdec-delta-manifest.md`.

## Engine b9 M6 — 2026-07-30 (FINAL-ANSWER rework; analyst-gap summary; legacy retirement)

**What.** The FINAL-ANSWER surface stops shipping one pinned reading and ships the five-part D-6
surface: **two labeled calculator readings** — the public-evidence repaired reference (algorithmic
lead 0 months, family multipliers 1.0×) and the calculator's own ratified-prior default — plus the
adopted analyst reading (above 80%, unchanged), the no-verified-central-comparator statement
(unchanged), and a bridge saying how they relate. Beside it, a collapsible **analyst-gap executive
summary** shows engine-computed single-control bridge rows from the default state, ordered by the
owner's declared plausibility order and never by margin. Every explanatory surface the milestone
reworks adopts the §20 owner rulings: legible explanation typography on the default skin
(`.explain-body`), a hyperlink-styled "Deeper explanation" trigger opening a near-fullscreen,
**non-grayed**, internally scrollable popup with a top-right X, and nothing expanded by default.

**Design first, then code — with one disclosed exception.** The design was pre-registered as
`research/b9-m6-fa-memo.md` and gated through **ten review rounds** (fresh GPT-5.6 Sol xhigh each, analysis-only) before any
implementation existed — findings 9 · 8 · 10 · 7 · 3 · 3 · 1 · 1 · 1 · 0-blocking. Three of the
first round's four blockers were **false claims in the memo's own evidence**, one later round caught
**an assertion that could not fail**, and one caught a governance question a design gate had no
authority to settle. The memo records what was wrong each time, not just the conclusions. The pre-registration claim is
made only where the commit history can back it: the memo's §§0–16 exist in commits that touch no
code at all. A later section (§17), closing five holes the post-gate owner amendment left open,
ships in the implementation commit itself — so its ordering rests on the session's account rather
than on the history, and the memo says so. One of those five is a copy amendment that the
implementation gate holds should have been adjudicated first; it ships flagged as a declared,
still-unadjudicated deviation rather than smoothed over.

**No number moved.** M6 changes which readings are LABELED and SHOWN, and how explanations are
rendered — not one computed value. The reference blend (`0.5918058739356502`), the ratified default
(`0.6898395363429421`), every fixture, every snapshot and the WIDE 180-state render hash are all
byte-identical across the milestone. The FA keeps its reference-pinned derivation and GAINS a
sibling prior reading; un-pinning it would have moved FA numeric fields.

**Speculative decoding — a lever, deliberately out of the default.** Following an owner ruling of
2026-07-30, the exec summary's spec-decode row is not a bare refusal: the lever exists, it is
deliberately not in the default scenario, and the page says so and names what would be needed to
price it. The mechanism is now vendor-officially on the record and dated (an OpenAI engineering post
of 2026-07-29 credits an improved draft/speculator model with more than 15% additional
token-generation efficiency; its 2026-07-30 pricing post says it is passing those gains on) — at ONE
lab that is not this page's flagship, with acceptance rates and draft-model details published
nowhere. That vendor claim and the independent open-stack measurements (about 14% at production-like
batch to about 60% at modest concurrency) are reported as separate classes and never summed. The
credit stays at zero here, stated as a conservative floor rather than as a finding that it is zero.
Building the control itself is scoped as its own gated piece of work.

**Superseded readings (history).** Before the b9 repair this page's evidence-informed blend read
≈37% and its declared-topology blend ≈48%, on defaults the r4 adversarial review found defective
(per-device batch/weight identity, b = 4 Trainium operating points, cross-platform throughput
coefficients, no explicit MTP, several low or analyst-set rents). Those readings are superseded by
the repair and are preserved in git history. They are not selectable, and this page does not present
them as a coherent public-market-rent case or as a central estimate of any provider's economics.
This milestone moved the last live pre-repair comparison off the FINAL-ANSWER surface and into this
note and the methods box, which is where plan D-1 says it belongs.

**Legacy retirement, honestly reported.** The enumeration D-1 required was executed rather than
asserted: all 12 perspectives, all 16 model presets, the three counterfactual fleets and the size
bookmarks were inventoried at both bases. **Nothing needed retiring** — M1's data repair had already retired the broken
readings STRUCTURALLY: no live perspective, preset or exploration route resolves through a retired
operating-point identity. That, and not numeric absence, is the property the plan actually needs;
numeric absence would be the wrong claim in both directions, since an ordinary slider state can
still round to a retired headline (several do) while a retired route could be reachable showing some
other number. So what M6 owed was placement, basis-labeling and one guard-scope gap, not a deletion
pass. An enumeration that quietly found
nothing and said nothing would look identical to one that was never run.

## Engine b9 M5 — 2026-07-28 (family sliders; algorithmic-lead prior; interlock; NOT a ship)

**What.** The mid-tier and big-picture levers (plan D-5/D-9.1; shared memo
`research/b9-m45-ui-memo.md` v2.1 §§8–13, design gate closed at `28d4b25`). Two BROAD-UNSPECIFIED
lever groups now exist. **Family efficiency multipliers** — one ±% multiplier per hardware family
(NVIDIA / TPU / Trainium / Ascend, 0.50–1.50×) applying to every card in that family, in every
serving phase, in any fleet; nothing here is sourced, and a custom leg tagged *unclassified* is
exempt and says so. **Algorithmic lead (months vs published open practice)** — how far a lab's
private serving stack is ahead of published open practice in RESIDUAL, non-hardware,
accelerator-portable efficiency this page does not otherwise model, converting through
`E = rate^(months/12)` at a ratified 3×/yr (halving ≈7.57 months; Gundlach et al.
arXiv:2511.23455 with Epoch AI data) with modeled cost-out divided by E in every phase. Its
per-lab defaults are an **owner-ratified scenario prior, not a measurement**: Anthropic /
OpenAI / Google +3 months, DeepSeek +1, the other frontier Chinese labs 0 (their published open
work DEFINES the zero), any lab with no ratified prior 0 and labeled unassessed. Under a
published-operating-point replay the slider is inert and locked at 0 — the lab's actual
efficiency is already inside the replay, so months on top would double-count.

**The interlock.** Both groups describe the same kind of unmodeled efficiency, so composing them
silently would count one improvement twice. Editing either group locks the other with the reason
stated inline; because the ratified defaults start nonzero, the FIRST family edit *replaces* the
prior — the lead is set to 0 and locked, loudly, in one attributed line — so every headline move
stays attributable. Unlocking is always available, always deliberate, and leaves a persistent
stacking banner. Explicitly-modeled levers (precision, serving regime, the cache controls) are
NEVER locked by this machinery; where they overlap a live prior you get a non-blocking warning.
In the same spirit, **serving-stack efficiency was redefined**: it now means measured stack
COMPOSITION relative to published open practice, its 1.0 tick naming the same referent as the
lead slider's zero, and the "frontier lab (assumed)" label is retired — a frontier assumption is
exactly what the lead slider now represents defensibly (1.25× ≈ +2.4 months at 3×/yr —
*figure corrected 2026-08-07; this entry and the page's own tooltip both said +2.9, which is
the months-equivalent of 1.30×, not 1.25×. The original wording is preserved apart from the
number itself, and the correction has its own entry above*). Slider
VALUES are unchanged everywhere, including the §10 dive replays.

**Also.** A touch scroll-lock (edit / keep static this visit / lock + don't ask), deliberately
distinct in icon, copy and placement from the interlock's lock. Permalinks carry the machine
state explicitly (UNLOCKED is a user CHOICE, not derivable from values) with baseline-aware
fail-closed validation; a pre-machine link gets an honest reconstruction, never an assumed FREE.
Refused permanently and stated in the methods box: the published token-PRICE series (9×–900×/yr)
measure tariffs, not serving efficiency, and capability lag (~4 months, Epoch-measured) is a
different axis that is never this slider.

**Numbers.** This is the milestone whose acceptance is that the DEFAULT headline moves: the
flagship default goes **59.18% → 68.98%**, inside the plan's ratified-prior sanity band ≈66–71,
and the move is exactly the reference with cost divided by E(+3 @ 3×/yr) = 1.31607. Everything
else is byte-unchanged and proven so: the trend-0 reference blend holds at 0.5918058739356502,
every numeric field of the FINAL-ANSWER surface is byte-equal to its pre-M5 value under an
interim reference pin (the FA states, on its own surface, that it reads at 0 months and that the
ratified-prior reading arrives with the final-answer rework), and feasibility, declared batch,
capacity and the status vectors are lever-invariant. Full old→new ledger:
`research/b9-delta-manifests/b9-m5-delta-manifest.md`.

**Not shipped.** No push, no deploy, no master commit — production stays v2.1.11.

## Engine b9 M4 — 2026-07-28 (custom fleet builder; codec v6; NOT a ship)

**What.** The owner's max-granularity path (plan D-4/D-9.2; shared memo
`research/b9-m45-ui-memo.md` v2.1, design gate closed in three Sol rounds at `28d4b25`): a
custom fleet BUILDER — the only composition-changing path — behind a "＋ Custom fleet…" entry
under the fleet switcher. Fleets are user compositions of 1–12 legs; each leg names a
CALIBRATION DONOR from the registered accelerators (the page's own LOAO test refuses MFU
transfer across platforms, so performance identity is always the donor's, disclosed per leg;
peak-rate fields render read-only in the drill-down). Editable per leg: rent $/hr, capex,
operating power, per-datacenter electricity $/kWh (live only under the owned/strategic-TCO
basis — inert-and-explained under rent, D-2), user-declared HBM capacity (BINDS feasibility
through the solver's one registry point), share %, label, family (donor's or unclassified —
exempt from the future family sliders, disclosed). Duplicates of one accelerator at different
electricity costs are first-class. Custom fleets are engine class `user-custom`: never a
default, never central-eligible, serve-feasibility fail-closed with the same welded disclosures
as named fleets; the disclosure carries a typed profile whose evidence quantities are
null-with-reason (user compositions claim no evidence). Permalinks move to **codec v6**:
custom fleets travel BY VALUE (self-contained links, fail-closed 4-level schema validation,
explicit size-guard refusal instead of truncation); v5 links keep loading under the established
drift-warning path — nothing is deprecated. Link-restored fleets are EPHEMERAL (loading a link
never writes device storage; "Save a copy" is the only write path). Persistence:
`im_custom_fleets_v1`, fail-closed and non-destructive, epoch-stamped.

**No shipped number moved**: reference blend margin byte-identical 0.5918058739356502; zero
fixture regeneration; the leg-path refactor is equivalence-proven for every existing state.
New suites: `tests/custom-fleets-b9.test.mjs` (75) + `tests/custom-fleets-cdp.test.mjs`
(15, real-browser builder round-trip); browser chain 198 → 225. Delta manifest:
`research/b9-delta-manifests/b9-m4-delta-manifest.md`. Production stays v2.1.11 — no deploy.

## Engine b9 M3 — 2026-07-28 (energy/electricity dimension; three named procurement bases; NOT a ship)

**What.** The calculator gains a physical energy surface and typed procurement bases (plan D-2/D-3;
memo `research/b9-m3-energy-memo.md`). Serving energy (Wh per M tokens) is computed for every leg
and every lens — operating power × PUE ÷ achieved throughput at the engine's own operating point,
with three declared conventions: TDP-as-operating-power proxy (typed `boardPowerW` override hook,
null everywhere — no per-accelerator operating-power measurement is public), NO utilization divisor
(the Wh figure is physical intensity; the dollar path's idle allocation is a different question,
stated), and the analyst-set 5% cache-read fraction doing disclosed proxy duty for cache-read
energy. The exact identity `electricity $/Mtok = Wh/Mtok × $/kWh ÷ util` welds the new surface to
the cost engine (suite-enforced to 1e-12). Every cost lens and every rent cell is typed to one of
three named procurement bases — **public-capacity rent** (the China public-cloud lens),
**low/committed planning rent** (the registered planning vector, this page's default), and
**owned/strategic TCO** — with a fail-closed mixing trap on every computed mix (load-bearing for
M4's per-leg overrides). Electricity DOLLARS stay explicit only under owned/strategic TCO; rent
lenses carry an embedded-in-rent chip plus the implied Wh/Mtok (info-only), because decomposing
rent without TCO assumptions would be fabrication. Registry rows additionally gain `family`
(consumed by M5's family sliders). **No shipped number moved** — the flagship reference margin is
byte-identical 0.5918058739356502, no fixture or snapshot regenerated, rent lenses byte-invariant
under kwh/pue sweeps (new suite `tests/energy-model-b9.test.mjs`, 35 assertions after the gate
fix round; browser suite 184→198 both copies, counting the full test:browser chain — run-app-tests.sh alone: 148→162; convention stated in the delta manifest). Full enumeration: `research/b9-delta-manifests/b9-m3-delta-manifest.md`.

## Engine b9 M2 — 2026-07-26..28 (topology-aware equation form; structural D1 kill; NOT a ship)

**What.** The untyped per-device `b`/`W_iter` decode identity is replaced by run B §C4's
topology-aware field set, delivered as TYPES with no implementer defaults: a REQUIRED
`decodeTrafficBasis` (3-member closed set incl. `expert-coverage`), `etaRepresentation` bound to
the basis (η may not be read outside the representation it was calibrated in), a REQUIRED
`batchQuantity` discriminator on every operating-point cell (`B_rep` DERIVED as `b × N_phys`),
`nPhysDeclared` as a registry constant firewalled from the capacity solver, declared `q`/`a`
(all 1/1) + `anchorAlreadyIncludesMTP` derived per anchor with a no-universal-multiplier guard,
per-platform prefill hooks (every row still `universal-transfer`), and `resolveDecodePlacement`
with opus as a labeled declared-surrogate. **No shipped number moved** — the reference blend
stays 59.1806% and every leg's throughput is byte-identical; six of seven legs keep the
surrogate's numbers because the corrected ones are not identified by public evidence
(memo §2.2–2.3), and every remaining D1 instance is typed, declared, disclosed and SIZED.

**The disclosure surface (family 9).** Every calculator result carries an OPEN CALIBRATION DEBT
aside: the engine-computed flagship span (53.24–64.17%, 10.93 pp — how far the §C4 form swings on
the `N_phys` declaration alone, both ends outside the sanity tripwire), per-leg η-held
re-expression sizes, the Polaris-adjudicated trn2/trn3 "may be ~15× wrong" cross-quantity
exposure (run B §A3-vs-§C1 self-contradiction, stated and typed rather than resolved without
evidence), and the §C4 replication residual on topology-aware legs. Same surface on MCP
`run_scenario`.

**Amendment 3 fold (2026-07-28).** The external adversarial review corrected the coverage
exponent to per-token distinct selection — `1−(1−k/E)^{B_rep·q}` — superseding the
with-replacement form the design memo carried; memo revised to v6, the identified span became
engine-computed (a pinned literal would have stayed stale exactly as the v5 figures did), and
probe8 re-derives every coverage-dependent figure both ways.

**Also:** `tests/roofline-core.test.mjs` repaired (11 FAILs + a crash → 478 PASS) and promoted to
GATING; new `tests/form-equivalence-b9.test.mjs` (155 assertions); family-9c browser assertions
in both suite copies. Full enumeration: `research/b9-delta-manifests/b9-m2-delta-manifest.md`.
Production continues to serve v2.1.11; nothing here is deployed.

## Engine b9 M1 — 2026-07-26 (adversarial-review repaired defaults + registry hygiene; NOT a ship)

**Why.** An owner-commissioned granular adversarial review of the calculator's input defaults
(`research/reviews/im-adv-r4-REPORT.md`; three independent legs — an Exa academic sweep and two
GPT Pro dives, blind-public and internal-registries) found that the ≈37% headline was manufactured
by a small set of identifiable defects that all pushed the same direction, concentrated in the
50% of fleet weight the engine's own eligibility harness already marked as failing both its
throughput and price evidence gates. The reductio: the two Trainium legs computed **−43.6% and
−21.5% margin**, costing output tokens at $60 and $52 per million against a $25 list price —
2.4× list-price loss on co-designed silicon that Anthropic demonstrably serves Claude on
commercially. Nobody does that. This release lands the review's exact repaired cell set.

**The reference blend moves 37.2066% → 59.1806%**, inside the review's repaired band 55.24–61.25
at its midpoint 59.20. The Trainium legs land at +34.8% and +65.1%. This is **not a ship**:
production continues to serve v2.1.11, and nothing here is deployed.

**The defects repaired (each cell carries the review's own basis; full enumeration in
`research/b9-delta-manifests/b9-m1-delta-manifest.md`):**
- **Blackwell precision double-credit.** The GB200 and GB300 decode coefficients still embedded a
  retired ×1.85 FP4 scalar and were then applied in the FP8 default scenario. De-embedded
  (0.585795 → 0.315997, 0.477845 → 0.258295). The corrected GB200 value now reproduces within
  0.06% of its own measured calibration anchor, which the double-credited value overshot by 85%.
  This defect was OPTIMISTIC — it is why the repaired blend is 59 and not 70.
- **A false calibration label.** GB300 was marked "fitted" against a calibration observation with
  `measured: null` and an assumed batch. Relabelled analyst-set at a declared assumed operating
  point; its assumed batch 128 becomes a declared workload midpoint of 64.
- **The batch unit-conflation.** The engine charged every device the full active-parameter read
  while treating batch as per-device — two incompatible conventions. The Trainium legs had taken
  AWS *tutorial* latency demos (batch 1, "up to 4") as a production operating point; the value 4
  coincidentally equalled the offline per-chip output share of a 64-wide replica. Replaced by the
  aggregate-batch surrogate 32 (midpoint of AWS's published 16-online/64-offline recipe), with
  throughput still marked UNVERIFIED. The TPU leg moves to an explicitly declared replica-resident
  traffic basis paired with a platform-native efficiency bridge — the two are a matched pair and
  cannot be split.
- **A joint fit with no data from the platforms it governed.** TPU v7 carried a coefficient fitted
  as a geometric mean over six NVIDIA/Ascend observations containing zero TPU data, against this
  project's own record of 37% average / 59% worst-case cross-platform transfer error. Replaced by
  the mean of two same-platform aggregate-form diagnostics (0.528 from a named rental anchor, 0.574
  from Google's July 2026 Ironwood serving playbook).
- **An incoherent rent lens.** Every default rent sat below its public comparator. TPU v7 takes
  Google's published 3-year committed rate ($4.20 → $5.40) and Trainium2 the AWS Capacity Blocks
  rate ($1.50 → $2.235). "Cheap rents plus pessimistic throughput" was never a conservative case —
  it was a hybrid whose errors partly cancelled. **The label "market-rent" is retired** on the
  default case in favour of the review's own wording, "low/committed planning rates."
- **Stale hardware constants.** Trainium interconnect figures (1.024 → 1.28 and 2.56 TB/s), the
  Trainium3 capacity provenance (analogy → published), and its absent native MXFP4 tuple are
  corrected registry-side, with zero effect on the displayed FP8 midpoint.

**Two assumptions that were implicit are now stated.** The review recovered both by inverting the
published cost rows rather than reading them off the page: a **cache-read serving cost of 5% of
fresh prefill** (analyst-set, unobserved, and distinct from the published 10% cache-read *billing*
tariff — it puts ~70.1% of modeled direct cost on the prefill side at the current flagship default),
and a **KV/recurrent-state charge
of ≈0.545 GB per live sequence**. Both now appear in the methods box and the tip registry with their
derivations. The review's scenario-only ledger — which cells this page can defend as a scenario and
cannot defend as a measurement — renders alongside them.

**A size-invariance property was lost, correctly.** The headline used to be identical at 2.0, 2.5 and
3.0 T total parameters. The review diagnoses that as evidence the equation omitted total/resident
geometry, not evidence of robustness. It now varies monotonically, and the three values reproduce the
review's own independently computed table to the printed digit.

**Two page-authored "80–90%" routes now land inside the band they were authored for** (≈81.7 and
≈80.7, previously ≈79.6 and ≈78.5 and disclosed as falling short). The repair moved them; no route
definition changed. The owned-TCO route still falls short of its ≥90 band at ≈89.1, and says so.

**Verification.** Four independent reproductions of the review's arithmetic, none curve-fitted: its
per-leg table (≤0.08pp), its repaired band (55.22–61.23 vs 55.24–61.25), its TPU quantification
(16.90 → 7.31/7.63/7.95), and its total-size sweep (59.87/59.18/58.49 vs 59.9/59.2/58.5). Full node
suite, contract harness, migration differential, MCP suite 39/39, worker build and the 496-point
fleet-policy harness all green; frozen protocol paths byte-untouched; `site/app.js` byte-identical.
The browser suites could not run in the authoring environment (headless Chrome unavailable) and are
owed at the gate.

## Engine v2.1.11 — 2026-07-16 (cold-review-v2.1.10 follow-up — labeling/hygiene only, no engine numbers changed)

**Why.** A fresh cold public-only GPT-5.6 Pro review of the v2.1.10 site (`research/gptpro-reports/cold-review-v2110-2026-07-16.md`) returned the same structural verdict as the v2.1.8 run: **NOT SOUND for wide sharing as a quantitative provider-margin estimate / ranking, but a strong, unusually transparent scenario workbench.** The reviewer credits the site's candor and holds that the remaining blockers are structural (the fitted-residual/extrapolation identification gap, prefill-driven default cost, unanchored default fleet) — remedied only by held-out validation or by removing provider point estimates, both of which are escalated to the owner, not attempted here. This release banks the review's cheap, non-structural, clearly-valid fixes.

**Fixes applied (labeling/hygiene; no preset/parameter/engine number changed):**
- **Gemini card self-contradiction removed** (cold #3, BLOCKING): the "Why the interval is 89–98%" paragraph asserted a floor and that sub-90% was unlikely — directly contradicting the same card's reframed "not publicly identifiable / mid-60s downside" headline. Rewritten as "Why there is no identified interval," carrying the mid-60s downside and stating no coverage probability is assigned.
- **Annex conversation-URL hygiene** (cold #22): stripped full ChatGPT conversation URLs (with conversation IDs and the project ID) from **16** published annex files — the site's §9 claim that "conversation IDs were removed" was not actually true of the shipped copy; it is now. The annex footer and §9 language were softened from "complete reports / archived as produced" to "selected public artifacts, lightly edited for release," acknowledging adopted-findings summaries, reconstructions, and partial/timeout results, and that some original working files (an expired grounding pack) are unavailable.
- **Public release identity** (cold #23): the footer relabels its SHA a "private build commit" and states plainly that the public repo is an allow-list mirror with its own commit history, so the SHA will not resolve there — reproducibility is via the byte-exact asset manifest, not the SHA.
- **README anchor status** (cold #24): corrected from "no anchor exists (TPU v7, Trainium, Rubin)" to "no anchor *fitted* — TPU v7 & Trainium2 have public anchors not yet incorporated; Trainium3 & Rubin have none."
- **LOAO naming** (cold #25): the methods note is renamed a "single-anchor (H800-trained) cross-platform transfer test," with a naming note that "leave-one-anchor-out" was a misnomer (it fits one global coefficient and predicts the rest; it does not iteratively refit).
- **Per-card range language** (cold #19): every provider card's "Why the interval is X–Y%" header is now "Why the scenario range is X–Y%," consistent with the §10 intro's "uncalibrated, no coverage probability."

**Deferred / escalated (owner decision — see `Q-AUTO-2026-07-15-COLDFIX` and the overnight handoff):** the structural blockers (calibrated uncertainty propagation into the headline; phase-specific MoE serving model; default-fleet reweighting to fitted rows; per-dive component models; separate evidence boards per estimand; removing/replacing the normalized table; annex raw-report "80% CI" language). These are the honest floor of what a scenario calculator can be, and the two cold reviews agree the site is sound *as a scenario workbench* — the gap is positioning, not defects. Credited to the 2026-07-16 external cold review.

## Engine v2.1.10 — 2026-07-15 (cold-review epistemics/labeling pass — no engine numbers changed)

**Why.** The public-only cold GPT-5.6 Pro review of v2.1.8 (`research/gptpro-reports/cold-review-v218-2026-07-15.md`) returned NOT SOUND *as a quantitative margin estimate / provider ranking* while praising the site as a transparent scenario workbench. A full-context council (4 GPT-5.6 Sol perspectives + Opus synthesis; `reports/codex-council/2026-07-15-margins-v218-review-*/`) adjudicated **GO-WITH-FIXES**: the numbers are faithful to their source dives and the epistemic machinery (registry classes, weights, ranges) is correctly built — the defects are in the prose that sits on top of it. Finding-by-finding adjudication: `research/adjudication-cold-review-2026-07-15.md`. This release lands the safe labeling/disclosure fixes; the structural residue (calibrated uncertainty propagation, a phase-specific MoE serving model, default-fleet reweighting) is escalated to the owner and the queue, not attempted here. **No preset, parameter, MFU, price, tariff or architecture number changed — labeling and disclosure only.**

**Blocking overclaims removed (P0).** (1) §5 no longer calls the 2026-07-15 blinded GPT-5.6 Pro run an "independent blinded replication" that "corroborates the central band" — it is relabeled a **blinded model-generated cross-check** and explicitly framed as a robustness comparison, *not* an independent empirical measurement or matched-estimand validation (same model family, different basket/workload; the 47–89% band is wide enough that containing ~77% is weak corroboration). The registry `who` string is renamed to match; the record keeps its `model-generated` class, zero claimant weight and 47–89 range. Every council perspective plus the cold review flagged this — the highest-convergence fix on the site. (2) The Google/Gemini §10 card headline is reframed from "unit CM ~96%" to **"not publicly identifiable"**: the ~96% is demoted to an explicitly-unanchored internal-cost scenario, aligned with the card's own "no public basis to compute Gemini's margin from TPU economics" admission. The engine value and the calculator's dive-replay are unchanged; only the card's prominent, screenshot-bound label changed.

**Default-fleet honesty (P1 / cold B3).** The hero's unanchored-share warning was factually wrong ("TPU/Trainium have no public serving anchors") and undercounted the problem. It now says TPU v7 & Trainium2 have public serving anchors that are **not yet fitted** (Trainium3 unanchored), and it names the GB300 leg — 15% of the default fleet priced at an analyst-estimated **$6/GPU-hr with no public rack rate**. §4 adds a matching clarity clause distinguishing the honest "function of rack-hour price" framing (of the newly-documented bridge anchor) from the deployed calculator's $6 scenario input.

**Scenario-not-estimate framing (P1 / cold B1, #29–30).** The persistent result-surface identity strip now carries a "**selected scenario output — not an identified estimate or probability interval**" chip (screenshot-safe). The normalized §10 table is retitled "Same-assumption scenario outputs … (not a ranking)" with the no-uncertainty-propagation caveat moved to the top of the block. The §10 intro reframes "reproducible" to **headline-matched** (the calculator matches each dive's rounded *result*, not its method), and the methods-box "Reproducibility" bullet is retitled "Implementation & regression consistency — not empirical validation" and now states that out-of-sample flagship validations, calibrated coverage tests and production-telemetry matches are all zero.

**Source-caveat & provenance fixes (P1 / cold #5, #17, #25–28).** AMD: the unverified timed-out figures (396–408 gen tok/s, 64–178 s TTFT, ≈$2/M TensorWave proxy) are removed from the page entirely and marked excluded pending source recovery; the confirmed 2,256 / 3,500+ tok/s/GPU figures are labeled **aggregate**. DeepSeek 70–80% relabeled **press-reported** (not "company-reported"), page and registry. Trainium 405B precision corrected to "FP8-rescaled target weights in a BF16 execution setting, plus speculative decoding." TPU v7 $6.42/M anchor labeled a vendor saturation run with no achieved TTFT/TPOT. NVIDIA: B300 $0.289/M labeled an accelerator-rental floor before non-GPU overhead; AWS Capacity Blocks labeled reserved/upfront. The FP4 1.85× multiplier is labeled a whole-model system benchmark / upper-bound scalar (selective-quantization models won't realize it fully). "Realized billings/price" → "modeled effective billings/price" on the hero and in the methods box. The Rubin bar in the generation chart no longer prints an absolute $/margin figure — it renders shape-only, marked "unpriced," with a caption caveat. "Full, unedited" annex language corrected to "full public reports," with a one-line disclosure of the public-release hygiene pass (conclusions unchanged). The serving-feasibility tile is labeled a weight-storage floor, not an SLO/topology check, and stops calling TPU/Trainium/Ascend "GPUs." Version identity aligned: footer engine string, `ENGINE_REVISION` and `package.json` all now read v2.1.10.

**Regression coverage.** `tests/snapshots.test.mjs` gains a content-contract block (§6e) asserting each P0/P1 label is present and each flagged overclaim string is absent, so a future edit can't silently reintroduce them. Full gate green (engine + traffic contract + browser suites). Credited to the 2026-07-15 external cold review and the internal council.

## Engine v2.1.9 — 2026-07-15 (EXPEDITED release #4: chart-gen billing-mix correction)

**Why expedited.** An external, public-only cold review of v2.1.8 (`research/gptpro-reports/cold-review-v218-2026-07-15.md`) identified one directly code-checkable MAJOR defect; the owner approved applying only that item immediately ("Expedite tonight") rather than holding it for the next weekly cycle, leaving the rest of the review's findings unadjudicated.

**Chart-gen billing-mix bug, fixed.** The "Cost per 1M output tokens across hardware generations" chart (`#chart-gen`) computed its billed price mix with a local formula that used the serving-side `cacheHit` value as the billable cached-input share and ignored the separately editable `billCacheHit` field entirely, along with `cacheWriteShare`/`cacheWriteMult` cache-write billing — all of which the hero's headline margin already respected. Defaults coincide (`billCacheHit: null` assumes equal to serving reuse, `cacheWriteShare: 0`), so the two surfaces agreed for every casual viewer; the divergence only appeared once a viewer moved the cache-billing controls away from their defaults, at which point the hero and the chart silently disagreed under supposedly identical "current settings." Reproduced directly against `site/engine.js` before fixing: at Opus/median with `blend` forced 100% onto the H200 generation and `billCacheHit=20` / `cacheWriteShare=30` / `cacheWriteMult=150` (all non-default), the hero priced the mix at $5.245/Mtok (79.80% margin) while the chart's old formula priced it at $3.268/Mtok (67.58% margin) — a 12.2-point margin gap on the exact same hardware and settings. Fixed by extracting the billing math the hero already used into one shared engine function (`computeMix()`, consumed by both the existing blended `workload()` and a new single-accelerator `workloadOnHw()`); the chart and the existing per-accelerator margin chart now both call `workloadOnHw()` instead of any local reimplementation — there is no longer a second price-mix formula anywhere in the codebase for either surface to drift from. A grep of `site/app.js` for other local `priceMix`/`costMix` arithmetic found none: every other chart and table already computed margin via the shared `workload()` function; chart-gen was the sole offender.

**Regression coverage, verified both ways.** Two new checks were added and each was confirmed to fail against the pre-fix code before being confirmed to pass against the fix: (1) `tests/snapshots.test.mjs` gained a numeric parity assertion (`workload` vs `workloadOnHw` under non-default `billCacheHit`/`cacheWriteShare` — crashes with `workloadOnHw is not a function` pre-fix) plus a source-guard check that `renderGenChart()`'s body calls `workloadOnHw(` and no longer contains `cacheReadMult`/a local `priceOut +` formula; (2) `tests/run-app-tests.sh` gained an end-to-end browser check — a crafted permalink (blend 100% H200, `billCacheHit=20`, `cacheWriteShare=30`, `cacheWriteMult=150`) renders the hero at "unrounded: 79.80%" and the chart's H200 bar at "79.8% margin" (pre-fix the bar read "67.6% margin," which the test now asserts is absent).

**No preset or parameter numbers changed** — this is a bug fix to how one chart computes an already-correct set of inputs; the engine's fitted MFUs, prices, cache tariffs and architecture assumptions are untouched. Credited to the 2026-07-15 external cold review.

## Engine v2.1.8 — 2026-07-15 (EXPEDITED release #2: GB300/B300/GB200/Rubin + CloudMatrix/Ascend anchors)

**Why expedited.** Second same-day expedited release: a round-2 GPT-5.6 Pro dive package targeted the NVIDIA forward side (Blackwell-Ultra/Rubin) and Huawei Ascend/CloudMatrix — two of the model's remaining anchor-quality gaps — and the owner ordered both applied immediately ("Expedite tonight") rather than held for the next weekly cycle.

**GB300 NVL72 moves from throughput-unanchored-in-practice to audited.** MLPerf Inference v6.0 (Apr 1, 2026) contains valid, reproducible single-rack GB300 generated-throughput results on DeepSeek-R1 FP4 — NVIDIA Interactive 250,634 / Server 400,437 / Offline 647,076 gen tok/s/rack; Nebius Server 575,580 / Offline 673,936 (the strongest one-rack results). **GB300's rack rental price remains genuinely unanchored** — no numeric rate is public on AWS, CoreWeave, Nebius, GCP, Azure, OCI or Crusoe as of Jul 15, 2026 — so the model documents GB300 $/M-output as a function of rack-hour price rather than a point estimate. The cleanest present Blackwell-Ultra anchor is a same-provider B300 pair instead: Nebius's 8-GPU MLPerf Server result (60,413 gen tok/s) at its own public $7.85/GPU-hr rate ⇒ **$0.289/M generated output tokens**. A GB200 rack bridge via AWS's Capacity Block rate ($761.904/rack-hr) gives $0.881/$0.630/$0.435 per M output at Interactive/Server/Offline. Added to §4's narrative and hardware table, and to the `gb200`/`gb300` dossier notes in `engine.js` — no flagship engine numbers changed.

**Rubin's absolute-economics negative is confirmed, precisely scoped.** The same dive found no MLPerf submission, no InferenceX result (listed "Coming Soon"), and no public rental or purchase price for Rubin or Rubin Ultra. NVIDIA's only public claim is relative — up to 10× tok/s/MW and ~1/10 cost per M tokens vs GB200 NVL72 on Kimi-K2-Thinking (32K-in/8K-out) — not an absolute anchor, and NVL144/Rubin CPX/Rubin NVL8/R100/VR200 should not be collapsed into one generic "Rubin" figure. Added to the `RUBIN` dossier note and §4's hardware table/narrative.

**CloudMatrix 384 / Ascend 910C gets its first full-system generated-throughput anchor.** FlexNPU (arXiv:2606.04415, Jun 3, 2026) served DeepSeek-R1 W8A8 on a full 384-card system at ≈633,000 generated tok/s system-wide (≈1,646/card) under TTFT≤1s/TPOT≤50ms — an end-to-end, SLO-constrained measurement, distinct from the isolated-decode anchor (1,943 tok/s/NPU at batch 96) already fitted in this model. No public CM384 hourly rental price exists, so throughput is anchored but cost is not. A cross-source proxy for the older 910B chip (JD xLLM's 709 gen tok/s/card × China Telecom CTyun's public RMB 38.45/hr instance rate) gives **≈$2.09/M generated output tokens** (range $1.61–2.80/M) — medium-low confidence, cross-source reconstruction, not audited COGS, and not the 910C row. Added to §4's narrative, the hardware table, and the `ascend` dossier note; the new full-system anchor differs from the currently-fitted isolated-decode anchor and is **queued for a considered refit**, not applied tonight (structural-change guardrail).

**Total-vs-generated correction preserved.** The widely-repeated "6,688 tok/s/NPU" CloudMatrix figure is confirmed as PREFILL/INPUT throughput and an idealized perfect-expert-balancing projection (the measured default is 5,655); the "1,943 tok/s/NPU" figure already on this page is DECODE at batch 96 (≈20 gen tok/s per active sequence) — these must never be blended as simultaneous end-to-end throughput. No site text conflated them, so this is a preserved-correct finding, not a fix.

**Ascend 920 exclusion confirmed.** No official product page, benchmark, deployment, cloud SKU or price exists; Huawei's own Sept-2025 roadmap goes 910C → 950PR → 950DT → 960 → 970 with no 920. Already excluded from this model (no HW row exists); the dive's negative is now documented explicitly in the `ascend` dossier note and §4 narrative.

**Annex.** Both new dive reports are published verbatim in the research annex (`research/dive-nvidia-forward.html`, `research/dive-ascend.html`).

**Deferred to a considered pass (not done tonight).** The CM384 full-system FlexNPU anchor (≈1,646 gen tok/s/card) is a materially different measurement basis from the isolated-decode anchor (1,943 tok/s/NPU at batch 96, ≈9.5% MFU) currently fitted to the `ascend` row's `effDec`/`effPre`. Reconciling the two — and deciding whether the roofline should refit to the full-system SLO-constrained number — is a structural engine change, out of scope for tonight's additive release; logged as a new queue item for the next considered pass.

**No preset or flagship engine numbers changed** — every item above is an evidence-quality upgrade or a precisely-scoped negative finding; the cost model's fitted MFUs, prices and architecture assumptions are untouched.

**Addendum (same day, annex hygiene pass on four dive reports).** The TPU, Trainium, blinded-replication and AMD dive pages (`research/gptpro-reports/dive-{tpu,trainium,replication-blinded,amd}-2026-07-15.md`, all first published in v2.1.7) had their provenance headers condensed for public share ahead of wider circulation: recovery-mechanics language describing the private CDP/browser recovery technique was replaced with plain "recovered from the ChatGPT conversation history after the dispatching session failed" phrasing; internal conversation-ID values were removed from the provenance tables; raw `[cite: turn…viewN]` / `[filecite: …]` interface citation markers were stripped throughout (sentence text otherwise untouched); "commissioned by owner" became "commissioned". The AMD page's honest 120-minute-hard-timeout provenance narrative is preserved intact. Verbatim pre-edit copies are archived at `research/gptpro-reports/archive/pre-hygiene-2026-07-15/`. Beyond the header cleanup and marker removal, the findings/analysis prose is unedited — **no engine, data, or claim content changed.**

## Engine v2.1.7 — 2026-07-15 (EXPEDITED release: TPU/Trainium anchors, blinded replication, AMD correction)

**Why expedited.** Same-day second release: a "Targeted 4" GPT-5.6 Pro dive package landed four items the owner ordered applied immediately rather than held for the next weekly cycle — a correction to a figure already live in v2.1.6, plus three new evidence-quality upgrades. All four ship together as v2.1.7.

**Q-007 correction, PARTIAL (AMD/DeepSeek non-NVIDIA throughput).** v2.1.6 credited DigitalOcean/RadixArk's "3,500+ tokens/sec/GPU on AMD MI350X/MI355X" claim without qualification. A follow-up dive (reasoning-summary only — the source hit the ChatGPT-Pro MCP's 120-minute hard timeout) argued the chip is MI355X-only and the headline figure is total, not interactive, throughput. Verified against primary sources before shipping (full chain in `logs/weekly/2026-07-15-expedited.md`): **confirmed** — MI350X is not an InferenceX-benchmarked SKU at all, and the primary June 2026 InferenceX article independently describes extending the concurrency sweep to 1,024 as drawing out "the high-throughput, low-interactivity end of the frontier," closely matching the dive's own framing. **Not confirmed** — the dive's precise numeric split (3.56–3.67K total vs ~396–408 generated tok/s/GPU, 64–178s TTFT) and its derived ≈$2/M-output-token TensorWave anchor: this lives in InferenceX's interactive chart data, not extractable text, and could not be independently pinned. §10's DeepSeek card is corrected to reflect only what verified (chip identity, total-vs-interactive-throughput caveat); the unconfirmed figures are explicitly withheld and flagged for a future CDP recovery pass, not shipped as fact.

**TPU now has real cost-per-output-token anchors.** A dive found named-model, named-precision public serving benchmarks for TPU v5e, v6e and v7/Ironwood — the strongest is Qwen3-Coder-480B-A35B on four Ironwood chips, 518.86 output tok/s/chip, deriving $6.42/M output tokens on-demand ($2.89/M at 3-yr commitment) from current GCP list prices. This is real evidence-quality progress over "peak FLOPS only," added to the Google §10 card, the §3 anchor-fits methodology, the subtitle, the methods-box bullet and the hardware table — but the anchors are documented, not yet fitted into this roofline's MFU (no flagship engine numbers changed). The load-bearing negative from the same dive is preserved and stated explicitly: there remains no public basis to compute Gemini's margin from TPU economics — external rental list prices are not Google's internal fleet cost, and no Gemini-SKU→TPU mapping is public.

**Trainium2 gets a narrow engineering anchor; Trainium3 and Project Rainier remain unanchored.** Two AWS Neuron tutorials on a full `trn2.48xlarge` (16 chips), paired with the current Capacity Block rate, give infrastructure-only candidates ($68.90/M output tokens for Llama 3.3 70B, $98.65/M for Llama 3.1 405B) — engineering reference points (batch=1, concurrency=1), explicitly not production TCO. Added to §6 (Anthropic's own fleet section) alongside the more load-bearing negatives the same dive documented: no public Trainium3 throughput or instance price exists at all; Project Rainier is confirmed running Claude inference on ~500,000 Trainium2 chips (AWS, Nov 2025) but discloses no allocation, utilization, tokens or rate; no Trainium MLPerf submission exists through v6.0; AWS's 30–40% price-performance claim is unreproducible.

**Independent blinded replication corroborates the flagship band.** A dive rebuilt this page's own unit-serving-margin metric from scratch, bottom-up from public anchors, under an explicit instruction not to consult this site or its repository — and disclosed that neither ever appeared in its search results. Result for an equal-dollar GPT-5.5/Gemini 3.1 Pro/DeepSeek V4 Pro basket: central 73.3% (cross-model median 71.8%), range 47–89%. This page's deployed default (~77%) sits just above the central estimate and inside the range. Added as a new `gptpro-blinded-replication-733` record in the MARGIN_CLAIMS registry (its own zero-claimant-weight group, same pattern as the existing GPT-5.6 Pro consult record) and as a corroboration paragraph closing §5.

**Annex.** All four dive reports (including the AMD reasoning-summary-only one, clearly labeled as partial) are published verbatim in the research annex for the first time this release (`research/dive-tpu.html`, `dive-trainium.html`, `dive-replication-blinded.html`, `dive-amd.html`).

**No preset or flagship engine numbers changed** — every item above is an evidence-quality upgrade, a documented negative finding, or a corrected/hedged prose caveat; the cost model's fitted MFUs, prices and architecture assumptions are untouched.

## Engine v2.1.6 — 2026-07-15 (weekly update: DeepSeek TI margin report + AMD MI350X throughput)

**Evidence board (Q-001).** The Information reported (Jul 14–15) DeepSeek's annualized revenue nearing ~$500M, a ≈¥50B (≈$7.4B) raise at a ≈¥500B (≈$74B) valuation with STAR Market IPO prep, and a follow-up 70–80% V4 API gross margin (up from an earlier ">50%" figure). Added to the evidence-board claims registry as a reported, different-metric figure (api-product-line-GM) spanning the 60–80% and 80–90% buckets — the first company-reported post-V4 margin datapoint identified in this research, versus prior community backsolves. §2a's disclosure narrative gains a dated paragraph noting the directional corroboration (with the metric-distinction caveat kept explicit, as for the 545%/84.5% figures). §10's DeepSeek dive card gains a dated paragraph with the TI figures and TeorTaxes's fleet backsolves (~5,662 GPUs at list-price/100% utilization vs ~9,000–18,000 at realistic bundle-cost utilization) as an independent check against the dive's own fleet-mix uncertainty, with the paid-API-only scope caveat TeorTaxes states himself.

**Non-NVIDIA production throughput (Q-007).** DigitalOcean and RadixArk publicly reported serving DeepSeek V4 on AMD MI350X/MI355X at 3,500+ tokens/sec/GPU (HIP graphs, a claimed ~10× gain over an undisclosed baseline), attributed to a June 2026 InferenceX result — added to §10's DeepSeek card as a dated third-party data point. It does not resolve the card's own "V4 production throughput" known-unknown (it is not DeepSeek's fleet), but it is evidence non-NVIDIA serving of V4 is technically viable at competitive per-GPU throughput.

**No preset or parameter numbers changed** — both items are reported/community figures and infrastructure disclosures, not first-party pricing or architecture disclosures; the engine's cost model, presets and dossiers are untouched. Both items independently corroborated by a recovered GPT-5.6 Pro consult (a private working-copy document, not part of the published annex), whose own confidence ratings (medium / medium-low) are reflected in the hedged prose above.

**Addendum (same day, repo-governance pass).** A GPT-5.6 Pro inspection of the freshly public repository (21 ranked findings; adopted where valid) drove: the annex renderer no longer converts single-tilde pairs into strikethrough — "~¥50B (~$7.4B)"-style money figures had been rendering as struck text in three annex pages (the fix lives in the generator; preserved source documents stay byte-identical); the public snapshot is now self-contained (MCP package build/test inputs, worker overrides, the feedback admin page and runbook ship with it) and self-verifying (GitHub Actions runs the engine, contract, browser, MCP and feedback-bundle checks on the public tree); the README was restructured around a reproduce-one-result proof block with the metric's exact list-price conditional and accurate review-history framing; CITATION.cff, SECURITY.md, CONTRIBUTING.md and third-party font notices added; the private release script now regenerates the grounding ledger and annex before the test gates rather than after.

## Engine v2.1.5 — 2026-07-15 (release-pass remediation: permalink round-trip fix + source-currency corrections)

**Permalink round-trip defect (P0), fixed.** The v4 encoder diffed the scenario against global DEFAULTS while the loader restores a clean-identity link as preset-plus-diff — so a field the user set TO a global-default value that happens to differ from the preset's own default was omitted as "unchanged" and silently reverted to the preset value on load. Concretely: GPT median with active set to 300B round-tripped to 105B, moving the margin 77.9% → 92.3% — a 14.4pp silent shift on an ordinary user action, in a shared link. The encoder now diffs against the loader's own baseline (the declared model/perspective/traffic identity, resolved exactly as the loader resolves it); MODIFIED-identity links keep the global-DEFAULTS baseline because that is the baseline the loader actually uses for them. 66 new release assertions sweep every model × every global-default-valued field case plus the concrete reproduction. Found by the 2026-07-15 GPT-5.6 Sol release inspection; links minted before this release that hit the dropped-field case are unrecoverable (the information was never encoded) — the engine-revision drift warning already flags them on load.

**Source-currency corrections (P0).** The incompressible-knowledge-probes citation now carries the paper's v2 figures (arXiv 2604.24827, revised Jul 5, 2026: median fold-error 1.48×, 86% within 3× — the page had v1's 1.59×/87.6%), pinned to the revision date. §4's cumulative 2024→2027 hardware-cost multiplier ("roughly 6–25×") did not reproduce from the page's own per-generation chain; it now states the product of that chain (~5–16×), with the commissioned fixed-model projection's band cited alongside (~4.5–10× by the 2027 Rubin ramp, ~7–17× by mature Rubin).

**Smaller corrections.** §10 xAI no longer says the prospectus "discloses a fleet of >440k accelerators" — it disclosed cluster counts; the total is a derivation (the dive always labeled it SPECULATION-derived-from-DISCLOSED). Freshness stamps unified at July 15, 2026 (the landing text said July 11 while the engine said July 13; all 12 tracked list prices were re-verified against provider pricing pages today — 12/12 confirmed, including Kimi K2.7 Code's $0.19 cache-hit after a K2.6-page false alarm). The annex generator's skin-boot extraction is now genuinely fail-closed (exactly-one-match asserted, overmatch into a foreign script refused) — previously a duplicated or unterminated marker could silently ship wrong boot code despite the fail-closed claim. The live feedback form posts via its custom domain instead of the name-bearing workers.dev host (deployed same-day, ahead of this release).

**Adjudicated, not changed (Sol inspection findings held up as design).** The Sonnet 5 tariff flip already has a stale-loud release gate (a traffic-contract assertion fails after 2026-08-31, and deploy.sh runs it before every deploy). Model switching in a MODIFIED state deliberately freezes model-owned fields (documented "Residual 2"; every surface labels the state modified and its permalinks travel the full numeric state, so nothing silently misattributes). Provider-dive uncertainty language lives in preserved consult documents, which this annex archives verbatim rather than edits. Queued for the next update (research/update-queue.md): grounding-ledger source rows gain URLs/dates; DeepSeek's announced mid-July peak surcharge needs live verification; Opus 4.7 fast-tier wording flips on its Jul 24 retirement; The Information's DeepSeek ~$500M ARR / 70–80% V4 API gross-margin report (Jul 14–15) enters the evidence board.

## Engine v2.1.4 — 2026-07-13 (evidence-scent label pass + outside-review remediation)

**Evidence-scent label pass.** Page-set scenario values lose every remaining trace of false empirical scent: "top-decile"/"near-top" stack wording (implying a measured distribution that does not exist) became "aggressive"/"above-baseline" with explicit page-set qualifiers; the utilization slider's "typical" tick — contradicted by its own tooltip's "no representative industry distribution is public" — became "central scenario"; "300B is our median read" became "this page's working estimate"; the "DeepSeek 5:1" tick was corrected to the file's own measured 4:1 profile; "FP8 (frontier default)" is now "(assumed frontier norm)" (closed labs don't disclose serving precision); "evidence median" — naming a fallback that is actually the central scenario, in three places including report prose — now says what the code does; and dossier rows where page-chosen levels wore COMMUNITY ESTIMATE labels were reconciled to SPECULATION. A pre-existing display incoherence was fixed structurally: Kimi/Grok model dossiers annotated traffic parameters with dive-mix sources while rendering Reference-convention values beside them — the dive-only annotations are removed and the dive mixes keep their provenance in the effective-traffic line, where those values actually render. The exploration-surface lint's regex gap (caught "assumption" but not "assumed") is closed. Four GPT-5.6 Sol find→fix→verify rounds, looped to clean on P0/P1.

**GPT-5.6 Pro outside-perspective review, adjudicated and remediated.** A cold outside-expert review of the live site (18 findings; archived with the adjudication in this annex) was adjudicated finding-by-finding against what the site already says: most findings were already mitigated by welded caveats the reviewer had no context for, several relitigated deliberate design, and six were valid — all cured here. §3's "from first principles" (a derivational status the very next paragraph disowns) became "from an explicit cost identity". §5's "for any frontier model" universal was falsified by the site's own engine (DeepSeek V4 Pro at its own list never enters the 90–95% zone on a GB300 fleet at any utilization) and is now bounded to Western-lab list tariffs with that counterexample stated. The §3/methods-note validity domain now states the size axis plainly: all published serving anchors are ≤~50B-active models while flagship scenarios assume 120–300B active — the model's largest unanchored extrapolation. §5's "margin machine" carries the billable-share caveat inline (86.2%→61.5%). The Zhipu card no longer converts the audited 18.9% segment margin into a "floor" (it is a segment-margin anchor) and its reseller price ceiling is now stated as conditional — the same conditionality the Kimi card always carried. Two currency errors fixed against primary sources: §5's "~500k Trainium" contradicted the site's own hardware table and Anthropic's Apr 20, 2026 statement (">1M Trainium2 in use"); TPU7x GA is Mar 31, 2026 per Google's release notes, not Apr 22 (a Cloud Next conflation).

**Provenance upgraded, not just defended.** The Anthropic inference-infrastructure margin record (38% → >70%, SemiAnalysis) had been carried as reported-unverified via X relays under the registry's mis-attribution rule ("the newsletter is paywalled"). The margin sentence in fact sits in the newsletter's free portion; it was fetched directly, archived verbatim in this annex (curly apostrophe and all), and the record now quotes the primary source — the same upgrade pattern the Patel/Sequoia citation still awaits. The grounding ledger's version stamp — which claimed "cannot drift" while stamping the previous engine version — regenerates with this release (the no-drift guarantee now includes its own stamp).

**Still owed (unchanged).** The five-human comprehension test remains the open ship gate; the Patel primary-citation swap and Zephyr re-capture remain flagged owner actions.

## Methodology v2.1.3 — 2026-07-12 (margin-range evidence board + de-named routes)

**The redesign.** Person-named analyst presets (TeorTaxes, Zephyr, Dylan Patel/"semi", "skeptic") are reworked into a **mechanism-first calculator** — the hero margin is still driven only by model/traffic/lens, never by a target — plus a first-class secondary **margin-range evidence board** fronted by a route-first entry ("what would have to be true for a ~90% margin?") rather than an evidence catalog a reader has to read past. A typed `MARGIN_CLAIMS` registry bins **claims, not people**: floors like Dylan Patel's "north of 80%" render as `compatible-with` every bucket at or above 80 (never as interval membership — a floor is not a ceiling); Zephyr's 90–95% is carried in its own unnamed-subject group, never presented as an Anthropic claimant; company-GM figures (Zephyr's own 70%), reported figures, DeepSeek's disclosure anchor, and the GPT-5.6 Pro model-generated consult each sit in visibly distinct, differently-labeled groups so no serving-context number can pose as the calculator's unit metric. The four analyst presets are absorbed into de-named, page-authored **"[range exploration]" routes** — numeric-identical to the retired presets, migrated so old permalinks and browser-saved presets resolve to the same numbers under the new ids. Routes exist only where popular discourse actually places a claim: the 60–80% bucket has none (no unit-serving claimant sits there — the central scenario is its own anchor), and the ≥90% bucket has exactly one, because the engine's own reconstruction of the cited "increase the batch size … drive margins from 90% to 95%" mechanism tops out around 87–89% at market rates — the routes that did clear 90% were owned-fleet procurement stories, not the batch mechanism, and were kept separate rather than mislabeled.

**Gated the way v2.1.x releases are.** A pre-implementation plan review (GPT-5.6 Pro plus a four-persona council) ran before any code, and a second, blind four-persona final gate ran against the built M1–M4 milestones. The final gate returned **NO-SHIP**, unanimous, with a P0 cluster — all remediated in this release: share-link **identity integrity is now fail-closed** — a v4 token whose declared model or perspective does not resolve is refused whole and the default state renders, rather than applying the numeric diff under a substituted or mislabeled identity (the exact corruption class v2.1.1 had already fixed once had regressed on two new paths: copying a link after mutating a loaded route, and a crafted token naming a nonexistent model while real selectors stayed on screen); saved presets now carry typed origin and reload as an explicit modified state rather than silently inheriting whatever lens happens to be selected at load time. Board framing lost its "who claims/who places frontier inference margins there" language — an umbrella phrasing that quietly turned a floor into an endorsement despite the correct row-level "compatible with" badge — for explicit relation-aware wording, and reported figures are now labeled "reported figure," never "verbatim," when no archived quotation exists. The hero's ">90%" caption is now interval-aware: it asserts "within the cited 90–95% range" only when the value actually lands there, and says the value sits *above* that interval otherwise (it had been claiming every ≥90% result, including ~100%, was "within 90–95%"). The model-sizing name block (which had been leaking real names into a loaded route's dossier under a prose disclaimer) moved into a structurally separate, separately-collapsed panel outside the route dossier — quarantine by structure, not by caveat. The evidence board also picked up an intentional 2×2 layout at desktop widths (auto-fit had been stranding the fourth bucket card 3-plus-1) and the v4 permalink schema now validates metadata-carried traffic against the same bounds the sliders enforce, closing an out-of-range/bad-mode injection path.

**Also fixed a pre-existing v2.1.2 defect** the deep review surfaced along the way: moving a traffic slider or tick updated the hero margin correctly but left the dossier's "Effective traffic mix" line — and the accompanying status note — showing the previous value, because `renderAll`/`fullRefresh` never re-rendered the dossier on a plain state change (only certain load paths did). The hero margin itself was never wrong; only its own explanation of itself was stale. The dossier now re-renders on every state change, so the displayed traffic identity always equals the resolved traffic and the number the margin was actually computed from.

**Source provenance (honest).** The four load-bearing X posts behind the routes and claim records were re-checked against primary sources rather than re-trusted from the archived sweep alone. Dylan Patel's "north of 80%" is now independently **confirmed at a primary source** — the Sequoia Capital podcast, 2026-07-02, transcribed by three separate outlets — where the site had only a secondary clip account (PodcastAlphaX); swapping the citation to the primary transcript is a recommended follow-up, not yet done. The two TeorTaxes posts and the Zephyr post that the ≥90%/80–90% routes and the Zephyr unnamed-subject claim rest on are **unretrievable by automated means** — X is login-walled for this research and no Wayback or mirror capture was found — so their durable provenance in this repo is the dated archived research sweep (`research/grok-sweep-margin-claims.md`), transcribed at the time, not a live-primary re-verification, and that is stated plainly rather than papered over. Zephyr's load-bearing "names no lab" scope point in particular rests on that sweep transcription and is flagged for manual re-capture; the site errs conservative in the meantime — it treats the 90–95% figure as about an unnamed provider and never attributes it to Anthropic.

**Still owed (not softened).** The five-human, 90-second, 4/5-comprehension-bar test remains **open and unrun** — it is the actual gate this whole redesign exists to pass, and the two review rounds (plan review, final gate) are a code/copy/provenance pre-check with no established error rate against real readers; they do not substitute for it. A smaller, label-only gap also remains: some status notes omit the traffic-mix figure even though the dossier's own traffic line always carries the correct number (no display shows a wrong value, only an incomplete one in a few paths) — logged in BACKLOG rather than left undocumented.

## Methodology v2.1.2 — 2026-07-11 (traffic-mix axis + reception audits)

The plan for this release was itself reviewed pre-implementation by GPT-5.6 Pro and a four-persona council (both archived in this annex); both said "revise before implementing," and the revised plan adopted every P0 condition (the final gate later found one adoption — the traffic state contract's application layer — incomplete, and a second remediation round closed it; see below) — including renaming the new axis honestly (TRAFFIC MIX, not "workload"), spec-first fixtures, and redesigning the planned named-person reception simulations into corpus-bounded source-faithfulness audits with no role-play and no approval outputs.

**Traffic mix — I/O + cache (the scoped ontology step; the full resolver remains future work).** A third selector owning only ioRatio/cacheHit: provenance-named profiles (no generic "chat/coding" archetypes), model defaults that visibly re-resolve, replays as atomic composites with locked traffic, an anti-lens-shopping span computed at byte-identical traffic ("cost-lens span at [profile]"), v3 permalinks carrying traffic identity, numeric-identity migration for v2 links and browser-saved presets, and a 180-pair frozen baseline proving parity (documented intentional deltas only). The state contract was committed as failing fixtures before implementation.

**Coherence cuts.** §6 became an assumption-by-assumption divergence table (the full 54-minute consult is now published verbatim with a SHA-256 stamp — recovered from the receiving session's transcript after an earlier revision mislabeled a 39-line digest as "verbatim"); §8 states a longitudinal selection rule; §10 cards carry metric/lens/traffic lines, top-3 evidence lists with the dominant driver marked, and would-update-on triggers.

**Durable exports.** The full roofline derivation (verbatim, SHA-256), the adopted grounding ledger (machine-generated from the preset registry — the authoritative parameter record), and a dated GPT-5.6 Pro re-emission of the expired preset pack with a checked delta table (the ledger wins).

**Final gate — NO-SHIP, then round 2.** The four-persona council final gate NO-SHIPPED the first remediation with a precise list: a schema-downgrade permalink forgery (a `v3.` token declaring an inner v2 schema routed through the lock-overriding legacy-migration path and rendered ≈71.6% under the locked replay's name), type-only sanitizer checks, replay "exit" that was actually a warning on one input path, unimplemented v2/browser-preset identity migration, an incomplete metric rename, a lens span computed at the hidden model default under locked replays, and a release stamp that made the served tree unreproducible. All were fixed in a second round, each encoded as a permanent regression test; the reception resolution ledger's affected rows carry the reopened-and-re-closed history. GPT-5.6 Pro's independent final gate ran in parallel (archived in this annex).

**Reception phase — and what it caught.** Nine simulated-reader audits ran against the frozen preview (five third-person source-faithfulness audits for TeorTaxes, Zephyr, Dylan Patel, fleetingbits and the @_xjdr deployment numbers; four anonymous archetypes: ML-infra engineer, calibration reviewer, cost-accounting reader, information-scent lurker). They found 16 P0-class defects the two prior review rounds missed — among them: the metric name "list-price" contradicting the realized-billings denominator; a forged-permalink path that bypassed replay-traffic locking; the §3 equation prose claiming interactivity applies to prefill; the TeorTaxes preset pricing H100 below its own cited $2.40 anchor; a site-authored 8:1 ratio presented as ncode deployment telemetry; §1 and dossier scope-expansions of Zephyr's unnamed-lab allegation; unknown /research/ URLs serving the homepage as HTTP 200; and the normalized table falsely claiming the §10 ranges "still apply." All findings are dispositioned in the published resolution ledger (45 fixed after two rounds, 0 rejected — five first-round closings were reopened by the final gate and re-closed; the ledger keeps that history); the hero was de-named (bands describe cited ranges, never people), analyst presets carry always-visible PAGE-AUTHORED RECONSTRUCTION boundaries, precision dropped to whole points with the unrounded value as a diagnostic, and the release gates grew to 499 engine + 220 contract assertions plus a 17-check application-level browser suite that renders the page headless and replays the live attack payloads. Raw outputs, prompts and the corpus manifest are published verbatim. **This exercise is not validation and does not satisfy the still-open 5-human-reader test.**

## v2.1.1 editorial addendum 2 — 2026-07-11 (source-fidelity rider)

Two attribution-fidelity defects found live by the v2.1.2 plan-review round (four-persona council, empiricist) and fixed: the §2c _xjdr blockquote had silently normalized "2.1 sec TTFT overage" to "average" and dropped the "61 sec p95 TTFT (1M ctx)" and "0 chat logs kept" lines — it now matches the archived sweep verbatim ("overage [sic]"), and the prose carries the 61-second p95 as the observed cold-prefill tail. Also repaired a grammatical break the Jukan removal introduced in §6. Both plan reviews are published in this annex (`consultation-2026-07-11-plan-review-*`).

## v2.1.1 editorial addendum — 2026-07-10 (late)

Removed the §1 "attribution check" passage about Jukan and the related §6/method-note handle-dispute sentences (owner call): since no margin claim of his was ever found, the two research engines' disagreement over his handle changed nothing in the analysis and spent reader attention on research-process trivia. His two substantive citations remain as bare links — "inference is memory" (§4) and the $5B-spend→$15B-ARR lease-economics read (now in §7, labeled a spend-to-revenue multiple, not a margin).

## v2.1.1 — 2026-07-10 (final-review gate repair)

A second four-persona council review plus a GPT-5.6 Pro final gate ran against the deployed v2.1 and returned NO-SHIP with a surgical fix list (archived in this annex). All gate items repaired; the numeric engine is untouched (the reviews verified 5/6 dive replays to a point and called the arithmetic sound):
- **Anti-lens-shopping range rebuilt.** It had unioned analyst positions and scope-incompatible lenses, producing absurd endpoints (V4: −867%); it now spans only compatible pure cost lenses, exclusions stated inline, membership asserted by tests.
- **xAI lenses now genuinely hold the dive operating point** (3:1 uncached — they had silently inherited the default 15:1/60% workload, violating the page's own "only the valuation changes" claim). The opportunity-cost lens recomputes to ≈27%, in line with the dive's ~29%; the "model-shape divergence" note is retired.
- **Attribution honesty in the attribution mechanism:** three positions mislabeled quoted-position (their parameter vectors are reconstructions around a quoted anchor) reclassified.
- **§10 language regressions removed** (surviving ranking phrases; stray "confidence interval" wording) with a lint in the release suite.
- **Permalinks now serialize preset identity + engine revision** — fixing an identity corruption where a shared link's numbers described one scenario while the selectors, dossier and lens range described another — and warn on cross-engine loads.
- **The release suite and roofline diagnostic are deployed as public artifacts** under /tests/, making the "runnable" claim literal; the Moonshot dive replay surfaces its output-token margin (the §10 metric) in the hero tile.
- Stale figures corrected (assertion count; the §7 bridge dollar example now quotes undiscounted list ≈$3.72/Mtok); the roofline verdict rephrased ("could not be executed as designed"; exactly-determined rather than non-identifiable).
- **GPT-5.6 Pro final gate (SHIP-WITH-FIXES) items, same release:** remaining DeepSeek-exclusivity claims removed; provenance language corrected (model reviews are separately run adversarial executions, not "independent external reviews"; annex wrappers now distinguish verbatim artifacts from consultation summaries); the two loaded §1 quotations replaced with neutral summaries (verbatim posts remain in the annex sweep); tariff scenarios now flagged at selection, on the hero tile ("Scenario result") and under the normalized table; **hard incompatibility gating** added (out-of-scope pairings suppress the headline; a force-exploratory escape keeps a persistent label); §2d reconciled with §8; Google/xAI ownership language de-categoricalized; the 2027 line recast as a frozen-assumption sensitivity; permalink share message now carries the full privacy warning; footer carries a release manifest; the v2 changelog's superseded GB200 figure annotated.

## Methodology v2.1 — 2026-07-10 (evening)

Backlog implementation round, consulted and gated: a four-persona council design review (typed-ontology and ship-list adjudications), a GPT-5.6 Pro preset grounding pack (first-party tariff verification), and a GPT-5.6 Pro roofline consultation (negative result, adopted) — all archived in this annex.

**Position dossiers.** Every model and perspective preset now expands into a dossier: whose position it is (quote-anchored), an attribution-honesty line (quoted-position vs reconstruction vs calculator-synthesis — a quote anchors a claim, not a parameter vector), every parameter it pins with source + evidence label, what it assumes away, and what would falsify it. Values render live from the presets (set-canonical), so dossiers cannot drift; the test suite asserts bidirectional key coverage.

**Typed scenario ontology.** The perspective dropdown now types its entries — [lens] / [analyst] / [replay] / [SLO replay] — making visible that cost-accounting lenses, quoted analyst positions and measured-operating-point replays are different kinds of object. The hero tile shows the margin range across all lenses for the selected model, as a guard against lens-shopping.

**New presets (per the council's ship list).** Models: DeepSeek V4-Flash (disclosed 284B/13B), GLM-4.7 (disclosed 355B/32B — a distinct price floor from 5.2), and GPT-5.6 Terra/Luna + Gemini 3.5 Flash as clearly-marked TARIFF SCENARIOS (price is the only identified quantity; excluded from the normalized table). Perspectives: xAI cash-marginal and opportunity-cost lenses (xAI-scoped, pairing-warned), China public-cloud on-demand (≈6.15× IDC rates, dated), and an Ant Group H20 SLO replay (Pro tier, measured-operating-point convention). Rejected with reasons: Kimi K2.6 (economically redundant), Grok 4.3 (adds surface, not identification), Anthropic-strategic (merged into the existing strategic-partner lens), Epoch (deferred until a roofline exists), reported-margin-implied (an inverse manifold, not a preset — now a §7 diagnostic sentence). All tariffs verified at first-party sources on 2026-07-10.

**Roofline: a documented negative result.** The commissioned compute/HBM/fabric roofline (one shared residual, no per-platform efficiency) predicts throughput-oriented operating points within 2–16% but fails the whole-platform gate (Ascend@15ms −39.8%) and the preregistered validation is formally unrunnable on public data (one fitted parameter vs one training platform; no untouched holdout). Anchor fits remain primary; the roofline ships as `tests/roofline-diagnostic.mjs` and the methods note carries the full result.

**Also:** permalinkable scenarios (versioned, dated, with a share-time privacy note), pairing warnings for cross-scoped model/perspective combinations, cache-WRITE billing (revenue-side, conservation-safe, default-off; storage remains a documented omission), and the §7 bridge re-framed in dollars per Mtok with a named unreconciled-accounting-perimeter residual.

## Methodology v2 — 2026-07-10

Revision driven by two independent external reviews, both archived unedited in this annex: a four-persona GPT-5.6 Sol council with Claude Opus synthesis, and a GPT-5.6 Pro adversarial review. Both reached the same verdict — sound thesis, publication-blocking presentation — and their findings substantially overlapped.

**Calculator (engine):**
- Fixed a preset-merge defect where the perspective presets silently overwrote provider-specific cache-read tariffs with Anthropic's 10% (Grok bills 25%, Kimi 20%, GLM 19%, DeepSeek V4 0.83%). Model-owned fields (architecture, prices, cache tariff, native workload, fleet) now always survive perspective changes; a deterministic test asserts it.
- OpenAI and Google presets previously inherited Anthropic's TPU/Trainium fleet blend; they now carry their own (Hopper/Blackwell partner fleet; TPU).
- Repaired the DeepSeek prefill calibration: the disclosed 73.7k input tok/s/node **includes the 56.3% disk-cache-hit share** and is no longer used as a fresh-prefill benchmark. Fresh prefill is reconstructed net of cache (~4,026 tok/s/GPU, MFU ≈15%; v1 used the contaminated 34%). The redundant utilization divisor in the disclosure replay (the disclosed throughputs already encode average deployment) was removed. The replay now reproduces the disclosed 84.5% at **84.0% with honest accounting** — v1's exact 84.6% match was an artifact of two canceling errors.
- H20 and Ascend 910C defaults changed to the hardware dive's **neutral** recommendations (17% / 7% MFU); the optimized published anchors (714 / 1,943 tok/s) are shown separately in the §3 table and reproduce at 18% / 9.5%.
- GB200 calibration row corrected: at the time of v2 the model produced ~9,122 tok/s (a documented −10% miss). **Superseded within v2:** source verification showed the 4.5 PF figure was B200's — with GB200's correct 5.0 PF dense per GPU the anchor reproduces at ~10,135 tok/s at the same 15% MFU (precision basis still not fully pinned; treated as an upper anchor).
- Subscription card: API-equivalent usage is now converted to tokens at the undiscounted **list** price mix — v1 ran it through the discount sliders, so an unrelated pricing assumption changed a user's inferred consumption.
- New **"§10 dive replay"** perspective: every provider card's headline regenerates in the calculator within ~1 point; a 29-assertion test suite (`tests/snapshots.test.mjs`) runs before deploys.
- Ran the review's leave-one-anchor-out experiment: a single scalar MFU **fails to transfer** across platforms (mean error 38%). Consequences adopted throughout — see the [LOAO methods note](https://margins.ashitaorbis.com/research/methods-loao.html).

**Report:**
- Headline metric renamed to **list-price direct-serving contribution margin**, with a definition and a methods box above the calculator; "at today's prices" now carries an effective date.
- §10 reframed as **provider-native case studies, not a ranking**: per-card metrics labeled (Moonshot's figure is output-token-only), "80% CI" relabeled judgmental uncertainty ranges, scalar badges supplemented with five-dimension evidence profiles, DeepSeek/Zhipu badges changed to "mixed," and a separately-labeled normalized-lens table added. Fixed the card that called DeepSeek "the lowest estimated margin" (Zhipu's central was lower).
- §2 corrected: DeepSeek's 84.5% is a *theoretical* list-price margin (realized revenue was materially lower); "10–45× below Anthropic's list" replaced with like-for-like ratios (3.6× cache / 9.1× input / 11.4× output); "only primary disclosure in existence" narrowed to "clearest identified in this research."
- §5 verdict made explicitly conditional on procurement and operating point; "everyone agrees on the token math" replaced (architecture, workload and latency remain first-order unknowns); the Anthropic–xAI $1.25B/month capacity contract (≈$5.27/bundled GPU-hr) promoted into the invoice argument.
- §8 subscription claims about the median subscriber and the top decile deleted — the cited investigations characterize the tail, and no usage distribution is public.
- Provenance claim corrected ("every load-bearing claim links to a primary source" → linked and labeled by source class); tone pass (slur elided from a quotation; register neutralized); author line added.

## v1 — 2026-07-09

Initial publication: Anthropic-first investigation, interactive calculator, per-provider deep dives (§10), Chinese accelerator support, research annex.

## b9 UX-B — the report stops shouting all of itself at once (2026-08-03, `f361c29`)

**What.** Owner ruling R-4 says the long explainers at the bottom "shouldn't be fully expanded to
begin with." Measured, the full report was **63,907 characters visible at first paint** across ten
always-open sections — the page's only violation of that ruling. Those ten sections now collapse,
each keeping its heading visible, and every long explanatory surface on the page — the six provider
dossiers, the methods box, the perspective and model dossiers, the evidence catalog, the range
detail — gains a legible measure and a "Deeper explanation" route into the near-fullscreen popup M6
built. On a touch screen the inline expansion is replaced by that popup, which is what R-2 asked
for; on desktop the collapse stays and both routes work, which is what R-3 asked for.

**The report's section headings deliberately stay outside their own collapsible bodies.** That is
not a style decision. Two separate runtime extractors serve `report-s1`…`report-s10` to MCP clients
by slicing from one `<h3 id="sN">` to the next, so wrapping a heading inside its `<details>` would
hand consumers structurally unbalanced fragments. Keeping the heading outside also means a deep
link still lands somewhere visible when its section is closed.

**What an MCP consumer receives did not change by one byte, and that is executed rather than
claimed.** The expand/collapse label is interface chrome, not part of the document, so it is
stripped from the two transport extractors by a rule scoped to the report wrapper alone — the six
provider-dossier summaries inside §10 are ordinary `<summary>` elements and had to survive, which
they do by construction. All eleven ids (the ten sections plus the whole front page) are
byte-identical to a fixture captured before any of this markup existed, in both normalized and raw
text, and identical between the Node and Worker transports. The test carries a control that fails
when the strip is switched off, because a parity test that cannot fail proves nothing.

**Nothing is copied into the popup.** The dialog holds the *same live nodes* the page was showing,
moved and moved back — so the evidence catalog's buttons still work inside it, nested disclosures
keep their open state, and no id is ever duplicated. That made the restore path load-bearing for the
first time, and it was not safe: a failed restore used to be swallowed while the dialog was removed
anyway, taking the live content with it. Restoration now carries fallback coordinates, the dialog is
only removed once every moved node is provably back in the document, and if both routes fail the
dialog is kept and flagged rather than deleting anything. The suite injects both failures.

**Two defects the acceptance suite found in the author's own work.** Moving the popup trigger above
each collapsible body — so that expanding §10 does not bury the affordance 33,472 characters down —
made that trigger the heading's immediate sibling, which silently broke the rule that opens a
section when a citation links to it. And selectors like `#prov-openai > .prov-body` stop matching
while an ancestor is temporarily relocated. Both are fixed; the first keeps the broken version as a
test control.

**No number moved.** The 180-state render hash is unchanged, both tripwires re-derive exact, and the
count of claim-bearing render sites is identical before and after — moving an already-rendered node
into a dialog is not a second rendering of it.

## b9 UX-A — the tooltip notes become reachable, and the page gets one dialog owner (2026-08-03, `032e32f`)

The page carried explanatory notes that no reader could reach. `TIPS.specDec` is 3,352 characters;
it rendered a 1,328px box in an 844px viewport positioned at `top: -494px`, and because the tooltip
is `pointer-events: none` there was no way to scroll to the part that was cut off — which was the
*beginning*. `showTip`'s clamp was one-sided on both axes, so any box taller than the viewport
produced a negative coordinate that nothing corrected; at a 320px viewport the horizontal bound went
negative too and every tooltip sat 10px off screen.

The clamp is now two-sided on both axes and holds even if the CSS caps fail. Clamping alone would
only have truncated the note silently, so every `ⓘ` control now opens the full text in the
explanation dialog — on touch devices that is the only route, since no hover exists there and the
tap target was 16×12 CSS px. It is 44×44 there now. The hover preview stays deliberately
non-interactive: drawing a scrollbar on text you still cannot reach would have been the same defect
wearing a fix.

Adding a second dialog client is what forced the rest. The final-answer dialog closed through a
private path and removed dialogs by its own marker, which with two clients could leave two dialogs
open at once. Both now route through a single coordinator with one idempotent close bound to every
exit — including a throwing payload builder and a page rebuild that destroys the trigger the dialog
came from. The final-answer surface itself is unchanged: its payload construction is byte-identical
and its own browser suite passes completely unmodified.

No computed value moved. The 180-state render hash is unchanged and both tripwires re-derive exact.
