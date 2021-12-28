make -C certora munged

certoraRun  certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorCountingSimple.spec \
    --solc solc8.2 \
    --staging shelly/forSasha \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule hasVotedCorrelation \
    --msg "$1"
