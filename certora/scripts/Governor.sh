certoraRun certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    --staging \
    --msg $1 \
    --disableLocalTypeChecking \
    --optimistic_loop \
    --settings -copyLoopUnroll=4
    --rule sanityCheckVoteStart
