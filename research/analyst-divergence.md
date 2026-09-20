# Why analyst margin figures diverge — which margin each source is talking about, verified claim by claim

**Status:** VERIFIED 2026-08-23 (America/Dawson_Creek 2026-08-22). Attributions below were established by two independent, blind research arms over the same brief — a GPT-5.6 Pro deep dive (broker request `pr-20260823T020913Z-d0fe55`, 2026-08-23) and a Fable 5 native-search arm (WebSearch / WebFetch / Brave; the Exa index was out of credits on this host and is stated as such in the arm's provenance header) — then merged by the director. Both arms quote the sources' own words with dates; where the arms disagree the disagreement is shown. Labels: **STATED** = the source states the object or basis in its own words · **IMPLIED** = the source's own numbers or method imply it, but it does not say so · **OUR READING** = our attribution, with the reason given. This ladder grades the ATTRIBUTION — which margin a source is talking about — not whether the source's figure is true. Arithmetic in §2 was re-derived independently by both arms. The owner's reading that prompted this page was stated as *probable*, not as fact; the verdict on it is in §4.

## 1. Four different objects get called "margin"

| Object | What is in the cost side | What this page shows it as |
|---|---|---|
| **Rental-inclusive unit serving margin** | the price a lab pays to RENT accelerator-hours (the lessor's economics sit inside the rent), plus the serving stack | **card 1** ("rental-inclusive") |
| **Own-accelerator unit serving margin** | the lab's own TCO for the accelerator-hour: capex amortisation, datacenter shell, electricity × PUE, opex — no lessor | **card 2** ("owned / TCO") |
| **Cohort contribution margin** (e.g. "paid-user compute margin") | a cohort's revenue minus the inference cost of serving that cohort, over that cohort's revenue — broader than a token, narrower than the company | not this page's metric; cited in §3 with its definition |
| **Company or product gross margin** | whatever the company's disclosed accounting policy classifies in COGS or contra-revenue — definitions differ and control comparability | **not this page's metric** (every tile says "not a company gross margin") |

The first two are the same unit (a token served) on two **procurement bases**, comparable only when model, token mix, cache rate, latency target, batch, utilisation, fleet membership and retained serving overhead are held fixed — which is what the two cards do. The third and fourth are different objects. **The durable editorial rule this page adopts: never inherit a basis from an analyst's name; attach the basis to the individual claim, and where the source is silent say "basis not stated by the source; shown under both bases."**

## 2. The arithmetic that links the two unit bases

Let `C` be the lab's own all-in cost per token on owned accelerators and `P` the price per token. Own-accelerator margin `m_own = 1 − C/P`. A lessor whose cost for the same capacity is `C` and who earns margin `m_L` on its revenue charges `R = C / (1 − m_L)`, so the renting lab's margin is

`m_rent = 1 − R/P = 1 − (1 − m_own) / (1 − m_L)`, equivalently `(1 − m_rent) = k · (1 − m_own)` with `k = 1/(1 − m_L)` the **rent-over-cost multiple**; and in reverse `m_own = 1 − (1 − m_rent)(1 − m_L)`.

Worked at `m_own = 95%` (`P = 20 C`):

| lessor margin `m_L` | rent multiple `k` | rental-inclusive margin `m_rent` |
|---|---|---|
| 0% | 1.00× | 95.0% |
| 40% | 1.67× | **91.7%** |
| 50% | 2.00× | **90.0%** — price is 10× the *rental* cost; rent is 2× the *owned* cost |
| 60% | 2.50× | 87.5% |
| 67.6% (exact) | 3.09× | 84.6% (84.5% if 67.6% is itself a rounded, back-solved figure) |

So the framing "a 95% own-accelerator margin survives a lessor's cut at ~90%" is right: the markup multiplies the small cost side, not the price side. Two conditions the identity rests on, stated so nobody reads `m_L` as a named lessor's accounting gross margin: (i) it assumes the lessor's relevant cost base equals the modelled owned-capacity cost `C` — real lessors and self-owners differ in procurement discounts, financing, useful life, utilisation, residual value, PUE and shared overhead, so in practice `k` is **rent ÷ the lab's modelled TCO**, and "`m_L`" is `1 − 1/k`, an *implied* quantity; (ii) the multiple applies only to the cost the lessor replaces — retained serving costs (orchestration, networking, support) should be added separately rather than scaled.

This page's own numbers, read that way: at the page's defaults the rental-inclusive stress case reads ≈58% and the same state owned reads ≈88%, i.e. `k = 0.4157/0.1169 ≈ 3.55` — a **3.55× rent/TCO multiple**, equivalent to a 72% *implied* lessor margin or a 255% markup over the page's modelled TCO. Card 1 prints it as an implied spread over modelled TCO, never as an observed lessor margin. (Re-measured from the shipped engine at each release.)

## 3. The cited claims, attributed one by one

| Claim (≤30 words) | Source · date | Object | Basis statement | Label |
|---|---|---|---|---|
| "600K rented TPUs … we estimate the cost to Anthropic to be $1.60 per TPU-hour from GCP" | SemiAnalysis, *TPUv7: Google Takes a Swing at the King*, 2025-11-28 | rental-inclusive accelerator-hour input | explicit: "inclusive of Google's margin stacking" | STATED |
| "~52% lower TCO per effective PFLOP compared to GB300 NVL72" (the 400k bought TPUs, same article) | SemiAnalysis, 2025-11-28 | own-accelerator (TCO) | explicit: the directly purchased phase | STATED |
| InferenceMAX: the TCO model "provides both total cost of ownership per GPU as well as Neocloud rental market prices"; the displayed $/M analysis is for "operators that are owning chips" | SemiAnalysis, 2025-10-09 | method spans BOTH bases; the shown curves are own-accelerator | explicit | STATED |
| InferenceX glossary: `$/M = TCO($/chip-hour) × 1,000,000 / (3600 × tok/s/chip)`; Rubin-vs-GB200 article: "operator ownership scenario (not rental prices)" | SemiAnalysis / InferenceX, 2026-07-23 and glossary | own-accelerator unit | explicit | STATED |
| "GB300 NVL72 delivers ~17× the best H100 config in FP8 and ~32× in FP4 … software alone 14×" | @SemiAnalysis_, 2026-06-27 | **throughput only** — acquires a basis only when divided by a rental or TCO hourly rate | n/a | STATED |
| Opus API-token margins "north of 80 percent" | Dylan Patel, Sequoia podcast transcript, 2026-06-30 | unit API-token margin, rental-capacity framing ("every GPU I rent…") | immediate context only; worksheet unpublished | IMPLIED |
| "Anthropic's gross margins were −94% in 2024" (later "38% in 2025 … mid 60s") | @SemiAnalysis_, 2026-03-27 / 2026-05-27 | company **inference gross margin** line (a business line's GM) | SemiAnalysis's own label | STATED |
| "Anthropic … first gross profit in Q2 … slightly over $1B of operating profit in Q3" | Dylan Patel, RAISE Summit, rec. 2026-07-09, pub. 2026-07-16 — the only retrievable text is a session **summary**; the transcript could not be retrieved by either arm | company financials (gross profit / operating profit), not a unit margin | — | OUR READING; see §5 correction 2 |
| "OpenAI's company-wide gross margin … ~55% … ~65% excluding free tier" | same appearance (summary) | company GM + a cohort-adjusted company cut | "company-wide", "free tier" | OUR READING; the "~30%" and "~50%" starting points on the main page are NOT in any retrievable source — see §5 |
| "I see 70–90 tps … ≈$4.4 at $0.87/Mt. H100 *spot prices* are now $2.4/hr. DS has at least 50% margin." | @teortaxesTex, 2026-06-27 | rental-inclusive unit serving (spot $/GPU-hr) | explicit spot price | STATED |
| "math for DeepSeek / Serving Opus is at most $4/1Mt" | @teortaxesTex, 2026-06-28 (quoting the post above) | unit serving cost; **best read as DeepSeek-anchored, rental-priced arithmetic**; the exact Opus rate is unstated | basis-silent; indexed as "math for DeepSeek" | IMPLIED |
| "they'll just increase the batch size … drive margins from 90% to 95%" | @teortaxesTex, 2026-06-27 (about "every western provider", not Opus) | unit serving margin, **procurement basis absent** | none | OUR READING → "basis not stated by the source; shown under both bases" |
| "What they technically mean is that they have a markup of 545%" | @teortaxesTex, 2025-03-02 | markup on cost, not margin on revenue | DeepSeek's lease-cost arithmetic | STATED |
| "At least xAI isn't juicing up the gross margins to 90%-95% and scamming consumers / Although the cached token could be cheaper" | @zephyr_z9, 2026-07-08 (quoting the Grok 4.5 pricing page) | likely token/product margin; a NEGATIVE claim about xAI; names no comparison lab; no rent/TCO basis | none | OUR READING → "basis not stated by the source; shown under both bases" |
| "To hit $10B/yr they will need to adopt Anthropic/OAI tactics and serve tokens at 5x the current price (95% GM)" | @zephyr_z9, 2026-06-24 | token pricing vs cost; names Anthropic/OpenAI; basis unstated | none | OUR READING (the Fable arm surfaced this post; the main page's "not Anthropic-specific" sentence is corrected in §5) |
| "70% GM and 15%–20% FCF margin / Anthropic is printing cash now" | @zephyr_z9, 2026-06-24 | company GM | pairing with FCF margin | STATED |
| "Anthropic lowered its projected 2025 gross margin to 40% …" (38% including free-chatbot inference) | The Information, 2026-01-21 (paywalled; public metadata) | company / paid-product GM | "subtracting inference costs and other costs of selling its products" | STATED |
| OpenAI "compute margin … 70% as of October" | The Information, 2025-12-21 | **paid-user compute margin** = (paid-user revenue − paid-user inference cost) / paid-user revenue | chart note, verbatim | STATED |
| OpenAI "adjusted gross margin … 33% in 2025 … 46% forecast" | The Information, 2026-02-24 | company-wide "adjusted GM" = revenue − inference cost, over revenue; training reported separately | reproduced definition | STATED |
| "frontier lab inference margins are like 40–50% … Anthropic labels cloud provider commissions as a sales and marketing expense" | @fleetingbits, 2026-07-04 | company GM used as a proxy for inference economics; the S&M-classification claim is unverified | none | OUR READING |
| "Assuming the leasing cost of one H800 GPU is $2 per hour … cost profit margin of 545%" | DeepSeek, 2025-03-01 (official disclosure) | **rental-inclusive unit serving by construction** (an assumed lease rate is the cost basis); 545% is profit/cost, 84.5% the margin on theoretical list revenue | explicit | STATED |
| "DeepSeek's gross margin from selling v4 API access is … 70% to 80%" | The Information via @jingyanghk, 2026-07-15 | **API-product** gross margin, cost basis undisclosed — not company GM | none | OUR READING |
| "Anthropic's gross margins of roughly 44%" / "$0.71 on computing power per dollar of revenue" | PitchBook / Morningstar, 2026-06-10/16 | company GM estimate (the 44% matches the projected Q2 cut) | method indicator only | IMPLIED |
| "$2.60 per GPU-hour (weighted average lease rate)"; "$5B of spend → $15B of ARR"; "NVIDIA share nearly 50%" | @jukan05 relays, 2026-05-09 / 07-10 / 07-11 | a rental datum; a spend-to-ARR multiple; a fleet share — **none is a margin** | — | STATED (object) |

## 4. The owner's reading, verdict by analyst

| Analyst | Verdict (both arms) | What this page says from now on |
|---|---|---|
| **SemiAnalysis** | **Refuted as a blanket attribution; confirmed per citation.** The Anthropic-specific figures (the $1.60/TPU-hr, the Opus "north of 80%") are rental-inclusive; but SemiAnalysis is dual-basis by design — InferenceMAX/InferenceX price $/M from owned TCO, the TPUv7 article runs owned-TCO for the bought racks and rental-inclusive for the rented ones, and its company-GM series is an accounting object | "SemiAnalysis's basis varies by analysis; this citation uses [rental-inclusive / operator-ownership TCO / throughput only / company financials], as stated in the source." |
| **TeorTaxes** | **Refuted for the own-GPU reading of the $4 post; undetermined for the 90→95 batch remark.** He never mentions owned GPUs; his only cost anchor is an H100 *spot rental* price, and the Opus figure is "math for DeepSeek" extending that chain. The batch remark is a separate, earlier post about "every western provider" — the site's key-findings line had fused the two | "$4/1Mt: best read as DeepSeek-anchored, rental-priced arithmetic; exact rate unstated. 90→95 via batch: basis not stated by the source; shown under both bases." |
| **Zephyr** | **Undetermined for 90–95% (unit at list price, basis never stated); confirmed company GM for ~70%.** The Jul-8 post says xAI is *not* doing it and names no lab; the Jun-24 post does name Anthropic/OpenAI ("serve tokens at 5x the current price (95% GM)") — so the allegation is lab-specific in his own words, but its *basis* still is not | "basis not stated by the source; shown under both bases. A separate post puts Anthropic's company gross margin at ~70%." |
| **The Information** | not applicable to the hypothesis — three different accounting cuts (company/product GM; paid-user compute margin; company-wide adjusted GM) with explicitly different numerators and denominators | the definitions above, verbatim, and never one unlabelled "reported margin" series |
| **@fleetingbits** | a company-GM-as-proxy argument resting on an unverified expense-classification claim | label as company GM; present the S&M claim as his |
| **DeepSeek** | **Confirmed rental-inclusive by construction** | "$2/H800-hour lease basis (an assumption in DeepSeek's own words); 545% profit/cost = 84.5% margin on theoretical list revenue; the owned-TCO version would replace the lease rate with DeepSeek's undisclosed TCO" |

**So the divergence is not different analysts disagreeing about one margin. It is different sources switching among four objects** — a rented-hour token margin, an owned-TCO token margin, a cohort contribution margin, and company or product accounting GM — and the same source (SemiAnalysis) legitimately using more than one. The two cards on the front page exist so that the first two can be seen side by side; the rest must stay labelled as what they are.

## 5. Corrections to the main page queued by this verification

1. *"this corpus does not establish that the 90–95% allegation is Anthropic-specific"* (§1 passage on Zephyr) — contradicted by his 2026-06-24 post ("adopt Anthropic/OAI tactics … (95% GM)"); the page should say the allegation IS lab-specific in his words and that its **basis** is what remains unstated.
2. *"Anthropic turned its first gross profit in Q2 (June 2026)"* (RAISE update) — the only retrievable text is a session summary; it conflicts with SemiAnalysis's own written record (38% inference GM in 2025, "mid 60s" by 2026-05-27, "Operating Income profitable in 2Q after adjusting for stock-based compensation") and with Patel on the Sequoia podcast ("net income profitable excluding stock-based compensation"). Relabel as an unverified summary-level claim or drop the "first gross profit" phrase.
3. *"~30% (late 2025) to ~55% today … ~50% to ~65%"* — only the endpoints (~55%, ~65%) appear in the retrievable summary; the starting points were found in no source by either arm. Cite them or drop them (The Information's 33% is a different, "adjusted" cut and cannot stand in for "~30%").
4. The Opus "north of 80%" citation can be upgraded from "quoted-secondary" to the Sequoia transcript, which specifies the object ("for the API price", on an Opus token) and the rent framing.
5. The −94% / 38% / mid-60s series should carry SemiAnalysis's own label ("inference gross margins" — a business line's GM, not a unit figure).
6. Two Zephyr posts in the corpus ("75–80% GM", 2026-06-27) answer a reply about **CXMT**, not Anthropic; nothing on the page may derive an Anthropic figure from them.
7. The site's key-findings line *"TeorTaxes: Serving Opus ≤ $4/1Mt, 90→95% via batch"* fuses two posts; record them separately with their bases as above.
8. DeepSeek V4 "70–80%" is an API-product margin with an undisclosed cost basis, not "company-side".

These are queued for the release-notes pass (tranche 5) because they move pinned front-page bytes; the research page above is the record until then.

## 6. Method and provenance

Brief: `im-arc/dives/analyst-basis-brief.md` (seven questions; the page's fifteen cited passages and the prior draft attached as content). GPT Pro arm: broker request `pr-20260823T020913Z-d0fe55`, gpt-5-6-pro, 2026-08-23, full report archived as `im-arc/dives/analyst-basis-gptpro.md`. Fable arm: `im-arc/dives/analyst-basis-fable.md`, 2026-08-23, WebSearch/WebFetch/Brave (Exa out of credits — stated), X posts via the fxtwitter mirror with UTC timestamps. Convergence: every verdict above is shared by both arms; the only differences were coverage (the Fable arm surfaced the 2026-06-24 Zephyr post and the CXMT contamination; the Pro arm supplied the InferenceX/Rubin method statements, The Information's chart-note definitions and the PitchBook cut) and the 67.6%-row rounding (Pro: 84.6% at exact inputs). Two X posts and one Morgan Stanley note could not be retrieved by either arm and are labelled accordingly. SP-real-terms-comparisons: no dollar comparison across years is made on this page.
