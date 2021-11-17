certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardHarness1.sol \
    --link WizardHarness1:token=ERC20VotesHarness \
    --verify WizardHarness1:certora/specs/GovernorCountingSimple.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule hasVotedCorrelation \
    --msg "$1"