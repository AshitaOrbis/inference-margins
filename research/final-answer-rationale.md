# The final answer — rationale and evidence chain

**What this document is.** The owner-level requirement behind this page's FINAL-ANSWER
block (2026-07-22, verbatim in the project record): "we do need an obvious final
answer … it needs to have the rationale clearly explained with links back to the
evidence and therefore be defensible in the face of expert scrutiny." This annex is
that rationale. The numbers themselves render LIVE on the landing block and through
the MCP `get_report` id `final-answer` — this document explains where each one comes
from, what it assumes, and what disclosure would move it. Values quoted here are
execution outputs from their own revision and are marked ≈ — most of them re-derived during the
external review of 2026-07-27, but NOT all: passages carrying a later date or a named commit were
computed then, and the September 2026 recomputations under
`d-20260910-im-adopt-fleet-rents-and-correct-grok` are identified individually where they appear.
The live surfaces are authoritative, and where a figure here disagrees with them the figure here is
the older one.

**What the answer is NOT.** Every **calculator figure** is a policy-labeled
scenario estimate, and the above-80 reading is a separately labeled **adopted
analyst judgment** — this page's source-reliability adjudication, not a
calculator output and not provider disclosure. No placement map for Claude Opus 4.x
is public to this page, so this page does not label any calculator result
verified or central, and the comparison slot renders honestly empty ("no verified central comparator exists" — an owner-ratified
design decision, 2026-07-22). The spans below are **spans across declared
alternatives**, never statistical statements about a distribution — this page does
not have the evidence to propagate input distributions, and pretending otherwise
would manufacture precision.

## 1. The estimand

Unit direct-serving contribution margin for Claude Opus 4.x at the published
tariff schedule under the reference cache/batch/discount mix:
1 − (modeled direct serving cost ÷ modeled effective billings) at the Reference
traffic mix (15:1 input:output, 60% cache hit). NOT a company gross margin — the
report's §7 bridges the two. The fleet is the **memory-feasibility-filtered
evidence-informed default** (owner rulings 2026-07-21 + 2026-07-23): the NA-blend
family shares, with any leg that cannot serve the model under the loaded-bytes
policy excluded at weight 0 (disclosed inline) and the remaining declared weights
renormalized.

## 2. The planning baseline reads ≈58%, and this is the chain that produces it

**The short version.** Five things have to be assumed before a margin exists: how big the model
is, which accelerators serve it and in what shares, how fast each of those accelerators serves,
what an hour of each costs, and how many bytes of the model have to be resident to serve at all.
Assume the page's planning values for all five and the blended cost lands at a **serving margin of
about 58%**. Each link below names how firmly its number is held — its **calibration class** —
and only one link in the chain is fitted to a real measurement.

> **Which scenario these figures are on.** Every calculator figure in this annex is the **planning
> baseline** unless it says otherwise — algorithmic lead 0 months, family multipliers 1.0×. Exactly
> one figure below says otherwise and labels itself where it stands. The **lead-adjusted baseline**
> — the same vector plus the adopted +3-month algorithmic lead, a labeled assumption and not a
> measurement — reads ≈68%; that is not what the calculator opens on, and it is not the engine's
> defaults either. The FINAL-ANSWER surface this annex explains retains the planning-baseline
> computation unchanged and, since the August 2026 rework, shows the lead-adjusted reading beside
> it. This annex is planning-baseline throughout.

The chain, innermost first — each link names its calibration class:

1. **Model size.** Opus total = the page-adopted 2–3 T planning band, scalar
   2.5 T (adjudicated 2026-07-24; size case `revised-band-central-2.5`) — informed
   by newer community estimates; Musk's public "Grok is 0.5T = 1/10 Opus"
   (April 2026) is read as likely referring to the prior flagship, Opus 4.6
   (owner-adjudicated planning interpretation; the referent is unverified), and
   its 5 T deduction is preserved as the labeled `community-central-5.0` size
   case. The headline is size-dependent and decreases monotonically across the
   three sampled totals: 2.0/2.5/3.0 T compute ≈59.40% / ≈58.43% / ≈57.46%
   (executed). Active ≈300B is this page's working
   estimate (the open question is flagged on the model note). COMMUNITY ESTIMATE
   class, page-adopted.
