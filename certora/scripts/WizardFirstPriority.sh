certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardFirstPriority.sol \
    --link WizardFirstPriority:token=ERC20VotesHarness \
    --verify WizardFirstPriority:certora/specs/GovernorCountingSimple.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule noVoteForSomeoneElse \
    --msg "$1"