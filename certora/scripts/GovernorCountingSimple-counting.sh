certoraRun certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorCountingSimple.spec \
    --solc solc8.2 \
    --staging \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule OneIsNoMoreThanAll \
    --msg "$1"