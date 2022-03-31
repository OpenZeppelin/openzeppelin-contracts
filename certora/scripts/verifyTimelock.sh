certoraRun \
    certora/harnesses/TimelockControllerHarness.sol certora/harnesses/AccessControlHarness.sol \
    --verify TimelockControllerHarness:certora/specs/TimelockController.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --loop_iter 3 \
    --staging alex/new-dt-hashing-alpha \
    --rule_sanity \
    --rule "$1" \
    --msg "$1"
      