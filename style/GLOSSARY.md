# Glossary — Frontier Inference Margins

**Status:** v2, 2026-09-08 — v1 folded with GPT Pro session 3 (`pr-20260908T151150Z-7018e3`,
gpt-6-pro, the enthusiast reader). Leg `im-language-rationalize` (Fable 5.1 xhigh); ruling
`d-20260908-im-language-rationalized-with-glossary`. Companion to `VOCABULARY.md` (which decides
the one name per idea; this file explains each name). STAGED for the release edit — it ships as a
`/glossary` page and as the target of in-copy links; nothing is live until the deploy gate.

**Who this is for.** Someone who follows AI closely and wants to know whether the "90% margin"
claim holds up, but has never priced a GPU-hour and does not know what prefill is. Each entry
is one plain definition, then the technical detail only where the page's numbers need it. It
does not talk down: the topic is heavy, and the reader is assumed to want the real mechanism.

**What session 3 changed in this file.** Every entry that turned a page assumption into a
general fact was re-cut so the assumption governs the sentence ("the page assumes 5%" first,
the consequence second); every ratio is now a ratio; the opening scenario, the planning
baseline and the lead-adjusted baseline are three entries; *fitted* replaced *measured*;
*serving deployment* and *weight placement* replaced one "placement"; η and MFU are distinct;
ten entries the reviewer found missing were added (§J); and the slogans went.

**When a term gets a link in copy (the rule).** A term below gets a glossary link at its
**first use in each top-level section** of the main page (the methods box, each of §1–§10,
the range explorer, each provider card) and at its first use on each annex page; never twice
in one section; never in a sentence that already defines the term inline (the link goes on
the next use); never inside a source's quotation. Product names and units (H100, TB/s, kW) are
never linked; number formats (FP8, FP4, INT8, BF16) link to **precision** at their first use.
The link text is the canonical term itself. The three terms that most need the link on their
first unexplained use are **cost basis**, **utilization** and **prefill**; **serving margin** is
defined in the page's opening sentence and needs no link there.

Entries are grouped by the question a reader is asking. **Bold** words inside an entry are
other entries.

---

## A. "What number is this page actually giving me?"

**serving margin** — The page's one metric. For one token, at a stated **traffic mix**: one
minus (**serving cost** ÷ **effective price**). It answers "of each dollar this provider bills
for tokens, how much is left after the direct cost of serving them?" Full technical name, used
once in the methods box: *unit direct-serving contribution margin*. "Unit" = per token;
"direct-serving" = only the costs of serving, as the page draws that boundary (see **serving
cost** for what is inside it and what is not); "contribution" = what is left of the price after
those costs. It is *not* a company's gross margin (see **company gross margin**).

**blended** — Computed across the whole traffic mix: fresh input, cached input and output
tokens together, each at its own price and cost. The page's serving margin is blended unless
a card says otherwise.

**output-token margin** — The serving margin on output tokens alone. Shown for one provider
(Moonshot) whose traffic mix is not public. Not interchangeable with a blended figure: output
tokens carry the highest price and the highest cost, so the two are different calculations and
are never ranked against each other.

**company gross margin** — What a company's own accounts report: (revenue − cost of revenue)
÷ revenue, under that company's accounting policy. Where the object is a product line or a
segment, the page says **product gross margin** or **segment gross margin**. Different
companies put different things in cost of revenue (cloud commissions, free-tier compute, model
training), so comparing two companies' gross margins requires matching those boundaries first;
none of them is a serving margin either way. §7 of the report walks from one to the other.

