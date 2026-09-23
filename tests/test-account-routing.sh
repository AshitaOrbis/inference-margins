#!/usr/bin/env bash
# Regression test for Claude ACCOUNT ROUTING across this pipeline
# (2026-08-24, commission im-weekly-repair-20260824, owner note 8cacaa).
#
# THE DEFECT. Every `claude` invocation in this pipeline ran with no account routing:
# `env -u CLAUDECODE claude -p …`. Under cron CLAUDE_CONFIG_DIR is unset, which means account a
# (`~/.claude`) — always, regardless of a's remaining quota. On 2026-08-24 account a was at its
# weekly cap, and a capped account does not queue or degrade: it refuses in ~13.3s with rc=1 and
# a 72-character banner ON STDOUT. That one fact produced four "different" failures in one run
# (logs/weekly/2026-08-24.md): the Phase A scope died, gptpro-fetch.sh's SEND child returned the
# banner where a REQUEST_ID should have been (reported as "SEND FAILED: no REQUEST_ID", which
# reads like a ChatGPT-Pro problem and was not one), the council's Opus synthesis came back 73
# bytes and took four good personas down with it, and Phase C died. No report was filed.
#
# THIS TEST IS RED-FIRST BY CONSTRUCTION. Every end-to-end case runs TWICE against the same
# fixture — once with the archived pre-fix script (`*.bak-2026-08-24-pre-account-routing`) and
# once with the fixed one. The pre-fix arm MUST fail and the post-fix arm MUST pass; a fix that
# silently stops being load-bearing turns the pre-fix arm green and fails this file.
#
# The fixture is the 2026-08-24 world: the default account is capped, another account is not.
#
# Run: bash research/inference-margins/tests/test-account-routing.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$(dirname "$HERE")"
BANNER="You've hit your weekly limit · resets Aug 26, 8am (America/Dawson_Creek)"

PASS=0; FAIL=0
ok() { echo "PASS  $1"; PASS=$((PASS+1)); }
no() { echo "FAIL  $1 ${2:+— $2}"; FAIL=$((FAIL+1)); }
eq() { [[ "$2" == "$3" ]] && ok "$1" || no "$1" "expected '$3', got '$2'"; }
has()   { [[ "$2" == *"$3"* ]] && ok "$1" || no "$1" "no match for '$3'"; }
hasnt() { [[ "$2" != *"$3"* ]] && ok "$1" || no "$1" "unexpectedly matched '$3'"; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ============================================================ 1. the router shim's contract
echo "=== 1. im_route_claude contract ==="
. "$PROJ/scripts/lib/claude-account.sh"

mk_router() { # mk_router <path> <mode>
  mkdir -p "$(dirname "$1")"
  case "$2" in
    eligible) cat > "$1" <<'R'
#!/usr/bin/env bash
echo '{"pick":"b","config_dir":"/tmp/test/.claude-b"}'
exit 0
R
    ;;
    none) cat > "$1" <<'R'
#!/usr/bin/env bash
echo '{"pick":null,"config_dir":null}'
exit 3
R
    ;;
    garbage) cat > "$1" <<'R'
#!/usr/bin/env bash
echo 'not json at all'
exit 0
R
    ;;
  esac
  chmod +x "$1"
}

mk_router "$TMP/router/eligible" eligible
mk_router "$TMP/router/none"     none
mk_router "$TMP/router/garbage"  garbage

IM_PICK_ACCOUNT="$TMP/router/eligible"; rc=0; im_route_claude sonnet || rc=$?
eq "router names an account → rc 0"                 "$rc" 0
eq "router names an account → config dir returned"  "$IM_CLAUDE_CONFIG_DIR" "/tmp/test/.claude-b"
has "route note is loggable"                        "$IM_ROUTE_NOTE" "account router -> b"

