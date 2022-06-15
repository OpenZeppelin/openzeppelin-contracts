certoraRun \
    certora/harnesses/ERC20FlashMintHarness.sol certora/harnesses/IERC3156FlashBorrowerHarness.sol \
    certora/munged/token/ERC20/ERC20.sol certora/helpers/DummyERC20A.sol certora/helpers/DummyERC20B.sol \
    --verify ERC20FlashMintHarness:certora/specs/ERC20FlashMint.spec \
    --solc solc8.2 \
    --optimistic_loop \
    --cloud \
    --msg "ERC20FlashMint verification"
    