**cohort margin** — A figure some reports give for one group of users, always named with the
group and the cost the source counted: "OpenAI's reported 70% compute margin on paying users"
is (that group's revenue − the compute cost of serving them) ÷ that revenue. Wider than a
token, narrower than the company. Cited; never computed here.

**reading** — One number the calculator produces at one complete set of settings. The page names
three scenarios a reading can belong to, and each has its own entry below: the **opening
scenario**, the **planning baseline** and the **lead-adjusted baseline**.

**opening scenario** — The settings the calculator loads first. The page's built-in default is the
GPT-5.6 Pro estimate's own settings, the built-in opening state since 2026-08-09; a reader can make
any other scenario the default for their own browser from the result window, and then that is what
their browser loads first. The built-in default's author states 83.1% at **list price** for its
settings; the calculator reads about 82% at the same settings today, because the calculator has
changed since that figure was stated, and the estimate card says how. The built-in default is *not*
the **planning baseline**, and it is not the calculator's engine defaults either — those carry no
assumed lead. The estimate card that supplies those settings says that it is the built-in default.

**planning baseline** — The page's planning scenario with no assumed efficiency lead: the
**default fleet**, **planning rent**, 50% **utilization**, the **Reference mix**, the adopted
2.5-trillion-parameter Opus, **algorithmic lead** 0 months, **family multipliers** 1.0. About
58% for Opus at **effective price**, and about 63% at **list price**. It removes one assumption
and keeps the others — the fleet, the model size, the utilization, the prefill transfer and the
analyst-set rents are all still assumed — and it is reproducible by a reader because every one
of those assumptions is stated, not because they are all public facts.

**lead-adjusted baseline** — The **planning baseline** plus the adopted 3-month **algorithmic
lead** for the closed labs. About 68% for Opus at **effective price**. It is a labeled assumption,
not a measurement, and it is not the page's built-in opening scenario. Older text on this site called it
the calculator's "ratified-prior default" or "own default state"; both names are retired, the
second because the calculator's engine defaults carry no lead at all.

**estimate** — A number a named **estimator** produced, as distinct from a reading the
calculator produced. The two estimate cards at the top carry GPT-5.6 Pro's 83.1% (at list) and
Fable 5's ≈77% (at effective price), each with the estimator's own **range** — note the two
billing bases differ, so the pair is not an interval.

**estimator** — Whoever produced an estimate: a model run (GPT-5.6 Pro, Fable 5) or a named
analyst. The page reports estimators' figures at their own settings and does not average them.

**claim** — A margin figure asserted by somebody outside the page (a post, a podcast, a
report). §1 collects the claims; the range explorer lets you see what settings would move toward
each one. Note the two axes do not line up one-to-one: *claim* says the figure came from outside
and is under examination, while **reading** says the calculator computed it here. An outside
analyst's **estimate** is both — a claim by origin, and an estimate by kind — and the page treats
it as a claim when it is being examined and as an estimate when its settings are being loaded.

**range** — The span of a number across declared alternatives, always with the alternatives
named: an **estimator's stated range** ("GPT-5.6 Pro's 68–92%"), a **price-preset range** (the
planning baseline across the page's price presets, 58–83%), a **single-setting sensitivity**
(utilization 50%→35%: 58%→40%), a **traffic-mix envelope** (37–66% across the named mixes).
None of these carries a stated coverage probability — nobody has asserted "95% of the time" —
so none is a confidence interval; where an archived report says "80% credible interval", that
is quoted as that report's own claim.

**sensitivity** — How far a reading moves when one setting moves and everything else stays.
The page's largest: **active parameters**, **utilization**, and the **cost basis**.

**counterfactual** — A reading at settings the page does not adopt, shown to answer "what if".

**floor** — A number a stated fact bounds from below, always with the fact: "the B300 rental
floor, $0.289 per million output tokens" means "rent a B300 node at Nebius's public price, run
it at its published benchmark speed, and the accelerator cost of an output token is that much —
before any overhead, idle time or non-GPU cost". It bounds *that* configuration at *that* price
and speed; another operating point can be cheaper. An assumed baseline (the planning baseline) is
not a floor in this sense at all.

**markup versus margin** — A markup is profit ÷ cost; a margin is profit ÷ price. DeepSeek's
famous "545% cost-profit ratio" is a markup; the same numbers as a margin are 84.5%.

**percentage point** — The difference between two percentages. A margin moving from 51% to
30% has fallen 21 percentage points, not 21 percent.

---

## B. "Where do the prices come from?"

**list price** — The published price per million tokens. The three categories the page's
basic example uses are fresh input, cached input and output ($5 / $0.50 / $25 for Claude Opus
in mid-2026); providers also publish batch prices, cache-write premiums and context-length
tiers, which the page handles where it says so.

**cache-read price** — The list price of a cached input token; for Anthropic, 10% of the
fresh-input price. The page assumes serving a cached token costs 5% of a fresh prefill, so
under that assumption cached traffic carries a higher margin than fresh traffic — if the
customer is billed at the cache price for it (see **billable cached share**) and before the
cache storage and transfer costs the page does not model.

**cache write** — Some providers charge a premium to *create* a cache entry (OpenAI 1.25×;
Anthropic 1.25× or 2× depending on how long it is kept — its **TTL**, time to live). The page
models the premium on the revenue side, off by default; the serving cost is unchanged because
the prefill happens either way.

**batch price** — The discounted price for requests that can wait (usually half price). The
page assumes a *batch share* of traffic (15% by default) at this price. Not the same "batch"
as the serving **batch** size.

**discount** — The page's assumed negotiated discount off list for large customers (5% by
default). Together with the batch share it turns list price into **effective price**.

