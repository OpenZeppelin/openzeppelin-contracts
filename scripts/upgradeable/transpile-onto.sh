#!/usr/bin/env bash

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: bash $0 <target> [<base>]" >&2
  exit 1
fi

set -x

target="$1"
base="${2-}"

bash scripts/upgradeable/transpile.sh

commit="$(git rev-parse --short HEAD)"
start_branch="$(git rev-parse --abbrev-ref HEAD)"

git add contracts

# detach from the current branch to avoid making changes to it
git checkout --quiet --detach

# switch to the target branch, creating it if necessary
if git rev-parse -q --verify "$target"; then
  # if the branch exists, make it the current HEAD without checking out its contents
  git reset --soft "$target"
  git checkout "$target"
else
  # if the branch doesn't exist, create it as an orphan and check it out
  git checkout --orphan "$target"
  if [ -n "$base" ] && git rev-parse -q --verify "$base"; then
    # if base was specified and it exists, set it as the branch history
    git reset --soft "$base"
  fi
fi

# abort if there are no changes to commit at this point
if git diff --quiet --cached; then
  exit
fi

if [[ -v SUBMODULE_REMOTE ]]; then
  lib=lib/openzeppelin-contracts
  git submodule add -b "${base#origin/}" "$SUBMODULE_REMOTE" "$lib"
  git -C "$lib" checkout "$commit"
  git add "$lib"
fi

git commit -m "Transpile $commit" --no-verify

# return to original branch
git checkout "$start_branch"
