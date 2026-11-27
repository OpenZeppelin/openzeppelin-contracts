#!/usr/bin/env bash

set -euo pipefail

# The generator logs every file it writes as "Generating <path>". All of them must be tracked: `git diff` only covers
# tracked files, so a generated file that is untracked (never committed, gitignored, or deleted while still listed in
# scripts/generate/run.js) would otherwise go unnoticed.
npm run --silent generate | sed -n 's/^Generating \(.*\)$/\1/p' | xargs git ls-files --error-unmatch --

# Tracked generated files must match their templates.
git diff -R --exit-code
