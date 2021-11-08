certoraRun certora/harnesses/GovernorCountingSimpleHarness.sol \
    --verify GovernorCountingSimpleHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    --staging \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule doubleVoting \
    --msg "$1"