**effective price** — What the page assumes the provider receives per million tokens at the
chosen traffic mix, after the cache-read price, the batch share and the discount. Modeled, not
observed revenue; the page says "realized" only for a figure a source reported as received.
**At list** means batch share and discount both at 0%.

**at list** — Computed with no batch share and no discount. The provider cards and the GPT-5.6
Pro estimate are at list; the planning baseline and the Fable 5 estimate are at effective
price.

**token, input, output** — A token is the unit models read and write, roughly three-quarters
of a word of English. Input tokens are what you send (the prompt, the conversation so far);
output tokens are what the model writes back. Prices and costs are quoted per million of each.

---

## C. "What does it cost to serve a token?"

**serving cost** — The page's modeled direct cost per million tokens: the accelerator time a
token needs (from **throughput**), priced at the **cost basis**, divided by **utilization**, plus
whatever **serving-stack overhead** the selected cost basis carries as a separate line. The
page does not separately model support, research, sales, revenue shares, free traffic, or
unbilled retries and storage.

**cost of revenue** — The accounting line a company subtracts from revenue before its gross
margin. What a given provider puts there is its own accounting policy, and the differences are
exactly what makes two companies' figures hard to compare: the compute that served paying traffic
is the largest piece, but whether free-tier compute, cloud commissions and model training sit here
or elsewhere varies, and where a specific company draws that line is often not disclosed. The
page's §7 discussion includes free traffic; the attribution annex records the Anthropic
commission-classification question as unverified. Also called COGS.

**accelerator** — Any chip built to run AI models: an NVIDIA GPU, a Google TPU, an AWS
Trainium, a Huawei Ascend. The page says "accelerator" when the sentence applies to all of
them and the product name when it means one.

**accelerator-hour** — The unit accelerators are rented in: one accelerator for one hour.
Tables write $/GPU-hr or $/chip-hr with the accelerator named in the row.

**cost basis** — Which *kind* of price the cost side uses for an accelerator-hour. The page has
exactly three, and which one you pick moves the answer more than any slider:

- **on-demand rent** — a cloud's published hourly rate, no commitment. Publishing a rate does
  not guarantee capacity at that rate; the page uses it as a price, not as a promise.
- **planning rent** — the page's default: for each accelerator, a low or committed-term rate
  the page registered as its planning assumption (an annual-commit, a 3-year, a capacity-block
  rate, each quote keeping its own term). A scenario vector, not one observed invoice. The page
  plans on it because large labs are assumed not to pay on-demand rates; the on-demand case is
  kept as a price preset for readers who want it.
- **owned cost** — what it costs to own the accelerator: purchase price spread over its life,
  power, the datacenter, operations. Also called total cost of ownership (**TCO**).

The page does not silently mix bases inside one number; where a fleet declares some legs rented
and some owned, the section says so. On the xAI card the same GPU-hour is valued at $0.60
(cash), $2.40 (owned) or $5.27 (what a customer pays for it), and the margin reads about 91%,
63% or 19% accordingly.

