#!/usr/bin/env bash

REF=master
HEAD=$(git branch --show)
DIFF=$(git status --porcelain)

PARAMS=$@

migrate() {
    echo "· Checking out $REF"

    [[ -n $DIFF ]] && git stash push --all --quiet
    git checkout $REF --quiet
}

cleanup() {
    echo "· Resetting $HEAD to its previous state"

    git checkout $HEAD --quiet
    [[ -n $DIFF ]] && git stash pop --quiet
}

generate() {
    BRANCH=$(git branch --show)
    export GAS=true
    export GAS_REPORT=.$BRANCH.report.log

    echo "· Generating gas report for $BRANCH..."
    npm run test $PARAMS > /dev/null
}

display() {
    $(dirname $0)/compareGasReports.js .$HEAD.report.log .$REF.report.log
}

# generate the master report
migrate
generate || { cleanup; exit 1; }

# generate the head report
cleanup
generate || { exit 1; }

# Compare reports
display
