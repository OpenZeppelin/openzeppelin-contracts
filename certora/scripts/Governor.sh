certoraRun certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    --staging \
    --optimistic_loop \
    --disableLocalTypeChecking \
    --settings -copyLoopUnroll=4 \
    --rule voteStartBeforeVoteEnd \
    --msg "$1"