2. **Fleet membership + weights.** NA-blend: NVIDIA 50% (a SECONDHAND Morgan
   Stanley summary of an NVIDIA NDR comment about an unnamed ASIC-heavy lab,
   attribution inference by a named relayer — the full chain and its limits are in
   `research/primary-sources/nvidia-anthropic-share-x-2026-07/`), TPU 25% /
   Trainium 25% (equal residual split across the two ~1M-chip-scale public
   commitments — this page's declared choice). Within-family splits carried from
   the v2.1 declared topology (no public basis exists). At the revised flagship
   size EVERY declared leg serves its declared operating point (H100 holds b=96 at
   solver width 112), so the serve-feasibility rule removes nothing and all seven
   declared weights bind unrenormalized. The exclusion story is preserved,
   reproducible, and disclosed under the 5 T size case: there TWO declared legs
   fail the policy — H100's operating point (b=96, best feasible 75) and
   Trainium2's (b=32, best feasible 26), neither satisfiable within its registered
   domain — so both enter at weight 0 and the remaining FIVE legs
   (h200/gb200/gb300/tpu7/trn3) are renormalized over a basis of 84, and the
   include-H100-at-its-capped-batch counterfactual is computed and disclosed there.
   MEASURED, not asserted: `deriveDefaultFleetMembership` at `total=5000` returns
   declaredLegCount 7, memberLegCount 5, excluded `[h100, trn2]`. The earlier text
   here named H100 alone and said six legs remained, which disagreed with this
   annex's own decomposition line two sections below. Capacity uses peak live KV (`ISL + OSL`), while decode
   performance uses the representative position (`ISL + OSL/2`). Membership derives at the **native Reference traffic
   anchor** — it never re-derives under a user's traffic selection (the KV term
   makes serve-feasibility traffic-dependent; the anchor keeps the default ONE
   thing).
3. **Per-leg throughput — one leg is FITTED, five are BORROWED, one is ANALYST-SET.**
   Decode rooflines, each with its calibration class:
   - **fitted** — GB200 alone reproduces a matched observation, the vLLM R1 decode
     measurement (row `gb200-vllm-r1` in the evidence registry).
   - **borrowed, within-family** — H100 and H200 transfer off the DeepSeek H800 production fit.
   - **borrowed, same-platform bridge, analyst-set** — TPU v7, in aggregate form.
   - **borrowed, out-of-family joint fit** — Trainium2 and Trainium3, with no matched serving
     measurement of their own.
   - **analyst-set** — GB300, at an assumed operating point with no measured value; it is
     excluded from the fit set.

   **Prefill is borrowed everywhere.** One frozen identity fit is transferred to every
   accelerator, so no leg's prefill carries a measured basis — and the input side, which prefill
   dominates, is where about 70% of the modeled direct cost sits (the report's methods box states
   it precisely, at ~70.5% for the current flagship default). Widths are CAPACITY-SOLVED per leg over
   registered hardware domains (solver receipts on every leg), never fixed
   constants; solved widths at the revised default: h100 112, h200 32, gb200 24,
   gb300 12, tpu7 16, trn2 48, trn3 32.
4. **Prices/rents.** TPU v7 and Trainium2 are observed-source-named; h100 and h200
   are analyst-set; and gb200, gb300 and Trainium3 carry the **provisional** planning
   rents adopted 2026-09-10 under `d-20260910-im-adopt-fleet-rents-and-correct-grok`,
   each declared as a judgment rather than a published rate of the low/committed class
   (each row cites its basis). Until that date those three carried no registered rent at
   all and the engine renormalized them out; the earlier text here described gb200 as
   observed-source-named, which its adopted rent is not. List prices $5/$25 (published tariff).
   The five-status vector's economics slot reports the WORST input class present —
   at the default, executed rather than quoted from memory:
   "evidence-quality: analyst-set-assumed-op throughput · analyst-set price". It
   read "joint-fit throughput" until 2026-09-12; that was a stronger class than the
   engine emits, and it became wrong when GB300, whose operating point this annex
   itself describes as analyst-set, entered the priced fleet.
