#!/usr/bin/env bash

set -euo pipefail

# Changesets cherry-picked from master are deleted on the release branch when released, but merging the release
# branch back keeps them on master: they exist neither where the release branch was cut nor at its tip.
CUT_POINT="$(git merge-base origin/master "$GITHUB_REF_NAME")"
RELEASED="$(comm -23 \
  <(git log --diff-filter=D --name-only --format= "$CUT_POINT..$GITHUB_REF_NAME" -- '.changeset/*.md' | sort -u) \
  <(git ls-tree --name-only "$CUT_POINT" .changeset/ | sort))"

git checkout -B "$CLEANUP_BRANCH" origin/master

for file in $RELEASED; do
  if [ -f "$file" ]; then
    git rm -q "$file"
  fi
done

if git diff --cached --quiet; then
  echo "pushed=false" >> $GITHUB_OUTPUT
  exit 0
fi

git commit -m "Remove changesets released in $GITHUB_REF_NAME"
git push -f origin "$CLEANUP_BRANCH"
echo "pushed=true" >> $GITHUB_OUTPUT
