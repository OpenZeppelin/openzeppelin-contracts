#!/usr/bin/env bash

set -euo pipefail

# Set changeset status location
# This is needed because `changeset status --output` only works with relative routes
CHANGESETS_STATUS_JSON="$(node -p -e "require('path').relative(__dirname, '$RUNNER_TEMP/status.json')")"

# Save changeset status to temp file
npx changeset status --output="$CHANGESETS_STATUS_JSON"

# Get the list of releases from the status
RELEASES="$(node -p -e "require('$CHANGESETS_STATUS_JSON').releases")"

# Defensive assertion. SHOULD NOT BE REACHED
if [ "$(node -p -e "$RELEASES.length")" != 1 ]; then
  echo "::error file=$CHANGESETS_STATUS_JSON::The status doesn't contain only 1 release"
  exit 1;
fi;

# Get the next version
NEW_VERSION="$(node -p -e "($RELEASES)[0].newVersion")"

# Create branch
BRANCH_SUFFIX="$(echo $NEW_VERSION | awk -F'.' '{ print $1"."$2 }')"
RELEASE_BRANCH=release-v$BRANCH_SUFFIX
git checkout -b $RELEASE_BRANCH

# Enter in prerelease state
npx changeset pre enter rc
git add .
git commit -m "Start release candidate"

# Push branch
git push --all origin
