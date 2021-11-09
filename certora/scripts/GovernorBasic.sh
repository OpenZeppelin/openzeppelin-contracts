certoraRun certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorBase.spec \
    --solc solc8.2 \
    --staging \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule doubleVoting \
    --msg "$1"