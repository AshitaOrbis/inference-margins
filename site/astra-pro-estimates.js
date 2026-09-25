/* =====================================================================================
   astra-pro-estimates.js — the "Astra Pro estimates" category in §10 (bq-3351; owner ruling
   d-20260925-im-astra-pro-estimates-category-and-drop-same-assumption-section, note 4c71cb:
   "a list of relevant contemporary models, evaluated using our calculator … a clear category,
   with its own chart, labelled as Astra Pro estimates, and links to each specific GPT Pro Review").

   One GPT-6 Astra Pro research run per model set every calculator input from public evidence.
   This file RECORDS those inputs — each model's three operating points exactly as its run
   declared them — and nothing else numeric. Every margin the page shows for this category is
   the engine's result on a recorded operating point, recomputed wherever it is shown:
     * the card faces in index.html are written by scripts/build-astra-pro-estimates.mjs from
       astraProReplay() (tests/astra-pro-estimates.test.mjs fails if a face and the engine
       disagree, so an engine change that moves a number cannot leave a stale face behind);
     * the category chart is drawn by app.js at page load from the same function;
     * the MCP connector reproduces each one from the same operating point (run_scenario with
       `model: carrier, perspective: "median"` and the recorded overrides and traffic).
   The pipeline below is the MCP's run_scenario engine pipeline, step for step, so the page, the
   build and the connector compute one number three ways rather than three numbers.

   The registry is strict JSON between the BEGIN/END markers so that tools outside JavaScript
   (the completion gate's live checks) read the served file without evaluating it.

   Script order: data → roofline → engine → custom-fleets → THIS FILE → app. It references engine
   symbols only at call time. No DOM here: app.js owns rendering.
   ===================================================================================== */
"use strict";

