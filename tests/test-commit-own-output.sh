#!/usr/bin/env bash
# Regression test for scripts/lib/commit-own-output.sh (bq-1872): a pipeline job commits the tracked
# files it writes, and ONLY those.
#
# What is measured, each against a throwaway repository — never this one:
#   1. loose own-output becomes one labelled commit holding exactly the own-output paths
#   2. a dirty file OUTSIDE the pathspecs is left dirty and out of the commit
#   3. content another leg STAGED outside the pathspecs stays staged and out of the commit
#      (the control is `git add -A && git commit`, the move that folded 18 sweep files into release
#      stamp 854b13d — it must carry the foreign file, or this test is not measuring anything)
#   4. a clean tree is a no-op (rc 0, HEAD unmoved)
#   5. refusals touch nothing: wrong branch, merge in progress, repo lock held elsewhere
#   6. a failing commit (hook refuses) returns 11 and leaves the index as it was found
#   7. the identity on the commit is the pinned one, whatever the ambient config says
#   8. the EXIT-trap shape daily-sweep.sh uses commits on a normal exit, on a `set -e` death and on
#      SIGTERM (the signal scripts/cron-run.sh sends at the wall-clock timeout)
#   9. a pathspec with nothing tracked under it, or nothing on disk, does not take the commit down
#  10. a refused commit puts back the exact staged BYTES (partial staging, a staged new file and a
#      staged deletion), not the working tree's — Astra review of record 2026-09-20, P1-1
#  11. an unmerged path under the pathspecs is refused and left as found
#  12. a rename is committed as deletion + addition, and a staged `git mv` survives a refused commit
#  13. intent-to-add / skip-worktree / assume-unchanged entries under the pathspecs are refused, untouched
#  14. a detached `git gc --auto` does not keep the caller's repo lock after the job exits
#  15. an option given without its value is a usage error (rc 64), not an endless loop
#  16. an attempt a SIGTERM interrupts between `git add` and the commit is undone by the EXIT-trap retry:
#      a refused retry puts back what the interrupted attempt FOUND staged (a leg's A, not B), and an
#      interrupted attempt whose commit had already landed is not undone — Astra review of record
#      2026-09-22, P1-2
#  17. dc-map/engine/tick.sh's engine-lock guard around this helper never takes an OPEN fd for a HELD lock:
#      the trap retry re-acquires on the reused fd, so a hand run holding .engine.lock still makes it skip —
#      Astra review of record 2026-09-22, P1-1 (IM_TICK_UNDER_TEST points it at another tick.sh copy)
#
# Run: bash research/inference-margins/tests/test-commit-own-output.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ="$(dirname "$HERE")"
LIB="${IM_COMMIT_LIB:-$PROJ/scripts/lib/commit-own-output.sh}"
TICK="${IM_TICK_UNDER_TEST:-$PROJ/dc-map/engine/tick.sh}"
. "$LIB"

PASS=0; FAIL=0
ok() { echo "PASS  $1"; PASS=$((PASS+1)); }
no() { echo "FAIL  $1 ${2:+— $2}"; FAIL=$((FAIL+1)); }
eq() { [[ "$2" == "$3" ]] && ok "$1" || no "$1" "expected '$3', got '$2'"; }

SCRATCH="$(mktemp -d -t im-commit-own-XXXXXX)"
trap 'rm -rf "$SCRATCH"' EXIT

fresh_repo() { # $1 = name → echoes path; master branch, one commit, the real directory shape
  local r="$SCRATCH/$1"
  mkdir -p "$r/research/gptpro-reports" "$r/site" "$r/dc-map/ledger"
  git -C "$r" init -q -b master
  git -C "$r" config user.name  "Ambient Wrong Name"
  git -C "$r" config user.email "ambient-wrong@example.invalid"
  echo "queue v1"  > "$r/research/update-queue.md"
  echo "report v1" > "$r/research/gptpro-reports/2026-01-01-daily-material.md"
  echo "<html>v1"  > "$r/site/index.html"
  echo "index v1"  > "$r/dc-map/ledger/INDEX.md"
  git -C "$r" add -A && git -C "$r" commit -q -m "seed"
  echo "$r"
}
OWN=(research/update-queue.md research/gptpro-reports)