**price preset** — A named set of accelerator prices on one cost basis and nothing else ("the
China public-cloud prices"). Distinct from a **scenario preset**, which also sets the fleet.

**cash cost** — The xAI report's short-run lens: power and operations only, nothing toward
paying the hardware off. A floor for "what does one more token cost tonight", not a business
cost.

**opportunity cost** — The xAI report's third lens: what a GPU-hour would fetch if sold to a
customer instead (Anthropic pays xAI about $5.27 per bundled GPU-hour). It applies only to
capacity that is actually substitutable for that contract — the ~325,000 contracted GPUs, not
every GPU-hour in the fleet.

**TCO** — Total cost of ownership; see **owned cost** (the hourly cost of an accelerator the
lab owns: purchase price spread over its life, power, datacenter, operations).

**searched range** — The low–high figure a declared dial range produces. The page finds it by evaluating the corners of the box those ranges describe, and by sampling each axis to check whether the margin moves in one direction along it. That is a *search*, not a proof: where the modeled fleet changes shape inside the box — a width, batch or membership transition — a setting between two samples can compute outside the range the search found, and the page says so rather than calling the range attainable. A range whose own middle assumption falls outside it is labeled as such, because the two are then not describing the same set of settings.

**utilization** — The share of paid accelerator capacity that is actually serving billed
tokens. Fleets are sized for the busiest hour, so much of the time much of the fleet is idle
but still paid for. The page's planning default is 50%; no frontier provider's serving occupancy
is in this page's evidence record, and the sweep for one returned a rigorous negative.
Two cautions: a replay that sets utilization to 100% is using a per-occupied-chip convention
from its source, not claiming full occupancy; and utilization (time and capacity in use) is a
different thing from the **efficiency factor (η)** (how much of a chip's ceiling it reaches
while in use).

**utilization divisor** — How the page charges idle capacity: serving cost is divided by
utilization, so the tokens that were served pay for the time nothing was. At 50% utilization each
served token is charged twice the accelerator cost it would carry on a fully busy fleet. Moving
utilization from 50% to 35% takes the Opus planning baseline from 58% to 40%.

**serving-stack overhead** — The cost of everything around the accelerator: host CPUs,
networking, the control plane, reliability engineering. Where it enters depends on the cost
basis: under **owned cost** it is a modeled line; under rent it is assumed inside the rent,
except where an estimator declares an add-on (GPT-5.6 Pro adds 10%). Not to be confused with
**serving-stack efficiency**, which is about throughput.

**hardware family** — The four groups the page's **family multipliers** act on: NVIDIA, TPU,
Trainium, Ascend.

**PUE** — Power usage effectiveness: total datacenter power divided by the power the
computing equipment draws. 1.25 means a quarter again on top for cooling and distribution.

**TDP** — Thermal design power: the wattage a chip is rated for. The page uses it as a
stand-in for operating power because no per-accelerator measurement of real serving draw is in
this page's evidence record.

---

## D. "How fast does an accelerator serve, and how does the page know?"

**throughput** — Tokens per second one accelerator produces at an **operating point**. It enters
the cost identity as a divisor, so doubling it halves the accelerator cost per token. Which input
moves a *particular* reading most depends on the scenario and on how far each is varied — on the
xAI card the **cost basis** moves the answer further than any slider does. Written "tokens/s per
accelerator" in prose and tok/s/GPU in tables. Three figures get mixed up in sources: output
(generated) tokens only, input tokens only, and both together; the page says which it means.

**operating point** — The conditions a throughput number applies at: batch size, context
length, precision and how the model is arranged across chips. Either measured (an anchor's
conditions) or assumed (an analyst-set row's). A throughput figure quoted without its operating
point is not enough for a matched cost comparison.

**batch** — How many requests an accelerator serves at once (a serving setting, not the Batch
API's billing share). A bigger batch spreads the cost of reading the model's weights over more
tokens, so cost per token falls; at a fixed hardware speed it can also mean each user's tokens
arrive more slowly, which is the trade-off a deployment weighs against its latency target. The
page does not model latency targets directly, so it does not compute that side of it. Where the unit is in question the page says so:
the open Trainium question is whether its recorded batch is per chip or per replica.

**anchor** — A published, real-world throughput measurement the page's model is fitted to
reproduce. The best one: DeepSeek's March 2025 disclosure, 1,850 output tokens/s per H800.
Other published measurements the page cites but does not fit (MLPerf's GB300 results, the
CloudMatrix paper) are *supporting observations*, not anchors. There are very few anchors, and
none for a model as large as Claude Opus; the page says so.

**calibration class** — How each accelerator's throughput number was set (a rent has its own
source label). Four classes, and the borrowed one always says which kind on the row:

- **fitted** — the coefficient reproduces a published measurement on that accelerator (the
  H800 from DeepSeek's disclosure; the GB200 from a published vLLM run). Fitted to a
  measurement, not a measurement: it proves the model can hit the one number it was tuned to.
- **borrowed** — *within-family* (H100 and H200 from the H800); *same-platform bridge,
  analyst-set* (TPU v7); *out-of-family joint fit* (Trainium2 and Trainium3, fitted across
  other hardware families, with no serving measurement of their own).
- **analyst-set** — set by judgment at an assumed operating point. The GB300 (no anchor); and
  the H20 and Ascend 910C, whose published measurements informed the calibration but whose live
  values are separate judgment-set numbers that do not reproduce them.
- **projection** — no public serving measurement and no public price; only the announced shape
  of the chip (Vera Rubin).

The grounding ledger keeps the finer internal names.

**efficiency factor (η)** — The fraction of the active limit — whichever of compute, memory
bandwidth or interconnect is binding — that the model assumes an accelerator reaches at an
operating point. Set per accelerator by its calibration class. Not the same quantity as
**MFU**.

**MFU** — Model FLOPS utilization: the fraction of a chip's *peak compute* actually used. An
older, compute-only quantity; the 2026-07-10 cross-platform transfer test used one global MFU
and it failed. The live model does not use it — it uses the **efficiency factor (η)**, which is a
fraction of the *active roofline limit* rather than of peak compute. MFU still appears in the
methods note and throughout the archived hardware reports and consults, in their own words.

**roofline** — The throughput ceiling set by the slowest of three limits: how fast the chip
computes, how fast it reads its memory, how fast it talks to its neighbours. For decoding a
large model the memory and interconnect limits usually bind, which is why "inference is a
memory problem" and why a chip with more memory bandwidth can beat one with more raw compute.

**cross-platform transfer test** — The page's published falsification test (2026-07-10): fit
one **MFU** on the DeepSeek H800 anchor and predict every other accelerator from its spec
sheet — mean error 37%, worst 59%; it fails. A roofline follow-up fitted the same way did
better at most points but still failed its whole-platform gate (worst −40%, on Ascend at a
15 ms latency point). Consequence for *this page*: it keeps a separate coefficient per
accelerator rather than one shared number, and accelerators without an anchor carry real
uncertainty. (The note was originally titled "leave-one-anchor-out";
that name is retired.)

**serving deployment** — Which accelerators actually serve a given closed model, in what
shares. No provider's current serving allocation is in this page's evidence record — the public
facts are purchase and commitment announcements, which are a different thing. The page's fleet is
an assumption, and every reading says
so.

**weight placement** — How a model's weights are spread across the chips of one leg (the
*replica width* the page's capacity solver finds). A modeled arrangement, not a disclosure.

**replica, sharding** — One copy of the model running across a group of chips is a replica;
sharding is splitting the weights among those chips. A bigger model needs more chips per
replica, and how many is one of the things the page solves for.

**memory-planning convention (loaded bytes)** — The page's rule for how much accelerator
memory a model's weights occupy at a given precision (1 byte per parameter at FP8 by default).
It decides whether a leg is **feasible**, capped, or infeasible; it is a planning convention,
firewalled from the throughput calibration.

---

## E. "What actually happens when a model serves a token?"

**prefill** — Reading the input: the model processes the whole prompt in one parallel pass
before it writes anything. Compute-heavy. On the page's planning baseline about 70% of modeled
cost is prefill, because inputs outnumber outputs 15 to 1.

**decode** — Writing the output, one token at a time, each step re-reading the model's weights
and the **KV cache**. Memory-heavy. The output price is high partly because decode is the
expensive, slow part.

**KV cache** — The per-request working memory: the keys and values the model computed for
every earlier token, kept so decode does not redo them. Grows with context length and eats
accelerator memory; together with the weights it is one of the constraints on batch size.

**cache read** — Serving an input token whose prefill was already done for an earlier request
and stored (the shared start of a long conversation, a system prompt). The page assumes it
costs 5% of a fresh prefill; the provider bills it at its **cache-read price** (Anthropic: 10%
of fresh input) — subject to the **billable cached share**.

**accelerator memory (HBM)** — The high-bandwidth memory on the accelerator itself, where the
weights and KV cache live during serving. Capacity (GB) limits what fits; bandwidth (TB/s)
limits decode speed.

**interconnect** — The links between accelerators (NVIDIA's NVLink; Google's ICI). A large
model is spread across many chips, so decode speed also depends on how fast they exchange
data. A **rack** is the set of chips on one fast interconnect.

**precision** — The number format the model runs in: FP8 (8-bit floating point), FP4, INT8,
BF16. Lower precision means smaller weights, faster memory reads and more throughput, at some
quality risk. Which precision a closed model is actually served at is usually not public; the
page states its assumption per row.

**parameters, active and total** — A model's weights. In a **mixture of experts** model only
some weights (the *active* parameters) run for each token; the rest (up to the *total*) sit in
memory. Active parameters drive compute per token; total parameters drive memory. Claude Opus's
sizes are not public; the page's working assumption is 2.5 trillion total, 300 billion active,
and that assumption is the single most consequential slider on the page.

**mixture of experts (MoE)** — A model whose layers hold many parallel "experts" and route
each token to a few of them. It is how a model can be enormous in total and cheap per token.

**context length** — Input length plus output length for one request. The page uses two
values: the **terminal context length** (input plus the full output — sizes the working
memory) and the **representative decode position** (input plus half the output — sets decode
speed).

**speculative decoding** — Guessing several output tokens at once with a cheap "draft" and
having the real model verify them together, so decode takes fewer expensive steps.
**Multi-token prediction (MTP)** is one form, built into the model itself (DeepSeek's). Some
published throughput figures already include it; the page adds no *additional* speculative
credit in any reading of its own, and offers a slider for readers who want to.

**disaggregation** — Running prefill and decode on separate accelerators tuned for each.
Part of how SGLang and NVIDIA got five times the throughput on the same GB300 racks between
April and June 2026.

**serving stack** — The software that runs the model: the inference framework (vLLM, SGLang,
a lab's private stack), its kernels and scheduling. The same chip served 14× faster under an
optimized stack than a naive one in the InferenceX benchmark.

**serving regime** — The page's setting for how a deployment is tuned: throughput-first,
balanced, or interactive. It fixes each leg's batch size and therefore its throughput and cost.

**serving-stack efficiency** — The calculator's multiplier on throughput for the serving
software, defined as measured stack composition relative to published open practice: 1.0 = open
practice, 0.7 = no multi-token prediction and no disaggregation. Editing it while an
**algorithmic lead** is set fires an **overlap warning**, because the two describe overlapping
improvements. It is only a warning: the methods box is explicit that explicitly-modelled levers —
serving precision, the serving regime, the cache controls, this one — are never locked by that
machinery. The hard interlock, which does lock and does leave a banner, is between the **family
multipliers** and the algorithmic lead, because those two are both broad and unspecified.

**algorithmic lead** — A slider for how many months a lab's private serving efficiency is
assumed ahead of published open practice, at 3× per year. The lead-adjusted baseline gives
Anthropic, OpenAI and Google 3 months (about 1.3×), DeepSeek 1, the other Chinese labs 0. A
labeled assumption, not a measurement; the planning baseline sets it to zero.

**family multiplier** — A stress dial: a ±% on the throughput of every accelerator in one
**hardware family** (NVIDIA, TPU, Trainium, Ascend). "Suppose we are 20% wrong about all of
Google's chips."

**latency target** — How fast the service must respond. Two measures: **time to first token
(TTFT)**, how long before the reply starts; **time per output token (TPOT)**, how fast it
streams. Tighter targets mean smaller batches and higher cost — interactive serving costs
about 1.4–3× throughput-optimal serving.

**tokens/s per accelerator** — See **throughput**.

---

## F. "Whose hardware, and how much of it?"

**fleet** — The mix of accelerator types assumed to serve a model, each with a share. No
provider publishes its current serving allocation; what exists are public commitments
(Anthropic's TPU and Trainium deals), historical statements, and one second-hand report of the
NVIDIA share. The page's fleet is built from those and is an assumption.

**default fleet** — The page's assumed Anthropic fleet for the planning baseline: NVIDIA 50%
(H100, H200, GB200, GB300), TPU v7 25%, Trainium2/3 25% — seven legs. The **opening scenario**
declares a different and smaller fleet — five legs, 40% TPU v7, 25% GB200, 20% GB300, 10% H200,
5% H100, with Trainium at zero weight, which its author says was deliberate. (A 40/25/15/15/5
fleet including Trainium2 appears in the July §6 comparison; that is a different, earlier reading
and not this one.)

**fleet leg** (or **leg**) — One component of the fleet: an accelerator type at one price and
one share, with its own throughput row. A custom fleet may carry the same accelerator type twice
at different prices, so a leg is a component, not necessarily a unique chip.

**fleet section** — In a fleet that mixes rented and owned capacity, the rented legs and the
owned legs as two declared groups, each on its own cost basis.

**fleet share** — The share of served tokens assumed to run on a leg. The blended serving cost
is the share-weighted average of the legs' costs.

**feasible / capped / infeasible** — Memory feasibility only: whether the model and its
working memory fit a leg at its declared batch under the **memory-planning convention** —
fully (feasible), only at a smaller batch (capped, and the leg says so), or not at all
(infeasible: the leg shows no number). It says nothing about whether the deployment is
verified or the throughput anchored.

**rack** — A cabinet of accelerators sharing one fast interconnect; the unit large deployments
are priced in. The example on this page is NVIDIA's NVL72: 72 GPUs (about $3–3.5M to buy a
GB200 rack; $762 per hour to reserve one on AWS).

**node** — One server; eight accelerators is the common size and the page says so where it
matters. A source's own unit is kept as quoted: the ncode deployment counted "15 trays" of
4 GPUs, not nodes.

**H100, H200, H800, H20** — NVIDIA's Hopper generation (2022–24). H800 and H20 are the
export-restricted versions sold into China; DeepSeek's disclosure ran on H800s.

**B200, B300, GB200 NVL72, GB300 NVL72** — NVIDIA's Blackwell generation (2024–26). "GB"
pairs the GPUs with NVIDIA's Grace CPU in a 72-GPU rack; B300/GB300 is "Blackwell Ultra".

**Vera Rubin** — NVIDIA's next generation (2026–27). No public price and no public serving
benchmark as of mid-2026: the page carries it as a **projection** from its announced
specifications.

**TPU v7 (Ironwood)** — Google's current accelerator. Anthropic has committed to up to a
million of them.

**Trainium2 / Trainium3** — AWS's accelerators. About half a million Trainium2 run Claude in
AWS's Project Rainier; no Claude production economics are public for either, and the only
public $/token figures are narrow engineering examples from AWS's own tutorials.

**Ascend 910C / CloudMatrix 384** — Huawei's accelerator and its 384-chip system, the
Chinese alternative under export controls.

---

## G. "What kind of traffic, and why does it matter?"

**traffic mix** — The two request-shape settings the page's selector owns: how many input
tokens per output token, and what share of input is served from cache. It changes the answer
by tens of points, because input, cached input and output have different prices and costs.

**workload** — The whole request shape: the traffic mix plus the lengths, latency target,
precision and batching a deployment runs at. The page models some of it and not the rest, and the
methods box says which: input and output lengths feed the roofline directly (they set the KV
footprint and the context length), and **precision** and **serving regime** are set per scenario.
Latency targets (TTFT/TPOT), cache lifecycle and storage billing, speculative-decoding acceptance
and unbilled retries are *not* modelled. "Workload" appears where a source's or benchmark's full
shape is meant.

**input:output ratio** — Input tokens per output token. Examples the page cites, not a
distribution it knows: DeepSeek's disclosed traffic ran about 4:1; SemiAnalysis modeled an
agentic Opus workload at about 300:1.

**cache-hit share** — The fraction of input tokens served from cache rather than freshly
prefilled.

**Reference mix** — The page's standard traffic mix: 15 input tokens per output token, 60%
cache hits. A convention chosen to sit between chat and agentic traffic, not a measured
operating point. The report's fixed scenarios (the planning baseline, the same-assumption
table) are at the Reference mix; the interactive calculator is at whatever you select.

**billable cached share** — The share of *all* input tokens the customer is billed at the
cache-read price. The page assumes it equals the serving-side cache-hit share; if a provider
serves more from cache than it bills as cached, its margin is higher than shown. This
assumption alone spans 30% to 75% on the Opus planning baseline (billable share 95%, equal to
serving, and 0%).

**subscription economics** — Flat-fee plans (Claude Max) versus per-token API billing. Heavy
subscribers demonstrably consume 15–40× their fee in list-price value; what that costs to
serve, and how many subscribers do it, is not public.

---

## H. "How much should I trust this number?"

**evidence label** — On every input the page adopts: what kind of source stands behind it. A
provenance label, not a grade of whether the number is true or applies:

- **DISCLOSED** — the party itself published it (DeepSeek's serving statistics, a list price).
- **CREDIBLY REPORTED** — reputable press with named sourcing, or a reproducible public
  benchmark.
- **COMMUNITY ESTIMATE** — a named outside analyst or the technical community.
- **SPECULATION** — the page's own assumption, labeled as such.

The full report also names the finer **source type** of a figure (first-party disclosure,
regulatory filing, reputable reporting, reproducible benchmark, market quote, community
estimate, modeling assumption); the type is stated beside the label, and a market quote is a
market quote, not promoted to a credibility class.

**basis label** — On every analyst claim on the "which margin" page: did the source say
which margin it meant? **STATED** (the source says so), **IMPLIED** (its numbers or method
imply it), **OUR READING** (the page's inference, reason given).

**evidence grade** — On each provider card: how much of that provider's economics is publicly
observable, per dimension (architecture, pricing, fleet & cost, production throughput,
financial perimeter), each high / medium / low. It grades the evidence, not the number.

**grounding ledger** — The machine-generated table of every input the calculator uses, with
its value, source and evidence label. The authoritative record; the page's prose summarizes
it, and its field names get a reader key on the release edit.

**adopted** — A setting the page's maintainer chose and labeled as a choice (the 2.5-trillion
model size, the 3-month algorithmic lead). Adopted settings can be moved with a slider; the
page never presents one as a measurement.

**analyst-set** — Set by judgment rather than fitted. Of a throughput number: a
**calibration class** (an assumed operating point; relevant evidence may exist without being
reproduced). Of a rent: a rate the page chose where no usable public quote exists.

**scenario** — Any complete set of calculator settings. **Scenario preset** — a named
scenario shipped with the page (prices, fleet, utilization, traffic together). **Replay** — a
scenario preset that loads a published estimate's assumptions into this page's engine; it
translates them into the page's one model and does not reproduce the estimate's own model, so
the button says "Load this estimate's assumptions". **Route** — a what-if scenario preset in
the range explorer, built toward a claimed margin range; it states where it lands, which can be
short of the range.

**research report** — One of the annex pages: a provider deep dive (one per provider, run on
GPT-5.6 Pro), a hardware sweep, an adversarial review, a consultation. Each states its own
provenance class: verbatim original, adopted-findings summary, reconstruction, or partial.

**adversarial review** — A review run by a separate model session whose brief is to break the
page. The page has had several; the numbers they changed are in the changelog.

**changelog** — The dated revision history, including the internal revision codes that
earlier drafts of the page used in body copy.

---

## I. Abbreviations that appear on the page

| | |
|---|---|
| **ARR** | annual recurring revenue — recurring revenue expressed on a yearly basis. Where a cited figure is a current month multiplied by twelve, that is *annualised* revenue, which is a different and looser quantity; the page says which is meant |
| **COGS** | cost of goods sold; see **cost of revenue** |
| **FCF** | free cash flow — cash a company generates after its capital spending; a company can have a positive gross margin and negative free cash flow while it builds datacenters |
| **FLOPS / PF** | floating-point operations per second; PF = petaflops (10¹⁵ per second) — a chip's compute rating |
| **FP8 / FP4 / INT8 / BF16** | number formats; see **precision** |
| **GB / TB/s** | memory capacity / memory bandwidth |
| **HBM** | high-bandwidth memory; see **accelerator memory** |
| **ICI** | Google's TPU interconnect |
| **IDC** | internet data centre — in China pricing, a bare-metal datacenter operator. The term names the *provider*, not the lease term; the registry carries both monthly and annual quotes from them |
| **KV** | keys and values; see **KV cache** |
| **MFU** | model FLOPS utilization — a compute-only efficiency; see **MFU**, and note it is not the **efficiency factor (η)** |
| **MLPerf** | the industry's standardized benchmark suite (MLCommons) |
| **MoE** | mixture of experts |
| **MTP** | multi-token prediction; see **speculative decoding** |
| **NVL72** | NVIDIA's 72-GPU rack; see **rack** |
| **PUE** | power usage effectiveness |
| **SKU** | a specific product variant (the H20 is NVIDIA's China SKU) |
| **SLO / SLA** | service-level objective / agreement — a latency target a deployment aims at (objective) or contractually promises (agreement). The calculator's serving regimes are neither; they are assumed operating conditions |
| **TCO** | total cost of ownership; see **owned cost** |
| **TDP** | thermal design power |
| **tok/s** | tokens per second |
| **TPOT / TTFT** | time per output token / time to first token; see **latency target** |
| **TTL** | time to live — how long a cache entry is kept; see **cache write** |
| **Wh per M tokens** | watt-hours of accelerator energy per million tokens served, at the page's scope of accelerator power × PUE — not the full datacenter stack, which one published telemetry anchor puts about 1.4× higher |

## J. Added after session 3 (the entries a first-time reader was missing)

**serving regime**, **replica / sharding**, **memory-planning convention (loaded bytes)**,
**fleet section**, **hardware family**, **cache write** and **TTL**, **percentage point**,
**markup versus margin**, **cost of revenue**, **token / input / output** — each is in its group
above.
