#!/bin/bash

make -C certora munged

for contract in certora/harnesses/Wizard*.sol;
do
    for spec in certora/specs/*.spec;
    do      
        contractFile=$(basename $contract)
        specFile=$(basename $spec)
        if [[ "${specFile%.*}" != "RulesInProgress" ]];
        then
            echo "Processing ${contractFile%.*} with $specFile"
            if [[ "${contractFile%.*}" = *"WizardControl"* ]];
            then
                certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
                --link ${contractFile%.*}:token=ERC20VotesHarness \
                --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
                --solc solc8.2 \
                --staging shelly/forSasha \
                --disableLocalTypeChecking \
                --optimistic_loop \
                --settings -copyLoopUnroll=4 \
                --send_only \
                --msg "checking $specFile on ${contractFile%.*}"
            else
                certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
                --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
                --solc solc8.2 \
                --staging shelly/forSasha \
                --disableLocalTypeChecking \
                --optimistic_loop \
                --settings -copyLoopUnroll=4 \
                --send_only \
                --msg "checking $specFile on ${contractFile%.*}"
            fi
        fi
    done
done
