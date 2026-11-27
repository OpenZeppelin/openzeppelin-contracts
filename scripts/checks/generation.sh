#!/usr/bin/env bash

set -euo pipefail

npm run generate
git diff -R --exit-code

# `git diff` only covers tracked files. A generated file that is untracked (never committed, or deleted while still
# listed in scripts/generate/run.js) is recreated by `npm run generate` and would otherwise go unnoticed.
untracked="$(git ls-files -z --others --exclude-standard -- contracts test | xargs -0 -r grep -l 'This file was procedurally generated from' || true)"
if [[ -n "$untracked" ]]; then
  echo "Generated files are not tracked by git:" >&2
  echo "$untracked" >&2
  exit 1
fi
