#!/usr/bin/env bash

set -o errexit

# Define merge branch name
MERGE_BRANCH=merge/$GITHUB_REF_NAME

# Only delete the branch if it already exists
if [ `git branch --list $MERGE_BRANCH` ]; then git push origin -d $MERGE_BRANCH; fi;

# Create the branch
git checkout -b $MERGE_BRANCH

# Get deleted changesets in this branch that might conflict with master
DELETED_CHANGESETS=$(git diff origin/master --name-only | grep '.changeset/' | grep '.md')

# Merge master, which will take those files cherry-picked
git merge origin/master -m "Merge master to $GITHUB_REF_NAME"

# Remove the originally deleted changesets to correctly sync with master
echo $DELETED_CHANGESETS | while read -r changeset; do rm -f $changeset; done

git add .
# Allow empty here since it can be no changes if `rm -f$` failed for all changesets
git commit --allow-empty -m "Sync changesets with master"
git push --all
