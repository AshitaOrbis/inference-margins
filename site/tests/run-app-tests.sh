#!/usr/bin/env bash
# Application-level release tests (final-gate P0: the engine suites never exercised the browser
# path — the loader, replay identity, lens span and rendered metric wording live here).
# Renders site/index.html in headless Chromium with crafted ?s= links and asserts on the DOM.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
[ -n "$CHROME" ] || { echo "FATAL: no chromium/google-chrome on PATH — app tests are a release gate"; exit 1; }
BASE="file://$(pwd)/index.html"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
fails=0
render() { # render <name> <url-suffix>
  "$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=5000 \
    --dump-dom "$BASE$1" 2>/dev/null
}
check() { # check <name> <dom-file> <must|mustnot> <pattern>
  local name="$1" f="$2" mode="$3" pat="$4"
  if [ "$mode" = must ]; then
    if grep -qF -- "$pat" "$f"; then echo "PASS  $name"; else echo "FAIL  $name — missing: $pat"; fails=$((fails+1)); fi
  else
    if grep -qF -- "$pat" "$f"; then echo "FAIL  $name — forbidden present: $pat"; fails=$((fails+1)); else echo "PASS  $name"; fi
  fi
}
b64() { node -e "process.stdout.write(Buffer.from(process.argv[1],'utf8').toString('base64'))" "$1"; }
urlenc() { node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"; }

# --- 0. default load: metric wording + no named zones ---
render "" > "$TMP/default.html"
check "hero label: unit-vs-company GM" "$TMP/default.html" must "Unit serving margin — not company GM"
check "no named margin zones" "$TMP/default.html" mustnot "TeorTaxes/Zephyr 90"
check "default hero whole-point" "$TMP/default.html" must "≈77%"

# --- 1. original MLI-1 forged payload: replay lock holds ---
T1=$(b64 '{"ioRatio":300,"cacheHit":95,"_meta":{"schema":"v3","engine":"v2.1.3-2026-07-12","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v3.$T1")" > "$TMP/t1.html"
check "MLI-1 payload: locked margin ≈27%" "$TMP/t1.html" must "≈27%"
check "MLI-1 payload: rejection reported" "$TMP/t1.html" must "replay-integrity"
check "MLI-1 payload: forged 71x absent" "$TMP/t1.html" mustnot "≈72%"

# --- 2. schema-downgrade forgery: v3 prefix + inner v2 meta = rejected outright ---
T2=$(b64 '{"ioRatio":300,"cacheHit":95,"_meta":{"schema":"v2","model":"grok","persp":"xaiopp"}}')
render "?s=$(urlenc "v3.$T2")" > "$TMP/t2.html"
check "schema-downgrade: link rejected (no shared-scenario note)" "$TMP/t2.html" mustnot "Loaded a shared scenario"
check "schema-downgrade: default state renders" "$TMP/t2.html" must "≈77%"

# --- 3. non-traffic replay overlay: exits replay identity ---
T3=$(b64 '{"active":15,"_meta":{"schema":"v3","engine":"v2.1.3-2026-07-12","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v3.$T3")" > "$TMP/t3.html"
check "replay-divergent overlay: attribution removed" "$TMP/t3.html" must "MODIFIED SCENARIO"
check "replay-divergent overlay: modified option exists" "$TMP/t3.html" must "[modified scenario] derived from"
check "replay-divergent overlay: no locked-replay label" "$TMP/t3.html" mustnot "locked by [valuation replay]"

# --- 4. invalid ranges/enums/blend rejected ---
T4=$(b64 '{"util":0,"precision":"bogus","rentMult":999999,"blend":{"h100":-5},"_meta":{"schema":"v3","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v3.$T4")" > "$TMP/t4.html"
check "bounds: rejections reported" "$TMP/t4.html" must "failed schema or replay-integrity validation"
check "bounds: default margin intact" "$TMP/t4.html" must "≈77%"

# --- 5. clean replay link: lens span at the replay's traffic, lock label intact ---
T5=$(b64 '{"_meta":{"schema":"v3","engine":"v2.1.3-2026-07-12","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v3.$T5")" > "$TMP/t5.html"
check "clean replay: locked label present" "$TMP/t5.html" must "locked by"
check "clean replay: single-lens span honest" "$TMP/t5.html" must "only one cost lens is compatible"
check "clean replay: no hidden-default 43% comparator" "$TMP/t5.html" mustnot "43.4%"

# --- 6. v2 exact-match link recovers named-profile identity ---
T6=$(b64 '{"_meta":{"dataAsOf":"2026-07-10","schema":"v2","engine":"v2.1.1-2026-07-10","model":"glm","persp":"median"}}')
render "?s=$(urlenc "v2.$T6")" > "$TMP/t6.html"
check "v2 migration: named-profile identity recovered" "$TMP/t6.html" must "keeps that identity"

# --- 7. retired-preset share-link migrates to its SPECIFIC successor route: note names no person, and the
#        successor's own margin loads (the hero "At the current selection" line is loaded-specific; a
#        wrong-successor migration — e.g. skeptic ≈22% — would not read ≈89%) ---
T7=$(b64 '{"_meta":{"schema":"v3","engine":"v2.1.1-2026-07-10","model":"opus","persp":"teortaxes"}}')
render "?s=$(urlenc "v3.$T7")" > "$TMP/t7.html"
check "migration: retired-preset note present" "$TMP/t7.html" must "retired preset; numbers unchanged"
check "migration: loads the 80-90 successor (≈89% at selection, not a wrong bucket)" "$TMP/t7.html" must "At the current selection it lands at ≈89%"

# --- 8. v4 route share-link renders the range-exploration counterfactual identity for the SPECIFIC route
#        (≈93% is x90-v1's own selection margin; loaded-specific, absent on default) ---
T8=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b90plus","configId":"x90-v1"}}}')
render "?s=$(urlenc "v4.$T8")" > "$TMP/t8.html"
check "v4 route: counterfactual identity present" "$TMP/t8.html" must "RANGE EXPLORATION — page-authored counterfactual"
check "v4 route: the specific route loaded (≈93% at selection)" "$TMP/t8.html" must "At the current selection it lands at ≈93%"

# --- 9. share-link traffic consistency across every declared shape: a diff traffic value disagreeing with the
#        declared profile is reconciled to Custom, so displayed identity = resolved traffic = computed margin ---
T9A=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"ncode","ioRatio":8,"cacheHit":41}}}')
render "?s=$(urlenc "v4.$T9A")" > "$TMP/t9a.html"
check "traffic consistency (native declared): reconciled to Custom 99:1" "$TMP/t9a.html" must "Effective traffic mix: 99:1 / 1% — Custom"
T9B=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v4","model":"opus","persp":"median","traffic":{"mode":"custom","profileId":null,"ioRatio":8,"cacheHit":41}}}')
render "?s=$(urlenc "v4.$T9B")" > "$TMP/t9b.html"
check "traffic consistency (custom declared): label matches computed 99:1 (no stale label)" "$TMP/t9b.html" must "Effective traffic mix: 99:1 / 1% — Custom"
T9C=$(b64 '{"ioRatio":99,"cacheHit":1,"_meta":{"schema":"v4","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b90plus","configId":"x90-v1"}}}')
render "?s=$(urlenc "v4.$T9C")" > "$TMP/t9c.html"
check "traffic consistency (exploration): reconciled to Custom 99:1" "$TMP/t9c.html" must "Effective traffic mix: 99:1 / 1% — Custom"
check "traffic consistency (exploration): exits to modified, no false in-range claim" "$TMP/t9c.html" must "MODIFIED RANGE EXPLORATION"

# --- 10. fail-closed identity: a share-link whose model or perspective does not resolve is REFUSED
#         whole - numbers never render under a substituted/mislabeled identity ---
T10A=$(b64 '{"util":100,"rentMult":0.02,"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"does-not-exist","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v4.$T10A")" > "$TMP/t10a.html"
check "fail-closed unknown-model: link refused (no shared-scenario note)" "$TMP/t10a.html" mustnot "Loaded a shared scenario"
check "fail-closed unknown-model: default state renders" "$TMP/t10a.html" must "≈77%"
T10B=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"nonesuch","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v4.$T10B")" > "$TMP/t10b.html"
check "fail-closed unknown-persp: default state renders" "$TMP/t10b.html" must "≈77%"

# --- 11. metadata-traffic bounds: an out-of-range or bad-mode _meta.traffic is rejected, not applied ---
T11=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":-50,"cacheHit":999}}}')
render "?s=$(urlenc "v4.$T11")" > "$TMP/t11.html"
check "fail-closed oob-traffic: rejected, default renders" "$TMP/t11.html" must "≈77%"
check "fail-closed oob-traffic: no shared-scenario note" "$TMP/t11.html" mustnot "Loaded a shared scenario"

# --- 12. hero caption is INTERVAL-AWARE: within [90,95] says "within"; above 95 says "above the interval" (P0-5) ---
T12A=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b90plus","configId":"x90-v1"}}}')
render "?s=$(urlenc "v4.$T12A")" > "$TMP/t12a.html"
check "hero caption within-90-95 (route ≈93%)" "$TMP/t12a.html" must "within the cited 90–95% unit-serving claim range"
T12B=$(b64 '{"util":100,"rentMult":0.1,"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v4.$T12B")" > "$TMP/t12b.html"
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
# state 1: default-central (no permalink)
render "" > "$TMP/s1.html"
check "state central: identity strip id-central"        "$TMP/s1.html" must 'class="identity-strip id-central"'
check "state central: strip names Opus"                 "$TMP/s1.html" must "Claude Opus 4.x"
check "state central: board SAYS central (clean)"        "$TMP/s1.html" must "$CENTRAL_PHRASE"
check "state central: reset control is hidden"           "$TMP/s1.html" must 'id-reset ghost-btn" hidden'
# state 2: §10 dive replay (gpt)
S2=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"gpt","persp":"dive","traffic":{"mode":"native","profileId":"openai-dive","ioRatio":9,"cacheHit":78}}}')
render "?s=$(urlenc "v4.$S2")" > "$TMP/s2.html"
check "state dive: strip names model GPT-5.6 Sol"        "$TMP/s2.html" must "GPT-5.6 Sol"
check "state dive: strip names traffic"                  "$TMP/s2.html" must "traffic 9:1 / 78%"
check "state dive: strip names the dive lens"            "$TMP/s2.html" must "§10 dive (this model)"
check "state dive: board NOT falsely central"            "$TMP/s2.html" mustnot "$CENTRAL_PHRASE"
check "state dive: reset control present"                "$TMP/s2.html" must "$RESET_TXT"
# state 3: xAI cash (grok, replay-locked)
S3=$(b64 '{"_meta":{"schema":"v3","engine":"v2.1.3-2026-07-12","model":"grok","persp":"xaicash","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v3.$S3")" > "$TMP/s3.html"
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
S4=$(b64 '{"_meta":{"schema":"v3","engine":"v2.1.3-2026-07-12","model":"grok","persp":"xaiopp","traffic":{"mode":"replay-locked","ioRatio":3,"cacheHit":0}}}')
render "?s=$(urlenc "v3.$S4")" > "$TMP/s4.html"
check "state xAI-opp: strip names opportunity-cost lens" "$TMP/s4.html" must "xAI opportunity-cost"
check "state xAI-opp: board NOT falsely central"         "$TMP/s4.html" mustnot "$CENTRAL_PHRASE"
check "state xAI-opp: reset control present"             "$TMP/s4.html" must "$RESET_TXT"
# state 5: range-exploration counterfactual (opus x90-v1)
S5=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"opus","persp":"x90-v1","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60},"explore":{"rangeId":"b90plus","configId":"x90-v1"}}}')
render "?s=$(urlenc "v4.$S5")" > "$TMP/s5.html"
check "state route: identity strip id-counterfactual"    "$TMP/s5.html" must 'class="identity-strip id-counterfactual"'
check "state route: strip names the route"               "$TMP/s5.html" must "owned-TCO estate route"
check "state route: strip says counterfactual"           "$TMP/s5.html" must "range-exploration counterfactual"
check "state route: board NOT falsely central"           "$TMP/s5.html" mustnot "$CENTRAL_PHRASE"
check "state route: reset control present"               "$TMP/s5.html" must "$RESET_TXT"
# state 6: Custom (user-defined, unsourced)
S6=$(b64 '{"_meta":{"schema":"v4","engine":"v2.1.3-2026-07-12","model":"custom","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v4.$S6")" > "$TMP/s6.html"
check "state Custom: strip marks user-defined/unsourced" "$TMP/s6.html" must "user-defined, unsourced"
check "state Custom: strip names inherited lens"         "$TMP/s6.html" must "inherits the Central scenario (Claude) lens"
check "state Custom: hero note suppresses cited-claim framing" "$TMP/s6.html" must "USER-DEFINED SCENARIO"
check "state Custom: board NOT falsely central"          "$TMP/s6.html" mustnot "$CENTRAL_PHRASE"
check "state Custom: reset control present"              "$TMP/s6.html" must "$RESET_TXT"

# --- central-scenario return affordance (owner fix 2026-07-14): the 60–80% bucket authors no
# counterfactual route, so it uniquely lacked a "load" control — the round trip back to the clean
# default must exist on the board, be labeled estimate-not-route, and read "currently loaded"
# ONLY in the central-clean state (synced on isCentralClean, never on persp id).
check "central-return: affordance present (default)"       "$TMP/default.html" must "Load the central scenario into the calculator"
check "central-return: labeled estimate, not a route"      "$TMP/default.html" must "the derived estimate, not a counterfactual"
check "central-return: default reads currently-loaded"     "$TMP/default.html" must 'config-loaded-tag">· currently loaded in the calculator below'
check "central-return: button hidden when central"         "$TMP/default.html" must 'central-return-btn" hidden'
check "central-return: affordance present (route state)"   "$TMP/s5.html" must "Load the central scenario into the calculator"
check "central-return: button live in route state"         "$TMP/s5.html" mustnot 'central-return-btn" hidden'
check "central-return: loaded-tag hidden in route state"   "$TMP/s5.html" must 'hidden="">· currently loaded in the calculator below'

# --- annex skin parity (ashitaorbis-integration follow-up, 2026-07-14): research annex pages carry
# the SAME skin-boot script as the main page (extracted verbatim at build time by
# build-research-html.mjs — fail-closed there), so the cross-repo ?skin/?theme contract and the
# app/dark default apply to the annexes, not just index.html.
"$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=5000 \
  --dump-dom "file://$(pwd)/site/research/changelog.html?skin=editorial&theme=light" 2>/dev/null > "$TMP/annex.html"
check "annex: skin-boot script present in built page"      "$TMP/annex.html" must "Skin/theme resolution"
check "annex: editorial skin applied from URL param"       "$TMP/annex.html" must 'data-skin="editorial"'
check "annex: light theme applied from URL param"          "$TMP/annex.html" must 'data-theme="light"'
"$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=5000 \
  --dump-dom "file://$(pwd)/site/research/index.html" 2>/dev/null > "$TMP/annex-default.html"
check "annex: app/dark default without params"             "$TMP/annex-default.html" must 'data-skin="app" data-theme="dark"'

# --- chart-gen billing-mix parity (2026-07-15 cold-review MAJOR, code-confirmed): the
# "Cost per 1M output tokens across hardware generations" chart used to compute price mix
# with a local formula that ignored billCacheHit/cacheWriteShare/cacheWriteMult. Force the
# blend 100% onto one GEN_TIMELINE generation (h200) so the hero and that generation's chart
# bar are computed over the IDENTICAL hardware, then set billCacheHit/cacheWriteShare away
# from their defaults — hero and the h200 bar must now report the same margin. Pre-fix, the
# hero read 79.8% (correct, billing-aware) while the chart's h200 bar read 67.6% (wrong,
# ignored billCacheHit/cacheWriteShare) — reproduced and recorded in
# logs/weekly/2026-07-15-expedited4.md via a direct engine.js node script before this fix
# landed. This DOM check is the end-to-end proof the browser-rendered chart agrees, since
# renderGenChart only runs in a browser (SVG/DOM), never under plain node.
TCHART=$(b64 '{"blend":{"h200":100},"billCacheHit":20,"cacheWriteShare":30,"cacheWriteMult":150,"_meta":{"schema":"v4","model":"opus","persp":"median","traffic":{"mode":"native","profileId":"reference","ioRatio":15,"cacheHit":60}}}')
render "?s=$(urlenc "v4.$TCHART")" > "$TMP/chartbug.html"
check "chart-gen/hero parity: hero shows the billing-aware 79.80% margin" "$TMP/chartbug.html" must "unrounded: 79.80%"
check "chart-gen/hero parity: h200 generation bar agrees with hero (79.8% margin)" "$TMP/chartbug.html" must "79.8% margin"
check "chart-gen/hero parity: h200 bar does NOT show the pre-fix wrong value (67.6% margin)" "$TMP/chartbug.html" mustnot "67.6% margin"

echo
if [ "$fails" -eq 0 ]; then echo "ALL APP TESTS PASS"; else echo "$fails APP TEST FAILURE(S)"; exit 1; fi
