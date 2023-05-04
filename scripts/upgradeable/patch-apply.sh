#!/usr/bin/env bash

set -euo pipefail

DIRNAME="$(dirname -- "${BASH_SOURCE[0]}")"
PATCH="$DIRNAME/upgradeable.patch"

error() {
  echo Error: "$*" >&2
  exit 1
}

if ! git diff-files --quiet ":!$PATCH" || ! git diff-index --quiet HEAD ":!$PATCH"; then
  error "Repository must have no staged or unstaged changes"
fi

if ! git apply -3 "$PATCH"; then
  error "Fix conflicts and run $DIRNAME/patch-save.sh"
fi
