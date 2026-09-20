#!/usr/bin/env bash
# Application-level release tests (final-gate P0: the engine suites never exercised the browser
# path — the loader, replay identity, lens span and rendered metric wording live here).
# Renders site/index.html in headless Chromium with crafted ?s= links and asserts on the DOM.
#
# IM1 / v2.2 note: the LIVE permalink codec is v5. Pre-v5 tokens (v2/v3/v4) are DEPRECATED — they
# render the central scenario under a LOUD, visible notice (#epoch-deprecation-notice), never a
# silent default and never a resolved "Loaded a shared scenario". The forgery/resolution vectors
# below therefore use v5 tokens (live codec); a dedicated block asserts pre-v5 deprecation, including
# against the real minted-token corpus. All testing is against LOCAL file:// pages only.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
[ -n "$CHROME" ] || { echo "FATAL: no chromium/google-chrome on PATH — app tests are a release gate"; exit 1; }
BASE="file://$(pwd)/site/index.html"
# im-release-edit-r3 (2026-09-10): a re-minting aid, the third one this leg had to add. `check`
# reports what is MISSING and never what is THERE, so when the owner's ruling moved sixteen of these
# pinned figures at once, re-deriving each meant re-rendering every page by hand outside the script.
# APP_TEST_TMP=<dir> renders into that directory and leaves it in place; unset, behaviour is exactly
# as before (a temp dir, removed on exit). Same house pattern as DUMP_PARITY_HASHES and UX_C_MINT.
if [ -n "${APP_TEST_TMP:-}" ]; then
  TMP="$APP_TEST_TMP"; mkdir -p "$TMP"
  echo "APP_TEST_TMP set — rendered DOM kept in $TMP"
else
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT
fi
fails=0
# The feedback challenge is lazy-loaded only after form engagement, so this page render
# remains hermetic. --timeout is still a defensive upper bound for browser regressions.
# ============================================================================================
# RE-MINTED 2026-09-10 (im-release-edit-r3), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
# Seventeen CHECK LINES in this file moved — fifteen re-minted in place and two replaced by the
# strengthenings named at the bottom of this note (fallback review F11: the earlier wording said
# "seventeen figures" and "two were strengthened RATHER THAN re-minted" in the same breath, which
# cannot both be counted the same way. The unit here is check lines; one of them, the utilization
# lever, carries three figures on its own). All engine-derived, all re-minted from the RENDERED
# DOM rather than from arithmetic done in my head: the reference reading 51 -> 58, the calculator's
# own default state 62.90 -> 68.00, the Amendment-3 debt span 38.26-55.94 (17.68 pp) ->
# 52.06-62.99 (10.93 pp), the 5 T declared construction 58 -> 66 and its filtered control 57 -> 67
# (re-derived by executing tests/derive-c1-control.mjs, not assumed), the hazard pair's normative
# restore 42 -> 55, and the utilization lever 62.90->47.01 (15.90 pp) -> 68.00->54.28 (13.72 pp).
#
# ONE OF THEM CHANGED SIGN AND IS NOT A DIGIT SWAP: the gap against the analyst's stated figure was
# "0.6 points ABOVE what they state" and is now "0.7 points BELOW what they state". The page used to
# compute slightly more than the claim it cites and now computes slightly less. That is the ruling
# moving a comparison, not a rounding, and it is called out here so nobody re-mints past it.
#
# TWO ASSERTIONS WERE STRENGTHENED rather than re-minted, because the re-mint exposed them as weak:
#   * "the four computed exec rows render their engine values" pinned the bare substring "≈78%",
#     which any element on the page could satisfy. It is now three checks, each naming its ROW and
#     the sentence that identifies it (util-70 ≈77%, util-75 ≈79%, trend-6 ≈76%).
#   * the owned-TCO row likewise pinned a bare "≈90%"; it now names its own clause.
# ============================================================================================
# ============================================================================================
# RE-MINTED 2026-09-20 (im-vet-six-repairs, program bq-2835) — the six outside-reading findings.
# NINE check lines moved here, and they moved for THREE distinct reasons, which are not
# interchangeable and are kept apart on purpose:
#   (a) THE N1/P1 VOCABULARY RELEASE renamed ideas that carried two names each. Three pins were
#       quoting the retired name, not a stale number: "cost lens" -> "scenario preset",
#       "list tariff" -> "list price", "billable-share" -> "billable cached share". No arithmetic
#       moved under any of these three; the page says the same thing in the glossary's words.
#   (b) THE E1 TRAINIUM WITHDRAWAL and THE E2 TPU NUMERATOR REPAIR moved real values on every
#       reading that consumes the default fleet: the Amendment-3 debt span 52.06-62.99 (10.93 pp)
#       -> 47.61-61.30 (13.69 pp), the 5 T na-blend reading 66 -> 64, the 10 T hazard-pair restore
#       55 -> 47, the utilization lever 68.00->54.28 (13.72 pp) -> 68.41->54.88 (13.54 pp), and the
#       gap against the analyst's stated figure 0.7 -> 0.8 points. NOTE THE DIRECTION: every one of
#       these is the page computing LESS margin than before, which is what withdrawing a
#       favourably-modelled accelerator and lowering a decode numerator must do. A re-mint that
#       moved these UP would be evidence the repair was tuning, not repairing.
#   (c) THE C-1 FIXTURE WENT VACUOUS AND WAS RE-POINTED, not re-minted — see the long note at the
#       fixture itself. Its authored value negative is gone; the contract now lives at 10 T and is
#       asserted only against the derived control.
# The 0.7 -> 0.8 move does NOT change sign: the page computed slightly less than the claim it
# cites before this round and still does.
# ============================================================================================
RENDER_TIMEOUT_MS=8000
render() { # render <name> <url-suffix>
  "$CHROME" --headless=new --no-sandbox --disable-gpu --timeout="$RENDER_TIMEOUT_MS" \
    --virtual-time-budget=5000 --dump-dom "$BASE$1" 2>/dev/null
}
check() { # check <name> <dom-file> <must|mustnot> <pattern>
  local name="$1" f="$2" mode="$3" pat="$4"
  if [ "$mode" = must ]; then
    if grep -qF -- "$pat" "$f"; then echo "PASS  $name"; else echo "FAIL  $name — missing: $pat"; fails=$((fails+1)); fi
  else
    if grep -qF -- "$pat" "$f"; then echo "FAIL  $name — forbidden present: $pat"; fails=$((fails+1)); else echo "PASS  $name"; fi
  fi
}
# GPT Pro review pr-20260902T153840Z-bce1bb finding 4: a leading ">" is NOT hero scoping — it
# matches any element whose first serialized text begins with the token, and never names
# #out-margin. Read the hero node itself.
hero() { grep -o 'id="out-margin"[^>]*>[^<]*' "$1" | head -1 | sed 's/.*>//'; }
checkhero() { # checkhero <name> <dom-file> <is|isnot> <exact hero text>
  local name="$1" f="$2" mode="$3" want="$4" got
  got=$(hero "$f")
  if [ "$mode" = is ]; then
    if [ "$got" = "$want" ]; then echo "PASS  $name"; else echo "FAIL  $name — #out-margin reads: $got"; fails=$((fails+1)); fi
  else
    if [ "$got" = "$want" ]; then echo "FAIL  $name — forbidden hero rendered: $got"; fails=$((fails+1)); else echo "PASS  $name"; fi
  fi
}
b64() { node -e "process.stdout.write(Buffer.from(process.argv[1],'utf8').toString('base64'))" "$1"; }
urlenc() { node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"; }

# --- 0. default load: metric wording + no named zones ---
render "" > "$TMP/default.html"
# RE-MINTED 2026-09-20 (im-vet-six-repairs, Astra xhigh fold, review finding 6). This pin is the
# reason the defect was live rather than theoretical: site/index.html had already been renamed to
# "Serving margin" by the N1 release, while site/app.js rewrote the same node to "Unit serving
# margin" on every render — so the label a reader saw depended on whether the app had re-rendered
# yet, and this check was passing on the app's copy. app.js and labels.ts now carry the canonical
# name, and the pin moves with them. The CONTRACT is unchanged and is what matters here: the hero
# must always say the metric is not a company gross margin.
check "hero label: unit-vs-company GM" "$TMP/default.html" must "Serving margin — not company GM"
check "no named margin zones" "$TMP/default.html" mustnot "TeorTaxes/Zephyr 90"
# R2 re-mint + OWNER PICK 2026-07-23 (q-im-landing-hero-pick, LANDING_HERO_MODE=
# "policy-labeled" — Option B): the landing default DISPLAYS the full-fleet number as an
# explicitly policy-labeled scenario output with the capped leg welded INLINE; the
# suppress branch stays release-tested via tests/landing-hero-modes.test.mjs (R-4b).
check "default page renders the public-evidence reference reading ≈58% (im-release-edit-r3 re-mint: the owner-ruled rent adoption)" "$TMP/default.html" must "≈58%"
check "default hero value token carries the policy-labeled identity (D-3b crop bar)" "$TMP/default.html" must "≈58% — policy-labeled scenario"
# b9 M1: the loaded-bytes band's 0.55 B/param point now rounds to ≈47%, so a bare
# "≈47%" negative fires on a legitimate band token. Scoped to the element-initial HERO
# form (the same technique the C-1 negative below uses) — this still fails if the
# retired pre-R3 headline ever renders AS THE HERO, which is what the check is for.
check "default hero never shows the pre-R3 headline as the hero" "$TMP/default.html" mustnot ">≈47% — policy-labeled scenario"
check "default surface carries NO exclusion clause (FA J-9: nothing is excluded at the revised size)" "$TMP/default.html" mustnot "excluded from the default"
check "final-answer block renders the conservative planning case (b9 M1 label + value re-mint)" "$TMP/default.html" must "The conservative planning case, priced at low/committed planning rates: ≈58%"
# T5 rec 5 (GPT Pro 2026-07-29 §6, SV-2): the Authority-2 token is renamed off "the most
# plausible reading …" and its node MOVED OUT of THE ANSWER into the
# evidence-ranking section. All four checks below are needed: the new phrase must render, the
# retired one must be gone from the DOM, the SOURCE CLAIM must survive the rename (the rec says
# "Preserve the source claim"), and the node must actually be where it was moved to.
check "final-answer block renders the analyst-hypothesis token (Authority 2, T5 rec 5 wording)" "$TMP/default.html" must "The strongest external analyst hypothesis carried by this registry: above 80%"
# Assembled at runtime for the same reason the JS sweeps are: this file is mirrored into
# site/tests/ and served, so a literal here would publish the phrase it forbids.
RETIRED_PHRASE="most plausible reading of the actual""$(printf ' figure')"
BARRED_OBJECT="actual""$(printf ' figure')"
check "the retired seven-word framing renders NOWHERE in the DOM (T5 rec 5)" "$TMP/default.html" mustnot "$RETIRED_PHRASE"
# The rec bars the two-word object outright, not only the long framing it appeared in.
check "the barred two-word object renders NOWHERE in the DOM (T5 rec 5)" "$TMP/default.html" mustnot "$BARRED_OBJECT"
check "T5 rec 5: the source claim survives the rename" "$TMP/default.html" must "north of 80 percent for the API price"
# The RELOCATION itself is asserted positionally in tests/fa-m6-b9.test.mjs (DOM offsets: after
# every ANSWER block, inside #fa-higher, before #fa-decomposition). It is deliberately not
# restated here: this harness greps a flat DOM dump, so the only check it could express is
# "#fa-higher exists" — which passes whether or not the node moved, and a check that cannot fail
# for the reason it names is worse than no check.
check "final-answer block renders the higher-justifications header" "$TMP/default.html" must "Why not the higher numbers?"
check "final-answer block renders the decomposition line" "$TMP/default.html" must "replacing the declared topology weights"
check "final-answer block: seven justification entries render" "$TMP/default.html" must "Alderson ~90 class-wide"
check "final-answer block: no process language in the DOM (R5 N2)" "$TMP/default.html" mustnot "best-supported"
check "final-answer block: no process language in the DOM (FA-safe label)" "$TMP/default.html" mustnot "FA-safe"
check "default hero is POLICY-LABELED inline" "$TMP/default.html" must "POLICY-LABELED SCENARIO OUTPUT"
check "default declares all seven fleet legs renderable" "$TMP/default.html" must "all 7 of 7 declared fleet legs renderable at declared serving topology"
# Post-peak-KV (external review FIX-38), non-default panels may legitimately disclose an
# h100 capacity cap ("not renderable under this policy: h100 — capacity target ..."), so the
# guard is scoped to the DEFAULT 7-leg fleet clause instead of the whole DOM: the default
# fleet must never report a leg failing under the policy.
check "default carries no stale H100 policy exclusion" "$TMP/default.html" mustnot "of 7 declared fleet legs renderable at declared serving topology capacity widths solved per leg under the declared loaded-bytes planning policy (1 B/param — CAPACITY_BYTES_POLICY (analyst planning default, dive §B; capacity-only, never sW)); solver output — never an observed deployment. not renderable under this policy: h100"
check "default emits the five-status vector" "$TMP/default.html" must "fleet status — weightCapacity: FEASIBLE-under-policy"
check "default carries the sampled policy band" "$TMP/default.html" must "sampled 3-point loaded-bytes policy sensitivity"
check "default never claims the retired pre-R2 number" "$TMP/default.html" mustnot "≈57%"
check "default never claims a bare central identity" "$TMP/default.html" mustnot "central scenario — clean default"
check "default load: no deprecation notice" "$TMP/default.html" mustnot "predates the v2.2 engine"

# --- 0b. small-total model: sensitivity chart must not request active > total ---
T0B=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-27","model":"luna","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T0B")" > "$TMP/small-total.html"
check "small-total model renders beyond the sensitivity chart" "$TMP/small-total.html" must "Value at list API prices"

# Accepted link-domain edge: active=1,total=10 must remain representable and render.
T0C=$(b64 '{"active":1,"total":10,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-27","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T0C")" > "$TMP/min-size.html"
check "minimum accepted model size renders beyond the sensitivity chart" "$TMP/min-size.html" must "Value at list API prices"

# --- 1. original MLI-1 forged payload on the LIVE (v5) codec: replay lock holds ---
T1=$(b64 '{"ioRatio":300,"cacheHit":95,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v5.$T1")" > "$TMP/t1.html"
check "MLI-1 payload: locked margin ≈19%" "$TMP/t1.html" must "≈19%"
check "MLI-1 payload: rejection reported" "$TMP/t1.html" must "replay-integrity"
check "MLI-1 payload: forged 71x absent" "$TMP/t1.html" mustnot "≈72%"

# --- 2. schema-downgrade forgery on the LIVE codec: v5 prefix + inner v2 meta = rejected outright ---
T2=$(b64 '{"ioRatio":300,"cacheHit":95,"_meta":{"schema":"v2","model":"grok","persp":"xaiopp"}}')
render "?s=$(urlenc "v5.$T2")" > "$TMP/t2.html"
check "schema-downgrade: link rejected (no shared-scenario note)" "$TMP/t2.html" mustnot "Loaded a shared scenario"
check "schema-downgrade: default state renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t2.html" must "POLICY-LABELED SCENARIO OUTPUT"

# --- 3. non-traffic replay overlay: exits replay identity ---
T3=$(b64 '{"active":15,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v5.$T3")" > "$TMP/t3.html"
check "replay-divergent overlay: attribution removed" "$TMP/t3.html" must "MODIFIED SCENARIO"
check "replay-divergent overlay: modified option exists" "$TMP/t3.html" must "[modified scenario] derived from"
check "replay-divergent overlay: no locked-replay label" "$TMP/t3.html" mustnot "locked by [valuation replay]"

# --- 4. invalid ranges/enums/blend rejected ---
T4=$(b64 '{"util":0,"precision":"bogus","rentMult":999999,"blend":{"h100":-5},"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T4")" > "$TMP/t4.html"
check "bounds: rejections reported" "$TMP/t4.html" must "failed schema or replay-integrity validation"
check "bounds: default margin intact (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t4.html" must "POLICY-LABELED SCENARIO OUTPUT"

# --- 5. clean replay link: lens span at the replay's traffic, lock label intact ---
T5=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v5.$T5")" > "$TMP/t5.html"
check "clean replay: locked label present" "$TMP/t5.html" must "locked by"
check "clean replay: single-lens span honest (N1 re-mint: 'cost lens' -> 'scenario preset'; the VALUE is now pinned too, so the clause cannot go vacuous under a rename)" "$TMP/t5.html" must "only one scenario preset is compatible at this scope (24.0%)"
check "clean replay: no hidden-default 43% comparator" "$TMP/t5.html" mustnot "43.4%"

# --- 6. DEPRECATION (IM1): a real v2 link no longer migrates — it renders the central scenario under the LOUD notice ---
T6=$(b64 '{"_meta":{"dataAsOf":"2026-07-10","schema":"v2","engine":"v2.1.1-2026-07-10","model":"glm","persp":"median"}}')
render "?s=$(urlenc "v2.$T6")" > "$TMP/t6.html"
check "v2 link: LOUD deprecation notice renders" "$TMP/t6.html" must "predates the v2.2 engine"
check "v2 link: no silent migration (no shared-scenario note)" "$TMP/t6.html" mustnot "Loaded a shared scenario"
check "v2 link: central scenario renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t6.html" must "POLICY-LABELED SCENARIO OUTPUT"

# --- 7. DEPRECATION (IM1): a real retired-preset v3 share-link no longer migrates to a successor route — deprecated ---
T7=$(b64 '{"_meta":{"schema":"v3","engine":"v2.1.1-2026-07-10","model":"opus","persp":"teortaxes"}}')
render "?s=$(urlenc "v3.$T7")" > "$TMP/t7.html"
check "v3 retired-id link: LOUD deprecation notice renders" "$TMP/t7.html" must "predates the v2.2 engine"
check "v3 retired-id link: no successor margin loaded" "$TMP/t7.html" mustnot "At the current selection it lands at ≈92%"
check "v3 retired-id link: central scenario renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t7.html" must "POLICY-LABELED SCENARIO OUTPUT"

# --- 8. v5 route share-link renders the range-exploration counterfactual identity for the SPECIFIC route
#        (≈86% is x90-v1's activated selection margin; loaded-specific, absent on default) ---
T8=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b8090","configId":"x90-v1"}}}')
render "?s=$(urlenc "v5.$T8")" > "$TMP/t8.html"
check "v5 route: counterfactual identity present" "$TMP/t8.html" must "RANGE EXPLORATION — page-authored counterfactual"
# b9 M5 re-mint: the live selection carries the ratified +3 prior (≈89 → ≈92, cost-side ÷E);
# the AUTHORED-RANGE verdict re-anchors to the route's own construction at the public-evidence
# reference, where it still computes ≈89 and is still disclosed as short of ≥90.
check "v5 route: the specific route loaded (≈92% live under the ratified prior; b9 M5 re-mint)" "$TMP/t8.html" must "At the current selection it lands at ≈92%"
check "v5 route: the route's own construction is stated at the public-evidence reference (≈89%)" "$TMP/t8.html" must "the route's own construction at the public-evidence reference computes ≈89%"
check "v5 route: integrity discloses OUTSIDE the AUTHORED range (b9 M1: x90-v1 at 89.07 vs authored >=90 — still short, still disclosed)" "$TMP/t8.html" must "OUTSIDE the range it was authored for"

# --- 9. share-link traffic consistency across every declared shape: a diff traffic value disagreeing with the
#        declared profile is reconciled to Custom, so displayed identity = resolved traffic = computed margin ---
T9A=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"ncode","ioRatio":8,"cacheHit":41}}}')
render "?s=$(urlenc "v5.$T9A")" > "$TMP/t9a.html"
check "traffic consistency (native declared): reconciled to Custom 99:1" "$TMP/t9a.html" must "Effective traffic mix: 99:1 / 1% — Custom"
T9B=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"opus","persp":"median","traffic":{"mode":"custom","profileId":null,"ioRatio":8,"cacheHit":41}}}')
render "?s=$(urlenc "v5.$T9B")" > "$TMP/t9b.html"
check "traffic consistency (custom declared): label matches computed 99:1 (no stale label)" "$TMP/t9b.html" must "Effective traffic mix: 99:1 / 1% — Custom"
T9C=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b8090","configId":"x90-v1"}}}')
render "?s=$(urlenc "v5.$T9C")" > "$TMP/t9c.html"
check "traffic consistency (exploration): reconciled to Custom 99:1" "$TMP/t9c.html" must "Effective traffic mix: 99:1 / 1% — Custom"
check "traffic consistency (exploration): exits to modified, no false in-range claim" "$TMP/t9c.html" must "MODIFIED RANGE EXPLORATION"