echo "=== 1-3. path scope: own output in, everything else out ==="
R="$(fresh_repo scope)"
echo "queue v2" >> "$R/research/update-queue.md"                          # own, modified
echo "new report" > "$R/research/gptpro-reports/2026-01-02-daily-material.md"  # own, untracked
echo "<html>WIP" > "$R/site/index.html"                                   # foreign, unstaged
echo "index WIP" > "$R/dc-map/ledger/INDEX.md"; git -C "$R" add dc-map/ledger/INDEX.md   # foreign, STAGED
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "sweep output" -- "${OWN[@]}"; rc=$?
eq "rc 0 on a successful own-output commit" "$rc" 0
eq "the commit holds exactly the two own-output paths" \
   "$(git -C "$R" show --name-only --format= HEAD | LC_ALL=C sort | tr '\n' ' ')" \
   "research/gptpro-reports/2026-01-02-daily-material.md research/update-queue.md "
eq "foreign unstaged edit is still dirty"  "$(git -C "$R" status --porcelain -- site)" " M site/index.html"
eq "foreign STAGED edit is still staged, not committed" "$(git -C "$R" status --porcelain -- dc-map)" "M  dc-map/ledger/INDEX.md"
eq "IM_COMMIT_SHA names HEAD" "$IM_COMMIT_SHA" "$(git -C "$R" rev-parse --short HEAD)"
git -C "$R" log -1 --format=%B | grep -q 'Pipeline output, not a release' &&
  ok "message labels itself as pipeline output" || no "message does not label itself"

echo "--- control: the unscoped move this helper replaces MUST carry the foreign file"
C="$(fresh_repo control)"
echo "queue v2" >> "$C/research/update-queue.md"; echo "<html>WIP" > "$C/site/index.html"
git -C "$C" add -A && git -C "$C" commit -q -m "unscoped"
git -C "$C" show --name-only --format= HEAD | grep -q '^site/index.html$' &&
  ok "control: \`git add -A\` does fold site/index.html into the commit (the defect is reproducible)" ||
  no "control did not reproduce the defect — the scope assertions above prove nothing"

echo "=== 4. clean tree is a no-op ==="
R="$(fresh_repo clean)"; before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 0 when nothing is loose" "$rc" 0
eq "HEAD did not move" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "no SHA is claimed for a commit that was not made" "$IM_COMMIT_SHA" ""

echo "=== 5. refusals touch nothing ==="
R="$(fresh_repo branch)"; git -C "$R" checkout -q -b v2.2-worktree
echo "queue v2" >> "$R/research/update-queue.md"; before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 10 off master" "$rc" 10
eq "off master: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "off master: nothing staged" "$(git -C "$R" diff --cached --name-only)" ""

R="$(fresh_repo merging)"; echo "queue v2" >> "$R/research/update-queue.md"
git -C "$R" rev-parse HEAD > "$R/.git/MERGE_HEAD"; before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 10 with a merge in progress" "$rc" 10
eq "merge in progress: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"

R="$(fresh_repo locked)"; echo "queue v2" >> "$R/research/update-queue.md"; before="$(git -C "$R" rev-parse HEAD)"
( exec 9>"$R/.git/im-repo.lock"; flock 9; sleep 6 ) & HOLDER=$!
sleep 0.5
IM_COMMIT_REPO="$R" im_commit_own_output --take-lock 1 --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 10 when another job holds the repo lock" "$rc" 10
eq "lock busy: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "lock busy: nothing staged" "$(git -C "$R" diff --cached --name-only)" ""
kill "$HOLDER" 2>/dev/null; wait "$HOLDER" 2>/dev/null
IM_COMMIT_REPO="$R" im_commit_own_output --take-lock 1 --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 0 once the lock is free (the next run picks the output up)" "$rc" 0

