make -C certora munged

certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardControlFirstPriority.sol \
    --link WizardControlFirstPriority:token=ERC20VotesHarness \
    --verify WizardControlFirstPriority:certora/specs/GovernorBase.spec \
    --solc solc \
    --disableLocalTypeChecking \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule canVoteDuringVotingPeriod \
    --msg "$1"
