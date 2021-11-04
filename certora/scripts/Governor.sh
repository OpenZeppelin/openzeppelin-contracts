certoraRun certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorBase.spec \
    --solc solc8.0 \
    --staging \
    --msg $1 \
    --disableLocalTypeChecking \
    --rule voteStartBeforeVoteEnd