echo "=== 6. a refused commit returns 11 and restores the index ==="
R="$(fresh_repo hook)"; echo "queue v2" >> "$R/research/update-queue.md"
echo "report v2" >> "$R/research/gptpro-reports/2026-01-01-daily-material.md"
git -C "$R" add research/gptpro-reports/2026-01-01-daily-material.md      # a leg's deliberate stage
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 11 when git refuses the commit" "$rc" 11
eq "refused: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "refused: what THIS call staged is unstaged again, what was staged before is still staged" \
   "$(git -C "$R" status --porcelain | LC_ALL=C sort | tr '\n' '|')" \
   " M research/update-queue.md|M  research/gptpro-reports/2026-01-01-daily-material.md|"

echo "=== 7. identity is pinned, not ambient ==="
R="$(fresh_repo ident)"; echo "queue v2" >> "$R/research/update-queue.md"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}" >/dev/null
# The expected identity is read from deploy.sh's release-stamp commit line, the pin this lib promises
# to match ("pinned exactly as deploy.sh:99 pins it"), rather than written here: tests/ is on the
# public-repo allow-list and its deny-grep refuses a personal email in the shipped tree (2026-09-23).
PINNED_EMAIL="$(sed -n 's/.*git -c user.name="Ashita Orbis" -c user.email="\([^"]*\)" commit -q -m "release stamp.*/\1/p' "$PROJ/deploy.sh" | head -1)"
[ -n "$PINNED_EMAIL" ] || { echo "FAIL could not read the pinned identity from deploy.sh"; exit 1; }
eq "author email"    "$(git -C "$R" log -1 --format=%ae)" "$PINNED_EMAIL"
eq "committer email" "$(git -C "$R" log -1 --format=%ce)" "$PINNED_EMAIL"

echo "=== 8. the EXIT-trap shape commits on exit, on set -e death, and on SIGTERM ==="
trap_job() { # $1 repo  $2 mode  — the same trap shape daily-sweep.sh installs
  cat > "$SCRATCH/job.sh" <<JOB
set -euo pipefail
. "$LIB"
finish() { local rc=\$?; set +e
  IM_COMMIT_REPO="$1" im_commit_own_output --label test --message "trap commit" -- ${OWN[*]}
  exit "\$rc"; }
trap finish EXIT
echo "written by the job" >> "$1/research/update-queue.md"
case "$2" in
  normal) exit 0 ;;
  errexit) false ;;
  sigterm) sleep 30 ;;
esac
JOB
}
for mode in normal errexit; do
  R="$(fresh_repo trap-$mode)"; trap_job "$R" "$mode"
  bash "$SCRATCH/job.sh" >/dev/null 2>&1; jrc=$?
  eq "$mode: own output committed by the trap" "$(git -C "$R" status --porcelain)" ""
  [[ "$mode" == normal ]] && eq "normal: job exit code preserved" "$jrc" 0 || eq "errexit: job exit code preserved" "$jrc" 1
done
R="$(fresh_repo trap-sigterm)"; trap_job "$R" sigterm
timeout --signal=TERM --kill-after=20 2 bash "$SCRATCH/job.sh" >/dev/null 2>&1; jrc=$?
eq "sigterm: own output committed before the process went away" "$(git -C "$R" status --porcelain)" ""
eq "sigterm: reported as a timeout (124), not swallowed into success" "$jrc" 124

echo "=== 9. a pathspec with no tracked file under it does not take the commit down ==="
# The bug the end-to-end rehearsal found: `git commit --only -- research/gptpro-reports` is fatal
# when that directory holds nothing git knows about, and the queue row beside it stayed loose.
R="$(fresh_repo emptyspec)"; git -C "$R" rm -q -r research/gptpro-reports; git -C "$R" commit -q -m "no reports tracked"
mkdir -p "$R/research/gptpro-reports"; echo "queue v2" >> "$R/research/update-queue.md"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 0 with one pathspec matching nothing" "$rc" 0
eq "the queue row was committed" "$(git -C "$R" show --name-only --format= HEAD)" "research/update-queue.md"
R="$(fresh_repo missingspec)"; echo "report v2" >> "$R/research/gptpro-reports/2026-01-01-daily-material.md"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- research/never-created.md research/gptpro-reports; rc=$?
eq "rc 0 with one pathspec that exists neither on disk nor in the index" "$rc" 0
eq "the report beside it was committed" "$(git -C "$R" show --name-only --format= HEAD)" "research/gptpro-reports/2026-01-01-daily-material.md"
R="$(fresh_repo weirdname)"; echo "x" > "$R/research/gptpro-reports/odd [name] *.md"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rc 0 for a filename carrying glob characters (literal pathspecs)" "$rc" 0
eq "tree clean afterwards" "$(git -C "$R" status --porcelain)" ""

