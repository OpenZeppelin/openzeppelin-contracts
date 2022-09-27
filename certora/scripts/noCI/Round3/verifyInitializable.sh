certoraRun \
    certora/harnesses/InitializableComplexHarness.sol \
    --verify InitializableComplexHarness:certora/specs/Initializable.spec \
    --solc solc \
    --optimistic_loop \
    --loop_iter 3 \
    --msg "Initializable verificaiton all rules on complex harness" \