const ASTRA_PRO_REGISTRY = /*BEGIN-REGISTRY-JSON*/{
 "estimates": [
  {
   "key": "claude-fable-5-1",
   "name": "Claude Fable 5.1",
   "provider": "Anthropic",
   "api_model": "claude-fable-5-1; released 2026-09-01; standard Claude API, high effort, default safeguards",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 400,
      "total": 8000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 30,
       "gb300": 20,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "gb200": 5,
       "gb300": 6.5,
       "tpu7": 1.5
      },
      "util": 65,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 50,
      "cache_hit": 92
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 600,
      "total": 10000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 30,
       "gb300": 20,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "gb200": 5,
       "gb300": 6.5,
       "tpu7": 1.5
      },
      "util": 55,
      "stackMult": 1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 50,
      "cache_hit": 92
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 250,
      "total": 6000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 30,
       "gb300": 20,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "gb200": 5,
       "gb300": 6.5,
       "tpu7": 1.5
      },
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 50,
      "cache_hit": 92
     }
    }
   },
   "stated": {
    "headline_pct": 84.3362,
    "low_pct": 68.4347,
    "high_pct": 90.3293
   },
   "card_lines": [
    "≈84% at list (span 68–90%)",
    "The decisive assumption is 400B active parameters; Anthropic has not published that number."
   ],
   "context_length_assumed": "Text-dominant agentic traffic: 50,000 input and 1,000 billed output tokens per representative request, including billed thinking; 50,500 mean decode context, 51,000 peak. Not the 1M maximum-context workload.",
   "confidence": "low: identity and tariffs are verified, but architecture, fleet, paid utilization and workload-matched throughput are not; this is a conditional serving-margin estimate, not a measured provider margin.",
   "reading": "Anthropic's top model is priced at $10/$50, twice Opus 4.x, and the run pairs that price with a very large assumed model: 400B active and 8T total (its own words: \"the decisive assumption is 400B active parameters; Anthropic has not published that number\"), served with a stack it rates 10% worse than open practice. The price is the stronger of the two, which is why the reading sits in the mid 80s. Two inputs deserve attention. The TPU half of the fleet is priced at $1.50 per chip-hour — an owned-hardware conversion the run shows step by step (rack cost, five-year life, capital recovery, power), well under the $5.40 committed retail rate for Ironwood; pricing the GB200 leg at a public on-demand rate ($10.50 per GPU-hour) instead of $5 lowers the central to about 77%, by the run's own sensitivity. And the traffic is extremely agentic — 50 input tokens per output token, 92% of input from cache — motivated by Anthropic's statement that Fable 5.1's cheaper cache reads (2.5% of the input price) cut typical workloads' cost by a quarter. That mix is where the low cache-read price bites: at the page's Reference traffic (15:1, 60% cache) the same inputs compute {{REF}}, {{REFREL}} the headline. The span (68–90%) comes from the model size (250B–600B active) and utilization. The run could not reach the connector and reconstructed the equations; the engine reproduces its figures to the fourth decimal.",
   "dive": {
    "id": "pr-20260925T060752Z-f9b29c",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T07:07:16Z",
    "answer_sha256": "454e2637016ff9cc203a5471a5d3b5ce6efe61d34aa46f33065916f22136e959",
    "raw_answer_sha256": "2efe52ece8c6b833a9f361889d61c14b66f148a538ae679e64b7be5eafeda4e5"
   },
   "review_page": "research/claude-fable-5-1-astra-pro.html"
  },
  {
   "key": "claude-opus-5-5",
   "name": "Claude Opus 5.5",
   "provider": "Anthropic",
   "api_model": "claude-opus-5-5; released 2026-09-22; first-party global standard speed, adaptive thinking at medium effort, default safeguards",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 2500,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 10,
       "gb200": 35,
       "gb300": 20,
       "tpu7": 35
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 5,
       "gb300": 6,
       "tpu7": 2.7
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 30,
      "cache_hit": 85
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 300,
      "total": 3000,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 10,
       "gb200": 35,
       "gb300": 20,
       "tpu7": 35
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 5,
       "gb300": 6,
       "tpu7": 2.7
      },
      "util": 60,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 30,
      "cache_hit": 85
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 150,
      "total": 2000,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 10,
       "gb200": 35,
       "gb300": 20,
       "tpu7": 35
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 5,
       "gb300": 6,
       "tpu7": 2.7
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 30,
      "cache_hit": 85
     }
    }
   },
   "stated": {
    "headline_pct": 78.4866,
    "low_pct": 67.9196,
    "high_pct": 83.9777
   },
   "card_lines": [
    "≈78.5% at list (span 68–84%)",
    "The estimate turns on an assumed 200B active parameters—not a disclosed Opus 5.5 size."
   ],
   "context_length_assumed": "Representative 30000 input + 1000 total generated tokens: decode context 30500, terminal KV context 31000. Not a 1M-context cost estimate.",
   "confidence": "low: the tariff and arithmetic are checkable, but model size, actual fleet, paid utilization and traffic distribution are unmeasured; the span is three scenarios, not a probability interval or an exhaustive bound.",
   "reading": "This is the direct successor of the model the whole site is built around, and at list price it lands a few points under both Opus 4.x estimates at the top of the report (GPT-5.6 Pro's 83.1% and Fable 5's ≈80%, each at list) — for a reason that has nothing to do with serving efficiency: Opus 5.5's list price is $4/$20, a fifth below Opus 4.x's $5/$25, and its cache reads are billed at 5% of the input price rather than 10%. Against that, the run assumes a smaller active set than the page's Opus 4.x row (200B against 300B) — its own words are that the estimate \"turns on an assumed 200B active parameters — not a disclosed Opus 5.5 size\", and nothing public contradicts or confirms it. The traffic is heavily agentic (30 input tokens per output token, 85% served from cache), which puts most of the bill on cached input billed at 5%; at the page's Reference traffic (15:1, 60% cache) the same inputs compute {{REF}}, {{REFREL}} the headline. The run could not reach the calculator's connector (a DNS failure on its side) and transcribed the equations instead; its figure matches this engine to the fourth decimal, which checks the transcription, not the assumptions. The fleet (a third TPU v7 at $2.70 per chip-hour, the rest NVIDIA) follows Anthropic's announced compute deals, but no disclosure says which hardware serves Opus 5.5.",
   "dive": {
    "id": "pr-20260925T060752Z-19c6fb",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T06:41:28Z",
    "answer_sha256": "603f1b056b8819be10b62a3d5aef3a730aa7682c9d654a6433773049c780cad9",
    "raw_answer_sha256": "8844366dd95539ad28216dcc8430c455a51e2cc5f504048c150322f6c17c21a0"
   },
   "review_page": "research/claude-opus-5-5-astra-pro.html"
  },
  {
   "key": "claude-sonnet-5",
   "name": "Claude Sonnet 5",
   "provider": "Anthropic",
   "api_model": "claude-sonnet-5; pinned release 2026-06-30; standard global Claude API; adaptive thinking, high effort",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 100,
      "total": 1000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 75,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 15,
       "gb200": 25,
       "gb300": 5,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "h100": 2.5,
       "h200": 3.8,
       "gb200": 5.0,
       "gb300": 6.5,
       "tpu7": 2.7
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 75
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 160,
      "total": 1400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 75,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 15,
       "gb200": 25,
       "gb300": 5,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "h100": 2.5,
       "h200": 3.8,
       "gb200": 5.0,
       "gb300": 6.5,
       "tpu7": 2.7
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 75
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 70,
      "total": 1000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 75,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 15,
       "gb200": 25,
       "gb300": 5,
       "tpu7": 50
      },
      "rentAbsLeg": {
       "h100": 2.5,
       "h200": 3.8,
       "gb200": 5.0,
       "gb300": 6.5,
       "tpu7": 2.7
      },
      "util": 75,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 75
     }
    }
   },
   "stated": {
    "headline_pct": 83.5232,
    "low_pct": 73.9941,
    "high_pct": 88.7614
   },
   "card_lines": [
    "≈84% at list (span 74–89%)",
    "The deciding assumption is 100B active parameters, putting modeled serving cost near $0.23 per million mixed tokens."
   ],
   "context_length_assumed": "Standard 1M-capable model, not a separate short-context tier. Representative 12000 input and 1000 total generated tokens; decode context 12500, peak 13000.",
   "confidence": "low — identity and tariff are verified, but architecture, fleet allocation, all-in procurement, occupancy and workload are unmeasured; the span is three judgment scenarios, not a confidence interval.",
   "reading": "Sonnet 5 already has a row in the calculator, but only as a tariff with sizes carried over from the 4.x era (1T total, 120B active); the report's own central scenario puts it at about 54% (§5, at the public-evidence reference, on its illustrative billing mix). This run lands near 84% on the same $2/$10 price, and the gap is almost entirely the cost side the page's lens does not share: a mixed fleet with half its tokens on TPU v7 at $2.70 per chip-hour (half the $5.40 retail committed rate), 70% utilization instead of the page's 50%, and a slightly smaller active set (100B, which the run marks as a judgment — \"the deciding assumption\"). Neither is more right from public evidence: the page's lens prices a conservative planning rate at every provider, and this run prices what it believes a large lab with committed capacity pays. The run leaves Trainium out of the fleet on purpose — Anthropic does serve on it, but the calculator's Trainium throughput unit is ambiguous, which the run treats as a reason not to price it rather than to guess. Traffic is 12 input tokens per output, 75% from cache; at the page's Reference traffic the same inputs compute {{REF}}. The span (74–89%) is model size (70B–160B active) and utilization. The run transcribed the equations after failing to reach the connector; the engine reproduces its figures to the fourth decimal.",
   "dive": {
    "id": "pr-20260925T063700Z-19b839",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T07:35:49Z",
    "answer_sha256": "49cf89bab97a23a5cbe45e560bc1348eb4bb322d6ee9dded5f825914402e7349",
    "raw_answer_sha256": "270f2bac9907399396405f0d15937c2c67d082723031a7553d73162edc9552bc"
   },
   "review_page": "research/claude-sonnet-5-astra-pro.html"
  },
  {
   "key": "claude-haiku-4-5",
   "name": "Claude Haiku 4.5",
   "provider": "Anthropic",
   "api_model": "claude-haiku-4-5-20251001; released 2025-10-15; standard Claude API, thinking disabled",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 20,
      "total": 200,
      "precision": "fp8",
      "priceIn": 1,
      "priceOut": 5,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "cacheWriteShare": 10,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 40,
       "gb200": 20,
       "tpu7": 40
      },
      "rentAbsLeg": {
       "h200": 3.25,
       "gb200": 5,
       "tpu7": 2.4
      },
      "util": 65,
      "stackMult": 1,
      "trendMonths": 0,
      "interact": "fast",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 30,
      "total": 300,
      "precision": "fp8",
      "priceIn": 1,
      "priceOut": 5,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "cacheWriteShare": 10,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 40,
       "gb200": 20,
       "tpu7": 40
      },
      "rentAbsLeg": {
       "h200": 3.25,
       "gb200": 5,
       "tpu7": 2.4
      },
      "util": 60,
      "stackMult": 1,
      "trendMonths": 0,
      "interact": "fast",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 12,
      "total": 120,
      "precision": "fp8",
      "priceIn": 1,
      "priceOut": 5,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "cacheWriteShare": 10,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 40,
       "gb200": 20,
       "tpu7": 40
      },
      "rentAbsLeg": {
       "h200": 3.25,
       "gb200": 5,
       "tpu7": 2.4
      },
      "util": 75,
      "stackMult": 1,
      "trendMonths": 0,
      "interact": "fast",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    }
   },
   "stated": {
    "headline_pct": 73.4,
    "low_pct": 54.4,
    "high_pct": 84.5
   },
   "card_lines": [
    "≈73% at list (span 54–85%)",
    "Latency-oriented serving (`interact: \"fast\"`) limits batch amortization; balanced serving would add about 16 margin points."
   ],
   "context_length_assumed": "Text workload: mean 8000 input and 1000 output tokens; representative decode context 8500, terminal context 9000; not a 200000-token workload",
   "confidence": "low: tariff and identity are established, but architecture, paid occupancy, procurement, fleet allocation and the latency-to-batch mapping are not measured for Haiku.",
   "reading": "Haiku 4.5 was released in October 2025, and this run prices it at the calculator's `fast` latency posture, on the reasoning that a small model is bought for its speed and so is served in small, low-latency batches; the run's own card line says balanced serving would add about 16 points. That posture choice, not the size, is what keeps the reading in the low 70s at a $1/$5 price. The size is a pure assumption — 20B active, 200B total — which the run anchors to Meta's disclosed Llama 4 Scout and Maverick shapes as examples of what a capable small sparse model can be, and says plainly is not a Haiku estimate. The low end of the span (54%) moves to a larger model (30B/300B) and to the GQA donor geometry instead of the compressed-KV MLA one, which is the donor sensitivity the site already warns about; the high end (85%) is a 12B-active model at higher utilization. Traffic is modest (8:1, half from cache), and the Reference-traffic result is {{REF}}, {{REFREL}} the headline. The run could not reach the connector and reconstructed the equations; the engine reproduces its figures to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T064303Z-3cdb62",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T08:24:30Z",
    "answer_sha256": "0ee917add83bfa7ebb690d090c781926e756da244f139f1f9a82a1e67fe6119d",
    "raw_answer_sha256": "0199d7c82168874e8632c70a1e5eb00a246d5879b2f7efc7759a39d6773bb28b"
   },
   "review_page": "research/claude-haiku-4-5-astra-pro.html"
  },
  {
   "key": "gpt-6-astra",
   "name": "GPT-6 Astra",
   "provider": "OpenAI",
   "api_model": "gpt-6-astra, current alias read 2026-09-25 UTC; API release 2026-09-03; Standard processing, short-context text-token traffic, mixed reasoning effort; no dated immutable snapshot established",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 6000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 30,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 4.5,
       "gb300": 6.0
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 350,
      "total": 8000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 30,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 4.5,
       "gb300": 6.0
      },
      "util": 60,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 120,
      "total": 4000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 30,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h200": 3.5,
       "gb200": 4.5,
       "gb300": 6.0
      },
      "util": 75,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
     }
    }
   },
   "stated": {
    "headline_pct": 94.6,
    "low_pct": 89.5,
    "high_pct": 96.7
   },
   "card_lines": [
    "≈94.6% at list (span 89.5–96.7%)",
    "The deciding assumption is 200B active parameters, which puts modeled output serving cost near $1.85/M against the $50/M output tariff."
   ],
   "context_length_assumed": "Short-context tariff: input <=272,000 tokens. Representative calculator request: 12,000 input and 1,000 billed output tokens including reasoning; decode context 12,500, peak KV 13,000. These lengths are assumed, not measured.",
   "confidence": "low: tariffs are verified and the local equation replay reproduces the supplied Opus check, but Astra architecture, fleet allocation, procurement, utilization and traffic are unmeasured; the span is three conditional scenarios, not a probability interval.",
   "reading": "The run's own arithmetic and this calculator agree to within 0.05 points on all three scenarios, which says the inputs were transcribed faithfully — not that they are right. What carries the number is the price: at $50 per million output tokens, even the run's low case (350B active, 8T total, 60% occupancy) keeps the margin near 89%. The input with no public measurement behind it is the active-parameter count (200B central), and the run shows the direction plainly: 400B active alone gives about 90%, 100B about 97%. Two further choices lift the billed side and are worth noticing: half of the fresh (uncached) input is billed as cache writes at 125% of the input price, and 80% of input is billed at the cache-read rate — an agentic, prefix-heavy traffic assumption rather than a measured OpenAI mix. The run could not reach the calculator's connector itself and worked the equations locally; its replay of the Opus 4.x reference matched the page's 82.33%. A separate, earlier Astra Pro run for this project (2026-09-19, different brief) put GPT-6 Astra at 93% on this calculator; the two land two points apart. The run also re-checked OpenAI's pricing page and found no API tariff for GPT-6 Astra Pro itself, which is why that model has no card.",
   "dive": {
    "id": "pr-20260925T060752Z-64acdf",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T06:35:33Z",
    "answer_sha256": "5af87989ce2a24c927f726c6ff0e199f4617063164f401d003432d72b5afd753",
    "raw_answer_sha256": "0417a9e76550125df8a4c5cb09d70ea5d75f2f8eecf7ec4ecfb77e8bf7f1b4cd"
   },
   "review_page": "research/gpt-6-astra-astra-pro.html"
  },
  {
   "key": "gpt-5-6-terra",
   "name": "GPT-5.6 Terra",
   "provider": "OpenAI",
   "api_model": "gpt-5.6-terra API alias as served 2026-09-25; family GA 2026-07-09; Standard processing, standard reasoning mode, medium effort; no immutable dated snapshot established",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 60,
      "total": 1200,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 25,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h100": 2.6,
       "h200": 3.4,
       "gb200": 4.5,
       "gb300": 6
      },
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 65
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 120,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 25,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h100": 2.6,
       "h200": 3.4,
       "gb200": 4.5,
       "gb300": 6
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 65
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 35,
      "total": 700,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 5,
       "h200": 25,
       "gb200": 50,
       "gb300": 20
      },
      "rentAbsLeg": {
       "h100": 2.6,
       "h200": 3.4,
       "gb200": 4.5,
       "gb300": 6
      },
      "util": 75,
      "stackMult": 1.15,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 65
     }
    }
   },
   "stated": {
    "headline_pct": 90.8,
    "low_pct": 80.6,
    "high_pct": 94.5
   },
   "card_lines": [
    "≈90.8% at list (span 80.6–94.5%)",
    "The decisive assumption is 60B active parameters: a moderately sparse workhorse, not a price-derived fraction of Sol."
   ],
   "context_length_assumed": "Text-only, <=272000 input-token tariff tier; representative 8000 input + 1000 billed output tokens, mean decode context 8500 and peak live context 9000; not a claim that the whole tier costs the same",
   "confidence": "low; this is a scenario-conditioned estimate with verified tariffs but unmeasured Terra architecture, hardware allocation, occupancy and traffic.",
   "reading": "Terra, OpenAI's middle tier at $2/$12, has been on the calculator only as a tariff scenario with a placeholder size. This run gives it one: 60B active, 1.2T total — its words are \"a moderately sparse workhorse, not a price-derived fraction of Sol\" — and explicitly refuses to back-infer size from the price. With that size, OpenAI's rented NVIDIA fleet at the page's own planning rents ($4.50 GB200, $6.00 GB300) and 70% utilization, the output price carries the result to about 91%. The span (81–94%) is the size (35B–120B active), utilization and a stack factor, holding the fleet and the rents fixed. Like the GPT-6 Astra run, it bills half of the fresh input as cache writes at 125% of the input price — OpenAI's pricing documents a cache-write rate, but how much of real traffic is written to cache is the run's assumption, not a published figure. Traffic is 8:1 with 65% from cache, and at the page's Reference traffic the same inputs compute {{REF}}. The run could not reach the connector and reconstructed the equations; the engine reproduces them to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T070104Z-bfdf05",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T09:21:38Z",
    "answer_sha256": "d455d8509f9677e8364d511018b0dd8b25ab0bece1672e521bd2a0ad93abac08",
    "raw_answer_sha256": "f932ece5fe9f6d29cb8b26524022016ec7578320dec634b2fa91a8b1fabf7a69"
   },
   "review_page": "research/gpt-5-6-terra-astra-pro.html"
  },
  {
   "key": "gpt-5-6-luna",
   "name": "GPT-5.6 Luna",
   "provider": "OpenAI",
   "api_model": "gpt-5.6-luna; public unversioned API alias, general availability 2026-07-09; Standard text service, medium reasoning, priced 2026-09-25; immutable backend snapshot unknown",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 12,
      "total": 160,
      "precision": "fp8",
      "priceIn": 0.2,
      "priceOut": 1.2,
      "cacheReadMult": 10,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 20,
       "h200": 30,
       "gb200": 50
      },
      "rentAbsLeg": {
       "h100": 2.6,
       "h200": 3.25,
       "gb200": 4.5
      },
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 24,
      "total": 320,
      "precision": "fp8",
      "priceIn": 0.2,
      "priceOut": 1.2,
      "cacheReadMult": 10,
      "billCacheHit": 70,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h100": 20,
       "h200": 30,
       "gb200": 50
      },
      "rentAbsLeg": {
       "h100": 2.6,
       "h200": 3.25,
       "gb200": 4.5
      },
      "util": 65,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 70
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 6,
      "total": 120,
      "precision": "fp8",
      "priceIn": 0.2,
      "priceOut": 1.2,
      "cacheReadMult": 10,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 20,
      "cacheWriteMult": 125,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h200": 20,
       "gb200": 80
      },
      "rentAbsLeg": {
       "h200": 3.25,
       "gb200": 4.5
      },
      "util": 75,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    }
   },
   "stated": {
    "headline_pct": 65.7,
    "low_pct": 36.1,
    "high_pct": 76.5
   },
   "card_lines": [
    "≈66% at list (span 36–77%)",
    "The assumed `dsr1` attention/KV geometry sets a substantial decode-cost floor, even at 12B active parameters."
   ],
   "context_length_assumed": "Standard <=272000-input-token tariff. Central/high: 8000 input + 1000 billed output, mean decode context 8500. Low: 12000 input + 1000 billed output, mean decode context 12500.",
   "confidence": "low — architecture, fleet allocation, occupancy and model-specific cost are unmeasured; the three-scenario span is conditional on the declared donor geometry and the results are reconstructed, not MCP-returned.",
   "reading": "Luna is priced at $0.20/$1.20, and the calculator has carried it only as a tariff scenario. The run makes it an estimate by assuming a small model — 12B active, 160B total, with 6B–24B active as the alternatives — and says plainly that no Luna measurement stands behind those numbers and that it did not back-infer size from the price or from streaming speed. Its card line points at the input that limits the result: the DeepSeek-R1 attention geometry the calculator uses for every undisclosed model sets a floor on decode cost that a small active count does not remove, so a different real attention design could move this number more than the parameter count does. The run also applies a small stack penalty (10% worse than open practice) and prices the fleet as ordinary rented NVIDIA capacity. The run's own perspective check is the clearest statement of what drives Luna: at the $1/$6 price this site carried until 2026-09-19, the same costs give about 93%; the fivefold price cut, not any change in serving cost, is what brings it to the mid 60s. The span is wide (36–77%) because the low case combines the 24B-active size with a more input-heavy, more cached traffic mix. At the page's Reference traffic the same inputs compute {{REF}}, {{REFREL}} the headline — the Reference mix carries more input per output token, and Luna's input price is very thin. The run reconstructed the equations; the engine reproduces them to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T070104Z-7304c2",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T09:03:13Z",
    "answer_sha256": "749264b2599012e49a29334b236e10c198c8a07cc51d9f61180a65a3cc25c5f4",
    "raw_answer_sha256": "ae4035466f64609be6482681fdd829cd74a53016fda3166ba766cb00200ca820"
   },
   "review_page": "research/gpt-5-6-luna-astra-pro.html"
  },
  {
   "key": "gemini-3-8-flash",
   "name": "Gemini 3.8 Flash",
   "provider": "Google",
   "api_model": "gemini-3.8-flash; stable, released 2026-09-02; Standard paid text API, medium reasoning",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 30,
      "total": 600,
      "precision": "fp8",
      "priceIn": 0.75,
      "priceOut": 3.75,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.2
      },
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 45,
      "total": 900,
      "precision": "fp8",
      "priceIn": 0.75,
      "priceOut": 3.75,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.2
      },
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "fast",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 30,
      "total": 600,
      "precision": "fp8",
      "priceIn": 0.75,
      "priceOut": 3.75,
      "cacheReadMult": 10,
      "billCacheHit": 50,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.05
      },
      "util": 80,
      "stackMult": 1.15,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 50
     }
    }
   },
   "stated": {
    "headline_pct": 92.2,
    "low_pct": 72.4,
    "high_pct": 94.3
   },
   "card_lines": [
    "≈92% at list (span 72–94%)",
    "The decisive cost assumption is $1.20 per all-in owned-TPU-equivalent chip-hour, rather than Google Cloud’s retail rental rate."
   ],
   "context_length_assumed": "Representative 8000 input tokens and 1000 billed output tokens including thinking; mean decode context 8500, terminal 9000. Same lengths in all three scenarios; not a 1M-context estimate.",
   "confidence": "low; prices and conditional arithmetic are well identified, but architecture, paid-capacity occupancy, actual request mix and production concurrency are not measured.",
   "reading": "Gemini 3.8 Flash is priced on a published promotion — $0.75/$3.75 until the end of 2026, doubling to $1.50/$7.50 on 1 January 2027 — and the run prices the tariff in force today, as the brief asked; its own price-only sensitivity is that the 2027 tariff would lift the central to about 96%. Like the Gemini 3.1 Pro run, it treats Google's TPUs as owned: the whole fleet is TPU v7 at $1.20 per chip-hour all-in (its words: \"rather than Google Cloud's retail rental rate\"), which is the input that carries the number. The size is an assumption the run labels as such — 30B active, 600B total, FP8 — because Google's model card discloses none of it, and it holds the model on the calculator's GQA (Qwen3-class) donor geometry. The span is wider on the downside (72–94%) than on the upside because the low case changes more than the size: it adds the `fast` latency posture, and the run names latency — how much concurrent decode fits the required response time — as the most consequential downside. Google says 3.8 Flash is now the default in its own agent tooling while 3.7 Flash stays supported at the identical price; neither page says which carries more production traffic, so this card stands for both only as far as their serving is alike. At the page's Reference traffic the same inputs compute {{REF}}, {{REFREL}} the headline. This is the project's second research run for this model; the first stalled without finishing and is not used. The run reconstructed the calculator's equations after failing to reach the connector; the engine reproduces its figures to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T110805Z-8276b2",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T11:33:14Z",
    "answer_sha256": "98b64256d91e54832886be79ad74a662faaa010bebb7b4fb0b0339805ac4036c",
    "raw_answer_sha256": "57899124523a5957ca7b81ed19d3e3aa6719f10142a733ad7f7aa431ee92dfe6"
   },
   "review_page": "research/gemini-3-8-flash-astra-pro.html"
  },
  {
   "key": "gemini-3-1-pro",
   "name": "Gemini 3.1 Pro",
   "provider": "Google",
   "api_model": "gemini-3.1-pro-preview; released 2026-02-19; standard paid API, default high thinking; endpoint as available 2026-09-25",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 100,
      "total": 2000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 40,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.36
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 40
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 160,
      "total": 3000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 40,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.61
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 40
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 80,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 40,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "tpu7": 100
      },
      "rentAbsLeg": {
       "tpu7": 1.36
      },
      "util": 75,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 40
     }
    }
   },
   "stated": {
    "headline_pct": 91.6,
    "low_pct": 83.8,
    "high_pct": 93.9
   },
   "card_lines": [
    "≈92% at list (span 84–94%)",
    "An inferred $1.36 all-in owned-TPU chip-hour—not Google Cloud’s $5.40 resale tariff—carries the result."
   ],
   "context_length_assumed": "Short-context tariff, prompts <=200000 tokens; representative 8000 input and 1000 billed output tokens including thinking; mean decode context 8500, peak 9000; assumed, not measured.",
   "confidence": "low: tariffs are verified, but architecture, traffic, occupancy and production throughput are not identified; the span is three conditional judgments, not a probability interval.",
   "reading": "The site's existing Gemini 3.1 Pro card (a July GPT-5.6 Pro dive, replayed on this engine at about 84%) and this run agree on the thing that matters most: Google serves Gemini on its own TPUs, so the cost of an hour is not what Google Cloud charges a customer for one. This run makes that conversion explicit and lands lower on the hour — $1.36 all-in per Ironwood chip-hour, owned, against the $5.40 committed retail tariff and against the July card's ≈$1.62 — which, with a somewhat smaller assumed model (100B active, 2T total), is most of why it reads about eight points higher. Its card line names that hour as the input that \"carries the result\". The span (84–94%) moves the model size (80B–160B active) and utilization, and in the low case the hour to $1.61, close to the July card's figure. The run checked for a newer Pro model and found Gemini 3.5 Pro still marked \"coming soon\" by Google, so 3.1 Pro remains the priced Pro tier. The traffic (8:1, 40% from cache) is moderate, and at the page's Reference traffic the same inputs compute {{REF}}. The run could not reach the connector and transcribed the equations; the engine reproduces its figures to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T064303Z-45d766",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T08:33:37Z",
    "answer_sha256": "fdfb41599f322ab827f76c259130d23f7e3df25b89c929d91c3eb7a4d4b4ba6d",
    "raw_answer_sha256": "b85d1203bf4dbb9cb0db6b934b341b9208ea315ac8729b85209bb0d28dc5f0e1"
   },
   "review_page": "research/gemini-3-1-pro-astra-pro.html"
  },
  {
   "key": "grok-4-6",
   "name": "Grok 4.6",
   "provider": "xAI",
   "api_model": "grok-4.6; released 2026-08-12; standard first-party API, high reasoning effort, short-context tariff; not fast or Grok 4.7",
   "open": false,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 50,
       "gb300": 50
      },
      "rentAbsLeg": {
       "gb200": 2.1,
       "gb300": 2.5
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 300,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 50,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 50,
       "gb300": 50
      },
      "rentAbsLeg": {
       "gb200": 2.1,
       "gb300": 2.5
      },
      "util": 55,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 6,
      "cache_hit": 50
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 120,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 70,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb200": 50,
       "gb300": 50
      },
      "rentAbsLeg": {
       "gb200": 2.1,
       "gb300": 2.5
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 10,
      "cache_hit": 70
     }
    }
   },
   "stated": {
    "headline_pct": 80.9,
    "low_pct": 65.9,
    "high_pct": 89.2
   },
   "card_lines": [
    "≈81% at list (span 66–89%)",
    "The decisive assumption is owned Blackwell capacity costing $2.10–$2.50 per accelerator-hour, all-in—not public-cloud rental prices."
   ],
   "context_length_assumed": "All prompts below 200,000 tokens. Representative input/output lengths: central 8,000/1,000, low-margin 6,000/1,000, high-margin 10,000/1,000; output includes billed reasoning. Absolute lengths are assumptions, not a supported override.",
   "confidence": "low: this is a conditional engineering estimate, not provider telemetry; stated margins come from a local transcription of public calculator equations, not a successful live MCP run.",
   "reading": "xAI's price is $2/$6 with cached input at 25% of the input price, so a margin near 80% needs cheap hardware, and that is exactly the input the run names as decisive: owned Blackwell capacity at $2.10 (GB200) and $2.50 (GB300) per accelerator-hour all-in, built up from capital recovery, facility, power and operating allowances rather than taken from any rental price. That is well under the page's planning rents ($4.50 and $6.00) and under anything a cloud customer pays, and it rests on xAI owning its Colossus fleet — which is disclosed — while the per-hour figures are the run's construction. The fleet split (half GB200, half GB300 by served tokens) is assumed; the page's own xAI card, a July dive on Grok 4.5 on a fleet half Hopper and half Blackwell at a full-cycle cost lens, reads about 63%, and most of the distance between the two is that fleet and its cost basis rather than the one-point-release model. The size (1.5T total, 200B active) carries over from the Grok 4.5 disclosure and remains speculation for the active count; the span (66–89%) comes from 120B–300B active, utilization and traffic. At the page's Reference traffic the same inputs compute {{REF}}, close to the headline. The run could not reach the connector and transcribed the equations; the engine reproduces its figures to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T063700Z-042437",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T07:28:32Z",
    "answer_sha256": "f7490a095c4aaff4d37dff4f49de774858f214a681b22ddf3751e9f3109043ec",
    "raw_answer_sha256": "10dd8e0e579d773ab445580eca088489c1696c2dfdcef2b49ff360c8110f8632"
   },
   "review_page": "research/grok-4-6-astra-pro.html"
  },
  {
   "key": "deepseek-v4-1-flash",
   "name": "DeepSeek V4.1-Flash",
   "provider": "DeepSeek",
   "api_model": "deepseek-flash -> DeepSeek-V4.1-Flash, released 2026-09-10; text-only default-thinking service; USD OFF-PEAK list tariff; no immutable served checkpoint hash established",
   "open": true,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 1.6
      },
      "util": 100,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 2.0
      },
      "util": 80,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 1.3
      },
      "util": 100,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    }
   },
   "stated": {
    "headline_pct": 58.8,
    "low_pct": 35.6,
    "high_pct": 66.5
   },
   "card_lines": [
    "≈59% at list (span 36–67%)",
    "The decisive input is $1.60 per all-in H800-equivalent hour, not a hyperscaler rental rate."
   ],
   "context_length_assumed": "Typical 8000-token input plus 1000 billable output tokens; representative decode context 8500, terminal context 9000. This is not the one-million-token maximum-context case.",
   "confidence": "low: prices and published geometry are identified, but the permitted carrier cannot represent the architecture faithfully and current fleet economics are not publicly measured.",
   "reading": "DeepSeek's Flash tier is priced at $0.15 in and $0.60 out off-peak, with cached input at 2% of the input price, and at that price the run reads about 59%. The run's own comparison with Opus 4.x shows where the distance comes from: holding Flash's costs fixed, Opus's prices alone would lift it to about 99%; the price removes about 40 points. It prices the off-peak tariff because that is the lower of DeepSeek's two published rates (peak is double), so the headline is the conservative side of the billing. Two of its inputs deserve a reader's attention. First, the architecture: V4.1-Flash is a 40-layer model with an encoder-decoder execution path and cross-layer cache sharing (16B active in decode; 763B in the full weight inventory, 552B of it the backbone), and nothing the calculator carries represents that — the run says the old V4-Flash row does not match either and holds it on the DeepSeek-R1 donor as a declared approximation. Second, utilization at 100%: in this run that means no idle divisor on top of a time-averaged H800 cost of $1.60 an hour, the same convention this calculator's replay of DeepSeek's February 2025 serving disclosure uses, because a time-averaged cost already contains the idle time; it is not a claim that GPUs run flat out. The 16B/8B active split (output/input) is DeepSeek's own disclosure. The span (36–67%) is the hour ($1.30–$2.00) and a reserve penalty in the low case. The traffic is 8:1 with 60% from cache; at the page's Reference traffic the same inputs compute {{REF}}, because more of the bill shifts onto the 2% cached-input rate. The run reconstructed the equations by hand; the engine reproduces them to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T064303Z-706503",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T09:03:34Z",
    "answer_sha256": "6d9a7125fb4f5d002c6108c84ba21895e927695445b19aa7cdd75681ac101f5a",
    "raw_answer_sha256": "8b4aeeb16004f79d0ace295ab68a002af764e697322d1dd4ab0e4080ea17fa68"
   },
   "review_page": "research/deepseek-v4-1-flash-astra-pro.html"
  },
  {
   "key": "qwen3-8-max",
   "name": "Qwen3.8-Max",
   "provider": "Alibaba",
   "api_model": "qwen3.8-max-0902 (alias qwen3.8-max-2026-09-02), released 2026-09-02; Singapore International standard text traffic; qwen3.8-max points here from 2026-09-05",
   "open": true,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb300": 100
      },
      "rentAbsLeg": {
       "gb300": 3.26
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb300": 100
      },
      "rentAbsLeg": {
       "gb300": 3.73
      },
      "util": 55,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp4",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "gb300": 100
      },
      "rentAbsLeg": {
       "gb300": 3.26
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    }
   },
   "stated": {
    "headline_pct": 79.19,
    "low_pct": 71.85,
    "high_pct": 88.27
   },
   "card_lines": [
    "≈79% at list (span 72–88%)",
    "An assumed $3.26 all-in GB300-equivalent GPU-hour is the decisive input."
   ],
   "context_length_assumed": "Standard <=1M tariff, but typical modeled request is 8000 input plus 1000 billed output tokens, including reasoning; representative decode context 8500, peak 9000. Reference replay: 15000 input plus 1000 output, representative 15500.",
   "confidence": "low; tariff and open backbone are well supported, but actual fleet, all-in hourly cost, utilization and hybrid-architecture transfer are unmeasured, so this is a conditional three-scenario judgment span.",
   "reading": "No Qwen model has had an estimate on this site before (the calculator's Qwen3-class donor geometry was the only Qwen trace). The run priced Alibaba's API model, qwen3.8-max (the 2026-09-02 snapshot, Singapore international tier, $2/$6, cached input at 12.5% of the input price), and established from Qwen's own model card that it is built on the open Qwen3.8-2.4T-A95B weights — \"based on\", which the run is careful to say is a backbone relationship and not byte identity. So the size (2.4T total, 95B active) is disclosed for the backbone and inferred for the served snapshot. The geometry is not a match for anything the calculator carries: 92 layers, of which 69 use linear attention and 23 full attention with 4 KV heads, 512 experts with 10 active. The run held it on the Qwen3-class GQA donor, a declared approximation whose direction of error it declined to call — three quarters of the layers keep no growing KV cache, which the donor does not represent. The input the run calls decisive is the hour: all of the traffic on GB300-class capacity at an assumed $3.26 all-in, about half the page's $6.00 planning rent, built up as an owned-equivalent cost (hardware, lives, electricity, operating allowance — each an assumption) rather than taken from any rental quote; no Alibaba cost figure is public. NVIDIA has published FP8 serving of this model on GB300 NVL72, which supports the hardware choice but not the share. The span (72–88%) moves the hour, utilization and, in the high case, FP4 weights. At the page's Reference traffic the same inputs compute {{REF}}. The run's figures match this engine to two decimals.",
   "dive": {
    "id": "pr-20260925T070105Z-4d5c81",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T09:36:13Z",
    "answer_sha256": "a616239e57e33d07fc038c0eb78cc503293536e295f906c0fb9769634950a17e",
    "raw_answer_sha256": "d457269f80893aace6aa8f5acac680a5d5487e034c1ef4cb9b5da3d612ce372c"
   },
   "review_page": "research/qwen3-8-max-astra-pro.html"
  },
  {
   "key": "kimi-k3",
   "name": "Kimi K3",
   "provider": "Moonshot AI",
   "api_model": "kimi-k3; reasoning_effort=max; API release 2026-07-16; weights released 2026-07-27; no immutable dated API alias established",
   "open": true,
   "carrier": "custom",
   "scenarios": {
    "central": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 70,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 2.2
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 70
     }
    },
    "low_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 2.6
      },
      "util": 50,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 8,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 16,
      "cache_hit": 65
     }
    },
    "high_margin": {
     "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "h800": 100
      },
      "rentAbsLeg": {
       "h800": 2.0
      },
      "util": 80,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
     }
    }
   },
   "stated": {
    "headline_pct": 87.8,
    "low_pct": 76.6,
    "high_pct": 91.9
   },
   "card_lines": [
    "≈88% at list (span 77–92%)",
    "The decisive assumption is $2.20 per all-in H800-equivalent accelerator-hour, not a disclosed Moonshot procurement rate."
   ],
   "context_length_assumed": "Text-dominant standard API; 1000 billed output tokens/request assumed, with 12000/16000/8000 input tokens in central/low/high; representative decode contexts 12500/16500/8500. Not average 1M-token requests.",
   "confidence": "low: the tariff and released architecture are identified, but actual serving hardware, precision, paid-capacity utilization, traffic and K3-specific throughput are not; margins are hand reconstructions, not returned MCP results.",
   "reading": "Kimi K3's size is disclosed — 2.8T total, 104B active, on Moonshot's own model card — so unlike a closed model's, the parameter count is not what carries the uncertainty. Two other things do. First, the geometry: K3 mixes a linear-attention variant (KDA) with gated MLA across 93 layers and 896 routed experts, and none of the calculator's three donor geometries is that; the run held it on the DeepSeek-R1 (MLA) donor and says so, which is an approximation of the attention cost rather than a statement about K3. Second, the fleet and its price: the whole fleet is modeled as H800-equivalent capacity at $2.20 per all-in accelerator-hour, derived from a Chinese vendor's advertised rent for an eight-H800 server (CNY 75,000 a month, about $1.90 per GPU-hour) plus an all-in uplift — the run's own words are that this is \"the decisive assumption\", and it is not a disclosed Moonshot rate. The span comes from that rent, utilization and, in the low case, a more input-heavy traffic mix. At $3/$15, K3 is priced between three and four times Kimi K2.7 Code ($0.95/$4), and that price is what holds the margin in the high 80s on a hardware base that is modest by frontier standards. At the page's Reference traffic the same inputs compute {{REF}}. The run could not reach the calculator's connector and reconstructed the equations by hand; the engine reproduces its figures to a tenth of a point.",
   "dive": {
    "id": "pr-20260925T060752Z-9a9c6e",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T06:59:23Z",
    "answer_sha256": "7452559cc8201f6a34776cc696e29c0c87370d4fecb596fad7614a3f4e40188b",
    "raw_answer_sha256": "35ce5320136a8b4d32f5fefb49e7f31bae6d0fe55fb89533a33428a4a0213836"
   },
   "review_page": "research/kimi-k3-astra-pro.html"
  },
  {
   "key": "glm-5-3",
   "name": "GLM-5.3",
   "provider": "Zhipu",
   "api_model": "glm-5.3, first-party metered text API, reasoning_effort=max; official release-note date 2026-08-18; open-weight release metadata 2026-08-28; priced as served 2026-09-25, backend checkpoint hash undisclosed",
   "open": true,
   "carrier": "glm",
   "scenarios": {
    "central": {
     "overrides": {
      "active": 40,
      "total": 753,
      "precision": "fp8",
      "priceIn": 1.4,
      "priceOut": 4.4,
      "cacheReadMult": 18.571428571428573,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "ascend": 100
      },
      "rentAbsLeg": {
       "ascend": 2.2
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 10,
      "cache_hit": 60
     }
    },
    "low_margin": {
     "overrides": {
      "active": 40,
      "total": 753,
      "precision": "fp8",
      "priceIn": 1.4,
      "priceOut": 4.4,
      "cacheReadMult": 18.571428571428573,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "ascend": 100
      },
      "rentAbsLeg": {
       "ascend": 2.2
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "fast",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 10,
      "cache_hit": 60
     }
    },
    "high_margin": {
     "overrides": {
      "active": 40,
      "total": 753,
      "precision": "fp8",
      "priceIn": 1.4,
      "priceOut": 4.4,
      "cacheReadMult": 18.571428571428573,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
       "ascend": 100
      },
      "rentAbsLeg": {
       "ascend": 1.8
      },
      "util": 75,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
     },
     "traffic": {
      "mode": "custom",
      "io_ratio": 10,
      "cache_hit": 60
     }
    }
   },
   "stated": {
    "headline_pct": 74.4898,
    "low_pct": 35.5728,
    "high_pct": 81.911
   },
   "card_lines": [
    "≈74.5% at list (span 36–82%)",
    "The deciding input is `interact: \"balanced\"`: the calculator’s shared-batch throughput, rather than its low-batch `fast` posture, carries the headline."
   ],
   "context_length_assumed": "Short-to-medium agent/text calls: representative 10,000 input plus 1,000 billed output tokens, including reasoning; decode context 10,500 and peak KV 11,000. These are assumptions, not production means; 1M is the supported ceiling, not the modeled average.",
   "confidence": "low: identity, tariff and geometry are well grounded, but fleet allocation, all-in procurement, occupancy, representative context and the throughput-versus-latency tradeoff are not measured; the span is three coherent scenarios, not a confidence interval.",
   "reading": "This card carries a wide span (36–82%), and the run is candid about why: the single decisive input is the calculator's latency posture. At `balanced` — shared batches, which the run takes as its proxy for a busy flagship API — the model computes about 74%; switching only the posture to `fast` (small, low-latency batches) costs about 39 points, and the low scenario is exactly that switch, nothing else. Nothing public says which posture Z.ai serves at, so the span is honest rather than wide by carelessness. The rest is unusually well anchored: GLM-5.3's weights are open (753B, held on the site's own GLM-5 row geometry, which the run matched field by field), the tariff is the provider's ($1.40/$4.40, cached input at $0.26 — 18.6%, not the rounded 19% the site's GLM row carries), and the fleet is priced entirely on Huawei Ascend at $2.20 per accelerator-hour. The page's own GLM 5.2 card reads about 31% on its July dive replay; the two differ mainly in rent (that replay uses the dive's 1.9× domestic rate multiplier) and in fleet mix, not in the model. For scale against the books: Zhipu's FY2025 results (HKEX filing) report an 18.9% cloud/API gross margin, and a reported H1 2026 figure 24.6% — company-level numbers on a wider perimeter than this unit serving margin. At the page's Reference traffic the same inputs compute {{REF}}.",
   "dive": {
    "id": "pr-20260925T063701Z-31c65b",
    "date": "2026-09-25",
    "model_slug": "gpt-6-pro",
    "answered_at": "2026-09-25T08:09:27Z",
    "answer_sha256": "9a17f873b7287ef94b1e623b10359a8d99bfd1758ab5189ad8b40d474a6918e4",
    "raw_answer_sha256": "7ba7d2471c2602752779bd24d1a044065d72d306e38e23115174f264ad12e799"
   },
   "review_page": "research/glm-5-3-astra-pro.html"
  }
 ]
}/*END-REGISTRY-JSON*/;