echo "=== 10. a refused commit restores the index BYTE-EXACT, partial staging included ==="
# Astra review of record, 2026-09-20, P1-1: r1 put the index back by re-running `git add` on the
# NAMES that had been staged, which stages the WORKING-TREE bytes. A leg that staged version A and
# kept editing to B found B staged afterwards. The index entry — mode and object id — is what a
# leg staged, so that is what is snapshotted and put back.
R="$(fresh_repo partial)"
echo "report v1" > "$R/research/gptpro-reports/2026-01-03-other.md"
git -C "$R" add -A && git -C "$R" commit -q -m "second own file"
printf 'A\n' > "$R/research/gptpro-reports/2026-01-01-daily-material.md"
git -C "$R" add research/gptpro-reports/2026-01-01-daily-material.md          # staged A ...
printf 'B\n' > "$R/research/gptpro-reports/2026-01-01-daily-material.md"      # ... then edited to B
printf 'N1\n' > "$R/research/gptpro-reports/new.md"; git -C "$R" add research/gptpro-reports/new.md
printf 'N2\n' > "$R/research/gptpro-reports/new.md"                            # new file, staged N1, now N2
git -C "$R" rm -q --cached research/update-queue.md                            # a staged deletion
echo "loose" >> "$R/research/gptpro-reports/2026-01-03-other.md"               # own, never staged
blobA="$(printf 'A\n' | git -C "$R" hash-object --stdin)"; blobN1="$(printf 'N1\n' | git -C "$R" hash-object --stdin)"
status_before="$(git -C "$R" status --porcelain --untracked-files=all | LC_ALL=C sort | tr '\n' '|')"
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "partial: rc 11 when git refuses the commit" "$rc" 11
eq "partial: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "partial: the staged BLOB is A again, not the working tree's B" \
   "$(git -C "$R" ls-files -s -- research/gptpro-reports/2026-01-01-daily-material.md | awk '{print $2}')" "$blobA"
eq "partial: the working tree still holds B" "$(cat "$R/research/gptpro-reports/2026-01-01-daily-material.md")" "B"
eq "partial: a staged NEW file is staged at N1 again" \
   "$(git -C "$R" ls-files -s -- research/gptpro-reports/new.md | awk '{print $2}')" "$blobN1"
eq "partial: a staged deletion is still a staged deletion" \
   "$(git -C "$R" ls-files -- research/update-queue.md)" ""
eq "partial: git status is exactly what it was before the call" \
   "$(git -C "$R" status --porcelain --untracked-files=all | LC_ALL=C sort | tr '\n' '|')" "$status_before"
case "$IM_COMMIT_NOTE" in *"index restored"*) ok "partial: the note says the index was restored (read back)" ;;
  *) no "partial: the note does not report a read-back restore" "$IM_COMMIT_NOTE" ;; esac

echo "--- on SUCCESS the documented semantics hold: own paths are committed at their working-tree bytes"
rm -f "$R/.git/hooks/pre-commit"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "partial, hook gone: rc 0" "$rc" 0
eq "partial, hook gone: the committed daily-material is the working tree's B" \
   "$(git -C "$R" show HEAD:research/gptpro-reports/2026-01-01-daily-material.md)" "B"
eq "partial, hook gone: own pathspecs read back clean" "$(git -C "$R" status --porcelain -- "${OWN[@]}")" ""

