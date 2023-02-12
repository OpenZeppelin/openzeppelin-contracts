#!/usr/bin/env bash

set -euo pipefail

DIRNAME="$(dirname -- "${BASH_SOURCE[0]}")"
PATCH="$DIRNAME/upgradeable.patch"

error() {
  echo Error: "$*" >&2
  exit 1
}

if ! git diff-files --quiet contracts; then
  error "Unstaged changes in contracts"
fi

git diff-index --cached --patch --output="$PATCH" HEAD contracts
git restore --staged --worktree contracts