5. **How many bytes must be resident.** Under the FP8 scenario the page plans on 1.0 byte per
   parameter loaded. This governs capacity only — it is deliberately firewalled from the
   calibrated throughput values, and the release gate enforces that separation. It is the
   planning point's own convention and is NOT one of the three sampled band points below.

Composition: weighted blend of the per-leg costs at the declared operating points → margin ≈58%
(57.8814%) at the current engine data, on the planning baseline.

**It is a whole-fleet result since 2026-09-10, and the result it replaced was a priced-subset one.**
Until that date GB200, GB300 and Trainium3 carried no registered accelerator-hour price and the
engine renormalized them out, so the reading then was **51.1786% effective computed over about 52% of
declared fleet weight** — not the 57.8814% above, and not over all seven legs. Both the number and
its coverage changed. The excluded set contained GB200, the only leg whose decode coefficient is
fitted to a matched observation, which is why the omission bit hardest there. Owner ruling
`d-20260910-im-adopt-fleet-rents-and-correct-grok` adopted a **provisional** planning rent for each
of the three, so every declared leg carries a price. Membership is a separate question from pricing,
and since 2026-09-20 the default renders **5 of 7 declared legs** — the two Trainium legs are
withdrawn on evidence grounds (below), their declared weight renormalized over the remaining five,
which render at a weight share of 1.0 of member weight. That is a third kind of coverage, distinct
from the memory feasibility in link 2 and from the calibration classes in link 3, and adopting a
provisional price does not make it an observed one: a missing price was never a zero cost, and a
priced leg is still not evidence that the capacity serves.

**Open form-correction debt — not a repaired estimate.** Holding each legacy
calibration coefficient fixed while re-expressing its traffic form produces
**47.61% to 61.30%** at the flagship baseline computed on the planning baseline: a 13.69-point open calibration debt
from the declared replica width alone. More seriously, the Trainium2/3 operating
point registry labels batch as replica-global while the shipped engine consumes it
per chip; the alternate reading makes those affected legs about 15.2×
lower-throughput. Public evidence does not identify which form is right. **Since
2026-09-20 both Trainium legs are WITHDRAWN from the default fleet's membership on
that ground** — a coefficient whose unit is open by a factor of fifteen cannot sit
inside a preferred reading on the strength of a caveat, and this project's own
hardware ledger already said it "CANNOT support a central Trainium margin". Their
declared 8% and 17% renormalize over the remaining five legs, and the exclusion
clause states that rather than renormalizing silently. Nothing is deleted: the rows,
their rents, their dossiers and their scenarios are all kept and selectable, and one
sourced coefficient that pins the batch/replica/accelerator identity reverses this.
The live calculator and MCP disclose the debt beside every result; none of these
counterfactual values is presented as a corrected margin.

## 3. The three sampled policy points

Loaded-bytes at {0.55, 0.65, 1.05} B/param on the SAME fixed membership:
≈58% / ≈58% / ≈58% at the current engine data, at the public-evidence reference (no continuity is implied between
samples). Membership is held FIXED at the central-policy derivation — and at the
revised flagship size it is policy-STABLE: no leg would enter or leave at any
sampled point. The selected operating batches also remain unchanged at all three
points, so this sampled band is flat rather than a 12-point margin span (the typed
membership-sensitivity record is empty everywhere; the old H100 would-re-enter
counterfactual belongs to the 5 T size case).

## 4. The spans across declared alternatives

- **Cost lenses** (flagship scope, traffic fixed, at the public-evidence reference): ≈58% to ≈83% across the declared
  compatible lenses — the high end is the strategic-partner rate lens (TPU ≈$1.60/hr
  class + Trainium blend, per the archived GPT-Pro consult). The span exists because
  no public evidence pins Anthropic's actual blended accelerator economics between
  market rates and strategic rates.
- **Traffic mixes** on the central scenario preset, at the public-evidence reference; as a span across declared alternatives: ≈37% to ≈68% across the declared provenance-honest
  traffic profiles. The Reference mix is the anchor; real traffic composition is
  undisclosed.

