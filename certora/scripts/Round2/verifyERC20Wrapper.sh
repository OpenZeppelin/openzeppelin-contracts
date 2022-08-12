certoraRun \
    certora/harnesses/ERC20WrapperHarness.sol \
    certora/helpers/DummyERC20A.sol certora/helpers/DummyERC20B.sol \
    --verify ERC20WrapperHarness:certora/specs/ERC20Wrapper.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --cloud \
    --msg "ERC20Wrapper verification" \
    --send_only
    