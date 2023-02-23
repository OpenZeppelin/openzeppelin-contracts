#!/usr/bin/env bash

set -euo pipefail

# Set changeset status location
# This is needed because `changeset status --output` only works with relative routes
CHANGESETS_STATUS_JSON="$(realpath --relative-to=. "$RUNNER_TEMP/status.json")"

# Save changeset status to temp file
npx changeset status --output="$CHANGESETS_STATUS_JSON"

# Defensive assertion. SHOULD NOT BE REACHED
if [ "$(jq '.releases | length' "$CHANGESETS_STATUS_JSON")" != 1 ]; then
  echo "::error file=$CHANGESETS_STATUS_JSON::The status doesn't contain only 1 release"
  exit 1;
fi;

# Create branch
BRANCH_SUFFIX="$(jq -r '.releases[0].newVersion | gsub("\\.\\d+$"; "")' $CHANGESETS_STATUS_JSON)"
RELEASE_BRANCH="release-v$BRANCH_SUFFIX"
git checkout -b "$RELEASE_BRANCH"

# Output branch
echo "branch=$RELEASE_BRANCH" >> $GITHUB_OUTPUT

# Enter in prerelease state
npx changeset pre enter rc
git add .
git commit -m "Start release candidate"

# Push branch
if ! git push origin "$RELEASE_BRANCH"; then
  echo "::error file=scripts/release/start.sh::Can't push $RELEASE_BRANCH. Did you forget to run this workflow from $RELEASE_BRANCH?"
  exit 1
fi