<a id="scenario-only-utilization"></a>
### Scenario-only ledger — fleet utilization (r4 §C3)

The 50% paid-capacity occupancy this page holds by default is **a declared planning
convention, not a measurement**: no provider publishes occupancy telemetry by phase, so
there is nothing to calibrate it against. It is enumerated in the r4 adversarial review's
scenario-only ledger (§C3) for exactly that reason. Moving it is a legitimate scenario
question and the calculator exposes it as a live control — which is why the analyst-gap
summary's first two rows move this one control and show what the engine then computes.

<a id="scenario-only-mtp"></a>
### Scenario-only ledger — speculative decode / MTP (r4 §B10, §C3)

Acceptance rates for speculative decoding are unpublished for the fleet this page
models. Its cited evidence set carries four non-fleet acceptance figures and no
fleet-specific one: two non-flagship anchors — one reporting an average acceptance
length of about 1.8–1.9 (SGLang's acceptance-length metric counts accepted draft tokens
plus the bonus token produced per verification step), one assuming 70% acceptance for a
single speculative token — and, in the
open-stack post cited below, average acceptance lengths of 2.18 and 2.44 at two draft-window
settings. These are the figures this page has found, not a claim about every figure that
exists. The r4 review's verdict on applying a
fleet-wide credit is explicit: **"do not apply one universal multiplier"** (§B10).
Published gains are workload-dependent — about 14% at production-like batch against
about 60% at modest concurrency — so a single multiplier would be a workload assumption
wearing a mechanism's clothes. Those two figures are the SAME model on the SAME stack
(DeepSeek V3 under SGLang), differing in cluster scale, concurrency, sequence lengths and
draft window. The larger figure is the MTP-versus-no-MTP delta with overlap scheduling
absent from both arms: 82.0 versus 51.0 tokens/s/rank (+60.8%). The post separately
reports 60.4 tokens/s/rank for overlap scheduling without MTP; because that SGLang
version did not support MTP together with overlap scheduling, it does not report MTP's
incremental gain on top of overlap. Both are cited from that post and are not registered
evidence rows of this page. Since 2026-07-29 the MECHANISM is vendor-officially on
the record at one frontier lab (OpenAI's engineering post credits an improved
draft/speculator model with more than 15% additional token-generation efficiency, and
its 2026-07-30 pricing post says it is passing those gains on); that lab is not this
page's flagship, and the vendor claim and the SGLang-reported open-stack measurements
are kept in separate classes and never summed. This page therefore holds the credit at
zero in every reading it authors and says so. A reader may price the lever themselves
with the scenario control, from the "no MTP/disagg" stack setting only; the calculator
then computes and labels that reading as the reader's. It is off by default, never
applied to a leg whose deployed efficiency already absorbs speculation or whose status
this page cannot establish, and never used to select a reading of this page's own.

## 4-bis. The strongest external analyst hypothesis, and why not the higher numbers

**Where these two things now sit, because it changed on 2026-08-27.** The ruling of
2026-07-24 put a calculator reading beside the adopted analyst reading on the FINAL-ANSWER
surface. T5 rec 5 of the 2026-07-29 review separated them, and this annex describes the
arrangement that is actually live rather than the one it used to describe.

- **THE ANSWER now carries calculator readings only** — three of them, since the b9 M6 rework:
  the reading the page opens on, the calculator's own lead-adjusted baseline (≈68%), and the
  ≈58% public-evidence reference (the reproducible scenario output above). Each names its own
  basis where it stands.
- **The strongest external analyst hypothesis this registry carries — above 80% — is no longer
  one of them.** It renders in its own section outside THE ANSWER, beside the evidence board,
  because ranking somebody else's claim is a statement about the evidence record and not one of
  this calculator's answers.

