#!/usr/bin/env bash

set -euxo pipefail

for contract in certora/harnesses/Wizard*.sol;
do
    for spec in certora/specs/Governor*.spec;
    do
        contractFile=$(basename $contract)
        specFile=$(basename $spec)
        if [[ "${specFile%.*}" != "RulesInProgress" ]];
        then
            echo "Processing ${contractFile%.*} with $specFile"
            if [[ "${contractFile%.*}" = *"WizardControl"* ]];
            then
                certoraRun \
                    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
                    --link ${contractFile%.*}:token=ERC20VotesHarness \
                    --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
                    --solc solc \
                    --optimistic_loop \
                    --disableLocalTypeChecking \
                    --settings -copyLoopUnroll=4 \
                    --msg "checking $specFile on ${contractFile%.*}"
            else
                certoraRun \
                    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
                    --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
                    --solc solc \
                    --optimistic_loop \
                    --disableLocalTypeChecking \
                    --settings -copyLoopUnroll=4 \
                    --msg "checking $specFile on ${contractFile%.*}"
            fi
        fi
    done
done
