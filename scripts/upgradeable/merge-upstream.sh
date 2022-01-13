#!/usr/bin/env bash

set -euo pipefail

: "${REF:="$(git rev-parse --symbolic-full-name HEAD)"}"

if [[ "$REF" != refs/heads/* ]]; then
  echo "$REF is not a branch" >&2
  exit 1
elif [[ "$REF" == refs/heads/patches ]]; then
  REF=refs/heads/master
fi

set -x

input="${REF#refs/heads/}"
upstream="${input#patched/}"
branch="patched/$upstream"

git checkout "$branch" 2>/dev/null || git checkout -b "$branch" origin/patches --no-track

git fetch 'https://github.com/OpenZeppelin/openzeppelin-contracts.git' master
merge_base="$(git merge-base origin/patches FETCH_HEAD)"

git fetch 'https://github.com/OpenZeppelin/openzeppelin-contracts.git' "$upstream"
# Check that patches is not ahead of the upstream branch we're merging.
if ! git merge-base --is-ancestor "$merge_base" FETCH_HEAD; then
  echo "The patches branch is ahead of $upstream" >&2
  exit 1
fi
git merge origin/patches FETCH_HEAD -m "Merge upstream $upstream into $branch"
