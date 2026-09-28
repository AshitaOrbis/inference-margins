#!/usr/bin/env bash
# test-daily-sweep-grok-failure.sh — bq-3687 W2: a failed Grok collection must not read as success.
#
# Until 2026-09-28 daily-sweep.sh logged 'GROK SWEEP FAILED', deleted the Grok output, advanced
# scripts/sweep-state/last-sweep-date anyway and exited 0 — so the cron-run ledger and the liveness row
# read ok while the Grok windows of 09-20, 09-21, 09-22, 09-26 and 09-27 were skipped for good.
#
# Each case runs the WHOLE script (DS_SCRIPT, default the live one) in a scratch git repo on master with a
# scratch HOME: grok-iso.sh, discord-dm.sh, curl and claude are stubs, the account router is absent. Nothing
# leaves the machine and nothing outside the scratch dir is written.
#   T1 failing grok (rc 1)             -> exit 5, cursor held, output kept (diagnostic text intact), log names it
#   T2 timed-out grok (rc 124)         -> exit 5, cursor held, log says timeout
#   T3 successful grok                 -> exit 0, cursor advanced to today           (guard: unchanged behaviour)
#   T4 grok refused by isolation (4)   -> exit 4, cursor held                        (guard: unchanged behaviour)
#   T5 failing grok + a price change   -> the classifier still runs, then exit 5, cursor held
#   T6 failing grok, cursor 30 days old -> cursor preserved, Grok asked since that date (no forfeiture)
# Prints 'PASS <case>' or 'FAIL <case>: <why>' per case; exits 1 if any case fails.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ_REAL="${DS_PROJ:-$(cd "$HERE/.." && pwd)}"
DS_SCRIPT="${DS_SCRIPT:-$PROJ_REAL/scripts/daily-sweep.sh}"
TODAY="$(date +%F)"
SEED="$(date -d '3 days ago' +%F)"   # a recent cursor; T6 seeds an old one
FAILS=0
# Repo overrides would redirect the fixture git commands (and the job's commit helper) elsewhere (review r2).
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE IM_COMMIT_REPO IM_REPO_LOCK_HELD
ROOT="$(mktemp -d)"
trap 'rm -rf -- "$ROOT"' EXIT

