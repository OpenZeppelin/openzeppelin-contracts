certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardHarness1.sol \
    --verify WizardHarness1:certora/specs/GovernorCountingSimple.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule SumOfVotesCastEqualSumOfPowerOfVoted \
    --msg "$1"