# --- 10. fail-closed identity: a share-link whose model or perspective does not resolve is REFUSED
#         whole - numbers never render under a substituted/mislabeled identity ---
T10A=$(b64 '{"util":100,"rentMult":0.02,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"does-not-exist","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T10A")" > "$TMP/t10a.html"
check "fail-closed unknown-model: link refused (no shared-scenario note)" "$TMP/t10a.html" mustnot "Loaded a shared scenario"
check "fail-closed unknown-model: default state renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t10a.html" must "POLICY-LABELED SCENARIO OUTPUT"
T10B=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"nonesuch","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T10B")" > "$TMP/t10b.html"
check "fail-closed unknown-persp: default state renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t10b.html" must "POLICY-LABELED SCENARIO OUTPUT"

# --- 11. metadata-traffic bounds: an out-of-range or bad-mode _meta.traffic is rejected, not applied ---
T11=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":-50,"cacheHit":999}}}')
render "?s=$(urlenc "v5.$T11")" > "$TMP/t11.html"
check "fail-closed oob-traffic: rejected, default renders (R2+pick: the policy-labeled hero IS the default render)" "$TMP/t11.html" must "POLICY-LABELED SCENARIO OUTPUT"
check "fail-closed oob-traffic: no shared-scenario note" "$TMP/t11.html" mustnot "Loaded a shared scenario"

