certoraRun certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    ---staging shelly/stringCVL \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule unaffectedThreshhold \
    --msg "$1"