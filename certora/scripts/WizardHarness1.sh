certoraRun certora/harnesses/WizardHarness1.sol \
    --verify WizardHarness1:certora/specs/GovernorBase.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule allFunctionsRevertIfCanceled \
    --msg "$1"