# --- 12. hero caption is INTERVAL-AWARE: within [90,95] says "within"; above 95 says "above the interval" (P0-5) ---
T12A=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"gpt","persp":"dive","traffic":{"mode":"replay-locked","profileId":"openai-dive","ioRatio":9,"cacheHit":78}}}')
render "?s=$(urlenc "v5.$T12A")" > "$TMP/t12a.html"
check "hero caption within-90-95 (GPT dive ≈93%)" "$TMP/t12a.html" must "within the cited 90–95% unit-serving claim range"
T12B=$(b64 '{"util":100,"rentMult":0.1,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$T12B")" > "$TMP/t12b.html"
check "hero caption above-95 (crafted ≈99%) says above the interval, not falsely within" "$TMP/t12b.html" must "above the cited 90–95% unit-serving claim interval"
# public-release P0 (Risk's crafted-permalink vector): the SAME ≈99%-under-median link must now read
# MODIFIED/CRAFTED on the result surface, and the board must NOT call it central.
check "T12B crafted link: hero note flags CRAFTED out-of-slider values" "$TMP/t12b.html" must "CRAFTED (values outside the visible slider range"
check "T12B crafted link: identity strip is id-modified" "$TMP/t12b.html" must 'class="identity-strip id-modified"'
check "T12B crafted link: board does NOT falsely say central" "$TMP/t12b.html" mustnot "the clean Model / Traffic-mix default"

# --- 13. SIX-STATE identity harness (public-release P0): for each state assert (a) the identity strip
#         names model+traffic+lens, (b) the evidence board NEVER falsely says "central" for a
#         non-central/modified state, (c) the "Return to central scenario" reset control is present.
#         (The clean-central state instead asserts the board DOES say central and the reset is hidden.) ---
CENTRAL_PHRASE="the clean Model / Traffic-mix default"
RESET_TXT="Return to central scenario"
# state 1: the LANDING state (no permalink).
# row 499 (owner ruling 0c8102): the page no longer opens on the clean central scenario — it opens
# on the named estimate preset that carries no algorithmic lead. These checks therefore describe the
# LANDING state and pin the ruling itself: a regression back to a central landing fails here. What
# this static-render suite cannot do is drive the selector, so the central-state DOM checks that used
# to ride on this same render are commented with their reason below; their values stay pinned by the
# node suites, which compute them directly.
render "" > "$TMP/s1.html"
check "state landing: NOT the clean-central identity (the page opens on the estimate preset)" "$TMP/s1.html" mustnot 'class="identity-strip id-central"'
check "state landing: strip names Opus"                 "$TMP/s1.html" must "Claude Opus 4.x"
check "state landing: the opening preset is labeled the page-open default" "$TMP/s1.html" must "page-open default"
# row-514 opener (2026-08-09, gate d-opener-enact-20260809): the page now opens on the round-3
# self-authored Pro preset, whose author MOVED the lead off zero (0/2/4 declared range, median 2).
# The landing therefore states the author's own lead instead of the old NO-PRIOR chip.
check "state landing: the opening preset states its author's own lead (2 months)" "$TMP/s1.html" must "at an algorithmic lead of 2 months"
check "state landing: one-click return to the central scenario is offered" "$TMP/s1.html" must "$RESET_TXT"
# --- 13b. b9 M2 family 9c: the form-correction debt disclosure (memo §3.5; Amendment-3 values).
#          The span is ENGINE-COMPUTED at the flagship baseline (probe8 cross-derives 53.2407/64.1687/
#          10.93); the per-leg sizes, the family-3 "~15× wrong" exposure, and the memo-§5 replication
#          residual must all reach a READER, not just a caller. ---
check "debt aside: OPEN CALIBRATION DEBT lead renders"    "$TMP/s1.html" must "OPEN CALIBRATION DEBT"
check "debt aside: Amendment-3 span renders (47.61%%-61.30%%, 13.69 pp)" "$TMP/s1.html" must "47.61%–61.30% (13.69 pp)"
check "debt aside: NOT the superseded with-replacement span" "$TMP/s1.html" mustnot "53.29%–64.17%"
# row 499: per-leg debt sizes are fleet-dependent, and the landing fleet is now the preset's own
# blend. The fleet-independent span above still renders and is still checked.
#check "debt aside: per-leg open-debt sizes render"        "$TMP/s1.html" must "Per-leg at the declared N_phys (η held): h100 3.20×, h200 2.23×, gb200 0.97×, gb300 0.96×, trn2 1.83×, trn3 1.83×"
check "debt aside: per-leg sizes labeled not-repaired"    "$TMP/s1.html" must "open-debt sizes, not repaired estimates"
# row 499: Trainium is EXCLUDED from the landing preset's blend by that reviewer's own instruction,
# so its exposure sentence does not render on the landing state; the sentence itself is unchanged.
#check "debt aside: family-3 Trainium exposure statement"  "$TMP/s1.html" must "may be ~15× wrong"
check "debt aside: memo §5 replication residual renders"  "$TMP/s1.html" must "topology-aware charge carries the §C4 replication residual"
# state 2: §10 dive replay (gpt)
S2=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"gpt","persp":"dive","traffic":{"mode":"native","profileId":"openai-dive","ioRatio":9,"cacheHit":78}}}')
render "?s=$(urlenc "v5.$S2")" > "$TMP/s2.html"
check "state dive: strip names model GPT-5.6 Sol"        "$TMP/s2.html" must "GPT-5.6 Sol"
check "state dive: strip names traffic"                  "$TMP/s2.html" must "traffic 9:1 / 78%"
check "state dive: strip names the dive lens"            "$TMP/s2.html" must "§10 dive (this model)"
check "state dive: board NOT falsely central"            "$TMP/s2.html" mustnot "$CENTRAL_PHRASE"
check "state dive: reset control present"                "$TMP/s2.html" must "$RESET_TXT"
# state 3: xAI cash (grok, replay-locked)
S3=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"grok","persp":"xaicash","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v5.$S3")" > "$TMP/s3.html"
check "state xAI-cash: strip names Grok"                 "$TMP/s3.html" must "Grok 4.5"
check "state xAI-cash: strip names cash-marginal lens"   "$TMP/s3.html" must "xAI cash-marginal"
check "state xAI-cash: traffic shown locked"             "$TMP/s3.html" must "3:1 / 0% (locked)"
# A CLEAN replay whose published operating point legitimately sits outside the slider bounds
# (rentMult 0.156 < the 0.5 slider min) must read CLEAN, never falsely MODIFIED/CRAFTED.
check "state xAI-cash: reads CLEAN replay (not MODIFIED)" "$TMP/s3.html" must "clean replay — published operating point"
check "state xAI-cash: not falsely id-modified"          "$TMP/s3.html" mustnot 'class="identity-strip id-modified"'
check "state xAI-cash: board NOT falsely central"        "$TMP/s3.html" mustnot "$CENTRAL_PHRASE"
check "state xAI-cash: reset control present"            "$TMP/s3.html" must "$RESET_TXT"
# state 4: xAI opportunity (grok, replay-locked)
S4=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v5.$S4")" > "$TMP/s4.html"
check "state xAI-opp: strip names opportunity-cost lens" "$TMP/s4.html" must "xAI opportunity-cost"
check "state xAI-opp: board NOT falsely central"         "$TMP/s4.html" mustnot "$CENTRAL_PHRASE"
check "state xAI-opp: reset control present"             "$TMP/s4.html" must "$RESET_TXT"
# state 5: range-exploration counterfactual (opus x90-v1)
S5=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","engine":"v2.2.0-dev-2026-07-19","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b8090","configId":"x90-v1"}}}')
render "?s=$(urlenc "v5.$S5")" > "$TMP/s5.html"
check "state route: identity strip id-counterfactual"    "$TMP/s5.html" must 'class="identity-strip id-counterfactual"'
check "state route: strip names the route"               "$TMP/s5.html" must "owned-TCO estate route"
check "state route: strip says counterfactual"           "$TMP/s5.html" must "range-exploration counterfactual"
check "state route: board NOT falsely central"           "$TMP/s5.html" mustnot "$CENTRAL_PHRASE"
check "state route: reset control present"               "$TMP/s5.html" must "$RESET_TXT"
# state 6: Custom (user-defined, unsourced)
S6=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"preset"},"totalCase":"preset","engine":"v2.2.0-dev-2026-07-19","model":"custom","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$S6")" > "$TMP/s6.html"
check "state Custom: strip marks user-defined/unsourced" "$TMP/s6.html" must "user-defined, unsourced"
check "state Custom: strip names inherited lens"         "$TMP/s6.html" must "inherits the Central scenario (Claude) lens"
check "state Custom: hero note suppresses cited-claim framing" "$TMP/s6.html" must "USER-DEFINED SCENARIO"
check "state Custom: board NOT falsely central"          "$TMP/s6.html" mustnot "$CENTRAL_PHRASE"
check "state Custom: reset control present"              "$TMP/s6.html" must "$RESET_TXT"

# --- 14. EPOCH DEPRECATION corpus (IM1 / v2.2): representative REAL minted tokens from the v2.1.11
#         corpus (tests/fixtures-minted-tokens-v211.json) must each hit the LOUD deprecation notice +
#         central scenario — never a silent default, never a resolved "Loaded a shared scenario". The
#         full 84-token proof is the node suite tests/epoch-deprecation.test.mjs; this is the DOM proof. ---
DEP_V4=$(node -e 'process.stdout.write(require("./tests/fixtures-minted-tokens-v211.json").v4[0].token)')
DEP_V3=$(node -e 'const c=require("./tests/fixtures-minted-tokens-v211.json");process.stdout.write(c.historical.find(x=>x.encoderVersion==="v3").token)')
DEP_V2=$(node -e 'const c=require("./tests/fixtures-minted-tokens-v211.json");process.stdout.write(c.historical.find(x=>x.encoderVersion==="v2").token)')
for pair in "v4:$DEP_V4" "v3:$DEP_V3" "v2:$DEP_V2"; do
  ver="${pair%%:*}"; tok="${pair#*:}"
  render "?s=$(urlenc "$tok")" > "$TMP/dep-$ver.html"
  check "corpus $ver token: LOUD deprecation notice renders"       "$TMP/dep-$ver.html" must "predates the v2.2 engine"
  check "corpus $ver token: says it can no longer be resolved"     "$TMP/dep-$ver.html" must "can no longer be resolved"
  check "corpus $ver token: central scenario renders (not silent; R2: suppressed landing tile)" "$TMP/dep-$ver.html" must "POLICY-LABELED SCENARIO OUTPUT"
  check "corpus $ver token: NOT resolved as a shared scenario"     "$TMP/dep-$ver.html" mustnot "Loaded a shared scenario"
  # row 499 (owner ruling ccb4a1): a DEPRECATED link renders THIS page's own default, so the
  # shared-link banner must NOT be raised there — saying "these are someone else's assumptions"
  # over the page's own numbers would be exactly backwards. This is the negative case that makes
  # the positive ones below mean something.
  check "corpus $ver token: shared-link banner NOT raised (the page's own default is what renders)" \
        "$TMP/dep-$ver.html" mustnot "You are looking at a SHARED LINK"
done

# --- row 499 (owner ruling ccb4a1, 2026-08-06): THE SHARED-LINK BANNER. A reader arriving on a
#     ?s= link is looking at somebody else's saved parameters. Before this, the page said so only
#     inside the scenario note, below the hero — quotable headline, invisible provenance. The banner
#     is raised above everything on every RESOLVED link, whatever identity it carries, and is absent
#     on the default render and on deprecated links (above).
check "shared-link banner: raised on a clean resolved link"        "$TMP/t1.html" must "You are looking at a SHARED LINK"
check "shared-link banner: names whose assumptions these are"      "$TMP/t1.html" must "not this page's own assumptions"
check "shared-link banner: says the numbers came from the link"    "$TMP/t1.html" must "frozen into this link by whoever shared it"
check "shared-link banner: offers the page's own default"          "$TMP/t1.html" must "Show this page's own default instead"
check "shared-link banner: carries the restored identity"          "$TMP/t1.html" must "slb-detail"
check "shared-link banner: ABSENT on the default render (no link)" "$TMP/s1.html" mustnot "You are looking at a SHARED LINK"
check "shared-link banner: absent when a link is rejected whole"   "$TMP/t2.html" mustnot "You are looking at a SHARED LINK"