The rename in the same change retired a phrase that named a real-world quantity directly, on
the ground that the source exposes neither estimand, accounting boundary, period, fleet nor
billing basis. The claim itself is unchanged; what
changed is that it is described as the strongest hypothesis this registry carries rather than
as a reading of reality, and that it no longer sits inside the calculator's answer hierarchy.
Where "two labeled readings" appears below it always means *calculator vs analyst*. The
above-80 reading is an
adopted analyst reading, not a disclosure: it rests on Dylan Patel's first-party
Sequoia-transcript statement ("north of 80 percent for the API price" on an Opus
token) and SemiAnalysis's 3Q26 estimate of an above-80% API-business gross margin,
and this page adopts SemiAnalysis as the most reliable analyst tier for such
figures while stating plainly that its private calculations are unpublished. Where
that claim targets the same estimand this page models, the two readings genuinely
disagree — the surface says so rather than blending them.

The "Why not the higher numbers?" block renders one entry per higher
justification (the 90–95 conditional cluster, the 80+ tier, the model-generated
92–94 consult, and every remaining ≥80 registry row — a superset by enumeration,
fixture-enforced). Each entry states, in plain language: what the claim says
(verbatim from the claims registry), what it does not say, and what evidence
would flip it; the fully-bridged groups additionally identify the calculator
changes that move toward each higher claim and quantify any remaining
unreproduced gap (the ladder **as written into this annex by commit `800868b` on 2026-08-24**, and
not re-executed since, ran from ≈51 to ≈66 / ≈66 / ≈76 / ≈79 / ≈81, with the separately composed
strategic-partner lens at ≈81.7 — only where the calculator actually reaches a claim's neighborhood
does the entry say so. Those are that revision's outputs, pre-dating the 2026-09-10 rent adoption;
today the current lens span runs to `finalAnswer().lensSpan.hiPct` = 83.09, and the current baseline
is the ≈58 below, not the ≈51 the ladder starts from. NB the document header's 2026-07-27 review
date does NOT date this ladder: the July-27 revision `4d95a59` carried ≈59 → 71/71/80/83/85 with a
partner lens of ≈83.3, and `800868b` replaced it. An earlier draft of this sentence dated the ladder
July 27 from that header, which invented its provenance), and the compact entries
say honestly where no bridge is constructed.
The current decomposition (≈58 → ≈58) carries its own line, read from the engine's own
`decompositionLine`: the page-adjudicated evidence-informed weight rebind moves the result from
58.40 to 57.88, a −0.5-point move; at the revised size the serve-feasibility rule removes nothing
(under the Legacy 5 T case it computes ≈56 and the rule removes H100 and Trainium2). Full drafting
history and review chain: `research/im4-fa-justifications-memo.md` (design gate,
seven rounds + the dual GPT Pro review), raws under `research/reviews/`, and the
cumulative concern ledger `research/gptpro-concern-ledger.md`.

## 5. What would move or verify this answer

Only a direct same-scope margin disclosure, or matched disclosures of serving
cost and realized billings, could verify actual margin. Short of that, the
disclosures below would materially move or narrow the calculator scenario — in
descending order of impact: (1) any provider disclosure of actual fleet
composition for frontier serving; (2) a measured loaded-bytes/checkpoint disclosure
or placement map for a closed model (would remove the placement-specific blocker
and materially narrow the calculator scenario — not, by itself, verify actual
margin without matched cost and realized-billing evidence); (3) strategic-vs-market rate confirmation for TPU/
Trainium at scale; (4) billable-cache share telemetry (the cacheHit dual-use
assumption is labeled and material); (5) any first-party statement of Opus
parameters. Expert scrutiny is invited precisely to surface such disclosures — that
is this project's stated north star: the best possible answer from public
evidence plus explicitly labeled page assumptions, revised the moment better
data exists.

## 6. Provenance pointers

- Evidence rows: `research/evidence-instances-v22.json` (the three-status evidence schema)
- Calibration: the frozen calibration set (the seven fits F1–F7, which the receipt pack itemizes), `research/d2-receipt-pack.md`
- Placement registry (published models): `WEIGHT_PLACEMENT` in engine data +
  sha256-pinned config captures (`research/primary-sources/hf-configs-placement-2026-07-22/`)
- Fleet attribution chain: `research/primary-sources/nvidia-anthropic-share-x-2026-07/`
- Claims registry (the discourse this answers): report §1–§2 + `MARGIN_CLAIMS`
- Gate history (how every number above got reviewed): `research/im-gates-ledger.md`
