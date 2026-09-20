#!/usr/bin/env bash
# Regression test for the GPT-Pro→council fallback confinement (bq-058, d-ultra-audit §4b.3).
#
# Two properties, both measured here:
#   1. The fallback is gated on the fetcher's DISCRIMINATING exit codes, not on any-nonzero.
#      The pre-2026-08-04 behaviour is included as the control.
#   2. When the fallback does fire, daily-sweep.sh invokes codex_council.py with a read-only
#      sandbox, and codex_council.py turns that into real `codex exec` flags.
#
# Run: bash research/inference-margins/tests/test-pro-fallback-policy.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$(dirname "$HERE")"
WS="$(cd "$PROJ/../.." && pwd)"
. "$PROJ/scripts/lib/pro-fallback-policy.sh"

PASS=0; FAIL=0
ok() { echo "PASS  $1"; PASS=$((PASS+1)); }
no() { echo "FAIL  $1 ${2:+— $2}"; FAIL=$((FAIL+1)); }
eq() { [[ "$2" == "$3" ]] && ok "$1" || no "$1" "expected '$3', got '$2'"; }

echo "=== 1. exit-code contract → decision ==="
eq "rc=0  → filed (report landed)"                    "$(pro_fallback_decision 0)"   filed
eq "rc=2  → pending (resumable; NO privileged escalation)" "$(pro_fallback_decision 2)"   pending
eq "rc=3  → fallback (send failed, nothing dispatched)" "$(pro_fallback_decision 3)"   fallback
eq "rc=4  → fallback (fetcher's contract says so)"     "$(pro_fallback_decision 4)"   fallback
for rc in 1 5 124 137 255; do
  eq "rc=$rc → unclassified (NOT escalated)"           "$(pro_fallback_decision $rc)" unclassified
done

echo
echo "=== 2. the control: what the old any-nonzero gate did with the same codes ==="
OLD_ESCALATED=(); NEW_ESCALATED=()
for rc in 0 1 2 3 4 5 124 137 255; do
  [[ $rc -ne 0 ]] && OLD_ESCALATED+=("$rc")
  [[ "$(pro_fallback_decision $rc)" == "fallback" ]] && NEW_ESCALATED+=("$rc")
done
eq "BEFORE: every nonzero code reached the unsandboxed council" "${OLD_ESCALATED[*]}" "1 2 3 4 5 124 137 255"
eq "AFTER:  only the two 'no answer is coming' codes do"         "${NEW_ESCALATED[*]}" "3 4"

echo
echo "=== 3. a network blip specifically ==="
# A blip surfaces as a timeout (124), a killed child (137), or an unhandled `set -e` trip (1)
# in the fetcher, or as a still-pending run (2) when the poll budget expires mid-outage.
for rc in 1 2 124 137; do
  d="$(pro_fallback_decision $rc)"
  [[ "$d" != "fallback" ]] && ok "blip rc=$rc does not launch a more privileged process (→ $d)" \
                           || no "blip rc=$rc escalated"
done

echo
echo "=== 4. when the fallback DOES fire, it is confined ==="
grep -q -- '--sandbox read-only' "$PROJ/scripts/daily-sweep.sh"
[[ $? -eq 0 ]] && ok "daily-sweep.sh passes --sandbox read-only to codex_council.py" \
               || no "daily-sweep.sh still calls the council unconfined"
# grep the CODE, not the comment that explains what was removed
! grep -v '^[[:space:]]*#' "$PROJ/scripts/daily-sweep.sh" | grep -q -- '--dangerously-bypass-approvals-and-sandbox'
[[ $? -eq 0 ]] && ok "no bypass flag on any executable line of daily-sweep.sh" || no "bypass flag still executed"

ARGS=$(cd "$WS/tools/codex-council" && python3 -c "
import importlib.util
s = importlib.util.spec_from_file_location('cc', 'codex_council.py')
m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
print(' '.join(m.codex_sandbox_args('read-only')))")
eq "codex_council.py --sandbox read-only → real codex flags" \
   "$ARGS" '--sandbox read-only -c approval_policy="never"'
DEFAULT_MODE=$(cd "$WS/tools/codex-council" && python3 -c "
import importlib.util
s = importlib.util.spec_from_file_location('cc', 'codex_council.py')
m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
print(m.SANDBOX_MODE)")
# UPDATED 2026-08-10 (R7 item 1, owner ruling q-a3rc-sandbox-owner-grants=A).
# This assertion used to require the default stay 'bypass' "so existing council callers are
# unchanged". The owner reversed that: leaving the full grant as the default made SAFE the
# opt-in, so every caller that merely forgot the flag got --dangerously-bypass silently.
# The safe posture is now the default and 'bypass' must be written at the call site.
eq "default is 'read-only' — bypass must be explicit at the call site" "$DEFAULT_MODE" read-only

echo
echo "=== 5. gpt_max no longer sets a persistent global ==="
# the WRITE form is 3-arg (`hcom config <key> <value>`); a 2-arg read is fine and is what
# the new code does to WARN about residue left by the old one.
! grep -q '"codex_sandbox_mode", *"danger-full-access"' "$WS/tools/gpt-max/gpt_max.py"
[[ $? -eq 0 ]] && ok "gpt_max.py no longer WRITES codex_sandbox_mode into ~/.hcom/config.toml" \
               || no "gpt_max.py still writes the global"
grep -q 'os.environ\["HCOM_CODEX_SANDBOX_MODE"\]' "$WS/tools/gpt-max/gpt_max.py"
[[ $? -eq 0 ]] && ok "gpt_max.py scopes the mode to the run's environment instead" || no "no env scoping found"
if grep -q 'sandbox_mode' "$HOME/.hcom/config.toml" 2>/dev/null; then
  no "~/.hcom/config.toml still pins a global sandbox_mode" "$(grep sandbox_mode "$HOME/.hcom/config.toml")"
else
  ok "~/.hcom/config.toml carries no global sandbox_mode (residue cleared)"
fi

echo
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
