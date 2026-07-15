# Contributing

## What this repository is

A **release-snapshot mirror**. The working copy is private; each versioned release is
published here as one squashed commit by an allow-listed publish script. Public history
therefore mirrors [the changelog](research/changelog.md), not the day-to-day process, and
commit messages reference private working-copy hashes (`private source …`) that public
readers cannot resolve — the engine version + changelog entry are the citable identity of
a release. Some working documents referenced by the research prose (working notes,
paywalled-source summaries, internal queues) are deliberately not published; where public
text names one, treat it as "private working-copy document, unavailable in this snapshot."

## Issues — very welcome

The most useful categories:

1. **Model/data correction** — a preset price, architecture figure, or hardware anchor is
   wrong or stale. Cite a primary source; every adopted parameter's provenance is in the
   [grounding ledger](research/grounding-ledger.md).
2. **Source/attribution correction** — a quoted claim is misattributed, mislabeled, or the
   evidence label overstates its provenance.
3. **Reproducibility/build bug** — a documented command fails from a fresh clone (CI should
   catch these; if it didn't, that's a bug too).
4. **Security** — see [SECURITY.md](SECURITY.md); use private reporting.

## Pull requests

PRs against a snapshot mirror can't merge into the private working copy directly, but they
are still useful as concrete proposals — maintainers will port accepted changes into the
next release (with credit in the changelog). Keep them small and evidence-first.

## What's generated (don't edit these)

- `site/research/*.html` — generated from `research/*.md` by `build-research-html.mjs`
- `research/grounding-ledger.md` — generated from the engine registry by `build-grounding-ledger.mjs`
- `site/tests/*` — path-rewritten copies of `tests/*` produced at release time

Edit the sources (`research/*.md`, `site/engine.js`, `tests/*`) instead.

## Running the suites

```bash
npm test          # engine suite + traffic-mix state contract (no dependencies)
npm run test:browser  # needs chromium/google-chrome on PATH
npm run build     # regenerate ledger + annex from sources
```
