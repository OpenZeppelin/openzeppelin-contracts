make -C certora munged

certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardFirstTry.sol \
    --verify WizardFirstTry:certora/specs/GovernorBase.spec \
    --solc solc \
    --staging shelly/forSasha \
    --optimistic_loop \
    --disableLocalTypeChecking \
    --settings -copyLoopUnroll=4 \
    --msg "$1"