setup() { # $1 case dir -> builds repo/, fakehome/, shim/
  local c="$1"
  mkdir -p "$c/repo/scripts/lib" "$c/repo/scripts/sweep-state" "$c/repo/research" \
           "$c/fakehome/claudeworkspace/scripts" "$c/fakehome/claudeworkspace/discord" "$c/shim"
  cp "$DS_SCRIPT" "$c/repo/scripts/daily-sweep.sh"
  cp "$PROJ_REAL"/scripts/lib/*.sh "$c/repo/scripts/lib/"
  printf '%s' "$SEED" > "$c/repo/scripts/sweep-state/last-sweep-date"
  printf '# queue\n' > "$c/repo/research/update-queue.md"
  printf 'scripts/sweep-state/\nlogs/\n' > "$c/repo/.gitignore"
  git -C "$c/repo" init -q -b master
  git -C "$c/repo" config user.email t@example.invalid
  git -C "$c/repo" config user.name test
  git -C "$c/repo" add -A . && git -C "$c/repo" commit -qm init
  cat > "$c/fakehome/claudeworkspace/scripts/grok-iso.sh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$HOME/grok-args"
case "${GROK_STUB_MODE:?}" in
  ok)      echo "1. 2026-09-27 https://example.invalid/x — \$1.23/Mtok — test item"; exit 0 ;;
  fail)    echo "GROKSTUB-PARTIAL-7f3a partial answer"; echo "GROKSTUB-DIAG-7f3a: upstream 503" >&2; exit 1 ;;
  timeout) echo "GROKSTUB-PARTIAL-9c1e still searching"; exit 124 ;;
  refuse)  echo "grok-iso: GROKSTUB refused (not isolated)" >&2; exit 4 ;;
esac
STUB
  printf '#!/usr/bin/env bash\necho "$*" >> "%s/dm.log"\n' "$c" > "$c/fakehome/claudeworkspace/discord/discord-dm.sh"
  # curl: empty output (every page FETCH FAILED, no candidate) unless CURL_STUB_PRICES is set.
  printf '#!/usr/bin/env bash\n[ -n "${CURL_STUB_PRICES:-}" ] && echo "price \\$9.99 and \\$1.50"\nexit 0\n' > "$c/shim/curl"
  printf '#!/usr/bin/env bash\necho called >> "%s/claude-stub.calls"\necho "{\\"items\\":[{\\"summary\\":\\"stub\\",\\"verdict\\":\\"NOISE\\",\\"reason\\":\\"stub-reason-4d2e\\"}]}"\n' "$c" > "$c/shim/claude"
  chmod +x "$c/fakehome/claudeworkspace/scripts/grok-iso.sh" "$c/fakehome/claudeworkspace/discord/discord-dm.sh" "$c/shim/curl" "$c/shim/claude"
}

run_case() { # $1 case name  $2 grok mode  [$3 prices]  [$4 seed]  -> sets RC, C
  C="$ROOT/$1"; setup "$C"
  if [ -n "${4:-}" ]; then printf '%s' "$4" > "$C/repo/scripts/sweep-state/last-sweep-date"; fi
  if [ -n "${3:-}" ]; then printf 'seeded-old-hash' > "$C/repo/scripts/sweep-state/anthropic.sha256"; fi
  mkdir -p "$C/tmp"
  env -u IM_COMMIT_REPO -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE -u IM_REPO_LOCK_HELD \
      TMPDIR="$C/tmp" HOME="$C/fakehome" PATH="$C/shim:$PATH" GROK_STUB_MODE="$2" CURL_STUB_PRICES="${3:-}" \
      IM_PICK_ACCOUNT="$C/no-router" timeout 120 bash "$C/repo/scripts/daily-sweep.sh" > "$C/run.out" 2>&1
  RC=$?
  LOGF="$C/repo/logs/sweeps/$TODAY.md"
  CURSOR="$(cat "$C/repo/scripts/sweep-state/last-sweep-date" 2>/dev/null || echo MISSING)"
}

bad() { echo "FAIL $1: $2"; FAILS=$((FAILS + 1)); }

kept_file() { # the one kept grok output for this case, or empty
  find "$C/repo/logs/sweeps/grok-failures" -maxdepth 1 -type f -name "$TODAY-*-rc$1.out" 2>/dev/null | head -1
}

check_failed() { # $1 case  $2 grok rc  $3 marker that must survive in the kept output
  local name="$1" why="" kept
  [ "$RC" = 5 ] || why="exit $RC, want 5"
  [ -z "$why" ] && [ "$CURSOR" != "$SEED" ] && why="cursor advanced to $CURSOR (want held at $SEED)"
  [ -z "$why" ] && ! grep -q "GROK SWEEP FAILED (rc $2" "$LOGF" 2>/dev/null && why="log lacks 'GROK SWEEP FAILED (rc $2'"
  kept="$(kept_file "$2")"
  [ -z "$why" ] && [ -z "$kept" ] && why="no kept grok output under logs/sweeps/grok-failures/"
  [ -z "$why" ] && ! grep -q "$3" "$kept" && why="kept output lost the diagnostic marker $3"
  [ -z "$why" ] && ! grep -qF "output kept at logs/sweeps/grok-failures/$(basename "$kept")" "$LOGF" && why="log does not name the kept file"
  [ -z "$why" ] && ! grep -q "held at $SEED" "$LOGF" && why="log does not say the cursor is held"
  [ -z "$why" ] && ! grep -q "own-output commit (end of run)" "$LOGF" && why="run did not complete (no end-of-run line)"
  if [ -n "$why" ]; then bad "$name" "$why"; return 1; fi
  return 0
}

run_case T1-failing-grok fail
check_failed T1-failing-grok 1 GROKSTUB-DIAG-7f3a && echo "PASS T1-failing-grok"

run_case T2-timeout-grok timeout
if check_failed T2-timeout-grok 124 GROKSTUB-PARTIAL-9c1e; then
  if grep -qE "timeout after [0-9]+s" "$LOGF"; then echo "PASS T2-timeout-grok"; else bad T2-timeout-grok "log does not name the timeout"; fi
fi

run_case T3-successful-grok ok
if [ "$RC" != 0 ]; then bad T3-successful-grok "exit $RC, want 0"
elif [ "$CURSOR" != "$TODAY" ]; then bad T3-successful-grok "cursor $CURSOR, want $TODAY"
elif grep -q "GROK SWEEP FAILED" "$LOGF"; then bad T3-successful-grok "log says FAILED on a success"
elif ! grep -q "GROKSTUB\|example.invalid" "$LOGF"; then bad T3-successful-grok "grok answer not in the log"
else echo "PASS T3-successful-grok"; fi

run_case T4-refused-grok refuse
if [ "$RC" != 4 ]; then bad T4-refused-grok "exit $RC, want 4"
elif [ "$CURSOR" != "$SEED" ]; then bad T4-refused-grok "cursor $CURSOR, want held at $SEED"
elif ! grep -q "GROK SWEEP REFUSED" "$LOGF"; then bad T4-refused-grok "log lacks GROK SWEEP REFUSED"
else echo "PASS T4-refused-grok"; fi

run_case T5-failing-grok-with-candidates fail prices
if check_failed T5-failing-grok-with-candidates 1 GROKSTUB-DIAG-7f3a; then
  if [ -s "$C/claude-stub.calls" ] && grep -q "stub-reason-4d2e" "$LOGF" && grep -q "PRICE-SET CHANGED" "$LOGF"; then echo "PASS T5-failing-grok-with-candidates"
  else bad T5-failing-grok-with-candidates "the classifier did not run on the price candidate"; fi
fi

OLD="$(date -d '30 days ago' +%F)"
run_case T6-old-cursor-preserved fail "" "$OLD"
if [ "$RC" != 5 ]; then bad T6-old-cursor-preserved "exit $RC, want 5"
elif [ "$CURSOR" != "$OLD" ]; then bad T6-old-cursor-preserved "cursor $CURSOR, want preserved at $OLD"
elif ! grep -q "SINCE $OLD " "$C/fakehome/grok-args"; then bad T6-old-cursor-preserved "Grok was not asked for SINCE $OLD"
else echo "PASS T6-old-cursor-preserved"; fi

run_case T7-missing-cursor fail
rm -f "$C/repo/scripts/sweep-state/last-sweep-date"
env -u IM_COMMIT_REPO TMPDIR="$C/tmp" HOME="$C/fakehome" PATH="$C/shim:$PATH" GROK_STUB_MODE=fail CURL_STUB_PRICES= \
    IM_PICK_ACCOUNT="$C/no-router" timeout 120 bash "$C/repo/scripts/daily-sweep.sh" > "$C/run.out" 2>&1; RC=$?
CURSOR="$(cat "$C/repo/scripts/sweep-state/last-sweep-date" 2>/dev/null || echo MISSING)"
TWO="$(date -d '2 days ago' +%F)"
if [ "$RC" != 5 ]; then bad T7-missing-cursor "exit $RC, want 5"
elif [ "$CURSOR" != "$TWO" ]; then bad T7-missing-cursor "cursor $CURSOR, want the persisted seed $TWO"
elif ! grep -q "SINCE $TWO " "$C/fakehome/grok-args"; then bad T7-missing-cursor "Grok was not asked for SINCE $TWO"
else echo "PASS T7-missing-cursor"; fi

[ "$FAILS" -eq 0 ] || { echo "$FAILS case(s) failed"; exit 1; }
echo "all cases passed"