# --- row 499 (titled share links, owner ruling on q-row499-titled-links-v2: option B, title-in-token,
#     no store, no disclaimer). The DOM half: a title renders as the sharer's QUOTED label, and
#     markup inside one renders as characters — the title is attacker-controlled by construction. ---
TITLED=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const m=E.MODELS.find(x=>x.id==="opus"), p=E.PERSPECTIVES.find(x=>x.id==="median");
const S=E.applyPresetSettings(m,p,{mode:"native",profileId:null}); S.util=60;
process.stdout.write(E.encodeScenario(S,"opus","median",{mode:"custom",ioRatio:S.ioRatio,cacheHit:S.cacheHit},null,{fleet:"custom",totalCase:"custom"},{title:"my agentic <b>case</b>"}));')
render "?s=$(urlenc "$TITLED")" > "$TMP/titled.html"
check "titled link: the banner still fires"                    "$TMP/titled.html" must "You are looking at a SHARED LINK"
check "titled link: the sharer's label renders, attributed"     "$TMP/titled.html" must "Shared as:"
check "titled link: the title's text is present"                "$TMP/titled.html" must "my agentic"
check "titled link: markup inside a title is ESCAPED, not live" "$TMP/titled.html" mustnot "my agentic <b>case</b>"
check "titled link: no store was contacted (the token carries it)" "$TMP/titled.html" mustnot "api.ashitaorbis"
check "untitled link: no orphan label"                          "$TMP/t1.html" mustnot "Shared as:"

# --- row 499 (1/2/3-point sliders, owner note 507081): the toggle ships, and the band readout is
#     ABSENT until a reader bounds something — a page that always shows a range teaches readers to
#     ignore it. The copy governing how a band may be read is asserted verbatim. ---
check "point mode: the toggle renders above the sliders"       "$TMP/s1.html" must "Each assumption is:"
check "point mode: all three positions are offered"            "$TMP/s1.html" must "3 points (median + bounds)"
check "point mode: the middle point is called a MEDIAN, not a mode" "$TMP/s1.html" mustnot "most likely"
check "point mode: the toggle REFLECTS a scenario that declares ranges (opens at 3 points)" "$TMP/s1.html" must 'aria-pressed="true">3 points'

# REVISED, and the reason is a ruling rather than a convenience: the page-open default now carries
# the FIVE ranges its author actually declared, so a band at page open is the preset telling the
# truth about itself, not the page manufacturing one. The property that assertion was protecting —
# a page does not show a range nobody declared — is preserved and now pinned where it is testable:
# the stress case declares nothing and shows nothing, asserted in the node suite, and the readout is
# still absent for any scenario with no ranges (`if (!dials.length) el.hidden = true`).
check "band readout: its container exists"                      "$TMP/s1.html" must "out-margin-band"
# AMENDED 2026-09-19 (Polaris ruling on Astra pack A P0-2): the copy stated an exhaustiveness the
# search cannot prove. It now states the method, and the check follows it.
check "band readout: the page-open default SHOWS its author's declared ranges" "$TMP/s1.html" must "The range found by searching the dials you bounded"
# PER-DIAL IS THE DEFAULT READING. The compounded box is a second, deliberate act.
check "band: per-dial ranges are what renders"                  "$TMP/s1.html" must "moves the margin to ON ITS OWN"
check "band: dials are named in the reader's words, never as state keys" "$TMP/s1.html" mustnot "rentMultFam.tpu"
check "band: the widest declared axis renders first"            "$TMP/s1.html" must "points wide"
# THE QUOTED ADJUDICATOR PAIR (owner ruling 19:02Z, adjudicated 2026-08-08 as the quoted reading:
# stated median over STATED range, "displayable the same way they have been framing it"). This is a
# QUOTATION, not a second output of this page — so the checks are mostly about it not being mistaken
# for one, and about it never becoming a back door for the computed range the opt-in governs.
check "stated: the author's own pair renders beneath the headline" "$TMP/s1.html" must 'id="out-stated-reading"'
check "stated: ...as the stated median over the stated range"   "$TMP/s1.html" must "Author's stated reading: ≈83.1 % (68–92 %)"
check "stated: it says QUOTED, not computed here"               "$TMP/s1.html" must "QUOTED, not computed here"
check "stated: it names whose figures they are"                 "$TMP/s1.html" must "Stated by GPT-5.6 Pro"
check "stated: it names the basis they were stated on"          "$TMP/s1.html" must "at the undiscounted list price"
check "stated: it states the gap against what this page computes" "$TMP/s1.html" must "0.8 points below what they state"
# 2026-08-16 a-im-legibility: the assertion kept its meaning and dropped its version narration.
# It exists to prove the span is disclosed as the AUTHOR'S SELECTED span rather than a live-engine
# corner band; "carried over from round 2" was the page telling the reader about a previous
# version, which the owner's standing rule (annotation 2026-08-16) removes from every surface.
check "stated: ...and carries the author's own span provenance (the span is the author's selection, not a live-engine corner band)" "$TMP/s1.html" must "its own SELECTED span, deliberately NOT widened"
# THE QUOTED PAIR IS NOT THE DERIVED BAND. The computed compounded range stays behind its opt-in;
# a reader must not be able to reach it through this element.
check "stated: the quoted pair is not the derived band's numbers" "$TMP/s1.html" mustnot "Author's stated reading: ≈80"
check "stated: no computed compounded value rides in on it"     "$TMP/s1.html" mustnot "band-compounded-value"

# RESTORED 2026-08-08 on adjudication. The 19:02Z header framing was built and is REVERSED here: it
# rendered the compounded whole-box value by default, which the frozen presentation requirement
# forbids whatever element it is written into. The acceptance it rested on was given against a card
# that itself described the compounded range as sitting BEHIND AN OPT-IN CONTROL, so the acceptance
# covers the opt-in rather than its removal. Per-dial-at-open stands (owner-accepted).
check "band: the compounded range is OPT-IN, not shown"         "$TMP/s1.html" must 'aria-expanded="false"'
check "band: ...and its control says what it would show"        "$TMP/s1.html" must "Show the compounded range across all 10 bounded assumptions"
check "band: the compounded VALUE is absent until asked for"    "$TMP/s1.html" mustnot "band-compounded-value"
check "band: the word compounded is carried by the control"     "$TMP/s1.html" must "compounded"
# THE DEFAULT-RENDER PATH IS GONE, not merely hidden — a hidden renderer is one flag away from
# rendering, so the element and its function are both absent rather than suppressed.
check "hero: no compounded range renders beneath the headline number" "$TMP/s1.html" mustnot "out-margin-range"
check "hero: ...and the hero carries the point value alone"     "$TMP/s1.html" mustnot "the number above is the median stated for each"
# THE FAMILY DIAL IS INERT HERE, AND THE PAGE SAYS SO rather than reporting no uncertainty.
check "band: a family range reaching past per-leg values is disclosed" "$TMP/s1.html" must "which normally override the family control"
check "band: ...and the family-scoped range names the legs it moved" "$TMP/s1.html" must "the NVIDIA range moves H100 SXM"
# THE LEAD BASIS IS DECLARED — a band is a bracket, and this page does not draw one on a mixed basis.
check "band: the lead basis is declared on the readout"         "$TMP/s1.html" must "Lead basis: the algorithmic-lead prior itself is part of this range (0 to 4 months)"
check "band: ...and states the prior is inside the range, never applied twice" "$TMP/s1.html" must "it is not applied again on top"
# A dial whose declared range moves nothing says so, instead of rendering a zero-width range.
check "band: a dial that moves nothing says so, not a zero-width range" "$TMP/s1.html" must "moves the margin by nothing at this fleet blend"
# The page DOES say "confidence interval" — in the sentence denying that it has one, which is the
# behaviour the uncertainty contract requires. So the assertion is on the CLAIM, not the phrase:
# nothing may present a span AS a confidence interval or a probability.
check "band readout: the page never presents a span AS a confidence interval" "$TMP/s1.html" mustnot "is a confidence interval"
# OWNER RULING 2026-08-07: the band copy STATES what the range is and never disclaims with the terms
# it is disclaiming. A negative mention still puts the word in front of a reader who was not thinking
# it, and half of them keep the term and lose the negation. These are scoped to the band surface —
# the lens-span note next door keeps its own long-standing denial, which is not this change's copy.
# SCOPED TO THE BAND ELEMENT, deliberately, and the scoping is the honest part. The page has said
# "not a probability interval" since long before this feature existed — in the IDENTITY STRIP's
# epistemic label (`id-epistemic`, app.js), a different surface with its own adjudication history
# that this change-set does not own. A whole-page assertion would either fail on copy that is not
# mine or push me into rewriting it, and the predecessor already hit exactly that trap from the
# other direction. So the band's own rendered subtree is extracted and judged alone.
band_of() { # band_of <dom-file> <out-file>
  node -e '
    const fs = require("fs");
    const h = fs.readFileSync(process.argv[1], "utf8");
    const i = h.indexOf("id=\"out-margin-band\"");
    if (i < 0) { fs.writeFileSync(process.argv[2], ""); process.exit(0); }
    const start = h.lastIndexOf("<", i);
    let depth = 0, j = start;
    for (;;) {
      const open = h.indexOf("<div", j + 1), close = h.indexOf("</div>", j + 1);
      if (close < 0) break;
      if (open >= 0 && open < close) { depth++; j = open; } else { if (depth === 0) { j = close + 6; break; } depth--; j = close; }
    }
    fs.writeFileSync(process.argv[2], h.slice(start, j));
  ' "$1" "$2"
}
band_of "$TMP/s1.html" "$TMP/s1-band.html"
check "band element: extracted and non-empty (the scoped checks below are not vacuous)" "$TMP/s1-band.html" must "out-margin-band"
check "band copy: no probability language, not even to deny it" "$TMP/s1-band.html" mustnot "probability"
check "band copy: no distribution language either"             "$TMP/s1-band.html" mustnot "distribution"
check "band copy: no confidence language either"               "$TMP/s1-band.html" mustnot "confidence"
check "band copy: says what the range IS, as the search performed" "$TMP/s1.html" must "plus samples along each axis"
check "band copy: and warns where the search can miss, rather than promising it cannot" "$TMP/s1.html" must "a setting can compute outside it"
check "band copy: names the middle point as the reader's MEDIAN" "$TMP/s1-band.html" must "The middle point is the MEDIAN you stated"
# The pre-existing identity-strip label is a KNOWN, NAMED exclusion, not an oversight: it is asserted
# to still be there, so nobody later reads the scoping above as this change having quietly removed it.
check "identity strip: its own long-standing epistemic label is untouched by this change" "$TMP/s1.html" must "not a probability interval"
check "band readout: the existing span keeps its own denial"    "$TMP/s1.html" must "not a confidence interval"

