#!/usr/bin/env bash

set -euo pipefail

genReport() {
    export GAS=true
    export GAS_REPORT=.$(git branch --show).report.log
    npm run test $@
}

REF=master
BRANCH=$(git branch --show)
DIFF=$(git status --porcelain)

# set repo to ref branch
[[ -n $DIFF ]] && git stash push --quiet
git checkout $REF --quiet

# generate reference report
genReport $@

# set repo to original state
git checkout $BRANCH --quiet
[[ -n $DIFF ]] && git stash pop --quiet

# generate head report
genReport $@

# view diff
scripts/checks/compareGasReports.js .$BRANCH.report.log .$REF.report.log
