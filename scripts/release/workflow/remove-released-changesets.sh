#!/usr/bin/env bash

set -euo pipefail

# Changesets cherry-picked from master are deleted on the release branch when released, but merging the release
# branch back keeps them on master: they exist neither where the release branch was cut nor at its tip.
CUT_POINT="$(git merge-base origin/master "$GITHUB_REF_NAME")"
# Only count deletions made by release commits, i.e. commits that also update the CHANGELOG. Changesets deleted by
# other commits (e.g. reverting a cherry-pick) were not released and must stay on master. Renames are disabled so that
# prereleases, which move `.changeset/x.md` to `.changeset/pre/x.md`, report the original path as deleted.
RELEASED="$(comm -23 \
  <(for commit in $(git rev-list --first-parent "$CUT_POINT..$GITHUB_REF_NAME" -- CHANGELOG.md); do
      git diff-tree --no-renames --name-only -r --diff-filter=D "$commit^" "$commit" -- '.changeset/*.md'
    done | sort -u) \
  <(git ls-tree --name-only "$CUT_POINT" .changeset/ | sort))"

git checkout -B "$CLEANUP_BRANCH" origin/master

for file in $RELEASED; do
  if [ -f "$file" ]; then
    git rm -q "$file"
  fi
done

if git diff --cached --quiet; then
  echo "pushed=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

git commit -m "Remove changesets released in $GITHUB_REF_NAME"
git push -f origin "$CLEANUP_BRANCH"
echo "pushed=true" >> "$GITHUB_OUTPUT"