# --- row 499 (COMPLETENESS DOCTRINE + NULL CONVENTION, owner rulings 23:05-23:16Z) ---
# (1) Anything an adjudicator assumes, a reader must be able to compute. Both round-2 adjudicators
#     priced procurement PER ACCELERATOR; one wrote that posture into the per-family EFFICIENCY keys
#     for want of anywhere else to put it. These controls are the missing dial.
check "per-accelerator discounts: the section renders"         "$TMP/s1.html" must "Procurement discount by accelerator"
check "per-accelerator discounts: family-wide row for the less sure" "$TMP/s1.html" must "Family-wide"
check "per-accelerator discounts: per-leg override is offered" "$TMP/s1.html" must "a value here overrides its family for that leg alone"
check "per-accelerator discounts: rows are NOT composition rows" "$TMP/s1.html" must "disc-row"
check "per-accelerator discounts: registered rate is shown per leg" "$TMP/s1.html" must "registered \$"
check "per-accelerator discounts: says nothing here is disclosed" "$TMP/s1.html" must "No lab publishes what it pays for compute"
# (2) Every dial gets a value with provenance: an unset dial shows the default, MARKED.
check "null convention: the asterisk legend renders on a preset" "$TMP/s1.html" must "THIS PRESET DID NOT SET IT"
check "null convention: the legend names the unset dials"        "$TMP/s1.html" must "Unset here:"
# (4) The FINAL ANSWER block carries the hero number the page actually opens on.
check "FA block: names the reading the page opens on"            "$TMP/s1.html" must "the reading this page OPENS on"
check "FA block: states that reading's lead treatment"           "$TMP/s1.html" must "at an algorithmic lead of 0 months"
# (5) Prior-page references slimmed; the honesty sentence and the scenario-reading closer STAY.
check "prior-page: framed as the first vetted version"           "$TMP/s1.html" must "first version whose numbers have been through a full"
check "prior-page: per-step point deltas are gone"               "$TMP/s1.html" mustnot "lowered the landing default by about 41.6 points"
check "prior-page: share-link honesty sentence survives"         "$TMP/s1.html" must "no longer resolves at all and says so"
check "prior-page: scenario-readings closer survives"            "$TMP/s1.html" must "not measured changes in anyone's economics"

# --- annex skin parity (ashitaorbis-integration follow-up, 2026-07-14): research annex pages carry
# the SAME skin-boot script as the main page (extracted verbatim at build time by
# build-research-html.mjs — fail-closed there), so the cross-repo ?skin/?theme contract and the
# app/dark default apply to the annexes, not just index.html.
# b9 M1 close-out — TWO pre-existing bugs fixed here, both found the first time this suite
# actually executed (it had been hanging on the Chrome 150 Turnstile block, see render()):
#   1. These two renders bypassed render(), so they never got the --timeout hardening.
#   2. They hardcoded "$(pwd)/site/research/…", which is only correct from the REPO-ROOT
#      copy. The served site/tests/ twin cds to site/, so the path became site/site/research/
#      — a file that does not exist. Chrome dumped an error page and all four annex checks
#      failed in the twin while passing at root. Deriving the annex directory from $BASE
#      keeps BOTH copies textually identical AND correct: BASE already differs between the
#      copies by exactly this path segment.
ANNEX_DIR="${BASE%/index.html}/research"
"$CHROME" --headless=new --no-sandbox --disable-gpu --timeout="$RENDER_TIMEOUT_MS" --virtual-time-budget=5000 \
  --dump-dom "$ANNEX_DIR/changelog.html?skin=editorial&theme=light" 2>/dev/null > "$TMP/annex.html"
check "annex: skin-boot script present in built page"      "$TMP/annex.html" must "Skin/theme resolution"
check "annex: editorial skin applied from URL param"       "$TMP/annex.html" must 'data-skin="editorial"'
check "annex: light theme applied from URL param"          "$TMP/annex.html" must 'data-theme="light"'
"$CHROME" --headless=new --no-sandbox --disable-gpu --timeout="$RENDER_TIMEOUT_MS" --virtual-time-budget=5000 \
  --dump-dom "$ANNEX_DIR/index.html" 2>/dev/null > "$TMP/annex-default.html"
check "annex: app/dark default without params"             "$TMP/annex-default.html" must 'data-skin="app" data-theme="dark"'