const ASTRA_PRO_SCENARIOS = Object.freeze(["central", "low_margin", "high_margin"]);

/* The engine symbols the replay uses. In the browser they are this page's globals (engine.js is
   a classic script loaded earlier); under node the caller passes require("./engine.js"). */
function astraProEngine(E) {
  if (E) return E;
  /* global MODELS, PERSPECTIVES, resolveTraffic, applyPresetSettings, sanitizeScenarioDiff,
     makeScenarioContext, workload, encodeScenario, FLEETS, DEFAULT_FLEET_ID, TOTAL_CASE_SCOPE, TOTAL_CASES, SCENARIO_BOUNDS */
  return { MODELS, PERSPECTIVES, resolveTraffic, applyPresetSettings, sanitizeScenarioDiff,
    makeScenarioContext, workload, encodeScenario, FLEETS, DEFAULT_FLEET_ID, TOTAL_CASE_SCOPE, TOTAL_CASES, SCENARIO_BOUNDS };
}

/* One operating point → the engine's state and result. Mirrors mcp-server/src/tools/run_scenario.ts
   (resolveTraffic → applyPresetSettings → sanitizeScenarioDiff → assign → makeScenarioContext →
   workload). A rejected override is an error here, never a silent drop: a recorded operating point
   the engine refuses is not the operating point the card claims. */
