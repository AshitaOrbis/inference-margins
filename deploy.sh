#!/usr/bin/env bash
# Release procedure (v2.1.2 final-gate): clean tree → gates → stamp+manifest as a RELEASE COMMIT →
# deploy that exact commit's tree. Served bytes are reproducible from the release-stamp commit;
# the footer names the source commit (the stamp commit's parent).
set -euo pipefail
cd "$(dirname "$0")"
[ -z "$(git status --porcelain)" ] || { echo "FATAL: dirty worktree — commit first (release reproducibility gate)"; exit 1; }
node tests/snapshots.test.mjs > /dev/null
node tests/traffic-contract.test.mjs > /dev/null
bash tests/run-app-tests.sh > /dev/null
echo "engine + contract + application suites green"
node build-research-html.mjs > /dev/null && echo "research annex HTML rebuilt from sources"
SRC=$(git rev-parse --short HEAD)
sed -i "s#<span id=\"release-commit\">[^<]*</span>#<span id=\"release-commit\">${SRC}</span>#" site/index.html
mkdir -p site/tests
# Every served .mjs must resolve engine.js from site/tests/ (../engine.js), NOT ../site/engine.js
# (which resolves site/site/engine.js when served). loao.mjs + compute-presets.mjs were previously
# cp'd verbatim and shipped broken (public-release P1); route them through the same path rewrite.
for f in snapshots.test.mjs traffic-contract.test.mjs loao.mjs compute-presets.mjs; do
  sed 's#\.\./site/engine\.js#../engine.js#' "tests/$f" > "site/tests/$f"
done
cp tests/fixtures-baseline-v211.json tests/roofline-diagnostic.mjs site/tests/ 2>/dev/null || true
# run-app-tests.sh's BASE assumes the repo-root layout (cd ../ lands at repo root, then site/index.html);
# the SERVED copy lives in site/tests/, so cd ../ already lands in site/ — point BASE at ./index.html so
# the published test artifact actually runs (final-gate P0-4: served copy resolved site/site/index.html).
sed 's#/site/index\.html"#/index.html"#' tests/run-app-tests.sh > site/tests/run-app-tests.sh
# Served-asset hash manifest (excludes itself), committed in the release-stamp commit. Named .sha256
# (it is sha256sum text, not JSON — public-release P1: don't serve checksum text as application/json).
( cd site && find . -type f ! -name asset-manifest.sha256 -print0 | sort -z | xargs -0 sha256sum ) > site/asset-manifest.sha256
git add -A
git -c user.name="Ashita Orbis" -c user.email="hyperprocessed@gmail.com" commit -q -m "release stamp ${SRC} (footer commit + served-asset manifest)"
echo "release-stamp commit: $(git rev-parse --short HEAD) (source ${SRC})"
npx wrangler@3 pages deploy site --project-name inference-margins --branch main --commit-dirty=false
echo "deployed source ${SRC}; verify: curl /asset-manifest.sha256 and byte-check against the stamp commit"