echo "--- 10b. when the restore itself fails, the note says so instead of claiming it"
# A `git` shim that refuses `update-index` stands in for any restore failure. Without this case a
# read-back that always said "restored" would pass every assertion above.
R="$(fresh_repo restorefail)"
printf 'A\n' > "$R/research/update-queue.md"; git -C "$R" add research/update-queue.md
printf 'B\n' > "$R/research/update-queue.md"
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
REALGIT="$(command -v git)"; mkdir -p "$SCRATCH/shim"
printf '#!/bin/sh\nfor a in "$@"; do [ "$a" = update-index ] && exit 1; done\nexec "%s" "$@"\n' "$REALGIT" > "$SCRATCH/shim/git"
chmod +x "$SCRATCH/shim/git"
PATH="$SCRATCH/shim:$PATH" IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
hash -r
eq "restore failed: still rc 11" "$rc" 11
case "$IM_COMMIT_NOTE" in *"index NOT restored"*) ok "restore failed: the note says the index was NOT restored" ;;
  *) no "restore failed: the note claims a restore that did not happen" "$IM_COMMIT_NOTE" ;; esac

echo "=== 11. an unmerged path under the pathspecs is refused, untouched ==="
R="$(fresh_repo unmerged)"
q=research/update-queue.md
b1="$(printf 'base\n' | git -C "$R" hash-object -w --stdin)"; b2="$(printf 'ours\n' | git -C "$R" hash-object -w --stdin)"
b3="$(printf 'theirs\n' | git -C "$R" hash-object -w --stdin)"
zero="$(git -C "$R" rev-parse HEAD | tr '0-9a-f' '0')"
printf '0 %s\t%s\n' "$zero" "$q" | git -C "$R" update-index --index-info
printf '100644 %s 1\t%s\n100644 %s 2\t%s\n100644 %s 3\t%s\n' "$b1" "$q" "$b2" "$q" "$b3" "$q" | git -C "$R" update-index --index-info
echo "report v2" >> "$R/research/gptpro-reports/2026-01-01-daily-material.md"
before="$(git -C "$R" rev-parse HEAD)"; unmerged_before="$(git -C "$R" ls-files -u | wc -l | tr -d ' ')"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "unmerged: rc 10 (a conflict under the pathspecs is someone else's work)" "$rc" 10
eq "unmerged: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "unmerged: all three conflict stages still in the index" "$(git -C "$R" ls-files -u | wc -l | tr -d ' ')" "$unmerged_before"
eq "unmerged: the loose report beside it was not staged either" "$(git -C "$R" diff --cached --name-only -- research/gptpro-reports)" ""

echo "=== 12. a rename is a deletion plus an addition, on commit and on restore ==="
# r2 pre-review (2026-09-22): with git's default rename detection `diff --cached --name-only` lists a
# moved file under its NEW path only — the commit left the deletion staged behind it (and blamed a
# racing writer, rc 12), and a rollback lost a staged `git mv`'s deletion while reporting an exact restore.
R="$(fresh_repo rename)"
# Enough content that git's rename detection (50% similarity) pairs the two paths after the edit —
# with a one-line file it does not, and this case would pass on the defect it exists to catch.
seq 1 40 | sed 's/^/material line /' > "$R/research/gptpro-reports/2026-01-01-daily-material.md"
git -C "$R" commit -qam "grow the report"
mv "$R/research/gptpro-reports/2026-01-01-daily-material.md" "$R/research/gptpro-reports/archived-2026-01-01.md"
echo "moved and edited" >> "$R/research/gptpro-reports/archived-2026-01-01.md"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "rename: rc 0 (no phantom racing writer)" "$rc" 0
eq "rename: the commit carries the deletion AND the addition" \
   "$(git -C "$R" show --no-renames --name-status --format= HEAD | LC_ALL=C sort | tr '\t\n' ' |')" \
   "A research/gptpro-reports/archived-2026-01-01.md|D research/gptpro-reports/2026-01-01-daily-material.md|"
eq "rename: nothing left staged or loose" "$(git -C "$R" status --porcelain)" ""
R="$(fresh_repo mvrestore)"
git -C "$R" mv research/gptpro-reports/2026-01-01-daily-material.md research/gptpro-reports/moved.md
status_before="$(git -C "$R" status --porcelain --no-renames --untracked-files=all | LC_ALL=C sort | tr '\n' '|')"
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "staged git mv, refused commit: rc 11" "$rc" 11
eq "staged git mv, refused commit: the staged deletion AND addition are both back" \
   "$(git -C "$R" status --porcelain --no-renames --untracked-files=all | LC_ALL=C sort | tr '\n' '|')" "$status_before"
