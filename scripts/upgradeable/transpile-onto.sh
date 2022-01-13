#!/usr/bin/env bash

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: bash $0 <target> [base]" >&2
  exit 1
fi

set -x

target="$1"
base="${2-}"

bash scripts/upgradeable/transpile.sh

commit="$(git rev-parse --short HEAD)"
branch="$(git rev-parse --abbrev-ref HEAD)"

git add contracts

git checkout --quiet --detach

if git rev-parse -q --verify "$target"; then
  git reset --soft "$target"
  git checkout "$target"
else
  git checkout --orphan "$target"
  if [ -n "$base" ] && git rev-parse -q --verify "$base"; then
    git reset --soft "$base"
  fi
fi

if ! git diff --quiet --cached; then
  git commit -m "Transpile $commit"
fi

git checkout "$branch"