function astraProReplay(rec, scenarioKey, E) {
  const eng = astraProEngine(E);
  const scen = rec && rec.scenarios && rec.scenarios[scenarioKey];
  if (!scen) throw new Error("astra-pro: " + (rec && rec.key) + " has no scenario " + scenarioKey);
  const m = eng.MODELS.find(x => x.id === rec.carrier);
  const p = eng.PERSPECTIVES.find(x => x.id === "median");
  if (!m || !p) throw new Error("astra-pro: " + rec.key + ": unknown carrier " + rec.carrier);
  const t = scen.traffic;
  if (!t || t.mode !== "custom") throw new Error("astra-pro: " + rec.key + "/" + scenarioKey + ": traffic must be mode custom");
  /* the connector's fail-closed traffic bounds, mirrored (review r1 F7): a value run_scenario would
     refuse is refused here too, never computed on one surface and rejected on the other */
  const [ioLo, ioHi] = eng.SCENARIO_BOUNDS.ioRatio, [chLo, chHi] = eng.SCENARIO_BOUNDS.cacheHit;
  if (!(t.io_ratio >= ioLo && t.io_ratio <= ioHi && t.cache_hit >= chLo && t.cache_hit <= chHi))
    throw new Error("astra-pro: " + rec.key + "/" + scenarioKey + ": custom traffic outside the connector's bounds");
  if (scen.overrides && ("ioRatio" in scen.overrides || "cacheHit" in scen.overrides))
    throw new Error("astra-pro: " + rec.key + "/" + scenarioKey + ": traffic belongs in the traffic object, not in overrides");
  const sel = { mode: "custom", ioRatio: t.io_ratio, cacheHit: t.cache_hit };
  const tr = eng.resolveTraffic(m, p, sel);
  const base = eng.applyPresetSettings(m, p, sel);
  const { diff, rejected } = eng.sanitizeScenarioDiff(Object.assign({}, scen.overrides), tr, base);
  if (rejected && rejected.length)
    throw new Error("astra-pro: " + rec.key + "/" + scenarioKey + ": the engine rejected " + rejected.join("; "));
  const overrideKeys = Object.keys(diff).filter(k => JSON.stringify(diff[k]) !== JSON.stringify(base[k]));
  const state = Object.assign(base, JSON.parse(JSON.stringify(diff)));
  const ctx = eng.makeScenarioContext(m, tr, state.customDonor, p.kind, p.id);
  const wl = eng.workload(state, undefined, ctx);
  return { margin: wl.margin, costMix: wl.costMix, priceMix: wl.priceMix, state, tr, model: m, persp: p, overrideKeys };
}

