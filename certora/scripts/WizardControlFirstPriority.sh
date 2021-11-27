certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardControlFirstPriority.sol \
    --link WizardControlFirstPriority:token=ERC20VotesHarness \
    --verify WizardFirstPriority:certora/specs/GovernorBase.spec \
    --solc solc8.2 \
    --disableLocalTypeChecking \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule executedImplyStartAndEndDateNonZero \
    --msg "$1"