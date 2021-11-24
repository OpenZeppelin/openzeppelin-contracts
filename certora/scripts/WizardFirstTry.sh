certoraRun certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardFirstTry.sol \
    --verify WizardFirstTry:certora/specs/GovernorBase.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule allFunctionsRevertIfCanceled \
    --msg "$1"