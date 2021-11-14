certoraRun certora/harnesses/GovernorBasicHarness.sol \
    --verify GovernorBasicHarness:certora/specs/GovernorBase.spec \
    --solc solc8.2 \
    --staging uri/add_with_env_to_preserved_all \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --disableLocalTypeChecking \
    --rule proposalInitiated \
    --msg "$1"