for contract in certora/harnesses/Wizard*.sol;
do
    for spec in certora/specs/*.spec;
    do      
        contractFile=$(basename $contract)
        specFile=$(basename $spec)
        echo "Processing ${contractFile%.*} with $specFile"
        if [ "${contractFile%.*}" = "WizardFirstPriority" ];
        then
            certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
            --link WizardFirstPriority:token=ERC20VotesHarness \
            --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
            --solc solc8.2 \
            --staging shelly/forSasha \
            --optimistic_loop \
            --settings -copyLoopUnroll=4 \
            --msg "checking $spec on ${contractFile%.*}"
        else
            certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/$contractFile \
            --verify ${contractFile%.*}:certora/specs/$specFile "$@" \
            --solc solc8.2 \
            --staging shelly/forSasha \
            --optimistic_loop \
            --settings -copyLoopUnroll=4 \
            --msg "checking $spec on ${contractFile%.*}"
        fi
    done
done