/* All three operating points of one record, in percent. */
function astraProReadings(rec, E) {
  const out = {};
  ASTRA_PRO_SCENARIOS.forEach(k => { out[k] = astraProReplay(rec, k, E).margin * 100; });
  return out;
}

/* The "Reproduce this card" permalink token for the central operating point — minted the way the
   MCP connector mints run_scenario's share_url for a median-lens query with a custom traffic
   selection (wireIdentitiesFor: a blend override is a custom blend; a total override is a custom
   total), so the calculator opens on exactly this state. */
function astraProShareToken(rec, E) {
  const eng = astraProEngine(E);
  const r = astraProReplay(rec, "central", E);
  const m = r.model, s = r.state, keys = r.overrideKeys;
  const owns = ("blend" in (m.set || {})) || ("blend" in (r.persp.set || {}));
  const inFleetScope = eng.FLEETS[eng.DEFAULT_FLEET_ID].models.includes(m.id);
  const fleet = keys.includes("blend") ? "custom" : (inFleetScope && !owns ? eng.DEFAULT_FLEET_ID : "preset");
  const inTotalScope = eng.TOTAL_CASE_SCOPE.includes(m.id);
  const totalCase = keys.includes("total") ? "custom"
    : inTotalScope ? ((Object.entries(eng.TOTAL_CASES).find(([, c]) => c.totalB === s.total) || [])[0] || "custom")
      : "preset";
  return eng.encodeScenario(s, m.id, "median",
    { mode: r.tr.mode, profileId: r.tr.profileId, ioRatio: r.tr.ioRatio, cacheHit: r.tr.cacheHit },
    null, { fleet, totalCase });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ASTRA_PRO_REGISTRY, ASTRA_PRO_SCENARIOS, astraProReplay, astraProReadings, astraProShareToken };
}