eq "staged git mv, refused commit: the old path is not back in the index" \
   "$(git -C "$R" ls-files -- research/gptpro-reports/2026-01-01-daily-material.md)" ""

echo "=== 13. index flags a restore could not carry are refused, untouched ==="
R="$(fresh_repo ita)"; echo "new" > "$R/research/gptpro-reports/ita.md"; git -C "$R" add -N research/gptpro-reports/ita.md
echo "queue v2" >> "$R/research/update-queue.md"; before="$(git -C "$R" rev-parse HEAD)"
IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
eq "intent-to-add: rc 10" "$rc" 10
eq "intent-to-add: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "intent-to-add: the entry is still intent-to-add" "$(git -C "$R" status --porcelain -- research/gptpro-reports/ita.md)" " A research/gptpro-reports/ita.md"
for flag in skip-worktree assume-unchanged; do
  R="$(fresh_repo "$flag")"; git -C "$R" update-index "--$flag" research/update-queue.md
  echo "report v2" >> "$R/research/gptpro-reports/2026-01-01-daily-material.md"; before="$(git -C "$R" rev-parse HEAD)"
  IM_COMMIT_REPO="$R" im_commit_own_output --label test --message "x" -- "${OWN[@]}"; rc=$?
  eq "$flag: rc 10" "$rc" 10
  eq "$flag: HEAD unmoved and the bit still set" "$(git -C "$R" rev-parse HEAD) $(git -C "$R" ls-files -v -- research/update-queue.md | cut -c1)" \
     "$before $([[ $flag == skip-worktree ]] && echo S || echo h)"
done

echo "=== 14. a detached auto-gc does not carry the caller's repo lock past the job ==="
# r2 pre-review: `git commit` can start `git gc --auto`, which detaches by default and inherits the
# caller's fds — the im-repo.lock fd included — so the lock stayed held after the job had exited.
R="$(fresh_repo autogc)"; git -C "$R" config gc.auto 50; git -C "$R" config gc.autoDetach true
for i in $(seq 1 2500); do echo "blob $i"; done | while read -r l; do echo "$l" | git -C "$R" hash-object -w --stdin >/dev/null; done
echo "queue v2" >> "$R/research/update-queue.md"
bash -c "exec 200>'$R/.git/im-repo.lock'; flock 200; . '$LIB'; IM_COMMIT_REPO='$R' im_commit_own_output --label test --message x -- ${OWN[*]} >/dev/null"
( exec 9>"$R/.git/im-repo.lock"; flock -n 9 ) && ok "auto-gc: the repo lock is free the moment the job exits" \
                                             || no "auto-gc: a detached gc still holds the job's repo lock"
sleep 2

echo "=== 15. an option with no value is a usage error, not a hang ==="
for opt in --label --message --branch --take-lock; do
  out="$(timeout 5 bash -c ". '$LIB'; im_commit_own_output $opt; echo \"rc=\$? \$IM_COMMIT_NOTE\"" 2>&1)"; trc=$?
  [[ $trc -ne 124 && $out == "rc=64 usage: $opt needs a value" ]] && ok "$opt with no value → rc 64" || no "$opt with no value" "timeout rc=$trc out='$out'"
done

