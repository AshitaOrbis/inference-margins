# xAI (Grok) — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 53m24s · model `gpt-5-6-pro` (Pro-verified, Ashitaorbis project) · [conversation](https://chatgpt.com/g/g-p-6a42f0b0f46081919a65018455ee56dd/c/6a508e7a-c710-83e8-a8d6-7856e52c283c)
> Verdict: **Grok 4.5 marginal serving gross margin ≈ 67% central, 80% CI ≈ 10–85%** at API list price under full-cycle owned TCO; ~92% under strict cash-marginal cost; ~29% at the Anthropic-contract opportunity cost. Zephyr's "not juicing margins" claim is definition-dependent.
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

Snapshot through **close of July 9, 2026**. Labels mean: **DISCLOSED** = xAI/SpaceXAI, an executive statement, or a regulatory filing; **CREDIBLY REPORTED** = reputable reporting based on internal documents or identified sources; **COMMUNITY ESTIMATE** = named independent public analysis; **SPECULATION** = my inference, assumption, or arithmetic model. Arithmetic from disclosed inputs is labeled **SPECULATION — derived from DISCLOSED inputs**.

## 1. MODELS: flagship + workhorse

| Role | Model | Total parameters | Active parameters per token | Architecture | Likely serving precision |
| --- | --- | --- | --- | --- | --- |
| Flagship | **Grok 4.5** | **1.5T — DISCLOSED** by Musk as the "1.5T V9 foundation model" underlying 4.5 | **~200B central; 100–500B 80% range — SPECULATION** | **MoE — DISCLOSED** by co-developer Cursor; expert count, routing width undisclosed | **FP8 or another 8-bit weight format; BF16/FP8 activations — SPECULATION** |
| Workhorse | **Grok 4.3 / Grok 4.20 family** | **0.5T — DISCLOSED** by Musk for "current Grok" on April 9; mapping to 4.20/4.3 medium confidence | **~100B central; 80–220B 80% range — SPECULATION** | **Probably MoE — SPECULATION** | **FP8 weights, BF16/FP8 activations — SPECULATION** |

### Flagship: Grok 4.5

