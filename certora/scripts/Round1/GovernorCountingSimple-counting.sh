make -C certora munged

certoraRun  certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorCountingSimple.spec \
    --solc solc \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --msg "$1"