echo "=== 16. a retry after an interrupted attempt starts from what that attempt FOUND ==="
# r2.1 (Astra review of record 2026-09-22, P1-2). A SIGTERM lands after the helper's `git add -A` and
# before its commit or rollback; the job's EXIT trap calls the helper again. r2's retry snapshotted the
# index as the interrupted attempt had left it — B staged — so a refused retry "restored" B. The shim
# SIGTERMs the job the first time the helper runs `git commit`: in 16a it does so INSTEAD of committing,
# in 16b right AFTER a real commit landed (hook bypassed for that one), with a writer changing the file to C
# before the retry, whose own commit the hook then refuses.
kill_job() { # $1 repo  $2 mode (before|after) → runs the two-call trap job; echoes the retry's rc+note
  local r="$1" mode="$2" shim="$SCRATCH/killshim-$2" mark="$SCRATCH/killmark-$2"
  mkdir -p "$shim"; rm -f "$mark"
  cat > "$shim/git" <<SHIM
#!/bin/sh
for a in "\$@"; do
  if [ "\$a" = commit ] && [ ! -e "$mark" ]; then
    : > "$mark"
    if [ "$mode" = after ]; then "$REALGIT" "\$@" --no-verify; rc=\$?; printf 'C\\n' > "\$IM_TEST_AFTER_FILE"; else rc=1; fi
    kill -TERM "\$IM_TEST_JOB_PID"; exit \$rc
  fi
done
exec "$REALGIT" "\$@"
SHIM
  chmod +x "$shim/git"
  cat > "$SCRATCH/job16.sh" <<JOB
set -euo pipefail
. "$LIB"
export IM_TEST_JOB_PID=\$\$
finish() { local rc=\$?; set +e
  IM_COMMIT_REPO="$r" im_commit_own_output --label test --message "retry from the EXIT trap" -- ${OWN[*]}
  printf '%s\t%s\n' "\$?" "\$IM_COMMIT_NOTE" > "$SCRATCH/job16.out"
  exit "\$rc"; }
trap finish EXIT
IM_COMMIT_REPO="$r" im_commit_own_output --label test --message "first attempt" -- ${OWN[*]}
JOB
  rm -f "$SCRATCH/job16.out"
  PATH="$shim:$PATH" timeout 60 bash "$SCRATCH/job16.sh" >/dev/null 2>&1
  cat "$SCRATCH/job16.out" 2>/dev/null
}
R="$(fresh_repo interrupted)"
printf 'A\n' > "$R/research/gptpro-reports/2026-01-01-daily-material.md"
git -C "$R" add research/gptpro-reports/2026-01-01-daily-material.md             # a leg staged A ...
printf 'B\n' > "$R/research/gptpro-reports/2026-01-01-daily-material.md"         # ... and kept editing to B
echo "queue v2" >> "$R/research/update-queue.md"                                 # own output, never staged
blobA="$(printf 'A\n' | git -C "$R" hash-object --stdin)"
status_before="$(git -C "$R" status --porcelain --untracked-files=all | LC_ALL=C sort | tr '\n' '|')"
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
before="$(git -C "$R" rev-parse HEAD)"
out="$(kill_job "$R" before)"; rrc="${out%%$'\t'*}"; note="${out#*$'\t'}"
[[ -e "$SCRATCH/killmark-before" ]] && ok "16a: the shim interrupted the first attempt at its commit" || no "16a: the interruption never happened — nothing below is measured"
eq "16a: the refused retry returns 11" "$rrc" 11
eq "16a: HEAD unmoved" "$(git -C "$R" rev-parse HEAD)" "$before"
eq "16a: the staged blob is the leg's A, not the working tree's B" \
   "$(git -C "$R" ls-files -s -- research/gptpro-reports/2026-01-01-daily-material.md | awk '{print $2}')" "$blobA"
eq "16a: git status is exactly what it was before the job" \
   "$(git -C "$R" status --porcelain --untracked-files=all | LC_ALL=C sort | tr '\n' '|')" "$status_before"
case "$note" in "undid an interrupted earlier attempt (index restored"*"index restored to exactly what was staged before (read back)"*)
  ok "16a: the note reports the undo and the read-back restore" ;; *) no "16a: note" "$note" ;; esac

R="$(fresh_repo interrupted-after)"
F16="$R/research/gptpro-reports/2026-01-01-daily-material.md"
printf 'A\n' > "$F16"
git -C "$R" add research/gptpro-reports/2026-01-01-daily-material.md
printf 'B\n' > "$F16"
echo "queue v2" >> "$R/research/update-queue.md"
printf '#!/bin/sh\nexit 1\n' > "$R/.git/hooks/pre-commit"; chmod +x "$R/.git/hooks/pre-commit"
before="$(git -C "$R" rev-parse HEAD)"
out="$(IM_TEST_AFTER_FILE="$F16" kill_job "$R" after)"; rrc="${out%%$'\t'*}"; note="${out#*$'\t'}"
[[ -e "$SCRATCH/killmark-after" ]] && ok "16b: the shim interrupted the first attempt right after its commit" || no "16b: the interruption never happened"
eq "16b: exactly one commit landed" "$(git -C "$R" rev-list --count "$before..HEAD")" 1
eq "16b: it holds the working-tree B" "$(git -C "$R" show HEAD:research/gptpro-reports/2026-01-01-daily-material.md)" "B"
eq "16b: the retry's own commit (of the writer's C) was refused: rc 11" "$rrc" 11
eq "16b: nothing is staged afterwards — the landed commit was not undone into a staged revert" \
   "$(git -C "$R" diff --cached --no-renames --name-only)" ""
