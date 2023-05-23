#!/usr/bin/env bash

set -euo pipefail

# Define merge branch name
MERGE_BRANCH=merge/$GITHUB_REF_NAME

# Create the branch and force to start from ref
git checkout -B "$MERGE_BRANCH" "$GITHUB_REF_NAME"

# Get deleted changesets in this branch that might conflict with master
# --diff-filter=D - Only deleted files
readarray -t DELETED_CHANGESETS < <(git diff origin/master --diff-filter=D --name-only -- '.changeset/*.md')

# Merge master, which will take those files cherry-picked. Auto-resolve conflicts favoring master.
# Ignore conflicts that can't be resolved.
git merge origin/master -m "Merge master to $GITHUB_REF_NAME" -X theirs || true

# Remove the originally deleted changesets to correctly sync with master
rm -f "${DELETED_CHANGESETS[@]}"

# Only git add deleted files
git ls-files --deleted .changeset/ | xargs git add

# Allow empty here since there may be no changes if `rm -f` failed for all changesets
git commit --allow-empty -m "Sync changesets with master"
git push -f origin "$MERGE_BRANCH"
