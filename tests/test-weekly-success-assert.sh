#!/usr/bin/env bash
# Regression test for the weekly-update.sh success-condition gate (bq-118).
#
# Three properties, all measured here:
#   1. The gate's verdict on the FIVE REAL weekly runs on record. Four of them were false greens;
#      the gate must turn each red for the right reason, and must leave the one true green alone.
#   2. The false-positive guard. "pending" occurs in ordinary prose in successful runs, so a gate
#      that cries wolf on a good run would be worse than no gate — cron reds get ignored.
#   3. End to end: the REAL scripts/weekly-update.sh, with a stubbed driver that replays the
#      2026-08-10 orphan, must exit nonzero and must DM. The same harness with a driver that does
#      its job must exit 0 and stay silent. This is the forced-failure test + the clean dry run.
#
# Run: bash research/inference-margins/tests/test-weekly-success-assert.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$(dirname "$HERE")"
. "$PROJ/scripts/lib/weekly-success-assert.sh"

PASS=0; FAIL=0
ok() { echo "PASS  $1"; PASS=$((PASS+1)); }
no() { echo "FAIL  $1 ${2:+— $2}"; FAIL=$((FAIL+1)); }
eq() { [[ "$2" == "$3" ]] && ok "$1" || no "$1" "expected '$3', got '$2'"; }
has() { # has <name> <haystack> <needle>
  [[ "$2" == *"$3"* ]] && ok "$1" || no "$1" "no reason matched '$3'"
}
hasnt() { [[ "$2" != *"$3"* ]] && ok "$1" || no "$1" "unexpectedly matched '$3'"; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# verdict <report> <log> -> sets V_OUT (reasons) and V_RC
verdict() {
  V_OUT="$(weekly_success_shortfalls "$1" "$2" 1000)"; V_RC=$?
  V_N=0; [ -n "$V_OUT" ] && V_N=$(printf '%s\n' "$V_OUT" | wc -l)
}

echo "=== 1. the five real weekly runs on record ==="
R="$PROJ/research/gptpro-reports"; L="$PROJ/logs/weekly"

# --- 2026-07-20: the one true green. Log says DONE twice, report is 16.9 KB. -----------------
if [ -f "$L/2026-07-20.md" ]; then
  verdict "$R/weekly-2026-07-20.md" "$L/2026-07-20.md"
  [ "$V_RC" -eq 0 ] && ok "07-20 (true green) → PASS, 0 shortfalls" \
                    || no "07-20 (true green) → gate cried wolf" "$(printf '%s' "$V_OUT" | tr '\n' '; ')"
else
  echo "SKIP  07-20 fixture archived"
fi

# --- 2026-07-27: report is 449 B of reasoning preamble; the log itself is honest (COMPLETE). --
# Guard on BOTH fixture files, like every sibling row — the log is untracked, so a fresh
# worktree has the tracked report but no logs/ tree, and a missing log is (correctly) its own
# shortfall, which turned this row's "exactly 1" into an environment artifact (M8 verify R2).
# NOTE (2026-08-14, a-pro-followup): the 449-byte stub was replaced by the complete report,
# recovered by asking Pro in its own thread to re-emit it whole (76,590 B; the stub is kept at
# archive/weekly-2026-07-27.md.stub-449B-superseded-2026-08-14). So this row can no longer assert
# "449 bytes" against the live file. The enduring regression is the RULE, not that one week's
# byte count — a trivial report must fault while the honest log does not — so it is now asserted
# against the archived stub itself, which cannot drift and cannot be recovered out from under it.
STUB="$R/archive/weekly-2026-07-27.md.stub-449B-superseded-2026-08-14"
if [ -f "$STUB" ] && [ -f "$L/2026-07-27.md" ]; then
  verdict "$STUB" "$L/2026-07-27.md"
  eq  "07-27 stub (449-byte report) → exactly 1 shortfall"  "$V_N" 1
  has "07-27 shortfall is the trivial report"               "$V_OUT" "is 449 bytes"
  hasnt "07-27 log itself is not faulted (Status: COMPLETE)" "$V_OUT" "non-terminal"
else
  echo "SKIP  07-27 stub fixture archived"
fi
# And the restored report must now PASS the same gate it used to fail.
if [ -f "$R/weekly-2026-07-27.md" ] && [ -f "$L/2026-07-27.md" ]; then
  verdict "$R/weekly-2026-07-27.md" "$L/2026-07-27.md"
  eq "07-27 restored report ($(wc -c < "$R/weekly-2026-07-27.md") B) → no shortfalls" "$V_N" 0
fi

# --- 2026-08-03 / 08-05 / 08-10: dispatched, never filed. All three exited 0. ---------------
# NOTE (2026-08-14, a-pro-followup): all three answers were later RECOVERED from the ChatGPT
# account and filed under their canonical weekly- names, so the "report is missing" half of this
# fixture is no longer true on disk — by design, that was the point of the recovery. The enduring
# regression these rows exist to hold is the OTHER half: each run exited 0 holding a non-terminal
# run log, and the gate must fail it. So the log assertion is unconditional and the report
# assertion follows whatever is actually on disk, rather than encoding a data loss as a fixture.
for d in 2026-08-03 2026-08-05 2026-08-10; do
  [ -f "$L/$d.md" ] || { echo "SKIP  $d fixture archived"; continue; }
  verdict "$R/weekly-$d.md" "$L/$d.md"
  [ "$V_RC" -ne 0 ] && ok "$d (false green) → FAIL" || no "$d (false green) → gate passed it"
  has "$d faults the unfinished run log"    "$V_OUT" "run log "
  if [ -f "$R/weekly-$d.md" ]; then
    ok "$d report has been recovered ($(wc -c < "$R/weekly-$d.md") B) — only the log faults it now"
    hasnt "$d no longer faults a missing report" "$V_OUT" "never filed its report"
  else
    has "$d faults the missing report"      "$V_OUT" "never filed its report"
  fi
  echo "      ledger for $d:"; printf '%s\n' "$V_OUT" | sed 's/^/        · /'
done

echo
echo "=== 2. false-positive guard: 'pending' in prose is not a shortfall ==="
# The exact shapes that appear in the two successful runs' logs.
cat > "$TMP/good.md" <<'EOF'
# Weekly Update Run — 2026-01-01

Status: DONE

## Step 2 — Apply approved items
SKIPPED, correctly: no items carried an owner-set APPROVED status at run time. This week's
findings were queued as **Q-AUTO-WEEKLY** (QUEUED-AUTO, pending owner approval).
(0 applied), pending owner approval pass over the backlog.

## Step 3 — DM
Status: DONE — ~65 QUEUED-AUTO items still pending owner review, 0 applied.
EOF
head -c 1200 /dev/zero | tr '\0' 'x' > "$TMP/report-ok.md"
verdict "$TMP/report-ok.md" "$TMP/good.md"
[ "$V_RC" -eq 0 ] && ok "prose 'pending' + 'DONE — N pending' → PASS" \
                  || no "gate cried wolf on a good run" "$(printf '%s' "$V_OUT" | tr '\n' '; ')"

echo
echo "=== 3. each non-terminal shape is caught ==="
mk() { printf '%s\n' "$2" > "$TMP/case.md"; verdict "$TMP/report-ok.md" "$TMP/case.md"; }
for shape in "Status: IN PROGRESS" "Status: STARTED" "Status: NOT STARTED" "Status: PENDING" \
             "**Status:** IN PROGRESS" "*Status*: in progress" "Status: RUNNING" "Status: unclear"; do
  mk x "$shape"
  [ "$V_RC" -ne 0 ] && ok "caught: $shape" || no "missed: $shape"
done
for shape in "(pending)" "(in progress)" "(in-progress)" "(not started)" "(TBD)"; do
  printf 'Status: DONE\n%s\n' "$shape" > "$TMP/case.md"
  verdict "$TMP/report-ok.md" "$TMP/case.md"
  [ "$V_RC" -ne 0 ] && ok "caught placeholder line: $shape" || no "missed placeholder: $shape"
done
for shape in "Status: DONE" "Status: COMPLETE (recovered by Polaris after the driver orphaned the run)" \
             "Status: SKIPPED" "Status: SENT" "Status: APPLIED (v2.1.12, 2026-08-05)" "Status: N/A" \
             "**Status:** DONE"; do
  mk x "$shape"
  [ "$V_RC" -eq 0 ] && ok "accepted terminal: $shape" || no "rejected terminal: $shape" "$V_OUT"
done
mk x "Status: FAILED — deploy gate refused a dirty tree"
has "a FAILED step is a shortfall, not a green" "$V_OUT" "reports a failed step"

echo
echo "=== 4. report-size boundary and missing artifacts ==="
head -c 1000 /dev/zero | tr '\0' 'x' > "$TMP/exact.md"
head -c 999  /dev/zero | tr '\0' 'x' > "$TMP/short.md"
printf 'Status: DONE\n' > "$TMP/term.md"
verdict "$TMP/exact.md" "$TMP/term.md"; [ "$V_RC" -eq 0 ] && ok "report at exactly 1000 B → PASS" || no "1000 B rejected"
verdict "$TMP/short.md" "$TMP/term.md"; [ "$V_RC" -ne 0 ] && ok "report at 999 B → FAIL"          || no "999 B accepted"
verdict "$TMP/nope.md"  "$TMP/term.md"; has "missing report named in the reason" "$V_OUT" "nope.md does not exist"
verdict "$TMP/exact.md" "$TMP/no-log.md"; has "missing log named in the reason"  "$V_OUT" "no-log.md does not exist"
printf '# Weekly run\n\nnothing recorded.\n' > "$TMP/silent.md"
verdict "$TMP/exact.md" "$TMP/silent.md"; has "a log with no Status: line is a shortfall" "$V_OUT" "carries no Status: line"

echo
echo "=== 5. end to end: the real weekly-update.sh, stubbed driver ==="
# A throwaway repo skeleton so the real script's master-branch check, repo lock, and log paths all
# work without touching the live project. HOME is redirected so the DM stub is what gets called.
TODAY="$(date +%F)"
# Since the 2026-08-14 three-phase restructure the wrapper drives THREE things, so the skeleton
# stubs all three: `claude` runs twice (phase A scope, phase C apply/DM) and is told apart by the
# "STEP 1a" marker in its prompt, and scripts/gptpro-fetch.sh is a stub because phase B now calls
# it from BASH rather than from inside the driver session — which is the whole point of the
# restructure and the reason the 08-10 run died.
build_skeleton() { # build_skeleton <dir> <driver-mode>
  local d="$1" mode="$2"
  mkdir -p "$d/proj/scripts/lib" "$d/sandbox-home/claudeworkspace/discord" "$d/bin"
  cp "$PROJ/scripts/weekly-update.sh" "$d/proj/scripts/"
  # claude-account.sh joined the hard dependencies on 2026-08-24 (im-weekly-repair-20260824):
  # weekly-update.sh sources it for account routing. Its router lives at
  # $HOME/claudeworkspace/polaris/tools/pick-account, which this sandbox HOME does not have — so
  # routing degrades to the ambient account and these cases keep their original semantics.
  cp "$PROJ/scripts/lib/weekly-success-assert.sh" "$PROJ/scripts/lib/pro-fallback-policy.sh" \
     "$PROJ/scripts/lib/claude-account.sh" "$PROJ/scripts/lib/commit-own-output.sh" "$d/proj/scripts/lib/"
  git -C "$d/proj" init -q -b master
  git -C "$d/proj" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  cat > "$d/sandbox-home/claudeworkspace/discord/discord-dm.sh" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$1" >> "$d/dm.txt"
EOF

  # --- phase B stub: the bash-owned Pro fetcher -------------------------------------------
  # crash/clean file a real report and exit 0; orphan exits 2 (pending/resumable — the honest
  # replay of "dive dispatched, nothing came back in budget") and files nothing.
  if [ "$mode" = orphan ]; then
    cat > "$d/proj/scripts/gptpro-fetch.sh" <<'EOF'
#!/usr/bin/env bash
echo "stub gptpro-fetch: poll budget exhausted, still generating"
exit 2
EOF
  else
    cat > "$d/proj/scripts/gptpro-fetch.sh" <<'EOF'
#!/usr/bin/env bash
out=""; while [ $# -gt 0 ]; do case "$1" in --out) out="$2"; shift 2;; *) shift;; esac; done
mkdir -p "$(dirname "$out")"
{ echo "# GPT Pro research report"; echo; echo "---"; echo;
  echo "# Weekly deep dive"; echo; head -c 4000 /dev/zero | tr '\0' 'y'; } > "$out"
echo "stub gptpro-fetch: filed $out"
exit 0
EOF
  fi

  # --- phase A / phase C stub: the driver session ------------------------------------------
  # The wrapper appends the driver's stdout to the run log, so the stub's stdout IS the log.
  # It runs with cwd=$PROJ, which is how the clean stub knows where to file its report.
  if [ "$mode" = crash ]; then
    cat > "$d/bin/claude" <<'EOF'
#!/usr/bin/env bash
# Phase A fine; phase C files everything then dies (timeout / OOM / API abort).
# Artifacts are fine, rc is not.
prompt="${@: -1}"
if [[ "$prompt" == *"STEP 1a"* ]]; then
  echo "scoped" > "$(ls -d logs/weekly)/$(date +%F)-scope.txt"
  printf '# Weekly Update Run\n\nStatus: DONE — scope derived.\n'
  exit 0
fi
printf '\nStatus: DONE\n'
exit 124
EOF
  elif [ "$mode" = orphan ]; then
    cat > "$d/bin/claude" <<'EOF'
#!/usr/bin/env bash
# Replays 2026-08-10: scope written, dive dispatched, nothing filed, log left non-terminal.
prompt="${@: -1}"
if [[ "$prompt" == *"STEP 1a"* ]]; then
  echo "scoped" > "$(ls -d logs/weekly)/$(date +%F)-scope.txt"
  cat <<'LOG'
# Weekly Update Run

Status: STARTED

## Step 1 — GPT Pro weekly search
Dispatching via `scripts/gptpro-fetch.sh` now. Invocation 1 exceeded the 300s Bash timeout and
was auto-moved to the background. Waiting for its completion notification.
(in progress)

## Step 2 — Apply approved items
(pending)

## Step 3 — DM
(pending)
LOG
  exit 0
fi
exit 0
EOF
  else
    cat > "$d/bin/claude" <<'EOF'
#!/usr/bin/env bash
prompt="${@: -1}"
if [[ "$prompt" == *"STEP 1a"* ]]; then
  echo "scoped" > "$(ls -d logs/weekly)/$(date +%F)-scope.txt"
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
  fi
  chmod +x "$d/bin/claude" "$d/sandbox-home/claudeworkspace/discord/discord-dm.sh" "$d/proj/scripts/gptpro-fetch.sh"
}

run_skeleton() { # run_skeleton <dir> -> E2E_RC
  ( cd "$1/proj" && PATH="$1/bin:$PATH" HOME="$1/sandbox-home" bash scripts/weekly-update.sh >/dev/null 2>&1 )
  E2E_RC=$?
}

build_skeleton "$TMP/orphan" orphan
run_skeleton   "$TMP/orphan"
[ "$E2E_RC" -ne 0 ] && ok "FORCED FAILURE: orphaned driver (exit 0, nothing filed) → wrapper exit $E2E_RC" \
                    || no "FORCED FAILURE: wrapper still exited 0 on an orphaned run"
[ -s "$TMP/orphan/dm.txt" ] && ok "FORCED FAILURE: owner DM fired" || no "FORCED FAILURE: no DM sent"
DMTXT="$(cat "$TMP/orphan/dm.txt" 2>/dev/null || true)"
has "DM names the missing report"     "$DMTXT" "never filed its report"
has "DM names the unfinished log"     "$DMTXT" "non-terminal step status"
LOGTXT="$(cat "$TMP/orphan/proj/logs/weekly/$TODAY.md" 2>/dev/null || true)"
has "run log records the wrapper verdict" "$LOGTXT" "Wrapper verdict — FAILED"
# The DM is an owner ping: deduped and project-relative. The log keeps the full ledger.
eq "DM collapses the two identical (pending) bullets into one" \
   "$(printf '%s\n' "$DMTXT" | grep -c 'placeholder: (pending)')" 1
eq "run log keeps both (pending) rows in the ledger" \
   "$(printf '%s\n' "$LOGTXT" | grep -c 'placeholder: (pending)')" 2
hasnt "DM carries no absolute project path" "$DMTXT" "$TMP/orphan/proj/"
has   "DM report path is project-relative"  "$DMTXT" "research/gptpro-reports/weekly-$TODAY.md"

build_skeleton "$TMP/crash" crash
run_skeleton   "$TMP/crash"
[ "$E2E_RC" -ne 0 ] && ok "session rc still counts: artifacts fine, driver exited 124 → wrapper exit $E2E_RC" \
                    || no "wrapper swallowed a nonzero driver exit"
has "DM names the driver's exit code"        "$(cat "$TMP/crash/dm.txt" 2>/dev/null || true)" "driver session exited 124"
has "DM says the artifacts themselves were OK" "$(cat "$TMP/crash/dm.txt" 2>/dev/null || true)" "artifacts verified OK"

build_skeleton "$TMP/clean" clean
run_skeleton   "$TMP/clean"
[ "$E2E_RC" -eq 0 ] && ok "CLEAN DRY RUN: driver files a real report + terminal log → wrapper exit 0" \
                    || no "CLEAN DRY RUN: wrapper failed a good run" "rc=$E2E_RC; $(tail -5 "$TMP/clean/proj/logs/weekly/$TODAY.md" 2>/dev/null)"
[ ! -s "$TMP/clean/dm.txt" ] && ok "CLEAN DRY RUN: no failure DM" || no "CLEAN DRY RUN: spurious DM" "$(cat "$TMP/clean/dm.txt")"
has "CLEAN DRY RUN: log records the VERIFIED verdict" \
    "$(cat "$TMP/clean/proj/logs/weekly/$TODAY.md" 2>/dev/null || true)" "Wrapper verdict — VERIFIED"

echo
echo "=== 6. the fetch stays BASH-OWNED (the 2026-08-03/05/10 loss) ==="
# THE DEFECT: gptpro-fetch.sh used to be invoked from inside the `claude -p` driver session, so
# its multi-minute block sat under the Claude Code harness's 300s default Bash-tool timeout. Past
# 300s the harness backgrounds the call and promises a completion notification that a headless
# one-shot can never receive. The old brief's mitigation was to TELL the model to pass the Bash
# tool's `timeout: 600000` parameter — correctness resting on a model remembering a parameter,
# which on 2026-08-10 it did not. Three weeks of finished Pro reports were stranded in the
# ChatGPT account. These rows fail if anyone moves the fetch back inside a model prompt.
WU="$(cat "$PROJ/scripts/weekly-update.sh")"
# The wrapper itself must invoke the fetcher directly from bash.
has "wrapper calls gptpro-fetch.sh directly from bash" \
    "$(printf '%s\n' "$WU" | grep -E '^[[:space:]]*bash "\$PROJ/scripts/gptpro-fetch.sh"' || true)" \
    "gptpro-fetch.sh"
# No prompt handed to a model may instruct it to run the fetcher or to wait on it. Prompts are
# the PHASE_A=/PHASE_C= heredoc-ish assignments; the check is deliberately blunt — any mention of
# the fetcher or of a Bash-tool timeout inside a phase prompt is the regression.
PROMPT_TEXT="$(printf '%s\n' "$WU" | awk '/^PHASE_[AC]="/,/^"$|"$/' )"
hasnt "no phase prompt tells the model to run the fetcher" "$PROMPT_TEXT" "gptpro-fetch.sh --scope-file"
hasnt "no phase prompt depends on the Bash tool timeout parameter" "$PROMPT_TEXT" "600000"
has   "phase C is told the fetch already ran and not to poll" "$PROMPT_TEXT" "ALREADY RUN"
# A wall-clock budget must bound the whole run, so a slow Pro fetch cannot starve the failure DM.
has "wrapper self-limits under the cron timeout" "$WU" "IM_WEEKLY_BUDGET_SECONDS"

echo
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