Musk said Grok 4.5 was based on xAI's **"1.5T V9 foundation model" — DISCLOSED**. Cursor, which jointly trained the model, described Grok 4.5 as a **mixture-of-experts model — DISCLOSED**. [Musk's statement](https://x.com/elonmusk/status/2071184354756477041) · [Cursor's technical launch post](https://cursor.com/blog/grok-4-5)

The **~200B active central — SPECULATION** ≈ 13% of total. The **100–500B range** is broad because neither expert count nor experts-per-token is public. Historical prior: official Grok-2 config — **8 routed experts, 2 selected, shared MoE block, 64 layers, BF16 — DISCLOSED**; a community count against official weights finds **269.5B total / 115.0B active = 42.7% active — COMMUNITY ESTIMATE**. Applying that ratio to 4.5 would give ~640B active — plausible upper tail, too dense for the central. [Grok-2 config](https://huggingface.co/xai-org/grok-2/blob/main/config.json) · [community count](https://huggingface.co/xai-org/grok-2/discussions/24)

xAI says Grok 4.5 serves at **80 output tokens/s — DISCLOSED** (user-stream, not replica throughput), **500k context — DISCLOSED**, trained on **tens of thousands of GB300s — DISCLOSED**. [Launch post](https://x.ai/news/grok-4-5)

### Workhorse: Grok 4.3 / 4.20

Musk's April 9 statement: **0.5T total — DISCLOSED** for "current Grok" (half of Sonnet, one-tenth of Opus). Current workhorse endpoints have **1M context — DISCLOSED**. [Musk](https://x.com/elonmusk/status/2042123561666855235) · [pricing](https://docs.x.ai/developers/pricing)

### Precision and replica footprint

No DISCLOSED production precision. Official Grok-2 serving recipe: **FP8, TP8 — DISCLOSED** (best prior). 1.5T weights = 0.75TB at 4-bit / 1.5TB at 8-bit before KV etc. Central case: **8-GB300 replica (6–16 range) — SPECULATION**.

## 2. FLEET & PROCUREMENT

### Operationally controlled accelerator inventory

| Site / phase | Mid-2026 inventory | Status |
| --- | --- | --- |
| Colossus/C1 initial | ~100,000 H100 | **DISCLOSED** (prospectus) |
| C1 after expansion | >220,000 GPUs (H100/H200/GB200) | **DISCLOSED** |
| H100 within current C1 | 200,000 H100 | **DISCLOSED** (Colossus page) |
| Colossus II cluster 1 | ~110,000 GB200 (210MW) | **DISCLOSED** |
| Colossus II cluster 2 | ~110,000 GB300 (220MW) | **DISCLOSED** |
| Next C2 phase | ≥220,000 more GB300 | **DISCLOSED as planned** (excluded) |
| **Conservative installed floor** | **>440,000 accelerators** | **SPECULATION — derived from DISCLOSED** |

[SpaceXAI prospectus pp. 63–64](https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf) · [Colossus page](https://x.ai/colossus) · [Anthropic compute announcement](https://x.ai/news/anthropic-compute-partnership)

### "Owned" does not mean entirely purchased for cash

Three related-party Valor equipment leases carry aggregate undiscounted payments of **$6.986B + $6.633B + $6.587B = $20.206B — DISCLOSED / derived**. "Owned fleet" = controlled dedicated infrastructure, not unencumbered title.

### Owned-fleet $/GPU-hour — three valid answers

| Cost lens | Central | 80% range | Interpretation |
| --- | --- | --- | --- |
| Strict short-run cash marginal | **$0.60/hr** | $0.30–0.90 | Power, cooling, maintenance, ops after sunk hardware |
| Accounting serving TCO | **$1.8/hr** | $1.3–2.4 | + straight-line depreciation |
| **Economic full-cycle owned TCO** | **$2.4/hr** | $1.8–3.2 | Replacement capital, financing, obsolescence — central verdict input |
| External opportunity value | **$5.27/hr** | — | The Anthropic contract price |
| Future Google contract value | **$11.45/hr** | — | From October 2026 |

Capital anchor: AI capex **$5.633B (2024) + $12.727B (2025) + $7.723B (Q1 2026) = $26.083B — DISCLOSED/derived**; ~$65k all-in installed per accelerator-equivalent (SPECULATION), 5.5-yr server life, 10% capital charge, 85% allocatable hours → ~$1.8/hr capital + $0.6/hr cash ops = **$2.4/hr**.

Power: enumerated phases imply **1.75kW nameplate per accelerator — derived**; prospectus reports **1.0GW nameplate compute draw as of Mar 31, 2026 — DISCLOSED**. Memphis 2026 GSA tariff: ~$0.060–0.065/kWh energy + $16.51–18.19/kW-mo demand — **DISCLOSED** → ~$0.22/hr grid power. [MLGW tariff](https://www.mlgw.com/images/content/files/pdf_rates/businessrates26/GSA%20Jan26.pdf)

### Ownership versus leasing

Jukan's ~220k C1 GPUs at $2.60/hr ≈ **$5.01B/yr — COMMUNITY ESTIMATE** vs my full-cycle TCO $4.63B/yr — ownership advantage only ~8% at full cycle. The dramatic advantage exists only in the short-run cash view ($1.16B/yr).

**The market comparison that matters**: Anthropic pays **$1.25B/month for ~325,000 GPUs + CPUs/storage/networking — DISCLOSED** = **$5.27/GPU-hr — derived**. Google (from Oct 2026): **$920M/month for ~110,000 GPUs — DISCLOSED** = **$11.45/GPU-hr — derived**. These are reserved-capacity sale prices, not production cost — but they price xAI's opportunity cost. [Prospectus](https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf) · [Google agreement, SEC](https://www.sec.gov/Archives/edgar/data/1181412/000162828026041150/spacexagreementfwp.htm)

### Utilization evidence

Internal memo reportedly put training MFU at **~11% ("embarrassingly low"), target 50% — CREDIBLY REPORTED** (Business Insider) vs 35–45% typical. Training-stack evidence only — not inference occupancy. Commercial evidence of capacity monetization: 325k GPUs to Anthropic, tens of thousands to Cursor training. [Business Insider](https://www.businessinsider.com/elon-musk-xai-compute-cursor-ai-model-training-2026-4)

## 3. PRICING & REALIZATION

### API list pricing as of July 9, 2026 (all DISCLOSED, $/Mtok)

| Endpoint | Context | Input | Cached input | Output |
| --- | --- | --- | --- | --- |
| `grok-build-0.1` | 256k | $1.00 | $0.20 | $2.00 |
| **`grok-4.5`** | 500k | **$2.00** | **$0.50** | **$6.00** |
| `grok-4.3` | 1M | $1.25 | $0.20 | $2.50 |
| `grok-4.20-0309-reasoning` | 1M | $1.25 | $0.20 | $2.50 |
| `grok-4.20-0309-non-reasoning` | 1M | $1.25 | $0.20 | $2.50 |
| `grok-4.20-multi-agent-0309` | 1M | $1.25 | $0.20 | $2.50 |

[Pricing](https://docs.x.ai/developers/pricing). Reasoning tokens bill at normal rate — DISCLOSED. Grok 4.3/4.20 get a **20% batch discount — DISCLOSED**; Grok 4.5 has **no batch discount**. Priority = 2×. Cursor sells a channel-specific "fast" 4.5 at $4/$18 — DISCLOSED by Cursor. [Cursor](https://cursor.com/blog/grok-4-5)

### Consumer and subscription bundles

Grok Free $0; **SuperGrok $30/mo — DISCLOSED**; SuperGrok Lite ~$10 (CREDIBLY REPORTED); SuperGrok Heavy ~$300 (CREDIBLY REPORTED); **X Premium+ $40/mo or $395/yr — DISCLOSED**. [xAI pricing](https://x.ai/pricing) · [X Premium](https://help.x.com/en/using-x/x-premium)

### Realization and leakage

**117M MAU of Grok AI features (Mar 31, 2026) — DISCLOSED**, up from 89M at year-end 2025; no paid-subscriber or token-volume disclosure ⇒ no defensible realized $/token. A $30 SuperGrok = only 5M Grok-4.5 output tokens at list — heavy users realize far below list.

## 4. COST/MARGIN EVIDENCE

| Evidence | Number | Label | Interpretation |
| --- | --- | --- | --- |
| Q1 2026 AI-segment revenue | **$818M** | DISCLOSED | X ads, subscriptions, licensing, AI products, compute infra — not Grok API alone |
| Q1 AI cost of revenue | **$456M** | DISCLOSED | Infra, energy, bandwidth, depreciation, cloud, rev shares, ops |
| Implied Q1 AI gross margin | **44.3%** | derived | Segment accounting margin, not marginal serving margin |
| Q1 AI R&D | **$2.379B** | DISCLOSED | Includes training infra + GPU depreciation |
| Q1 AI operating loss | **$2.469B** | DISCLOSED | Total investment, not per-token economics |
| 2025 AI revenue / op loss | **$3.201B / −$6.355B** | DISCLOSED | |
| 2025 / Q1 2026 AI capex | **$12.727B / $7.723B** | DISCLOSED | |
| Jukan C1 rental equivalent | **$2.60/GPU-hr** | COMMUNITY ESTIMATE | Modeled lease, not owned cost |
| Reported training MFU | **~11%** | CREDIBLY REPORTED | Training only |
| Anthropic capacity price | **~$5.27/GPU-hr** | derived from DISCLOSED | Opportunity cost of Grok serving |
| Google future capacity price | **~$11.45/GPU-hr** | derived from DISCLOSED | Future, not current |

## 5. VERDICT

**Central: Grok 4.5 marginal serving gross margin at API list ≈ 67% — SPECULATION. Subjective 80% CI: ~10% to 85% — SPECULATION.**

### Central serving model

8-GPU GB300 replica; 80 tok/s user stream (DISCLOSED); 25 concurrent streams at saturation (SPECULATION) → 2,000 aggregate tok/s/replica → 0.004 GPU-sec/output token; $2.40/GPU-hr economic TCO → **$2.67/M output cost**; input $0.40/M uncached, $0.10/M cached.

| Unit | List revenue | Central cost | Central margin |
| --- | --- | --- | --- |
| 1M output | $6.00 | $2.67 | **55.6%** |
| 1M uncached input | $2.00 | $0.40 | **80.0%** |
| 1M cached input | $0.50 | $0.10 | **80.0%** |
| 3M uncached in + 1M out | $12.00 | $3.87 | **67.8%** |
| Same with 50% input cached | $9.75 | $3.42 | **65.0%** |

### Why 90–95% can ALSO appear correct

At strict cash-marginal $0.60/hr (hardware sunk): ~$0.67/M output → **~92% margin on the 3:1 workload**. At the Anthropic-contract $5.27/hr opportunity value: ~$5.86/M output → **2% output-only margin**, ~29% blended — serving output-heavy traffic would barely beat selling the capacity wholesale.

**Clean interpretation: Zephyr's "priced closer to cost" implication is directionally supportable under full-cycle economic TCO, but not under strict cash marginal cost.** xAI is not obviously pricing at 90–95% full-cycle margin; it may nevertheless earn roughly that on the next token whenever spare, already-paid-for capacity is available.

### Break-even batch check ($6/M output, 8-GPU replica)

| GPU valuation | Break-even aggregate throughput | Equivalent 80-TPS streams |
| --- | --- | --- |
| $0.60/hr cash | 204 tok/s | 2.6 |
| $2.40/hr TCO | 889 tok/s | 11.1 |
| $5.27/hr Anthropic value | 1,952 tok/s | 24.4 |

Central case (25 streams / 2,000 tok/s) is comfortably profitable against owned TCO but almost exactly break-even against the Anthropic capacity alternative.

### The 80% interval, ranked

1. **Saturated aggregate decode throughput** (667–5,333 tok/s per replica — ~8× cost swing).
2. **Replica size, active params, precision** (6–16 GPUs, 100–500B active).
3. **Economic value of an xAI GPU-hour** ($1.8–3.2 owned; up to $5.27 opportunity).
4. **Workload shape** (unknown).
5. **Revenue realization** (free tiers, subscriptions, Cursor bundles, enterprise).
6. **Power and site ops** ($0.3–0.9/hr cash).

Monte-Carlo-style run: 10th/50th/90th percentile blended margins ≈ **10% / 62% / 84%**.

## 6. KNOWN KNOWNS

- **Grok 4.5 is a 1.5T-foundation MoE — DISCLOSED**; advertised at **80 TPS — DISCLOSED**; lists at **$2/$0.50/$6 — DISCLOSED**.
- Musk disclosed **0.5T total for the then-current Grok**; current workhorse endpoints list at **$1.25/$0.20/$2.50 — DISCLOSED**.
- xAI operationally controls **>440k installed GPUs — derived from DISCLOSED cluster counts** (200k+ H100/H200/GB200 at C1; 110k GB200 + 110k GB300 at C2).
- AI capex **$12.727B (2025) + $7.723B (Q1 2026) — DISCLOSED**; Valor leases **$20.206B aggregate — derived from DISCLOSED**.
- Anthropic contracted **~325k GPUs at $1.25B/month — DISCLOSED** ≈ **$5.27/GPU-hr — derived**, well above the ~$2.4/hr owned TCO estimate.
- Q1 2026 AI segment: **$818M revenue, $456M cost of revenue, −$2.469B operating — DISCLOSED** ⇒ 44.3% segment GM (not Grok serving margin).

## 7. KNOWN UNKNOWNS

- **Active parameters and routing topology** (100B–several hundred B on a 1.5T MoE).
- **Production numerical format and replica footprint.**
- **Saturated aggregate throughput** — 80 TPS is per stream; the largest uncertainty.
- **Inference capacity utilization/allocation** across Grok, Anthropic, Google, Cursor, training, idle.
- **Average realized revenue per token** (no API volume or subscriber-usage disclosure).
- **Actual workload distribution** (I/O ratio, cache rate, long-context share, reasoning volume).
