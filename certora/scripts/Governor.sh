certoraRun certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    --staging \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule noExecuteOrCancelBeforeStarting \
    --msg "$1"
