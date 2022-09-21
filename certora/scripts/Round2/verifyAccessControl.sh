certoraRun \
    certora/harnesses/AccessControlHarness.sol \
    --verify AccessControlHarness:certora/specs/AccessControl.spec \
    --solc solc \
    --optimistic_loop \
    --cloud \
    --msg "AccessControl verification"