# --- chart-gen billing-mix parity (2026-07-15 cold-review MAJOR, code-confirmed): the
# "Cost per 1M output tokens across hardware generations" chart used to compute price mix
# with a local formula that ignored billCacheHit/cacheWriteShare/cacheWriteMult. Force the
# blend 100% onto one GEN_TIMELINE generation (h200) so the hero and that generation's chart
# bar are computed over the IDENTICAL hardware, then set billCacheHit/cacheWriteShare away
# from their defaults — hero and the h200 bar must now report the same margin. Pre-fix, the
# The activated roofline re-derives this fixture to 72.64%; hero and chart must remain identical.
# ignored billCacheHit/cacheWriteShare) — reproduced and recorded in
# logs/weekly/2026-07-15-expedited4.md via a direct engine.js node script before this fix
# landed. This DOM check is the end-to-end proof the browser-rendered chart agrees, since
# renderGenChart only runs in a browser (SVG/DOM), never under plain node.
TCHART=$(b64 '{"blend":{"h200":100},"billCacheHit":20,"cacheWriteShare":30,"cacheWriteMult":150,"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$TCHART")" > "$TMP/chartbug.html"
check "chart-gen/hero parity: hero shows the activated 73.62% margin (b9 M5 re-mint)" "$TMP/chartbug.html" must "unrounded: 73.62%"
check "chart-gen/hero parity: h200 generation bar agrees with hero (73.6% margin, b9 M5 re-mint)" "$TMP/chartbug.html" must "73.6% margin"
check "chart-gen/hero parity: h200 bar does NOT show the pre-fix wrong value (67.6% margin)" "$TMP/chartbug.html" mustnot "67.6% margin"

# --- central-scenario return affordance (owner fix 2026-07-14): the 60–80% bucket authors no
# counterfactual route, so it uniquely lacked a "load" control — the round trip back to the clean
# default must exist on the board, be labeled estimate-not-route, and read "currently loaded"
# ONLY in the central-clean state (synced on isCentralClean, never on persp id).
check "central-return: affordance present (default)"       "$TMP/default.html" must "Load the central scenario into the calculator"
check "central-return: labeled policy-baseline scenario, not a route" "$TMP/default.html" must "the policy-labeled baseline scenario, not a counterfactual"
# row 499: the "currently loaded" tag syncs on isCentralClean(), and the page no longer opens central.
# The affordance and its labeling — the two checks above — are what the landing render asserts.
#check "central-return: default reads currently-loaded"     "$TMP/default.html" must 'config-loaded-tag">· currently loaded in the calculator below'
# row 499: the landing is no longer central, so the return-to-central button is SHOWN there — which
# is the affordance the ruling implies. Its hidden-when-central behaviour is unchanged in the app.
#check "central-return: button hidden when central"         "$TMP/default.html" must 'central-return-btn" hidden'
check "central-return: affordance present (route state)"   "$TMP/s5.html" must "Load the central scenario into the calculator"
check "central-return: button live in route state"         "$TMP/s5.html" mustnot 'central-return-btn" hidden'
check "central-return: loaded-tag hidden in route state"   "$TMP/s5.html" must 'hidden="">· currently loaded in the calculator below'

# --- SLICE C (design memo im4-sliceC-design-memo v9, GATE CLOSED): the switcher /
# codec / MCP landing surface — fleet tokens, the C-1 negative, the dual-identity
# counterfactual crop, the live hazard pair, the span estimand, and the fleet drift
# sentence. Every token below carries the REQUIRED _meta.fleet/_meta.totalCase. ---

# default load: switcher present, LOCKED span estimand, attribution, bookmarks
check "sliceC switcher: control renders on the flagship" "$TMP/default.html" must "Named fleet"
check "sliceC switcher: LOCKED span estimand sentence (C-6)" "$TMP/default.html" must "a span across presented alternatives, not a confidence interval and not same-construction variants"
check "sliceC switcher: span value renders from the derivation" "$TMP/default.html" must "pp span ("
# row 499: these are DEFAULT-FLEET disclosure surfaces. The page now opens on a preset that carries its
# own declared blend (its author excluded Trainium by name), so the na-blend attribution chain belongs to
# the central scenario, one click away — showing it over a different fleet would be the wrong claim.
# FLAGGED as a follow-up in the row-499 delta manifest: the landing surface loses this disclosure until
# the reader selects the central scenario.
#check "sliceC switcher: na-blend attribution chain renders verbatim (C-5)" "$TMP/default.html" must "TWO-LEVEL ESTIMATE"
# row 499: these are DEFAULT-FLEET disclosure surfaces. The page now opens on a preset that carries its
# own declared blend (its author excluded Trainium by name), so the na-blend attribution chain belongs to
# the central scenario, one click away — showing it over a different fleet would be the wrong claim.
# FLAGGED as a follow-up in the row-499 delta manifest: the landing surface loses this disclosure until
# the reader selects the central scenario.
#check "sliceC switcher: two-quantity live readout (render vs policy-clean)" "$TMP/default.html" must "the two are different quantities (two-boolean contract)"
check "sliceC bookmarks: labeled total cases render in scope (C-10)" "$TMP/default.html" must "Labeled total-parameter cases"
check "sliceC switcher: no per-fleet margin preview (anti-shopping)" "$TMP/default.html" mustnot "fleet-margin-preview"

# named non-default fleet token: declared weights AS-IS (C-1) + named lead + the C-1 negative
FTDT=$(b64 '{"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":47.67,"model":"opus","persp":"median","fleet":{"id":"declared-topology"},"totalCase":"revised-band-central-2.5","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTDT")" > "$TMP/ftdt.html"
check "sliceC declared-topology token: loads as a shared scenario" "$TMP/ftdt.html" must "Loaded a shared scenario"
check "sliceC declared-topology token: DECLARED construction renders (≈68%, im-release-edit-r3 re-mint: the rent adoption moved the default state 62.90 -> 68.00)" "$TMP/ftdt.html" must "≈68% — policy-labeled scenario"
check "sliceC declared-topology token: named-fleet identity leads the note (C-4)" "$TMP/ftdt.html" must "NAMED FLEET SCENARIO"
# C-1 NEGATIVE — RE-POINTED at 5 T (im-share-finalization, 2026-09-02). At 2.5 T this
# assertion could not discriminate: declared-topology's serve-feasibility-FILTERED variant
# EQUALS its AS-IS variant there (both 63.1377% today — all seven declared legs are feasible
# at 2.5 T once the Trainium operating points are repaired), so there was no distinct
# filtered value left to forbid and the check passed trivially. At 5 T filtering bites —
# h100 and trn2 are excluded — and the two constructions separate:
#     5 T  AS-IS   (declared: all seven legs)     58.2410%  → hero "≈58%"
#     5 T  FILTERED (the five surviving legs)     56.8884%  → hero "≈57%"
# Both RE-DERIVED BY EXECUTION against this tree on 2026-09-02, deliberately NOT copied from
# the BACKLOG's 2026-07-26 table (56.9790 / 58.3229): those digits are stale AND their
# AS-IS/FILTERED labels are inverted relative to today's engine, so forbidding "≈58%" as
# that table proposed would forbid the value this page actually renders — a red gate on a
# correct page. NEGATIVE CONTROL RUN: a custom-blend token carrying exactly the five
# surviving legs renders the forbidden string, so this check is provably able to fail.
# displayedMargin is NULL, not an authored digit (GPT Pro finding 4). A numeric value is only
# consulted to decide whether to append an engine-drift note; pinning today's engine result there
# would plant a second stale fixture of exactly the class this repair removes, purely to suppress
# a behaviour the test does not exercise. Null suppresses the comparison honestly, and the drift
# note's ABSENCE is asserted directly below rather than being implied by a test name.
FTDT5=$(b64 '{"total":5000,"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":null,"model":"opus","persp":"median","fleet":{"id":"declared-topology"},"totalCase":"community-central-5.0","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTDT5")" > "$TMP/ftdt5.html"
check "sliceC declared-topology @5T: loads as a shared scenario" "$TMP/ftdt5.html" must "Loaded a shared scenario"
check "sliceC declared-topology @5T: ...and NO engine-drift notice is appended (asserted, not merely named)" "$TMP/ftdt5.html" mustnot "Engine drift"
check "sliceC declared-topology @5T: named-fleet identity leads the note (C-4)" "$TMP/ftdt5.html" must "NAMED FLEET SCENARIO"
checkhero "sliceC declared-topology @5T: the DECLARED construction is what #out-margin renders (≈66%)" "$TMP/ftdt5.html" is "≈66% — policy-labeled scenario"
# RE-POINTED 2026-09-20 (im-vet-six-repairs, program bq-2835). The AUTHORED value negative that
# stood here — "never ≈67%" — died with the vetting repairs, and it died in the direction the
# comment below predicted. At 5 T the declared construction now reads 65.71% (hero ≈66%) and the
# FILTERED construction reads 66.47% (hero ≈66%): the two ROUND TO THE SAME STRING, so no value
# negative can be written at this operating point at all — the filter no longer moves the hero
# here, and asserting "never ≈66%" would forbid the value the page correctly renders. So the VALUE
# half of C-1 moves to 10 T, where the filter still bites hard (four of seven legs survive; 57.62%
# vs 53.91%, heroes ≈58% and ≈54%), and it is asserted DYNAMICALLY below against the derived
# control rather than against a digit typed here. The STRUCTURAL half stays at 5 T, where it is
# unaffected: at 5 T the filtered construction is five legs and the named render must never show
# a five-leg receipt.
# C-1 NEGATIVE, STRUCTURAL HALF — the drift-proof one. The value check above expresses the
# contract literally, but it discriminates through a ROUNDED hero string, and 56.8884 sits only
# 0.39 points from the 56.5 boundary: a re-mint the size of the last two would round the filtered
# variant to ≈56%, at which point the value check silently goes vacuous again — the exact failure
# this whole repair exists to remove. So assert the same contract on fleet SHAPE, which no numeric
# drift can move. A named declared-topology selection renders its SEVEN declared legs (h100 and
# trn2 present and DISCLOSED as capped); the filtered construction renders FIVE. Verified on both
# renders: the named one carries "of 5 legs" ZERO times, the filtered negative control EIGHT.
# If a future fleet legitimately gains a five-leg receipt this fires LOUDLY and gets triaged,
# which is the safe direction — unlike a rounded value, it cannot fail silently.
check "sliceC declared-topology @5T: C-1 NEGATIVE (structural, drift-proof) — no FIVE-leg filtered receipt anywhere on a named selection; the declared seven-leg construction stands" "$TMP/ftdt5.html" mustnot "of 5 legs"
check "sliceC declared-topology @5T: the declared seven-leg receipt is what renders (h100/trn2 kept and disclosed, not dropped)" "$TMP/ftdt5.html" must "of 7 legs"
# ---- THE NEGATIVE CONTROL, EXECUTED (GPT Pro pr-20260902T153840Z-bce1bb finding 1) ----
# A control described in a comment cannot keep this gate non-vacuous across the next engine or
# data revision: it proves the forbidden hero was reachable ONCE, on the day someone tried it.
# So derive the serve-feasibility-FILTERED construction HERE, from the production filtering path
# (deriveDefaultFleetMembership — the same call fleetBaselineBlend makes for the DEFAULT fleet),
# render it, and compare the two rendered heroes DYNAMICALLY. The generator refuses to emit a
# token at an operating point where nothing is excluded, so a future data move that makes 5 T
# non-discriminating fails here LOUDLY instead of passing quietly.
# The harness has already cd'd to the tree root above, so "tests/" resolves correctly in BOTH
# copies (repo/tests and site/tests) and the twin invariant holds — only the BASE line may differ.
# The operating point is 10 T as of 2026-09-20 (see the re-point note above); the named render is
# built here rather than reusing the 5 T one, because a value contract only means anything when
# both sides are read at the SAME operating point.
C1TOTAL=10000
FTDTC1=$(b64 '{"total":10000,"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":null,"model":"opus","persp":"median","fleet":{"id":"declared-topology"},"totalCase":"stress-10","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTDTC1")" > "$TMP/ftdtc1.html"
check "sliceC declared-topology @10T (C-1 operating point): loads as a shared scenario" "$TMP/ftdtc1.html" must "Loaded a shared scenario"
check "sliceC declared-topology @10T: the declared SEVEN-leg construction is what renders" "$TMP/ftdtc1.html" must "of 7 legs"
C1CTL=$(node tests/derive-c1-control.mjs "$C1TOTAL" declared-topology) || C1CTL=""
if [ -z "$C1CTL" ]; then
  echo "FAIL  sliceC C-1 control: the filtered construction could not be derived — this fixture can no longer discriminate; re-point it at a total where the filter bites"
  fails=$((fails+1))
else
  render "?s=$(urlenc "$C1CTL")" > "$TMP/ftdtc1ctl.html"
  C1_NAMED=$(hero "$TMP/ftdtc1.html"); C1_CTL=$(hero "$TMP/ftdtc1ctl.html")
  if [ -n "$C1_NAMED" ] && [ -n "$C1_CTL" ] && [ "$C1_NAMED" != "$C1_CTL" ]; then
    echo "PASS  sliceC C-1 POSITIVE CONTROL: the filtered construction renders a DIFFERENT hero ($C1_CTL) from the named selection ($C1_NAMED) — this fixture can still tell the two apart"
  else
    echo "FAIL  sliceC C-1 POSITIVE CONTROL: named and filtered heroes have CONVERGED (named=$C1_NAMED filtered=$C1_CTL) — the negative below is now vacuous; re-point the fixture"
    fails=$((fails+1))
  fi
  # And the forbidden string is exactly what the control produces — derived, never authored.
  checkhero "sliceC C-1 NEGATIVE (dynamic): #out-margin on the named selection is never the value the filtered control renders" "$TMP/ftdtc1.html" isnot "$C1_CTL"
  check "sliceC C-1 control sanity: the filtered control really is the FOUR-leg construction at 10 T" "$TMP/ftdtc1ctl.html" must "of 4 legs"
fi
check "sliceC declared-topology token: policy-labeled identity kept" "$TMP/ftdt.html" must "policy-labeled scenario"

# counterfactual token: BOTH load-bearing identities inside the ONE value node (C-4 crop bar)
FTCF=$(b64 '{"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":71.539,"model":"opus","persp":"median","fleet":{"id":"h800-sole-anchor"},"totalCase":"revised-band-central-2.5","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTCF")" > "$TMP/ftcf.html"
check "sliceC counterfactual token: dual-identity value token (crop bar)" "$TMP/ftcf.html" must "≈78% — counterfactual, policy-labeled scenario"
check "sliceC counterfactual token: counterfactual bar named in the note" "$TMP/ftcf.html" must "never a default — comparison only"

# default fleet + edited total: the NORMATIVE restore order live (the R3-round hazard pair)
FT10=$(b64 '{"total":10000,"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":33.265,"model":"opus","persp":"median","fleet":{"id":"na-blend"},"totalCase":"stress-10","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FT10")" > "$TMP/ft10.html"
# b9 M1 re-mint: the pair moves 33.27/39.64 → 42.21/45.13 and stays SEPARATED, so the
# decode-order hazard is still detectable. Both sides are now element-initial HERO forms:
# the old positive was a bare "≈33%" that could match any occurrence in the DOM, and the
# old negative now collides with the new NORMATIVE value.
check "sliceC hazard pair LIVE: normative order restores ≈47% (derivation at the POST-diff state)" "$TMP/ft10.html" must ">≈47% — policy-labeled scenario"
check "sliceC hazard pair LIVE: the stale seed-then-diff ≈45% NEVER renders" "$TMP/ft10.html" mustnot ">≈45% — policy-labeled scenario"

# old-epoch fleet token: drift note + the PINNED ADDITIVE fleet sentence (C-7)
FTDR=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":47.483,"model":"opus","persp":"median","fleet":{"id":"na-blend"},"totalCase":"community-central-5.0","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTDR")" > "$TMP/ftdr.html"
check "sliceC drift: originally-shared note fires on the old-epoch fleet token" "$TMP/ftdr.html" must "originally shared: ≈47%"
check "sliceC drift: the PINNED fleet sentence appends (additive)" "$TMP/ftdr.html" must "what this link selects, not what it froze"

# --- FA J-9 / R6-P1 epoch transition (memo v7): a pre-bump CLEAN token (old default
# totalCase, NO total key) REWRITES to the new default case, restores at the revised
# size, and surfaces the size-move note through the successful-restore drift path. ---
FTMIG=$(b64 '{"_meta":{"schema":"v5","epoch":"v22r3","displayedMargin":35.14,"model":"opus","persp":"median","fleet":{"id":"na-blend"},"totalCase":"community-central-5.0","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTMIG")" > "$TMP/ftmig.html"
check "FA transition: pre-bump clean token RESTORES (no silent drop)" "$TMP/ftmig.html" must "Loaded a shared scenario"
check "FA transition: restores at the revised size (≈68 hero token, im-release-edit-r3 re-mint)" "$TMP/ftmig.html" must "≈68% — policy-labeled scenario"
check "FA transition: the numeric drift note fires (originally shared ≈35%)" "$TMP/ftmig.html" must "originally shared: ≈35%"
check "FA transition: the SIZE-MOVE sentence surfaces" "$TMP/ftmig.html" must "The page default flagship size moved from the 5 T community deduction"
# the explicit-5000 shape keeps its 5T identity (value-match, no rewrite, no size-move note)
FT5T=$(b64 '{"total":5000,"_meta":{"schema":"v5","epoch":"v22r4","displayedMargin":35.14,"model":"opus","persp":"median","fleet":{"id":"na-blend"},"totalCase":"community-central-5.0","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FT5T")" > "$TMP/ft5t.html"
check "FA 5T case: explicit-5000 token restores under the 5 T identity (≈64, im-vet-six-repairs re-mint)" "$TMP/ft5t.html" must "≈64% — policy-labeled scenario"
check "FA 5T case: NO size-move sentence on a value-matched 5 T selection" "$TMP/ft5t.html" mustnot "The page default flagship size moved"
check "FA 5T case: the exclusion story lives HERE (h100 excluded at 5 T)" "$TMP/ft5t.html" must "excluded from the default"

# rejection rows reach the DEFAULT render (fail-closed, no loaded note)
FTBAD=$(b64 '{"blend":{"h100":50,"h200":50},"_meta":{"schema":"v5","epoch":"v22r3","displayedMargin":null,"model":"opus","persp":"median","fleet":{"id":"declared-topology"},"totalCase":"custom","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$FTBAD")" > "$TMP/ftbad.html"
check "sliceC contradiction token (named+blend): rejected whole — default renders" "$TMP/ftbad.html" must "≈58% — policy-labeled scenario"
check "sliceC contradiction token: no loaded-scenario note" "$TMP/ftbad.html" mustnot "Loaded a shared scenario"

# --- b9 M3: energy/electricity dimension (memo research/b9-m3-energy-memo.md §6 browser rows) ---
# The default render is the median (rent-basis) lens; t8 is the x90-v1 owned/strategic-TCO route.
check "b9 M3: per-accelerator table carries the energy column" "$TMP/default.html" must "Energy (Wh/Mtok, mix)"
check "b9 M3: embedded-in-rent chip renders under the default rent lens" "$TMP/default.html" must "Current lens is a rent basis"
check "b9 M3: embedded-in-rent chip names the lens basis" "$TMP/default.html" must "low/committed planning rent"
# row 499: same class — an owned-TCO input chip tied to the default fleet, not rendered under the
# landing preset's own blend. Flagged with the two above.
#check "b9 M3: blended-electricity chip renders on the default fleet" "$TMP/default.html" must "Blended electricity cost (owned-TCO input)"
# row 499: rides the same default-fleet chip commented above.
#check "b9 M3: blended-electricity chip is marked inert under the rent basis" "$TMP/default.html" must "inert under the current rent basis"
check "b9 M3: embedded-in-rent chip ABSENT under the owned/strategic-TCO route (x90-v1)" "$TMP/t8.html" mustnot "Current lens is a rent basis"
check "methods box names the on-demand cost basis (was: public-capacity rent)" "$TMP/default.html" must "on-demand rent"
check "b9 M3: methods box names owned/strategic TCO" "$TMP/default.html" must "owned/strategic TCO"
check "b9 M3: the energy surface states the no-idle-allocation convention" "$TMP/default.html" must "no idle allocation"
check "b9 M3: the default (median) chip carries its own lens basis" "$TMP/default.html" must "rent basis (low/committed planning rent)"

# --- b9 M3 gate P1 fold: the chip labels the LENS basis, never the mix's row basis ---
TCHINA=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"opus","persp":"chinacloud","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$TCHINA")" > "$TMP/m3china.html"
check "b9 M3 P1: chinacloud loaded (not a fail-closed default render)" "$TMP/m3china.html" must "China public-cloud"
check "b9 M3 P1: chinacloud chip names the LENS basis (public-capacity rent)" "$TMP/m3china.html" must "rent basis (public-capacity rent)"
check "b9 M3 P1: chinacloud chip does NOT carry the row-basis label" "$TMP/m3china.html" mustnot "rent basis (low/committed planning rent)"
TGEMD=$(b64 '{"_meta":{"schema":"v5","epoch":"v22","displayedMargin":null,"fleet":{"id":"custom"},"totalCase":"custom","model":"gemini","persp":"dive","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v5.$TGEMD")" > "$TMP/m3gemd.html"
check "b9 M3 P1: dive-x-gemini chip states the declared-owned/strategic-expressed-as-rent divergence" "$TMP/m3gemd.html" must "declares the owned/strategic TCO basis but expresses it as a rent-rate scalar"

# --- b9 M4: custom fleet builder (memo research/b9-m45-ui-memo.md §16 browser targets) ---
# B-1: the builder entry + the named-fleet read-only drill-down affordance on the default render.
check "b9 M4 B-1: the builder entry renders under the switcher" "$TMP/default.html" must "Custom fleet…"
# row 499: the drill-down belongs to a NAMED fleet selection; the landing preset carries its own blend,
# so there is no named fleet to drill into at page open. Same follow-up as the attribution chain.
#check "b9 M4 B-1: named-fleet read-only drill-down affordance renders" "$TMP/default.html" must "View legs…"
# B-6: a v6 cf: link (REAL encoder mint — never a hand-crafted token for the positive path)
#      renders the by-value fleet EPHEMERALLY: unsaved banner, user-custom chip, per-leg panel
#      replacing the share sliders, switcher entry labeled unsaved.
CFTOK=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");const CF=require(P+"/custom-fleets.js");
const def={id:"cf:brtest1",name:"Browser test fleet",epoch:E.DEFAULTS_EPOCH,clonedFrom:null,
 legs:[{donorKey:"h800",label:"h800 - Ohio",sharePct:60,overrides:{},basisDeclared:"inherit",family:CF.donorFamily("h800")},
       {donorKey:"h800",label:"h800 - Texas",sharePct:40,overrides:{kwhPerKwh:0.25},basisDeclared:"inherit",family:CF.donorFamily("h800")}]};
const v=CF.validateCustomFleet(def);if(!v.ok)throw new Error(v.errors.join(";"));
E.registerCustomFleetSource({saved:{[def.id]:v.fleet},ephemeral:null,resolve(id){return id===def.id?v.fleet:null},ids(){return[def.id]}});
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.blend=CF.aggregateLegsToBlend(v.fleet);
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","median",tr,null,{fleet:def.id,totalCase:"custom"}));')
render "?s=$(urlenc "$CFTOK")" > "$TMP/m4cf.html"
check "b9 M4 B-6: cf link loads with the unsaved banner" "$TMP/m4cf.html" must "Custom fleet loaded from the link"
check "b9 M4 B-6: user-custom class chip renders" "$TMP/m4cf.html" must "user-custom — never a default; user composition"
check "b9 M4 B-6: per-leg panel carries the donor calibration identity" "$TMP/m4cf.html" must "Performance identity: H800"
check "b9 M4 B-6: composition-only-in-builder note (share sliders replaced)" "$TMP/m4cf.html" must "share sliders do not apply to a custom fleet"
check "b9 M4 B-6: switcher lists the link fleet as unsaved" "$TMP/m4cf.html" must "user-custom (from link, unsaved)"
check "b9 M4 B-6: attribution states nothing is sourced" "$TMP/m4cf.html" must "User composition — nothing here is sourced"
# B-8: the kwh chip under overrides — DERIVED label, and inert-under-rent honesty clause
#      (the loaded lens is the rent-basis median).
check "b9 M4 B-8: kwh chip shows the derived weighted price" "$TMP/m4cf.html" must "DERIVED from per-leg overrides"
check "b9 M4 B-8: kwh chip states the overrides price nothing under rent" "$TMP/m4cf.html" must "the overrides price nothing here"
# B-5: an infeasible custom leg (user-declared 16 GB HBM cannot hold the flagship) renders the
#      welded fail-closed readout, never a silent number.
CFBAD=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");const CF=require(P+"/custom-fleets.js");
const def={id:"cf:brbad01",name:"Infeasible fleet",epoch:E.DEFAULTS_EPOCH,clonedFrom:null,
 legs:[{donorKey:"h800",label:"h800 shrunk",sharePct:100,overrides:{hbmGB:16},basisDeclared:"inherit",family:CF.donorFamily("h800")}]};
const v=CF.validateCustomFleet(def);if(!v.ok)throw new Error(v.errors.join(";"));
E.registerCustomFleetSource({saved:{[def.id]:v.fleet},ephemeral:null,resolve(id){return id===def.id?v.fleet:null},ids(){return[def.id]}});
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.blend=CF.aggregateLegsToBlend(v.fleet);
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","median",tr,null,{fleet:def.id,totalCase:"custom"}));')
render "?s=$(urlenc "$CFBAD")" > "$TMP/m4bad.html"
check "b9 M4 B-5: infeasible custom leg renders the welded 0-legs readout" "$TMP/m4bad.html" must "0 of 1 legs render"
# (The FA block always renders the flagship DEFAULT's policy-labeled value independent of the
#  live selection, so a page-wide negative on that string is invalid — the live hero's own
#  welded infeasible copy is the honest assertion.)
check "b9 M4 B-5: the live hero renders the welded infeasible copy, never a silent number" "$TMP/m4bad.html" must "infeasible at declared serving topology — no numeric result"
# B-7: v5 continuity is asserted by the M3 blocks above (hand-crafted schema:"v5" tokens still
#      load) and the pre-v5 corpus block — no separate target needed; noted for the manifest.

# --- b9 M5: family sliders, the algorithmic-lead prior, the interlock, stackMult relabels ---
# Default load (opus @ the ratified +3 prior): the sections, the readout, the citation, the
# permanent price-series refusal, and the two distinct lock mechanisms.
check "b9 M5: the family-multiplier section renders" "$TMP/default.html" must "Family efficiency multipliers"
check "b9 M5: all four family sliders render" "$TMP/default.html" must "Huawei Ascend family"
check "b9 M5: the algorithmic-lead section renders" "$TMP/default.html" must "Algorithmic lead (scenario prior)"
check "b9 M5: the slider carries the ratified label verbatim" "$TMP/default.html" must "Algorithmic lead (months vs published open practice)"
# row 499: THE POINT OF THE RULING — the page-open default carries NO algorithmic lead, so there is no
# E divisor to read out at landing. The readout is asserted at the central scenario by the node suites,
# and reappears here the moment a reader moves the lead dial, which the ruling makes their choice.
#check "b9 M5: the live E readout renders at the ratified default" "$TMP/default.html" must "E = ×1.32 → modeled cost-out ÷1.32"
check "b9 M5: the lab binding and the not-a-measurement label render" "$TMP/default.html" must "Owner-ratified SCENARIO PRIOR, not a measurement"
check "b9 M5: the rate control is the closed ratified set" "$TMP/default.html" must "3×/yr — ratified default (halving ≈7.57 mo)"
check "b9 M5: the primary citation renders" "$TMP/default.html" must "arXiv:2511.23455"
check "b9 M5: the price-series refusal is permanent copy" "$TMP/default.html" must "measure TARIFFS, not serving efficiency"
check "b9 M5: the capability-axis non-conflation renders" "$TMP/default.html" must "Capability lag (~4 months, Epoch-measured) is a different axis"
check "b9 M5: the two lock mechanisms are named apart" "$TMP/default.html" must "Broad-lever interlock"
# The retired label survives ONLY in the copy that says it is retired (the tip + the methods box);
# what must be gone is the TICK itself, which renders its label into a title="<label> = <value>".
check "b9 M5: the retired stackMult TICK is gone" "$TMP/default.html" mustnot "title=\"frontier lab (assumed) = 1.25\u00d7\""
check "b9 M5: the retired label survives only as the prose retiring it" "$TMP/default.html" must "label is retired"
check "b9 M5: stackMult 1.0 names the shared referent" "$TMP/default.html" must "published open practice (SGLang class)"
check "b9 M5: stackMult 1.25 is relabeled composition stress" "$TMP/default.html" must "measured-composition stress"
check "b9 M5: the methods box carries the algorithmic-lead paragraph" "$TMP/default.html" must "Algorithmic lead — a labeled scenario prior, not a measurement"
check "b9 M5: the methods box carries the interlock + stackMult redefinition paragraph" "$TMP/default.html" must "The interlock, and why the stack multiplier was redefined"
# b9 M6: M5's interim-pin assertion is RETIRED with the token it asserted — the pin line's own text
# promised "the ratified-prior reading arrives with the final-answer rework", and M6 IS that rework.
# What replaces it is the two-basis pair asserted in the M6 block below (and, on the exact fields,
# T-9 in tests/trendline-interlock-b9.test.mjs).
# The overlap warning (§10.5a) fires at the ratified default beside a moved SPECIFIED lever.
M5OVL=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.precision="fp4";
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","__modified",tr,"a shared scenario",{fleet:"custom",totalCase:"custom",interlock:"free"}));')
render "?s=$(urlenc "$M5OVL")" > "$TMP/m5ovl.html"
check "b9 M5 §10.5a: the specified-lever overlap warning fires, non-blocking" "$TMP/m5ovl.html" must "not both silently"
# A LOCKED_TREND link (a family edit landed, the prior was zeroed) renders the lock, the why-line
# and the unlock affordance — and the trend slider is disabled, not merely annotated.
M5LOCK=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.trendMonths=0;s.famTpu=1.25;
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","__modified",tr,"a shared scenario",{fleet:"custom",totalCase:"custom",interlock:"locked-trend"}));')
render "?s=$(urlenc "$M5LOCK")" > "$TMP/m5lock.html"
check "b9 M5 §10: a locked-trend link renders the interlock why-line" "$TMP/m5lock.html" must "locked to prevent stacking broad multipliers"
check "b9 M5 §10: the unlock affordance is present and deliberate" "$TMP/m5lock.html" must "Unlock both levers…"
check "b9 M5 §10: the locked group's control is DISABLED, not merely annotated" "$TMP/m5lock.html" must "class=\"param locked\""
# An UNLOCKED link renders the persistent stacking banner.
M5UNL=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.trendMonths=6;s.famNvidia=1.3;
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","__modified",tr,"a shared scenario",{fleet:"custom",totalCase:"custom",interlock:"unlocked"}));')
render "?s=$(urlenc "$M5UNL")" > "$TMP/m5unl.html"
check "b9 M5 §10: an unlocked link renders the persistent stacking banner" "$TMP/m5unl.html" must "stacking two broad unspecified improvements"
# Replay lock-at-0: under a published operating point the prior is inert and says why.
M5RPL=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const opus=E.MODELS.find(m=>m.id==="opus"),p=E.PERSPECTIVES.find(x=>x.id==="dive");
const s=E.applyPresetSettings(opus,p,{mode:"native"});
const tr=E.resolveTraffic(opus,p,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","dive",tr,null,{fleet:"preset",totalCase:"revised-band-central-2.5",interlock:"free"}));')
render "?s=$(urlenc "$M5RPL")" > "$TMP/m5rpl.html"
check "b9 M5 §9.4: the prior is locked at 0 under a replay, with the double-counting why-line" "$TMP/m5rpl.html" must "the lab's actual efficiency is already inside it"
check "b9 M5 §9.4: the readout states the prior is inert there" "$TMP/m5rpl.html" must "inert under this replay"

# --- b9 M5 implementation-gate round-1 folds ---
# P1-1: a trend edit inside a MODIFIED identity must still fire FREE → LOCKED_FAMILY. The link
# below is a modified opus state whose months moved off the inherited +3 baseline; the machine
# state it carries is the one the app would have reached, and the family group renders LOCKED.
M5MODT=$(node -e '
const fs=require("fs");const P=fs.existsSync("./site/engine.js")?"./site":".";const E=require(P+"/engine.js");
const opus=E.MODELS.find(m=>m.id==="opus"),median=E.PERSPECTIVES.find(p=>p.id==="median");
const s=E.applyPresetSettings(opus,median,{mode:"native"});s.trendMonths=6;
const tr=E.resolveTraffic(opus,median,{mode:"native"});
process.stdout.write(E.encodeScenario(s,"opus","__modified",tr,"a shared scenario",{fleet:"custom",totalCase:"custom",interlock:"locked-family"}));')
render "?s=$(urlenc "$M5MODT")" > "$TMP/m5modt.html"
check "b9 M5 gate P1-1: a modified-state trend edit locks the FAMILY group" "$TMP/m5modt.html" must "locked to prevent stacking broad multipliers"
check "b9 M5 gate P1-1: the family group renders disabled, not merely annotated" "$TMP/m5modt.html" must "class=\"param locked\""
# P2: the form-correction span's claim surface names the reference it is computed at.
check "b9 M5 gate P2: the form-correction span names its public-evidence reference basis" "$TMP/default.html" must "computed at the public-evidence reference (algorithmic lead 0 months"

# --- b9 M5 fix-verify fold: reference-pinned board numbers now name their basis (P2 residual) ---
# The board's central row called the reference-pinned value "the calculator's clean default",
# which M5 made FALSE the moment the default moved onto the ratified prior.
check "b9 M5 fix-verify: the board no longer calls the pinned value the calculator's clean default" "$TMP/default.html" mustnot "The calculator’s clean default"
check "b9 M5 fix-verify: the central row names its public-evidence basis" "$TMP/default.html" must "at the public-evidence reference (algorithmic lead 0 months)"
check "b9 M5 fix-verify: …and states what the calculator below actually computes" "$TMP/default.html" must "own default state carries the ratified algorithmic-lead prior and computes to ≈68%"
# (The flagship-anchor sentence renders only for a range bucket that has no authored route, which
#  the current registry never produces, so it has no default-page target. Its byte-exactness is
#  enforced instead by the MCP grep-parity gate — mcp-server/test/contract.test.mjs asserts every
#  APPJS_MIRROR phrase, including the re-labeled centralAnchorSuffix, exists verbatim in app.js.)
check "b9 M5 fix-verify: route cards name the reference their band is judged at" "$TMP/default.html" must "computed at the public-evidence reference — algorithmic lead 0 months, family multipliers 1.0×, so a route's band is a property of its own construction"

# --- b9 M5 micro-verify fold: the §7/verdict prose no longer calls a reference-pinned figure
#     "the activated/deployed default". This class recurred FOUR times across the gate rounds, so
#     it is asserted here as a page-wide NEGATIVE plus the positives that replaced each site.
# Gate round 4, P2: the three exact-string negatives that used to live here guarded RETIRED
# WORDINGS, so they passed while synonyms of the same defect survived three lines away. The real
# guard is now figure-based and lives in tests/trendline-interlock-b9.test.mjs (REFERENCE-BASIS
# CLASS GUARD): it enumerates the reference-pinned FIGURES and requires every occurrence in
# index.html to name its basis, so a future sentence can word the mistake any way it likes and
# still be caught. One retired wording is kept below as a cheap canary; the class is guarded there.
check "b9 M5: the retired activated-default wording has not returned" "$TMP/default.html" mustnot "the activated default produces"
check "b9 M5: the superseded 53.29% calibration-debt endpoint is gone" "$TMP/default.html" mustnot "53.29"
check "the verdict names the planning baseline and its settings" "$TMP/default.html" must "the page-adopted 2.5T Opus, planning rents, algorithmic lead 0 months, family multipliers 1.0×"
check "the verdict states the lead-adjusted reading beside it" "$TMP/default.html" must "reads <strong>about 68% (about 68–87% across the same presets)</strong>"
check "the verdict declares its scenario once, and scopes the claim to calculator figures" "$TMP/default.html" must "Every calculator figure in this section is the planning baseline unless it says otherwise; 90–95% is the external claim under examination"
check "b9 M5 micro-verify: the utilization lever states BOTH bases" "$TMP/default.html" must "the same change moves 68.41% to 54.88%, a 13.54-point drop"
check "b9 M5 micro-verify: the billable cached share sensitivity names its reference" "$TMP/default.html" must "at the public-evidence reference (algorithmic lead 0 months), billable cached share 0%"

# --- b9 M6 (FA memo §10.4, §10.4-bis): the assertions this harness CAN make.
#     --dump-dom cannot click, read a computed ::backdrop, measure a touch target, check focus or
#     emulate a coarse pointer, so B-1..B-6 and B-7b live in tests/fa-explain-cdp.test.mjs. What
#     stays here is presence, collapsed-by-default, and class application at FIRST PAINT.
check "b9 M6: the FA renders the public-evidence reference reading, labeled" "$TMP/default.html" must "— public-evidence reference reading, policy-labeled scenario"
check "b9 M6: …and the calculator's own default reading beside it" "$TMP/default.html" must "own default reading, policy-labeled scenario"
check "b9 M6: the §C2 label is quoted and dated" "$TMP/default.html" must "run B §C2, 2026-07-25"
check "b9 M6: the must-not-be-called disclaimer renders in its own node" "$TMP/default.html" must 'id="fa-must-not-be-called"'
check "b9 M6: the bridge states how the readings relate" "$TMP/default.html" must "How the readings relate."
check "b9 M6: the basis declaration governs the explanations below it" "$TMP/default.html" must "Every calculator figure in the explanations below is the public-evidence reference reading"
check "b9 M6: M5's single interim-pin line is RETIRED from the surface" "$TMP/default.html" mustnot "the ratified-prior reading arrives with the final-answer rework"
check "b9 M6: the Deeper explanation trigger renders" "$TMP/default.html" must 'id="fa-deeper-trigger"'
check "b9 M6 B-7: the exec summary renders and is COLLAPSED at first paint" "$TMP/default.html" must '<details class="fa-exec-details" id="fa-exec-details">'
check "b9 M6 B-7: no M6 details is open at first paint (R-4)" "$TMP/default.html" mustnot '<details class="fa-exec-details" id="fa-exec-details" open>'
check "b9 M6: the four computed exec rows render their engine values — util-70" "$TMP/default.html" must "≈77% — fleet utilization moved 50% → 70%"
check "b9 M6: …util-75" "$TMP/default.html" must "≈79% — fleet utilization moved 50% → 75%"
check "b9 M6: …trend-6" "$TMP/default.html" must "≈76% — algorithmic lead moved +3 → +6 months"
check "b9 M6: …including the owned-TCO row" "$TMP/default.html" must "≈91% — procurement basis moved from the low/committed planning rent to owned/strategic TCO"
check "b9 M6: the spec-decode row states the lever and shows no margin" "$TMP/default.html" must "a lever this page deliberately leaves OUT of its default"
check "b9 M6: …and names what receipts would have to exist" "$TMP/default.html" must "Per-leg workload-weighted acceptance and draft-overhead receipts"
# b9 spec-decode LEVER (memo §9.2): THE AFFORDANCE FLIP has fired. The M6 contract was always
# "no-control now, jump when the lever lands, with no new mechanism" — so this check follows the
# contract to its other side rather than being deleted, and gains a negative: the retired copy must
# no longer REACH a reader, even though LOW_EVIDENCE_COPY["no-control"] is retained unedited (§9.2:
# deleting it would be a mechanism change, not a field change).
check "b9 spec-decode: the low-evidence affordance renders its JUMP state (the lever has landed)" "$TMP/default.html" must "Particularly low-evidence parameter — Speculative decode / MTP credit"
check "b9 spec-decode: …and the retired no-control copy no longer reaches a reader" "$TMP/default.html" mustnot "This calculator has no control for it yet"
check "b9 spec-decode: the lever's own control renders on the page" "$TMP/default.html" must "Speculative-decode credit (decode phase only)"
check "b9 spec-decode: the gate why-line renders beside the disabled control" "$TMP/default.html" must 'available only from the "no MTP/disagg" stack setting (0.7) — the only point on'
check "b9 spec-decode: every default-fleet leg carries its per-leg disclosure" "$TMP/default.html" must "speculative-decode credit: none selected"
check "b9 spec-decode: …and the two unknown-status legs say so by name" "$TMP/default.html" must "this page cannot establish this leg's speculative status"
check "b9 M6: the justification bodies adopt the .explain-body type scale" "$TMP/default.html" must 'class="explain-body"'
check "b9 M6 (D-1): the pre-repair ≈37 comparison is GONE from the FA surface" "$TMP/default.html" mustnot "≈48 → ≈37"
check "b9 M6 (D-1): …and survives as history in the methods box" "$TMP/default.html" must "Superseded readings (history)."

echo
if [ "$fails" -eq 0 ]; then echo "ALL APP TESTS PASS"; else echo "$fails APP TEST FAILURE(S)"; exit 1; fi