IM_PICK_ACCOUNT="$TMP/router/none"; rc=0; im_route_claude sonnet || rc=$?
eq "router says the whole fleet is capped → rc 1"   "$rc" 1
eq "…and returns NO config dir (never the ambient default)" "$IM_CLAUDE_CONFIG_DIR" ""
has "…and says so in the note"                      "$IM_ROUTE_NOTE" "NO eligible account"

IM_PICK_ACCOUNT="$TMP/router/missing-entirely"; rc=0; im_route_claude sonnet || rc=$?
eq "router not installed → rc 2 (degrade, never brick the pipeline)" "$rc" 2
eq "…and no config dir is invented"                 "$IM_CLAUDE_CONFIG_DIR" ""

IM_PICK_ACCOUNT="$TMP/router/garbage"; rc=0; im_route_claude sonnet || rc=$?
eq "router output unparseable → rc 2 (degrade)"     "$rc" 2

# The banner detector is what turns "empty result" into "capped account" in the logs.
printf '%s\n' "$BANNER" > "$TMP/banner.txt"
printf 'a real answer\n'  > "$TMP/answer.txt"
im_claude_banner_check "$TMP/banner.txt" && ok "banner detector fires on the real 2026-08-24 banner" \
                                         || no "banner detector missed the real banner"
im_claude_banner_check "$TMP/answer.txt" && no "banner detector false-positives on real output" \
                                         || ok "banner detector stays quiet on real output"
unset IM_PICK_ACCOUNT

# ============================================================ 2. the fixture world
# A throwaway repo skeleton, exactly the shape tests/test-weekly-success-assert.sh uses, plus the
# 2026-08-24 fixture: HOME/.claude (the ambient default) is CAPPED, HOME/.claude-b is not, and a
# router at the library's own default path knows it.
echo
echo "=== 2. weekly-update.sh end to end, default account CAPPED ==="