eq "16b: the writer's C is still in the working tree, loose" "$(git -C "$R" status --porcelain -- research/gptpro-reports)" " M research/gptpro-reports/2026-01-01-daily-material.md"
case "$note" in "an interrupted earlier attempt had already committed"*) ok "16b: the note says the attempt had committed" ;;
  *) no "16b: note" "$note" ;; esac

echo "=== 17. tick.sh's engine-lock guard: an open fd is not a held lock ==="
# r2.1 (Astra review of record 2026-09-22, P1-1). The tick's commit takes dc-map/engine/.engine.lock
# non-blocking so a hand-run engine command's half-applied batch is never committed under the tick's
# label, and keeps the fd GLOBAL so an EXIT-trap retry reuses it (a second open would lock against the
# first). r2 skipped flock whenever that fd was set; a signal between the open and flock's success left
# it open and unlocked, and the retry committed. These run the EXACT function text from tick.sh, from
# the state the trap retry sees, with the helper stubbed.
TICK_FN="$(sed -n '/^own_output_commit() {/,/^}/p' "$TICK")"
[[ -n $TICK_FN ]] && ok "17: own_output_commit() extracted from $TICK" || no "17: own_output_commit() not found in $TICK"
tick_probe() { # $1 lock file  $2 mode: held-elsewhere | free | ours-locked → echoes the probe's stdout
  local lock="$1" mode="$2" hpid=""
  if [[ $mode == held-elsewhere ]]; then
    ( exec 9>>"$lock"; flock 9; sleep 12 ) & hpid=$!
    for _ in $(seq 1 50); do ( exec 8>>"$lock"; ! flock -n 8 ) && break; sleep 0.1; done
  fi
  (
    set -uo pipefail
    OWN_COMMITTED=0; ENGINE_LOCK="$lock"
    exec {ELOCK_FD}>>"$lock"                       # open, and — the state a signal leaves — not locked
    [[ $mode == ours-locked ]] && flock -n "$ELOCK_FD"   # ...or already holding it: an interrupted commit
    im_commit_own_output() { printf 'HELPER_REACHED\n'; IM_COMMIT_NOTE='stubbed helper'; return 0; }
    eval "$TICK_FN"
    own_output_commit aborted
  )
  [[ -z $hpid ]] || { kill "$hpid" 2>/dev/null; wait "$hpid" 2>/dev/null; }
  return 0
}
L17="$SCRATCH/engine-lock-17"; : > "$L17"
out="$(tick_probe "$L17" held-elsewhere)"
[[ $out != *HELPER_REACHED* ]] && ok "17: a hand run holds .engine.lock → the retry does NOT reach the commit" || no "17: the retry committed under a hand run's lock" "$out"
[[ $out == *"own-output commit (rc=10): skipped"* ]] && ok "17: ...and logs the rc=10 skip" || no "17: no skip line" "$out"
out="$(tick_probe "$L17" free)"
[[ $out == *HELPER_REACHED* ]] && ok "17: nobody holds it → the reused fd is locked and the commit runs" || no "17: free lock, no commit" "$out"
out="$(timeout 20 bash -c "$(declare -f tick_probe); $(declare -p TICK_FN); tick_probe '$L17' ours-locked")"; trc=$?
[[ $trc -ne 124 && $out == *HELPER_REACHED* ]] && ok "17: the fd already holds the lock → no self-deadlock, the commit runs" || no "17: own lock" "rc=$trc out=$out"

echo
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