build() { # build <dir> <which-driver: prefix|fixed> <fetch-mode: files|fallback>
  local d="$1" which="$2" fetch="$3"
  mkdir -p "$d/proj/scripts/lib" "$d/userhome/claudeworkspace/discord" \
           "$d/userhome/claudeworkspace/polaris/tools" "$d/userhome/claudeworkspace/tools/codex-council" \
           "$d/userhome/.claude" "$d/userhome/.claude-b" "$d/bin"
  if [ "$which" = prefix ]; then
    cp "$PROJ/scripts/weekly-update.sh.bak-2026-08-24-pre-account-routing" "$d/proj/scripts/weekly-update.sh"
  else
    cp "$PROJ/scripts/weekly-update.sh" "$d/proj/scripts/weekly-update.sh"
  fi
  cp "$PROJ/scripts/lib/weekly-success-assert.sh" "$PROJ/scripts/lib/pro-fallback-policy.sh" \
     "$PROJ/scripts/lib/claude-account.sh" "$PROJ/scripts/lib/commit-own-output.sh" "$d/proj/scripts/lib/"
  git -C "$d/proj" init -q -b master
  git -C "$d/proj" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init

  cat > "$d/userhome/claudeworkspace/discord/discord-dm.sh" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$1" >> "$d/dm.txt"
EOF

  # The router, at the library's DEFAULT path (\$HOME/claudeworkspace/polaris/tools/pick-account),
  # so this also proves the shim looks in the right place.
  cat > "$d/userhome/claudeworkspace/polaris/tools/pick-account" <<EOF
#!/usr/bin/env bash
printf '{"pick":"b","config_dir":"%s/.claude-b"}\n' "$d/userhome"
exit 0
EOF

  # THE FIXTURE: account a (= the ambient default when CLAUDE_CONFIG_DIR is unset) is capped.
  cat > "$d/bin/claude" <<EOF
#!/usr/bin/env bash
cfg="\${CLAUDE_CONFIG_DIR:-\$HOME/.claude}"
if [ "\$cfg" = "\$HOME/.claude" ]; then
  # A capped account: rc 1, and the banner on STDOUT where the caller's parser is looking.
  printf '%s\n' "$BANNER"
  exit 1
fi
printf '%s\n' "\$cfg" >> "$d/accounts-used.txt"
prompt="\$*"
if [[ "\$prompt" == *"STEP 1a"* ]]; then
  echo "scoped by the routed account" > "logs/weekly/\$(date +%F)-scope.txt"
  printf '# Weekly Update Run\n\nStatus: DONE — scope derived.\n'
  exit 0
fi
cat <<'LOG'

## Step 2 — Apply approved items
Status: SKIPPED — 12 items still pending owner approval, 0 APPROVED.

## Step 3 — DM
Status: SENT
LOG
exit 0
EOF

  if [ "$fetch" = files ]; then
    cat > "$d/proj/scripts/gptpro-fetch.sh" <<'F'
#!/usr/bin/env bash
out=""; while [ $# -gt 0 ]; do case "$1" in --out) out="$2"; shift 2;; *) shift;; esac; done
mkdir -p "$(dirname "$out")"
{ echo "# GPT Pro research report"; echo; echo "---"; echo;
  echo "# Weekly deep dive"; echo; head -c 4000 /dev/zero | tr '\0' 'y'; } > "$out"
exit 0
F
  else
    # rc 3 = "send failed, caller should fall back" → drives the council branch.
    printf '#!/usr/bin/env bash\nexit 3\n' > "$d/proj/scripts/gptpro-fetch.sh"
  fi

  # Stub council: records the CLAUDE_CONFIG_DIR its parent handed it — which is the whole
  # question for the synthesis leg — then files a synthesis and prints the run_dir JSON.
  cat > "$d/userhome/claudeworkspace/tools/codex-council/codex_council.py" <<EOF
#!/usr/bin/env python3
import json, os, pathlib, sys
run = pathlib.Path("$d/council-run"); run.mkdir(parents=True, exist_ok=True)
pathlib.Path("$d/council-config-dir.txt").write_text(os.environ.get("CLAUDE_CONFIG_DIR", "<unset>"))
if os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude")) == "$d/userhome/.claude":
    (run / "synthesis-opus.md").write_text("$BANNER\n")   # capped: the 73-byte corpse
else:
    (run / "synthesis-opus.md").write_text("# Council synthesis\n" + "z" * 4000 + "\n")
print(json.dumps({"run_dir": str(run), "synth_mode": "opus"}, indent=2))
sys.exit(0)
EOF

  chmod +x "$d/bin/claude" "$d/userhome/claudeworkspace/discord/discord-dm.sh" \
           "$d/proj/scripts/gptpro-fetch.sh" "$d/userhome/claudeworkspace/polaris/tools/pick-account" \
           "$d/userhome/claudeworkspace/tools/codex-council/codex_council.py"
}

run_it() { # run_it <dir> -> RC
  # `-u CLAUDE_CONFIG_DIR` is the point of the fixture, not housekeeping: cron runs with it
  # unset, which is exactly why every call landed on account a. A test session that happens to
  # export it would hand the pre-fix script a working account and turn the RED arm green.
  ( cd "$1/proj" && env -u CLAUDE_CONFIG_DIR -u CLAUDECODE -u IM_PICK_ACCOUNT \
      PATH="$1/bin:$PATH" HOME="$1/userhome" \
      bash scripts/weekly-update.sh >/dev/null 2>&1 )
  RC=$?
}

TODAY="$(date +%F)"
report_of() { echo "$1/proj/research/gptpro-reports/weekly-$TODAY.md"; }
log_of()    { echo "$1/proj/logs/weekly/$TODAY.md"; }

# ---- RED: the pre-fix driver against the capped default -------------------------------
build "$TMP/red" prefix files
run_it "$TMP/red"
[ "$RC" -ne 0 ] && ok "RED (pre-fix): capped default account → wrapper exits $RC" \
                || no "RED (pre-fix): wrapper exited 0 on a capped account — the defect is gone from the fixture, not from the code"
RED_LOG="$(cat "$(log_of "$TMP/red")" 2>/dev/null || true)"
has "RED (pre-fix): the run log holds the refusal banner" "$RED_LOG" "hit your weekly limit"
has "RED (pre-fix): wrapper verdict is FAILED"            "$RED_LOG" "Wrapper verdict — FAILED"
# The Pro-fetch stub is account-blind on purpose (the real fetcher's own capped-account behaviour
# is section 4's subject), so a report file exists here. What the cap destroyed is everything
# DOWNSTREAM of it: phase C never queued a finding and never DM'd the owner.
hasnt "RED (pre-fix): phase C never reached its terminal statuses" "$RED_LOG" "Status: SENT"
[ -s "$TMP/red/dm.txt" ] && ok "RED (pre-fix): only the wrapper's FAILURE DM went out" \
                         || no "RED (pre-fix): no failure DM at all"
has "RED (pre-fix): that DM is the failure notice"        "$(cat "$TMP/red/dm.txt" 2>/dev/null || true)" "FAILED verification"
[ ! -s "$TMP/red/accounts-used.txt" ] && ok "RED (pre-fix): no eligible account was ever used" \
                                      || no "RED (pre-fix): something routed after all"

# ---- GREEN: the fixed driver, same fixture --------------------------------------------
build "$TMP/green" fixed files
run_it "$TMP/green"
eq "GREEN (fixed): same capped fixture → wrapper exits 0" "$RC" 0
[ -s "$(report_of "$TMP/green")" ] && ok "GREEN (fixed): the weekly report IS filed" \
                                   || no "GREEN (fixed): still no report"
GREEN_LOG="$(cat "$(log_of "$TMP/green")" 2>/dev/null || true)"
hasnt "GREEN (fixed): no refusal banner in the run log" "$GREEN_LOG" "hit your weekly limit"
has   "GREEN (fixed): the run log records the routing decision" "$GREEN_LOG" "account router -> b"
has   "GREEN (fixed): wrapper verdict is VERIFIED"      "$GREEN_LOG" "Wrapper verdict — VERIFIED"
eq    "GREEN (fixed): both claude phases ran on the routed account" \
      "$(sort -u "$TMP/green/accounts-used.txt" 2>/dev/null | wc -l)" 1
has   "GREEN (fixed): that account is b, not the capped default" \
      "$(cat "$TMP/green/accounts-used.txt" 2>/dev/null || true)" "/.claude-b"
[ ! -s "$TMP/green/dm.txt" ] && ok "GREEN (fixed): no failure DM" || no "GREEN (fixed): spurious failure DM"

# ============================================================ 3. the council synthesis leg
echo
echo "=== 3. council fallback: the Opus synthesis must be routed too ==="
# 2026-08-24's most expensive loss: four personas succeeded on codex quota and the synthesis
# came back holding the banner, so all of it was discarded.
build "$TMP/red-council" prefix fallback
run_it "$TMP/red-council"
eq "RED (pre-fix): council synthesis inherited the ambient (capped) account" \
   "$(cat "$TMP/red-council/council-config-dir.txt" 2>/dev/null || echo MISSING)" "<unset>"
# The synthesis came back holding the banner, so what got "filed" is the banner with a two-line
# header on it — under the 1000-byte floor the fetcher and the wrapper both enforce. This is the
# 2026-08-24 loss exactly: four good personas, no usable report.
RC_REPORT="$(report_of "$TMP/red-council")"
RC_BYTES="$( [ -f "$RC_REPORT" ] && wc -c < "$RC_REPORT" || echo 0 )"
[ "$RC_BYTES" -lt 1000 ] && ok "RED (pre-fix): council filed nothing usable ($RC_BYTES bytes, under the 1000-byte floor)" \
                         || no "RED (pre-fix): a real report appeared" "$RC_BYTES bytes"
has "RED (pre-fix): and what it filed is the refusal banner" \
    "$( [ -f "$RC_REPORT" ] && cat "$RC_REPORT" || true )" "hit your weekly limit"
has "RED (pre-fix): wrapper verdict is FAILED" \
    "$(cat "$(log_of "$TMP/red-council")" 2>/dev/null || true)" "Wrapper verdict — FAILED"

build "$TMP/green-council" fixed fallback
run_it "$TMP/green-council"
eq "GREEN (fixed): council synthesis got the routed account" \
   "$(cat "$TMP/green-council/council-config-dir.txt" 2>/dev/null || echo MISSING)" "$TMP/green-council/userhome/.claude-b"
[ -s "$(report_of "$TMP/green-council")" ] && ok "GREEN (fixed): council fallback filed the report" \
                                           || no "GREEN (fixed): council fallback still filed nothing"
has "GREEN (fixed): the report is labelled as the council fallback" \
    "$(head -1 "$(report_of "$TMP/green-council")" 2>/dev/null || true)" "FALLBACK: GPT COUNCIL"

# ============================================================ 4. gptpro-fetch.sh SEND
echo
echo "=== 4. gptpro-fetch.sh SEND: routed, and honest about a refusal ==="
build_fetch() { # build_fetch <dir> <prefix|fixed>
  local d="$1" which="$2"
  mkdir -p "$d/proj/scripts/lib" "$d/userhome/claudeworkspace/polaris/tools" \
           "$d/userhome/.claude" "$d/userhome/.claude-b" "$d/bin" "$d/work"
  if [ "$which" = prefix ]; then
    cp "$PROJ/scripts/gptpro-fetch.sh.bak-2026-08-24-pre-account-routing" "$d/proj/scripts/gptpro-fetch.sh"
  else
    cp "$PROJ/scripts/gptpro-fetch.sh" "$d/proj/scripts/gptpro-fetch.sh"
    cp "$PROJ/scripts/lib/claude-account.sh" "$d/proj/scripts/lib/"
  fi
  cat > "$d/userhome/claudeworkspace/polaris/tools/pick-account" <<EOF
#!/usr/bin/env bash
printf '{"pick":"b","config_dir":"%s/.claude-b"}\n' "$d/userhome"
exit 0
EOF
  cat > "$d/bin/claude" <<EOF
#!/usr/bin/env bash
cfg="\${CLAUDE_CONFIG_DIR:-\$HOME/.claude}"
if [ "\$cfg" = "\$HOME/.claude" ]; then printf '%s\n' "$BANNER"; exit 1; fi
prompt="\$*"
if [[ "\$prompt" == *"single-purpose dispatcher"* ]]; then
  printf 'REQUEST_ID:req_test_1\nCONVERSATION_ID:conv_test_1\n'; exit 0
fi
if [[ "\$prompt" == *"single-purpose poller"* ]]; then
  { echo "# GPT Pro research report"; echo; echo "---"; echo; echo "# Answer";
    head -c 4000 /dev/zero | tr '\0' 'q'; } > "$d/work/out.md"
  printf 'FETCH_DONE\n'; exit 0
fi
exit 0
EOF
  chmod +x "$d/bin/claude" "$d/userhome/claudeworkspace/polaris/tools/pick-account"
  echo "a research scope" > "$d/work/scope.txt"
}
run_fetch() { # run_fetch <dir> -> FRC, FERR
  FERR="$( ( cd "$1/proj" && env -u CLAUDE_CONFIG_DIR -u CLAUDECODE -u IM_PICK_ACCOUNT \
    PATH="$1/bin:$PATH" HOME="$1/userhome" \
    bash scripts/gptpro-fetch.sh --scope-file "$1/work/scope.txt" --out "$1/work/out.md" \
      --state "$1/work/state.json" --poll-budget-seconds 30 --second-chance-delay-seconds 0 \
      --min-bytes 1000 --header-note test ) 2>&1 >/dev/null )"
  FRC=$?
}

build_fetch "$TMP/red-fetch" prefix
run_fetch   "$TMP/red-fetch"
eq  "RED (pre-fix): SEND against the capped default → rc 3" "$FRC" 3
has "RED (pre-fix): …reported as a bare no-REQUEST_ID"      "$FERR" "SEND FAILED: no REQUEST_ID"
has "RED (pre-fix): …pointing at a child log the EXIT trap then deletes" "$FERR" "gptpro-child."
CHILD_PATH="$(printf '%s' "$FERR" | grep -oE '/tmp/gptpro-child\.[A-Za-z0-9]+\.log' | head -1)"
if [ -n "$CHILD_PATH" ]; then
  [ ! -e "$CHILD_PATH" ] && ok "RED (pre-fix): that child log is indeed already gone ($CHILD_PATH)" \
                         || no "RED (pre-fix): the child log survived, so the pointer was usable"
else
  no "RED (pre-fix): could not extract the child-log path from the message"
fi
[ ! -f "$TMP/red-fetch/work/state.json" ] && ok "RED (pre-fix): no fetch state written" \
                                          || no "RED (pre-fix): state written despite a failed send"

build_fetch "$TMP/green-fetch" fixed
run_fetch   "$TMP/green-fetch"
eq  "GREEN (fixed): SEND on the same fixture → rc 0" "$FRC" 0
has "GREEN (fixed): the send is logged with its routing" "$FERR" "account router -> b"
has "GREEN (fixed): SEND succeeded"                      "$FERR" "SEND ok: request_id=req_test_1"
[ -s "$TMP/green-fetch/work/out.md" ] && ok "GREEN (fixed): the report was fetched and filed" \
                                      || no "GREEN (fixed): no report filed"

# The diagnostic itself: when a send IS refused, say WHY, inline, instead of pointing at a
# deleted file. Force it by making every account capped.
mkdir -p "$TMP/diag" && cp -r "$TMP/green-fetch/." "$TMP/diag/"
cat > "$TMP/diag/bin/claude" <<EOF
#!/usr/bin/env bash
printf '%s\n' "$BANNER"
exit 1
EOF
chmod +x "$TMP/diag/bin/claude"
rm -f "$TMP/diag/work/state.json" "$TMP/diag/work/out.md"
run_fetch "$TMP/diag"
eq  "DIAGNOSTIC: a refused send still exits 3 (caller falls back)" "$FRC" 3
has "DIAGNOSTIC: names the real cause — the Claude account, not ChatGPT Pro" \
    "$FERR" "REFUSED BY THE CLAUDE ACCOUNT"
has "DIAGNOSTIC: quotes the child's actual stdout inline"  "$FERR" "SEND child stdout"
has "DIAGNOSTIC: the banner text itself reaches the log"   "$FERR" "hit your weekly limit"

# ============================================================ 5. daily-sweep.sh classifier
echo
echo "=== 5. daily-sweep.sh classifier: routed, and never silently empty ==="
# daily-sweep.sh had the same unrouted-claude defect, and its version is WORSE than the weekly's:
# the classifier discarded child stderr (`2>/dev/null`) and fell back to `JSON='{}'`, so a capped
# account produced zero MATERIAL and zero MINOR verdicts — indistinguishable in the sweep log from
# a genuinely quiet day. A whole day's candidates would be dropped with no red anywhere.
#
# The classifier block is EXTRACTED from the shipped script by line range and eval'd, so this
# exercises the real lines rather than a copy that can drift. Same technique for both arms.
CLS_START="$(grep -n '^VERDICTS="\$(mktemp)"' "$PROJ/scripts/daily-sweep.sh" | cut -d: -f1)"
CLS_END="$(grep -n '^rm -f "\$VERDICTS.err"' "$PROJ/scripts/daily-sweep.sh" | cut -d: -f1)"
CLS_START_OLD="$(grep -n '^VERDICTS="\$(mktemp)"' "$PROJ/scripts/daily-sweep.sh.bak-2026-08-24-pre-account-routing" | cut -d: -f1)"
CLS_END_OLD="$(grep -n "^  JSON='{}'" "$PROJ/scripts/daily-sweep.sh.bak-2026-08-24-pre-account-routing" | cut -d: -f1)"
CLS_END_OLD=$((CLS_END_OLD + 1))   # include the closing `fi`

run_classifier() { # run_classifier <script> <start> <end> <capped: all|default> -> CLS_JSON, CLS_LOG
  local script="$1" a="$2" b="$3" mode="$4" d
  d="$(mktemp -d)"
  mkdir -p "$d/userhome/claudeworkspace/polaris/tools" "$d/userhome/.claude" "$d/userhome/.claude-b" "$d/bin"
  cat > "$d/userhome/claudeworkspace/polaris/tools/pick-account" <<EOF
#!/usr/bin/env bash
printf '{"pick":"b","config_dir":"%s/.claude-b"}\n' "$d/userhome"
exit 0
EOF
  cat > "$d/bin/claude" <<EOF
#!/usr/bin/env bash
cfg="\${CLAUDE_CONFIG_DIR:-\$HOME/.claude}"
if [ "$mode" = all ] || [ "\$cfg" = "\$HOME/.claude" ]; then printf '%s\n' "$BANNER"; exit 1; fi
printf '{"items":[{"summary":"a real verdict","verdict":"MATERIAL","reason":"routed fine"}]}\n'
exit 0
EOF
  chmod +x "$d/bin/claude" "$d/userhome/claudeworkspace/polaris/tools/pick-account"
  CLS_JSON="$(
    env -u CLAUDE_CONFIG_DIR -u CLAUDECODE -u IM_PICK_ACCOUNT PATH="$d/bin:$PATH" HOME="$d/userhome" \
    bash -c '
      set -uo pipefail
      PROJ="$1"; LOG="$2"; RUBRIC="classify these"; CANDIDATES="$3"
      echo "a candidate" > "$CANDIDATES"
      [ -f "$PROJ/scripts/lib/claude-account.sh" ] && . "$PROJ/scripts/lib/claude-account.sh"
      eval "$(sed -n "${4},${5}p" "$6")"
      printf "%s" "$JSON"
    ' _ "$PROJ" "$d/sweep.log" "$d/cands.txt" "$a" "$b" "$script" 2>/dev/null
  )"
  CLS_LOG="$(cat "$d/sweep.log" 2>/dev/null || true)"
  rm -rf "$d"
}

run_classifier "$PROJ/scripts/daily-sweep.sh.bak-2026-08-24-pre-account-routing" \
               "$CLS_START_OLD" "$CLS_END_OLD" default
eq   "RED (pre-fix): capped default → empty verdict set"          "$CLS_JSON" "{}"
hasnt "RED (pre-fix): …and the sweep log says NOTHING about why"  "$CLS_LOG" "UNCLASSIFIED"

run_classifier "$PROJ/scripts/daily-sweep.sh" "$CLS_START" "$CLS_END" default
has  "GREEN (fixed): routed away from the capped default → real verdicts" "$CLS_JSON" "MATERIAL"
has  "GREEN (fixed): the sweep log records the routing decision"          "$CLS_LOG" "account router -> b"

run_classifier "$PROJ/scripts/daily-sweep.sh" "$CLS_START" "$CLS_END" all
eq   "GREEN (fixed): every account capped → still an empty verdict set"   "$CLS_JSON" "{}"
has  "GREEN (fixed): …but the log now says the candidates are UNCLASSIFIED, not NOISE" \
     "$CLS_LOG" "UNCLASSIFIED, not NOISE"
has  "GREEN (fixed): …and names the cause"                               "$CLS_LOG" "rate-capped"

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
